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

export type PayeeType = "Salary" | "Other Expense";

/** Map stored payee types, including legacy "Supplier" / "Vendor" labels. */
export function normalizePayeeType(value: string | undefined | null): PayeeType {
  return /salary|payroll/i.test((value ?? "").trim()) ? "Salary" : "Other Expense";
}

function asTimedPayment(row: FinanceDisbursement): Payment {
  return {
    id: row.id || `tmp-${row.payee}-${row.amount}-${row.time || ""}`,
    name: row.payee,
    cat: row.payeeType ? normalizePayeeType(row.payeeType) : "Other Expense",
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
      : row.payee?.trim() || (row.payeeType ? normalizePayeeType(row.payeeType) : "Other");
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

type PaymentLike = Pick<Payment, "mode" | "amount" | "narration">;

/** Parse Bank/Cash amounts from narration when mode is Both. */
export function parsePaymentModeSplit(
  narration: string | undefined,
): { bank: number; cash: number } | null {
  const parts = (narration ?? "")
    .split(/\s*[·|]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  let bank = 0;
  let cash = 0;
  let foundBank = false;
  let foundCash = false;

  for (const part of parts) {
    const cleaned = part.replace(/^Fee breakdown:\s*/i, "").trim();
    const match = cleaned.match(/^(Bank|Cash)\s+(?:₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)\s*$/i);
    if (!match) continue;
    const amount = Number(match[2].replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount < 0) continue;
    if (/^Bank$/i.test(match[1])) {
      bank = amount;
      foundBank = true;
    } else {
      cash = amount;
      foundCash = true;
    }
  }

  if (!foundBank && !foundCash) return null;
  return { bank, cash };
}

/** Cash portion of a receipt — Cash mode full amount; Both mode uses narration split. */
export function paymentCashAmount(payment: PaymentLike): number {
  const mode = (payment.mode || "").trim();
  if (mode === "Cash") return payment.amount;
  if (mode === "Both") {
    const split = parsePaymentModeSplit(payment.narration);
    return split?.cash ?? 0;
  }
  return 0;
}

/** Bank portion of a receipt — Bank mode full amount; Both mode uses narration split. */
export function paymentBankAmount(payment: PaymentLike): number {
  const mode = (payment.mode || "").trim();
  if (mode === "Cash") return 0;
  if (mode === "Bank") return payment.amount;
  if (mode === "Both") {
    const split = parsePaymentModeSplit(payment.narration);
    if (split) return split.bank;
    return payment.amount;
  }
  return payment.amount;
}

export function cashOnHand(payments: Payment[]): number {
  return payments.reduce((sum, p) => sum + paymentCashAmount(p), 0);
}

export function bankBalance(payments: Payment[]): number {
  return payments.reduce((sum, p) => sum + paymentBankAmount(p), 0);
}

export function formatInr(amount: number): string {
  return `₹\u00a0${amount.toLocaleString("en-IN")}`;
}
