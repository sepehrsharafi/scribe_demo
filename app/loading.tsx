import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10"
      aria-label="Loading workspace"
    >
      <div className="border-b pb-6">
        <Skeleton className="h-3 w-40 rounded-md" />
        <Skeleton className="mt-3 h-9 w-64 rounded-xl" />
      </div>

      <div className="mt-8 grid gap-2">
        {[0, 1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className="flex items-center gap-4 rounded-2xl border px-4 py-3.5"
          >
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="hidden h-4 w-48 rounded-md md:block" />
            <Skeleton className="ml-auto h-5 w-24 rounded-3xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
