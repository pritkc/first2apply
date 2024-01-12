import {
  DOMParser,
  Element,
} from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import { Job, JOB_PROVIDERS, JobProviders } from "./types.ts";

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
}): Job[] {
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
export function parseLinkedInJobs(html: string): Job[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector(".jobs-search__results-list");
  if (!jobsList) return [];

  const jobElements = Array.from(jobsList.querySelectorAll("li")) as Element[];
  const jobs = jobElements.map((el): Job => {
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
export function parseRemoteOkJobs(html: string): Job[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector("#jobsboard");
  if (!jobsList) return [];

  const jobElements = Array.from(
    jobsList.querySelectorAll(".job")
  ) as Element[];
  const jobs = jobElements.map((el): Job => {
    const title = el.querySelector(".preventLink")?.textContent?.trim() || "";

    const externalUrl =
      el.querySelector(".preventLink")?.getAttribute("href") || "";
    const externalId = externalUrl.split("?")[0].split("/").pop() || "";

    const companyName =
      el.querySelector(".companyLink")?.textContent?.trim() || "";
    const companyLogo =
      el
        .querySelector(".companyLink")
        ?.querySelector("img")
        ?.getAttribute("src") || "";
    const location = el.querySelector(".location")?.textContent?.trim() || "";

    return {
      provider: "remoteok",
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
