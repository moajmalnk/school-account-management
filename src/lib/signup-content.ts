import { MARKETING } from "@/lib/marketing-content";
import { composeE164, parsePhone } from "@/lib/phone";

export const SCHOOL_TYPES = [
  "CBSE",
  "ICSE / ISC",
  "State Board",
  "IB / Cambridge",
  "Madrasa / Islamic",
  "Special Education",
  "Other",
] as const;

/** URL segment → wizard step. `package` / `review` are legacy links folded into `admin`. */
export const SIGNUP_STEP_SLUGS = ["school", "admin", "package", "review", "success"] as const;

export type SignupStepSlug = (typeof SIGNUP_STEP_SLUGS)[number];

export const SIGNUP_STEPS = [
  { id: 1, slug: "school" as const, label: "Your school", path: "/signup/school" },
  { id: 2, slug: "admin" as const, label: "Your account", path: "/signup/admin" },
] as const;

export const SIGNUP_LAST_STEP = SIGNUP_STEPS.length;

export const SIGNUP_SUCCESS_PATH = "/signup/success";

export function isSignupStepSlug(value: string): value is SignupStepSlug {
  return (SIGNUP_STEP_SLUGS as readonly string[]).includes(value);
}

export function isLegacySignupSlug(slug: string): boolean {
  return slug === "package" || slug === "review";
}

export function stepNumberFromSlug(slug: string): number {
  if (slug === "success" || isLegacySignupSlug(slug)) return SIGNUP_LAST_STEP;
  const found = SIGNUP_STEPS.find((s) => s.slug === slug);
  return found?.id ?? 1;
}

export function slugFromStepNumber(step: number): Exclude<SignupStepSlug, "success"> {
  const found = SIGNUP_STEPS.find((s) => s.id === step);
  return found?.slug ?? "school";
}

export const SIGNUP_PLANS = MARKETING.pricing.plans.map((p) => ({
  name: p.name as "Basic" | "Premium" | "Enterprise",
  monthlyInr: p.monthlyInr,
  blurb: p.blurb,
  features: [...p.features],
  highlight: p.highlight,
  badge: "badge" in p ? p.badge : undefined,
}));

export function slugifySchoolName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function passwordStrength(pw: string): {
  label: string;
  score: number;
} {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  const labels = ["None", "Weak", "Fair", "Good", "Strong", "Strong"];
  return { label: labels[Math.min(score, 5)] ?? "None", score };
}

export type SignupFormState = {
  schoolName: string;
  schoolType: string;
  pincode: string;
  state: string;
  district: string;
  phone: string;
  subdomain: string;
  /** Optional extras (collapsed by default). */
  address: string;
  schoolCode: string;
  schoolEmail: string;
  website: string;
  /** Organization base currency; empty until the visitor's detected currency is applied. */
  currency: string;
  adminName: string;
  adminEmail: string;
  adminMobile: string;
  /** Held in memory only — never written to storage. */
  password: string;
  tier: "Basic" | "Premium" | "Enterprise";
};

export const EMPTY_SIGNUP: SignupFormState = {
  schoolName: "",
  schoolType: "",
  pincode: "",
  state: "",
  district: "",
  phone: "",
  subdomain: "",
  address: "",
  schoolCode: "",
  schoolEmail: "",
  website: "",
  currency: "",
  adminName: "",
  adminEmail: "",
  adminMobile: "",
  password: "",
  tier: "Premium",
};

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Digits only, keeping a leading +. */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/\D/g, "");
}

export function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

/** Ensure E.164 using the given country (defaults to India for legacy callers). */
export function withIndiaDialCode(raw: string, country = "IN"): string {
  const parsed = parsePhone(raw, country);
  return composeE164(parsed.country, parsed.national) || normalizePhone(raw);
}

const DRAFT_KEY = "feezo-signup-draft-v2";
const LEGACY_DRAFT_KEY = "feezo-signup-draft-v1";

/** In-memory copy so step navigation works even if sessionStorage is blocked. */
let memoryDraft: SignupFormState | null = null;

export function loadSignupDraft(): SignupFormState {
  if (memoryDraft) return memoryDraft;
  if (typeof window === "undefined") return EMPTY_SIGNUP;
  try {
    window.sessionStorage.removeItem(LEGACY_DRAFT_KEY);
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return EMPTY_SIGNUP;
    const parsed = JSON.parse(raw) as Partial<SignupFormState>;
    const merged: SignupFormState = { ...EMPTY_SIGNUP, ...parsed, password: "" };
    memoryDraft = merged;
    return merged;
  } catch {
    return EMPTY_SIGNUP;
  }
}

export function saveSignupDraft(form: SignupFormState) {
  memoryDraft = form;
  if (typeof window === "undefined") return;
  try {
    const { password: _password, ...persistable } = form;
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(persistable));
  } catch {
    // ignore quota / private mode — memory draft still advances the wizard
  }
}

export function clearSignupDraft() {
  memoryDraft = null;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
    window.sessionStorage.removeItem(LEGACY_DRAFT_KEY);
  } catch {
    // ignore
  }
}

/** Highest step the user may open based on saved draft completeness. */
export function maxAllowedSignupStep(form: SignupFormState): number {
  return isSignupStep1Complete(form) ? 2 : 1;
}

export function isSignupStep1Complete(form: SignupFormState): boolean {
  return Boolean(
    form.schoolName.trim() &&
    form.schoolType &&
    form.state &&
    form.district &&
    isValidPhone(form.phone) &&
    form.subdomain.trim().length >= 2 &&
    (!form.schoolEmail.trim() || EMAIL_RE.test(form.schoolEmail.trim())),
  );
}
