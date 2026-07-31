import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { fetchRemoteTenantBundle } from "@/lib/api/tenant-sync";
import { getApiToken } from "@/lib/api/client";
import {
  normalizePermissionSet,
  type PermissionSet,
} from "@/lib/permissions";
import {
  academicYearBookStats,
  applyLedgerToStudent,
  buildLedgerFromStudents,
  cloneFeeTermsForYear,
  ensureYearLedger,
  filterByAcademicYear,
  getYearLedger,
  parseAcademicYearBounds,
  studentsForAcademicYear,
  syncLedgerFromActiveStudents,
  upsertStudentYearFields,
  yearHasBookData,
  type StudentYearFields,
  type StudentYearLedger,
} from "@/lib/academic-year";

export type { StudentYearFields, StudentYearLedger };
export {
  academicYearBookStats,
  cloneFeeTermsForYear,
  filterByAcademicYear,
  getYearLedger,
  parseAcademicYearBounds,
  studentsForAcademicYear,
  upsertStudentYearFields,
  yearHasBookData,
};

export type GuardianRelation = "Father" | "Mother" | "Others";

export const STUDENT_RELIGIONS = [
  "Buddhist",
  "Christian",
  "Hindu",
  "Muslim",
  "Islam",
  "Other",
  "Nil",
] as const;

export const STUDENT_CATEGORIES = [
  "GENERAL",
  "OBC",
  "OEC",
  "ST",
  "SC",
  "Others",
] as const;

export const BLOOD_GROUPS = [
  "A+",
  "B+",
  "AB+",
  "A-",
  "B-",
  "AB-",
  "O+",
  "O-",
] as const;

export const GUARDIAN_RELATIONS = ["Father", "Mother", "Others"] as const;

export type Student = {
  id: string;
  name: string;
  cls: string;
  guardian: string;
  due: number;
  gender?: "M" | "F";
  phone?: string;
  dob?: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  aadhaar?: string;
  /** School admission / register number (distinct from internal id) */
  admissionNumber?: string;
  placeOfBirth?: string;
  nationality?: string;
  religion?: string;
  studentCategory?: string;
  bloodGroup?: string;
  fatherOccupation?: string;
  motherName?: string;
  guardianRelation?: GuardianRelation;
  guardianOccupation?: string;
  needsBus?: boolean;
  busPoint1?: string;
  busPoint2?: string;
  active?: boolean;
  /** Opaque token for the public parent profile link */
  shareToken?: string;
  /** Identity documents with optional file attachments */
  documents?: StaffDocument[];
  /** ISO timestamp when moved to recycle bin; absent means live in directory */
  deletedAt?: string;
};

export type StaffDocumentAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
  /** Attachment folder / level within the document (Front, Back, custom, …) */
  levelId: string;
};

export type StaffDocumentLevel = {
  id: string;
  label: string;
};

export type StaffDocument = {
  id: string;
  label: string;
  number: string;
  levels: StaffDocumentLevel[];
  attachments: StaffDocumentAttachment[];
};

/** Front / Back scans for Aadhaar and PAN */
export const ID_CARD_ATTACHMENT_LEVELS: StaffDocumentLevel[] = [
  { id: "front", label: "Front" },
  { id: "back", label: "Back" },
];

/** Single bucket for certificates, contracts, and other files */
export const OTHER_ATTACHMENT_LEVELS: StaffDocumentLevel[] = [
  { id: "files", label: "Files" },
];

/** @deprecated Prefer ID_CARD_ATTACHMENT_LEVELS / OTHER_ATTACHMENT_LEVELS */
export const DEFAULT_ATTACHMENT_LEVELS: StaffDocumentLevel[] = [
  ...ID_CARD_ATTACHMENT_LEVELS,
  { id: "other", label: "Other" },
];

export const DEFAULT_STAFF_DOCUMENTS: StaffDocument[] = [
  {
    id: "doc-aadhaar",
    label: "Aadhaar",
    number: "",
    levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
    attachments: [],
  },
  {
    id: "doc-pan",
    label: "PAN Card",
    number: "",
    levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
    attachments: [],
  },
  {
    id: "doc-other",
    label: "Other Attachments",
    number: "",
    levels: OTHER_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
    attachments: [],
  },
];

/** Student identity docs · Aadhaar + supporting files (birth/TC/etc.) */
export const DEFAULT_STUDENT_DOCUMENTS: StaffDocument[] = [
  {
    id: "doc-aadhaar",
    label: "Aadhaar",
    number: "",
    levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
    attachments: [],
  },
  {
    id: "doc-other",
    label: "Additional Files",
    number: "",
    levels: OTHER_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
    attachments: [],
  },
];

export type StudentDocument = StaffDocument;
export type StudentDocumentAttachment = StaffDocumentAttachment;

export type StaffSalaryHistoryEntry = {
  id: string;
  amount: number;
  mode: string;
  paidAt: string;
  description: string;
  status: "Paid" | "Queued" | "Cleared";
};

/** One month of attendance used for pro-rata payroll */
export type StaffAttendanceMonth = {
  /** Calendar month key · YYYY-MM */
  month: string;
  daysPresent: number;
  workingDays: number;
};

export type StaffStatusEvent = {
  id: string;
  type: "joined" | "deactivated" | "reactivated";
  /** ISO date-time string */
  at: string;
  note?: string;
};

export type Staff = {
  id: string;
  name: string;
  role: string;
  dept: string;
  active: boolean;
  joinedAt: string;
  phone?: string;
  /** Optional secondary contact number */
  altPhone?: string;
  /** Guardian / emergency contact number */
  guardianPhone?: string;
  photoUrl?: string;
  basicSalary: number;
  additionalAllowances: number;
  /** Monthly attendance rows · drives pro-rata salary when present */
  attendanceByMonth?: StaffAttendanceMonth[];
  documents: StaffDocument[];
  salaryHistory: StaffSalaryHistoryEntry[];
  statusHistory: StaffStatusEvent[];
  /** ISO timestamp when moved to recycle bin; absent means live on roster */
  deletedAt?: string;
};

/** Current payroll month key · YYYY-MM */
export function currentPayrollMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatPayrollMonthLabel(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month.trim());
  if (!match) return month;
  const y = Number(match[1]);
  const m = Number(match[2]);
  if (!y || m < 1 || m > 12) return month;
  return new Date(y, m - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function staffGrossSalary(staff: Pick<Staff, "basicSalary" | "additionalAllowances">): number {
  return Math.max(0, Math.round((staff.basicSalary || 0) + (staff.additionalAllowances || 0)));
}

export function getStaffAttendanceForMonth(
  staff: Pick<Staff, "attendanceByMonth">,
  month: string,
): StaffAttendanceMonth | undefined {
  const key = month.trim();
  if (!key) return undefined;
  return (staff.attendanceByMonth ?? []).find((row) => row.month === key);
}

/**
 * Payable salary for a month.
 * With attendance: gross × (daysPresent / workingDays).
 * Without attendance: full gross (unchanged behaviour).
 */
export function staffPayableSalary(
  staff: Pick<Staff, "basicSalary" | "additionalAllowances" | "attendanceByMonth">,
  month: string = currentPayrollMonth(),
): {
  gross: number;
  payable: number;
  ratio: number;
  attendance?: StaffAttendanceMonth;
} {
  const gross = staffGrossSalary(staff);
  const attendance = getStaffAttendanceForMonth(staff, month);
  if (
    !attendance ||
    !Number.isFinite(attendance.workingDays) ||
    attendance.workingDays <= 0
  ) {
    return { gross, payable: gross, ratio: 1 };
  }
  const present = Math.max(0, Math.min(attendance.daysPresent, attendance.workingDays));
  const ratio = present / attendance.workingDays;
  const payable = Math.round(gross * ratio);
  return { gross, payable, ratio, attendance };
}

export function normalizeStaffAttendanceMonth(
  raw: Partial<StaffAttendanceMonth> | null | undefined,
): StaffAttendanceMonth | null {
  if (!raw || typeof raw !== "object") return null;
  const month =
    typeof raw.month === "string" && /^\d{4}-\d{2}$/.test(raw.month.trim())
      ? raw.month.trim()
      : null;
  if (!month) return null;
  const daysPresent =
    typeof raw.daysPresent === "number" && Number.isFinite(raw.daysPresent)
      ? Math.max(0, Math.round(raw.daysPresent))
      : 0;
  const workingDays =
    typeof raw.workingDays === "number" && Number.isFinite(raw.workingDays)
      ? Math.max(0, Math.round(raw.workingDays))
      : 0;
  if (workingDays <= 0) return null;
  return {
    month,
    daysPresent: Math.min(daysPresent, workingDays),
    workingDays,
  };
}

export function upsertStaffAttendanceMonth(
  existing: StaffAttendanceMonth[] | undefined,
  next: StaffAttendanceMonth,
): StaffAttendanceMonth[] {
  const list = [...(existing ?? [])];
  const idx = list.findIndex((row) => row.month === next.month);
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  return list.sort((a, b) => b.month.localeCompare(a.month));
}

function normalizeAttachment(raw: unknown): StaffDocumentAttachment | null {
  if (!raw || typeof raw !== "object") return null;
  const attachment = raw as Partial<StaffDocumentAttachment>;
  if (
    typeof attachment.id !== "string" ||
    typeof attachment.name !== "string" ||
    typeof attachment.dataUrl !== "string" ||
    typeof attachment.size !== "number"
  ) {
    return null;
  }
  const levelId =
    typeof attachment.levelId === "string" && attachment.levelId.trim()
      ? attachment.levelId.trim()
      : "other";
  return {
    id: attachment.id,
    name: attachment.name,
    mimeType:
      typeof attachment.mimeType === "string" ? attachment.mimeType : "application/octet-stream",
    size: attachment.size,
    dataUrl: attachment.dataUrl,
    uploadedAt:
      typeof attachment.uploadedAt === "string" ? attachment.uploadedAt : new Date().toISOString(),
    levelId,
  };
}

function normalizeDocumentLevels(
  raw: unknown,
  defaultsInput: StaffDocumentLevel[],
): StaffDocumentLevel[] {
  const defaults = defaultsInput.map((l) => ({ ...l }));
  if (!Array.isArray(raw) || !raw.length) return defaults;
  const custom: StaffDocumentLevel[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const level = item as Partial<StaffDocumentLevel>;
    if (typeof level.id !== "string" || typeof level.label !== "string") continue;
    const id = level.id.trim();
    const label = level.label.trim();
    if (!id || !label || seen.has(id)) continue;
    seen.add(id);
    custom.push({ id, label });
  }
  if (!custom.length) return defaults;
  // Keep default levels first, then any extras that still have files
  const byId = new Map(custom.map((l) => [l.id, l]));
  const merged = defaults.map((d) => byId.get(d.id) ?? d);
  for (const level of custom) {
    if (!defaults.some((d) => d.id === level.id)) merged.push(level);
  }
  return merged;
}

function normalizeSalaryHistory(raw: unknown): StaffSalaryHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: StaffSalaryHistoryEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<StaffSalaryHistoryEntry>;
    if (
      typeof row.id !== "string" ||
      typeof row.amount !== "number" ||
      !Number.isFinite(row.amount) ||
      typeof row.paidAt !== "string"
    ) {
      continue;
    }
    const status =
      row.status === "Paid" || row.status === "Queued" || row.status === "Cleared"
        ? row.status
        : "Paid";
    entries.push({
      id: row.id,
      amount: row.amount,
      mode: typeof row.mode === "string" && row.mode ? row.mode : "Bank",
      paidAt: row.paidAt,
      description:
        typeof row.description === "string" && row.description
          ? row.description
          : "Salary payment",
      status,
    });
  }
  return entries;
}

function toJoinedIso(joinedAt: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(joinedAt)) {
    return `${joinedAt}T09:30:00.000Z`;
  }
  const parsed = Date.parse(joinedAt);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  return new Date().toISOString();
}

function normalizeStatusHistory(
  raw: unknown,
  joinedAt: string,
  staffId: string,
): StaffStatusEvent[] {
  const events: StaffStatusEvent[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const row = item as Partial<StaffStatusEvent>;
      if (
        typeof row.id !== "string" ||
        typeof row.at !== "string" ||
        (row.type !== "joined" && row.type !== "deactivated" && row.type !== "reactivated")
      ) {
        continue;
      }
      events.push({
        id: row.id,
        type: row.type,
        at: row.at,
        note: typeof row.note === "string" && row.note ? row.note : undefined,
      });
    }
  }
  if (!events.some((e) => e.type === "joined")) {
    events.push({
      id: `EVT-${staffId}-joined`,
      type: "joined",
      at: toJoinedIso(joinedAt),
      note: "Joined the school roster",
    });
  }
  return events.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

function normalizeStaffDocuments(raw: StaffDocument[] | undefined): StaffDocument[] {
  const byId = new Map(Array.isArray(raw) ? raw.map((d) => [d.id, d]) : []);
  return DEFAULT_STAFF_DOCUMENTS.map((def) => {
    const existing = byId.get(def.id);
    const attachments = Array.isArray(existing?.attachments)
      ? existing.attachments
          .map(normalizeAttachment)
          .filter((a): a is StaffDocumentAttachment => a !== null)
      : [];
    const levels = normalizeDocumentLevels(existing?.levels, def.levels);
    // Ensure every attachment level exists in levels list
    const levelIds = new Set(levels.map((l) => l.id));
    for (const file of attachments) {
      if (!levelIds.has(file.levelId)) {
        const label =
          file.levelId === "other"
            ? "Other"
            : file.levelId === "files"
              ? "Files"
              : file.levelId;
        levels.push({ id: file.levelId, label });
        levelIds.add(file.levelId);
      }
    }
    return {
      ...def,
      number: typeof existing?.number === "string" ? existing.number : "",
      levels,
      attachments,
    };
  });
}

function normalizeStudentDocuments(
  raw: StaffDocument[] | undefined,
  aadhaar?: string,
): StaffDocument[] {
  const byId = new Map(Array.isArray(raw) ? raw.map((d) => [d.id, d]) : []);
  return DEFAULT_STUDENT_DOCUMENTS.map((def) => {
    const existing = byId.get(def.id);
    const attachments = Array.isArray(existing?.attachments)
      ? existing.attachments
          .map(normalizeAttachment)
          .filter((a): a is StaffDocumentAttachment => a !== null)
      : [];
    const levels = normalizeDocumentLevels(existing?.levels, def.levels);
    const levelIds = new Set(levels.map((l) => l.id));
    for (const file of attachments) {
      if (!levelIds.has(file.levelId)) {
        const label =
          file.levelId === "other"
            ? "Other"
            : file.levelId === "files"
              ? "Files"
              : file.levelId;
        levels.push({ id: file.levelId, label });
        levelIds.add(file.levelId);
      }
    }
    const existingNumber = typeof existing?.number === "string" ? existing.number.trim() : "";
    const number =
      def.id === "doc-aadhaar"
        ? existingNumber || (aadhaar ?? "").trim()
        : existingNumber;
    return {
      ...def,
      number,
      levels,
      attachments,
    };
  });
}

function optionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function normalizeStudent(
  raw: Partial<Student> & Pick<Student, "id" | "name" | "cls" | "guardian" | "due">,
): Student {
  const guardianRelation = GUARDIAN_RELATIONS.includes(
    raw.guardianRelation as GuardianRelation,
  )
    ? (raw.guardianRelation as GuardianRelation)
    : undefined;

  return {
    id: raw.id,
    name: raw.name,
    cls: raw.cls,
    guardian: raw.guardian,
    due: typeof raw.due === "number" && Number.isFinite(raw.due) ? raw.due : 0,
    gender: raw.gender === "M" || raw.gender === "F" ? raw.gender : undefined,
    phone: optionalTrimmedString(raw.phone),
    dob: optionalTrimmedString(raw.dob),
    email: optionalTrimmedString(raw.email),
    address: optionalTrimmedString(raw.address),
    photoUrl: optionalTrimmedString(raw.photoUrl),
    aadhaar: optionalTrimmedString(raw.aadhaar),
    admissionNumber:
      optionalTrimmedString(raw.admissionNumber) ??
      (raw.id.startsWith("STU-") ? `ADM-${raw.id.slice(4)}` : undefined),
    placeOfBirth: optionalTrimmedString(raw.placeOfBirth),
    nationality: optionalTrimmedString(raw.nationality),
    religion: optionalTrimmedString(raw.religion),
    studentCategory: optionalTrimmedString(raw.studentCategory),
    bloodGroup: optionalTrimmedString(raw.bloodGroup),
    fatherOccupation: optionalTrimmedString(raw.fatherOccupation),
    motherName: optionalTrimmedString(raw.motherName),
    guardianRelation,
    guardianOccupation: optionalTrimmedString(raw.guardianOccupation),
    needsBus: typeof raw.needsBus === "boolean" ? raw.needsBus : undefined,
    busPoint1: optionalTrimmedString(raw.busPoint1),
    busPoint2: optionalTrimmedString(raw.busPoint2),
    active: typeof raw.active === "boolean" ? raw.active : true,
    shareToken:
      typeof raw.shareToken === "string" && raw.shareToken.trim()
        ? raw.shareToken.trim()
        : undefined,
    documents: normalizeStudentDocuments(raw.documents, optionalTrimmedString(raw.aadhaar)),
    deletedAt:
      typeof raw.deletedAt === "string" && raw.deletedAt.trim() ? raw.deletedAt.trim() : undefined,
  };
}

export function normalizeStaff(raw: Partial<Staff> & Pick<Staff, "id" | "name" | "role" | "dept" | "active">): Staff {
  const joinedAt = typeof raw.joinedAt === "string" && raw.joinedAt ? raw.joinedAt : "2025-01-01";
  const attendanceByMonth = Array.isArray(raw.attendanceByMonth)
    ? raw.attendanceByMonth
        .map((row) => normalizeStaffAttendanceMonth(row))
        .filter((row): row is StaffAttendanceMonth => row !== null)
        .sort((a, b) => b.month.localeCompare(a.month))
    : undefined;
  return {
    id: raw.id,
    name: raw.name,
    role: raw.role,
    dept: raw.dept,
    active: raw.active,
    joinedAt,
    phone: typeof raw.phone === "string" ? raw.phone : undefined,
    altPhone: typeof raw.altPhone === "string" && raw.altPhone.trim() ? raw.altPhone.trim() : undefined,
    guardianPhone:
      typeof raw.guardianPhone === "string" && raw.guardianPhone.trim()
        ? raw.guardianPhone.trim()
        : undefined,
    photoUrl: typeof raw.photoUrl === "string" && raw.photoUrl ? raw.photoUrl : undefined,
    basicSalary:
      typeof raw.basicSalary === "number" && Number.isFinite(raw.basicSalary) ? raw.basicSalary : 8000,
    additionalAllowances:
      typeof raw.additionalAllowances === "number" && Number.isFinite(raw.additionalAllowances)
        ? raw.additionalAllowances
        : 0,
    ...(attendanceByMonth && attendanceByMonth.length
      ? { attendanceByMonth }
      : {}),
    documents: normalizeStaffDocuments(raw.documents),
    salaryHistory: normalizeSalaryHistory(raw.salaryHistory),
    statusHistory: normalizeStatusHistory(raw.statusHistory, joinedAt, raw.id),
    deletedAt:
      typeof raw.deletedAt === "string" && raw.deletedAt.trim() ? raw.deletedAt.trim() : undefined,
  };
}

export type PaymentAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
};

export type Payment = {
  id: string;
  name: string;
  cat: string;
  mode: string;
  amount: number;
  time: string;
  /** Academic year books this receipt belongs to · e.g. "AY 2025-26" */
  academicYear?: string;
  /** Student receipts reduce ledger due; external are school income only */
  payerType?: "student" | "external";
  className?: string;
  /** Whether the period is a calendar month or a configured fee term */
  feePeriodKind?: "month" | "term";
  /** Month name or fee-term label this receipt covers */
  feePeriod?: string;
  /**
   * @deprecated Prefer `feePeriod` — kept for older receipts
   * Calendar month the fee covers (e.g. "July") within the active academic year
   */
  feeMonth?: string;
  /** Optional free-text note on the receipt */
  narration?: string;
  /** Supporting files · bank slips, UPI screenshots, vouchers */
  attachments?: PaymentAttachment[];
};

/** Academic-year fee months · April–March (Indian school / FY order) */
export const FEE_MONTHS = [
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
] as const;

export type FeePeriodKind = "month" | "term";
export type FeeTermKind = "tuition" | "vehicle";
/** Whether this period is a multi-month term or a single calendar month */
export type FeePeriodMode = "term" | "month";

export type FeeTerm = {
  id: string;
  kind: FeeTermKind;
  /** term = Term 1/2/… · month = April/May/… */
  periodMode: FeePeriodMode;
  label: string;
  /** Academic year these periods belong to · e.g. "AY 2025-26" */
  academicYear?: string;
  /** Coverage start · ISO YYYY-MM-DD */
  startDate?: string;
  /** Coverage end · ISO YYYY-MM-DD */
  endDate?: string;
  /** Optional school-wide override · normally unused — Class Tier totals auto-split across periods */
  feeAmount?: number;
  /** Display coverage · auto-built from dates when present */
  coverage?: string;
};

export const FEE_TERM_KIND_LABELS: Record<FeeTermKind, string> = {
  tuition: "Tuition Fee",
  vehicle: "Vehicle Fee",
};

export const FEE_PERIOD_MODE_LABELS: Record<FeePeriodMode, string> = {
  term: "Term",
  month: "Month",
};

/**
 * Split a class-tier total evenly across N periods (terms or months).
 * Remainder rupees go to the earliest periods so the parts always sum to `total`.
 * e.g. 20000 / 4 → [5000, 5000, 5000, 5000]; 20001 / 4 → [5001, 5000, 5000, 5000]
 */
export function splitAmountAcrossTerms(total: number, termCount: number): number[] {
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(termCount) || termCount <= 0) {
    return [];
  }
  const safeTotal = Math.round(total);
  const count = Math.floor(termCount);
  const base = Math.floor(safeTotal / count);
  const rem = safeTotal % count;
  return Array.from({ length: count }, (_, i) => base + (i < rem ? 1 : 0));
}

export function resolveFeePeriodMode(value: unknown): FeePeriodMode {
  return value === "month" ? "month" : "term";
}

/** Stable order for fee periods of one kind · by start date, then label. */
export function sortFeeTerms(terms: FeeTerm[]): FeeTerm[] {
  return terms.slice().sort((a, b) => {
    const aStart = a.startDate ?? "";
    const bStart = b.startDate ?? "";
    if (aStart !== bStart) return aStart.localeCompare(bStart);
    return a.label.localeCompare(b.label);
  });
}

export function filterFeePeriods(
  terms: FeeTerm[],
  periodMode: FeePeriodMode,
  kind?: FeeTermKind | null,
): FeeTerm[] {
  return sortFeeTerms(
    terms.filter(
      (t) =>
        resolveFeePeriodMode(t.periodMode) === periodMode &&
        (kind ? t.kind === kind : true),
    ),
  );
}

/**
 * Per-period amount for a class tier total given the periods of that kind.
 * Returns undefined when total or periods are missing.
 */
export function classFeeAmountForTerm(
  totalAmount: number | undefined,
  termsOfKind: FeeTerm[],
  selectedTerm: Pick<FeeTerm, "id" | "label"> | undefined,
): number | undefined {
  if (!totalAmount || totalAmount <= 0 || !selectedTerm || termsOfKind.length === 0) {
    return undefined;
  }
  const ordered = sortFeeTerms(termsOfKind);
  const index = ordered.findIndex(
    (t) => t.id === selectedTerm.id || t.label === selectedTerm.label,
  );
  if (index < 0) return undefined;
  return splitAmountAcrossTerms(totalAmount, ordered.length)[index];
}

export function currentFeeMonth(date = new Date()): string {
  return date.toLocaleString("en-IN", { month: "long" });
}

function parseIsoDateParts(iso?: string): { y: number; m: number; d: number } | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

/** Short coverage label from ISO dates · e.g. "1 Apr 2025 – 30 Jun 2025" */
export function formatFeeTermCoverage(
  startDate?: string,
  endDate?: string,
  fallback?: string,
): string | undefined {
  const start = parseIsoDateParts(startDate);
  const end = parseIsoDateParts(endDate);
  if (start && end) {
    const fmt = (p: { y: number; m: number; d: number }) =>
      new Date(p.y, p.m - 1, p.d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    return `${fmt(start)} – ${fmt(end)}`;
  }
  const note = fallback?.trim();
  return note || undefined;
}

export function resolvePaymentFeePeriod(payment: Payment): string | undefined {
  const next = payment.feePeriod?.trim() || payment.feeMonth?.trim();
  return next || undefined;
}

export function resolvePaymentFeePeriodKind(payment: Payment): FeePeriodKind {
  if (payment.feePeriodKind === "term" || payment.feePeriodKind === "month") {
    return payment.feePeriodKind;
  }
  return "month";
}

/** Map a fee category label to the term group it uses (if any). */
export function categoryFeeTermKind(categoryLabel: string): FeeTermKind | null {
  const lower = categoryLabel.toLowerCase();
  if (lower.includes("tuition")) return "tuition";
  if (lower.includes("vehicle") || lower.includes("transport") || lower.includes("bus")) {
    return "vehicle";
  }
  return null;
}

export function normalizeFeeTerm(
  raw: Partial<FeeTerm> & Pick<FeeTerm, "id" | "label">,
  fallbackAcademicYear = "AY 2025-26",
): FeeTerm | null {
  const label = raw.label?.trim();
  if (!label || !raw.id?.trim()) return null;
  const kind: FeeTermKind = raw.kind === "vehicle" ? "vehicle" : "tuition";
  const periodMode = resolveFeePeriodMode(raw.periodMode);
  const startDate =
    typeof raw.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.startDate.trim())
      ? raw.startDate.trim()
      : undefined;
  const endDate =
    typeof raw.endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.endDate.trim())
      ? raw.endDate.trim()
      : undefined;
  const feeAmount =
    typeof raw.feeAmount === "number" && Number.isFinite(raw.feeAmount) && raw.feeAmount > 0
      ? Math.round(raw.feeAmount)
      : undefined;
  const coverage = formatFeeTermCoverage(startDate, endDate, raw.coverage);
  const academicYear =
    typeof raw.academicYear === "string" && raw.academicYear.trim()
      ? raw.academicYear.trim()
      : fallbackAcademicYear;
  return {
    id: raw.id.trim(),
    kind,
    periodMode,
    label,
    academicYear,
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(feeAmount !== undefined ? { feeAmount } : {}),
    ...(coverage ? { coverage } : {}),
  };
}

export type Department = {
  id: string;
  name: string;
  code: string;
};

export type Role = {
  id: string;
  title: string;
  departmentId: string;
};

export type TenantUser = {
  id: string;
  email: string;
  password: string;
  displayName: string;
  roleId?: string;
  staffId?: string;
  permissions: PermissionSet;
  active: boolean;
  createdAt: string;
};

export function normalizeTenantUser(raw: Partial<TenantUser> & Pick<TenantUser, "id" | "email">): TenantUser {
  const email = (raw.email ?? "").trim().toLowerCase();
  return {
    id: raw.id,
    email,
    password: typeof raw.password === "string" ? raw.password : "",
    displayName: (raw.displayName ?? email.split("@")[0] ?? "User").trim() || "User",
    roleId: raw.roleId?.trim() || undefined,
    staffId: raw.staffId?.trim() || undefined,
    permissions: normalizePermissionSet(raw.permissions),
    active: raw.active !== false,
    createdAt:
      typeof raw.createdAt === "string" && raw.createdAt
        ? raw.createdAt
        : new Date().toISOString(),
  };
}

export const SEED_TENANT_USERS: TenantUser[] = [];

export type ClassBillingCycle = "Monthly" | "Term" | "Annually";

export const CLASS_BILLING_CYCLES: ClassBillingCycle[] = [
  "Monthly",
  "Term",
  "Annually",
];

export const CLASS_BILLING_CYCLE_HINTS: Record<ClassBillingCycle, string> = {
  Monthly: "Total is split evenly across Fee Months (e.g. ₹24,000 ÷ 12 months = ₹2,000 each)",
  Term: "Total is split evenly across Fee Terms (e.g. ₹20,000 ÷ 4 terms = ₹5,000 each)",
  Annually: "Amount charged once per academic year",
};

export type ClassConfig = {
  id: string;
  /** Combined display / student match key · e.g. "Grade 8 - B" */
  className: string;
  /** Class level · e.g. "LKG", "Grade 8" */
  grade: string;
  /** Section / division · e.g. "A", "B" */
  section: string;
  /** Total tuition for one billing cycle */
  tuitionFeeAmount: number;
  /** Transport / vehicle fee for one billing cycle · 0 when not applicable */
  vehicleFeeAmount: number;
  /** How often tuition + vehicle amounts are billed */
  billingCycle: ClassBillingCycle;
  /** Optional class teacher from staff roster */
  classTeacherId?: string;
};

export function composeClassName(grade: string, section: string) {
  const g = grade.trim();
  const s = section.trim();
  if (g && s) return `${g} - ${s}`;
  return g || s;
}

export function splitClassName(className: string): { grade: string; section: string } {
  const dash = className.lastIndexOf(" - ");
  if (dash === -1) {
    return { grade: className.trim(), section: "" };
  }
  return {
    grade: className.slice(0, dash).trim(),
    section: className.slice(dash + 3).trim(),
  };
}

export function normalizeClassBillingCycle(
  value: unknown,
): ClassBillingCycle {
  if (value === "Annually" || value === "Term" || value === "Monthly") return value;
  return "Monthly";
}

export function normalizeClassConfig(
  raw: Partial<ClassConfig> & Pick<ClassConfig, "id" | "tuitionFeeAmount"> & {
    className?: string;
  },
): ClassConfig {
  const fromParts =
    typeof raw.grade === "string" || typeof raw.section === "string"
      ? {
          grade: (raw.grade ?? "").trim(),
          section: (raw.section ?? "").trim(),
        }
      : splitClassName(typeof raw.className === "string" ? raw.className : "");
  const grade = fromParts.grade;
  const section = fromParts.section;
  const className =
    typeof raw.className === "string" && raw.className.trim()
      ? raw.className.trim()
      : composeClassName(grade, section);
  const tuitionFeeAmount =
    typeof raw.tuitionFeeAmount === "number" && Number.isFinite(raw.tuitionFeeAmount)
      ? Math.max(0, Math.round(raw.tuitionFeeAmount))
      : 0;
  const vehicleFeeAmount =
    typeof raw.vehicleFeeAmount === "number" && Number.isFinite(raw.vehicleFeeAmount)
      ? Math.max(0, Math.round(raw.vehicleFeeAmount))
      : 0;
  return {
    id: raw.id,
    className,
    grade: grade || splitClassName(className).grade,
    section: section || splitClassName(className).section,
    tuitionFeeAmount,
    vehicleFeeAmount,
    billingCycle: normalizeClassBillingCycle(raw.billingCycle),
    classTeacherId:
      typeof raw.classTeacherId === "string" && raw.classTeacherId.trim()
        ? raw.classTeacherId.trim()
        : undefined,
  };
}

export type VehicleOwnership = "owned" | "rental";

export type VehicleDocumentKind = "rc" | "insurance" | "pollution" | "driverLicense";

export type VehicleDocumentFile = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
};

export type VehicleDocument = {
  kind: VehicleDocumentKind;
  /** Validity end date as YYYY-MM-DD */
  validUntil?: string;
  /** Days before expiry to raise a notification (default 30) */
  notifyDaysBefore?: number;
  file?: VehicleDocumentFile;
};

export type TransportVehicle = {
  id: string;
  name: string;
  registrationNo: string;
  capacity: number;
  /** Owned fleet vehicle or hired rental */
  ownership: VehicleOwnership;
  driverName?: string;
  driverPhone?: string;
  routeIds: string[];
  active: boolean;
  documents: VehicleDocument[];
};

export const VEHICLE_DOCUMENT_KINDS: VehicleDocumentKind[] = [
  "rc",
  "insurance",
  "pollution",
  "driverLicense",
];

export const VEHICLE_DOCUMENT_LABELS: Record<VehicleDocumentKind, string> = {
  rc: "Registration Certificate (RC)",
  insurance: "Insurance",
  pollution: "Pollution Certificate",
  driverLicense: "Driver Licence",
};

export const DEFAULT_VEHICLE_NOTIFY_DAYS = 30;

export function createDefaultVehicleDocuments(): VehicleDocument[] {
  return VEHICLE_DOCUMENT_KINDS.map((kind) => ({
    kind,
    notifyDaysBefore: DEFAULT_VEHICLE_NOTIFY_DAYS,
  }));
}

export type TransportRoute = {
  id: string;
  mapFrom: string;
  mapTo: string;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
  morningFee: number;
  eveningFee: number;
  bothFee: number;
};

export type PaymentCategory = {
  id: string;
  label: string;
};

export type ThemeSettings = {
  mode: "Light" | "Dark";
  /** Legacy field — workspace accent is fixed to brand teal */
  accent: "Neon Lime" | "Pale Lime" | "Ink";
  density: "Comfortable" | "Compact";
  navPlacement: "Left" | "Right" | "Top" | "Bottom";
};

export type SchoolDetails = {
  name: string;
  logoUrl?: string;
  letterheadUrl?: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  registrationNo: string;
  affiliationNo: string;
  principalName: string;
  establishedYear: string;
};

export type TenantNotification = {
  id: string;
  title: string;
  body: string;
  category: "fees" | "admissions" | "staff" | "system" | "transport";
  read: boolean;
  createdAt: string;
  timeLabel: string;
  href?: string;
};

const STORAGE_KEY = "school-accounts/tenant-store/v12";
const LEGACY_STORAGE_KEYS = [
  "school-accounts/tenant-store/v11",
  "school-accounts/tenant-store/v10",
  "school-accounts/tenant-store/v9",
  "school-accounts/tenant-store/v8",
  "school-accounts/tenant-store/v7",
  "school-accounts/tenant-store/v6",
  "school-accounts/tenant-store/v5",
  "school-accounts/tenant-store/v4",
  "school-accounts/tenant-store/v3",
] as const;

/** Fired when navigation dock placement changes so the toast host can reposition. */
export const NAV_PLACEMENT_CHANGE_EVENT = "school-accounts:nav-placement";

export function notifyNavPlacementChange(placement: ThemeSettings["navPlacement"]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(NAV_PLACEMENT_CHANGE_EVENT, { detail: placement }),
  );
}

function normalizeTransportRoute(raw: unknown): TransportRoute | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.mapFrom !== "string" || typeof r.mapTo !== "string") {
    return null;
  }
  const legacyFee = typeof r.fee === "number" ? r.fee : undefined;
  const morningFee =
    typeof r.morningFee === "number"
      ? r.morningFee
      : legacyFee
        ? Math.round(legacyFee * 0.55)
        : 0;
  const eveningFee =
    typeof r.eveningFee === "number"
      ? r.eveningFee
      : legacyFee
        ? Math.round(legacyFee * 0.55)
        : 0;
  const bothFee =
    typeof r.bothFee === "number" ? r.bothFee : (legacyFee ?? morningFee + eveningFee);
  const coord = (v: unknown): number | undefined =>
    typeof v === "number" && Number.isFinite(v) ? v : undefined;
  const fromLat = coord(r.fromLat);
  const fromLng = coord(r.fromLng);
  const toLat = coord(r.toLat);
  const toLng = coord(r.toLng);
  return {
    id: r.id,
    mapFrom: r.mapFrom,
    mapTo: r.mapTo,
    ...(fromLat !== undefined ? { fromLat } : {}),
    ...(fromLng !== undefined ? { fromLng } : {}),
    ...(toLat !== undefined ? { toLat } : {}),
    ...(toLng !== undefined ? { toLng } : {}),
    morningFee,
    eveningFee,
    bothFee,
  };
}

function normalizeVehicleDocumentFile(raw: unknown): VehicleDocumentFile | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const f = raw as Partial<VehicleDocumentFile>;
  if (
    typeof f.id !== "string" ||
    typeof f.name !== "string" ||
    typeof f.dataUrl !== "string" ||
    typeof f.size !== "number"
  ) {
    return undefined;
  }
  return {
    id: f.id,
    name: f.name,
    mimeType: typeof f.mimeType === "string" ? f.mimeType : "application/octet-stream",
    size: f.size,
    dataUrl: f.dataUrl,
    uploadedAt: typeof f.uploadedAt === "string" ? f.uploadedAt : new Date().toISOString(),
  };
}

function normalizeVehicleDocuments(raw: unknown): VehicleDocument[] {
  const byKind = new Map<VehicleDocumentKind, VehicleDocument>();
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const doc = item as Partial<VehicleDocument>;
      if (!VEHICLE_DOCUMENT_KINDS.includes(doc.kind as VehicleDocumentKind)) continue;
      const kind = doc.kind as VehicleDocumentKind;
      const notifyDaysBefore =
        typeof doc.notifyDaysBefore === "number" &&
        Number.isFinite(doc.notifyDaysBefore) &&
        doc.notifyDaysBefore >= 0
          ? Math.round(doc.notifyDaysBefore)
          : DEFAULT_VEHICLE_NOTIFY_DAYS;
      byKind.set(kind, {
        kind,
        validUntil:
          typeof doc.validUntil === "string" && /^\d{4}-\d{2}-\d{2}/.test(doc.validUntil)
            ? doc.validUntil.slice(0, 10)
            : undefined,
        notifyDaysBefore,
        file: normalizeVehicleDocumentFile(doc.file),
      });
    }
  }
  return VEHICLE_DOCUMENT_KINDS.map(
    (kind) =>
      byKind.get(kind) ?? {
        kind,
        notifyDaysBefore: DEFAULT_VEHICLE_NOTIFY_DAYS,
      },
  );
}

function normalizeTransportVehicle(raw: unknown): TransportVehicle | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.id !== "string" || typeof v.name !== "string" || typeof v.registrationNo !== "string") {
    return null;
  }
  const routeIds = Array.isArray(v.routeIds)
    ? v.routeIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : typeof v.routeId === "string" && v.routeId
      ? [v.routeId]
      : [];
  const ownership: VehicleOwnership =
    v.ownership === "rental" || v.ownership === "owned" ? v.ownership : "owned";
  return {
    id: v.id,
    name: v.name,
    registrationNo: v.registrationNo,
    capacity: typeof v.capacity === "number" ? v.capacity : 0,
    ownership,
    driverName: typeof v.driverName === "string" ? v.driverName : undefined,
    driverPhone: typeof v.driverPhone === "string" ? v.driverPhone : undefined,
    routeIds,
    active: typeof v.active === "boolean" ? v.active : true,
    documents: normalizeVehicleDocuments(v.documents),
  };
}

export const DEFAULT_DASHBOARD_TODOS = ["", "", "", "", ""] as const;

function normalizeDashboardTodos(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_DASHBOARD_TODOS];
  const items = raw.map((item) => (typeof item === "string" ? item : ""));
  if (items.length === 0) return [...DEFAULT_DASHBOARD_TODOS];
  return items.slice(0, 20);
}

const NOTIFICATION_CATEGORIES = ["fees", "admissions", "staff", "system", "transport"] as const;

/** Prefix for auto-generated vehicle document expiry alerts */
export const VEHICLE_DOC_EXPIRY_PREFIX = "NTF-VH-DOC-";

export function vehicleDocNotificationId(vehicleId: string, kind: VehicleDocumentKind) {
  return `${VEHICLE_DOC_EXPIRY_PREFIX}${vehicleId}-${kind}`;
}

/** Calendar-day difference from today to YYYY-MM-DD (negative = already expired). */
export function daysUntilDate(isoDate: string, now = new Date()): number | null {
  const match = isoDate.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const end = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function buildVehicleDocExpiryNotifications(
  vehicles: TransportVehicle[],
  now = new Date(),
): TenantNotification[] {
  const alerts: TenantNotification[] = [];
  const createdAt = now.toISOString();

  for (const vehicle of vehicles) {
    if (!vehicle.active) continue;
    for (const doc of vehicle.documents ?? []) {
      if (!doc.validUntil) continue;
      const days = daysUntilDate(doc.validUntil, now);
      if (days === null) continue;
      const warnDays = doc.notifyDaysBefore ?? DEFAULT_VEHICLE_NOTIFY_DAYS;
      if (days > warnDays) continue;

      const label = VEHICLE_DOCUMENT_LABELS[doc.kind];
      const expired = days < 0;
      const title = expired
        ? `${label} expired · ${vehicle.name}`
        : days === 0
          ? `${label} expires today · ${vehicle.name}`
          : `${label} expires in ${days} day${days === 1 ? "" : "s"} · ${vehicle.name}`;
      const body = expired
        ? `${vehicle.name} (${vehicle.registrationNo}) — ${label} expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago (${doc.validUntil}). Renew and update the attachment.`
        : `${vehicle.name} (${vehicle.registrationNo}) — ${label} is valid until ${doc.validUntil}. Renew before expiry.`;

      alerts.push({
        id: vehicleDocNotificationId(vehicle.id, doc.kind),
        title,
        body,
        category: "transport",
        read: false,
        createdAt,
        timeLabel: expired ? "Expired" : days === 0 ? "Today" : `${days}d left`,
        href: "/tenant/settings?tab=vehicles",
      });
    }
  }

  return alerts;
}

export function mergeVehicleExpiryNotifications(
  existing: TenantNotification[],
  vehicles: TransportVehicle[],
  now = new Date(),
): TenantNotification[] {
  const fresh = buildVehicleDocExpiryNotifications(vehicles, now);
  const previousById = new Map(
    existing
      .filter((n) => n.id.startsWith(VEHICLE_DOC_EXPIRY_PREFIX))
      .map((n) => [n.id, n]),
  );
  const mergedFresh = fresh.map((n) => {
    const prev = previousById.get(n.id);
    if (prev && prev.body === n.body) {
      return { ...n, read: prev.read, createdAt: prev.createdAt };
    }
    return n;
  });
  const others = existing.filter((n) => !n.id.startsWith(VEHICLE_DOC_EXPIRY_PREFIX));
  return [...mergedFresh, ...others];
}

export const SEED_NOTIFICATIONS: TenantNotification[] = [
  {
    id: "NTF-001",
    title: "Fee reminders pending",
    body: "3 students have overdue balances. Review the watchlist and send reminders.",
    category: "fees",
    read: false,
    createdAt: "2026-07-08T04:30:00.000Z",
    timeLabel: "1h ago",
    href: "/tenant/students",
  },
  {
    id: "NTF-002",
    title: "New admission logged",
    body: "Muhammed was admitted to LKG. Confirm guardian contact details.",
    category: "admissions",
    read: false,
    createdAt: "2026-07-07T11:15:00.000Z",
    timeLabel: "Yesterday",
    href: "/tenant/students",
  },
  {
    id: "NTF-003",
    title: "Staff roster updated",
    body: "A new transport coordinator was added to the staff directory.",
    category: "staff",
    read: false,
    createdAt: "2026-07-06T09:00:00.000Z",
    timeLabel: "2d ago",
    href: "/tenant/staff",
  },
  {
    id: "NTF-004",
    title: "Monthly finance snapshot",
    body: "July operating expenses were recorded. Open finance to review ledgers.",
    category: "system",
    read: true,
    createdAt: "2026-07-01T08:00:00.000Z",
    timeLabel: "1w ago",
    href: "/tenant/finance",
  },
];

function normalizeTenantNotification(raw: unknown): TenantNotification | null {
  if (!raw || typeof raw !== "object") return null;
  const n = raw as Record<string, unknown>;
  if (
    typeof n.id !== "string" ||
    typeof n.title !== "string" ||
    typeof n.body !== "string" ||
    typeof n.createdAt !== "string" ||
    typeof n.timeLabel !== "string"
  ) {
    return null;
  }
  const category = NOTIFICATION_CATEGORIES.includes(n.category as (typeof NOTIFICATION_CATEGORIES)[number])
    ? (n.category as TenantNotification["category"])
    : "system";
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    category,
    read: typeof n.read === "boolean" ? n.read : false,
    createdAt: n.createdAt,
    timeLabel: n.timeLabel,
    href: typeof n.href === "string" ? n.href : undefined,
  };
}

function normalizeNotifications(raw: unknown): TenantNotification[] {
  if (!Array.isArray(raw)) return [...SEED_NOTIFICATIONS];
  const items = raw
    .map(normalizeTenantNotification)
    .filter((n): n is TenantNotification => n !== null);
  return items.length > 0 ? items : [...SEED_NOTIFICATIONS];
}

export const SEED_STUDENTS: Student[] = [
  {
    id: "STU-2847",
    admissionNumber: "ADM-2847",
    name: "Muhammed",
    cls: "LKG",
    guardian: "Hira Abbas",
    due: 5500,
    gender: "M",
    phone: "9744001122",
    dob: "15 Jan 2021",
    email: "muhammed@silverhills.in",
    address: "Flat 8, Marina Crest, MG Road, Kochi 682016",
  },
  {
    id: "STU-2848",
    admissionNumber: "ADM-2848",
    name: "Fathima",
    cls: "LKG",
    guardian: "Ibrahim",
    due: 0,
    gender: "F",
    phone: "9747122456",
    dob: "22 Apr 2021",
    email: "fathima@silverhills.in",
    address: "12 Palm Grove, Edappally, Kochi 682024",
  },
  {
    id: "STU-2841",
    admissionNumber: "ADM-2841",
    name: "Aarav Sharma",
    cls: "Grade 8 - B",
    guardian: "Vinod Sharma",
    due: 4500,
    gender: "M",
    phone: "9810045221",
    dob: "14 Mar 2012",
    email: "aarav.sharma@silverhills.in",
    address: "B-204, Lotus Greens, Sector 21, Noida 201301",
  },
  {
    id: "STU-2842",
    admissionNumber: "ADM-2842",
    name: "Hira Abbas",
    cls: "LKG - M",
    guardian: "Iqbal Abbas",
    due: 5500,
    gender: "F",
    phone: "9744001048",
    dob: "08 Sep 2020",
    email: "hira.abbas@silverhills.in",
    address: "Flat 12, Marina Crest, MG Road, Kochi 682016",
  },
  {
    id: "STU-2843",
    admissionNumber: "ADM-2843",
    name: "Meera Iyer",
    cls: "Grade 10 - A",
    guardian: "Devanand Iyer",
    due: 0,
    gender: "F",
    phone: "9886541230",
    dob: "22 Jul 2009",
    email: "meera.iyer@silverhills.in",
    address: "47 Brigade Pinnacle, Whitefield, Bengaluru 560066",
  },
  {
    id: "STU-2844",
    admissionNumber: "ADM-2844",
    name: "Kabir Khanna",
    cls: "Grade 6 - C",
    guardian: "Anjali Khanna",
    due: 2200,
    gender: "M",
    phone: "9920031144",
    dob: "30 Jan 2014",
    email: "kabir.khanna@silverhills.in",
    address: "A-9, Hiranandani Gardens, Powai, Mumbai 400076",
  },
  {
    id: "STU-2845",
    admissionNumber: "ADM-2845",
    name: "Tara Mehta",
    cls: "Grade 4 - B",
    guardian: "Rohan Mehta",
    due: 800,
    gender: "F",
    phone: "9745882214",
    dob: "11 Oct 2016",
    email: "tara.mehta@silverhills.in",
    address: "12 Cumballa Heights, Peddar Road, Mumbai 400026",
  },
  {
    id: "STU-2846",
    admissionNumber: "ADM-2846",
    name: "Yash Pillai",
    cls: "Grade 12 - A",
    guardian: "Latha Pillai",
    due: 12300,
    gender: "M",
    phone: "9447112209",
    dob: "05 Feb 2008",
    email: "yash.pillai@silverhills.in",
    address: "House 21, Sasthamangalam, Thiruvananthapuram 695010",
  },
];

export const SEED_STAFF: Staff[] = [
  {
    id: "STF-018",
    name: "Abdulla",
    role: "Teacher",
    dept: "LP",
    active: true,
    joinedAt: "2022-08-15",
    phone: "9847012345",
    altPhone: "9847098765",
    guardianPhone: "9876543210",
    basicSalary: 42000,
    additionalAllowances: 4000,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "4567 8901 2345", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "ABDUL5678K", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
    ],
    salaryHistory: [
      {
        id: "SAL-STF-018-1",
        amount: 46000,
        mode: "Bank",
        paidAt: "2026-06-01",
        description: "Salary · June 2026",
        status: "Cleared" as const,
      },
      {
        id: "SAL-STF-018-2",
        amount: 46000,
        mode: "Bank",
        paidAt: "2026-05-01",
        description: "Salary · May 2026",
        status: "Cleared" as const,
      },
    ],
    statusHistory: [
      {
        id: "EVT-STF-018-joined",
        type: "joined" as const,
        at: "2022-08-15T09:30:00.000Z",
        note: "Joined the school roster",
      },
    ],
  },
  {
    id: "STF-019",
    name: "Ayisha",
    role: "Teacher",
    dept: "LKG",
    active: true,
    joinedAt: "2021-06-01",
    phone: "9876543210",
    basicSalary: 38000,
    additionalAllowances: 3500,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "2345 6789 0123", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "AYISH1234P", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
    ],
    salaryHistory: [
      {
        id: "SAL-STF-019-1",
        amount: 41500,
        mode: "Bank",
        paidAt: "2026-06-01",
        description: "Salary · June 2026",
        status: "Cleared" as const,
      },
      {
        id: "SAL-STF-019-2",
        amount: 41500,
        mode: "Bank",
        paidAt: "2026-05-01",
        description: "Salary · May 2026",
        status: "Cleared" as const,
      },
    ],
    statusHistory: [
      {
        id: "EVT-STF-019-joined",
        type: "joined" as const,
        at: "2021-06-01T09:30:00.000Z",
        note: "Joined the school roster",
      },
    ],
  },
  {
    id: "STF-020",
    name: "Shamina",
    role: "Accountant",
    dept: "Administrative",
    active: true,
    joinedAt: "2020-04-10",
    phone: "9895011223",
    basicSalary: 52000,
    additionalAllowances: 6000,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "5678 9012 3456", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "SHAMI9012L", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
    ],
    salaryHistory: [
      {
        id: "SAL-STF-020-1",
        amount: 58000,
        mode: "Bank",
        paidAt: "2026-06-01",
        description: "Salary · June 2026",
        status: "Cleared" as const,
      },
      {
        id: "SAL-STF-020-2",
        amount: 58000,
        mode: "Bank",
        paidAt: "2026-05-01",
        description: "Salary · May 2026",
        status: "Cleared" as const,
      },
    ],
    statusHistory: [
      {
        id: "EVT-STF-020-joined",
        type: "joined" as const,
        at: "2020-04-10T09:30:00.000Z",
        note: "Joined the school roster",
      },
    ],
  },
  {
    id: "STF-021",
    name: "Fathima",
    role: "Teacher",
    dept: "UKG",
    active: true,
    joinedAt: "2023-01-12",
    phone: "9765432109",
    basicSalary: 36000,
    additionalAllowances: 3000,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "3456 7890 1234", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "FATHM3456H", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
    ],
    salaryHistory: [
      {
        id: "SAL-STF-021-1",
        amount: 39000,
        mode: "Bank",
        paidAt: "2026-06-01",
        description: "Salary · June 2026",
        status: "Cleared" as const,
      },
      {
        id: "SAL-STF-021-2",
        amount: 39000,
        mode: "Bank",
        paidAt: "2026-05-01",
        description: "Salary · May 2026",
        status: "Cleared" as const,
      },
    ],
    statusHistory: [
      {
        id: "EVT-STF-021-joined",
        type: "joined" as const,
        at: "2023-01-12T09:30:00.000Z",
        note: "Joined the school roster",
      },
    ],
  },
  {
    id: "STF-022",
    name: "Rahul",
    role: "Teacher",
    dept: "Grade 1",
    active: true,
    joinedAt: "2022-11-05",
    phone: "9812345678",
    basicSalary: 40000,
    additionalAllowances: 3500,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "6789 0123 4567", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "RAHUL6789M", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
    ],
    salaryHistory: [
      {
        id: "SAL-STF-022-1",
        amount: 43500,
        mode: "Bank",
        paidAt: "2026-06-01",
        description: "Salary · June 2026",
        status: "Cleared" as const,
      },
      {
        id: "SAL-STF-022-2",
        amount: 43500,
        mode: "Bank",
        paidAt: "2026-05-01",
        description: "Salary · May 2026",
        status: "Cleared" as const,
      },
    ],
    statusHistory: [
      {
        id: "EVT-STF-022-joined",
        type: "joined" as const,
        at: "2022-11-05T09:30:00.000Z",
        note: "Joined the school roster",
      },
    ],
  },
  {
    id: "STF-023",
    name: "Sneha",
    role: "Teacher",
    dept: "Grade 5",
    active: true,
    joinedAt: "2021-08-20",
    phone: "9823456789",
    basicSalary: 41000,
    additionalAllowances: 4000,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "7890 1234 5678", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "SNEHA7890N", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
    ],
    salaryHistory: [
      {
        id: "SAL-STF-023-1",
        amount: 45000,
        mode: "Bank",
        paidAt: "2026-06-01",
        description: "Salary · June 2026",
        status: "Cleared" as const,
      },
      {
        id: "SAL-STF-023-2",
        amount: 45000,
        mode: "Bank",
        paidAt: "2026-05-01",
        description: "Salary · May 2026",
        status: "Cleared" as const,
      },
    ],
    statusHistory: [
      {
        id: "EVT-STF-023-joined",
        type: "joined" as const,
        at: "2021-08-20T09:30:00.000Z",
        note: "Joined the school roster",
      },
    ],
  },
  {
    id: "STF-024",
    name: "Vikram",
    role: "Teacher",
    dept: "Grade 8",
    active: true,
    joinedAt: "2019-07-15",
    phone: "9834567890",
    basicSalary: 44000,
    additionalAllowances: 4500,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "8901 2345 6789", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "VIKRM8901Q", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
    ],
    salaryHistory: [
      {
        id: "SAL-STF-024-1",
        amount: 48500,
        mode: "Bank",
        paidAt: "2026-06-01",
        description: "Salary · June 2026",
        status: "Cleared" as const,
      },
      {
        id: "SAL-STF-024-2",
        amount: 48500,
        mode: "Bank",
        paidAt: "2026-05-01",
        description: "Salary · May 2026",
        status: "Cleared" as const,
      },
    ],
    statusHistory: [
      {
        id: "EVT-STF-024-joined",
        type: "joined" as const,
        at: "2019-07-15T09:30:00.000Z",
        note: "Joined the school roster",
      },
    ],
  },
  {
    id: "STF-025",
    name: "Lakshmi",
    role: "Teacher",
    dept: "Grade 10",
    active: true,
    joinedAt: "2018-06-01",
    phone: "9845678901",
    basicSalary: 46000,
    additionalAllowances: 5000,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "9012 3456 7890", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "LAKSH9012R", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
    ],
    salaryHistory: [
      {
        id: "SAL-STF-025-1",
        amount: 51000,
        mode: "Bank",
        paidAt: "2026-06-01",
        description: "Salary · June 2026",
        status: "Cleared" as const,
      },
      {
        id: "SAL-STF-025-2",
        amount: 51000,
        mode: "Bank",
        paidAt: "2026-05-01",
        description: "Salary · May 2026",
        status: "Cleared" as const,
      },
    ],
    statusHistory: [
      {
        id: "EVT-STF-025-joined",
        type: "joined" as const,
        at: "2018-06-01T09:30:00.000Z",
        note: "Joined the school roster",
      },
    ],
  },
  {
    id: "STF-026",
    name: "Joseph",
    role: "Teacher",
    dept: "Grade 12",
    active: true,
    joinedAt: "2017-05-18",
    phone: "9856789012",
    basicSalary: 48000,
    additionalAllowances: 5500,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "0123 4567 8901", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "JOSEP0123S", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
    ],
    salaryHistory: [
      {
        id: "SAL-STF-026-1",
        amount: 53500,
        mode: "Bank",
        paidAt: "2026-06-01",
        description: "Salary · June 2026",
        status: "Cleared" as const,
      },
      {
        id: "SAL-STF-026-2",
        amount: 53500,
        mode: "Bank",
        paidAt: "2026-05-01",
        description: "Salary · May 2026",
        status: "Cleared" as const,
      },
    ],
    statusHistory: [
      {
        id: "EVT-STF-026-joined",
        type: "joined" as const,
        at: "2017-05-18T09:30:00.000Z",
        note: "Joined the school roster",
      },
    ],
  },
  {
    id: "STF-027",
    name: "Priya",
    role: "Office Administrator",
    dept: "Administrative",
    active: true,
    joinedAt: "2020-09-01",
    phone: "9867890123",
    basicSalary: 50000,
    additionalAllowances: 5000,
    documents: [
      { id: "doc-aadhaar", label: "Aadhaar", number: "1234 5678 9012", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
      { id: "doc-pan", label: "PAN Card", number: "PRIYA1234T", levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
      attachments: [] },
    ],
    salaryHistory: [
      {
        id: "SAL-STF-027-1",
        amount: 55000,
        mode: "Bank",
        paidAt: "2026-06-01",
        description: "Salary · June 2026",
        status: "Cleared" as const,
      },
      {
        id: "SAL-STF-027-2",
        amount: 55000,
        mode: "Bank",
        paidAt: "2026-05-01",
        description: "Salary · May 2026",
        status: "Cleared" as const,
      },
    ],
    statusHistory: [
      {
        id: "EVT-STF-027-joined",
        type: "joined" as const,
        at: "2020-09-01T09:30:00.000Z",
        note: "Joined the school roster",
      },
    ],
  },
];

export const SEED_PAYMENTS: Payment[] = [
  // AY 2024-25 · closed books
  {
    id: "RC-9701",
    name: "Aarav Sharma",
    cat: "Tuition Fee",
    mode: "Bank",
    amount: 18000,
    time: "12 Mar 2025",
    academicYear: "AY 2024-25",
    payerType: "student",
    className: "Grade 7 - B",
    feePeriodKind: "term",
    feePeriod: "Term 4",
  },
  {
    id: "RC-9702",
    name: "Meera Iyer",
    cat: "Tuition Fee",
    mode: "UPI",
    amount: 16000,
    time: "05 Mar 2025",
    academicYear: "AY 2024-25",
    payerType: "student",
    className: "Grade 9 - A",
    feePeriodKind: "term",
    feePeriod: "Term 4",
  },
  {
    id: "RC-9703",
    name: "Kabir Khanna",
    cat: "Vehicle Fee",
    mode: "Cash",
    amount: 4500,
    time: "28 Feb 2025",
    academicYear: "AY 2024-25",
    payerType: "student",
    className: "Grade 5 - C",
    feePeriodKind: "term",
    feePeriod: "Term 4",
  },
  // AY 2025-26 · current books
  {
    id: "RC-9821",
    name: "Aarav Sharma",
    cat: "Tuition Fee",
    mode: "UPI",
    amount: 4500,
    time: "Today · 10:22",
    academicYear: "AY 2025-26",
    payerType: "student",
    className: "Grade 8 - B",
    feePeriodKind: "month",
    feePeriod: "July",
  },
  {
    id: "RC-9820",
    name: "Meera Iyer",
    cat: "Vehicle Fee",
    mode: "Bank",
    amount: 1800,
    time: "Today · 09:51",
    academicYear: "AY 2025-26",
    payerType: "student",
    className: "Grade 10 - A",
    feePeriodKind: "month",
    feePeriod: "July",
  },
  {
    id: "RC-9819",
    name: "Kabir Khanna",
    cat: "Tuition Fee",
    mode: "Cash",
    amount: 2200,
    time: "Yesterday",
    academicYear: "AY 2025-26",
    payerType: "student",
    className: "Grade 6 - C",
    feePeriodKind: "month",
    feePeriod: "July",
  },
  {
    id: "RC-9818",
    name: "Hira Abbas",
    cat: "Donation",
    mode: "UPI",
    amount: 1000,
    time: "Yesterday",
    academicYear: "AY 2025-26",
    payerType: "external",
  },
  {
    id: "RC-9817",
    name: "Tara Mehta",
    cat: "Tuition Fee",
    mode: "Bank",
    amount: 3200,
    time: "2d ago",
    academicYear: "AY 2025-26",
    payerType: "student",
    className: "Grade 4 - B",
    feePeriodKind: "month",
    feePeriod: "June",
  },
];

export const SEED_DEPARTMENTS: Department[] = [
  { id: "DEP-001", name: "Senior Wing", code: "SNR-WNG" },
  { id: "DEP-002", name: "Junior Wing", code: "JNR-WNG" },
  { id: "DEP-003", name: "Administration", code: "ADM" },
  { id: "DEP-004", name: "Co-curricular", code: "COC" },
  { id: "DEP-005", name: "Support", code: "SUP" },
];

export const SEED_ROLES: Role[] = [
  { id: "ROL-001", title: "Mathematics · HOD", departmentId: "DEP-001" },
  { id: "ROL-002", title: "Physics Faculty", departmentId: "DEP-001" },
  { id: "ROL-003", title: "Principal Office", departmentId: "DEP-003" },
  { id: "ROL-004", title: "Sports Coordinator", departmentId: "DEP-004" },
];

export const SEED_CLASSES: ClassConfig[] = [
  {
    id: "CLS-001",
    className: "LKG - M",
    grade: "LKG",
    section: "M",
    tuitionFeeAmount: 3273,
    vehicleFeeAmount: 1500,
    billingCycle: "Monthly",
  },
  {
    id: "CLS-002",
    className: "Grade 4 - B",
    grade: "Grade 4",
    section: "B",
    tuitionFeeAmount: 4000,
    vehicleFeeAmount: 1600,
    billingCycle: "Monthly",
  },
  {
    id: "CLS-003",
    className: "Grade 6 - C",
    grade: "Grade 6",
    section: "C",
    tuitionFeeAmount: 4500,
    vehicleFeeAmount: 1700,
    billingCycle: "Monthly",
  },
  {
    id: "CLS-004",
    className: "Grade 8 - B",
    grade: "Grade 8",
    section: "B",
    tuitionFeeAmount: 5200,
    vehicleFeeAmount: 1800,
    billingCycle: "Term",
  },
  {
    id: "CLS-005",
    className: "Grade 10 - A",
    grade: "Grade 10",
    section: "A",
    tuitionFeeAmount: 6800,
    vehicleFeeAmount: 2000,
    billingCycle: "Term",
  },
  {
    id: "CLS-006",
    className: "Grade 12 - A",
    grade: "Grade 12",
    section: "A",
    tuitionFeeAmount: 8400,
    vehicleFeeAmount: 2200,
    billingCycle: "Annually",
  },
];

export const SEED_TRANSPORT: TransportRoute[] = [
  {
    id: "TR-001",
    mapFrom: "Lotus Greens Sector 21",
    mapTo: "Main Campus Drop-off",
    fromLat: 28.5021,
    fromLng: 77.4105,
    toLat: 28.4595,
    toLng: 77.0266,
    morningFee: 1000,
    eveningFee: 1000,
    bothFee: 1800,
  },
  {
    id: "TR-002",
    mapFrom: "Marina Crest, MG Road",
    mapTo: "Main Campus Drop-off",
    fromLat: 12.975,
    fromLng: 77.6063,
    toLat: 12.9716,
    toLng: 77.5946,
    morningFee: 850,
    eveningFee: 850,
    bothFee: 1500,
  },
  {
    id: "TR-003",
    mapFrom: "Hiranandani Gardens, Powai",
    mapTo: "Main Campus Drop-off",
    fromLat: 19.1197,
    fromLng: 72.9051,
    toLat: 19.076,
    toLng: 72.8777,
    morningFee: 1350,
    eveningFee: 1350,
    bothFee: 2400,
  },
  {
    id: "TR-004",
    mapFrom: "Cumballa Heights, Peddar Road",
    mapTo: "Main Campus Drop-off",
    fromLat: 18.9679,
    fromLng: 72.8075,
    toLat: 19.076,
    toLng: 72.8777,
    morningFee: 1100,
    eveningFee: 1100,
    bothFee: 2000,
  },
  {
    id: "TR-005",
    mapFrom: "Sasthamangalam, Thiruvananthapuram",
    mapTo: "Main Campus Drop-off",
    fromLat: 8.5142,
    fromLng: 76.957,
    toLat: 8.5241,
    toLng: 76.9366,
    morningFee: 1200,
    eveningFee: 1200,
    bothFee: 2200,
  },
];

export const SEED_VEHICLES: TransportVehicle[] = [
  {
    id: "VH-001",
    name: "Bus 01",
    registrationNo: "KL-07-AB-4521",
    capacity: 42,
    ownership: "owned",
    driverName: "Rajan Kumar",
    driverPhone: "9847012345",
    routeIds: ["TR-001", "TR-002"],
    active: true,
    documents: createDefaultVehicleDocuments(),
  },
  {
    id: "VH-002",
    name: "Bus 02",
    registrationNo: "KL-07-CD-8832",
    capacity: 36,
    ownership: "owned",
    driverName: "Suresh Nair",
    driverPhone: "9847098765",
    routeIds: ["TR-002"],
    active: true,
    documents: createDefaultVehicleDocuments(),
  },
  {
    id: "VH-003",
    name: "Van 01",
    registrationNo: "MH-02-EF-1190",
    capacity: 14,
    ownership: "rental",
    driverName: "Imran Sheikh",
    routeIds: ["TR-003"],
    active: true,
    documents: createDefaultVehicleDocuments(),
  },
];

export const SEED_PAYMENT_CATEGORIES: PaymentCategory[] = [
  { id: "PC-001", label: "Tuition Fee" },
  { id: "PC-002", label: "Vehicle Fee" },
  { id: "PC-003", label: "Donation" },
  { id: "PC-004", label: "Other" },
];

function buildSeedAcademicFeeMonths(
  startYear: number,
  academicYear: string,
  idStart: number,
): FeeTerm[] {
  /** Indian academic / FY order · April → March */
  const months: { label: string; y: number; m: number }[] = [
    { label: "April", y: startYear, m: 4 },
    { label: "May", y: startYear, m: 5 },
    { label: "June", y: startYear, m: 6 },
    { label: "July", y: startYear, m: 7 },
    { label: "August", y: startYear, m: 8 },
    { label: "September", y: startYear, m: 9 },
    { label: "October", y: startYear, m: 10 },
    { label: "November", y: startYear, m: 11 },
    { label: "December", y: startYear, m: 12 },
    { label: "January", y: startYear + 1, m: 1 },
    { label: "February", y: startYear + 1, m: 2 },
    { label: "March", y: startYear + 1, m: 3 },
  ];
  const out: FeeTerm[] = [];
  let n = idStart;
  for (const kind of ["tuition", "vehicle"] as const) {
    for (const mo of months) {
      const lastDay = new Date(mo.y, mo.m, 0).getDate();
      const startDate = `${mo.y}-${String(mo.m).padStart(2, "0")}-01`;
      const endDate = `${mo.y}-${String(mo.m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      out.push({
        id: `FT-${String(n++).padStart(3, "0")}`,
        kind,
        periodMode: "month",
        label: mo.label,
        academicYear,
        startDate,
        endDate,
        coverage: formatFeeTermCoverage(startDate, endDate),
      });
    }
  }
  return out;
}

function buildSeedFeeTermsForYear(
  academicYear: string,
  startYear: number,
  idOffset: number,
): FeeTerm[] {
  const terms: FeeTerm[] = [
    {
      id: `FT-${String(idOffset + 1).padStart(3, "0")}`,
      kind: "tuition",
      periodMode: "term",
      label: "Term 1",
      academicYear,
      startDate: `${startYear}-04-01`,
      endDate: `${startYear}-06-30`,
      coverage: formatFeeTermCoverage(`${startYear}-04-01`, `${startYear}-06-30`),
    },
    {
      id: `FT-${String(idOffset + 2).padStart(3, "0")}`,
      kind: "tuition",
      periodMode: "term",
      label: "Term 2",
      academicYear,
      startDate: `${startYear}-07-01`,
      endDate: `${startYear}-09-30`,
      coverage: formatFeeTermCoverage(`${startYear}-07-01`, `${startYear}-09-30`),
    },
    {
      id: `FT-${String(idOffset + 3).padStart(3, "0")}`,
      kind: "tuition",
      periodMode: "term",
      label: "Term 3",
      academicYear,
      startDate: `${startYear}-10-01`,
      endDate: `${startYear}-12-31`,
      coverage: formatFeeTermCoverage(`${startYear}-10-01`, `${startYear}-12-31`),
    },
    {
      id: `FT-${String(idOffset + 4).padStart(3, "0")}`,
      kind: "tuition",
      periodMode: "term",
      label: "Term 4",
      academicYear,
      startDate: `${startYear + 1}-01-01`,
      endDate: `${startYear + 1}-03-31`,
      coverage: formatFeeTermCoverage(`${startYear + 1}-01-01`, `${startYear + 1}-03-31`),
    },
    {
      id: `FT-${String(idOffset + 5).padStart(3, "0")}`,
      kind: "vehicle",
      periodMode: "term",
      label: "Term 1",
      academicYear,
      startDate: `${startYear}-04-01`,
      endDate: `${startYear}-06-30`,
      coverage: formatFeeTermCoverage(`${startYear}-04-01`, `${startYear}-06-30`),
    },
    {
      id: `FT-${String(idOffset + 6).padStart(3, "0")}`,
      kind: "vehicle",
      periodMode: "term",
      label: "Term 2",
      academicYear,
      startDate: `${startYear}-07-01`,
      endDate: `${startYear}-09-30`,
      coverage: formatFeeTermCoverage(`${startYear}-07-01`, `${startYear}-09-30`),
    },
    {
      id: `FT-${String(idOffset + 7).padStart(3, "0")}`,
      kind: "vehicle",
      periodMode: "term",
      label: "Term 3",
      academicYear,
      startDate: `${startYear}-10-01`,
      endDate: `${startYear}-12-31`,
      coverage: formatFeeTermCoverage(`${startYear}-10-01`, `${startYear}-12-31`),
    },
    {
      id: `FT-${String(idOffset + 8).padStart(3, "0")}`,
      kind: "vehicle",
      periodMode: "term",
      label: "Term 4",
      academicYear,
      startDate: `${startYear + 1}-01-01`,
      endDate: `${startYear + 1}-03-31`,
      coverage: formatFeeTermCoverage(`${startYear + 1}-01-01`, `${startYear + 1}-03-31`),
    },
    ...buildSeedAcademicFeeMonths(startYear, academicYear, idOffset + 9),
  ];
  return terms;
}

export const SEED_FEE_TERMS: FeeTerm[] = [
  ...buildSeedFeeTermsForYear("AY 2024-25", 2024, 100),
  ...buildSeedFeeTermsForYear("AY 2025-26", 2025, 0),
  ...buildSeedFeeTermsForYear("AY 2026-27", 2026, 200),
];

export const SEED_ACADEMIC_YEARS = ["AY 2024-25", "AY 2025-26", "AY 2026-27"];
/** @deprecated Prefer `academicYears` from the tenant store */
export const ACADEMIC_YEAR_OPTIONS = SEED_ACADEMIC_YEARS;
export const SEED_ACADEMIC_YEAR = "AY 2025-26";

/** Year-scoped enrollment / dues. AY 2026-27 starts empty (future books). */
export const SEED_STUDENT_YEAR_LEDGERS: StudentYearLedger[] = [
  {
    academicYear: "AY 2024-25",
    byStudentId: {
      "STU-2841": { cls: "Grade 7 - B", due: 0, active: true },
      "STU-2842": { cls: "LKG - M", due: 0, active: true },
      "STU-2843": { cls: "Grade 9 - A", due: 0, active: true },
      "STU-2844": { cls: "Grade 5 - C", due: 0, active: true },
      "STU-2845": { cls: "Grade 3 - B", due: 0, active: true },
      "STU-2846": { cls: "Grade 11 - A", due: 0, active: true },
    },
  },
  {
    academicYear: "AY 2025-26",
    byStudentId: Object.fromEntries(
      SEED_STUDENTS.filter((s) => !s.deletedAt).map((s) => [
        s.id,
        {
          cls: s.cls,
          due: s.due,
          active: s.active !== false,
        },
      ]),
    ),
  },
  {
    academicYear: "AY 2026-27",
    byStudentId: {},
  },
];

/** Normalize free-text into `AY YYYY-YY` when possible. */
export function normalizeAcademicYearLabel(input: string): string | null {
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;

  const match = trimmed.match(/^(?:AY\s*)?(\d{4})\s*[-–/]\s*(\d{2}|\d{4})$/i);
  if (match) {
    const start = match[1];
    const endRaw = match[2];
    const end = endRaw.length === 4 ? endRaw.slice(2) : endRaw;
    return `AY ${start}-${end}`;
  }

  if (/^AY\s+/i.test(trimmed)) {
    return trimmed.replace(/^AY\s+/i, "AY ");
  }

  return `AY ${trimmed}`;
}

function ensureAcademicYearInList(years: string[], active: string): string[] {
  const cleaned = years.map((y) => y.trim()).filter(Boolean);
  if (active && !cleaned.includes(active)) cleaned.push(active);
  return cleaned.length > 0 ? cleaned : [...SEED_ACADEMIC_YEARS];
}

export const THEME_MODE_OPTIONS: ThemeSettings["mode"][] = ["Light", "Dark"];
export const THEME_ACCENT_OPTIONS: ThemeSettings["accent"][] = ["Neon Lime", "Pale Lime", "Ink"];
export const THEME_DENSITY_OPTIONS: ThemeSettings["density"][] = ["Comfortable", "Compact"];
export const THEME_NAV_PLACEMENT_OPTIONS: ThemeSettings["navPlacement"][] = [
  "Left",
  "Right",
  "Top",
  "Bottom",
];

export function applyWorkspaceThemeMode(mode: ThemeSettings["mode"]) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const dark = mode === "Dark";
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#0a0a0a" : "#EAEAEA");
}

export function peekStoredThemeMode(): ThemeSettings["mode"] {
  if (typeof window === "undefined") return "Light";
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
    if (!raw) return "Light";
    const parsed = JSON.parse(raw) as { themeSettings?: { mode?: unknown } };
    return normalizeThemeMode(parsed.themeSettings?.mode);
  } catch {
    return "Light";
  }
}

export function getStoredNavPlacement(): ThemeSettings["navPlacement"] {
  if (typeof window === "undefined") return "Left";
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
    if (!raw) return "Left";
    const parsed = JSON.parse(raw) as { themeSettings?: { navPlacement?: unknown } };
    const placement = parsed.themeSettings?.navPlacement;
    if (
      typeof placement === "string" &&
      THEME_NAV_PLACEMENT_OPTIONS.includes(placement as ThemeSettings["navPlacement"])
    ) {
      return placement as ThemeSettings["navPlacement"];
    }
  } catch {
    // ignore
  }
  return "Left";
}

export const SEED_THEME_SETTINGS: ThemeSettings = {
  mode: "Light",
  accent: "Neon Lime",
  density: "Comfortable",
  navPlacement: "Left",
};

export const SEED_SCHOOL_DETAILS: SchoolDetails = {
  name: "Silver Hills Global",
  tagline: "Excellence in education",
  address: "NH-66, Calicut Bypass, Kozhikode, Kerala 673601",
  phone: "+91 495 240 1122",
  email: "office@silverhills.edu.in",
  website: "www.silverhills.edu.in",
  registrationNo: "REG/KL/2014/0842",
  affiliationNo: "CBSE/AFF/930821",
  principalName: "Dr. Anitha Menon",
  establishedYear: "1998",
};

type Snapshot = {
  students: Student[];
  staff: Staff[];
  payments: Payment[];
  departments: Department[];
  roles: Role[];
  classes: ClassConfig[];
  transportRoutes: TransportRoute[];
  transportVehicles: TransportVehicle[];
  paymentCategories: PaymentCategory[];
  feeTerms: FeeTerm[];
  studentYearLedgers: StudentYearLedger[];
  academicYears: string[];
  academicYear: string;
  themeSettings: ThemeSettings;
  schoolDetails: SchoolDetails;
  dashboardTodos: string[];
  dashboardNote: string;
  notifications: TenantNotification[];
  tenantUsers: TenantUser[];
};

type TenantStoreValue = {
  students: Student[];
  setStudents: Dispatch<SetStateAction<Student[]>>;
  /** Students enrolled in the active academic year (dues/class from year ledger). */
  activeStudents: Student[];
  staff: Staff[];
  setStaff: Dispatch<SetStateAction<Staff[]>>;
  payments: Payment[];
  setPayments: Dispatch<SetStateAction<Payment[]>>;
  /** Receipts stamped for the active academic year. */
  activePayments: Payment[];
  departments: Department[];
  setDepartments: Dispatch<SetStateAction<Department[]>>;
  roles: Role[];
  setRoles: Dispatch<SetStateAction<Role[]>>;
  tenantUsers: TenantUser[];
  setTenantUsers: Dispatch<SetStateAction<TenantUser[]>>;
  classes: ClassConfig[];
  setClasses: Dispatch<SetStateAction<ClassConfig[]>>;
  transportRoutes: TransportRoute[];
  setTransportRoutes: Dispatch<SetStateAction<TransportRoute[]>>;
  transportVehicles: TransportVehicle[];
  setTransportVehicles: Dispatch<SetStateAction<TransportVehicle[]>>;
  paymentCategories: PaymentCategory[];
  setPaymentCategories: Dispatch<SetStateAction<PaymentCategory[]>>;
  feeTerms: FeeTerm[];
  setFeeTerms: Dispatch<SetStateAction<FeeTerm[]>>;
  /** Fee periods for the active academic year. */
  activeFeeTerms: FeeTerm[];
  studentYearLedgers: StudentYearLedger[];
  setStudentYearLedgers: Dispatch<SetStateAction<StudentYearLedger[]>>;
  academicYears: string[];
  setAcademicYears: Dispatch<SetStateAction<string[]>>;
  academicYear: string;
  setAcademicYear: Dispatch<SetStateAction<string>>;
  /** Open another year’s books (updates active year + syncs student overlays). */
  openAcademicYear: (year: string) => { receipts: number; enrolled: number };
  /** Add a year, cloning fee terms from the nearest existing year. */
  addAcademicYear: (year: string) => boolean;
  /** Whether a year can be deleted (no payments / enrollments / sole year). */
  canDeleteAcademicYear: (year: string) => { ok: boolean; reason?: string };
  deleteAcademicYear: (year: string) => boolean;
  enrollStudentInActiveYear: (
    studentId: string,
    fields: StudentYearFields,
  ) => void;
  /** Atomically add a new student and enroll them in the active academic year. */
  admitStudentToActiveYear: (student: Student, fields: StudentYearFields) => Student;
  themeSettings: ThemeSettings;
  setThemeSettings: Dispatch<SetStateAction<ThemeSettings>>;
  schoolDetails: SchoolDetails;
  setSchoolDetails: Dispatch<SetStateAction<SchoolDetails>>;
  dashboardTodos: string[];
  setDashboardTodos: Dispatch<SetStateAction<string[]>>;
  dashboardNote: string;
  setDashboardNote: Dispatch<SetStateAction<string>>;
  notifications: TenantNotification[];
  setNotifications: Dispatch<SetStateAction<TenantNotification[]>>;
  resetTenant: () => void;
};

function normalizeThemeMode(value: unknown): ThemeSettings["mode"] {
  if (value === "Dark") return "Dark";
  return "Light";
}

function normalizeThemeAccent(value: unknown): ThemeSettings["accent"] {
  if (THEME_ACCENT_OPTIONS.includes(value as ThemeSettings["accent"])) {
    return value as ThemeSettings["accent"];
  }
  return SEED_THEME_SETTINGS.accent;
}

function isThemeSettings(value: unknown): value is Omit<ThemeSettings, "navPlacement" | "mode" | "accent"> & {
  mode?: unknown;
  accent?: unknown;
  navPlacement?: ThemeSettings["navPlacement"];
} {
  const candidate = value as Partial<ThemeSettings> | null;
  return (
    !!candidate &&
    typeof candidate === "object" &&
    THEME_DENSITY_OPTIONS.includes(candidate.density as ThemeSettings["density"])
  );
}

function normalizeThemeSettings(value: unknown): ThemeSettings {
  if (!isThemeSettings(value)) return SEED_THEME_SETTINGS;
  const placement = value.navPlacement;
  return {
    mode: normalizeThemeMode(value.mode),
    accent: normalizeThemeAccent(value.accent),
    density: value.density as ThemeSettings["density"],
    navPlacement: THEME_NAV_PLACEMENT_OPTIONS.includes(placement as ThemeSettings["navPlacement"])
      ? (placement as ThemeSettings["navPlacement"])
      : "Left",
  };
}

function asTrimmedString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asOptionalDataUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("data:image/")) return undefined;
  return value;
}

export function normalizeSchoolDetails(value: unknown): SchoolDetails {
  if (!value || typeof value !== "object") return { ...SEED_SCHOOL_DETAILS };
  const raw = value as Partial<SchoolDetails>;
  const name = asTrimmedString(raw.name, SEED_SCHOOL_DETAILS.name) || SEED_SCHOOL_DETAILS.name;
  return {
    name,
    logoUrl: asOptionalDataUrl(raw.logoUrl),
    letterheadUrl: asOptionalDataUrl(raw.letterheadUrl),
    tagline: asTrimmedString(raw.tagline, SEED_SCHOOL_DETAILS.tagline),
    address: asTrimmedString(raw.address, SEED_SCHOOL_DETAILS.address),
    phone: asTrimmedString(raw.phone, SEED_SCHOOL_DETAILS.phone),
    email: asTrimmedString(raw.email, SEED_SCHOOL_DETAILS.email),
    website: asTrimmedString(raw.website, SEED_SCHOOL_DETAILS.website),
    registrationNo: asTrimmedString(raw.registrationNo, SEED_SCHOOL_DETAILS.registrationNo),
    affiliationNo: asTrimmedString(raw.affiliationNo, SEED_SCHOOL_DETAILS.affiliationNo),
    principalName: asTrimmedString(raw.principalName, SEED_SCHOOL_DETAILS.principalName),
    establishedYear: asTrimmedString(raw.establishedYear, SEED_SCHOOL_DETAILS.establishedYear),
  };
}

export function schoolInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizePayment(
  raw: Partial<Payment> & Pick<Payment, "id" | "name" | "cat" | "mode" | "amount" | "time">,
  fallbackYear: string,
): Payment {
  return {
    ...raw,
    academicYear:
      typeof raw.academicYear === "string" && raw.academicYear.trim()
        ? raw.academicYear.trim()
        : fallbackYear,
  };
}

function normalizeStudentYearLedgers(
  raw: unknown,
  students: Student[],
  fallbackYear: string,
): StudentYearLedger[] {
  if (Array.isArray(raw) && raw.length > 0) {
    const parsed: StudentYearLedger[] = [];
    for (const entry of raw) {
      if (!entry || typeof entry !== "object") continue;
      const year =
        typeof (entry as StudentYearLedger).academicYear === "string"
          ? (entry as StudentYearLedger).academicYear.trim()
          : "";
      if (!year) continue;
      const byRaw = (entry as StudentYearLedger).byStudentId;
      const byStudentId: Record<string, StudentYearFields> = {};
      if (byRaw && typeof byRaw === "object") {
        for (const [id, fields] of Object.entries(byRaw)) {
          if (!fields || typeof fields !== "object") continue;
          byStudentId[id] = {
            cls: typeof fields.cls === "string" ? fields.cls : "",
            due:
              typeof fields.due === "number" && Number.isFinite(fields.due)
                ? Math.max(0, Math.round(fields.due))
                : 0,
            active: fields.active !== false,
          };
        }
      }
      parsed.push({ academicYear: year, byStudentId });
    }
    if (parsed.length > 0) {
      return ensureYearLedger(parsed, fallbackYear);
    }
  }
  return [buildLedgerFromStudents(students, fallbackYear)];
}

function parseSnapshot(raw: string): Snapshot | null {
  const parsed = JSON.parse(raw) as Partial<Snapshot> | null;
  if (
    !parsed ||
    !Array.isArray(parsed.students) ||
    !Array.isArray(parsed.staff) ||
    !Array.isArray(parsed.payments) ||
    !Array.isArray(parsed.departments) ||
    !Array.isArray(parsed.roles) ||
    !Array.isArray(parsed.classes) ||
    !Array.isArray(parsed.transportRoutes) ||
    !Array.isArray(parsed.paymentCategories) ||
    typeof parsed.academicYear !== "string"
  ) {
    return null;
  }
  const academicYear = parsed.academicYear;
  const students = parsed.students.map((s) => normalizeStudent(s as Student));
  const hadLedgers =
    Array.isArray((parsed as Partial<Snapshot>).studentYearLedgers) &&
    ((parsed as Partial<Snapshot>).studentYearLedgers as unknown[]).length > 0;
  const rawPayments = parsed.payments.map((p) =>
    normalizePayment(
      p as Partial<Payment> & Pick<Payment, "id" | "name" | "cat" | "mode" | "amount" | "time">,
      academicYear,
    ),
  );
  // Fresh partition upgrade: fold in demo books for other years when ledgers were absent.
  const payments = hadLedgers
    ? rawPayments
    : [
        ...SEED_PAYMENTS.filter((p) => (p.academicYear ?? "") !== academicYear),
        ...rawPayments.map((p) => ({
          ...p,
          academicYear: p.academicYear ?? academicYear,
        })),
      ];
  const feeTerms = Array.isArray((parsed as Partial<Snapshot>).feeTerms)
    ? ((parsed as Partial<Snapshot>).feeTerms as Partial<FeeTerm>[])
        .map((t) =>
          normalizeFeeTerm(
            t as Partial<FeeTerm> & Pick<FeeTerm, "id" | "label">,
            academicYear,
          ),
        )
        .filter((t): t is FeeTerm => t !== null)
    : [...SEED_FEE_TERMS];
  const migratedFeeTerms = hadLedgers
    ? feeTerms
    : (() => {
        const stamped = feeTerms.map((t) => ({
          ...t,
          academicYear: t.academicYear ?? academicYear,
        }));
        const yearsPresent = new Set(stamped.map((t) => t.academicYear ?? academicYear));
        const extras = SEED_FEE_TERMS.filter(
          (t) => !yearsPresent.has(t.academicYear ?? ""),
        );
        return [...stamped, ...extras];
      })();
  const studentYearLedgers = hadLedgers
    ? normalizeStudentYearLedgers(
        (parsed as Partial<Snapshot>).studentYearLedgers,
        students,
        academicYear,
      )
    : (() => {
        const current = buildLedgerFromStudents(students, academicYear);
        const others = SEED_STUDENT_YEAR_LEDGERS.filter((l) => l.academicYear !== academicYear);
        return [current, ...others];
      })();
  const ledger = getYearLedger(studentYearLedgers, academicYear);
  const studentsWithYear = students.map((s) =>
    applyLedgerToStudent(s, ledger.byStudentId[s.id]),
  );
  return {
    students: studentsWithYear,
    staff: parsed.staff.map((s) => normalizeStaff(s as Staff)),
    payments,
    departments: parsed.departments,
    roles: parsed.roles,
    classes: Array.isArray(parsed.classes)
      ? parsed.classes.map((c) =>
          normalizeClassConfig(c as Partial<ClassConfig> & Pick<ClassConfig, "id" | "tuitionFeeAmount">),
        )
      : [...SEED_CLASSES],
    transportRoutes: (parsed.transportRoutes ?? [])
      .map(normalizeTransportRoute)
      .filter((r): r is TransportRoute => r !== null),
    transportVehicles: Array.isArray(parsed.transportVehicles)
      ? parsed.transportVehicles
          .map(normalizeTransportVehicle)
          .filter((v): v is TransportVehicle => v !== null)
      : [...SEED_VEHICLES],
    paymentCategories: parsed.paymentCategories,
    feeTerms: migratedFeeTerms,
    studentYearLedgers,
    academicYears: ensureAcademicYearInList(
      Array.isArray(parsed.academicYears)
        ? parsed.academicYears.filter((y): y is string => typeof y === "string")
        : [...SEED_ACADEMIC_YEARS],
      parsed.academicYear,
    ),
    academicYear: parsed.academicYear,
    themeSettings: normalizeThemeSettings(parsed.themeSettings),
    schoolDetails: normalizeSchoolDetails(
      (parsed as Partial<Snapshot>).schoolDetails ?? {
        name: SEED_SCHOOL_DETAILS.name,
      },
    ),
    dashboardTodos: normalizeDashboardTodos(parsed.dashboardTodos),
    dashboardNote: typeof parsed.dashboardNote === "string" ? parsed.dashboardNote : "",
    notifications: normalizeNotifications(parsed.notifications),
    tenantUsers: Array.isArray((parsed as Partial<Snapshot>).tenantUsers)
      ? ((parsed as Partial<Snapshot>).tenantUsers as Partial<TenantUser>[])
          .filter((u): u is Partial<TenantUser> & Pick<TenantUser, "id" | "email"> =>
            Boolean(u && typeof u.id === "string" && typeof u.email === "string"),
          )
          .map(normalizeTenantUser)
      : [...SEED_TENANT_USERS],
  };
}

function readSnapshot(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
    if (!raw) return null;
    return parseSnapshot(raw);
  } catch {
    return null;
  }
}

function writeSnapshot(snapshot: Snapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore quota / private mode errors
  }
}

/** Generate a URL-safe share token for parent profile links. */
export function createStudentShareToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `tok_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export function parentStudentPath(token: string): string {
  return `/parent/student/${token}`;
}

export function parentStudentAbsoluteUrl(token: string): string {
  if (typeof window === "undefined") return parentStudentPath(token);
  return `${window.location.origin}${parentStudentPath(token)}`;
}

export type ParentEditableStudentFields = {
  guardian: string;
  phone?: string;
  gender?: "M" | "F";
  dob?: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  aadhaar?: string;
  placeOfBirth?: string;
  nationality?: string;
  religion?: string;
  studentCategory?: string;
  bloodGroup?: string;
  fatherOccupation?: string;
  motherName?: string;
  guardianRelation?: GuardianRelation;
  guardianOccupation?: string;
  needsBus?: boolean;
  busPoint1?: string;
  busPoint2?: string;
};

export function parentFieldsFromStudent(student: Student): ParentEditableStudentFields {
  return {
    guardian: student.guardian ?? "",
    phone: student.phone ?? "",
    gender: student.gender,
    dob: student.dob ?? "",
    email: student.email ?? "",
    address: student.address ?? "",
    photoUrl: student.photoUrl ?? "",
    aadhaar: student.aadhaar ?? "",
    placeOfBirth: student.placeOfBirth ?? "",
    nationality: student.nationality ?? "",
    religion: student.religion ?? "",
    studentCategory: student.studentCategory ?? "",
    bloodGroup: student.bloodGroup ?? "",
    fatherOccupation: student.fatherOccupation ?? "",
    motherName: student.motherName ?? "",
    guardianRelation: student.guardianRelation,
    guardianOccupation: student.guardianOccupation ?? "",
    needsBus:
      typeof student.needsBus === "boolean"
        ? student.needsBus
        : Boolean(student.busPoint1 || student.busPoint2),
    busPoint1: student.busPoint1 ?? "",
    busPoint2: student.busPoint2 ?? "",
  };
}

/** Read a student by public share token from persisted tenant storage. */
export function getStudentByShareToken(token: string): Student | null {
  const normalized = token.trim();
  if (!normalized) return null;
  const snap = readSnapshot();
  const fromSnap = snap?.students.find((s) => s.shareToken === normalized && !s.deletedAt);
  if (fromSnap) return fromSnap;
  return SEED_STUDENTS.find((s) => s.shareToken === normalized && !s.deletedAt) ?? null;
}

/** Transport routes from Settings (snapshot) for parent pickup/drop dropdowns. */
export function getTransportRoutesForParent(): TransportRoute[] {
  const snap = readSnapshot();
  if (snap?.transportRoutes?.length) return snap.transportRoutes;
  return [...SEED_TRANSPORT];
}

export function transportBusPointOptions(routes: TransportRoute[]): {
  pickups: string[];
  drops: string[];
} {
  const pickups = new Set<string>();
  const drops = new Set<string>();
  for (const route of routes) {
    if (route.mapFrom.trim()) pickups.add(route.mapFrom.trim());
    if (route.mapTo.trim()) drops.add(route.mapTo.trim());
  }
  return {
    pickups: Array.from(pickups).sort((a, b) => a.localeCompare(b, "en")),
    drops: Array.from(drops).sort((a, b) => a.localeCompare(b, "en")),
  };
}

/**
 * Apply parent-submitted profile updates for a share token.
 * Admin fields (name, class, due) stay locked.
 */
export function applyParentStudentUpdate(
  token: string,
  patch: ParentEditableStudentFields,
): Student | null {
  const normalized = token.trim();
  if (!normalized) return null;

  const snap = readSnapshot();
  if (!snap) return null;

  const idx = snap.students.findIndex((s) => s.shareToken === normalized);
  if (idx < 0) return null;

  const current = snap.students[idx];
  const guardian = patch.guardian.trim();
  if (!guardian) return null;

  const updated = normalizeStudent({
    ...current,
    guardian,
    phone: patch.phone,
    gender: patch.gender,
    dob: patch.dob,
    email: patch.email,
    address: patch.address,
    photoUrl: patch.photoUrl,
    aadhaar: patch.aadhaar,
    placeOfBirth: patch.placeOfBirth,
    nationality: patch.nationality,
    religion: patch.religion,
    studentCategory: patch.studentCategory,
    bloodGroup: patch.bloodGroup,
    fatherOccupation: patch.fatherOccupation,
    motherName: patch.motherName,
    guardianRelation: patch.guardianRelation,
    guardianOccupation: patch.guardianOccupation,
    needsBus: patch.needsBus === true,
    busPoint1: patch.needsBus ? patch.busPoint1 : undefined,
    busPoint2: patch.needsBus ? patch.busPoint2 : undefined,
  });

  const nextStudents = [...snap.students];
  nextStudents[idx] = updated;
  writeSnapshot({ ...snap, students: nextStudents });
  return updated;
}

/** Lookup active tenant login credentials from persisted snapshot (used at login before React store mounts). */
export function findActiveTenantUserByCredentials(
  email: string,
  password: string,
): TenantUser | null {
  const snap = readSnapshot();
  if (!snap) return null;
  const normalized = email.trim().toLowerCase();
  return (
    snap.tenantUsers.find(
      (u) => u.active && u.email === normalized && u.password === password,
    ) ?? null
  );
}

export function findTenantUserByStaffId(staffId: string): TenantUser | null {
  const snap = readSnapshot();
  if (!snap) return null;
  return snap.tenantUsers.find((u) => u.staffId === staffId) ?? null;
}

export function findTenantUserById(userId: string): TenantUser | null {
  const snap = readSnapshot();
  if (!snap) return null;
  return snap.tenantUsers.find((u) => u.id === userId) ?? null;
}

/** Persist a student into localStorage immediately (so parent links work before React effects flush). */
export function upsertStudentInSnapshot(student: Student) {
  const snap = readSnapshot();
  if (!snap) return;
  const normalized = normalizeStudent(student);
  const idx = snap.students.findIndex((s) => s.id === normalized.id);
  const nextStudents = [...snap.students];
  if (idx >= 0) nextStudents[idx] = { ...nextStudents[idx], ...normalized };
  else nextStudents.unshift(normalized);
  writeSnapshot({ ...snap, students: nextStudents });
}

const TenantStoreContext = createContext<TenantStoreValue | null>(null);

export function TenantStoreProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(SEED_STUDENTS);
  const [staff, setStaff] = useState<Staff[]>(SEED_STAFF);
  const [payments, setPayments] = useState<Payment[]>(SEED_PAYMENTS);
  const [departments, setDepartments] = useState<Department[]>(SEED_DEPARTMENTS);
  const [roles, setRoles] = useState<Role[]>(SEED_ROLES);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>(SEED_TENANT_USERS);
  const [classes, setClasses] = useState<ClassConfig[]>(SEED_CLASSES);
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>(SEED_TRANSPORT);
  const [transportVehicles, setTransportVehicles] = useState<TransportVehicle[]>(SEED_VEHICLES);
  const [paymentCategories, setPaymentCategories] =
    useState<PaymentCategory[]>(SEED_PAYMENT_CATEGORIES);
  const [feeTerms, setFeeTerms] = useState<FeeTerm[]>(SEED_FEE_TERMS);
  const [studentYearLedgers, setStudentYearLedgers] = useState<StudentYearLedger[]>(
    SEED_STUDENT_YEAR_LEDGERS,
  );
  const [academicYears, setAcademicYears] = useState<string[]>([...SEED_ACADEMIC_YEARS]);
  const [academicYear, setAcademicYearState] = useState<string>(SEED_ACADEMIC_YEAR);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(SEED_THEME_SETTINGS);
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails>(SEED_SCHOOL_DETAILS);
  const [dashboardTodos, setDashboardTodos] = useState<string[]>([...DEFAULT_DASHBOARD_TODOS]);
  const [dashboardNote, setDashboardNote] = useState("");
  const [notifications, setNotifications] = useState<TenantNotification[]>([...SEED_NOTIFICATIONS]);
  const [hydrated, setHydrated] = useState(false);

  const applySnapshot = useCallback((snap: Snapshot) => {
    setStudents(snap.students);
    setStaff(snap.staff);
    setPayments(snap.payments);
    setDepartments(snap.departments);
    setRoles(snap.roles);
    setTenantUsers(snap.tenantUsers ?? SEED_TENANT_USERS);
    setClasses(
      Array.isArray(snap.classes)
        ? snap.classes.map((c) =>
            normalizeClassConfig(
              c as Partial<ClassConfig> &
                Pick<ClassConfig, "id" | "tuitionFeeAmount">,
            ),
          )
        : SEED_CLASSES,
    );
    setTransportRoutes(snap.transportRoutes);
    setTransportVehicles(snap.transportVehicles);
    setPaymentCategories(snap.paymentCategories);
    setFeeTerms(
      Array.isArray(snap.feeTerms)
        ? snap.feeTerms
            .map((t) =>
              normalizeFeeTerm(t as Partial<FeeTerm> & Pick<FeeTerm, "id" | "label">),
            )
            .filter((t): t is FeeTerm => t !== null)
        : SEED_FEE_TERMS,
    );
    setStudentYearLedgers(
      snap.studentYearLedgers?.length
        ? snap.studentYearLedgers
        : SEED_STUDENT_YEAR_LEDGERS,
    );
    setAcademicYears(snap.academicYears);
    setAcademicYearState(snap.academicYear);
    setThemeSettings(snap.themeSettings);
    setSchoolDetails(snap.schoolDetails);
    setDashboardTodos(snap.dashboardTodos);
    setDashboardNote(snap.dashboardNote);
    setNotifications(snap.notifications);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      // Prefer live API data when a JWT exists (school admin / tenant user).
      if (getApiToken()) {
        try {
          const remote = await fetchRemoteTenantBundle();
          if (!cancelled && remote) {
            applySnapshot({
              students: remote.students,
              staff: remote.staff,
              payments: remote.payments,
              departments: remote.departments,
              roles: remote.roles,
              classes: remote.classes,
              transportRoutes: remote.transportRoutes,
              transportVehicles: remote.transportVehicles,
              paymentCategories: remote.paymentCategories,
              feeTerms: remote.feeTerms,
              studentYearLedgers: remote.studentYearLedgers,
              academicYears: remote.academicYears,
              academicYear: remote.academicYear,
              themeSettings: remote.themeSettings,
              schoolDetails: remote.schoolDetails,
              dashboardTodos: remote.dashboardTodos,
              dashboardNote: remote.dashboardNote,
              notifications: remote.notifications,
              tenantUsers: remote.tenantUsers,
            });
            setHydrated(true);
            return;
          }
        } catch {
          // fall through to localStorage / seeds
        }
      }

      if (cancelled) return;
      const snap = readSnapshot();
      if (snap) applySnapshot(snap);
      setHydrated(true);
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [applySnapshot]);

  useEffect(() => {
    applyWorkspaceThemeMode(themeSettings.mode);
  }, [themeSettings.mode]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      const snap = parseSnapshot(event.newValue);
      if (!snap) return;
      applySnapshot(snap);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [applySnapshot]);

  useEffect(() => {
    if (!hydrated) return;
    setNotifications((prev) => {
      const next = mergeVehicleExpiryNotifications(prev, transportVehicles);
      const fingerprint = (list: TenantNotification[]) =>
        list
          .filter((n) => n.id.startsWith(VEHICLE_DOC_EXPIRY_PREFIX))
          .map((n) => `${n.id}\0${n.body}\0${n.read}`)
          .sort()
          .join("\n");
      return fingerprint(prev) === fingerprint(next) ? prev : next;
    });
  }, [hydrated, transportVehicles]);

  // Keep active-year ledger in sync when student due/cls/active change for enrolled IDs.
  useEffect(() => {
    if (!hydrated) return;
    setStudentYearLedgers((prev) => {
      const ledger = getYearLedger(prev, academicYear);
      const enrolledIds = new Set(Object.keys(ledger.byStudentId));
      if (enrolledIds.size === 0) return prev;
      const activeSlice = students.filter((s) => enrolledIds.has(s.id) && !s.deletedAt);
      const next = syncLedgerFromActiveStudents(prev, academicYear, activeSlice);
      const prevFp = JSON.stringify(ledger.byStudentId);
      const nextFp = JSON.stringify(getYearLedger(next, academicYear).byStudentId);
      return prevFp === nextFp ? prev : next;
    });
  }, [hydrated, students, academicYear]);

  useEffect(() => {
    if (!hydrated) return;
    writeSnapshot({
      students,
      staff,
      payments,
      departments,
      roles,
      classes,
      transportRoutes,
      transportVehicles,
      paymentCategories,
      feeTerms,
      studentYearLedgers,
      academicYears,
      academicYear,
      themeSettings,
      schoolDetails,
      dashboardTodos,
      dashboardNote,
      notifications,
      tenantUsers,
    });
  }, [
    hydrated,
    students,
    staff,
    payments,
    departments,
    roles,
    classes,
    transportRoutes,
    transportVehicles,
    paymentCategories,
    feeTerms,
    studentYearLedgers,
    academicYears,
    academicYear,
    themeSettings,
    schoolDetails,
    dashboardTodos,
    dashboardNote,
    notifications,
    tenantUsers,
  ]);

  const activePayments = useMemo(
    () => filterByAcademicYear(payments, academicYear),
    [payments, academicYear],
  );
  const activeFeeTerms = useMemo(
    () => filterByAcademicYear(feeTerms, academicYear),
    [feeTerms, academicYear],
  );
  const activeStudents = useMemo(
    () => studentsForAcademicYear(students, studentYearLedgers, academicYear),
    [students, studentYearLedgers, academicYear],
  );

  const setAcademicYear = useCallback<Dispatch<SetStateAction<string>>>(
    (action) => {
      setAcademicYearState((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        if (next === prev) return prev;
        setStudentYearLedgers((ledgers) => {
          const ensured = ensureYearLedger(ledgers, next);
          const ledger = getYearLedger(ensured, next);
          setStudents((current) =>
            current.map((s) => applyLedgerToStudent(s, ledger.byStudentId[s.id])),
          );
          return ensured;
        });
        return next;
      });
    },
    [],
  );

  const openAcademicYear = useCallback(
    (year: string) => {
      setAcademicYear(year);
      return academicYearBookStats({
        payments,
        ledgers: studentYearLedgers,
        year,
      });
    },
    [payments, setAcademicYear, studentYearLedgers],
  );

  const addAcademicYear = useCallback(
    (year: string) => {
      if (academicYears.some((y) => y.toLowerCase() === year.toLowerCase())) {
        return false;
      }
      const sourceYear =
        academicYears.find((y) => y === academicYear) ??
        academicYears[academicYears.length - 1] ??
        SEED_ACADEMIC_YEAR;
      const cloned = cloneFeeTermsForYear(
        feeTerms,
        sourceYear,
        year,
        `FT-${year.replace(/\s+/g, "")}`,
      );
      setFeeTerms((prev) => [...prev, ...cloned]);
      setStudentYearLedgers((prev) => ensureYearLedger(prev, year));
      setAcademicYears((prev) => [...prev, year]);
      setAcademicYear(year);
      return true;
    },
    [academicYear, academicYears, feeTerms, setAcademicYear],
  );

  const canDeleteAcademicYear = useCallback(
    (year: string) => {
      if (academicYears.length <= 1) {
        return { ok: false, reason: "Keep at least one academic year" };
      }
      if (filterByAcademicYear(payments, year).length > 0) {
        return { ok: false, reason: "This year still has receipts recorded" };
      }
      const enrolled = Object.keys(getYearLedger(studentYearLedgers, year).byStudentId)
        .length;
      if (enrolled > 0) {
        return { ok: false, reason: "This year still has student enrollments" };
      }
      return { ok: true };
    },
    [academicYears.length, payments, studentYearLedgers],
  );

  const deleteAcademicYear = useCallback(
    (year: string) => {
      const check = canDeleteAcademicYear(year);
      if (!check.ok) return false;
      setAcademicYears((prev) => prev.filter((y) => y !== year));
      setFeeTerms((prev) => prev.filter((t) => t.academicYear !== year));
      setStudentYearLedgers((prev) => prev.filter((l) => l.academicYear !== year));
      setPayments((prev) => prev.filter((p) => p.academicYear !== year));
      if (academicYear === year) {
        const next = academicYears.find((y) => y !== year);
        if (next) setAcademicYear(next);
      }
      return true;
    },
    [academicYear, academicYears, canDeleteAcademicYear, setAcademicYear],
  );

  const enrollStudentInActiveYear = useCallback(
    (studentId: string, fields: StudentYearFields) => {
      setStudentYearLedgers((prev) =>
        upsertStudentYearFields(prev, academicYear, studentId, fields),
      );
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? applyLedgerToStudent(s, {
                cls: fields.cls,
                due: fields.due,
                active: fields.active,
              })
            : s,
        ),
      );
    },
    [academicYear],
  );

  const admitStudentToActiveYear = useCallback(
    (student: Student, fields: StudentYearFields) => {
      const enrolled = applyLedgerToStudent(normalizeStudent(student), fields);
      setStudentYearLedgers((prev) =>
        upsertStudentYearFields(prev, academicYear, enrolled.id, fields),
      );
      setStudents((prev) => [enrolled, ...prev.filter((s) => s.id !== enrolled.id)]);
      upsertStudentInSnapshot(enrolled);
      return enrolled;
    },
    [academicYear],
  );

  const resetTenant = () => {
    setStudents(SEED_STUDENTS);
    setStaff(SEED_STAFF);
    setPayments(SEED_PAYMENTS);
    setDepartments(SEED_DEPARTMENTS);
    setRoles(SEED_ROLES);
    setTenantUsers(SEED_TENANT_USERS);
    setClasses(SEED_CLASSES);
    setTransportRoutes(SEED_TRANSPORT);
    setTransportVehicles(SEED_VEHICLES);
    setPaymentCategories(SEED_PAYMENT_CATEGORIES);
    setFeeTerms(SEED_FEE_TERMS);
    setStudentYearLedgers(SEED_STUDENT_YEAR_LEDGERS);
    setAcademicYears([...SEED_ACADEMIC_YEARS]);
    setAcademicYearState(SEED_ACADEMIC_YEAR);
    setThemeSettings(SEED_THEME_SETTINGS);
    setSchoolDetails(SEED_SCHOOL_DETAILS);
    setDashboardTodos([...DEFAULT_DASHBOARD_TODOS]);
    setDashboardNote("");
    setNotifications([...SEED_NOTIFICATIONS]);
    writeSnapshot({
      students: SEED_STUDENTS,
      staff: SEED_STAFF,
      payments: SEED_PAYMENTS,
      departments: SEED_DEPARTMENTS,
      roles: SEED_ROLES,
      classes: SEED_CLASSES,
      transportRoutes: SEED_TRANSPORT,
      transportVehicles: SEED_VEHICLES,
      paymentCategories: SEED_PAYMENT_CATEGORIES,
      feeTerms: SEED_FEE_TERMS,
      studentYearLedgers: SEED_STUDENT_YEAR_LEDGERS,
      academicYears: [...SEED_ACADEMIC_YEARS],
      academicYear: SEED_ACADEMIC_YEAR,
      themeSettings: SEED_THEME_SETTINGS,
      schoolDetails: SEED_SCHOOL_DETAILS,
      dashboardTodos: [...DEFAULT_DASHBOARD_TODOS],
      dashboardNote: "",
      notifications: [...SEED_NOTIFICATIONS],
      tenantUsers: SEED_TENANT_USERS,
    });
  };

  const value = useMemo<TenantStoreValue>(
    () => ({
      students,
      setStudents,
      activeStudents,
      staff,
      setStaff,
      payments,
      setPayments,
      activePayments,
      departments,
      setDepartments,
      roles,
      setRoles,
      tenantUsers,
      setTenantUsers,
      classes,
      setClasses,
      transportRoutes,
      setTransportRoutes,
      transportVehicles,
      setTransportVehicles,
      paymentCategories,
      setPaymentCategories,
      feeTerms,
      setFeeTerms,
      activeFeeTerms,
      studentYearLedgers,
      setStudentYearLedgers,
      academicYears,
      setAcademicYears,
      academicYear,
      setAcademicYear,
      openAcademicYear,
      addAcademicYear,
      canDeleteAcademicYear,
      deleteAcademicYear,
      enrollStudentInActiveYear,
      admitStudentToActiveYear,
      themeSettings,
      setThemeSettings,
      schoolDetails,
      setSchoolDetails,
      dashboardTodos,
      setDashboardTodos,
      dashboardNote,
      setDashboardNote,
      notifications,
      setNotifications,
      resetTenant,
    }),
    [
      students,
      activeStudents,
      staff,
      payments,
      activePayments,
      departments,
      roles,
      tenantUsers,
      classes,
      transportRoutes,
      transportVehicles,
      paymentCategories,
      feeTerms,
      activeFeeTerms,
      studentYearLedgers,
      academicYears,
      academicYear,
      setAcademicYear,
      openAcademicYear,
      addAcademicYear,
      canDeleteAcademicYear,
      deleteAcademicYear,
      enrollStudentInActiveYear,
      admitStudentToActiveYear,
      themeSettings,
      schoolDetails,
      dashboardTodos,
      dashboardNote,
      notifications,
    ],
  );

  return <TenantStoreContext.Provider value={value}>{children}</TenantStoreContext.Provider>;
}

export function useTenantStore(): TenantStoreValue {
  const ctx = useContext(TenantStoreContext);
  if (!ctx) {
    throw new Error("useTenantStore must be used inside <TenantStoreProvider>");
  }
  return ctx;
}
