import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  apiFxRates,
  apiLocaleDetect,
  fetchGeoHint,
  type LocaleDetectResponse,
} from "@/lib/api/locale";
import {
  type CurrencyCode,
  COUNTRY_LABELS,
  currencyForCountry,
  DEFAULT_LOCALE,
  isCurrencyCode,
  safeStorage,
  STORAGE_KEYS,
} from "@/lib/locale/currencies";
import { type FxRates, marketingDisplay } from "@/lib/locale/marketing-price";
import { formatMoney, setMoneyDefaults } from "@/lib/money";

type LocaleContextValue = {
  /** Visitor display currency (geo or manual). In-app books use the org currency instead. */
  currency: CurrencyCode;
  country: string;
  countryLabel: string;
  isAuto: boolean;
  detected: LocaleDetectResponse | null;
  detecting: boolean;
  fxRates: FxRates | null;
  fxSource: "live" | "static" | null;
  setCurrency: (currency: CurrencyCode) => void;
  setCountry: (country: string) => void;
  resetToAuto: () => void;
  /** Format an amount already denominated in `overrideCurrency` (defaults to visitor currency). */
  formatDisplayMoney: (amount: number, overrideCurrency?: CurrencyCode) => string;
  /** Convert an INR marketing price with live FX, then format. Falls back to ₹ when a rate is missing. */
  formatMarketingFromInr: (amountInr: number) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStored() {
  const currency = safeStorage.get(STORAGE_KEYS.currency);
  const country = safeStorage.get(STORAGE_KEYS.country);
  return {
    currency: isCurrencyCode(currency) ? currency : DEFAULT_LOCALE.currency,
    country: country && /^[A-Z]{2}$/.test(country) ? country : DEFAULT_LOCALE.country,
    manual: safeStorage.get(STORAGE_KEYS.manual) === "1",
  };
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readStored);
  const [currency, setCurrencyState] = useState<CurrencyCode>(initial.currency);
  const [country, setCountryState] = useState<string>(initial.country);
  const [isAuto, setIsAuto] = useState<boolean>(!initial.manual);

  const detectQuery = useQuery({
    queryKey: ["locale", "detect"],
    queryFn: async () => apiLocaleDetect(await fetchGeoHint()),
    staleTime: 12 * 60 * 60 * 1000,
    gcTime: 12 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const fxQuery = useQuery({
    queryKey: ["locale", "fx"],
    queryFn: apiFxRates,
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: 6 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const detected = detectQuery.data ?? null;

  useEffect(() => {
    if (!isAuto || !detected) return;
    if (isCurrencyCode(detected.currency)) setCurrencyState(detected.currency);
    if (detected.country) setCountryState(detected.country);
  }, [isAuto, detected]);

  useEffect(() => {
    safeStorage.set(STORAGE_KEYS.currency, currency);
    safeStorage.set(STORAGE_KEYS.country, country);
    safeStorage.set(STORAGE_KEYS.manual, isAuto ? null : "1");
    setMoneyDefaults(currency, detected?.language);
  }, [currency, country, isAuto, detected?.language]);

  const setCurrency = useCallback((next: CurrencyCode) => {
    setIsAuto(false);
    setCurrencyState(next);
  }, []);

  const setCountry = useCallback((next: string) => {
    const code = next.toUpperCase();
    setIsAuto(false);
    setCountryState(code);
    setCurrencyState(currencyForCountry(code));
  }, []);

  const resetToAuto = useCallback(() => {
    setIsAuto(true);
    setCurrencyState(
      detected && isCurrencyCode(detected.currency) ? detected.currency : DEFAULT_LOCALE.currency,
    );
    setCountryState(detected?.country ?? DEFAULT_LOCALE.country);
  }, [detected]);

  const fxRates = fxQuery.data?.rates ?? null;

  const formatDisplayMoney = useCallback(
    (amount: number, overrideCurrency?: CurrencyCode) =>
      formatMoney(amount, overrideCurrency ?? currency),
    [currency],
  );

  const formatMarketingFromInr = useCallback(
    (amountInr: number) => {
      const shown = marketingDisplay(amountInr, currency, fxRates);
      return formatMoney(shown.amount, shown.currency);
    },
    [currency, fxRates],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      currency,
      country,
      countryLabel: COUNTRY_LABELS[country] ?? detected?.localeLabel ?? country,
      isAuto,
      detected,
      detecting: detectQuery.isLoading,
      fxRates,
      fxSource: fxQuery.data?.source ?? null,
      setCurrency,
      setCountry,
      resetToAuto,
      formatDisplayMoney,
      formatMarketingFromInr,
    }),
    [
      currency,
      country,
      isAuto,
      detected,
      detectQuery.isLoading,
      fxRates,
      fxQuery.data?.source,
      setCurrency,
      setCountry,
      resetToAuto,
      formatDisplayMoney,
      formatMarketingFromInr,
    ],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}
