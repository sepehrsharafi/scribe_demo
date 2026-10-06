import { Skeleton } from "@/components/ui/skeleton";
import { Page } from "@/components/page-layout";

export default function Loading() {
  return (
    <Page className="space-y-8">
      <div aria-busy="true" className="space-y-8">
        <div className="grid gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-full sm:w-80" />
        <div className="divide-y overflow-hidden rounded-xl border">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="grid gap-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="ms-auto hidden h-4 w-32 md:block" />
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
