import {
  DOMParser,
  Element,
} from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import { Job, JobType } from "./types.ts";
import { JobSite } from "./types.ts";

/**
 * Helper used to parse a salary string.
 */
function parseSalary({ salary }: { salary?: string }): string | undefined {
  if (!salary) return;

  // remove all non numeric characters, but keep currency symbols and dashes
  const cleanedSalary = salary.trim().replace(/[^0-9$€£-\skK]/g, "");
  return cleanedSalary.trim();
}

/**
 * Helper used to parse a location string.
 */
function parseLocation({
  location,
}: {
  location?: string;
}): string | undefined {
  if (!location) return;

  // remove all non numeric characters, but keep dashes and commas
  const cleanedLocation = location.trim().replace(/[^a-zA-Z0-9\s,]/g, "");
  return cleanedLocation;
}

type ParsedJob = Omit<
  Job,
  "id" | "user_id" | "visible" | "status" | "created_at" | "updated_at"
>;

/**
 * Get the site for a given url.
 */
export function getJobSite({
  allJobSites,
  url,
}: {
  allJobSites: JobSite[];
  url: string;
}): JobSite | undefined {
  const site = allJobSites.find((site) => {
    return site.urls.some((siteUrl) => url.startsWith(siteUrl));
  });
  return site;
}

/**
 * Clean a job url, might have to remove some query params for some sites.
 */
export function cleanJobUrl({
  allJobSites,
  url,
}: {
  allJobSites: JobSite[];
  url: string;
}) {
  const site = getJobSite({ allJobSites, url });
  if (!site) {
    const parsedUrl = new URL(url);
    throw new Error(
      `We do not yet support scanning for jobs on ${parsedUrl.hostname}. Contact our support to request it.`
    );
  }
  let cleanUrl = url;

  if (site.queryParamsToRemove) {
    const parsedUrl = new URL(url);
    site.queryParamsToRemove.forEach((param) => {
      parsedUrl.searchParams.delete(param);
    });
    cleanUrl = parsedUrl.toString();
  }

  return { cleanUrl, site };
}

/**
 * Parse a job page from a given url.
 */
export function parseJobPage({
  allJobSites,
  url,
  html,
}: {
  allJobSites: JobSite[];
  url: string;
  html: string;
}): ParsedJob[] {
  const site = getJobSite({ allJobSites, url });
  if (!site) {
    const parsedUrl = new URL(url);
    throw new Error(
      `We currently don't support scanning for jobs on ${parsedUrl.hostname}. Contact our support to request it.`
    );
  }

  let foundJobs: ParsedJob[] = [];
  switch (site.name) {
    case "LinkedIn":
      foundJobs = parseLinkedInJobs({ siteId: site.id, html });
      break;
    case "Glassdoor":
      foundJobs = parseGlassDoorJobs({ siteId: site.id, html });
      break;
    case "Indeed":
      foundJobs = parseIndeedJobs({ siteId: site.id, html });
      break;
    case "Remote OK":
      foundJobs = parseRemoteOkJobs({ siteId: site.id, html });
      break;
    case "We Work Remotely":
      foundJobs = parseWeWorkRemotelyJobs({ siteId: site.id, html });
      break;
  }

  if (foundJobs.length === 0) {
    console.error(
      `[${site.name}] no jobs found on ${url}, this might indicate a problem with the parser`
    );
  }

  return foundJobs;
}

/**
 * Method used to parse a linkedin job page.
 */
export function parseLinkedInJobs({
  siteId,
  html,
}: {
  siteId: number;
  html: string;
}): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector(".jobs-search__results-list");
  if (!jobsList) return [];

  const jobElements = Array.from(jobsList.querySelectorAll("li")) as Element[];
  console.log(`[linkedin] found ${jobElements.length} elements`);

  const jobs = jobElements.map((el): ParsedJob | null => {
    const externalUrl = el
      .querySelector(".base-card__full-link")
      ?.getAttribute("href");
    if (!externalUrl) return null;

    const externalId = externalUrl.split("?")[0].split("/").pop();
    if (!externalId) return null;

    const title = el
      .querySelector(".base-search-card__title")
      ?.textContent?.trim();
    if (!title) return null;

    const companyName = el
      .querySelector(".base-search-card__subtitle")
      ?.querySelector("a")
      ?.textContent?.trim();
    if (!companyName) return null;

    const companyLogo =
      el
        .querySelector(".search-entity-media")
        ?.querySelector("img")
        ?.getAttribute("data-delayed-url") || undefined;
    const rawLocation = el
      .querySelector(".job-search-card__location")
      ?.textContent?.trim();

    const location = rawLocation
      ?.replace(/\(remote\)/i, "")
      .replace(/\(on\-site\)/i, "")
      .replace(/\(hybrid\)/i, "");

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      location,
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return validJobs;
}

/**
 * Method used to parse a remoteok job page.
 */
export function parseRemoteOkJobs({
  siteId,
  html,
}: {
  siteId: number;
  html: string;
}): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector("#jobsboard");
  if (!jobsList) {
    return [];
  }

  const jobElements = Array.from(
    jobsList.querySelectorAll("tr.job")
  ) as Element[];
  console.log(`[remoteok] found ${jobElements.length} elements`);

  const jobs = jobElements.map((el): ParsedJob | null => {
    const externalId = el.getAttribute("data-slug")?.trim();
    if (!externalId) return null;
    const externalUrl = `https://remoteok.io/remote-jobs/${externalId}`.trim();

    const companyEl = el.querySelector("td.company");
    if (!companyEl) return null;
    const title = companyEl
      .querySelector("a[itemprop='url'] > h2[itemprop='title']")
      ?.textContent.trim();
    if (!title) return null;

    const companyName = companyEl
      .querySelector(
        "span[itemprop='hiringOrganization'] > h3[itemprop='name']"
      )
      ?.textContent.trim();
    if (!companyName) return null;

    const companyLogo =
      el
        .querySelector("td.image.has-logo")
        ?.querySelector("a > img")
        ?.getAttribute("data-src") || undefined;

    const localtionEls = Array.from(
      companyEl.querySelectorAll("div.location")
    ) as Element[];
    const locationTexts = localtionEls
      .map((el) =>
        el.textContent
          ?.trim()
          ?.replace(/remote/i, "")
          ?.replace(/probably/i, "")
          ?.replace(/\sor\s/i, "")
          ?.trim()
      )
      .filter((t) => !!t);
    const locations = locationTexts
      .filter((t) => !t.includes("$"))
      .map((l) =>
        parseLocation({
          location: l,
        })
      );
    const location = locations.join("/");

    const salaryText = locationTexts.find((t) => t.includes("$"));
    const salary = parseSalary({ salary: salaryText?.trim() });

    const tagsElements = Array.from(
      el.querySelector("td.tags")?.querySelectorAll("a") ?? []
    ) as Element[];
    const tags = tagsElements.map(
      (el) => el.querySelector("a > div > h3")?.textContent?.trim() || ""
    );

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      jobType: "remote",
      location,
      salary,
      tags,
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return validJobs;
}

/**
 * Method used to parse a weworkremotely job page.
 */
export function parseWeWorkRemotelyJobs({
  siteId,
  html,
}: {
  siteId: number;
  html: string;
}): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector("#job_list");
  if (!jobsList) {
    return [];
  }

  const jobElements = Array.from(
    jobsList.querySelectorAll("ul > li")
  ) as Element[];
  console.log(`[wwr] found ${jobElements.length} elements`);

  const jobs = jobElements.map((el): ParsedJob | null => {
    const linkToJob = el.querySelector(":scope > a");
    if (!linkToJob) return null;

    const externalId = linkToJob
      .getAttribute("href")
      ?.trim()
      .split("/")
      .filter(Boolean)
      .pop();
    if (!externalId) return null;

    const externalUrl = `https://weworkremotely.com${linkToJob
      .getAttribute("href")
      ?.trim()}`;

    const title = linkToJob.querySelector("span.title")?.textContent?.trim();
    if (!title) return null;

    const companyName = linkToJob
      .querySelector("span.company")
      ?.textContent?.trim();
    if (!companyName) return null;

    // background-image:url(https://we-work-remotely.imgix.net/logos/0082/0572/logo.gif?ixlib=rails-4.0.0&w=50&h=50&dpr=2&fit=fill&auto=compress)
    const companyLogo =
      el
        .querySelector("div.tooltip > a > div")
        ?.getAttribute("style")
        ?.replace(/background-image:url\(/i, "")
        ?.replace(/\)/i, "")
        .trim() || undefined;

    const location = linkToJob
      .querySelector("span.region")
      ?.textContent?.trim()
      .split("/")
      .map((s) =>
        s
          .trim()
          .replace(/only/i, "")
          .replace(/anywhere in the world/i, "worldwide")
          .trim()
      )
      .join("/");

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      jobType: "remote",
      location,
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  const uniqueJobsIds = [...new Set(validJobs.map((job) => job.externalId))];
  return uniqueJobsIds.map(
    (id) => validJobs.find((job) => job.externalId === id)!
  );
}

/**
 * Method used to parse a glassdoor job page.
 */
export function parseGlassDoorJobs({
  siteId,
  html,
}: {
  siteId: number;
  html: string;
}): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector(".JobsList_jobsList__Ey2Vo");
  if (!jobsList) {
    return [];
  }

  const jobElements = Array.from(
    jobsList.querySelectorAll(":scope > li")
  ) as Element[];
  console.log(`[glassdoor] found ${jobElements.length} elements`);

  const jobs = jobElements.map((el): ParsedJob | null => {
    const externalId = el.getAttribute("data-jobid")?.trim();
    if (!externalId) return null;

    const externalUrl = el
      .querySelector(`#job-title-${externalId}`)
      ?.getAttribute("href")
      ?.trim();
    if (!externalUrl) return null;

    const title =
      el.querySelector(`#job-title-${externalId}`)?.textContent?.trim() || "";
    if (!title) return null;

    const companyName = el
      .querySelector(".jobCard .EmployerProfile_employerName__Xemli")
      ?.textContent?.trim();
    if (!companyName) return null;

    const companyLogo = el
      .querySelector(".jobCard .EmployerLogo_logoContainer__Ye3F5 > img")
      ?.getAttribute("src")
      ?.trim();

    const location = el
      .querySelector(`#job-location-${externalId}`)
      ?.textContent?.trim();

    const salary = parseSalary({
      salary: el
        .querySelector(`#job-salary-${externalId}`)
        ?.textContent?.replace(/employer est/i, "")
        ?.trim(),
    });

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      location,
      salary,
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return validJobs;
}

/**
 * Method used to parse a indeed job page.
 */
export function parseIndeedJobs({
  siteId,
  html,
}: {
  siteId: number;
  html: string;
}): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector("#mosaic-jobResults ul");
  if (!jobsList) {
    return [];
  }

  const jobElements = Array.from(
    jobsList.querySelectorAll(":scope > li")
  ) as Element[];
  console.log(`[indeed] found ${jobElements.length} elements`);

  const jobs = jobElements.map((el): ParsedJob | null => {
    const jobLinkEl = el.querySelector(".jobTitle > a");
    const externalId = jobLinkEl?.getAttribute("id")?.trim();
    if (!externalId) return null;

    const externalHref = jobLinkEl?.getAttribute("href")?.trim();
    if (!externalHref) return null;
    const externalUrl = `https://www.indeed.com${externalHref}`;

    const title = jobLinkEl?.querySelector("span")?.textContent?.trim() || "";
    if (!title) return null;

    const companyEl = el.querySelector(".company_location");
    const companyName = companyEl
      ?.querySelector(":scope > div > span")
      ?.textContent?.trim();
    if (!companyName) return null;

    let location = companyEl
      ?.querySelector(":scope > div > div")
      ?.textContent?.trim();

    let jobType: JobType = "onsite";
    if (location?.toLowerCase().includes("remote")) jobType = "remote";
    if (location?.toLowerCase().includes("hybrid")) jobType = "hybrid";

    location = location
      ?.replace(/remote/i, "")
      .replace(/hybrid/i, "")
      .replace(/\sin\s/i, "")
      .trim();

    console.log(
      el.querySelector(".salary-snippet-container")?.textContent?.trim()
    );
    let salary = el
      .querySelector(".salary-snippet-container")
      ?.textContent?.trim()
      ?.replace(/a year/, "")
      ?.trim();
    if (salary?.includes("hour")) {
      salary = parseSalary({ salary: salary }) + "/hr";
    } else {
      salary = salary
        ?.replace(/a year/, "")
        ?.trim()
        ?.split("-")
        .map(
          (s) =>
            `$${Math.round(
              parseInt(
                s
                  .trim()
                  .slice(1)
                  .replace(/\.[0-9]+/i, "")
                  .replace(/,/i, "")
              ) / 1000
            )}k`
        )
        .join(" - ");
    }

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      jobType,
      location,
      salary,
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return validJobs;
}
