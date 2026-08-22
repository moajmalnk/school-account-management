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

function attendanceLabelForMonth(
  pay: ReturnType<typeof staffPayableSalary>,
): string {
  if (!pay.attendance) return "Full gross · no attendance";
  return `${pay.attendance.daysPresent}/${pay.attendance.workingDays} days · ${Math.round(pay.ratio * 100)}%`;
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
      const payments = salaryHistory.filter(
        (entry) => salaryHistoryPayrollMonth(entry) === month,
      );
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
