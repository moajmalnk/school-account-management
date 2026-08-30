import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { School, IndianRupee, TrendingUp, Activity, CheckCircle2, Clock } from "lucide-react";
import { OrganicCard } from "@/components/ui/organic-card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSuperAdminOverview, type SuperAdminOverview } from "@/lib/api/super-admin";
import { ApiError, getApiToken } from "@/lib/api/client";
import { cn, type Tone, type CornerSide } from "@/lib/utils";

const PLAN_COLORS: Record<string, string> = {
  Basic: "#000000",
  Premium: "#0F766E",
  Enterprise: "#CCFBF1",
};

const EMPTY_OVERVIEW: SuperAdminOverview = {
  totalActiveSchools: 0,
  trialTenants: 0,
  mrr: 0,
  arr: 0,
  systemUptime: 0,
  weeklyRegistrations: [
    { d: "Mon", v: 0 },
    { d: "Tue", v: 0 },
    { d: "Wed", v: 0 },
    { d: "Thu", v: 0 },
    { d: "Fri", v: 0 },
    { d: "Sat", v: 0 },
    { d: "Sun", v: 0 },
  ],
  planDistribution: [
    { name: "Basic", pct: 0, count: 0 },
    { name: "Premium", pct: 0, count: 0 },
    { name: "Enterprise", pct: 0, count: 0 },
  ],
  recentRegistrations: [],
};

function formatInr(n: number) {
  return `₹ ${Math.round(n).toLocaleString("en-IN")}`;
}

function formatRelativeTime(raw: string) {
  const t = Date.parse(raw.includes("T") ? raw : raw.replace(" ", "T"));
  if (!Number.isFinite(t)) return raw;
  const diffMs = Date.now() - t;
  if (diffMs < 0) return raw;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function sparkFromWeekly(weekly: { v: number }[]): number[] {
  const vals = weekly.map((b) => b.v);
  const max = Math.max(1, ...vals);
  return vals.map((v) => Math.max(12, Math.round((v / max) * 100)));
}

function MetricCard({
  label,
  value,
  sub,
  tone = "white",
  cornerSide = "tr",
  icon: Icon,
  spark,
  heartbeat,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  tone?: Tone;
  cornerSide?: CornerSide;
  icon: React.ComponentType<{ className?: string }>;
  spark?: number[];
  heartbeat?: boolean;
}) {
  const isLime = tone === "lime";
  const isBlack = tone === "black";
  const accentBg = isLime ? "bg-white" : isBlack ? "bg-[#0F766E]" : "bg-[#0F172A]";
  const accentFg = isLime ? "text-[#0F766E]" : isBlack ? "text-white" : "text-white";

  return (
    <OrganicCard tone={tone} cornerSide={cornerSide} arrow padded>
      <div
        className={`text-[12px] font-medium ${isLime ? "text-white/75" : isBlack ? "text-white/75" : "text-black/55"}`}
      >
        {label}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${accentBg} ${accentFg}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <div
            className={`font-mono text-[28px] font-semibold tracking-tight ${isLime || isBlack ? "text-white" : ""}`}
          >
            {value}
          </div>
          {heartbeat && (
            <span
              className="relative ml-1 inline-block h-2 w-2 rounded-full heartbeat-dot"
              style={{ backgroundColor: isLime ? "#FFFFFF" : "#0F766E" }}
            />
          )}
        </div>
      </div>
      {sub && (
        <div className={`mt-1 text-[12px] ${isLime || isBlack ? "text-white/70" : ""}`}>{sub}</div>
      )}
      {spark && (
        <div className="mt-4 flex h-10 items-end gap-1">
          {spark.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-md"
              style={{
                height: `${v}%`,
                backgroundColor: isLime ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.08)",
              }}
            >
              <div
                className="h-full w-full rounded-md"
                style={{
                  background: isLime
                    ? "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.25))"
                    : "linear-gradient(180deg, rgba(15,118,110,0.65), #0F766E)",
                }}
              />
            </div>
          ))}
        </div>
      )}
    </OrganicCard>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6" aria-busy="true" aria-label="Loading overview">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-black/[0.07]" />
        <Skeleton className="h-4 w-80 bg-black/[0.05]" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-3xl bg-black/[0.06]" />
        ))}
      </div>
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-3xl bg-black/[0.06] lg:col-span-2" />
        <Skeleton className="h-64 rounded-3xl bg-black/[0.06]" />
      </div>
      <Skeleton className="h-56 rounded-3xl bg-black/[0.06]" />
    </div>
  );
}

export function OverviewView() {
  const [data, setData] = useState<SuperAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!getApiToken()) throw new ApiError("Not authenticated", 401);
        const overview = await fetchSuperAdminOverview();
        if (!cancelled) setData(overview);
      } catch {
        if (!cancelled) setData(EMPTY_OVERVIEW);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const overview = data ?? EMPTY_OVERVIEW;
  const weeklyBars = overview.weeklyRegistrations?.length
    ? overview.weeklyRegistrations
    : EMPTY_OVERVIEW.weeklyRegistrations;
  const peakIdx = useMemo(
    () => weeklyBars.reduce((m, b, i, a) => (b.v > a[m].v ? i : m), 0),
    [weeklyBars],
  );
  const weekTotal = useMemo(() => weeklyBars.reduce((s, b) => s + b.v, 0), [weeklyBars]);
  const maxBar = Math.max(1, ...weeklyBars.map((b) => b.v));
  const spark = sparkFromWeekly(weeklyBars);
  const planRows = overview.planDistribution?.length
    ? overview.planDistribution
    : EMPTY_OVERVIEW.planDistribution;
  const totalTenants = planRows.reduce((s, p) => s + p.count, 0);
  const trialCount = overview.trialTenants ?? 0;

  if (loading) return <OverviewSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-heading">Platform Control Overview</h1>
          <p className="mt-2 text-[14px] text-black/55">
            {trialCount > 0 ? (
              <>
                You have <span className="font-semibold text-black">{trialCount} trial</span> tenant
                {trialCount === 1 ? "" : "s"} on the platform.
              </>
            ) : (
              <>Live metrics from your provisioned school tenants.</>
            )}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            className="min-h-11 w-full rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-[12.5px] font-medium text-black/75 transition-colors hover:bg-[#F4F4F5] sm:min-h-0 sm:w-auto"
          >
            Last 7 days
          </button>
          <Link
            to="/super-admin/tenants"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-black px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-colors hover:bg-black/85 sm:min-h-0 sm:w-auto"
          >
            Manage Tenants
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Active Schools"
          value={String(overview.totalActiveSchools)}
          icon={School}
          cornerSide="tr"
          spark={spark}
          sub={
            <span className="font-medium text-black/65">
              {totalTenants} total tenant{totalTenants === 1 ? "" : "s"}
            </span>
          }
        />
        <MetricCard
          label="Monthly Recurring Revenue"
          value={formatInr(overview.mrr)}
          icon={IndianRupee}
          tone="lime"
          cornerSide="bl"
          spark={spark}
          sub={<span className="font-medium">MRR · billed in INR</span>}
        />
        <MetricCard
          label="Annual Recurring Revenue"
          value={formatInr(overview.arr)}
          icon={TrendingUp}
          cornerSide="tr"
          spark={spark}
          sub={<span className="font-medium text-black/65">Projected ARR</span>}
        />
        <MetricCard
          label="System Processing Load"
          value={`${Number(overview.systemUptime || 0).toFixed(2)}%`}
          icon={Activity}
          tone="black"
          cornerSide="bl"
          heartbeat
          sub={<span className="font-medium text-white/70">Uptime · last 90d</span>}
        />
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <OrganicCard tone="white" cornerSide="tr" arrow padded className="lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-title">Weekly Registrations</div>
              <div className="mt-1 text-[13px] text-black/55">
                New tenant signups
                {weekTotal > 0 ? ` · peak on ${weeklyBars[peakIdx]?.d}` : ""}
              </div>
            </div>
            <div className="font-mono text-[12px] text-black/45">
              {weekTotal > 0 ? `+${weekTotal} this week` : "0 this week"}
            </div>
          </div>
          <div className="mt-6 flex h-44 items-end gap-3">
            {weeklyBars.map((b, i) => {
              const isPeak = weekTotal > 0 && i === peakIdx;
              const heightPct = Math.max(6, Math.round((b.v / maxBar) * 100));
              return (
                <div key={`${b.d}-${i}`} className="flex flex-1 flex-col items-center gap-2">
                  <div className="font-mono text-[10px] text-black/45">{b.v}</div>
                  <div
                    className="relative w-full overflow-hidden rounded-t-xl"
                    style={{ height: `${heightPct}%` }}
                  >
                    <div
                      className="absolute inset-0 rounded-t-xl"
                      style={{
                        background: isPeak
                          ? "linear-gradient(180deg,#0F766E 0%, #CCFBF1 100%)"
                          : "linear-gradient(180deg,#000000 0%, #1F1F1F 100%)",
                      }}
                    />
                    {isPeak && (
                      <div
                        className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-4 ring-[#0F766E]/30"
                        style={{ backgroundColor: "#000000" }}
                      />
                    )}
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-wider text-black/45">
                    {b.d}
                  </div>
                </div>
              );
            })}
          </div>
        </OrganicCard>

        <OrganicCard tone="white" cornerSide="bl" arrow padded>
          <div className="text-title">Plan Distribution</div>
          <div className="mt-1 text-[13px] text-black/55">
            Across {totalTenants} tenant{totalTenants === 1 ? "" : "s"}
          </div>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-[#F4F4F5]">
            {planRows.map((p) => (
              <div
                key={p.name}
                className={cn("h-full", p.count === 0 && "min-w-0")}
                style={{
                  width: `${p.pct}%`,
                  backgroundColor: PLAN_COLORS[p.name] ?? "#94A3B8",
                }}
              />
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {planRows.map((p) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full ring-2 ring-black/5"
                    style={{ backgroundColor: PLAN_COLORS[p.name] ?? "#94A3B8" }}
                  />
                  <span className="text-[13.5px] font-medium text-black">{p.name}</span>
                </div>
                <div className="font-mono text-[12px] text-black/55">
                  {p.count} <span className="text-black/40">/ {p.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </OrganicCard>
      </div>

      <OrganicCard tone="white" cornerSide="tr" arrow padded>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-title">Recent Registrations</div>
            <div className="mt-1 text-[13px] text-black/55">
              Latest tenant signups · provisioning pipeline
            </div>
          </div>
          <Link
            to="/super-admin/tenants"
            className="rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-medium text-black hover:bg-black hover:text-white"
          >
            View all →
          </Link>
        </div>
        <div className="mt-4 divide-y divide-[#F0F0F0]">
          {overview.recentRegistrations.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-black/45">
              No tenants provisioned yet.
            </div>
          ) : (
            overview.recentRegistrations.map((r) => (
              <div
                key={`${r.domain}-${r.time}`}
                className="flex items-center justify-between py-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#F4F4F5] text-black/65">
                    <School className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-medium text-black">{r.name}</div>
                    <div className="font-mono text-[11px] text-black/55">{r.domain}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="hidden items-center gap-1.5 text-[12px] text-black/65 md:flex">
                    {r.step === "Live" || r.step === "Provisioned" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-black" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-black/50" />
                    )}
                    {r.step}
                  </span>
                  <span className="rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 font-mono text-[10px] text-black/65">
                    {r.flag}
                  </span>
                  <span className="font-mono text-[11px] text-black/45">
                    {formatRelativeTime(r.time)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </OrganicCard>
    </div>
  );
}
