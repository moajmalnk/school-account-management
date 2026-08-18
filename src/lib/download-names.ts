/** Filename patterns for school downloads (Settings → System). */

export const DOWNLOAD_KINDS = [
  "receipt",
  "voucher",
  "salarySlip",
  "transactions",
  "madePayments",
  "students",
  "staff",
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
  reports: "Reports",
  platformInvoice: "Invoice",
  platformReceipt: "Billing receipt",
};

export const DEFAULT_FILE_NAMES: Record<DownloadKind, string> = {
  receipt: "receipt-{id}",
  voucher: "voucher-{id}",
  salarySlip: "salary-slip-{id}",
  transactions: "finance-transactions",
  madePayments: "made-payments",
  students: "students-{date}",
  staff: "staff-directory",
  reports: "{report}-{year}",
  platformInvoice: "{id}",
  platformReceipt: "{id}",
};

export const DOWNLOAD_TOKENS = ["{id}", "{name}", "{date}", "{year}", "{school}", "{report}"] as const;

export type DownloadNameVars = {
  id?: string;
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
  const src =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
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
    name: vars.name ?? "",
    date: vars.date ?? todayStamp(),
    year: vars.year ?? "",
    school: vars.school ?? "",
    report: vars.report ?? "",
  };
  const filled = pattern.replace(/\{(id|name|date|year|school|report)\}/gi, (_, key: string) => {
    const part = lookup[key.toLowerCase()] ?? "";
    return part ? sanitizeFilenamePart(part) : "";
  });
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
  const source = patterns ? normalizeFileNames({ ...activeFileNames, ...patterns }) : activeFileNames;
  const pattern = source[kind] || DEFAULT_FILE_NAMES[kind];
  const base = fillPattern(pattern, vars);
  const fallback = fillPattern(DEFAULT_FILE_NAMES[kind], vars);
  return withExtension(base || fallback, ext);
}

export function previewDownloadFilename(
  kind: DownloadKind,
  pattern: string,
  ext: "pdf" | "csv" = "pdf",
): string {
  return formatDownloadFilename(kind, ext, EXAMPLE_DOWNLOAD_VARS, {
    ...activeFileNames,
    [kind]: pattern,
  });
}

export const EXAMPLE_DOWNLOAD_VARS: DownloadNameVars = {
  id: "PAY-001",
  name: "Diya-Nair",
  date: "2026-04-01",
  year: "AY-2025-26",
  school: "School",
  report: "general-ledger",
};
