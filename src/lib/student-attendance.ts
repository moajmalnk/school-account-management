/** Student daily attendance types and presentational helpers. */

export const STUDENT_ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "halfday",
  "late",
  "leave",
] as const;

export type StudentAttendanceStatus = (typeof STUDENT_ATTENDANCE_STATUSES)[number];

export type StudentAttendanceCounts = {
  present: number;
  absent: number;
  halfday: number;
  late: number;
  leave: number;
  unmarked: number;
  total: number;
};

export type AttendanceRosterStudent = {
  studentId: string;
  name: string;
  cls: string;
  grade: string;
  division: string | null;
  guardian: string;
  phone: string | null;
  status: StudentAttendanceStatus | null;
  note: string | null;
  updatedAt?: string | null;
};

export type AttendanceDayResponse = {
  date: string;
  class: string;
  division: string;
  counts: StudentAttendanceCounts;
  students: AttendanceRosterStudent[];
};

export type AttendanceNotPresentRow = {
  studentId: string;
  name: string;
  cls: string;
  status: StudentAttendanceStatus;
  phone: string | null;
  guardian: string;
};

export type AttendanceTrendPoint = {
  date: string;
  present: number;
  absent: number;
  halfday: number;
  late: number;
  leave: number;
};

export type AttendanceSummaryResponse = {
  date: string;
  month: string;
  enrolled: number;
  counts: StudentAttendanceCounts;
  presentPercent: number;
  notPresent: AttendanceNotPresentRow[];
  trend: AttendanceTrendPoint[];
};

export type AttendanceReportRow = {
  date: string;
  studentId: string;
  name: string;
  cls: string;
  guardian: string;
  phone: string | null;
  status: StudentAttendanceStatus;
  note: string | null;
};

export type AttendanceStudentSummary = {
  studentId: string;
  name: string;
  cls: string;
  guardian: string;
  phone: string | null;
  present: number;
  absent: number;
  halfday: number;
  late: number;
  leave: number;
  marked: number;
  percent: number;
};

export type AttendanceReportResponse = {
  from: string;
  to: string;
  class: string;
  division: string;
  enrolled: number;
  rows: AttendanceReportRow[];
  daily: Array<StudentAttendanceCounts & { date: string }>;
  byStudent: AttendanceStudentSummary[];
};

export type AttendanceStudentMark = {
  date: string;
  status: StudentAttendanceStatus;
  note: string | null;
  updatedAt?: string | null;
};

export type AttendanceStudentHistoryResponse = {
  studentId: string;
  name: string;
  cls: string;
  from: string;
  to: string;
  counts: StudentAttendanceCounts;
  percent: number;
  marks: AttendanceStudentMark[];
};

export type AttendanceMarkPayload = {
  date: string;
  marks: Array<{
    studentId: string;
    status: StudentAttendanceStatus;
    note?: string | null;
  }>;
};

export const ATTENDANCE_STATUS_LABELS: Record<StudentAttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  halfday: "Halfday",
  late: "Late",
  leave: "Leave",
};

export const ATTENDANCE_STATUS_COLORS: Record<
  StudentAttendanceStatus,
  { bg: string; text: string; ring: string; soft: string }
> = {
  present: {
    bg: "bg-emerald-600",
    text: "text-white",
    ring: "ring-emerald-600",
    soft: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  absent: {
    bg: "bg-red-500",
    text: "text-white",
    ring: "ring-red-500",
    soft: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
  halfday: {
    bg: "bg-orange-500",
    text: "text-white",
    ring: "ring-orange-500",
    soft: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  },
  late: {
    bg: "bg-amber-500",
    text: "text-white",
    ring: "ring-amber-500",
    soft: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  },
  leave: {
    bg: "bg-sky-600",
    text: "text-white",
    ring: "ring-sky-600",
    soft: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  },
};

export function isStudentAttendanceStatus(value: unknown): value is StudentAttendanceStatus {
  return (
    typeof value === "string" &&
    (STUDENT_ATTENDANCE_STATUSES as readonly string[]).includes(value)
  );
}

export function emptyAttendanceCounts(total = 0): StudentAttendanceCounts {
  return {
    present: 0,
    absent: 0,
    halfday: 0,
    late: 0,
    leave: 0,
    unmarked: total,
    total,
  };
}

export function todayYmd(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function monthBounds(ymdOrMonth: string): { from: string; to: string; month: string } {
  const month = ymdOrMonth.length >= 7 ? ymdOrMonth.slice(0, 7) : todayYmd().slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return {
    month,
    from: `${month}-01`,
    to: `${month}-${String(last).padStart(2, "0")}`,
  };
}

export function parseClassDivision(className: string): {
  grade: string;
  division: string | null;
} {
  const dash = className.lastIndexOf(" - ");
  if (dash === -1) {
    return { grade: className.trim(), division: null };
  }
  return {
    grade: className.slice(0, dash).trim(),
    division: className.slice(dash + 3).trim() || null,
  };
}

export function studentMatchesClassDivisionFilter(
  cls: string,
  gradeFilter: string,
  divisionFilter: string,
): boolean {
  const { grade, division } = parseClassDivision(cls);
  if (gradeFilter !== "all" && grade !== gradeFilter) return false;
  if (divisionFilter !== "all" && division !== divisionFilter) return false;
  return true;
}
