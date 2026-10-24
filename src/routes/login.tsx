import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Label } from "@/components/ui/label";
import { homePathForSession, API_UNREACHABLE_MESSAGE, useAuth } from "@/lib/auth";
import { consumeGoogleRedirectCredential, isGoogleSignInConfigured } from "@/lib/google-gis";

const SCHOOL_DEACTIVATED_MESSAGE =
  "This school workspace has been deactivated. Contact Feezo support to restore access.";

const fieldClass =
  "h-11 w-full rounded-xl border bg-white px-3.5 text-[14px] text-[#0B1220] outline-none transition-[border-color,box-shadow] placeholder:text-black/35 focus:border-[#0F766E]/55 focus:ring-2 focus:ring-[#0F766E]/10";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, hydrated, login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const googleEnabled = isGoogleSignInConfigured();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof fieldErrors = {};
    if (!email.trim()) errs.email = "Email is required";
    if (!password) errs.password = "Password is required";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setBannerError(null);
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (!result.ok) {
      const message = result.error || "Sign in failed.";
      setBannerError(message);
      toast.error(message);
      return;
    }

    setBannerError(null);
    toast.success(`Welcome, ${result.session.displayName}`);
    navigate({ to: result.redirect });
  };

  return (
    <AuthShell title="Sign in" subtitle="School staff and super admin access.">
      {bannerError ? (
        <div
          role="alert"
          className={
            bannerError === API_UNREACHABLE_MESSAGE
              ? "mt-5 flex items-start gap-2 rounded-xl border border-[#F59E0B]/20 bg-[#FFFBEB] px-3 py-2.5 text-[12.5px] leading-snug text-[#B45309]"
              : "mt-5 flex items-start gap-2 rounded-xl border border-[#EF4444]/15 bg-[#FEF2F2] px-3 py-2.5 text-[12.5px] leading-snug text-[#DC2626]"
          }
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{bannerError}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-3.5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="login-email" className="text-[13px] font-medium text-black/65">
            Email
          </Label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
              if (bannerError) setBannerError(null);
            }}
            placeholder="you@school.com"
            aria-invalid={!!fieldErrors.email}
            className={`${fieldClass} ${
              fieldErrors.email ? "border-[#EF4444]/45" : "border-[#E5E7EB]"
            }`}
          />
          {fieldErrors.email ? (
            <p className="text-[12px] text-[#DC2626]">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="login-password" className="text-[13px] font-medium text-black/65">
              Password
            </Label>
            <Link
              to="/forgot-password"
              className="text-[12.5px] font-medium text-[#0F766E] hover:text-[#0D9488]"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
                if (bannerError) setBannerError(null);
              }}
              placeholder="Enter password"
              aria-invalid={!!fieldErrors.password}
              className={`${fieldClass} pr-10 ${
                fieldErrors.password ? "border-[#EF4444]/45" : "border-[#E5E7EB]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-black/40 hover:bg-black/[0.04] hover:text-black/70"
            >
              {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          {fieldErrors.password ? (
            <p className="text-[12px] text-[#DC2626]">{fieldErrors.password}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 flex h-11 w-full items-center justify-center rounded-xl bg-[#0F766E] text-[13.5px] font-semibold text-white transition-colors hover:bg-[#0D9488] disabled:opacity-55"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {googleEnabled ? (
        <div className="mt-5 space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#ECEEF1]" />
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-black/35">
              or
            </span>
            <div className="h-px flex-1 bg-[#ECEEF1]" />
          </div>
          <GoogleSignInButton disabled={submitting} />
          {submitting ? (
            <p className="text-center text-[12px] text-black/40">Signing in…</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-[#F0F1F3] pt-5 text-[13px] text-black/45">
        <Link
          to="/signup/$step"
          params={{ step: "school" }}
          className="font-medium text-[#0F766E] hover:text-[#0D9488]"
        >
          Create account
        </Link>
        <span aria-hidden className="text-black/20">
          ·
        </span>
        <Link to="/family/login" className="font-medium text-black/55 hover:text-black/80">
          Parent sign in
        </Link>
      </div>
    </AuthShell>
  );
}
