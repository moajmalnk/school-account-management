import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Pencil,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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
import { isIndianPincode, lookupIndianPincode, type PincodeMatch } from "@/lib/geo/pincode";
import { CURRENCIES, normalizeCurrency } from "@/lib/locale/currencies";
import { useLocale } from "@/lib/locale/LocaleProvider";
import {
  EMAIL_RE,
  SCHOOL_TYPES,
  SIGNUP_PLANS,
  clearSignupDraft,
  isValidPhone,
  loadSignupDraft,
  passwordStrength,
  saveSignupDraft,
  slugifySchoolName,
  stepNumberFromSlug,
  withIndiaDialCode,
  type SignupFormState,
  type SignupStepSlug,
} from "@/lib/signup-content";
import { cn } from "@/lib/utils";

type Errors = Partial<Record<keyof SignupFormState, string>>;

function goToSignupStep(
  navigate: ReturnType<typeof useNavigate>,
  step: SignupStepSlug,
  replace = false,
) {
  void navigate({ to: "/signup/$step", params: { step }, replace } as never);
}

function validateSchool(form: SignupFormState): Errors {
  const e: Errors = {};
  if (!form.schoolName.trim()) e.schoolName = "Enter your school's name";
  if (!form.schoolType) e.schoolType = "Pick the closest match";
  if (form.pincode && !isIndianPincode(form.pincode)) e.pincode = "Enter a 6-digit PIN code";
  if (!form.state) e.state = "Select a state";
  if (!form.district) e.district = "Select a district";
  if (!isValidPhone(form.phone)) e.phone = "Enter a valid phone number";
  if (form.subdomain.trim().length < 2) e.subdomain = "At least 2 characters";
  if (form.schoolEmail.trim() && !EMAIL_RE.test(form.schoolEmail.trim())) {
    e.schoolEmail = "Enter a valid email";
  }
  return e;
}

function validateAccount(form: SignupFormState): Errors {
  const e: Errors = {};
  if (!form.adminName.trim()) e.adminName = "Enter your full name";
  if (!EMAIL_RE.test(form.adminEmail.trim())) e.adminEmail = "Enter a valid email";
  if (!isValidPhone(form.adminMobile)) e.adminMobile = "Enter a valid mobile number";
  if (form.password.length < 8) e.password = "Use at least 8 characters";
  return e;
}

function focusFirstError(errors: Errors, order: (keyof SignupFormState)[]) {
  const first = order.find((k) => errors[k]);
  if (!first) return;
  window.requestAnimationFrame(() => {
    const el =
      document.getElementById(first) ?? document.querySelector(`[data-signup-field="${first}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLElement) el.focus({ preventScroll: true });
  });
}

const SCHOOL_ORDER: (keyof SignupFormState)[] = [
  "schoolName",
  "schoolType",
  "pincode",
  "state",
  "district",
  "phone",
  "subdomain",
  "schoolEmail",
];
const ACCOUNT_ORDER: (keyof SignupFormState)[] = [
  "adminName",
  "adminEmail",
  "adminMobile",
  "password",
];

export function SignupWizard({ stepSlug }: { stepSlug: string }) {
  const navigate = useNavigate();
  const { acceptLoginResponse, session, hydrated } = useAuth();
  const step = stepNumberFromSlug(stepSlug);
  const isSuccess = stepSlug === "success";
  const [form, setForm] = useState<SignupFormState>(() => loadSignupDraft());
  const { formatMarketingFromInr, detected, countryLabel } = useLocale();
  const orgCurrency = normalizeCurrency(form.currency || detected?.currency, "INR");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    tenantName: string;
    tier: string;
    redirect: string;
  } | null>(null);

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
        if (!prev.subdomain || prev.subdomain === slugifySchoolName(prev.schoolName)) {
          next.subdomain = slugifySchoolName(value);
        }
      }
      if (key === "state" && value !== prev.state) next.district = "";
      return next;
    });
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const goAccount = (event?: FormEvent) => {
    event?.preventDefault();
    const e = validateSchool(form);
    setErrors(e);
    if (Object.keys(e).length) {
      focusFirstError(e, SCHOOL_ORDER);
      return;
    }
    const normalized = {
      ...form,
      phone: withIndiaDialCode(form.phone),
      adminMobile: form.adminMobile || withIndiaDialCode(form.phone),
    };
    setForm(normalized);
    saveSignupDraft(normalized);
    goToSignupStep(navigate, "admin");
  };

  const createAccount = async (event?: FormEvent) => {
    event?.preventDefault();
    if (submitting) return;
    const e = validateAccount(form);
    setErrors(e);
    if (Object.keys(e).length) {
      focusFirstError(e, ACCOUNT_ORDER);
      return;
    }
    setSubmitting(true);
    const adminEmail = form.adminEmail.trim().toLowerCase();
    const addressLine =
      [form.address.trim(), form.pincode ? `PIN ${form.pincode}` : ""].filter(Boolean).join(", ") ||
      form.district;
    try {
      const data = await apiRegisterTrial({
        name: form.schoolName.trim(),
        subdomain: form.subdomain.trim(),
        schoolType: form.schoolType,
        phone: withIndiaDialCode(form.phone),
        address: addressLine,
        district: form.district,
        state: form.state,
        country: detected?.localeLabel || countryLabel || "India",
        currency: orgCurrency,
        affiliationNo: form.schoolCode.trim(),
        website: form.website.trim() || undefined,
        schoolEmail: (form.schoolEmail.trim() || adminEmail).toLowerCase(),
        adminName: form.adminName.trim(),
        adminMobile: withIndiaDialCode(form.adminMobile),
        adminEmail,
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
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not create your school. Please try again.";
      if (err instanceof ApiError && err.status === 409 && /email/i.test(msg)) {
        setErrors({ adminEmail: "This email already has a Feezo account." });
        focusFirstError({ adminEmail: "x" }, ["adminEmail"]);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess || success) {
    return <SuccessScreen info={success} fallbackName={form.schoolName} />;
  }

  return (
    <SignupShell
      step={step}
      title={step === 1 ? "Start your free trial" : "Create your admin account"}
      subtitle={
        step === 1
          ? "Two quick steps · about a minute · no card required."
          : `Almost done — this is how you'll sign in to ${form.schoolName || "your school"}.`
      }
    >
      {step === 1 ? (
        <SchoolStep
          form={form}
          errors={errors}
          patch={patch}
          orgCurrency={orgCurrency}
          onSubmit={goAccount}
        />
      ) : (
        <AccountStep
          form={form}
          errors={errors}
          patch={patch}
          submitting={submitting}
          formatPrice={formatMarketingFromInr}
          onBack={() => goToSignupStep(navigate, "school")}
          onSubmit={createAccount}
        />
      )}
    </SignupShell>
  );
}

type StepProps = {
  form: SignupFormState;
  errors: Errors;
  patch: <K extends keyof SignupFormState>(key: K, value: SignupFormState[K]) => void;
};

function SchoolStep({
  form,
  errors,
  patch,
  orgCurrency,
  onSubmit,
}: StepProps & { orgCurrency: string; onSubmit: (e?: FormEvent) => void }) {
  const districts = useMemo(() => districtsForState(form.state), [form.state]);
  const [editSlug, setEditSlug] = useState(false);
  const [showMore, setShowMore] = useState(
    Boolean(form.address || form.schoolCode || form.schoolEmail || form.website),
  );
  const [pin, setPin] = useState<{
    status: "idle" | "loading" | "found" | "missing";
    match?: PincodeMatch;
  }>({ status: "idle" });
  const lastPin = useRef("");

  useEffect(() => {
    const code = form.pincode;
    if (!isIndianPincode(code)) {
      lastPin.current = "";
      setPin({ status: "idle" });
      return;
    }
    if (code === lastPin.current) return;
    lastPin.current = code;
    const ctrl = new AbortController();
    setPin({ status: "loading" });
    void lookupIndianPincode(code, ctrl.signal).then((match) => {
      if (ctrl.signal.aborted) return;
      if (!match) {
        setPin({ status: "missing" });
        return;
      }
      setPin({ status: "found", match });
      patch("state", match.state);
      if (match.district) patch("district", match.district);
    });
    return () => ctrl.abort();
    // patch is stable in behaviour; re-running on its identity would refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pincode]);

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate autoComplete="on">
      <Field id="schoolName" label="School name" required error={errors.schoolName}>
        <input
          id="schoolName"
          name="organization"
          autoComplete="organization"
          autoFocus
          enterKeyHint="next"
          className={fieldClass}
          placeholder="e.g. St. Xavier High School"
          value={form.schoolName}
          onChange={(e) => patch("schoolName", e.target.value)}
        />
        <div className="mt-1.5 flex min-h-[20px] items-center gap-1.5 text-[12px] text-black/50">
          {editSlug ? (
            <div className="flex w-full items-center gap-2">
              <input
                id="subdomain"
                aria-label="Workspace URL"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                className={cn(fieldClass, "h-9 text-[13px]")}
                value={form.subdomain}
                onChange={(e) =>
                  patch("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                onBlur={() => form.subdomain.length >= 2 && setEditSlug(false)}
              />
              <span className="shrink-0">.feezo.app</span>
            </div>
          ) : form.subdomain ? (
            <>
              <span>Workspace:</span>
              <span className="font-semibold text-[#0F766E]">{form.subdomain}.feezo.app</span>
              <button
                type="button"
                onClick={() => setEditSlug(true)}
                className="inline-flex items-center gap-1 rounded px-1 font-medium text-black/45 hover:text-black"
              >
                <Pencil className="h-3 w-3" aria-hidden />
                Edit
              </button>
            </>
          ) : (
            <span>Your workspace address is created from the school name.</span>
          )}
        </div>
        {errors.subdomain ? (
          <p className="mt-1 text-[12px] text-red-500">Workspace URL: {errors.subdomain}</p>
        ) : null}
      </Field>

      <fieldset>
        <FieldLabel required>Board / school type</FieldLabel>
        <div
          role="radiogroup"
          aria-label="School type"
          data-signup-field="schoolType"
          tabIndex={-1}
          className="grid grid-cols-2 gap-2 outline-none sm:grid-cols-4"
        >
          {SCHOOL_TYPES.map((t) => {
            const on = form.schoolType === t;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => patch("schoolType", t)}
                className={cn(
                  "flex h-10 items-center justify-center gap-1.5 rounded-xl border px-2 text-[13px] font-medium transition-colors",
                  on
                    ? "border-[#6BA832] bg-[#F4FBF0] text-black"
                    : "border-black/10 bg-white text-black/70 hover:border-black/25",
                )}
              >
                {on ? <Check className="h-3.5 w-3.5 text-[#6BA832]" aria-hidden /> : null}
                <span className="truncate">{t}</span>
              </button>
            );
          })}
        </div>
        {errors.schoolType ? (
          <p className="mt-1 text-[12px] text-red-500">{errors.schoolType}</p>
        ) : null}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Field id="pincode" label="PIN code" error={errors.pincode}>
          <div className="relative">
            <input
              id="pincode"
              name="postal-code"
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={6}
              enterKeyHint="next"
              className={cn(fieldClass, "pr-9")}
              placeholder="683101"
              value={form.pincode}
              onChange={(e) => patch("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              {pin.status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin text-black/35" aria-hidden />
              ) : pin.status === "found" ? (
                <Check className="h-4 w-4 text-[#6BA832]" aria-hidden />
              ) : (
                <MapPin className="h-4 w-4 text-black/25" aria-hidden />
              )}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-black/45" aria-live="polite">
            {pin.status === "found" && pin.match
              ? `${pin.match.locality ? `${pin.match.locality} · ` : ""}filled state & district`
              : pin.status === "missing"
                ? "PIN not found — choose below"
                : "Fills state & district"}
          </p>
        </Field>
        <Field id="state" label="State" required error={errors.state}>
          <Select value={form.state} onValueChange={(v) => v && patch("state", v)}>
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
            onValueChange={(v) => v && patch("district", v)}
            disabled={!form.state}
          >
            <SelectTrigger
              id="district"
              data-signup-field="district"
              className={signupSelectTriggerClass}
            >
              <SelectValue placeholder={form.state ? "Select district" : "State first"} />
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

      <Field id="phone" label="School phone" required error={errors.phone}>
        <input
          id="phone"
          name="tel"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          enterKeyHint="next"
          className={fieldClass}
          placeholder="98765 43210"
          value={form.phone}
          onChange={(e) => patch("phone", e.target.value)}
          onBlur={() => form.phone && patch("phone", withIndiaDialCode(form.phone))}
        />
      </Field>

      <div className="rounded-2xl border border-black/[0.07] bg-[#FAFBFC]">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px] font-semibold text-black/75"
        >
          <span>
            More details <span className="font-normal text-black/45">(optional · add later)</span>
          </span>
          <ChevronDown
            className={cn("h-4 w-4 text-black/40 transition-transform", showMore && "rotate-180")}
            aria-hidden
          />
        </button>
        {showMore ? (
          <div className="grid gap-4 border-t border-black/[0.06] px-4 pb-4 pt-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field id="address" label="Street address">
                <input
                  id="address"
                  name="street-address"
                  autoComplete="street-address"
                  className={fieldClass}
                  placeholder="Campus address, street, landmark"
                  value={form.address}
                  onChange={(e) => patch("address", e.target.value)}
                />
              </Field>
            </div>
            <Field id="schoolCode" label="Affiliation / school code">
              <input
                id="schoolCode"
                autoComplete="off"
                className={fieldClass}
                placeholder="e.g. 930512"
                value={form.schoolCode}
                onChange={(e) => patch("schoolCode", e.target.value)}
              />
            </Field>
            <Field id="schoolEmail" label="Office email" error={errors.schoolEmail}>
              <input
                id="schoolEmail"
                type="email"
                autoComplete="off"
                className={fieldClass}
                placeholder="Defaults to your login email"
                value={form.schoolEmail}
                onChange={(e) => patch("schoolEmail", e.target.value)}
              />
            </Field>
            <Field id="website" label="Website">
              <input
                id="website"
                type="url"
                name="url"
                autoComplete="url"
                className={fieldClass}
                placeholder="https://stxavier.edu"
                value={form.website}
                onChange={(e) => patch("website", e.target.value)}
              />
            </Field>
            <Field id="currency" label="Base currency">
              <Select value={orgCurrency} onValueChange={(v) => patch("currency", v)}>
                <SelectTrigger id="currency" className={signupSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={signupSelectContentClass}>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code} className={signupSelectItemClass}>
                      {c.code} · {c.symbol} — {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/login"
          className="inline-flex h-11 items-center justify-center text-[13px] font-medium text-black/45 hover:text-black"
        >
          Already on Feezo? Sign in
        </Link>
        <PrimaryButton>
          Continue
          <ArrowRight className="h-4 w-4" aria-hidden />
        </PrimaryButton>
      </div>
    </form>
  );
}

function AccountStep({
  form,
  errors,
  patch,
  submitting,
  formatPrice,
  onBack,
  onSubmit,
}: StepProps & {
  submitting: boolean;
  formatPrice: (inr: number) => string;
  onBack: () => void;
  onSubmit: (e?: FormEvent) => void;
}) {
  const [showPw, setShowPw] = useState(false);
  const strength = passwordStrength(form.password);
  const strengthPct = Math.min(100, (strength.score / 5) * 100);

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate autoComplete="on">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="adminName" label="Your full name" required error={errors.adminName}>
          <input
            id="adminName"
            name="name"
            autoComplete="name"
            autoFocus
            enterKeyHint="next"
            className={fieldClass}
            placeholder="e.g. Rajesh Sharma"
            value={form.adminName}
            onChange={(e) => patch("adminName", e.target.value)}
          />
        </Field>
        <Field id="adminMobile" label="Mobile number" required error={errors.adminMobile}>
          <input
            id="adminMobile"
            name="mobile"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            enterKeyHint="next"
            className={fieldClass}
            placeholder="98450 12345"
            value={form.adminMobile}
            onChange={(e) => patch("adminMobile", e.target.value)}
            onBlur={() =>
              form.adminMobile && patch("adminMobile", withIndiaDialCode(form.adminMobile))
            }
          />
        </Field>
      </div>

      <Field id="adminEmail" label="Work email (your login)" required error={errors.adminEmail}>
        <input
          id="adminEmail"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="next"
          className={fieldClass}
          placeholder="you@school.edu"
          value={form.adminEmail}
          onChange={(e) => patch("adminEmail", e.target.value)}
        />
        {errors.adminEmail?.includes("already") ? (
          <Link
            to="/login"
            className="mt-1 inline-block text-[12px] font-semibold text-[#0F766E] hover:underline"
          >
            Sign in instead →
          </Link>
        ) : null}
      </Field>

      <Field id="password" label="Password" required error={errors.password}>
        <div className="relative">
          <input
            id="password"
            name="new-password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            enterKeyHint="done"
            className={cn(fieldClass, "pr-11")}
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(e) => patch("password", e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/70"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                strength.score <= 1
                  ? "bg-red-400"
                  : strength.score <= 2
                    ? "bg-amber-400"
                    : "bg-[#6BA832]",
              )}
              style={{ width: `${form.password ? Math.max(12, strengthPct) : 0}%` }}
            />
          </div>
          <span className="w-12 text-right text-[11px] text-black/45">
            {form.password ? strength.label : ""}
          </span>
        </div>
      </Field>

      <fieldset>
        <FieldLabel>Plan after your 14-day trial</FieldLabel>
        <div role="radiogroup" aria-label="Plan" className="grid grid-cols-3 gap-2">
          {SIGNUP_PLANS.map((plan) => {
            const on = form.tier === plan.name;
            return (
              <button
                key={plan.name}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => patch("tier", plan.name)}
                className={cn(
                  "relative flex flex-col items-start rounded-xl border px-3 py-2.5 text-left transition-colors",
                  on
                    ? "border-[#6BA832] bg-[#F4FBF0]"
                    : "border-black/10 bg-white hover:border-black/25",
                )}
              >
                {plan.badge ? (
                  <span className="absolute -top-2 right-2 rounded-full bg-[#6BA832] px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white">
                    {plan.badge}
                  </span>
                ) : null}
                <span className="text-[12px] font-bold text-black/75">{plan.name}</span>
                <span className="mt-0.5 text-[13px] font-semibold text-[#6BA832]">
                  {formatPrice(plan.monthlyInr)}
                  <span className="text-[11px] font-medium text-black/40">/mo</span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-black/45">
          Every plan starts with full access for 14 days. No card needed — change anytime.
        </p>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white px-4 text-[13px] font-semibold text-black transition-colors hover:bg-black/[0.03]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
        <PrimaryButton disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Creating your workspace…
            </>
          ) : (
            <>
              Create my school
              <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </PrimaryButton>
      </div>

      <p className="text-center text-[11.5px] leading-relaxed text-black/45 sm:text-right">
        By creating an account you agree to the{" "}
        <a href={BRAND.legal.termsPath} target="_blank" rel="noreferrer" className="underline">
          Terms
        </a>
        ,{" "}
        <a href={BRAND.legal.privacyPath} target="_blank" rel="noreferrer" className="underline">
          Privacy Policy
        </a>{" "}
        and{" "}
        <a
          href={BRAND.legal.refundPolicyPath}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Refund Policy
        </a>
        .
      </p>
    </form>
  );
}

function SuccessScreen({
  info,
  fallbackName,
}: {
  info: { tenantName: string; tier: string; redirect: string } | null;
  fallbackName: string;
}) {
  const navigate = useNavigate();
  const data = info ?? {
    tenantName: fallbackName || "Your school",
    tier: "Premium",
    redirect: "/tenant/dashboard",
  };
  return (
    <div className="min-h-dvh bg-[#F4F6F9] px-3 py-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="rounded-[28px] border border-white/80 bg-white px-6 py-8 text-center shadow-[0_24px_60px_-40px_rgba(0,0,0,0.35)] sm:px-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#F4FBF0]">
            <Check className="h-7 w-7 text-[#6BA832]" aria-hidden />
          </div>
          <h1 className="mt-4 text-[1.5rem] font-semibold tracking-tight text-black">
            {data.tenantName} is ready
          </h1>
          <p className="mt-1.5 text-[14px] text-black/55">
            Your workspace is live with full access for 14 days.
          </p>
          <div className="mt-6 space-y-2 rounded-2xl bg-[#F4FBF0] px-4 py-4 text-left text-[13px]">
            <Row label="Workspace" value={data.tenantName} />
            <Row label="Your role" value="School administrator" />
            <Row label="Trial" value={`${data.tier} · 14 days, full access`} accent />
          </div>
          <button
            type="button"
            autoFocus
            onClick={() => navigate({ to: data.redirect as "/tenant/dashboard" })}
            className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#6BA832] text-[14px] font-semibold text-white shadow-[0_12px_28px_-14px_rgba(107,168,50,0.7)] transition-colors hover:bg-[#5a9429]"
          >
            Open my dashboard
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

function PrimaryButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#6BA832] px-6 text-[14px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(107,168,50,0.65)] transition-colors hover:bg-[#5a9429] disabled:opacity-60"
    >
      {children}
    </button>
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
      {error ? (
        <p className="mt-1 text-[12px] text-red-500" role="alert">
          {error}
        </p>
      ) : null}
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
