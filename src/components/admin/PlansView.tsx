import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { OrganicCard } from "@/components/ui/organic-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchSuperAdminPlans,
  updateSuperAdminPlan,
  type SuperAdminPlan,
  type SuperAdminPlanFlags,
} from "@/lib/api/super-admin";
import { ApiError, getApiToken } from "@/lib/api/client";
import { PLAN_FEATURE_ITEMS } from "@/lib/permissions";
import type { Tone, CornerSide } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Interval = "Monthly" | "Annually";

const EMPTY_FLAGS: SuperAdminPlanFlags = {
  finance: false,
  students: false,
  classes: false,
  staff: false,
  vehicle: false,
  analytics: false,
  feeReminders: false,
  feeCollection: false,
  extraUsers: false,
  staffAttendance: false,
  payroll: false,
  autoFeeCollection: false,
  whatsapp: false,
  branches: false,
};

/** Catalog defaults — used when API is empty / offline */
const DEFAULT_PLANS: SuperAdminPlan[] = [
  {
    name: "Basic",
    accent: "#000000",
    monthly: 899,
    annually: 9499,
    defaultCapacity: 800,
    flags: {
      ...EMPTY_FLAGS,
      finance: true,
      students: true,
      classes: true,
      staff: true,
      vehicle: true,
      analytics: true,
      feeReminders: true,
    },
  },
  {
    name: "Premium",
    accent: "#0F766E",
    monthly: 1499,
    annually: 16499,
    defaultCapacity: 2500,
    flags: {
      ...EMPTY_FLAGS,
      finance: true,
      students: true,
      classes: true,
      staff: true,
      vehicle: true,
      analytics: true,
      feeReminders: true,
      feeCollection: true,
      extraUsers: true,
      branches: true,
    },
  },
  {
    name: "Enterprise",
    accent: "#000000",
    monthly: 2299,
    annually: 25499,
    defaultCapacity: 5000,
    flags: {
      ...EMPTY_FLAGS,
      finance: true,
      students: true,
      classes: true,
      staff: true,
      staffAttendance: true,
      payroll: true,
      vehicle: true,
      analytics: true,
      feeReminders: true,
      feeCollection: true,
      extraUsers: true,
      autoFeeCollection: true,
      whatsapp: true,
      branches: true,
    },
  },
];

const TIER_TONE: Record<string, Tone> = {
  Basic: "white",
  Premium: "lime",
  Enterprise: "black",
};

function normalizePlan(p: SuperAdminPlan): SuperAdminPlan {
  return {
    name: p.name,
    accent: p.accent || "#000000",
    monthly: Number(p.monthly) || 0,
    annually: Number(p.annually) || 0,
    defaultCapacity: p.defaultCapacity,
    flags: { ...EMPTY_FLAGS, ...(p.flags ?? {}) },
  };
}

function formatInr(n: number) {
  return n.toLocaleString("en-IN");
}

export function PlansView() {
  const [interval, setInterval] = useState<Interval>("Monthly");
  const [tiers, setTiers] = useState<SuperAdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!getApiToken()) throw new ApiError("Not authenticated", 401);
        const plans = await fetchSuperAdminPlans();
        if (!cancelled) {
          const normalized = (plans ?? []).map(normalizePlan);
          setTiers(normalized.length > 0 ? normalized : DEFAULT_PLANS);
        }
      } catch (err) {
        if (!cancelled) {
          setTiers(DEFAULT_PLANS);
          const msg = err instanceof ApiError ? err.message : "Failed to load plans";
          toast.error("Showing catalog defaults", { description: msg });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateTier = (i: number, patch: Partial<SuperAdminPlan>) =>
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));

  const toggleFlag = (i: number, k: keyof SuperAdminPlanFlags) =>
    setTiers((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, flags: { ...t.flags, [k]: !t.flags[k] } } : t)),
    );

  const savePlan = async (tier: SuperAdminPlan) => {
    setSavingName(tier.name);
    try {
      if (!getApiToken()) throw new ApiError("Not authenticated", 401);
      const saved = await updateSuperAdminPlan({
        name: tier.name,
        monthly: tier.monthly,
        annually: tier.annually,
        accent: tier.accent,
        defaultCapacity: tier.defaultCapacity,
        flags: tier.flags,
      });
      setTiers((prev) => prev.map((t) => (t.name === saved.name ? normalizePlan(saved) : t)));
      toast.success(`${saved.name} plan saved`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Save failed";
      toast.error("Could not save plan", { description: msg });
    } finally {
      setSavingName(null);
    }
  };

  const totalEnabled = tiers.reduce((s, t) => s + Object.values(t.flags).filter(Boolean).length, 0);

  if (loading) {
    return (
      <div className="min-w-0 space-y-4 sm:space-y-6" aria-busy="true" aria-label="Loading plans">
        <Skeleton className="h-7 w-full max-w-[16rem] bg-black/[0.07] sm:h-8" />
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[22rem] rounded-3xl bg-black/[0.06] sm:h-[28rem]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-title sm:text-heading">Subscription Tiers &amp; Feature Matrix</h1>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-black/55 sm:mt-2 sm:text-[14px]">
            Globally configure commercial plans &amp; module access · {totalEnabled} flags enabled
            across tiers
          </p>
        </div>

        <div className="inline-flex w-full shrink-0 items-center gap-1 rounded-full border border-[#E5E5E5] bg-white p-1 sm:w-auto">
          {(["Monthly", "Annually"] as Interval[]).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInterval(i)}
              className={`min-h-10 flex-1 rounded-full px-5 py-2 text-[12.5px] font-semibold transition sm:flex-none ${
                interval === i ? "bg-black text-white shadow-sm" : "text-black/65 hover:text-black"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      {tiers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#E5E5E5] bg-white px-6 py-16 text-center text-[13px] text-black/45">
          No subscription plans found for this platform.
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-3 pb-1 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tiers.map((t, i) => {
            const price = interval === "Monthly" ? t.monthly : t.annually;
            const fullContract = t.monthly * 12;
            const isPremium = t.name === "Premium";
            const tone: Tone = TIER_TONE[t.name] ?? "white";
            const cornerSide: CornerSide = "tr";
            const isLime = tone === "lime";
            const isBlack = tone === "black";
            const onDark = isLime || isBlack;
            const subText = onDark ? "text-white/75" : "text-black/55";
            const ink = onDark ? "text-white" : "text-black";
            const inkMuted = onDark ? "text-white/55" : "text-black/45";
            const rowBg = onDark ? "bg-white/10" : "bg-[#F4F4F5]";
            const rule = onDark ? "border-white/15" : "border-black/10";
            const divider = onDark ? "bg-white/15" : "bg-black/10";
            const saving = savingName === t.name;
            const annualSavings = Math.max(0, fullContract - t.annually);

            return (
              <OrganicCard
                key={t.name}
                tone={tone}
                cornerSide={cornerSide}
                padded
                className="overflow-hidden !p-3.5 sm:!p-6"
              >
                {isPremium ? (
                  <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                    <Sparkles className="h-3 w-3" /> Most adopted
                  </div>
                ) : null}

                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: onDark ? "#CCFBF1" : "#000000" }}
                  />
                  <span className={`truncate text-[16px] font-semibold sm:text-[18px] ${ink}`}>
                    {t.name}
                  </span>
                </div>

                <div
                  className={`mt-3 flex w-full min-w-0 items-baseline gap-1.5 border-b pb-2 font-mono sm:mt-4 sm:gap-2 ${rule}`}
                >
                  <span className={`shrink-0 text-[16px] font-bold sm:text-[20px] ${ink}`}>₹</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={price}
                    onChange={(e) =>
                      updateTier(
                        i,
                        interval === "Monthly"
                          ? { monthly: Number(e.target.value) || 0 }
                          : { annually: Number(e.target.value) || 0 },
                      )
                    }
                    className={`min-w-0 flex-1 bg-transparent text-[24px] font-bold tracking-tight tabular-nums focus:outline-none sm:text-[28px] ${ink}`}
                  />
                  <span className={`shrink-0 font-sans text-[11px] sm:text-[12px] ${subText}`}>
                    / {interval === "Monthly" ? "mo" : "yr"}
                  </span>
                </div>
                <div className={`mt-1 space-y-0.5 font-mono text-[10.5px] sm:text-[11px] ${subText}`}>
                  {interval === "Monthly" ? (
                    <>
                      <div>₹ {formatInr(fullContract)} annual contract</div>
                      <div>
                        Offer <span className={ink}>₹ {formatInr(t.annually)}</span> / year
                      </div>
                    </>
                  ) : (
                    <>
                      <div>₹ {formatInr(fullContract)} full annual contract</div>
                      {annualSavings > 0 && (
                        <div>Save ₹ {formatInr(annualSavings)} vs monthly billing</div>
                      )}
                    </>
                  )}
                </div>

                <div className={`my-4 h-px sm:my-5 ${divider}`} />

                <div className="space-y-1.5 sm:space-y-2.5">
                  <div
                    className={`text-[10px] font-semibold uppercase tracking-wider sm:text-[10.5px] ${subText}`}
                  >
                    Features Included
                  </div>
                  {PLAN_FEATURE_ITEMS.map((f) => {
                    const on = Boolean(t.flags[f.key]);
                    return (
                      <div
                        key={f.key}
                        className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 sm:rounded-2xl sm:px-3 sm:py-2 ${rowBg}`}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <Check
                            className={`h-3.5 w-3.5 shrink-0 ${on ? "" : "opacity-40"}`}
                            style={{ color: onDark ? "#CCFBF1" : "#000000" }}
                          />
                          <span
                            className={`truncate text-[11.5px] sm:text-[12px] ${
                              on ? `font-medium ${ink}` : inkMuted
                            }`}
                          >
                            {f.label}
                          </span>
                        </div>
                        <Switch
                          checked={on}
                          onCheckedChange={() => toggleFlag(i, f.key)}
                          className={cn(
                            "shrink-0 scale-90 sm:scale-100",
                            onDark
                              ? "data-[state=checked]:bg-[#CCFBF1] data-[state=unchecked]:bg-white/30"
                              : undefined,
                          )}
                        />
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void savePlan(t)}
                  className={`mt-4 w-full rounded-full py-2.5 text-[12px] font-semibold shadow-sm transition-colors disabled:opacity-60 sm:mt-5 sm:text-[12.5px] ${
                    isLime
                      ? "bg-black text-white hover:bg-black/85"
                      : isBlack
                        ? "bg-[#0F766E] text-white hover:bg-white hover:text-black"
                        : "bg-black text-white hover:bg-black/85"
                  }`}
                >
                  {saving ? (
                    "Saving…"
                  ) : (
                    <>
                      <span className="sm:hidden">Save {t.name}</span>
                      <span className="hidden sm:inline">Save {t.name} Configuration</span>
                    </>
                  )}
                </button>
              </OrganicCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
