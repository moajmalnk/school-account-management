import { filterByAcademicYear } from "@/lib/academic-year";
import {
  categoryFeeTermKind,
  resolvePaymentFeePeriod,
  withClassFeeSchedule,
  type ClassConfig,
  type FeeTerm,
  type Payment,
  type Student,
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

export type StudentFeeStatement = {
  totalDue: number;
  totalPaid: number;
  balance: number;
  overdue: boolean;
  ledger: StudentLedgerRow[];
  receipts: StudentReceipt[];
};

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function formatDisplayDate(isoOrLabel?: string): string {
  if (!isoOrLabel?.trim()) return "—";
  const raw = isoOrLabel.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const d = new Date(raw.slice(0, 10) + "T12:00:00");
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
    }
  }
  // Payment stamps like "Today · 10:22" / "12 Mar 2025"
  if (raw.toLowerCase().startsWith("today")) return "Today";
  if (raw.toLowerCase().startsWith("yesterday")) return "Yesterday";
  return raw;
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
    // Prefer class match when present, but don't drop historical class moves
    return true;
  }
  return true;
}

type ChargeDraft = {
  key: string;
  date: string;
  desc: string;
  due: string;
  charge: number;
  paid: number;
};

function expectedChargeLines(
  classConfig: ClassConfig | undefined,
  feeTerms: FeeTerm[],
): ChargeDraft[] {
  if (!classConfig) return [];
  const scheduled = withClassFeeSchedule(classConfig, feeTerms).feeSchedule.filter(
    (line) => line.amount > 0,
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
          c.desc.trim().toLowerCase() === needle ||
          c.desc.toLowerCase().includes(needle),
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
          c.paid < c.charge && /installment|term|annual/i.test(c.desc),
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

/**
 * Build fees overview, statement ledger, and receipts from live tenant data
 * (class tier charges + student payments for the active academic year).
 */
export function buildStudentFeeStatement(input: {
  student: Student;
  payments: Payment[];
  classes: ClassConfig[];
  feeTerms: FeeTerm[];
  academicYear: string;
}): StudentFeeStatement {
  const { student, academicYear } = input;
  const yearPayments = filterByAcademicYear(input.payments, academicYear);
  const yearTerms = filterByAcademicYear(input.feeTerms, academicYear);
  const studentPayments = yearPayments
    .filter((p) => paymentMatchesStudent(p, student))
    .slice()
    .sort((a, b) => String(b.time).localeCompare(String(a.time)));

  const classConfig = input.classes.find((c) => c.className === student.cls);
  const expected = expectedChargeLines(classConfig, yearTerms);
  const { charges, leftovers } = allocatePaymentsToCharges(expected, studentPayments);

  const drafts =
    expected.length > 0
      ? [...charges, ...leftovers.map(leftoverPaymentLine)]
      : studentPayments.map(leftoverPaymentLine);

  // If there is an outstanding due with no open charge lines, surface it.
  const ledgerBalances = drafts.reduce(
    (sum, d) => sum + Math.max(0, Math.max(d.charge, d.paid) - d.paid),
    0,
  );
  if (student.due > 0 && ledgerBalances === 0 && drafts.length === 0) {
    drafts.push({
      key: "outstanding",
      date: "—",
      desc: "Outstanding Balance",
      due: "—",
      charge: student.due,
      paid: 0,
    });
  } else if (student.due > ledgerBalances && drafts.length > 0) {
    const gap = student.due - ledgerBalances;
    drafts.push({
      key: "outstanding-gap",
      date: "—",
      desc: "Outstanding Balance",
      due: "—",
      charge: gap,
      paid: 0,
    });
  }

  const ledger = drafts
    .map(toLedgerRow)
    .filter((row) => row.charge > 0 || row.paid > 0)
    .sort((a, b) => {
      // Unpaid first, then by description
      if (a.balance !== b.balance) return b.balance - a.balance;
      return a.desc.localeCompare(b.desc);
    });

  const receipts: StudentReceipt[] = studentPayments.map((p) => ({
    id: p.id,
    date: formatDisplayDate(p.time),
    amount: p.amount,
    mode: p.mode || "—",
    cat: p.cat,
    period: resolvePaymentFeePeriod(p),
  }));

  const totalPaid = receipts.reduce((s, r) => s + r.amount, 0);
  const balance = Math.max(0, student.due);
  const totalDue = Math.max(
    ledger.reduce((s, r) => s + r.charge, 0),
    totalPaid + balance,
  );

  return {
    totalDue,
    totalPaid,
    balance,
    overdue: balance > 0,
    ledger,
    receipts,
  };
}
