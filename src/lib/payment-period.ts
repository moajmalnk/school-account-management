import type { Payment } from "@/lib/tenant-store";

export type PaymentPeriod =
  | "today"
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "last_6_months"
  | "last_year"
  | "custom";

export type CustomDateRange = {
  from: string;
  to: string;
};

export const PAYMENT_PERIOD_OPTIONS: { value: PaymentPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_3_months", label: "Last three month" },
  { value: "last_6_months", label: "Last 6 month" },
  { value: "last_year", label: "Last Year" },
  { value: "custom", label: "Custom" },
];

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function parsePaymentDate(time: string, reference = new Date()): Date | null {
  const normalized = time.trim().toLowerCase();

  if (normalized.startsWith("today")) {
    return startOfDay(reference);
  }
  if (normalized.startsWith("yesterday")) {
    return startOfDay(addDays(reference, -1));
  }

  const relativeMatch = normalized.match(/^(\d+)\s*d\s*ago/);
  if (relativeMatch) {
    return startOfDay(addDays(reference, -Number(relativeMatch[1])));
  }

  const dayMonthMatch = time.match(/(\d{1,2})\s+([A-Za-z]{3})/);
  if (dayMonthMatch) {
    const day = Number(dayMonthMatch[1]);
    const month = MONTHS[dayMonthMatch[2].toLowerCase()];
    if (month !== undefined) {
      let year = reference.getFullYear();
      const candidate = new Date(year, month, day);
      if (candidate > reference) {
        year -= 1;
      }
      return startOfDay(new Date(year, month, day));
    }
  }

  return null;
}

function getPeriodRange(
  period: PaymentPeriod,
  customRange: CustomDateRange | undefined,
  reference = new Date(),
): { start: Date; end: Date } | null {
  const today = startOfDay(reference);

  switch (period) {
    case "today":
      return { start: today, end: endOfDay(reference) };
    case "this_month":
      return { start: startOfMonth(reference), end: endOfDay(reference) };
    case "last_month": {
      const lastMonth = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    }
    case "last_3_months":
      return {
        start: startOfMonth(new Date(reference.getFullYear(), reference.getMonth() - 2, 1)),
        end: endOfDay(reference),
      };
    case "last_6_months":
      return {
        start: startOfMonth(new Date(reference.getFullYear(), reference.getMonth() - 5, 1)),
        end: endOfDay(reference),
      };
    case "last_year":
      return {
        start: startOfMonth(new Date(reference.getFullYear(), reference.getMonth() - 11, 1)),
        end: endOfDay(reference),
      };
    case "custom": {
      if (!customRange?.from || !customRange?.to) return null;
      const start = startOfDay(new Date(customRange.from));
      const end = endOfDay(new Date(customRange.to));
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
      return start <= end ? { start, end } : { start: end, end: start };
    }
    default:
      return null;
  }
}

function paymentMatchesPeriod(
  payment: Payment,
  period: PaymentPeriod,
  customRange: CustomDateRange | undefined,
  reference = new Date(),
): boolean {
  const range = getPeriodRange(period, customRange, reference);
  if (!range) return true;

  const parsed = parsePaymentDate(payment.time, reference);
  if (!parsed) {
    return period !== "today";
  }

  return parsed >= range.start && parsed <= range.end;
}

export function filterPaymentsByPeriod(
  payments: Payment[],
  period: PaymentPeriod,
  customRange?: CustomDateRange,
  reference = new Date(),
): Payment[] {
  return payments.filter((payment) =>
    paymentMatchesPeriod(payment, period, customRange, reference),
  );
}
