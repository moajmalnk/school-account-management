import { createFileRoute } from "@tanstack/react-router";

import { SchoolSettings } from "@/components/school/SchoolAdminWorkspace";

export const SETTINGS_TABS = [
  "school",
  "classes",
  "departments",
  "roles",
  "vehicles",
  "transport",
  "fees",
  "system",
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

type SettingsSearch = {
  tab?: SettingsTab;
};

function isSettingsTab(value: unknown): value is SettingsTab {
  return typeof value === "string" && (SETTINGS_TABS as readonly string[]).includes(value);
}

export const Route = createFileRoute("/tenant/settings")({
  validateSearch: (search: Record<string, unknown>): SettingsSearch => ({
    tab: isSettingsTab(search.tab) ? search.tab : undefined,
  }),
  component: SchoolSettings,
});
