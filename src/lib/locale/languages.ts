import { useSyncExternalStore } from "react";

/** Organization base languages — English live; others listed for upcoming UI localisation. */

export const LANGUAGE_CODES = ["en", "ar", "hi", "ml"] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export type LanguageOption = {
  code: LanguageCode;
  /** Short badge, e.g. EN */
  short: string;
  label: string;
  /** Native script name shown in the picker */
  native: string;
  /** Selectable today; others appear as Coming soon. */
  available: boolean;
};

export const LANGUAGES: LanguageOption[] = [
  { code: "en", short: "EN", label: "English", native: "English", available: true },
  { code: "ar", short: "AR", label: "Arabic", native: "العربية", available: false },
  { code: "hi", short: "HI", label: "Hindi", native: "हिन्दी", available: false },
  { code: "ml", short: "ML", label: "Malayalam", native: "മലയാളം", available: false },
];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

const STORAGE_KEY = "school-accounts/locale/org-language";
const STORAGE_TENANT_KEY = "school-accounts/locale/org-language-tenant";
const CHANGE_EVENT = "feezo:org-language";

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && (LANGUAGE_CODES as readonly string[]).includes(value);
}

export function normalizeLanguage(
  value: unknown,
  fallback: LanguageCode = DEFAULT_LANGUAGE,
): LanguageCode {
  if (typeof value !== "string") return fallback;
  const code = value.trim().toLowerCase();
  return isLanguageCode(code) ? code : fallback;
}

export function languageOption(code: LanguageCode): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function languagePickerLabel(opt: LanguageOption): string {
  const base = `${opt.short} · ${opt.native} — ${opt.label}`;
  return opt.available ? base : `${base} (Coming soon)`;
}

export function bindOrgLanguageTenant(tenantId: string) {
  const prev = safeGet(STORAGE_TENANT_KEY);
  if (prev && prev !== tenantId) {
    /* keep last language; tenant switch does not wipe preference */
  }
  safeSet(STORAGE_TENANT_KEY, tenantId || null);
}

export function getOrgLanguage(): LanguageCode {
  return normalizeLanguage(safeGet(STORAGE_KEY), DEFAULT_LANGUAGE);
}

export function setOrgLanguage(language: unknown): LanguageCode {
  const next = normalizeLanguage(language, DEFAULT_LANGUAGE);
  const opt = languageOption(next);
  const saved = opt.available ? next : DEFAULT_LANGUAGE;
  safeSet(STORAGE_KEY, saved);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: saved }));
  }
  return saved;
}

export function subscribeOrgLanguage(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onChange = () => listener();
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useOrgLanguage(): LanguageCode {
  return useSyncExternalStore(subscribeOrgLanguage, getOrgLanguage, () => DEFAULT_LANGUAGE);
}
