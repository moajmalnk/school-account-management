import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FeeScheduleEditor,
  draftFromFeeSchedule,
  emptyFeeScheduleDraft,
  feeScheduleFromDraft,
  type FeeScheduleDraft,
} from "@/components/school/FeeScheduleEditor";
import {
  defaultConcessionTierFromClass,
  defaultConcessionTierFromRoute,
  resolveVehicleConcessionSeed,
} from "@/lib/student-concession-fees";
import {
  findTransportRouteForStudent,
  resolveTransportFeeShift,
  scheduleSummary,
  withClassFeeSchedule,
  type ClassConfig,
  type FeeTerm,
  type StudentConcessionFeeTier,
  type StudentConcessionFees,
  type StudentConcessionOtherFee,
  type TransportRoute,
} from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

export type StudentConcessionState = {
  hasConcession: boolean;
  concessionReason: string;
  concessionFees: StudentConcessionFees;
};

export function emptyConcessionState(): StudentConcessionState {
  return {
    hasConcession: false,
    concessionReason: "",
    concessionFees: {},
  };
}

export function concessionStateFromStudent(student: {
  hasConcession?: boolean;
  concessionReason?: string;
  concessionFees?: StudentConcessionFees;
}): StudentConcessionState {
  return {
    hasConcession: student.hasConcession === true,
    concessionReason: student.concessionReason ?? "",
    concessionFees: student.concessionFees ?? {},
  };
}

function tierToDraft(tier?: StudentConcessionFeeTier): FeeScheduleDraft {
  if (!tier || tier.feeSchedule.length === 0) return emptyFeeScheduleDraft();
  return draftFromFeeSchedule({
    billingCycle: tier.billingCycle === "Term" ? "Term" : "Monthly",
    feeAmountMode: tier.feeAmountMode,
    feeSchedule: tier.feeSchedule,
    feeCollectionStartMonth: tier.feeCollectionStartMonth,
  });
}

function draftToTier(draft: FeeScheduleDraft, enabled: boolean): StudentConcessionFeeTier {
  return {
    enabled,
    billingCycle: draft.billingCycle,
    feeAmountMode: draft.feeAmountMode,
    feeSchedule: feeScheduleFromDraft(draft),
    feeCollectionStartMonth: draft.feeCollectionStartMonth,
  };
}

function otherFeeToDraft(fee: StudentConcessionOtherFee): FeeScheduleDraft {
  if (fee.feeSchedule.length === 0) return emptyFeeScheduleDraft();
  return draftFromFeeSchedule({
    billingCycle: fee.billingCycle,
    feeAmountMode: fee.feeAmountMode,
    feeSchedule: fee.feeSchedule,
    feeCollectionStartMonth: fee.feeCollectionStartMonth,
  });
}

function draftToOtherFee(
  draft: FeeScheduleDraft,
  fee: StudentConcessionOtherFee,
): StudentConcessionOtherFee {
  return {
    ...fee,
    billingCycle: draft.billingCycle,
    feeAmountMode: draft.feeAmountMode,
    feeSchedule: feeScheduleFromDraft(draft),
    feeCollectionStartMonth: draft.feeCollectionStartMonth,
  };
}

function tierSyncKey(tier?: StudentConcessionFeeTier): string {
  if (!tier) return "none";
  return `${tier.billingCycle}|${tier.feeAmountMode}|${tier.feeSchedule.map((line) => `${line.id}:${line.amount}:${line.label}`).join(";")}`;
}

function otherFeeSyncKey(fee: StudentConcessionOtherFee): string {
  return `${fee.billingCycle}|${fee.feeAmountMode}|${fee.feeSchedule.map((line) => `${line.id}:${line.amount}:${line.label}`).join(";")}`;
}

function useSyncedFeeDraft(tier: StudentConcessionFeeTier | undefined) {
  const syncKey = tierSyncKey(tier);
  const [draft, setDraft] = useState(() => tierToDraft(tier));
  const lastSyncKey = useRef(syncKey);

  useEffect(() => {
    if (lastSyncKey.current === syncKey) return;
    lastSyncKey.current = syncKey;
    setDraft(tierToDraft(tier));
  }, [syncKey, tier]);

  return [draft, setDraft] as const;
}

type StudentConcessionSectionProps = {
  value: StudentConcessionState;
  onChange: (next: StudentConcessionState) => void;
  matchedClass?: ClassConfig;
  feeTerms: FeeTerm[];
  transportRoutes?: TransportRoute[];
  needsBus?: boolean;
  busPoint1?: string;
  busPoint2?: string;
  className?: string;
};

function TierBlock({
  title,
  defaultSummary,
  enabled,
  onEnabledChange,
  draft,
  onDraftChange,
  onSeedFromDefault,
}: {
  title: string;
  defaultSummary?: string;
  enabled: boolean;
  onEnabledChange: (checked: boolean) => void;
  draft: FeeScheduleDraft;
  onDraftChange: (draft: FeeScheduleDraft) => void;
  onSeedFromDefault?: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/60 p-4 dark:border-zinc-700/60 dark:bg-zinc-900/40">
      <label className="flex cursor-pointer items-start gap-3">
        <Checkbox
          checked={enabled}
          onCheckedChange={(checked) => onEnabledChange(checked === true)}
          className="mt-0.5"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-slate-900 dark:text-zinc-100">
            {title}
          </span>
          {defaultSummary ? (
            <span className="mt-0.5 block text-[12px] text-slate-500 dark:text-zinc-400">
              Class / route default: {defaultSummary}
            </span>
          ) : null}
        </span>
      </label>
      {enabled ? (
        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 dark:border-zinc-800">
          {onSeedFromDefault ? (
            <Button type="button" variant="outline" size="sm" className="h-8 rounded-full text-[12px]" onClick={onSeedFromDefault}>
              Reset from default schedule
            </Button>
          ) : null}
          <FeeScheduleEditor value={draft} onChange={onDraftChange} />
        </div>
      ) : null}
    </div>
  );
}

export function StudentConcessionSection({
  value,
  onChange,
  matchedClass,
  feeTerms,
  transportRoutes = [],
  needsBus = false,
  busPoint1,
  busPoint2,
  className,
}: StudentConcessionSectionProps) {
  const classSummary = useMemo(() => {
    if (!matchedClass) return undefined;
    return scheduleSummary(withClassFeeSchedule(matchedClass, feeTerms));
  }, [matchedClass, feeTerms]);

  const vehicleDefaultSummary = useMemo(() => {
    if (!needsBus) return undefined;
    const studentStub = {
      needsBus: true as const,
      busPoint1,
      busPoint2,
      cls: matchedClass?.className ?? "",
    };
    const shift = resolveTransportFeeShift(studentStub);
    const route = findTransportRouteForStudent(studentStub, transportRoutes);
    const fromRoute = defaultConcessionTierFromRoute(route, shift, feeTerms);
    if (fromRoute) {
      const total = fromRoute.feeSchedule.reduce((s, l) => s + l.amount, 0);
      return `₹${total.toLocaleString("en-IN")} · ${fromRoute.feeSchedule.length} installments`;
    }
    const fromClass = defaultConcessionTierFromClass(matchedClass, feeTerms, "vehicle");
    if (fromClass) {
      const total = fromClass.feeSchedule.reduce((s, l) => s + l.amount, 0);
      return `₹${total.toLocaleString("en-IN")} · class fallback`;
    }
    return "Not configured — set a custom schedule below";
  }, [needsBus, busPoint1, busPoint2, matchedClass, transportRoutes, feeTerms]);

  const tuitionEnabled = value.concessionFees.tuition?.enabled === true;
  const vehicleEnabled = value.concessionFees.vehicle?.enabled === true;
  const [tuitionDraft, setTuitionDraft] = useSyncedFeeDraft(value.concessionFees.tuition);
  const [vehicleDraft, setVehicleDraft] = useSyncedFeeDraft(value.concessionFees.vehicle);
  const [otherDrafts, setOtherDrafts] = useState<Record<string, FeeScheduleDraft>>({});
  const otherSyncKeys = useRef<Record<string, string>>({});

  useEffect(() => {
    const fees = value.concessionFees.otherFees ?? [];
    setOtherDrafts((prev) => {
      const next = { ...prev };
      const activeIds = new Set<string>();
      for (const fee of fees) {
        activeIds.add(fee.id);
        const syncKey = otherFeeSyncKey(fee);
        if (otherSyncKeys.current[fee.id] !== syncKey) {
          otherSyncKeys.current[fee.id] = syncKey;
          next[fee.id] = otherFeeToDraft(fee);
        } else if (!next[fee.id]) {
          next[fee.id] = otherFeeToDraft(fee);
        }
      }
      for (const id of Object.keys(next)) {
        if (!activeIds.has(id)) {
          delete next[id];
          delete otherSyncKeys.current[id];
        }
      }
      return next;
    });
  }, [value.concessionFees.otherFees]);

  const patchFees = (fees: StudentConcessionFees) => onChange({ ...value, concessionFees: fees });

  const seedTuition = () => {
    const seeded = defaultConcessionTierFromClass(matchedClass, feeTerms, "tuition");
    if (!seeded) return;
    patchFees({ ...value.concessionFees, tuition: seeded });
  };

  const seedVehicle = () => {
    const seeded = resolveVehicleConcessionSeed(
      matchedClass,
      feeTerms,
      transportRoutes,
      busPoint1,
      busPoint2,
      matchedClass?.className,
    );
    patchFees({ ...value.concessionFees, vehicle: { ...seeded, enabled: true } });
  };

  const addOtherFee = () => {
    const id = `other-${Date.now()}`;
    const next: StudentConcessionOtherFee = {
      id,
      label: "",
      billingCycle: "Monthly",
      feeAmountMode: "fixed",
      feeSchedule: feeScheduleFromDraft(emptyFeeScheduleDraft()),
    };
    patchFees({
      ...value.concessionFees,
      otherFees: [...(value.concessionFees.otherFees ?? []), next],
    });
  };

  const updateOtherFee = (id: string, patch: Partial<StudentConcessionOtherFee>) => {
    patchFees({
      ...value.concessionFees,
      otherFees: (value.concessionFees.otherFees ?? []).map((fee) =>
        fee.id === id ? { ...fee, ...patch } : fee,
      ),
    });
  };

  const removeOtherFee = (id: string) => {
    patchFees({
      ...value.concessionFees,
      otherFees: (value.concessionFees.otherFees ?? []).filter((fee) => fee.id !== id),
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
          Fee concession
        </Label>
        <div className="mt-2 flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700 dark:text-zinc-200">
            <input
              type="radio"
              name="fee-concession"
              checked={!value.hasConcession}
              onChange={() => onChange({ ...value, hasConcession: false })}
              className="h-4 w-4"
            />
            No
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700 dark:text-zinc-200">
            <input
              type="radio"
              name="fee-concession"
              checked={value.hasConcession}
              onChange={() => {
                const next = { ...value, hasConcession: true };
                if (!value.concessionFees.tuition && matchedClass) {
                  const seeded = defaultConcessionTierFromClass(matchedClass, feeTerms, "tuition");
                  if (seeded) {
                    next.concessionFees = { ...value.concessionFees, tuition: seeded };
                  }
                }
                onChange(next);
              }}
              className="h-4 w-4"
            />
            Yes
          </label>
        </div>
      </div>

      {value.hasConcession ? (
        <>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              Reason (optional)
            </Label>
            <Input
              value={value.concessionReason}
              onChange={(e) => onChange({ ...value, concessionReason: e.target.value })}
              placeholder="e.g. Staff child scholarship"
              className="h-9"
            />
          </div>

          <TierBlock
            title="Tuition Fee"
            defaultSummary={classSummary}
            enabled={tuitionEnabled}
            onEnabledChange={(checked) => {
              if (checked && !value.concessionFees.tuition) {
                const seeded = defaultConcessionTierFromClass(matchedClass, feeTerms, "tuition");
                patchFees({
                  ...value.concessionFees,
                  tuition: seeded ? { ...seeded, enabled: true } : draftToTier(tuitionDraft, true),
                });
                return;
              }
              patchFees({
                ...value.concessionFees,
                tuition: draftToTier(tuitionDraft, checked),
              });
            }}
            draft={tuitionDraft}
            onDraftChange={(draft) => {
              setTuitionDraft(draft);
              patchFees({
                ...value.concessionFees,
                tuition: draftToTier(draft, tuitionEnabled),
              });
            }}
            onSeedFromDefault={seedTuition}
          />

          {needsBus ? (
            <TierBlock
              title="Bus / Vehicle Fee"
              defaultSummary={vehicleDefaultSummary}
              enabled={vehicleEnabled}
              onEnabledChange={(checked) => {
                if (checked && !value.concessionFees.vehicle) {
                  const seeded = resolveVehicleConcessionSeed(
                    matchedClass,
                    feeTerms,
                    transportRoutes,
                    busPoint1,
                    busPoint2,
                    matchedClass?.className,
                  );
                  patchFees({
                    ...value.concessionFees,
                    vehicle: { ...seeded, enabled: true },
                  });
                  return;
                }
                patchFees({
                  ...value.concessionFees,
                  vehicle: draftToTier(vehicleDraft, checked),
                });
              }}
              draft={vehicleDraft}
              onDraftChange={(draft) => {
                setVehicleDraft(draft);
                patchFees({
                  ...value.concessionFees,
                  vehicle: draftToTier(draft, vehicleEnabled),
                });
              }}
              onSeedFromDefault={seedVehicle}
            />
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Other fees
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full gap-1 text-[12px]"
                onClick={addOtherFee}
              >
                <Plus className="h-3.5 w-3.5" />
                Add fee
              </Button>
            </div>
            {(value.concessionFees.otherFees ?? []).map((fee) => (
              <div
                key={fee.id}
                className="rounded-xl border border-slate-200/80 bg-white/60 p-4 dark:border-zinc-700/60 dark:bg-zinc-900/40"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Input
                    value={fee.label}
                    onChange={(e) => updateOtherFee(fee.id, { label: e.target.value })}
                    placeholder="Fee name · e.g. Lab Fee"
                    className="h-9 flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-red-600"
                    onClick={() => removeOtherFee(fee.id)}
                    aria-label="Remove fee"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <FeeScheduleEditor
                  value={otherDrafts[fee.id] ?? otherFeeToDraft(fee)}
                  onChange={(draft) => {
                    setOtherDrafts((prev) => ({ ...prev, [fee.id]: draft }));
                    updateOtherFee(fee.id, draftToOtherFee(draft, fee));
                  }}
                />
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
