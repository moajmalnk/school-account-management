/** Shared date parse / format helpers (DOB, ledgers, pickers). */

/** App-wide wall clock — India Standard Time (UTC+05:30). */
export const APP_TIMEZONE = "Asia/Kolkata";
export const APP_LOCALE = "en-IN";
const APP_OFFSET = "+05:30";

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** True for MySQL zero-dates and empty placeholders. */
export function isBlankDate(value?: string | null): boolean {
  const v = (value ?? "").trim();
  if (!v) return true;
  return /^0{4}-0{2}-0{2}/.test(v) || v.startsWith("0000-00-00");
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse ISO `YYYY-MM-DD` or display `14 Mar 2012` / `14 Mar, 2012`. */
export function parseFlexibleDate(value?: string | null): Date | null {
  if (!value || isBlankDate(value)) return null;
  const trimmed = value.trim();

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    if (!y || !m || !d) return null;
    const date = new Date(y, m - 1, d);
    if (
      date.getFullYear() !== y ||
      date.getMonth() !== m - 1 ||
      date.getDate() !== d
    ) {
      return null;
    }
    return date;
  }

  const display = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3}),?\s+(\d{4})$/);
  if (!display) return null;
  const day = Number(display[1]);
  const monthIdx = MONTH_ABBR.findIndex(
    (m) => m.toLowerCase() === display[2].toLowerCase(),
  );
  const year = Number(display[3]);
  if (monthIdx < 0 || !day || !year) return null;
  const date = new Date(year, monthIdx, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIdx ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/** Normalize any supported DOB string to `YYYY-MM-DD` (or undefined). */
export function toDobIso(value?: string | null): string | undefined {
  const parsed = parseFlexibleDate(value);
  return parsed ? toIsoDate(parsed) : undefined;
}

/** Profile / print-friendly DOB label. */
export function formatDobDisplay(value?: string | null): string {
  const parsed = parseFlexibleDate(value);
  if (!parsed) return "";
  return `${parsed.getDate()} ${MONTH_ABBR[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function partsInAppZone(date: Date): {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hours: Number(map.hour),
    minutes: Number(map.minute),
    seconds: Number(map.second),
  };
}

function calendarDayKey(d: Date): string {
  const p = partsInAppZone(d);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

function dayDiffFrom(reference: Date, value: Date): number {
  const [ay, am, ad] = calendarDayKey(reference).split("-").map(Number);
  const [by, bm, bd] = calendarDayKey(value).split("-").map(Number);
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86_400_000);
}

function formatClock24(d: Date): string {
  const p = partsInAppZone(d);
  return `${pad2(p.hours)}:${pad2(p.minutes)}`;
}

/** Parse a naive SQL/ISO stamp as Asia/Kolkata, or an offset stamp as an instant. */
export function parseAppInstant(raw?: string | null): Date | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed || isBlankDate(trimmed)) return null;
  const naive = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/,
  );
  if (naive) {
    const iso = `${naive[1]}-${naive[2]}-${naive[3]}T${naive[4]}:${naive[5]}:${naive[6] ?? "00"}${APP_OFFSET}`;
    const date = new Date(iso);
    return Number.isFinite(date.getTime()) && date.getFullYear() >= 1970 ? date : null;
  }
  const parsed = Date.parse(trimmed.replace(" ", "T"));
  if (!Number.isFinite(parsed)) return null;
  const date = new Date(parsed);
  return date.getFullYear() >= 1970 ? date : null;
}

export function formatInAppZone(date: Date, options: Intl.DateTimeFormatOptions): string {
  return date.toLocaleString(APP_LOCALE, { timeZone: APP_TIMEZONE, ...options });
}

export function formatNow(options: Intl.DateTimeFormatOptions = {}): string {
  return formatInAppZone(new Date(), {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  });
}

/** Chat list / bubble stamps in Asia/Kolkata. */
export function formatChatStamp(raw: string, variant: "list" | "bubble" = "list"): string {
  const date = parseAppInstant(raw);
  if (!date) return raw;
  if (variant === "bubble" && calendarDayKey(date) === calendarDayKey(new Date())) {
    return formatInAppZone(date, { hour: "numeric", minute: "2-digit", hour12: true });
  }
  return formatInAppZone(date, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function extractClock(raw: string, fallback: Date): { hours: number; minutes: number; seconds: number; found: boolean } {
  const match = raw.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) {
    const p = partsInAppZone(fallback);
    return {
      hours: p.hours,
      minutes: p.minutes,
      seconds: p.seconds,
      found: false,
    };
  }
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);
  const meridiem = match[4]?.toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  return { hours, minutes, seconds, found: true };
}

function eventSourceHasClock(raw: string): boolean {
  return /\d{1,2}:\d{2}/.test(raw);
}

/**
 * Parse receipt / disbursement stamps: SQL datetimes, ISO, "Today · 10:22",
 * "19 Aug 2026 · 13:47", "2d ago". MySQL zero-dates return null.
 */
export function parseEventDate(value?: string | Date | null, reference = new Date()): Date | null {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) && value.getFullYear() >= 1970 ? value : null;
  }
  const trimmed = (value ?? "").trim();
  if (!trimmed || isBlankDate(trimmed)) return null;

  const iso = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/,
  );
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    const hasTime = iso[4] != null;
    if (!y || y < 1970 || !m || !d) return null;
    if (!hasTime) {
      const date = new Date(y, m - 1, d);
      if (
        date.getFullYear() !== y ||
        date.getMonth() !== m - 1 ||
        date.getDate() !== d
      ) {
        return null;
      }
      return date;
    }
    const instant = parseAppInstant(trimmed);
    return instant;
  }

  const clock = extractClock(trimmed, reference);
  const lower = trimmed.toLowerCase();

  if (lower.startsWith("today")) {
    const p = partsInAppZone(reference);
    return parseAppInstant(
      `${p.year}-${pad2(p.month)}-${pad2(p.day)} ${pad2(clock.found ? clock.hours : 0)}:${pad2(clock.found ? clock.minutes : 0)}:${pad2(clock.found ? clock.seconds : 0)}`,
    );
  }
  if (lower.startsWith("yesterday")) {
    const p = partsInAppZone(new Date(reference.getTime() - 86_400_000));
    return parseAppInstant(
      `${p.year}-${pad2(p.month)}-${pad2(p.day)} ${pad2(clock.found ? clock.hours : 0)}:${pad2(clock.found ? clock.minutes : 0)}:${pad2(clock.found ? clock.seconds : 0)}`,
    );
  }

  const relative = trimmed.match(/^(\d+)\s*d(?:ays?)?\s*ago/i);
  if (relative) {
    const y = new Date(reference);
    y.setDate(y.getDate() - Number(relative[1]));
    return new Date(y.getFullYear(), y.getMonth(), y.getDate());
  }

  const datePart = trimmed.replace(/\s*[·|,]\s*.*$/, "").trim();
  const named = datePart.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s*,?\s+(\d{4})$/);
  if (named) {
    const day = Number(named[1]);
    const monthToken = named[2].slice(0, 3).toLowerCase();
    const monthIdx = MONTH_ABBR.findIndex((m) => m.toLowerCase() === monthToken);
    const year = Number(named[3]);
    if (monthIdx >= 0 && day && year >= 1970) {
      const date = new Date(
        year,
        monthIdx,
        day,
        clock.found ? clock.hours : 0,
        clock.found ? clock.minutes : 0,
        clock.found ? clock.seconds : 0,
      );
      if (
        date.getFullYear() === year &&
        date.getMonth() === monthIdx &&
        date.getDate() === day
      ) {
        return date;
      }
    }
  }

  const parsed = Date.parse(trimmed);
  if (Number.isFinite(parsed)) {
    const date = new Date(parsed);
    return date.getFullYear() >= 1970 ? date : null;
  }
  return null;
}

function labelForDate(date: Date, reference: Date, includeClock: boolean): string {
  const diff = dayDiffFrom(reference, date);
  const clock = formatClock24(date);
  if (diff === 0) return includeClock ? `Today · ${clock}` : "Today";
  if (diff === 1) return includeClock ? `Yesterday · ${clock}` : "Yesterday";
  const p = partsInAppZone(date);
  const day = `${p.day} ${MONTH_ABBR[p.month - 1]} ${p.year}`;
  return includeClock ? `${day} · ${clock}` : day;
}

/** Date-only ledger label · "19 Aug 2026" / "Today" / "—". */
export function formatEventDate(value?: string | Date | null, reference = new Date()): string {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? labelForDate(value, reference, false) : "—";
  }
  const raw = (value ?? "").trim();
  if (!raw || isBlankDate(raw)) return "—";
  const parsed = parseEventDate(raw, reference);
  if (!parsed) return /^0{4}-0{2}-0{2}/.test(raw) ? "—" : raw.replace(/\s*·\s*.*$/, "").trim() || "—";
  return labelForDate(parsed, reference, false);
}

/** Receipt TIME label · "Today · 13:47" / "19 Aug 2026 · 13:47" / "—". */
export function formatEventDateTime(value?: string | Date | null, reference = new Date()): string {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? labelForDate(value, reference, true) : "—";
  }
  const raw = (value ?? "").trim();
  if (!raw || isBlankDate(raw)) return "—";
  const parsed = parseEventDate(raw, reference);
  if (!parsed) return /^0{4}-0{2}-0{2}/.test(raw) ? "—" : raw;
  const p = partsInAppZone(parsed);
  const includeClock =
    eventSourceHasClock(raw) || p.hours !== 0 || p.minutes !== 0 || p.seconds !== 0;
  return labelForDate(parsed, reference, includeClock);
}

/** Persistable MySQL DATETIME in Asia/Kolkata. */
export function toSqlDateTime(value?: string | Date | null, fallback = new Date()): string {
  const parsed =
    value instanceof Date
      ? Number.isFinite(value.getTime())
        ? value
        : fallback
      : (parseEventDate(value, fallback) ?? fallback);
  const p = partsInAppZone(parsed);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)} ${pad2(p.hours)}:${pad2(p.minutes)}:${pad2(p.seconds)}`;
}

export function isEventToday(value?: string | Date | null, reference = new Date()): boolean {
  const parsed = value instanceof Date ? value : parseEventDate(value, reference);
  if (!parsed) return false;
  return calendarDayKey(parsed) === calendarDayKey(reference);
}
