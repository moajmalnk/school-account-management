/** API base URL for School Admin Console backend (spi.macadz.com). */
export function apiBaseUrl(): string {
  // Local Vite → proxy `/api` to spi.macadz.com (same-origin, no CORS).
  // Set VITE_API_DIRECT=1 to call the remote host from the browser instead.
  if (import.meta.env.DEV && import.meta.env.VITE_API_DIRECT !== "1") {
    return "";
  }
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "https://spi.macadz.com";
}

export function isApiConfigured(): boolean {
  // Empty string in DEV still means "API via Vite proxy".
  if (import.meta.env.DEV && import.meta.env.VITE_API_DIRECT !== "1") return true;
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
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
      resetUnauthorizedGate();
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

/** Fired once when an authenticated request gets 401 (expired / invalid JWT). */
type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();
let unauthorizedNotified = false;

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

export function resetUnauthorizedGate() {
  unauthorizedNotified = false;
}

export function isUnauthorizedNotified(): boolean {
  return unauthorizedNotified;
}

function emitUnauthorized() {
  if (unauthorizedNotified) return;
  unauthorizedNotified = true;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(IMPERSONATION_TOKEN_KEY);
  } catch {
    // ignore
  }
  for (const listener of unauthorizedListeners) {
    try {
      listener();
    } catch {
      // ignore listener errors
    }
  }
}

/** Store an impersonation JWT in this tab only (does not overwrite the admin localStorage token). */
export function setImpersonationApiToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(IMPERSONATION_TOKEN_KEY, token);
    resetUnauthorizedGate();
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
      resetUnauthorizedGate();
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

export function isAuthExpiredError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
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

  if (auth && unauthorizedNotified) {
    throw new ApiError("Unauthorized: Token expired", 401);
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getApiToken();
    if (!token) {
      throw new ApiError("Unauthorized: Missing token", 401);
    }
    headers.Authorization = `Bearer ${token}`;
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
    const message =
      payload?.error ||
      (snippet
        ? `Request failed (${res.status}): ${snippet}`
        : `Request failed (${res.status})`);

    // Authenticated 401 → clear JWT once and notify AuthProvider (login 401 stays local).
    if (auth && res.status === 401) {
      emitUnauthorized();
    }

    throw new ApiError(message, res.status);
  }

  return payload.data as T;
}
