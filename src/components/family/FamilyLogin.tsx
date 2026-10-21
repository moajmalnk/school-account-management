import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

import { FeezoBrand } from "@/components/brand/FeezoBrand";
import { familyForgot, familyLogin } from "@/lib/api/family";
import { ApiError } from "@/lib/api/client";
import { BRAND } from "@/lib/brand";
import { useFamily } from "@/lib/family-session";
import { cn } from "@/lib/utils";

const PASSWORD_MAX = 72;

type SchoolChoice = { tenantId: string; name: string };

/**
 * Parent sign-in for the family app. The school name appears once this phone
 * matches more than one school, because the login itself is not tied to a campus.
 */
export function FamilyLogin() {
  const navigate = useNavigate();
  const { reload } = useFamily();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [schools, setSchools] = useState<SchoolChoice[]>([]);
  const [errors, setErrors] = useState<{ phone?: string; password?: string; school?: string }>({});
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");

  const selectedSchool = schools.find((school) => school.tenantId === tenantId) ?? null;
  const phoneDigits = phone.replace(/\D/g, "");
  const phoneReady = phoneDigits.length >= 10;
  const passwordReady = mode !== "login" || password.length >= 8;
  const schoolReady = schools.length === 0 || tenantId !== "";
  const ready = phoneReady && passwordReady && schoolReady;

  useEffect(() => {
    return () => setPassword("");
  }, []);

  useEffect(() => {
    if (!phone && !password) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phone, password]);

  async function submit() {
    const nextErrors: { phone?: string; password?: string; school?: string } = {};
    if (!phoneReady) nextErrors.phone = "Enter the phone the school has on file";
    if (mode === "login" && password.length < 8) nextErrors.password = "Password must be at least 8 characters";
    if (schools.length > 0 && tenantId === "") nextErrors.school = "Choose the school for this phone";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || busy) return;
    setBusy(true);
    try {
      if (mode === "forgot") {
        const result = await familyForgot(phone, tenantId || undefined);
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
      const result = await familyLogin(phone, password, tenantId || undefined);
      if (result.needsSchool && result.schools) {
        setSchools(result.schools);
        setTenantId("");
        if (!tenantId) toast.message("Choose the school for this phone");
        return;
      }
      setPassword("");
      await reload();
      navigate({ href: "/family" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#F4F6F9] text-slate-900">
      <div className="grid min-h-dvh min-[900px]:grid-cols-12">
        <LoginPanel schoolName={selectedSchool?.name ?? ""} />
        <section className="flex min-h-dvh flex-col min-[900px]:col-span-7">
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
            <div className="mb-6 min-[900px]:hidden">
              <FeezoBrand subtitle={selectedSchool?.name ?? "Family"} markClassName="h-11 w-11" />
            </div>
            <div className="w-full max-w-[440px]">
              <LoginCard
                mode={mode}
                schoolName={selectedSchool?.name ?? ""}
                schools={schools}
                tenantId={tenantId}
                phone={phone}
                password={password}
                errors={errors}
                ready={ready}
                busy={busy}
                onPhone={(value) => {
                  setPhone(value.replace(/[^\d+\s()-]/g, "").slice(0, 15));
                  setErrors((current) => ({ ...current, phone: undefined }));
                }}
                onPassword={(value) => {
                  setPassword(value.slice(0, PASSWORD_MAX));
                  setErrors((current) => ({ ...current, password: undefined }));
                }}
                onSchool={(value) => {
                  setTenantId(value);
                  setErrors((current) => ({ ...current, school: undefined }));
                }}
                onMode={() => {
                  setMode(mode === "login" ? "forgot" : "login");
                  setPassword("");
                  setErrors({});
                }}
                onSubmit={submit}
              />
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
                School staff sign in
              </Link>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}

function LoginPanel({ schoolName }: { schoolName: string }) {
  return (
    <aside className="relative hidden min-h-dvh flex-col justify-between overflow-hidden bg-[#0B3D3A] px-8 py-10 text-white min-[900px]:col-span-5 min-[900px]:flex xl:px-14 xl:py-12">
      <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[#14B8A6]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-[#8FCA4A]/15 blur-3xl" />

      <div className="relative flex items-center gap-3">
        <img src={BRAND.mark} alt="" className="h-12 w-12 rounded-2xl bg-white p-1.5" />
        <div className="leading-tight">
          <div className="text-lg font-semibold tracking-tight">
            Fee<span className="text-[#8FCA4A]">zo</span> Family
          </div>
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/60">
            Parent portal
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-[#8FCA4A]">
          {schoolName || "Feezo Family"}
        </p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
          Fees, attendance, and marks in one sign-in.
        </h2>
        <ul className="mt-8 space-y-4 text-[15px] text-white/85">
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8FCA4A]" />
            Use the mobile number the school already saved for your child.
          </li>
          <li className="flex gap-3">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#8FCA4A]" />
            One password covers every child linked to this phone.
          </li>
        </ul>
      </div>

      <p className="relative text-sm text-white/70">
        {schoolName ? `Signing in to ${schoolName}` : "Feezo Family · Parent sign in"}
      </p>
    </aside>
  );
}

function LoginCard({
  mode,
  schoolName,
  schools,
  tenantId,
  phone,
  password,
  errors,
  ready,
  busy,
  onPhone,
  onPassword,
  onSchool,
  onMode,
  onSubmit,
}: {
  mode: "login" | "forgot";
  schoolName: string;
  schools: SchoolChoice[];
  tenantId: string;
  phone: string;
  password: string;
  errors: { phone?: string; password?: string; school?: string };
  ready: boolean;
  busy: boolean;
  onPhone: (value: string) => void;
  onPassword: (value: string) => void;
  onSchool: (value: string) => void;
  onMode: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-32px_rgba(15,23,42,0.28)] sm:p-8">
      <div className="hidden min-[900px]:block">
        <FeezoBrand subtitle={schoolName || "Family"} markClassName="h-11 w-11" />
      </div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 min-[900px]:mt-6 sm:text-[32px] sm:leading-tight">
        {mode === "login" ? "Parent sign in" : "Reset password"}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        {schoolName
          ? `Use the mobile number ${schoolName} saved for your child.`
          : "Use the mobile number the school saved for your child."}
      </p>

      {schoolName ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#F8FAF9] px-3 py-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0F766E] text-sm font-semibold text-white">
            {initials(schoolName)}
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              School
            </span>
            <span className="block truncate text-sm font-semibold text-slate-900">{schoolName}</span>
          </span>
        </div>
      ) : null}

      <form
        className="mt-6 space-y-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="space-y-1.5">
          <label htmlFor="family-phone" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Phone
          </label>
          <input
            id="family-phone"
            inputMode="tel"
            autoComplete="tel"
            maxLength={15}
            value={phone}
            onChange={(event) => onPhone(event.target.value)}
            aria-invalid={errors.phone ? true : undefined}
            className={cn(
              "h-12 w-full rounded-2xl border bg-white px-4 text-sm text-slate-900 outline-none transition-colors focus:ring-2",
              errors.phone
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                : "border-slate-200 focus:border-[#0F766E] focus:ring-[#0F766E]/15",
            )}
          />
          {errors.phone ? <p className="text-xs text-rose-600">{errors.phone}</p> : null}
        </div>

        {mode === "login" ? (
          <SecretField
            id="family-password"
            label="Password"
            value={password}
            error={errors.password ?? ""}
            onChange={onPassword}
          />
        ) : null}

        {schools.length > 0 ? (
          <SchoolPicker schools={schools} value={tenantId} error={errors.school ?? ""} onChange={onSchool} />
        ) : null}

        <button
          type="submit"
          disabled={busy || !ready}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0F766E] text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(15,118,110,0.55)] transition-colors hover:bg-[#0D9488] disabled:cursor-not-allowed disabled:bg-[#0F766E]/45 disabled:shadow-none"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Send reset link"}
        </button>
      </form>

      <button type="button" className="mt-4 text-sm font-medium text-[#0F766E]" onClick={onMode}>
        {mode === "login" ? "Forgot password?" : "Back to sign in"}
      </button>
    </div>
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
      <legend className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">School</legend>
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
                "flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
                selected
                  ? "border-[#0F766E] bg-[#F0FDFA]"
                  : "border-slate-200 bg-white hover:border-slate-300",
              )}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0F766E] text-xs font-semibold text-white">
                {initials(school.name)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{school.name}</span>
              {selected ? <Check className="h-4 w-4 shrink-0 text-[#0F766E]" /> : null}
            </button>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-rose-600">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function SecretField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error: string;
  onChange: (value: string) => void;
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
          autoComplete="current-password"
          maxLength={PASSWORD_MAX}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-12 w-full rounded-2xl border bg-white ps-4 pe-12 text-sm text-slate-900 outline-none transition-colors focus:ring-2",
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
              : "border-slate-200 focus:border-[#0F766E] focus:ring-[#0F766E]/15",
          )}
        />
        <button
          type="button"
          onClick={() => setShown((current) => !current)}
          aria-label={shown ? "Hide password" : "Show password"}
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

function initials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return letters || "S";
}
