import { ViewTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * A visit before its data arrives, in the visit's own shape — name, facts,
 * action, the tab strip, a document — so what loads lands where the eye
 * already is. It fades out as the visit fades in.
 */
export function VisitSkeleton() {
  return (
    <ViewTransition exit="skeleton-out" default="none">
      <div aria-busy="true" className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-8">
        <div className="flex flex-col gap-4 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-56 rounded-xl" />
              <Skeleton className="h-7 w-36 rounded-full" />
            </div>
            <Skeleton className="h-4 w-80 max-w-full rounded-md" />
          </div>
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
        <div className="flex h-12 items-center gap-5 border-b">
          {[20, 24, 16, 26].map((width) => (
            <Skeleton key={width} className="h-4 rounded-md" style={{ width: `${width * 4}px` }} />
          ))}
        </div>
        <div className="grid gap-8 pt-8">
          {[0, 1, 2].map((block) => (
            <div key={block} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3">
              <Skeleton className="h-3 w-5 rounded-sm" />
              <div className="grid gap-2.5">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-3.5 w-full rounded-md" />
                <Skeleton className="h-3.5 w-11/12 rounded-md" />
                <Skeleton className="h-3.5 w-2/3 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ViewTransition>
  );
}
