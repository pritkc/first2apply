import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Job } from "../../../supabase/functions/_shared/types";
import { Skeleton } from "./ui/skeleton";
import { useSites } from "@/hooks/sites";

/**
 * Component to display the details of a job.
 */
export function JobDetails({
  job,
  isScrapingDescription,
}: {
  job: Job;
  isScrapingDescription: boolean;
}) {
  const { sites } = useSites();
  const site = sites.find((site) => site.id === job.siteId);

  return isScrapingDescription ? (
    <div className="">
      <Skeleton className="h-4 w-3/4 mb-4" />
      <Skeleton className="h-4 w-4/5 mb-4" />

      <p className="text-center my-8">
        Hang tight, we are fetching the job description from{" "}
        {site?.name ?? "the source"} ...
        <br />
        It can take up to a couple of minutes.
      </p>

      <Skeleton className="h-4 w-full mb-4" />
      <Skeleton className="h-4 w-4/5 mb-4" />
      <Skeleton className="h-4 w-2/3 mb-4" />
    </div>
  ) : job.description ? (
    <Markdown
      remarkPlugins={[remarkGfm]}
      className="job-description-md pl-[25px] pr-2"
    >
      {job.description}
    </Markdown>
  ) : (
    <div className="text-center mt-20">
      <p className="">
        Looks like we have failed to fetch the job description and for that we
        are sorry {":("}
      </p>
      <p>
        You can read it directly on{" "}
        <a className="text-primary" href={job.externalUrl}>
          {site?.name ?? "the source"}
        </a>{" "}
        though.
      </p>
    </div>
  );
}
