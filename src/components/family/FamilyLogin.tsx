import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/AuthShell";
import { familyForgot, familyLogin } from "@/lib/api/family";
import { ApiError } from "@/lib/api/client";
import { useFamily } from "@/lib/family-session";
import { cn } from "@/lib/utils";

const PASSWORD_MAX = 72;

const fieldClass =
  "h-11 w-full rounded-xl border bg-white px-3.5 text-[14px] text-[#0B1220] outline-none transition-[border-color,box-shadow] placeholder:text-black/35 focus:border-[#0F766E]/55 focus:ring-2 focus:ring-[#0F766E]/10";

type SchoolChoice = { tenantId: string; name: string };

/**
 * Parent portal sign-in (/family/login).
 * Uses the phone the school has on file — not Google (that is for /login staff).
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

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneReady = phoneDigits.length >= 10;
  const passwordReady = mode !== "login" || password.length >= 8;
  const schoolReady = schools.length === 0 || tenantId !== "";
  const ready = phoneReady && passwordReady && schoolReady;

  useEffect(() => {
    return () => setPassword("");
  }, []);

  async function submit() {
    const nextErrors: { phone?: string; password?: string; school?: string } = {};
    if (!phoneReady) nextErrors.phone = "Enter the phone the school has on file";
    if (mode === "login" && password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }
    if (schools.length > 0 && tenantId === "") {
      nextErrors.school = "Choose the school for this phone";
    }
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
    <AuthShell
      title={mode === "login" ? "Parent sign in" : "Reset password"}
      subtitle={
        mode === "login"
          ? "Use the mobile number your school has on file."
          : "We’ll help you get a new password for this phone."
      }
    >
      <form
        className="mt-6 space-y-3.5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="space-y-1.5">
          <label htmlFor="family-phone" className="text-[13px] font-medium text-black/65">
            Phone
          </label>
          <input
            id="family-phone"
            inputMode="tel"
            autoComplete="tel"
            autoFocus
            maxLength={15}
            value={phone}
            placeholder="10-digit mobile number"
            onChange={(event) => {
              setPhone(event.target.value.replace(/[^\d+\s()-]/g, "").slice(0, 15));
              setErrors((current) => ({ ...current, phone: undefined }));
            }}
            aria-invalid={errors.phone ? true : undefined}
            className={cn(
              fieldClass,
              errors.phone ? "border-[#EF4444]/45" : "border-[#E5E7EB]",
            )}
          />
          {errors.phone ? <p className="text-[12px] text-[#DC2626]">{errors.phone}</p> : null}
        </div>

        {mode === "login" ? (
          <SecretField
            id="family-password"
            label="Password"
            value={password}
            error={errors.password ?? ""}
            onChange={(value) => {
              setPassword(value.slice(0, PASSWORD_MAX));
              setErrors((current) => ({ ...current, password: undefined }));
            }}
            onForgot={() => {
              setMode("forgot");
              setPassword("");
              setErrors({});
            }}
          />
        ) : null}

        {schools.length > 0 ? (
          <SchoolPicker
            schools={schools}
            value={tenantId}
            error={errors.school ?? ""}
            onChange={(value) => {
              setTenantId(value);
              setErrors((current) => ({ ...current, school: undefined }));
            }}
          />
        ) : null}

        <button
          type="submit"
          disabled={busy || !ready}
          className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] text-[13.5px] font-semibold text-white transition-colors hover:bg-[#0D9488] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Send reset link"}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-[#F0F1F3] pt-5 text-[13px] text-black/45">
        {mode === "forgot" ? (
          <button
            type="button"
            className="font-medium text-[#0F766E] hover:text-[#0D9488]"
            onClick={() => {
              setMode("login");
              setErrors({});
            }}
          >
            Back to sign in
          </button>
        ) : (
          <span className="text-black/40">Need school access?</span>
        )}
        <span aria-hidden className="text-black/20">
          ·
        </span>
        <Link to="/login" className="font-medium text-black/55 hover:text-black/80">
          Staff / admin login
        </Link>
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
      <legend className="text-[13px] font-medium text-black/65">School</legend>
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

function SecretField({
  id,
  label,
  value,
  error,
  onChange,
  onForgot,
}: {
  id: string;
  label: string;
  value: string;
  error: string;
  onChange: (value: string) => void;
  onForgot: () => void;
}) {
  const [shown, setShown] = useState(false);
  const errorId = useId();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-black/65">
          {label}
        </label>
        <button
          type="button"
          onClick={onForgot}
          className="text-[12.5px] font-medium text-[#0F766E] hover:text-[#0D9488]"
        >
          Forgot?
        </button>
      </div>
      <div className="relative">
        <input
          id={id}
          type={shown ? "text" : "password"}
          autoComplete="current-password"
          maxLength={PASSWORD_MAX}
          value={value}
          placeholder="Enter password"
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            fieldClass,
            "pr-10",
            error ? "border-[#EF4444]/45" : "border-[#E5E7EB]",
          )}
        />
        <button
          type="button"
          onClick={() => setShown((current) => !current)}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-black/40 hover:bg-black/[0.04] hover:text-black/70"
        >
          {shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="text-[12px] text-[#DC2626]">
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
