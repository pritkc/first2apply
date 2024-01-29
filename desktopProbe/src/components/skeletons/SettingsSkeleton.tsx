import { FC } from "react";
import { Skeleton } from "../ui/skeleton";

export const SettingsSkeleton: FC = () => {
  return (
    <>
      {/* Title skeleton */}
      <div className="pb-3">
        <Skeleton className="h-8 w-[94px] rounded-md" />
      </div>
      {/* Sleep settings skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse h-[82px] flex flex-row items-center justify-between rounded-lg border p-4"
          >
            <div className="space-y-2">
              {/* Setting title */}
              <Skeleton className="h-6 w-[250px] rounded-md" />
              {/* Setting description */}
              <Skeleton className="h-3 w-[450px] rounded-md" />
            </div>
            <Skeleton className="h-5 w-9 rounded-full" />
            {/* Switch skeleton */}
          </div>
        ))}
      </div>
      {/* Logout button skeleton */}
      <div className="flex justify-end pt-4">
        <Skeleton className="h-9 w-16 rounded-md" />
      </div>
    </>
  );
};
