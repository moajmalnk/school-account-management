import { apiRequest } from "@/lib/api/client";

export type SchoolParent = {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  verified: boolean;
  students: { id: string; name: string; cls: string; relation: string }[];
};

export function schoolParents(q = "", studentId = "") {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (studentId) params.set("studentId", studentId);
  const query = params.toString();
  return apiRequest<{ parents: SchoolParent[] }>(
    `/api/school/parents.php${query ? `?${query}` : ""}`,
  );
}

export function schoolParentAction(body: Record<string, unknown>) {
  return apiRequest<{
    url?: string;
    phone?: string;
    name?: string;
    active?: boolean;
    ok?: boolean;
    token?: string;
    refreshToken?: string;
  }>("/api/school/parents.php", { method: "POST", body });
}

export function schoolAnnouncements() {
  return apiRequest<{
    announcements: {
      id: string;
      title: string;
      body: string;
      imageUrl: string | null;
      active: boolean;
      startsOn: string | null;
      endsOn: string | null;
    }[];
  }>("/api/school/announcements.php");
}

export function schoolSaveAnnouncement(body: Record<string, unknown>) {
  return apiRequest("/api/school/announcements.php", { method: "POST", body });
}

export function schoolHolidays() {
  return apiRequest<{ holidays: { id: string; date: string; label: string }[] }>("/api/school/holidays.php");
}

export function schoolSaveHoliday(body: Record<string, unknown>) {
  return apiRequest("/api/school/holidays.php", { method: "POST", body });
}

export type LeaveInboxItem = {
  id: string;
  studentName: string;
  cls: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
};

export function schoolLeaveInbox(status = "pending") {
  return apiRequest<{
    requests: LeaveInboxItem[];
    types: { id: string; name: string; annualDays: number; active: boolean }[];
  }>(`/api/school/leave-requests.php?status=${encodeURIComponent(status)}`);
}

export function schoolReviewLeave(body: Record<string, unknown>) {
  return apiRequest<{ status: string; skippedDates: string[] }>("/api/school/leave-requests.php", {
    method: "POST",
    body,
  });
}

export function schoolAcademics(query = "") {
  return apiRequest<{
    subjects?: { id: string; name: string; code: string; active: boolean }[];
    exams?: { id: string; name: string; academicYear: string; published: boolean; startsOn?: string | null; endsOn?: string | null }[];
    students?: { id: string; name: string; subjects: { id: string; name: string; score: number; max: number }[] }[];
    exam?: { id: string; name: string };
  }>(`/api/school/academics.php${query}`);
}

export function schoolAcademicsAction(body: Record<string, unknown>) {
  return apiRequest<Record<string, unknown>>("/api/school/academics.php", { method: "POST", body });
}

export function schoolParentPay() {
  return apiRequest<{
    enabled: boolean;
    provider: "razorpay" | "easebuzz";
    env: "test" | "prod";
    keyId: string;
    hasSecret: boolean;
    hasWebhookSecret: boolean;
    razorpayKeyId?: string;
    easebuzzKey?: string;
    hasRazorpaySecret?: boolean;
    hasEasebuzzSalt?: boolean;
  }>("/api/school/parent-pay.php");
}

export function schoolSaveParentPay(body: {
  enabled: boolean;
  provider: "razorpay" | "easebuzz";
  env: "test" | "prod";
  keyId: string;
  keySecret?: string;
  webhookSecret?: string;
}) {
  return apiRequest("/api/school/parent-pay.php", { method: "POST", body });
}
