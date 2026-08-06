import { OrganicCard } from "@/components/ui/organic-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, type CornerSide } from "@/lib/utils";

const bone = "bg-black/[0.07]";
const boneSoft = "bg-black/[0.05]";

function Bone({ className }: { className?: string }) {
  return <Skeleton className={cn(bone, className)} />;
}

function TenantCardSkeleton({ cornerSide }: { cornerSide: CornerSide }) {
  return (
    <OrganicCard tone="white" cornerSide={cornerSide} padded className="space-y-4">
      <div className="space-y-2">
        <Bone className="h-4 w-[62%] rounded-md" />
        <Bone className={cn("h-3 w-[78%] rounded-md", boneSoft)} />
        <Bone className={cn("h-3 w-[48%] rounded-md", boneSoft)} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Bone className="h-6 w-16 rounded-full" />
        <Bone className="h-6 w-16 rounded-full" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Bone className={cn("h-3 w-24 rounded-md", boneSoft)} />
          <Bone className={cn("h-3 w-8 rounded-md", boneSoft)} />
        </div>
        <Bone className="h-1.5 w-full rounded-full" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/8 pt-3">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-8 w-8 rounded-full" />
          ))}
        </div>
        <Bone className="h-8 w-[7.5rem] rounded-full" />
      </div>
    </OrganicCard>
  );
}

/** Full-page placeholder matching School Tenants Registry layout. */
export function TenantsViewSkeleton({ cardCount = 6 }: { cardCount?: number }) {
  return (
    <div
      className="space-y-4 sm:space-y-6"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading school tenants registry"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Bone className="h-8 w-[min(100%,18rem)] rounded-lg sm:h-9" />
          <Bone className={cn("h-3.5 w-[min(100%,22rem)] rounded-md", boneSoft)} />
        </div>
        <Bone className="h-11 w-full rounded-full sm:w-[16.5rem]" />
      </div>

      <OrganicCard
        tone="white"
        cornerSide="tr"
        className="flex flex-col gap-2.5 p-3.5 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <Bone className="h-11 w-full min-w-0 flex-1 rounded-full sm:min-w-[260px]" />
        <Bone className="h-11 w-full rounded-lg sm:h-10 sm:w-[170px]" />
        <Bone className="h-11 w-full rounded-lg sm:h-10 sm:w-[170px]" />
      </OrganicCard>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cardCount }).map((_, i) => (
          <TenantCardSkeleton
            key={i}
            cornerSide={i % 2 === 0 ? "tr" : "bl"}
          />
        ))}
      </div>
    </div>
  );
}
