import { parseCsvText } from "@/lib/student-csv";
import { DEFAULT_STAFF_DOCUMENTS, type Staff } from "@/lib/tenant-store";

export type StaffCsvRow = {
  name: string;
  role: string;
  dept: string;
  phone: string;
  altPhone: string;
  guardianPhone: string;
  id: string;
  status: string;
  joinedAt: string;
  basicSalary: string;
  additionalAllowances: string;
  line: number;
};

const HEADER_ALIASES: Record<keyof Omit<StaffCsvRow, "line">, string[]> = {
  name: ["name", "staff", "staff name", "employee name", "full name", "employee"],
  role: ["role", "title", "designation", "position", "job title"],
  dept: ["department", "dept", "division", "unit"],
  phone: ["phone", "mobile", "contact", "whatsapp", "phone number", "primary phone"],
  altPhone: ["alt phone", "altphone", "alternate phone", "secondary phone", "other phone"],
  guardianPhone: [
    "guardian phone",
    "guardianphone",
    "emergency phone",
    "emergency contact",
    "guardian",
  ],
  id: ["id", "staff id", "staffid", "employee id", "employeeid", "emp id", "emp code"],
  status: ["status", "active", "employment status"],
  joinedAt: ["joined at", "joinedat", "join date", "joining date", "date of joining", "doj"],
  basicSalary: ["basic salary", "basicsalary", "salary", "basic pay", "basic"],
  additionalAllowances: [
    "additional allowances",
    "additionalallowances",
    "allowances",
    "allowance",
  ],
};

const STUDENT_SHEET_MARKERS = [
  "student id",
  "student name",
  "aadhar",
  "aadhaar",
  "parent name",
  "parent contact",
  "class",
  "s.no",
  "s no",
];

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
  return /name|role|staff|department|dept|phone|employee/.test(joined);
}

export function isStudentMasterSheet(headers: string[]): boolean {
  const normalized = headers.map(headerKey);
  const hits = STUDENT_SHEET_MARKERS.filter((marker) => normalized.includes(marker));
  return hits.length >= 2;
}

function cell(cells: string[], idx: number): string {
  if (idx < 0) return "";
  return (cells[idx] ?? "").trim();
}

function parseMoney(raw: string): number | undefined {
  if (!raw.trim()) return undefined;
  const n = Number(String(raw).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : undefined;
}

function parseActive(raw: string, fallback = true): boolean {
  const v = raw.trim().toLowerCase();
  if (!v) return fallback;
  if (["inactive", "0", "false", "no", "n", "off"].includes(v)) return false;
  if (["active", "1", "true", "yes", "y", "on"].includes(v)) return true;
  return fallback;
}

function parseJoinedAt(raw: string): string | undefined {
  const v = raw.trim();
  if (!v) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const dmy = v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    return `${dmy[3]}-${month}-${day}`;
  }
  const parsed = Date.parse(v);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  return undefined;
}

export type ParseStaffCsvResult =
  | { ok: true; rows: StaffCsvRow[] }
  | { ok: false; error: string; description?: string };

export function parseStaffCsv(text: string): ParseStaffCsvResult {
  const table = parseCsvText(text);
  if (!table.length) {
    return { ok: false, error: "Empty CSV file" };
  }

  let start = 0;
  let nameIdx = 0;
  let roleIdx = 1;
  let deptIdx = 2;
  let phoneIdx = 3;
  let altPhoneIdx = 4;
  let guardianPhoneIdx = 5;
  let idIdx = 6;
  let statusIdx = -1;
  let joinedAtIdx = -1;
  let basicSalaryIdx = -1;
  let additionalAllowancesIdx = -1;

  if (looksLikeHeader(table[0] ?? [])) {
    const headers = table[0] ?? [];
    if (isStudentMasterSheet(headers)) {
      return {
        ok: false,
        error: "This looks like a student spreadsheet",
        description:
          "Use Bulk Upload → Download template on Staff, or open Students for student imports",
      };
    }
    nameIdx = columnIndex(headers, HEADER_ALIASES.name);
    roleIdx = columnIndex(headers, HEADER_ALIASES.role);
    deptIdx = columnIndex(headers, HEADER_ALIASES.dept);
    phoneIdx = columnIndex(headers, HEADER_ALIASES.phone);
    altPhoneIdx = columnIndex(headers, HEADER_ALIASES.altPhone);
    guardianPhoneIdx = columnIndex(headers, HEADER_ALIASES.guardianPhone);
    idIdx = columnIndex(headers, HEADER_ALIASES.id);
    statusIdx = columnIndex(headers, HEADER_ALIASES.status);
    joinedAtIdx = columnIndex(headers, HEADER_ALIASES.joinedAt);
    basicSalaryIdx = columnIndex(headers, HEADER_ALIASES.basicSalary);
    additionalAllowancesIdx = columnIndex(headers, HEADER_ALIASES.additionalAllowances);
    if (nameIdx < 0) {
      return {
        ok: false,
        error: "CSV missing a Name column",
        description: "Expected columns: Name, Role, Department, Phone, AltPhone, GuardianPhone, ID",
      };
    }
    start = 1;
  }

  const rows: StaffCsvRow[] = [];
  for (let i = start; i < table.length; i++) {
    const cells = table[i] ?? [];
    const name = cell(cells, nameIdx);
    if (!name) continue;
    rows.push({
      name,
      role: cell(cells, roleIdx),
      dept: cell(cells, deptIdx),
      phone: cell(cells, phoneIdx),
      altPhone: cell(cells, altPhoneIdx),
      guardianPhone: cell(cells, guardianPhoneIdx),
      id: cell(cells, idIdx),
      status: cell(cells, statusIdx),
      joinedAt: cell(cells, joinedAtIdx),
      basicSalary: cell(cells, basicSalaryIdx),
      additionalAllowances: cell(cells, additionalAllowancesIdx),
      line: i + 1,
    });
  }

  if (!rows.length) {
    return {
      ok: false,
      error: "CSV had no staff rows",
      description: "Use the template: Name, Role, Department, Phone, AltPhone, GuardianPhone, ID",
    };
  }

  return { ok: true, rows };
}

function digits(value?: string): string {
  return (value ?? "").replace(/\D/g, "");
}

/** Collapse spacing / accents so "MUHAMMED  BILAL" matches "Muhammed Bilal". */
export function normalizeStaffName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function preferStaffCanonical(candidates: Staff[]): Staff {
  return [...candidates].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.id.localeCompare(b.id);
  })[0]!;
}

export function isDuplicateStaff(
  existing: Staff[],
  row: Pick<StaffCsvRow, "name" | "phone">,
): boolean {
  return Boolean(findDuplicateStaff(existing, row));
}

/**
 * Match roster row by normalized name.
 * Phone (when both sides have one) prefers that twin; name alone is enough to avoid re-creating.
 */
export function findDuplicateStaff(
  existing: Staff[],
  row: Pick<StaffCsvRow, "name" | "phone">,
  opts?: { includeDeleted?: boolean },
): Staff | undefined {
  const name = normalizeStaffName(row.name);
  const phone = digits(row.phone);

  const pool = existing.filter((member) => opts?.includeDeleted || !member.deletedAt);

  if (phone) {
    const byPhone = pool.find((member) => digits(member.phone) === phone);
    if (byPhone) return byPhone;
  }

  if (!name) return undefined;
  const candidates = pool.filter((member) => normalizeStaffName(member.name) === name);
  if (!candidates.length) return undefined;
  return preferStaffCanonical(candidates);
}

/** Extra live copies of the same person (same normalized name), excluding the kept id. */
export function findStaffNameTwins(
  existing: Staff[],
  name: string,
  keepId: string,
): Staff[] {
  const key = normalizeStaffName(name);
  if (!key) return [];
  return existing.filter(
    (member) =>
      !member.deletedAt &&
      member.id !== keepId &&
      normalizeStaffName(member.name) === key,
  );
}

/** How many live rows are surplus copies (group size − 1 per name). */
export function countStaffDuplicateExtras(existing: Staff[]): number {
  const groups = new Map<string, number>();
  for (const member of existing) {
    if (member.deletedAt) continue;
    const key = normalizeStaffName(member.name);
    if (!key) continue;
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  let extras = 0;
  for (const count of groups.values()) {
    if (count > 1) extras += count - 1;
  }
  return extras;
}

/**
 * Keep one canonical row per normalized name; return ids of surplus twins to recycle.
 */
export function planStaffDuplicateMerge(existing: Staff[]): {
  keepIds: string[];
  recycleIds: string[];
} {
  const groups = new Map<string, Staff[]>();
  for (const member of existing) {
    if (member.deletedAt) continue;
    const key = normalizeStaffName(member.name);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(member);
    groups.set(key, list);
  }
  const keepIds: string[] = [];
  const recycleIds: string[] = [];
  for (const list of groups.values()) {
    if (list.length === 1) {
      keepIds.push(list[0]!.id);
      continue;
    }
    const keep = preferStaffCanonical(list);
    keepIds.push(keep.id);
    for (const member of list) {
      if (member.id !== keep.id) recycleIds.push(member.id);
    }
  }
  return { keepIds, recycleIds };
}

export function staffFromCsvRow(
  row: StaffCsvRow,
  opts: {
    id: string;
    defaultRole: string;
    defaultDept: string;
    existing?: Staff;
  },
): Staff {
  const joinedAt =
    parseJoinedAt(row.joinedAt) ?? opts.existing?.joinedAt ?? new Date().toISOString().slice(0, 10);
  const basicSalary = parseMoney(row.basicSalary);
  const additionalAllowances = parseMoney(row.additionalAllowances);
  const active = parseActive(row.status, opts.existing?.active ?? true);

  if (opts.existing) {
    return {
      ...opts.existing,
      name: row.name,
      role: row.role || opts.existing.role || opts.defaultRole,
      dept: row.dept || opts.existing.dept || opts.defaultDept,
      active,
      joinedAt,
      phone: row.phone || opts.existing.phone,
      altPhone: row.altPhone || opts.existing.altPhone,
      guardianPhone: row.guardianPhone || opts.existing.guardianPhone,
      basicSalary: basicSalary ?? opts.existing.basicSalary,
      additionalAllowances: additionalAllowances ?? opts.existing.additionalAllowances,
    };
  }

  return {
    id: opts.id,
    name: row.name,
    role: row.role || opts.defaultRole,
    dept: row.dept || opts.defaultDept,
    active,
    joinedAt,
    phone: row.phone || undefined,
    altPhone: row.altPhone || undefined,
    guardianPhone: row.guardianPhone || undefined,
    basicSalary: basicSalary ?? 8000,
    additionalAllowances: additionalAllowances ?? 0,
    documents: DEFAULT_STAFF_DOCUMENTS.map((d) => ({ ...d })),
    salaryHistory: [],
    statusHistory: [
      {
        id: `EVT-${opts.id}-joined`,
        type: "joined",
        at: new Date().toISOString(),
        note: "Joined the school roster",
      },
    ],
  };
}
