/**
 * Shared helpers for Class Tier + Bus Route fee schedules:
 * capped installment defaults, clone/copy fields, smart due-date fill.
 */
import {
  DEFAULT_FEE_COLLECTION_START_MONTH,
  FEE_MONTHS,
  filterFeePeriods,
  installmentLabel,
  sumFeeSchedule,
  type ClassBillingCycle,
  type ClassConfig,
  type ClassFeeAmountMode,
  type ClassFeeLine,
  type FeeTerm,
  type TransportRoute,
} from "@/lib/tenant-store";
import type { FeeScheduleDraft } from "@/components/school/FeeScheduleEditor";

export const MAX_MONTHLY_INSTALLMENTS = 12;
export const MAX_TERM_INSTALLMENTS = 6;
export const DEFAULT_MONTHLY_INSTALLMENTS = 10;
export const DEFAULT_TERM_INSTALLMENTS = 4;

export type FeeScheduleCloneFields = {
  billingCycle: Extract<ClassBillingCycle, "Monthly" | "Term">;
  feeAmountMode: ClassFeeAmountMode;
  feeCollectionStartMonth?: string;
  feeSchedule: ClassFeeLine[];
};

/** Cap fee-term–derived counts so schools never get 46+ empty rows by default. */
export function cappedInstallmentCount(
  cycle: Extract<ClassBillingCycle, "Monthly" | "Term">,
  feeTerms: FeeTerm[],
  kind: "tuition" | "vehicle" = "tuition",
): number {
  const mode = cycle === "Term" ? "term" : "month";
  const fromTerms = filterFeePeriods(feeTerms, mode, kind).length;
  const max = cycle === "Term" ? MAX_TERM_INSTALLMENTS : MAX_MONTHLY_INSTALLMENTS;
  const fallback = cycle === "Term" ? DEFAULT_TERM_INSTALLMENTS : DEFAULT_MONTHLY_INSTALLMENTS;
  if (fromTerms <= 0) return fallback;
  return Math.min(fromTerms, max);
}

export function addMonthsIso(isoDate: string, months: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return isoDate;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(Date.UTC(year, monthIndex + months, 1));
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

/**
 * When the first installment due date is set, fill later rows monthly (+1)
 * or term-style (+3 months). Leaves later rows that already have dates untouched
 * unless `force` is true.
 */
export function fillDueDatesFromFirst<T extends { dueDate: string }>(
  installments: T[],
  cycle: Extract<ClassBillingCycle, "Monthly" | "Term">,
  force = false,
): T[] {
  const first = installments[0]?.dueDate?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(first)) return installments;
  const step = cycle === "Term" ? 3 : 1;
  return installments.map((row, index) => {
    if (index === 0) return row;
    if (!force && row.dueDate?.trim()) return row;
    return { ...row, dueDate: addMonthsIso(first, index * step) };
  });
}

export function cloneFeeScheduleFields(source: {
  billingCycle?: ClassBillingCycle;
  feeAmountMode?: ClassFeeAmountMode;
  feeCollectionStartMonth?: string;
  feeSchedule?: ClassFeeLine[];
}): FeeScheduleCloneFields {
  const cycle: Extract<ClassBillingCycle, "Monthly" | "Term"> =
    source.billingCycle === "Term" ? "Term" : "Monthly";
  const lines = (source.feeSchedule ?? []).map((line, index) => ({
    ...line,
    id: `${line.kind === "one_time" ? "ot" : "i"}-copy-${index + 1}-${Date.now().toString(36)}`,
  }));
  return {
    billingCycle: cycle,
    feeAmountMode: source.feeAmountMode === "custom" ? "custom" : "fixed",
    feeCollectionStartMonth:
      source.feeCollectionStartMonth?.trim() ||
      (cycle === "Monthly" ? DEFAULT_FEE_COLLECTION_START_MONTH : undefined),
    feeSchedule: lines,
  };
}

export function draftFromCloneFields(
  fields: FeeScheduleCloneFields,
  startMonthFallback?: string,
): FeeScheduleDraft {
  const lines = fields.feeSchedule.filter((l) => l.kind !== "one_time");
  const oneTime = fields.feeSchedule.filter((l) => l.kind === "one_time");
  void oneTime;
  const count = Math.max(1, lines.length || cappedInstallmentCount(fields.billingCycle, [], "tuition"));
  const fixed = lines[0]?.amount ? String(lines[0].amount) : "";
  return {
    billingModeChosen: true,
    billingCycle: fields.billingCycle,
    feeAmountMode: fields.feeAmountMode,
    installmentCount: String(count),
    fixedAmount: fixed,
    feeCollectionStartMonth:
      fields.feeCollectionStartMonth?.trim() ||
      startMonthFallback ||
      DEFAULT_FEE_COLLECTION_START_MONTH,
    installments: Array.from({ length: count }, (_, index) => {
      const existing = lines[index];
      return {
        id: existing?.id || `fl-i-${index + 1}`,
        label: existing?.label || installmentLabel(index, fields.billingCycle),
        amount: existing ? String(existing.amount) : fields.feeAmountMode === "fixed" ? fixed : "",
        dueDate: existing?.dueDate ?? "",
      };
    }),
  };
}

export function classHasConfiguredSchedule(c: ClassConfig): boolean {
  return (c.feeSchedule?.length ?? 0) > 0 || (c.tuitionFeeAmount ?? 0) > 0;
}

export function routeHasConfiguredSchedule(r: TransportRoute): boolean {
  const both = r.bothFeeSchedule?.length ?? 0;
  return both > 0 || (r.bothFee ?? 0) > 0 || (r.morningFee ?? 0) > 0 || (r.eveningFee ?? 0) > 0;
}

export function classScheduleLabel(c: ClassConfig): string {
  const name = [c.grade, c.section].filter(Boolean).join(" · ") || c.className || c.id;
  const total = sumFeeSchedule(c.feeSchedule ?? []) || c.tuitionFeeAmount || 0;
  return total > 0 ? `${name} · ₹${total.toLocaleString("en-IN")}` : name;
}

export function routeScheduleLabel(r: TransportRoute): string {
  const name = [r.mapFrom, r.mapTo].filter(Boolean).join(" → ") || r.id;
  const periods = Math.max(1, r.bothFeeSchedule?.length ?? 0);
  const total =
    sumFeeSchedule(r.bothFeeSchedule ?? []) || (r.bothFee ?? 0) * periods || r.bothFee || 0;
  return total > 0 ? `${name} · ₹${total.toLocaleString("en-IN")}` : name;
}

export function normalizeStartMonth(value?: string | null): string {
  const raw = value?.trim() ?? "";
  if (!raw) return DEFAULT_FEE_COLLECTION_START_MONTH;
  const match = FEE_MONTHS.find((m) => m.toLowerCase() === raw.toLowerCase());
  return match ?? DEFAULT_FEE_COLLECTION_START_MONTH;
}

/** Fee fields only — for apply-to-many on classes. */
export function classFeePayloadFromSource(source: ClassConfig): Pick<
  ClassConfig,
  | "billingCycle"
  | "feeAmountMode"
  | "feeSchedule"
  | "tuitionFeeAmount"
  | "feeCollectionStartMonth"
> {
  const cloned = cloneFeeScheduleFields(source);
  return {
    billingCycle: cloned.billingCycle,
    feeAmountMode: cloned.feeAmountMode,
    feeSchedule: cloned.feeSchedule,
    tuitionFeeAmount: sumFeeSchedule(cloned.feeSchedule) || source.tuitionFeeAmount || 0,
    feeCollectionStartMonth: cloned.feeCollectionStartMonth,
  };
}

/** Fee fields only — for apply-to-many on routes (not geography/vehicles). */
export function routeFeePayloadFromSource(source: TransportRoute): Pick<
  TransportRoute,
  | "billingCycle"
  | "feeAmountMode"
  | "morningFee"
  | "eveningFee"
  | "bothFee"
  | "morningFeeSchedule"
  | "eveningFeeSchedule"
  | "bothFeeSchedule"
  | "feeCollectionStartMonth"
> {
  const both = cloneFeeScheduleFields({
    billingCycle: source.billingCycle,
    feeAmountMode: source.feeAmountMode,
    feeCollectionStartMonth: source.feeCollectionStartMonth,
    feeSchedule: source.bothFeeSchedule ?? [],
  });
  const morningAmount = Math.max(0, Math.round(source.morningFee || 0));
  const eveningAmount = Math.max(0, Math.round(source.eveningFee || 0));
  const bothAmount =
    Math.max(0, Math.round(source.bothFee || 0)) ||
    both.feeSchedule.find((l) => l.kind !== "one_time")?.amount ||
    0;
  const mapShift = (amount: number): ClassFeeLine[] =>
    both.feeSchedule
      .filter((l) => l.kind !== "one_time")
      .map((line, index) => ({
        ...line,
        id: `shift-${amount}-${index + 1}-${Date.now().toString(36)}`,
        amount,
      }));
  return {
    billingCycle: both.billingCycle,
    feeAmountMode: both.feeAmountMode,
    morningFee: morningAmount,
    eveningFee: eveningAmount,
    bothFee: bothAmount,
    bothFeeSchedule: both.feeSchedule.filter((l) => l.kind !== "one_time").map((line) => ({
      ...line,
      amount: both.feeAmountMode === "fixed" ? bothAmount : line.amount,
    })),
    morningFeeSchedule: mapShift(morningAmount),
    eveningFeeSchedule: mapShift(eveningAmount),
    feeCollectionStartMonth: both.feeCollectionStartMonth,
  };
}
