import { apiRequest } from "@/lib/api/client";
import type {
  AttendanceDayResponse,
  AttendanceMarkPayload,
  AttendanceReportResponse,
  AttendanceStudentHistoryResponse,
  AttendanceSummaryResponse,
} from "@/lib/student-attendance";

export async function apiAttendanceDay(params: {
  date: string;
  class?: string;
  division?: string;
}): Promise<AttendanceDayResponse> {
  const q = new URLSearchParams({ date: params.date });
  if (params.class && params.class !== "all") q.set("class", params.class);
  if (params.division && params.division !== "all") q.set("division", params.division);
  return apiRequest<AttendanceDayResponse>(`/api/attendance/day.php?${q.toString()}`);
}

export async function apiAttendanceMark(
  payload: AttendanceMarkPayload,
): Promise<{ date: string; saved: number; skipped: string[] }> {
  return apiRequest("/api/attendance/mark.php", {
    method: "POST",
    body: payload,
  });
}

export async function apiAttendanceSummary(date: string): Promise<AttendanceSummaryResponse> {
  const q = new URLSearchParams({ date });
  return apiRequest<AttendanceSummaryResponse>(`/api/attendance/summary.php?${q.toString()}`);
}

export async function apiAttendanceReport(params: {
  from: string;
  to: string;
  class?: string;
  division?: string;
}): Promise<AttendanceReportResponse> {
  const q = new URLSearchParams({ from: params.from, to: params.to });
  if (params.class && params.class !== "all") q.set("class", params.class);
  if (params.division && params.division !== "all") q.set("division", params.division);
  return apiRequest<AttendanceReportResponse>(`/api/attendance/report.php?${q.toString()}`);
}

export async function apiAttendanceStudentHistory(params: {
  studentId: string;
  from?: string;
  to?: string;
}): Promise<AttendanceStudentHistoryResponse> {
  const q = new URLSearchParams({ studentId: params.studentId });
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  return apiRequest<AttendanceStudentHistoryResponse>(
    `/api/attendance/student.php?${q.toString()}`,
  );
}
