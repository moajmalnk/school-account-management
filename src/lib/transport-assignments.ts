import {
  findTransportRouteForStudent,
  normalizeStudent,
  resolveTransportFeeForStudent,
  resolveTransportFeeShift,
  studentNeedsTransport,
  type ClassConfig,
  type FeeTerm,
  type Student,
  type TransportFeeShift,
  type TransportRoute,
  type TransportVehicle,
} from "@/lib/tenant-store";

export type TransportAssignmentDraft = {
  studentId: string;
  assigned: boolean;
  busPoint1: string;
  busPoint2: string;
  transportShift: TransportFeeShift;
};

export function stopsForVehicle(
  vehicle: TransportVehicle | undefined,
  routes: TransportRoute[],
): { pickups: string[]; drops: string[] } {
  const scoped =
    vehicle && vehicle.routeIds.length > 0
      ? routes.filter((route) => vehicle.routeIds.includes(route.id))
      : routes;
  const pickups = Array.from(
    new Set(scoped.map((r) => r.mapFrom.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const drops = Array.from(
    new Set(scoped.map((r) => r.mapTo.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  return { pickups, drops: drops.length > 0 ? drops : pickups };
}

export function studentsOnVehicle(students: Student[], vehicleId: string): Student[] {
  const id = vehicleId.trim();
  if (!id) return [];
  return students.filter(
    (s) => !s.deletedAt && s.vehicleId === id && studentNeedsTransport(s),
  );
}

export function vehicleAssignedCount(students: Student[], vehicleId: string): number {
  return studentsOnVehicle(students, vehicleId).length;
}

export function transportShiftLabel(shift: TransportFeeShift): string {
  if (shift === "morning") return "Morning";
  if (shift === "evening") return "Evening";
  return "Both";
}

export function assignmentFareForStudent(
  student: Pick<
    Student,
    | "needsBus"
    | "busPoint1"
    | "busPoint2"
    | "vehicleId"
    | "transportShift"
    | "cls"
    | "hasConcession"
    | "concessionFees"
  >,
  routes: TransportRoute[],
  vehicles: TransportVehicle[],
  classConfig?: Pick<ClassConfig, "vehicleFeeAmount">,
  feeTerms: FeeTerm[] = [],
): number | undefined {
  return resolveTransportFeeForStudent(
    student,
    routes,
    classConfig,
    undefined,
    feeTerms,
    vehicles,
  ).amount;
}

/** Build the student patch for assigning/unassigning on a specific bus. */
export function applyVehicleAssignment(
  student: Student,
  vehicleId: string,
  draft: Omit<TransportAssignmentDraft, "studentId">,
): Student {
  if (!draft.assigned) {
    const clearingThisBus = !student.vehicleId || student.vehicleId === vehicleId;
    if (!clearingThisBus) return student;
    return normalizeStudent({
      ...student,
      needsBus: false,
      vehicleId: undefined,
      transportShift: undefined,
      busPoint1: undefined,
      busPoint2: undefined,
    });
  }

  const shift =
    draft.transportShift === "morning" ||
    draft.transportShift === "evening" ||
    draft.transportShift === "both"
      ? draft.transportShift
      : resolveTransportFeeShift({
          busPoint1: draft.busPoint1,
          busPoint2: draft.busPoint2,
        });

  return normalizeStudent({
    ...student,
    needsBus: true,
    vehicleId,
    busPoint1: draft.busPoint1.trim() || undefined,
    busPoint2: draft.busPoint2.trim() || undefined,
    transportShift: shift,
  });
}

export function draftFromStudent(
  student: Student,
  vehicleId: string,
): TransportAssignmentDraft {
  const assigned = student.vehicleId === vehicleId;
  return {
    studentId: student.id,
    assigned,
    busPoint1: assigned ? (student.busPoint1 ?? "") : "",
    busPoint2: assigned ? (student.busPoint2 ?? "") : "",
    transportShift: assigned
      ? resolveTransportFeeShift(student)
      : "both",
  };
}

export function routeLabelForStudent(
  student: Pick<Student, "needsBus" | "busPoint1" | "busPoint2" | "vehicleId">,
  routes: TransportRoute[],
  vehicles: TransportVehicle[],
): string {
  const route = findTransportRouteForStudent(student, routes, vehicles);
  if (!route) return "—";
  return `${route.mapFrom} → ${route.mapTo}`;
}
