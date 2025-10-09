import {
  DOMParser,
  Element,
} from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import turndown from "npm:turndown@7.1.2";
import { encodeHex } from "jsr:@std/encoding/hex";

import { Job, JobType, Link, SiteProvider } from "./types.ts";
import { JobSite } from "./types.ts";

const turndownService = new turndown({
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});

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
    const hostname = new URL(url).hostname.replace("emplois.", "");
    const parts = hostname.split(".").reverse();
    while (parts.length > 3) parts.shift();
    const [_, domain] = parts;
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

  // for linkedin, automatically sort by most recent
  if (site.provider === SiteProvider.linkedin) {
    const parsedUrl = new URL(cleanUrl);
    parsedUrl.searchParams.set("sortBy", "DD");
    cleanUrl = parsedUrl.toString();
  }

  return { cleanUrl, site };
}

/**
 * Parse a job page from a given url.
 */
export async function parseJobsListUrl({
  allJobSites,
  link,
  html,
}: {
  allJobSites: JobSite[];
  link: Link;
  html: string;
}) {
  const { url } = link;
  const site = getJobSite({ allJobSites, url });
  if (!site) {
    const parsedUrl = new URL(url);
    throw new Error(
      `We currently don't support scanning for jobs on ${parsedUrl.hostname}. Contact our support to request it.`
    );
  }

  const { jobs, listFound, elementsCount } = await parseSiteJobsList({
    site,
    html,
  });

  const parseFailed = !listFound || (elementsCount > 0 && jobs.length === 0);

  return { jobs, site, parseFailed };
}

type ParsedJob = Omit<
  Job,
  "id" | "user_id" | "visible" | "status" | "created_at" | "updated_at"
>;
type JobSiteParseResult = {
  jobs: ParsedJob[];
  listFound: boolean;
  elementsCount: number;
};

/**
 * Parse jobs list from a site provided url.
 */
async function parseSiteJobsList({
  site,
  html,
}: {
  site: JobSite;
  html: string;
}): Promise<JobSiteParseResult> {
  switch (site.provider) {
    case SiteProvider.linkedin:
      return parseLinkedInJobs({ siteId: site.id, html });
    case SiteProvider.glassdoor:
      return parseGlassDoorJobs({ siteId: site.id, html });
    case SiteProvider.indeed:
      return parseIndeedJobs({ siteId: site.id, html });
    case SiteProvider.remoteok:
      return parseRemoteOkJobs({ siteId: site.id, html });
    case SiteProvider.weworkremotely:
      return parseWeWorkRemotelyJobs({ siteId: site.id, html });
    case SiteProvider.dice:
      return parseDiceJobs({ siteId: site.id, html });
    case SiteProvider.flexjobs:
      return parseFlexjobsJobs({ siteId: site.id, html });
    case SiteProvider.bestjobs:
      return parseBestjobsJobs({ siteId: site.id, html });
    case SiteProvider.echojobs:
      return parseEchojobsJobs({ siteId: site.id, html });
    case SiteProvider.remotive:
      return parseRemotiveJobs({ siteId: site.id, html });
    case SiteProvider.remoteio:
      return parseRemoteioJobs({ siteId: site.id, html });
    case SiteProvider.builtin:
      return parseBuiltinJobs({ siteId: site.id, html });
    case SiteProvider.naukri:
      return parseNaukriJobs({ siteId: site.id, html });
    case SiteProvider.robertHalf:
      return parseRobertHalfJobs({ siteId: site.id, html });
    case SiteProvider.zipRecruiter:
      return await parseZipRecruiterJobs({ siteId: site.id, html });
    case SiteProvider.usaJobs:
      return parseUSAJobsJobs({ siteId: site.id, html });
    case SiteProvider.talent:
      return parseTalentJobs({ siteId: site.id, html });
  }
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
}): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  // check if the list is empty first
  const noResultsNode =
    document.querySelector(".no-results") ||
    document.querySelector(".jobs-search-no-results-banner");
  if (noResultsNode) {
    return {
      jobs: [],
      listFound: true,
      elementsCount: 0,
    };
  }

  let isLoggedIn = false;
  let jobsList = document.querySelector(".jobs-search__results-list");
  if (!jobsList) {
    // check if the user is logged into LinkedIn because then it has a totally different layout
    jobsList =
      document.querySelector("ul li[data-occludable-job-id]")?.closest("ul") ??
      document.querySelector(".scaffold-layout__list ul") ??
      null;
    isLoggedIn = true;
  }

  if (!jobsList) {
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };
  }

  const jobElements = Array.from(jobsList.querySelectorAll("li")) as Element[];
  let jobs: Array<ParsedJob | null> = [];
  if (!isLoggedIn) {
    jobs = jobElements.map((el): ParsedJob | null => {
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
        labels: [],
      };
    });
  } else {
    jobs = jobElements.map((el): ParsedJob | null => {
      const jobCard = el.querySelector("div[data-job-id]"); // this is the new layout

      const externalId =
        el.getAttribute("data-occludable-job-id")?.trim() ??
        jobCard?.getAttribute("data-job-id")?.trim();
      if (!externalId) return null;

      const externalUrlEl =
        el.querySelector(".job-card-list__title--link") ??
        jobCard?.querySelector("a");
      if (!externalUrlEl) return null;
      const externalUrlPath = externalUrlEl.getAttribute("href")?.trim();
      const prefix = "https://www.linkedin.com";
      let externalUrl = externalUrlPath?.startsWith(prefix)
        ? externalUrlPath
        : `https://www.linkedin.com${externalUrlPath}`;
      if (externalUrl.includes("jobs/search-results/?currentJobId")) {
        // this is a special case where the url contains the job id in the query params
        const urlParams = new URLSearchParams(externalUrl.split("?")[1]);
        externalUrl = `${prefix}/jobs/view/${urlParams.get("currentJobId")}`;
      }
      const title = (
        externalUrlEl.querySelector(":scope > span > strong") ??
        externalUrlEl.querySelector(
          ".job-card-job-posting-card-wrapper__title > span > strong"
        )
      )?.textContent?.trim();
      if (!title) return null;

      const companyName = (
        el.querySelector(".artdeco-entity-lockup__subtitle > span") ??
        el.querySelector(".artdeco-entity-lockup__subtitle")
      )?.textContent?.trim();
      if (!companyName) return null;

      const companyLogo =
        el
          .querySelector(".ivm-view-attr__img-wrapper")
          ?.querySelector("img")
          ?.getAttribute("src") || undefined;
      const rawLocation = el
        .querySelector(".artdeco-entity-lockup__caption")
        ?.textContent?.trim();

      const location = rawLocation
        ?.replace(/\(remote\)/i, "")
        .replace(/\(on\-site\)/i, "")
        .replace(/\(hybrid\)/i, "");

      const jobType = rawLocation?.toLowerCase().includes("remote")
        ? "remote"
        : rawLocation?.toLowerCase().includes("hybrid")
        ? "hybrid"
        : "onsite";

      const benefitTags: string[] =
        el
          .querySelector(".artdeco-entity-lockup__metadata")
          ?.textContent.trim()
          .split("·")
          .map((p) => p.trim()) ?? [];

      // bottom tags
      let footerTagEls = el.querySelectorAll(
        ".job-card-list__footer-wrapper.job-card-container__footer-wrapper > li"
      );
      if (!footerTagEls.length) {
        footerTagEls = el.querySelectorAll(
          ".job-card-job-posting-card-wrapper__footer-items > li"
        );
      }
      const footerTags = Array.from(footerTagEls)
        .map((el) => {
          // Remove children with class 'visually-hidden'
          const element = el as Element;
          element
            .querySelectorAll(".visually-hidden")
            .forEach((hiddenEl) =>
              hiddenEl.parentElement?.removeChild(hiddenEl)
            );

          return el.textContent?.trim().toLowerCase();
        })
        .filter((p) => !p.includes("viewed"));
      const tags = [...benefitTags, ...footerTags];

      return {
        siteId,
        externalId,
        externalUrl,
        title,
        companyName,
        companyLogo,
        location,
        labels: [],
        jobType,
        tags,
      };
    });
  }

  const validJobs = jobs
    .filter((job): job is ParsedJob => !!job)
    .map((job) => {
      // sanitize tags
      job.tags = job.tags
        ?.map((tag) => tag.trim().replaceAll(/\n/g, ""))
        .filter((tag) => !!tag);

      // try to parse the salary from the tags
      if (!job.salary && job.tags) {
        job.salary = job.tags.find(
          (tag) =>
            tag.toLowerCase().includes("/yr") ||
            tag.toLowerCase().includes("/year") ||
            tag.toLowerCase().includes("/yearly") ||
            tag.toLowerCase().includes("/hr") ||
            tag.toLowerCase().includes("/hour") ||
            tag.toLowerCase().includes("/hourly")
        );

        // remove the salary from the tags
        if (job.salary) {
          job.tags = job.tags.filter((tag) => tag !== job.salary);
        }
      }

      return job;
    });

  return {
    jobs: validJobs,
    listFound: jobsList !== null,
    elementsCount: jobElements.length,
  };
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
}): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector("#jobsboard");
  if (!jobsList) {
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };
  }

  const jobElements = Array.from(
    jobsList.querySelectorAll("tr.job")
  ) as Element[];

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
      labels: [],
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
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
}): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  // check if the list is empty first
  const noResultsNode =
    document.querySelector(".no_results") ||
    document.querySelector(".advanced_no_results");
  if (noResultsNode) {
    return {
      jobs: [],
      listFound: true,
      elementsCount: 0,
    };
  }

  const jobsLists = document.querySelectorAll("section.jobs");
  if (!jobsLists.length) {
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };
  }

  const jobElements: Element[] = [];
  jobsLists.forEach((l) => {
    const jobs = Array.from(
      (l as Element).querySelectorAll("ul > li")
    ) as Element[];
    jobElements.push(...jobs);
  });
  // const jobElements = Array.from(
  //   jobsList
  // ).map(l => l.querySelectorAll("ul > li")) as Element[];

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

    const title = linkToJob
      .querySelector(".new-listing__header__title")
      ?.textContent?.trim();
    if (!title) return null;

    const companyName = linkToJob
      .querySelector(".new-listing__company-name")
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
      .querySelector(".new-listing__company-headquarters")
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

    const tags = Array.from(
      el.querySelectorAll(".new-listing__categories__category")
    ).map((t) => t.textContent?.trim() || "");

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      jobType: "remote",
      location,
      labels: [],
      tags,
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  const uniqueJobsIds = [...new Set(validJobs.map((job) => job.externalId))];
  const uniqueJobs = uniqueJobsIds.map(
    (id) => validJobs.find((job) => job.externalId === id)!
  );

  return {
    jobs: uniqueJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
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
}): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  // check if the list is empty first
  const noResultsNode = document.querySelector(
    ".ErrorPage_errorPageTitle__XtznY"
  );
  if (noResultsNode) {
    return {
      jobs: [],
      listFound: true,
      elementsCount: 0,
    };
  }

  const jobsList = document.querySelector(".JobsList_jobsList__lqjTr");
  // make sure we are not hitting the similar jobs section
  if (
    jobsList &&
    jobsList.parentElement?.parentElement?.getAttribute("data-test") ===
      "related-jobs-list"
  ) {
    return {
      jobs: [],
      listFound: true,
      elementsCount: 0,
    };
  }

  if (!jobsList) {
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };
  }

  const jobElements = Array.from(
    jobsList.querySelectorAll(":scope > li")
  ) as Element[];

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
      .querySelector(".jobCard .EmployerProfile_profileContainer__63w3R")
      ?.textContent?.trim();
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
      labels: [],
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
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
}): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  // check if the list is empty first
  const noResultsNode =
    document.querySelector(".jobsearch-NoResult-messageContainer") ||
    document.querySelector(".css-1z0pyms.e1wnkr790"); // this is from the individual company page
  if (noResultsNode) {
    return {
      jobs: [],
      listFound: true,
      elementsCount: 0,
    };
  }

  const jobsList =
    document.querySelector("#mosaic-jobResults ul") ||
    document.querySelector("#mosaic-provider-jobcards ul");
  if (!jobsList) {
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };
  }

  const jobElements = Array.from(
    jobsList.querySelectorAll(":scope > li")
  ) as Element[];

  const jobs = jobElements.map((el): ParsedJob | null => {
    const jobLinkEl = el.querySelector(".jobTitle > a");
    const externalId = jobLinkEl?.getAttribute("id")?.trim();
    if (!externalId) return null;

    const externalHref = jobLinkEl?.getAttribute("href")?.trim();
    if (!externalHref) return null;

    let externalUrl = `https://www.indeed.com${externalHref}`;
    if (externalHref === "#") {
      const jk = jobLinkEl?.getAttribute("data-jk")?.trim();
      externalUrl = `https://www.indeed.com/viewjob?jk=${jk}`;
    }

    const title = jobLinkEl?.querySelector("span")?.textContent?.trim() || "";
    if (!title) return null;

    const companyEl = el.querySelector(".company_location");
    const companyName =
      companyEl
        ?.querySelector(":scope > div span[data-testid=company-name]")
        ?.textContent?.trim() ||
      document
        .querySelector("h1[data-testid=PageHeader-title-jobs]")
        ?.textContent?.trim();
    if (!companyName) return null;

    let location = companyEl
      ?.querySelector(":scope > div > div[data-testid=text-location]")
      ?.textContent?.trim();

    let jobType: JobType = "onsite";
    if (location?.toLowerCase().includes("remote")) jobType = "remote";
    if (location?.toLowerCase().includes("hybrid")) jobType = "hybrid";

    location = location
      ?.replace(/remote/i, "")
      .replace(/hybrid/i, "")
      .replace(/\sin\s/i, "")
      .trim();

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
      labels: [],
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
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
}): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  // check if the list is empty first
  const noResultsNode =
    document.querySelector(".no-jobs-message") ??
    document.querySelector("div[data-testid='job-search-no-results']");
  if (noResultsNode) {
    return {
      jobs: [],
      listFound: true,
      elementsCount: 0,
    };
  }

  const jobsList = document.querySelector("div[data-id")?.parentElement;
  if (!jobsList) {
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };
  }

  const jobElements = Array.from(
    jobsList.querySelectorAll("div[data-id]")
  ) as Element[];

  const jobs = jobElements.map((el): ParsedJob | null => {
    const externalId = el?.getAttribute("data-id")?.trim();
    if (!externalId) return null;

    const externalUrl = `https://www.dice.com/job-detail/${externalId}`.trim();

    const title = el.querySelector(".content > div")?.textContent?.trim();
    if (!title) return null;

    const companyName = el
      .querySelector(".header > span > a:nth-child(2)")
      ?.textContent?.trim();
    if (!companyName) return null;

    const companyLogo =
      el
        .querySelector(".header > span > a")
        ?.querySelector("img")
        ?.getAttribute("src") || undefined;

    const location = el
      .querySelector(".content > span > div > div")
      ?.textContent.trim();

    const tags: string[] = [];
    const postedAt = el
      .querySelector(
        ".content > span > div > div:nth-child(2) > div:nth-child(2)"
      )
      ?.textContent.trim();
    if (postedAt) {
      tags.push(postedAt);
    }

    const otherTags = Array.from(el.querySelectorAll(".content > div.box"))
      .map((el) => el.textContent?.trim() || "")
      .filter((t) => !!t);
    tags.push(...otherTags);

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      location,
      labels: [],
      tags,
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
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
}): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector("#job-table-wrapper");
  if (!jobsList)
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };

  const jobElements = Array.from(
    jobsList.querySelectorAll("div.sc-14nyru2-3.ijOZYM > div")
  ) as Element[];

  const jobs = jobElements.map((el): ParsedJob | null => {
    const externalId = el?.getAttribute("id")?.trim();
    if (!externalId) return null;

    const externalUrlEl = el.querySelector(`a#job-name-${externalId}`);
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

    const description = el
      .querySelector(`p#description-${externalId}`)
      ?.textContent?.trim();

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      location,
      jobType,
      description,
      labels: [],
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
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
}): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector(".card-list");
  if (!jobsList)
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };

  const jobElements = Array.from(
    jobsList.querySelectorAll(".job-card")
  ) as Element[];

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
      labels: [],
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
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
}): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector("tbody");
  if (!jobsList)
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };

  const jobElements = Array.from(jobsList.querySelectorAll("tr")) as Element[];

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
      labels: [],
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
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
}): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector("#hits > ul");
  if (!jobsList) {
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };
  }

  let jobElements = Array.from(jobsList.querySelectorAll("li")) as Element[];
  if (jobElements.length === 0) {
    jobElements = Array.from(
      jobsList.querySelectorAll("div[x-data]")
    ) as Element[];
  }

  const jobs = jobElements.map((el): ParsedJob | null => {
    const jobTitle = el?.querySelector(".job-tile-title a");
    if (!jobTitle) return null;

    const externalUrl = jobTitle.getAttribute("href")?.trim();
    if (!externalUrl) return null;

    const externalId = externalUrl.split("?")[0].split("/").pop();
    if (!externalId) return null;

    const title = jobTitle.querySelector("span")?.textContent?.trim();
    if (!title) return null;

    const companyName = jobTitle
      .querySelector("span:nth-child(3)")
      ?.textContent?.trim();
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

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      jobType: "remote",
      location,
      labels: [],
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
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
}): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  // check if the list is empty first
  const noResultsNode = document.querySelector(".shadow-singlePost");
  if (
    noResultsNode &&
    noResultsNode.textContent
      .trim()
      .toLowerCase()
      .startsWith("no results found")
  ) {
    return {
      jobs: [],
      listFound: true,
      elementsCount: 0,
    };
  }

  const jobsList = document.querySelector("main");
  if (!jobsList)
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };

  const jobElements = Array.from(
    jobsList.querySelectorAll(".shadow-singlePost")
  ) as Element[];

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
      labels: [],
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
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
}): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector("#jobs-list");
  if (!jobsList)
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };

  const jobElements = Array.from(
    jobsList.querySelectorAll('[data-id="job-card"]')
  ) as Element[];

  const jobs = jobElements.map((el): ParsedJob | null => {
    const jobInfo = el.querySelector("h2 > a");
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
      labels: [],
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
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
}): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const noResultsNode = document.querySelector(
    ".styles_no-result-container__miYYz"
  );
  if (noResultsNode) {
    return {
      jobs: [],
      listFound: true,
      elementsCount: 0,
    };
  }

  const jobsList = document.querySelector("#listContainer");
  if (!jobsList)
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };

  const jobElements = Array.from(
    jobsList.querySelectorAll(".srp-jobtuple-wrapper")
  ) as Element[];

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
      labels: [],
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
}

/**
 * Method used to parse a robert half job page.
 */
export function parseRobertHalfJobs({
  siteId,
  html,
}: {
  siteId: number;
  html: string;
}): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector(
    ".rh-mt-20x .row .col-md-5.col-lg-5 > div"
  );
  if (!jobsList)
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };
  const jobElements = Array.from(
    jobsList.querySelectorAll("rhcl-job-card")
  ) as Element[];

  const jobs = jobElements.map((el): ParsedJob | null => {
    const externalId = el.getAttribute("job-id")?.trim();
    if (!externalId) return null;

    const externalUrl = el.getAttribute("destination")?.trim();
    if (!externalUrl) return null;

    const title = el.getAttribute("headline")?.trim();
    if (!title) return null;

    const companyName = "N/A";

    const location = el.getAttribute("location")?.trim();
    const salaryMin = el.getAttribute("salary-min")?.trim();
    const salaryMax = el.getAttribute("salary-max")?.trim();
    const salaryCurrency = el.getAttribute("salary-currency")?.trim();
    const salaryPeriod = el.getAttribute("salary-period")?.trim();
    let salary = undefined;
    if (salaryMin && salaryMax && salaryMax !== "0" && salaryMin !== "0") {
      const formatValue = (value: string) => {
        const denominator = salaryPeriod?.toLowerCase().includes("hour")
          ? 1
          : 1000;
        const suffix = salaryPeriod?.toLowerCase().includes("hour") ? "" : "k";
        return `${parseFloat(value) / denominator}${suffix}`;
      };
      salary = `${salaryCurrency} ${formatValue(salaryMin)} - ${formatValue(
        salaryMax
      )} ${salaryPeriod}`.trim();
    }

    const worksite = el.getAttribute("worksite")?.trim().toLowerCase();
    const jobType: JobType | undefined = worksite?.includes("remote")
      ? "remote"
      : worksite?.includes("hybrid")
      ? "hybrid"
      : worksite?.includes("onsite")
      ? "onsite"
      : undefined;

    const copy = el.getAttribute("copy")?.trim();
    const description = copy ? turndownService.turndown(copy) : undefined;
    const tags = [el.getAttribute("type")?.trim() ?? ""];

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      location,
      salary,
      jobType,
      description,
      tags,
      labels: [],
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
}

/**
 * Method used to parse a zip recruiter job page.
 */
async function parseZipRecruiterJobs({
  siteId,
  html,
}: {
  siteId: number;
  html: string;
}): Promise<JobSiteParseResult> {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  let jobsList = document.querySelector("ul.jobList");
  let isUsMode = false;
  if (!jobsList) {
    jobsList = document.querySelector("div.job_results_two_pane.flex.flex-col");
    isUsMode = true;
  }

  if (!jobsList)
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };
  const jobElements = Array.from(
    isUsMode
      ? jobsList.querySelectorAll(".job_result_two_pane")
      : jobsList.querySelectorAll(".job-listing")
  ) as Element[];

  const parseJobsListRow = (elements: Element[]) => {
    return elements.map((el): ParsedJob | null => {
      const externalUrlEl = el.querySelector("a.jobList-title");
      const externalUrl = externalUrlEl?.getAttribute("href")?.trim();
      if (!externalUrl) return null;

      const externalId = externalUrlEl?.getAttribute("id")?.trim();
      if (!externalId) return null;

      const title = externalUrlEl?.textContent?.trim();
      if (!title) return null;

      const metaEl = el.querySelector("ul.jobList-introMeta");
      const companyName = metaEl?.querySelector("li")?.textContent?.trim();
      if (!companyName) return null;

      const location = metaEl
        ?.querySelector("li:nth-child(2)")
        ?.textContent?.trim();

      return {
        siteId,
        externalId,
        externalUrl,
        title,
        companyName,
        location,
        labels: [],
      };
    });
  };

  const parseJobsListUs = async (elements: Element[]) => {
    return await Promise.all(
      elements.map(async (el): Promise<ParsedJob | null> => {
        const externalUrlEl = el.querySelector("h2 > a");
        const externalUrl = externalUrlEl?.getAttribute("href")?.trim();
        if (!externalUrl) return null;

        const title = externalUrlEl?.textContent?.trim();
        if (!title) return null;

        const companyName = el
          .querySelector("a[data-testid=job-card-company]")
          ?.textContent?.trim();
        if (!companyName) return null;

        const companyLogoUrl = el
          .querySelector("img.w-auto.max-h-\\[40px\\]")
          ?.getAttribute("src")
          ?.trim();

        const location = el
          .querySelector("a[data-testid=job-card-location]")
          ?.textContent?.trim();

        const hashBody = new TextEncoder().encode(
          `${companyName} ${title} ${location}`
        );
        const hashBuffer = await crypto.subtle.digest("SHA-256", hashBody);
        const externalId = encodeHex(hashBuffer);

        const salary = el
          .querySelector(
            "article > div > div > div.flex.flex-col:nth-child(2) > div > div > p"
          )
          ?.textContent?.trim();

        return {
          siteId,
          externalId,
          externalUrl,
          title,
          companyName,
          companyLogo: companyLogoUrl,
          location,
          salary,
          labels: [],
        };
      })
    );
  };

  const jobs = isUsMode
    ? await parseJobsListUs(jobElements)
    : parseJobsListRow(jobElements);

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
}

/**
 * Method used to parse a USAJobs job page.
 */
export function parseUSAJobsJobs({
  siteId,
  html,
}: {
  siteId: number;
  html: string;
}): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector(".usajobs-search-results");
  if (!jobsList)
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };
  const jobElements = Array.from(
    jobsList.querySelectorAll(".usajobs-search-result--core")
  ) as Element[];

  const jobs = jobElements.map((el): ParsedJob | null => {
    const titleElement = el.querySelector(
      "a.usajobs-search-result--core__title"
    );

    const externalId = titleElement?.getAttribute("data-document-id")?.trim();
    if (!externalId) return null;

    const externalUrlPath = titleElement?.getAttribute("href")?.trim();
    if (!externalUrlPath) return null;
    const externalUrl = `https://www.usajobs.gov${externalUrlPath}`;

    const title = titleElement?.textContent?.trim();
    if (!title) return null;

    const companyName = el
      .querySelector(".usajobs-search-result--core__agency")
      ?.textContent?.trim();
    if (!companyName) return null;

    const location = el
      .querySelector(".usajobs-search-result--core__location")
      ?.textContent?.trim();

    const salary = el
      .querySelector(".usajobs-search-result--core__item")
      ?.textContent?.trim();

    const jobType = location?.toLowerCase().includes("remote")
      ? "remote"
      : "onsite";

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      location,
      salary,
      jobType,
      labels: [],
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
}

/**
 * Method used to parse a talent job page.
 */
export function parseTalentJobs({
  siteId,
  html,
}: {
  siteId: number;
  html: string;
}): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const jobsList = document.querySelector(".joblist");
  if (!jobsList)
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };

  const jobElements = Array.from(
    jobsList.querySelectorAll(".card__job")
  ) as Element[];

  const jobs = jobElements.map((el): ParsedJob | null => {
    const externalUrlPath = el
      .querySelector(".link-job-wrap")
      ?.getAttribute("data-link")
      ?.trim();
    if (!externalUrlPath) return null;
    const externalUrl = `https://talent.com${externalUrlPath}`;

    const externalId = el.getAttribute("data-id")?.trim();
    if (!externalId) return null;

    const title = el.querySelector(".card__job-title")?.textContent?.trim();
    if (!title) return null;

    const companyName = el
      .querySelector(".card__job-empname-label")
      ?.textContent?.trim();
    if (!companyName) return null;

    const companyLogo = el
      .querySelector(".card__job-logo")
      ?.getAttribute("src")
      ?.trim();

    const location =
      el.querySelector(".card__job-location")?.textContent?.trim() || "";

    const jobType = el
      .querySelector(".card__job-badge-remote")
      ?.textContent?.trim()
      ? "remote"
      : "onsite";

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      location,
      jobType,
      labels: [],
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
}
