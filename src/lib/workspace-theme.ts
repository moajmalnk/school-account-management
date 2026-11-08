/** Tiny theme helpers safe to import from the marketing critical path. */

export type WorkspaceThemeMode = "Light" | "Dark";

const STORAGE_KEY = "school-accounts/tenant-store/v13";
const LEGACY_STORAGE_KEYS = [
  "school-accounts/tenant-store/v12",
  "school-accounts/tenant-store/v11",
  "school-accounts/tenant-store/v10",
  "school-accounts/tenant-store/v9",
  "school-accounts/tenant-store/v8",
  "school-accounts/tenant-store/v7",
  "school-accounts/tenant-store/v6",
  "school-accounts/tenant-store/v5",
  "school-accounts/tenant-store/v4",
  "school-accounts/tenant-store/v3",
] as const;

function normalizeThemeMode(value: unknown): WorkspaceThemeMode {
  return value === "Dark" ? "Dark" : "Light";
}

export function applyWorkspaceThemeMode(mode: WorkspaceThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const dark = mode === "Dark";
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#0a0a0a" : "#EAEAEA");
}

export function peekStoredThemeMode(): WorkspaceThemeMode {
  if (typeof window === "undefined") return "Light";
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
    if (!raw) return "Light";
    const parsed = JSON.parse(raw) as { themeSettings?: { mode?: unknown } };
    return normalizeThemeMode(parsed.themeSettings?.mode);
  } catch {
    return "Light";
  }
}
