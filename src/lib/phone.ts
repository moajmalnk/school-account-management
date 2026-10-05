/**
 * Phone parse/compose helpers — E.164 storage with currency-linked country defaults.
 */

import {
  COUNTRY_DIAL,
  COUNTRY_LABELS,
  currencyDefaultCountry,
  countryDial,
  type CurrencyCode,
} from "@/lib/locale/currencies";
import { getOrgCurrency } from "@/lib/money";

export type ParsedPhone = { country: string; national: string };

/** Soft national length hints (UX only — storage stays permissive). */
export const NATIONAL_LENGTH_HINT: Record<string, number> = {
  IN: 10,
  AE: 9,
  SA: 9,
  US: 10,
  CA: 10,
  GB: 10,
  AU: 9,
  DE: 10,
  FR: 9,
  NL: 9,
  IE: 9,
  CH: 9,
  QA: 8,
  KW: 8,
  BH: 8,
  OM: 8,
  EG: 10,
  PK: 10,
  BD: 10,
  SG: 8,
  MY: 9,
  NZ: 9,
};

const DIAL_ENTRIES = Object.entries(COUNTRY_DIAL).sort((a, b) => b[1].length - a[1].length);

export function phoneDigits(raw?: string | null): string {
  return (raw ?? "").replace(/\D/g, "");
}

export function isKnownCountry(country: string): boolean {
  return Object.prototype.hasOwnProperty.call(COUNTRY_LABELS, country.trim().toUpperCase());
}

export function composeE164(country: string, national: string): string {
  const digits = phoneDigits(national);
  if (!digits) return "";
  const dial = countryDial(country);
  // Avoid double-prefix if user pasted dial into the national field
  if (digits.startsWith(dial) && digits.length > dial.length + 4) {
    return `+${digits}`;
  }
  return `+${dial}${digits}`;
}

/**
 * Parse a stored/typed phone into country + national number.
 * Bare local numbers use `fallbackCountry` (usually org-currency default).
 */
export function parsePhone(raw?: string | null, fallbackCountry = "IN"): ParsedPhone {
  const fallback = isKnownCountry(fallbackCountry)
    ? fallbackCountry.trim().toUpperCase()
    : "IN";
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { country: fallback, national: "" };

  const digits = phoneDigits(trimmed);
  if (!digits) return { country: fallback, national: "" };

  const hasPlus = trimmed.startsWith("+") || /^\s*00/.test(trimmed);

  if (hasPlus || digits.length > 11) {
    for (const [cc, dial] of DIAL_ENTRIES) {
      if (digits.startsWith(dial) && digits.length > dial.length) {
        return { country: cc, national: digits.slice(dial.length) };
      }
    }
  }

  // Legacy bare Indian mobiles (common in existing data)
  if (!hasPlus && digits.length === 10 && /^[6-9]/.test(digits) && fallback === "IN") {
    return { country: "IN", national: digits };
  }

  // Leading 0 trunk prefix (IN / some markets)
  if (!hasPlus && digits.length === 11 && digits.startsWith("0")) {
    return { country: fallback, national: digits.slice(1) };
  }

  // 12-digit starting with known dial of fallback
  const fallbackDial = countryDial(fallback);
  if (!hasPlus && digits.startsWith(fallbackDial) && digits.length > fallbackDial.length + 5) {
    return { country: fallback, national: digits.slice(fallbackDial.length) };
  }

  return { country: fallback, national: digits };
}

/** Human-readable display: `+971 50 123 4567` style (space after dial). */
export function formatPhoneDisplay(raw?: string | null, fallbackCountry?: string): string {
  const fallback = fallbackCountry ?? currencyDefaultCountry(getOrgCurrency());
  const { country, national } = parsePhone(raw, fallback);
  if (!national && !raw) return "";
  if (!national) {
    const digits = phoneDigits(raw);
    return digits ? `+${digits}` : "";
  }
  const dial = countryDial(country);
  return `+${dial} ${national}`;
}

/**
 * Digits for wa.me / Notify API (no +).
 * Legacy bare 10-digit numbers get the org-currency default dial prepended.
 */
export function toWhatsAppDigits(
  raw?: string | null,
  opts?: { fallbackCountry?: string; currency?: CurrencyCode },
): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;

  const fallback =
    opts?.fallbackCountry ??
    currencyDefaultCountry(opts?.currency ?? getOrgCurrency());
  const { country, national } = parsePhone(trimmed, fallback);
  const nationalDigits = phoneDigits(national);
  if (!nationalDigits) {
    const digits = phoneDigits(trimmed);
    return digits.length >= 8 ? digits : null;
  }

  const composed = phoneDigits(composeE164(country, nationalDigits));
  return composed.length >= 8 ? composed : null;
}

const PLACEHOLDER_BY_COUNTRY: Record<string, string> = {
  IN: "9810045221",
  AE: "501234567",
  SA: "501234567",
  US: "2025550123",
  CA: "4165550123",
  GB: "7400123456",
  AU: "412345678",
  DE: "1512345678",
  FR: "612345678",
  NL: "612345678",
  IE: "851234567",
  CH: "791234567",
  QA: "33123456",
  KW: "50123456",
  BH: "36123456",
  OM: "92123456",
  EG: "1001234567",
  PK: "3001234567",
  BD: "1712345678",
  SG: "81234567",
  MY: "123456789",
  NZ: "211234567",
};

/** National-number placeholder hint for a country. */
export function nationalPlaceholder(country: string): string {
  const key = country.trim().toUpperCase();
  return PLACEHOLDER_BY_COUNTRY[key] ?? "5551234567";
}
