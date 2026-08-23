/** Public marketing copy for feezo.app — English only. */

export const MARKETING = {
  title: "Feezo · School Accounts Simplified",
  description:
    "School accounts simplified — fees, receipts, reports in one place. Start a 14-day trial.",
  hero: {
    brandLine: "Feezo Edu Books",
    headlineGreen: "School Accounts",
    headlineInk: "Simplified",
    support:
      "Fees, receipts, follow-ups, and school accounts in one clear platform — ready in minutes.",
    primaryCta: "Start 14-day trial",
    secondaryCta: "Sign in",
    image: "/marketing/hero-dashboard.jpg",
    imageAlt: "Feezo school accounts dashboard illustration",
  },
  nav: [
    { id: "problems", label: "Why Feezo" },
    { id: "features", label: "Features" },
    { id: "compare", label: "Compare" },
    { id: "pricing", label: "Pricing" },
  ] as const,
  problems: {
    eyebrow: "The daily questions",
    title: "Stop chasing paper. Start seeing the full picture.",
    items: [
      {
        title: "How much is outstanding?",
        body: "Know who is pending, who has paid, and what is due — without digging through registers.",
      },
      {
        title: "Where is the receipt?",
        body: "Issue digital fee receipts and student statements in one click. No lost slips.",
      },
      {
        title: "Where are the accounts?",
        body: "Cash, bank, fees, and expenses live together — one final picture, not four books.",
      },
    ],
  },
  features: {
    eyebrow: "Everything in one place",
    title: "A mini ERP for your school",
    subtitle: "More than accounts — the modules schools actually use every day.",
    items: [
      { title: "Smart Fee Management", hint: "Track dues, collections, and balances" },
      { title: "One-Click Fee Follow-up", hint: "Bulk reminders when fees are pending" },
      { title: "Digital Fee Receipts", hint: "Shareable PDFs parents can keep" },
      { title: "Complete School Accounts", hint: "Income, expense, and cash flow" },
      { title: "Financial Reports", hint: "Clear reports when you need them" },
      { title: "Student Management", hint: "Admissions to fee history" },
      { title: "Staff Management", hint: "People and payroll-ready records" },
      { title: "Vehicle Management", hint: "Transport in the same workspace" },
      { title: "Financial Insights", hint: "See trends, not just totals" },
    ],
  },
  compare: {
    eyebrow: "From manual to digital",
    title: "Your school, upgraded",
    image: "/marketing/manual-to-digital.jpg",
    imageAlt: "Manual registers versus Feezo digital dashboard",
    before: {
      title: "Before Feezo",
      items: [
        "Paper registers",
        "Manual receipts",
        "Individual follow-ups",
        "Difficult reports",
        "Scattered records",
        "Manual calculations",
      ],
    },
    after: {
      title: "With Feezo",
      items: [
        "Digital records",
        "Instant receipts",
        "Bulk WhatsApp follow-up",
        "Smart reports",
        "Centralized accounts",
        "Faster operations",
      ],
    },
  },
  followUp: {
    eyebrow: "Collections that stick",
    title: "One-click follow-up",
    body: "No more individual messages and missed reminders. Select overdue, send bulk WhatsApp, done.",
    steps: ["Overdue", "Bulk WhatsApp", "Send"] as const,
    image: "/marketing/one-click-followup.jpg",
    imageAlt: "Bulk WhatsApp follow-up on mobile",
  },
  pricing: {
    eyebrow: "Simple plans",
    title: "Start with a 14-day trial",
    subtitle: "Every plan includes a full evaluation period. Sign in when your school is ready.",
    trialBadge: "14-day trial on all plans",
    plans: [
      {
        name: "Basic",
        monthly: 899,
        annuallyOffer: 9499,
        highlight: false,
        blurb: "Core school ops, fees, and reporting.",
        features: [
          "Financial module",
          "Student & class management",
          "Staff & vehicle management",
          "Analytical reporting",
          "Manual fee reminders",
        ],
      },
      {
        name: "Premium",
        monthly: 1499,
        annuallyOffer: 16499,
        highlight: true,
        badge: "Most adopted",
        blurb: "Fee collection, extra users, and branches.",
        features: [
          "Everything in Basic",
          "Fee collection",
          "Extra user access",
          "Multiple branches",
        ],
      },
      {
        name: "Enterprise",
        monthly: 2299,
        annuallyOffer: 25499,
        highlight: false,
        blurb: "Full platform — payroll, WhatsApp, automation.",
        features: [
          "Everything in Premium",
          "Staff attendance & payroll",
          "Automatic fee collection",
          "WhatsApp integration",
        ],
      },
    ],
  },
  finalCta: {
    title: "Ready to simplify school accounts?",
    body: "Sign in to start your 14-day trial. No complicated setup — just open Feezo and go.",
    primaryCta: "Start 14-day trial",
    secondaryCta: "Sign in",
  },
} as const;

export function formatInr(n: number) {
  return n.toLocaleString("en-IN");
}
