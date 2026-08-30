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

export function parseMonthKey(key: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(key.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!year || month < 1 || month > 12) return null;
  return { year, month };
}

export function addMonthsToMonthKey(key: string, delta: number): string | null {
  const parts = parseMonthKey(key);
  if (!parts) return null;
  const abs = parts.year * 12 + (parts.month - 1) + delta;
  const year = Math.floor(abs / 12);
  const month = (abs % 12) + 1;
  return booksYearToMonthKey(year, month);
}

/** Default closing month: 11 months after start (12-month books). */
export function defaultClosingMonthKey(startKey: string): string {
  return addMonthsToMonthKey(startKey, 11) ?? startKey;
}

export function boundsFromMonthKeys(startKey: string, endKey: string): AcademicYearBounds | null {
  const start = parseMonthKey(startKey);
  const end = parseMonthKey(endKey);
  if (!start || !end) return null;
  if (endKey < startKey) return null;
  return {
    startYear: start.year,
    endYear: end.year,
    startDate: `${start.year}-${pad2(start.month)}-01`,
    endDate: `${end.year}-${pad2(end.month)}-${pad2(lastDayOfMonth(end.year, end.month))}`,
  };
}

export function formatBooksRangeLabel(startKey: string, endKey: string): string | null {
  const startLabel = monthKeyToBooksYearLabel(startKey);
  const endLabel = monthKeyToBooksYearLabel(endKey);
  if (!startLabel || !endLabel) return null;
  if (endKey < startKey) return null;
  return `${startLabel} – ${endLabel}`;
}

export function booksRangeKeysFromLabel(label: string): { start: string; end: string } | null {
  const bounds = parseAcademicYearBounds(label);
  if (!bounds) return null;
  return {
    start: bounds.startDate.slice(0, 7),
    end: bounds.endDate.slice(0, 7),
  };
}

function boundsFromStartMonth(startYear: number, month: number): AcademicYearBounds | null {
  if (!startYear || month < 1 || month > 12) return null;
  const startKey = booksYearToMonthKey(startYear, month);
  return boundsFromMonthKeys(startKey, defaultClosingMonthKey(startKey));
}

function namedMonthYear(
  yearToken: string,
  monthToken: string,
): { year: number; month: number } | null {
  const month = monthIndexFromName(monthToken);
  const year = Number(yearToken);
  if (!month || !Number.isFinite(year)) return null;
  return { year, month };
}

function parseNamedMonthYear(raw: string): { year: number; month: number } | null {
  const trimmed = raw.trim();
  const named =
    trimmed.match(/^(?:AY\s*)?(\d{4})\s+([A-Za-z]+)$/i) ||
    trimmed.match(/^(?:AY\s*)?([A-Za-z]+)\s+(\d{4})$/i);
  if (!named) return null;
  const yearToken = /^\d{4}$/.test(named[1]) ? named[1] : named[2];
  const monthToken = /^\d{4}$/.test(named[1]) ? named[2] : named[1];
  return namedMonthYear(yearToken, monthToken);
}

/** Parse `AY 2025-26`, `2026-06`, `2026 June`, or `2026 June – 2027 May`. */
export function parseAcademicYearBounds(label: string): AcademicYearBounds | null {
  const trimmed = label.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;

  const range = trimmed.match(
    /^(?:AY\s*)?(\d{4}\s+[A-Za-z]+|[A-Za-z]+\s+\d{4})\s*[–-]\s*(\d{4}\s+[A-Za-z]+|[A-Za-z]+\s+\d{4})$/i,
  );
  if (range) {
    const start = parseNamedMonthYear(range[1]);
    const end = parseNamedMonthYear(range[2]);
    if (start && end) {
      return boundsFromMonthKeys(
        booksYearToMonthKey(start.year, start.month),
        booksYearToMonthKey(end.year, end.month),
      );
    }
  }

  const monthKey = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (monthKey) {
    const month = Number(monthKey[2]);
    if (month >= 1 && month <= 12) {
      return boundsFromStartMonth(Number(monthKey[1]), month);
    }
  }

  const named = parseNamedMonthYear(trimmed);
  if (named) return boundsFromStartMonth(named.year, named.month);

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
  const bounds = [currentLabel, ...extraYears].map(parseAcademicYearBounds).find(Boolean);
  if (bounds) {
    const endKey = bounds.endDate.slice(0, 7);
    return addMonthsToMonthKey(endKey, 1) ?? booksYearToMonthKey(bounds.startYear + 1, 4);
  }
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
  return booksYearToMonthKey(year, 4);
}

export function academicYearCoverageCaption(label: string): string | null {
  const bounds = parseAcademicYearBounds(label);
  if (!bounds) return null;
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

  const rangeBounds = parseAcademicYearBounds(trimmed);
  if (
    trimmed.includes("–") ||
    /[A-Za-z]+\s+\d{4}\s*-\s*\d{4}\s+[A-Za-z]+/i.test(trimmed) ||
    /\d{4}\s+[A-Za-z]+\s*-\s*\d{4}\s+[A-Za-z]+/i.test(trimmed)
  ) {
    if (rangeBounds) {
      return formatBooksRangeLabel(
        rangeBounds.startDate.slice(0, 7),
        rangeBounds.endDate.slice(0, 7),
      );
    }
  }

  const named = parseNamedMonthYear(trimmed);
  if (named) return formatBooksYearLabel(named.year, named.month);

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

export function ensureYearLedger(ledgers: StudentYearLedger[], year: string): StudentYearLedger[] {
  if (ledgers.some((l) => l.academicYear === year)) return ledgers;
  return [...ledgers, { academicYear: year, byStudentId: {} }];
}

export function getYearLedger(ledgers: StudentYearLedger[], year: string): StudentYearLedger {
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
export function cloneFeeTermsForYear<
  T extends {
    id: string;
    startDate?: string;
    endDate?: string;
    coverage?: string;
    academicYear?: string;
  },
>(terms: T[], fromYear: string, toYear: string, idPrefix: string): T[] {
  const fromStart = academicYearStartYear(fromYear);
  const toStart = academicYearStartYear(toYear);
  if (fromStart == null || toStart == null) return [];
  const delta = toStart - fromStart;
  const source = filterByAcademicYear(terms, fromYear);
  return source.map((term, index) => {
    const startDate = shiftIsoDateYears(term.startDate, delta);
    const endDate = shiftIsoDateYears(term.endDate, delta);
    const coverage =
      startDate && endDate ? formatShiftedCoverage(startDate, endDate) : term.coverage;
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

export function buildLedgerFromStudents<
  T extends {
    id: string;
    cls: string;
    due: number;
    active?: boolean;
    deletedAt?: string;
  },
>(students: T[], year: string): StudentYearLedger {
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
 * When the API roster has students but no year enrollments exist yet (common for
 * live tenants — enrollments are client-side only), seed the active year so lists
 * and dashboards are not stuck at zero.
 *
 * Also auto-enrolls any live student missing from *every* year book into the
 * active year — keeps multi-device dashboards aligned when admits land on one
 * browser but another still has a stale partial ledger.
 */
export function reconcileLedgersWithStudents<
  T extends {
    id: string;
    cls: string;
    due: number;
    active?: boolean;
    deletedAt?: string;
  },
>(students: T[], ledgers: StudentYearLedger[], year: string): StudentYearLedger[] {
  const live = students.filter((s) => !s.deletedAt);

  let next: StudentYearLedger[];
  if (ledgers.length === 0) {
    return live.length > 0
      ? [buildLedgerFromStudents(live, year)]
      : [{ academicYear: year, byStudentId: {} }];
  }

  next = ensureYearLedger(pruneLedgersToStudents(ledgers, students), year);
  const activeLedger = getYearLedger(next, year);
  const activeEnrolled = Object.keys(activeLedger.byStudentId).length;

  if (activeEnrolled === 0 && live.length > 0) {
    const totalEnrolled = next.reduce(
      (sum, ledger) => sum + Object.keys(ledger.byStudentId).length,
      0,
    );
    const enrolledIds = new Set(next.flatMap((ledger) => Object.keys(ledger.byStudentId)));
    const rosterUnmapped = live.every((student) => !enrolledIds.has(student.id));

    const seedActiveYear = (byStudentId: Record<string, StudentYearFields>) =>
      next.map((ledger) =>
        ledger.academicYear === year ? { academicYear: year, byStudentId } : ledger,
      );

    if (totalEnrolled === 0 || rosterUnmapped) {
      next = seedActiveYear(buildLedgerFromStudents(live, year).byStudentId);
    } else {
      const source = next.reduce((best, ledger) =>
        Object.keys(ledger.byStudentId).length > Object.keys(best.byStudentId).length
          ? ledger
          : best,
      );
      const liveIds = new Set(live.map((student) => student.id));
      const carried: Record<string, StudentYearFields> = {};
      for (const [id, fields] of Object.entries(source.byStudentId)) {
        if (liveIds.has(id)) carried[id] = { ...fields };
      }
      next =
        Object.keys(carried).length === 0
          ? seedActiveYear(buildLedgerFromStudents(live, year).byStudentId)
          : seedActiveYear(carried);
    }
  }

  // Students present on the API roster but not enrolled in any year → active year.
  const enrolledAnywhere = new Set(next.flatMap((ledger) => Object.keys(ledger.byStudentId)));
  const missing = live.filter((s) => !enrolledAnywhere.has(s.id));
  if (missing.length === 0) return next;

  return next.map((ledger) => {
    if (ledger.academicYear !== year) return ledger;
    const byStudentId = { ...ledger.byStudentId };
    for (const s of missing) {
      byStudentId[s.id] = {
        cls: s.cls,
        due: s.due,
        active: s.active !== false,
      };
    }
    return { academicYear: year, byStudentId };
  });
}

/** Convert API `/students/year-fields` rows into per-year ledger books. */
export function ledgersFromYearFieldRows(
  rows: Array<{
    studentId?: string;
    academicYear?: string;
    cls?: string;
    due?: number;
    active?: boolean;
  }>,
): StudentYearLedger[] {
  const byYear = new Map<string, Record<string, StudentYearFields>>();
  for (const row of rows) {
    const studentId = typeof row.studentId === "string" ? row.studentId.trim() : "";
    const academicYear = typeof row.academicYear === "string" ? row.academicYear.trim() : "";
    if (!studentId || !academicYear) continue;
    const bucket = byYear.get(academicYear) ?? {};
    bucket[studentId] = {
      cls: typeof row.cls === "string" ? row.cls : "",
      due: typeof row.due === "number" && Number.isFinite(row.due) ? row.due : 0,
      active: row.active !== false,
    };
    byYear.set(academicYear, bucket);
  }
  return Array.from(byYear.entries()).map(([academicYear, byStudentId]) => ({
    academicYear,
    byStudentId,
  }));
}

/** Flat entries for POSTing ledger rows back to the API. */
export function yearFieldEntriesFromLedgers(ledgers: StudentYearLedger[]): Array<{
  studentId: string;
  academicYear: string;
  cls: string;
  due: number;
  active: boolean;
}> {
  const out: Array<{
    studentId: string;
    academicYear: string;
    cls: string;
    due: number;
    active: boolean;
  }> = [];
  for (const ledger of ledgers) {
    for (const [studentId, fields] of Object.entries(ledger.byStudentId)) {
      out.push({
        studentId,
        academicYear: ledger.academicYear,
        cls: fields.cls,
        due: fields.due,
        active: fields.active !== false,
      });
    }
  }
  return out;
}

/** Diff: entries present in `next` but missing from `prev` (by year+student). */
export function yearFieldEntriesMissingFrom(
  prev: StudentYearLedger[],
  next: StudentYearLedger[],
): Array<{
  studentId: string;
  academicYear: string;
  cls: string;
  due: number;
  active: boolean;
}> {
  const prevKeys = new Set<string>();
  for (const ledger of prev) {
    for (const studentId of Object.keys(ledger.byStudentId)) {
      prevKeys.add(`${ledger.academicYear}\0${studentId}`);
    }
  }
  return yearFieldEntriesFromLedgers(next).filter(
    (entry) => !prevKeys.has(`${entry.academicYear}\0${entry.studentId}`),
  );
}

export function applyLedgerToStudent<
  T extends {
    id: string;
    cls: string;
    due: number;
    active?: boolean;
  },
>(student: T, fields: StudentYearFields | undefined): T {
  if (!fields) return student;
  return {
    ...student,
    cls: fields.cls,
    due: fields.due,
    active: fields.active,
  };
}

export function studentsForAcademicYear<
  T extends {
    id: string;
    cls: string;
    due: number;
    active?: boolean;
    deletedAt?: string;
  },
>(students: T[], ledgers: StudentYearLedger[], year: string): T[] {
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
export function syncLedgerFromActiveStudents<
  T extends {
    id: string;
    cls: string;
    due: number;
    active?: boolean;
  },
>(ledgers: StudentYearLedger[], year: string, activeStudents: T[]): StudentYearLedger[] {
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
