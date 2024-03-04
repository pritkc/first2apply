import { FC } from "react";
import { Skeleton } from "../ui/skeleton";
import { CronScheduleSkeleton } from "@/components/skeletons/CronScheduleSkeleton";

export const SettingsSkeleton: FC = () => {
  return (
    <>
      {/* Title skeleton */}
      <div className="pb-3">
        <Skeleton className="h-8 w-[400px] rounded-md" />
      </div>

      {/* Cron job skeleton */}
      <CronScheduleSkeleton />

      {/* Sleep settings skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse h-[102px] flex flex-row items-center justify-between rounded-lg border p-6"
          >
            <div className="space-y-2">
              {/* Setting title */}
              <Skeleton className="h-6 w-[250px] rounded-md" />
              {/* Setting description */}
              <Skeleton className="h-3 w-[450px] rounded-md" />
            </div>
            <Skeleton className="h-7 w-12 rounded-full" />
            {/* Switch skeleton */}
          </div>
        ))}
      </div>

      {/* Logout button skeleton */}
      <div className="flex justify-end pt-4">
        <Skeleton className="h-9 w-[84px] rounded-md" />
      </div>
    </>
  );
};
