import { FC } from "react";
import { Skeleton } from "../ui/skeleton";

export const LinksListSkeleton: FC = () => {
  return (
    <>
      {/* Title skeleton */}
      <div className="flex justify-between items-start">
        <Skeleton className="h-8 w-[152px] rounded-md" />
        <Skeleton className="h-10 w-[166px] rounded-md" />
      </div>

      {/* List skeleton */}
      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 2xl:gap-6 mt-4">
        {Array.from({ length: 9 }).map((_, index) => (
          <li
            key={index}
            className="px-6 pt-8 pb-6 bg-card cursor-pointer border border-border shadow-sm rounded-lg flex flex-col gap-4 animate-pulse"
          >
            <div className="flex items-center gap-2">
              {/* Avatar */}
              <Skeleton className="w-12 h-12 rounded-full" />

              {/* Title */}
              <Skeleton className="h-5 w-64" />
            </div>

            {/* URL */}
            <div className="space-y-1 mt-6 mb-4">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>

            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />

              {/* Button skeleton */}
              <Skeleton className="h-9 w-9 d rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};
