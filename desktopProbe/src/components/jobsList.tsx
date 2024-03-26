import { useSites } from "@/hooks/sites";

import InfiniteScroll from "react-infinite-scroll-component";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Icons } from "@/components/icons";
import { Badge } from "./ui/badge";

import { cn } from "@/lib/utils";
import { LABEL_COLOR_CLASSES } from "@/lib/labels";

import { Job } from "../../../supabase/functions/_shared/types";

export function JobsList({
  jobs,
  selectedJobId,
  hasMore,
  parentContainerId,
  onLoadMore,
  onSelect,
}: {
  jobs: Job[];
  selectedJobId?: number;
  hasMore: boolean;
  parentContainerId: string;
  onLoadMore: () => void;
  onSelect: (job: Job) => void;
}) {
  const { siteLogos } = useSites();

  return (
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
                "pt-6 px-2 xl:px-4 -mt-[1px]",
                selectedJobId === job.id && "bg-muted"
              )}
              onClick={() => onSelect(job)}
            >
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={siteLogos[job.siteId]} />
                  <AvatarFallback>LI</AvatarFallback>
                </Avatar>

                <div className="grow">
                  <div className="flex justify-between">
                    <p className="text-xs text-muted-foreground mb-1">
                      {job.companyName}
                    </p>

                    <div
                      className={`text-xs text-center leading-3 rounded-md w-[85px] py-1 bg-opacity-80 dark:bg-opacity-60 text-white ${
                        LABEL_COLOR_CLASSES[job.labels[0]]
                      }`}
                    >
                      {job.labels[0]}
                    </div>
                  </div>
                  <p className="leading-5 tracking-wide">{job.title}</p>

                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    {job.location && <Badge>{job.location}</Badge>}
                    {job.jobType && <Badge>{job.jobType}</Badge>}
                    {job.salary && <Badge>{job.salary}</Badge>}
                  </div>
                </div>
              </div>

              <hr className="w-full border-muted" />
            </li>
          );
        })}
      </ul>
    </InfiniteScroll>
  );
}
