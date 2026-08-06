/** API base URL for School Admin Console backend (spi.macadz.com). */
export function apiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "https://spi.macadz.com";
}

export function isApiConfigured(): boolean {
  return Boolean(apiBaseUrl());
}

const TOKEN_KEY = "school-accounts/api-token/v1";
const TOKEN_BACKUP_KEY = "school-accounts/api-token-backup/v1";
/** Tab-local JWT used while impersonating — keeps the admin token intact in other tabs. */
const IMPERSONATION_TOKEN_KEY = "school-accounts/api-token-impersonation/v1";

export function getApiToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const impersonation = window.sessionStorage.getItem(IMPERSONATION_TOKEN_KEY);
    if (impersonation) return impersonation;
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setApiToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

/** Store an impersonation JWT in this tab only (does not overwrite the admin localStorage token). */
export function setImpersonationApiToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(IMPERSONATION_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearImpersonationApiToken() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(IMPERSONATION_TOKEN_KEY);
  } catch {
    // ignore
  }
}

/** Stash current JWT before swapping in an impersonation token (legacy same-tab flow). */
export function backupApiToken(): void {
  if (typeof window === "undefined") return;
  try {
    const current = window.localStorage.getItem(TOKEN_KEY);
    if (current) window.sessionStorage.setItem(TOKEN_BACKUP_KEY, current);
  } catch {
    // ignore
  }
}

/** Restore the stashed JWT after exiting impersonation. */
export function restoreApiTokenBackup(): boolean {
  if (typeof window === "undefined") return false;
  try {
    clearImpersonationApiToken();
    const backup = window.sessionStorage.getItem(TOKEN_BACKUP_KEY);
    window.sessionStorage.removeItem(TOKEN_BACKUP_KEY);
    if (backup) {
      window.localStorage.setItem(TOKEN_KEY, backup);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

export function clearApiTokenBackup(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(TOKEN_BACKUP_KEY);
    clearImpersonationApiToken();
  } catch {
    // ignore
  }
}

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = true, signal } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getApiToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const url = `${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  const raw = await res.text();
  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = raw ? (JSON.parse(raw) as ApiEnvelope<T>) : null;
  } catch {
    payload = null;
  }

  if (!res.ok || !payload?.success) {
    const snippet = raw.replace(/\s+/g, " ").slice(0, 180);
    throw new ApiError(
      payload?.error ||
        (snippet
          ? `Request failed (${res.status}): ${snippet}`
          : `Request failed (${res.status})`),
      res.status,
    );
  }

  return payload.data as T;
}
