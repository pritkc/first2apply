import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import turndown from "npm:turndown@7.1.2";
import { Job, JobSite, SiteProvider } from "./types.ts";

type JobDescription = {
  content?: string;
};

const turndownService = new turndown();

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
  console.log("parsing linkedin job description");
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  const descriptionContainer = document.querySelector(
    ".description__text .show-more-less-html__markup"
  );

  console.log("finished parsing linkedin job description");
  const description = descriptionContainer
    ? turndownService.turndown(descriptionContainer.innerHTML)
    : undefined;

  return {
    content: description,
  };
}
