/** Shared date parse / format helpers (DOB, ledgers, pickers). */

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

function calendarDayKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function dayDiffFrom(reference: Date, value: Date): number {
  const startRef = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const startVal = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  return Math.round((startRef.getTime() - startVal.getTime()) / 86_400_000);
}

function formatClock24(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function extractClock(raw: string, fallback: Date): { hours: number; minutes: number; seconds: number; found: boolean } {
  const match = raw.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) {
    return {
      hours: fallback.getHours(),
      minutes: fallback.getMinutes(),
      seconds: fallback.getSeconds(),
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
    const h = Number(iso[4] ?? 0);
    const mi = Number(iso[5] ?? 0);
    const s = Number(iso[6] ?? 0);
    if (!y || y < 1970 || !m || !d) return null;
    const date = new Date(y, m - 1, d, h, mi, s);
    if (
      date.getFullYear() !== y ||
      date.getMonth() !== m - 1 ||
      date.getDate() !== d
    ) {
      return null;
    }
    return date;
  }

  const clock = extractClock(trimmed, reference);
  const lower = trimmed.toLowerCase();

  if (lower.startsWith("today")) {
    return new Date(
      reference.getFullYear(),
      reference.getMonth(),
      reference.getDate(),
      clock.found ? clock.hours : 0,
      clock.found ? clock.minutes : 0,
      clock.found ? clock.seconds : 0,
    );
  }
  if (lower.startsWith("yesterday")) {
    const y = new Date(reference);
    y.setDate(y.getDate() - 1);
    return new Date(
      y.getFullYear(),
      y.getMonth(),
      y.getDate(),
      clock.found ? clock.hours : 0,
      clock.found ? clock.minutes : 0,
      clock.found ? clock.seconds : 0,
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
  const day = `${date.getDate()} ${MONTH_ABBR[date.getMonth()]} ${date.getFullYear()}`;
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
  const includeClock =
    eventSourceHasClock(raw) ||
    parsed.getHours() !== 0 ||
    parsed.getMinutes() !== 0 ||
    parsed.getSeconds() !== 0;
  return labelForDate(parsed, reference, includeClock);
}

/** Persistable MySQL DATETIME in local time. */
export function toSqlDateTime(value?: string | Date | null, fallback = new Date()): string {
  const parsed =
    value instanceof Date
      ? Number.isFinite(value.getTime())
        ? value
        : fallback
      : (parseEventDate(value, fallback) ?? fallback);
  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())} ${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}:${pad2(parsed.getSeconds())}`;
}

export function isEventToday(value?: string | Date | null, reference = new Date()): boolean {
  const parsed = value instanceof Date ? value : parseEventDate(value, reference);
  if (!parsed) return false;
  return calendarDayKey(parsed) === calendarDayKey(reference);
}
