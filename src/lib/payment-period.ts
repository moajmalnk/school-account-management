import { parseEventDate } from "@/lib/dates";
import type { Payment } from "@/lib/tenant-store";

export type PaymentPeriod =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "last_6_months"
  | "this_year"
  | "last_year"
  | "all"
  | "custom";

export type CustomDateRange = {
  from: string;
  to: string;
};

export const PAYMENT_PERIOD_OPTIONS: { value: PaymentPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This week" },
  { value: "last_week", label: "Last week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_year", label: "This year" },
  { value: "last_year", label: "Last year" },
  { value: "all", label: "All" },
  { value: "custom", label: "Custom" },
];

/** Day Book is a cash book — keep the period tight. */
export const DAY_BOOK_PERIOD_OPTIONS: { value: PaymentPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "custom", label: "Custom" },
];

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

function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const weekday = day.getDay();
  const mondayOffset = weekday === 0 ? 6 : weekday - 1;
  return addDays(day, -mondayOffset);
}

function endOfWeek(date: Date): Date {
  return endOfDay(addDays(startOfWeek(date), 6));
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date: Date): Date {
  return endOfDay(new Date(date.getFullYear(), 11, 31));
}

function parsePaymentDate(time: string, reference = new Date()): Date | null {
  return parseEventDate(time, reference);
}

export function getPeriodRange(
  period: PaymentPeriod,
  customRange: CustomDateRange | undefined,
  reference = new Date(),
): { start: Date; end: Date } | null {
  const today = startOfDay(reference);

  switch (period) {
    case "today":
      return { start: today, end: endOfDay(reference) };
    case "yesterday": {
      const day = addDays(today, -1);
      return { start: startOfDay(day), end: endOfDay(day) };
    }
    case "this_week":
      return { start: startOfWeek(reference), end: endOfWeek(reference) };
    case "last_week": {
      const last = addDays(startOfWeek(reference), -7);
      return { start: last, end: endOfWeek(last) };
    }
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
    case "this_year":
      return { start: startOfYear(reference), end: endOfDay(reference) };
    case "last_year": {
      const prev = new Date(reference.getFullYear() - 1, 0, 1);
      return { start: startOfYear(prev), end: endOfYear(prev) };
    }
    case "all":
      return null;
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

export function timestampMatchesPeriod(
  time: string | Date | null | undefined,
  period: PaymentPeriod,
  customRange?: CustomDateRange,
  reference = new Date(),
): boolean {
  const range = getPeriodRange(period, customRange, reference);
  if (!range) return true;
  const parsed = time instanceof Date ? time : parsePaymentDate(String(time ?? ""), reference);
  if (!parsed) return false;
  return parsed >= range.start && parsed <= range.end;
}

function paymentMatchesPeriod(
  payment: Payment,
  period: PaymentPeriod,
  customRange: CustomDateRange | undefined,
  reference = new Date(),
): boolean {
  return timestampMatchesPeriod(payment.time, period, customRange, reference);
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

export type DatedAmount = {
  time?: string | null;
  amount: number;
};

/**
 * Build chart points for the selected period.
 * Income and expense are summed into the same calendar buckets from their dates.
 * "All" uses the span of the actual receipts and payments (months, or years when longer).
 */
export function buildIncomeExpenseSeries(
  payments: Payment[],
  expenseTotal: number,
  period: PaymentPeriod,
  customRange?: CustomDateRange,
  reference = new Date(),
  expenses?: DatedAmount[],
): IncomeExpensePoint[] {
  const incomeTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const expenseRows = expenses ?? [];
  const datedExpenseTotal = expenseRows.reduce((sum, row) => sum + row.amount, 0);
  const expenseFallback = expenses ? datedExpenseTotal : expenseTotal;

  const range =
    getPeriodRange(period, customRange, reference) ??
    boundsFromDatedAmounts(
      [
        ...payments.map((payment) => payment.time),
        ...expenseRows.map((row) => row.time),
      ],
      reference,
    );

  if (!range) {
    return [{ label: "All", income: incomeTotal, expense: expenseFallback }];
  }

  const buckets = createPeriodBuckets(period, range.start, range.end, reference);
  if (buckets.length === 0) {
    return [{ label: "Period", income: incomeTotal, expense: expenseFallback }];
  }

  const incomeByBucket = sumIntoBuckets(
    buckets,
    payments.map((payment) => ({ time: payment.time, amount: payment.amount })),
    reference,
  );
  const expenseByBucket = expenses
    ? sumIntoBuckets(buckets, expenseRows, reference)
    : spreadTotalAcrossBuckets(buckets, expenseTotal);

  return buckets.map((bucket, index) => ({
    label: bucket.label,
    income: incomeByBucket[index],
    expense: expenseByBucket[index],
  }));
}

function boundsFromDatedAmounts(
  times: Array<string | null | undefined>,
  reference: Date,
): { start: Date; end: Date } | null {
  const dates = times
    .map((time) => parsePaymentDate(String(time ?? ""), reference))
    .filter((date): date is Date => date != null);
  if (dates.length === 0) return null;
  const earliest = new Date(Math.min(...dates.map((date) => date.getTime())));
  const latest = new Date(Math.max(...dates.map((date) => date.getTime())));
  return { start: startOfMonth(earliest), end: endOfDay(latest) };
}

function sumIntoBuckets(buckets: PeriodBucket[], rows: DatedAmount[], reference: Date): number[] {
  const totals = buckets.map(() => 0);
  for (const row of rows) {
    const date = parsePaymentDate(String(row.time ?? ""), reference);
    if (!date) {
      totals[totals.length - 1] += row.amount;
      continue;
    }
    const index = buckets.findIndex((bucket) => date >= bucket.start && date <= bucket.end);
    if (index >= 0) totals[index] += row.amount;
  }
  return totals;
}

/** Used only when expense rows are not available — keeps the period total intact. */
function spreadTotalAcrossBuckets(buckets: PeriodBucket[], total: number): number[] {
  const weights = buckets.map((bucket) =>
    Math.max(
      1,
      Math.round(
        (startOfDay(bucket.end).getTime() - startOfDay(bucket.start).getTime()) / 86_400_000,
      ) + 1,
    ),
  );
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  const amounts = weights.map((weight) => Math.round((total * weight) / weightSum));
  const drift = total - amounts.reduce((sum, amount) => sum + amount, 0);
  if (amounts.length > 0) amounts[amounts.length - 1] += drift;
  return amounts;
}

type PeriodBucket = { label: string; start: Date; end: Date };

function createPeriodBuckets(
  period: PaymentPeriod,
  start: Date,
  end: Date,
  reference: Date,
): PeriodBucket[] {
  if (period === "all") {
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    return months > 12 ? yearBucketsInRange(start, end) : monthBucketsInRange(start, end);
  }

  if (period === "today" || period === "yesterday") {
    const day = startOfDay(start);
    return [
      {
        label: "AM",
        start: day,
        end: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 11, 59, 59, 999),
      },
      {
        label: "PM",
        start: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12, 0, 0, 0),
        end: endOfDay(day),
      },
    ];
  }

  if (period === "this_week" || period === "last_week") {
    return weekBucketsInRange(start, end);
  }

  if (period === "this_month" || period === "last_month") {
    return weekBucketsInRange(start, end);
  }

  if (
    period === "last_3_months" ||
    period === "last_6_months" ||
    period === "this_year" ||
    period === "last_year"
  ) {
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

function yearBucketsInRange(start: Date, end: Date): PeriodBucket[] {
  const buckets: PeriodBucket[] = [];
  let year = start.getFullYear();
  while (year <= end.getFullYear() && buckets.length < 12) {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = endOfYear(yearStart);
    buckets.push({
      label: String(year),
      start: yearStart < start ? start : yearStart,
      end: yearEnd > end ? end : yearEnd,
    });
    year += 1;
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
    const spansYears = start.getFullYear() !== end.getFullYear();
    buckets.push({
      label: cursor.toLocaleDateString(
        "en-IN",
        spansYears ? { month: "short", year: "2-digit" } : { month: "short" },
      ),
      start: clippedStart,
      end: clippedEnd,
    });
    cursor = startOfMonth(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  }
  return buckets;
}
