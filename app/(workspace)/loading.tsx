import { Skeleton } from "@/components/ui/skeleton";
import { Page } from "@/components/page-layout";

/** Home's shape — the figure and its two bars, the search, the list under it — so it lands where the eye already is. */
export default function Loading() {
  return (
    <Page className="max-w-3xl space-y-12 py-10 lg:py-16">
      <div aria-busy="true" className="grid gap-7">
        <div className="flex items-center justify-between gap-8">
          <Skeleton className="h-3 w-56 rounded-md" />
          <Skeleton className="h-3 w-40 rounded-md" />
        </div>
        <div className="grid gap-3">
          <Skeleton className="h-14 w-36 rounded-xl" />
          <Skeleton className="h-5 w-72 max-w-full rounded-md" />
        </div>
        <div className="grid gap-3">
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-full rounded-full" />
        </div>
      </div>
      <div aria-busy="true" className="grid gap-10">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="grid gap-3">
          <Skeleton className="h-6 w-40 rounded-md" />
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex items-center gap-3 py-2.5">
              <Skeleton className="size-8 rounded-full" />
              <div className="grid flex-1 gap-1.5">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-3 w-32 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
