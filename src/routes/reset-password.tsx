import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/AuthShell";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { apiResetPassword } from "@/lib/api/auth";

type ResetPasswordSearch = {
  token?: string;
};

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const hasToken = Boolean(token && token.length >= 32);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirm?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  const strengthHint = useMemo(() => {
    if (!password) return null;
    if (password.length < 8) return "Use at least 8 characters";
    return null;
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasToken || !token) return;

    const errs: typeof fieldErrors = {};
    if (password.length < 8) errs.password = "Password must be at least 8 characters";
    if (!confirm) errs.confirm = "Confirm your password";
    else if (password !== confirm) errs.confirm = "Passwords do not match";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const result = await apiResetPassword(token, password, confirm);
      toast.success(result.message || "Password updated");
      navigate({ to: "/login" });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Unable to reset password. Request a new link.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasToken) {
    return (
      <AuthShell
        title="Invalid reset link"
        subtitle="This password reset link is missing or incomplete."
      >
        <div className="mt-6 space-y-4">
          <div className="flex items-start gap-2 rounded-2xl border border-[#EF4444]/20 bg-[#FEE2E2] px-3 py-2.5 text-[12px] text-[#EF4444]">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Request a new reset link from the sign-in page.</span>
          </div>
          <Link
            to="/forgot-password"
            className="flex h-12 w-full items-center justify-center rounded-full bg-[#0F766E] text-[13.5px] font-semibold text-white transition-colors hover:bg-[#0D9488]"
          >
            Request new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Enter a new password for your account.">
      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label
            htmlFor="reset-password"
            className="text-[11px] font-semibold uppercase tracking-wider text-black/55"
          >
            New password
          </Label>
          <div className="relative">
            <input
              id="reset-password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
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
          {(fieldErrors.password || strengthHint) && (
            <div className="text-[11px] text-[#EF4444]">{fieldErrors.password || strengthHint}</div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="reset-confirm"
            className="text-[11px] font-semibold uppercase tracking-wider text-black/55"
          >
            Confirm password
          </Label>
          <div className="relative">
            <input
              id="reset-confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (fieldErrors.confirm) setFieldErrors((f) => ({ ...f, confirm: undefined }));
              }}
              placeholder="••••••••"
              aria-invalid={!!fieldErrors.confirm}
              className={`h-12 w-full rounded-2xl border bg-white px-4 pr-11 text-[14px] outline-none transition-colors placeholder:text-black/35 focus:border-black focus:ring-2 focus:ring-black/5 ${
                fieldErrors.confirm ? "border-[#EF4444]/40" : "border-[#E5E5E5]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl text-black/45 hover:bg-[#F4F4F5] hover:text-black"
            >
              {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          {fieldErrors.confirm && (
            <div className="text-[11px] text-[#EF4444]">{fieldErrors.confirm}</div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center rounded-full bg-[#0F766E] text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(15,118,110,0.4)] transition-colors hover:bg-[#0D9488] disabled:opacity-60"
        >
          {submitting ? "Updating…" : "Update password"}
        </button>

        <div className="text-center text-[13px] text-black/55">
          <Link to="/login" className="font-medium text-[#0F766E] hover:underline">
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
