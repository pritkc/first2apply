import { FC } from "react";
import { Skeleton } from "../ui/skeleton";

export const CronScheduleSkeleton: FC = () => {
  return (
    <div className="animate-pulse h-[102px] flex flex-row items-center justify-between rounded-lg border p-6">
      <div className="space-y-1">
        {/* Title */}
        <Skeleton className="h-6 w-[146px] mb-2" />
        {/* Subtitle */}
        <Skeleton className="h-4 w-[325px]" />
      </div>
      {/* Select */}
      <Skeleton className="h-9 w-[180px]" />
    </div>
  );
};
