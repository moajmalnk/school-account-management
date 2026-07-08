import { School, IndianRupee, TrendingUp, Activity, CheckCircle2, Clock } from "lucide-react";
import { recentRegistrations } from "./data";
import { OrganicCard } from "@/components/ui/organic-card";
import type { Tone, CornerSide } from "@/lib/utils";

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
  const accentBg = isLime ? "bg-white" : isBlack ? "bg-[#2563EB]" : "bg-[#0F172A]";
  const accentFg = isLime ? "text-[#2563EB]" : isBlack ? "text-white" : "text-white";

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
              style={{ backgroundColor: isLime ? "#FFFFFF" : "#2563EB" }}
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
                    : "linear-gradient(180deg, rgba(37,99,235,0.65), #2563EB)",
                }}
              />
            </div>
          ))}
        </div>
      )}
    </OrganicCard>
  );
}

export function OverviewView() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-heading">Platform Control Overview</h1>
          <p className="mt-2 text-[14px] text-black/55">
            You have <span className="font-semibold text-black">3 trial</span> tenants nearing
            conversion this week.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button className="min-h-11 w-full rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-[12.5px] font-medium text-black/75 transition-colors hover:bg-[#F4F4F5] sm:min-h-0 sm:w-auto">
            Last 30 days
          </button>
          <button className="min-h-11 w-full rounded-full bg-black px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-colors hover:bg-black/85 sm:min-h-0 sm:w-auto">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Active Schools"
          value="142"
          icon={School}
          cornerSide="tr"
          spark={[30, 42, 38, 55, 60, 72, 84]}
          sub={<span className="font-medium text-black/65">+12% vs last month</span>}
        />
        <MetricCard
          label="Monthly Recurring Revenue"
          value="₹ 8,45,000"
          icon={IndianRupee}
          tone="lime"
          cornerSide="bl"
          spark={[44, 50, 48, 60, 65, 70, 82]}
          sub={<span className="font-medium">MRR · billed in INR</span>}
        />
        <MetricCard
          label="Annual Recurring Revenue"
          value="₹ 1,01,40,000"
          icon={TrendingUp}
          cornerSide="tr"
          spark={[20, 35, 40, 52, 58, 66, 78]}
          sub={<span className="font-medium text-black/65">Projected ARR</span>}
        />
        <MetricCard
          label="System Processing Load"
          value="99.98%"
          icon={Activity}
          tone="black"
          cornerSide="bl"
          heartbeat
          sub={<span className="font-medium text-white/70">Uptime · last 90d</span>}
        />
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        {/* Activity Tracker */}
        <OrganicCard tone="white" cornerSide="tr" arrow padded className="lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-title">Weekly Registrations</div>
              <div className="mt-1 text-[13px] text-black/55">
                New tenant signups · peak on {weeklyBars[peakIdx].d}
              </div>
            </div>
            <div className="font-mono text-[12px] text-black/45">+24 this week</div>
          </div>
          <div className="mt-6 flex h-44 items-end gap-3">
            {weeklyBars.map((b, i) => {
              const isPeak = i === peakIdx;
              return (
                <div key={b.d} className="flex flex-1 flex-col items-center gap-2">
                  <div className="font-mono text-[10px] text-black/45">{b.v}</div>
                  <div
                    className="relative w-full overflow-hidden rounded-t-xl"
                    style={{ height: `${b.v}%` }}
                  >
                    <div
                      className="absolute inset-0 rounded-t-xl"
                      style={{
                        background: isPeak
                          ? "linear-gradient(180deg,#2563EB 0%, #DBEAFE 100%)"
                          : "linear-gradient(180deg,#000000 0%, #1F1F1F 100%)",
                      }}
                    />
                    {isPeak && (
                      <div
                        className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-4 ring-[#2563EB]/30"
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

        {/* Plan Breakdown */}
        <OrganicCard tone="white" cornerSide="bl" arrow padded>
          <div className="text-title">Plan Distribution</div>
          <div className="mt-1 text-[13px] text-black/55">Across 142 tenants</div>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-[#F4F4F5]">
            <div className="h-full" style={{ width: "30%", backgroundColor: "#000000" }} />
            <div className="h-full" style={{ width: "55%", backgroundColor: "#2563EB" }} />
            <div className="h-full" style={{ width: "15%", backgroundColor: "#DBEAFE" }} />
          </div>
          <div className="mt-5 space-y-3">
            {[
              { label: "Basic", pct: 30, count: 43, color: "#000000" },
              { label: "Premium", pct: 55, count: 78, color: "#2563EB" },
              { label: "Enterprise", pct: 15, count: 21, color: "#DBEAFE" },
            ].map((p) => (
              <div key={p.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full ring-2 ring-black/5"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-[13.5px] font-medium text-black">{p.label}</span>
                </div>
                <div className="font-mono text-[12px] text-black/55">
                  {p.count} <span className="text-black/40">/ {p.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </OrganicCard>
      </div>

      {/* Recent Registrations */}
      <OrganicCard tone="white" cornerSide="tr" arrow padded>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-title">Recent Registrations</div>
            <div className="mt-1 text-[13px] text-black/55">
              Latest 5 tenant signups · provisioning pipeline
            </div>
          </div>
          <button className="rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-medium text-black hover:bg-black hover:text-white">
            View all →
          </button>
        </div>
        <div className="mt-4 divide-y divide-[#F0F0F0]">
          {recentRegistrations.map((r) => (
            <div key={r.domain} className="flex items-center justify-between py-3.5">
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
                  {r.step === "Provisioned" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-black" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-black/50" />
                  )}
                  {r.step}
                </span>
                <span className="rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 font-mono text-[10px] text-black/65">
                  {r.flag}
                </span>
                <span className="font-mono text-[11px] text-black/45">{r.time}</span>
              </div>
            </div>
          ))}
        </div>
      </OrganicCard>
    </div>
  );
}
