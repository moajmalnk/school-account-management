import { Skeleton } from "@/components/ui/skeleton";
import { cn, dashCardClass, glassCardClass } from "@/lib/utils";

const bone = "bg-black/[0.07]";
const boneSoft = "bg-black/[0.05]";

function Bone({ className }: { className?: string }) {
  return <Skeleton className={cn(bone, className)} />;
}

/** Matches Students / Staff directory layout while tenant store hydrates. */
export function TenantDirectorySkeleton({ label = "Loading directory" }: { label?: string }) {
  return (
    <div
      className="w-full min-w-0 max-w-full space-y-3 overflow-x-clip lg:space-y-6"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
    >
      <div className="grid w-full grid-cols-3 divide-x divide-slate-100 overflow-hidden rounded-2xl border border-white/70 bg-white/90 dark:divide-white/10 dark:border-white/10 dark:bg-zinc-900/90 lg:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-2.5 py-2">
            <Bone className="h-7 w-7 shrink-0 rounded-md" />
            <div className="min-w-0 space-y-1">
              <Bone className="h-4 w-8 rounded-md" />
              <Bone className={cn("h-2.5 w-10 rounded-md", boneSoft)} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden w-full grid-cols-3 gap-3 lg:grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              glassCardClass,
              "flex min-h-[4.5rem] flex-col justify-between gap-2 p-3 sm:min-h-[5.5rem] sm:p-4",
              i === 2 && "bg-[#CCFBF1]/25",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <Bone className={cn("h-3 w-12 rounded-md sm:w-16", boneSoft)} />
              <Bone className="h-3.5 w-3.5 rounded-full sm:h-4 sm:w-4" />
            </div>
            <Bone className="h-7 w-10 rounded-md sm:h-8 sm:w-12" />
            {i === 2 ? <Bone className={cn("h-2.5 w-16 rounded-md", boneSoft)} /> : null}
          </div>
        ))}
      </div>

      <div className="flex w-full flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <Bone className="h-5 w-40 rounded-lg sm:h-8 sm:w-64" />
        <div className="flex w-full gap-1.5 sm:w-auto sm:flex-wrap sm:gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone
              key={i}
              className="h-8 min-w-0 flex-1 rounded-full sm:h-10 sm:w-24 sm:flex-none"
            />
          ))}
        </div>
      </div>

      <div className={cn(glassCardClass, "space-y-2 p-2.5 md:space-y-3 md:p-5")}>
        <Bone className="h-9 w-full rounded-lg md:h-10" />
        <div className="grid grid-cols-2 gap-2">
          <Bone className="h-9 w-full rounded-lg md:h-10" />
          <Bone className="h-9 w-full rounded-lg md:h-10" />
        </div>
      </div>

      <div className={cn(glassCardClass, "overflow-hidden")}>
        <div className="hidden border-b border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3 lg:grid lg:grid-cols-[2.5rem_1.4fr_0.9fr_0.7fr_1.3fr_0.8fr] lg:gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bone key={i} className={cn("h-3 w-16 rounded-md", boneSoft)} />
          ))}
        </div>
        <div className="divide-y divide-[#EFEFEF]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3.5 py-3.5 lg:grid lg:grid-cols-[2.5rem_1.4fr_0.9fr_0.7fr_1.3fr_0.8fr] lg:gap-3"
            >
              <Bone className="hidden h-4 w-4 rounded-sm lg:block" />
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Bone className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Bone className="h-3.5 w-[55%] rounded-md" />
                  <Bone className={cn("h-3 w-[35%] rounded-md", boneSoft)} />
                </div>
              </div>
              <Bone className="hidden h-6 w-20 rounded-full lg:block" />
              <Bone className="hidden h-6 w-16 rounded-full lg:block" />
              <div className="hidden space-y-1.5 lg:block">
                <Bone className="h-3.5 w-[70%] rounded-md" />
                <Bone className={cn("h-3 w-[50%] rounded-md", boneSoft)} />
              </div>
              <Bone className="hidden h-6 w-14 rounded-full justify-self-end lg:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mirrors PremiumDashboard card grid while tenant + finance data loads. */
export function TenantDashboardSkeleton() {
  return (
    <div
      className="space-y-4 sm:space-y-6"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading dashboard"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-teal-500/20 bg-teal-500/5 px-3.5 py-2.5">
        <Bone className={cn("h-3.5 w-40 rounded-md", boneSoft)} />
        <Bone className={cn("h-3 w-28 rounded-md", boneSoft)} />
      </div>

      <div className="space-y-4 sm:space-y-5">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-12">
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:col-span-8">
            {/* School Overview */}
            <section className={cn(dashCardClass, "flex min-w-0 flex-col p-4 sm:p-5")}>
              <Bone className="h-4 w-32 rounded-md" />
              <div className="mt-4 grid min-w-0 flex-1 grid-cols-2 gap-2 sm:gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex min-h-[120px] flex-col justify-between rounded-2xl bg-white/55 p-3 sm:min-h-[128px] sm:p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Bone className={cn("h-3 w-20 rounded-md", boneSoft)} />
                      <Bone className="h-8 w-8 rounded-full" />
                    </div>
                    <div className="flex flex-col items-center gap-1.5 py-2">
                      <Bone className="h-9 w-12 rounded-md" />
                      <Bone className={cn("h-2.5 w-24 rounded-md", boneSoft)} />
                    </div>
                  </div>
                ))}
              </div>
              <Bone className="mt-3 h-11 w-full rounded-full" />
            </section>

            {/* Financial Summary */}
            <section className={cn(dashCardClass, "flex min-w-0 flex-col p-4 sm:p-5")}>
              <div className="flex items-center justify-between gap-2">
                <Bone className="h-4 w-36 rounded-md" />
                <Bone className="h-8 w-24 rounded-full" />
              </div>
              <div className="mt-4 grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                <div className="rounded-2xl bg-emerald-500/20 p-4">
                  <Bone className="mx-auto h-3 w-24 rounded-md bg-white/30" />
                  <Bone className="mx-auto mt-3 h-8 w-20 rounded-md bg-white/40" />
                </div>
                <div className="rounded-2xl bg-rose-500/20 p-4">
                  <Bone className="mx-auto h-3 w-24 rounded-md bg-white/30" />
                  <Bone className="mx-auto mt-3 h-8 w-20 rounded-md bg-white/40" />
                </div>
              </div>
            </section>

            {/* Outstanding */}
            <section className={cn(dashCardClass, "flex min-w-0 flex-col p-4 sm:p-5")}>
              <Bone className="h-4 w-40 rounded-md" />
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white/55 p-3.5">
                    <Bone className={cn("h-3 w-24 rounded-md", boneSoft)} />
                    <Bone className={cn("mt-1 h-2.5 w-16 rounded-md", boneSoft)} />
                    <Bone className="mt-3 h-7 w-20 rounded-md" />
                  </div>
                ))}
              </div>
            </section>

            {/* Cash Position */}
            <section className={cn(dashCardClass, "flex min-w-0 flex-col p-4 sm:p-5")}>
              <Bone className="h-4 w-28 rounded-md" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <Bone className={cn("h-3 w-24 rounded-md", boneSoft)} />
                    <Bone className="h-5 w-16 rounded-md" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right column: actions + todo */}
          <div className="flex min-w-0 flex-col gap-4 sm:gap-5 xl:col-span-4">
            <div className="grid grid-cols-2 gap-3">
              <div className={cn(dashCardClass, "flex min-h-[88px] flex-col justify-between p-4")}>
                <Bone className="h-8 w-8 rounded-full" />
                <Bone className="h-3.5 w-20 rounded-md" />
              </div>
              <div className={cn(dashCardClass, "flex min-h-[88px] flex-col justify-between p-4")}>
                <Bone className="h-8 w-8 rounded-full" />
                <Bone className="h-3.5 w-20 rounded-md" />
              </div>
            </div>
            <section className={cn(dashCardClass, "flex min-h-[280px] flex-1 flex-col p-4 sm:p-5")}>
              <div className="flex items-center justify-between gap-2">
                <Bone className="h-4 w-24 rounded-md" />
                <Bone className="h-8 w-16 rounded-xl" />
              </div>
              <div className="mt-4 space-y-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Bone className="h-4 w-4 rounded-full" />
                    <Bone className="h-9 flex-1 rounded-xl" />
                    <Bone className="h-8 w-8 rounded-xl" />
                  </div>
                ))}
              </div>
              <div className="mt-5 flex-1 rounded-2xl border border-white/60 bg-white/50 p-3.5">
                <Bone className="h-4 w-16 rounded-md" />
                <Bone className="mt-3 h-16 w-full rounded-xl" />
              </div>
            </section>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <section
              key={i}
              className={cn(dashCardClass, "flex min-h-[220px] flex-col p-4 sm:p-5 xl:col-span-4")}
            >
              <Bone className="h-4 w-36 rounded-md" />
              <Bone className="mt-4 h-36 w-full rounded-xl" />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Matches Settings list panels (vehicles, departments, class tier, etc.) while data loads. */
export function TenantSettingsListSkeleton({
  label = "Loading settings",
  layout = "table",
}: {
  label?: string;
  layout?: "cards" | "table";
}) {
  return (
    <div
      className={cn(glassCardClass, "rounded-2xl p-4 sm:p-5")}
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Bone className="h-5 w-44 rounded-md sm:h-6 sm:w-52" />
          <Bone className={cn("h-3 w-56 max-w-full rounded-md", boneSoft)} />
        </div>
        <Bone className="h-9 w-20 shrink-0 rounded-full" />
      </div>

      {layout === "cards" ? (
        <div className="mt-4 space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5 dark:border-white/10 dark:bg-zinc-900/70"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Bone className="h-10 w-10 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Bone className="h-3.5 w-[55%] rounded-md" />
                    <Bone className={cn("h-3 w-[40%] rounded-md", boneSoft)} />
                  </div>
                </div>
                <Bone className="h-5 w-14 rounded-full" />
              </div>
              <div className="mt-2.5 flex gap-2">
                <Bone className={cn("h-3 w-20 rounded-md", boneSoft)} />
                <Bone className={cn("h-3 w-16 rounded-md", boneSoft)} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-[#EFEFEF] dark:border-white/10">
          <div className="border-b border-[#EFEFEF] bg-[#F4F4F5] px-3.5 py-2 dark:border-white/10 dark:bg-zinc-900">
            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <Bone key={i} className={cn("h-2.5 rounded-md", boneSoft)} />
              ))}
            </div>
          </div>
          <div className="divide-y divide-[#EFEFEF] dark:divide-white/10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid grid-cols-7 items-center gap-3 px-3.5 py-3">
                <div className="col-span-2 flex items-center gap-2">
                  <Bone className="h-3.5 w-3.5 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Bone className="h-3.5 w-[70%] rounded-md" />
                    <Bone className={cn("h-2.5 w-[45%] rounded-md", boneSoft)} />
                  </div>
                </div>
                <Bone className={cn("h-3 w-16 rounded-md", boneSoft)} />
                <Bone className={cn("ml-auto h-3 w-6 rounded-md", boneSoft)} />
                <Bone className="h-5 w-14 rounded-full" />
                <Bone className={cn("h-3 w-24 rounded-md", boneSoft)} />
                <Bone className="h-5 w-16 justify-self-end rounded-full" />
                <div className="flex justify-end gap-1">
                  <Bone className="h-8 w-8 rounded-full" />
                  <Bone className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Matches Settings → System (financial years + navigation) while tenant store hydrates. */
export function TenantSystemSkeleton() {
  return (
    <div
      className="grid grid-cols-12 gap-3 sm:gap-4 lg:gap-5"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading system settings"
    >
      <section className={cn(glassCardClass, "col-span-12 rounded-2xl p-4 sm:p-5")}>
        <div className="space-y-2">
          <Bone className="h-5 w-44 rounded-md sm:h-6 sm:w-52" />
          <Bone className={cn("h-3 w-64 max-w-full rounded-md sm:w-80", boneSoft)} />
        </div>

        <div className="mt-4 grid grid-cols-12 gap-3">
          <div className="col-span-12 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5 lg:col-span-8 dark:border-white/10 dark:bg-zinc-900/40">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1.5">
                <Bone className="h-3 w-28 rounded-md" />
                <Bone className={cn("h-2.5 w-56 max-w-full rounded-md", boneSoft)} />
              </div>
              <Bone className={cn("h-2.5 w-24 rounded-md", boneSoft)} />
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white dark:border-white/10 dark:bg-zinc-950/40">
              <div className="hidden border-b border-[#EFEFEF] bg-[#F8FAFC] px-3 py-2 dark:border-white/10 dark:bg-zinc-900 sm:block">
                <div className="grid grid-cols-[minmax(0,1.2fr)_7.5rem_minmax(0,1fr)] gap-2">
                  <Bone className={cn("h-2.5 w-10 rounded-md", boneSoft)} />
                  <Bone className={cn("h-2.5 w-12 rounded-md", boneSoft)} />
                  <Bone className={cn("ml-auto h-2.5 w-14 rounded-md", boneSoft)} />
                </div>
              </div>
              <ul className="divide-y divide-[#EFEFEF] dark:divide-white/10">
                {Array.from({ length: 3 }).map((_, i) => (
                  <li
                    key={i}
                    className="flex flex-col gap-2.5 px-3 py-3 sm:grid sm:grid-cols-[minmax(0,1.2fr)_7.5rem_minmax(0,1fr)] sm:items-center sm:gap-2"
                  >
                    <Bone className="h-3.5 w-28 rounded-md" />
                    <Bone className="h-5 w-20 rounded-full" />
                    <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                      <Bone className="h-8 w-16 rounded-full" />
                      <Bone className="h-8 w-16 rounded-full" />
                      <Bone className="h-8 w-14 rounded-full" />
                      <Bone className="h-8 w-16 rounded-full" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Bone className="h-10 min-w-0 flex-1 rounded-lg" />
              <Bone className="h-10 w-28 shrink-0 rounded-full" />
            </div>
          </div>

          <div className="col-span-12 hidden rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5 lg:col-span-4 lg:block dark:border-white/10 dark:bg-zinc-900/40">
            <Bone className="h-3 w-24 rounded-md" />
            <Bone className="mt-3 h-10 w-full rounded-lg" />
          </div>
        </div>
      </section>
    </div>
  );
}
