import {
  apiRequest,
  apiRequestOrigin,
  getAuthSessionId,
  getOrCreateDeviceId,
  guessDeviceName,
  persistAuthSecrets,
  resetUnauthorizedGate,
} from "@/lib/api/client";
import { ACCESS_TOKEN_KEY } from "@/lib/api/persistent-auth";
import type { PermissionSet, PlanFlags } from "@/lib/permissions";

export type ApiLoginSession = {
  role: string;
  email: string;
  displayName: string;
  tenantName?: string;
  tenantId?: string;
  issuedAt?: string;
  userId?: string;
  staffId?: string | null;
  permissions: PermissionSet;
  branchIds?: string[];
  tier?: string;
  planName?: string;
  planFlags?: PlanFlags;
  /** School PDFs include the Feezo footer credit. Omitted means on. */
  pdfCreditEnabled?: boolean;
};

export type ApiLoginResponse = {
  token: string;
  refreshToken?: string;
  sessionId?: string;
  deviceId?: string;
  idleDays?: number;
  expiresInSeconds?: number;
  /** Active campus public id (e.g. BR-…) — set immediately so API calls do not reuse a prior school's header. */
  activeBranchId?: string;
  session: ApiLoginSession;
};

export async function apiLogin(email: string, password: string): Promise<ApiLoginResponse> {
  const data = await apiRequest<ApiLoginResponse>("/api/auth/login.php", {
    method: "POST",
    body: {
      email,
      password,
      deviceId: getOrCreateDeviceId(),
      deviceName: guessDeviceName(),
    },
    auth: false,
  });
  persistAuthSecrets({
    token: data.token,
    refreshToken: data.refreshToken ?? null,
    sessionId: data.sessionId ?? null,
    deviceId: data.deviceId ?? null,
  });
  resetUnauthorizedGate();
  return data;
}

/** Exchange a Google Identity Services ID token for a Feezo session. */
export async function apiGoogleLogin(credential: string): Promise<ApiLoginResponse> {
  const data = await apiRequest<ApiLoginResponse>("/api/auth/google-login.php", {
    method: "POST",
    body: {
      credential,
      deviceId: getOrCreateDeviceId(),
      deviceName: guessDeviceName(),
    },
    auth: false,
  });
  persistAuthSecrets({
    token: data.token,
    refreshToken: data.refreshToken ?? null,
    sessionId: data.sessionId ?? null,
    deviceId: data.deviceId ?? null,
  });
  resetUnauthorizedGate();
  return data;
}

export async function apiMe(): Promise<ApiLoginSession> {
  return apiRequest<ApiLoginSession>("/api/auth/me.php");
}

/** Cheap access check; the API client signs out on revoked / deactivated responses. */
export async function apiPing(): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>("/api/auth/ping.php", { timeoutMs: 15_000 });
}

export type LogoutScope = "device" | "everywhere";

/**
 * End the server session for this browser.
 * `everywhere` first revokes every other session for this login, then this one.
 * Best-effort — local logout still proceeds when the network call fails.
 */
export async function apiLogoutCurrentDevice(
  scope: LogoutScope = "device",
): Promise<{ othersRevoked: boolean }> {
  if (typeof window === "undefined") return { othersRevoked: false };
  const sessionId = getAuthSessionId();
  const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return { othersRevoked: false };

  const call = (body: Record<string, unknown>) =>
    fetch(`${apiRequestOrigin()}/api/auth/logout-device.php`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      keepalive: true,
    });

  let othersRevoked = scope !== "everywhere";
  if (scope === "everywhere" && sessionId) {
    try {
      const res = await call({ sessionId, revokeOthers: true });
      othersRevoked = res.ok;
    } catch {
      othersRevoked = false;
    }
  }

  try {
    await call(sessionId ? { sessionId } : {});
  } catch {
    // Offline / already expired — local sign-out still holds.
  }
  return { othersRevoked };
}

export type ForgotPasswordResponse = {
  message: string;
  emailed: boolean;
  resetUrl?: string;
};

export async function apiForgotPassword(email: string): Promise<ForgotPasswordResponse> {
  return apiRequest<ForgotPasswordResponse>("/api/auth/forgot-password.php", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

export async function apiResetPassword(
  token: string,
  password: string,
  passwordConfirm: string,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/auth/reset-password.php", {
    method: "POST",
    body: { token, password, passwordConfirm },
    auth: false,
  });
}

export type RegisterTrialPayload = {
  name: string;
  subdomain: string;
  schoolType: string;
  phone: string;
  address: string;
  district: string;
  state: string;
  country?: string;
  affiliationNo?: string;
  website?: string;
  schoolEmail: string;
  adminName: string;
  adminMobile?: string;
  adminEmail: string;
  password: string;
  tier: "Basic" | "Premium" | "Enterprise";
  currency?: string;
};

export type RegisterTrialResponse = ApiLoginResponse & {
  tenant?: {
    name: string;
    subdomain: string;
    tier: string;
    status: string;
    publicId: string;
  };
};

export async function apiRegisterTrial(
  payload: RegisterTrialPayload,
): Promise<RegisterTrialResponse> {
  const data = await apiRequest<RegisterTrialResponse>("/api/auth/register-trial.php", {
    method: "POST",
    body: {
      ...payload,
      deviceId: getOrCreateDeviceId(),
      deviceName: guessDeviceName(),
    },
    auth: false,
  });
  persistAuthSecrets({
    token: data.token,
    refreshToken: data.refreshToken ?? null,
    sessionId: data.sessionId ?? null,
    deviceId: data.deviceId ?? null,
  });
  resetUnauthorizedGate();
  return data;
}

export type DataDeletionRequestPayload = {
  fullName: string;
  email: string;
  schoolName?: string;
  details?: string;
};

export type DataDeletionRequestResult = {
  message: string;
  emailed: boolean;
};

/** Public App Store / Play Console account & data deletion request. */
export async function apiRequestDataDeletion(
  payload: DataDeletionRequestPayload,
): Promise<DataDeletionRequestResult> {
  return apiRequest<DataDeletionRequestResult>("/api/auth/data-deletion-request.php", {
    method: "POST",
    body: payload,
    auth: false,
  });
}
