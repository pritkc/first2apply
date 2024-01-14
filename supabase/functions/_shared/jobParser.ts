import {
  DOMParser,
  Element,
} from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import { Job, JOB_PROVIDERS, JobProviders, JobType } from "./types.ts";

/**
 * Helper used to parse a salary string.
 */
function parseSalary({ salary }: { salary?: string }): string | undefined {
  if (!salary) return;

  // remove all non numeric characters, but keep currency symbols and dashes
  const cleanedSalary = salary.trim().replace(/[^0-9$€£-\s]/g, "");
  return cleanedSalary.toLowerCase();
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
  "id" | "user_id" | "visible" | "archived" | "created_at" | "updated_at"
>;

/**
 * Get the provider for a given url.
 */
export function getJobProvider(url: string): JobProviders | undefined {
  for (const [provider, { url: providerUrl }] of Object.entries(
    JOB_PROVIDERS
  )) {
    if (url.startsWith(providerUrl)) return provider as JobProviders;
  }
}

/**
 * Parse a job page from a given url.
 */
export function parseJobPage({
  url,
  html,
}: {
  url: string;
  html: string;
}): ParsedJob[] {
  const provider = getJobProvider(url);
  if (!provider) return [];

  switch (provider) {
    case "linkedin":
      return parseLinkedInJobs(html);
    case "glassdoor":
      return parseGlassDoorJobs(html);
    case "indeed":
      return parseIndeedJobs(html);
    case "remoteok":
      return parseRemoteOkJobs(html);
    case "weworkremotely":
      return parseWeWorkRemotelyJobs(html);
  }
}

/**
 * Method used to parse a linkedin job page.
 */
export function parseLinkedInJobs(html: string): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector(".jobs-search__results-list");
  if (!jobsList) return [];

  const jobElements = Array.from(jobsList.querySelectorAll("li")) as Element[];
  const jobs = jobElements.map((el): ParsedJob => {
    const title =
      el.querySelector(".base-search-card__title")?.textContent?.trim() || "";

    const externalUrl =
      el.querySelector(".base-card__full-link")?.getAttribute("href") || "";
    const externalId = externalUrl.split("?")[0].split("/").pop() || "";

    const companyName =
      el
        .querySelector(".base-search-card__subtitle")
        ?.querySelector("a")
        ?.textContent?.trim() || "";
    const companyLogo =
      el
        .querySelector(".search-entity-media")
        ?.querySelector("img")
        ?.getAttribute("data-delayed-url") || "";
    const location =
      el.querySelector(".job-search-card__location")?.textContent?.trim() || "";

    return {
      provider: "linkedin",
      externalId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      location,
    };
  });

  return jobs;
}

/**
 * Method used to parse a remoteok job page.
 */
export function parseRemoteOkJobs(html: string): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector("#jobsboard");
  if (!jobsList) {
    throw new Error("Could not find jobs list");
  }

  const jobElements = Array.from(
    jobsList.querySelectorAll("tr.job")
  ) as Element[];
  console.log(`[remoteok] found ${jobElements.length} elements`);
  const jobs = jobElements.map((el): ParsedJob => {
    const externalId = el.getAttribute("data-slug")?.trim() || "";
    const externalUrl = `https://remoteok.io/remote-jobs/${externalId}`.trim();

    const companyEl = el.querySelector("td.company");
    if (!companyEl) throw new Error("Could not find company element");
    const title =
      companyEl
        .querySelector("a[itemprop='url'] > h2[itemprop='title']")
        ?.textContent.trim() || "";

    const companyName =
      companyEl
        .querySelector(
          "span[itemprop='hiringOrganization'] > h3[itemprop='name']"
        )
        ?.textContent.trim() || "";
    const companyLogo =
      el
        .querySelector("td.image.has-logo")
        ?.querySelector("a > img")
        ?.getAttribute("data-src") || undefined;

    let [locationEl, salaryEl] = companyEl.querySelectorAll("div.location");
    if (!salaryEl) [salaryEl, locationEl] = [locationEl, salaryEl]; // location can be missing
    let location = parseLocation({
      location: locationEl?.textContent?.trim(),
    })
      ?.replace(/remote/i, "")
      ?.replace(/probably/i, "")
      .trim();
    if (location === "job") location = undefined;

    const salary = parseSalary({ salary: salaryEl?.textContent?.trim() });

    const tagsElements = Array.from(
      el.querySelector("td.tags")?.querySelectorAll("a") ?? []
    ) as Element[];
    const tags = tagsElements.map(
      (el) => el.querySelector("a > div > h3")?.textContent?.trim() || ""
    );

    return {
      provider: "remoteok",
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

  return jobs;
}

/**
 * Method used to parse a weworkremotely job page.
 */
export function parseWeWorkRemotelyJobs(html: string): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector("#job_list");
  if (!jobsList) {
    throw new Error("Could not find jobs list");
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
      ?.trim()}`.trim();

    const title =
      linkToJob.querySelector("span.title")?.textContent?.trim() || "";
    if (!title) return null;

    const companyName =
      linkToJob.querySelector("span.company")?.textContent?.trim() || "";
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
      provider: "weworkremotely",
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
export function parseGlassDoorJobs(html: string): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector(".JobsList_jobsList__Ey2Vo");
  if (!jobsList) {
    throw new Error("Could not find jobs list");
  }

  const jobElements = Array.from(
    jobsList.querySelectorAll(":scope > li")
  ) as Element[];
  console.log(`[gd] found ${jobElements.length} elements`);

  const location = document
    .querySelector("#searchBar-location")
    ?.getAttribute("value")
    ?.trim();
  const jobs = jobElements.map((el): ParsedJob | null => {
    const externalId = el.getAttribute("data-jobid")?.trim();
    if (!externalId) return null;

    const externalUrl = el
      .querySelector(".JobCard_seoLink__WdqHZ")
      ?.getAttribute("href")
      ?.trim();
    if (!externalUrl) return null;

    const title =
      el.querySelector(".JobCard_seoLink__WdqHZ")?.textContent?.trim() || "";
    if (!title) return null;

    const companyName =
      el
        .querySelector(".jobCard .EmployerProfile_employerName__Xemli")
        ?.textContent?.trim() || "";

    const companyLogo = el
      .querySelector(".jobCard .EmployerLogo_logoContainer__Ye3F5 > img")
      ?.getAttribute("src")
      ?.trim();

    return {
      provider: "glassdoor",
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
 * Method used to parse a indeed job page.
 */
export function parseIndeedJobs(html: string): ParsedJob[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector("#mosaic-jobResults ul");
  if (!jobsList) {
    throw new Error("Could not find jobs list");
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
    const companyName =
      companyEl?.querySelector(":scope > div > span")?.textContent?.trim() ||
      "";

    const location = companyEl
      ?.querySelector(":scope > div > div")
      ?.textContent?.trim();

    let jobType: JobType = "onsite";
    if (location?.toLowerCase().includes("remote")) jobType = "remote";
    if (location?.toLowerCase().includes("hybrid")) jobType = "hybrid";

    return {
      provider: "glassdoor",
      externalId,
      externalUrl,
      title,
      companyName,
      jobType,
      location,
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return validJobs;
}
