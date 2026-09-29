/** Supported currencies — keep in sync with backend/lib/locale_config.php. */
export const CURRENCY_CODES = [
  "INR",
  "USD",
  "AED",
  "AUD",
  "CAD",
  "EUR",
  "GBP",
  "SAR",
  "CHF",
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export type CurrencyOption = { code: CurrencyCode; symbol: string; label: string };

export const CURRENCIES: CurrencyOption[] = [
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "AED", symbol: "AED", label: "UAE Dirham" },
  { code: "AUD", symbol: "$", label: "Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "SAR", symbol: "SAR", label: "Saudi Riyal" },
  { code: "CHF", symbol: "CHF", label: "Swiss Franc" },
];

export const COUNTRY_LABELS: Record<string, string> = {
  IN: "India",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  US: "United States",
  GB: "United Kingdom",
  AU: "Australia",
  CA: "Canada",
  DE: "Germany",
  FR: "France",
  NL: "Netherlands",
  IE: "Ireland",
  CH: "Switzerland",
  QA: "Qatar",
  KW: "Kuwait",
  BH: "Bahrain",
  OM: "Oman",
  EG: "Egypt",
  PK: "Pakistan",
  BD: "Bangladesh",
  SG: "Singapore",
  MY: "Malaysia",
  NZ: "New Zealand",
};

export const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  IN: "INR",
  AE: "AED",
  SA: "SAR",
  US: "USD",
  GB: "GBP",
  AU: "AUD",
  CA: "CAD",
  DE: "EUR",
  FR: "EUR",
  NL: "EUR",
  IE: "EUR",
  CH: "CHF",
};

export const DEFAULT_LOCALE = { country: "IN", currency: "INR" as CurrencyCode, language: "en" };

export const STORAGE_KEYS = {
  currency: "school-accounts/locale/currency",
  country: "school-accounts/locale/country",
  manual: "school-accounts/locale/manual",
  orgCurrency: "school-accounts/locale/org-currency",
  orgCurrencyTenant: "school-accounts/locale/org-currency-tenant",
} as const;

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && (CURRENCY_CODES as readonly string[]).includes(value);
}

export function normalizeCurrency(value: unknown, fallback: CurrencyCode = "INR"): CurrencyCode {
  if (typeof value !== "string") return fallback;
  const code = value.trim().toUpperCase();
  return isCurrencyCode(code) ? code : fallback;
}

export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

export function currencyForCountry(country: string): CurrencyCode {
  return (
    COUNTRY_CURRENCY[country.toUpperCase()] ?? (country.toUpperCase() === "IN" ? "INR" : "USD")
  );
}

export function intlLocaleFor(language: string, currency: string): string {
  if (currency === "INR") return "en-IN";
  if (currency === "GBP") return "en-GB";
  if (currency === "AUD") return "en-AU";
  if (currency === "CAD") return "en-CA";
  if (currency === "AED" && language.startsWith("ar")) return "ar-AE";
  return "en-US";
}

/** localStorage that never throws (Safari private mode, sandboxed iframes). */
export const safeStorage = {
  get(key: string): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    if (typeof window === "undefined") return;
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
    } catch {
      /* storage unavailable */
    }
  },
};
