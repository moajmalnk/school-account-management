/**
 * School-wide fee reports derived from the same student fee statement as Fees Report.
 * Vehicle, aging, and fee-head pages share one pass so their totals stay aligned.
 */
import { formatEventDate, parseFlexibleDate, toIsoDate } from "@/lib/dates";
import { buildConcessionReportRows } from "@/lib/student-concession-fees";
import {
  buildStudentFeeStatement,
  isScheduledFeeLedgerRow,
  type StudentFeeStatement,
  type StudentLedgerRow,
} from "@/lib/student-fees";
import type {
  ClassConfig,
  FeeTerm,
  Payment,
  Student,
  StudentFeeBreak,
  TransportFeeShift,
  TransportRoute,
} from "@/lib/tenant-store";

export type ExpertFeeSnapshot = {
  student: Student;
  statement: StudentFeeStatement;
  /** Standard vehicle schedule minus the concession schedule. Zero when vehicle is not waived. */
  vehicleConcession: number;
};

export type VehicleFeeReportRow = {
  studentId: string;
  name: string;
  cls: string;
  guardian: string;
  route: string;
  shift: string;
  shiftKey: TransportFeeShift | "none";
  pickup: string;
  drop: string;
  billed: number;
  concession: number;
  collected: number;
  due: number;
  overdue: number;
};

export type FeeAgingBucket = "current" | "d30" | "d60" | "d90" | "d90plus";

export type FeeAgingReportRow = {
  studentId: string;
  name: string;
  cls: string;
  guardian: string;
  oldestDue: string;
  current: number;
  d30: number;
  d60: number;
  d90: number;
  d90plus: number;
  total: number;
};

export type FeeHeadKind = "Tuition" | "Vehicle" | "Other";

export type FeeHeadReportRow = {
  head: string;
  kind: FeeHeadKind;
  billed: number;
  collected: number;
  due: number;
  overdue: number;
};

type StatementInput = {
  students: Student[];
  payments: Payment[];
  classes: ClassConfig[];
  feeTerms: FeeTerm[];
  transportRoutes?: TransportRoute[];
  academicYear: string;
  feeBreaks?: StudentFeeBreak[];
};

/** One fee statement per student, including the vehicle waiver already used by Concession Report. */
export function buildExpertFeeSnapshots(input: StatementInput): ExpertFeeSnapshot[] {
  const concessions = buildConcessionReportRows({
    students: input.students,
    classes: input.classes,
    feeTerms: input.feeTerms,
    transportRoutes: input.transportRoutes,
  });
  const waiverByStudent = new Map(concessions.map((row) => [row.studentId, row]));
  return input.students.map((student) => {
    const statement = buildStudentFeeStatement({
      student,
      payments: input.payments,
      classes: input.classes,
      feeTerms: input.feeTerms,
      transportRoutes: input.transportRoutes,
      academicYear: input.academicYear,
      feeBreaks: input.feeBreaks,
    });
    const waiver = waiverByStudent.get(student.id);
    const vehicleConcession =
      waiver?.coversVehicle === true
        ? Math.max(0, waiver.standardVehicle - waiver.concessionVehicle)
        : 0;
    return { student, statement, vehicleConcession };
  });
}

function shiftLabel(shift?: TransportFeeShift): { label: string; key: TransportFeeShift | "none" } {
  if (shift === "morning") return { label: "Morning", key: "morning" };
  if (shift === "evening") return { label: "Evening", key: "evening" };
  if (shift === "both") return { label: "Both shifts", key: "both" };
  return { label: "—", key: "none" };
}

function pendingDue(totalDue: number, overdueDue: number): number {
  return Math.max(0, totalDue - Math.max(0, overdueDue));
}

/** Students with a transport charge, a vehicle receipt, or a vehicle waiver. */
export function buildVehicleFeeRows(snapshots: ExpertFeeSnapshot[]): VehicleFeeReportRow[] {
  const rows: VehicleFeeReportRow[] = [];
  for (const snap of snapshots) {
    const vehicle = snap.statement.vehicle;
    const hasActivity =
      vehicle.applicable ||
      vehicle.totalFee > 0 ||
      vehicle.totalPaid > 0 ||
      vehicle.totalDue > 0 ||
      snap.vehicleConcession > 0;
    if (!hasActivity) continue;
    const shift = shiftLabel(vehicle.shift);
    rows.push({
      studentId: snap.student.id,
      name: snap.student.name,
      cls: snap.student.cls || "—",
      guardian: snap.student.guardian || "—",
      route: vehicle.routeLabel?.trim() || "Not assigned",
      shift: shift.label,
      shiftKey: shift.key,
      pickup: vehicle.pickup?.trim() || "—",
      drop: vehicle.drop?.trim() || "—",
      billed: vehicle.totalFee,
      concession: snap.vehicleConcession,
      collected: vehicle.totalPaid,
      due: pendingDue(vehicle.totalDue, vehicle.overdueDue),
      overdue: Math.max(0, vehicle.overdueDue),
    });
  }
  return rows.sort(
    (a, b) => b.overdue - a.overdue || b.due - a.due || a.name.localeCompare(b.name),
  );
}

function dueIsoOf(row: StudentLedgerRow): string | null {
  const direct = row.dueIso?.trim();
  if (direct && /^\d{4}-\d{2}-\d{2}/.test(direct)) return direct.slice(0, 10);
  const parsed = parseFlexibleDate(row.due) ?? parseFlexibleDate(row.date);
  return parsed ? toIsoDate(parsed) : null;
}

/** Days past the due date in the local calendar. Zero or negative means not yet due. */
function daysPastDue(iso: string | null, now: Date): number {
  if (!iso) return 0;
  const due = new Date(`${iso}T23:59:59`);
  const today = new Date(`${toIsoDate(now)}T23:59:59`);
  if (Number.isNaN(due.getTime()) || Number.isNaN(today.getTime())) return 0;
  return Math.floor((today.getTime() - due.getTime()) / 86_400_000);
}

function agingBucket(days: number): FeeAgingBucket {
  if (days <= 0) return "current";
  if (days <= 30) return "d30";
  if (days <= 60) return "d60";
  if (days <= 90) return "d90";
  return "d90plus";
}

/** Outstanding installments grouped by how late they are. */
export function buildFeeAgingRows(snapshots: ExpertFeeSnapshot[], now = new Date()): FeeAgingReportRow[] {
  const rows: FeeAgingReportRow[] = [];
  for (const snap of snapshots) {
    const buckets: Record<FeeAgingBucket, number> = {
      current: 0,
      d30: 0,
      d60: 0,
      d90: 0,
      d90plus: 0,
    };
    let oldest: string | null = null;
    for (const line of snap.statement.ledger) {
      if (!isScheduledFeeLedgerRow(line) || line.balance <= 0) continue;
      const iso = dueIsoOf(line);
      let days = daysPastDue(iso, now);
      if (days <= 0 && line.status === "Overdue") days = 1;
      buckets[agingBucket(days)] += line.balance;
      if (iso && (!oldest || iso < oldest)) oldest = iso;
    }
    const total = buckets.current + buckets.d30 + buckets.d60 + buckets.d90 + buckets.d90plus;
    if (total <= 0) continue;
    rows.push({
      studentId: snap.student.id,
      name: snap.student.name,
      cls: snap.student.cls || "—",
      guardian: snap.student.guardian || "—",
      oldestDue: oldest ? formatEventDate(oldest) : "—",
      current: buckets.current,
      d30: buckets.d30,
      d60: buckets.d60,
      d90: buckets.d90,
      d90plus: buckets.d90plus,
      total,
    });
  }
  return rows.sort((a, b) => b.d90plus - a.d90plus || b.total - a.total || a.name.localeCompare(b.name));
}

type HeadAccumulator = FeeHeadReportRow;

function headKey(kind: FeeHeadKind, head: string): string {
  return `${kind}::${head.trim().toLowerCase()}`;
}

function touchHead(
  map: Map<string, HeadAccumulator>,
  kind: FeeHeadKind,
  head: string,
): HeadAccumulator {
  const label = head.trim() || (kind === "Vehicle" ? "Vehicle Fee" : "Other");
  const key = headKey(kind, label);
  const existing = map.get(key);
  if (existing) return existing;
  const created: HeadAccumulator = {
    head: label,
    kind,
    billed: 0,
    collected: 0,
    due: 0,
    overdue: 0,
  };
  map.set(key, created);
  return created;
}

function addScheduleLine(bucket: HeadAccumulator, row: StudentLedgerRow) {
  if (!isScheduledFeeLedgerRow(row)) return;
  bucket.billed += row.charge;
  bucket.collected += row.paid;
  if (row.status === "Overdue") bucket.overdue += row.balance;
  else bucket.due += Math.max(0, row.balance);
}

function otherFeeLabels(student: Student): string[] {
  return (student.concessionFees?.otherFees ?? [])
    .map((fee) => fee.label.trim())
    .filter((label) => label.length > 0);
}

function tuitionOrOtherHead(row: StudentLedgerRow, labels: string[]): { kind: FeeHeadKind; head: string } {
  const desc = row.desc.trim();
  const lower = desc.toLowerCase();
  for (const label of labels) {
    const needle = label.toLowerCase();
    if (lower === needle || lower.startsWith(`${needle} ·`) || lower.startsWith(`${needle} -`)) {
      return { kind: "Other", head: label };
    }
  }
  const cleaned = (row.periodLabel || desc).replace(/^Tuition \(Concession\) ·\s*/i, "").trim();
  return { kind: "Tuition", head: cleaned || "Tuition" };
}

/**
 * One school-wide row per tuition term, the vehicle head, and any other scheduled head.
 * Vehicle uses the section totals so unallocated transport receipts stay on that head.
 */
export function buildFeeHeadRows(snapshots: ExpertFeeSnapshot[]): FeeHeadReportRow[] {
  const map = new Map<string, HeadAccumulator>();
  for (const snap of snapshots) {
    const labels = otherFeeLabels(snap.student);
    let tuitionAllocated = 0;
    for (const line of snap.statement.tuition.ledger) {
      if (!isScheduledFeeLedgerRow(line)) continue;
      const { kind, head } = tuitionOrOtherHead(line, labels);
      addScheduleLine(touchHead(map, kind, head), line);
      if (kind === "Tuition") tuitionAllocated += line.paid;
    }
    const unallocatedTuition = Math.max(0, snap.statement.tuition.totalPaid - tuitionAllocated);
    if (unallocatedTuition > 0) {
      touchHead(map, "Other", "Unallocated receipts").collected += unallocatedTuition;
    }
    const vehicle = snap.statement.vehicle;
    if (vehicle.totalFee > 0 || vehicle.totalPaid > 0 || vehicle.totalDue > 0) {
      const bucket = touchHead(map, "Vehicle", "Vehicle Fee");
      bucket.billed += vehicle.totalFee;
      bucket.collected += vehicle.totalPaid;
      bucket.overdue += Math.max(0, vehicle.overdueDue);
      bucket.due += pendingDue(vehicle.totalDue, vehicle.overdueDue);
    }
    for (const line of snap.statement.ledger) {
      if (line.desc !== "Outstanding Balance" || line.balance <= 0) continue;
      const bucket = touchHead(map, "Other", "Outstanding balance");
      bucket.billed += line.charge;
      bucket.due += line.status === "Overdue" ? 0 : line.balance;
      bucket.overdue += line.status === "Overdue" ? line.balance : 0;
    }
  }
  const kindOrder: Record<FeeHeadKind, number> = { Tuition: 0, Other: 1, Vehicle: 2 };
  return [...map.values()]
    .filter((row) => row.billed > 0 || row.collected > 0 || row.due > 0 || row.overdue > 0)
    .sort(
      (a, b) => kindOrder[a.kind] - kindOrder[b.kind] || b.billed - a.billed || a.head.localeCompare(b.head),
    );
}

/** Collected ÷ billed, or null when nothing was billed. */
export function collectionRate(billed: number, collected: number): number | null {
  if (billed <= 0) return null;
  return collected / billed;
}
