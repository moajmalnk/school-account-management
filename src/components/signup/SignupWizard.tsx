import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  FieldLabel,
  SignupShell,
  fieldClass,
  signupSelectContentClass,
  signupSelectItemClass,
  signupSelectTriggerClass,
} from "@/components/signup/SignupShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { apiRegisterTrial } from "@/lib/api/auth";
import { homePathForSession, useAuth } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { INDIA_STATES, districtsForState } from "@/lib/geo/india-states-districts";
import { formatInr } from "@/lib/marketing-content";
import {
  EMPTY_SIGNUP,
  SCHOOL_TYPES,
  SIGNUP_PLANS,
  clearSignupDraft,
  loadSignupDraft,
  passwordStrength,
  saveSignupDraft,
  slugFromStepNumber,
  slugifySchoolName,
  stepNumberFromSlug,
  type SignupFormState,
  type SignupStepSlug,
} from "@/lib/signup-content";
import { cn } from "@/lib/utils";

function goToSignupStep(
  navigate: ReturnType<typeof useNavigate>,
  step: SignupStepSlug,
  replace = false,
) {
  void navigate({
    to: "/signup/$step",
    params: { step },
    replace,
  } as never);
}

export function SignupWizard({ stepSlug }: { stepSlug: string }) {
  const navigate = useNavigate();
  const { acceptLoginResponse, session, hydrated } = useAuth();
  const step = stepNumberFromSlug(stepSlug);
  const isSuccess = stepSlug === "success";
  const [form, setForm] = useState<SignupFormState>(() => loadSignupDraft());
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormState, string>>>({});
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    tenantName: string;
    tier: string;
    redirect: string;
  } | null>(null);

  const districts = useMemo(() => districtsForState(form.state), [form.state]);
  const strength = passwordStrength(form.password);

  useEffect(() => {
    saveSignupDraft(form);
  }, [form]);

  useEffect(() => {
    if (hydrated && session && !isSuccess && !submitting && !success) {
      navigate({ to: homePathForSession(session), replace: true });
    }
  }, [hydrated, session, isSuccess, success, submitting, navigate]);

  const patch = <K extends keyof SignupFormState>(key: K, value: SignupFormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "schoolName" && typeof value === "string") {
        const auto = slugifySchoolName(value);
        if (!prev.subdomain || prev.subdomain === slugifySchoolName(prev.schoolName)) {
          next.subdomain = auto;
        }
      }
      if (key === "state") {
        next.district = "";
      }
      return next;
    });
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validateStep = (s: number): boolean => {
    const e: typeof errors = {};
    if (s === 1) {
      if (!form.schoolName.trim()) e.schoolName = "Required";
      if (!form.schoolCode.trim()) e.schoolCode = "Required";
      if (!form.schoolType) e.schoolType = "Required";
      if (!form.phone.trim()) e.phone = "Required";
      if (!form.address.trim()) e.address = "Required";
      if (!form.state) e.state = "Required";
      if (!form.district) e.district = "Required";
      if (!form.schoolEmail.trim()) e.schoolEmail = "Required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.schoolEmail)) {
        e.schoolEmail = "Enter a valid email";
      }
      if (!form.subdomain.trim() || form.subdomain.length < 2) {
        e.subdomain = "Workspace URL is required";
      }
    }
    if (s === 2) {
      if (!form.adminName.trim()) e.adminName = "Required";
      if (!form.adminMobile.trim()) e.adminMobile = "Required";
      if (!form.adminEmail.trim()) e.adminEmail = "Required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail)) {
        e.adminEmail = "Enter a valid email";
      }
      if (form.password.length < 8) e.password = "Minimum 8 characters";
      if (form.passwordConfirm !== form.password) {
        e.passwordConfirm = "Passwords do not match";
      }
    }
    if (s === 3 && !form.tier) e.tier = "Select a package";
    if (s === 4 && !form.agreeTerms) {
      e.agreeTerms = "Please agree to continue";
    }
    setErrors(e);
    const keys = Object.keys(e) as (keyof SignupFormState)[];
    if (keys.length === 0) return true;

    const firstKey = keys[0];
    const labels: Partial<Record<keyof SignupFormState, string>> = {
      schoolName: "School name",
      schoolCode: "School code",
      schoolType: "School type",
      phone: "Phone number",
      address: "Address",
      state: "State",
      district: "District",
      schoolEmail: "School email",
      subdomain: "Workspace URL",
      adminName: "Administrator name",
      adminMobile: "Administrator mobile",
      adminEmail: "Administrator email",
      password: "Password",
      passwordConfirm: "Password confirmation",
      tier: "Package",
      agreeTerms: "Terms agreement",
    };
    toast.error("Please complete the required fields", {
      description: labels[firstKey] ? `Missing: ${labels[firstKey]}` : e[firstKey],
    });
    window.setTimeout(() => {
      const el =
        document.getElementById(String(firstKey)) ??
        document.querySelector(`[data-signup-field="${String(firstKey)}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLElement) el.focus({ preventScroll: true });
    }, 50);
    return false;
  };

  const next = () => {
    if (!validateStep(step)) return;
    saveSignupDraft(form);
    const nextSlug = slugFromStepNumber(Math.min(4, step + 1));
    goToSignupStep(navigate, nextSlug);
  };

  const back = () => {
    saveSignupDraft(form);
    const prevSlug = slugFromStepNumber(Math.max(1, step - 1));
    goToSignupStep(navigate, prevSlug);
  };

  const createAccount = async () => {
    if (!validateStep(4)) return;
    setSubmitting(true);
    try {
      const data = await apiRegisterTrial({
        name: form.schoolName.trim(),
        subdomain: form.subdomain.trim(),
        schoolType: form.schoolType,
        phone: form.phone.trim(),
        address: form.address.trim(),
        district: form.district,
        state: form.state,
        country: "India",
        affiliationNo: form.schoolCode.trim(),
        website: form.website.trim() || undefined,
        schoolEmail: form.schoolEmail.trim().toLowerCase(),
        adminName: form.adminName.trim(),
        adminMobile: form.adminMobile.trim(),
        adminEmail: form.adminEmail.trim().toLowerCase(),
        password: form.password,
        tier: form.tier,
      });
      const result = acceptLoginResponse(data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      clearSignupDraft();
      setSuccess({
        tenantName: data.tenant?.name ?? form.schoolName,
        tier: data.tenant?.tier ?? form.tier,
        redirect: result.redirect,
      });
      goToSignupStep(navigate, "success", true);
      toast.success("Your Feezo workspace is live");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not create your school. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess || success) {
    const info = success ?? {
      tenantName: form.schoolName || "Your school",
      tier: form.tier,
      redirect: "/tenant/dashboard",
    };
    return (
      <div className="min-h-dvh bg-[#F4F6F9] px-3 py-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-lg">
          <div className="rounded-[28px] border border-white/80 bg-white px-6 py-8 text-center shadow-[0_24px_60px_-40px_rgba(0,0,0,0.35)] sm:px-8">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6BA832]">
              Feezo Edu Books Registration
            </p>
            <h1 className="mt-2 text-[1.65rem] font-semibold tracking-tight text-black">
              Tenant Created!
            </h1>
            <p className="mt-1 text-[14px] text-black/55">
              Your Feezo workspace is live and active.
            </p>
            <div className="mt-8 text-[2.5rem]" aria-hidden>
              🥳
            </div>
            <h2 className="mt-3 text-[1.25rem] font-bold text-black">
              Welcome to Feezo Edu Books!
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-black/60">
              Your dedicated school account and isolated tenant workspace have been created
              successfully.
            </p>
            <div className="mt-6 space-y-2 rounded-2xl bg-[#F4FBF0] px-4 py-4 text-left text-[13px]">
              <Row label="Active Tenant Workspace" value={info.tenantName} />
              <Row label="Access Role" value="Super Administrator" />
              <Row
                label="Trial Status"
                value={`${info.tier} · 14 Days Active (Full Access)`}
                accent
              />
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: info.redirect as "/tenant/dashboard" })}
              className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#6BA832] text-[14px] font-semibold text-white shadow-[0_12px_28px_-14px_rgba(107,168,50,0.7)] transition-colors hover:bg-[#5a9429]"
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SignupShell step={step}>
      {step === 1 ? (
        <div className="space-y-4">
          <h2 className="text-[15px] font-semibold text-black">Step 1 — School Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="schoolName" label="School Name" required error={errors.schoolName}>
              <input
                id="schoolName"
                className={fieldClass}
                placeholder="e.g. St. Xavier High School"
                value={form.schoolName}
                onChange={(e) => patch("schoolName", e.target.value)}
              />
            </Field>
            <Field
              id="schoolCode"
              label="School Code / Affiliation ID"
              required
              error={errors.schoolCode}
            >
              <input
                id="schoolCode"
                className={fieldClass}
                placeholder="e.g. SCH-5042"
                value={form.schoolCode}
                onChange={(e) => patch("schoolCode", e.target.value)}
              />
            </Field>
            <Field id="schoolType" label="School Type" required error={errors.schoolType}>
              <Select value={form.schoolType} onValueChange={(v) => patch("schoolType", v)}>
                <SelectTrigger
                  id="schoolType"
                  data-signup-field="schoolType"
                  className={signupSelectTriggerClass}
                >
                  <SelectValue placeholder="Select School Type" />
                </SelectTrigger>
                <SelectContent className={signupSelectContentClass}>
                  {SCHOOL_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className={signupSelectItemClass}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="phone" label="Phone Number" required error={errors.phone}>
              <input
                id="phone"
                className={fieldClass}
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => patch("phone", e.target.value)}
              />
            </Field>
          </div>
          <Field id="address" label="Address" required error={errors.address}>
            <input
              id="address"
              className={fieldClass}
              placeholder="Campus address, street, landmark"
              value={form.address}
              onChange={(e) => patch("address", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="state" label="State" required error={errors.state}>
              <Select value={form.state} onValueChange={(v) => patch("state", v)}>
                <SelectTrigger
                  id="state"
                  data-signup-field="state"
                  className={signupSelectTriggerClass}
                >
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className={signupSelectContentClass}>
                  {INDIA_STATES.map((s) => (
                    <SelectItem key={s} value={s} className={signupSelectItemClass}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="district" label="District" required error={errors.district}>
              <Select
                value={form.district}
                onValueChange={(v) => patch("district", v)}
                disabled={!form.state}
              >
                <SelectTrigger
                  id="district"
                  data-signup-field="district"
                  className={signupSelectTriggerClass}
                >
                  <SelectValue
                    placeholder={form.state ? "Select district" : "Select state first"}
                  />
                </SelectTrigger>
                <SelectContent className={signupSelectContentClass}>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d} className={signupSelectItemClass}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="schoolEmail"
              label="Official School Email"
              required
              error={errors.schoolEmail}
            >
              <input
                id="schoolEmail"
                type="email"
                className={fieldClass}
                placeholder="admin@stxavier.edu"
                value={form.schoolEmail}
                onChange={(e) => patch("schoolEmail", e.target.value)}
              />
            </Field>
            <Field id="website" label="Website (Optional)">
              <input
                id="website"
                className={fieldClass}
                placeholder="https://stxavier.edu"
                value={form.website}
                onChange={(e) => patch("website", e.target.value)}
              />
            </Field>
          </div>
          <Field id="subdomain" label="Workspace URL" required error={errors.subdomain}>
            <div className="flex items-center gap-2">
              <input
                id="subdomain"
                className={fieldClass}
                value={form.subdomain}
                onChange={(e) =>
                  patch("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
              />
              <span className="shrink-0 text-[12px] text-black/45">.feezo.app</span>
            </div>
          </Field>
          <NavRow onBack={null} onNext={next} nextLabel="Next: Administrator Details →" />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <h2 className="text-[15px] font-semibold text-black">
            Step 2 — Administrator Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="adminName" label="Administrator Full Name" required error={errors.adminName}>
              <input
                id="adminName"
                className={fieldClass}
                placeholder="e.g. Dr. Rajesh Sharma"
                value={form.adminName}
                onChange={(e) => patch("adminName", e.target.value)}
              />
            </Field>
            <Field
              id="adminMobile"
              label="Administrator Mobile Number"
              required
              error={errors.adminMobile}
            >
              <input
                id="adminMobile"
                className={fieldClass}
                placeholder="+91 98450 12345"
                value={form.adminMobile}
                onChange={(e) => patch("adminMobile", e.target.value)}
              />
            </Field>
          </div>
          <Field
            id="adminEmail"
            label="Administrator Login Email"
            required
            error={errors.adminEmail}
          >
            <input
              id="adminEmail"
              type="email"
              className={fieldClass}
              placeholder="rajesh@stxavier.edu"
              value={form.adminEmail}
              onChange={(e) => patch("adminEmail", e.target.value)}
            />
            <p className="mt-1.5 text-[12px] text-black/45">
              This email will be used as your primary school admin login.
            </p>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="password" label="Create Master Password" required error={errors.password}>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  className={cn(fieldClass, "pr-11")}
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(e) => patch("password", e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-[12px] text-black/45">Strength: {strength.label}</p>
            </Field>
            <Field
              id="passwordConfirm"
              label="Confirm Password"
              required
              error={errors.passwordConfirm}
            >
              <input
                id="passwordConfirm"
                type={showPw ? "text" : "password"}
                className={fieldClass}
                placeholder="Repeat your password"
                value={form.passwordConfirm}
                onChange={(e) => patch("passwordConfirm", e.target.value)}
              />
            </Field>
          </div>
          <NavRow onBack={back} onNext={next} nextLabel="Next: Choose Package →" />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <h2 className="text-[15px] font-semibold text-black">Step 3 — Choose Your Package</h2>
          <p className="text-[13px] text-black/55">
            All plans include a 14-day full-feature trial. You can change later.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {SIGNUP_PLANS.map((plan) => {
              const selected = form.tier === plan.name;
              return (
                <button
                  key={plan.name}
                  type="button"
                  onClick={() => patch("tier", plan.name)}
                  className={cn(
                    "relative flex flex-col rounded-2xl border p-4 text-left transition-all",
                    selected
                      ? "border-[#6BA832] bg-[#F4FBF0] shadow-[0_12px_32px_-20px_rgba(107,168,50,0.55)]"
                      : "border-black/10 bg-white hover:border-black/20",
                  )}
                >
                  {plan.badge ? (
                    <span className="absolute -top-2.5 left-3 rounded-full bg-[#6BA832] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      {plan.badge}
                    </span>
                  ) : null}
                  <span className="text-[12px] font-bold uppercase tracking-wide text-black/55">
                    {plan.name}
                  </span>
                  <span className="mt-2 text-[1.35rem] font-bold text-[#6BA832]">
                    ₹{formatInr(plan.monthly)}
                    <span className="text-[12px] font-medium text-black/45"> / mo</span>
                  </span>
                  <ul className="mt-3 space-y-1.5">
                    {plan.features.slice(0, 3).map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-[12px] text-black/70">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6BA832]" aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
          <NavRow onBack={back} onNext={next} nextLabel="Next: Review & Create →" />
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <h2 className="text-[15px] font-semibold text-black">Step 4 — Create School Tenant</h2>
          <p className="text-[13px] text-black/55">
            Review your school account profile before creating your dedicated isolated workspace.
          </p>
          <div className="grid gap-3 rounded-2xl border border-black/10 bg-[#FAFBFC] p-4 sm:grid-cols-2">
            <Summary label="School Name" value={form.schoolName} />
            <Summary label="School Code" value={form.schoolCode} />
            <Summary label="Location" value={`${form.district}, ${form.state}`} />
            <Summary label="Administrator" value={form.adminName} />
            <Summary label="Login Email" value={form.adminEmail} />
            <Summary label="Selected Package" value={`${form.tier} (14-Day Full Trial)`} accent />
          </div>
          <label className="flex items-start gap-2.5 text-[13px] text-black/70">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-black/20 accent-[#6BA832]"
              checked={form.agreeTerms}
              onChange={(e) => patch("agreeTerms", e.target.checked)}
            />
            <span>
              I agree to Feezo Edu Books{" "}
              <a
                href={BRAND.legal.privacyPath}
                className="font-medium text-[#0F766E] hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Terms of Service & Privacy
              </a>{" "}
              standards.
              {errors.agreeTerms ? (
                <span className="mt-1 block text-[12px] text-red-500">{errors.agreeTerms}</span>
              ) : null}
            </span>
          </label>
          <NavRow
            onBack={back}
            onNext={createAccount}
            nextLabel={submitting ? "Creating…" : "Create My School Account"}
            nextDisabled={submitting}
          />
        </div>
      ) : null}
    </SignupShell>
  );
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      {children}
      {error ? <p className="mt-1 text-[12px] text-red-500">{error}</p> : null}
    </div>
  );
}

function NavRow({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
}: {
  onBack: (() => void) | null;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-[13px] font-semibold text-black transition-colors hover:bg-black/[0.03]"
        >
          ← Back
        </button>
      ) : (
        <Link
          to="/login"
          className="inline-flex h-11 items-center justify-center text-[13px] font-medium text-black/45 hover:text-black"
        >
          Sign in instead
        </Link>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-[#6BA832] px-5 text-[13px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(107,168,50,0.65)] transition-colors hover:bg-[#5a9429] disabled:opacity-60"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function Summary({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-black/40">
        {label}
      </div>
      <div
        className={cn("mt-0.5 text-[14px] font-semibold", accent ? "text-[#6BA832]" : "text-black")}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-black/50">{label}</span>
      <span className={cn("text-right font-semibold", accent ? "text-[#6BA832]" : "text-black")}>
        {value}
      </span>
    </div>
  );
}
