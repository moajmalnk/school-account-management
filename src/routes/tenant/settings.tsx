import { createFileRoute } from "@tanstack/react-router";

import { SchoolSettings } from "@/components/school/SchoolAdminWorkspace";
import { useRequirePermission } from "@/hooks/useRequirePermission";

export const SETTINGS_TABS = [
  "school",
  "branches",
  "classes",
  "academics",
  "departments",
  "roles",
  "leave",
  "fees",
  "users",
  "vehicles",
  "transport",
  "system",
  "support",
  "subscription",
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

type SettingsSearch = {
  tab?: SettingsTab;
  chat?: string;
  orderId?: string;
  /** Bus Point vehicle detail / manage-students deep link */
  vehicle?: string;
  /** When true with `vehicle`, open Manage students for that bus */
  students?: boolean;
};

function isSettingsTab(value: unknown): value is SettingsTab {
  return typeof value === "string" && (SETTINGS_TABS as readonly string[]).includes(value);
}

function parseVehicleId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const id = value.trim();
  if (!id || id.length > 64) return undefined;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id)) return undefined;
  return id;
}

function parseStudentsFlag(value: unknown): boolean | undefined {
  if (value === true || value === 1 || value === "1" || value === "true") return true;
  return undefined;
}

export const Route = createFileRoute("/tenant/settings")({
  validateSearch: (search: Record<string, unknown>): SettingsSearch => {
    const rawOrder = search.order_id ?? search.orderId;
    const orderId = typeof rawOrder === "string" ? rawOrder.trim() : "";
    const vehicle = parseVehicleId(search.vehicle);
    const students = vehicle ? parseStudentsFlag(search.students) : undefined;
    return {
      tab: isSettingsTab(search.tab) ? search.tab : undefined,
      chat: typeof search.chat === "string" && search.chat.trim() ? search.chat.trim() : undefined,
      orderId: /^[A-Za-z0-9_-]{4,50}$/.test(orderId) ? orderId : undefined,
      vehicle,
      students,
    };
  },
  component: SettingsRoute,
});

function SettingsRoute() {
  useRequirePermission("settings");
  return <SchoolSettings />;
}
