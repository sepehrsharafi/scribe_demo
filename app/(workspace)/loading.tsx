import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Page } from "@/components/page-layout";

/** Home's shape — the greeting, the hero card with its figure and bars, the list under it — so it lands where the eye already is. */
export default function Loading() {
  return (
    <Page className="max-w-3xl space-y-8 py-10 lg:py-12">
      <div aria-busy="true" className="space-y-8">
        <div className="flex items-baseline justify-between gap-8">
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex items-end justify-between gap-8">
              <div className="grid gap-3">
                <Skeleton className="h-14 w-36 rounded-xl" />
                <Skeleton className="h-5 w-64 max-w-full" />
              </div>
              <Skeleton className="hidden h-12 w-52 sm:block" />
            </div>
            <div className="grid gap-3 border-t pt-6">
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <div className="border-b px-5 py-4">
            <Skeleton className="h-6 w-40" />
          </div>
          {[0, 1, 2].map((row) => (
            <div key={row} className="grid gap-1.5 border-b px-5 py-3 last:border-b-0">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
          ))}
        </Card>
      </div>
    </Page>
  );
}
