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
  type TransportFeeShift,
  type TransportRoute,
} from "@/lib/tenant-store";

export type StudentLedgerStatus = "Paid" | "Partially Paid" | "Overdue";

export type StudentLedgerRow = {
  date: string;
  desc: string;
  due: string;
  charge: number;
  paid: number;
  balance: number;
  status: StudentLedgerStatus;
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

type ChargeDraft = {
  key: string;
  date: string;
  desc: string;
  due: string;
  charge: number;
  paid: number;
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
      },
    ];
  }

  return [];
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
          c.paid < c.charge &&
          (c.desc.trim().toLowerCase() === needle ||
            c.desc.toLowerCase().includes(needle) ||
            needle.includes(c.desc.toLowerCase())),
      );
    }
    if (matchedIndex < 0 && payment.cat) {
      const cat = payment.cat.trim().toLowerCase();
      matchedIndex = next.findIndex(
        (c) =>
          c.paid < c.charge &&
          (c.desc.toLowerCase().includes(cat) || cat.includes(c.desc.toLowerCase())),
      );
    }
    if (matchedIndex < 0) {
      matchedIndex = next.findIndex(
        (c) =>
          c.paid < c.charge && /installment|term|annual|vehicle|transport|bus/i.test(c.desc),
      );
    }
    if (matchedIndex < 0 && termKind) {
      matchedIndex = next.findIndex((c) => c.paid < c.charge);
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
  };
}

function toLedgerRow(draft: ChargeDraft): StudentLedgerRow {
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
  };
}

function sortLedger(rows: StudentLedgerRow[]): StudentLedgerRow[] {
  return rows.slice().sort((a, b) => {
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
      .filter((row) => row.charge > 0 || row.paid > 0),
  );

  const receipts = mapReceipts(payments);
  const totalPaid = receipts.reduce((s, r) => s + r.amount, 0);
  const totalFee = Math.max(ledger.reduce((s, r) => s + r.charge, 0), totalPaid);
  const ledgerOutstanding = ledger.reduce((s, r) => s + r.balance, 0);
  const totalDue = Math.max(ledgerOutstanding, Math.max(0, totalFee - totalPaid));

  return {
    totalFee,
    totalPaid,
    totalDue,
    overdue: totalDue > 0 && ledger.some((r) => r.status === "Overdue"),
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
  const totalFee = Math.max(
    tuition.totalFee + vehicle.totalFee,
    totalPaid,
  );
  const ledgerOutstanding = ledger.reduce((s, r) => s + r.balance, 0);
  const totalDue = Math.max(
    ledgerOutstanding,
    Math.max(0, studentDue),
    Math.max(0, totalFee - totalPaid),
  );

  return {
    totalFee,
    totalPaid,
    totalDue,
    overdue: totalDue > 0 && ledger.some((r) => r.status === "Overdue"),
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
}): StudentFeeStatement {
  const { student, academicYear } = input;
  const transportRoutes = input.transportRoutes ?? [];
  const yearPayments = filterByAcademicYear(input.payments, academicYear);
  const yearTerms = filterByAcademicYear(input.feeTerms, academicYear);
  const studentPayments = yearPayments
    .filter((p) => paymentMatchesStudent(p, student))
    .slice()
    .sort((a, b) => String(b.time).localeCompare(String(a.time)));

  const tuitionPayments = studentPayments.filter((p) => !isVehiclePayment(p));
  const vehiclePayments = studentPayments.filter((p) => isVehiclePayment(p));

  const classConfig = input.classes.find((c) => c.className === student.cls);
  const tuitionExpected = expectedTuitionChargeLines(classConfig, yearTerms);
  const vehicleExpected = expectedVehicleChargeLines(
    student,
    classConfig,
    transportRoutes,
    yearTerms,
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

  const combined = mergeSections(tuition, vehicle, student.due);

  // Surface unmatched student.due when ledger doesn't explain it.
  if (student.due > combined.totalDue && combined.ledger.length === 0) {
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
  }

  return {
    ...combined,
    tuition,
    vehicle,
  };
}
