/** Tenant workspace permission keys and helpers (client-demo ACL). */

export const PERMISSION_KEYS = [
  "dashboard",
  "students",
  "staff",
  "settings",
  "finance.overview",
  "finance.receive",
  "finance.make",
  "finance.analytics",
  "finance.ledger",
  "finance.pl",
  "finance.balance",
  "finance.fees_report",
  "finance.salary",
  "finance.daybook",
  "finance.reconciliation",
  "settings.fees",
  "settings.users",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type PermissionSet = PermissionKey[] | ["*"];

export const FINANCE_PERMISSION_KEYS = PERMISSION_KEYS.filter((k) =>
  k.startsWith("finance."),
) as PermissionKey[];

export const PERMISSION_GROUPS: {
  id: string;
  label: string;
  keys: PermissionKey[];
}[] = [
  {
    id: "modules",
    label: "Modules",
    keys: ["dashboard", "students", "staff", "settings"],
  },
  {
    id: "finance",
    label: "Finance",
    keys: [...FINANCE_PERMISSION_KEYS],
  },
  {
    id: "settings_extra",
    label: "Settings extras",
    keys: ["settings.fees", "settings.users"],
  },
];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  dashboard: "Dashboard",
  students: "Students",
  staff: "Staff",
  settings: "Settings",
  "finance.overview": "Finance overview",
  "finance.receive": "Receive Payment",
  "finance.make": "Make Payment",
  "finance.analytics": "Analytics",
  "finance.ledger": "General Ledger",
  "finance.pl": "Profit & Loss",
  "finance.balance": "Balance Sheet",
  "finance.fees_report": "Fees Report",
  "finance.salary": "Salary Report",
  "finance.daybook": "Day Book",
  "finance.reconciliation": "Bank Reconciliation",
  "settings.fees": "Fee Categories",
  "settings.users": "Users",
};

export const ALL_PERMISSIONS: PermissionSet = ["*"];

export const FINANCE_ONLY_PRESET: PermissionKey[] = [
  ...FINANCE_PERMISSION_KEYS,
  "settings.fees",
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
  return (permissions as PermissionKey[]).includes(key);
}

export function hasAnyFinance(permissions: PermissionSet | undefined | null): boolean {
  if (hasFullAccess(permissions)) return true;
  return FINANCE_PERMISSION_KEYS.some((k) => hasPermission(permissions, k));
}

export type SettingsTabId =
  | "school"
  | "classes"
  | "departments"
  | "roles"
  | "vehicles"
  | "transport"
  | "fees"
  | "system"
  | "users";

export function canAccessSettingsTab(
  permissions: PermissionSet | undefined | null,
  tab: SettingsTabId,
): boolean {
  if (hasFullAccess(permissions)) return true;
  if (tab === "fees") {
    return (
      hasPermission(permissions, "settings") || hasPermission(permissions, "settings.fees")
    );
  }
  if (tab === "users") {
    return hasPermission(permissions, "settings.users");
  }
  return hasPermission(permissions, "settings");
}

export function canAccessSettingsModule(permissions: PermissionSet | undefined | null): boolean {
  if (hasFullAccess(permissions)) return true;
  return (
    hasPermission(permissions, "settings") ||
    hasPermission(permissions, "settings.fees") ||
    hasPermission(permissions, "settings.users")
  );
}

export type FinanceViewKey =
  | "overview"
  | "receive"
  | "make"
  | "analytics"
  | "ledger"
  | "pl"
  | "balance"
  | "fees"
  | "salary"
  | "daybook"
  | "reconciliation";

const FINANCE_VIEW_PERMISSION: Record<FinanceViewKey, PermissionKey> = {
  overview: "finance.overview",
  receive: "finance.receive",
  make: "finance.make",
  analytics: "finance.analytics",
  ledger: "finance.ledger",
  pl: "finance.pl",
  balance: "finance.balance",
  fees: "finance.fees_report",
  salary: "finance.salary",
  daybook: "finance.daybook",
  reconciliation: "finance.reconciliation",
};

export function canAccessFinanceView(
  permissions: PermissionSet | undefined | null,
  view: FinanceViewKey,
): boolean {
  return hasPermission(permissions, FINANCE_VIEW_PERMISSION[view]);
}

export function firstAllowedTenantPath(
  permissions: PermissionSet | undefined | null,
): string {
  if (hasPermission(permissions, "dashboard") || hasFullAccess(permissions)) {
    return "/tenant/dashboard";
  }
  if (hasPermission(permissions, "students")) return "/tenant/students";
  if (hasPermission(permissions, "staff")) return "/tenant/staff";
  if (hasAnyFinance(permissions)) return "/tenant/finance";
  if (canAccessSettingsModule(permissions)) return "/tenant/settings";
  return "/tenant/dashboard";
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
