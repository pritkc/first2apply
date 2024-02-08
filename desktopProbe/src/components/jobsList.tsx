import { useSites } from "@/hooks/sites";
import { Job } from "../../../supabase/functions/_shared/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Icons } from "@/components/icons";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import InfiniteScroll from "react-infinite-scroll-component";

export function JobsList({
  jobs,
  hasMore,
  onApply,
  onArchive,
  onLoadMore,
}: {
  jobs: Job[];
  hasMore: boolean;
  onApply: (job: Job) => void;
  onArchive: (jobId: number) => void;
  onLoadMore: () => void;
}) {
  const { siteLogos } = useSites();

  return jobs.length > 0 ? (
    <ul className="space-y-8">
      <InfiniteScroll
        dataLength={jobs.length} //This is important field to render the next data
        next={onLoadMore}
        hasMore={hasMore}
        loader={<Icons.spinner2 />}
      >
        {jobs.map((job) => {
          return (
            <li key={job.id} className="space-y-8">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={siteLogos[job.siteId]} />
                  <AvatarFallback>LI</AvatarFallback>
                </Avatar>

                <div className="grow md:flex-auto overflow-ellipsis w-fit">
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
                    {job.tags?.slice(0, 5).map((tag, idx) => (
                      <Badge key={idx} variant="outline">
                        {tag}
                      </Badge>
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
                  {job.status !== "archived" && (
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
      </InfiniteScroll>
    </ul>
  ) : (
    <p className="text-center mt-10 max-w-md mx-auto">
      No new job listings right now, but don't worry! We're on the lookout and
      will update you as soon as we find anything.
    </p>
  );
}
