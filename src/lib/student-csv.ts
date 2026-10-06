import {
  composeClassName,
  splitClassName,
  type ClassConfig,
  type Student,
} from "@/lib/tenant-store";

export type StudentCsvRow = {
  name: string;
  grade: string;
  division: string;
  /** Resolved class tier label used for enrollment (e.g. "Grade 1", "TLC - A"). */
  classLabel: string;
  guardian: string;
  phone: string;
  due: number;
  line: number;
  motherName?: string;
  /** ISO YYYY-MM-DD */
  dob?: string;
  gender?: "M" | "F";
  address?: string;
  email?: string;
  admissionNumber?: string;
};

export type StudentImportIssue = {
  line: number;
  rowLabel: string;
  message: string;
};

export type StudentImportParse = {
  rows: StudentCsvRow[];
  issues: StudentImportIssue[];
  /** True when the first row was recognised as a header row. */
  hasHeader: boolean;
};

const NAME_ALIASES = ["name", "student", "student name", "student_name", "full name"];
const MOTHER_ALIASES = ["mother name", "mother's name", "mothers name", "mother"];
const DOB_ALIASES = ["date of birth", "data of birth", "dob", "birth date", "birthdate", "d.o.b"];
const GENDER_ALIASES = ["gender", "sex"];
const ADDRESS_ALIASES = ["address", "home address", "residential address"];
const PIN_ALIASES = ["pin code", "pincode", "pin", "postal code", "zip", "zip code"];
const EMAIL_ALIASES = ["email", "e-mail", "email id", "mail"];
const ADMISSION_ALIASES = [
  "admission number",
  "admission no",
  "admission no.",
  "adm no",
  "adm no.",
  "admission",
];

const MAX_CLASS_LABEL = 40;
const MAX_DIVISION_LABEL = 12;
const MAX_NAME = 120;

/** Letters (any script), digits and common class punctuation — rejects binary garbage. */
const CLASS_LABEL_RE = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} .,:#_\-–—/()&+']*$/u;
const DIVISION_RE = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} ]*$/u;
const PERSON_NAME_RE = /^[\p{L}\p{M}\p{N} .,'’()\-/&@]+$/u;

export function isPlausibleClassLabel(label: string): boolean {
  const t = label.trim();
  return t.length > 0 && t.length <= MAX_CLASS_LABEL && CLASS_LABEL_RE.test(t);
}

export function isPlausibleDivision(division: string): boolean {
  const t = division.trim();
  return !t || (t.length <= MAX_DIVISION_LABEL && DIVISION_RE.test(t));
}

function isPlausiblePersonName(name: string): boolean {
  const t = name.trim();
  return t.length > 0 && t.length <= MAX_NAME && PERSON_NAME_RE.test(t);
}
const CLASS_GRADE_ALIASES = ["class", "grade", "class/grade", "class name", "cls"];
const DIVISION_ALIASES = ["division", "div", "section", "sec"];
const GUARDIAN_ALIASES = [
  "guardian",
  "guardian name",
  "parent",
  "parent name",
  "father name",
  "father's name",
  "fathers name",
  "father",
  "mother name",
  "mother's name",
  "mothers name",
  "mother",
];
const PHONE_ALIASES = [
  "phone",
  "mobile",
  "contact",
  "whatsapp",
  "phone number",
  "mobile number",
  "contact number",
  "phone no",
  "phone no.",
  "mobile no",
  "father number",
  "father phone",
  "father mobile",
  "father's number",
  "parent number",
  "parent phone",
  "guardian phone",
  "guardian number",
];
const DUE_ALIASES = ["balance", "due", "fees", "outstanding", "fee due"];

export const STUDENT_CSV_HEADERS = [
  "Name",
  "Class",
  "Division",
  "Guardian",
  "Phone",
  "Balance",
] as const;

export function splitStudentClassForCsv(className: string): { grade: string; division: string } {
  const parts = splitClassName(className.trim());
  return {
    grade: parts.grade,
    division: parts.section,
  };
}

/** Build the enrolled class label from separate CSV columns (or legacy combined class cell). */
export function resolveStudentCsvClass(grade: string, division: string): string {
  const gradeLabel = grade.trim();
  const divisionLabel = division.trim().toUpperCase();
  if (gradeLabel && divisionLabel) {
    return composeClassName(gradeLabel, divisionLabel);
  }
  if (gradeLabel) {
    return parseClassLabel(gradeLabel).className;
  }
  return "";
}

function detectDelimiter(headerLine: string): string {
  const counts = [
    [",", (headerLine.match(/,/g) ?? []).length],
    [";", (headerLine.match(/;/g) ?? []).length],
    ["\t", (headerLine.match(/\t/g) ?? []).length],
  ] as const;
  return counts.reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0];
}

/** RFC 4180-style CSV/TSV split that keeps quoted commas. */
export function parseCsvText(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  if (!src.trim()) return [];
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = detectDelimiter(firstLine);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === delimiter) {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (ch === "\n" || (ch === "\r" && next === "\n")) {
      if (ch === "\r") i += 1;
      row.push(cell.trim());
      if (row.some((c) => c)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    if (ch !== "\r") cell += ch;
  }
  row.push(cell.trim());
  if (row.some((c) => c)) rows.push(row);
  return rows;
}

function headerKey(value: string): string {
  return value.toLowerCase().replace(/[_/]+/g, " ").replace(/\s+/g, " ").trim();
}

function columnIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map(headerKey);
  for (const alias of aliases) {
    const idx = normalized.indexOf(headerKey(alias));
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseGender(raw: string): "M" | "F" | undefined {
  const v = raw.trim().toLowerCase();
  if (!v) return undefined;
  if (/^(m|male|boy)$/.test(v)) return "M";
  if (/^(f|female|girl)$/.test(v)) return "F";
  return undefined;
}

/** DD-MM-YYYY / DD/MM/YY / YYYY-MM-DD → YYYY-MM-DD (Indian day-first order). */
function parseDobIso(raw: string): string | undefined {
  // Excel cells sometimes wrap as "31-\n10-\n2019".
  const t = raw.replace(/\s+/g, "").trim();
  if (!t) return undefined;
  let y: number, m: number, d: number;
  const iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const dmy = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/);
  if (iso) {
    [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  } else if (dmy) {
    d = Number(dmy[1]);
    m = Number(dmy[2]);
    y = Number(dmy[3]);
    if (y < 100) y += y >= 70 ? 1900 : 2000;
  } else {
    return undefined;
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return undefined;
  }
  if (y < 1950 || date.getTime() > Date.now()) return undefined;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function looksLikeHeader(cells: string[]): boolean {
  // Require real Name + Class columns — a title like "Students List" must not win.
  return (
    columnIndex(cells, NAME_ALIASES) >= 0 && columnIndex(cells, CLASS_GRADE_ALIASES) >= 0
  );
}

/** Score how many recognised student columns a candidate header row has. */
function headerRowScore(cells: string[]): number {
  if (!looksLikeHeader(cells)) return 0;
  let score = 2;
  for (const aliases of [
    DIVISION_ALIASES,
    GUARDIAN_ALIASES,
    PHONE_ALIASES,
    DUE_ALIASES,
    DOB_ALIASES,
    GENDER_ALIASES,
    ADMISSION_ALIASES,
    MOTHER_ALIASES,
  ]) {
    if (columnIndex(cells, aliases) >= 0) score += 1;
  }
  return score;
}

/**
 * Find the header row in the first few lines (school exports often put a title above it).
 * Returns -1 when no Name+Class header is found (positional template fallback).
 */
function findHeaderRowIndex(table: string[][]): number {
  const scan = Math.min(table.length, 15);
  let bestIdx = -1;
  let bestScore = 0;
  for (let i = 0; i < scan; i++) {
    const score = headerRowScore(table[i] ?? []);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function parseDue(raw: string): number {
  const n = Number(String(raw).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

export function parseStudentCsv(text: string): StudentCsvRow[] {
  return parseStudentTable(parseCsvText(text)).rows;
}

/**
 * Parse a student sheet (CSV or Excel, already split into cells). Rows with an unreadable
 * name or class are reported in `issues` instead of creating garbage class tiers.
 */
export function parseStudentTable(table: string[][]): StudentImportParse {
  if (!table.length) return { rows: [], issues: [], hasHeader: false };

  let hasHeader = false;
  let motherIdx = -1;
  let dobIdx = -1;
  let genderIdx = -1;
  let addressIdx = -1;
  let pinIdx = -1;
  let emailIdx = -1;
  let admissionIdx = -1;
  let start = 0;
  let nameIdx = 0;
  let classIdx = 1;
  let divisionIdx = -1;
  let guardianIdx = 2;
  let phoneIdx = 3;
  let dueIdx = 4;

  const headerRowIdx = findHeaderRowIndex(table);
  if (headerRowIdx >= 0) {
    const headers = table[headerRowIdx] ?? [];
    nameIdx = columnIndex(headers, NAME_ALIASES);
    classIdx = columnIndex(headers, CLASS_GRADE_ALIASES);
    divisionIdx = columnIndex(headers, DIVISION_ALIASES);
    guardianIdx = columnIndex(headers, GUARDIAN_ALIASES);
    phoneIdx = columnIndex(headers, PHONE_ALIASES);
    dueIdx = columnIndex(headers, DUE_ALIASES);
    if (nameIdx < 0) nameIdx = 0;
    if (classIdx < 0) classIdx = 1;
    if (guardianIdx < 0) guardianIdx = divisionIdx >= 0 ? 3 : 2;
    if (phoneIdx < 0) phoneIdx = guardianIdx + 1;
    if (dueIdx < 0) dueIdx = phoneIdx + 1;
    motherIdx = columnIndex(headers, MOTHER_ALIASES);
    dobIdx = columnIndex(headers, DOB_ALIASES);
    genderIdx = columnIndex(headers, GENDER_ALIASES);
    addressIdx = columnIndex(headers, ADDRESS_ALIASES);
    pinIdx = columnIndex(headers, PIN_ALIASES);
    emailIdx = columnIndex(headers, EMAIL_ALIASES);
    admissionIdx = columnIndex(headers, ADMISSION_ALIASES);
    if (guardianIdx === motherIdx) motherIdx = -1;
    start = headerRowIdx + 1;
    hasHeader = true;
  }

  const at = (cells: string[], idx: number) => (idx >= 0 ? (cells[idx] ?? "").trim() : "");
  const rows: StudentCsvRow[] = [];
  const issues: StudentImportIssue[] = [];
  for (let i = start; i < table.length; i++) {
    const cells = table[i] ?? [];
    const line = i + 1;
    const name = at(cells, nameIdx).replace(/\s+/g, " ");
    if (!name) continue;
    const rowLabel = name.length > 32 ? `${name.slice(0, 32)}…` : name;

    if (!isPlausiblePersonName(name)) {
      issues.push({ line, rowLabel: `Row ${line}`, message: "Student name is unreadable" });
      continue;
    }

    const grade = at(cells, classIdx).replace(/\s+/g, " ");
    const division = at(cells, divisionIdx);
    if (grade && !isPlausibleClassLabel(grade)) {
      issues.push({ line, rowLabel, message: `Class "${grade.slice(0, 20)}" is not valid` });
      continue;
    }
    if (!isPlausibleDivision(division)) {
      issues.push({
        line,
        rowLabel,
        message: `Division "${division.slice(0, 12)}" is not valid (use A, B, C…)`,
      });
      continue;
    }

    const classLabel = resolveStudentCsvClass(grade, division);
    const pin = at(cells, pinIdx).replace(/\s+/g, "");
    const addressBase = at(cells, addressIdx).replace(/\s+/g, " ");
    const address =
      addressBase && pin && !addressBase.includes(pin)
        ? `${addressBase}, PIN ${pin}`
        : addressBase || (pin ? `PIN ${pin}` : "");
    const email = at(cells, emailIdx);

    rows.push({
      name,
      grade,
      division,
      classLabel,
      guardian: at(cells, guardianIdx),
      phone: at(cells, phoneIdx),
      due: parseDue(at(cells, dueIdx)),
      line,
      motherName: at(cells, motherIdx) || undefined,
      dob: parseDobIso(at(cells, dobIdx)),
      gender: parseGender(at(cells, genderIdx)),
      address: address || undefined,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined,
      admissionNumber: at(cells, admissionIdx) || undefined,
    });
  }
  return { rows, issues, hasHeader };
}

export function parseClassLabel(raw: string): {
  grade: string;
  section: string;
  className: string;
} {
  const cleaned = raw.trim().replace(/\s+/g, " ");
  if (!cleaned) return { grade: "", section: "", className: "" };

  const dashed = cleaned.match(/^(.+?)\s*[-–—]\s*([A-Za-z0-9]{1,6})$/);
  if (dashed) {
    const grade = dashed[1].trim();
    const section = dashed[2].trim().toUpperCase();
    return { grade, section, className: composeClassName(grade, section) };
  }

  const spaced = cleaned.match(/^(.+?)\s+([A-Za-z])$/);
  if (spaced) {
    const grade = spaced[1].trim();
    const section = spaced[2].trim().toUpperCase();
    return { grade, section, className: composeClassName(grade, section) };
  }

  const parts = splitClassName(cleaned);
  return {
    grade: parts.grade,
    section: parts.section,
    className: composeClassName(parts.grade, parts.section) || cleaned,
  };
}

export function normalizeClassLabelKey(className: string): string {
  return className
    .trim()
    .toLowerCase()
    .replace(/\s*[-–—]\s*/g, "-")
    .replace(/\s+/g, " ");
}

export function findMissingClassTiers(
  classes: ClassConfig[],
  enrolledClassLabels: string[],
): ClassConfig[] {
  const pool = [...classes];
  const created: ClassConfig[] = [];
  const knownKeys = new Set<string>();
  for (const cls of pool) {
    knownKeys.add(normalizeClassLabelKey(cls.className));
    const parts = splitClassName(cls.className);
    const grade = (cls.grade || parts.grade || "").trim();
    const section = (cls.section || parts.section || "").trim();
    const composed = composeClassName(grade, section);
    if (composed) knownKeys.add(normalizeClassLabelKey(composed));
  }

  const uniqueLabels = Array.from(
    new Set(enrolledClassLabels.map((label) => label.trim()).filter(Boolean)),
  );

  for (const label of uniqueLabels) {
    const parsed = parseClassLabel(label);
    const canonical = parsed.className || label;
    const key = normalizeClassLabelKey(canonical);
    if (knownKeys.has(key)) continue;

    const existing = matchExistingClass(pool, label);
    if (existing) {
      knownKeys.add(normalizeClassLabelKey(existing.className));
      continue;
    }

    const id = nextPrefixedId("CLS", [...pool.map((c) => c.id), ...created.map((c) => c.id)], 3);
    const createdClass = buildClassFromLabel(id, label);
    pool.push(createdClass);
    created.push(createdClass);
    knownKeys.add(normalizeClassLabelKey(createdClass.className));
  }

  return created;
}

export function matchExistingClass(classes: ClassConfig[], label: string): ClassConfig | undefined {
  const parsed = parseClassLabel(label);
  const needleKey = normalizeClassLabelKey(parsed.className);
  return classes.find((cls) => {
    if (normalizeClassLabelKey(cls.className) === needleKey) return true;
    const parts = splitClassName(cls.className);
    const grade = (cls.grade || parts.grade || "").trim();
    const section = (cls.section || parts.section || "").trim();
    return (
      normalizeClassLabelKey(grade) === normalizeClassLabelKey(parsed.grade) &&
      normalizeClassLabelKey(section) === normalizeClassLabelKey(parsed.section) &&
      Boolean(parsed.grade)
    );
  });
}

export function buildClassFromLabel(id: string, label: string): ClassConfig {
  const parsed = parseClassLabel(label);
  return {
    id,
    className: parsed.className,
    grade: parsed.grade || parsed.className,
    section: parsed.section,
    tuitionFeeAmount: 0,
    vehicleFeeAmount: 0,
    billingCycle: "Monthly",
    feeAmountMode: "fixed",
    feeSchedule: [],
  };
}

export function nextPrefixedId(prefix: string, existing: string[], pad = 4): string {
  let max = 0;
  const re = new RegExp(`^${prefix}-(\\d+)$`, "i");
  for (const id of existing) {
    const match = id.match(re);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}-${String(max + 1).padStart(pad, "0")}`;
}

function digits(value?: string): string {
  return (value ?? "").replace(/\D/g, "");
}

export function isDuplicateStudent(
  existing: Student[],
  row: Pick<StudentCsvRow, "name" | "phone"> & { className: string },
): boolean {
  const name = row.name.trim().toLowerCase();
  const phone = digits(row.phone);
  return existing.some((student) => {
    if (student.deletedAt) return false;
    if (student.name.trim().toLowerCase() !== name) return false;
    if (phone && digits(student.phone) && digits(student.phone) === phone) return true;
    if (!phone && student.cls.trim().toLowerCase() === row.className.toLowerCase()) {
      return true;
    }
    return false;
  });
}
