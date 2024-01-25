import { useSites } from "@/hooks/sites";
import { Job } from "../../../supabase/functions/_shared/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function JobsList({
  jobs,
  onApply,
  onArchive,
}: {
  jobs: Job[];
  onApply: (job: Job) => void;
  onArchive: (jobId: number) => void;
}) {
  const { siteLogos } = useSites();

  return (
    <ul className="space-y-8">
      {jobs.map((job) => {
        return (
          <li key={job.id}>
            <div key={job.id} className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={siteLogos[job.siteId]} />
                <AvatarFallback>LI</AvatarFallback>
              </Avatar>

              <div className="grow md:flex-auto min-[900px]:shrink-0 overflow-ellipsis w-fit">
                <p className="text-xs text-muted-foreground">
                  {job.companyName}
                </p>
                <p className="font-medium">{job.title}</p>

                <div className="flex items-center gap-1.5 pt-0.5 flex-wrap lg:flex-nowrap">
                  {job.location && (
                    <Badge className="shrink-0">{job.location}</Badge>
                  )}
                  {job.jobType && (
                    <Badge className="shrink-0">{job.jobType}</Badge>
                  )}
                  {job.salary && (
                    <Badge className="shrink-0">{job.salary}</Badge>
                  )}
                </div>
              </div>

              {job.tags && (
                <div className="grow hidden md:flex flex-wrap gap-1.5 justify-end pl-2">
                  {job.tags?.slice(0, 5).map((tag) => (
                    <Badge variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}

              {/* actions */}
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  className="w-full px-4"
                  onClick={() => onApply(job)}
                >
                  Apply
                </Button>
                {!job.archived && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full px-4"
                    onClick={() => onArchive(job.id)}
                  >
                    Archive
                  </Button>
                )}
              </div>
            </div>
            <hr className="w-full text-muted-foreground" />
          </li>
        );
      })}
    </ul>
  );
}
