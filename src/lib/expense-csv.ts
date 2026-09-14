import { normalizePayeeType, type PayeeType } from "@/lib/dashboard-finance";
import {
  cell,
  columnIndex,
  csvDayKey,
  headerKey,
  looksLikeTitleRow,
  looksLikeTotalRow,
  normalizePersonKey,
  parseCsvMoney,
  parseIndianDate,
  parsePaymentMode,
} from "@/lib/csv-import";
import { parseCsvText } from "@/lib/student-csv";
import { currentPayrollMonth, formatPayrollMonthLabel, type Staff } from "@/lib/tenant-store";

export const EXPENSE_CSV_HEADERS = [
  "Date",
  "Description",
  "Category",
  "Type",
  "Payment Mode",
  "Amount",
  "Paid To",
  "Staff ID",
  "Staff Name",
  "Salary Month",
] as const;

const HEADER_ALIASES = {
  date: ["date", "expense date", "paid on", "payment date"],
  description: [
    "description",
    "expense description",
    "desc",
    "particulars",
    "narration",
    "details",
    "line items",
  ],
  category: ["category", "expense category", "head", "account", "ledger"],
  type: ["type", "payee type", "expense type", "kind"],
  mode: ["payment mode", "mode", "paid via", "method"],
  amount: ["amount", "amount inr", "amount (inr)", "inr", "value", "rs"],
  payee: ["paid to", "payee", "beneficiary", "vendor", "handled by", "paid by"],
  staffId: ["staff id", "staffid", "employee id", "emp id", "emp code"],
  staffName: ["staff name", "staff", "employee name", "employee"],
  salaryMonth: ["salary month", "payroll month", "month"],
} as const;

export type ExpenseCsvIssue = {
  line: number;
  message: string;
  rowLabel: string;
};

export type ExpenseCsvDraft = {
  line: number;
  date: Date;
  description: string;
  category: string;
  payeeType: PayeeType;
  mode: "Bank" | "Cash" | "Both";
  amount: number;
  payee: string;
  staffId: string;
  staffName: string;
  salaryMonth: string;
};

export type ParseExpenseCsvResult =
  | { ok: true; drafts: ExpenseCsvDraft[]; issues: ExpenseCsvIssue[] }
  | { ok: false; error: string; description?: string; issues: ExpenseCsvIssue[] };

export type ResolvedExpenseImport = {
  line: number;
  payee: string;
  desc: string;
  amount: number;
  mode: "Bank" | "Cash" | "Both";
  payeeType: PayeeType;
  time: Date;
  status: "Queued" | "Cleared";
  staffId?: string;
  staffName?: string;
  salaryMonth?: string;
  category?: string;
  duplicate: boolean;
  previewLabel: string;
  previewExtra: string;
};

function looksLikeExpenseHeader(cells: string[]): boolean {
  const joined = cells.map(headerKey).join(" ");
  return /\bdate\b/.test(joined) && /\b(amount|category|payment mode|mode|expense)\b/.test(joined);
}

function inferPayeeType(typeRaw: string, category: string, description: string): PayeeType {
  const blob = `${typeRaw} ${category} ${description}`;
  if (/other\s*expense|supplier|vendor|operating/i.test(typeRaw)) return "Other Expense";
  return normalizePayeeType(blob);
}

function parseSalaryMonth(raw: string, fallback: Date | null): string {
  const v = raw.trim();
  if (/^\d{4}-\d{2}$/.test(v)) return v;
  const named = v.match(/^([A-Za-z]+)\s+(\d{2}|\d{4})$/);
  if (named) {
    const monthToken = named[1].slice(0, 3).toLowerCase();
    const months = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    const idx = months.indexOf(monthToken);
    const yearNum = Number(named[2]);
    const year = yearNum >= 100 ? yearNum : yearNum >= 70 ? 1900 + yearNum : 2000 + yearNum;
    if (idx >= 0 && year >= 1970) {
      return `${year}-${String(idx + 1).padStart(2, "0")}`;
    }
  }
  if (fallback) {
    return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, "0")}`;
  }
  return "";
}

function skipRow(cells: string[]): boolean {
  if (!cells.some((c) => c.trim())) return true;
  if (looksLikeTitleRow(cells)) return true;
  if (looksLikeTotalRow(cells)) return true;
  const first = headerKey(cells[0] ?? "");
  if (first === "s.no" || first === "s no" || first === "sno" || first === "sl no") return true;
  return false;
}

export function parseExpenseCsv(text: string): ParseExpenseCsvResult {
  const table = parseCsvText(text);
  if (!table.length) {
    return { ok: false, error: "Empty CSV file", issues: [] };
  }

  let start = 0;
  let dateIdx = 1;
  let descriptionIdx = 2;
  let categoryIdx = 3;
  let typeIdx = -1;
  let modeIdx = 4;
  let amountIdx = 5;
  let payeeIdx = 6;
  let staffIdIdx = -1;
  let staffNameIdx = -1;
  let salaryMonthIdx = -1;

  const headerRow = table.findIndex((row) => looksLikeExpenseHeader(row));
  if (headerRow >= 0) {
    const headers = table[headerRow] ?? [];
    dateIdx = columnIndex(headers, [...HEADER_ALIASES.date]);
    descriptionIdx = columnIndex(headers, [...HEADER_ALIASES.description]);
    categoryIdx = columnIndex(headers, [...HEADER_ALIASES.category]);
    typeIdx = columnIndex(headers, [...HEADER_ALIASES.type]);
    modeIdx = columnIndex(headers, [...HEADER_ALIASES.mode]);
    amountIdx = columnIndex(headers, [...HEADER_ALIASES.amount]);
    payeeIdx = columnIndex(headers, [...HEADER_ALIASES.payee]);
    staffIdIdx = columnIndex(headers, [...HEADER_ALIASES.staffId]);
    staffNameIdx = columnIndex(headers, [...HEADER_ALIASES.staffName]);
    salaryMonthIdx = columnIndex(headers, [...HEADER_ALIASES.salaryMonth]);
    if (dateIdx < 0) {
      return {
        ok: false,
        error: "CSV missing a Date column",
        description: "Expected Date, Description, Category, Payment Mode, Amount, Paid To",
        issues: [],
      };
    }
    if (amountIdx < 0) {
      return {
        ok: false,
        error: "CSV missing an Amount column",
        description: "Expected Date, Description, Category, Payment Mode, Amount, Paid To",
        issues: [],
      };
    }
    start = headerRow + 1;
  }

  const drafts: ExpenseCsvDraft[] = [];
  const issues: ExpenseCsvIssue[] = [];

  for (let i = start; i < table.length; i++) {
    const cells = table[i] ?? [];
    if (skipRow(cells)) continue;
    const line = i + 1;
    const dateRaw = cell(cells, dateIdx);
    const category = cell(cells, categoryIdx);
    const description = cell(cells, descriptionIdx) || category;
    const amount = parseCsvMoney(cell(cells, amountIdx));
    const rowLabel = description || category || dateRaw || `Row ${line}`;

    if (!dateRaw && amount <= 0 && !description) continue;

    const date = parseIndianDate(dateRaw);
    if (!date) {
      issues.push({ line, rowLabel, message: "Date is missing or not DD/MM/YYYY" });
      continue;
    }
    if (amount <= 0) {
      issues.push({ line, rowLabel, message: "Amount must be greater than 0" });
      continue;
    }
    const mode = parsePaymentMode(cell(cells, modeIdx)) || "Cash";
    const typeRaw = cell(cells, typeIdx);
    const payeeType = inferPayeeType(typeRaw, category, description);
    const payee = cell(cells, payeeIdx) || category || description || "Expense";
    drafts.push({
      line,
      date,
      description,
      category,
      payeeType,
      mode,
      amount,
      payee,
      staffId: cell(cells, staffIdIdx),
      staffName: cell(cells, staffNameIdx) || (payeeType === "Salary" ? payee : ""),
      salaryMonth: parseSalaryMonth(cell(cells, salaryMonthIdx), date),
    });
  }

  if (!drafts.length && !issues.length) {
    return {
      ok: false,
      error: "CSV had no expense rows",
      description: "Use Download template or Download demo CSV, then fill amounts and dates",
      issues: [],
    };
  }

  return { ok: true, drafts, issues };
}

export function expenseDuplicateKey(input: {
  date: Date | string;
  amount: number;
  payee: string;
  mode: string;
  payeeType?: string;
}): string {
  const day =
    input.date instanceof Date
      ? csvDayKey(input.date)
      : csvDayKey(parseIndianDate(String(input.date).slice(0, 10)) ?? new Date(0));
  return [
    day,
    String(Math.round(input.amount)),
    normalizePersonKey(input.payee),
    headerKey(input.mode),
    normalizePayeeType(input.payeeType),
  ].join("|");
}

function matchStaff(
  staff: Staff[],
  row: Pick<ExpenseCsvDraft, "staffId" | "staffName" | "payee">,
): Staff | "ambiguous" | undefined {
  const id = row.staffId.trim().toLowerCase();
  if (id) {
    const byId = staff.find((member) => member.id.trim().toLowerCase() === id);
    return byId;
  }
  const name = normalizePersonKey(row.staffName || row.payee);
  if (!name) return undefined;
  const matches = staff.filter((member) => normalizePersonKey(member.name) === name);
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) return "ambiguous";
  return undefined;
}

export function resolveExpenseImportRows(
  drafts: ExpenseCsvDraft[],
  opts: {
    staff: Staff[];
    existingKeys: Iterable<string>;
  },
): { ready: ResolvedExpenseImport[]; issues: ExpenseCsvIssue[] } {
  const seen = new Set(opts.existingKeys);
  const ready: ResolvedExpenseImport[] = [];
  const issues: ExpenseCsvIssue[] = [];

  for (const draft of drafts) {
    const rowLabel = draft.description || draft.category || `Row ${draft.line}`;
    let staffId: string | undefined;
    let staffName: string | undefined;
    let salaryMonth: string | undefined;

    if (draft.payeeType === "Salary") {
      const matched = matchStaff(opts.staff, draft);
      if (matched === "ambiguous") {
        issues.push({
          line: draft.line,
          rowLabel,
          message: `Multiple staff named “${draft.staffName || draft.payee}” — add Staff ID`,
        });
        continue;
      }
      if (!matched) {
        issues.push({
          line: draft.line,
          rowLabel,
          message: "Salary row needs a matching Staff ID or Staff Name",
        });
        continue;
      }
      staffId = matched.id;
      staffName = matched.name;
      salaryMonth = draft.salaryMonth || currentPayrollMonth(draft.date);
    }

    const payee = draft.payeeType === "Salary" ? (staffName ?? draft.payee) : draft.payee;
    const descParts = [
      draft.description,
      draft.payeeType === "Salary" && salaryMonth ? formatPayrollMonthLabel(salaryMonth) : "",
    ].filter(Boolean);
    const desc = descParts.join(" · ");
    const key = expenseDuplicateKey({
      date: draft.date,
      amount: draft.amount,
      payee,
      mode: draft.mode,
      payeeType: draft.payeeType,
    });
    const duplicate = seen.has(key);
    seen.add(key);

    ready.push({
      line: draft.line,
      payee,
      desc,
      amount: draft.amount,
      mode: draft.mode,
      payeeType: draft.payeeType,
      time: draft.date,
      status: draft.payeeType === "Salary" ? "Queued" : "Cleared",
      staffId,
      staffName,
      salaryMonth,
      category: draft.category,
      duplicate,
      previewLabel: payee,
      previewExtra: `${draft.payeeType} · ${desc} · ${draft.mode}`,
    });
  }

  return { ready, issues };
}

export function expenseCsvTemplateRows(): (string | number)[][] {
  return [
    [
      "14/04/2026",
      "Classroom markers and registers",
      "Stationery & Supplies",
      "Other Expense",
      "Cash",
      "800",
      "Office",
      "",
      "",
      "",
    ],
    [
      "03/06/2026",
      "June salary",
      "Salary & Wages",
      "Salary",
      "Bank",
      "2167",
      "",
      "STF-001",
      "Sample Staff",
      "2026-06",
    ],
  ];
}

export function expenseCsvDemoRows(staff?: Staff[]): (string | number)[][] {
  const member = staff?.find((s) => s.active !== false) ?? staff?.[0];
  const payroll = member ? currentPayrollMonth() : "2026-06";
  return [
    [
      "07/08/2025",
      "Office general supplies",
      "General Supplies",
      "Other Expense",
      "Bank",
      "700",
      "Office",
      "",
      "",
      "",
    ],
    [
      "15/08/2025",
      "Notebooks and pens",
      "Stationery & Supplies",
      "Other Expense",
      "Cash",
      "1631",
      "Office",
      "",
      "",
      "",
    ],
    [
      "20/09/2025",
      "Auto fare",
      "Transportation & Fuel",
      "Other Expense",
      "Cash",
      "400",
      "Office",
      "",
      "",
      "",
    ],
    [
      "19/10/2025",
      "Staff tea and snacks",
      "Food & Refreshments",
      "Other Expense",
      "Cash",
      "2995",
      "Office",
      "",
      "",
      "",
    ],
    [
      "15/05/2026",
      "First aid kit",
      "Medical Expenses",
      "Other Expense",
      "Cash",
      "90",
      "Office",
      "",
      "",
      "",
    ],
    [
      "03/06/2026",
      "Salary",
      "Salary & Wages",
      "Salary",
      "Cash",
      member ? String(Math.max(1000, Math.round(member.basicSalary || 2167))) : "2167",
      member?.name ?? "",
      member?.id ?? "STF-001",
      member?.name ?? "Sample Staff",
      payroll,
    ],
  ];
}
