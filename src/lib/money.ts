import { useSyncExternalStore } from "react";

import {
  type CurrencyCode,
  currencySymbol,
  intlLocaleFor,
  isCurrencyCode,
  normalizeCurrency,
  safeStorage,
  STORAGE_KEYS,
} from "@/lib/locale/currencies";

/**
 * Single money formatter for Feezo. Stored amounts are never converted —
 * the active currency only controls the label/grouping.
 *
 * Active currency = org base currency inside a school workspace ("org" mode),
 * otherwise the visitor's geo/manual currency ("visitor" mode).
 */
type MoneyState = {
  mode: "org" | "visitor";
  orgCurrency: CurrencyCode;
  visitorCurrency: CurrencyCode;
  language: string;
};

function readInitialState(): MoneyState {
  const storedOrg = safeStorage.get(STORAGE_KEYS.orgCurrency);
  const storedVisitor = safeStorage.get(STORAGE_KEYS.currency);
  return {
    mode: "visitor",
    orgCurrency: isCurrencyCode(storedOrg) ? storedOrg : "INR",
    visitorCurrency: isCurrencyCode(storedVisitor) ? storedVisitor : "INR",
    language: "en",
  };
}

let state: MoneyState = readInitialState();
const listeners = new Set<() => void>();

function update(patch: Partial<MoneyState>) {
  const next = { ...state, ...patch };
  if (
    next.mode === state.mode &&
    next.orgCurrency === state.orgCurrency &&
    next.visitorCurrency === state.visitorCurrency &&
    next.language === state.language
  ) {
    return;
  }
  state = next;
  listeners.forEach((l) => l());
}

export function subscribeMoney(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDefaultCurrency(): CurrencyCode {
  return state.mode === "org" ? state.orgCurrency : state.visitorCurrency;
}

export function getOrgCurrency(): CurrencyCode {
  return state.orgCurrency;
}

/** Visitor (public site) currency + language. */
export function setMoneyDefaults(currency: string, language?: string) {
  update({
    visitorCurrency: normalizeCurrency(currency, state.visitorCurrency),
    language: language ?? state.language,
  });
}

/** School base currency from school.php / bundle.php. Cached for the next cold start. */
export function setOrgCurrency(currency: unknown) {
  if (!isCurrencyCode(typeof currency === "string" ? currency.toUpperCase() : currency)) return;
  const code = normalizeCurrency(currency);
  safeStorage.set(STORAGE_KEYS.orgCurrency, code);
  update({ orgCurrency: code });
}

export function clearOrgCurrency() {
  safeStorage.set(STORAGE_KEYS.orgCurrency, null);
  safeStorage.set(STORAGE_KEYS.orgCurrencyTenant, null);
  update({ orgCurrency: "INR", mode: "visitor" });
}

/** Drop a cached org currency that belongs to a different tenant (impersonation / account switch). */
export function bindOrgCurrencyTenant(tenantId: string) {
  const owner = safeStorage.get(STORAGE_KEYS.orgCurrencyTenant);
  if (owner === tenantId) return;
  safeStorage.set(STORAGE_KEYS.orgCurrencyTenant, tenantId);
  if (owner !== null) {
    safeStorage.set(STORAGE_KEYS.orgCurrency, null);
    update({ orgCurrency: "INR" });
  }
}

export function setMoneyMode(mode: "org" | "visitor") {
  update({ mode });
}

/** Re-renders the caller whenever the active currency changes. */
export function useMoneyCurrency(): CurrencyCode {
  return useSyncExternalStore(subscribeMoney, getDefaultCurrency, getDefaultCurrency);
}

export function useOrgCurrency(): CurrencyCode {
  return useSyncExternalStore(subscribeMoney, getOrgCurrency, getOrgCurrency);
}

export function moneySymbol(currency?: string): string {
  return currencySymbol(currency ?? getDefaultCurrency());
}

function toNumber(amount: unknown): number {
  const n = typeof amount === "number" ? amount : Number(amount);
  return Number.isFinite(n) ? n : 0;
}

function fractionDigits(n: number): number {
  return Math.abs(n - Math.round(n)) < 0.005 ? 0 : 2;
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = locale + JSON.stringify(options);
  let f = formatterCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, options);
    formatterCache.set(key, f);
  }
  return f;
}

/** Grouped number without a symbol, e.g. 1,23,456 (INR) or 123,456 (USD). */
export function formatAmount(amount: unknown, currency?: string): string {
  const n = toNumber(amount);
  const code = normalizeCurrency(currency ?? getDefaultCurrency());
  const digits = fractionDigits(n);
  try {
    return numberFormat(intlLocaleFor(state.language, code), {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(n);
  } catch {
    return n.toFixed(digits);
  }
}

/** "₹1,23,456", "$1,234.50", "AED 1,234". */
export function formatMoney(amount: unknown, currency?: string): string {
  const n = toNumber(amount);
  const code = normalizeCurrency(currency ?? getDefaultCurrency());
  const digits = fractionDigits(n);
  try {
    const out = numberFormat(intlLocaleFor(state.language, code), {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(n);
    // Multi-letter symbols (AED, SAR, CHF) read better with a space: "AED 1,234".
    return out.replace(/^(-?)([A-Z]{2,4})\s*(?=\d)/, "$1$2 ");
  } catch {
    return `${code} ${n.toFixed(2)}`;
  }
}

/** Short form for KPI tiles/charts: ₹1.2L / ₹3.4Cr for INR, $1.2K / $3.4M elsewhere. */
export function formatMoneyCompact(amount: unknown, currency?: string): string {
  const n = toNumber(amount);
  const code = normalizeCurrency(currency ?? getDefaultCurrency());
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const units: Array<[number, string]> =
    code === "INR"
      ? [
          [1e7, "Cr"],
          [1e5, "L"],
          [1e3, "k"],
        ]
      : [
          [1e9, "B"],
          [1e6, "M"],
          [1e3, "K"],
        ];
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const value = abs / size;
      const text =
        value >= 100 ? Math.round(value).toString() : value.toFixed(1).replace(/\.0$/, "");
      const sym = currencySymbol(code);
      const sep = /^[A-Z]{2,}$/.test(sym) ? " " : "";
      return `${sign}${sym}${sep}${text}${suffix}`;
    }
  }
  return formatMoney(n, code);
}

/** ASCII-safe prefix for jsPDF Helvetica (cannot draw ₹). */
export function pdfCurrencyPrefix(currency?: string): string {
  const code = normalizeCurrency(currency ?? getDefaultCurrency());
  if (code === "INR") return "Rs.";
  if (code === "USD") return "$";
  return code;
}

/** "Rs. 1,23,456", "$1,234", "AED 1,234" — safe for jsPDF core fonts. */
export function formatMoneyPdf(amount: unknown, currency?: string): string {
  const n = toNumber(amount);
  const code = normalizeCurrency(currency ?? getDefaultCurrency());
  const prefix = pdfCurrencyPrefix(code);
  const body = formatAmount(Math.abs(n), code);
  const sign = n < 0 ? "-" : "";
  return prefix === "$" ? `${sign}$${body}` : `${sign}${prefix} ${body}`;
}

/** "Amount (₹)" / "Amount (AED)"; pass `pdf` for an ASCII-safe label. */
export function moneyColumnLabel(
  label: string,
  opts?: { currency?: string; pdf?: boolean },
): string {
  const code = normalizeCurrency(opts?.currency ?? getDefaultCurrency());
  const sym = opts?.pdf ? pdfCurrencyPrefix(code) : currencySymbol(code);
  return `${label} (${sym})`;
}

/** Regex source matching any supported currency symbol/code (for parsing stored narration). */
export const CURRENCY_TOKEN_SRC = String.raw`(?:₹|Rs\.?|C\$|\$|€|£|INR|USD|AED|AUD|CAD|EUR|GBP|SAR|CHF)`;

/** Replace any known currency glyph with an ASCII-safe prefix (PDF text sanitising). */
export function asciiCurrencyText(text: string): string {
  return text.replace(/₹/g, "Rs.").replace(/€/g, "EUR ").replace(/£/g, "GBP ");
}

/** Strip currency symbols/codes so "AED 1,250" / "₹1,250" / "$1,250" parse as 1250. */
export function stripCurrency(text: string): string {
  return text.replace(/₹|Rs\.?|C\$|\$|€|£|\b(INR|USD|AED|AUD|CAD|EUR|GBP|SAR|CHF)\b/gi, "").trim();
}
