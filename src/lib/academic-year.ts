/** Academic-year bounds, filtering, and student year-ledger helpers. */

export type StudentYearFields = {
  cls: string;
  due: number;
  active: boolean;
};

export type StudentYearLedger = {
  academicYear: string;
  byStudentId: Record<string, StudentYearFields>;
};

export type AcademicYearBounds = {
  startYear: number;
  endYear: number;
  startDate: string;
  endDate: string;
};

export const CALENDAR_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const MONTH_NAME_INDEX: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function monthIndexFromName(raw: string): number | null {
  const key = raw.trim().toLowerCase();
  return MONTH_NAME_INDEX[key] ?? null;
}

/** `2026 June` — start month of the 12-month books. */
export function formatBooksYearLabel(year: number, month: number): string {
  const name = CALENDAR_MONTHS[month - 1];
  if (!name || !Number.isFinite(year)) return "";
  return `${year} ${name}`;
}

export function monthKeyToBooksYearLabel(key: string): string | null {
  const match = /^(\d{4})-(\d{2})$/.exec(key.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!year || month < 1 || month > 12) return null;
  return formatBooksYearLabel(year, month);
}

export function booksYearToMonthKey(year: number, month: number): string {
  return `${year}-${pad2(month)}`;
}

function boundsFromStartMonth(startYear: number, month: number): AcademicYearBounds | null {
  if (!startYear || month < 1 || month > 12) return null;
  const endMonth = month === 1 ? 12 : month - 1;
  const endYear = month === 1 ? startYear : startYear + 1;
  return {
    startYear,
    endYear,
    startDate: `${startYear}-${pad2(month)}-01`,
    endDate: `${endYear}-${pad2(endMonth)}-${pad2(lastDayOfMonth(endYear, endMonth))}`,
  };
}

/** Parse `AY 2025-26`, `2026-06`, or `2026 June` into a 12-month books window. */
export function parseAcademicYearBounds(label: string): AcademicYearBounds | null {
  const trimmed = label.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;

  const monthKey = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (monthKey) {
    const month = Number(monthKey[2]);
    if (month >= 1 && month <= 12) {
      return boundsFromStartMonth(Number(monthKey[1]), month);
    }
  }

  const named =
    trimmed.match(/^(?:AY\s*)?(\d{4})\s+([A-Za-z]+)$/i) ||
    trimmed.match(/^(?:AY\s*)?([A-Za-z]+)\s+(\d{4})$/i);
  if (named) {
    const yearToken = /^\d{4}$/.test(named[1]) ? named[1] : named[2];
    const monthToken = /^\d{4}$/.test(named[1]) ? named[2] : named[1];
    const month = monthIndexFromName(monthToken);
    if (month) return boundsFromStartMonth(Number(yearToken), month);
  }

  const match = trimmed.match(/^(?:AY\s*)?(\d{4})\s*[-–/]\s*(\d{2}|\d{4})$/i);
  if (!match) return null;
  const startYear = Number(match[1]);
  const endRaw = match[2];
  const endYear = endRaw.length === 4 ? Number(endRaw) : 2000 + Number(endRaw);
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return null;
  if (endYear !== startYear && endYear !== startYear + 1) return null;
  return {
    startYear,
    endYear,
    startDate: `${startYear}-04-01`,
    endDate: `${endYear}-03-31`,
  };
}

export function parseBooksYearParts(label: string): { year: number; month: number } | null {
  const bounds = parseAcademicYearBounds(label);
  if (!bounds) return null;
  const month = Number(bounds.startDate.slice(5, 7));
  if (!month) return null;
  return { year: bounds.startYear, month };
}

export function suggestNextBooksMonthKey(currentLabel: string, extraYears: string[] = []): string {
  const source = [currentLabel, ...extraYears].map(parseBooksYearParts).find(Boolean);
  if (source) return booksYearToMonthKey(source.year + 1, source.month);
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
  return booksYearToMonthKey(year, 4);
}

export function academicYearCoverageCaption(label: string): string | null {
  const bounds = parseAcademicYearBounds(label);
  if (!bounds) return null;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso;
    return `${d} ${months[m - 1]} ${y}`;
  };
  return `${fmt(bounds.startDate)} – ${fmt(bounds.endDate)}`;
}

/** Normalize typed or picker input into a stored books label. */
export function normalizeAcademicYearLabel(input: string): string | null {
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;

  const named =
    trimmed.match(/^(?:AY\s*)?(\d{4})\s+([A-Za-z]+)$/i) ||
    trimmed.match(/^(?:AY\s*)?([A-Za-z]+)\s+(\d{4})$/i);
  if (named) {
    const yearToken = /^\d{4}$/.test(named[1]) ? named[1] : named[2];
    const monthToken = /^\d{4}$/.test(named[1]) ? named[2] : named[1];
    const month = monthIndexFromName(monthToken);
    if (month) return formatBooksYearLabel(Number(yearToken), month);
  }

  const monthKey = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (monthKey) {
    const month = Number(monthKey[2]);
    if (month >= 1 && month <= 12) {
      return formatBooksYearLabel(Number(monthKey[1]), month);
    }
  }

  const match = trimmed.match(/^(?:AY\s*)?(\d{4})\s*[-–/]\s*(\d{2}|\d{4})$/i);
  if (!match) return null;
  const start = Number(match[1]);
  const endRaw = match[2];
  const endYear = endRaw.length === 4 ? Number(endRaw) : 2000 + Number(endRaw);
  if (!Number.isFinite(start) || !Number.isFinite(endYear)) return null;
  if (endYear !== start && endYear !== start + 1) return null;
  return `AY ${start}-${String(endYear).slice(-2)}`;
}

export function filterByAcademicYear<T extends { academicYear?: string }>(
  items: T[],
  year: string,
): T[] {
  return items.filter((item) => (item.academicYear ?? "") === year);
}

export function ensureYearLedger(
  ledgers: StudentYearLedger[],
  year: string,
): StudentYearLedger[] {
  if (ledgers.some((l) => l.academicYear === year)) return ledgers;
  return [...ledgers, { academicYear: year, byStudentId: {} }];
}

export function getYearLedger(
  ledgers: StudentYearLedger[],
  year: string,
): StudentYearLedger {
  return (
    ledgers.find((l) => l.academicYear === year) ?? {
      academicYear: year,
      byStudentId: {},
    }
  );
}

export function upsertStudentYearFields(
  ledgers: StudentYearLedger[],
  year: string,
  studentId: string,
  fields: StudentYearFields,
): StudentYearLedger[] {
  const ensured = ensureYearLedger(ledgers, year);
  return ensured.map((ledger) => {
    if (ledger.academicYear !== year) return ledger;
    return {
      ...ledger,
      byStudentId: {
        ...ledger.byStudentId,
        [studentId]: {
          cls: fields.cls,
          due: Math.max(0, Math.round(fields.due)),
          active: fields.active,
        },
      },
    };
  });
}

export function removeStudentFromYearLedger(
  ledgers: StudentYearLedger[],
  year: string,
  studentId: string,
): StudentYearLedger[] {
  return ledgers.map((ledger) => {
    if (ledger.academicYear !== year) return ledger;
    if (!(studentId in ledger.byStudentId)) return ledger;
    const { [studentId]: _removed, ...rest } = ledger.byStudentId;
    return { ...ledger, byStudentId: rest };
  });
}

/** Shift ISO YYYY-MM-DD by `deltaYears` calendar years. */
export function shiftIsoDateYears(iso: string | undefined, deltaYears: number): string | undefined {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const y = Number(iso.slice(0, 4)) + deltaYears;
  return `${y}${iso.slice(4)}`;
}

export function academicYearStartYear(label: string): number | null {
  return parseAcademicYearBounds(label)?.startYear ?? null;
}

/** Clone fee-period templates from `fromYear` into `toYear`, shifting dates. */
export function cloneFeeTermsForYear<T extends {
  id: string;
  startDate?: string;
  endDate?: string;
  coverage?: string;
  academicYear?: string;
}>(
  terms: T[],
  fromYear: string,
  toYear: string,
  idPrefix: string,
): T[] {
  const fromStart = academicYearStartYear(fromYear);
  const toStart = academicYearStartYear(toYear);
  if (fromStart == null || toStart == null) return [];
  const delta = toStart - fromStart;
  const source = filterByAcademicYear(terms, fromYear);
  return source.map((term, index) => {
    const startDate = shiftIsoDateYears(term.startDate, delta);
    const endDate = shiftIsoDateYears(term.endDate, delta);
    const coverage =
      startDate && endDate
        ? formatShiftedCoverage(startDate, endDate)
        : term.coverage;
    return {
      ...term,
      id: `${idPrefix}-${index + 1}`,
      academicYear: toYear,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(coverage ? { coverage } : {}),
    };
  });
}

function formatShiftedCoverage(startDate: string, endDate: string): string {
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    const months = [
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
    ];
    return `${d} ${months[m - 1]} ${y}`;
  };
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

export function academicYearBookStats(input: {
  payments: { academicYear?: string }[];
  ledgers: StudentYearLedger[];
  year: string;
}): { receipts: number; enrolled: number } {
  const receipts = filterByAcademicYear(input.payments, input.year).length;
  const enrolled = Object.keys(getYearLedger(input.ledgers, input.year).byStudentId).length;
  return { receipts, enrolled };
}

export function yearHasBookData(input: {
  payments: { academicYear?: string }[];
  feeTerms: { academicYear?: string }[];
  ledgers: StudentYearLedger[];
  year: string;
}): boolean {
  if (filterByAcademicYear(input.payments, input.year).length > 0) return true;
  if (filterByAcademicYear(input.feeTerms, input.year).length > 0) return true;
  const ledger = getYearLedger(input.ledgers, input.year);
  return Object.keys(ledger.byStudentId).length > 0;
}

export function buildLedgerFromStudents<T extends {
  id: string;
  cls: string;
  due: number;
  active?: boolean;
  deletedAt?: string;
}>(students: T[], year: string): StudentYearLedger {
  const byStudentId: Record<string, StudentYearFields> = {};
  for (const s of students) {
    if (s.deletedAt) continue;
    byStudentId[s.id] = {
      cls: s.cls,
      due: s.due,
      active: s.active !== false,
    };
  }
  return { academicYear: year, byStudentId };
}

/** Drop ledger rows for students that no longer exist (or are soft-deleted). */
export function pruneLedgersToStudents<T extends { id: string; deletedAt?: string }>(
  ledgers: StudentYearLedger[],
  students: T[],
): StudentYearLedger[] {
  const liveIds = new Set(students.filter((s) => !s.deletedAt).map((s) => s.id));
  return ledgers.map((ledger) => {
    const byStudentId: Record<string, StudentYearFields> = {};
    for (const [id, fields] of Object.entries(ledger.byStudentId)) {
      if (liveIds.has(id)) byStudentId[id] = fields;
    }
    return { ...ledger, byStudentId };
  });
}

/**
 * Prefer ledgers from `preferred` per academic year; keep unique years from `fallback`.
 */
export function mergeStudentYearLedgers(
  preferred: StudentYearLedger[],
  fallback: StudentYearLedger[],
): StudentYearLedger[] {
  const byYear = new Map<string, StudentYearLedger>();
  for (const ledger of fallback) {
    if (!ledger.academicYear) continue;
    byYear.set(ledger.academicYear, ledger);
  }
  for (const ledger of preferred) {
    if (!ledger.academicYear) continue;
    byYear.set(ledger.academicYear, ledger);
  }
  return Array.from(byYear.values());
}

/**
 * On hydrate: ensure the active year has a ledger book.
 * Empty books stay empty — never dump the global student list into one year
 * (that wiped other years and leaked counts across AY switches).
 * Bootstrap from the student list only when no year ledgers exist at all.
 */
export function reconcileLedgersWithStudents<T extends {
  id: string;
  cls: string;
  due: number;
  active?: boolean;
  deletedAt?: string;
}>(
  students: T[],
  ledgers: StudentYearLedger[],
  year: string,
): StudentYearLedger[] {
  if (ledgers.length === 0) {
    const live = students.filter((s) => !s.deletedAt);
    if (live.length > 0) return [buildLedgerFromStudents(live, year)];
    return [{ academicYear: year, byStudentId: {} }];
  }
  return ensureYearLedger(pruneLedgersToStudents(ledgers, students), year);
}

export function applyLedgerToStudent<T extends {
  id: string;
  cls: string;
  due: number;
  active?: boolean;
}>(student: T, fields: StudentYearFields | undefined): T {
  if (!fields) return student;
  return {
    ...student,
    cls: fields.cls,
    due: fields.due,
    active: fields.active,
  };
}

export function studentsForAcademicYear<T extends {
  id: string;
  cls: string;
  due: number;
  active?: boolean;
  deletedAt?: string;
}>(students: T[], ledgers: StudentYearLedger[], year: string): T[] {
  const ledger = getYearLedger(ledgers, year);
  const out: T[] = [];
  for (const [studentId, fields] of Object.entries(ledger.byStudentId)) {
    const base = students.find((s) => s.id === studentId);
    if (!base || base.deletedAt) continue;
    out.push(applyLedgerToStudent(base, fields));
  }
  return out;
}

/** Sync year-scoped fields from a student list into the active year ledger (enrolled only). */
export function syncLedgerFromActiveStudents<T extends {
  id: string;
  cls: string;
  due: number;
  active?: boolean;
}>(
  ledgers: StudentYearLedger[],
  year: string,
  activeStudents: T[],
): StudentYearLedger[] {
  const byStudentId: Record<string, StudentYearFields> = {};
  for (const s of activeStudents) {
    byStudentId[s.id] = {
      cls: s.cls,
      due: s.due,
      active: s.active !== false,
    };
  }
  const ensured = ensureYearLedger(ledgers, year);
  return ensured.map((ledger) =>
    ledger.academicYear === year ? { academicYear: year, byStudentId } : ledger,
  );
}
