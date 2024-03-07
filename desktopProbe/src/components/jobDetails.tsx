import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSites } from "@/hooks/sites";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Job } from "../../../supabase/functions/_shared/types";
import { Button } from "./ui/button";
import { openExternalUrl } from "@/lib/electronMainSdk";
import {
  BackpackIcon,
  CookieIcon,
  ListBulletIcon,
} from "@radix-ui/react-icons";

/**
 * Component to display the details of a job.
 */
function JobSummary({ job }: { job: Job }) {
  const { siteLogos } = useSites();

  return (
    <div className="border border-muted rounded-lg p-4 lg:p-6">
      <div className="flex justify-between items-start gap-4 lg:gap-6">
        <div>
          <h1 className="text-xl font-medium mt-3 lg:mt-4">{job.title}</h1>

          <p className="text-sm text-muted-foreground">
            {job.companyName}
            {job.location && (
              <span>
                {" · "}
                {job.location}
              </span>
            )}
          </p>
        </div>

        <Avatar className="w-16 h-16">
          <AvatarImage src={job.companyLogo || siteLogos[job.siteId]} />
          <AvatarFallback>LI</AvatarFallback>
        </Avatar>
      </div>

      <div className="space-y-1.5 mt-3 lg:mt-4">
        {job.jobType && (
          <div className="flex gap-3 items-center text-muted-foreground capitalize">
            <BackpackIcon className="w-5 h-auto" />
            {job.jobType}
          </div>
        )}
        {job.salary && (
          <div className="flex gap-3 items-center text-muted-foreground">
            <CookieIcon className="w-5 h-auto" />
            {job.salary}
          </div>
        )}
        {job.tags && (
          <div className="flex gap-3 items-center text-muted-foreground">
            <ListBulletIcon className="w-5 h-auto" />
            <p>
              {"Tags: "}
              {job.tags?.slice(0, 5).join(", ")}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4 lg:mt-6">
        <Button
          size="lg"
          className="w-24 text-sm"
          onClick={() => {
            openExternalUrl(job.externalUrl);
          }}
        >
          Apply
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-24 text-sm"
          // onClick={() => {
          //   openExternalUrl(job.externalUrl);
          // }}
        >
          Archive
        </Button>
      </div>
    </div>
  );
}

/**
 * Component to display the details of a job.
 */
export function JobDetails({ job }: { job: Job }) {
  return (
    <div className="space-y-4 lg:space-y-5">
      <JobSummary job={job} />
      <Markdown
        remarkPlugins={[remarkGfm]}
        className="job-description-md pl-[25px] pr-2"
      >
        {job.description}
      </Markdown>
    </div>
  );
}
