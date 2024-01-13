import { Job } from "../../../supabase/functions/_shared/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
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
              <p className="font-medium">{job.title}</p>
              <p className="text-xs text-muted-foreground">{job.companyName}</p>
            </div>

            {/* actions */}
            <div className="flex items-center gap-2">
              <Button size="sm">Apply</Button>
              <Button variant="outline" size="sm">
                Dismiss
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
