import { useSites } from "@/hooks/sites";

import InfiniteScroll from "react-infinite-scroll-component";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  TooltipProvider,
  TooltipTrigger,
  Tooltip,
  TooltipContent,
} from "./ui/tooltip";
import { Icons } from "@/components/icons";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

import { ArchiveIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";

import { Job, JobStatus } from "../../../supabase/functions/_shared/types";

export function JobsList({
  jobs,
  selectedJobId,
  hasMore,
  parentContainerId,
  onLoadMore,
  onUpdateJobStatus,
  onSelect,
}: {
  jobs: Job[];
  selectedJobId?: number;
  hasMore: boolean;
  parentContainerId: string;
  onUpdateJobStatus: (jobId: number, status: JobStatus) => void;
  onLoadMore: () => void;
  onSelect: (job: Job) => void;
}) {
  const { siteLogos } = useSites();

  return jobs.length > 0 ? (
    <InfiniteScroll
      dataLength={jobs.length}
      next={onLoadMore}
      hasMore={hasMore}
      loader={<Icons.spinner2 />}
      scrollThreshold={0.8}
      scrollableTarget={parentContainerId}
    >
      <ul>
        {jobs.map((job) => {
          return (
            <li
              key={job.id}
              className={cn(
                "pt-6 px-2 -mt-[1px]",
                selectedJobId === job.id && "bg-muted"
              )}
              onClick={() => onSelect(job)}
            >
              <div className="flex items-center gap-2">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={siteLogos[job.siteId]} />
                  <AvatarFallback>LI</AvatarFallback>
                </Avatar>

                <div className="grow space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {job.companyName}
                  </p>
                  <p className="leading-5 tracking-wide">{job.title}</p>

                  <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                    {job.location && <Badge>{job.location}</Badge>}
                    {job.jobType && <Badge>{job.jobType}</Badge>}
                    {job.salary && <Badge>{job.salary}</Badge>}
                  </div>
                </div>

                {job.status !== "archived" && (
                  <TooltipProvider delayDuration={500}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-8"
                          onClick={() => onUpdateJobStatus(job.id, "archived")}
                        >
                          <ArchiveIcon className="h-4 w-auto shrink-0 text-primary-foreground transition-transform duration-200" />
                        </Button>
                      </TooltipTrigger>

                      <TooltipContent>Archive</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* {job.tags && (
                <div className="flex flex-wrap gap-1.5 pl-2 mt-3">
                  {job.tags?.slice(0, 5).map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )} */}

              <hr className="w-full text-muted-foreground mt-6" />
            </li>
          );
        })}
      </ul>
    </InfiniteScroll>
  ) : (
    <p className="text-center mt-10 max-w-md mx-auto">
      No new job listings right now, but don't worry! We're on the lookout and
      will update you as soon as we find anything.
    </p>
  );
}
