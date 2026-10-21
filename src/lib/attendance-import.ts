import { columnIndex, headerKey, parseIndianDate } from "@/lib/csv-import";
import {
  STUDENT_ATTENDANCE_STATUSES,
  type StudentAttendanceStatus,
} from "@/lib/student-attendance";

/** Weekdays in a YYYY-MM month. Used as the default staff working-day count. */
export function weekdaysInMonth(month: string): number {
  const match = /^(\d{4})-(\d{2})$/.exec(month.trim());
  if (!match) return 0;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (!year || monthIndex < 0 || monthIndex > 11) return 0;
  const days = new Date(year, monthIndex + 1, 0).getDate();
  let count = 0;
  for (let day = 1; day <= days; day += 1) {
    const weekday = new Date(year, monthIndex, day).getDay();
    if (weekday !== 0 && weekday !== 6) count += 1;
  }
  return count;
}

export type SheetIssue = { line: number; message: string };

export type StudentAttendanceImportRow = {
  line: number;
  date: string;
  studentId: string;
  name: string;
  status: StudentAttendanceStatus;
};

export type StaffAttendanceImportRow = {
  line: number;
  staffId: string;
  name: string;
  month: string;
  daysPresent: number;
  workingDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
};

export const STUDENT_ATTENDANCE_HEADERS = ["Date", "Student ID", "Name", "Class", "Status"] as const;
export const STAFF_ATTENDANCE_HEADERS = [
  "Staff ID",
  "Name",
  "Month",
  "Days Present",
  "Working Days",
  "Paid Leave Days",
  "Unpaid Leave Days",
] as const;

const MAX_ROWS = 2000;

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseStudentAttendanceStatus(raw: string): StudentAttendanceStatus | "blank" | null {
  const value = headerKey(raw).replace(/-/g, " ");
  if (!value) return "blank";
  if (value === "present" || value === "p") return "present";
  if (value === "absent" || value === "a") return "absent";
  if (value === "halfday" || value === "half day" || value === "h") return "halfday";
  if (value === "late") return "late";
  if (value === "leave" || value === "on leave" || value === "lv") return "leave";
  if ((STUDENT_ATTENDANCE_STATUSES as readonly string[]).includes(value)) {
    return value as StudentAttendanceStatus;
  }
  return null;
}

export function parsePayrollMonth(raw: string, fallback: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return /^\d{4}-\d{2}$/.test(fallback) ? fallback : null;
  const iso = trimmed.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}`;
  const named = trimmed.match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i,
  );
  if (named) {
    const monthIndex = new Date(`${named[1]} 1, ${named[2]}`).getMonth() + 1;
    if (monthIndex > 0) return `${named[2]}-${String(monthIndex).padStart(2, "0")}`;
  }
  const parsed = parseIndianDate(trimmed);
  if (parsed) return isoDate(parsed).slice(0, 7);
  return null;
}

function headerRow(table: string[][]): { headers: string[]; start: number } | null {
  const first = table[0] ?? [];
  const joined = first.map(headerKey).join(" ");
  if (/student|staff|status|working|present|month|date/.test(joined)) {
    return { headers: first, start: 1 };
  }
  return null;
}

function dayCount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^\d{1,2}$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 0 || value > 31) return null;
  return value;
}

export function parseStudentAttendanceTable(
  table: string[][],
  options: { fallbackDate: string; knownIds: Set<string> },
): { rows: StudentAttendanceImportRow[]; issues: SheetIssue[] } {
  const issues: SheetIssue[] = [];
  const found = headerRow(table);
  if (!found) {
    return {
      rows: [],
      issues: [
        {
          line: 1,
          message: "Add a header row: Date, Student ID, Name, Class, Status.",
        },
      ],
    };
  }
  const idIdx = columnIndex(found.headers, [
    "student id",
    "studentid",
    "admission no",
    "admission number",
    "id",
  ]);
  const dateIdx = columnIndex(found.headers, ["date", "attendance date"]);
  const nameIdx = columnIndex(found.headers, ["name", "student name"]);
  const statusIdx = columnIndex(found.headers, ["status", "attendance", "mark"]);
  if (idIdx < 0) {
    return { rows: [], issues: [{ line: 1, message: "The Student ID column is required." }] };
  }

  const rows: StudentAttendanceImportRow[] = [];
  const seen = new Map<string, number>();
  const body = table.slice(found.start, found.start + MAX_ROWS);
  if (table.length - found.start > MAX_ROWS) {
    issues.push({ line: MAX_ROWS + 1, message: `Only the first ${MAX_ROWS} rows are read.` });
  }

  body.forEach((cells, index) => {
    const line = found.start + index + 1;
    if (cells.every((cell) => !cell.trim())) return;
    const studentId = (cells[idIdx] ?? "").trim();
    if (!studentId) {
      issues.push({ line, message: "Student ID is empty." });
      return;
    }
    if (!options.knownIds.has(studentId.toLowerCase())) {
      issues.push({ line, message: `${studentId} is not an active student.` });
      return;
    }
    const dateRaw = dateIdx >= 0 ? (cells[dateIdx] ?? "").trim() : "";
    const parsedDate = dateRaw ? parseIndianDate(dateRaw) : parseIndianDate(options.fallbackDate);
    if (!parsedDate) {
      issues.push({ line, message: "Date must be YYYY-MM-DD or DD-MM-YYYY." });
      return;
    }
    const statusRaw = statusIdx >= 0 ? (cells[statusIdx] ?? "") : "";
    const status = parseStudentAttendanceStatus(statusRaw);
    if (status === null) {
      issues.push({
        line,
        message: "Status must be Present, Absent, Halfday, Late, or Leave.",
      });
      return;
    }
    const date = isoDate(parsedDate);
    const key = `${date}|${studentId.toLowerCase()}`;
    const previous = seen.get(key);
    if (previous) {
      issues.push({ line, message: `Replaces the earlier mark for ${studentId} on ${date} (row ${previous}).` });
    }
    seen.set(key, line);
    const next: StudentAttendanceImportRow = {
      line,
      date,
      studentId,
      name: nameIdx >= 0 ? (cells[nameIdx] ?? "").trim().slice(0, 120) : "",
      status: status === "blank" ? "present" : status,
    };
    const existing = rows.findIndex((row) => row.date === date && row.studentId.toLowerCase() === studentId.toLowerCase());
    if (existing >= 0) rows[existing] = next;
    else rows.push(next);
  });

  return { rows, issues };
}

export function parseStaffAttendanceTable(
  table: string[][],
  options: { fallbackMonth: string; knownIds: Set<string> },
): { rows: StaffAttendanceImportRow[]; issues: SheetIssue[] } {
  const issues: SheetIssue[] = [];
  const found = headerRow(table);
  if (!found) {
    return {
      rows: [],
      issues: [
        {
          line: 1,
          message:
            "Add a header row: Staff ID, Name, Month, Days Present, Working Days, Paid Leave Days, Unpaid Leave Days.",
        },
      ],
    };
  }
  const idIdx = columnIndex(found.headers, ["staff id", "employee id", "staffid", "id"]);
  const nameIdx = columnIndex(found.headers, ["name", "staff name"]);
  const monthIdx = columnIndex(found.headers, ["month", "payroll month"]);
  const presentIdx = columnIndex(found.headers, ["days present", "present", "present days"]);
  const workingIdx = columnIndex(found.headers, ["working days", "working"]);
  const paidIdx = columnIndex(found.headers, ["paid leave days", "paid leave", "paid"]);
  const unpaidIdx = columnIndex(found.headers, ["unpaid leave days", "unpaid leave", "unpaid"]);
  if (idIdx < 0) {
    return { rows: [], issues: [{ line: 1, message: "The Staff ID column is required." }] };
  }

  const rows: StaffAttendanceImportRow[] = [];
  const seen = new Map<string, number>();
  const body = table.slice(found.start, found.start + MAX_ROWS);
  if (table.length - found.start > MAX_ROWS) {
    issues.push({ line: MAX_ROWS + 1, message: `Only the first ${MAX_ROWS} rows are read.` });
  }

  body.forEach((cells, index) => {
    const line = found.start + index + 1;
    if (cells.every((cell) => !cell.trim())) return;
    const staffId = (cells[idIdx] ?? "").trim();
    if (!staffId) {
      issues.push({ line, message: "Staff ID is empty." });
      return;
    }
    if (!options.knownIds.has(staffId.toLowerCase())) {
      issues.push({ line, message: `${staffId} is not active staff.` });
      return;
    }
    const month = parsePayrollMonth(monthIdx >= 0 ? (cells[monthIdx] ?? "") : "", options.fallbackMonth);
    if (!month) {
      issues.push({ line, message: "Month must be YYYY-MM, for example 2026-10." });
      return;
    }
    const working = workingIdx >= 0 ? dayCount(cells[workingIdx] ?? "") : null;
    const present = presentIdx >= 0 ? dayCount(cells[presentIdx] ?? "") : null;
    const paid = paidIdx >= 0 ? dayCount(cells[paidIdx] ?? "") : null;
    const unpaid = unpaidIdx >= 0 ? dayCount(cells[unpaidIdx] ?? "") : null;
    const hasInvalid =
      (workingIdx >= 0 && (cells[workingIdx] ?? "").trim() && working === null) ||
      (presentIdx >= 0 && (cells[presentIdx] ?? "").trim() && present === null) ||
      (paidIdx >= 0 && (cells[paidIdx] ?? "").trim() && paid === null) ||
      (unpaidIdx >= 0 && (cells[unpaidIdx] ?? "").trim() && unpaid === null);
    if (hasInvalid) {
      issues.push({ line, message: "Day counts must be whole numbers from 0 to 31." });
      return;
    }
    const workingDays = working ?? weekdaysInMonth(month);
    const paidLeaveDays = paid ?? 0;
    const unpaidLeaveDays = unpaid ?? 0;
    const daysPresent = present ?? Math.max(0, workingDays - paidLeaveDays - unpaidLeaveDays);
    if (workingDays < 1) {
      issues.push({ line, message: "Working days must be from 1 to 31." });
      return;
    }
    if (daysPresent + paidLeaveDays + unpaidLeaveDays > workingDays) {
      issues.push({
        line,
        message: "Present, paid leave, and unpaid leave cannot exceed working days.",
      });
      return;
    }
    const key = `${month}|${staffId.toLowerCase()}`;
    const previous = seen.get(key);
    if (previous) {
      issues.push({ line, message: `Replaces the earlier ${month} row for ${staffId} (row ${previous}).` });
    }
    seen.set(key, line);
    const next: StaffAttendanceImportRow = {
      line,
      staffId,
      name: nameIdx >= 0 ? (cells[nameIdx] ?? "").trim().slice(0, 120) : "",
      month,
      daysPresent,
      workingDays,
      paidLeaveDays,
      unpaidLeaveDays,
    };
    const existing = rows.findIndex(
      (row) => row.month === month && row.staffId.toLowerCase() === staffId.toLowerCase(),
    );
    if (existing >= 0) rows[existing] = next;
    else rows.push(next);
  });

  return { rows, issues };
}
