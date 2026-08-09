import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/AuthShell";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { apiForgotPassword } from "@/lib/api/auth";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setFieldError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldError("Enter a valid email address");
      return;
    }

    setSubmitting(true);
    setFieldError(undefined);
    try {
      const result = await apiForgotPassword(email.trim());
      setSent(true);
      setResetUrl(result.resetUrl);
      toast.success("Check your email for reset instructions");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Unable to send reset email. Try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your account email and we’ll send a reset link."
    >
      {sent ? (
        <div className="mt-6 space-y-4">
          <div className="flex items-start gap-2 rounded-2xl border border-[#0F766E]/20 bg-[#CCFBF1]/40 px-3 py-3 text-[13px] text-black/75">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" />
            <div>
              <p>
                If an account exists for <span className="font-medium">{email.trim()}</span>,
                password reset instructions have been sent.
              </p>
              {resetUrl && (
                <p className="mt-2 text-[12px] text-black/55">
                  Email delivery may be delayed. You can also{" "}
                  <a
                    href={resetUrl}
                    className="font-medium text-[#0F766E] underline-offset-2 hover:underline"
                  >
                    open the reset link directly
                  </a>
                  .
                </p>
              )}
            </div>
          </div>
          <Link
            to="/login"
            className="flex h-12 w-full items-center justify-center rounded-full bg-[#0F766E] text-[13.5px] font-semibold text-white transition-colors hover:bg-[#0D9488]"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label
              htmlFor="forgot-email"
              className="text-[11px] font-semibold uppercase tracking-wider text-black/55"
            >
              Email
            </Label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldError) setFieldError(undefined);
              }}
              placeholder="you@school.com"
              aria-invalid={!!fieldError}
              className={`h-12 w-full rounded-2xl border bg-white px-4 text-[14px] outline-none transition-colors placeholder:text-black/35 focus:border-black focus:ring-2 focus:ring-black/5 ${
                fieldError ? "border-[#EF4444]/40" : "border-[#E5E5E5]"
              }`}
            />
            {fieldError && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#EF4444]">
                <AlertCircle className="h-3 w-3" />
                {fieldError}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center rounded-full bg-[#0F766E] text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(15,118,110,0.4)] transition-colors hover:bg-[#0D9488] disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send reset link"}
          </button>

          <div className="text-center text-[13px] text-black/55">
            <Link to="/login" className="font-medium text-[#0F766E] hover:underline">
              Back to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
