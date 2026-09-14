/** Shared helpers for finance / directory CSV bulk import. */

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export function headerKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_/().]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function columnIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map(headerKey);
  for (const alias of aliases) {
    const idx = normalized.indexOf(headerKey(alias));
    if (idx >= 0) return idx;
  }
  return -1;
}

export function cell(cells: string[], idx: number): string {
  if (idx < 0) return "";
  return (cells[idx] ?? "").trim();
}

export function isExcelFilename(name: string): boolean {
  return /\.xlsx?$/i.test(name.trim());
}

export function parseCsvMoney(raw: string): number {
  const cleaned = String(raw ?? "")
    .replace(/₹/g, "")
    .replace(/rs\.?/gi, "")
    .replace(/inr/gi, "")
    .replace(/,/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (!cleaned) return 0;
  const n = Number(cleaned.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export function parsePaymentMode(raw: string): "Bank" | "Cash" | "Both" | "" {
  const v = headerKey(raw);
  if (!v) return "";
  if (/\bboth\b|\bsplit\b/.test(v)) return "Both";
  if (/\bcash\b/.test(v)) return "Cash";
  if (/\bbank\b|\bneft\b|\brtgs\b|\bupi\b|\bcheque\b|\bonline\b|\bimps\b/.test(v)) return "Bank";
  return "";
}

/**
 * Parse school-register dates as Indian calendar values (DD/MM/YYYY).
 * Two-digit years: 00–69 → 2000s, 70–99 → 1900s.
 */
export function parseIndianDate(raw: string): Date | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;

  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T].*)?$/);
  if (iso) {
    return civilDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const numbered = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/);
  if (numbered) {
    const day = Number(numbered[1]);
    const month = Number(numbered[2]);
    const year = expandYear(Number(numbered[3]));
    return civilDate(year, month, day);
  }

  const named = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s*,?\s+(\d{2}|\d{4})$/);
  if (named) {
    const month = monthIndex(named[2]);
    if (month < 0) return null;
    return civilDate(expandYear(Number(named[3])), month + 1, Number(named[1]));
  }

  return null;
}

export function csvDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function normalizePersonKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function looksLikeTotalRow(cells: string[]): boolean {
  const joined = cells.map(headerKey).join(" ");
  return /\b(grand total|total expenses|total amount)\b/.test(joined);
}

export function looksLikeTitleRow(cells: string[]): boolean {
  const filled = cells.filter((c) => c.trim());
  if (filled.length !== 1) return false;
  const text = filled[0] ?? "";
  return text.length > 24 && !/\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(text);
}

export async function importRowsSequentially<T>(
  rows: T[],
  fn: (row: T, index: number) => Promise<void>,
  onProgress?: (current: number, total: number) => void,
): Promise<{ ok: number; failed: number }> {
  let ok = 0;
  let failed = 0;
  const total = rows.length;
  for (let i = 0; i < total; i++) {
    onProgress?.(i + 1, total);
    try {
      await fn(rows[i] as T, i);
      ok += 1;
    } catch {
      failed += 1;
    }
  }
  return { ok, failed };
}

export function chunkItems<T>(items: T[], size: number): T[][] {
  const n = Math.max(1, size);
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += n) {
    out.push(items.slice(i, i + n));
  }
  return out;
}

function expandYear(year: number): number {
  if (year >= 100) return year;
  return year >= 70 ? 1900 + year : 2000 + year;
}

function monthIndex(token: string): number {
  const key = token.trim().toLowerCase();
  const full = MONTH_NAMES.findIndex((name) => name === key || name.startsWith(key.slice(0, 3)));
  return full;
}

function civilDate(year: number, month: number, day: number): Date | null {
  if (!year || year < 1970 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day, 10, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}
