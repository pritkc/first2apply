import { Job } from "../../../supabase/functions/_shared/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function JobsList({ jobs }: { jobs: Job[] }) {
  return (
    <ul className="space-y-10">
      {jobs.map((job) => {
        return (
          <li key={job.id} className="flex items-center gap-4">
            <Avatar className="w-11 h-11">
              <AvatarImage src={job.companyLogo} />
              <AvatarFallback>LI</AvatarFallback>
            </Avatar>

            <div className="flex-1 overflow-ellipsis">
              <p className="text-xs text-muted-foreground">{job.companyName}</p>
              <p className="font-medium">{job.title}</p>

              <div className="flex items-center gap-2">
                {job.location && <Badge>{job.location}</Badge>}
                {job.salary && <Badge variant="secondary">{job.salary}</Badge>}
              </div>
            </div>

            <div className="w-1/4">
              {job.tags?.slice(0, 5).map((tag) => (
                <Badge variant="outline" className="m-x-3 space-y-1">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* actions */}
            <div className="flex flex-col items-center gap-1">
              <Button size="sm" className="w-full">
                Apply
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Dismiss
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
