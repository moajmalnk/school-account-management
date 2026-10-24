/**
 * One-time Support prompt for brand-new trial signups only.
 * Armed only from apiRegisterTrial success — never for normal logins.
 */

const PENDING_KEY = "feezo_post_signup_support_pending_v1";
const DONE_PREFIX = "feezo_post_signup_support_done_v1:";

/** How long after signup the dashboard may still show the prompt. */
const PENDING_MAX_AGE_MS = 30 * 60 * 1000;

type PendingPayload = {
  tenantId: string;
  at: number;
};

function readPending(): PendingPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    // Legacy "1" flag from earlier builds — ignore (not tenant-scoped).
    if (raw === "1") {
      window.sessionStorage.removeItem(PENDING_KEY);
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PendingPayload>;
    if (typeof parsed.tenantId !== "string" || !parsed.tenantId.trim()) return null;
    if (typeof parsed.at !== "number" || !Number.isFinite(parsed.at)) return null;
    return { tenantId: parsed.tenantId.trim(), at: parsed.at };
  } catch {
    return null;
  }
}

/** Call only right after a successful trial registration. */
export function markPostSignupSupportPending(tenantId: string | undefined | null): void {
  if (typeof window === "undefined") return;
  const id = typeof tenantId === "string" ? tenantId.trim() : "";
  if (!id) return;
  try {
    const payload: PendingPayload = { tenantId: id, at: Date.now() };
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function clearPostSignupSupportPending(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

/**
 * True only when this browser just finished signup for this exact tenant,
 * within the time window, and the prompt has never been completed for them.
 */
export function shouldShowPostSignupSupport(tenantId: string | undefined): boolean {
  if (!tenantId) return false;
  if (hasPostSignupSupportDone(tenantId)) {
    clearPostSignupSupportPending();
    return false;
  }
  const pending = readPending();
  if (!pending) return false;
  if (pending.tenantId !== tenantId) {
    // Different account signed in — do not show, do not clear (signup tab may still finish).
    return false;
  }
  if (Date.now() - pending.at > PENDING_MAX_AGE_MS) {
    clearPostSignupSupportPending();
    return false;
  }
  return true;
}

export function hasPostSignupSupportDone(tenantId: string | undefined): boolean {
  if (typeof window === "undefined" || !tenantId) return false;
  try {
    return window.localStorage.getItem(DONE_PREFIX + tenantId) === "1";
  } catch {
    return false;
  }
}

export function markPostSignupSupportDone(tenantId: string | undefined): void {
  if (typeof window === "undefined") return;
  clearPostSignupSupportPending();
  if (!tenantId) return;
  try {
    window.localStorage.setItem(DONE_PREFIX + tenantId, "1");
  } catch {
    // ignore
  }
}
