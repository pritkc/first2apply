import {
  DOMParser,
  Element,
} from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import turndown from "npm:turndown@7.1.2";
import { Job, JobSite, SiteProvider } from "./types.ts";

type SiteProviderQuerySelectors = {
  description: string[];
};

const SITE_PROVIDER_QUERY_SELECTORS: Record<
  SiteProvider,
  SiteProviderQuerySelectors
> = {
  [SiteProvider.linkedin]: {
    description: [
      ".description__text .show-more-less-html__markup",
      ".jobs-box__html-content > .job-details-module__content",
      ".jobs-description__container .jobs-box__html-content",
      ".job-details-module.artdeco-card",
    ],
  },
  [SiteProvider.glassdoor]: {
    description: [".JobDetails_jobDescription__uW_fK"],
  },
  [SiteProvider.indeed]: {
    description: ["#jobDescriptionText"],
  },
  [SiteProvider.remoteok]: {
    description: [".description"],
  },
  [SiteProvider.weworkremotely]: {
    description: [".lis-container__job__content__description"],
  },
  [SiteProvider.flexjobs]: {
    description: ["#job-description"], // paywalled
  },
  [SiteProvider.dice]: {
    description: [`[data-testid="jobDescriptionHtml"]`],
  },
  [SiteProvider.bestjobs]: {
    description: [
      "div.relative.bg-surface div.p-4 div.mt-8.pt-8.border-t.border-input.prose",
    ],
  },
  [SiteProvider.echojobs]: {
    description: ["#jobDescriptionText"],
  },
  [SiteProvider.remotive]: {
    description: ["section div.tw-mt-8 > div.left > div"],
  },
  [SiteProvider.remoteio]: {
    description: ["#job-description"],
  },
  [SiteProvider.builtin]: {
    description: [
      ".job-post-item .container.py-lg .row > .col-12 > .position-relative",
    ],
  },
  [SiteProvider.naukri]: {
    description: [".description", ".styles_JDC__dang-inner-html__h0K4t"],
  },
  [SiteProvider.robertHalf]: {
    description: ["div[data-testid=job-description]"],
  },
  [SiteProvider.zipRecruiter]: {
    description: [
      "div.job-body",
      "div.job_description",
      "section.company_description",
    ],
  },
  [SiteProvider.usaJobs]: {
    description: ["#requirements"],
  },
  [SiteProvider.talent]: {
    description: [
      ".sc-e78c1cd5-10.sc-e78c1cd5-11.sc-207c7d5e-10.dwTTNY.gdYndp.jkXeTb > p",
    ],
  },
};

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
}): JobDescription {
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
    case SiteProvider.dice:
      return parseDiceJobDescription({ html });
    case SiteProvider.flexjobs:
      return parseFlexJobsJobDescription({ html });
    case SiteProvider.builtin:
      return parseBuiltInJobDescription({ html });
    case SiteProvider.bestjobs:
      return parseBestJobsJobDescription({ html });
    case SiteProvider.echojobs:
      return parseEchoJobsJobDescription({ html });
    case SiteProvider.remotive:
      return parseRemotiveJobDescription({ html });
    case SiteProvider.remoteio:
      return parseRemoteIoJobDescription({ html });
    case SiteProvider.naukri:
      return parseNaukriJobDescription({ html });
    case SiteProvider.robertHalf:
      return parseRobertHalfJobDescription({ html });
    case SiteProvider.zipRecruiter:
      return parseZipRecruiterJobDescription({ html });
    case SiteProvider.usaJobs:
      return parseUSAJobsJobDescription({ html });
    case SiteProvider.talent:
      return parseTalentJobDescription({ html });
  }
}

/**
 * Extract common dom elements from the HTML.
 */
function extractCommonDomElements({
  provider,
  html,
}: {
  provider: SiteProvider;
  html: string;
}) {
  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  // extract description element
  const descriptionSelectors =
    SITE_PROVIDER_QUERY_SELECTORS[provider].description;
  let descriptionContainer: Element | null = null;
  for (const selector of descriptionSelectors) {
    const container = document.querySelector(selector);
    if (container && container.textContent.trim().length > 0) {
      descriptionContainer = container;
      break;
    }
  }

  return {
    document,
    descriptionContainer,
  };
}

/**
 * Parse a linkedin job description from the HTML.
 */
function parseLinkedinJobDescription({
  html,
}: {
  html: string;
}): JobDescription {
  const { document, descriptionContainer } = extractCommonDomElements({
    provider: SiteProvider.linkedin,
    html,
  });

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
function parseIndeedJobDescription({ html }: { html: string }): JobDescription {
  const { descriptionContainer } = extractCommonDomElements({
    provider: SiteProvider.indeed,
    html,
  });

  let description: string | undefined;
  if (descriptionContainer) {
    // TODO: get rid of the ** markdown in the description
    // turndownService.addRule("noBold", {
    //   filter: ["b"],
    //   replacement: function (content: string) {
    //     // Return the content wrapped in <strong> tags instead of Markdown bold syntax
    //     return "<strong>" + content + "</strong>";
    //   },
    // });
    // const sanitizedHtml = descriptionContainer.innerHTML
    //   .replace(/<b>/gi, "<strong>")
    //   .replace(/<\/b>/gi, "</strong>");

    description = turndownService
      .turndown(descriptionContainer.innerHTML)
      .replace(/\*\s\s\n/gi, "*");
  }

  return {
    content: description,
  };
}

/**
 * Parse a glassdoor job description from the HTML.
 */
function parseGlassdoorJobDescription({
  html,
}: {
  html: string;
}): JobDescription {
  const { descriptionContainer } = extractCommonDomElements({
    provider: SiteProvider.glassdoor,
    html,
  });

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
function parseRemoteOkJobDescription({
  html,
}: {
  html: string;
}): JobDescription {
  const { document, descriptionContainer } = extractCommonDomElements({
    provider: SiteProvider.remoteok,
    html,
  });

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

/**
 * Parse a WeWorkRemotely job description from the HTML.
 */
function parseWeWorkRemotelyJobDescription({
  html,
}: {
  html: string;
}): JobDescription {
  const { descriptionContainer } = extractCommonDomElements({
    provider: SiteProvider.weworkremotely,
    html,
  });

  let description: string | undefined;
  if (descriptionContainer) {
    description = turndownService.turndown(descriptionContainer.innerHTML);
  }

  return {
    content: description,
  };
}

/**
 * Parse a Dice job description from the HTML.
 */
function parseDiceJobDescription({ html }: { html: string }): JobDescription {
  const { descriptionContainer } = extractCommonDomElements({
    provider: SiteProvider.dice,
    html,
  });

  let description: string | undefined;
  if (descriptionContainer) {
    description = turndownService.turndown(descriptionContainer.innerHTML);
  }

  return {
    content: description,
  };
}

/**
 * Parse a FlexJobs job description from the HTML.
 */
function parseFlexJobsJobDescription({
  html,
}: {
  html: string;
}): JobDescription {
  const { descriptionContainer } = extractCommonDomElements({
    provider: SiteProvider.flexjobs,
    html,
  });

  let description: string | undefined;
  if (descriptionContainer) {
    description = turndownService.turndown(descriptionContainer.innerHTML);
  }

  return {
    content: description,
  };
}

/**
 * Parse a Bestjobs job description from the HTML.
 */
function parseBestJobsJobDescription({
  html,
}: {
  html: string;
}): JobDescription {
  const { descriptionContainer } = extractCommonDomElements({
    provider: SiteProvider.bestjobs,
    html,
  });

  let description: string | undefined;
  if (descriptionContainer) {
    description = turndownService.turndown(descriptionContainer.innerHTML);
  }

  return {
    content: description,
  };
}

/**
 * Parse a Echojobs job description from the HTML.
 */
function parseEchoJobsJobDescription({
  html,
}: {
  html: string;
}): JobDescription {
  const { descriptionContainer } = extractCommonDomElements({
    provider: SiteProvider.echojobs,
    html,
  });

  let description: string | undefined;
  if (descriptionContainer) {
    description = turndownService.turndown(descriptionContainer.innerHTML);
  }

  return {
    content: description,
  };
}

/**
 * Parse a Remotive job description from the HTML.
 */
function parseRemotiveJobDescription({
  html,
}: {
  html: string;
}): JobDescription {
  const parseOwnHtml = ({ html }: { html: string }) => {
    const { descriptionContainer } = extractCommonDomElements({
      provider: SiteProvider.remotive,
      html,
    });
    let description: string | undefined;
    if (descriptionContainer) {
      description =
        turndownService.turndown(descriptionContainer.innerHTML) ||
        "job might be archived";
    }
    return { content: description };
  };

  // quite often, remotive redirects to an indeed job page so try to parse the description from there
  let description: string | undefined;
  const parsers = [
    parseOwnHtml, // try to parse the description from the remotive page first
    parseIndeedJobDescription,
    parseLinkedinJobDescription,
    parseTalentJobDescription,
  ];
  for (const parser of parsers) {
    const { content } = parser({ html });
    if (content) {
      description = content;
      break;
    }
  }

  return {
    content: description,
  };
}

/**
 * Parse a Remoteio job description from the HTML.
 */
function parseRemoteIoJobDescription({
  html,
}: {
  html: string;
}): JobDescription {
  const { descriptionContainer } = extractCommonDomElements({
    provider: SiteProvider.remoteio,
    html,
  });

  let description: string | undefined;
  if (descriptionContainer) {
    description = turndownService.turndown(descriptionContainer.innerHTML);
  }

  return {
    content: description,
  };
}

/**
 * Parse a BuiltIn job description from the HTML.
 */
function parseBuiltInJobDescription({
  html,
}: {
  html: string;
}): JobDescription {
  const { descriptionContainer } = extractCommonDomElements({
    provider: SiteProvider.builtin,
    html,
  });

  let description: string | undefined;
  if (descriptionContainer) {
    description = turndownService.turndown(descriptionContainer.innerHTML);
  }

  return {
    content: description,
  };
}

/**
 * Parse a Naukri job description from the HTML.
 */
function parseNaukriJobDescription({ html }: { html: string }): JobDescription {
  const { descriptionContainer } = extractCommonDomElements({
    provider: SiteProvider.naukri,
    html,
  });

  let description: string | undefined;
  if (descriptionContainer) {
    description = turndownService.turndown(descriptionContainer.innerHTML);
  }

  return {
    content: description,
  };
}

/**
 * Parse a RobertHalf job description from the HTML.
 */
function parseRobertHalfJobDescription({}: { html: string }): JobDescription {
  // the entire JD is parsed from the list so no need to parse the description

  return {};
}

/**
 * Parse a ZipRecruiter job description from the HTML.
 */
function parseZipRecruiterJobDescription({
  html,
}: {
  html: string;
}): JobDescription {
  const { descriptionContainer } = extractCommonDomElements({
    provider: SiteProvider.zipRecruiter,
    html,
  });

  let description: string | undefined;
  if (descriptionContainer) {
    description = turndownService.turndown(descriptionContainer.innerHTML);
  }

  return {
    content: description,
  };
}

/**
 * Parse a USAJobs job description from the HTML.
 */
function parseUSAJobsJobDescription({
  html,
}: {
  html: string;
}): JobDescription {
  const { descriptionContainer } = extractCommonDomElements({
    provider: SiteProvider.usaJobs,
    html,
  });

  let description: string | undefined;
  if (descriptionContainer) {
    description = turndownService.turndown(descriptionContainer.innerHTML);
  }

  return {
    content: description,
  };
}

/**
 * Parse a Talent job description from the HTML.
 */
function parseTalentJobDescription({ html }: { html: string }): JobDescription {
  const { descriptionContainer } = extractCommonDomElements({
    provider: SiteProvider.talent,
    html,
  });

  let description: string | undefined;
  if (descriptionContainer) {
    description = turndownService.turndown(descriptionContainer.innerHTML);
  }

  return {
    content: description,
  };
}
