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
};

const NAME_ALIASES = ["name", "student", "student name", "student_name", "full name"];
const CLASS_GRADE_ALIASES = ["class", "grade", "class/grade", "class name", "cls"];
const DIVISION_ALIASES = ["division", "div", "section", "sec"];
const GUARDIAN_ALIASES = ["guardian", "parent", "father", "mother", "guardian name"];
const PHONE_ALIASES = ["phone", "mobile", "contact", "whatsapp", "phone number"];
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
    const idx = normalized.indexOf(alias);
    if (idx >= 0) return idx;
  }
  return -1;
}

function looksLikeHeader(cells: string[]): boolean {
  const joined = cells.map(headerKey).join(" ");
  return /name|student|class|grade|division|div|guardian|phone|balance|due/.test(joined);
}

function parseDue(raw: string): number {
  const n = Number(String(raw).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

export function parseStudentCsv(text: string): StudentCsvRow[] {
  const table = parseCsvText(text);
  if (!table.length) return [];

  let start = 0;
  let nameIdx = 0;
  let classIdx = 1;
  let divisionIdx = -1;
  let guardianIdx = 2;
  let phoneIdx = 3;
  let dueIdx = 4;

  if (looksLikeHeader(table[0] ?? [])) {
    const headers = table[0] ?? [];
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
    start = 1;
  }

  const rows: StudentCsvRow[] = [];
  for (let i = start; i < table.length; i++) {
    const cells = table[i] ?? [];
    const name = (cells[nameIdx] ?? "").trim();
    if (!name) continue;
    const grade = (cells[classIdx] ?? "").trim();
    const division = divisionIdx >= 0 ? (cells[divisionIdx] ?? "").trim() : "";
    const classLabel = resolveStudentCsvClass(grade, division);
    rows.push({
      name,
      grade,
      division,
      classLabel,
      guardian: (cells[guardianIdx] ?? "").trim(),
      phone: (cells[phoneIdx] ?? "").trim(),
      due: parseDue(cells[dueIdx] ?? ""),
      line: i + 1,
    });
  }
  return rows;
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

    const id = nextPrefixedId(
      "CLS",
      [...pool.map((c) => c.id), ...created.map((c) => c.id)],
      3,
    );
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
