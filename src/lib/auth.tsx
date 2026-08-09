import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiLogin, apiMe } from "@/lib/api/auth";
import {
  ApiError,
  clearApiTokenBackup,
  clearImpersonationApiToken,
  getApiToken,
  onUnauthorized,
  restoreApiTokenBackup,
  setApiToken,
} from "@/lib/api/client";
import {
  ALL_PERMISSIONS,
  firstAllowedTenantPath,
  hasPermission as hasPermissionKey,
  hasAnyFinance as hasAnyFinancePerm,
  canAccessSettingsTab as canAccessSettingsTabPerm,
  canAccessSettingsModule as canAccessSettingsModulePerm,
  canAccessFinanceView as canAccessFinanceViewPerm,
  normalizePlanFlags,
  planAllowsModule,
  planAllowsSettingsTab,
  type FinanceViewKey,
  type PermissionKey,
  type PermissionSet,
  type PlanFlags,
  type SettingsTabId,
} from "@/lib/permissions";

export type Role = "super_admin" | "school_admin" | "tenant_user";

export type Session = {
  role: Role;
  email: string;
  displayName: string;
  tenantName?: string;
  /** Stable public tenant id (e.g. T-2000) — scopes workspace cache. */
  tenantId?: string;
  issuedAt: number;
  userId?: string;
  staffId?: string;
  permissions: PermissionSet;
  /** Subscription tier name (Basic / Premium / Enterprise). */
  tier?: string;
  planName?: string;
  /** Live feature matrix from the tenant's subscription plan. */
  planFlags?: PlanFlags;
  /** True when an admin is previewing this workspace via impersonation (per-tab). */
  impersonated?: boolean;
  /** Who started impersonation — controls Exit destination. */
  impersonationSource?: "super_admin" | "school_admin";
  impersonationTicket?: string;
};

export type LoginResult =
  | { ok: true; redirect: string; session: Session }
  | { ok: false; error: string };

type AuthState = {
  session: Session | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  updateSession: (
    patch: Partial<
      Pick<
        Session,
        | "displayName"
        | "tenantName"
        | "permissions"
        | "staffId"
        | "tier"
        | "planName"
        | "planFlags"
      >
    >,
  ) => void;
};

const STORAGE_KEY = "school-accounts/session/v1";
const IMPERSONATION_KEY = "school-accounts/impersonation/v1";

/** Post-login home paths by role (tenant_user uses permission-aware routing). */
export const ROLE_HOME: Record<"super_admin" | "school_admin", string> = {
  super_admin: "/super-admin/overview",
  school_admin: "/tenant/dashboard",
};

export function homePathForSession(session: Session): string {
  if (session.role === "tenant_user") {
    return firstAllowedTenantPath(session.permissions);
  }
  return ROLE_HOME[session.role];
}

export const INVALID_CREDENTIALS_MESSAGE =
  "Invalid email or password. Please review your credentials and try again.";

export const API_UNREACHABLE_MESSAGE =
  "Cannot reach the API (network or CORS). Confirm spi.macadz.com allows this site origin, then retry.";

function loginFailureMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message || INVALID_CREDENTIALS_MESSAGE;
  }
  if (
    err instanceof TypeError ||
    (err instanceof Error &&
      /failed to fetch|networkerror|load failed|network request failed/i.test(
        err.message,
      ))
  ) {
    return API_UNREACHABLE_MESSAGE;
  }
  return INVALID_CREDENTIALS_MESSAGE;
}

function isSessionRole(value: unknown): value is Role {
  return value === "super_admin" || value === "school_admin" || value === "tenant_user";
}

function parseSessionRaw(raw: string, impersonated: boolean): Session | null {
  const parsed = JSON.parse(raw) as Partial<Session>;
  if (!parsed || !isSessionRole(parsed.role) || !parsed.email) return null;
  const permissions: PermissionSet =
    parsed.role === "school_admin" || parsed.role === "super_admin"
      ? ALL_PERMISSIONS
      : Array.isArray(parsed.permissions) && parsed.permissions.length
        ? ((parsed.permissions as string[]).includes("*")
            ? ALL_PERMISSIONS
            : (parsed.permissions as PermissionKey[]))
        : [];
  return {
    role: parsed.role,
    email: parsed.email,
    displayName: parsed.displayName || parsed.email,
    tenantName: parsed.tenantName,
    tenantId: typeof parsed.tenantId === "string" ? parsed.tenantId : undefined,
    issuedAt: typeof parsed.issuedAt === "number" ? parsed.issuedAt : Date.now(),
    userId: parsed.userId,
    staffId: parsed.staffId,
    permissions,
    tier: typeof parsed.tier === "string" ? parsed.tier : undefined,
    planName: typeof parsed.planName === "string" ? parsed.planName : undefined,
    planFlags: parsed.planFlags ? normalizePlanFlags(parsed.planFlags) : undefined,
    ...(impersonated || parsed.impersonated
      ? { impersonated: true as const }
      : {}),
    ...(parsed.impersonationSource === "super_admin" ||
    parsed.impersonationSource === "school_admin"
      ? { impersonationSource: parsed.impersonationSource }
      : {}),
    ...(typeof parsed.impersonationTicket === "string"
      ? { impersonationTicket: parsed.impersonationTicket }
      : {}),
  };
}

/** Reads the per-tab impersonation session first, then the shared login session. */
export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const impersonationRaw = window.sessionStorage.getItem(IMPERSONATION_KEY);
    if (impersonationRaw) {
      const session = parseSessionRaw(impersonationRaw, true);
      if (session) return session;
      window.sessionStorage.removeItem(IMPERSONATION_KEY);
    }
  } catch {
    // sessionStorage unavailable · fall through to localStorage
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseSessionRaw(raw, false);
  } catch {
    return null;
  }
}

/** Reads only the shared (non-impersonated) login session. */
export function readPersistentSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseSessionRaw(raw, false);
  } catch {
    return null;
  }
}

function writeSession(session: Session | null) {
  if (typeof window === "undefined") return;
  try {
    if (session?.impersonated) {
      window.sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify(session));
      return;
    }
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // no-op: storage may be unavailable in private mode
  }
}

/** Writes a per-tab impersonation session (does not touch the admin login). */
export function writeImpersonationSession(
  session: Omit<Session, "impersonated"> & {
    impersonationSource?: Session["impersonationSource"];
    impersonationTicket?: string;
  },
) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    IMPERSONATION_KEY,
    JSON.stringify({ ...session, impersonated: true }),
  );
}

export function clearImpersonationSession() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(IMPERSONATION_KEY);
  } catch {
    // ignore
  }
}

/**
 * End impersonation: clear tab session, restore admin JWT + session.
 * Returns redirect path for the caller.
 */
export function endImpersonation(): string {
  const source = readSession()?.impersonationSource;
  clearImpersonationSession();
  clearImpersonationApiToken();
  restoreApiTokenBackup();
  return source === "super_admin" ? "/super-admin/tenants" : "/tenant/settings?tab=users";
}

export function sessionHasPermission(
  session: Session | null | undefined,
  key: PermissionKey,
): boolean {
  if (!session) return false;
  if (session.role === "school_admin" || session.role === "super_admin") {
    if (key === "students" && !planAllowsModule(session.planFlags, "students")) return false;
    if (key === "staff" && !planAllowsModule(session.planFlags, "staff")) return false;
    return true;
  }
  if (key === "students" && !planAllowsModule(session.planFlags, "students")) return false;
  if (key === "staff" && !planAllowsModule(session.planFlags, "staff")) return false;
  return hasPermissionKey(session.permissions, key);
}

export function sessionHasAnyFinance(session: Session | null | undefined): boolean {
  if (!session) return false;
  if (!planAllowsModule(session.planFlags, "finance")) return false;
  if (session.role === "school_admin" || session.role === "super_admin") return true;
  return hasAnyFinancePerm(session.permissions);
}

export function sessionCanAccessSettingsTab(
  session: Session | null | undefined,
  tab: SettingsTabId,
): boolean {
  if (!session) return false;
  if (!planAllowsSettingsTab(session.planFlags, tab)) return false;
  if (session.role === "school_admin" || session.role === "super_admin") return true;
  return canAccessSettingsTabPerm(session.permissions, tab, session.planFlags);
}

export function sessionCanAccessSettings(
  session: Session | null | undefined,
): boolean {
  if (!session) return false;
  if (session.role === "school_admin" || session.role === "super_admin") return true;
  return canAccessSettingsModulePerm(session.permissions);
}

export function sessionCanAccessFinanceView(
  session: Session | null | undefined,
  view: FinanceViewKey,
): boolean {
  if (!session) return false;
  if (!planAllowsModule(session.planFlags, "finance")) return false;
  if (view === "analytics" && session.planFlags && !session.planFlags.analytics) {
    return false;
  }
  if (view === "salary" && session.planFlags && !session.planFlags.payroll) {
    return false;
  }
  if (session.role === "school_admin" || session.role === "super_admin") return true;
  return canAccessFinanceViewPerm(session.permissions, view);
}

export function isTenantWorkspaceSession(
  session: Session | null | undefined,
): session is Session & { role: "school_admin" | "tenant_user" } {
  return session?.role === "school_admin" || session?.role === "tenant_user";
}

const AuthContext = createContext<AuthState | null>(null);

export function clearAllAuthState() {
  clearImpersonationSession();
  clearApiTokenBackup();
  setApiToken(null);
  writeSession(null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const existing = readSession();
      const token = getApiToken();

      // JWT present → confirm it before treating the local session as valid.
      if (existing && token) {
        try {
          await apiMe();
          if (!cancelled) setSession(readSession() ?? existing);
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            clearAllAuthState();
            if (!cancelled) setSession(null);
          } else if (!cancelled) {
            // Network / API down: keep the cached session so the UI can still open.
            setSession(existing);
          }
        }
      } else if (!cancelled) {
        // Orphan JWT without a session (or session without JWT) — clean up.
        if (token && !existing) setApiToken(null);
        setSession(existing);
      }

      if (!cancelled) setHydrated(true);
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return onUnauthorized(() => {
      clearImpersonationSession();
      clearApiTokenBackup();
      setApiToken(null);
      writeSession(null);
      setSession(null);

      if (typeof window === "undefined") return;
      const path = window.location.pathname;
      if (path.startsWith("/login")) return;
      const next = `/login?reason=session_expired&from=${encodeURIComponent(path)}`;
      window.location.replace(next);
    });
  }, []);

  const login = useCallback<AuthState["login"]>(async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const data = await apiLogin(normalizedEmail, password);
      const apiRole: Role =
        data.session.role === "super_admin"
          ? "super_admin"
          : data.session.role === "school_admin"
            ? "school_admin"
            : "tenant_user";
      const rawPerms = data.session.permissions;
      const permissions: PermissionSet =
        apiRole === "super_admin" ||
        apiRole === "school_admin" ||
        (Array.isArray(rawPerms) && (rawPerms as string[]).includes("*"))
          ? ALL_PERMISSIONS
          : Array.isArray(rawPerms)
            ? (rawPerms as PermissionKey[])
            : [];
      const next: Session = {
        role: apiRole,
        email: data.session.email,
        displayName: data.session.displayName,
        tenantName: data.session.tenantName,
        tenantId: data.session.tenantId,
        issuedAt: Date.now(),
        userId: data.session.userId,
        staffId: data.session.staffId || undefined,
        permissions,
        tier: data.session.tier,
        planName: data.session.planName,
        planFlags: data.session.planFlags
          ? normalizePlanFlags(data.session.planFlags)
          : undefined,
      };
      writeSession(next);
      setSession(next);
      return { ok: true, redirect: homePathForSession(next), session: next };
    } catch (err) {
      setApiToken(null);
      return { ok: false, error: loginFailureMessage(err) };
    }
  }, []);

  const logout = useCallback(() => {
    // Exiting an impersonated tab restores the underlying admin login.
    if (typeof window !== "undefined") {
      try {
        if (window.sessionStorage.getItem(IMPERSONATION_KEY)) {
          window.sessionStorage.removeItem(IMPERSONATION_KEY);
          clearImpersonationApiToken();
          restoreApiTokenBackup();
          setSession(readPersistentSession());
          return;
        }
      } catch {
        // ignore
      }
    }
    clearAllAuthState();
    setSession(null);
  }, []);

  const updateSession = useCallback<AuthState["updateSession"]>((patch) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      writeSession(next);
      return next;
    });
  }, []);

  const value = useMemo<AuthState>(
    () => ({ session, hydrated, login, logout, updateSession }),
    [session, hydrated, login, logout, updateSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
