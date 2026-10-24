import { apiRequest } from "@/lib/api/client";

export type BiometricDevice = {
  id: number;
  serialNumber: string;
  deviceName: string;
  ipAddress: string | null;
  port: number;
  firmwareVersion: string | null;
  attLogStamp: number;
  opStamp: number;
  lastHeartbeat: string | null;
  status: "unassigned" | "active" | "disabled" | string;
  online: boolean;
  liveStatus: "online" | "offline";
  branchId: number | null;
  createdAt: string;
};

export type BiometricServerInfo = {
  domain: string;
  port: number;
  admsPort: number;
  protocolPaths: string[];
};

export type BiometricPunch = {
  id: number;
  deviceSn: string;
  biometricPin: string;
  punchTime: string;
  punchState: number;
  punchStateLabel: string;
  verifyType: number;
  verifyTypeLabel: string;
  entityType: "student" | "staff" | null;
  entityId: string | null;
  entityName: string | null;
  rawPayload: string | null;
  createdAt: string;
};

export type BiometricUserMap = {
  id: number;
  biometricPin: string;
  entityType: "student" | "staff";
  entityId: string;
  entityName: string;
  updatedAt: string;
};

export type BiometricDailySummary = {
  id: number;
  date: string;
  entityType: "student" | "staff";
  entityId: string;
  entityName: string;
  firstCheckIn: string | null;
  lastCheckOut: string | null;
  totalHours: number | null;
  status: string;
};

export async function apiBiometricDevices(): Promise<{
  devices: BiometricDevice[];
  server: BiometricServerInfo;
}> {
  return apiRequest("/api/biometric/devices.php");
}

export async function apiBiometricRegisterDevice(payload: {
  serialNumber: string;
  deviceName?: string;
}): Promise<{ device: BiometricDevice }> {
  return apiRequest("/api/biometric/devices.php", {
    method: "POST",
    body: payload,
  });
}

export async function apiBiometricUpdateDevice(payload: {
  serialNumber: string;
  deviceName?: string;
  status?: string;
  port?: number;
  assignBranch?: boolean;
}): Promise<{ device: BiometricDevice }> {
  return apiRequest("/api/biometric/devices.php", {
    method: "PATCH",
    body: payload,
  });
}

export async function apiBiometricPunches(params: {
  from?: string;
  to?: string;
  deviceSn?: string;
  pin?: string;
  q?: string;
  punchState?: number | "";
  page?: number;
  pageSize?: number;
}): Promise<{
  items: BiometricPunch[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const q = new URLSearchParams();
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.deviceSn) q.set("deviceSn", params.deviceSn);
  if (params.pin) q.set("pin", params.pin);
  if (params.q) q.set("q", params.q);
  if (params.punchState !== undefined && params.punchState !== "") {
    q.set("punchState", String(params.punchState));
  }
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  const qs = q.toString();
  return apiRequest(`/api/biometric/punches.php${qs ? `?${qs}` : ""}`);
}

export async function apiBiometricRealtime(sinceId = 0): Promise<{
  items: BiometricPunch[];
  latestId: number;
  devices: BiometricDevice[];
  serverTime: string;
}> {
  const q = new URLSearchParams({ sinceId: String(sinceId), limit: "50" });
  return apiRequest(`/api/biometric/realtime.php?${q.toString()}`);
}

export async function apiBiometricSummary(params: {
  from: string;
  to: string;
  entityType?: "student" | "staff" | "";
}): Promise<{ from: string; to: string; items: BiometricDailySummary[] }> {
  const q = new URLSearchParams({ from: params.from, to: params.to });
  if (params.entityType) q.set("entityType", params.entityType);
  return apiRequest(`/api/biometric/summary.php?${q.toString()}`);
}

export async function apiBiometricUserMapList(): Promise<{ items: BiometricUserMap[] }> {
  return apiRequest("/api/biometric/user-map.php");
}

export async function apiBiometricUserMapBind(payload: {
  biometricPin: string;
  entityType: "student" | "staff";
  entityId: string;
}): Promise<BiometricUserMap> {
  return apiRequest("/api/biometric/user-map.php", {
    method: "POST",
    body: payload,
  });
}

export async function apiBiometricUserMapDelete(biometricPin: string): Promise<void> {
  await apiRequest("/api/biometric/user-map.php", {
    method: "DELETE",
    body: { biometricPin },
  });
}

export async function apiBiometricCommand(payload: {
  serialNumber: string;
  action: string;
  time?: string;
}): Promise<{ commandId: number; command: string; status: string }> {
  return apiRequest("/api/biometric/commands.php", {
    method: "POST",
    body: payload,
  });
}

export type BiometricAdmsLog = {
  id: number;
  deviceSn: string | null;
  endpoint: string;
  method: string;
  table: string | null;
  queryString: string | null;
  clientIp: string | null;
  requestBody: string | null;
  responseBody: string | null;
  level: "info" | "warn" | "error" | string;
  note: string | null;
  createdAt: string;
};

export async function apiBiometricAdmsLogs(params?: {
  limit?: number;
  deviceSn?: string;
}): Promise<{
  items: BiometricAdmsLog[];
  hint: string | null;
  probeUrl: string;
  expectedDeviceSettings: {
    serverAddress: string;
    serverPort: number;
    serverMode: string;
    paths: string[];
  };
}> {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.deviceSn) q.set("deviceSn", params.deviceSn);
  const qs = q.toString();
  return apiRequest(`/api/biometric/adms-logs.php${qs ? `?${qs}` : ""}`);
}

export async function apiBiometricAdmsProbe(note?: string, serialNumber?: string): Promise<void> {
  await apiRequest("/api/biometric/adms-logs.php", {
    method: "POST",
    body: { note: note ?? "Manual probe from Feezo dashboard", serialNumber },
  });
}
