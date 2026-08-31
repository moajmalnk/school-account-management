import {
  classFeePrefillAmount,
  routeScheduleForShift,
  sumFeeSchedule,
  withClassFeeSchedule,
  withRouteFeeSchedule,
  type ClassConfig,
  type ClassFeeLine,
  type FeeTerm,
  type Student,
  type StudentConcessionFeeTier,
  type StudentConcessionFees,
  type StudentConcessionOtherFee,
  type TransportFeeShift,
  type TransportRoute,
} from "@/lib/tenant-store";

export type { StudentConcessionFeeTier, StudentConcessionFees, StudentConcessionOtherFee };

export function studentHasConcession(student: Pick<Student, "hasConcession">): boolean {
  return student.hasConcession === true;
}

export function isConcessionTierEnabled(tier?: StudentConcessionFeeTier): boolean {
  return Boolean(tier?.enabled && tier.feeSchedule.some((line) => line.amount > 0));
}

function concessionTierToClassConfig(
  tier: StudentConcessionFeeTier,
  fallback?: ClassConfig,
): ClassConfig {
  const tuitionFeeAmount = sumFeeSchedule(tier.feeSchedule);
  return {
    id: fallback?.id ?? "__concession__",
    className: fallback?.className ?? "",
    grade: fallback?.grade ?? "",
    section: fallback?.section ?? "",
    tuitionFeeAmount,
    vehicleFeeAmount: fallback?.vehicleFeeAmount ?? 0,
    billingCycle: tier.billingCycle,
    feeAmountMode: tier.feeAmountMode,
    feeSchedule: tier.feeSchedule,
    feeCollectionStartMonth: tier.feeCollectionStartMonth ?? fallback?.feeCollectionStartMonth,
    classTeacherId: fallback?.classTeacherId,
  };
}

/** Synthetic class config when tuition concession is active. */
export function resolveConcessionTuitionClassConfig(
  student: Student,
  classConfig: ClassConfig | undefined,
  feeTerms: FeeTerm[] = [],
): ClassConfig | undefined {
  if (!studentHasConcession(student)) return undefined;
  const tier = student.concessionFees?.tuition;
  if (!isConcessionTierEnabled(tier)) return undefined;
  const synthetic = concessionTierToClassConfig(tier!, classConfig);
  return withClassFeeSchedule(synthetic, feeTerms);
}

/** Vehicle concession schedule lines for ledger / prefill. */
export function resolveConcessionVehicleSchedule(student: Student): ClassFeeLine[] {
  if (!studentHasConcession(student)) return [];
  const tier = student.concessionFees?.vehicle;
  if (!isConcessionTierEnabled(tier)) return [];
  return tier!.feeSchedule.filter((line) => line.amount > 0);
}

export function concessionVehiclePrefillAmount(
  student: Student,
  opts: {
    periodLabel?: string;
    periodIndex?: number;
    collectionStartMonth?: string;
  },
): number | undefined {
  const tier = student.concessionFees?.vehicle;
  if (!isConcessionTierEnabled(tier)) return undefined;
  const synthetic = concessionTierToClassConfig(tier!);
  return classFeePrefillAmount(synthetic, {
    category: "Vehicle Fee",
    periodLabel: opts.periodLabel,
    periodIndex: opts.periodIndex,
    collectionStartMonth: opts.collectionStartMonth ?? tier!.feeCollectionStartMonth,
  });
}

export function resolveConcessionOtherFees(student: Student): StudentConcessionOtherFee[] {
  if (!studentHasConcession(student)) return [];
  return (student.concessionFees?.otherFees ?? []).filter(
    (fee) => fee.label.trim() && fee.feeSchedule.some((line) => line.amount > 0),
  );
}

export function concessionOtherFeePrefillAmount(
  student: Student,
  label: string,
  opts: {
    periodLabel?: string;
    periodIndex?: number;
    collectionStartMonth?: string;
  },
): number | undefined {
  const fee = resolveConcessionOtherFees(student).find(
    (row) => row.label.trim().toLowerCase() === label.trim().toLowerCase(),
  );
  if (!fee) return undefined;
  const synthetic: ClassConfig = {
    id: `__other__${fee.id}`,
    className: "",
    grade: "",
    section: "",
    tuitionFeeAmount: sumFeeSchedule(fee.feeSchedule),
    vehicleFeeAmount: 0,
    billingCycle: fee.billingCycle,
    feeAmountMode: fee.feeAmountMode,
    feeSchedule: fee.feeSchedule,
    feeCollectionStartMonth: fee.feeCollectionStartMonth,
  };
  return classFeePrefillAmount(synthetic, {
    category: fee.label,
    periodLabel: opts.periodLabel,
    periodIndex: opts.periodIndex,
    collectionStartMonth: opts.collectionStartMonth ?? fee.feeCollectionStartMonth,
  });
}

/** When vehicle concession is active, resolve transport fee from concession schedule. */
export function resolveConcessionTransportFee(
  student: Student,
  period?: {
    label?: string;
    collectionStartMonth?: string;
  },
): { amount: number | undefined; shift: TransportFeeShift; route?: TransportRoute } | undefined {
  if (!studentHasConcession(student)) return undefined;
  const tier = student.concessionFees?.vehicle;
  if (!isConcessionTierEnabled(tier)) return undefined;
  const amount = concessionVehiclePrefillAmount(student, {
    periodLabel: period?.label,
    collectionStartMonth: period?.collectionStartMonth ?? tier!.feeCollectionStartMonth,
  });
  const flat = tier!.feeSchedule.find((line) => line.amount > 0)?.amount;
  return {
    amount: amount && amount > 0 ? Math.round(amount) : flat ? Math.round(flat) : undefined,
    shift: "both",
  };
}

export function concessionSummaryLines(student: Student): string[] {
  if (!studentHasConcession(student)) return [];
  const lines: string[] = [];
  const fees = student.concessionFees;
  if (isConcessionTierEnabled(fees?.tuition)) {
    const total = sumFeeSchedule(fees!.tuition!.feeSchedule);
    lines.push(`Custom tuition: ₹${total.toLocaleString("en-IN")}`);
  }
  if (isConcessionTierEnabled(fees?.vehicle)) {
    const total = sumFeeSchedule(fees!.vehicle!.feeSchedule);
    lines.push(`Custom bus fee: ₹${total.toLocaleString("en-IN")}`);
  }
  for (const other of resolveConcessionOtherFees(student)) {
    const total = sumFeeSchedule(other.feeSchedule);
    lines.push(`${other.label}: ₹${total.toLocaleString("en-IN")}`);
  }
  return lines;
}

/** Build default concession tier from a class schedule for seeding the editor. */
export function defaultConcessionTierFromClass(
  classConfig: ClassConfig | undefined,
  feeTerms: FeeTerm[],
  kind: "tuition" | "vehicle",
): StudentConcessionFeeTier | undefined {
  if (!classConfig) return undefined;
  const scheduled = withClassFeeSchedule(classConfig, feeTerms);
  const lines =
    kind === "vehicle"
      ? scheduled.feeSchedule.filter((line) => /vehicle|transport|bus/i.test(line.label))
      : scheduled.feeSchedule.filter(
          (line) => line.amount > 0 && !/vehicle|transport|bus/i.test(line.label),
        );
  if (lines.length === 0 && kind === "vehicle" && classConfig.vehicleFeeAmount > 0) {
    return {
      enabled: true,
      billingCycle: scheduled.billingCycle === "Term" ? "Term" : "Monthly",
      feeAmountMode: "fixed",
      feeSchedule: [
        {
          id: "fl-vehicle-1",
          kind: "installment",
          label: "Vehicle Fee",
          amount: classConfig.vehicleFeeAmount,
        },
      ],
      feeCollectionStartMonth: scheduled.feeCollectionStartMonth,
    };
  }
  if (lines.length === 0) return undefined;
  return {
    enabled: true,
    billingCycle: scheduled.billingCycle === "Annually" ? "Annually" : scheduled.billingCycle,
    feeAmountMode: scheduled.feeAmountMode,
    feeSchedule: lines.map((line) => ({ ...line })),
    feeCollectionStartMonth: scheduled.feeCollectionStartMonth,
  };
}

export function defaultConcessionTierFromRoute(
  route: TransportRoute | undefined,
  shift: TransportFeeShift,
  feeTerms: FeeTerm[],
): StudentConcessionFeeTier | undefined {
  if (!route) return undefined;
  const normalized = withRouteFeeSchedule(route, feeTerms);
  const schedule = routeScheduleForShift(normalized, shift).filter((line) => line.amount > 0);
  if (schedule.length > 0) {
    return {
      enabled: true,
      billingCycle: normalized.billingCycle === "Term" ? "Term" : "Monthly",
      feeAmountMode: "fixed",
      feeSchedule: schedule.map((line) => ({ ...line })),
      feeCollectionStartMonth: normalized.feeCollectionStartMonth,
    };
  }
  const flat =
    shift === "morning"
      ? normalized.morningFee
      : shift === "evening"
        ? normalized.eveningFee
        : normalized.bothFee;
  if (flat <= 0) return undefined;
  return {
    enabled: true,
    billingCycle: normalized.billingCycle === "Term" ? "Term" : "Monthly",
    feeAmountMode: "fixed",
    feeSchedule: [
      {
        id: "fl-vehicle-1",
        kind: "installment",
        label: "Vehicle Fee",
        amount: flat,
      },
    ],
    feeCollectionStartMonth: normalized.feeCollectionStartMonth,
  };
}

export function validateConcessionFees(
  hasConcession: boolean,
  fees?: StudentConcessionFees,
): string | null {
  if (!hasConcession) return null;
  const tuitionOk = isConcessionTierEnabled(fees?.tuition);
  const vehicleOk = isConcessionTierEnabled(fees?.vehicle);
  const otherOk = (fees?.otherFees ?? []).some(
    (fee) => fee.label.trim() && fee.feeSchedule.some((line) => line.amount > 0),
  );
  if (!tuitionOk && !vehicleOk && !otherOk) {
    return "Enable at least one fee tier with amounts greater than zero";
  }
  return null;
}
