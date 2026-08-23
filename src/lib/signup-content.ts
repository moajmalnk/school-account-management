import { MARKETING } from "@/lib/marketing-content";

export const SCHOOL_TYPES = [
  "CBSE",
  "ICSE / ISC",
  "State Board",
  "IB / Cambridge",
  "Madrasa / Islamic",
  "Special Education",
  "Other",
] as const;

/** URL segment → wizard step */
export const SIGNUP_STEP_SLUGS = [
  "school",
  "admin",
  "package",
  "review",
  "success",
] as const;

export type SignupStepSlug = (typeof SIGNUP_STEP_SLUGS)[number];

export const SIGNUP_STEPS = [
  { id: 1, slug: "school" as const, label: "School Info", path: "/signup/school" },
  { id: 2, slug: "admin" as const, label: "Administrator", path: "/signup/admin" },
  { id: 3, slug: "package" as const, label: "Choose Package", path: "/signup/package" },
  { id: 4, slug: "review" as const, label: "Create Tenant", path: "/signup/review" },
] as const;

export const SIGNUP_SUCCESS_PATH = "/signup/success";

export function isSignupStepSlug(value: string): value is SignupStepSlug {
  return (SIGNUP_STEP_SLUGS as readonly string[]).includes(value);
}

export function stepNumberFromSlug(slug: string): number {
  if (slug === "success") return 4;
  const found = SIGNUP_STEPS.find((s) => s.slug === slug);
  return found?.id ?? 1;
}

export function slugFromStepNumber(
  step: number,
): Exclude<SignupStepSlug, "success"> {
  const found = SIGNUP_STEPS.find((s) => s.id === step);
  return found?.slug ?? "school";
}

export const SIGNUP_PLANS = MARKETING.pricing.plans.map((p) => ({
  name: p.name as "Basic" | "Premium" | "Enterprise",
  monthly: p.monthly,
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
  schoolCode: string;
  schoolType: string;
  phone: string;
  address: string;
  district: string;
  state: string;
  schoolEmail: string;
  website: string;
  subdomain: string;
  adminName: string;
  adminMobile: string;
  adminEmail: string;
  password: string;
  passwordConfirm: string;
  tier: "Basic" | "Premium" | "Enterprise";
  agreeTerms: boolean;
};

export const EMPTY_SIGNUP: SignupFormState = {
  schoolName: "",
  schoolCode: "",
  schoolType: "",
  phone: "",
  address: "",
  district: "",
  state: "",
  schoolEmail: "",
  website: "",
  subdomain: "",
  adminName: "",
  adminMobile: "",
  adminEmail: "",
  password: "",
  passwordConfirm: "",
  tier: "Premium",
  agreeTerms: false,
};

const DRAFT_KEY = "feezo-signup-draft-v1";

export function loadSignupDraft(): SignupFormState {
  if (typeof window === "undefined") return EMPTY_SIGNUP;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return EMPTY_SIGNUP;
    const parsed = JSON.parse(raw) as Partial<SignupFormState>;
    return { ...EMPTY_SIGNUP, ...parsed, agreeTerms: Boolean(parsed.agreeTerms) };
  } catch {
    return EMPTY_SIGNUP;
  }
}

export function saveSignupDraft(form: SignupFormState) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  } catch {
    // ignore quota
  }
}

export function clearSignupDraft() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

/** Highest step the user may open based on saved draft completeness. */
export function maxAllowedSignupStep(form: SignupFormState): number {
  if (
    !form.schoolName.trim() ||
    !form.schoolCode.trim() ||
    !form.schoolType ||
    !form.phone.trim() ||
    !form.address.trim() ||
    !form.state ||
    !form.district ||
    !form.schoolEmail.trim() ||
    !form.subdomain.trim()
  ) {
    return 1;
  }
  if (
    !form.adminName.trim() ||
    !form.adminMobile.trim() ||
    !form.adminEmail.trim() ||
    form.password.length < 8 ||
    form.passwordConfirm !== form.password
  ) {
    return 2;
  }
  if (!form.tier) return 3;
  return 4;
}
