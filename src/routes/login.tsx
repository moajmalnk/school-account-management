import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Label } from "@/components/ui/label";
import { familyForgot, familyLogin, familyToken } from "@/lib/api/family";
import { ApiError } from "@/lib/api/client";
import { homePathForSession, API_UNREACHABLE_MESSAGE, useAuth } from "@/lib/auth";
import { consumeGoogleRedirectCredential, isGoogleSignInConfigured } from "@/lib/google-gis";
import { cn } from "@/lib/utils";

const SCHOOL_DEACTIVATED_MESSAGE =
  "This school workspace has been deactivated. Contact Feezo support to restore access.";

const PASSWORD_MAX = 72;

const fieldClass =
  "h-12 w-full rounded-2xl border bg-[#FCFDFD] pl-11 pr-3.5 text-[14px] text-[#0B1220] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-black/35 hover:border-[#D1D5DB] focus:border-[#0F766E]/50 focus:bg-white focus:ring-4 focus:ring-[#0F766E]/[0.08]";

type SchoolChoice = { tenantId: string; name: string };
type IdMode = "email" | "phone" | "unknown";

function detectIdMode(raw: string): IdMode {
  const trimmed = raw.trim();
  if (!trimmed) return "unknown";
  if (trimmed.includes("@")) return "email";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 6) return "phone";
  return "unknown";
}

function phoneDigits(raw: string) {
  return raw.replace(/\D/g, "");
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, hydrated, login, loginWithGoogle } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    identifier?: string;
    password?: string;
    school?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [tenantId, setTenantId] = useState("");
  const [schools, setSchools] = useState<SchoolChoice[]>([]);
  const googleEnabled = isGoogleSignInConfigured();

  const idMode = useMemo(() => detectIdMode(identifier), [identifier]);
  const digits = useMemo(() => phoneDigits(identifier), [identifier]);
  const isPhonePath = idMode === "phone";
  const isEmailPath = idMode === "email";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (familyToken()) {
      navigate({ href: "/family", replace: true });
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (hydrated && session && !submitting) {
      navigate({ to: homePathForSession(session) });
    }
  }, [hydrated, session, navigate, submitting]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reason = new URLSearchParams(window.location.search).get("reason");
    if (reason === "inactive") {
      toast.message("Signed out after 14 days without use", {
        description: "Sign in again to continue.",
      });
    } else if (reason === "session_expired") {
      toast.error("Please sign in again to continue");
    } else if (reason === "deactivated") {
      setBannerError(SCHOOL_DEACTIVATED_MESSAGE);
    }
    if (reason === "inactive" || reason === "session_expired" || reason === "deactivated") {
      const url = new URL(window.location.href);
      url.searchParams.delete("reason");
      url.searchParams.delete("from");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, []);

  useEffect(() => {
    return () => setPassword("");
  }, []);

  const finishGoogleCredential = useCallback(
    async (credential: string) => {
      setBannerError(null);
      setSubmitting(true);
      const result = await loginWithGoogle(credential);
      setSubmitting(false);

      if (!result.ok) {
        const message = result.error || "Google sign-in failed.";
        setBannerError(message);
        toast.error(message);
        return;
      }

      toast.success(`Welcome, ${result.session.displayName}`);
      navigate({ to: result.redirect });
    },
    [loginWithGoogle, navigate],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    let credential: string | null = null;
    try {
      credential = consumeGoogleRedirectCredential();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in failed.";
      setBannerError(message);
      toast.error(message);
      return;
    }
    if (!credential) return;
    void finishGoogleCredential(credential);
  }, [finishGoogleCredential]);

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!identifier.trim()) {
      errs.identifier = "Email or phone is required";
    } else if (isEmailPath) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())) {
        errs.identifier = "Enter a valid email address";
      }
    } else if (isPhonePath) {
      if (digits.length < 10) {
        errs.identifier = "Enter the phone the school has on file";
      }
    } else {
      errs.identifier = "Enter a valid email or 10-digit phone";
    }

    if (mode === "login" && !password) {
      errs.password = "Password is required";
    } else if (mode === "login" && password.length < 7) {
      errs.password = "Password must be at least 7 characters";
    }

    if (isPhonePath && schools.length > 0 && !tenantId) {
      errs.school = "Choose the school for this phone";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setBannerError(null);
      return;
    }

    setSubmitting(true);
    setBannerError(null);

    try {
      if (isPhonePath) {
        if (mode === "forgot") {
          const result = await familyForgot(digits, tenantId || undefined);
          if (result.needsSchool && result.schools) {
            setSchools(result.schools);
            setTenantId("");
            toast.message("Choose the school");
            return;
          }
          if (result.resetUrl) {
            toast.success("Reset link is ready");
            window.location.assign(result.resetUrl);
            return;
          }
          toast.success(result.message || "If an account exists, the school can send a new link");
          return;
        }

        // Parent phone first; if that fails, try staff login with the same phone.
        try {
          const result = await familyLogin(digits, password, tenantId || undefined);
          if (result.needsSchool && result.schools) {
            setSchools(result.schools);
            setTenantId("");
            if (!tenantId) toast.message("Choose the school for this phone");
            return;
          }
          setPassword("");
          toast.success("Welcome back");
          navigate({ href: "/family" });
          return;
        } catch (familyErr) {
          const staffResult = await login(digits, password);
          if (staffResult.ok) {
            toast.success(`Welcome, ${staffResult.session.displayName}`);
            navigate({ to: staffResult.redirect });
            return;
          }
          const message =
            familyErr instanceof ApiError
              ? familyErr.message
              : staffResult.error || "Could not sign in";
          setBannerError(message);
          toast.error(message);
          return;
        }
      }

      // Staff email path
      if (mode === "forgot") {
        navigate({ to: "/forgot-password" });
        return;
      }

      const result = await login(identifier.trim(), password);
      if (!result.ok) {
        const message = result.error || "Sign in failed.";
        setBannerError(message);
        toast.error(message);
        return;
      }

      toast.success(`Welcome, ${result.session.displayName}`);
      navigate({ to: result.redirect });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not sign in";
      setBannerError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const onForgotClick = () => {
    if (isPhonePath) {
      setMode("forgot");
      setPassword("");
      setFieldErrors({});
      setBannerError(null);
      return;
    }
    navigate({ to: "/forgot-password" });
  };

  const IdIcon = isPhonePath ? Phone : Mail;
  const showGoogle = googleEnabled && mode === "login" && !isPhonePath;

  return (
    <AuthShell
      title={mode === "forgot" ? "Reset password" : "Sign In"}
      subtitle={
        mode === "forgot"
          ? "We’ll help you get a new password for this phone."
          : "Access your school management account"
      }
      variant="split"
      welcomeAccent={mode === "login"}
    >
      {bannerError ? (
        <div
          role="alert"
          className={
            bannerError === API_UNREACHABLE_MESSAGE
              ? "mt-5 flex items-start gap-2 rounded-2xl border border-[#F59E0B]/20 bg-[#FFFBEB] px-3 py-2.5 text-[12.5px] leading-snug text-[#B45309]"
              : "mt-5 flex items-start gap-2 rounded-2xl border border-[#EF4444]/15 bg-[#FEF2F2] px-3 py-2.5 text-[12.5px] leading-snug text-[#DC2626]"
          }
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{bannerError}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-7 sm:space-y-[1.05rem]" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="login-identifier" className="text-[13px] font-semibold text-[#1E293B]">
            {isPhonePath ? "Phone number" : isEmailPath ? "Email Address" : "Email or phone"}
          </Label>
          <div className="relative">
            <IdIcon
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35"
              aria-hidden
            />
            <input
              id="login-identifier"
              type={isPhonePath ? "tel" : isEmailPath ? "email" : "text"}
              inputMode={isPhonePath ? "tel" : "email"}
              autoComplete={isPhonePath ? "tel" : "username"}
              autoFocus
              maxLength={isPhonePath ? 15 : 120}
              value={identifier}
              onChange={(e) => {
                const next = e.target.value.slice(0, 120);
                setIdentifier(next);
                if (fieldErrors.identifier) {
                  setFieldErrors((f) => ({ ...f, identifier: undefined }));
                }
                if (bannerError) setBannerError(null);
                if (schools.length && detectIdMode(next) !== "phone") {
                  setSchools([]);
                  setTenantId("");
                }
                if (mode === "forgot" && detectIdMode(next) === "email") {
                  setMode("login");
                }
              }}
              placeholder={
                isPhonePath
                  ? "10-digit mobile number"
                  : isEmailPath
                    ? "Enter your email address"
                    : "Email or phone number"
              }
              aria-invalid={!!fieldErrors.identifier}
              className={cn(
                fieldClass,
                fieldErrors.identifier ? "border-[#EF4444]/45" : "border-[#E5E7EB]",
              )}
            />
          </div>
          {fieldErrors.identifier ? (
            <p className="text-[12px] text-[#DC2626]">{fieldErrors.identifier}</p>
          ) : null}
        </div>

        {mode === "login" ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="login-password" className="text-[13px] font-semibold text-[#1E293B]">
                Password
              </Label>
              <button
                type="button"
                onClick={onForgotClick}
                className="text-[12.5px] font-semibold text-[#0F766E] hover:text-[#0D9488]"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35"
                aria-hidden
              />
              <input
                id="login-password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                maxLength={PASSWORD_MAX}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value.slice(0, PASSWORD_MAX));
                  if (fieldErrors.password) {
                    setFieldErrors((f) => ({ ...f, password: undefined }));
                  }
                  if (bannerError) setBannerError(null);
                }}
                placeholder="Enter your password"
                aria-invalid={!!fieldErrors.password}
                className={cn(
                  fieldClass,
                  "pr-11",
                  fieldErrors.password ? "border-[#EF4444]/45" : "border-[#E5E7EB]",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-black/40 hover:bg-black/[0.04] hover:text-black/70"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="text-[12px] text-[#DC2626]">{fieldErrors.password}</p>
            ) : null}
          </div>
        ) : null}

        {isPhonePath && schools.length > 0 ? (
          <SchoolPicker
            schools={schools}
            value={tenantId}
            error={fieldErrors.school ?? ""}
            onChange={(value) => {
              setTenantId(value);
              setFieldErrors((f) => ({ ...f, school: undefined }));
            }}
          />
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1.5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0F766E] text-[14.5px] font-semibold text-white shadow-[0_16px_32px_-14px_rgba(15,118,110,0.55)] transition-[background-color,transform,box-shadow] hover:bg-[#0D9488] hover:shadow-[0_18px_36px_-14px_rgba(15,118,110,0.6)] active:scale-[0.99] disabled:opacity-55"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting
            ? mode === "forgot"
              ? "Please wait…"
              : "Signing in…"
            : mode === "forgot"
              ? "Send reset link"
              : "Sign In"}
          {!submitting && mode === "login" ? <ArrowRight className="h-4 w-4" /> : null}
        </button>
      </form>

      {showGoogle ? (
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#ECEEF1]" />
            <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-black/35">
              OR
            </span>
            <div className="h-px flex-1 bg-[#ECEEF1]" />
          </div>
          <GoogleSignInButton disabled={submitting} />
          {submitting ? (
            <p className="text-center text-[12px] text-black/40">Signing in…</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 text-center text-[13px] text-[#64748B] sm:mt-7">
        {mode === "forgot" ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 font-medium text-[#0F766E] hover:text-[#0D9488]"
            onClick={() => {
              setMode("login");
              setFieldErrors({});
              setBannerError(null);
            }}
          >
            Back to sign in
          </button>
        ) : (
          <p>
            Don&apos;t have an account?{" "}
            <Link
              to="/signup/$step"
              params={{ step: "school" }}
              className="inline-flex items-center gap-1 font-semibold text-[#0F766E] hover:text-[#0D9488]"
            >
              Create account
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        )}
      </div>
    </AuthShell>
  );
}

function SchoolPicker({
  schools,
  value,
  error,
  onChange,
}: {
  schools: SchoolChoice[];
  value: string;
  error: string;
  onChange: (tenantId: string) => void;
}) {
  const errorId = useId();
  return (
    <fieldset className="space-y-1.5" aria-describedby={error ? errorId : undefined}>
      <legend className="text-[13px] font-medium text-[#0B1B33]">School</legend>
      <div className="mt-1.5 grid gap-2">
        {schools.map((school) => {
          const selected = school.tenantId === value;
          return (
            <button
              key={school.tenantId}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(school.tenantId)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                selected
                  ? "border-[#0F766E]/40 bg-[#F0FDFA]"
                  : "border-[#E5E7EB] bg-white hover:border-black/15",
              )}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0F766E] text-xs font-semibold text-white">
                {initials(school.name)}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-[#0B1220]">
                {school.name}
              </span>
              {selected ? <Check className="h-4 w-4 shrink-0 text-[#0F766E]" /> : null}
            </button>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} className="text-[12px] text-[#DC2626]">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function initials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return letters || "S";
}
