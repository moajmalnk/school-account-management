import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bus,
  ChevronLeft,
  Loader2,
  Save,
  Search,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiUpsertStudent } from "@/lib/api/records";
import { getApiToken } from "@/lib/api/client";
import { formatMoney } from "@/lib/money";
import {
  applyVehicleAssignment,
  assignmentFareForStudent,
  draftFromStudent,
  stopsForVehicle,
  transportShiftLabel,
  vehicleAssignedCount,
  type TransportAssignmentDraft,
} from "@/lib/transport-assignments";
import {
  splitClassName,
  upsertStudentInSnapshot,
  useTenantStore,
  type Student,
  type TransportFeeShift,
  type TransportRoute,
  type TransportVehicle,
} from "@/lib/tenant-store";
import { cn, glassCardClass } from "@/lib/utils";

type VehicleStudentAssignmentsProps = {
  vehicle: TransportVehicle;
  routes: TransportRoute[];
  onBack: () => void;
};

function classGrade(cls: string): string {
  return splitClassName(cls).grade || cls.trim() || "—";
}

function classDivision(cls: string): string {
  return splitClassName(cls).section || "—";
}

export function VehicleStudentAssignments({
  vehicle,
  routes,
  onBack,
}: VehicleStudentAssignmentsProps) {
  const { students, setStudents, classes, transportVehicles, activeFeeTerms } = useTenantStore();
  const [query, setQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [assignedOnly, setAssignedOnly] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, TransportAssignmentDraft>>({});

  const liveStudents = useMemo(
    () => students.filter((s) => !s.deletedAt && s.active !== false),
    [students],
  );

  const stops = useMemo(() => stopsForVehicle(vehicle, routes), [vehicle, routes]);

  useEffect(() => {
    const next: Record<string, TransportAssignmentDraft> = {};
    for (const student of liveStudents) {
      next[student.id] = draftFromStudent(student, vehicle.id);
    }
    setDrafts(next);
  }, [liveStudents, vehicle.id]);

  const grades = useMemo(() => {
    const set = new Set<string>();
    for (const s of liveStudents) {
      const g = classGrade(s.cls);
      if (g && g !== "—") set.add(g);
    }
    for (const c of classes) {
      const g = (c.grade || splitClassName(c.className).grade || "").trim();
      if (g) set.add(g);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [liveStudents, classes]);

  const divisions = useMemo(() => {
    const set = new Set<string>();
    for (const s of liveStudents) {
      if (gradeFilter !== "all" && classGrade(s.cls) !== gradeFilter) continue;
      const d = classDivision(s.cls);
      if (d && d !== "—") set.add(d);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [liveStudents, gradeFilter]);

  useEffect(() => {
    setDivisionFilter("all");
  }, [gradeFilter]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return liveStudents
      .filter((s) => {
        const draft = drafts[s.id] ?? draftFromStudent(s, vehicle.id);
        if (assignedOnly && !draft.assigned) return false;
        if (gradeFilter !== "all" && classGrade(s.cls) !== gradeFilter) return false;
        if (divisionFilter !== "all" && classDivision(s.cls) !== divisionFilter) return false;
        if (!q) return true;
        const hay = `${s.name} ${s.id} ${s.admissionNumber ?? ""} ${s.busPoint1 ?? ""} ${s.busPoint2 ?? ""} ${draft.busPoint1} ${draft.busPoint2}`
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        const da = drafts[a.id]?.assigned ? 0 : 1;
        const db = drafts[b.id]?.assigned ? 0 : 1;
        if (da !== db) return da - db;
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      });
  }, [
    liveStudents,
    drafts,
    vehicle.id,
    assignedOnly,
    gradeFilter,
    divisionFilter,
    query,
  ]);

  const assignedCount = useMemo(() => {
    return Object.values(drafts).filter((d) => d.assigned).length;
  }, [drafts]);

  const overCapacity = assignedCount > vehicle.capacity;

  const patchDraft = (studentId: string, patch: Partial<TransportAssignmentDraft>) => {
    setDrafts((prev) => {
      const base = prev[studentId] ?? {
        studentId,
        assigned: false,
        busPoint1: "",
        busPoint2: "",
        transportShift: "both" as TransportFeeShift,
      };
      return { ...prev, [studentId]: { ...base, ...patch, studentId } };
    });
  };

  const dirty = useMemo(() => {
    for (const student of liveStudents) {
      const draft = drafts[student.id];
      if (!draft) continue;
      const baseline = draftFromStudent(student, vehicle.id);
      if (
        draft.assigned !== baseline.assigned ||
        draft.busPoint1 !== baseline.busPoint1 ||
        draft.busPoint2 !== baseline.busPoint2 ||
        draft.transportShift !== baseline.transportShift
      ) {
        return true;
      }
    }
    return false;
  }, [liveStudents, drafts, vehicle.id]);

  const save = async () => {
    if (!getApiToken()) {
      toast.error("Sign in again to save bus assignments");
      return;
    }
    const changes: Student[] = [];
    for (const student of liveStudents) {
      const draft = drafts[student.id];
      if (!draft) continue;
      const baseline = draftFromStudent(student, vehicle.id);
      const changed =
        draft.assigned !== baseline.assigned ||
        draft.busPoint1 !== baseline.busPoint1 ||
        draft.busPoint2 !== baseline.busPoint2 ||
        draft.transportShift !== baseline.transportShift;
      if (!changed) continue;
      changes.push(
        applyVehicleAssignment(student, vehicle.id, {
          assigned: draft.assigned,
          busPoint1: draft.busPoint1,
          busPoint2: draft.busPoint2,
          transportShift: draft.transportShift,
        }),
      );
    }
    if (changes.length === 0) {
      toast.message("No assignment changes to save");
      return;
    }

    setSaving(true);
    try {
      const saved: Student[] = [];
      for (const next of changes) {
        const remote = await apiUpsertStudent(next);
        const merged = { ...next, ...remote, id: next.id };
        saved.push(merged);
        upsertStudentInSnapshot(merged);
      }
      setStudents((prev) => {
        const byId = new Map(saved.map((s) => [s.id, s]));
        return prev.map((s) => byId.get(s.id) ?? s);
      });
      toast.success(
        changes.length === 1
          ? "1 student assignment saved"
          : `${changes.length} student assignments saved`,
        {
          description: `${vehicle.name} · ${assignedCount}/${vehicle.capacity} seats`,
        },
      );
    } catch (err) {
      toast.error("Could not save bus assignments", {
        description: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  };

  const routeBadge =
    vehicle.routeIds.length === 0
      ? "No routes"
      : `${vehicle.routeIds.length} route${vehicle.routeIds.length === 1 ? "" : "s"}`;

  return (
    <div className={cn(glassCardClass, "space-y-4 p-4 sm:p-5")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to vehicle"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E5E5E5] bg-white text-slate-700 transition-colors hover:text-[#0F766E]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0F766E] text-white">
                <Bus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-bold tracking-tight text-black sm:text-[20px]">
                  {vehicle.name}
                </h2>
                <p className="mt-0.5 text-[12.5px] text-black/55">
                  Boarding, dropping, shift, and fare for students on this bus.
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#CCFBF1] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#0F766E]">
                <Users className="h-3 w-3" />
                {assignedCount}/{vehicle.capacity} seats
              </span>
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-black/60">
                {routeBadge}
              </span>
              {vehicle.registrationNo ? (
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[10px] font-semibold text-black/55">
                  {vehicle.registrationNo}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <Button
          type="button"
          disabled={!dirty || saving}
          onClick={() => void save()}
          className="h-10 rounded-full bg-[#0F766E] px-4 text-white hover:bg-[#0D9488]"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save assignments
        </Button>
      </div>

      {overCapacity ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            Assigned students ({assignedCount}) exceed seat capacity ({vehicle.capacity}). You can
            still save — review the roster before collection day.
          </p>
        </div>
      ) : null}

      {vehicle.routeIds.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-950">
          This vehicle has no routes yet. Attach routes on the vehicle Edit screen so stop lists and
          fares resolve correctly.
        </div>
      ) : null}

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/35" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, admission no, stop…"
            className="h-10 rounded-xl pl-9"
          />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="h-10 w-full rounded-xl lg:w-[140px]">
            <SelectValue placeholder="All classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {grades.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={divisionFilter} onValueChange={setDivisionFilter}>
          <SelectTrigger className="h-10 w-full rounded-xl lg:w-[140px]">
            <SelectValue placeholder="All divisions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All divisions</SelectItem>
            {divisions.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex h-10 items-center gap-2 rounded-xl border border-[#E5E5E5] bg-white px-3 text-[12.5px] font-medium text-black/70">
          <Switch checked={assignedOnly} onCheckedChange={setAssignedOnly} />
          Assigned only
        </label>
      </div>

      <p className="text-[12px] text-black/45">
        {rows.length} student{rows.length === 1 ? "" : "s"} matching
        {assignedOnly ? " · turn off Assigned only to add more students" : ""}
      </p>

      <div className="overflow-x-auto rounded-xl border border-[#E5E5E5]">
        <table className="min-w-[880px] w-full border-collapse text-left text-[12.5px]">
          <thead>
            <tr className="bg-[#0F766E] text-[10px] font-semibold uppercase tracking-wider text-white">
              <th className="px-3 py-2.5 w-12">On</th>
              <th className="px-3 py-2.5 w-12">Sl</th>
              <th className="px-3 py-2.5">Student</th>
              <th className="px-3 py-2.5 min-w-[160px]">Boarding</th>
              <th className="px-3 py-2.5 min-w-[160px]">Dropping</th>
              <th className="px-3 py-2.5 min-w-[120px]">Shift</th>
              <th className="px-3 py-2.5 min-w-[100px]">Fare</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-black/45">
                  No students match these filters.
                </td>
              </tr>
            ) : (
              rows.map((student, index) => {
                const draft = drafts[student.id] ?? draftFromStudent(student, vehicle.id);
                const previewStudent: Student = applyVehicleAssignment(student, vehicle.id, draft);
                const fare = draft.assigned
                  ? assignmentFareForStudent(
                      previewStudent,
                      routes,
                      transportVehicles,
                      undefined,
                      activeFeeTerms,
                    )
                  : undefined;
                return (
                  <tr
                    key={student.id}
                    className={cn(
                      "border-t border-[#EFEFEF]",
                      draft.assigned ? "bg-[#F0FDFA]/40" : "bg-white",
                    )}
                  >
                    <td className="px-3 py-2.5 align-middle">
                      <Checkbox
                        checked={draft.assigned}
                        onCheckedChange={(checked) => {
                          const on = checked === true;
                          patchDraft(student.id, {
                            assigned: on,
                            busPoint1: on
                              ? draft.busPoint1 || stops.pickups[0] || student.busPoint1 || ""
                              : "",
                            busPoint2: on
                              ? draft.busPoint2 || stops.drops[0] || student.busPoint2 || ""
                              : "",
                            transportShift: on ? draft.transportShift || "both" : "both",
                          });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2.5 align-middle font-mono text-black/50">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <div className="font-semibold text-black">{student.name}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-black/45">
                        {student.admissionNumber || student.id} · {student.cls}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <Select
                        disabled={!draft.assigned}
                        value={draft.busPoint1 || "__none__"}
                        onValueChange={(v) =>
                          patchDraft(student.id, {
                            busPoint1: v === "__none__" ? "" : v,
                          })
                        }
                      >
                        <SelectTrigger className="h-9 rounded-lg">
                          <SelectValue placeholder="Stop" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No stop</SelectItem>
                          {stops.pickups.map((stop) => (
                            <SelectItem key={stop} value={stop}>
                              {stop}
                            </SelectItem>
                          ))}
                          {draft.busPoint1 &&
                          !stops.pickups.includes(draft.busPoint1) ? (
                            <SelectItem value={draft.busPoint1}>{draft.busPoint1}</SelectItem>
                          ) : null}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <Select
                        disabled={!draft.assigned}
                        value={draft.busPoint2 || "__none__"}
                        onValueChange={(v) =>
                          patchDraft(student.id, {
                            busPoint2: v === "__none__" ? "" : v,
                          })
                        }
                      >
                        <SelectTrigger className="h-9 rounded-lg">
                          <SelectValue placeholder="Stop" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No stop</SelectItem>
                          {stops.drops.map((stop) => (
                            <SelectItem key={stop} value={stop}>
                              {stop}
                            </SelectItem>
                          ))}
                          {draft.busPoint2 && !stops.drops.includes(draft.busPoint2) ? (
                            <SelectItem value={draft.busPoint2}>{draft.busPoint2}</SelectItem>
                          ) : null}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <Select
                        disabled={!draft.assigned}
                        value={draft.transportShift}
                        onValueChange={(v) =>
                          patchDraft(student.id, {
                            transportShift: v as TransportFeeShift,
                          })
                        }
                      >
                        <SelectTrigger className="h-9 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(["morning", "evening", "both"] as TransportFeeShift[]).map((shift) => (
                            <SelectItem key={shift} value={shift}>
                              {transportShiftLabel(shift)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2.5 align-middle font-mono font-semibold text-black">
                      {draft.assigned && fare != null && fare > 0 ? formatMoney(fare) : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function vehicleSeatSummary(
  students: Student[],
  vehicleId: string,
  capacity: number,
): string {
  const n = vehicleAssignedCount(students, vehicleId);
  return `${n}/${capacity}`;
}
