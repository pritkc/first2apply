import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import turndown from "npm:turndown@7.1.2";
import { Job, JobSite, SiteProvider } from "./types.ts";

const QUERY_SELECTORS = {
  LINKEDIN: {
    DESCRIPTION: ".description__text .show-more-less-html__markup",
  },
  INDEED: {
    DESCRIPTION: "#jobDescriptionText",
  },
  GLASSDOOR: {
    DESCRIPTION: ".JobDetails_jobDescriptionWrapper___tqxc",
  },
  WEWORKREMOTELY: {
    DESCRIPTION: "#job-listing-show-container",
  },
  REMOTEOK: {
    DESCRIPTION: ".description",
  },
} as const;

type JobDescription = {
  content?: string;
};

const turndownService = new turndown({
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});

/**
 * Parse the job description from the HTML.
 */
export function parseJobDescription({
  site,
  html,
}: {
  site: JobSite;
  job: Job;
  html: string;
}) {
  switch (site.provider) {
    case SiteProvider.linkedin:
      return parseLinkedinJobDescription({ html });
    case SiteProvider.indeed:
      return parseIndeedJobDescription({ html });
    case SiteProvider.glassdoor:
      return parseGlassdoorJobDescription({ html });
    case SiteProvider.weworkremotely:
      return parseWeWorkRemotelyJobDescription({ html });
    case SiteProvider.remoteok:
      return parseRemoteOkJobDescription({ html });
    default:
      throw new Error(`Provider not supported: ${site.provider}`);
  }
}

/**
 * Parse a linkedin job description from the HTML.
 */
export function parseLinkedinJobDescription({
  html,
}: {
  html: string;
}): JobDescription {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const descriptionContainer = document.querySelector(
    QUERY_SELECTORS.LINKEDIN.DESCRIPTION
  );

  let description: string | undefined;
  if (descriptionContainer) {
    const sanitizedHtml = sanitizeHtml(descriptionContainer.innerHTML);
    description = turndownService.turndown(sanitizedHtml);
  }

  return {
    content: description,
  };
}

/**
 * Parse a indeed job description from the HTML.
 */
export function parseIndeedJobDescription({
  html,
}: {
  html: string;
}): JobDescription {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const descriptionContainer = document.querySelector(
    QUERY_SELECTORS.INDEED.DESCRIPTION
  );

  let description: string | undefined;

  if (descriptionContainer) {
    const sanitizedHtml = sanitizeHtml(descriptionContainer.innerHTML);
    description = turndownService.turndown(sanitizedHtml);
  }

  return {
    content: description,
  };
}

/**
 * Parse a glassdoor job description from the HTML.
 */
export function parseGlassdoorJobDescription({
  html,
}: {
  html: string;
}): JobDescription {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const descriptionContainer = document.querySelector(
    QUERY_SELECTORS.GLASSDOOR.DESCRIPTION
  );

  let description: string | undefined;

  if (descriptionContainer) {
    const sanitizedHtml = sanitizeHtml(descriptionContainer.innerHTML);
    // New rule to remove the "Show more" part and everything after it
    // This regex looks for the specific <div> and removes it and any characters that follow
    const showMoreRegex = /<div class="JobDetails_showMoreWrapper.*$/s;
    const withoutShowMore = sanitizedHtml.replace(showMoreRegex, "");

    description = turndownService.turndown(withoutShowMore);
  }

  return {
    content: description,
  };
}

/**
 * Parse a WeWorkRemotely job description from the HTML.
 */
export function parseWeWorkRemotelyJobDescription({
  html,
}: {
  html: string;
}): JobDescription {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const descriptionContainer = document.querySelector(
    QUERY_SELECTORS.WEWORKREMOTELY.DESCRIPTION
  );

  let description: string | undefined;

  if (descriptionContainer) {
    const sanitizedHtml = sanitizeHtml(descriptionContainer.innerHTML);
    description = turndownService.turndown(sanitizedHtml);
  }

  return {
    content: description,
  };
}

/**
 * Parse a RemoteOk job description from the HTML.
 */
export function parseRemoteOkJobDescription({
  html,
}: {
  html: string;
}): JobDescription {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const descriptionContainer = document.querySelector(
    QUERY_SELECTORS.REMOTEOK.DESCRIPTION
  );

  let description: string | undefined;

  if (descriptionContainer) {
    const sanitizedHtml = sanitizeHtml(descriptionContainer.innerHTML);
    console.log(sanitizedHtml);

    // Define a regex that matches from the beginning of the string to the first occurrence of <div class="markdown">
    // and includes the <div class="markdown"> tag itself in the match
    const beforeMarkdownRegex = /^.*?(<div class="markdown">)/s;

    // Replace the matched portion with just the <div class="markdown"> tag to remove everything before it
    const cleanedUp = sanitizedHtml.replace(beforeMarkdownRegex, "$1");

    description = turndownService.turndown(cleanedUp);
  }

  return {
    content: description,
  };
}

function sanitizeHtml(html: string) {
  return html
    .replaceAll(/<br><br><\/strong>/g, "</strong><br><br>")
    .replaceAll(/<br><\/strong>/g, "</strong><br>")
    .replaceAll(/(<br>)+<\/li>/g, "</li>");
}
