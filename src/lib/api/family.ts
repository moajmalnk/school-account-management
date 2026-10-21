import { ApiError, apiRequestOrigin } from "@/lib/api/client";

const TOKEN_KEY = "feezo-family/token";
const REFRESH_KEY = "feezo-family/refresh";
const DEVICE_KEY = "feezo-family/device";
const PREVIEW_FLAG = "feezo-family/preview";
const PREVIEW_TOKEN = "feezo-family/preview-token";
const PREVIEW_REFRESH = "feezo-family/preview-refresh";
const PREVIEW_NAME = "feezo-family/preview-name";
const PREVIEW_HANDOFF = "feezo-family/preview-handoff";

function previewActive() {
  return sessionStorage.getItem(PREVIEW_FLAG) === "1";
}

/** Pick up a staff preview started in another tab. The handoff is single-use. */
function consumeFamilyPreviewHandoff() {
  const raw = localStorage.getItem(PREVIEW_HANDOFF);
  if (!raw) return;
  localStorage.removeItem(PREVIEW_HANDOFF);
  try {
    const data = JSON.parse(raw) as { token?: string; refreshToken?: string; name?: string; at?: number };
    if (!data.token || !data.at || Date.now() - data.at > 60_000) return;
    sessionStorage.setItem(PREVIEW_FLAG, "1");
    sessionStorage.setItem(PREVIEW_TOKEN, data.token);
    if (data.refreshToken) sessionStorage.setItem(PREVIEW_REFRESH, data.refreshToken);
    sessionStorage.setItem(PREVIEW_NAME, data.name?.trim() || "Parent");
  } catch {
    // A bad handoff must not become a session.
  }
}

/**
 * Leave a one-time preview for the next family-app tab.
 * Does not replace a real parent login stored in this browser.
 */
export function stageFamilyPreview(input: { token: string; refreshToken?: string; name: string }) {
  localStorage.setItem(
    PREVIEW_HANDOFF,
    JSON.stringify({ token: input.token, refreshToken: input.refreshToken, name: input.name, at: Date.now() }),
  );
}

export function clearFamilyPreviewHandoff() {
  localStorage.removeItem(PREVIEW_HANDOFF);
}

export function familyPreviewName() {
  if (!previewActive()) return null;
  return sessionStorage.getItem(PREVIEW_NAME);
}

export type FamilyStudent = {
  id: string;
  name: string;
  cls: string;
  photoUrl?: string | null;
  active: boolean;
  relation: string;
};

export type FamilyProfile = {
  parent: {
    id: string;
    name: string;
    phone: string;
    verified: boolean;
    academicYear: string;
  };
  school: { name: string; tenantId: string };
  students: FamilyStudent[];
  selectedStudentId: string | null;
  academicYears: string[];
};

export type FamilyLoginResult = {
  needsSchool?: boolean;
  schools?: { tenantId: string; name: string }[];
  token?: string;
  refreshToken?: string;
  resetUrl?: string;
  message?: string;
} & Partial<FamilyProfile>;

function deviceId(): string {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const next = crypto.randomUUID();
  localStorage.setItem(DEVICE_KEY, next);
  return next;
}

function deviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return "iPhone";
  if (/Android/.test(ua)) return "Android";
  return "Parent browser";
}

export function familyToken(): string | null {
  if (!previewActive()) consumeFamilyPreviewHandoff();
  if (previewActive()) return sessionStorage.getItem(PREVIEW_TOKEN);
  return localStorage.getItem(TOKEN_KEY);
}

function familyRefreshToken(): string | null {
  if (previewActive()) return sessionStorage.getItem(PREVIEW_REFRESH);
  return localStorage.getItem(REFRESH_KEY);
}

export function clearFamilyAuth() {
  if (previewActive()) {
    sessionStorage.removeItem(PREVIEW_FLAG);
    sessionStorage.removeItem(PREVIEW_TOKEN);
    sessionStorage.removeItem(PREVIEW_REFRESH);
    sessionStorage.removeItem(PREVIEW_NAME);
    return;
  }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function persistFamilyAuth(token?: string, refresh?: string) {
  if (previewActive()) {
    if (token) sessionStorage.setItem(PREVIEW_TOKEN, token);
    if (refresh) sessionStorage.setItem(PREVIEW_REFRESH, refresh);
    return;
  }
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

async function parseFamily<T>(res: Response): Promise<T> {
  const raw = await res.text();
  let payload: { success?: boolean; data?: T; error?: string } | null = null;
  try {
    payload = raw ? (JSON.parse(raw) as { success?: boolean; data?: T; error?: string }) : null;
  } catch {
    payload = null;
  }
  if (!res.ok || !payload?.success) {
    throw new ApiError(payload?.error || `Request failed (${res.status})`, res.status);
  }
  return payload.data as T;
}

let refreshing: Promise<boolean> | null = null;

async function refreshFamilyToken(): Promise<boolean> {
  const refresh = familyRefreshToken();
  if (!refresh) return false;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${apiRequestOrigin()}/api/family/refresh.php`, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: refresh }),
        });
        const data = await parseFamily<{ token: string; refreshToken: string }>(res);
        persistFamilyAuth(data.token, data.refreshToken);
        return true;
      } catch {
        clearFamilyAuth();
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

export async function familyRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean; retried?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.auth !== false) {
    const token = familyToken();
    if (!token) throw new ApiError("Sign in to continue", 401);
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${apiRequestOrigin()}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (res.status === 401 && options.auth !== false && !options.retried) {
    const ok = await refreshFamilyToken();
    if (ok) return familyRequest<T>(path, { ...options, retried: true });
  }
  return parseFamily<T>(res);
}

export async function familyLogin(phone: string, password: string, tenantId?: string) {
  const data = await familyRequest<FamilyLoginResult>("/api/family/login.php", {
    method: "POST",
    auth: false,
    body: { phone, password, tenantId, deviceId: deviceId(), deviceName: deviceName() },
  });
  if (data.token) persistFamilyAuth(data.token, data.refreshToken);
  return data;
}

export async function familyLogout() {
  try {
    if (familyToken()) {
      await familyRequest("/api/family/logout.php", { method: "POST", body: {} });
    }
  } catch {
    // local sign-out still proceeds
  }
  clearFamilyAuth();
}

export function familySession() {
  return familyRequest<FamilyProfile>("/api/family/session.php");
}

export function familySavePrefs(body: { academicYear?: string; studentId?: string }) {
  return familyRequest<FamilyProfile>("/api/family/session.php", { method: "POST", body });
}

export function familyChangePassword(currentPassword: string, password: string) {
  return familyRequest("/api/family/password.php", {
    method: "POST",
    body: { currentPassword, password },
  });
}

export function familyForgot(phone: string, tenantId?: string) {
  return familyRequest<FamilyLoginResult>("/api/family/forgot.php", {
    method: "POST",
    auth: false,
    body: { phone, tenantId },
  });
}

export function familyPreviewInvite(token: string) {
  return familyRequest<{ parentName: string; schoolName: string; purpose?: "invite" | "reset" }>(
    `/api/family/reset.php?token=${encodeURIComponent(token)}`,
    { auth: false },
  );
}

export function familyAcceptInvite(token: string, password: string) {
  return familyRequest<FamilyLoginResult>("/api/family/reset.php", {
    method: "POST",
    auth: false,
    body: { token, password, deviceId: deviceId(), deviceName: deviceName() },
  }).then((data) => {
    if (data.token) persistFamilyAuth(data.token, data.refreshToken);
    return data;
  });
}

export type AttendanceCounts = {
  present: number;
  absent: number;
  holiday: number;
  leave: number;
  onTime: number;
  late: number;
  halfday: number;
  unmarked: number;
};

export function familyHome(studentId: string) {
  return familyRequest<{
    student: { id: string; name: string; cls: string; photoUrl?: string | null };
    today: { date: string; status: string | null; message: string };
    due: number;
    banner: { title: string; body: string; imageUrl: string | null } | null;
    school: { name: string; phone: string; whatsapp: string | null; call: string | null };
    unread: number;
  }>(`/api/family/home.php?studentId=${encodeURIComponent(studentId)}`);
}

export function familyAttendance(studentId: string) {
  return familyRequest<{
    dateLabel: string;
    today: { status: string | null; message: string };
    week: AttendanceCounts;
    month: AttendanceCounts;
    year: AttendanceCounts;
  }>(`/api/family/attendance.php?studentId=${encodeURIComponent(studentId)}`);
}

export type LeaveHistory = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
};

export function familyLeave(studentId: string, offset = 0) {
  return familyRequest<{
    balance: { total: number; used: number; remaining: number; types: { id: string; name: string }[] };
    history: LeaveHistory[];
    total: number;
  }>(`/api/family/leave.php?studentId=${encodeURIComponent(studentId)}&offset=${offset}&limit=5`);
}

export function familyApplyLeave(body: {
  studentId: string;
  typeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}) {
  return familyRequest("/api/family/leave.php", { method: "POST", body });
}

export type FeeLine = {
  key: string;
  category: string;
  categoryLabel: string;
  label: string;
  dueDate: string;
  amount: number;
  paid: number;
  balance: number;
  status: string;
  selectable: boolean;
  locked: boolean;
  checkoutOrderId?: string;
};

export type FeeCheckout = {
  provider: "cashfree";
  orderId: string;
  paymentSessionId?: string;
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  paid?: boolean;
};

export type PendingFeeCheckout = {
  orderId: string;
  amount: number;
  lineKeys: string[];
};

export function familyFees(studentId: string) {
  return familyRequest<{
    academicYear: string;
    currency: string;
    categories: { slug: string; label: string }[];
    lines: FeeLine[];
    receipts: { id: string; date: string; amount: number; mode: string; category: string; period: string }[];
    payEnabled: boolean;
    payProvider: "cashfree";
    keyId: string;
    pendingCheckouts?: PendingFeeCheckout[];
  }>(`/api/family/fees.php?studentId=${encodeURIComponent(studentId)}`);
}

export function familyFeeResume(studentId: string, orderId: string) {
  return familyRequest<FeeCheckout>("/api/family/fees.php", {
    method: "POST",
    body: { action: "resume", studentId, orderId },
  });
}

export function familyFeeOrder(studentId: string, lineKeys: string[]) {
  return familyRequest<FeeCheckout>("/api/family/fees.php", {
    method: "POST",
    body: { action: "order", studentId, lineKeys },
  });
}

export function familyFeeVerify(body: { provider: "cashfree"; orderId: string }) {
  return familyRequest<{ receiptId: string; amount: number }>("/api/family/fees.php", {
    method: "POST",
    body: { action: "verify", ...body },
  });
}

export function familyFeeRelease(orderId: string) {
  return familyRequest<{ released: boolean }>("/api/family/fees.php", {
    method: "POST",
    body: { action: "release", orderId },
  });
}

export function familyAcademics(studentId: string) {
  return familyRequest<{
    performance: { examId: string; name: string; percent: number }[];
    exams: { id: string; name: string; academicYear: string }[];
  }>(`/api/family/academics.php?studentId=${encodeURIComponent(studentId)}`);
}

export function familyReport(studentId: string, examId: string) {
  return familyRequest<{
    student: { name: string; cls: string };
    school: { name: string };
    result: {
      exam: { name: string; academicYear: string };
      subjects: { name: string; score: number; max: number }[];
      score: number;
      max: number;
      percent: number;
    };
    attendancePercent: number | null;
  }>(
    `/api/family/academics.php?studentId=${encodeURIComponent(studentId)}&examId=${encodeURIComponent(examId)}`,
  );
}

export function familyNotifications() {
  return familyRequest<{
    unread: number;
    items: { id: string; title: string; body: string; href: string | null; read: boolean; createdAt: string }[];
  }>("/api/family/notifications.php");
}

export function familyMarkNotifications(id = "all") {
  return familyRequest<{ unread: number }>("/api/family/notifications.php", {
    method: "POST",
    body: { id },
  });
}
