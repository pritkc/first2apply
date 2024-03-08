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
  const getUrlDomain = (url: string) => {
    const hostname = new URL(url).hostname;
    const [_, domain] = hostname.split(".").reverse();
    return domain;
  };

  const urlDomain = getUrlDomain(url);
  const site = allJobSites.find((site) => {
    return site.urls.some((siteUrl) => {
      const knownSiteDomain = getUrlDomain(siteUrl);
      return knownSiteDomain === urlDomain;
    });
  });

  // check if the path is blacklisted
  const parsedUrl = new URL(url);
  site?.blacklisted_paths.forEach((path) => {
    const pathname = parsedUrl.pathname.toLowerCase();
    const blacklistedPath = path.toLowerCase();
    console.log(pathname, path);
    if (pathname === blacklistedPath || pathname + "/" === blacklistedPath) {
      throw new Error(
        `Looks like the URL you are trying to save does not contain any search params. Make sure to configure your desired filters like role/tech stach, location, etc. on ${parsedUrl.hostname} and try again. Optionally add the last 24h filter when possible.`
      );
    }
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
    case "Dice":
      foundJobs = parseDiceJobs({ siteId: site.id, html });
      break;
    case "Flexjobs":
      foundJobs = parseFlexjobsJobs({ siteId: site.id, html });
      break;
    case "Bestjobs":
      foundJobs = parseBestjobsJobs({ siteId: site.id, html });
      break;
    case "Echojobs":
      foundJobs = parseEchojobsJobs({ siteId: site.id, html });
      break;
    case "Remotive":
      foundJobs = parseRemotiveJobs({ siteId: site.id, html });
      break;
    case "Remoteio":
      foundJobs = parseRemoteioJobs({ siteId: site.id, html });
      break;
    case "Builtin":
      foundJobs = parseBuiltinJobs({ siteId: site.id, html });
      break;
    case "Naukri":
      foundJobs = parseNaukriJobs({ siteId: site.id, html });
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

  const jobsList = document.querySelector(".JobsList_jobsList__lqjTr");
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
      .querySelector(".jobCard .EmployerProfile_employerName__qujuA")
      ?.textContent?.trim();
    console.log(companyName);
    if (!companyName) return null;

    const companyLogo = el
      .querySelector(".jobCard .EmployerLogo_logoContainer__7hw16 > img")
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

/**
 * Method used to parse a dice job page.
 */
export function parseDiceJobs({
  siteId,
  html,
}: {
  siteId: number;
  html: string;
}): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector("dhi-search-cards-widget");
  if (!jobsList) {
    return [];
  }

  const jobElements = Array.from(
    jobsList.querySelectorAll("dhi-search-card")
  ) as Element[];
  if (!jobElements) return [];
  else console.log(`[dice] found ${jobElements.length} elements`);

  const jobs = jobElements.map((el): ParsedJob | null => {
    const externalId = el
      .querySelector(".card-title-link")
      ?.getAttribute("id")
      ?.trim();
    if (!externalId) return null;

    const externalUrl = `https://www.dice.com/job-detail/${externalId}`.trim();

    const title = el.querySelector(".card-title-link")?.textContent?.trim();
    if (!title) return null;

    const companyName = el
      .querySelector(".card-company > a")
      ?.textContent?.trim();
    if (!companyName) return null;

    const companyLogo =
      el
        .querySelector(".company-page-logo-container")
        ?.querySelector("img")
        ?.getAttribute("src") || undefined;

    const location = el
      .querySelector(".search-result-location")
      ?.textContent.trim();

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
 * Method used to parse a flexjobs job page.
 */
export function parseFlexjobsJobs({
  siteId,
  html,
}: {
  siteId: number;
  html: string;
}): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector(".sc-14nyru2-1.bcguRu");
  if (!jobsList) return [];

  const jobElements = Array.from(
    jobsList.querySelectorAll("div.sc-jv5lm6-0.kSiIaQ")
  ) as Element[];
  console.log(`[flexjobs] found ${jobElements.length} elements`);

  const jobs = jobElements.map((el): ParsedJob | null => {
    const externalId = el?.getAttribute("id")?.trim();
    if (!externalId) return null;

    const externalUrlEl = el.querySelector("a.sc-jv5lm6-11.jTLbwZ");
    if (!externalUrlEl) return null;
    const externalUrl = `https://www.flexjobs.com${externalUrlEl
      .getAttribute("href")
      ?.trim()}`;

    const title = externalUrlEl.textContent?.trim();
    if (!title) return null;

    // flexjobs does not show the company name on the search results page
    const companyName = "N/A";

    const location = el
      .querySelector("li.allowed-location-flag")
      ?.textContent.trim();

    let jobType: JobType = "remote";
    const jobTypeEl = el.querySelector(`li#remoteoption-0-${externalId}`);
    if (jobTypeEl) {
      const jobTypeText = jobTypeEl.textContent?.trim().toLowerCase();
      if (jobTypeText.includes("hybrid") || jobTypeText.includes("option"))
        jobType = "hybrid";
      else if (jobTypeText.includes("no remote")) jobType = "onsite";
    }

    const description = el.querySelector(
      `p#description-${externalId}`
    )?.textContent;

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      location,
      jobType,
      description,
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return validJobs;
}

/**
 * Method used to parse a bestjobs job page.
 */

export function parseBestjobsJobs({
  siteId,
  html,
}: {
  siteId: number;
  html: string;
}): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector(".card-list");
  if (!jobsList) return [];

  const jobElements = Array.from(
    jobsList.querySelectorAll(".job-card")
  ) as Element[];
  console.log(`[bestjobs] found ${jobElements.length} elements`);

  const jobs = jobElements.map((el): ParsedJob | null => {
    const externalUrl = el
      .querySelector(".card-body > div:first-child > a")
      ?.getAttribute("href")
      ?.trim();
    if (!externalUrl) return null;

    const externalId = el.getAttribute("id")?.replace("card-", "")?.trim();
    if (!externalId) return null;

    const title = el.getAttribute("data-title")?.trim();
    if (!title) return null;

    const companyName = el.getAttribute("data-employer-name")?.trim();
    if (!companyName) return null;

    const companyLogo =
      el.querySelector(".company-logo")?.getAttribute("src") || undefined;

    const jobFooter = el.querySelector(".card-footer > div:first-child");

    let location = jobFooter
      ?.querySelector("div:first-child > div:nth-child(2) > span")
      ?.getAttribute("data-original-title")
      ?.trim();
    if (location?.includes(",")) {
      const locationParts = location.split(",");
      location = locationParts.slice(0, 3).join(",");
      if (locationParts.length > 3) {
        location += ` + ${locationParts.length - 3} more`;
      }
    }

    let salary = jobFooter
      ?.querySelector("div:nth-child(2) > div:nth-child(2)")
      ?.textContent?.trim();

    if (salary) {
      salary = salary.replace(/\s+/g, "") + "/mo";
    }

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
 * Method used to parse a echojobs job page.
 */

export function parseEchojobsJobs({
  siteId,
  html,
}: {
  siteId: number;
  html: string;
}): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector("tbody");
  if (!jobsList) return [];

  const jobElements = Array.from(jobsList.querySelectorAll("tr")) as Element[];
  console.log(`[echojobs] found ${jobElements.length} elements`);

  const jobs = jobElements.map((el): ParsedJob | null => {
    const jobInfo = el.querySelector("td > div");
    if (!jobInfo) return null;

    const titleAndUrlElement = jobInfo.querySelector(
      "div:nth-child(2) > h2 > a"
    );

    const externalUrl =
      "https://echojobs.io" + titleAndUrlElement?.getAttribute("href")?.trim();
    if (!externalUrl) return null;

    const externalId = externalUrl.split("?")[0].split("/").pop();
    if (!externalId) return null;

    const title = titleAndUrlElement?.textContent?.trim();
    if (!title) return null;

    const companyName = jobInfo
      .querySelector("div:nth-child(2) > div:first-child > a")
      ?.textContent?.trim();
    if (!companyName) return null;

    const companyLogo =
      jobInfo
        .querySelector("div:first-child > div > a > img")
        ?.getAttribute("src") || undefined;

    const locations = Array.from(
      jobInfo.querySelectorAll(
        "div:nth-child(2) > div:nth-child(3) > div:first-child > span"
      )
    ) as Element[];

    const location = locations.map((loc) => loc.textContent?.trim()).join(", ");

    const salary = jobInfo
      .querySelector("div:nth-child(2) > div:nth-child(3) > span")
      ?.textContent?.trim()
      ?.replace(/USD\s*/, "")
      ?.replace(/\s+/g, " ")
      ?.replace(/\u00A0/g, " ")
      ?.trim();

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
 * Method used to parse a remotive job page.
 */
export function parseRemotiveJobs({
  siteId,
  html,
}: {
  siteId: number;
  html: string;
}): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  let jobsList = document.querySelector("#initial_job_list > ul");
  if (!jobsList) {
    jobsList = document.querySelector("#hits > ul");
    if (!jobsList) return [];
  }

  let jobElements = Array.from(jobsList.querySelectorAll("li")) as Element[];
  if (jobElements.length === 0) {
    jobElements = Array.from(
      jobsList.querySelectorAll("div[x-data]")
    ) as Element[];
  }
  console.log(`[remotive] found ${jobElements.length} elements`);

  const jobs = jobElements.map((el): ParsedJob | null => {
    const jobTitle = el?.querySelector(".job-tile-title a");
    if (!jobTitle) return null;

    const externalUrl =
      "https://remotive.com/" + jobTitle.getAttribute("href")?.trim();
    console.log(externalUrl);
    if (!externalUrl) return null;

    const externalId = externalUrl.split("?")[0].split("/").pop();
    console.log(externalId);
    if (!externalId) return null;

    const title = jobTitle.querySelector("span")?.textContent?.trim();
    console.log(title);
    if (!title) return null;

    const companyName = jobTitle
      .querySelector("span:nth-child(3)")
      ?.textContent?.trim();
    console.log(companyName);
    if (!companyName) return null;

    const companyLogo =
      el
        .querySelector(".company-page-logo-container")
        ?.querySelector("img")
        ?.getAttribute("src") || undefined;

    const locations = Array.from(
      el.querySelectorAll(".job-tile-location")
    ) as Element[];

    const location = [
      ...new Set(
        locations.map((loc) =>
          loc.textContent.trim().replace(/[^a-zA-Z\s,]/g, "")
        )
      ),
    ]
      .filter(Boolean)
      .join(", ");
    console.log(location);

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
  return validJobs;
}

/**
 * Method used to parse a remoteio job page.
 */
export function parseRemoteioJobs({
  siteId,
  html,
}: {
  siteId: number;
  html: string;
}): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector("main");
  if (!jobsList) return [];

  const jobElements = Array.from(
    jobsList.querySelectorAll(".shadow-singlePost")
  ) as Element[];
  console.log(`[remoteio] found ${jobElements.length} elements`);

  const jobs = jobElements.map((el): ParsedJob | null => {
    const jobInfo = el.querySelector("div:nth-child(2) > a");
    if (!jobInfo) return null;

    const externalUrl = `https://www.remote.io${jobInfo.getAttribute(
      "href"
    )}`?.trim();
    if (!externalUrl) return null;

    const externalId = externalUrl.split("?")[0].split("/").pop();
    if (!externalId) return null;

    const title = jobInfo.textContent?.trim();
    if (!title) return null;

    const company = el.querySelector("div:first-child img");
    if (company === null) return null;

    const companyName = company.getAttribute("alt")?.trim();
    if (!companyName) return null;

    const companyLogo = company.getAttribute("src")?.trim();

    const location = el
      .querySelector("div:nth-child(2) > div")
      ?.textContent?.trim();

    let tags: string[] | undefined;
    const tagsList = Array.from(
      el.querySelectorAll("div:nth-child(4) > span")
    ) as Element[];
    if (tagsList.length > 0) {
      tags = tagsList
        .map((tag) => tag.querySelector("a")?.textContent.trim())
        .filter((t): t is string => !!t);
    }

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      jobType: "remote",
      location,
      tags,
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return validJobs;
}

/**
 * Method used to parse a builtin job page.
 */
export function parseBuiltinJobs({
  siteId,
  html,
}: {
  siteId: number;
  html: string;
}): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector("#jobs-list");
  if (!jobsList) return [];

  const jobElements = Array.from(
    jobsList.querySelectorAll('[data-id="job-card"]')
  ) as Element[];
  console.log(`[builtin] found ${jobElements.length} elements`);

  const jobs = jobElements.map((el): ParsedJob | null => {
    const jobInfo = el.querySelector("#job-card-alias");
    if (!jobInfo) return null;

    const externalUrl = `https://builtin.com${jobInfo.getAttribute(
      "href"
    )}`?.trim();
    if (!externalUrl) return null;

    const externalId = el.getAttribute("id")?.trim();
    if (!externalId) return null;

    const title = jobInfo.textContent?.trim();
    if (!title) return null;

    const companyName = el
      .querySelector('[data-id="company-title"]')
      ?.textContent?.trim();
    if (!companyName) return null;

    const companyLogo = el
      .querySelector('img[data-id="company-img"]')
      ?.getAttribute("src")
      ?.trim();

    const jobLocation = el.querySelector(
      "div:first-child > div:nth-child(2) > div:first-child > div:first-child > div:nth-child(2)"
    );

    // const jobTypeList = Array.from(
    //   el.querySelectorAll("div:nth-child(3) > div")
    // ) as Element[];

    // const jobType = jobTypeList
    //   .map((div) => div.textContent.trim().toLowerCase())
    //   .filter((type) => type === "remote" || type === "hybrid")
    //   .join(", ");

    const location = jobLocation
      ?.querySelector("div:nth-child(2)")
      ?.textContent?.trim();

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      // jobType,
      location,
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return validJobs;
}

/**
 * Method used to parse a naukri job page.
 */
export function parseNaukriJobs({
  siteId,
  html,
}: {
  siteId: number;
  html: string;
}): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector("#listContainer");
  if (!jobsList) return [];

  const jobElements = Array.from(
    jobsList.querySelectorAll(".srp-jobtuple-wrapper")
  ) as Element[];
  console.log(`[naukri] found ${jobElements.length} elements`);

  const jobs = jobElements.map((el): ParsedJob | null => {
    const jobInfo = el.querySelector(".title");
    if (!jobInfo) return null;

    const externalUrl = jobInfo.getAttribute("href")?.trim();
    if (!externalUrl) return null;

    const externalId = el.getAttribute("data-job-id")?.trim();
    if (!externalId) return null;

    const title = jobInfo.getAttribute("title")?.trim();
    if (!title) return null;

    const companyName = el.querySelector(".comp-name")?.textContent?.trim();
    if (!companyName) return null;

    let location = el.querySelector(".loc")?.textContent?.trim() || "";

    const additionalLocations = location.split(", ").length - 3;
    location =
      location.split(", ").slice(0, 3).join(", ") +
      (additionalLocations > 0 ? ` + ${additionalLocations} more` : "");

    const tagsList = Array.from(el.querySelectorAll(".tag-li")) as Element[];

    const tags = tagsList.map((tag) => tag.textContent.trim());

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      location,
      tags,
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return validJobs;
}
