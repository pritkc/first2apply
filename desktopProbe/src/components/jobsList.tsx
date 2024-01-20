import { Job } from "../../../supabase/functions/_shared/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function JobsList({
  jobs,
  onApply,
  onDismiss,
}: {
  jobs: Job[];
  onApply: (job: Job) => void;
  onDismiss: (job: Job) => void;
}) {
  return (
    <ul className="space-y-10">
      {jobs.map((job) => {
        return (
          <li key={job.id} className="flex items-center gap-6 lg:gap-10">
            <Avatar className="w-16 h-16">
              <AvatarImage src={job.companyLogo} />
              <AvatarFallback>LI</AvatarFallback>
            </Avatar>

            <div className="flex-1 overflow-ellipsis w-fit">
              <p className="text-xs text-muted-foreground">{job.companyName}</p>
              <p className="font-medium">{job.title}</p>

              <div className="flex items-center gap-2 pt-0.5">
                {job.location && (
                  <Badge variant="secondary">{job.location}</Badge>
                )}
                {job.jobType && (
                  <Badge variant="secondary">{job.jobType}</Badge>
                )}
                {job.salary && <Badge variant="secondary">{job.salary}</Badge>}
              </div>
            </div>

            {job.tags && (
              <div className="w-1/6 sm:w-1/4 md:w-1/3 lg:w-1/5 flex flex-wrap gap-1 justify-end">
                {job.tags?.slice(0, 5).map((tag) => (
                  <Badge variant="outline">{tag}</Badge>
                ))}
              </div>
            )}

            {/* actions */}
            <div className="flex items-center gap-1 max-w-">
              <Button size="sm" className="w-full" onClick={() => onApply(job)}>
                Apply
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onDismiss(job)}
              >
                Dismiss
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
