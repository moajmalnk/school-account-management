import {
  feeScheduleFromDraft,
  type FeeScheduleDraft,
} from "@/components/school/FeeScheduleEditor";
import { nextPrefixedId } from "@/lib/student-csv";
import { yearScopedId, type PaymentCategory } from "@/lib/tenant-store";

export function slugFromFeeCategoryLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function findDuplicatePaymentCategory(
  paymentCategories: PaymentCategory[],
  label: string,
  excludeId?: string,
): PaymentCategory | undefined {
  const key = label.trim().toLowerCase();
  if (!key) return undefined;
  return paymentCategories.find(
    (c) => c.id !== excludeId && c.label.trim().toLowerCase() === key,
  );
}

/** Shared create payload for Settings → Fee Category and Finance → Receive Payment. */
export function createPaymentCategoryDraft(input: {
  label: string;
  active?: boolean;
  schedule?: FeeScheduleDraft;
  paymentCategories: PaymentCategory[];
  academicYear: string;
}): PaymentCategory {
  const label = input.label.trim();
  const slugBase = label.replace(/\s*fee\s*$/i, "") || label;
  const slug = slugFromFeeCategoryLabel(slugBase);
  const id = yearScopedId(
    nextPrefixedId(
      "CAT",
      input.paymentCategories.map((c) => c.id),
      3,
    ),
    input.academicYear,
  );
  const schedule = input.schedule;
  const withStructure = Boolean(schedule?.billingModeChosen);
  const feeSchedule = withStructure && schedule ? feeScheduleFromDraft(schedule) : [];
  const hasSchedule = withStructure && feeSchedule.length > 0;

  return {
    id,
    label,
    slug,
    isSystem: false,
    hasSchedule,
    billingCycle: hasSchedule ? schedule!.billingCycle : undefined,
    feeAmountMode: hasSchedule ? schedule!.feeAmountMode : undefined,
    feeSchedule: hasSchedule ? feeSchedule : [],
    feeCollectionStartMonth:
      hasSchedule && schedule!.billingCycle === "Monthly"
        ? schedule!.feeCollectionStartMonth
        : undefined,
    active: input.active !== false,
    academicYear: input.academicYear,
  };
}

export function validateFeeCategorySchedule(schedule?: FeeScheduleDraft): string | null {
  if (!schedule?.billingModeChosen) return null;
  const feeSchedule = feeScheduleFromDraft(schedule);
  if (!feeSchedule.length || feeSchedule.every((l) => l.amount <= 0)) {
    return "Add at least one installment with an amount, or clear billing mode";
  }
  return null;
}
