import {
  composeClassName,
  splitClassName,
  type ClassConfig,
  type Student,
} from "@/lib/tenant-store";

export type StudentCsvRow = {
  name: string;
  classLabel: string;
  guardian: string;
  phone: string;
  due: number;
  line: number;
};

const HEADER_ALIASES: Record<keyof Omit<StudentCsvRow, "line">, string[]> = {
  name: ["name", "student", "student name", "student_name", "full name"],
  classLabel: ["class", "grade", "class/grade", "class name", "cls", "section"],
  guardian: ["guardian", "parent", "father", "mother", "guardian name"],
  phone: ["phone", "mobile", "contact", "whatsapp", "phone number"],
  due: ["balance", "due", "fees", "outstanding", "fee due"],
};

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
  return /name|student|class|guardian|phone|balance|due/.test(joined);
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
  let guardianIdx = 2;
  let phoneIdx = 3;
  let dueIdx = 4;

  if (looksLikeHeader(table[0] ?? [])) {
    const headers = table[0] ?? [];
    nameIdx = columnIndex(headers, HEADER_ALIASES.name);
    classIdx = columnIndex(headers, HEADER_ALIASES.classLabel);
    guardianIdx = columnIndex(headers, HEADER_ALIASES.guardian);
    phoneIdx = columnIndex(headers, HEADER_ALIASES.phone);
    dueIdx = columnIndex(headers, HEADER_ALIASES.due);
    if (nameIdx < 0) nameIdx = 0;
    if (classIdx < 0) classIdx = 1;
    if (guardianIdx < 0) guardianIdx = 2;
    if (phoneIdx < 0) phoneIdx = 3;
    if (dueIdx < 0) dueIdx = 4;
    start = 1;
  }

  const rows: StudentCsvRow[] = [];
  for (let i = start; i < table.length; i++) {
    const cells = table[i] ?? [];
    const name = (cells[nameIdx] ?? "").trim();
    if (!name) continue;
    rows.push({
      name,
      classLabel: (cells[classIdx] ?? "").trim(),
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

export function matchExistingClass(classes: ClassConfig[], label: string): ClassConfig | undefined {
  const parsed = parseClassLabel(label);
  const needle = parsed.className.toLowerCase();
  return classes.find((cls) => {
    if (cls.className.trim().toLowerCase() === needle) return true;
    return (
      cls.grade.trim().toLowerCase() === parsed.grade.toLowerCase() &&
      cls.section.trim().toLowerCase() === parsed.section.toLowerCase() &&
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
