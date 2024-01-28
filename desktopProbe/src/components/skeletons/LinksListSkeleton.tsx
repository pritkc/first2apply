import { FC } from "react";
import { Skeleton } from "../ui/skeleton";

export const LinksListSkeleton: FC = () => {
  return (
    <section className="space-y-2 animate-pulse">
      {/* Title skeleton */}
      <Skeleton className="h-7 w-[158px] rounded-md" />

      <hr className="w-full text-muted-foreground" />

      {/* List skeleton */}
      <ul className="space-y-6 pt-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <li key={index} className="flex items-center gap-4 justify-between">
            {/* Avatar skeleton */}
            <Skeleton className="w-11 h-11 rounded-full" />

            {/* Text skeletons */}
            <div className="flex-1">
              <Skeleton className="h-4 w-40 rounded-md" /> {/* Title */}
              <Skeleton className="h-3 w-5/6 rounded-md mt-2" /> {/* URL */}
            </div>

            {/* Button skeleton */}
            <Skeleton className="h-8 w-[62px] rounded-md" />
          </li>
        ))}
      </ul>
    </section>
  );
};
