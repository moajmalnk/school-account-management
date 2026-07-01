import { ClipboardList, CreditCard, LayoutDashboard, Users, type LucideIcon } from "lucide-react";

export type ViewKey = "overview" | "tenants" | "plans" | "audits";

export type AdminNavEntry = {
  key: ViewKey;
  label: string;
  shortLabel: string;
  to: string;
  icon: LucideIcon;
};

export const ADMIN_NAV: AdminNavEntry[] = [
  {
    key: "overview",
    label: "Overview",
    shortLabel: "Overview",
    to: "/super-admin/overview",
    icon: LayoutDashboard,
  },
  {
    key: "tenants",
    label: "Tenants",
    shortLabel: "Tenants",
    to: "/super-admin/tenants",
    icon: Users,
  },
  {
    key: "plans",
    label: "Plans",
    shortLabel: "Plans",
    to: "/super-admin/plans",
    icon: CreditCard,
  },
  {
    key: "audits",
    label: "Audits",
    shortLabel: "Audits",
    to: "/super-admin/audits",
    icon: ClipboardList,
  },
];
