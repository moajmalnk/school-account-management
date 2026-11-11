import { Skeleton } from "@/components/ui/skeleton";

export function OverviewSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6" aria-busy="true" aria-label="Loading overview">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-black/[0.07]" />
        <Skeleton className="h-4 w-80 max-w-full bg-black/[0.05]" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-3xl bg-black/[0.06]" />
        ))}
      </div>
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-3xl bg-black/[0.06] lg:col-span-2" />
        <Skeleton className="h-72 rounded-3xl bg-black/[0.06]" />
      </div>
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <Skeleton className="h-56 rounded-3xl bg-black/[0.06]" />
        <Skeleton className="h-56 rounded-3xl bg-black/[0.06]" />
        <Skeleton className="h-56 rounded-3xl bg-black/[0.06]" />
      </div>
    </div>
  );
}
