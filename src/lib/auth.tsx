import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiLogin } from "@/lib/api/auth";
import { ApiError, setApiToken } from "@/lib/api/client";
import {
  ALL_PERMISSIONS,
  firstAllowedTenantPath,
  hasPermission as hasPermissionKey,
  hasAnyFinance as hasAnyFinancePerm,
  canAccessSettingsTab as canAccessSettingsTabPerm,
  canAccessSettingsModule as canAccessSettingsModulePerm,
  canAccessFinanceView as canAccessFinanceViewPerm,
  type FinanceViewKey,
  type PermissionKey,
  type PermissionSet,
  type SettingsTabId,
} from "@/lib/permissions";
import { findActiveTenantUserByCredentials } from "@/lib/tenant-store";

export type Role = "super_admin" | "school_admin" | "tenant_user";

export type Session = {
  role: Role;
  email: string;
  displayName: string;
  tenantName?: string;
  issuedAt: number;
  userId?: string;
  staffId?: string;
  permissions: PermissionSet;
  /** True when an admin is previewing this user via impersonation (per-tab). */
  impersonated?: boolean;
};

export type LoginResult =
  | { ok: true; redirect: string; session: Session }
  | { ok: false; error: string };

type AuthState = {
  session: Session | null;
  hydrated: boolean;
  login: (role: Role, email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  updateSession: (
    patch: Partial<
      Pick<Session, "displayName" | "tenantName" | "permissions" | "staffId">
    >,
  ) => void;
};

const STORAGE_KEY = "school-accounts/session/v1";
const IMPERSONATION_KEY = "school-accounts/impersonation/v1";

export const MOCK_CREDENTIALS: Record<
  "super_admin" | "school_admin",
  {
    email: string;
    password: string;
    displayName: string;
    tenantName?: string;
    redirect: string;
  }
> = {
  super_admin: {
    email: "superadmin@saas.com",
    password: "admin2026",
    displayName: "Super Admin",
    redirect: "/super-admin/overview",
  },
  school_admin: {
    email: "silverhills@tenant.com",
    password: "school2026",
    displayName: "Silver Hills Admin",
    tenantName: "Silver Hills Global",
    redirect: "/tenant/dashboard",
  },
};

export const INVALID_CREDENTIALS_MESSAGE =
  "Invalid credentials matching selected authentication tier. Please review inputs.";

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
    issuedAt: typeof parsed.issuedAt === "number" ? parsed.issuedAt : Date.now(),
    userId: parsed.userId,
    staffId: parsed.staffId,
    permissions,
    ...(impersonated ? { impersonated: true } : {}),
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
export function writeImpersonationSession(session: Omit<Session, "impersonated">) {
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

export function sessionHasPermission(
  session: Session | null | undefined,
  key: PermissionKey,
): boolean {
  if (!session) return false;
  if (session.role === "school_admin" || session.role === "super_admin") return true;
  return hasPermissionKey(session.permissions, key);
}

export function sessionHasAnyFinance(session: Session | null | undefined): boolean {
  if (!session) return false;
  if (session.role === "school_admin" || session.role === "super_admin") return true;
  return hasAnyFinancePerm(session.permissions);
}

export function sessionCanAccessSettingsTab(
  session: Session | null | undefined,
  tab: SettingsTabId,
): boolean {
  if (!session) return false;
  if (session.role === "school_admin" || session.role === "super_admin") return true;
  return canAccessSettingsTabPerm(session.permissions, tab);
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
  if (session.role === "school_admin" || session.role === "super_admin") return true;
  return canAccessFinanceViewPerm(session.permissions, view);
}

export function isTenantWorkspaceSession(session: Session | null | undefined): boolean {
  return session?.role === "school_admin" || session?.role === "tenant_user";
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(readSession());
    setHydrated(true);
  }, []);

  const login = useCallback<AuthState["login"]>(async (role, email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    // Super-admin stays local/mock until SaaS APIs ship.
    if (role === "super_admin") {
      const expected = MOCK_CREDENTIALS.super_admin;
      if (
        expected &&
        normalizedEmail === expected.email.toLowerCase() &&
        password === expected.password
      ) {
        setApiToken(null);
        const next: Session = {
          role,
          email: expected.email,
          displayName: expected.displayName,
          tenantName: expected.tenantName,
          issuedAt: Date.now(),
          permissions: ALL_PERMISSIONS,
        };
        writeSession(next);
        setSession(next);
        return { ok: true, redirect: expected.redirect, session: next };
      }
      return { ok: false, error: INVALID_CREDENTIALS_MESSAGE };
    }

    // School admin + tenant users → production API
    if (role === "school_admin" || role === "tenant_user") {
      try {
        const data = await apiLogin(normalizedEmail, password);
        const apiRole: Role =
          data.session.role === "school_admin" ? "school_admin" : "tenant_user";
        const rawPerms = data.session.permissions;
        const permissions: PermissionSet =
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
          issuedAt: Date.now(),
          userId: data.session.userId,
          staffId: data.session.staffId || undefined,
          permissions,
        };
        writeSession(next);
        setSession(next);
        return {
          ok: true,
          redirect:
            apiRole === "school_admin"
              ? "/tenant/dashboard"
              : firstAllowedTenantPath(permissions),
          session: next,
        };
      } catch (err) {
        // Offline / API down: fall back to local tenant-user credentials
        const user = findActiveTenantUserByCredentials(normalizedEmail, password);
        if (user) {
          setApiToken(null);
          const next: Session = {
            role: "tenant_user",
            email: user.email,
            displayName: user.displayName,
            tenantName: MOCK_CREDENTIALS.school_admin.tenantName,
            issuedAt: Date.now(),
            userId: user.id,
            staffId: user.staffId,
            permissions: user.permissions,
          };
          writeSession(next);
          setSession(next);
          return {
            ok: true,
            redirect: firstAllowedTenantPath(user.permissions),
            session: next,
          };
        }
        const message =
          err instanceof ApiError ? err.message : INVALID_CREDENTIALS_MESSAGE;
        return { ok: false, error: message || INVALID_CREDENTIALS_MESSAGE };
      }
    }

    return { ok: false, error: INVALID_CREDENTIALS_MESSAGE };
  }, []);

  const logout = useCallback(() => {
    // Exiting an impersonated tab restores the underlying admin login.
    if (typeof window !== "undefined") {
      try {
        if (window.sessionStorage.getItem(IMPERSONATION_KEY)) {
          window.sessionStorage.removeItem(IMPERSONATION_KEY);
          setSession(readPersistentSession());
          return;
        }
      } catch {
        // ignore
      }
    }
    setApiToken(null);
    writeSession(null);
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
