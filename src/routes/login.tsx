import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, AlertCircle, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/AuthShell";
import { Label } from "@/components/ui/label";
import { homePathForSession, API_UNREACHABLE_MESSAGE, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, hydrated, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && session) {
      navigate({ to: homePathForSession(session) });
    }
  }, [hydrated, session, navigate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reason = new URLSearchParams(window.location.search).get("reason");
    if (reason === "inactive") {
      toast.message("Signed out after 14 days without use", {
        description: "Sign in again to continue on this browser.",
      });
    } else if (reason === "session_expired") {
      toast.error("Please sign in again to continue");
    }
    if (reason === "inactive" || reason === "session_expired") {
      const url = new URL(window.location.href);
      url.searchParams.delete("reason");
      url.searchParams.delete("from");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, []);

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
      const message = result.error || "Sign in failed. Please try again.";
      setBannerError(message);
      toast.error(message);
      return;
    }

    setBannerError(null);
    toast.success(`Welcome, ${result.session.displayName}`);
    navigate({ to: result.redirect });
  };

  return (
    <AuthShell title="Sign in to continue" subtitle="Enter your account credentials.">
      {bannerError && (
        <div
          role="alert"
          className={
            bannerError === API_UNREACHABLE_MESSAGE
              ? "mt-4 flex items-start gap-2 rounded-2xl border border-[#F59E0B]/25 bg-[#FFFBEB] px-3 py-2.5 text-[12px] text-[#B45309]"
              : "mt-4 flex items-start gap-2 rounded-2xl border border-[#EF4444]/20 bg-[#FEE2E2] px-3 py-2.5 text-[12px] text-[#EF4444]"
          }
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{bannerError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label
            htmlFor="login-email"
            className="text-[11px] font-semibold uppercase tracking-wider text-black/55"
          >
            Email / Username
          </Label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
              if (bannerError) setBannerError(null);
            }}
            placeholder="you@school.com"
            aria-invalid={!!fieldErrors.email}
            className={`h-12 w-full rounded-2xl border bg-white px-4 text-[14px] outline-none transition-colors placeholder:text-black/35 focus:border-black focus:ring-2 focus:ring-black/5 ${
              fieldErrors.email ? "border-[#EF4444]/40" : "border-[#E5E5E5]"
            }`}
          />
          {fieldErrors.email && (
            <div className="text-[11px] text-[#EF4444]">{fieldErrors.email}</div>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label
              htmlFor="login-password"
              className="text-[11px] font-semibold uppercase tracking-wider text-black/55"
            >
              Password
            </Label>
            <Link
              to="/forgot-password"
              className="text-[12px] font-medium text-[#0F766E] hover:underline"
            >
              Forgot password?
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
              placeholder="••••••••"
              aria-invalid={!!fieldErrors.password}
              className={`h-12 w-full rounded-2xl border bg-white px-4 pr-11 text-[14px] outline-none transition-colors placeholder:text-black/35 focus:border-black focus:ring-2 focus:ring-black/5 ${
                fieldErrors.password ? "border-[#EF4444]/40" : "border-[#E5E5E5]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl text-black/45 hover:bg-[#F4F4F5] hover:text-black"
            >
              {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          {fieldErrors.password && (
            <div className="text-[11px] text-[#EF4444]">{fieldErrors.password}</div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0F766E] text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(15,118,110,0.4)] transition-colors hover:bg-[#0D9488] disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <Link
          to="/"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#E5E5E5] bg-white text-[13.5px] font-semibold text-[#0F766E] transition-colors hover:border-[#0F766E]/25 hover:bg-[#F0FDFA]"
        >
          <Home className="h-4 w-4" aria-hidden />
          Home page
        </Link>
      </form>
    </AuthShell>
  );
}
