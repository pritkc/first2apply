import {
  DOMParser,
  Element,
} from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import { Job, JOB_PROVIDERS, JobProviders } from "./types.ts";

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
    case "remoteok":
      return parseRemoteOkJobs(html);
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
