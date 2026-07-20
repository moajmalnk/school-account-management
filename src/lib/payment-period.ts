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

/** Inclusive calendar-day count for a selected period (min 1). */
export function getPeriodDayCount(
  period: PaymentPeriod,
  customRange?: CustomDateRange,
  reference = new Date(),
): number {
  const range = getPeriodRange(period, customRange, reference);
  if (!range) return 30;
  const start = startOfDay(range.start).getTime();
  const end = startOfDay(range.end).getTime();
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

export type IncomeExpensePoint = {
  label: string;
  income: number;
  expense: number;
};

/**
 * Build chart points for the selected period.
 * Income is summed from payments; expense is spread across the same buckets.
 */
export function buildIncomeExpenseSeries(
  payments: Payment[],
  expenseTotal: number,
  period: PaymentPeriod,
  customRange?: CustomDateRange,
  reference = new Date(),
): IncomeExpensePoint[] {
  const range = getPeriodRange(period, customRange, reference);
  if (!range) {
    return [{ label: "All", income: payments.reduce((s, p) => s + p.amount, 0), expense: expenseTotal }];
  }

  const buckets = createPeriodBuckets(period, range.start, range.end, reference);
  if (buckets.length === 0) {
    return [{ label: "Period", income: 0, expense: expenseTotal }];
  }

  const incomeByBucket = buckets.map(() => 0);
  for (const payment of payments) {
    const date = parsePaymentDate(payment.time, reference);
    if (!date) {
      incomeByBucket[incomeByBucket.length - 1] += payment.amount;
      continue;
    }
    const idx = buckets.findIndex((b) => date >= b.start && date <= b.end);
    if (idx >= 0) incomeByBucket[idx] += payment.amount;
  }

  const weights = buckets.map((b) =>
    Math.max(1, Math.round((startOfDay(b.end).getTime() - startOfDay(b.start).getTime()) / 86_400_000) + 1),
  );
  const weightSum = weights.reduce((s, w) => s + w, 0) || 1;

  return buckets.map((bucket, index) => ({
    label: bucket.label,
    income: incomeByBucket[index],
    expense: Math.round((expenseTotal * weights[index]) / weightSum),
  }));
}

type PeriodBucket = { label: string; start: Date; end: Date };

function createPeriodBuckets(
  period: PaymentPeriod,
  start: Date,
  end: Date,
  reference: Date,
): PeriodBucket[] {
  if (period === "today") {
    const day = startOfDay(reference);
    return [
      { label: "AM", start: day, end: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 11, 59, 59, 999) },
      {
        label: "PM",
        start: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12, 0, 0, 0),
        end: endOfDay(reference),
      },
    ];
  }

  if (period === "this_month" || period === "last_month") {
    return weekBucketsInRange(start, end);
  }

  if (period === "last_3_months" || period === "last_6_months" || period === "last_year") {
    return monthBucketsInRange(start, end);
  }

  // custom — prefer weeks if short, else months
  const days = Math.max(
    1,
    Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / 86_400_000) + 1,
  );
  if (days <= 45) return weekBucketsInRange(start, end);
  return monthBucketsInRange(start, end);
}

function weekBucketsInRange(start: Date, end: Date): PeriodBucket[] {
  const buckets: PeriodBucket[] = [];
  let cursor = startOfDay(start);
  let week = 1;
  while (cursor <= end && week <= 6) {
    const weekEnd = endOfDay(addDays(cursor, 6));
    const clippedEnd = weekEnd > end ? end : weekEnd;
    buckets.push({ label: `W${week}`, start: cursor, end: clippedEnd });
    cursor = startOfDay(addDays(clippedEnd, 1));
    week += 1;
  }
  return buckets;
}

function monthBucketsInRange(start: Date, end: Date): PeriodBucket[] {
  const buckets: PeriodBucket[] = [];
  let cursor = startOfMonth(start);
  while (cursor <= end && buckets.length < 12) {
    const monthEnd = endOfMonth(cursor);
    const clippedStart = cursor < start ? start : cursor;
    const clippedEnd = monthEnd > end ? end : monthEnd;
    buckets.push({
      label: cursor.toLocaleDateString("en-IN", { month: "short" }),
      start: clippedStart,
      end: clippedEnd,
    });
    cursor = startOfMonth(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  }
  return buckets;
}
