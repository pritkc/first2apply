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
    DESCRIPTION: ".JobDetails_jobDescription__uW_fK",
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
    const sanitizedHtml = descriptionContainer.innerHTML
      .replaceAll(/<br><br><\/strong>/g, "</strong><br><br>")
      .replaceAll(/<br><\/strong>/g, "</strong><br>")
      .replaceAll(/(<br>)+<\/li>/g, "</li>");

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
    description = turndownService.turndown(descriptionContainer.innerHTML);
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
    description = turndownService.turndown(descriptionContainer.innerHTML);
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
    description = turndownService.turndown(descriptionContainer.innerHTML);
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
    const nodeToRemove = document.querySelector(".company_profile");
    if (nodeToRemove) {
      nodeToRemove.remove();
    }
    description = turndownService.turndown(descriptionContainer.innerHTML);
  }

  return {
    content: description,
  };
}
