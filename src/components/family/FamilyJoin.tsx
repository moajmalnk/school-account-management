import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Check, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

import { FeezoBrand } from "@/components/brand/FeezoBrand";
import { familyAcceptInvite, familyPreviewInvite } from "@/lib/api/family";
import { ApiError } from "@/lib/api/client";
import { BRAND } from "@/lib/brand";
import { useFamily } from "@/lib/family-session";
import { cn } from "@/lib/utils";

const PASSWORD_MAX = 72;

type InvitePreview = { parentName: string; schoolName: string; purpose?: "invite" | "reset" };

/**
 * Invite acceptance for the family app. The link is single-use, so the form
 * only posts after both password fields pass the same rules the API enforces.
 */
export function FamilyJoin({ token }: { token: string }) {
  const navigate = useNavigate();
  const { reload } = useFamily();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    familyPreviewInvite(token)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "This link is not valid");
      });
    return () => {
      cancelled = true;
      setPassword("");
      setConfirm("");
    };
  }, [token]);

  useEffect(() => {
    if (!password && !confirm) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [password, confirm]);

  const passwordError = passwordIssue(password);
  const confirmError = confirmIssue(password, confirm);
  const ready = passwordError === "" && confirmError === "";

  async function submit() {
    setTouched({ password: true, confirm: true });
    if (!ready || busy) return;
    setBusy(true);
    try {
      await familyAcceptInvite(token, password);
      setPassword("");
      setConfirm("");
      await reload();
      toast.success(preview?.purpose === "reset" ? "Password updated" : "Account ready");
      navigate({ href: "/family" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#F4F6F9] text-slate-900">
      <div className="grid min-h-dvh min-[900px]:grid-cols-12">
        <InvitePanel preview={preview} />
        <section className="flex min-h-dvh flex-col min-[900px]:col-span-7">
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
            <div className="mb-6 min-[900px]:hidden">
              <FeezoBrand subtitle="Family" markClassName="h-11 w-11" />
            </div>
            <div className="w-full max-w-[440px]">
              {error ? (
                <InviteError message={error} />
              ) : preview ? (
                <PasswordCard
                  preview={preview}
                  password={password}
                  confirm={confirm}
                  passwordError={touched.password ? passwordError : ""}
                  confirmError={touched.confirm ? confirmError : ""}
                  ready={ready}
                  busy={busy}
                  onPassword={(value) => setPassword(value.slice(0, PASSWORD_MAX))}
                  onConfirm={(value) => setConfirm(value.slice(0, PASSWORD_MAX))}
                  onBlur={(field) => setTouched((current) => ({ ...current, [field]: true }))}
                  onSubmit={submit}
                />
              ) : (
                <InviteSkeleton />
              )}
            </div>
          </div>

          <footer className="px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center sm:px-8">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] font-medium text-slate-500">
              <a href={BRAND.legal.termsPath} className="hover:text-slate-900 hover:underline">
                Terms of Use
              </a>
              <span aria-hidden className="text-slate-300">
                ·
              </span>
              <a href={BRAND.legal.privacyPath} className="hover:text-slate-900 hover:underline">
                Privacy Policy
              </a>
              <span aria-hidden className="text-slate-300">
                ·
              </span>
              <Link to="/login" className="text-[#0F766E] hover:underline">
                Parent sign in
              </Link>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}

function InvitePanel({ preview }: { preview: InvitePreview | null }) {
  return (
    <aside className="relative hidden min-h-dvh flex-col justify-between overflow-hidden bg-[#0B3D3A] px-8 py-10 text-white min-[900px]:col-span-5 min-[900px]:flex xl:px-14 xl:py-12">
      <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[#14B8A6]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-[#8FCA4A]/15 blur-3xl" />

      <div className="relative flex items-center gap-3">
        <img src={BRAND.mark} alt="" className="h-12 w-12 rounded-2xl bg-white p-1.5" />
        <div className="leading-tight">
          <div className="text-lg font-semibold tracking-tight">Feezo Family</div>
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/60">
            Parent portal
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-[#8FCA4A]">
          {preview?.purpose === "reset" ? "Password reset" : "School invite"}
        </p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
          {preview?.purpose === "reset"
            ? "Choose a new password for the family app."
            : "One password for your child’s school updates."}
        </h2>
        <ul className="mt-8 space-y-4 text-[15px] text-white/85">
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8FCA4A]" />
            Fees, attendance, and academics stay on the phone the school already has.
          </li>
          <li className="flex gap-3">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#8FCA4A]" />
            You choose the password. The school never sees it.
          </li>
        </ul>
      </div>

      <p className="relative text-sm text-white/70">
        {preview
          ? `${preview.parentName} · ${preview.schoolName}`
          : "This link is personal to the parent the school invited."}
      </p>
    </aside>
  );
}

function PasswordCard({
  preview,
  password,
  confirm,
  passwordError,
  confirmError,
  ready,
  busy,
  onPassword,
  onConfirm,
  onBlur,
  onSubmit,
}: {
  preview: InvitePreview;
  password: string;
  confirm: string;
  passwordError: string;
  confirmError: string;
  ready: boolean;
  busy: boolean;
  onPassword: (value: string) => void;
  onConfirm: (value: string) => void;
  onBlur: (field: "password" | "confirm") => void;
  onSubmit: () => void;
}) {
  const longEnough = password.length >= 8;
  const matches = password.length > 0 && password === confirm;
  const resetting = preview.purpose === "reset";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-32px_rgba(15,23,42,0.28)] sm:p-8">
      <p className="text-[13px] font-semibold text-[#0F766E]">{resetting ? "Password reset" : "Create your account"}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[32px] sm:leading-tight">
        {resetting ? "Choose a new password" : "Set your password"}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        You’ll sign in later with the mobile number {preview.schoolName} saved for you.
      </p>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#F8FAF9] px-3 py-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0F766E] text-sm font-semibold text-white">
          {initials(preview.parentName)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-900">{preview.parentName}</span>
          <span className="block truncate text-xs text-slate-500">{preview.schoolName}</span>
        </span>
      </div>

      <form
        className="mt-6 space-y-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <SecretField
          id="join-password"
          label="Password"
          value={password}
          autoComplete="new-password"
          autoFocus
          error={passwordError}
          onChange={onPassword}
          onBlur={() => onBlur("password")}
        />
        <SecretField
          id="join-confirm"
          label="Confirm password"
          value={confirm}
          autoComplete="new-password"
          error={confirmError}
          onChange={onConfirm}
          onBlur={() => onBlur("confirm")}
        />

        <ul className="grid gap-2 sm:grid-cols-2" aria-live="polite">
          <Requirement met={longEnough} label="At least 8 characters" />
          <Requirement met={matches} label="Passwords match" />
        </ul>

        <button
          type="submit"
          disabled={busy || !ready}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0F766E] text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(15,118,110,0.55)] transition-colors hover:bg-[#0D9488] disabled:cursor-not-allowed disabled:bg-[#0F766E]/45 disabled:shadow-none"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? "Saving password…" : "Continue"}
        </button>
      </form>
    </div>
  );
}

function SecretField({
  id,
  label,
  value,
  autoComplete,
  autoFocus,
  error,
  onChange,
  onBlur,
}: {
  id: string;
  label: string;
  value: string;
  autoComplete: string;
  autoFocus?: boolean;
  error: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const [shown, setShown] = useState(false);
  const errorId = useId();

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={PASSWORD_MAX}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-12 w-full rounded-2xl border bg-white ps-4 pe-12 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2",
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
              : "border-slate-200 focus:border-[#0F766E] focus:ring-[#0F766E]/15",
          )}
        />
        <button
          type="button"
          onClick={() => setShown((current) => !current)}
          aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={shown}
          className="absolute end-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium",
        met ? "bg-[#F0FDFA] text-[#0F766E]" : "bg-slate-50 text-slate-500",
      )}
    >
      <Check className={cn("h-3.5 w-3.5", met ? "opacity-100" : "opacity-40")} />
      {label}
    </li>
  );
}

function InviteError({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)] sm:p-8">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
        <AlertCircle className="h-5 w-5" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">This invite can’t be used</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
      <Link
        to="/login"
        className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-[#0F766E] text-sm font-semibold text-white hover:bg-[#0D9488]"
      >
        Go to parent sign in
      </Link>
    </div>
  );
}

function InviteSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading invite</span>
      <div className="h-4 w-32 animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-4 h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-3 h-4 w-full animate-pulse rounded-lg bg-slate-100" />
      <div className="mt-6 h-16 animate-pulse rounded-2xl bg-slate-100" />
      <div className="mt-6 h-12 animate-pulse rounded-2xl bg-slate-100" />
      <div className="mt-4 h-12 animate-pulse rounded-2xl bg-slate-100" />
      <div className="mt-4 h-12 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}

function initials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return letters || "P";
}

function passwordIssue(value: string) {
  if (!value) return "Enter a password";
  if (value.length < 8) return "Use at least 8 characters";
  return "";
}

function confirmIssue(password: string, confirm: string) {
  if (!confirm) return "Confirm your password";
  if (password !== confirm) return "Passwords do not match";
  return "";
}
