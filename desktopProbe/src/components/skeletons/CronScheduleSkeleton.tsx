import { FC } from "react";
import { Skeleton } from "../ui/skeleton";

export const CronScheduleSkeleton: FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between rounded-lg border gap-6 p-4 bg-card animate-pulse">
        <div className="space-y-1">
          {/* Title */}
          <Skeleton className="h-6 w-[132px] mb-2" />
          {/* Subtitle */}
          <Skeleton className="h-4 w-[330px]" />
        </div>
        {/* Select */}
        <Skeleton className="h-9 w-[180px]" />
      </div>
    </div>
  );
};
