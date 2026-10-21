import {
  classFeePrefillAmount,
  findTransportRouteForStudent,
  resolveTransportFeeShift,
  routeScheduleForShift,
  studentNeedsTransport,
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
import { formatMoney } from "@/lib/money";

export type { StudentConcessionFeeTier, StudentConcessionFees, StudentConcessionOtherFee };

export function studentHasConcession(student: Pick<Student, "hasConcession">): boolean {
  return student.hasConcession === true;
}

/** True when this tier is marked as a complete waiver, regardless of stored schedule amounts. */
export function isFullConcessionTier(
  tier?: Pick<StudentConcessionFeeTier, "enabled" | "fullConcession">,
): boolean {
  return tier?.fullConcession === true && tier.enabled !== false;
}

export function isConcessionTierEnabled(tier?: StudentConcessionFeeTier): boolean {
  if (!tier || tier.enabled === false) return false;
  if (tier.fullConcession === true) return true;
  return tier.feeSchedule.some((line) => line.amount > 0);
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
  if (isFullConcessionTier(tier)) {
    return {
      id: classConfig?.id ?? "__concession__",
      className: classConfig?.className ?? "",
      grade: classConfig?.grade ?? "",
      section: classConfig?.section ?? "",
      tuitionFeeAmount: 0,
      vehicleFeeAmount: 0,
      billingCycle: tier!.billingCycle,
      feeAmountMode: "fixed",
      feeSchedule: [],
      feeCollectionStartMonth: tier!.feeCollectionStartMonth ?? classConfig?.feeCollectionStartMonth,
      classTeacherId: classConfig?.classTeacherId,
    };
  }
  const synthetic = concessionTierToClassConfig(tier!, classConfig);
  return withClassFeeSchedule(synthetic, feeTerms);
}

/** Vehicle concession schedule lines for ledger / prefill. */
export function resolveConcessionVehicleSchedule(student: Student): ClassFeeLine[] {
  if (!studentHasConcession(student)) return [];
  const tier = student.concessionFees?.vehicle;
  if (!isConcessionTierEnabled(tier) || isFullConcessionTier(tier)) return [];
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
  if (!studentHasConcession(student)) return undefined;
  const tier = student.concessionFees?.vehicle;
  if (isFullConcessionTier(tier)) return 0;
  if (!isConcessionTierEnabled(tier)) return undefined;
  const synthetic = concessionTierToClassConfig(tier!);
  return classFeePrefillAmount(synthetic, {
    category: "Vehicle Fee",
    periodLabel: opts.periodLabel,
    periodIndex: opts.periodIndex,
    collectionStartMonth: opts.collectionStartMonth ?? tier!.feeCollectionStartMonth,
  });
}

/** Other fees that are either billed at a custom rate or fully waived. */
export function activeConcessionOtherFees(student: Student): StudentConcessionOtherFee[] {
  if (!studentHasConcession(student)) return [];
  return (student.concessionFees?.otherFees ?? []).filter(
    (fee) =>
      fee.label.trim() &&
      (fee.fullConcession === true || fee.feeSchedule.some((line) => line.amount > 0)),
  );
}

/** Custom other fees that still produce a charge. Full waivers are omitted. */
export function resolveConcessionOtherFees(student: Student): StudentConcessionOtherFee[] {
  return activeConcessionOtherFees(student).filter((fee) => fee.fullConcession !== true);
}

/** Lowercase labels of other fees marked as a full concession. */
export function fullConcessionOtherLabels(student: Student): Set<string> {
  if (!studentHasConcession(student)) return new Set();
  return new Set(
    (student.concessionFees?.otherFees ?? [])
      .filter((fee) => fee.fullConcession === true && fee.label.trim())
      .map((fee) => fee.label.trim().toLowerCase()),
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
  if (!studentHasConcession(student)) return undefined;
  const needle = label.trim().toLowerCase();
  const waived = (student.concessionFees?.otherFees ?? []).find(
    (row) => row.fullConcession === true && row.label.trim().toLowerCase() === needle,
  );
  if (waived) return 0;
  const fee = resolveConcessionOtherFees(student).find(
    (row) => row.label.trim().toLowerCase() === needle,
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
  if (isFullConcessionTier(tier)) {
    return { amount: 0, shift: "both" };
  }
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
  if (isFullConcessionTier(fees?.tuition)) {
    lines.push("Tuition fully waived");
  } else if (isConcessionTierEnabled(fees?.tuition)) {
    const total = sumFeeSchedule(fees!.tuition!.feeSchedule);
    lines.push(`Custom tuition: ${formatMoney(total)}`);
  }
  if (isFullConcessionTier(fees?.vehicle)) {
    lines.push("Bus fee fully waived");
  } else if (isConcessionTierEnabled(fees?.vehicle)) {
    const total = sumFeeSchedule(fees!.vehicle!.feeSchedule);
    lines.push(`Custom bus fee: ${formatMoney(total)}`);
  }
  for (const other of activeConcessionOtherFees(student)) {
    if (other.fullConcession) {
      lines.push(`${other.label} fully waived`);
      continue;
    }
    const total = sumFeeSchedule(other.feeSchedule);
    lines.push(`${other.label}: ${formatMoney(total)}`);
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

export function emptyConcessionVehicleTier(): StudentConcessionFeeTier {
  return {
    enabled: true,
    billingCycle: "Monthly",
    feeAmountMode: "fixed",
    feeSchedule: [
      {
        id: "fl-vehicle-1",
        kind: "installment",
        label: "1st Installment",
        amount: 0,
      },
    ],
  };
}

export function resolveVehicleConcessionSeed(
  matchedClass: ClassConfig | undefined,
  feeTerms: FeeTerm[],
  transportRoutes: TransportRoute[],
  busPoint1?: string,
  busPoint2?: string,
  className?: string,
): StudentConcessionFeeTier {
  const studentStub = {
    needsBus: true as const,
    busPoint1,
    busPoint2,
    cls: className ?? matchedClass?.className ?? "",
  };
  const shift = resolveTransportFeeShift(studentStub);
  const route = findTransportRouteForStudent(studentStub, transportRoutes);
  return (
    defaultConcessionTierFromRoute(route, shift, feeTerms) ??
    defaultConcessionTierFromClass(matchedClass, feeTerms, "vehicle") ??
    emptyConcessionVehicleTier()
  );
}

export function validateConcessionFees(
  hasConcession: boolean,
  fees?: StudentConcessionFees,
): string | null {
  if (!hasConcession) return null;
  const others = fees?.otherFees ?? [];
  for (const fee of others) {
    const active =
      fee.fullConcession === true || fee.feeSchedule.some((line) => line.amount > 0);
    if (active && !fee.label.trim()) {
      return "Enter a name for each other fee";
    }
  }
  const tuitionOk = isConcessionTierEnabled(fees?.tuition);
  const vehicleOk = isConcessionTierEnabled(fees?.vehicle);
  const otherOk = others.some(
    (fee) =>
      fee.label.trim() &&
      (fee.fullConcession === true || fee.feeSchedule.some((line) => line.amount > 0)),
  );
  if (!tuitionOk && !vehicleOk && !otherOk) {
    return "Enable at least one fee with an amount, or mark it as a full concession";
  }
  return null;
}

export type ConcessionReportRow = {
  studentId: string;
  name: string;
  cls: string;
  guardian: string;
  reason: string;
  covers: string;
  coversTuition: boolean;
  coversVehicle: boolean;
  coversOther: boolean;
  standardTuition: number;
  concessionTuition: number;
  standardVehicle: number;
  concessionVehicle: number;
  otherFees: number;
  /** Class/route schedule total for heads under concession. */
  standardTotal: number;
  /** Concession schedule total billed to the student. */
  concessionTotal: number;
  /** Standard − concession (never negative). */
  relief: number;
};

function standardTuitionScheduleTotal(
  classConfig: ClassConfig | undefined,
  feeTerms: FeeTerm[],
): number {
  if (!classConfig) return 0;
  const scheduled = withClassFeeSchedule(classConfig, feeTerms).feeSchedule.filter(
    (line) => line.amount > 0 && !/vehicle|transport|bus/i.test(line.label),
  );
  if (scheduled.length > 0) return sumFeeSchedule(scheduled);
  return Math.max(0, Math.round(classConfig.tuitionFeeAmount) || 0);
}

function standardVehicleScheduleTotal(
  student: Student,
  classConfig: ClassConfig | undefined,
  transportRoutes: TransportRoute[],
  feeTerms: FeeTerm[],
): number {
  if (!studentNeedsTransport(student)) return 0;
  const shift = resolveTransportFeeShift(student);
  const route = findTransportRouteForStudent(student, transportRoutes);
  if (route) {
    const schedule = routeScheduleForShift(withRouteFeeSchedule(route, feeTerms), shift);
    if (schedule.length > 0) return sumFeeSchedule(schedule);
  }
  if (classConfig) {
    const classVehicle = withClassFeeSchedule(classConfig, feeTerms).feeSchedule.filter(
      (line) => line.amount > 0 && /vehicle|transport|bus/i.test(line.label),
    );
    if (classVehicle.length > 0) return sumFeeSchedule(classVehicle);
    return Math.max(0, Math.round(classConfig.vehicleFeeAmount) || 0);
  }
  return 0;
}

/** Roster of active concession students with standard vs concession fee comparison. */
export function buildConcessionReportRows(input: {
  students: Student[];
  classes: ClassConfig[];
  feeTerms: FeeTerm[];
  transportRoutes?: TransportRoute[];
}): ConcessionReportRow[] {
  const transportRoutes = input.transportRoutes ?? [];
  const rows: ConcessionReportRow[] = [];

  for (const student of input.students) {
    if (!studentHasConcession(student)) continue;
    const classConfig = input.classes.find((c) => c.className === student.cls);
    const tuitionTier = student.concessionFees?.tuition;
    const vehicleTier = student.concessionFees?.vehicle;
    const coversTuition = isConcessionTierEnabled(tuitionTier);
    const coversVehicle = isConcessionTierEnabled(vehicleTier);
    const otherList = activeConcessionOtherFees(student);
    const coversOther = otherList.length > 0;
    if (!coversTuition && !coversVehicle && !coversOther) continue;

    const waivedLabels = fullConcessionOtherLabels(student);
    const standardTuition = coversTuition
      ? standardTuitionScheduleTotal(classConfig, input.feeTerms)
      : 0;
    const concessionTuition =
      coversTuition && !isFullConcessionTier(tuitionTier)
        ? sumFeeSchedule(
            tuitionTier!.feeSchedule.filter(
              (line) => !waivedLabels.has(line.label.trim().toLowerCase()),
            ),
          )
        : 0;
    const standardVehicle = coversVehicle
      ? standardVehicleScheduleTotal(student, classConfig, transportRoutes, input.feeTerms)
      : 0;
    const concessionVehicle =
      coversVehicle && !isFullConcessionTier(vehicleTier)
        ? sumFeeSchedule(vehicleTier!.feeSchedule)
        : 0;
    const otherFees = otherList.reduce(
      (sum, fee) => (fee.fullConcession ? sum : sum + sumFeeSchedule(fee.feeSchedule)),
      0,
    );

    const standardTotal = standardTuition + standardVehicle;
    const concessionTotal = concessionTuition + concessionVehicle + otherFees;
    const relief =
      Math.max(0, standardTuition - concessionTuition) +
      Math.max(0, standardVehicle - concessionVehicle);

    const covers = [
      coversTuition ? (isFullConcessionTier(tuitionTier) ? "Tuition (full)" : "Tuition") : null,
      coversVehicle ? (isFullConcessionTier(vehicleTier) ? "Vehicle (full)" : "Vehicle") : null,
      coversOther
        ? otherList.every((fee) => fee.fullConcession)
          ? "Other (full)"
          : "Other"
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

    rows.push({
      studentId: student.id,
      name: student.name,
      cls: student.cls,
      guardian: student.guardian,
      reason: student.concessionReason?.trim() || "—",
      covers: covers || "—",
      coversTuition,
      coversVehicle,
      coversOther,
      standardTuition,
      concessionTuition,
      standardVehicle,
      concessionVehicle,
      otherFees,
      standardTotal,
      concessionTotal,
      relief,
    });
  }

  return rows.sort((a, b) => b.relief - a.relief || a.name.localeCompare(b.name));
}
