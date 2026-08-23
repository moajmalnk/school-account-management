import { filterByAcademicYear } from "@/lib/academic-year";
import { formatEventDate } from "@/lib/dates";
import {
  categoryFeeTermKind,
  isVehicleFeeCategory,
  resolvePaymentFeePeriod,
  resolveTransportFeeShift,
  routeScheduleForShift,
  studentNeedsTransport,
  withClassFeeSchedule,
  resolveTransportFeeForStudent,
  type ClassConfig,
  type FeeTerm,
  type Payment,
  type Student,
  type StudentFeeBreak,
  type StudentFeeBreakAppliesTo,
  type TransportFeeShift,
  type TransportRoute,
} from "@/lib/tenant-store";

export type StudentLedgerStatus = "Paid" | "Partially Paid" | "Overdue" | "On Break";

export type StudentLedgerRow = {
  date: string;
  desc: string;
  due: string;
  charge: number;
  paid: number;
  balance: number;
  status: StudentLedgerStatus;
  /** Schedule period label when known (Term 2, May, …) */
  periodLabel?: string;
};

export type StudentReceipt = {
  id: string;
  date: string;
  amount: number;
  mode: string;
  cat?: string;
  period?: string;
};

export type StudentFeeSection = {
  totalFee: number;
  totalPaid: number;
  totalDue: number;
  overdue: boolean;
  ledger: StudentLedgerRow[];
  receipts: StudentReceipt[];
};

export type StudentVehicleFeeSection = StudentFeeSection & {
  applicable: boolean;
  routeLabel?: string;
  shift?: TransportFeeShift;
  pickup?: string;
  drop?: string;
};

export type StudentFeeStatement = StudentFeeSection & {
  tuition: StudentFeeSection;
  vehicle: StudentVehicleFeeSection;
};

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function formatDisplayDate(isoOrLabel?: string): string {
  return formatEventDate(isoOrLabel);
}

function isPastDue(dueIsoOrLabel: string, now = new Date()): boolean {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueIsoOrLabel)) {
    const due = new Date(dueIsoOrLabel + "T23:59:59");
    return !Number.isNaN(due.getTime()) && due.getTime() < now.getTime();
  }
  return true;
}

function ledgerStatus(charge: number, paid: number, dueLabel: string): StudentLedgerStatus {
  const balance = Math.max(0, charge - paid);
  if (balance <= 0) return "Paid";
  if (paid > 0) return "Partially Paid";
  return isPastDue(dueLabel) ? "Overdue" : "Partially Paid";
}

function paymentMatchesStudent(payment: Payment, student: Student): boolean {
  if (payment.payerType === "external") return false;
  const byName = normalizeName(payment.name) === normalizeName(student.name);
  if (!byName) return false;
  if (payment.className?.trim() && student.cls.trim()) {
    return true;
  }
  return true;
}

function isVehiclePayment(payment: Payment): boolean {
  return isVehicleFeeCategory(payment.cat || "");
}

function isVehicleLineLabel(label: string): boolean {
  return /vehicle|transport|bus/i.test(label);
}

/** True when a charge/installment description covers the given period label. */
export function feePeriodLabelMatches(chargeDesc: string, periodLabel: string): boolean {
  const needle = periodLabel.trim().toLowerCase();
  const hay = chargeDesc.trim().toLowerCase();
  if (!needle || !hay) return false;
  if (hay === needle) return true;
  const parts = hay.split(/[·|,/–—-]/).map((p) => p.trim()).filter(Boolean);
  if (parts.some((p) => p === needle)) return true;
  // Word-boundary-ish: avoid "May" matching "Maya"
  const re = new RegExp(`(?:^|[\\s·|,/])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[\\s·|,/])`, "i");
  return re.test(` ${hay} `);
}

function appliesToKind(appliesTo: StudentFeeBreakAppliesTo, kind: "tuition" | "vehicle"): boolean {
  return appliesTo === "both" || appliesTo === kind;
}

export function studentFeeBreaksForYear(
  breaks: StudentFeeBreak[] | undefined,
  studentId: string,
  academicYear: string,
): StudentFeeBreak[] {
  if (!breaks?.length) return [];
  return breaks.filter(
    (b) =>
      b.studentId === studentId &&
      (!b.academicYear || !academicYear || b.academicYear === academicYear),
  );
}

export function isPeriodOnBreak(
  breaks: StudentFeeBreak[] | undefined,
  studentId: string,
  academicYear: string,
  kind: "tuition" | "vehicle",
  periodLabel: string,
): boolean {
  const needle = periodLabel.trim();
  if (!needle) return false;
  return studentFeeBreaksForYear(breaks, studentId, academicYear).some(
    (b) =>
      appliesToKind(b.appliesTo, kind) &&
      b.periods.some((p) => feePeriodLabelMatches(needle, p) || feePeriodLabelMatches(p, needle)),
  );
}

export function isChargeOnBreak(
  breaks: StudentFeeBreak[] | undefined,
  studentId: string,
  academicYear: string,
  kind: "tuition" | "vehicle",
  chargeDesc: string,
  periodLabel?: string,
): boolean {
  const label = (periodLabel || chargeDesc).trim();
  if (!label) return false;
  return studentFeeBreaksForYear(breaks, studentId, academicYear).some((b) => {
    if (!appliesToKind(b.appliesTo, kind)) return false;
    return b.periods.some(
      (p) =>
        feePeriodLabelMatches(label, p) ||
        feePeriodLabelMatches(chargeDesc, p) ||
        feePeriodLabelMatches(p, label),
    );
  });
}

type ChargeDraft = {
  key: string;
  date: string;
  desc: string;
  due: string;
  charge: number;
  paid: number;
  periodLabel?: string;
  onBreak?: boolean;
};

function expectedTuitionChargeLines(
  classConfig: ClassConfig | undefined,
  feeTerms: FeeTerm[],
): ChargeDraft[] {
  if (!classConfig) return [];
  const scheduled = withClassFeeSchedule(classConfig, feeTerms).feeSchedule.filter(
    (line) => line.amount > 0 && !isVehicleLineLabel(line.label),
  );
  if (scheduled.length === 0) return [];

  return scheduled.map((line) => {
    const due = line.dueDate || "—";
    return {
      key: `line::${line.id}`,
      date: formatDisplayDate(line.dueDate),
      desc: line.label,
      due,
      charge: line.amount,
      paid: 0,
      periodLabel: line.label,
    };
  });
}

function expectedVehicleChargeLines(
  student: Student,
  classConfig: ClassConfig | undefined,
  transportRoutes: TransportRoute[],
  feeTerms: FeeTerm[],
): ChargeDraft[] {
  if (!studentNeedsTransport(student)) return [];

  const transport = resolveTransportFeeForStudent(
    student,
    transportRoutes,
    classConfig,
    undefined,
    feeTerms,
  );
  const shift = transport.shift;
  const route = transport.route;
  const routeLabel = route ? `${route.mapFrom} → ${route.mapTo}` : undefined;

  if (route) {
    const schedule = routeScheduleForShift(route, shift);
    if (schedule.length > 0) {
      return schedule.map((line) => {
        const due = line.dueDate || "—";
        return {
          key: `vehicle::${line.id}`,
          date: formatDisplayDate(line.dueDate),
          desc: routeLabel ? `Vehicle · ${line.label} · ${routeLabel}` : `Vehicle · ${line.label}`,
          due,
          charge: line.amount,
          paid: 0,
          periodLabel: line.label,
        };
      });
    }
  }

  if (classConfig) {
    const classVehicleLines = withClassFeeSchedule(classConfig, feeTerms).feeSchedule.filter(
      (line) => line.amount > 0 && isVehicleLineLabel(line.label),
    );
    if (classVehicleLines.length > 0) {
      return classVehicleLines.map((line) => {
        const due = line.dueDate || "—";
        return {
          key: `vehicle::${line.id}`,
          date: formatDisplayDate(line.dueDate),
          desc: line.label,
          due,
          charge: line.amount,
          paid: 0,
          periodLabel: line.label,
        };
      });
    }
  }

  if (transport.amount && transport.amount > 0) {
    const shiftLabel =
      shift === "morning" ? "Morning" : shift === "evening" ? "Evening" : "Both shifts";
    return [
      {
        key: "vehicle::flat",
        date: "—",
        desc: routeLabel ? `Vehicle Fee · ${routeLabel} · ${shiftLabel}` : `Vehicle Fee · ${shiftLabel}`,
        due: "—",
        charge: transport.amount,
        paid: 0,
        periodLabel: "Vehicle Fee",
      },
    ];
  }

  if (classConfig && classConfig.vehicleFeeAmount > 0) {
    return [
      {
        key: "vehicle::class",
        date: "—",
        desc: "Vehicle Fee",
        due: "—",
        charge: classConfig.vehicleFeeAmount,
        paid: 0,
        periodLabel: "Vehicle Fee",
      },
    ];
  }

  return [];
}

function markBreaksOnCharges(
  charges: ChargeDraft[],
  breaks: StudentFeeBreak[] | undefined,
  studentId: string,
  academicYear: string,
  kind: "tuition" | "vehicle",
): ChargeDraft[] {
  return charges.map((c) => {
    const onBreak = isChargeOnBreak(
      breaks,
      studentId,
      academicYear,
      kind,
      c.desc,
      c.periodLabel,
    );
    return onBreak ? { ...c, onBreak: true } : c;
  });
}

function allocatePaymentsToCharges(
  charges: ChargeDraft[],
  studentPayments: Payment[],
): { charges: ChargeDraft[]; leftovers: Payment[] } {
  const next = charges.map((c) => ({ ...c }));
  const leftovers: Payment[] = [];

  for (const payment of studentPayments) {
    const period = resolvePaymentFeePeriod(payment);
    const termKind = categoryFeeTermKind(payment.cat);
    let matchedIndex = -1;

    if (period) {
      const needle = period.trim().toLowerCase();
      matchedIndex = next.findIndex(
        (c) =>
          !c.onBreak &&
          c.paid < c.charge &&
          (c.desc.trim().toLowerCase() === needle ||
            c.periodLabel?.trim().toLowerCase() === needle ||
            c.desc.toLowerCase().includes(needle) ||
            needle.includes(c.desc.toLowerCase()) ||
            (c.periodLabel ? needle.includes(c.periodLabel.toLowerCase()) : false)),
      );
    }
    if (matchedIndex < 0 && payment.cat) {
      const cat = payment.cat.trim().toLowerCase();
      matchedIndex = next.findIndex(
        (c) =>
          !c.onBreak &&
          c.paid < c.charge &&
          (c.desc.toLowerCase().includes(cat) || cat.includes(c.desc.toLowerCase())),
      );
    }
    if (matchedIndex < 0) {
      matchedIndex = next.findIndex(
        (c) =>
          !c.onBreak &&
          c.paid < c.charge &&
          /installment|term|annual|vehicle|transport|bus/i.test(c.desc),
      );
    }
    if (matchedIndex < 0 && termKind) {
      matchedIndex = next.findIndex((c) => !c.onBreak && c.paid < c.charge);
    }
    if (matchedIndex < 0) {
      leftovers.push(payment);
      continue;
    }
    next[matchedIndex] = {
      ...next[matchedIndex],
      paid: next[matchedIndex].paid + payment.amount,
      date:
        next[matchedIndex].date === "—"
          ? formatDisplayDate(payment.time)
          : next[matchedIndex].date,
    };
  }

  return { charges: next, leftovers };
}

function leftoverPaymentLine(payment: Payment): ChargeDraft {
  const period = resolvePaymentFeePeriod(payment);
  const desc = period ? `${payment.cat} · ${period}` : payment.cat || "Fee Payment";
  return {
    key: `payment::${payment.id}`,
    date: formatDisplayDate(payment.time),
    desc,
    due: "—",
    charge: payment.amount,
    paid: payment.amount,
    periodLabel: period || undefined,
  };
}

function toLedgerRow(draft: ChargeDraft): StudentLedgerRow {
  if (draft.onBreak) {
    return {
      date: draft.date,
      desc: draft.desc,
      due: formatDisplayDate(draft.due),
      charge: draft.charge,
      paid: draft.paid,
      balance: 0,
      status: "On Break",
      periodLabel: draft.periodLabel,
    };
  }
  const charge = Math.max(draft.charge, draft.paid);
  const balance = Math.max(0, charge - draft.paid);
  return {
    date: draft.date,
    desc: draft.desc,
    due: formatDisplayDate(draft.due),
    charge,
    paid: draft.paid,
    balance,
    status: ledgerStatus(charge, draft.paid, draft.due),
    periodLabel: draft.periodLabel,
  };
}

function sortLedger(rows: StudentLedgerRow[]): StudentLedgerRow[] {
  return rows.slice().sort((a, b) => {
    // Keep On Break after payable rows, but still group by balance then name
    const aBreak = a.status === "On Break" ? 1 : 0;
    const bBreak = b.status === "On Break" ? 1 : 0;
    if (aBreak !== bBreak) return aBreak - bBreak;
    if (a.balance !== b.balance) return b.balance - a.balance;
    return a.desc.localeCompare(b.desc);
  });
}

function mapReceipts(payments: Payment[]): StudentReceipt[] {
  return payments.map((p) => ({
    id: p.id,
    date: formatDisplayDate(p.time),
    amount: p.amount,
    mode: p.mode || "—",
    cat: p.cat,
    period: resolvePaymentFeePeriod(p),
  }));
}

function summarizeSection(
  expected: ChargeDraft[],
  payments: Payment[],
  includeLeftovers = true,
): StudentFeeSection {
  const { charges, leftovers } = allocatePaymentsToCharges(expected, payments);
  const drafts =
    expected.length > 0
      ? [...charges, ...(includeLeftovers ? leftovers.map(leftoverPaymentLine) : [])]
      : payments.map(leftoverPaymentLine);

  const ledger = sortLedger(
    drafts
      .map(toLedgerRow)
      .filter((row) => row.charge > 0 || row.paid > 0 || row.status === "On Break"),
  );

  const receipts = mapReceipts(payments);
  const totalPaid = receipts.reduce((s, r) => s + r.amount, 0);
  const billable = ledger.filter((r) => r.status !== "On Break");
  const totalFee = Math.max(
    billable.reduce((s, r) => s + r.charge, 0),
    totalPaid,
  );
  const ledgerOutstanding = billable.reduce((s, r) => s + r.balance, 0);
  const totalDue = Math.max(ledgerOutstanding, Math.max(0, totalFee - totalPaid));

  return {
    totalFee,
    totalPaid,
    totalDue,
    overdue: totalDue > 0 && billable.some((r) => r.status === "Overdue"),
    ledger,
    receipts,
  };
}

function mergeSections(
  tuition: StudentFeeSection,
  vehicle: StudentVehicleFeeSection,
  studentDue: number,
): StudentFeeSection {
  const ledger = sortLedger([...tuition.ledger, ...vehicle.ledger]);
  const receipts = [...tuition.receipts, ...vehicle.receipts].sort((a, b) =>
    String(b.date).localeCompare(String(a.date)),
  );
  const totalPaid = tuition.totalPaid + vehicle.totalPaid;
  const totalFee = Math.max(tuition.totalFee + vehicle.totalFee, totalPaid);
  const billable = ledger.filter((r) => r.status !== "On Break");
  const ledgerOutstanding = billable.reduce((s, r) => s + r.balance, 0);
  const totalDue = Math.max(
    ledgerOutstanding,
    Math.max(0, studentDue),
    Math.max(0, totalFee - totalPaid),
  );

  return {
    totalFee,
    totalPaid,
    totalDue,
    overdue: totalDue > 0 && billable.some((r) => r.status === "Overdue"),
    ledger,
    receipts,
  };
}

/**
 * Build fees overview, statement ledger, and receipts from live tenant data
 * (class tier charges, transport route fees, and student payments for the active academic year).
 */
export function buildStudentFeeStatement(input: {
  student: Student;
  payments: Payment[];
  classes: ClassConfig[];
  feeTerms: FeeTerm[];
  transportRoutes?: TransportRoute[];
  academicYear: string;
  feeBreaks?: StudentFeeBreak[];
}): StudentFeeStatement {
  const { student, academicYear } = input;
  const transportRoutes = input.transportRoutes ?? [];
  const feeBreaks = input.feeBreaks ?? [];
  const yearPayments = filterByAcademicYear(input.payments, academicYear);
  const yearTerms = filterByAcademicYear(input.feeTerms, academicYear);
  const studentPayments = yearPayments
    .filter((p) => paymentMatchesStudent(p, student))
    .slice()
    .sort((a, b) => String(b.time).localeCompare(String(a.time)));

  const tuitionPayments = studentPayments.filter((p) => !isVehiclePayment(p));
  const vehiclePayments = studentPayments.filter((p) => isVehiclePayment(p));

  const classConfig = input.classes.find((c) => c.className === student.cls);
  const tuitionExpected = markBreaksOnCharges(
    expectedTuitionChargeLines(classConfig, yearTerms),
    feeBreaks,
    student.id,
    academicYear,
    "tuition",
  );
  const vehicleExpected = markBreaksOnCharges(
    expectedVehicleChargeLines(student, classConfig, transportRoutes, yearTerms),
    feeBreaks,
    student.id,
    academicYear,
    "vehicle",
  );

  const tuition = summarizeSection(tuitionExpected, tuitionPayments);
  const vehicleBase = summarizeSection(vehicleExpected, vehiclePayments, false);

  const transport = resolveTransportFeeForStudent(
    student,
    transportRoutes,
    classConfig,
    undefined,
    yearTerms,
  );
  const route = transport.route;

  const vehicle: StudentVehicleFeeSection = {
    ...vehicleBase,
    applicable: studentNeedsTransport(student),
    routeLabel: route ? `${route.mapFrom} → ${route.mapTo}` : undefined,
    shift: studentNeedsTransport(student) ? resolveTransportFeeShift(student) : undefined,
    pickup: student.busPoint1?.trim() || undefined,
    drop: student.busPoint2?.trim() || undefined,
  };

  // student.due may still include amounts covered by breaks until adjusted — prefer ledger.
  const combined = mergeSections(tuition, vehicle, 0);
  if (student.due > 0 && combined.totalDue === 0 && combined.ledger.every((r) => r.status === "On Break" || r.balance <= 0)) {
    // All remaining schedule is on break / paid — do not surface stale due as overdue.
  } else if (student.due > combined.totalDue && combined.ledger.filter((r) => r.status !== "On Break").length === 0) {
    combined.ledger.push({
      date: "—",
      desc: "Outstanding Balance",
      due: "—",
      charge: student.due,
      paid: 0,
      balance: student.due,
      status: "Overdue",
    });
    combined.totalFee = Math.max(combined.totalFee, student.due);
    combined.totalDue = student.due;
    combined.overdue = true;
  } else {
    // Cap displayed due to ledger outstanding when breaks reduced billable schedule
    const ledgerOutstanding = combined.ledger
      .filter((r) => r.status !== "On Break")
      .reduce((s, r) => s + r.balance, 0);
    combined.totalDue = Math.max(ledgerOutstanding, Math.max(0, combined.totalFee - combined.totalPaid));
    combined.overdue =
      combined.totalDue > 0 &&
      combined.ledger.some((r) => r.status === "Overdue");
  }

  return {
    ...combined,
    tuition,
    vehicle,
  };
}

/** Period labels available on a student's tuition / vehicle schedule. */
export function studentSchedulePeriodLabels(input: {
  student: Student;
  classes: ClassConfig[];
  feeTerms: FeeTerm[];
  transportRoutes?: TransportRoute[];
  academicYear: string;
  kind: "tuition" | "vehicle" | "both";
}): string[] {
  return studentSchedulePeriodOptions(input).map((o) => o.label);
}

export type StudentSchedulePeriodOption = {
  label: string;
  mode: "term" | "month";
  amount: number;
  kind: "tuition" | "vehicle";
};

function inferPeriodMode(label: string, feeTerms: FeeTerm[]): "term" | "month" {
  const needle = label.trim().toLowerCase();
  const hit = feeTerms.find((t) => t.label.trim().toLowerCase() === needle);
  if (hit) return hit.periodMode === "month" ? "month" : "term";
  if (/^term\s*\d+/i.test(label) || /annual/i.test(label)) return "term";
  return "month";
}

/** Structured schedule periods (terms / months) with amounts for pickers. */
export function studentSchedulePeriodOptions(input: {
  student: Student;
  classes: ClassConfig[];
  feeTerms: FeeTerm[];
  transportRoutes?: TransportRoute[];
  academicYear: string;
  kind: "tuition" | "vehicle" | "both";
}): StudentSchedulePeriodOption[] {
  const yearTerms = filterByAcademicYear(input.feeTerms, input.academicYear);
  const classConfig = input.classes.find((c) => c.className === input.student.cls);
  const out: StudentSchedulePeriodOption[] = [];
  const seen = new Set<string>();

  const push = (label: string, amount: number, kind: "tuition" | "vehicle") => {
    const trimmed = label.trim();
    const key = `${kind}::${trimmed.toLowerCase()}`;
    if (!trimmed || seen.has(key)) return;
    seen.add(key);
    out.push({
      label: trimmed,
      mode: inferPeriodMode(trimmed, yearTerms),
      amount: Math.max(0, Math.round(amount)),
      kind,
    });
  };

  if (input.kind === "tuition" || input.kind === "both") {
    for (const line of expectedTuitionChargeLines(classConfig, yearTerms)) {
      push(line.periodLabel || line.desc, line.charge, "tuition");
    }
  }
  if (input.kind === "vehicle" || input.kind === "both") {
    for (const line of expectedVehicleChargeLines(
      input.student,
      classConfig,
      input.transportRoutes ?? [],
      yearTerms,
    )) {
      push(line.periodLabel || line.desc, line.charge, "vehicle");
    }
  }
  return out;
}

/**
 * Unpaid scheduled amount covered by a proposed break (for student.due adjustment).
 * Positive = amount that would no longer be owed.
 */
export function unpaidAmountCoveredByBreak(input: {
  student: Student;
  payments: Payment[];
  classes: ClassConfig[];
  feeTerms: FeeTerm[];
  transportRoutes?: TransportRoute[];
  academicYear: string;
  appliesTo: StudentFeeBreakAppliesTo;
  periods: string[];
  /** Existing breaks excluding the one being edited */
  feeBreaks?: StudentFeeBreak[];
}): number {
  const draftBreak: StudentFeeBreak = {
    id: "__draft__",
    studentId: input.student.id,
    academicYear: input.academicYear,
    appliesTo: input.appliesTo,
    periods: input.periods,
  };
  const withoutDraft = (input.feeBreaks ?? []).filter((b) => b.id !== "__draft__");
  const before = buildStudentFeeStatement({
    ...input,
    feeBreaks: withoutDraft,
  });
  const after = buildStudentFeeStatement({
    ...input,
    feeBreaks: [...withoutDraft, draftBreak],
  });
  return Math.max(0, before.totalDue - after.totalDue);
}
