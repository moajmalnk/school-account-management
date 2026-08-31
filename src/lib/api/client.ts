import {
  ACCESS_TOKEN_KEY,
  accessTokenNeedsRefresh,
  clearPersistentAuthSecrets,
  getRefreshToken,
  isLocalIdleExpired,
  persistAuthSecrets,
  touchLastActive,
} from "@/lib/api/persistent-auth";
import { getActiveBranchPublicId } from "@/lib/branch-context";

export {
  ACCESS_TOKEN_KEY,
  AUTH_SESSION_ID_KEY,
  DEVICE_ID_KEY,
  REFRESH_TOKEN_KEY,
  SESSION_IDLE_DAYS,
  SESSION_IDLE_MS,
  clearPersistentAuthSecrets,
  getAuthSessionId,
  getOrCreateDeviceId,
  getRefreshToken,
  guessDeviceName,
  hasPersistedCredentials,
  isLocalIdleExpired,
  persistAuthSecrets,
  touchLastActive,
} from "@/lib/api/persistent-auth";

/** Hostinger production API — used by local Vite and production builds. */
export const PRODUCTION_API_BASE_URL = "https://api.feezo.app";

/** API base URL for School Admin Console backend (api.feezo.app). */
export function apiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return PRODUCTION_API_BASE_URL;
}

export function isApiConfigured(): boolean {
  return Boolean(apiBaseUrl());
}

const TOKEN_BACKUP_KEY = "school-accounts/api-token-backup/v1";
/** Tab-local JWT used while impersonating — keeps the admin token intact in other tabs. */
const IMPERSONATION_TOKEN_KEY = "school-accounts/api-token-impersonation/v1";

export function isImpersonating(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.sessionStorage.getItem(IMPERSONATION_TOKEN_KEY));
  } catch {
    return false;
  }
}

export function getApiToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const impersonation = window.sessionStorage.getItem(IMPERSONATION_TOKEN_KEY);
    if (impersonation) return impersonation;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setApiToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
      resetUnauthorizedGate();
    } else {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

export type UnauthorizedReason = "session" | "inactive" | "impersonation";
type UnauthorizedListener = (reason: UnauthorizedReason) => void;
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

function emitUnauthorized(reason: UnauthorizedReason) {
  if (reason === "impersonation") {
    try {
      window.sessionStorage.removeItem(IMPERSONATION_TOKEN_KEY);
    } catch {
      // ignore
    }
    for (const listener of unauthorizedListeners) {
      try {
        listener(reason);
      } catch {
        // ignore listener errors
      }
    }
    return;
  }

  if (unauthorizedNotified) return;
  unauthorizedNotified = true;
  const idle = reason === "inactive" || isLocalIdleExpired();
  try {
    clearPersistentAuthSecrets();
    window.sessionStorage.removeItem(IMPERSONATION_TOKEN_KEY);
  } catch {
    // ignore
  }
  for (const listener of unauthorizedListeners) {
    try {
      listener(idle ? "inactive" : reason);
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
    const current = window.localStorage.getItem(ACCESS_TOKEN_KEY);
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
      window.localStorage.setItem(ACCESS_TOKEN_KEY, backup);
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

export type TokenRefreshResult = "ok" | "invalid" | "network";

type RefreshResponse = {
  token: string;
  refreshToken?: string;
  sessionId?: string;
  deviceId?: string;
};

let refreshInFlight: Promise<TokenRefreshResult> | null = null;

async function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (locks?.request) {
    return locks.request("feezo-auth-refresh", fn);
  }
  return fn();
}

async function postRefresh(refreshToken: string): Promise<{
  status: number;
  data: RefreshResponse | null;
}> {
  const res = await fetch(`${apiBaseUrl()}/api/auth/refresh.php`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });
  const raw = await res.text();
  let payload: ApiEnvelope<RefreshResponse> | null = null;
  try {
    payload = raw ? (JSON.parse(raw) as ApiEnvelope<RefreshResponse>) : null;
  } catch {
    payload = null;
  }
  return {
    status: res.status,
    data: payload?.success && payload.data?.token ? payload.data : null,
  };
}

async function doRefreshAccessToken(): Promise<TokenRefreshResult> {
  const sent = getRefreshToken();
  if (!sent) {
    const token =
      typeof window === "undefined" ? null : window.localStorage.getItem(ACCESS_TOKEN_KEY);
    return token && !accessTokenNeedsRefresh(token) ? "ok" : "invalid";
  }

  try {
    const first = await postRefresh(sent);
    if (first.status === 401 || first.status === 403) {
      const latest = getRefreshToken();
      if (latest && latest !== sent) {
        const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
        if (token && !accessTokenNeedsRefresh(token)) return "ok";
        const second = await postRefresh(latest);
        if (second.data) {
          persistAuthSecrets(second.data);
          resetUnauthorizedGate();
          return "ok";
        }
        if (second.status === 401 || second.status === 403) return "invalid";
      }
      return "invalid";
    }
    if (!first.data) return first.status >= 500 || first.status === 0 ? "network" : "invalid";
    persistAuthSecrets(first.data);
    resetUnauthorizedGate();
    return "ok";
  } catch {
    return "network";
  }
}

/** Rotate refresh token and mint a new access JWT. Safe to call from multiple tabs. */
export async function refreshAccessToken(): Promise<TokenRefreshResult> {
  if (isImpersonating()) return "ok";
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = withRefreshLock(doRefreshAccessToken).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/**
 * Keep the device signed in while it is used.
 * Network failures do not sign the user out.
 */
export async function ensureFreshAccessToken(): Promise<TokenRefreshResult> {
  if (isImpersonating()) return "ok";
  if (isLocalIdleExpired()) return "invalid";

  const stored =
    typeof window === "undefined" ? null : window.localStorage.getItem(ACCESS_TOKEN_KEY);
  if (stored && !accessTokenNeedsRefresh(stored)) {
    touchLastActive();
    return "ok";
  }
  if (!getRefreshToken()) {
    return stored ? "ok" : "invalid";
  }
  return refreshAccessToken();
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
  /** Logout / one-shot calls: do not trigger a global sign-out. */
  skipUnauthorized?: boolean;
  retried?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    auth = true,
    signal,
    skipUnauthorized = false,
    retried = false,
  } = options;

  if (auth && unauthorizedNotified && !skipUnauthorized) {
    throw new ApiError("Unauthorized: Token expired", 401);
  }

  if (auth && !isImpersonating() && !retried) {
    const freshness = await ensureFreshAccessToken();
    if (freshness === "invalid") {
      if (!skipUnauthorized) {
        emitUnauthorized(isLocalIdleExpired() ? "inactive" : "session");
      }
      throw new ApiError("Unauthorized: Token expired", 401);
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isForm) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getApiToken();
    if (!token) {
      throw new ApiError("Unauthorized: Missing token", 401);
    }
    headers.Authorization = `Bearer ${token}`;
    const branchId = getActiveBranchPublicId();
    if (branchId) {
      headers["X-Branch-Id"] = branchId;
    }
  }

  const url = `${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    throw err instanceof Error ? err : new Error("Network request failed");
  }

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
      (snippet ? `Request failed (${res.status}): ${snippet}` : `Request failed (${res.status})`);

    if (auth && res.status === 401 && !skipUnauthorized) {
      if (isImpersonating()) {
        emitUnauthorized("impersonation");
      } else if (!retried) {
        const refreshed = await refreshAccessToken();
        if (refreshed === "ok") {
          return apiRequest<T>(path, { ...options, retried: true });
        }
        if (refreshed === "network") {
          throw new ApiError(message, res.status);
        }
        emitUnauthorized(isLocalIdleExpired() ? "inactive" : "session");
      } else {
        emitUnauthorized("session");
      }
    }

    throw new ApiError(message, res.status);
  }

  if (auth) touchLastActive();
  return payload.data as T;
}
