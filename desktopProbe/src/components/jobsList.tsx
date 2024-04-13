import { useSites } from "@/hooks/sites";
import { useHotkeys } from "react-hotkeys-hook";

import InfiniteScroll from "react-infinite-scroll-component";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Icons } from "@/components/icons";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

import { ArchiveIcon, TrashIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { LABEL_COLOR_CLASSES } from "@/lib/labels";

import { Job } from "../../../supabase/functions/_shared/types";
import { useState } from "react";
import { DeleteJobDialog } from "./deleteJobDialog";

export function JobsList({
  jobs,
  selectedJobId,
  hasMore,
  parentContainerId,
  onLoadMore,
  onSelect,
  onArchive,
  onDelete,
}: {
  jobs: Job[];
  selectedJobId?: number;
  hasMore: boolean;
  parentContainerId: string;
  onLoadMore: () => void;
  onSelect: (job: Job) => void;
  onArchive: (job: Job) => void;
  onDelete: (job: Job) => void;
}) {
  const { siteLogos } = useSites();

  const [jobToDelete, setJobToDelete] = useState<Job | undefined>();

  const selectedIndex = jobs.findIndex((job) => job.id === selectedJobId);

  useHotkeys(
    "down",
    () => {
      if (selectedIndex < jobs.length - 1) {
        // Check if not last job
        const nextIndex = selectedIndex + 1;
        onSelect(jobs[nextIndex]);
      }
    },
    [selectedIndex, jobs]
  );

  useHotkeys(
    "up",
    () => {
      if (selectedIndex > 0) {
        // Check if not first job
        const prevIndex = selectedIndex - 1;
        onSelect(jobs[prevIndex]);
      }
    },
    [selectedIndex, jobs]
  );

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
                  <p className="leading-5 tracking-wide mt-0.5">{job.title}</p>

                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    {job.location && <Badge>{job.location}</Badge>}
                    {job.jobType && <Badge>{job.jobType}</Badge>}
                    {job.salary && <Badge>{job.salary}</Badge>}

                    <div className="ml-auto flex items-center gap-2">
                      {job.status !== "archived" && (
                        <Button
                          variant="secondary"
                          className="w-[22px] h-[22px] px-0 bg-transparent"
                          onClick={(evt) => {
                            onArchive(job);
                            evt.stopPropagation();
                          }}
                        >
                          <ArchiveIcon className="text-foreground w-fit min-h-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        className="w-[22px] h-[22px] px-0 bg-transparent hover:bg-destructive/20 focus:bg-destructive/20 transition-colors duration-200 ease-in-out"
                        onClick={(evt) => {
                          // onDelete(job);
                          setJobToDelete(job);
                          evt.stopPropagation();
                        }}
                      >
                        <TrashIcon className="h-5 w-auto text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="w-full border-muted" />
            </li>
          );
        })}
      </ul>
      {jobToDelete && (
        <DeleteJobDialog
          isOpen={!!jobToDelete}
          job={jobToDelete}
          onClose={() => setJobToDelete(undefined)}
          onDelete={onDelete}
        />
      )}
    </InfiniteScroll>
  );
}
