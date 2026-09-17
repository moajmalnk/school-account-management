import { filterByAcademicYear } from "@/lib/academic-year";
import { formatEventDate, parseEventDate, parseFlexibleDate, toIsoDate } from "@/lib/dates";
import {
  isVehicleFeeCategory,
  resolvePaymentFeeLines,
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
import {
  isConcessionTierEnabled,
  resolveConcessionOtherFees,
  resolveConcessionTuitionClassConfig,
  resolveConcessionVehicleSchedule,
} from "@/lib/student-concession-fees";

export type StudentLedgerStatus = "Paid" | "Partially Paid" | "Due" | "Overdue" | "On Break";

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
  /** ISO `YYYY-MM-DD` for chronological sort (display `due` may be "Today"). */
  dueIso?: string;
  /** Receipt-only rows must not inflate Total Fee. */
  origin?: "schedule" | "receipt";
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
  /** Outstanding balance on installments past due date. */
  overdueDue: number;
  /** Outstanding balance on installments due today (Asia/Kolkata). */
  dueToday: number;
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
  const raw = dueIsoOrLabel.trim();
  if (!raw || raw === "—" || raw === "-") return false;
  if (/^today\b/i.test(raw)) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const due = new Date(`${raw}T23:59:59`);
    return !Number.isNaN(due.getTime()) && due.getTime() < now.getTime();
  }
  const parsed = parseFlexibleDate(raw) ?? parseEventDate(raw, now);
  if (parsed) {
    const todayIso = toIsoDate(now);
    const dueIso = toIsoDate(parsed);
    if (dueIso === todayIso) return false;
    const dueEnd = new Date(`${dueIso}T23:59:59`);
    return !Number.isNaN(dueEnd.getTime()) && dueEnd.getTime() < now.getTime();
  }
  const legacy = Date.parse(raw);
  if (Number.isFinite(legacy)) return legacy < now.getTime();
  return false;
}

function isDueToday(dueIsoOrLabel: string, now = new Date()): boolean {
  const raw = dueIsoOrLabel.trim();
  if (!raw || raw === "—" || raw === "-") return false;
  if (/^today\b/i.test(raw)) return true;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw.slice(0, 10) === toIsoDate(now);
  }
  const parsed = parseFlexibleDate(raw) ?? parseEventDate(raw, now);
  if (!parsed) return false;
  return toIsoDate(parsed) === toIsoDate(now);
}

/** Split outstanding ledger balances into overdue vs due-today buckets. */
export function summarizeStudentDueBuckets(
  ledger: StudentLedgerRow[],
  now = new Date(),
): { overdueDue: number; dueToday: number } {
  let overdueDue = 0;
  let dueToday = 0;
  for (const row of ledger) {
    if (row.status === "On Break" || row.status === "Paid") continue;
    const balance = Math.max(0, row.balance);
    if (balance <= 0) continue;
    const dueRef = row.dueIso || row.due;
    if (row.status === "Overdue" || isPastDue(dueRef, now)) {
      overdueDue += balance;
    } else if (isDueToday(dueRef, now)) {
      dueToday += balance;
    }
  }
  return { overdueDue, dueToday };
}

/**
 * Paid amount drives status — never mark a ₹0 paid line as Partially Paid.
 * Due = unpaid, not yet past due date · Overdue = unpaid past due ·
 * Partially Paid = some payment received, balance remains.
 */
export function resolveStudentLedgerStatus(
  charge: number,
  paid: number,
  dueLabel: string,
): StudentLedgerStatus {
  const safeCharge = Math.max(0, charge);
  const safePaid = Math.max(0, paid);
  const balance = Math.max(0, safeCharge - safePaid);
  if (balance <= 0 && safeCharge > 0) return "Paid";
  if (safePaid > 0 && balance > 0) return "Partially Paid";
  if (safePaid <= 0 && balance > 0) {
    return isPastDue(dueLabel) ? "Overdue" : "Due";
  }
  return "Due";
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
  const parts = hay
    .split(/[·|,/–—-]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.some((p) => p === needle)) return true;
  // Word-boundary-ish: avoid "May" matching "Maya"
  const re = new RegExp(
    `(?:^|[\\s·|,/])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[\\s·|,/])`,
    "i",
  );
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
  origin?: "schedule" | "receipt";
};

function expectedTuitionChargeLines(
  student: Student,
  classConfig: ClassConfig | undefined,
  feeTerms: FeeTerm[],
): ChargeDraft[] {
  const concessionClass = resolveConcessionTuitionClassConfig(student, classConfig, feeTerms);
  const effectiveClass = concessionClass ?? classConfig;
  if (!effectiveClass) return [];
  const scheduled = withClassFeeSchedule(effectiveClass, feeTerms).feeSchedule.filter(
    (line) => line.amount > 0 && !isVehicleLineLabel(line.label),
  );
  if (scheduled.length === 0) return [];

  return scheduled.map((line) => {
    const due = line.dueDate || "—";
    const prefix = concessionClass ? "Tuition (Concession) · " : "";
    return {
      key: `line::${line.id}`,
      date: formatDisplayDate(line.dueDate),
      desc: `${prefix}${line.label}`,
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

  const concessionSchedule = resolveConcessionVehicleSchedule(student);
  if (concessionSchedule.length > 0) {
    return concessionSchedule.map((line) => {
      const due = line.dueDate || "—";
      return {
        key: `vehicle::concession::${line.id}`,
        date: formatDisplayDate(line.dueDate),
        desc: `Vehicle (Concession) · ${line.label}`,
        due,
        charge: line.amount,
        paid: 0,
        periodLabel: line.label,
      };
    });
  }

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
        desc: routeLabel
          ? `Vehicle Fee · ${routeLabel} · ${shiftLabel}`
          : `Vehicle Fee · ${shiftLabel}`,
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

function expectedOtherConcessionChargeLines(student: Student): ChargeDraft[] {
  const out: ChargeDraft[] = [];
  for (const fee of resolveConcessionOtherFees(student)) {
    for (const line of fee.feeSchedule.filter((row) => row.amount > 0)) {
      const due = line.dueDate || "—";
      out.push({
        key: `other::${fee.id}::${line.id}`,
        date: formatDisplayDate(line.dueDate),
        desc: `${fee.label} · ${line.label}`,
        due,
        charge: line.amount,
        paid: 0,
        periodLabel: line.label,
      });
    }
  }
  return out;
}

function markBreaksOnCharges(
  charges: ChargeDraft[],
  breaks: StudentFeeBreak[] | undefined,
  studentId: string,
  academicYear: string,
  kind: "tuition" | "vehicle",
): ChargeDraft[] {
  return charges.map((c) => {
    const onBreak = isChargeOnBreak(breaks, studentId, academicYear, kind, c.desc, c.periodLabel);
    return onBreak ? { ...c, onBreak: true } : c;
  });
}

function chargeDueTime(charge: ChargeDraft): number {
  const parsed = parseFlexibleDate(charge.due);
  return parsed?.getTime() ?? Number.POSITIVE_INFINITY;
}

function chargeHasRoom(charge: ChargeDraft): boolean {
  return !charge.onBreak && charge.paid < charge.charge;
}

function periodMatchesCharge(charge: ChargeDraft, period: string): boolean {
  const needle = period.trim();
  if (!needle) return false;
  return (
    feePeriodLabelMatches(charge.desc, needle) ||
    feePeriodLabelMatches(charge.periodLabel || "", needle) ||
    (charge.periodLabel ? needle.toLowerCase().includes(charge.periodLabel.toLowerCase()) : false)
  );
}

function earliestUnpaidIndex(charges: ChargeDraft[]): number {
  let best = -1;
  let bestTime = Number.POSITIVE_INFINITY;
  for (let i = 0; i < charges.length; i += 1) {
    const charge = charges[i];
    if (!chargeHasRoom(charge)) continue;
    const time = chargeDueTime(charge);
    if (time < bestTime) {
      bestTime = time;
      best = i;
    }
  }
  return best;
}

function findChargeIndex(
  charges: ChargeDraft[],
  match: (charge: ChargeDraft) => boolean,
): number {
  let best = -1;
  let bestTime = Number.POSITIVE_INFINITY;
  for (let i = 0; i < charges.length; i += 1) {
    const charge = charges[i];
    if (!chargeHasRoom(charge) || !match(charge)) continue;
    const time = chargeDueTime(charge);
    if (time < bestTime) {
      bestTime = time;
      best = i;
    }
  }
  return best;
}

function applyToCharge(
  charges: ChargeDraft[],
  index: number,
  amount: number,
  paymentTime?: string,
): number {
  const charge = charges[index];
  const room = Math.max(0, charge.charge - charge.paid);
  const applied = Math.min(room, Math.max(0, amount));
  if (applied <= 0) return 0;
  charges[index] = {
    ...charge,
    paid: charge.paid + applied,
    date: charge.date === "—" ? formatDisplayDate(paymentTime) : charge.date,
  };
  return applied;
}

function applyAmountToCharges(
  charges: ChargeDraft[],
  amount: number,
  paymentTime: string | undefined,
  preferredIndex: number,
): number {
  let remaining = Math.max(0, amount);
  if (preferredIndex >= 0) {
    remaining -= applyToCharge(charges, preferredIndex, remaining, paymentTime);
  }
  while (remaining > 0) {
    const nextIndex = earliestUnpaidIndex(charges);
    if (nextIndex < 0) break;
    remaining -= applyToCharge(charges, nextIndex, remaining, paymentTime);
  }
  return remaining;
}

function allocatePaymentsToCharges(
  charges: ChargeDraft[],
  studentPayments: Payment[],
): { charges: ChargeDraft[]; leftovers: Payment[] } {
  const next = charges.map((c) => ({ ...c }));
  const leftovers: Payment[] = [];

  for (const payment of studentPayments) {
    let remaining = Math.max(0, payment.amount);
    const lines = resolvePaymentFeeLines(payment).filter((line) => line.amount > 0);

    for (const line of lines) {
      if (remaining <= 0) break;
      const lineAmount = Math.min(remaining, line.amount);
      const preferred = findChargeIndex(
        next,
        (charge) =>
          periodMatchesCharge(charge, line.feePeriod) ||
          (line.description
            ? charge.desc.toLowerCase().includes(line.description.trim().toLowerCase())
            : false),
      );
      const leftover = applyAmountToCharges(next, lineAmount, payment.time, preferred);
      remaining -= lineAmount - leftover;
    }

    if (remaining > 0) {
      const period = resolvePaymentFeePeriod(payment);
      const cat = payment.cat?.trim() || "";
      const byPeriod = period
        ? findChargeIndex(next, (charge) => periodMatchesCharge(charge, period))
        : -1;
      const byCategory =
        byPeriod < 0 && cat.length >= 4
          ? findChargeIndex(next, (charge) => {
              const desc = charge.desc.toLowerCase();
              const needle = cat.toLowerCase();
              return desc.includes(needle) || needle.includes(desc.split("·")[0]?.trim() || desc);
            })
          : -1;
      remaining = applyAmountToCharges(
        next,
        remaining,
        payment.time,
        byPeriod >= 0 ? byPeriod : byCategory,
      );
    }

    if (remaining > 0) {
      leftovers.push({ ...payment, amount: remaining });
    }
  }

  return { charges: next, leftovers };
}

function leftoverPaymentLine(
  payment: Payment,
  origin: "schedule" | "receipt" = "receipt",
): ChargeDraft {
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
    origin,
  };
}

function toLedgerRow(draft: ChargeDraft): StudentLedgerRow {
  const dueRaw = (draft.due ?? "").trim();
  const dueIso = /^\d{4}-\d{2}-\d{2}/.test(dueRaw) ? dueRaw.slice(0, 10) : undefined;
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
      dueIso,
      origin: draft.origin ?? "schedule",
    };
  }
  const charge = Math.max(0, draft.charge);
  const paid = Math.max(0, draft.paid);
  const balance = Math.max(0, charge - paid);
  return {
    date: draft.date,
    desc: draft.desc,
    due: formatDisplayDate(draft.due),
    charge,
    paid,
    balance,
    status: resolveStudentLedgerStatus(charge, paid, draft.due),
    periodLabel: draft.periodLabel,
    dueIso,
    origin: draft.origin ?? "schedule",
  };
}

function ledgerDueTime(row: StudentLedgerRow): number {
  // Prefer preserved ISO, then display due/date labels.
  const parsed =
    parseFlexibleDate(row.dueIso) ?? parseFlexibleDate(row.due) ?? parseFlexibleDate(row.date);
  return parsed?.getTime() ?? Number.POSITIVE_INFINITY;
}

function sortLedger(rows: StudentLedgerRow[]): StudentLedgerRow[] {
  return rows.slice().sort((a, b) => {
    // Keep On Break after payable rows, then chronological by due date
    // (not by label — "AUG"/"DEC"/"FEB" alphabetical order is wrong).
    const aBreak = a.status === "On Break" ? 1 : 0;
    const bBreak = b.status === "On Break" ? 1 : 0;
    if (aBreak !== bBreak) return aBreak - bBreak;
    const dueDiff = ledgerDueTime(a) - ledgerDueTime(b);
    if (dueDiff !== 0) return dueDiff;
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

function uniqueReceipts(rows: StudentReceipt[]): StudentReceipt[] {
  const seen = new Set<string>();
  const out: StudentReceipt[] = [];
  for (const row of rows) {
    const key = row.id.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export function uniqueStudentReceipts(rows: StudentReceipt[]): StudentReceipt[] {
  return uniqueReceipts(rows);
}

export function isScheduledFeeLedgerRow(row: StudentLedgerRow): boolean {
  if (row.status === "On Break") return false;
  if (row.origin === "receipt") return false;
  return true;
}

export function feeStatementHeadline(
  ledger: StudentLedgerRow[],
  receipts: StudentReceipt[],
): {
  totalFee: number;
  totalPaid: number;
  totalDue: number;
  allocatedPaid: number;
  unallocatedPaid: number;
} {
  const scheduled = ledger.filter(isScheduledFeeLedgerRow);
  const totalFee = scheduled.reduce((sum, row) => sum + row.charge, 0);
  const totalPaid = uniqueReceipts(receipts).reduce((sum, row) => sum + row.amount, 0);
  const allocatedPaid = scheduled.reduce((sum, row) => sum + row.paid, 0);
  return {
    totalFee,
    totalPaid,
    totalDue: Math.max(0, totalFee - totalPaid),
    allocatedPaid,
    unallocatedPaid: Math.max(0, totalPaid - allocatedPaid),
  };
}

function paymentMatchesOtherCharge(payment: Payment, charges: ChargeDraft[]): boolean {
  if (charges.length === 0 || isVehiclePayment(payment)) return false;
  const cat = (payment.cat || "").trim().toLowerCase();
  if (!cat) return false;
  return charges.some((charge) => {
    const desc = charge.desc.toLowerCase();
    const feeName = desc.split("·")[0]?.trim() || desc;
    return Boolean(feeName) && (desc.includes(cat) || cat.includes(feeName));
  });
}

function computeFeeTotals(
  ledger: StudentLedgerRow[],
  receipts: StudentReceipt[],
): Pick<
  StudentFeeSection,
  "totalFee" | "totalPaid" | "totalDue" | "overdueDue" | "dueToday" | "overdue"
> {
  const headline = feeStatementHeadline(ledger, receipts);
  const { overdueDue, dueToday } = summarizeStudentDueBuckets(ledger);
  return {
    totalFee: headline.totalFee,
    totalPaid: headline.totalPaid,
    totalDue: headline.totalDue,
    overdueDue: Math.min(overdueDue, headline.totalDue),
    dueToday: Math.min(
      dueToday,
      Math.max(0, headline.totalDue - Math.min(overdueDue, headline.totalDue)),
    ),
    overdue: headline.totalDue > 0 && ledger.some((row) => row.status === "Overdue"),
  };
}

function summarizeSection(
  expected: ChargeDraft[],
  payments: Payment[],
  includeLeftovers = true,
): StudentFeeSection {
  const { charges, leftovers } = allocatePaymentsToCharges(expected, payments);
  const drafts =
    expected.length > 0
      ? charges
      : includeLeftovers
        ? leftovers.map((payment) => leftoverPaymentLine(payment, "schedule"))
        : [];

  const ledger = sortLedger(
    drafts
      .map(toLedgerRow)
      .filter((row) => row.charge > 0 || row.paid > 0 || row.status === "On Break"),
  );

  return {
    ledger,
    receipts: uniqueReceipts(mapReceipts(payments)),
    ...computeFeeTotals(ledger, mapReceipts(payments)),
  };
}

function mergeSections(
  a: StudentFeeSection,
  b: StudentFeeSection,
  _studentDue: number,
): StudentFeeSection {
  const ledger = sortLedger([...a.ledger, ...b.ledger]);
  const receipts = uniqueReceipts([...a.receipts, ...b.receipts]).sort((x, y) =>
    String(y.date).localeCompare(String(x.date)),
  );
  return {
    ledger,
    receipts,
    ...computeFeeTotals(ledger, receipts),
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
    .sort((a, b) => String(a.time).localeCompare(String(b.time)));

  const classConfig = input.classes.find((c) => c.className === student.cls);
  const tuitionExpected = markBreaksOnCharges(
    expectedTuitionChargeLines(student, classConfig, yearTerms),
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
  const otherExpected = expectedOtherConcessionChargeLines(student);
  const otherPayments = studentPayments.filter((p) => paymentMatchesOtherCharge(p, otherExpected));
  const otherPaymentIds = new Set(otherPayments.map((p) => p.id));
  const tuitionPayments = studentPayments.filter(
    (p) => !isVehiclePayment(p) && !otherPaymentIds.has(p.id),
  );
  const vehiclePayments = studentPayments.filter((p) => isVehiclePayment(p));

  const tuition = summarizeSection(tuitionExpected, tuitionPayments);
  const vehicleBase = summarizeSection(vehicleExpected, vehiclePayments, false);
  const otherBase = summarizeSection(otherExpected, otherPayments, false);

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
  const combined = mergeSections(mergeSections(tuition, vehicle, 0), otherBase, 0);

  if (
    student.due > combined.totalDue &&
    combined.ledger.filter((r) => r.status !== "On Break" && isScheduledFeeLedgerRow(r)).length === 0
  ) {
    combined.ledger.push({
      date: "—",
      desc: "Outstanding Balance",
      due: "—",
      charge: student.due,
      paid: 0,
      balance: student.due,
      status: "Overdue",
      origin: "schedule",
    });
  }

  Object.assign(combined, computeFeeTotals(combined.ledger, combined.receipts));
  combined.overdue = combined.totalDue > 0 && combined.ledger.some((r) => r.status === "Overdue");

  return {
    ...combined,
    tuition: {
      ...tuition,
      ledger: sortLedger([...tuition.ledger, ...otherBase.ledger]),
    },
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
    for (const line of expectedTuitionChargeLines(input.student, classConfig, yearTerms)) {
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
  if (input.kind === "both") {
    for (const line of expectedOtherConcessionChargeLines(input.student)) {
      push(line.periodLabel || line.desc, line.charge, "tuition");
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

export type StudentFeeRosterTotals = {
  totalFee: number;
  totalPaid: number;
  /** Upcoming / pending (excludes overdue). */
  pendingDue: number;
  overdueDue: number;
  /** Remaining unpaid (pending + overdue). */
  outstanding: number;
  outstandingCount: number;
  /** Students with past-due unpaid balances. */
  overdueCount: number;
  paidCount: number;
  /** Live outstanding per student id — same source as the Payments tab. */
  dueByStudentId: Record<string, number>;
  /** Pending (not yet overdue) portion per student. */
  pendingByStudentId: Record<string, number>;
  /** Overdue portion per student. */
  overdueByStudentId: Record<string, number>;
};

/** Same totals as each student Payments tab, summed across a roster. */
export function sumStudentFeeRoster(input: {
  students: Student[];
  payments: Payment[];
  classes: ClassConfig[];
  feeTerms: FeeTerm[];
  transportRoutes?: TransportRoute[];
  academicYear: string;
  feeBreaks?: StudentFeeBreak[];
}): StudentFeeRosterTotals {
  let totalFee = 0;
  let totalPaid = 0;
  let pendingDue = 0;
  let overdueDue = 0;
  let outstandingCount = 0;
  let overdueCount = 0;
  let paidCount = 0;
  const dueByStudentId: Record<string, number> = {};
  const pendingByStudentId: Record<string, number> = {};
  const overdueByStudentId: Record<string, number> = {};

  for (const student of input.students) {
    const statement = buildStudentFeeStatement({
      student,
      payments: input.payments,
      classes: input.classes,
      feeTerms: input.feeTerms,
      transportRoutes: input.transportRoutes,
      academicYear: input.academicYear,
      feeBreaks: input.feeBreaks,
    });
    const pending = Math.max(0, statement.totalDue - statement.overdueDue);
    const overdue = Math.max(0, statement.overdueDue);
    totalFee += statement.totalFee;
    totalPaid += statement.totalPaid;
    pendingDue += pending;
    overdueDue += overdue;
    dueByStudentId[student.id] = statement.totalDue;
    pendingByStudentId[student.id] = pending;
    overdueByStudentId[student.id] = overdue;
    if (statement.totalDue > 0) outstandingCount += 1;
    else paidCount += 1;
    if (overdue > 0) overdueCount += 1;
  }

  return {
    totalFee,
    totalPaid,
    pendingDue,
    overdueDue,
    outstanding: pendingDue + overdueDue,
    outstandingCount,
    overdueCount,
    paidCount,
    dueByStudentId,
    pendingByStudentId,
    overdueByStudentId,
  };
}

/** Overlay live fee-statement dues onto a roster for directory / report status. */
export function withLiveStudentFeeDues(
  students: Student[],
  dueByStudentId: Record<string, number>,
): Student[] {
  return students.map((student) => {
    const liveDue = dueByStudentId[student.id];
    if (typeof liveDue !== "number" || !Number.isFinite(liveDue)) return student;
    const due = Math.max(0, Math.round(liveDue));
    return student.due === due ? student : { ...student, due };
  });
}
