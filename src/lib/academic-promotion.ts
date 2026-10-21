/**
 * Year-end class placement.
 *
 * Promotion writes the next academic year's enrollment only. The open year's
 * class, dues, and receipts stay on that year's ledger.
 */
import {
  academicYearStartYear,
  addMonthsToMonthKey,
  formatBooksRangeLabel,
  monthKeyToBooksYearLabel,
  parseAcademicYearBounds,
} from "@/lib/academic-year";

export type PlacementDecision = "promote" | "repeat" | "demote" | "graduate" | "keep";

export type YearPlacementEntry = {
  studentId: string;
  cls: string;
  active: boolean;
  remove?: boolean;
};

export type PlacementChoice = {
  decision: PlacementDecision;
  /** Catalog class name chosen when the same section does not exist. */
  targetClass?: string;
};

export type PromotionClassInput = {
  className: string;
  grade?: string;
  section?: string;
};

type ClassRef = {
  className: string;
  grade: string;
  section: string;
};

export type PlacementStudent = {
  id: string;
  name: string;
  cls: string;
  active?: boolean;
};

export type PlacementDraft = {
  studentId: string;
  studentName: string;
  active: boolean;
  sourceClass: string;
  existingTargetClass: string;
  decision: PlacementDecision;
  targetClass: string;
  sectionOptions: string[];
  needsSection: boolean;
  ready: boolean;
  reason: string;
};

export type PlacementSummary = {
  promote: number;
  repeat: number;
  demote: number;
  graduate: number;
  keep: number;
  pending: number;
  writes: number;
};

export const PLACEMENT_DECISION_LABEL: Record<PlacementDecision, string> = {
  promote: "Promote",
  repeat: "Repeat",
  demote: "Demote",
  graduate: "Graduate",
  keep: "Keep",
};

const PRE_PRIMARY = [
  "playgroup",
  "playschool",
  "play school",
  "nursery",
  "pre-kg",
  "pre kg",
  "prekg",
  "lkg",
  "ukg",
  "kg",
  "kindergarten",
  "prep",
];

/** Longest tokens first so "viii" is not read as "v". */
const ROMAN: Array<[string, number]> = [
  ["xii", 12],
  ["xi", 11],
  ["ix", 9],
  ["viii", 8],
  ["vii", 7],
  ["vi", 6],
  ["iv", 4],
  ["iii", 3],
  ["ii", 2],
  ["x", 10],
  ["v", 5],
  ["i", 1],
];

function norm(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function splitClassLabel(className: string): { grade: string; section: string } {
  const dash = className.lastIndexOf(" - ");
  if (dash === -1) return { grade: className.trim(), section: "" };
  return {
    grade: className.slice(0, dash).trim(),
    section: className.slice(dash + 3).trim(),
  };
}

function romanValue(grade: string): number | null {
  const stripped = norm(grade).replace(/^(class|grade|std|standard)\s+/, "");
  for (const [token, value] of ROMAN) {
    if (stripped === token) return value;
  }
  return null;
}

function numericValue(grade: string): number | null {
  const match = grade.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

type GradeKey = { bucket: number; rank: number; label: string };

/** Pre-primary, then Roman, then the number in labels such as "Grade 8". */
function gradeKey(grade: string): GradeKey {
  const label = grade.trim();
  const folded = norm(label);
  const pre = PRE_PRIMARY.indexOf(folded);
  if (pre >= 0) return { bucket: 0, rank: pre, label };
  const roman = romanValue(label);
  if (roman != null) return { bucket: 1, rank: roman, label };
  const numeric = numericValue(label);
  if (numeric != null) return { bucket: 2, rank: numeric, label };
  return { bucket: 3, rank: 0, label };
}

function compareGrades(a: string, b: string): number {
  const left = gradeKey(a);
  const right = gradeKey(b);
  if (left.bucket !== right.bucket) return left.bucket - right.bucket;
  if (left.bucket === 3 || left.rank === right.rank) {
    return left.label.localeCompare(right.label, undefined, { numeric: true, sensitivity: "base" });
  }
  return left.rank - right.rank;
}

function toClassRefs(classes: PromotionClassInput[]): ClassRef[] {
  const seen = new Map<string, ClassRef>();
  for (const item of classes) {
    const className = item.className.trim();
    if (!className) continue;
    const fromName = splitClassLabel(className);
    const gradeField = (item.grade ?? "").trim();
    const sectionField = (item.section ?? "").trim();
    const ref: ClassRef = {
      className,
      grade: !gradeField || gradeField.includes(" - ") ? fromName.grade : gradeField,
      section: sectionField || fromName.section,
    };
    const key = norm(ref.className);
    if (!seen.has(key)) seen.set(key, ref);
  }
  return [...seen.values()];
}

function orderedGrades(catalog: ClassRef[]): string[] {
  const seen = new Map<string, string>();
  for (const item of catalog) {
    const grade = item.grade.trim();
    if (!grade) continue;
    const key = norm(grade);
    if (!seen.has(key)) seen.set(key, grade);
  }
  return [...seen.values()].sort(compareGrades);
}

/**
 * Next or previous grade among classes that exist in the target year.
 * A missing step (no Grade 7 between 6 and 8) uses the neighboring grade that does exist.
 */
function neighborGrade(catalog: ClassRef[], sourceGrade: string, direction: 1 | -1): string | null {
  const ordered = orderedGrades(catalog);
  if (!ordered.length || !sourceGrade.trim()) return null;
  const index = ordered.findIndex((grade) => norm(grade) === norm(sourceGrade));
  if (index >= 0) return ordered[index + direction] ?? null;
  const source = gradeKey(sourceGrade);
  if (direction === 1) {
    return ordered.find((grade) => compareGrades(grade, source.label) > 0) ?? null;
  }
  const earlier = ordered.filter((grade) => compareGrades(grade, source.label) < 0);
  return earlier.length ? earlier[earlier.length - 1] : null;
}

function classesInGrade(catalog: ClassRef[], grade: string): ClassRef[] {
  const key = norm(grade);
  return catalog
    .filter((item) => norm(item.grade) === key)
    .sort((a, b) => a.section.localeCompare(b.section, undefined, { numeric: true }) || a.className.localeCompare(b.className));
}

function sameSection(catalog: ClassRef[], grade: string, section: string): {
  className: string;
  options: string[];
  needsSection: boolean;
  gradeExists: boolean;
} {
  const matches = classesInGrade(catalog, grade);
  const options = matches.map((item) => item.className);
  if (!matches.length) {
    return { className: "", options: [], needsSection: false, gradeExists: false };
  }
  const sectionKey = norm(section);
  if (sectionKey) {
    const found = matches.find((item) => norm(item.section) === sectionKey);
    if (found) return { className: found.className, options, needsSection: false, gradeExists: true };
  }
  const unsectioned = matches.find((item) => !item.section);
  if (matches.length === 1 && unsectioned) {
    return { className: unsectioned.className, options, needsSection: false, gradeExists: true };
  }
  return { className: "", options, needsSection: true, gradeExists: true };
}

function canonicalClass(options: string[], picked: string): string {
  const key = norm(picked);
  return options.find((option) => norm(option) === key) ?? "";
}

type ResolvedDestination = {
  targetClass: string;
  sectionOptions: string[];
  needsSection: boolean;
  ready: boolean;
  reason: string;
};

function destinationFor(
  sourceClass: string,
  decision: Exclude<PlacementDecision, "keep" | "graduate">,
  catalog: ClassRef[],
  manualClass?: string,
): ResolvedDestination {
  const source = splitClassLabel(sourceClass);
  if (!source.grade) {
    return {
      targetClass: "",
      sectionOptions: [],
      needsSection: false,
      ready: false,
      reason: "No class this year",
    };
  }
  const grade =
    decision === "repeat"
      ? source.grade
      : neighborGrade(catalog, source.grade, decision === "promote" ? 1 : -1);
  if (!grade) {
    return {
      targetClass: "",
      sectionOptions: [],
      needsSection: false,
      ready: false,
      reason: decision === "promote" ? "No higher grade" : "No lower grade",
    };
  }
  const placed = sameSection(catalog, grade, source.section);
  if (!placed.gradeExists) {
    return {
      targetClass: "",
      sectionOptions: [],
      needsSection: false,
      ready: false,
      reason: `${grade} is not in the next year`,
    };
  }
  const manual = manualClass ? canonicalClass(placed.options, manualClass) : "";
  if (manual) {
    return {
      targetClass: manual,
      sectionOptions: placed.options,
      needsSection: false,
      ready: true,
      reason: "",
    };
  }
  if (placed.needsSection) {
    return {
      targetClass: "",
      sectionOptions: placed.options,
      needsSection: true,
      ready: false,
      reason: "Choose a section",
    };
  }
  return {
    targetClass: placed.className,
    sectionOptions: placed.options,
    needsSection: false,
    ready: true,
    reason: "",
  };
}

function isStudentActive(active: boolean | undefined): boolean {
  return active !== false;
}

/**
 * Build one placement row.
 * Already enrolled students default to Keep so a second run does not move them.
 * A student with no higher grade defaults to Graduate.
 */
export function resolvePlacement(input: {
  student: PlacementStudent;
  catalog: ClassRef[];
  existingTargetClass?: string;
  choice?: PlacementChoice;
}): PlacementDraft {
  const existingTargetClass = (input.existingTargetClass ?? "").trim();
  const sourceClass = input.student.cls.trim();
  const base = {
    studentId: input.student.id,
    studentName: input.student.name,
    active: isStudentActive(input.student.active),
    sourceClass,
    existingTargetClass,
  };
  const explicit = input.choice?.decision;
  const decision: PlacementDecision =
    explicit ?? (existingTargetClass ? "keep" : "promote");

  if (decision === "keep") {
    if (!existingTargetClass) {
      return {
        ...base,
        decision,
        targetClass: "",
        sectionOptions: [],
        needsSection: false,
        ready: false,
        reason: "Not placed in the next year yet",
      };
    }
    return {
      ...base,
      decision,
      targetClass: existingTargetClass,
      sectionOptions: [],
      needsSection: false,
      ready: true,
      reason: "",
    };
  }

  if (decision === "graduate") {
    return {
      ...base,
      decision,
      targetClass: "",
      sectionOptions: [],
      needsSection: false,
      ready: true,
      reason: existingTargetClass ? "Removes the next-year class" : "No class next year",
    };
  }

  const resolved = destinationFor(sourceClass, decision, input.catalog, input.choice?.targetClass);
  if (!explicit && decision === "promote" && resolved.reason === "No higher grade") {
    return {
      ...base,
      decision: "graduate",
      targetClass: "",
      sectionOptions: [],
      needsSection: false,
      ready: true,
      reason: "No higher grade",
    };
  }
  return { ...base, decision, ...resolved };
}

/** Plan next-year classes for a directory selection or one student. */
export function planStudentPlacements(input: {
  students: PlacementStudent[];
  classes: PromotionClassInput[];
  existingByStudentId?: Record<string, string | undefined>;
  includeInactive?: boolean;
  choices?: Record<string, PlacementChoice | undefined>;
}): PlacementDraft[] {
  const catalog = toClassRefs(input.classes);
  const existing = input.existingByStudentId ?? {};
  const rows = input.students
    .filter((student) => input.includeInactive || isStudentActive(student.active))
    .map((student) =>
      resolvePlacement({
        student,
        catalog,
        existingTargetClass: existing[student.id],
        choice: input.choices?.[student.id],
      }),
    );
  rows.sort(
    (a, b) =>
      a.sourceClass.localeCompare(b.sourceClass, undefined, { numeric: true }) ||
      a.studentName.localeCompare(b.studentName, undefined, { sensitivity: "base" }),
  );
  return rows;
}

export function placementDecisionOptions(row: PlacementDraft): PlacementDecision[] {
  const options: PlacementDecision[] = ["promote", "repeat", "demote", "graduate"];
  if (row.existingTargetClass) options.unshift("keep");
  return options;
}

/** Rows that will change the target year. Keep, and graduate with no enrollment, are skipped. */
export function placementEntries(rows: PlacementDraft[]): YearPlacementEntry[] {
  const entries: YearPlacementEntry[] = [];
  for (const row of rows) {
    if (!row.ready || row.decision === "keep") continue;
    if (row.decision === "graduate") {
      if (row.existingTargetClass) {
        entries.push({
          studentId: row.studentId,
          cls: "",
          active: row.active,
          remove: true,
        });
      }
      continue;
    }
    if (!row.targetClass) continue;
    entries.push({
      studentId: row.studentId,
      cls: row.targetClass,
      active: row.active,
    });
  }
  return entries;
}

export function summarizePlacements(rows: PlacementDraft[]): PlacementSummary {
  const summary: PlacementSummary = {
    promote: 0,
    repeat: 0,
    demote: 0,
    graduate: 0,
    keep: 0,
    pending: 0,
    writes: 0,
  };
  for (const row of rows) {
    summary[row.decision] += 1;
    if (!row.ready) summary.pending += 1;
  }
  summary.writes = placementEntries(rows).length;
  return summary;
}

function yearKey(label: string): string {
  return label.trim().toLowerCase();
}

export function academicYearExists(label: string, years: string[]): boolean {
  const key = yearKey(label);
  return key.length > 0 && years.some((year) => yearKey(year) === key);
}

/** Stored label when the year already exists, otherwise the typed label. */
export function canonicalAcademicYearLabel(label: string, years: string[]): string {
  const found = years.find((year) => yearKey(year) === yearKey(label));
  return found ?? label.trim();
}

function synthesizeNextAcademicYearLabel(current: string): string | null {
  const trimmed = current.trim().replace(/\s+/g, " ");
  const ay = trimmed.match(/^(?:AY\s*)(\d{4})\s*[-–/]\s*(\d{2}|\d{4})$/i);
  if (ay) {
    const start = Number(ay[1]) + 1;
    const endRaw = ay[2];
    const end = (endRaw.length === 4 ? Number(endRaw) : 2000 + Number(endRaw)) + 1;
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    return `AY ${start}-${String(end).slice(-2)}`;
  }
  const bounds = parseAcademicYearBounds(trimmed);
  if (!bounds) return null;
  const nextStart = addMonthsToMonthKey(bounds.startDate.slice(0, 7), 12);
  const nextEnd = addMonthsToMonthKey(bounds.endDate.slice(0, 7), 12);
  if (!nextStart || !nextEnd) return null;
  if (/^(?:AY\s*)?(?:\d{4}\s+[A-Za-z]+|[A-Za-z]+\s+\d{4})$/.test(trimmed)) {
    return monthKeyToBooksYearLabel(nextStart);
  }
  return formatBooksRangeLabel(nextStart, nextEnd);
}

/**
 * The following academic year: the next year already on file, or a label one year on
 * (AY 2026-27 → AY 2027-28) when it has not been created yet.
 */
export function suggestNextAcademicYearLabel(current: string, years: string[]): string | null {
  const currentStart = academicYearStartYear(current);
  if (currentStart != null) {
    const later = years
      .map((label) => ({ label: label.trim(), start: academicYearStartYear(label) }))
      .filter(
        (row): row is { label: string; start: number } =>
          row.label.length > 0 &&
          yearKey(row.label) !== yearKey(current) &&
          row.start != null &&
          row.start > currentStart,
      )
      .sort((a, b) => a.start - b.start || a.label.localeCompare(b.label));
    if (later[0]) return later[0].label;
  }
  return synthesizeNextAcademicYearLabel(current);
}

/** Existing years after the source year, plus the suggested label when it is not created yet. */
export function targetAcademicYearOptions(sourceYear: string, years: string[]): string[] {
  const suggested = suggestNextAcademicYearLabel(sourceYear, years);
  const start = academicYearStartYear(sourceYear);
  const later = years.filter((year) => {
    if (yearKey(year) === yearKey(sourceYear)) return false;
    const yearStart = academicYearStartYear(year);
    if (start == null || yearStart == null) return true;
    return yearStart > start;
  });
  const options = [...later];
  if (suggested && !options.some((year) => yearKey(year) === yearKey(suggested))) {
    options.push(suggested);
  }
  return options;
}

export function compareAcademicYearLabels(a: string, b: string): number {
  const startA = academicYearStartYear(a);
  const startB = academicYearStartYear(b);
  if (startA != null && startB != null && startA !== startB) return startA - startB;
  return a.localeCompare(b);
}
