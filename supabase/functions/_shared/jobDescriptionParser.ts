import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import turndown from "npm:turndown@7.1.2";
import { Job, JobSite, SiteProvider } from "./types.ts";

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
    ".description__text .show-more-less-html__markup"
  );

  let description: string | undefined;
  if (descriptionContainer) {
    const html = descriptionContainer.innerHTML;
    const sanitizedHtml = html
      .replaceAll(/<br><br><\/strong>/g, "</strong><br><br>")
      .replaceAll(/<br><\/strong>/g, "</strong><br>")
      .replaceAll(/(<br>)+<\/li>/g, "</li>");
    description = turndownService.turndown(sanitizedHtml);
  }

  return {
    content: description,
  };
}
