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
import { normalizeClassLabelKey, parseClassLabel, parseCsvText } from "@/lib/student-csv";
import {
  currentFeeMonth,
  inferFeePeriodKind,
  normalizePaymentCategoryLabel,
  type Payment,
  type PaymentCategory,
  type Student,
} from "@/lib/tenant-store";

export const FEE_COLLECTION_CSV_HEADERS = [
  "Date",
  "Received From",
  "Class",
  "Student",
  "Student ID",
  "Payer Name",
  "Fee Description",
  "Fee Period",
  "Amount",
  "Payment Mode",
  "Narration",
] as const;

const HEADER_ALIASES = {
  date: ["date", "receipt date", "paid on", "collection date"],
  receivedFrom: ["received from", "payer type", "source", "type"],
  className: ["class", "grade", "class name", "cls"],
  student: ["student", "student name", "name"],
  studentId: ["student id", "studentid", "admission number", "admission no", "id"],
  payerName: ["payer name", "payer", "external payer", "donor", "donor name"],
  description: [
    "fee description",
    "description",
    "category",
    "fee item",
    "fee head",
    "particulars",
  ],
  period: ["fee period", "period", "fee month", "month", "term"],
  amount: ["amount", "amount inr", "amount (inr)", "inr", "value", "fees"],
  mode: ["payment mode", "mode", "paid via", "method"],
  narration: ["narration", "note", "remarks", "comment"],
} as const;

export type FeeCsvIssue = {
  line: number;
  message: string;
  rowLabel: string;
};

export type FeeCsvDraft = {
  line: number;
  date: Date;
  receivedFrom: "student" | "external";
  className: string;
  studentName: string;
  studentId: string;
  payerName: string;
  description: string;
  feePeriod: string;
  amount: number;
  mode: "Bank" | "Cash" | "Both";
  narration: string;
};

export type ParseFeeCsvResult =
  | { ok: true; drafts: FeeCsvDraft[]; issues: FeeCsvIssue[] }
  | { ok: false; error: string; description?: string; issues: FeeCsvIssue[] };

export type ResolvedFeeImport = {
  line: number;
  date: Date;
  payment: Omit<Payment, "id"> & { id: string };
  studentId?: string;
  duplicate: boolean;
  previewLabel: string;
  previewExtra: string;
};

function looksLikeFeeHeader(cells: string[]): boolean {
  const joined = cells.map(headerKey).join(" ");
  return /\bdate\b/.test(joined) && /\b(amount|student|fee|received from|payer)\b/.test(joined);
}

function inferPayerSource(raw: string, studentName: string, studentId: string, payerName: string) {
  const v = headerKey(raw);
  if (/\bexternal\b|\bdonor\b|\bother\b/.test(v)) return "external" as const;
  if (/\bstudent\b/.test(v)) return "student" as const;
  if (!studentName && !studentId && payerName) return "external" as const;
  return "student" as const;
}

function skipRow(cells: string[]): boolean {
  if (!cells.some((c) => c.trim())) return true;
  if (looksLikeTitleRow(cells)) return true;
  if (looksLikeTotalRow(cells)) return true;
  return false;
}

function classMatches(studentCls: string, selectedClass: string): boolean {
  const selected = selectedClass.trim();
  const enrolled = studentCls.trim();
  if (!selected) return true;
  if (!enrolled) return false;
  if (normalizeClassLabelKey(enrolled) === normalizeClassLabelKey(selected)) return true;
  const student = parseClassLabel(enrolled);
  const target = parseClassLabel(selected);
  if (student.grade.toLowerCase() !== target.grade.toLowerCase()) return false;
  if (!target.section) return true;
  if (!student.section) return false;
  return student.section.toLowerCase() === target.section.toLowerCase();
}

export function matchStudentForFeeCsv(
  students: Student[],
  opts: { id: string; name: string; className: string },
): { ok: true; student: Student } | { ok: false; error: string } {
  const id = opts.id.trim().toLowerCase();
  if (id) {
    const byId = students.find(
      (s) =>
        s.id.trim().toLowerCase() === id || (s.admissionNumber ?? "").trim().toLowerCase() === id,
    );
    if (!byId) return { ok: false, error: `No student with ID ${opts.id.trim()}` };
    if (opts.className && !classMatches(byId.cls, opts.className)) {
      return {
        ok: false,
        error: `Student ${byId.name} is in ${byId.cls}, not ${opts.className.trim()}`,
      };
    }
    return { ok: true, student: byId };
  }

  const name = normalizePersonKey(opts.name);
  if (!name) {
    return { ok: false, error: "Student name or Student ID is required" };
  }

  const named = students.filter((s) => normalizePersonKey(s.name) === name);
  const inClass = opts.className ? named.filter((s) => classMatches(s.cls, opts.className)) : named;

  if (inClass.length === 1) return { ok: true, student: inClass[0] };
  if (inClass.length > 1) {
    return {
      ok: false,
      error: opts.className
        ? `Multiple students named “${opts.name.trim()}” in ${opts.className.trim()} — add Student ID`
        : `Multiple students named “${opts.name.trim()}” — add Class or Student ID`,
    };
  }
  if (named.length > 0) {
    return {
      ok: false,
      error: `“${opts.name.trim()}” is not in class ${opts.className.trim()}`,
    };
  }
  return { ok: false, error: `Student “${opts.name.trim()}” was not found` };
}

export function matchFeeCategory(
  categories: PaymentCategory[],
  raw: string,
  fallback = "Other",
): string {
  const wanted = normalizePaymentCategoryLabel(raw).trim();
  if (!wanted) {
    return (
      categories.find((c) => /other/i.test(c.label))?.label ??
      categories.find((c) => c.active !== false)?.label ??
      fallback
    );
  }
  const key = wanted.toLowerCase();
  const exact = categories.find(
    (c) => normalizePaymentCategoryLabel(c.label).toLowerCase() === key,
  );
  if (exact) return exact.label;
  const partial = categories.find((c) => {
    const label = normalizePaymentCategoryLabel(c.label).toLowerCase();
    return label.includes(key) || key.includes(label);
  });
  if (partial) return partial.label;
  return wanted;
}

export function parseFeeCollectionCsv(text: string): ParseFeeCsvResult {
  const table = parseCsvText(text);
  if (!table.length) {
    return { ok: false, error: "Empty CSV file", issues: [] };
  }

  let start = 0;
  let dateIdx = 0;
  let receivedFromIdx = 1;
  let classIdx = 2;
  let studentIdx = 3;
  let studentIdIdx = 4;
  let payerNameIdx = 5;
  let descriptionIdx = 6;
  let periodIdx = 7;
  let amountIdx = 8;
  let modeIdx = 9;
  let narrationIdx = 10;

  const headerRow = table.findIndex((row) => looksLikeFeeHeader(row));
  if (headerRow >= 0) {
    const headers = table[headerRow] ?? [];
    dateIdx = columnIndex(headers, [...HEADER_ALIASES.date]);
    receivedFromIdx = columnIndex(headers, [...HEADER_ALIASES.receivedFrom]);
    classIdx = columnIndex(headers, [...HEADER_ALIASES.className]);
    studentIdx = columnIndex(headers, [...HEADER_ALIASES.student]);
    studentIdIdx = columnIndex(headers, [...HEADER_ALIASES.studentId]);
    payerNameIdx = columnIndex(headers, [...HEADER_ALIASES.payerName]);
    descriptionIdx = columnIndex(headers, [...HEADER_ALIASES.description]);
    periodIdx = columnIndex(headers, [...HEADER_ALIASES.period]);
    amountIdx = columnIndex(headers, [...HEADER_ALIASES.amount]);
    modeIdx = columnIndex(headers, [...HEADER_ALIASES.mode]);
    narrationIdx = columnIndex(headers, [...HEADER_ALIASES.narration]);
    if (dateIdx < 0 || amountIdx < 0) {
      return {
        ok: false,
        error: "CSV missing Date or Amount",
        description:
          "Expected Date, Received From, Class, Student, Fee Description, Fee Period, Amount, Payment Mode",
        issues: [],
      };
    }
    start = headerRow + 1;
  }

  const drafts: FeeCsvDraft[] = [];
  const issues: FeeCsvIssue[] = [];

  for (let i = start; i < table.length; i++) {
    const cells = table[i] ?? [];
    if (skipRow(cells)) continue;
    const line = i + 1;
    const dateRaw = cell(cells, dateIdx);
    const studentName = cell(cells, studentIdx);
    const studentId = cell(cells, studentIdIdx);
    const payerName = cell(cells, payerNameIdx);
    const description = cell(cells, descriptionIdx);
    const amount = parseCsvMoney(cell(cells, amountIdx));
    const rowLabel = studentName || payerName || description || dateRaw || `Row ${line}`;

    if (!dateRaw && amount <= 0 && !studentName && !payerName) continue;

    const date = parseIndianDate(dateRaw);
    if (!date) {
      issues.push({ line, rowLabel, message: "Date is missing or not DD/MM/YYYY" });
      continue;
    }
    if (amount <= 0) {
      issues.push({ line, rowLabel, message: "Amount must be greater than 0" });
      continue;
    }

    const receivedFrom = inferPayerSource(
      cell(cells, receivedFromIdx),
      studentName,
      studentId,
      payerName,
    );
    drafts.push({
      line,
      date,
      receivedFrom,
      className: cell(cells, classIdx),
      studentName,
      studentId,
      payerName,
      description,
      feePeriod: cell(cells, periodIdx),
      amount,
      mode: parsePaymentMode(cell(cells, modeIdx)) || "Bank",
      narration: cell(cells, narrationIdx),
    });
  }

  if (!drafts.length && !issues.length) {
    return {
      ok: false,
      error: "CSV had no fee collection rows",
      description: "Use Download template or Download demo CSV, then fill student and amount",
      issues: [],
    };
  }

  return { ok: true, drafts, issues };
}

export function feeDuplicateKey(input: {
  date: Date | string;
  amount: number;
  name: string;
  mode: string;
  feePeriod?: string;
  cat?: string;
}): string {
  const day =
    input.date instanceof Date
      ? csvDayKey(input.date)
      : csvDayKey(parseIndianDate(String(input.date).slice(0, 10)) ?? new Date(0));
  return [
    day,
    String(Math.round(input.amount)),
    normalizePersonKey(input.name),
    headerKey(input.mode),
    headerKey(input.feePeriod ?? ""),
    headerKey(input.cat ?? ""),
  ].join("|");
}

export function resolveFeeImportRows(
  drafts: FeeCsvDraft[],
  opts: {
    students: Student[];
    categories: PaymentCategory[];
    academicYear: string;
    existingKeys: Iterable<string>;
  },
): { ready: ResolvedFeeImport[]; issues: FeeCsvIssue[] } {
  const seen = new Set(opts.existingKeys);
  const ready: ResolvedFeeImport[] = [];
  const issues: FeeCsvIssue[] = [];

  for (const draft of drafts) {
    const rowLabel =
      draft.studentName || draft.payerName || draft.description || `Row ${draft.line}`;

    if (draft.receivedFrom === "external") {
      const payer = draft.payerName || draft.studentName;
      if (!payer) {
        issues.push({
          line: draft.line,
          rowLabel,
          message: "External rows need a Payer Name",
        });
        continue;
      }
      const cat = matchFeeCategory(opts.categories, draft.description, "Donation");
      const feePeriod = draft.feePeriod.trim() || currentFeeMonth(draft.date);
      const key = feeDuplicateKey({
        date: draft.date,
        amount: draft.amount,
        name: payer,
        mode: draft.mode,
        feePeriod,
        cat,
      });
      const duplicate = seen.has(key);
      seen.add(key);
      ready.push({
        line: draft.line,
        date: draft.date,
        studentId: undefined,
        duplicate,
        previewLabel: payer,
        previewExtra: `External · ${cat} · ${feePeriod} · ${draft.mode}`,
        payment: {
          id: "",
          name: payer,
          cat,
          mode: draft.mode,
          amount: draft.amount,
          time: "",
          academicYear: opts.academicYear,
          payerType: "external",
          feePeriodKind: inferFeePeriodKind(feePeriod, cat),
          feePeriod,
          feeMonth: feePeriod,
          ...(draft.narration ? { narration: draft.narration } : {}),
        },
      });
      continue;
    }

    const matched = matchStudentForFeeCsv(opts.students, {
      id: draft.studentId,
      name: draft.studentName,
      className: draft.className,
    });
    if (!matched.ok) {
      issues.push({ line: draft.line, rowLabel, message: matched.error });
      continue;
    }
    const student = matched.student;
    const cat = matchFeeCategory(opts.categories, draft.description, "Tuition Fee");
    const feePeriod = draft.feePeriod.trim() || currentFeeMonth(draft.date);
    const feePeriodKind = inferFeePeriodKind(feePeriod, cat);
    const key = feeDuplicateKey({
      date: draft.date,
      amount: draft.amount,
      name: student.name,
      mode: draft.mode,
      feePeriod,
      cat,
    });
    const duplicate = seen.has(key);
    seen.add(key);
    ready.push({
      line: draft.line,
      date: draft.date,
      studentId: student.id,
      duplicate,
      previewLabel: student.name,
      previewExtra: `${student.cls} · ${cat} · ${feePeriod} · ${draft.mode}`,
      payment: {
        id: "",
        name: student.name,
        cat,
        mode: draft.mode,
        amount: draft.amount,
        time: "",
        academicYear: opts.academicYear,
        payerType: "student",
        className: student.cls,
        feePeriodKind,
        feePeriod,
        feeMonth: feePeriod,
        feeLines: [
          {
            description: cat,
            amount: draft.amount,
            feePeriodKind,
            feePeriod,
          },
        ],
        ...(draft.narration ? { narration: draft.narration } : {}),
      },
    });
  }

  return { ready, issues };
}

export function feeCollectionCsvTemplateRows(): (string | number)[][] {
  return [
    [
      "14/09/2026",
      "Student",
      "6 - A",
      "Aisha Khan",
      "STU-001",
      "",
      "Tuition Fee",
      "September",
      "2500",
      "Bank",
      "",
    ],
    [
      "14/09/2026",
      "External",
      "",
      "",
      "",
      "PTA Committee",
      "Donation",
      "September",
      "5000",
      "Bank",
      "Sports day contribution",
    ],
  ];
}

export function feeCollectionCsvDemoRows(students?: Student[]): (string | number)[][] {
  const live = (students ?? []).filter((s) => !s.deletedAt);
  const first = live[0];
  const second = live[1] ?? first;
  const month = currentFeeMonth();
  return [
    [
      "04/09/2026",
      "Student",
      first?.cls ?? "6 - A",
      first?.name ?? "Aisha Khan",
      first?.id ?? "STU-001",
      "",
      "Tuition Fee",
      month,
      "2500",
      "Bank",
      "",
    ],
    [
      "04/09/2026",
      "Student",
      second?.cls ?? "6 - A",
      second?.name ?? "Rahul Nair",
      second?.id ?? "STU-002",
      "",
      "Vehicle Fee",
      month,
      "800",
      "Cash",
      "",
    ],
    [
      "06/09/2026",
      "External",
      "",
      "",
      "",
      "PTA Committee",
      "Donation",
      month,
      "5000",
      "Bank",
      "Annual day contribution",
    ],
  ];
}
