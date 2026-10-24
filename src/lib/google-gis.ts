/**
 * Same-tab Google Sign-In via OpenID Connect (id_token in the URL hash).
 * No popup / new tab — the current window navigates to Google and back to /login.
 */

const NONCE_KEY = "feezo/google-oauth-nonce";

export function googleClientId(): string {
  const id = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? "";
  return id;
}

export function isGoogleSignInConfigured(): boolean {
  return googleClientId().length > 0;
}

function loginRedirectUri(): string {
  return `${window.location.origin}/login`;
}

function createNonce(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Navigate this tab to Google account chooser, then back to /login#id_token=… */
export function startGoogleSignInRedirect(): void {
  const clientId = googleClientId();
  if (!clientId) {
    throw new Error("Google Sign-In is not configured");
  }

  const nonce = createNonce();
  try {
    sessionStorage.setItem(NONCE_KEY, nonce);
  } catch {
    // private mode — still proceed; backend verifies the token
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: loginRedirectUri(),
    response_type: "id_token",
    scope: "openid email profile",
    nonce,
    prompt: "select_account",
  });

  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

/**
 * After Google redirects back to /login, read id_token from the hash and clear it
 * from the address bar so it is not left in history.
 */
export function consumeGoogleRedirectCredential(): string | null {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const idToken = params.get("id_token")?.trim() ?? "";
  const error = params.get("error");

  // Always strip the hash so tokens never linger in the URL bar.
  const clean = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState({}, "", clean);

  if (error) {
    throw new Error(
      error === "access_denied"
        ? "Google sign-in was cancelled."
        : `Google sign-in failed (${error}).`,
    );
  }

  if (!idToken) return null;

  try {
    sessionStorage.removeItem(NONCE_KEY);
  } catch {
    // ignore
  }

  return idToken;
}
