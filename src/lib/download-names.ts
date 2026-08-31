/** Filename patterns for school downloads (Settings → System). */

export const DOWNLOAD_KINDS = [
  "receipt",
  "voucher",
  "salarySlip",
  "transactions",
  "madePayments",
  "students",
  "staff",
  "studentFeeReport",
  "reports",
  "platformInvoice",
  "platformReceipt",
] as const;

export type DownloadKind = (typeof DOWNLOAD_KINDS)[number];

export const DOWNLOAD_KIND_LABELS: Record<DownloadKind, string> = {
  receipt: "Receipt",
  voucher: "Voucher",
  salarySlip: "Salary slip",
  transactions: "Transactions",
  madePayments: "Made payments",
  students: "Students",
  staff: "Staff",
  studentFeeReport: "Student fee report",
  reports: "Reports",
  platformInvoice: "Invoice",
  platformReceipt: "Billing receipt",
};

/** Short help for each download kind (tooltips / settings copy). */
export const DOWNLOAD_KIND_HINTS: Record<DownloadKind, string> = {
  receipt: "Fee payment receipt PDF. {id} = payment ID, {studentId} = student ID.",
  voucher: "Expense / payment voucher PDF. {id} = voucher ID.",
  salarySlip: "Staff salary slip PDF. {id} = slip or staff ID.",
  transactions: "Finance transactions export (CSV).",
  madePayments: "Made payments export (CSV).",
  students: "Students directory export (CSV).",
  staff: "Staff directory export (CSV).",
  studentFeeReport:
    "Parent fee statement from student Payments → Download report. Default: student-fee-{year} → student-fee-ay-2026-27.pdf",
  reports: "Other finance PDF reports. {report} is the report type (e.g. general-ledger).",
  platformInvoice: "Platform billing invoice PDF.",
  platformReceipt: "Platform billing receipt PDF.",
};

export const DEFAULT_FILE_NAMES: Record<DownloadKind, string> = {
  receipt: "receipt-{id}",
  voucher: "voucher-{id}",
  salarySlip: "salary-slip-{id}",
  transactions: "finance-transactions",
  madePayments: "made-payments",
  students: "students-{date}",
  staff: "staff-directory",
  studentFeeReport: "student-fee-{year}",
  reports: "{report}-{year}",
  platformInvoice: "{id}",
  platformReceipt: "{id}",
};

export const DOWNLOAD_TOKENS = [
  "{id}",
  "{studentId}",
  "{name}",
  "{date}",
  "{year}",
  "{school}",
  "{report}",
] as const;

export type DownloadToken = (typeof DOWNLOAD_TOKENS)[number];

/** What each token fills in — shown in settings tooltips. */
export const DOWNLOAD_TOKEN_HELP: Record<DownloadToken, string> = {
  "{id}":
    "Record ID — payment (PAY-001), voucher, invoice, or student/staff id when used for that download",
  "{studentId}": "Student ID (e.g. STU-001) — use on receipts and student fee report",
  "{name}": "Person name (student, staff, or payer)",
  "{date}": "Today’s date as YYYY-MM-DD",
  "{year}": "Academic year slug (e.g. ay-2026-27 from AY 2026-27)",
  "{school}": "School / campus name",
  "{report}": "Report type key (e.g. student-fee, general-ledger) — used by Reports",
};

/** Tokens most useful for each kind (for tip chips). */
export const DOWNLOAD_KIND_TOKENS: Record<DownloadKind, DownloadToken[]> = {
  receipt: ["{id}", "{studentId}", "{name}", "{date}", "{year}", "{school}"],
  voucher: ["{id}", "{name}", "{date}", "{school}"],
  salarySlip: ["{id}", "{name}", "{date}", "{school}"],
  transactions: ["{date}", "{year}", "{school}"],
  madePayments: ["{date}", "{year}", "{school}"],
  students: ["{date}", "{year}", "{school}"],
  staff: ["{date}", "{school}"],
  studentFeeReport: ["{studentId}", "{name}", "{year}", "{date}", "{school}", "{id}"],
  reports: ["{report}", "{year}", "{date}", "{school}"],
  platformInvoice: ["{id}", "{date}", "{school}"],
  platformReceipt: ["{id}", "{date}", "{school}"],
};

export type DownloadNameVars = {
  id?: string;
  studentId?: string;
  name?: string;
  date?: string;
  year?: string;
  school?: string;
  report?: string;
};

let activeFileNames: Record<DownloadKind, string> = { ...DEFAULT_FILE_NAMES };

export function todayStamp(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function slugYear(year: string): string {
  return year.replace(/\s+/g, "-").toLowerCase();
}

export function normalizeFileNames(value: unknown): Record<DownloadKind, string> {
  const src = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const next = { ...DEFAULT_FILE_NAMES };
  for (const kind of DOWNLOAD_KINDS) {
    const raw = src[kind];
    if (typeof raw === "string" && raw.trim()) {
      next[kind] = raw.trim().slice(0, 80);
    }
  }
  return next;
}

export function setActiveFileNames(names: Record<DownloadKind, string> | undefined): void {
  activeFileNames = normalizeFileNames(names);
}

export function getActiveFileNames(): Record<DownloadKind, string> {
  return activeFileNames;
}

export function clearActiveFileNames(): void {
  activeFileNames = { ...DEFAULT_FILE_NAMES };
}

function sanitizeFilenamePart(value: string): string {
  const cleaned = value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 80);
  return cleaned || "file";
}

function fillPattern(pattern: string, vars: DownloadNameVars): string {
  const lookup: Record<string, string> = {
    id: vars.id ?? "",
    studentid: vars.studentId ?? "",
    name: vars.name ?? "",
    date: vars.date ?? todayStamp(),
    year: vars.year ?? "",
    school: vars.school ?? "",
    report: vars.report ?? "",
  };
  const filled = pattern.replace(
    /\{(id|studentId|student_id|name|date|year|school|report)\}/gi,
    (_, key: string) => {
      const part = lookup[key.toLowerCase().replace(/_/g, "")] ?? "";
      return part ? sanitizeFilenamePart(part) : "";
    },
  );
  return sanitizeFilenamePart(filled.replace(/\{[^}]+\}/g, ""));
}

function withExtension(base: string, ext: string): string {
  const suffix = ext.startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  if (base.toLowerCase().endsWith(suffix)) return base;
  return `${base}${suffix}`;
}

export function formatDownloadFilename(
  kind: DownloadKind,
  ext: "pdf" | "csv",
  vars: DownloadNameVars = {},
  patterns?: Partial<Record<DownloadKind, string>>,
): string {
  const source = patterns
    ? normalizeFileNames({ ...activeFileNames, ...patterns })
    : activeFileNames;
  const pattern = source[kind] || DEFAULT_FILE_NAMES[kind];
  const base = fillPattern(pattern, vars);
  const fallback = fillPattern(DEFAULT_FILE_NAMES[kind], vars);
  return withExtension(base || fallback, ext);
}

export function exampleVarsForKind(kind: DownloadKind): DownloadNameVars {
  if (kind === "studentFeeReport") {
    return {
      ...EXAMPLE_DOWNLOAD_VARS,
      id: "STU-001",
      studentId: "STU-001",
      name: "Diya-Nair",
      year: "ay-2026-27",
      report: "student-fee",
    };
  }
  if (kind === "reports") {
    return {
      ...EXAMPLE_DOWNLOAD_VARS,
      year: "ay-2026-27",
      report: "general-ledger",
    };
  }
  if (kind === "receipt") {
    return {
      ...EXAMPLE_DOWNLOAD_VARS,
      id: "PAY-001",
      studentId: "STU-001",
      year: "ay-2026-27",
    };
  }
  return EXAMPLE_DOWNLOAD_VARS;
}

export function previewDownloadFilename(
  kind: DownloadKind,
  pattern: string,
  ext: "pdf" | "csv" = "pdf",
): string {
  return formatDownloadFilename(kind, ext, exampleVarsForKind(kind), {
    ...activeFileNames,
    [kind]: pattern,
  });
}

export const EXAMPLE_DOWNLOAD_VARS: DownloadNameVars = {
  id: "PAY-001",
  studentId: "STU-001",
  name: "Diya-Nair",
  date: "2026-04-01",
  year: "ay-2026-27",
  school: "School",
  report: "general-ledger",
};
