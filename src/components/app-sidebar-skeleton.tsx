import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppSidebarSkeleton() {
  return (
    <div className="hidden h-svh w-64 flex-col gap-2 p-2 md:flex">
      {/* Header / Brand */}
      <div className="flex items-center gap-2 rounded-md p-2">
        <Skeleton className="size-8 rounded-lg" />
        <div className="flex flex-col gap-1 leading-none">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>

      {/* Group 1 */}
      <div className="flex flex-col gap-1 rounded-md p-2">
        <Skeleton className="h-4 w-20" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 rounded-md p-2">
            <Skeleton className="size-4 rounded-md" />
            <Skeleton className="h-4 w-3/5 flex-1" />
          </div>
        ))}
      </div>

      {/* Group 2 with sub-items */}
      <div className="flex flex-col gap-1 rounded-md p-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center gap-2 rounded-md p-2">
          <Skeleton className="size-4 rounded-md" />
          <Skeleton className="h-4 w-2/3 flex-1" />
        </div>
        <div className="ml-6 flex flex-col gap-1 border-l pl-3">
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="flex items-center gap-2 rounded-md p-2">
              <Skeleton className="h-4 w-1/2 flex-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Group 3 */}
      <div className="flex flex-col gap-1 rounded-md p-2">
        <Skeleton className="h-4 w-16" />
        {Array.from({ length: 3 }).map((_, k) => (
          <div key={k} className="flex items-center gap-2 rounded-md p-2">
            <Skeleton className="size-4 rounded-md" />
            <Skeleton className="h-4 w-2/3 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
