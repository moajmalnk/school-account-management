import type { CurrencyCode } from "@/lib/locale/currencies";

export type FxRates = Partial<Record<CurrencyCode, number>>;

/**
 * Marketing/plan prices are defined in INR and converted for display only.
 * Returns the INR amount unchanged when the rate is missing or invalid —
 * callers must then label it as INR (see `marketingDisplay`).
 */
export function convertMarketingPrice(
  amountInr: number,
  currency: CurrencyCode,
  rates: FxRates | null | undefined,
): number {
  if (currency === "INR") return amountInr;
  const rate = rates?.[currency];
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) return amountInr;
  return Math.round(amountInr * rate);
}

/** Converted amount plus the currency it is actually denominated in. */
export function marketingDisplay(
  amountInr: number,
  currency: CurrencyCode,
  rates: FxRates | null | undefined,
): { amount: number; currency: CurrencyCode; converted: boolean } {
  if (currency === "INR") return { amount: amountInr, currency: "INR", converted: false };
  const rate = rates?.[currency];
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    return { amount: amountInr, currency: "INR", converted: false };
  }
  return { amount: convertMarketingPrice(amountInr, currency, rates), currency, converted: true };
}
