import { apiRequest, setApiToken } from "@/lib/api/client";
import type { PermissionSet } from "@/lib/permissions";

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
