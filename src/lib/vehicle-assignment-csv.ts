import { cell, columnIndex, headerKey } from "@/lib/csv-import";
import { parseCsvText } from "@/lib/student-csv";
import {
  applyVehicleAssignment,
  assignmentFareForStudent,
  stopsForVehicle,
  type TransportAssignmentDraft,
} from "@/lib/transport-assignments";
import {
  resolveTransportFeeShift,
  type ClassConfig,
  type FeeTerm,
  type Student,
  type TransportFeeShift,
  type TransportRoute,
  type TransportVehicle,
} from "@/lib/tenant-store";

export const VEHICLE_ASSIGNMENT_CSV_HEADERS = [
  "AdmissionNo",
  "Name",
  "Assigned",
  "Boarding",
  "Dropping",
  "Shift",
] as const;

export type VehicleAssignmentCsvIssue = {
  line: number;
  rowLabel: string;
  message: string;
};

export type VehicleAssignmentCsvDraft = {
  line: number;
  admissionNo: string;
  name: string;
  assigned: boolean;
  boarding: string;
  dropping: string;
  shift: TransportFeeShift;
};

export type ParseVehicleAssignmentCsvResult =
  | { ok: true; drafts: VehicleAssignmentCsvDraft[]; issues: VehicleAssignmentCsvIssue[] }
  | { ok: false; error: string; description?: string; issues: VehicleAssignmentCsvIssue[] };

export type ResolvedVehicleAssignmentImport = {
  line: number;
  studentId: string;
  previewLabel: string;
  previewExtra: string;
  amount: number;
  alreadyOnThisBus: boolean;
  draft: TransportAssignmentDraft;
};

const ADMISSION_ALIASES = [
  "admission no",
  "admission no.",
  "admission number",
  "admission",
  "adm no",
  "admno",
  "student id",
  "studentid",
  "id",
];
const NAME_ALIASES = ["name", "student name", "student", "full name"];
const ASSIGNED_ALIASES = ["assigned", "on bus", "onbus", "active", "status"];
const BOARDING_ALIASES = [
  "boarding",
  "boarding stop",
  "pickup",
  "pick up",
  "bus point 1",
  "buspoint 1",
  "point 1",
  "from",
];
const DROPPING_ALIASES = [
  "dropping",
  "dropping stop",
  "drop",
  "drop off",
  "bus point 2",
  "buspoint 2",
  "point 2",
  "to",
];
const SHIFT_ALIASES = ["shift", "trip", "timing", "session"];

function looksLikeHeader(cells: string[]): boolean {
  const joined = cells.map(headerKey).join(" ");
  return /admission|adm|student|boarding|dropping|pickup|drop|assigned|shift/.test(joined);
}

function skipRow(cells: string[]): boolean {
  const joined = cells.map((c) => c.trim()).join("");
  return !joined || joined.startsWith("#");
}

function parseAssigned(raw: string, _hasStops: boolean): boolean {
  const v = headerKey(raw);
  if (!v) return true;
  if (/^(no|n|0|false|off|unassign|remove|out)$/.test(v)) return false;
  if (/^(yes|y|1|true|on|assign|in|active)$/.test(v)) return true;
  return true;
}

function parseShift(raw: string): TransportFeeShift | null {
  const v = headerKey(raw);
  if (!v) return "both";
  if (/^morn|^am\b|^a\.?m/.test(v) || v === "m") return "morning";
  if (/^even|^pm\b|^p\.?m/.test(v) || v === "e") return "evening";
  if (/^both|^full|^all|^return/.test(v) || v === "b") return "both";
  return null;
}

/** Match a CSV stop label to a known vehicle stop (exact, case-insensitive, or leading segment). */
export function matchStopLabel(raw: string, options: string[]): string {
  const input = raw.trim();
  if (!input) return "";
  const exact = options.find((o) => o === input);
  if (exact) return exact;
  const lower = input.toLowerCase();
  const ci = options.find((o) => o.toLowerCase() === lower);
  if (ci) return ci;
  const inputHead = input.split(",")[0]?.trim().toLowerCase() ?? lower;
  const byHead = options.find((o) => {
    const head = o.split(",")[0]?.trim().toLowerCase() ?? o.toLowerCase();
    return head === inputHead || o.toLowerCase().startsWith(inputHead);
  });
  if (byHead) return byHead;
  return input;
}

function findStudent(
  students: Student[],
  admissionNo: string,
  nameHint: string,
): Student | undefined {
  const key = admissionNo.trim().toLowerCase();
  if (key) {
    const byAdmission = students.find(
      (s) => (s.admissionNumber ?? "").trim().toLowerCase() === key,
    );
    if (byAdmission) return byAdmission;
    const byId = students.find((s) => s.id.trim().toLowerCase() === key);
    if (byId) return byId;
  }
  const name = nameHint.trim().toLowerCase();
  if (name) {
    const matches = students.filter((s) => s.name.trim().toLowerCase() === name);
    if (matches.length === 1) return matches[0];
  }
  return undefined;
}

export function vehicleAssignmentCsvTemplateRows(
  stops?: { pickups: string[]; drops: string[] },
): (string | number)[][] {
  const boarding = stops?.pickups[0] || "Kondotty Bus Stop";
  const dropping = stops?.drops[0] || stops?.pickups[1] || "Main Campus";
  return [
    ["MPS/2025/1001", "Aarav Menon", "Yes", boarding, dropping, "Both"],
    ["MPS/2025/1002", "Diya Nair", "Yes", boarding, dropping, "Morning"],
    ["MPS/2025/1003", "Example Student", "No", "", "", "Both"],
  ];
}

export function vehicleAssignmentCsvDemoRows(
  stops?: { pickups: string[]; drops: string[] },
): (string | number)[][] {
  const pickups = stops?.pickups?.length
    ? stops.pickups
    : ["Kondotty Bus Stop", "University Junction", "Feroke Town"];
  const drops = stops?.drops?.length ? stops.drops : ["Main Campus", "Chelembra Gate"];
  const b0 = pickups[0] ?? "Kondotty Bus Stop";
  const b1 = pickups[1] ?? b0;
  const d0 = drops[0] ?? "Main Campus";
  return [
    ["MPS/2025/1001", "Aarav Menon", "Yes", b0, d0, "Both"],
    ["MPS/2025/1002", "Diya Nair", "Yes", b1, d0, "Morning"],
    ["MPS/2025/1004", "Kabir Hussain", "Yes", b0, d0, "Evening"],
    ["MPS/2025/1005", "Meera Joseph", "No", "", "", "Both"],
  ];
}

export function vehicleAssignmentToCsvRow(student: Student): (string | number)[] {
  const shift = resolveTransportFeeShift(student);
  return [
    student.admissionNumber || student.id,
    student.name,
    "Yes",
    student.busPoint1 ?? "",
    student.busPoint2 ?? "",
    shift === "morning" ? "Morning" : shift === "evening" ? "Evening" : "Both",
  ];
}

export function parseVehicleAssignmentCsv(text: string): ParseVehicleAssignmentCsvResult {
  const table = parseCsvText(text);
  if (!table.length) {
    return {
      ok: false,
      error: "CSV is empty",
      description: "Download the bus roster template, fill admission numbers and stops, then upload",
      issues: [],
    };
  }

  const headerCells = table[0] ?? [];
  if (!looksLikeHeader(headerCells)) {
    return {
      ok: false,
      error: "Missing bus roster header row",
      description:
        "First row must include AdmissionNo (and Boarding / Dropping / Shift). Use Download template.",
      issues: [],
    };
  }

  const headers = headerCells;
  const admissionIdx = columnIndex(headers, ADMISSION_ALIASES);
  const nameIdx = columnIndex(headers, NAME_ALIASES);
  const assignedIdx = columnIndex(headers, ASSIGNED_ALIASES);
  const boardingIdx = columnIndex(headers, BOARDING_ALIASES);
  const droppingIdx = columnIndex(headers, DROPPING_ALIASES);
  const shiftIdx = columnIndex(headers, SHIFT_ALIASES);

  if (admissionIdx < 0 && nameIdx < 0) {
    return {
      ok: false,
      error: "AdmissionNo column required",
      description: "Add an AdmissionNo (or Student ID) column so rows can match the roster",
      issues: [],
    };
  }

  const drafts: VehicleAssignmentCsvDraft[] = [];
  const issues: VehicleAssignmentCsvIssue[] = [];

  for (let i = 1; i < table.length; i += 1) {
    const cells = table[i] ?? [];
    if (skipRow(cells)) continue;
    const line = i + 1;
    const admissionNo = cell(cells, admissionIdx);
    const name = cell(cells, nameIdx);
    const boarding = cell(cells, boardingIdx);
    const dropping = cell(cells, droppingIdx);
    const assignedRaw = cell(cells, assignedIdx);
    const shiftRaw = cell(cells, shiftIdx);
    const rowLabel = admissionNo || name || `Line ${line}`;

    if (!admissionNo && !name) {
      issues.push({ line, rowLabel, message: "Missing admission number and name" });
      continue;
    }

    const shift = parseShift(shiftRaw);
    if (shift === null) {
      issues.push({
        line,
        rowLabel,
        message: `Unknown shift "${shiftRaw}" · use Morning, Evening, or Both`,
      });
      continue;
    }

    const assigned = parseAssigned(assignedRaw, Boolean(boarding || dropping));
    drafts.push({
      line,
      admissionNo,
      name,
      assigned,
      boarding,
      dropping,
      shift,
    });
  }

  if (!drafts.length && !issues.length) {
    return {
      ok: false,
      error: "No data rows found",
      description: "Add at least one student row under the header",
      issues: [],
    };
  }

  return { ok: true, drafts, issues };
}

export function resolveVehicleAssignmentImport(
  drafts: VehicleAssignmentCsvDraft[],
  opts: {
    vehicle: TransportVehicle;
    students: Student[];
    routes: TransportRoute[];
    vehicles: TransportVehicle[];
    classes: ClassConfig[];
    feeTerms: FeeTerm[];
  },
): { ready: ResolvedVehicleAssignmentImport[]; issues: VehicleAssignmentCsvIssue[] } {
  const { vehicle, students, routes, vehicles, classes, feeTerms } = opts;
  const live = students.filter((s) => !s.deletedAt && s.active !== false);
  const { pickups, drops } = stopsForVehicle(vehicle, routes);
  const ready: ResolvedVehicleAssignmentImport[] = [];
  const issues: VehicleAssignmentCsvIssue[] = [];
  const seen = new Set<string>();

  for (const row of drafts) {
    const rowLabel = row.admissionNo || row.name || `Line ${row.line}`;
    const student = findStudent(live, row.admissionNo, row.name);
    if (!student) {
      issues.push({
        line: row.line,
        rowLabel,
        message: row.admissionNo
          ? `No student matched admission "${row.admissionNo}"`
          : `No unique student matched name "${row.name}"`,
      });
      continue;
    }
    if (seen.has(student.id)) {
      issues.push({
        line: row.line,
        rowLabel: student.name,
        message: "Duplicate row for the same student in this file",
      });
      continue;
    }
    seen.add(student.id);

    const boarding = row.assigned ? matchStopLabel(row.boarding, pickups) : "";
    const dropping = row.assigned ? matchStopLabel(row.dropping, drops) : "";
    const shift: TransportFeeShift = row.assigned
      ? row.shift ||
        resolveTransportFeeShift({ busPoint1: boarding, busPoint2: dropping })
      : "both";

    const draft: TransportAssignmentDraft = {
      studentId: student.id,
      assigned: row.assigned,
      busPoint1: boarding,
      busPoint2: dropping,
      transportShift: shift,
    };

    const preview = applyVehicleAssignment(student, vehicle.id, draft);
    const classConfig = classes.find((c) => c.className === student.cls);
    const amount = draft.assigned
      ? assignmentFareForStudent(preview, routes, vehicles, classConfig, feeTerms) ?? 0
      : 0;

    const otherBus =
      student.vehicleId && student.vehicleId !== vehicle.id
        ? vehicles.find((v) => v.id === student.vehicleId)
        : null;

    const stopBits = [
      draft.assigned ? (boarding ? `Pick ${boarding.split(",")[0]}` : "No boarding") : "Unassign",
      draft.assigned ? (dropping ? `Drop ${dropping.split(",")[0]}` : "No drop") : null,
      draft.assigned
        ? shift === "morning"
          ? "Morning"
          : shift === "evening"
            ? "Evening"
            : "Both"
        : null,
      otherBus ? `from ${otherBus.name}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    ready.push({
      line: row.line,
      studentId: student.id,
      previewLabel: `${student.name}${student.admissionNumber ? ` · ${student.admissionNumber}` : ""}`,
      previewExtra: stopBits,
      amount,
      alreadyOnThisBus: student.vehicleId === vehicle.id && row.assigned,
      draft,
    });
  }

  return { ready, issues };
}
