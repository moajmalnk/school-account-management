import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { OrganicCard } from "@/components/ui/organic-card";
import type { Tone, CornerSide } from "@/lib/utils";

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
    name: "Basic",
    accent: "#000000",
    monthly: 4999,
    annually: 49999,
    flags: {
      finance: true,
      vehicle: false,
      analytics: false,
      alerts: false,
      exams: true,
      library: false,
    },
  },
  {
    name: "Premium",
    accent: "#C7F33C",
    monthly: 12999,
    annually: 129999,
    flags: {
      finance: true,
      vehicle: true,
      analytics: true,
      alerts: false,
      exams: true,
      library: true,
    },
  },
  {
    name: "Enterprise",
    accent: "#000000",
    monthly: 24999,
    annually: 249999,
    flags: {
      finance: true,
      vehicle: true,
      analytics: true,
      alerts: true,
      exams: true,
      library: true,
    },
  },
];

const TIER_TONE: Record<string, Tone> = {
  Basic: "white",
  Premium: "lime",
  Enterprise: "black",
};

export function PlansView() {
  const [interval, setInterval] = useState<Interval>("Monthly");
  const [tiers, setTiers] = useState<TierData[]>(INITIAL);

  const updateTier = (i: number, patch: Partial<TierData>) =>
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));

  const toggleFlag = (i: number, k: string) =>
    setTiers((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, flags: { ...t.flags, [k]: !t.flags[k] } } : t)),
    );

  const totalEnabled = tiers.reduce((s, t) => s + Object.values(t.flags).filter(Boolean).length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-heading">Subscription Tiers &amp; Feature Matrix</h1>
          <p className="mt-2 text-[14px] text-black/55">
            Globally configure commercial plans &amp; module access · {totalEnabled} flags enabled
            across tiers
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-[#E5E5E5] bg-white p-1">
          {(["Monthly", "Annually"] as Interval[]).map((i) => (
            <button
              key={i}
              onClick={() => setInterval(i)}
              className={`rounded-full px-5 py-2 text-[12.5px] font-semibold transition ${
                interval === i ? "bg-black text-white shadow-sm" : "text-black/65 hover:text-black"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {tiers.map((t, i) => {
          const price = interval === "Monthly" ? t.monthly : t.annually;
          const isPremium = t.name === "Premium";
          const tone: Tone = TIER_TONE[t.name] ?? "white";
          const cornerSide: CornerSide = "tr";
          const isLime = tone === "lime";
          const isBlack = tone === "black";
          const subText = isLime ? "text-black/70" : isBlack ? "text-white/70" : "text-black/55";

          return (
            <OrganicCard
              key={t.name}
              tone={tone}
              cornerSide={cornerSide}
              arrow
              padded
              className="overflow-hidden"
            >
              <div className="mb-4 flex h-7 items-center">
                {isPremium && (
                  <div className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                    <Sparkles className="h-3 w-3" /> Most adopted
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: isBlack ? "#C7F33C" : isLime ? "#000000" : "#000000" }}
                />
                <Input
                  value={t.name}
                  onChange={(e) => updateTier(i, { name: e.target.value })}
                  className={`h-9 border-transparent bg-transparent px-1 text-[18px] font-semibold focus-visible:bg-black/5 ${
                    isBlack ? "text-white" : "text-black"
                  }`}
                />
              </div>

              <div
                className={`mt-4 flex w-full items-baseline gap-2 border-b pb-2 font-mono ${
                  isBlack ? "border-white/15" : "border-black/10"
                }`}
              >
                <span className={`text-[20px] font-bold ${isBlack ? "text-white" : "text-black"}`}>
                  ₹
                </span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) =>
                    updateTier(
                      i,
                      interval === "Monthly"
                        ? { monthly: Number(e.target.value) || 0 }
                        : { annually: Number(e.target.value) || 0 },
                    )
                  }
                  className={`w-full min-w-0 bg-transparent text-[28px] font-bold tracking-tight focus:outline-none ${
                    isBlack ? "text-white" : "text-black"
                  }`}
                />
                <span className={`shrink-0 font-sans text-[12px] ${subText}`}>
                  / {interval === "Monthly" ? "mo" : "yr"}
                </span>
              </div>
              <div className={`mt-1 font-mono text-[11px] ${subText}`}>
                ≈ ₹ {(interval === "Monthly" ? t.monthly * 12 : t.annually).toLocaleString("en-IN")}{" "}
                annual contract
              </div>

              <div className={`my-5 h-px ${isBlack ? "bg-white/10" : "bg-black/10"}`} />

              <div className="space-y-2.5">
                <div className={`text-[10.5px] font-semibold uppercase tracking-wider ${subText}`}>
                  Feature Flag Authorization
                </div>
                {FEATURES.map((f) => {
                  const on = t.flags[f.key];
                  const rowBg = isBlack ? "bg-white/5" : isLime ? "bg-black/5" : "bg-[#F4F4F5]";
                  return (
                    <div
                      key={f.key}
                      className={`flex items-center justify-between rounded-2xl px-3 py-2 ${rowBg}`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Check
                          className={`h-3.5 w-3.5 shrink-0 ${on ? "" : "opacity-30"}`}
                          style={{ color: isBlack ? "#C7F33C" : "#000000" }}
                        />
                        <span
                          className={`truncate text-[12px] ${
                            on
                              ? isBlack
                                ? "font-medium text-white"
                                : "font-medium text-black"
                              : isBlack
                                ? "text-white/40"
                                : "text-black/40"
                          }`}
                        >
                          {f.label}
                        </span>
                      </div>
                      <Switch checked={on} onCheckedChange={() => toggleFlag(i, f.key)} />
                    </div>
                  );
                })}
              </div>

              <button
                className={`mt-5 w-full rounded-full py-2.5 text-[12.5px] font-semibold shadow-sm transition-colors ${
                  isLime
                    ? "bg-black text-white hover:bg-black/85"
                    : isBlack
                      ? "bg-[#C7F33C] text-black hover:bg-white"
                      : "bg-black text-white hover:bg-black/85"
                }`}
              >
                Save {t.name} Configuration
              </button>
            </OrganicCard>
          );
        })}
      </div>
    </div>
  );
}
