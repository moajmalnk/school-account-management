/** Tenant workspace permission keys and helpers (client-demo ACL). */

export const PERMISSION_KEYS = [
  "dashboard",
  "students",
  "attendance",
  "staff",
  "parents",
  "academics",
  "support",
  "finance.overview",
  "finance.receive",
  "finance.make",
  "finance.transfer",
  "finance.fees_report",
  "finance.concession",
  "finance.salary",
  "finance.daybook",
  "finance.analytics",
  "finance.ledger",
  "finance.journals",
  "finance.trial",
  "finance.pl",
  "finance.balance",
  "finance.reconciliation",
  "finance.cashflow",
  "finance.vehicle",
  "finance.aging",
  "finance.heads",
  "settings",
  "settings.branches",
  "settings.classes",
  "settings.leave",
  "settings.fees",
  "settings.transport",
  "settings.users",
  "settings.system",
  "settings.subscription",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type PermissionSet = PermissionKey[] | ["*"];

export const FINANCE_PERMISSION_KEYS = PERMISSION_KEYS.filter((k) =>
  k.startsWith("finance."),
) as PermissionKey[];

/** Older grants that still unlock a newer permission key. */
const PERMISSION_FALLBACKS: Partial<Record<PermissionKey, readonly PermissionKey[]>> = {
  attendance: ["students"],
  "finance.transfer": ["finance.ledger"],
  "finance.journals": ["finance.ledger"],
  "finance.trial": ["finance.ledger"],
  "finance.concession": ["finance.fees_report"],
  "finance.cashflow": ["finance.pl"],
  "finance.vehicle": ["finance.fees_report"],
  "finance.aging": ["finance.fees_report"],
  "finance.heads": ["finance.fees_report"],
  "settings.branches": ["settings"],
  "settings.classes": ["settings"],
  "settings.leave": ["settings"],
  "settings.transport": ["settings"],
  "settings.system": ["settings"],
  "settings.subscription": ["settings"],
};

export const PERMISSION_GROUPS: {
  id: string;
  label: string;
  description: string;
  keys: PermissionKey[];
}[] = [
  {
    id: "workspace",
    label: "Workspace",
    description: "Primary school modules",
    keys: [
      "dashboard",
      "students",
      "attendance",
      "staff",
      "parents",
      "academics",
      "support",
    ],
  },
  {
    id: "finance",
    label: "Finance",
    description: "Payments, books & reports",
    keys: [...FINANCE_PERMISSION_KEYS],
  },
  {
    id: "administration",
    label: "Administration",
    description: "Settings tabs and team access",
    keys: [
      "settings",
      "settings.branches",
      "settings.classes",
      "settings.leave",
      "settings.fees",
      "settings.transport",
      "settings.users",
      "settings.system",
      "settings.subscription",
    ],
  },
];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  dashboard: "Home",
  students: "Students",
  attendance: "Attendance",
  staff: "Staff",
  parents: "Parents app",
  academics: "Academics / exams",
  support: "Help & support",
  "finance.overview": "Finance overview",
  "finance.receive": "Receive payment",
  "finance.make": "Make payment",
  "finance.transfer": "Transfer money",
  "finance.fees_report": "Fees report",
  "finance.concession": "Concession report",
  "finance.salary": "Salary report",
  "finance.daybook": "Day book",
  "finance.analytics": "Analytics",
  "finance.ledger": "Ledger",
  "finance.journals": "Journals",
  "finance.trial": "Trial balance",
  "finance.pl": "Profit & loss",
  "finance.balance": "Balance sheet",
  "finance.reconciliation": "Bank reconciliation",
  "finance.cashflow": "Cash flow",
  "finance.vehicle": "Vehicle fees",
  "finance.aging": "Fee aging",
  "finance.heads": "Fee heads",
  settings: "School details",
  "settings.branches": "Branches",
  "settings.classes": "Class Tier",
  "settings.leave": "Leave",
  "settings.fees": "Fee Category",
  "settings.transport": "Bus Point",
  "settings.users": "Team users",
  "settings.system": "System",
  "settings.subscription": "Subscription",
};

export const ALL_PERMISSIONS: PermissionSet = ["*"];

export const FINANCE_ONLY_PRESET: PermissionKey[] = [
  ...FINANCE_PERMISSION_KEYS,
  "settings.fees",
  "settings.transport",
];

/** Default module access when Login as is used on a staff profile with no team user linked. */
export const STAFF_LOGIN_AS_PRESET: PermissionKey[] = [
  "dashboard",
  "students",
  "attendance",
  "staff",
  "parents",
  "academics",
  "support",
];

export function isPermissionKey(value: unknown): value is PermissionKey {
  return typeof value === "string" && (PERMISSION_KEYS as readonly string[]).includes(value);
}

export function normalizePermissionSet(value: unknown): PermissionSet {
  if (!Array.isArray(value) || value.length === 0) return [];
  if ((value as unknown[]).includes("*")) return ["*"];
  const keys = value.filter(isPermissionKey);
  return Array.from(new Set(keys));
}

export function hasFullAccess(permissions: PermissionSet | undefined | null): boolean {
  return Boolean(permissions && (permissions as string[]).includes("*"));
}

export function hasPermission(
  permissions: PermissionSet | undefined | null,
  key: PermissionKey,
): boolean {
  if (!permissions?.length) return false;
  if ((permissions as string[]).includes("*")) return true;
  const keys = permissions as PermissionKey[];
  if (keys.includes(key)) return true;
  const fallbacks = PERMISSION_FALLBACKS[key];
  return Boolean(fallbacks?.some((alias) => keys.includes(alias)));
}

export function hasAnyFinance(permissions: PermissionSet | undefined | null): boolean {
  if (hasFullAccess(permissions)) return true;
  return FINANCE_PERMISSION_KEYS.some((k) => hasPermission(permissions, k));
}

export type SettingsTabId =
  | "school"
  | "branches"
  | "classes"
  | "academics"
  | "departments"
  | "roles"
  | "leave"
  | "fees"
  | "vehicles"
  | "transport"
  | "system"
  | "support"
  | "users"
  | "subscription";

/** Subscription plan feature matrix (from Super Admin Plans). */
export type PlanFlags = {
  finance: boolean;
  students: boolean;
  classes: boolean;
  staff: boolean;
  vehicle: boolean;
  analytics: boolean;
  feeReminders: boolean;
  feeCollection: boolean;
  extraUsers: boolean;
  staffAttendance: boolean;
  studentAttendance: boolean;
  payroll: boolean;
  autoFeeCollection: boolean;
  whatsapp: boolean;
  branches: boolean;
  globalSearch: boolean;
  exams: boolean;
};

export const DEFAULT_PLAN_FLAGS: PlanFlags = {
  finance: true,
  students: true,
  classes: true,
  staff: true,
  vehicle: true,
  analytics: true,
  feeReminders: true,
  feeCollection: true,
  extraUsers: true,
  staffAttendance: true,
  studentAttendance: true,
  payroll: true,
  autoFeeCollection: true,
  whatsapp: true,
  branches: true,
  globalSearch: true,
  exams: true,
};

/** Catalog labels for Super Admin Plans and tenant Subscriptions. */
export const PLAN_FEATURE_ITEMS: { key: keyof PlanFlags; label: string }[] = [
  { key: "finance", label: "Financial Module" },
  { key: "students", label: "Student Management" },
  { key: "classes", label: "Class Management" },
  { key: "staff", label: "Staff Management" },
  { key: "staffAttendance", label: "Staff Attendance" },
  { key: "studentAttendance", label: "Student Attendance" },
  { key: "payroll", label: "Automatic Payroll" },
  { key: "vehicle", label: "Vehicle Management" },
  { key: "analytics", label: "Advanced Analytical Reporting" },
  { key: "feeReminders", label: "Manual Fee Reminders" },
  { key: "feeCollection", label: "Fee Collection" },
  { key: "extraUsers", label: "Extra User Access" },
  { key: "autoFeeCollection", label: "Automatic Fee Collection" },
  { key: "whatsapp", label: "WhatsApp Integration" },
  { key: "branches", label: "Multiple Branches" },
  { key: "globalSearch", label: "Global Search" },
  { key: "exams", label: "Exam grading" },
];

export function normalizePlanFlags(value: unknown): PlanFlags {
  if (!value || typeof value !== "object") return { ...DEFAULT_PLAN_FLAGS };
  const raw = value as Partial<Record<keyof PlanFlags, unknown>>;
  const next = { ...DEFAULT_PLAN_FLAGS };
  (Object.keys(DEFAULT_PLAN_FLAGS) as (keyof PlanFlags)[]).forEach((key) => {
    if (typeof raw[key] === "boolean") next[key] = raw[key] as boolean;
  });
  return next;
}

/** Settings tab → required plan flag (undefined = always allowed by plan). */
const SETTINGS_TAB_PLAN_FLAG: Partial<Record<SettingsTabId, keyof PlanFlags>> = {
  classes: "classes",
  academics: "exams",
  departments: "staff",
  roles: "staff",
  leave: "staff",
  fees: "feeCollection",
  vehicles: "vehicle",
  transport: "vehicle",
  users: "extraUsers",
  branches: "branches",
};

export function planAllowsSettingsTab(
  flags: PlanFlags | undefined | null,
  tab: SettingsTabId,
): boolean {
  const required = SETTINGS_TAB_PLAN_FLAG[tab];
  if (!required) return true;
  const resolved = flags ?? DEFAULT_PLAN_FLAGS;
  // Core school admins always need Users tab even if extraUsers is off.
  if (tab === "users") return true;
  // Branches tab stays visible so the main campus can be edited.
  if (tab === "branches") return true;
  // Fee categories: feeCollection or finance plan flag.
  if (tab === "fees") {
    return Boolean(resolved.feeCollection || resolved.finance);
  }
  return Boolean(resolved[required]);
}

export function planAllowsMultipleBranches(flags: PlanFlags | undefined | null): boolean {
  if (!flags) return true;
  return Boolean(flags.branches);
}

export function planAllowsExtraUsers(flags: PlanFlags | undefined | null): boolean {
  if (!flags) return true;
  return Boolean(flags.extraUsers);
}

export function planAllowsGlobalSearch(flags: PlanFlags | undefined | null): boolean {
  if (!flags) return true;
  return Boolean(flags.globalSearch);
}

export function planAllowsStudentAttendance(flags: PlanFlags | undefined | null): boolean {
  if (!flags) return true;
  return Boolean(flags.studentAttendance);
}

export function planAllowsExams(flags: PlanFlags | undefined | null): boolean {
  if (!flags) return true;
  if (typeof flags.exams !== "boolean") return true;
  return flags.exams;
}

export function planAllowsModule(
  flags: PlanFlags | undefined | null,
  module: "students" | "staff" | "finance" | "dashboard" | "settings" | "notifications",
): boolean {
  const resolved = flags ?? DEFAULT_PLAN_FLAGS;
  if (module === "dashboard" || module === "settings" || module === "notifications") {
    return true;
  }
  return Boolean(resolved[module]);
}

const SETTINGS_TAB_PERMISSION: Partial<Record<SettingsTabId, PermissionKey>> = {
  school: "settings",
  branches: "settings.branches",
  classes: "settings.classes",
  departments: "settings.classes",
  roles: "settings.classes",
  leave: "settings.leave",
  fees: "settings.fees",
  vehicles: "settings.transport",
  transport: "settings.transport",
  users: "settings.users",
  system: "settings.system",
  subscription: "settings.subscription",
  support: "support",
  academics: "academics",
};

export function canAccessSettingsTab(
  permissions: PermissionSet | undefined | null,
  tab: SettingsTabId,
  flags?: PlanFlags | null,
): boolean {
  if (!planAllowsSettingsTab(flags, tab)) return false;
  if (tab === "users" && !planAllowsExtraUsers(flags)) return false;
  if (hasFullAccess(permissions)) return true;
  if (tab === "academics") {
    return (
      hasPermission(permissions, "academics") ||
      hasPermission(permissions, "settings") ||
      hasPermission(permissions, "students")
    );
  }
  if (tab === "support") {
    return (
      hasPermission(permissions, "support") ||
      hasPermission(permissions, "settings") ||
      canAccessSettingsModule(permissions)
    );
  }
  const key = SETTINGS_TAB_PERMISSION[tab];
  if (key) return hasPermission(permissions, key);
  return hasPermission(permissions, "settings");
}

export function canAccessSettingsModule(permissions: PermissionSet | undefined | null): boolean {
  if (hasFullAccess(permissions)) return true;
  return PERMISSION_KEYS.some(
    (key) =>
      (key === "settings" || key.startsWith("settings.")) && hasPermission(permissions, key),
  );
}

export type FinanceViewKey =
  | "overview"
  | "receive"
  | "make"
  | "transfer"
  | "transfers"
  | "analytics"
  | "ledger"
  | "journals"
  | "trial"
  | "pl"
  | "balance"
  | "fees"
  | "concession"
  | "salary"
  | "daybook"
  | "reconciliation"
  | "cashflow"
  | "vehicle"
  | "aging"
  | "heads";

const FINANCE_VIEW_PERMISSION: Record<FinanceViewKey, PermissionKey> = {
  overview: "finance.overview",
  receive: "finance.receive",
  make: "finance.make",
  transfer: "finance.transfer",
  transfers: "finance.transfer",
  analytics: "finance.analytics",
  ledger: "finance.ledger",
  journals: "finance.journals",
  trial: "finance.trial",
  pl: "finance.pl",
  balance: "finance.balance",
  fees: "finance.fees_report",
  concession: "finance.concession",
  salary: "finance.salary",
  daybook: "finance.daybook",
  reconciliation: "finance.reconciliation",
  cashflow: "finance.cashflow",
  vehicle: "finance.vehicle",
  aging: "finance.aging",
  heads: "finance.heads",
};

export function canAccessFinanceView(
  permissions: PermissionSet | undefined | null,
  view: FinanceViewKey,
): boolean {
  return hasPermission(permissions, FINANCE_VIEW_PERMISSION[view]);
}

export function firstAllowedTenantPath(
  permissions: PermissionSet | undefined | null,
  staffId?: string | null,
): string {
  const selfStaffPath =
    typeof staffId === "string" && staffId.trim()
      ? `/tenant/staff?id=${encodeURIComponent(staffId.trim())}`
      : null;
  // Staff Login as (class teacher): open assigned students first — same idea as parent Login as.
  if (staffId && hasPermission(permissions, "students")) {
    return "/tenant/students";
  }
  if (hasPermission(permissions, "dashboard") || hasFullAccess(permissions)) {
    return "/tenant/dashboard";
  }
  if (hasPermission(permissions, "students")) return "/tenant/students";
  if (hasPermission(permissions, "attendance")) return "/tenant/attendance";
  if (hasPermission(permissions, "staff")) return selfStaffPath || "/tenant/staff";
  if (hasAnyFinance(permissions)) return "/tenant/finance";
  if (hasPermission(permissions, "support")) return "/tenant/support";
  if (canAccessSettingsModule(permissions)) return "/tenant/settings";
  return selfStaffPath || "/tenant/dashboard";
}

export function summarizePermissions(permissions: PermissionSet): string {
  if (hasFullAccess(permissions)) return "All functions";
  if (!permissions.length) return "No access";
  const keys = permissions as PermissionKey[];
  if (
    FINANCE_PERMISSION_KEYS.every((k) => keys.includes(k)) &&
    keys.every((k) => k.startsWith("finance.") || k === "settings.fees")
  ) {
    return "Finance only";
  }
  if (keys.length <= 3) {
    return keys.map((k) => PERMISSION_LABELS[k]).join(", ");
  }
  return `${keys.length} permissions`;
}
