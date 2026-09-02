import { BRAND } from "@/lib/brand";

export const LEGAL_LAST_UPDATED = "2 September 2026";

export const LEGAL_PAGES = [
  { id: "terms", label: "Terms of Use", path: BRAND.legal.termsPath },
  { id: "privacy", label: "Privacy Policy", path: BRAND.legal.privacyPath },
  { id: "refund", label: "Refund Policy", path: BRAND.legal.refundPolicyPath },
  { id: "deletion", label: "Data deletion", path: BRAND.legal.dataDeletionPath },
] as const;

export type LegalPageId = (typeof LEGAL_PAGES)[number]["id"];
