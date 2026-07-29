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

/** Parse `AY 2025-26` → Apr 1 start-year … Mar 31 end-year (Indian school FY). */
export function parseAcademicYearBounds(label: string): AcademicYearBounds | null {
  const match = label.trim().match(/^(?:AY\s*)?(\d{4})\s*[-–/]\s*(\d{2}|\d{4})$/i);
  if (!match) return null;
  const startYear = Number(match[1]);
  const endRaw = match[2];
  const endYear = endRaw.length === 4 ? Number(endRaw) : 2000 + Number(endRaw);
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return null;
  return {
    startYear,
    endYear,
    startDate: `${startYear}-04-01`,
    endDate: `${endYear}-03-31`,
  };
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
