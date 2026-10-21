import { feePeriodLabelMatches, buildStudentFeeStatement, type StudentFeeStatement } from "@/lib/student-fees";
import {
  isVehicleFeeLineLabel,
  splitClassName,
  withClassFeeSchedule,
  type ClassConfig,
  type FeeTerm,
  type Payment,
  type Student,
  type StudentFeeBreak,
  type TransportRoute,
} from "@/lib/tenant-store";

export type FeeSheetGroup = "term" | "head";

export type FeeSheetColumn = {
  key: string;
  label: string;
  group: FeeSheetGroup;
};

const VEHICLE_KEY = "head:vehicle";

export type FeeSheetPaymentFilter = "all" | "paid" | "partial" | "unpaid";

export type FeeSheetPaymentCounts = Record<FeeSheetPaymentFilter, number>;

export function feeSheetCatalog(
  classes: ClassConfig[],
  classNames: Iterable<string>,
  feeTerms: FeeTerm[] = [],
): { terms: FeeSheetColumn[]; heads: FeeSheetColumn[] } {
  const allowed = new Set(classNames);
  const terms: FeeSheetColumn[] = [];
  const heads: FeeSheetColumn[] = [];
  const seen = new Set<string>();
  let vehicle = false;

  for (const cls of classes) {
    if (allowed.size > 0 && !allowed.has(cls.className)) continue;
    const scheduled = withClassFeeSchedule(cls, feeTerms);
    if (scheduled.vehicleFeeAmount > 0) vehicle = true;
    for (const line of scheduled.feeSchedule) {
      const label = line.label.trim();
      if (!label) continue;
      if (isVehicleFeeLineLabel(label)) {
        vehicle = true;
        continue;
      }
      const group: FeeSheetGroup = line.kind === "one_time" ? "head" : "term";
      const key = `${group}:${label.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const column = { key, label, group };
      if (group === "head") heads.push(column);
      else terms.push(column);
    }
  }

  if (vehicle) {
    heads.push({ key: VEHICLE_KEY, label: "Vehicle", group: "head" });
  }

  return { terms, heads };
}

function feeSheetRowMatchesColumn(
  row: StudentFeeStatement["ledger"][number],
  column: FeeSheetColumn,
): boolean {
  if (row.status === "On Break" || row.origin === "receipt") return false;
  const vehicleRow = /vehicle/i.test(row.desc);
  if (column.key === VEHICLE_KEY) return vehicleRow;
  if (vehicleRow) return false;
  return (
    feePeriodLabelMatches(row.periodLabel || "", column.label) ||
    feePeriodLabelMatches(row.desc, column.label)
  );
}

export function feeSheetColumnBalance(statement: StudentFeeStatement, column: FeeSheetColumn): number {
  return statement.ledger.reduce((sum, row) => {
    if (!feeSheetRowMatchesColumn(row, column)) return sum;
    return sum + Math.max(0, row.balance);
  }, 0);
}

/**
 * Paid = the chosen columns are billed and nothing is left.
 * Partially paid = some payment is on those columns and a balance remains.
 * Not paid = billed, with no payment yet.
 * Students with nothing billed on the selection are only included in All.
 */
export function feeSheetPaymentBucket(
  charge: number,
  paid: number,
  balance: number,
): Exclude<FeeSheetPaymentFilter, "all"> | "none" {
  if (charge <= 0) return "none";
  if (balance <= 0) return "paid";
  if (paid > 0) return "partial";
  return "unpaid";
}

function feeSheetScopeMoney(
  statement: StudentFeeStatement,
  columns: FeeSheetColumn[],
): { charge: number; paid: number; balance: number } {
  if (columns.length === 0) {
    return {
      charge: Math.max(0, statement.totalFee),
      paid: Math.max(0, statement.totalPaid),
      balance: Math.max(0, statement.totalDue),
    };
  }
  let charge = 0;
  let paid = 0;
  let balance = 0;
  for (const row of statement.ledger) {
    if (!columns.some((column) => feeSheetRowMatchesColumn(row, column))) continue;
    charge += Math.max(0, row.charge);
    paid += Math.max(0, row.paid);
    balance += Math.max(0, row.balance);
  }
  return { charge, paid, balance };
}

export type ClassFeeSheetRow = {
  id: string;
  name: string;
  className: string;
  division: string;
  amounts: number[];
  total: number;
};

export function buildClassFeeSheet(input: {
  students: Student[];
  columns: FeeSheetColumn[];
  payments: Payment[];
  classes: ClassConfig[];
  feeTerms: FeeTerm[];
  transportRoutes: TransportRoute[];
  academicYear: string;
  feeBreaks: StudentFeeBreak[];
  /** When no columns are chosen, use the student's outstanding balance. */
  fullBalance?: boolean;
  /** Limit rows to a payment state for the chosen columns. */
  paymentStatus?: FeeSheetPaymentFilter;
}): ClassFeeSheetRow[] {
  const paymentStatus = input.paymentStatus ?? "all";
  const rows: ClassFeeSheetRow[] = [];
  const students = [...input.students].sort(
    (a, b) => a.cls.localeCompare(b.cls, "en") || a.name.localeCompare(b.name, "en"),
  );
  for (const student of students) {
    const parts = splitClassName(student.cls);
    const needsStatement =
      paymentStatus !== "all" || (!input.fullBalance && input.columns.length > 0);
    const statement = needsStatement
      ? buildStudentFeeStatement({
          student,
          payments: input.payments,
          classes: input.classes,
          feeTerms: input.feeTerms,
          transportRoutes: input.transportRoutes,
          academicYear: input.academicYear,
          feeBreaks: input.feeBreaks,
        })
      : null;
    if (paymentStatus !== "all" && statement) {
      const useWholeBalance = Boolean(input.fullBalance) || input.columns.length === 0;
      const money = useWholeBalance
        ? {
            charge: Math.max(0, statement.totalFee),
            paid: Math.max(0, statement.totalPaid),
            balance: Math.max(0, student.due),
          }
        : feeSheetScopeMoney(statement, input.columns);
      if (feeSheetPaymentBucket(money.charge, money.paid, money.balance) !== paymentStatus) {
        continue;
      }
    }
    if (input.fullBalance || input.columns.length === 0) {
      const total = Math.max(0, student.due);
      rows.push({
        id: student.id,
        name: student.name,
        className: parts.grade,
        division: parts.section,
        amounts: [total],
        total,
      });
      continue;
    }
    const amounts = input.columns.map((column) =>
      feeSheetColumnBalance(statement as StudentFeeStatement, column),
    );
    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    rows.push({
      id: student.id,
      name: student.name,
      className: parts.grade,
      division: parts.section,
      amounts,
      total,
    });
  }
  return rows;
}

/** How many students in this export match each payment filter for the chosen columns. */
export function countFeeSheetPayments(input: {
  students: Student[];
  columns: FeeSheetColumn[];
  payments: Payment[];
  classes: ClassConfig[];
  feeTerms: FeeTerm[];
  transportRoutes: TransportRoute[];
  academicYear: string;
  feeBreaks: StudentFeeBreak[];
  fullBalance?: boolean;
}): FeeSheetPaymentCounts {
  const counts: FeeSheetPaymentCounts = {
    all: input.students.length,
    paid: 0,
    partial: 0,
    unpaid: 0,
  };
  const columns = input.fullBalance ? [] : input.columns;
  for (const student of input.students) {
    const statement = buildStudentFeeStatement({
      student,
      payments: input.payments,
      classes: input.classes,
      feeTerms: input.feeTerms,
      transportRoutes: input.transportRoutes,
      academicYear: input.academicYear,
      feeBreaks: input.feeBreaks,
    });
    const useWholeBalance = Boolean(input.fullBalance) || columns.length === 0;
    const money = useWholeBalance
      ? {
          charge: Math.max(0, statement.totalFee),
          paid: Math.max(0, statement.totalPaid),
          balance: Math.max(0, student.due),
        }
      : feeSheetScopeMoney(statement, columns);
    const bucket = feeSheetPaymentBucket(money.charge, money.paid, money.balance);
    if (bucket === "paid" || bucket === "partial" || bucket === "unpaid") {
      counts[bucket] += 1;
    }
  }
  return counts;
}
