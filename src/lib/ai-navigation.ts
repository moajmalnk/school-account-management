import { FINANCE_TABS, isFinanceTab, type FinanceTab } from "@/lib/finance-tabs";

/** Canonical tenant paths Feezo may open. */
export const FEEZO_NAV_PATHS = [
  "/tenant/dashboard",
  "/tenant/ai",
  "/tenant/students",
  "/tenant/students/admit",
  "/tenant/students/edit",
  "/tenant/staff",
  "/tenant/staff/edit",
  "/tenant/finance",
  "/tenant/settings",
  "/tenant/billing",
  "/tenant/notifications",
] as const;

export type FeezoNavPath = (typeof FEEZO_NAV_PATHS)[number];

const SETTINGS_TABS = [
  "school",
  "branches",
  "classes",
  "departments",
  "roles",
  "leave",
  "fees",
  "users",
  "vehicles",
  "transport",
  "system",
  "support",
] as const;

const STUDENT_TABS = ["profile", "academic", "documents", "payments"] as const;
const STAFF_TABS = ["profile", "professional", "attendance", "documents", "payments"] as const;

export type FeezoNormalizedNav = {
  to: FeezoNavPath;
  search: Record<string, string>;
  label: string;
};

/** Shortcut keys and human aliases → path + optional search. */
const ALIASES: Record<string, { to: FeezoNavPath; search?: Record<string, string>; label?: string }> =
  {
    home: { to: "/tenant/dashboard", label: "Dashboard" },
    dashboard: { to: "/tenant/dashboard", label: "Dashboard" },
    ai: { to: "/tenant/ai", label: "Feezo AI" },
    feezo: { to: "/tenant/ai", label: "Feezo AI" },
    assistant: { to: "/tenant/ai", label: "Feezo AI" },
    students: { to: "/tenant/students", label: "Students" },
    "students.list": { to: "/tenant/students", label: "Students" },
    "students.admit": { to: "/tenant/students/admit", label: "Admit student" },
    "students.edit": { to: "/tenant/students/edit", label: "Edit student" },
    admit: { to: "/tenant/students/admit", label: "Admit student" },
    staff: { to: "/tenant/staff", label: "Staff" },
    "staff.list": { to: "/tenant/staff", label: "Staff" },
    "staff.edit": { to: "/tenant/staff/edit", label: "Edit staff" },
    finance: { to: "/tenant/finance", label: "Finance" },
    settings: { to: "/tenant/settings", label: "Settings" },
    billing: { to: "/tenant/billing", label: "Billing" },
    notifications: { to: "/tenant/notifications", label: "Notifications" },

    receive: { to: "/tenant/finance", search: { tab: "receive" }, label: "Receive payment" },
    "receive.payment": { to: "/tenant/finance", search: { tab: "receive" }, label: "Receive payment" },
    make: { to: "/tenant/finance", search: { tab: "make" }, label: "Make payment" },
    "make.payment": { to: "/tenant/finance", search: { tab: "make" }, label: "Make payment" },
    transfer: { to: "/tenant/finance", search: { tab: "transfer" }, label: "Fund transfer" },
    transfers: { to: "/tenant/finance", search: { tab: "transfers" }, label: "Transfer reports" },
    analytics: { to: "/tenant/finance", search: { tab: "analytics" }, label: "Analytics" },
    ledger: { to: "/tenant/finance", search: { tab: "ledger" }, label: "Ledger" },
    journals: { to: "/tenant/finance", search: { tab: "journals" }, label: "Journals" },
    trial: { to: "/tenant/finance", search: { tab: "trial" }, label: "Trial balance" },
    pl: { to: "/tenant/finance", search: { tab: "pl" }, label: "Profit & loss" },
    "profit.loss": { to: "/tenant/finance", search: { tab: "pl" }, label: "Profit & loss" },
    balance: { to: "/tenant/finance", search: { tab: "balance" }, label: "Balance sheet" },
    fees: { to: "/tenant/finance", search: { tab: "fees" }, label: "Fees report" },
    overdue: { to: "/tenant/finance", search: { tab: "fees" }, label: "Fees report" },
    concession: { to: "/tenant/finance", search: { tab: "concession" }, label: "Concession report" },
    salary: { to: "/tenant/finance", search: { tab: "salary" }, label: "Salary report" },
    daybook: { to: "/tenant/finance", search: { tab: "daybook" }, label: "Day book" },
    reconciliation: {
      to: "/tenant/finance",
      search: { tab: "reconciliation" },
      label: "Bank reconciliation",
    },
    recon: {
      to: "/tenant/finance",
      search: { tab: "reconciliation" },
      label: "Bank reconciliation",
    },
  };

const FINANCE_TAB_ALIASES: Record<string, FinanceTab> = {
  receive: "receive",
  "receive-payment": "receive",
  "receive_payment": "receive",
  make: "make",
  "make-payment": "make",
  "make_payment": "make",
  transfer: "transfer",
  "fund-transfer": "transfer",
  transfers: "transfers",
  "transfer-reports": "transfers",
  analytics: "analytics",
  ledger: "ledger",
  journals: "journals",
  journal: "journals",
  trial: "trial",
  "trial-balance": "trial",
  pl: "pl",
  "p&l": "pl",
  "profit-loss": "pl",
  "profit_and_loss": "pl",
  balance: "balance",
  "balance-sheet": "balance",
  fees: "fees",
  "fees-report": "fees",
  overdue: "fees",
  concession: "concession",
  salary: "salary",
  "salary-report": "salary",
  daybook: "daybook",
  "day-book": "daybook",
  reconciliation: "reconciliation",
  recon: "reconciliation",
  "bank-reconciliation": "reconciliation",
};

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t || undefined;
}

function stringifySearch(raw: Record<string, unknown> | undefined): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) out[k] = s;
  }
  return out;
}

function parsePathAndQuery(input: string): { path: string; query: Record<string, string> } {
  const trimmed = input.trim();
  const qIdx = trimmed.indexOf("?");
  if (qIdx < 0) return { path: trimmed, query: {} };
  const path = trimmed.slice(0, qIdx) || "/";
  const query: Record<string, string> = {};
  const qs = trimmed.slice(qIdx + 1);
  for (const part of qs.split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    const key = decodeURIComponent(eq < 0 ? part : part.slice(0, eq)).trim();
    const val = decodeURIComponent(eq < 0 ? "" : part.slice(eq + 1)).trim();
    if (key && val) query[key] = val;
  }
  return { path, query };
}

function isAllowedPath(path: string): path is FeezoNavPath {
  return (FEEZO_NAV_PATHS as readonly string[]).includes(path);
}

function normalizeFinanceTab(raw: string | undefined): FinanceTab | undefined {
  if (!raw) return undefined;
  const key = raw.trim().toLowerCase().replace(/\s+/g, "-");
  if (isFinanceTab(key)) return key;
  return FINANCE_TAB_ALIASES[key] ?? FINANCE_TAB_ALIASES[key.replace(/_/g, "-")];
}

function sanitizeSearch(path: FeezoNavPath, search: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};

  if (path === "/tenant/finance") {
    const tab = normalizeFinanceTab(search.tab);
    if (tab) out.tab = tab;
    for (const key of ["staffId", "studentId", "paymentId", "amount", "month", "periods"] as const) {
      if (search[key]) out[key] = search[key]!;
    }
    const feeKind = search.feeKind?.toLowerCase();
    if (feeKind === "tuition" || feeKind === "vehicle") out.feeKind = feeKind;
    return out;
  }

  if (path === "/tenant/students" || path === "/tenant/students/edit") {
    if (search.id) out.id = search.id;
    if (path === "/tenant/students") {
      const tab = search.tab?.toLowerCase();
      if (tab && (STUDENT_TABS as readonly string[]).includes(tab)) out.tab = tab;
    }
    return out;
  }

  if (path === "/tenant/staff" || path === "/tenant/staff/edit") {
    if (search.id) out.id = search.id;
    if (path === "/tenant/staff") {
      const tab = search.tab?.toLowerCase();
      if (tab && (STAFF_TABS as readonly string[]).includes(tab)) out.tab = tab;
    }
    return out;
  }

  if (path === "/tenant/settings") {
    const tab = search.tab?.toLowerCase();
    if (tab && (SETTINGS_TABS as readonly string[]).includes(tab)) out.tab = tab;
    if (search.chat) out.chat = search.chat;
    return out;
  }

  return out;
}

function defaultLabel(path: FeezoNavPath, search: Record<string, string>): string {
  if (path === "/tenant/finance" && search.tab) {
    const labels: Record<string, string> = {
      receive: "Receive payment",
      make: "Make payment",
      transfer: "Fund transfer",
      transfers: "Transfer reports",
      analytics: "Analytics",
      ledger: "Ledger",
      journals: "Journals",
      trial: "Trial balance",
      pl: "Profit & loss",
      balance: "Balance sheet",
      fees: "Fees report",
      concession: "Concession report",
      salary: "Salary report",
      daybook: "Day book",
      reconciliation: "Bank reconciliation",
    };
    return labels[search.tab] ?? "Finance";
  }
  if (path === "/tenant/students" && search.id) return "Student profile";
  if (path === "/tenant/staff" && search.id) return "Staff profile";
  const map: Partial<Record<FeezoNavPath, string>> = {
    "/tenant/dashboard": "Dashboard",
    "/tenant/ai": "Feezo AI",
    "/tenant/students": "Students",
    "/tenant/students/admit": "Admit student",
    "/tenant/students/edit": "Edit student",
    "/tenant/staff": "Staff",
    "/tenant/staff/edit": "Edit staff",
    "/tenant/finance": "Finance",
    "/tenant/settings": "Settings",
    "/tenant/billing": "Billing",
    "/tenant/notifications": "Notifications",
  };
  return map[path] ?? "Open";
}

/**
 * Normalize AI / model navigation into a safe TanStack Router target.
 * Accepts full paths, query-in-path, and shortcut aliases (e.g. "fees", "finance.fees").
 */
export function normalizeFeezoNavigation(input: {
  to?: string;
  search?: Record<string, string | undefined | null> | Record<string, unknown>;
  label?: string;
}): FeezoNormalizedNav | null {
  const rawTo = cleanString(input.to);
  if (!rawTo) return null;

  const aliasKey = rawTo
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/^tenant\//, "")
    .replace(/\s+/g, ".")
    .replace(/_/g, ".")
    .replace(/-/g, ".");

  const alias =
    ALIASES[rawTo.toLowerCase()] ??
    ALIASES[aliasKey] ??
    ALIASES[`finance.${aliasKey}`] ??
    (aliasKey.startsWith("finance.") ? ALIASES[aliasKey.slice("finance.".length)] : undefined);

  let path: string;
  let query: Record<string, string>;

  if (alias) {
    path = alias.to;
    query = { ...(alias.search ?? {}), ...stringifySearch(input.search as Record<string, unknown>) };
  } else {
    const parsed = parsePathAndQuery(rawTo);
    path = parsed.path.replace(/\/+$/, "") || parsed.path;
    // Legacy underscore file-route style → public path
    path = path
      .replace("/tenant/students_/admit", "/tenant/students/admit")
      .replace("/tenant/students_/edit", "/tenant/students/edit")
      .replace("/tenant/staff_/edit", "/tenant/staff/edit");
    query = { ...parsed.query, ...stringifySearch(input.search as Record<string, unknown>) };
  }

  if (!isAllowedPath(path)) {
    // Map bare finance tab as path mistake: to="fees"
    const tab = normalizeFinanceTab(path.replace(/^\//, ""));
    if (tab) {
      path = "/tenant/finance";
      query = { ...query, tab };
    } else {
      return null;
    }
  }

  if (!isAllowedPath(path)) return null;

  const search = sanitizeSearch(path, query);
  const explicitLabel = cleanString(input.label);
  const label =
    explicitLabel ||
    (search.id || search.studentId || search.staffId
      ? defaultLabel(path, search)
      : alias?.label) ||
    defaultLabel(path, search);

  return { to: path, search, label };
}

/** Compact catalog for prompts / docs. */
export function feezoNavigationCatalogText(): string {
  const financeTabs = FINANCE_TABS.join(", ");
  return [
    "Navigation URLs (use navigate tool):",
    "- /tenant/dashboard",
    "- /tenant/ai (assistant panel; refresh-safe)",
    "- /tenant/students?id=STU-…&tab=profile|academic|documents|payments",
    "- /tenant/students/admit",
    "- /tenant/students/edit?id=STU-…",
    "- /tenant/staff?id=STF-…&tab=profile|professional|attendance|documents|payments",
    "- /tenant/staff/edit?id=STF-…",
    `- /tenant/finance?tab=<${financeTabs}>`,
    "  Optional finance search: studentId, staffId, paymentId, amount, month (YYYY-MM), feeKind (tuition|vehicle), periods",
    "- /tenant/settings?tab=school|branches|classes|departments|roles|leave|fees|users|vehicles|transport|system|support",
    "- /tenant/billing | /tenant/notifications",
    "Shortcuts also accepted: fees, overdue, receive, make, transfer, transfers, ledger, journals, trial, pl, balance, concession, salary, daybook, recon",
  ].join("\n");
}
