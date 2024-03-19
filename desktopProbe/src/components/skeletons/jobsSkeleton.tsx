import { FC } from "react";
import { Skeleton } from "../ui/skeleton";

export function JobsListSkeleton() {
  return (
    <ul>
      {Array.from({ length: 10 }).map((_, index) => (
        <li key={index} className="pt-6 px-2 xl:px-4 -mt-[1px]">
          <div className="flex items-center gap-4 mb-6">
            {/* Avatar */}
            <Skeleton className="min-w-16 h-16 rounded-full" />
            <div className="grow space-y-1">
              {/* Company Name */}
              <Skeleton className="h-4 w-full max-w-20" />
              {/* Job Title */}
              <Skeleton className="h-5 w-full max-w-60" />

              {/* Location, JobType & Salary */}
              <div className="flex items-center gap-1.5 pt-2">
                <Skeleton className="h-5 w-full max-w-32" />
                <Skeleton className="h-5 w-full max-w-20" />
              </div>
            </div>
          </div>
          <Skeleton className="w-full h-px" /> {/* Divider */}
        </li>
      ))}
    </ul>
  );
}

export function JobSummarySkeleton() {
  return (
    <div className="border border-muted rounded-lg p-4 lg:p-6">
      <div className="flex justify-between items-start gap-4 lg:gap-6">
        <div className="flex-1">
          <Skeleton className="h-7 w-full max-w-80 mt-3 lg:mt-4" />
          <Skeleton className="h-4 mt-2 w-full max-w-52" />
        </div>

        <Skeleton className="w-16 h-16 rounded-full" />
      </div>

      <div className="space-y-1.5 mt-3 lg:mt-4">
        <div className="flex gap-3 items-center">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="h-5 w-20" />
        </div>

        <div className="flex gap-3 items-center">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="flex gap-3 items-center">
          <Skeleton className="min-w-5 h-5" />
          <Skeleton className="h-5 w-full max-w-64" />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-6 lg:mt-10">
        <Skeleton className="w-24 h-10" />
        <Skeleton className="w-24 h-10" />
        <Skeleton className="w-[148px] lg:ml-auto h-10" />
      </div>
    </div>
  );
}

export function JobDetailsSkeleton() {
  return (
    <div className="pr-2 pl-[25px] space-y-1">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-6 w-2/3" />
      <div className="h-6" />
      <Skeleton className="h-6 w-[99%]" />
      <Skeleton className="h-6 w-[95%]" />
      <Skeleton className="h-6 w-[97%]" />
      <Skeleton className="h-6 w-[99%]" />
      <div className="h-6" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-6 w-[99%]" />
      <Skeleton className="h-6 w-[95%]" />
      <Skeleton className="h-6 w-[97%]" />
      <Skeleton className="h-6 w-[99%]" />
      <Skeleton className="h-6 w-[99%]" />
      <Skeleton className="h-6 w-[95%]" />
      <Skeleton className="h-6 w-[97%]" />
      <Skeleton className="h-6 w-[99%]" />
      <Skeleton className="h-6 w-[99%]" />
      <Skeleton className="h-6 w-[95%]" />
      <Skeleton className="h-6 w-[97%]" />
      <Skeleton className="h-6 w-[99%]" />
    </div>
  );
}

export const JobsSkeleton: FC = () => {
  return (
    <section className="flex">
      <div className="w-1/2 lg:w-2/5 h-[calc(100vh-100px)] overflow-scroll no-scrollbar">
        <JobsListSkeleton />
      </div>

      <div className="w-1/2 lg:w-3/5 h-[calc(100vh-100px)] overflow-scroll border-l-[1px] border-muted pl-2 lg:pl-4 space-y-4 lg:space-y-5 animate-pulse">
        <JobSummarySkeleton />
        <JobDetailsSkeleton />
      </div>
    </section>
  );
};
