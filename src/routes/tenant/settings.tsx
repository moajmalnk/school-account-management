import { createFileRoute } from "@tanstack/react-router";

import { SchoolSettings } from "@/components/school/SchoolAdminWorkspace";
import { useRequirePermission } from "@/hooks/useRequirePermission";

export const SETTINGS_TABS = [
  "school",
  "branches",
  "classes",
  "departments",
  "roles",
  "leave",
  "users",
  "vehicles",
  "transport",
  "system",
  "support",
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

type SettingsSearch = {
  tab?: SettingsTab;
  chat?: string;
};

function isSettingsTab(value: unknown): value is SettingsTab {
  return typeof value === "string" && (SETTINGS_TABS as readonly string[]).includes(value);
}

export const Route = createFileRoute("/tenant/settings")({
  validateSearch: (search: Record<string, unknown>): SettingsSearch => ({
    tab: isSettingsTab(search.tab) ? search.tab : undefined,
    chat: typeof search.chat === "string" && search.chat.trim() ? search.chat.trim() : undefined,
  }),
  component: SettingsRoute,
});

function SettingsRoute() {
  useRequirePermission("settings");
  return <SchoolSettings />;
}
