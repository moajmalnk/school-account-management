import {
  apiBaseUrl,
  apiRequest,
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
  tier?: string;
  planName?: string;
  planFlags?: PlanFlags;
};

export type ApiLoginResponse = {
  token: string;
  refreshToken?: string;
  sessionId?: string;
  deviceId?: string;
  idleDays?: number;
  expiresInSeconds?: number;
  session: ApiLoginSession;
};

export async function apiLogin(
  email: string,
  password: string,
): Promise<ApiLoginResponse> {
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

export async function apiMe(): Promise<ApiLoginSession> {
  return apiRequest<ApiLoginSession>("/api/auth/me.php");
}

/** Revoke this browser's server session. Best-effort — local logout still proceeds. */
export async function apiLogoutCurrentDevice(): Promise<void> {
  if (typeof window === "undefined") return;
  const sessionId = getAuthSessionId();
  const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return;
  try {
    await fetch(`${apiBaseUrl()}/api/auth/logout-device.php`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sessionId ? { sessionId } : {}),
      keepalive: true,
    });
  } catch {
    // Offline / already expired — local sign-out still holds.
  }
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
