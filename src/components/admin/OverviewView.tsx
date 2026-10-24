import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Eye,
  IndianRupee,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  Minus,
  School,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OrganicCard } from "@/components/ui/organic-card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSuperAdminOverview, type SuperAdminOverview } from "@/lib/api/super-admin";
import { ApiError, getApiToken } from "@/lib/api/client";
import { formatAbsoluteAppTime, formatRelativeAppTime } from "@/lib/dates";
import { cn, type Tone, type CornerSide } from "@/lib/utils";
import { formatMoney } from "@/lib/money";

const PLAN_COLORS: Record<string, string> = {
  Basic: "#0F172A",
  Premium: "#0F766E",
  Enterprise: "#5EEAD4",
};

const STATUS_COLORS: Record<string, string> = {
  Active: "#059669",
  Trial: "#7C3AED",
  Overdue: "#D97706",
  Suspended: "#64748B",
};

const EMPTY_OVERVIEW: SuperAdminOverview = {
  totalActiveSchools: 0,
  totalTenants: 0,
  trialTenants: 0,
  activePaying: 0,
  mrr: 0,
  arr: 0,
  systemUptime: 0,
  weekGrowthPct: 0,
  monthGrowthPct: 0,
  thisWeekSignups: 0,
  prevWeekSignups: 0,
  thisMonthSignups: 0,
  lastMonthSignups: 0,
  conversionPct: 0,
  enrolledStudents: 0,
  totalSeats: 0,
  seatUtilizationPct: 0,
  weeklyRegistrations: [
    { d: "Mon", v: 0 },
    { d: "Tue", v: 0 },
    { d: "Wed", v: 0 },
    { d: "Thu", v: 0 },
    { d: "Fri", v: 0 },
    { d: "Sat", v: 0 },
    { d: "Sun", v: 0 },
  ],
  monthlyGrowth: [],
  statusBreakdown: [
    { name: "Active", count: 0, tone: "emerald" },
    { name: "Trial", count: 0, tone: "violet" },
    { name: "Overdue", count: 0, tone: "amber" },
    { name: "Suspended", count: 0, tone: "slate" },
  ],
  planDistribution: [
    { name: "Basic", pct: 0, count: 0 },
    { name: "Premium", pct: 0, count: 0 },
    { name: "Enterprise", pct: 0, count: 0 },
  ],
  mrrByPlan: [
    { name: "Basic", count: 0, mrr: 0, pct: 0 },
    { name: "Premium", count: 0, mrr: 0, pct: 0 },
    { name: "Enterprise", count: 0, mrr: 0, pct: 0 },
  ],
  recentRegistrations: [],
};

function formatInr(n: number) {
  return formatMoney(Math.round(n), "INR");
}

function logoutReasonLabel(reason?: string | null) {
  if (!reason) return "ended";
  if (reason === "logout") return "signed out";
  if (reason === "expired") return "session expired";
  if (reason === "replaced") return "replaced device";
  return reason.replace(/_/g, " ");
}

function loginMethodMeta(method?: string | null): {
  label: string;
  cls: string;
  Icon: typeof Mail | typeof KeyRound;
} | null {
  const m = (method ?? "").toLowerCase();
  if (m === "google") {
    return { label: "Google", cls: "bg-sky-50 text-sky-800", Icon: KeyRound };
  }
  if (m === "password" || m === "email") {
    return { label: "Email & password", cls: "bg-violet-50 text-violet-800", Icon: Mail };
  }
  return null;
}

function GrowthBadge({ pct, label }: { pct: number; label?: string }) {
  const up = pct > 0;
  const flat = pct === 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        flat && "bg-slate-100 text-slate-600",
        up && "bg-emerald-50 text-emerald-700",
        !up && !flat && "bg-rose-50 text-rose-700",
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.25} />
      {flat ? "0%" : `${up ? "+" : ""}${pct}%`}
      {label ? <span className="ml-0.5 font-medium opacity-70">{label}</span> : null}
    </span>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  valueLabel = "value",
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; color?: string }>;
  label?: string;
  valueLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 shadow-lg">
      {label ? <div className="text-[11px] font-medium text-black/45">{label}</div> : null}
      <div className="mt-0.5 space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-[12.5px] font-semibold text-black">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: p.color ?? "#0F766E" }}
            />
            {p.name ?? valueLabel}: {p.value ?? 0}
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  tone = "white",
  cornerSide = "tr",
  icon: Icon,
  badge,
  spark,
  heartbeat,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  tone?: Tone;
  cornerSide?: CornerSide;
  icon: React.ComponentType<{ className?: string }>;
  badge?: ReactNode;
  spark?: number[];
  heartbeat?: boolean;
}) {
  const isLime = tone === "lime";
  const isBlack = tone === "black";
  const accentBg = isLime ? "bg-white" : isBlack ? "bg-[#0F766E]" : "bg-[#0F172A]";
  const accentFg = isLime ? "text-[#0F766E]" : isBlack ? "text-white" : "text-white";

  return (
    <OrganicCard tone={tone} cornerSide={cornerSide} arrow padded>
      <div className="flex items-start justify-between gap-2">
        <div
          className={`text-[12px] font-medium ${isLime ? "text-white/75" : isBlack ? "text-white/75" : "text-black/55"}`}
        >
          {label}
        </div>
        {badge}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${accentBg} ${accentFg}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex min-w-0 flex-wrap items-baseline gap-1.5">
          <div
            className={`font-mono text-[26px] font-semibold tracking-tight sm:text-[28px] ${isLime || isBlack ? "text-white" : ""}`}
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
        <div className={`mt-1 text-[12px] ${isLime || isBlack ? "text-white/70" : "text-black/55"}`}>
          {sub}
        </div>
      )}
      {spark && spark.length > 0 && (
        <div className="mt-4 flex h-9 items-end gap-1">
          {spark.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${Math.max(8, v)}%`,
                background: isLime
                  ? "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.2))"
                  : isBlack
                    ? "linear-gradient(180deg, rgba(94,234,212,0.7), #0F766E)"
                    : "linear-gradient(180deg, rgba(15,118,110,0.55), #0F766E)",
              }}
            />
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
          <Skeleton key={i} className="h-44 rounded-3xl bg-black/[0.06]" />
        ))}
      </div>
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-3xl bg-black/[0.06] lg:col-span-2" />
        <Skeleton className="h-72 rounded-3xl bg-black/[0.06]" />
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
  const weekTotal = useMemo(() => weeklyBars.reduce((s, b) => s + b.v, 0), [weeklyBars]);
  const peakIdx = useMemo(
    () => weeklyBars.reduce((m, b, i, a) => (b.v > a[m].v ? i : m), 0),
    [weeklyBars],
  );
  const spark = useMemo(() => {
    const max = Math.max(1, ...weeklyBars.map((b) => b.v));
    return weeklyBars.map((b) => Math.max(10, Math.round((b.v / max) * 100)));
  }, [weeklyBars]);

  const monthly = overview.monthlyGrowth?.length ? overview.monthlyGrowth : [];
  const planRows = overview.planDistribution?.length
    ? overview.planDistribution
    : EMPTY_OVERVIEW.planDistribution;
  const mrrPlan = overview.mrrByPlan?.length ? overview.mrrByPlan : EMPTY_OVERVIEW.mrrByPlan!;
  const statusRows = overview.statusBreakdown?.length
    ? overview.statusBreakdown
    : EMPTY_OVERVIEW.statusBreakdown!;
  const statusTotal = statusRows.reduce((s, r) => s + r.count, 0) || 1;
  const totalTenants = overview.totalTenants ?? planRows.reduce((s, p) => s + p.count, 0);
  const trialCount = overview.trialTenants ?? 0;
  const seatPct = overview.seatUtilizationPct ?? 0;
  const enrolled = overview.enrolledStudents ?? 0;
  const seats = overview.totalSeats ?? 0;

  const pieData = planRows.filter((p) => p.count > 0).map((p) => ({
    name: p.name,
    value: p.count,
  }));

  if (loading) return <OverviewSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-heading">Platform Control Overview</h1>
          <p className="mt-2 text-[14px] text-black/55">
            {totalTenants} tenant{totalTenants === 1 ? "" : "s"}
            {trialCount > 0 ? (
              <>
                {" "}
                · <span className="font-semibold text-black">{trialCount} on trial</span>
              </>
            ) : null}
            {overview.thisMonthSignups ? (
              <>
                {" "}
                · {overview.thisMonthSignups} new this month
              </>
            ) : null}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <span className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-[12.5px] font-medium text-black/70 sm:min-h-0 sm:w-auto">
            Live · last 7 days + 6 mo growth
          </span>
          <Link
            to="/super-admin/tenants"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-black px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-colors hover:bg-black/85 sm:min-h-0 sm:w-auto"
          >
            Manage Tenants
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Active Schools"
          value={String(overview.totalActiveSchools)}
          icon={School}
          cornerSide="tr"
          spark={spark}
          badge={<GrowthBadge pct={overview.weekGrowthPct ?? 0} label="WoW" />}
          sub={
            <span>
              {overview.activePaying ?? 0} paying · {trialCount} trial
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
          badge={
            <GrowthBadge pct={overview.monthGrowthPct ?? 0} label="MoM" />
          }
          sub={<span>ARR {formatInr(overview.arr)}</span>}
        />
        <MetricCard
          label="Seat Utilization"
          value={`${seatPct}%`}
          icon={Users}
          cornerSide="tr"
          spark={spark}
          sub={
            <span>
              {enrolled.toLocaleString("en-IN")} / {seats.toLocaleString("en-IN")} seats
            </span>
          }
        />
        <MetricCard
          label="Trial → Active"
          value={`${overview.conversionPct ?? 0}%`}
          icon={Activity}
          tone="black"
          cornerSide="bl"
          heartbeat
          sub={
            <span>
              Uptime {Number(overview.systemUptime || 0).toFixed(2)}% · 90d
            </span>
          }
        />
      </div>

      {/* Growth + weekly */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-5">
        <OrganicCard tone="white" cornerSide="tr" padded className="lg:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-title">Platform Growth</div>
              <div className="mt-1 text-[13px] text-black/55">
                New tenants vs cumulative base · last 6 months
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-black/50">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#0F766E]" /> New
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#0F172A]/35" /> Total
              </span>
            </div>
          </div>
          <div className="mt-4 h-56 w-full sm:h-64">
            {monthly.length === 0 ? (
              <div className="grid h-full place-items-center text-[13px] text-black/40">
                No growth history yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mktNewFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0F766E" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#0F766E" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="mktTotalFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0F172A" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#0F172A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
                  <XAxis
                    dataKey="m"
                    tick={{ fontSize: 11, fill: "rgba(0,0,0,0.45)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "rgba(0,0,0,0.4)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total"
                    stroke="#0F172A"
                    strokeWidth={1.5}
                    fill="url(#mktTotalFill)"
                    strokeOpacity={0.45}
                  />
                  <Area
                    type="monotone"
                    dataKey="new"
                    name="New"
                    stroke="#0F766E"
                    strokeWidth={2.25}
                    fill="url(#mktNewFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </OrganicCard>

        <OrganicCard tone="white" cornerSide="bl" padded className="lg:col-span-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-title">Weekly Signups</div>
              <div className="mt-1 text-[13px] text-black/55">
                {weekTotal > 0 ? `Peak ${weeklyBars[peakIdx]?.d}` : "Last 7 days"}
              </div>
            </div>
            <GrowthBadge pct={overview.weekGrowthPct ?? 0} />
          </div>
          <div className="mt-3 font-mono text-[22px] font-semibold tracking-tight text-black">
            +{weekTotal}
            <span className="ml-1.5 text-[12px] font-medium text-black/45">this week</span>
          </div>
          <div className="mt-2 h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyBars} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis
                  dataKey="d"
                  tick={{ fontSize: 10, fill: "rgba(0,0,0,0.4)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip content={<ChartTooltip valueLabel="Signups" />} />
                <Bar dataKey="v" name="Signups" radius={[6, 6, 2, 2]} maxBarSize={28}>
                  {weeklyBars.map((b, i) => (
                    <Cell
                      key={b.d + i}
                      fill={weekTotal > 0 && i === peakIdx ? "#0F766E" : "#0F172A"}
                      fillOpacity={weekTotal > 0 && i === peakIdx ? 1 : 0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-black/45">
            <span>Prev week: {overview.prevWeekSignups ?? 0}</span>
            <span>This month: {overview.thisMonthSignups ?? 0}</span>
          </div>
        </OrganicCard>
      </div>

      {/* Mix diagrams */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <OrganicCard tone="white" cornerSide="tr" padded>
          <div className="text-title">Plan Mix</div>
          <div className="mt-1 text-[13px] text-black/55">
            Across {totalTenants} tenant{totalTenants === 1 ? "" : "s"}
          </div>
          <div className="mt-2 flex items-center gap-4">
            <div className="h-36 w-36 shrink-0">
              {pieData.length === 0 ? (
                <div className="grid h-full place-items-center text-[12px] text-black/35">—</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={38}
                      outerRadius={58}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {pieData.map((p) => (
                        <Cell key={p.name} fill={PLAN_COLORS[p.name] ?? "#94A3B8"} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip valueLabel="Tenants" />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2.5">
              {planRows.map((p) => (
                <div key={p.name} className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: PLAN_COLORS[p.name] }}
                    />
                    <span className="truncate text-[13px] font-medium text-black">{p.name}</span>
                  </div>
                  <span className="font-mono text-[12px] text-black/55">
                    {p.count} · {p.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </OrganicCard>

        <OrganicCard tone="white" cornerSide="bl" padded>
          <div className="text-title">MRR by Plan</div>
          <div className="mt-1 text-[13px] text-black/55">Revenue contribution</div>
          <div className="mt-5 space-y-4">
            {mrrPlan.map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-medium text-black">{p.name}</span>
                  <span className="font-mono text-black/60">
                    {formatInr(p.mrr)} · {p.pct}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#F4F4F5]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(p.pct > 0 ? 4 : 0, p.pct)}%`,
                      backgroundColor: PLAN_COLORS[p.name],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-[#F8FAFC] px-3 py-2.5 font-mono text-[12px] text-black/55">
            Total MRR <span className="font-semibold text-black">{formatInr(overview.mrr)}</span>
          </div>
        </OrganicCard>

        <OrganicCard tone="white" cornerSide="tr" padded>
          <div className="text-title">Tenant Health</div>
          <div className="mt-1 text-[13px] text-black/55">Lifecycle status</div>
          <div className="mt-5 space-y-3">
            {statusRows.map((s) => {
              const pct = Math.round((s.count / statusTotal) * 100);
              return (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="flex items-center gap-2 font-medium text-black">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: STATUS_COLORS[s.name] ?? "#94A3B8" }}
                      />
                      {s.name}
                    </span>
                    <span className="font-mono text-black/55">
                      {s.count} · {pct}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#F4F4F5]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(pct > 0 ? 3 : 0, pct)}%`,
                        background: STATUS_COLORS[s.name] ?? "#94A3B8",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-emerald-50/80 px-3 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/70">
                Paying
              </div>
              <div className="mt-0.5 font-mono text-[18px] font-semibold text-emerald-800">
                {overview.activePaying ?? 0}
              </div>
            </div>
            <div className="rounded-xl bg-violet-50/80 px-3 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-violet-700/70">
                Trial
              </div>
              <div className="mt-0.5 font-mono text-[18px] font-semibold text-violet-800">
                {trialCount}
              </div>
            </div>
          </div>
        </OrganicCard>
      </div>

      {/* Recent */}
      <OrganicCard tone="white" cornerSide="tr" arrow padded>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-title">Recent activity</div>
            <div className="mt-1 text-[13px] text-black/55">
              Teams ordered by last seen · online first
            </div>
          </div>
          <Link
            to="/super-admin/tenants"
            className="shrink-0 rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-medium text-black hover:bg-black hover:text-white"
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
            overview.recentRegistrations.map((r) => {
              const signupRel = formatRelativeAppTime(r.time);
              const signupAbs = formatAbsoluteAppTime(r.time);
              const loginRel = formatRelativeAppTime(r.lastLoginAt);
              const logoutRel = formatRelativeAppTime(r.lastLogoutAt);
              const seenRel = formatRelativeAppTime(r.lastSeenAt);
              const loginAbs = formatAbsoluteAppTime(r.lastLoginAt);
              const logoutAbs = formatAbsoluteAppTime(r.lastLogoutAt);
              const seenAbs = formatAbsoluteAppTime(r.lastSeenAt);
              const loginMethod = loginMethodMeta(r.lastLoginMethod);
              const LoginMethodIcon = loginMethod?.Icon;
              return (
                <div key={`${r.domain}-${r.time}`} className="space-y-2.5 py-3.5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#F4F4F5] text-black/65">
                        <School className="h-4 w-4" />
                        {r.onlineNow ? (
                          <span
                            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                            title="Online now"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-[13.5px] font-medium text-black">{r.name}</div>
                          {r.onlineNow ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Online
                              {r.openSessions && r.openSessions > 1 ? ` · ${r.openSessions}` : ""}
                            </span>
                          ) : null}
                        </div>
                        <div className="truncate font-mono text-[11px] text-black/55">{r.domain}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 pl-[3.25rem] sm:pl-0">
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-black/65">
                        {r.step === "Live" || r.step === "Provisioned" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-black/45" />
                        )}
                        {r.step}
                      </span>
                      <span className="rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 font-mono text-[10px] text-black/65">
                        {r.flag}
                      </span>
                      {typeof r.students === "number" ? (
                        <span className="hidden font-mono text-[11px] text-black/45 md:inline">
                          {r.students}/{r.capacity ?? "—"} seats
                        </span>
                      ) : null}
                      <span className="font-mono text-[11px] text-black/45" title="Registered">
                        Joined {signupRel}
                      </span>
                      <Link
                        to="/super-admin/tenants"
                        search={{ tenant: r.id || undefined, tab: "activity" }}
                        className="inline-flex items-center gap-1 rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 text-[11px] font-medium text-black/65 hover:border-black/20 hover:text-black"
                      >
                        More details
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>

                  <div className="grid gap-2 pl-[3.25rem] sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] px-3 py-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                        <UserPlus className="h-3 w-3" /> Signed up
                      </div>
                      {r.time ? (
                        <>
                          <div className="mt-1 text-[12.5px] font-semibold text-black">
                            {signupRel}
                            <span className="ml-1.5 font-mono text-[11px] font-normal text-black/45">
                              {signupAbs}
                            </span>
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-black/55">
                            Workspace created · {r.flag}
                          </div>
                        </>
                      ) : (
                        <div className="mt-1 text-[12px] text-black/40">Signup time unknown</div>
                      )}
                    </div>

                    <div className="rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                          <Eye className="h-3 w-3" /> Last seen
                        </div>
                        <Link
                          to="/super-admin/tenants"
                          search={{ tenant: r.id || undefined, tab: "activity" }}
                          className="text-black/35 hover:text-black/70"
                          aria-label={`Last seen details for ${r.name}`}
                        >
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                      {r.lastSeenAt ? (
                        <>
                          <div className="mt-1 text-[12.5px] font-semibold text-black">
                            {r.onlineNow ? "Now" : seenRel}
                            <span className="ml-1.5 font-mono text-[11px] font-normal text-black/45">
                              {seenAbs}
                            </span>
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-black/55">
                            {[
                              r.lastSeenUser || r.lastSeenEmail,
                              r.lastSeenDevice,
                              r.lastSeenIp,
                              r.onlineNow && r.openSessions
                                ? `${r.openSessions} open session${r.openSessions === 1 ? "" : "s"}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Session heartbeat"}
                          </div>
                        </>
                      ) : (
                        <div className="mt-1 text-[12px] text-black/40">No activity recorded yet</div>
                      )}
                    </div>

                    <div className="rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                          <LogIn className="h-3 w-3" /> Last login
                        </div>
                        <Link
                          to="/super-admin/tenants"
                          search={{ tenant: r.id || undefined, tab: "activity" }}
                          className="text-black/35 hover:text-black/70"
                          aria-label={`Login details for ${r.name}`}
                        >
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                      {r.lastLoginAt ? (
                        <>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] font-semibold text-black">
                            <span>{loginRel}</span>
                            <span className="font-mono text-[11px] font-normal text-black/45">
                              {loginAbs}
                            </span>
                            {loginMethod && LoginMethodIcon ? (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                  loginMethod.cls,
                                )}
                              >
                                <LoginMethodIcon className="h-3 w-3" aria-hidden />
                                {loginMethod.label}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-black/55">
                            {[r.lastLoginUser || r.lastLoginEmail, r.lastLoginDevice, r.lastLoginIp]
                              .filter(Boolean)
                              .join(" · ") || "Workspace user"}
                          </div>
                        </>
                      ) : (
                        <div className="mt-1 text-[12px] text-black/40">No login recorded yet</div>
                      )}
                    </div>

                    <div className="rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                          <LogOut className="h-3 w-3" /> Last logout
                        </div>
                        <Link
                          to="/super-admin/tenants"
                          search={{ tenant: r.id || undefined, tab: "activity" }}
                          className="text-black/35 hover:text-black/70"
                          aria-label={`Logout details for ${r.name}`}
                        >
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                      {r.lastLogoutAt ? (
                        <>
                          <div className="mt-1 text-[12.5px] font-semibold text-black">
                            {logoutRel}
                            <span className="ml-1.5 font-mono text-[11px] font-normal text-black/45">
                              {logoutAbs}
                            </span>
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-black/55">
                            {[
                              r.lastLogoutUser,
                              logoutReasonLabel(r.lastLogoutReason),
                              r.lastLogoutDevice,
                              r.lastLogoutIp,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </>
                      ) : (
                        <div className="mt-1 text-[12px] text-black/40">
                          {r.onlineNow ? "Still signed in" : "No logout recorded yet"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </OrganicCard>
    </div>
  );
}
