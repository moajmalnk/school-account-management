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

export const SIGNUP_STEPS = [
  { id: 1, label: "School Info" },
  { id: 2, label: "Administrator" },
  { id: 3, label: "Choose Package" },
  { id: 4, label: "Create Tenant" },
] as const;

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
  country: string;
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
  country: "India",
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
