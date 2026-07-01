import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Role = "super_admin" | "school_admin";

export type Session = {
  role: Role;
  email: string;
  displayName: string;
  tenantName?: string;
  issuedAt: number;
};

export type LoginResult =
  | { ok: true; redirect: string; session: Session }
  | { ok: false; error: string };

type AuthState = {
  session: Session | null;
  hydrated: boolean;
  login: (role: Role, email: string, password: string) => LoginResult;
  logout: () => void;
};

const STORAGE_KEY = "school-accounts/session/v1";

export const MOCK_CREDENTIALS: Record<
  Role,
  { email: string; password: string; displayName: string; tenantName?: string; redirect: string }
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

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (
      parsed &&
      (parsed.role === "super_admin" || parsed.role === "school_admin") &&
      parsed.email
    ) {
      return parsed;
    }
    return null;
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

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(readSession());
    setHydrated(true);
  }, []);

  const login = useCallback<AuthState["login"]>((role, email, password) => {
    const expected = MOCK_CREDENTIALS[role];
    const normalizedEmail = email.trim().toLowerCase();
    if (
      !expected ||
      normalizedEmail !== expected.email.toLowerCase() ||
      password !== expected.password
    ) {
      return { ok: false, error: INVALID_CREDENTIALS_MESSAGE };
    }
    const next: Session = {
      role,
      email: expected.email,
      displayName: expected.displayName,
      tenantName: expected.tenantName,
      issuedAt: Date.now(),
    };
    writeSession(next);
    setSession(next);
    return { ok: true, redirect: expected.redirect, session: next };
  }, []);

  const logout = useCallback(() => {
    writeSession(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ session, hydrated, login, logout }),
    [session, hydrated, login, logout],
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
