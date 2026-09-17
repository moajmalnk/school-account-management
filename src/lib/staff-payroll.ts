import { formatEventDateTime } from "@/lib/dates";
import {
  currentPayrollMonth,
  formatPayrollMonthLabel,
  isSalaryMonthSettled,
  salaryHistoryPayrollMonth,
  salaryPaidAmountForMonth,
  staffPayableSalary,
  totalSalaryDisbursed,
  type Staff,
  type StaffSalaryHistoryEntry,
} from "@/lib/tenant-store";

export type StaffPayrollLedgerStatus = "Paid" | "Queued" | "Partial" | "Due" | "No due";

export type StaffPayrollLedgerRow = {
  month: string;
  monthLabel: string;
  attendanceLabel: string;
  payable: number;
  paid: number;
  outstanding: number;
  status: StaffPayrollLedgerStatus;
};

export type StaffPayrollPayment = {
  id: string;
  date: string;
  amount: number;
  mode: string;
  description: string;
  status: string;
  month: string | null;
};

export type StaffPayrollStatement = {
  payrollMonth: string;
  totalPayable: number;
  totalPaid: number;
  totalDue: number;
  currentMonthPayable: number;
  currentMonthPaid: number;
  currentMonthDue: number;
  currentMonthSettled: boolean;
  overdue: boolean;
  ledger: StaffPayrollLedgerRow[];
  payments: StaffPayrollPayment[];
  lastPayment: StaffPayrollPayment | null;
};

function ledgerStatus(
  payable: number,
  paid: number,
  payments: StaffSalaryHistoryEntry[],
): StaffPayrollLedgerStatus {
  const settled = payable <= 0 || paid >= payable;
  const hasQueued = payments.some((entry) => entry.status === "Queued");
  const hasCleared = payments.some(
    (entry) => entry.status === "Cleared" || entry.status === "Paid",
  );
  if (payable <= 0) return "No due";
  if (settled) return hasQueued && !hasCleared ? "Queued" : "Paid";
  if (paid > 0) return "Partial";
  return "Due";
}

/** Payroll register / report status for one staff month (Due · Partial · Queued · Paid). */
export function staffPayrollMonthStatus(
  staff: Staff,
  month: string,
): StaffPayrollLedgerStatus {
  const pay = staffPayableSalary(staff, month);
  const payments = (staff.salaryHistory ?? []).filter(
    (entry) => salaryHistoryPayrollMonth(entry) === month,
  );
  const paid = payments.reduce((sum, entry) => sum + entry.amount, 0);
  return ledgerStatus(pay.payable, paid, payments);
}

/** Update the best-matching salary history row to a new disbursement status. */
export function syncStaffSalaryHistoryStatus(
  member: Staff,
  patch: {
    amount: number;
    status: StaffSalaryHistoryEntry["status"];
    month?: string | null;
    paidAt?: string | null;
  },
): Staff {
  const history = member.salaryHistory ?? [];
  if (!history.length) return member;

  const month = patch.month?.trim() || null;
  const paidDay = (patch.paidAt ?? "").slice(0, 10);
  const amount = Math.round(Number(patch.amount) || 0);

  let bestIdx = -1;
  let bestScore = -1;
  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    if (Math.round(entry.amount) !== amount) continue;
    let score = 1;
    const entryMonth = salaryHistoryPayrollMonth(entry);
    if (month && entryMonth === month) score += 3;
    if (paidDay && (entry.paidAt ?? "").slice(0, 10) === paidDay) score += 2;
    if (entry.status !== patch.status) score += 1;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  if (bestIdx < 0) return member;
  const current = history[bestIdx];
  if (current.status === patch.status) return member;
  const nextHistory = history.map((entry, index) =>
    index === bestIdx ? { ...entry, status: patch.status } : entry,
  );
  return { ...member, salaryHistory: nextHistory };
}

/**
 * Infer payroll month from a salary disbursement description (named month or YYYY-MM).
 */
export function salaryMonthFromDisbursementDesc(desc: string | undefined | null): string | null {
  const text = desc ?? "";
  const iso = text.match(/\b(\d{4}-\d{2})\b/);
  if (iso) return iso[1];
  const named = text.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i,
  );
  if (!named) return null;
  const months: Record<string, number> = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  };
  const monthNum = months[named[1].toLowerCase()];
  if (!monthNum) return null;
  return `${named[2]}-${String(monthNum).padStart(2, "0")}`;
}

function attendanceLabelForMonth(pay: ReturnType<typeof staffPayableSalary>): string {
  if (!pay.attendance) return "Full gross · no attendance";
  const paidLeave = pay.attendance.paidLeaveDays || 0;
  const unpaidLeave = pay.attendance.unpaidLeaveDays || 0;
  const leaveBits = [
    paidLeave > 0 ? `${paidLeave} paid leave` : null,
    unpaidLeave > 0 ? `${unpaidLeave} unpaid leave` : null,
  ].filter(Boolean);
  const leaveSuffix = leaveBits.length ? ` · ${leaveBits.join(" · ")}` : "";
  return `${pay.payableDays}/${pay.attendance.workingDays} payable days${leaveSuffix} · ${Math.round(pay.ratio * 100)}%`;
}

function mapPayment(entry: StaffSalaryHistoryEntry): StaffPayrollPayment {
  return {
    id: entry.id,
    date: formatEventDateTime(entry.paidAt),
    amount: entry.amount,
    mode: entry.mode || "—",
    description: entry.description,
    status: entry.status,
    month: salaryHistoryPayrollMonth(entry),
  };
}

/** Build payroll overview, monthly ledger, and payment history for a staff member. */
export function buildStaffPayrollStatement(
  staff: Staff,
  payrollMonth: string = currentPayrollMonth(),
): StaffPayrollStatement {
  const salaryHistory = [...(staff.salaryHistory ?? [])].sort((a, b) =>
    String(b.paidAt).localeCompare(String(a.paidAt)),
  );

  const monthSet = new Set<string>();
  for (const row of staff.attendanceByMonth ?? []) monthSet.add(row.month);
  for (const entry of salaryHistory) {
    const month = salaryHistoryPayrollMonth(entry);
    if (month) monthSet.add(month);
  }
  monthSet.add(payrollMonth);

  const ledger: StaffPayrollLedgerRow[] = Array.from(monthSet)
    .sort((a, b) => b.localeCompare(a))
    .map((month) => {
      const pay = staffPayableSalary(staff, month);
      const payments = salaryHistory.filter((entry) => salaryHistoryPayrollMonth(entry) === month);
      const paid = payments.reduce((sum, entry) => sum + entry.amount, 0);
      const outstanding = Math.max(0, pay.payable - paid);
      return {
        month,
        monthLabel: formatPayrollMonthLabel(month),
        attendanceLabel: attendanceLabelForMonth(pay),
        payable: pay.payable,
        paid,
        outstanding,
        status: ledgerStatus(pay.payable, paid, payments),
      };
    });

  const payments = salaryHistory.map(mapPayment);
  const lastPayment = payments[0] ?? null;
  const totalPaid = totalSalaryDisbursed(salaryHistory);
  const totalPayable = ledger.reduce((sum, row) => sum + row.payable, 0);
  const ledgerOutstanding = ledger.reduce((sum, row) => sum + row.outstanding, 0);
  const totalDue = Math.max(ledgerOutstanding, Math.max(0, totalPayable - totalPaid));

  const currentMonthPay = staffPayableSalary(staff, payrollMonth);
  const currentMonthPaid = salaryPaidAmountForMonth(salaryHistory, payrollMonth);
  const currentMonthDue = Math.max(0, currentMonthPay.payable - currentMonthPaid);
  const currentMonthSettled = isSalaryMonthSettled(
    salaryHistory,
    payrollMonth,
    currentMonthPay.payable,
  );

  return {
    payrollMonth,
    totalPayable,
    totalPaid,
    totalDue,
    currentMonthPayable: currentMonthPay.payable,
    currentMonthPaid,
    currentMonthDue,
    currentMonthSettled,
    overdue: totalDue > 0 && ledger.some((row) => row.status === "Due" || row.status === "Partial"),
    ledger,
    payments,
    lastPayment,
  };
}
