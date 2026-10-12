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

export function feeSheetColumnBalance(statement: StudentFeeStatement, column: FeeSheetColumn): number {
  return statement.ledger.reduce((sum, row) => {
    if (row.status === "On Break") return sum;
    const vehicleRow = /vehicle/i.test(row.desc);
    if (column.key === VEHICLE_KEY) {
      return vehicleRow ? sum + Math.max(0, row.balance) : sum;
    }
    if (vehicleRow) return sum;
    const hit =
      feePeriodLabelMatches(row.periodLabel || "", column.label) ||
      feePeriodLabelMatches(row.desc, column.label);
    return hit ? sum + Math.max(0, row.balance) : sum;
  }, 0);
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
}): ClassFeeSheetRow[] {
  return [...input.students]
    .sort((a, b) => a.cls.localeCompare(b.cls, "en") || a.name.localeCompare(b.name, "en"))
    .map((student) => {
      const parts = splitClassName(student.cls);
      if (input.fullBalance || input.columns.length === 0) {
        const total = Math.max(0, student.due);
        return {
          id: student.id,
          name: student.name,
          className: parts.grade,
          division: parts.section,
          amounts: [total],
          total,
        };
      }
      const statement = buildStudentFeeStatement({
        student,
        payments: input.payments,
        classes: input.classes,
        feeTerms: input.feeTerms,
        transportRoutes: input.transportRoutes,
        academicYear: input.academicYear,
        feeBreaks: input.feeBreaks,
      });
      const amounts = input.columns.map((column) => feeSheetColumnBalance(statement, column));
      const total = amounts.reduce((sum, amount) => sum + amount, 0);
      return {
        id: student.id,
        name: student.name,
        className: parts.grade,
        division: parts.section,
        amounts,
        total,
      };
    });
}
