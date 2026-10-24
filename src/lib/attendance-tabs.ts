export const ATTENDANCE_TABS = ["students", "staff", "devices"] as const;

export type AttendanceTab = (typeof ATTENDANCE_TABS)[number];

export function isAttendanceTab(value: unknown): value is AttendanceTab {
  return typeof value === "string" && (ATTENDANCE_TABS as readonly string[]).includes(value);
}

export function attendanceTabFromSearch(value: unknown): AttendanceTab {
  return isAttendanceTab(value) ? value : "students";
}
