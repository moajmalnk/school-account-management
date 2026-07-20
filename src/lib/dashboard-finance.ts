import type { Payment } from "@/lib/tenant-store";
import {
  getPeriodDayCount,
  type CustomDateRange,
  type PaymentPeriod,
} from "@/lib/payment-period";

export const OPERATING_EXPENSES = [
  { account: "Salaries & Wages", amount: 1_220_000 },
  { account: "Vehicle Upkeep", amount: 184_000 },
  { account: "Utilities & Power", amount: 88_000 },
  { account: "Rent & Campus", amount: 240_000 },
  { account: "Office & Supplies", amount: 42_000 },
] as const;

export const ACCOUNTS_PAYABLE = [
  { payee: "BrightBus Logistics", amount: 48_200 },
  { payee: "Faculty Payroll · May", amount: 612_000 },
  { payee: "Adani Electricity", amount: 18_450 },
  { payee: "Office Stationery Co.", amount: 6_800 },
] as const;

export function totalOperatingExpense(): number {
  return OPERATING_EXPENSES.reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Scale the monthly operating-expense baseline to the selected reporting period
 * so dashboard totals move when the duration filter changes.
 */
export function operatingExpenseForPeriod(
  period: PaymentPeriod,
  customRange?: CustomDateRange,
  reference = new Date(),
): number {
  const monthly = totalOperatingExpense();
  const days = getPeriodDayCount(period, customRange, reference);
  return Math.round((monthly * days) / 30);
}

export function totalAccountsPayable(): number {
  return ACCOUNTS_PAYABLE.reduce((sum, item) => sum + item.amount, 0);
}

export function salaryPayable(): number {
  return ACCOUNTS_PAYABLE.filter((item) => /payroll|salary/i.test(item.payee)).reduce(
    (sum, item) => sum + item.amount,
    0,
  );
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
