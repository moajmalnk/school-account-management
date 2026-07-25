import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
};

export type LoginResult =
  | { ok: true; redirect: string; session: Session }
  | { ok: false; error: string };

type AuthState = {
  session: Session | null;
  hydrated: boolean;
  login: (role: Role, email: string, password: string) => LoginResult;
  logout: () => void;
  updateSession: (
    patch: Partial<
      Pick<Session, "displayName" | "tenantName" | "permissions" | "staffId">
    >,
  ) => void;
};

const STORAGE_KEY = "school-accounts/session/v1";

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

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
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
    };
  } catch {
    return null;
  }
}

function writeSession(session: Session | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // no-op: storage may be unavailable in private mode
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

  const login = useCallback<AuthState["login"]>((role, email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (role === "super_admin" || role === "school_admin") {
      const expected = MOCK_CREDENTIALS[role];
      if (
        expected &&
        normalizedEmail === expected.email.toLowerCase() &&
        password === expected.password
      ) {
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
    }

    // School Admin tier (or tenant_user) can also authenticate workspace users
    if (role === "school_admin" || role === "tenant_user") {
      const user = findActiveTenantUserByCredentials(normalizedEmail, password);
      if (user) {
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
    }

    return { ok: false, error: INVALID_CREDENTIALS_MESSAGE };
  }, []);

  const logout = useCallback(() => {
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
