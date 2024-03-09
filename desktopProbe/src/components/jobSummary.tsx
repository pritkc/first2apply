import {
  BackpackIcon,
  CookieIcon,
  ListBulletIcon,
} from "@radix-ui/react-icons";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

import { useSites } from "@/hooks/sites";
import { Job } from "../../../supabase/functions/_shared/types";

/**
 * Component to display the details of a job.
 */
export function JobSummary({
  job,
  onApply,
  onArchive,
}: {
  job: Job;
  onApply: (job: Job) => void;
  onArchive: (job: Job) => void;
}) {
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
              {"Skills: "}
              {job.tags?.slice(0, 5).join(", ")}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4 lg:mt-6">
        {job.status !== "applied" && (
          <Button
            size="lg"
            className="w-24 text-sm"
            onClick={() => {
              onApply(job);
            }}
          >
            Apply
          </Button>
        )}
        {job.status !== "archived" && (
          <Button
            size="lg"
            variant="outline"
            className="w-24 text-sm"
            onClick={() => {
              onArchive(job);
            }}
          >
            Archive
          </Button>
        )}
      </div>
    </div>
  );
}
