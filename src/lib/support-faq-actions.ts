/**
 * Deep-link CTAs for Settings → Support auto-chat FAQ intents.
 * Intent keys are produced by feezo-backend `support_faq_intent_meta()`.
 */

export type SupportFaqIntent =
  | "admit_student"
  | "receive_payment"
  | "switch_campus"
  | "financial_year"
  | "downloads_reports"
  | "password_reset"
  | "subscription"
  | "contact_human";

export type SupportFaqNavLink = {
  label: string;
  /** TanStack path */
  to: string;
  search?: Record<string, string | undefined>;
  primary?: boolean;
};

const GUIDE = (id: string) =>
  ({ to: "/tenant/support", search: { guide: id } }) as const;

/** Navigation CTAs shown under each FAQ answer (except password_reset / contact_human special UIs). */
export const SUPPORT_FAQ_NAV: Record<
  Exclude<SupportFaqIntent, "password_reset" | "contact_human">,
  { title: string; links: SupportFaqNavLink[] }
> = {
  admit_student: {
    title: "Open the right screen",
    links: [
      { label: "Admit student", to: "/tenant/students/admit", primary: true },
      { label: "Students", to: "/tenant/students" },
      { label: "Guide", ...GUIDE("admit-student") },
    ],
  },
  receive_payment: {
    title: "Open the right screen",
    links: [
      {
        label: "Receive Payment",
        to: "/tenant/finance",
        search: { tab: "receive" },
        primary: true,
      },
      { label: "Fees Report", to: "/tenant/finance", search: { tab: "fees" } },
      { label: "Guide", ...GUIDE("receive-payment") },
    ],
  },
  switch_campus: {
    title: "Campus & branches",
    links: [
      {
        label: "Branches",
        to: "/tenant/settings",
        search: { tab: "branches" },
        primary: true,
      },
      { label: "Guide", ...GUIDE("switch-campus-year") },
    ],
  },
  financial_year: {
    title: "Financial year",
    links: [
      {
        label: "System · Financial Year",
        to: "/tenant/settings",
        search: { tab: "system" },
        primary: true,
      },
      { label: "Guide", ...GUIDE("academic-year") },
    ],
  },
  downloads_reports: {
    title: "Reports & downloads",
    links: [
      {
        label: "Fees Report",
        to: "/tenant/finance",
        search: { tab: "fees" },
        primary: true,
      },
      { label: "Analytics", to: "/tenant/finance", search: { tab: "analytics" } },
      {
        label: "Download settings",
        to: "/tenant/settings",
        search: { tab: "system" },
      },
    ],
  },
  subscription: {
    title: "Your plan",
    links: [
      { label: "Open Subscription", to: "/tenant/billing", primary: true },
      { label: "Guide", ...GUIDE("subscription") },
    ],
  },
};

export function isSupportFaqIntent(value: unknown): value is SupportFaqIntent {
  return (
    value === "admit_student" ||
    value === "receive_payment" ||
    value === "switch_campus" ||
    value === "financial_year" ||
    value === "downloads_reports" ||
    value === "password_reset" ||
    value === "subscription" ||
    value === "contact_human"
  );
}

export function supportFaqNavForIntent(intent: SupportFaqIntent | null | undefined) {
  if (!intent || intent === "password_reset" || intent === "contact_human") return null;
  return SUPPORT_FAQ_NAV[intent] ?? null;
}
