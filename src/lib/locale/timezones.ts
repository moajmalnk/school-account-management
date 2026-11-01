import { useEffect, useState } from "react";

/** Organization base timezones (IANA). Used for Backup schedule wall-clock times. */

export type TimezoneCode =
  | "Asia/Kolkata"
  | "Asia/Dubai"
  | "Asia/Riyadh"
  | "Asia/Qatar"
  | "Asia/Kuwait"
  | "Asia/Singapore"
  | "Asia/Kuala_Lumpur"
  | "Europe/London"
  | "UTC"
  | "America/New_York";

export type TimezoneOption = {
  code: TimezoneCode;
  label: string;
  short: string;
};

export const TIMEZONES: TimezoneOption[] = [
  { code: "Asia/Kolkata", label: "India (IST)", short: "IST" },
  { code: "Asia/Dubai", label: "UAE (GST)", short: "GST" },
  { code: "Asia/Riyadh", label: "Saudi Arabia (AST)", short: "AST" },
  { code: "Asia/Qatar", label: "Qatar (AST)", short: "AST" },
  { code: "Asia/Kuwait", label: "Kuwait (AST)", short: "AST" },
  { code: "Asia/Singapore", label: "Singapore (SGT)", short: "SGT" },
  { code: "Asia/Kuala_Lumpur", label: "Malaysia (MYT)", short: "MYT" },
  { code: "Europe/London", label: "United Kingdom (UK)", short: "UK" },
  { code: "UTC", label: "UTC", short: "UTC" },
  { code: "America/New_York", label: "US Eastern", short: "ET" },
];

export const DEFAULT_TIMEZONE: TimezoneCode = "Asia/Kolkata";

const STORAGE_KEY = "school-accounts/locale/org-timezone";

export function isTimezoneCode(value: unknown): value is TimezoneCode {
  return typeof value === "string" && TIMEZONES.some((t) => t.code === value);
}

export function normalizeTimezone(value: unknown, fallback: TimezoneCode = DEFAULT_TIMEZONE): TimezoneCode {
  return isTimezoneCode(value) ? value : fallback;
}

export function timezoneOption(code: TimezoneCode): TimezoneOption {
  return TIMEZONES.find((t) => t.code === code) ?? TIMEZONES[0]!;
}

export function timezonePickerLabel(opt: TimezoneOption): string {
  return `${opt.short} — ${opt.label}`;
}

export function getOrgTimezone(): TimezoneCode {
  if (typeof window === "undefined") return DEFAULT_TIMEZONE;
  try {
    return normalizeTimezone(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function setOrgTimezone(value: unknown): TimezoneCode {
  const next = normalizeTimezone(value);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent("feezo-org-timezone", { detail: next }));
    } catch {
      // ignore
    }
  }
  return next;
}

export function useOrgTimezone(): TimezoneCode {
  const [tz, setTz] = useState<TimezoneCode>(() => getOrgTimezone());
  useEffect(() => {
    const sync = () => setTz(getOrgTimezone());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) sync();
    };
    window.addEventListener("feezo-org-timezone", sync as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("feezo-org-timezone", sync as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return tz;
}
