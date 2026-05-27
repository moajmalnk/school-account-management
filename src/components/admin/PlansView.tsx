import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

type Interval = "Monthly" | "Annually";

const FEATURES = [
  { key: "finance", label: "Enable Finance Module" },
  { key: "vehicle", label: "Enable Vehicle Route Tracker" },
  { key: "analytics", label: "Enable Advanced Analytics Reporting" },
  { key: "alerts", label: "Enable Automated SMS / WhatsApp Alerts API" },
  { key: "exams", label: "Enable Examination & Grading Engine" },
  { key: "library", label: "Enable Library Inventory Module" },
] as const;

type TierData = {
  name: string;
  accent: string;
  monthly: number;
  annually: number;
  flags: Record<string, boolean>;
};

const INITIAL: TierData[] = [
  {
    name: "Basic", accent: "#10B981", monthly: 4999, annually: 49999,
    flags: { finance: true, vehicle: false, analytics: false, alerts: false, exams: true, library: false },
  },
  {
    name: "Premium", accent: "#6366F1", monthly: 12999, annually: 129999,
    flags: { finance: true, vehicle: true, analytics: true, alerts: false, exams: true, library: true },
  },
  {
    name: "Enterprise", accent: "#0F172A", monthly: 24999, annually: 249999,
    flags: { finance: true, vehicle: true, analytics: true, alerts: true, exams: true, library: true },
  },
];

export function PlansView() {
  const [interval, setInterval] = useState<Interval>("Monthly");
  const [tiers, setTiers] = useState<TierData[]>(INITIAL);

  const updateTier = (i: number, patch: Partial<TierData>) =>
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));

  const toggleFlag = (i: number, k: string) =>
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, flags: { ...t.flags, [k]: !t.flags[k] } } : t)));

  const totalEnabled = tiers.reduce((s, t) => s + Object.values(t.flags).filter(Boolean).length, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">Subscription Tiers &amp; Feature Matrix</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Globally configure commercial plans &amp; micro-frontend module access · {totalEnabled} flags enabled across tiers
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
          {(["Monthly", "Annually"] as Interval[]).map((i) => (
            <button
              key={i}
              onClick={() => setInterval(i)}
              className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${interval === i ? "text-white shadow-sm" : "text-slate-600"}`}
              style={interval === i ? { backgroundColor: "#0F172A" } : undefined}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {tiers.map((t, i) => {
          const price = interval === "Monthly" ? t.monthly : t.annually;
          const isPremium = t.name === "Premium";
          return (
            <div
              key={t.name}
              className="relative overflow-hidden rounded-3xl border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_60px_-32px_rgba(15,23,42,0.18)]"
              style={{ borderColor: isPremium ? `${t.accent}55` : "rgb(226 232 240 / 0.7)" }}
            >
              {isPremium && (
                <div className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white" style={{ backgroundColor: t.accent }}>
                  <Sparkles className="h-3 w-3" /> Most adopted
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.accent }} />
                <Input
                  value={t.name}
                  onChange={(e) => updateTier(i, { name: e.target.value })}
                  className="h-8 border-transparent bg-transparent px-1 text-[15px] font-semibold text-slate-900 focus-visible:bg-slate-50"
                />
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-[14px] font-semibold text-slate-500">₹</span>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => updateTier(i, interval === "Monthly" ? { monthly: Number(e.target.value) || 0 } : { annually: Number(e.target.value) || 0 })}
                  className="h-12 w-40 border-transparent bg-transparent px-1 font-mono text-[32px] font-bold tracking-tight text-slate-900 focus-visible:bg-slate-50"
                />
                <span className="text-[12px] font-medium text-slate-500">/ {interval === "Monthly" ? "mo" : "yr"}</span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-slate-400">
                ≈ ₹ {(interval === "Monthly" ? t.monthly * 12 : t.annually).toLocaleString("en-IN")} annual contract
              </div>

              <div className="my-5 h-px bg-slate-100" />

              <div className="space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Feature Flag Authorization</div>
                {FEATURES.map((f) => {
                  const on = t.flags[f.key];
                  return (
                    <div key={f.key} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/40 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Check className={`h-3.5 w-3.5 ${on ? "" : "opacity-30"}`} style={{ color: t.accent }} />
                        <span className={`text-[12px] ${on ? "font-medium text-slate-800" : "text-slate-400"}`}>{f.label}</span>
                      </div>
                      <Switch checked={on} onCheckedChange={() => toggleFlag(i, f.key)} />
                    </div>
                  );
                })}
              </div>

              <button
                className="mt-5 w-full rounded-full py-2.5 text-[12px] font-semibold text-white shadow-sm"
                style={{ backgroundColor: t.accent }}
              >
                Save {t.name} Configuration
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
