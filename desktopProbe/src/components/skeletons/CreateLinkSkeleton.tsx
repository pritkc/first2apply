import { FC } from "react";
import { Skeleton } from "../ui/skeleton";

export const CreateLinkSkeleton: FC = () => {
  return (
    <section className="p-6 border border-[#809966]/30 rounded-lg space-y-2">
      {/* Form header skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-7 w-56 rounded-md" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-full lg:w-[830px] rounded-md" />
          <Skeleton className="h-4 w-full lg:w-[570px] rounded-md" />
        </div>
        <Skeleton className="h-5 w-2/3 rounded-md" />
      </div>

      <hr className="w-full" />

      {/* Form fields skeleton */}
      <div className="flex flex-col w-full gap-2">
        {/* Title field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-8 rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        {/* Title field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-7 rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>

      {/* Footer skeleton with fake button */}
      <div className="flex flex-row justify-between items-center pt-4">
        <Skeleton className="h-5 w-[415px] rounded-md" /> {/* Tip text */}
        <Skeleton className="h-10 w-28 rounded-md" /> {/* Save button */}
      </div>
    </section>
  );
};
