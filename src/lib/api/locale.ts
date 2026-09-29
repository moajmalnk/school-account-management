import { apiRequest } from "@/lib/api/client";
import type { CurrencyCode } from "@/lib/locale/currencies";
import type { FxRates } from "@/lib/locale/marketing-price";

export type LocaleDetectResponse = {
  country: string;
  currency: CurrencyCode;
  language: string;
  localeLabel: string;
  source: "header" | "hint" | "ip" | "default";
  meta?: {
    currencies: Array<{ code: CurrencyCode; symbol: string }>;
    countries: Array<{ code: string; label: string; currency: CurrencyCode; language: string }>;
    languages: string[];
  };
};

export type FxRatesResponse = {
  base: "INR";
  rates: FxRates;
  updatedAt: string;
  source: "live" | "static";
};

/** Country from the Vercel edge function (`api/geo.ts`); null in local Vite or on error. */
export async function fetchGeoHint(): Promise<string | null> {
  if (typeof window === "undefined" || import.meta.env.DEV) return null;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch("/api/geo", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) return null;
    const data = (await res.json()) as { country?: string | null };
    const code = typeof data.country === "string" ? data.country.trim().toUpperCase() : "";
    return /^[A-Z]{2}$/.test(code) && code !== "XX" ? code : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function apiLocaleDetect(hint?: string | null): Promise<LocaleDetectResponse> {
  const qs = hint ? `?hint=${encodeURIComponent(hint)}` : "";
  return apiRequest<LocaleDetectResponse>(`/api/locale/detect.php${qs}`, {
    auth: false,
    skipUnauthorized: true,
    timeoutMs: 6000,
  });
}

export async function apiFxRates(): Promise<FxRatesResponse> {
  return apiRequest<FxRatesResponse>("/api/fx/rates.php", {
    auth: false,
    skipUnauthorized: true,
    timeoutMs: 6000,
  });
}
