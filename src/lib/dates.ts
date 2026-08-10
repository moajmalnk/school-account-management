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
