/**
 * Persistent web session (WhatsApp Web style):
 * stay signed in across tab/browser close until Logout, or 14 days unused.
 */
export const ACCESS_TOKEN_KEY = "school-accounts/api-token/v1";
export const REFRESH_TOKEN_KEY = "school-accounts/refresh-token/v1";
export const AUTH_SESSION_ID_KEY = "school-accounts/session-id/v1";
export const DEVICE_ID_KEY = "school-accounts/device-id/v1";
export const LAST_ACTIVE_KEY = "school-accounts/last-active/v1";

/** Sign out locally if the browser was unused this long. */
export const SESSION_IDLE_DAYS = 14;
export const SESSION_IDLE_MS = SESSION_IDLE_DAYS * 24 * 60 * 60 * 1000;

/** Refresh the access JWT this far before `exp`. */
export const ACCESS_REFRESH_SKEW_MS = 5 * 60 * 1000;

function storageGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    // private mode / quota
  }
}

export function getRefreshToken(): string | null {
  return storageGet(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null) {
  storageSet(REFRESH_TOKEN_KEY, token);
}

export function getAuthSessionId(): string | null {
  return storageGet(AUTH_SESSION_ID_KEY);
}

export function setAuthSessionId(sessionId: string | null) {
  storageSet(AUTH_SESSION_ID_KEY, sessionId);
}

export function getOrCreateDeviceId(): string {
  const existing = storageGet(DEVICE_ID_KEY);
  if (existing) return existing;
  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `dev-${crypto.randomUUID()}`
      : `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  storageSet(DEVICE_ID_KEY, created);
  return created;
}

export function guessDeviceName(): string {
  if (typeof navigator === "undefined") return "Web Browser";
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Safari\//.test(ua) && !/Chrome\//.test(ua)
        ? "Safari"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : "Browser";
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "Web";
  return `${browser} on ${os}`;
}

export function readLastActiveAt(): number | null {
  const raw = storageGet(LAST_ACTIVE_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function touchLastActive(force = false) {
  const now = Date.now();
  if (!force) {
    const prev = readLastActiveAt();
    if (prev && now - prev < 60_000) return;
  }
  storageSet(LAST_ACTIVE_KEY, String(now));
}

export function isLocalIdleExpired(now = Date.now()): boolean {
  const last = readLastActiveAt();
  if (!last) return false;
  return now - last > SESSION_IDLE_MS;
}

/** Clear login secrets. Keeps device id so the same browser is recognized. */
export function clearPersistentAuthSecrets() {
  storageSet(ACCESS_TOKEN_KEY, null);
  storageSet(REFRESH_TOKEN_KEY, null);
  storageSet(AUTH_SESSION_ID_KEY, null);
  storageSet(LAST_ACTIVE_KEY, null);
}

export function persistAuthSecrets(bundle: {
  token: string;
  refreshToken?: string | null;
  sessionId?: string | null;
  deviceId?: string | null;
}) {
  storageSet(ACCESS_TOKEN_KEY, bundle.token);
  if ("refreshToken" in bundle) {
    storageSet(REFRESH_TOKEN_KEY, bundle.refreshToken || null);
  }
  if ("sessionId" in bundle) {
    storageSet(AUTH_SESSION_ID_KEY, bundle.sessionId || null);
  }
  if (bundle.deviceId) storageSet(DEVICE_ID_KEY, bundle.deviceId);
  touchLastActive(true);
}

export function readJwtExpiryMs(token: string): number | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const padded = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    const payload = JSON.parse(json) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function accessTokenNeedsRefresh(
  token: string | null,
  skewMs = ACCESS_REFRESH_SKEW_MS,
): boolean {
  if (!token) return true;
  const exp = readJwtExpiryMs(token);
  if (exp === null) return false;
  return exp - Date.now() <= skewMs;
}

export function hasPersistedCredentials(): boolean {
  return Boolean(storageGet(ACCESS_TOKEN_KEY) || storageGet(REFRESH_TOKEN_KEY));
}
