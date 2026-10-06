import { Skeleton } from "@/components/ui/skeleton";

/**
 * A visit before its data arrives, in the visit's own shape — name, facts,
 * action, the tab strip, a toolbar, a document — so what loads lands where
 * the eye already is.
 */
export function VisitSkeleton() {
  return (
    <div aria-busy="true" className="mx-auto w-full max-w-5xl px-6 pt-6 sm:px-10">
      <div className="flex items-start justify-between gap-6 pb-4">
        <div className="grid gap-2.5">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="flex h-11 items-center gap-6 border-b">
        {[16, 12, 24, 20].map((width) => (
          <Skeleton key={width} className="h-4 rounded-md" style={{ width: `${width * 4}px` }} />
        ))}
      </div>
      <Skeleton className="mt-4 h-10 w-80 max-w-full rounded-lg" />
      <div className="grid gap-8 pt-6">
        {[0, 1, 2].map((block) => (
          <div key={block} className="grid gap-3">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-11/12 rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
