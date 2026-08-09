import { apiRequest, setApiToken } from "@/lib/api/client";
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
  session: ApiLoginSession;
};

export async function apiLogin(
  email: string,
  password: string,
): Promise<ApiLoginResponse> {
  const data = await apiRequest<ApiLoginResponse>("/api/auth/login.php", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  setApiToken(data.token);
  return data;
}

export async function apiMe(): Promise<ApiLoginSession> {
  return apiRequest<ApiLoginSession>("/api/auth/me.php");
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
