import type { DisbursementPayload } from "@/lib/api/records";
import {
  filterPaymentsByPeriod,
  type CustomDateRange,
  type PaymentPeriod,
} from "@/lib/payment-period";
import type { Payment } from "@/lib/tenant-store";

/** @deprecated Kept empty — live totals come from disbursements API. */
export const OPERATING_EXPENSES: readonly { account: string; amount: number }[] = [];

/** @deprecated Kept empty — live payables come from queued disbursements / staff. */
export const ACCOUNTS_PAYABLE: readonly { payee: string; amount: number }[] = [];

export type FinanceDisbursement = Pick<
  DisbursementPayload,
  "id" | "payee" | "desc" | "amount" | "mode" | "payeeType" | "time" | "status"
>;

function asTimedPayment(row: FinanceDisbursement): Payment {
  return {
    id: row.id || `tmp-${row.payee}-${row.amount}-${row.time || ""}`,
    name: row.payee,
    cat: row.payeeType || "Vendor",
    mode: row.mode || "Bank",
    amount: row.amount,
    time: row.time || "",
  };
}

export function isSalaryDisbursement(row: FinanceDisbursement): boolean {
  return /salary|payroll/i.test(row.payeeType || "") || /salary|payroll/i.test(row.payee);
}

export function isClearedDisbursement(row: FinanceDisbursement): boolean {
  return (row.status || "Cleared") !== "Queued";
}

export function isQueuedDisbursement(row: FinanceDisbursement): boolean {
  return row.status === "Queued";
}

export function filterDisbursementsByPeriod(
  rows: FinanceDisbursement[],
  period: PaymentPeriod,
  customRange?: CustomDateRange,
  reference = new Date(),
): FinanceDisbursement[] {
  const tagged = rows.map((row, index) => {
    const payment = asTimedPayment(row);
    return {
      row,
      payment: { ...payment, id: payment.id || `idx-${index}` },
    };
  });
  const allowed = new Set(
    filterPaymentsByPeriod(
      tagged.map((t) => t.payment),
      period,
      customRange,
      reference,
    ).map((p) => p.id),
  );
  return tagged.filter(({ payment }) => allowed.has(payment.id)).map(({ row }) => row);
}

/** Sum of cleared (paid) disbursements in the selected period. */
export function operatingExpenseForPeriod(
  rows: FinanceDisbursement[] = [],
  period: PaymentPeriod = "this_month",
  customRange?: CustomDateRange,
  reference = new Date(),
): number {
  return filterDisbursementsByPeriod(rows, period, customRange, reference)
    .filter(isClearedDisbursement)
    .reduce((sum, row) => sum + row.amount, 0);
}

export function totalOperatingExpense(rows: FinanceDisbursement[] = []): number {
  return rows.filter(isClearedDisbursement).reduce((sum, row) => sum + row.amount, 0);
}

export function expenseSegmentsFromDisbursements(
  rows: FinanceDisbursement[],
  period?: PaymentPeriod,
  customRange?: CustomDateRange,
): { label: string; value: number }[] {
  const scoped =
    period != null
      ? filterDisbursementsByPeriod(rows, period, customRange).filter(isClearedDisbursement)
      : rows.filter(isClearedDisbursement);

  const buckets = new Map<string, number>();
  for (const row of scoped) {
    const label = isSalaryDisbursement(row)
      ? "Salaries & Wages"
      : row.payee?.trim() || row.payeeType || "Other";
    buckets.set(label, (buckets.get(label) ?? 0) + row.amount);
  }
  return Array.from(buckets.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function queuedPayables(rows: FinanceDisbursement[]): FinanceDisbursement[] {
  return rows.filter(isQueuedDisbursement);
}

export function totalAccountsPayable(rows: FinanceDisbursement[] = []): number {
  return queuedPayables(rows).reduce((sum, row) => sum + row.amount, 0);
}

/**
 * Salary still owed for the dashboard: only queued salary disbursements
 * (payroll that was created / Make Payment → Salary and not yet cleared).
 * Do not estimate “this month’s” payroll from staff rates before salary is created.
 */
export function queuedSalaryPayables(rows: FinanceDisbursement[] = []): FinanceDisbursement[] {
  return queuedPayables(rows).filter(isSalaryDisbursement);
}

export function salaryPayable(rows: FinanceDisbursement[] = []): number {
  return queuedSalaryPayables(rows).reduce((sum, row) => sum + row.amount, 0);
}

export function cashOnHand(payments: Payment[]): number {
  return payments.filter((p) => p.mode === "Cash").reduce((sum, p) => sum + p.amount, 0);
}

export function bankBalance(payments: Payment[]): number {
  return payments.filter((p) => p.mode !== "Cash").reduce((sum, p) => sum + p.amount, 0);
}

export function formatInr(amount: number): string {
  return `₹\u00a0${amount.toLocaleString("en-IN")}`;
}
