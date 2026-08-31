import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  fetchBranchOperationalBundle,
  fetchRemoteTenantBundle,
  branchCatalogWriteEpochValue,
} from "@/lib/api/tenant-sync";
import { getApiToken, isImpersonating } from "@/lib/api/client";
import {
  apiDeleteFeeTerm,
  apiSyncAcademicYears,
  apiSyncActiveBranch,
  apiSyncThemeSettings,
  apiUpsertFeeTerm,
} from "@/lib/api/settings";
import { apiSyncStudentYearFields } from "@/lib/api/records";
import {
  applyWorkspaceBrand,
  clearWorkspaceBrand,
  DEFAULT_BRAND_PRIMARY,
  DEFAULT_BRAND_SECONDARY,
  DEFAULT_FONT_COLOR,
  normalizeFontFamily,
  normalizeFontSize,
  normalizeHexColor,
  type FontFamilyOption,
  type FontSizeOption,
} from "@/lib/brand-theme";
import {
  clearActiveFileNames,
  DEFAULT_FILE_NAMES,
  normalizeFileNames,
  setActiveFileNames,
  type DownloadKind,
} from "@/lib/download-names";
import { readStoredBranchPublicId, setBranchContext } from "@/lib/branch-context";
import { normalizePermissionSet, type PermissionSet } from "@/lib/permissions";
import {
  academicYearBookStats,
  applyLedgerToStudent,
  buildLedgerFromStudents,
  cloneFeeTermsForYear,
  ensureYearLedger,
  filterByAcademicYear,
  getYearLedger,
  mergeStudentYearLedgers,
  normalizeAcademicYearLabel,
  parseAcademicYearBounds,
  reconcileLedgersWithStudents,
  studentsForAcademicYear,
  syncLedgerFromActiveStudents,
  upsertStudentYearFields,
  yearFieldEntriesMissingFrom,
  yearHasBookData,
  type StudentYearFields,
  type StudentYearLedger,
} from "@/lib/academic-year";
import { toDobIso } from "@/lib/dates";

export type { StudentYearFields, StudentYearLedger };
export {
  academicYearBookStats,
  cloneFeeTermsForYear,
  filterByAcademicYear,
  getYearLedger,
  normalizeAcademicYearLabel,
  parseAcademicYearBounds,
  studentsForAcademicYear,
  upsertStudentYearFields,
  yearHasBookData,
};

export const STUDENT_RELIGIONS = [
  "Buddhist",
  "Christian",
  "Hindu",
  "Muslim",
  "Islam",
  "Other",
  "Nil",
] as const;

export const STUDENT_CATEGORIES = ["GENERAL", "OBC", "OEC", "ST", "SC", "Others"] as const;

export const BLOOD_GROUPS = ["A+", "B+", "AB+", "A-", "B-", "AB-", "O+", "O-"] as const;

export const GUARDIAN_RELATIONS = ["Father", "Mother", "Others"] as const;

export type GuardianRelation = (typeof GUARDIAN_RELATIONS)[number];

export type StudentConcessionFeeTier = {
  enabled: boolean;
  billingCycle: Extract<ClassBillingCycle, "Monthly" | "Term" | "Annually">;
  feeAmountMode: ClassFeeAmountMode;
  feeSchedule: ClassFeeLine[];
  feeCollectionStartMonth?: string;
};

export type StudentConcessionOtherFee = {
  id: string;
  label: string;
  billingCycle: Extract<ClassBillingCycle, "Monthly" | "Term">;
  feeAmountMode: ClassFeeAmountMode;
  feeSchedule: ClassFeeLine[];
  feeCollectionStartMonth?: string;
};

export type StudentConcessionFees = {
  tuition?: StudentConcessionFeeTier;
  vehicle?: StudentConcessionFeeTier;
  otherFees?: StudentConcessionOtherFee[];
};

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
  /** When true, fee schedules on this student override class/route defaults */
  hasConcession?: boolean;
  /** Optional note · scholarship, staff child, etc. */
  concessionReason?: string;
  /** Per-student custom fee schedules */
  concessionFees?: StudentConcessionFees;
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
export const OTHER_ATTACHMENT_LEVELS: StaffDocumentLevel[] = [{ id: "files", label: "Files" }];

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
  /** Days on paid leave (count toward payable salary) */
  paidLeaveDays: number;
  /** Days on unpaid leave (do not count toward payable) */
  unpaidLeaveDays: number;
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

export function staffGrossSalary(
  staff: Pick<Staff, "basicSalary" | "additionalAllowances">,
): number {
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
 * With attendance: gross × ((daysPresent + paidLeaveDays) / workingDays).
 * Without attendance: full gross (unchanged behaviour).
 */
export function staffPayableSalary(
  staff: Pick<Staff, "basicSalary" | "additionalAllowances" | "attendanceByMonth">,
  month: string = currentPayrollMonth(),
): {
  gross: number;
  payable: number;
  ratio: number;
  payableDays: number;
  attendance?: StaffAttendanceMonth;
} {
  const gross = staffGrossSalary(staff);
  const attendance = getStaffAttendanceForMonth(staff, month);
  if (!attendance || !Number.isFinite(attendance.workingDays) || attendance.workingDays <= 0) {
    return { gross, payable: gross, ratio: 1, payableDays: 0 };
  }
  const paidLeave = Math.max(0, attendance.paidLeaveDays || 0);
  const present = Math.max(0, attendance.daysPresent);
  const payableDays = Math.max(0, Math.min(present + paidLeave, attendance.workingDays));
  const ratio = payableDays / attendance.workingDays;
  const payable = Math.round(gross * ratio);
  return { gross, payable, ratio, payableDays, attendance };
}

const MONTH_NAME_TO_INDEX: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

/** Infer payroll month (YYYY-MM) from a salary history row. */
export function salaryHistoryPayrollMonth(entry: StaffSalaryHistoryEntry): string | null {
  const desc = entry.description ?? "";
  const iso = desc.match(/\b(\d{4}-\d{2})\b/);
  if (iso) return iso[1];
  const named = desc.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i,
  );
  if (named) {
    const monthNum = MONTH_NAME_TO_INDEX[named[1].toLowerCase()];
    if (monthNum) return `${named[2]}-${String(monthNum).padStart(2, "0")}`;
  }
  const paid = entry.paidAt?.trim() ?? "";
  if (/^\d{4}-\d{2}/.test(paid)) return paid.slice(0, 7);
  return null;
}

export function salaryPaymentsForMonth(
  history: StaffSalaryHistoryEntry[] | undefined,
  month: string,
): StaffSalaryHistoryEntry[] {
  const key = month.trim();
  if (!key) return [];
  return (history ?? []).filter((entry) => salaryHistoryPayrollMonth(entry) === key);
}

export function salaryPaidAmountForMonth(
  history: StaffSalaryHistoryEntry[] | undefined,
  month: string,
): number {
  return salaryPaymentsForMonth(history, month).reduce((sum, entry) => sum + entry.amount, 0);
}

export function isSalaryMonthSettled(
  history: StaffSalaryHistoryEntry[] | undefined,
  month: string,
  payable: number,
): boolean {
  if (payable <= 0) return true;
  return salaryPaidAmountForMonth(history, month) >= payable;
}

export function totalSalaryDisbursed(history: StaffSalaryHistoryEntry[] | undefined): number {
  return (history ?? []).reduce((sum, entry) => sum + entry.amount, 0);
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
  const workingDays =
    typeof raw.workingDays === "number" && Number.isFinite(raw.workingDays)
      ? Math.max(0, Math.round(raw.workingDays))
      : 0;
  if (workingDays <= 0) return null;
  const daysPresent =
    typeof raw.daysPresent === "number" && Number.isFinite(raw.daysPresent)
      ? Math.max(0, Math.round(raw.daysPresent))
      : 0;
  const paidLeaveDays =
    typeof raw.paidLeaveDays === "number" && Number.isFinite(raw.paidLeaveDays)
      ? Math.max(0, Math.round(raw.paidLeaveDays))
      : 0;
  const unpaidLeaveDays =
    typeof raw.unpaidLeaveDays === "number" && Number.isFinite(raw.unpaidLeaveDays)
      ? Math.max(0, Math.round(raw.unpaidLeaveDays))
      : 0;
  // Clamp so present + paid + unpaid never exceed working days.
  let present = daysPresent;
  let paid = paidLeaveDays;
  let unpaid = unpaidLeaveDays;
  let allocated = present + paid + unpaid;
  if (allocated > workingDays) {
    const overflow = allocated - workingDays;
    const cutUnpaid = Math.min(unpaid, overflow);
    unpaid -= cutUnpaid;
    allocated -= cutUnpaid;
    if (allocated > workingDays) {
      const cutPaid = Math.min(paid, allocated - workingDays);
      paid -= cutPaid;
      allocated -= cutPaid;
    }
    if (allocated > workingDays) {
      present = Math.max(0, present - (allocated - workingDays));
    }
  }
  return {
    month,
    daysPresent: present,
    workingDays,
    paidLeaveDays: paid,
    unpaidLeaveDays: unpaid,
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
        typeof row.description === "string" && row.description ? row.description : "Salary payment",
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
          file.levelId === "other" ? "Other" : file.levelId === "files" ? "Files" : file.levelId;
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
          file.levelId === "other" ? "Other" : file.levelId === "files" ? "Files" : file.levelId;
        levels.push({ id: file.levelId, label });
        levelIds.add(file.levelId);
      }
    }
    const existingNumber = typeof existing?.number === "string" ? existing.number.trim() : "";
    const number =
      def.id === "doc-aadhaar" ? existingNumber || (aadhaar ?? "").trim() : existingNumber;
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

function normalizeConcessionFeeTier(raw: unknown): StudentConcessionFeeTier | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Partial<StudentConcessionFeeTier>;
  const billingCycle =
    row.billingCycle === "Term" || row.billingCycle === "Annually" ? row.billingCycle : "Monthly";
  const feeAmountMode = row.feeAmountMode === "custom" ? "custom" : "fixed";
  const feeSchedule = Array.isArray(row.feeSchedule)
    ? row.feeSchedule
        .map((line, index) => normalizeClassFeeLine(line, index))
        .filter((line): line is ClassFeeLine => line !== null)
    : [];
  return {
    enabled: row.enabled === true,
    billingCycle,
    feeAmountMode,
    feeSchedule,
    feeCollectionStartMonth: optionalTrimmedString(row.feeCollectionStartMonth),
  };
}

export function normalizeStudentConcessionFees(raw: unknown): StudentConcessionFees | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Partial<StudentConcessionFees>;
  const tuition = normalizeConcessionFeeTier(row.tuition);
  const vehicle = normalizeConcessionFeeTier(row.vehicle);
  const otherFees = Array.isArray(row.otherFees)
    ? row.otherFees
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const fee = item as Partial<StudentConcessionOtherFee>;
          const id = typeof fee.id === "string" && fee.id.trim() ? fee.id.trim() : "";
          const label = typeof fee.label === "string" ? fee.label.trim() : "";
          if (!id || !label) return null;
          const billingCycle = fee.billingCycle === "Term" ? "Term" : "Monthly";
          const feeAmountMode = fee.feeAmountMode === "custom" ? "custom" : "fixed";
          const feeSchedule = Array.isArray(fee.feeSchedule)
            ? fee.feeSchedule
                .map((line, index) => normalizeClassFeeLine(line, index))
                .filter((line): line is ClassFeeLine => line !== null)
            : [];
          const feeCollectionStartMonth = optionalTrimmedString(fee.feeCollectionStartMonth);
          const normalized: StudentConcessionOtherFee = {
            id,
            label,
            billingCycle,
            feeAmountMode,
            feeSchedule,
            ...(feeCollectionStartMonth ? { feeCollectionStartMonth } : {}),
          };
          return normalized;
        })
        .filter((fee): fee is StudentConcessionOtherFee => fee !== null)
    : undefined;
  if (!tuition && !vehicle && (!otherFees || otherFees.length === 0)) return undefined;
  return {
    ...(tuition ? { tuition } : {}),
    ...(vehicle ? { vehicle } : {}),
    ...(otherFees?.length ? { otherFees } : {}),
  };
}

export function normalizeStudent(
  raw: Partial<Student> & Pick<Student, "id" | "name" | "cls" | "guardian" | "due">,
): Student {
  const guardianRelation = GUARDIAN_RELATIONS.includes(raw.guardianRelation as GuardianRelation)
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
    dob: toDobIso(optionalTrimmedString(raw.dob)),
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
    hasConcession: raw.hasConcession === true,
    concessionReason: optionalTrimmedString(raw.concessionReason),
    concessionFees: normalizeStudentConcessionFees(raw.concessionFees),
    deletedAt:
      typeof raw.deletedAt === "string" && raw.deletedAt.trim() ? raw.deletedAt.trim() : undefined,
  };
}

export function normalizeStaff(raw: Partial<Staff> & Pick<Staff, "id" | "name">): Staff {
  const joinedAt = typeof raw.joinedAt === "string" && raw.joinedAt ? raw.joinedAt : "2025-01-01";
  const attendanceByMonth = Array.isArray(raw.attendanceByMonth)
    ? raw.attendanceByMonth
        .map((row) => normalizeStaffAttendanceMonth(row))
        .filter((row): row is StaffAttendanceMonth => row !== null)
        .sort((a, b) => b.month.localeCompare(a.month))
    : undefined;
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? "").trim() || "Staff",
    role: typeof raw.role === "string" && raw.role.trim() ? raw.role.trim() : "Staff",
    dept: typeof raw.dept === "string" && raw.dept.trim() ? raw.dept.trim() : "General",
    active: typeof raw.active === "boolean" ? raw.active : true,
    joinedAt,
    phone: typeof raw.phone === "string" ? raw.phone : undefined,
    altPhone:
      typeof raw.altPhone === "string" && raw.altPhone.trim() ? raw.altPhone.trim() : undefined,
    guardianPhone:
      typeof raw.guardianPhone === "string" && raw.guardianPhone.trim()
        ? raw.guardianPhone.trim()
        : undefined,
    photoUrl: typeof raw.photoUrl === "string" && raw.photoUrl ? raw.photoUrl : undefined,
    basicSalary:
      typeof raw.basicSalary === "number" && Number.isFinite(raw.basicSalary)
        ? raw.basicSalary
        : 8000,
    additionalAllowances:
      typeof raw.additionalAllowances === "number" && Number.isFinite(raw.additionalAllowances)
        ? raw.additionalAllowances
        : 0,
    ...(attendanceByMonth && attendanceByMonth.length ? { attendanceByMonth } : {}),
    documents: normalizeStaffDocuments(raw.documents),
    salaryHistory: normalizeSalaryHistory(raw.salaryHistory),
    statusHistory: normalizeStatusHistory(raw.statusHistory, joinedAt, String(raw.id ?? "")),
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
  /** Itemized fee lines when a receipt covers multiple periods or categories */
  feeLines?: PaymentFeeLine[];
};

export type PaymentFeeLine = {
  description: string;
  amount: number;
  feePeriodKind?: FeePeriodKind;
  feePeriod: string;
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

/** Default "Fee collection starts from" for new class / category / route schedules */
export const DEFAULT_FEE_COLLECTION_START_MONTH: (typeof FEE_MONTHS)[number] = "June";

export type FeePeriodKind = "month" | "term";
export type FeeTermKind = "tuition" | "vehicle";
/** Whether this period is a multi-month term or a single calendar month */
export type FeePeriodMode = "term" | "month";

/** Per-student exemption from billing selected fee periods */
export type StudentFeeBreakAppliesTo = "tuition" | "vehicle" | "both";

export type StudentFeeBreak = {
  id: string;
  studentId: string;
  academicYear: string;
  appliesTo: StudentFeeBreakAppliesTo;
  /** Schedule period labels · e.g. "May", "Term 2" */
  periods: string[];
  reason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

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
  /** Optional school-wide override · unused when the class has its own fee schedule */
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
 * Even split used only to migrate classes that predate per-class fee schedules.
 * Remainder rupees go to the earliest periods so the parts always sum to `total`.
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
      (t) => resolveFeePeriodMode(t.periodMode) === periodMode && (kind ? t.kind === kind : true),
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

export function feeMonthIndex(month: string): number {
  const needle = month.trim().toLowerCase();
  const idx = FEE_MONTHS.findIndex((m) => m.toLowerCase() === needle);
  return idx >= 0 ? idx : 0;
}

/** Calendar months for N installments beginning at startMonth (wraps within AY order). */
export function feeMonthsFromStart(startMonth: string, count: number): string[] {
  const start = feeMonthIndex(startMonth);
  const n = Math.max(0, Math.floor(count));
  return Array.from({ length: n }, (_, i) => FEE_MONTHS[(start + i) % FEE_MONTHS.length]);
}

/** Zero-based installment index for a fee month relative to collection start. */
export function installmentIndexForFeeMonth(startMonth: string, feeMonth: string): number {
  const start = feeMonthIndex(startMonth);
  const target = feeMonthIndex(feeMonth);
  let diff = target - start;
  if (diff < 0) diff += FEE_MONTHS.length;
  return diff;
}

export function defaultFeeCollectionStartMonth(_feeTerms?: FeeTerm[]): string {
  return DEFAULT_FEE_COLLECTION_START_MONTH;
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

/** Unique fee periods on a receipt, in order. */
export function paymentFeePeriods(payment: Payment): string[] {
  const fromLines = (payment.feeLines ?? [])
    .map((line) => line.feePeriod?.trim())
    .filter((p): p is string => Boolean(p));
  if (fromLines.length) {
    const seen = new Set<string>();
    return fromLines.filter((p) => {
      const key = p.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  const parsed = parsePaymentFeeLinesFromNarration(payment.narration);
  if (parsed.length) {
    const seen = new Set<string>();
    return parsed
      .map((line) => line.feePeriod?.trim())
      .filter((p): p is string => Boolean(p))
      .filter((p) => {
        const key = p.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }
  const single = resolvePaymentFeePeriod(payment);
  return single ? [single] : [];
}

/** Compact label for history tables — one period or joined list. */
export function formatPaymentPeriodsLabel(payment: Payment): string {
  const periods = paymentFeePeriods(payment);
  if (periods.length === 0) return "—";
  if (periods.length === 1) return periods[0];
  if (periods.length <= 4) return periods.join(" · ");
  return `${periods.slice(0, 3).join(" · ")} +${periods.length - 3}`;
}

/** Infer month vs term from a period label and optional fee category. */
export function inferFeePeriodKind(periodLabel: string, categoryLabel?: string): FeePeriodKind {
  const period = periodLabel.trim();
  if (!period) return "month";
  if (/^term\s*\d+/i.test(period)) return "term";
  if (FEE_MONTHS.some((m) => m.toLowerCase() === period.toLowerCase())) return "month";
  const catKind = categoryLabel ? categoryFeeTermKind(categoryLabel) : null;
  if (catKind === "tuition" && /term/i.test(period)) return "term";
  return "month";
}

/** Parse itemized lines from receipt narration (backward compatible). */
export function parsePaymentFeeLinesFromNarration(narration?: string): PaymentFeeLine[] {
  const parts = (narration ?? "")
    .split(/\s*[·|]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  const lines: PaymentFeeLine[] = [];
  let inBreakdown = false;

  for (const part of parts) {
    if (/^Fee breakdown:/i.test(part)) {
      inBreakdown = true;
    }
    const cleaned = part.replace(/^Fee breakdown:\s*/i, "").trim();
    const withPeriod = cleaned.match(
      /^(.*?)\s+\(([^)]+)\)\s+(?:₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)\s*$/i,
    );
    if (withPeriod) {
      const amount = Number(withPeriod[3].replace(/,/g, ""));
      if (Number.isFinite(amount) && amount >= 0) {
        const description = withPeriod[1].trim();
        const feePeriod = withPeriod[2].trim();
        lines.push({
          description,
          feePeriod,
          feePeriodKind: inferFeePeriodKind(feePeriod, description),
          amount: Math.round(amount),
        });
      }
      continue;
    }
    const plain = cleaned.match(/^(.*?)\s+(?:₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)\s*$/i);
    if ((inBreakdown || /^Fee breakdown:/i.test(part)) && plain) {
      const amount = Number(plain[2].replace(/,/g, ""));
      if (Number.isFinite(amount) && amount >= 0) {
        const description = plain[1].trim();
        lines.push({
          description,
          feePeriod: "",
          feePeriodKind: inferFeePeriodKind("", description),
          amount: Math.round(amount),
        });
      }
    }
  }

  return lines;
}

export function resolvePaymentFeeLines(payment: Payment): PaymentFeeLine[] {
  if (payment.feeLines?.length) {
    return payment.feeLines.map((line) => ({
      description: line.description,
      amount: Math.max(0, Math.round(line.amount) || 0),
      feePeriodKind:
        line.feePeriodKind ?? inferFeePeriodKind(line.feePeriod?.trim() ?? "", line.description),
      feePeriod: line.feePeriod?.trim() ?? "",
    }));
  }
  const fromNarration = parsePaymentFeeLinesFromNarration(payment.narration);
  if (fromNarration.length) return fromNarration;
  const period = resolvePaymentFeePeriod(payment);
  if (!period) return [];
  return [
    {
      description: payment.cat,
      amount: payment.amount,
      feePeriodKind: inferFeePeriodKind(period, payment.cat),
      feePeriod: period,
    },
  ];
}

export function resolvePaymentFeePeriodKind(payment: Payment): FeePeriodKind {
  if (payment.feePeriodKind === "term" || payment.feePeriodKind === "month") {
    return payment.feePeriodKind;
  }
  return "month";
}

function feePeriodsMatchForBalance(
  aKind: FeePeriodKind | undefined,
  aPeriod: string,
  bKind: FeePeriodKind,
  bPeriod: string,
): boolean {
  const periodA = aPeriod.trim().toLowerCase();
  const periodB = bPeriod.trim().toLowerCase();
  if (!periodA || !periodB || periodA !== periodB) return false;
  // Period label is authoritative · legacy narration rows often default kind to "month"
  if (aKind && bKind && aKind !== bKind) {
    const termLike = /^term\s*\d+/i.test(periodA);
    const monthLike = FEE_MONTHS.some((m) => m.toLowerCase() === periodA);
    if (termLike || monthLike) return true;
    return false;
  }
  return true;
}

/** Whether two fee-line descriptions refer to the same charge category. */
export function feeCategoriesMatchForBalance(a: string, b: string): boolean {
  const left = a.trim();
  const right = b.trim();
  if (!left || !right) return false;
  if (left.toLowerCase() === "other" || right.toLowerCase() === "other") {
    return left.toLowerCase() === right.toLowerCase();
  }
  return (
    normalizePaymentCategoryLabel(left).trim().toLowerCase() ===
    normalizePaymentCategoryLabel(right).trim().toLowerCase()
  );
}

/** Sum already collected for one student · category · period in the active academic year. */
export function studentFeePeriodPaidAmount(
  payments: Payment[],
  opts: {
    studentName: string;
    className?: string;
    academicYear: string;
    description: string;
    feePeriodKind: FeePeriodKind;
    feePeriod: string;
    excludePaymentId?: string;
    /** Unsaved lines on the current receipt · avoids double-counting the same period */
    pendingLines?: Array<{
      description: string;
      feePeriodKind: FeePeriodKind;
      feePeriod: string;
      amount: number;
    }>;
  },
): number {
  const studentKey = opts.studentName.trim().toLowerCase();
  const year = opts.academicYear.trim();
  const description = opts.description.trim();
  const period = opts.feePeriod.trim();
  if (!studentKey || !description || !period) return 0;

  let total = 0;
  for (const payment of payments) {
    if (opts.excludePaymentId && payment.id === opts.excludePaymentId) continue;
    if (payment.payerType === "external") continue;
    if (payment.name.trim().toLowerCase() !== studentKey) continue;
    if (payment.academicYear?.trim() && year && payment.academicYear.trim() !== year) continue;
    if (
      opts.className?.trim() &&
      payment.className?.trim() &&
      payment.className.trim() !== opts.className.trim()
    ) {
      continue;
    }

    for (const line of resolvePaymentFeeLines(payment)) {
      if (!feeCategoriesMatchForBalance(line.description, description)) continue;
      if (
        !feePeriodsMatchForBalance(line.feePeriodKind, line.feePeriod, opts.feePeriodKind, period)
      ) {
        continue;
      }
      total += Math.max(0, Math.round(line.amount) || 0);
    }
  }

  if (opts.pendingLines?.length) {
    for (const line of opts.pendingLines) {
      if (!feeCategoriesMatchForBalance(line.description, description)) continue;
      if (
        !feePeriodsMatchForBalance(line.feePeriodKind, line.feePeriod, opts.feePeriodKind, period)
      ) {
        continue;
      }
      total += Math.max(0, Math.round(line.amount) || 0);
    }
  }

  return total;
}

/** Map a fee category label to the term group it uses (if any). */
export function normalizePaymentCategoryLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return trimmed;
  const key = trimmed.toLowerCase().replace(/\s+/g, " ");
  const aliases: Record<string, string> = {
    "tution fee": "Tuition Fee",
    "tution fees": "Tuition Fee",
    tution: "Tuition Fee",
    tuition: "Tuition Fee",
    "tuition fees": "Tuition Fee",
    transport: "Vehicle Fee",
    vehicle: "Vehicle Fee",
    "bus fee": "Vehicle Fee",
  };
  if (aliases[key]) return aliases[key];
  if (/\btution\b/i.test(trimmed) && !/\btuition\b/i.test(trimmed)) {
    return trimmed.replace(/\btution\b/gi, "Tuition");
  }
  return trimmed;
}

export function normalizePaymentCategory(
  raw: Partial<PaymentCategory> & Pick<PaymentCategory, "id">,
): PaymentCategory {
  const label = normalizePaymentCategoryLabel(typeof raw.label === "string" ? raw.label : "");
  const billing =
    raw.billingCycle === "Term" || raw.billingCycle === "Monthly" ? raw.billingCycle : undefined;
  const feeSchedule = Array.isArray(raw.feeSchedule) ? parseClassFeeSchedule(raw.feeSchedule) : [];
  const lower = label.toLowerCase();
  const inferredSystem =
    raw.isSystem === true ||
    lower.includes("tuition") ||
    lower.includes("tution") ||
    lower.includes("vehicle") ||
    lower.includes("transport");
  return {
    id: raw.id.trim(),
    label,
    slug:
      typeof raw.slug === "string" && raw.slug.trim()
        ? raw.slug.trim().toLowerCase()
        : inferredSystem
          ? lower.includes("vehicle") || lower.includes("transport")
            ? "vehicle"
            : lower.includes("tuition") || lower.includes("tution")
              ? "tuition"
              : null
          : null,
    isSystem: inferredSystem,
    hasSchedule: raw.hasSchedule === true || feeSchedule.length > 0,
    billingCycle: billing,
    feeAmountMode: raw.feeAmountMode === "custom" ? "custom" : "fixed",
    feeSchedule,
    feeCollectionStartMonth:
      typeof raw.feeCollectionStartMonth === "string" && raw.feeCollectionStartMonth.trim()
        ? raw.feeCollectionStartMonth.trim()
        : undefined,
    active: raw.active !== false,
  };
}

function normalizePaymentCategories(raw: unknown): PaymentCategory[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c): c is Partial<PaymentCategory> & Pick<PaymentCategory, "id"> =>
      Boolean(c && typeof c === "object" && typeof (c as PaymentCategory).id === "string"),
    )
    .map((c) => normalizePaymentCategory(c))
    .filter((c) => c.id && c.label);
}

export function categoryFeeTermKind(categoryLabel: string): FeeTermKind | null {
  const lower = normalizePaymentCategoryLabel(categoryLabel).toLowerCase();
  if (lower.includes("tuition") || lower.includes("tution")) return "tuition";
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

export function normalizeStudentFeeBreak(
  raw: Partial<StudentFeeBreak> & Pick<StudentFeeBreak, "id" | "studentId">,
): StudentFeeBreak | null {
  const id = raw.id?.trim();
  const studentId = raw.studentId?.trim();
  if (!id || !studentId) return null;
  const appliesRaw = String(raw.appliesTo ?? "both").toLowerCase();
  const appliesTo: StudentFeeBreakAppliesTo =
    appliesRaw === "tuition" || appliesRaw === "vehicle" ? appliesRaw : "both";
  const periods = Array.isArray(raw.periods)
    ? raw.periods
        .map((p) => String(p ?? "").trim())
        .filter(Boolean)
        .filter((p, i, arr) => arr.findIndex((x) => x.toLowerCase() === p.toLowerCase()) === i)
    : [];
  if (periods.length === 0) return null;
  const academicYear =
    typeof raw.academicYear === "string" && raw.academicYear.trim() ? raw.academicYear.trim() : "";
  return {
    id,
    studentId,
    academicYear,
    appliesTo,
    periods,
    reason: raw.reason?.trim() || null,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

export type Department = {
  id: string;
  name: string;
  code: string;
};

/** Branch-scoped staff leave catalog entry (Casual / Sick / Personal / custom). */
export type LeaveType = {
  id: string;
  name: string;
  code: string;
  isPaid: boolean;
  annualAllowanceDays: number | null;
  active: boolean;
  sortOrder: number;
};

export const DEFAULT_LEAVE_TYPE_STARTERS: Omit<LeaveType, "id">[] = [
  {
    name: "Casual Leave",
    code: "CL",
    isPaid: true,
    annualAllowanceDays: 12,
    active: true,
    sortOrder: 0,
  },
  {
    name: "Sick Leave",
    code: "SL",
    isPaid: true,
    annualAllowanceDays: 12,
    active: true,
    sortOrder: 1,
  },
  {
    name: "Personal Leave",
    code: "PL",
    isPaid: false,
    annualAllowanceDays: 6,
    active: true,
    sortOrder: 2,
  },
];

export function normalizeLeaveType(raw: unknown): LeaveType | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || !r.id.trim() || typeof r.name !== "string" || !r.name.trim()) {
    return null;
  }
  const code = typeof r.code === "string" && r.code.trim() ? r.code.trim().toUpperCase() : "LV";
  const annual =
    typeof r.annualAllowanceDays === "number" && Number.isFinite(r.annualAllowanceDays)
      ? Math.max(0, Math.round(r.annualAllowanceDays))
      : null;
  return {
    id: r.id.trim(),
    name: r.name.trim(),
    code,
    isPaid: r.isPaid !== false,
    annualAllowanceDays: annual,
    active: r.active !== false,
    sortOrder:
      typeof r.sortOrder === "number" && Number.isFinite(r.sortOrder) ? Math.round(r.sortOrder) : 0,
  };
}

/** Physical campus under a tenant (Malappuram, Kozhikode, …). */
export type CampusBranch = {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  lat: number | null;
  lng: number | null;
  isActive: boolean;
  isMain?: boolean;
};

/** First campus / code MAIN — tenants cannot delete this branch. */
export function isMainCampusBranch(
  branch: Pick<CampusBranch, "code" | "isMain">,
  all: CampusBranch[] = [],
): boolean {
  if (branch.isMain) return true;
  if (branch.code.trim().toUpperCase() === "MAIN") return true;
  return all.length <= 1;
}

function branchListFingerprint(list: CampusBranch[]): string {
  return list
    .map((b) => `${b.id}\0${b.name}\0${b.code}\0${b.isActive === false ? 0 : 1}`)
    .join("\n");
}

export function normalizeCampusBranch(raw: unknown): CampusBranch | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || !r.id.trim() || typeof r.name !== "string" || !r.name.trim()) {
    return null;
  }
  const num = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  const code = typeof r.code === "string" && r.code.trim() ? r.code.trim().toUpperCase() : "MAIN";
  return {
    id: r.id.trim(),
    name: r.name.trim(),
    code,
    address: typeof r.address === "string" ? r.address : "",
    phone: typeof r.phone === "string" ? r.phone : "",
    email: typeof r.email === "string" ? r.email : "",
    lat: num(r.lat),
    lng: num(r.lng),
    isActive: r.isActive !== false,
    isMain: r.isMain === true || code === "MAIN",
  };
}

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

export function normalizeTenantUser(
  raw: Partial<TenantUser> & Pick<TenantUser, "id" | "email">,
): TenantUser {
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
      typeof raw.createdAt === "string" && raw.createdAt ? raw.createdAt : new Date().toISOString(),
  };
}

export const SEED_TENANT_USERS: TenantUser[] = [];

export type ClassBillingCycle = "Monthly" | "Term" | "Annually";

export const CLASS_BILLING_CYCLES: ClassBillingCycle[] = ["Monthly", "Term", "Annually"];

/** Cycles offered when creating a class (Annually is migrated to a single installment). */
export const CLASS_SCHEDULE_CYCLES: Array<Extract<ClassBillingCycle, "Monthly" | "Term">> = [
  "Monthly",
  "Term",
];

export const CLASS_BILLING_CYCLE_HINTS: Record<ClassBillingCycle, string> = {
  Monthly: "Monthly installments — same amount each month, or different.",
  Term: "Term installments — same amount each term, or different.",
  Annually: "One charge for the academic year",
};

export type ClassFeeLineKind = "installment" | "one_time";
export type ClassFeeAmountMode = "fixed" | "custom";

export type ClassFeeLine = {
  id: string;
  kind: ClassFeeLineKind;
  label: string;
  amount: number;
  dueDate?: string;
};

export const CLASS_ONE_TIME_FEE_SUGGESTIONS = [
  "Admission Fee",
  "Registration Fee",
  "Exam Fee",
] as const;

export type ClassConfig = {
  id: string;
  /** Combined display / student match key · e.g. "Grade 8 - B" */
  className: string;
  /** Class level · e.g. "LKG", "Grade 8" */
  grade: string;
  /** Section / division · e.g. "A", "B" */
  section: string;
  /** Sum of feeSchedule lines (kept for older API columns) */
  tuitionFeeAmount: number;
  /** Transport / vehicle fee · 0 when not applicable */
  vehicleFeeAmount: number;
  /** How installments are labeled and billed */
  billingCycle: ClassBillingCycle;
  feeAmountMode: ClassFeeAmountMode;
  feeSchedule: ClassFeeLine[];
  /** First calendar month mapped to installment 1 · Monthly billing */
  feeCollectionStartMonth?: string;
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

export function normalizeClassBillingCycle(value: unknown): ClassBillingCycle {
  if (value === "Annually" || value === "Term" || value === "Monthly") return value;
  return "Monthly";
}

export function normalizeClassFeeAmountMode(value: unknown): ClassFeeAmountMode {
  return value === "custom" ? "custom" : "fixed";
}

export function classFeeLineOrdinal(index: number): string {
  const n = index + 1;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function installmentLabel(index: number, cycle: ClassBillingCycle): string {
  if (cycle === "Term") return `Term ${index + 1}`;
  if (cycle === "Annually") return "Annual Fee";
  return `${classFeeLineOrdinal(index)} Installment`;
}

export function sumFeeSchedule(lines: ClassFeeLine[]): number {
  return lines.reduce((sum, line) => sum + Math.max(0, Math.round(line.amount) || 0), 0);
}

export function normalizeClassFeeLine(raw: unknown, index: number): ClassFeeLine | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const label = typeof row.label === "string" ? row.label.trim() : "";
  const amountRaw = row.amount;
  const amount =
    typeof amountRaw === "number" && Number.isFinite(amountRaw)
      ? Math.max(0, Math.round(amountRaw))
      : typeof amountRaw === "string"
        ? Math.max(0, Math.round(Number(amountRaw.replace(/[^0-9.-]/g, ""))) || 0)
        : 0;
  if (!label && amount <= 0) return null;
  const dueDate =
    typeof row.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.dueDate.trim())
      ? row.dueDate.trim()
      : undefined;
  const kind: ClassFeeLineKind = row.kind === "one_time" ? "one_time" : "installment";
  return {
    id: typeof row.id === "string" && row.id.trim() ? row.id.trim() : `fl-${index + 1}`,
    kind,
    label: label || installmentLabel(index, "Monthly"),
    amount,
    ...(dueDate ? { dueDate } : {}),
  };
}

export function parseClassFeeSchedule(raw: unknown): ClassFeeLine[] {
  let value: unknown = raw;
  if (typeof value === "string" && value.trim()) {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((row, index) => normalizeClassFeeLine(row, index))
    .filter((row): row is ClassFeeLine => row !== null);
}

export function buildFixedInstallments(
  count: number,
  amountEach: number,
  cycle: ClassBillingCycle,
): ClassFeeLine[] {
  const n = Math.max(0, Math.floor(count));
  const amount = Math.max(0, Math.round(amountEach) || 0);
  return Array.from({ length: n }, (_, index) => ({
    id: `fl-i-${index + 1}`,
    kind: "installment" as const,
    label: installmentLabel(index, cycle),
    amount,
  }));
}

export function migrateClassFeeSchedule(
  cls: Pick<ClassConfig, "tuitionFeeAmount" | "vehicleFeeAmount" | "billingCycle">,
  feeTerms: FeeTerm[],
): ClassFeeLine[] {
  const lines: ClassFeeLine[] = [];
  const total = Math.max(0, Math.round(cls.tuitionFeeAmount) || 0);
  if (total > 0) {
    if (cls.billingCycle === "Annually") {
      lines.push({
        id: "fl-i-1",
        kind: "installment",
        label: "Annual Fee",
        amount: total,
      });
    } else {
      const mode: FeePeriodMode = cls.billingCycle === "Monthly" ? "month" : "term";
      const periods = filterFeePeriods(feeTerms, mode, "tuition");
      const parts = periods.length > 0 ? splitAmountAcrossTerms(total, periods.length) : [total];
      const labels =
        periods.length > 0
          ? periods.map((p) => p.label)
          : parts.map((_, i) => installmentLabel(i, cls.billingCycle));
      parts.forEach((amount, index) => {
        lines.push({
          id: `fl-i-${index + 1}`,
          kind: "installment",
          label: labels[index] ?? installmentLabel(index, cls.billingCycle),
          amount,
          ...(periods[index]?.startDate ? { dueDate: periods[index].startDate } : {}),
        });
      });
    }
  }
  if (cls.vehicleFeeAmount > 0) {
    lines.push({
      id: "fl-ot-vehicle",
      kind: "one_time",
      label: "Vehicle Fee",
      amount: Math.round(cls.vehicleFeeAmount),
    });
  }
  return lines;
}

export function withClassFeeSchedule(cls: ClassConfig, feeTerms: FeeTerm[] = []): ClassConfig {
  if (cls.feeSchedule.length > 0) {
    const tuitionFeeAmount = sumFeeSchedule(cls.feeSchedule) || cls.tuitionFeeAmount;
    return tuitionFeeAmount === cls.tuitionFeeAmount ? cls : { ...cls, tuitionFeeAmount };
  }
  if (cls.tuitionFeeAmount <= 0 && cls.vehicleFeeAmount <= 0) return cls;
  const feeSchedule = migrateClassFeeSchedule(cls, feeTerms);
  const uniqueInstallments = [
    ...new Set(feeSchedule.filter((l) => l.kind === "installment").map((l) => l.amount)),
  ];
  return {
    ...cls,
    feeSchedule,
    feeAmountMode: uniqueInstallments.length > 1 ? "custom" : "fixed",
    tuitionFeeAmount: sumFeeSchedule(feeSchedule) || cls.tuitionFeeAmount,
  };
}

export function classFeePrefillAmount(
  cls: ClassConfig,
  opts: {
    category: string;
    periodLabel?: string;
    periodIndex?: number;
    collectionStartMonth?: string;
  },
): number | undefined {
  const lines = cls.feeSchedule.filter((line) => line.amount > 0);
  const cat = opts.category.toLowerCase();
  if (cat.includes("vehicle") || cat.includes("transport") || cat.includes("bus")) {
    const vehicle = lines.find(
      (line) => line.kind === "one_time" && /vehicle|transport|bus/i.test(line.label),
    );
    if (vehicle) return vehicle.amount;
    return cls.vehicleFeeAmount > 0 ? cls.vehicleFeeAmount : undefined;
  }
  const oneTime = lines.find((line) => {
    if (line.kind !== "one_time") return false;
    const label = line.label.toLowerCase();
    return (
      (cat.includes("admission") && label.includes("admission")) ||
      (cat.includes("registration") && label.includes("registration")) ||
      (cat.includes("exam") && label.includes("exam"))
    );
  });
  if (oneTime) return oneTime.amount;

  const installments = lines.filter((line) => line.kind === "installment");
  if (opts.periodLabel && opts.collectionStartMonth && cls.billingCycle === "Monthly") {
    const monthIndex = installmentIndexForFeeMonth(opts.collectionStartMonth, opts.periodLabel);
    if (monthIndex >= 0 && installments[monthIndex]) {
      return installments[monthIndex].amount;
    }
  }
  if (opts.periodLabel) {
    const needle = opts.periodLabel.trim().toLowerCase();
    const exact = installments.find((line) => line.label.trim().toLowerCase() === needle);
    if (exact) return exact.amount;
  }
  if (opts.periodIndex != null && opts.periodIndex >= 0 && installments[opts.periodIndex]) {
    return installments[opts.periodIndex].amount;
  }
  if (installments[0]) return installments[0].amount;
  return cls.tuitionFeeAmount > 0 ? cls.tuitionFeeAmount : undefined;
}

export function scheduleSummary(cls: ClassConfig): string {
  const installments = cls.feeSchedule.filter((l) => l.kind === "installment" && l.amount > 0);
  const oneTime = cls.feeSchedule.filter((l) => l.kind === "one_time" && l.amount > 0);
  const bits: string[] = [];
  if (installments.length) {
    bits.push(
      cls.billingCycle === "Term"
        ? `${installments.length} term${installments.length === 1 ? "" : "s"}`
        : `${installments.length} installment${installments.length === 1 ? "" : "s"}`,
    );
  }
  if (oneTime.length) {
    bits.push(`${oneTime.length} one-time`);
  }
  return bits.join(" · ") || cls.billingCycle;
}

export function normalizeClassConfig(
  raw: Partial<ClassConfig> &
    Pick<ClassConfig, "id" | "tuitionFeeAmount"> & {
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
  const feeSchedule = parseClassFeeSchedule(
    (raw as Partial<ClassConfig> & { fee_schedule?: unknown }).feeSchedule ??
      (raw as { fee_schedule?: unknown }).fee_schedule,
  );
  const tuitionFromSchedule = sumFeeSchedule(feeSchedule);
  const tuitionFeeAmount =
    tuitionFromSchedule > 0
      ? tuitionFromSchedule
      : typeof raw.tuitionFeeAmount === "number" && Number.isFinite(raw.tuitionFeeAmount)
        ? Math.max(0, Math.round(raw.tuitionFeeAmount))
        : 0;
  const vehicleFeeAmount =
    typeof raw.vehicleFeeAmount === "number" && Number.isFinite(raw.vehicleFeeAmount)
      ? Math.max(0, Math.round(raw.vehicleFeeAmount))
      : 0;
  const feeCollectionStartMonthFromSnake = (raw as { fee_collection_start_month?: unknown })
    .fee_collection_start_month;
  return {
    id: raw.id,
    className,
    grade: grade || splitClassName(className).grade,
    section: section || splitClassName(className).section,
    tuitionFeeAmount,
    vehicleFeeAmount,
    billingCycle: normalizeClassBillingCycle(raw.billingCycle),
    feeAmountMode: normalizeClassFeeAmountMode(
      (raw as Partial<ClassConfig>).feeAmountMode ??
        (raw as { fee_amount_mode?: unknown }).fee_amount_mode,
    ),
    feeSchedule,
    feeCollectionStartMonth:
      typeof raw.feeCollectionStartMonth === "string" && raw.feeCollectionStartMonth.trim()
        ? raw.feeCollectionStartMonth.trim()
        : typeof feeCollectionStartMonthFromSnake === "string" &&
            feeCollectionStartMonthFromSnake.trim()
          ? feeCollectionStartMonthFromSnake.trim()
          : undefined,
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
  /** Per-installment amount for morning-only shift (fixed mode) */
  morningFee: number;
  /** Per-installment amount for evening-only shift (fixed mode) */
  eveningFee: number;
  /** Per-installment amount for both shifts (fixed mode) */
  bothFee: number;
  billingCycle: ClassBillingCycle;
  feeAmountMode: ClassFeeAmountMode;
  morningFeeSchedule: ClassFeeLine[];
  eveningFeeSchedule: ClassFeeLine[];
  bothFeeSchedule: ClassFeeLine[];
  /** First calendar month mapped to installment 1 · Monthly billing */
  feeCollectionStartMonth?: string;
};

export type PaymentCategory = {
  id: string;
  label: string;
  slug?: string | null;
  isSystem?: boolean;
  hasSchedule?: boolean;
  billingCycle?: Extract<ClassBillingCycle, "Monthly" | "Term">;
  feeAmountMode?: ClassFeeAmountMode;
  feeSchedule?: ClassFeeLine[];
  feeCollectionStartMonth?: string;
  active?: boolean;
};

export type ThemeSettings = {
  mode: "Light" | "Dark";
  /** Legacy field — workspace accent is fixed to brand teal */
  accent: "Neon Lime" | "Pale Lime" | "Ink";
  density: "Comfortable" | "Compact";
  navPlacement: "Left" | "Right" | "Top" | "Bottom";
  /** Hex brand colors used on the workspace, invoices, and bills. */
  primaryColor: string;
  secondaryColor: string;
  fontFamily: FontFamilyOption;
  fontColor: string;
  fontSize: FontSizeOption;
  iconColor: string;
  menuColor: string;
  fileNames: Record<DownloadKind, string>;
};

export type SchoolDetails = {
  name: string;
  logoUrl?: string;
  letterheadUrl?: string;
  sealUrl?: string;
  signatureUrl?: string;
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

/** Active workspace cache key — set by TenantStoreProvider so snapshots don't bleed across schools. */
let activeStoreKey = STORAGE_KEY;

function storeKeyForTenant(tenantId?: string | null): string {
  const id = typeof tenantId === "string" ? tenantId.trim() : "";
  return id ? `${STORAGE_KEY}/${id}` : STORAGE_KEY;
}

export const EMPTY_SCHOOL_DETAILS: SchoolDetails = {
  name: "",
  tagline: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  registrationNo: "",
  affiliationNo: "",
  principalName: "",
  establishedYear: "",
};

/** Fired when navigation dock placement changes so the toast host can reposition. */
export const NAV_PLACEMENT_CHANGE_EVENT = "school-accounts:nav-placement";

export function notifyNavPlacementChange(placement: ThemeSettings["navPlacement"]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NAV_PLACEMENT_CHANGE_EVENT, { detail: placement }));
}

function normalizeTransportRoute(raw: unknown): TransportRoute | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.mapFrom !== "string" || typeof r.mapTo !== "string") {
    return null;
  }
  const legacyFee = typeof r.fee === "number" ? r.fee : undefined;
  const morningFee =
    typeof r.morningFee === "number" ? r.morningFee : legacyFee ? Math.round(legacyFee * 0.55) : 0;
  const eveningFee =
    typeof r.eveningFee === "number" ? r.eveningFee : legacyFee ? Math.round(legacyFee * 0.55) : 0;
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
    billingCycle: normalizeClassBillingCycle(r.billingCycle),
    feeAmountMode: normalizeClassFeeAmountMode(r.feeAmountMode),
    morningFeeSchedule: parseClassFeeSchedule(r.morningFeeSchedule),
    eveningFeeSchedule: parseClassFeeSchedule(r.eveningFeeSchedule),
    bothFeeSchedule: parseClassFeeSchedule(r.bothFeeSchedule),
    ...(typeof r.feeCollectionStartMonth === "string" && r.feeCollectionStartMonth.trim()
      ? { feeCollectionStartMonth: r.feeCollectionStartMonth.trim() }
      : {}),
  };
}

export function migrateRouteFeeSchedule(
  route: Pick<TransportRoute, "billingCycle" | "morningFee" | "eveningFee" | "bothFee">,
  feeTerms: FeeTerm[],
  amount: number,
): ClassFeeLine[] {
  const total = Math.max(0, Math.round(amount) || 0);
  if (total <= 0) return [];
  const cycle = route.billingCycle === "Term" ? "Term" : "Monthly";
  const mode: FeePeriodMode = cycle === "Monthly" ? "month" : "term";
  const periods = filterFeePeriods(feeTerms, mode, "vehicle");
  const count = periods.length > 0 ? periods.length : cycle === "Term" ? 4 : 12;
  const lines = buildFixedInstallments(count, total, cycle);
  if (periods.length > 0) {
    return lines.map((line, index) => ({
      ...line,
      label: periods[index]?.label ?? line.label,
      ...(periods[index]?.startDate ? { dueDate: periods[index]!.startDate } : {}),
    }));
  }
  return lines;
}

export function withRouteFeeSchedule(
  route: TransportRoute,
  feeTerms: FeeTerm[] = [],
): TransportRoute {
  const billingCycle = normalizeClassBillingCycle(route.billingCycle);
  const feeAmountMode = normalizeClassFeeAmountMode(route.feeAmountMode);
  let bothFeeSchedule = (route.bothFeeSchedule ?? []).filter((line) => line.amount > 0);
  let morningFeeSchedule = (route.morningFeeSchedule ?? []).filter((line) => line.amount > 0);
  let eveningFeeSchedule = (route.eveningFeeSchedule ?? []).filter((line) => line.amount > 0);

  if (bothFeeSchedule.length === 0 && route.bothFee > 0) {
    bothFeeSchedule = migrateRouteFeeSchedule({ ...route, billingCycle }, feeTerms, route.bothFee);
  }
  if (morningFeeSchedule.length === 0 && route.morningFee > 0) {
    morningFeeSchedule =
      bothFeeSchedule.length > 0
        ? bothFeeSchedule.map((line, index) => ({
            ...line,
            id: `fl-m-${index + 1}`,
            amount: route.morningFee,
          }))
        : migrateRouteFeeSchedule({ ...route, billingCycle }, feeTerms, route.morningFee);
  }
  if (eveningFeeSchedule.length === 0 && route.eveningFee > 0) {
    eveningFeeSchedule =
      bothFeeSchedule.length > 0
        ? bothFeeSchedule.map((line, index) => ({
            ...line,
            id: `fl-e-${index + 1}`,
            amount: route.eveningFee,
          }))
        : migrateRouteFeeSchedule({ ...route, billingCycle }, feeTerms, route.eveningFee);
  }

  const uniqueBoth = [
    ...new Set(bothFeeSchedule.filter((l) => l.kind === "installment").map((l) => l.amount)),
  ];
  const resolvedMode = feeAmountMode === "custom" || uniqueBoth.length > 1 ? "custom" : "fixed";
  return {
    ...route,
    billingCycle,
    feeAmountMode: resolvedMode,
    bothFeeSchedule,
    morningFeeSchedule,
    eveningFeeSchedule,
  };
}

function normalizeTransportRoutes(raw: unknown, feeTerms: FeeTerm[] = []): TransportRoute[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeTransportRoute)
    .filter((r): r is TransportRoute => r !== null)
    .map((r) => withRouteFeeSchedule(r, feeTerms));
}

export function routeScheduleForShift(
  route: TransportRoute,
  shift: TransportFeeShift,
): ClassFeeLine[] {
  const normalized = withRouteFeeSchedule(route);
  const pool =
    shift === "morning"
      ? normalized.morningFeeSchedule
      : shift === "evening"
        ? normalized.eveningFeeSchedule
        : normalized.bothFeeSchedule;
  return pool.filter((line) => line.kind === "installment" && line.amount > 0);
}

export function routeFeePrefillAmount(
  route: TransportRoute,
  shift: TransportFeeShift,
  opts: {
    periodLabel?: string;
    periodIndex?: number;
    collectionStartMonth?: string;
  },
  feeTerms: FeeTerm[] = [],
): number | undefined {
  const normalized = withRouteFeeSchedule(route, feeTerms);
  const installments = routeScheduleForShift(normalized, shift);
  if (opts.periodLabel && opts.collectionStartMonth && normalized.billingCycle === "Monthly") {
    const monthIndex = installmentIndexForFeeMonth(opts.collectionStartMonth, opts.periodLabel);
    if (monthIndex >= 0 && installments[monthIndex]) {
      return installments[monthIndex].amount;
    }
  }
  if (opts.periodLabel) {
    const needle = opts.periodLabel.trim().toLowerCase();
    const exact = installments.find((line) => line.label.trim().toLowerCase() === needle);
    if (exact) return exact.amount;
  }
  if (opts.periodIndex != null && opts.periodIndex >= 0 && installments[opts.periodIndex]) {
    return installments[opts.periodIndex].amount;
  }
  if (installments[0]) return installments[0].amount;
  const flat =
    shift === "morning"
      ? normalized.morningFee
      : shift === "evening"
        ? normalized.eveningFee
        : normalized.bothFee;
  return flat > 0 ? flat : undefined;
}

export function routeScheduleSummary(route: TransportRoute, feeTerms: FeeTerm[] = []): string {
  const normalized = withRouteFeeSchedule(route, feeTerms);
  const installments = normalized.bothFeeSchedule.filter(
    (line) => line.kind === "installment" && line.amount > 0,
  );
  if (!installments.length) return normalized.billingCycle;
  return normalized.billingCycle === "Term"
    ? `${installments.length} term${installments.length === 1 ? "" : "s"}`
    : `${installments.length} installment${installments.length === 1 ? "" : "s"}`;
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
  if (
    typeof v.id !== "string" ||
    typeof v.name !== "string" ||
    typeof v.registrationNo !== "string"
  ) {
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
    existing.filter((n) => n.id.startsWith(VEHICLE_DOC_EXPIRY_PREFIX)).map((n) => [n.id, n]),
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
  const category = NOTIFICATION_CATEGORIES.includes(
    n.category as (typeof NOTIFICATION_CATEGORIES)[number],
  )
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
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeTenantNotification).filter((n): n is TenantNotification => n !== null);
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
      {
        id: "doc-aadhaar",
        label: "Aadhaar",
        number: "4567 8901 2345",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
      {
        id: "doc-pan",
        label: "PAN Card",
        number: "ABDUL5678K",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
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
      {
        id: "doc-aadhaar",
        label: "Aadhaar",
        number: "2345 6789 0123",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
      {
        id: "doc-pan",
        label: "PAN Card",
        number: "AYISH1234P",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
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
      {
        id: "doc-aadhaar",
        label: "Aadhaar",
        number: "5678 9012 3456",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
      {
        id: "doc-pan",
        label: "PAN Card",
        number: "SHAMI9012L",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
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
      {
        id: "doc-aadhaar",
        label: "Aadhaar",
        number: "3456 7890 1234",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
      {
        id: "doc-pan",
        label: "PAN Card",
        number: "FATHM3456H",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
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
      {
        id: "doc-aadhaar",
        label: "Aadhaar",
        number: "6789 0123 4567",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
      {
        id: "doc-pan",
        label: "PAN Card",
        number: "RAHUL6789M",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
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
      {
        id: "doc-aadhaar",
        label: "Aadhaar",
        number: "7890 1234 5678",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
      {
        id: "doc-pan",
        label: "PAN Card",
        number: "SNEHA7890N",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
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
      {
        id: "doc-aadhaar",
        label: "Aadhaar",
        number: "8901 2345 6789",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
      {
        id: "doc-pan",
        label: "PAN Card",
        number: "VIKRM8901Q",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
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
      {
        id: "doc-aadhaar",
        label: "Aadhaar",
        number: "9012 3456 7890",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
      {
        id: "doc-pan",
        label: "PAN Card",
        number: "LAKSH9012R",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
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
      {
        id: "doc-aadhaar",
        label: "Aadhaar",
        number: "0123 4567 8901",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
      {
        id: "doc-pan",
        label: "PAN Card",
        number: "JOSEP0123S",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
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
      {
        id: "doc-aadhaar",
        label: "Aadhaar",
        number: "1234 5678 9012",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
      {
        id: "doc-pan",
        label: "PAN Card",
        number: "PRIYA1234T",
        levels: ID_CARD_ATTACHMENT_LEVELS.map((l) => ({ ...l })),
        attachments: [],
      },
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
    feeAmountMode: "fixed",
    feeSchedule: [],
  },
  {
    id: "CLS-002",
    className: "Grade 4 - B",
    grade: "Grade 4",
    section: "B",
    tuitionFeeAmount: 4000,
    vehicleFeeAmount: 1600,
    billingCycle: "Monthly",
    feeAmountMode: "fixed",
    feeSchedule: [],
  },
  {
    id: "CLS-003",
    className: "Grade 6 - C",
    grade: "Grade 6",
    section: "C",
    tuitionFeeAmount: 4500,
    vehicleFeeAmount: 1700,
    billingCycle: "Monthly",
    feeAmountMode: "fixed",
    feeSchedule: [],
  },
  {
    id: "CLS-004",
    className: "Grade 8 - B",
    grade: "Grade 8",
    section: "B",
    tuitionFeeAmount: 5200,
    vehicleFeeAmount: 1800,
    billingCycle: "Term",
    feeAmountMode: "fixed",
    feeSchedule: [],
  },
  {
    id: "CLS-005",
    className: "Grade 10 - A",
    grade: "Grade 10",
    section: "A",
    tuitionFeeAmount: 6800,
    vehicleFeeAmount: 2000,
    billingCycle: "Term",
    feeAmountMode: "fixed",
    feeSchedule: [],
  },
  {
    id: "CLS-006",
    className: "Grade 12 - A",
    grade: "Grade 12",
    section: "A",
    tuitionFeeAmount: 8400,
    vehicleFeeAmount: 2200,
    billingCycle: "Annually",
    feeAmountMode: "fixed",
    feeSchedule: [],
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
    billingCycle: "Monthly",
    feeAmountMode: "fixed",
    morningFeeSchedule: [],
    eveningFeeSchedule: [],
    bothFeeSchedule: [],
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
    billingCycle: "Monthly",
    feeAmountMode: "fixed",
    morningFeeSchedule: [],
    eveningFeeSchedule: [],
    bothFeeSchedule: [],
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
    billingCycle: "Monthly",
    feeAmountMode: "fixed",
    morningFeeSchedule: [],
    eveningFeeSchedule: [],
    bothFeeSchedule: [],
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
    billingCycle: "Monthly",
    feeAmountMode: "fixed",
    morningFeeSchedule: [],
    eveningFeeSchedule: [],
    bothFeeSchedule: [],
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
    billingCycle: "Monthly",
    feeAmountMode: "fixed",
    morningFeeSchedule: [],
    eveningFeeSchedule: [],
    bothFeeSchedule: [],
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
  {
    id: "PC-001",
    label: "Tuition Fee",
    slug: "tuition",
    isSystem: true,
    hasSchedule: false,
    active: true,
  },
  {
    id: "PC-002",
    label: "Vehicle Fee",
    slug: "vehicle",
    isSystem: true,
    hasSchedule: false,
    active: true,
  },
  { id: "PC-003", label: "Donation", hasSchedule: false, active: true },
  { id: "PC-004", label: "Other", hasSchedule: false, active: true },
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
  primaryColor: DEFAULT_BRAND_PRIMARY,
  secondaryColor: DEFAULT_BRAND_SECONDARY,
  fontFamily: "Inter",
  fontColor: DEFAULT_FONT_COLOR,
  fontSize: "Medium",
  iconColor: DEFAULT_BRAND_PRIMARY,
  menuColor: DEFAULT_BRAND_PRIMARY,
  fileNames: { ...DEFAULT_FILE_NAMES },
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

export const SEED_BRANCHES: CampusBranch[] = [
  {
    id: "BR-MAIN-1",
    name: "Main Campus",
    code: "MAIN",
    address: SEED_SCHOOL_DETAILS.address,
    phone: SEED_SCHOOL_DETAILS.phone,
    email: SEED_SCHOOL_DETAILS.email,
    lat: null,
    lng: null,
    isActive: true,
    isMain: true,
  },
];

type Snapshot = {
  students: Student[];
  staff: Staff[];
  payments: Payment[];
  departments: Department[];
  leaveTypes: LeaveType[];
  roles: Role[];
  classes: ClassConfig[];
  transportRoutes: TransportRoute[];
  transportVehicles: TransportVehicle[];
  paymentCategories: PaymentCategory[];
  feeTerms: FeeTerm[];
  studentFeeBreaks: StudentFeeBreak[];
  studentYearLedgers: StudentYearLedger[];
  academicYears: string[];
  /** Years closed for day-to-day posting (still visible for history). */
  closedAcademicYears: string[];
  academicYear: string;
  themeSettings: ThemeSettings;
  schoolDetails: SchoolDetails;
  dashboardTodos: string[];
  dashboardNote: string;
  notifications: TenantNotification[];
  tenantUsers: TenantUser[];
  branches: CampusBranch[];
  activeBranchId: string;
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
  leaveTypes: LeaveType[];
  setLeaveTypes: Dispatch<SetStateAction<LeaveType[]>>;
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
  studentFeeBreaks: StudentFeeBreak[];
  setStudentFeeBreaks: Dispatch<SetStateAction<StudentFeeBreak[]>>;
  studentYearLedgers: StudentYearLedger[];
  setStudentYearLedgers: Dispatch<SetStateAction<StudentYearLedger[]>>;
  academicYears: string[];
  setAcademicYears: Dispatch<SetStateAction<string[]>>;
  closedAcademicYears: string[];
  academicYear: string;
  setAcademicYear: Dispatch<SetStateAction<string>>;
  /** Open another year’s books (updates active year + syncs student overlays). */
  openAcademicYear: (year: string) => { receipts: number; enrolled: number };
  /** Add a year, cloning fee terms from the nearest existing year. */
  addAcademicYear: (year: string) => boolean;
  /** Rename a year label across books, fees, receipts, and enrollments. */
  renameAcademicYear: (from: string, to: string) => { ok: boolean; reason?: string };
  /** Close (deactivate) or reopen a financial year. Closing the open year switches books. */
  setAcademicYearClosed: (year: string, closed: boolean) => { ok: boolean; reason?: string };
  /** Whether a year can be hard-deleted (only blocked when it is the sole year). */
  canDeleteAcademicYear: (year: string) => { ok: boolean; reason?: string };
  /** Hard-delete a year and cascade local receipts, enrollments, and fee periods. */
  deleteAcademicYear: (year: string) => boolean;
  enrollStudentInActiveYear: (studentId: string, fields: StudentYearFields) => void;
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
  /** False until remote/local snapshot has been applied — use for page skeletons. */
  hydrated: boolean;
  /** True while campus switch is loading branch-scoped operational data. */
  branchSyncing: boolean;
  branches: CampusBranch[];
  setBranches: Dispatch<SetStateAction<CampusBranch[]>>;
  activeBranchId: string;
  activeBranch: CampusBranch | null;
  /** Open another campus workspace (refetches operational data). */
  openBranch: (branchId: string) => Promise<{ students: number; receipts: number }>;
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

function isThemeSettings(value: unknown): value is Omit<
  ThemeSettings,
  "navPlacement" | "mode" | "accent"
> & {
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
  const raw = value as Partial<ThemeSettings>;
  return {
    mode: normalizeThemeMode(value.mode),
    accent: normalizeThemeAccent(value.accent),
    density: value.density as ThemeSettings["density"],
    navPlacement: THEME_NAV_PLACEMENT_OPTIONS.includes(placement as ThemeSettings["navPlacement"])
      ? (placement as ThemeSettings["navPlacement"])
      : "Left",
    primaryColor: normalizeHexColor(raw.primaryColor, DEFAULT_BRAND_PRIMARY),
    secondaryColor: normalizeHexColor(raw.secondaryColor, DEFAULT_BRAND_SECONDARY),
    fontFamily: normalizeFontFamily(raw.fontFamily),
    fontColor: normalizeHexColor(raw.fontColor, DEFAULT_FONT_COLOR),
    fontSize: normalizeFontSize(raw.fontSize),
    iconColor: normalizeHexColor(
      raw.iconColor,
      normalizeHexColor(raw.primaryColor, DEFAULT_BRAND_PRIMARY),
    ),
    menuColor: normalizeHexColor(
      raw.menuColor,
      normalizeHexColor(raw.primaryColor, DEFAULT_BRAND_PRIMARY),
    ),
    fileNames: normalizeFileNames(raw.fileNames),
  };
}

function asTrimmedString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

/** Keep data URLs and uploaded media paths (reject truncated / garbage values). */
function asOptionalMediaUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith("data:image/")) {
    if (trimmed.length < 64 || !trimmed.includes(";base64,")) return undefined;
    return trimmed;
  }

  if (
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/api/media.php") ||
    trimmed.startsWith("/uploads/") ||
    trimmed.startsWith("uploads/")
  ) {
    return trimmed;
  }

  return undefined;
}

export function normalizeSchoolDetails(value: unknown): SchoolDetails {
  if (!value || typeof value !== "object") return { ...SEED_SCHOOL_DETAILS };
  const raw = value as Partial<SchoolDetails>;
  const name = asTrimmedString(raw.name, SEED_SCHOOL_DETAILS.name) || SEED_SCHOOL_DETAILS.name;
  return {
    name,
    logoUrl: asOptionalMediaUrl(raw.logoUrl),
    letterheadUrl: asOptionalMediaUrl(raw.letterheadUrl),
    sealUrl: asOptionalMediaUrl(raw.sealUrl),
    signatureUrl: asOptionalMediaUrl(raw.signatureUrl),
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
    cat: normalizePaymentCategoryLabel(raw.cat ?? ""),
    academicYear:
      typeof raw.academicYear === "string" && raw.academicYear.trim()
        ? raw.academicYear.trim()
        : fallbackYear,
  };
}

function normalizeStudentYearLedgers(
  raw: unknown,
  _students: Student[],
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
  // Invalid / empty ledger payload — keep an empty book (do not enroll everyone).
  return [{ academicYear: fallbackYear, byStudentId: {} }];
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
          normalizeFeeTerm(t as Partial<FeeTerm> & Pick<FeeTerm, "id" | "label">, academicYear),
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
        const extras = SEED_FEE_TERMS.filter((t) => !yearsPresent.has(t.academicYear ?? ""));
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
  const studentsWithYear = students.map((s) => applyLedgerToStudent(s, ledger.byStudentId[s.id]));
  return {
    students: studentsWithYear,
    staff: parsed.staff.map((s) => normalizeStaff(s as Staff)),
    payments,
    departments: parsed.departments,
    leaveTypes: Array.isArray((parsed as Partial<Snapshot>).leaveTypes)
      ? ((parsed as Partial<Snapshot>).leaveTypes as unknown[])
          .map(normalizeLeaveType)
          .filter((t): t is LeaveType => t !== null)
      : [],
    roles: parsed.roles,
    classes: Array.isArray(parsed.classes)
      ? parsed.classes.map((c) =>
          withClassFeeSchedule(
            normalizeClassConfig(
              c as Partial<ClassConfig> & Pick<ClassConfig, "id" | "tuitionFeeAmount">,
            ),
            migratedFeeTerms,
          ),
        )
      : [...SEED_CLASSES],
    transportRoutes: normalizeTransportRoutes(parsed.transportRoutes, migratedFeeTerms),
    transportVehicles: Array.isArray(parsed.transportVehicles)
      ? parsed.transportVehicles
          .map(normalizeTransportVehicle)
          .filter((v): v is TransportVehicle => v !== null)
      : [...SEED_VEHICLES],
    paymentCategories: normalizePaymentCategories(parsed.paymentCategories),
    feeTerms: migratedFeeTerms,
    studentFeeBreaks: Array.isArray((parsed as Partial<Snapshot>).studentFeeBreaks)
      ? ((parsed as Partial<Snapshot>).studentFeeBreaks as Partial<StudentFeeBreak>[])
          .map((b) =>
            normalizeStudentFeeBreak(
              b as Partial<StudentFeeBreak> & Pick<StudentFeeBreak, "id" | "studentId">,
            ),
          )
          .filter((b): b is StudentFeeBreak => b !== null)
      : [],
    studentYearLedgers,
    academicYears: ensureAcademicYearInList(
      Array.isArray(parsed.academicYears)
        ? parsed.academicYears.filter((y): y is string => typeof y === "string")
        : [...SEED_ACADEMIC_YEARS],
      parsed.academicYear,
    ),
    closedAcademicYears: Array.isArray((parsed as Partial<Snapshot>).closedAcademicYears)
      ? ((parsed as Partial<Snapshot>).closedAcademicYears as unknown[])
          .filter((y): y is string => typeof y === "string" && y.trim().length > 0)
          .map((y) => y.trim())
      : [],
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
    branches: Array.isArray((parsed as Partial<Snapshot>).branches)
      ? ((parsed as Partial<Snapshot>).branches as unknown[])
          .map(normalizeCampusBranch)
          .filter((b): b is CampusBranch => Boolean(b))
      : [...SEED_BRANCHES],
    activeBranchId:
      typeof (parsed as Partial<Snapshot>).activeBranchId === "string"
        ? ((parsed as Partial<Snapshot>).activeBranchId as string)
        : (SEED_BRANCHES[0]?.id ?? ""),
  };
}

function readSnapshot(storeKey: string = activeStoreKey): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(storeKey) ??
      (storeKey === STORAGE_KEY
        ? LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean)
        : undefined);
    if (!raw) return null;
    return parseSnapshot(raw);
  } catch {
    return null;
  }
}

function writeSnapshot(snapshot: Snapshot, storeKey: string = activeStoreKey) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storeKey, JSON.stringify(snapshot));
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
 * Keep a student's currently saved bus point selectable even if that route
 * endpoint was renamed/deleted — otherwise the Select shows blank.
 * Callers should warn when `orphan` is set.
 */
export function withCurrentBusPointOption(
  current: string | undefined,
  pool: string[],
): { options: string[]; orphan: string | null } {
  const value = (current ?? "").trim();
  if (value && !pool.includes(value)) {
    return { options: [value, ...pool], orphan: value };
  }
  return { options: pool, orphan: null };
}

/** Student bus points that are not Map From / Map To on any transport route. */
export function collectOrphanedStudentBusPoints(
  students: readonly Pick<Student, "needsBus" | "busPoint1" | "busPoint2" | "deletedAt">[],
  routes: TransportRoute[],
): { pickups: string[]; drops: string[] } {
  const { pickups, drops } = transportBusPointOptions(routes);
  const pickupSet = new Set(pickups.map((p) => p.trim()));
  const dropSet = new Set((drops.length > 0 ? drops : pickups).map((p) => p.trim()));
  const orphanPickups = new Set<string>();
  const orphanDrops = new Set<string>();
  for (const student of students) {
    if (student.deletedAt) continue;
    if (!studentNeedsTransport(student)) continue;
    const p1 = student.busPoint1?.trim();
    const p2 = student.busPoint2?.trim();
    if (p1 && !pickupSet.has(p1)) orphanPickups.add(p1);
    if (p2 && !dropSet.has(p2)) orphanDrops.add(p2);
  }
  return {
    pickups: Array.from(orphanPickups).sort((a, b) => a.localeCompare(b, "en")),
    drops: Array.from(orphanDrops).sort((a, b) => a.localeCompare(b, "en")),
  };
}

function normalizeBusPointLabel(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function busPointsMatch(a: string | undefined, b: string | undefined): boolean {
  const left = normalizeBusPointLabel(a);
  const right = normalizeBusPointLabel(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

export function studentNeedsTransport(
  student: Pick<Student, "needsBus" | "busPoint1" | "busPoint2">,
): boolean {
  return (
    student.needsBus === true || Boolean(student.busPoint1?.trim() || student.busPoint2?.trim())
  );
}

export type TransportFeeShift = "morning" | "evening" | "both";

export function resolveTransportFeeShift(
  student: Pick<Student, "busPoint1" | "busPoint2">,
): TransportFeeShift {
  const hasPickup = Boolean(student.busPoint1?.trim());
  const hasDrop = Boolean(student.busPoint2?.trim());
  if (hasPickup && hasDrop) return "both";
  if (hasPickup) return "morning";
  if (hasDrop) return "evening";
  return "both";
}

export function findTransportRouteForStudent(
  student: Pick<Student, "needsBus" | "busPoint1" | "busPoint2">,
  routes: TransportRoute[],
): TransportRoute | undefined {
  if (!studentNeedsTransport(student)) return undefined;
  const pickup = student.busPoint1?.trim();
  const drop = student.busPoint2?.trim();

  if (pickup && drop) {
    const matched = routes.find(
      (route) => busPointsMatch(route.mapFrom, pickup) && busPointsMatch(route.mapTo, drop),
    );
    if (matched) return matched;
  }
  if (pickup) {
    const matched = routes.find((route) => busPointsMatch(route.mapFrom, pickup));
    if (matched) return matched;
  }
  if (drop) {
    const matched = routes.find((route) => busPointsMatch(route.mapTo, drop));
    if (matched) return matched;
  }
  return undefined;
}

export function resolveTransportFeeForStudent(
  student: Pick<Student, "needsBus" | "busPoint1" | "busPoint2" | "cls" | "hasConcession" | "concessionFees">,
  routes: TransportRoute[],
  classConfig?: Pick<ClassConfig, "vehicleFeeAmount">,
  period?: {
    label?: string;
    kind?: FeePeriodKind;
    collectionStartMonth?: string;
  },
  feeTerms: FeeTerm[] = [],
): { amount: number | undefined; shift: TransportFeeShift; route?: TransportRoute } {
  if (!studentNeedsTransport(student)) {
    return { amount: undefined, shift: "both" };
  }

  if (student.hasConcession && student.concessionFees?.vehicle?.enabled) {
    const tier = student.concessionFees.vehicle;
    const schedule = tier.feeSchedule.filter((line) => line.amount > 0);
    if (schedule.length > 0) {
      const synthetic: ClassConfig = {
        id: "__concession_vehicle__",
        className: student.cls ?? "",
        grade: "",
        section: "",
        tuitionFeeAmount: 0,
        vehicleFeeAmount: sumFeeSchedule(schedule),
        billingCycle: tier.billingCycle,
        feeAmountMode: tier.feeAmountMode,
        feeSchedule: schedule,
        feeCollectionStartMonth: tier.feeCollectionStartMonth,
      };
      const fromConcession = classFeePrefillAmount(synthetic, {
        category: "Vehicle Fee",
        periodLabel: period?.label,
        collectionStartMonth: period?.collectionStartMonth ?? tier.feeCollectionStartMonth,
      });
      if (fromConcession && fromConcession > 0) {
        return { amount: Math.round(fromConcession), shift: "both" };
      }
      return { amount: Math.round(schedule[0].amount), shift: "both" };
    }
  }

  const shift = resolveTransportFeeShift(student);
  const route = findTransportRouteForStudent(student, routes);

  if (route) {
    const normalized = withRouteFeeSchedule(route, feeTerms);
    const fromSchedule = routeFeePrefillAmount(
      normalized,
      shift,
      {
        periodLabel: period?.label,
        collectionStartMonth: period?.collectionStartMonth,
      },
      feeTerms,
    );
    if (fromSchedule && fromSchedule > 0) {
      return { amount: Math.round(fromSchedule), shift, route: normalized };
    }
    const raw =
      shift === "morning"
        ? normalized.morningFee
        : shift === "evening"
          ? normalized.eveningFee
          : normalized.bothFee;
    if (raw > 0) {
      return { amount: Math.round(raw), shift, route: normalized };
    }
  }

  if (classConfig && classConfig.vehicleFeeAmount > 0) {
    return { amount: classConfig.vehicleFeeAmount, shift, route };
  }

  const fallback = routes[0] ? withRouteFeeSchedule(routes[0], feeTerms) : undefined;
  if (fallback?.bothFee && fallback.bothFee > 0) {
    const amt = routeFeePrefillAmount(
      fallback,
      "both",
      {
        periodLabel: period?.label,
        collectionStartMonth: period?.collectionStartMonth,
      },
      feeTerms,
    );
    return {
      amount: Math.round(amt ?? fallback.bothFee),
      shift: "both",
      route: fallback,
    };
  }

  return { amount: undefined, shift, route };
}

export function vehicleFeeCategoryLabel(
  categories: readonly Pick<PaymentCategory, "label">[],
): string {
  const match = categories.find((category) => /vehicle|transport|bus/i.test(category.label));
  return match?.label ?? "Vehicle Fee";
}

export function isVehicleFeeCategory(label: string): boolean {
  const lower = label.trim().toLowerCase();
  return lower.includes("vehicle") || lower.includes("transport") || lower.includes("bus");
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
    dob: toDobIso(patch.dob),
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
    snap.tenantUsers.find((u) => u.active && u.email === normalized && u.password === password) ??
    null
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
export function upsertStudentInSnapshot(
  student: Student,
  enrollment?: { academicYear: string; fields: StudentYearFields },
) {
  const snap = readSnapshot();
  if (!snap) return;
  const normalized = normalizeStudent(student);
  const idx = snap.students.findIndex((s) => s.id === normalized.id);
  const nextStudents = [...snap.students];
  if (idx >= 0) nextStudents[idx] = { ...nextStudents[idx], ...normalized };
  else nextStudents.unshift(normalized);

  let studentYearLedgers = snap.studentYearLedgers ?? [];
  if (enrollment) {
    studentYearLedgers = upsertStudentYearFields(
      studentYearLedgers,
      enrollment.academicYear,
      normalized.id,
      enrollment.fields,
    );
  } else {
    // Profile/API edits: refresh year fields only when already enrolled in the open books.
    const year = snap.academicYear;
    const existing = getYearLedger(studentYearLedgers, year).byStudentId[normalized.id];
    if (existing) {
      studentYearLedgers = upsertStudentYearFields(studentYearLedgers, year, normalized.id, {
        cls: normalized.cls,
        due: normalized.due,
        active: normalized.active !== false,
      });
    }
  }

  writeSnapshot({ ...snap, students: nextStudents, studentYearLedgers });
}

const TenantStoreContext = createContext<TenantStoreValue | null>(null);

export function TenantStoreProvider({
  children,
  tenantId,
  tenantName,
}: {
  children: ReactNode;
  tenantId?: string;
  tenantName?: string;
}) {
  const liveApi = typeof window !== "undefined" && Boolean(getApiToken());
  const storeKey = storeKeyForTenant(tenantId);
  activeStoreKey = storeKey;

  const blankSchool = useMemo<SchoolDetails>(
    () => ({
      ...EMPTY_SCHOOL_DETAILS,
      name: tenantName?.trim() || "",
    }),
    [tenantName],
  );
  const liveApiRef = useRef(liveApi);
  liveApiRef.current = liveApi;
  const tenantNameRef = useRef(tenantName);
  tenantNameRef.current = tenantName;
  const blankSchoolRef = useRef(blankSchool);
  blankSchoolRef.current = blankSchool;

  const cachedSnapshot = useMemo(() => readSnapshot(storeKey), [storeKey]);

  const [students, setStudents] = useState<Student[]>(() =>
    liveApi ? (cachedSnapshot?.students ?? []) : SEED_STUDENTS,
  );
  const [staff, setStaff] = useState<Staff[]>(() =>
    liveApi ? (cachedSnapshot?.staff ?? []) : SEED_STAFF,
  );
  const [payments, setPayments] = useState<Payment[]>(() =>
    liveApi ? (cachedSnapshot?.payments ?? []) : SEED_PAYMENTS,
  );
  const [departments, setDepartments] = useState<Department[]>(() =>
    liveApi ? (cachedSnapshot?.departments ?? []) : SEED_DEPARTMENTS,
  );
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(() =>
    liveApi ? (cachedSnapshot?.leaveTypes ?? []) : [],
  );
  const [roles, setRoles] = useState<Role[]>(() =>
    liveApi ? (cachedSnapshot?.roles ?? []) : SEED_ROLES,
  );
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>(() =>
    liveApi ? (cachedSnapshot?.tenantUsers ?? []) : SEED_TENANT_USERS,
  );
  const [classes, setClasses] = useState<ClassConfig[]>(() =>
    liveApi ? (cachedSnapshot?.classes ?? []) : SEED_CLASSES,
  );
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>(() =>
    liveApi
      ? normalizeTransportRoutes(cachedSnapshot?.transportRoutes, cachedSnapshot?.feeTerms ?? [])
      : SEED_TRANSPORT,
  );
  const [transportVehicles, setTransportVehicles] = useState<TransportVehicle[]>(() =>
    liveApi ? (cachedSnapshot?.transportVehicles ?? []) : SEED_VEHICLES,
  );
  const [paymentCategories, setPaymentCategories] = useState<PaymentCategory[]>(() =>
    liveApi
      ? normalizePaymentCategories(cachedSnapshot?.paymentCategories)
      : SEED_PAYMENT_CATEGORIES,
  );
  const [feeTerms, setFeeTerms] = useState<FeeTerm[]>(() =>
    liveApi ? (cachedSnapshot?.feeTerms ?? []) : SEED_FEE_TERMS,
  );
  const [studentFeeBreaks, setStudentFeeBreaks] = useState<StudentFeeBreak[]>(() =>
    liveApi ? (cachedSnapshot?.studentFeeBreaks ?? []) : [],
  );
  const [studentYearLedgers, setStudentYearLedgers] = useState<StudentYearLedger[]>(() =>
    liveApi ? (cachedSnapshot?.studentYearLedgers ?? []) : SEED_STUDENT_YEAR_LEDGERS,
  );
  // Live API: start empty so seed years never flash before hydrate finishes.
  const [academicYears, setAcademicYears] = useState<string[]>(() =>
    liveApi ? (cachedSnapshot?.academicYears ?? []) : [...SEED_ACADEMIC_YEARS],
  );
  const [closedAcademicYears, setClosedAcademicYears] = useState<string[]>(() =>
    liveApi ? (cachedSnapshot?.closedAcademicYears ?? []) : [],
  );
  const [academicYear, setAcademicYearState] = useState<string>(() =>
    liveApi ? (cachedSnapshot?.academicYear ?? "") : SEED_ACADEMIC_YEAR,
  );
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    if (!liveApi) return SEED_THEME_SETTINGS;
    return readSnapshot(storeKey)?.themeSettings ?? SEED_THEME_SETTINGS;
  });
  const skipThemePersist = useRef(true);
  // Live API: paint cached logo/name immediately so the dock does not flash initials
  // while the remote hydrate is in flight.
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails>(() => {
    if (!liveApi) return SEED_SCHOOL_DETAILS;
    const cached = readSnapshot(storeKey)?.schoolDetails;
    if (cached) {
      return {
        ...cached,
        name: cached.name?.trim() || tenantName?.trim() || cached.name,
      };
    }
    return blankSchool;
  });
  const [dashboardTodos, setDashboardTodos] = useState<string[]>([...DEFAULT_DASHBOARD_TODOS]);
  const [dashboardNote, setDashboardNote] = useState("");
  const [notifications, setNotifications] = useState<TenantNotification[]>(() =>
    liveApi ? (cachedSnapshot?.notifications ?? []) : [...SEED_NOTIFICATIONS],
  );
  const [branches, setBranches] = useState<CampusBranch[]>(() =>
    liveApi ? (cachedSnapshot?.branches ?? []) : [...SEED_BRANCHES],
  );
  const [activeBranchId, setActiveBranchIdState] = useState<string>(() =>
    liveApi
      ? cachedSnapshot?.activeBranchId || readStoredBranchPublicId(tenantId) || ""
      : (SEED_BRANCHES[0]?.id ?? ""),
  );
  const [hydrated, setHydrated] = useState(
    () => !liveApi || cachedSnapshot !== null || isImpersonating(),
  );
  const [branchSyncing, setBranchSyncing] = useState(false);
  const branchSwitchSeq = useRef(0);
  const branchesRef = useRef(branches);
  branchesRef.current = branches;

  const applySnapshot = useCallback((snap: Snapshot) => {
    const apiLive = liveApiRef.current;
    setStudents(Array.isArray(snap.students) ? snap.students : []);
    setStaff(
      Array.isArray(snap.staff)
        ? snap.staff
            .filter((s): s is Staff => Boolean(s && typeof s.id === "string" && s.id))
            .map((s) => normalizeStaff(s))
        : [],
    );
    setPayments(snap.payments);
    setDepartments(snap.departments);
    setLeaveTypes(
      Array.isArray(snap.leaveTypes)
        ? snap.leaveTypes.map(normalizeLeaveType).filter((t): t is LeaveType => t !== null)
        : [],
    );
    setRoles(snap.roles);
    setTenantUsers(snap.tenantUsers ?? (apiLive ? [] : SEED_TENANT_USERS));
    setClasses(
      Array.isArray(snap.classes)
        ? snap.classes.map((c) =>
            withClassFeeSchedule(
              normalizeClassConfig(
                c as Partial<ClassConfig> & Pick<ClassConfig, "id" | "tuitionFeeAmount">,
              ),
              snap.feeTerms ?? [],
            ),
          )
        : apiLive
          ? []
          : SEED_CLASSES,
    );
    setTransportRoutes(normalizeTransportRoutes(snap.transportRoutes, snap.feeTerms ?? []));
    setTransportVehicles(snap.transportVehicles);
    setPaymentCategories(normalizePaymentCategories(snap.paymentCategories));
    setFeeTerms(
      Array.isArray(snap.feeTerms)
        ? snap.feeTerms
            .map((t) => normalizeFeeTerm(t as Partial<FeeTerm> & Pick<FeeTerm, "id" | "label">))
            .filter((t): t is FeeTerm => t !== null)
        : apiLive
          ? []
          : SEED_FEE_TERMS,
    );
    setStudentFeeBreaks(
      Array.isArray(snap.studentFeeBreaks)
        ? snap.studentFeeBreaks
            .map((b) =>
              normalizeStudentFeeBreak(
                b as Partial<StudentFeeBreak> & Pick<StudentFeeBreak, "id" | "studentId">,
              ),
            )
            .filter((b): b is StudentFeeBreak => b !== null)
        : [],
    );
    setStudentYearLedgers(
      snap.studentYearLedgers?.length
        ? snap.studentYearLedgers
        : apiLive
          ? []
          : SEED_STUDENT_YEAR_LEDGERS,
    );
    setAcademicYears(snap.academicYears);
    setClosedAcademicYears(snap.closedAcademicYears ?? []);
    setAcademicYearState(snap.academicYear);
    setThemeSettings(normalizeThemeSettings(snap.themeSettings));
    setSchoolDetails(snap.schoolDetails);
    setDashboardTodos(snap.dashboardTodos);
    setDashboardNote(snap.dashboardNote);
    setNotifications(snap.notifications);
    setBranches((prev) => {
      const next = Array.isArray(snap.branches) ? snap.branches : [];
      return branchListFingerprint(prev) === branchListFingerprint(next) ? prev : next;
    });
    setActiveBranchIdState(snap.activeBranchId ?? "");
  }, []);

  const applyBranchOperationalData = useCallback(
    (data: {
      students: Student[];
      staff: Staff[];
      payments: Payment[];
      studentYearLedgers: StudentYearLedger[];
      dashboardTodos: string[];
      dashboardNote: string;
      activeBranchId: string;
      studentFeeBreaks?: StudentFeeBreak[];
    }) => {
      setStudents(
        Array.isArray(data.students)
          ? data.students
              .filter(
                (s): s is Student =>
                  Boolean(s && typeof s.id === "string" && typeof s.name === "string"),
              )
              .map((s) =>
                normalizeStudent(
                  s as Partial<Student> & Pick<Student, "id" | "name" | "cls" | "guardian" | "due">,
                ),
              )
          : [],
      );
      setStaff(
        Array.isArray(data.staff)
          ? data.staff
              .filter((s): s is Staff => Boolean(s && typeof s.id === "string" && s.id))
              .map((s) => normalizeStaff(s))
          : [],
      );
      setPayments(data.payments);
      if (data.studentFeeBreaks) {
        setStudentFeeBreaks(
          data.studentFeeBreaks
            .map((b) =>
              normalizeStudentFeeBreak(
                b as Partial<StudentFeeBreak> & Pick<StudentFeeBreak, "id" | "studentId">,
              ),
            )
            .filter((b): b is StudentFeeBreak => b !== null),
        );
      }
      setStudentYearLedgers(
        data.studentYearLedgers?.length
          ? data.studentYearLedgers
          : liveApiRef.current
            ? []
            : SEED_STUDENT_YEAR_LEDGERS,
      );
      setDashboardTodos(data.dashboardTodos);
      setDashboardNote(data.dashboardNote);
      setActiveBranchIdState(data.activeBranchId);
    },
    [],
  );

  useEffect(() => {
    activeStoreKey = storeKey;
    setBranchContext(tenantId ?? null, readStoredBranchPublicId(tenantId));
    let cancelled = false;
    const branchEpochAtStart = branchCatalogWriteEpochValue();
    const localSnap = readSnapshot(storeKey);
    if (localSnap) {
      applySnapshot({
        ...localSnap,
        studentYearLedgers: reconcileLedgersWithStudents(
          localSnap.students,
          localSnap.studentYearLedgers,
          localSnap.academicYear,
        ),
      });
      setHydrated(true);
    } else {
      setHydrated(false);
    }

    const hydrate = async () => {
      // Prefer live API data when a JWT exists (school admin / impersonation).
      if (getApiToken()) {
        try {
          const remote = await fetchRemoteTenantBundle(undefined, { tenantId });
          if (!cancelled && remote) {
            const keepLocalBranches = branchCatalogWriteEpochValue() > branchEpochAtStart;
            const mergedBranches = keepLocalBranches ? branchesRef.current : remote.branches;
            // Prefer server year ledgers so every browser sees the same roster.
            // Fall back to localStorage only when the API has no year-field rows yet.
            const localLedgers = readSnapshot(storeKey)?.studentYearLedgers ?? [];
            const remoteLedgers = remote.studentYearLedgers ?? [];
            const mergedLedgers =
              remoteLedgers.length > 0
                ? mergeStudentYearLedgers(remoteLedgers, localLedgers)
                : mergeStudentYearLedgers(localLedgers, remoteLedgers);
            const reconciledLedgers = reconcileLedgersWithStudents(
              remote.students,
              mergedLedgers,
              remote.academicYear,
            );
            const missingYearEntries = yearFieldEntriesMissingFrom(
              remoteLedgers,
              reconciledLedgers,
            );
            if (missingYearEntries.length > 0) {
              void apiSyncStudentYearFields(missingYearEntries).catch(() => {
                /* local reconcile still applied */
              });
            }
            const sessionTenantName = tenantNameRef.current?.trim() || "";
            applySnapshot({
              students: remote.students,
              staff: remote.staff,
              payments: remote.payments,
              departments: remote.departments,
              leaveTypes: remote.leaveTypes,
              roles: remote.roles,
              classes: remote.classes,
              transportRoutes: remote.transportRoutes,
              transportVehicles: remote.transportVehicles,
              paymentCategories: remote.paymentCategories,
              feeTerms: remote.feeTerms,
              studentFeeBreaks: remote.studentFeeBreaks ?? [],
              studentYearLedgers: reconciledLedgers,
              academicYears: remote.academicYears,
              closedAcademicYears: remote.closedAcademicYears ?? [],
              academicYear: remote.academicYear,
              themeSettings: remote.themeSettings,
              schoolDetails: {
                ...remote.schoolDetails,
                name:
                  remote.schoolDetails.name?.trim() ||
                  sessionTenantName ||
                  remote.schoolDetails.name,
              },
              dashboardTodos: remote.dashboardTodos,
              dashboardNote: remote.dashboardNote,
              notifications: remote.notifications,
              tenantUsers: remote.tenantUsers,
              branches: mergedBranches,
              activeBranchId: remote.activeBranchId,
            });
            if (remote.activeBranchId) {
              setBranchContext(tenantId ?? null, remote.activeBranchId);
            }
            setHydrated(true);
            return;
          }
        } catch {
          // fall through to tenant-scoped localStorage only (never shared seed)
        }

        if (cancelled) return;
        const snap = readSnapshot(storeKey);
        if (snap) {
          applySnapshot({
            ...snap,
            studentYearLedgers: reconcileLedgersWithStudents(
              snap.students,
              snap.studentYearLedgers,
              snap.academicYear,
            ),
          });
        } else {
          applySnapshot({
            students: [],
            staff: [],
            payments: [],
            departments: [],
            leaveTypes: [],
            roles: [],
            classes: [],
            transportRoutes: [],
            transportVehicles: [],
            paymentCategories: [],
            feeTerms: [],
            studentFeeBreaks: [],
            studentYearLedgers: [],
            academicYears: [...SEED_ACADEMIC_YEARS],
            closedAcademicYears: [],
            academicYear: SEED_ACADEMIC_YEAR,
            themeSettings: SEED_THEME_SETTINGS,
            schoolDetails: blankSchoolRef.current,
            dashboardTodos: [...DEFAULT_DASHBOARD_TODOS],
            dashboardNote: "",
            notifications: [],
            tenantUsers: [],
            branches: [],
            activeBranchId: "",
          });
        }
        setHydrated(true);
        return;
      }

      if (cancelled) return;
      const snap = readSnapshot(storeKey);
      if (snap) {
        applySnapshot({
          ...snap,
          studentYearLedgers: reconcileLedgersWithStudents(
            snap.students,
            snap.studentYearLedgers,
            snap.academicYear,
          ),
        });
      }
      setHydrated(true);
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [applySnapshot, storeKey, tenantId]);

  useEffect(() => {
    applyWorkspaceThemeMode(themeSettings.mode);
    applyWorkspaceBrand({
      primary: themeSettings.primaryColor,
      secondary: themeSettings.secondaryColor,
      fontFamily: themeSettings.fontFamily,
      fontColor: themeSettings.fontColor,
      fontSize: themeSettings.fontSize,
      iconColor: themeSettings.iconColor,
      menuColor: themeSettings.menuColor,
    });
    setActiveFileNames(themeSettings.fileNames);
  }, [themeSettings]);

  useEffect(() => {
    if (!hydrated) return;
    if (skipThemePersist.current) {
      skipThemePersist.current = false;
      return;
    }
    if (!getApiToken()) return;
    const handle = window.setTimeout(() => {
      void apiSyncThemeSettings(themeSettings).catch(() => {
        /* local snapshot kept */
      });
    }, 450);
    return () => window.clearTimeout(handle);
  }, [hydrated, themeSettings]);

  useEffect(() => {
    return () => {
      clearWorkspaceBrand();
      clearActiveFileNames();
    };
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storeKey || !event.newValue) return;
      const snap = parseSnapshot(event.newValue);
      if (!snap) return;
      applySnapshot(snap);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [applySnapshot, storeKey]);

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
    writeSnapshot(
      {
        students,
        staff,
        payments,
        departments,
        leaveTypes,
        roles,
        classes,
        transportRoutes,
        transportVehicles,
        paymentCategories,
        feeTerms,
        studentFeeBreaks,
        studentYearLedgers,
        academicYears,
        closedAcademicYears,
        academicYear,
        themeSettings,
        schoolDetails,
        dashboardTodos,
        dashboardNote,
        notifications,
        tenantUsers,
        branches,
        activeBranchId,
      },
      storeKey,
    );
  }, [
    hydrated,
    students,
    staff,
    payments,
    departments,
    leaveTypes,
    roles,
    classes,
    transportRoutes,
    transportVehicles,
    paymentCategories,
    feeTerms,
    studentFeeBreaks,
    studentYearLedgers,
    academicYears,
    closedAcademicYears,
    academicYear,
    themeSettings,
    schoolDetails,
    dashboardTodos,
    dashboardNote,
    notifications,
    tenantUsers,
    branches,
    activeBranchId,
    storeKey,
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
        setClosedAcademicYears((prevClosed) => prevClosed.filter((y) => y !== next));
        setStudentYearLedgers((ledgers) => {
          const ensured = ensureYearLedger(ledgers, next);
          const ledger = getYearLedger(ensured, next);
          setStudents((current) =>
            current.map((s) => applyLedgerToStudent(s, ledger.byStudentId[s.id])),
          );
          return ensured;
        });
        if (getApiToken()) {
          void apiSyncAcademicYears({
            academicYears: academicYears.includes(next) ? academicYears : [...academicYears, next],
            academicYear: next,
            closedAcademicYears: closedAcademicYears.filter((y) => y !== next),
          }).catch(() => {
            /* keep local books; next hydrate may overwrite until sync succeeds */
          });
        }
        return next;
      });
    },
    [academicYears, closedAcademicYears],
  );

  const openAcademicYear = useCallback(
    (year: string) => {
      if (closedAcademicYears.includes(year)) {
        setClosedAcademicYears((prev) => prev.filter((y) => y !== year));
      }
      setAcademicYear(year);
      return academicYearBookStats({
        payments,
        ledgers: studentYearLedgers,
        year,
      });
    },
    [closedAcademicYears, payments, setAcademicYear, studentYearLedgers],
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
      const nextYears = [...academicYears, year];
      setFeeTerms((prev) => [...prev, ...cloned]);
      setStudentYearLedgers((prev) => ensureYearLedger(prev, year));
      setAcademicYears(nextYears);
      setAcademicYearState(year);
      if (getApiToken()) {
        void (async () => {
          try {
            await apiSyncAcademicYears({
              academicYears: nextYears,
              academicYear: year,
              closedAcademicYears,
            });
            for (const term of cloned) {
              await apiUpsertFeeTerm(term);
            }
          } catch {
            /* local snapshot kept; user sees toast from Settings UI if needed */
          }
        })();
      }
      return true;
    },
    [academicYear, academicYears, closedAcademicYears, feeTerms],
  );

  const renameAcademicYear = useCallback(
    (from: string, to: string) => {
      const nextLabel = normalizeAcademicYearLabel(to) ?? to.trim();
      if (!nextLabel) {
        return { ok: false, reason: "Choose start and closing months" };
      }
      if (from === nextLabel) return { ok: true };
      if (academicYears.some((y) => y.toLowerCase() === nextLabel.toLowerCase() && y !== from)) {
        return { ok: false, reason: `${nextLabel} already exists` };
      }
      const nextYears = academicYears.map((y) => (y === from ? nextLabel : y));
      const nextClosed = closedAcademicYears.map((y) => (y === from ? nextLabel : y));
      const nextActive = academicYear === from ? nextLabel : academicYear;
      setAcademicYears(nextYears);
      setClosedAcademicYears(nextClosed);
      setFeeTerms((prev) =>
        prev.map((t) => (t.academicYear === from ? { ...t, academicYear: nextLabel } : t)),
      );
      setPayments((prev) =>
        prev.map((p) => (p.academicYear === from ? { ...p, academicYear: nextLabel } : p)),
      );
      setStudentYearLedgers((prev) =>
        prev.map((l) => (l.academicYear === from ? { ...l, academicYear: nextLabel } : l)),
      );
      if (academicYear === from) {
        setAcademicYearState(nextLabel);
      }
      if (getApiToken()) {
        void apiSyncAcademicYears({
          academicYears: nextYears,
          academicYear: nextActive,
          closedAcademicYears: nextClosed,
          renameAcademicYear: { from, to: nextLabel },
        }).catch(() => {
          /* local rename kept */
        });
      }
      return { ok: true };
    },
    [academicYear, academicYears, closedAcademicYears],
  );

  const setAcademicYearClosed = useCallback(
    (year: string, closed: boolean) => {
      if (!academicYears.includes(year)) {
        return { ok: false, reason: "Year not found" };
      }
      if (!closed) {
        const nextClosed = closedAcademicYears.filter((y) => y !== year);
        setClosedAcademicYears(nextClosed);
        if (getApiToken()) {
          void apiSyncAcademicYears({
            academicYears,
            academicYear,
            closedAcademicYears: nextClosed,
          }).catch(() => {});
        }
        return { ok: true };
      }

      const openCandidates = academicYears.filter(
        (y) => y !== year && !closedAcademicYears.includes(y),
      );
      if (academicYear === year) {
        if (openCandidates.length === 0) {
          return {
            ok: false,
            reason: "Open another year before closing the only open books",
          };
        }
        const nextActive = openCandidates[0]!;
        const nextClosed = Array.from(new Set([...closedAcademicYears, year]));
        setClosedAcademicYears(nextClosed);
        setAcademicYear(nextActive);
        if (getApiToken()) {
          void apiSyncAcademicYears({
            academicYears,
            academicYear: nextActive,
            closedAcademicYears: nextClosed,
          }).catch(() => {});
        }
        return { ok: true };
      }

      const nextClosed = Array.from(new Set([...closedAcademicYears, year]));
      setClosedAcademicYears(nextClosed);
      if (getApiToken()) {
        void apiSyncAcademicYears({
          academicYears,
          academicYear,
          closedAcademicYears: nextClosed,
        }).catch(() => {});
      }
      return { ok: true };
    },
    [academicYear, academicYears, closedAcademicYears, setAcademicYear],
  );

  const canDeleteAcademicYear = useCallback(
    (year: string) => {
      if (!academicYears.includes(year)) {
        return { ok: false, reason: "Year not found" };
      }
      if (academicYears.length <= 1) {
        return { ok: false, reason: "Keep at least one financial year" };
      }
      return { ok: true };
    },
    [academicYears],
  );

  const deleteAcademicYear = useCallback(
    (year: string) => {
      const check = canDeleteAcademicYear(year);
      if (!check.ok) return false;
      const removedTerms = feeTerms.filter((t) => t.academicYear === year);
      const nextYears = academicYears.filter((y) => y !== year);
      const nextClosed = closedAcademicYears.filter((y) => y !== year);
      const nextActive =
        academicYear === year
          ? (nextYears.find((y) => !nextClosed.includes(y)) ?? nextYears[0] ?? academicYear)
          : academicYear;
      setAcademicYears(nextYears);
      setClosedAcademicYears(nextClosed);
      // Hard delete: wipe year-scoped books data locally.
      setFeeTerms((prev) => prev.filter((t) => t.academicYear !== year));
      setStudentFeeBreaks((prev) => prev.filter((b) => b.academicYear !== year));
      setStudentYearLedgers((prev) => prev.filter((l) => l.academicYear !== year));
      setPayments((prev) => prev.filter((p) => p.academicYear !== year));
      if (academicYear === year && nextActive) {
        setAcademicYearState(nextActive);
      }
      if (getApiToken()) {
        void (async () => {
          try {
            // Server sync removes the year and cascades fee terms / receipts / enrollments.
            await apiSyncAcademicYears({
              academicYears: nextYears,
              academicYear: nextActive,
              closedAcademicYears: nextClosed,
            });
            for (const term of removedTerms) {
              await apiDeleteFeeTerm(term.id);
            }
          } catch {
            /* local snapshot kept */
          }
        })();
      }
      return true;
    },
    [academicYear, academicYears, canDeleteAcademicYear, closedAcademicYears, feeTerms],
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
      if (getApiToken()) {
        void apiSyncStudentYearFields([
          {
            studentId,
            academicYear,
            cls: fields.cls,
            due: fields.due,
            active: fields.active !== false,
          },
        ]).catch(() => {
          /* local ledger kept */
        });
      }
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
      upsertStudentInSnapshot(enrolled, { academicYear, fields });
      if (getApiToken()) {
        void apiSyncStudentYearFields([
          {
            studentId: enrolled.id,
            academicYear,
            cls: fields.cls,
            due: fields.due,
            active: fields.active !== false,
          },
        ]).catch(() => {
          /* local ledger kept */
        });
      }
      return enrolled;
    },
    [academicYear],
  );

  const resetTenant = () => {
    setStudents(SEED_STUDENTS);
    setStaff(SEED_STAFF);
    setPayments(SEED_PAYMENTS);
    setDepartments(SEED_DEPARTMENTS);
    setLeaveTypes([]);
    setRoles(SEED_ROLES);
    setTenantUsers(SEED_TENANT_USERS);
    setClasses(SEED_CLASSES);
    setTransportRoutes(SEED_TRANSPORT);
    setTransportVehicles(SEED_VEHICLES);
    setPaymentCategories(SEED_PAYMENT_CATEGORIES);
    setFeeTerms(SEED_FEE_TERMS);
    setStudentFeeBreaks([]);
    setStudentYearLedgers(SEED_STUDENT_YEAR_LEDGERS);
    setAcademicYears([...SEED_ACADEMIC_YEARS]);
    setClosedAcademicYears([]);
    setAcademicYearState(SEED_ACADEMIC_YEAR);
    setThemeSettings(SEED_THEME_SETTINGS);
    setSchoolDetails(SEED_SCHOOL_DETAILS);
    setDashboardTodos([...DEFAULT_DASHBOARD_TODOS]);
    setDashboardNote("");
    setNotifications([...SEED_NOTIFICATIONS]);
    setBranches([...SEED_BRANCHES]);
    setActiveBranchIdState(SEED_BRANCHES[0]?.id ?? "");
    writeSnapshot({
      students: SEED_STUDENTS,
      staff: SEED_STAFF,
      payments: SEED_PAYMENTS,
      departments: SEED_DEPARTMENTS,
      leaveTypes: [],
      roles: SEED_ROLES,
      classes: SEED_CLASSES,
      transportRoutes: SEED_TRANSPORT,
      transportVehicles: SEED_VEHICLES,
      paymentCategories: SEED_PAYMENT_CATEGORIES,
      feeTerms: SEED_FEE_TERMS,
      studentFeeBreaks: [],
      studentYearLedgers: SEED_STUDENT_YEAR_LEDGERS,
      academicYears: [...SEED_ACADEMIC_YEARS],
      closedAcademicYears: [],
      academicYear: SEED_ACADEMIC_YEAR,
      themeSettings: SEED_THEME_SETTINGS,
      schoolDetails: SEED_SCHOOL_DETAILS,
      dashboardTodos: [...DEFAULT_DASHBOARD_TODOS],
      dashboardNote: "",
      notifications: [...SEED_NOTIFICATIONS],
      tenantUsers: SEED_TENANT_USERS,
      branches: [...SEED_BRANCHES],
      activeBranchId: SEED_BRANCHES[0]?.id ?? "",
    });
  };

  const activeBranch = useMemo(
    () => branches.find((b) => b.id === activeBranchId) ?? branches[0] ?? null,
    [branches, activeBranchId],
  );

  const openBranch = useCallback(
    async (branchId: string) => {
      const nextId = branchId.trim();
      const target = branches.find((b) => b.id === nextId);
      if (!nextId || !target) {
        return { students: 0, receipts: 0 };
      }

      const thisSwitch = ++branchSwitchSeq.current;
      setBranchContext(tenantId ?? null, nextId);
      setActiveBranchIdState(nextId);
      setBranchSyncing(true);
      setStudents([]);
      setStaff([]);
      setPayments([]);
      setStudentYearLedgers([]);
      setDashboardTodos([...DEFAULT_DASHBOARD_TODOS]);
      setDashboardNote("");

      if (!getApiToken()) {
        setBranchSyncing(false);
        return { students: 0, receipts: 0 };
      }

      void apiSyncActiveBranch(nextId).catch(() => {
        /* keep local campus; next hydrate may overwrite */
      });

      try {
        const operational = await fetchBranchOperationalBundle();
        if (thisSwitch !== branchSwitchSeq.current) {
          return { students: 0, receipts: 0 };
        }

        if (operational) {
          const ledgers = reconcileLedgersWithStudents(
            operational.students,
            operational.studentYearLedgers,
            academicYear,
          );
          const missingYearEntries = yearFieldEntriesMissingFrom(
            operational.studentYearLedgers,
            ledgers,
          );
          if (missingYearEntries.length > 0) {
            void apiSyncStudentYearFields(missingYearEntries).catch(() => {
              /* local reconcile still applied */
            });
          }
          applyBranchOperationalData({
            students: operational.students,
            staff: operational.staff,
            payments: operational.payments,
            studentYearLedgers: ledgers,
            dashboardTodos: operational.dashboardTodos,
            dashboardNote: operational.dashboardNote,
            activeBranchId: nextId,
            studentFeeBreaks: operational.studentFeeBreaks,
          });

          const stats = {
            students: operational.students.filter((s) => !s.deletedAt).length,
            receipts: academicYearBookStats({
              payments: operational.payments,
              ledgers,
              year: academicYear,
            }).receipts,
          };

          if (thisSwitch === branchSwitchSeq.current) {
            setBranchSyncing(false);
          }

          void (async () => {
            try {
              const remote = await fetchRemoteTenantBundle(undefined, {
                force: true,
                tenantId,
              });
              if (thisSwitch !== branchSwitchSeq.current || !remote) return;

              applySnapshot({
                students: remote.students,
                staff: remote.staff,
                payments: remote.payments,
                departments: remote.departments,
                leaveTypes: remote.leaveTypes,
                roles: remote.roles,
                classes: remote.classes,
                transportRoutes: remote.transportRoutes,
                transportVehicles: remote.transportVehicles,
                paymentCategories: remote.paymentCategories,
                feeTerms: remote.feeTerms,
                studentFeeBreaks: remote.studentFeeBreaks ?? [],
                studentYearLedgers: reconcileLedgersWithStudents(
                  remote.students,
                  remote.studentYearLedgers,
                  remote.academicYear,
                ),
                academicYears: remote.academicYears,
                closedAcademicYears: remote.closedAcademicYears ?? [],
                academicYear: remote.academicYear,
                themeSettings: remote.themeSettings,
                schoolDetails: {
                  ...remote.schoolDetails,
                  name:
                    remote.schoolDetails.name?.trim() ||
                    tenantNameRef.current?.trim() ||
                    remote.schoolDetails.name,
                },
                dashboardTodos: remote.dashboardTodos,
                dashboardNote: remote.dashboardNote,
                notifications: remote.notifications,
                tenantUsers: remote.tenantUsers,
                branches: remote.branches.length ? remote.branches : branchesRef.current,
                activeBranchId: nextId,
              });
            } catch {
              /* keep phase 1 operational data */
            }
          })();

          return stats;
        }
      } catch {
        /* keep cleared campus data */
      } finally {
        if (thisSwitch === branchSwitchSeq.current) {
          setBranchSyncing(false);
        }
      }

      return { students: 0, receipts: 0 };
    },
    [academicYear, applyBranchOperationalData, applySnapshot, branches, tenantId],
  );

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
      leaveTypes,
      setLeaveTypes,
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
      studentFeeBreaks,
      setStudentFeeBreaks,
      studentYearLedgers,
      setStudentYearLedgers,
      academicYears,
      setAcademicYears,
      closedAcademicYears,
      academicYear,
      setAcademicYear,
      openAcademicYear,
      addAcademicYear,
      renameAcademicYear,
      setAcademicYearClosed,
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
      hydrated,
      branchSyncing,
      branches,
      setBranches,
      activeBranchId,
      activeBranch,
      openBranch,
    }),
    [
      students,
      activeStudents,
      staff,
      payments,
      activePayments,
      departments,
      leaveTypes,
      roles,
      tenantUsers,
      classes,
      transportRoutes,
      transportVehicles,
      paymentCategories,
      feeTerms,
      activeFeeTerms,
      studentFeeBreaks,
      studentYearLedgers,
      academicYears,
      closedAcademicYears,
      academicYear,
      setAcademicYear,
      openAcademicYear,
      addAcademicYear,
      renameAcademicYear,
      setAcademicYearClosed,
      canDeleteAcademicYear,
      deleteAcademicYear,
      enrollStudentInActiveYear,
      admitStudentToActiveYear,
      themeSettings,
      schoolDetails,
      dashboardTodos,
      dashboardNote,
      notifications,
      hydrated,
      branchSyncing,
      branches,
      activeBranchId,
      activeBranch,
      openBranch,
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
