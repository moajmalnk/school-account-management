import { School, IndianRupee, TrendingUp, Activity, CheckCircle2, Clock } from "lucide-react";
import { recentRegistrations } from "./data";

const weeklyBars = [
  { d: "Mon", v: 42 },
  { d: "Tue", v: 58 },
  { d: "Wed", v: 74 },
  { d: "Thu", v: 96 },
  { d: "Fri", v: 88 },
  { d: "Sat", v: 51 },
  { d: "Sun", v: 33 },
];
const peakIdx = weeklyBars.reduce((m, b, i, a) => (b.v > a[m].v ? i : m), 0);

function MetricCard({
  label, value, sub, accent, icon: Icon, spark, heartbeat,
}: {
  label: string; value: string; sub?: React.ReactNode; accent: string;
  icon: React.ComponentType<{ className?: string }>; spark?: number[]; heartbeat?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between">
        <div className="text-[12px] font-medium text-slate-500">{label}</div>
        <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundColor: `${accent}1A`, color: accent }}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <div className="font-mono text-[28px] font-semibold tracking-tight text-slate-900">{value}</div>
        {heartbeat && (
          <span className="relative ml-1 inline-block h-2 w-2 rounded-full heartbeat-dot" style={{ backgroundColor: accent }} />
        )}
      </div>
      {sub && <div className="mt-1 text-[12px]">{sub}</div>}
      {spark && (
        <div className="mt-4 flex h-10 items-end gap-1">
          {spark.map((v, i) => (
            <div key={i} className="flex-1 rounded-sm" style={{ height: `${v}%`, backgroundColor: `${accent}33` }}>
              <div className="h-full w-full rounded-sm" style={{ background: `linear-gradient(180deg, ${accent}66, ${accent})`, opacity: 0.6 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OverviewView() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">Platform Control Overview</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            You have <span className="font-semibold" style={{ color: "#F59E0B" }}>3 trial</span> tenants nearing conversion this week.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-slate-700">
            Last 30 days
          </button>
          <button className="rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-sm" style={{ backgroundColor: "#6366F1" }}>
            Export Report
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Active Schools"
          value="142"
          icon={School}
          accent="#6366F1"
          spark={[30, 42, 38, 55, 60, 72, 84]}
          sub={<span className="font-medium" style={{ color: "#10B981" }}>+12% vs last month</span>}
        />
        <MetricCard
          label="Monthly Recurring Revenue"
          value="₹ 8,45,000"
          icon={IndianRupee}
          accent="#10B981"
          spark={[44, 50, 48, 60, 65, 70, 82]}
          sub={<span className="font-medium text-slate-500">MRR · billed in INR</span>}
        />
        <MetricCard
          label="Annual Recurring Revenue"
          value="₹ 1,01,40,000"
          icon={TrendingUp}
          accent="#F59E0B"
          spark={[20, 35, 40, 52, 58, 66, 78]}
          sub={<span className="font-medium text-slate-500">Projected ARR</span>}
        />
        <MetricCard
          label="System Processing Load"
          value="99.98%"
          icon={Activity}
          accent="#10B981"
          heartbeat
          sub={<span className="font-medium text-slate-500">Uptime · last 90d</span>}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Activity Tracker */}
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[13px] font-semibold text-slate-900">Weekly Registration Activity</div>
              <div className="text-[12px] text-slate-500">New tenant signups, peak on {weeklyBars[peakIdx].d}</div>
            </div>
            <div className="font-mono text-[12px] text-slate-400">+24 this week</div>
          </div>
          <div className="mt-6 flex h-44 items-end gap-3">
            {weeklyBars.map((b, i) => {
              const isPeak = i === peakIdx;
              return (
                <div key={b.d} className="flex flex-1 flex-col items-center gap-2">
                  <div className="font-mono text-[10px] text-slate-400">{b.v}</div>
                  <div className="relative w-full overflow-hidden rounded-t-lg" style={{ height: `${b.v}%` }}>
                    <div className="absolute inset-0 rounded-t-lg" style={{
                      background: isPeak
                        ? "linear-gradient(180deg,#6366F1 0%, #818CF8 100%)"
                        : "linear-gradient(180deg,#E0E7FF 0%, #C7D2FE 100%)",
                    }} />
                    {isPeak && (
                      <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full ring-4 ring-indigo-100" style={{ backgroundColor: "#6366F1" }} />
                    )}
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{b.d}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan Breakdown */}
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5">
          <div className="text-[13px] font-semibold text-slate-900">Plan Distribution</div>
          <div className="text-[12px] text-slate-500">Across 142 tenants</div>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full" style={{ width: "30%", backgroundColor: "#10B981" }} />
            <div className="h-full" style={{ width: "55%", backgroundColor: "#6366F1" }} />
            <div className="h-full" style={{ width: "15%", backgroundColor: "#0F172A" }} />
          </div>
          <div className="mt-5 space-y-3">
            {[
              { label: "Basic", pct: 30, count: 43, color: "#10B981" },
              { label: "Premium", pct: 55, count: 78, color: "#6366F1" },
              { label: "Enterprise", pct: 15, count: 21, color: "#0F172A" },
            ].map((p) => (
              <div key={p.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-[13px] font-medium text-slate-700">{p.label}</span>
                </div>
                <div className="font-mono text-[12px] text-slate-500">
                  {p.count} <span className="text-slate-400">/ {p.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-slate-900">Recent Registrations</div>
            <div className="text-[12px] text-slate-500">Latest 5 tenant signups · provisioning pipeline</div>
          </div>
          <button className="text-[12px] font-medium" style={{ color: "#6366F1" }}>View all →</button>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {recentRegistrations.map((r) => (
            <div key={r.domain} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-50 text-slate-500">
                  <School className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-slate-900">{r.name}</div>
                  <div className="font-mono text-[11px] text-slate-500">{r.domain}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden items-center gap-1.5 text-[12px] text-slate-500 md:flex">
                  {r.step === "Provisioned" ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#10B981" }} /> : <Clock className="h-3.5 w-3.5" style={{ color: "#F59E0B" }} />}
                  {r.step}
                </span>
                <span className="rounded-full border border-slate-200 px-2 py-0.5 font-mono text-[10px] text-slate-600">{r.flag}</span>
                <span className="font-mono text-[11px] text-slate-400">{r.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
