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

/** Compact label for long map addresses in tight columns. */
function shortStopLabel(stop: string, max = 42): string {
  const raw = stop.trim();
  if (!raw) return "No stop";
  const first = raw.split(",")[0]?.trim() || raw;
  if (first.length <= max) return first;
  return `${first.slice(0, max - 1)}…`;
}

function StopSelect({
  value,
  disabled,
  options,
  orphan,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  options: string[];
  orphan?: string;
  onChange: (next: string) => void;
}) {
  const resolved = value || "__none__";
  return (
    <Select
      disabled={disabled}
      value={resolved}
      onValueChange={(v) => onChange(v === "__none__" ? "" : v)}
    >
      <SelectTrigger
        className="h-9 w-full max-w-full rounded-lg text-left text-[12px] [&>span]:line-clamp-1 [&>span]:min-w-0 [&>span]:break-all"
        title={value || undefined}
      >
        <SelectValue placeholder="Stop" />
      </SelectTrigger>
      <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[min(92vw,22rem)]">
        <SelectItem value="__none__">No stop</SelectItem>
        {options.map((stop) => (
          <SelectItem key={stop} value={stop} title={stop} textValue={shortStopLabel(stop, 80)}>
            <span className="line-clamp-2 whitespace-normal leading-snug">{shortStopLabel(stop, 56)}</span>
          </SelectItem>
        ))}
        {orphan && !options.includes(orphan) ? (
          <SelectItem value={orphan} title={orphan} textValue={shortStopLabel(orphan, 80)}>
            <span className="line-clamp-2 whitespace-normal leading-snug">
              {shortStopLabel(orphan, 56)}
            </span>
          </SelectItem>
        ) : null}
      </SelectContent>
    </Select>
  );
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
  const [assignedOnly, setAssignedOnly] = useState(false);
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
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E5E5E5] bg-white text-slate-700 transition-colors hover:text-[#0F766E] sm:h-10 sm:w-auto sm:gap-1.5 sm:px-3"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="hidden text-[13px] font-semibold sm:inline">Back</span>
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
          className="h-10 w-full shrink-0 rounded-full bg-[#0F766E] px-4 text-white hover:bg-[#0D9488] sm:w-auto"
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

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_140px_140px_auto]">
        <div className="relative min-w-0 sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/35" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, admission no, stop…"
            className="h-10 rounded-xl pl-9"
          />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="h-10 w-full rounded-xl">
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
          <SelectTrigger className="h-10 w-full rounded-xl">
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
        <label className="flex h-10 items-center justify-between gap-2 rounded-xl border border-[#E5E5E5] bg-white px-3 text-[12.5px] font-medium text-black/70 sm:col-span-2 lg:col-span-1">
          <span>Assigned only</span>
          <Switch checked={assignedOnly} onCheckedChange={setAssignedOnly} />
        </label>
      </div>

      <p className="text-[12px] text-black/45">
        {rows.length} student{rows.length === 1 ? "" : "s"} matching
        {assignedOnly ? " · turn off Assigned only to add more students" : ""}
      </p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-[#E5E5E5] bg-white px-4 py-10 text-center text-[13px] text-black/45">
          No students match these filters.
        </div>
      ) : (
        <>
          {/* Mobile / tablet: stacked cards */}
          <div className="space-y-2 xl:hidden">
            {rows.map((student, index) => {
              const draft = drafts[student.id] ?? draftFromStudent(student, vehicle.id);
              const previewStudent = applyVehicleAssignment(student, vehicle.id, draft);
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
                <div
                  key={student.id}
                  className={cn(
                    "rounded-xl border border-[#E5E5E5] p-3",
                    draft.assigned ? "bg-[#F0FDFA]/50" : "bg-white",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      className="mt-1"
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
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-black">
                            <span className="mr-1.5 font-mono text-[11px] text-black/40">
                              {index + 1}.
                            </span>
                            {student.name}
                          </div>
                          <div className="mt-0.5 truncate font-mono text-[11px] text-black/45">
                            {student.admissionNumber || student.id} · {student.cls}
                          </div>
                        </div>
                        <div className="shrink-0 font-mono text-[13px] font-semibold text-black">
                          {draft.assigned && fare != null && fare > 0 ? formatMoney(fare) : "—"}
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="min-w-0 space-y-1">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                            Boarding
                          </div>
                          <StopSelect
                            value={draft.busPoint1}
                            disabled={!draft.assigned}
                            options={stops.pickups}
                            orphan={draft.busPoint1}
                            onChange={(busPoint1) => patchDraft(student.id, { busPoint1 })}
                          />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                            Dropping
                          </div>
                          <StopSelect
                            value={draft.busPoint2}
                            disabled={!draft.assigned}
                            options={stops.drops}
                            orphan={draft.busPoint2}
                            onChange={(busPoint2) => patchDraft(student.id, { busPoint2 })}
                          />
                        </div>
                        <div className="min-w-0 space-y-1 sm:col-span-2 sm:max-w-[220px]">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                            Shift
                          </div>
                          <Select
                            disabled={!draft.assigned}
                            value={draft.transportShift}
                            onValueChange={(v) =>
                              patchDraft(student.id, {
                                transportShift: v as TransportFeeShift,
                              })
                            }
                          >
                            <SelectTrigger className="h-9 rounded-lg text-[12px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(["morning", "evening", "both"] as TransportFeeShift[]).map(
                                (shift) => (
                                  <SelectItem key={shift} value={shift}>
                                    {transportShiftLabel(shift)}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: constrained table */}
          <div className="hidden overflow-hidden rounded-xl border border-[#E5E5E5] xl:block">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-left text-[12.5px]">
                <colgroup>
                  <col className="w-12" />
                  <col className="w-12" />
                  <col className="w-[22%]" />
                  <col className="w-[22%]" />
                  <col className="w-[22%]" />
                  <col className="w-[14%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr className="bg-[#0F766E] text-[10px] font-semibold uppercase tracking-wider text-white">
                    <th className="px-2 py-2.5">On</th>
                    <th className="px-2 py-2.5">Sl</th>
                    <th className="px-2 py-2.5">Student</th>
                    <th className="px-2 py-2.5">Boarding</th>
                    <th className="px-2 py-2.5">Dropping</th>
                    <th className="px-2 py-2.5">Shift</th>
                    <th className="px-2 py-2.5">Fare</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((student, index) => {
                    const draft = drafts[student.id] ?? draftFromStudent(student, vehicle.id);
                    const previewStudent = applyVehicleAssignment(student, vehicle.id, draft);
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
                        <td className="px-2 py-2 align-middle">
                          <Checkbox
                            checked={draft.assigned}
                            onCheckedChange={(checked) => {
                              const on = checked === true;
                              patchDraft(student.id, {
                                assigned: on,
                                busPoint1: on
                                  ? draft.busPoint1 ||
                                    stops.pickups[0] ||
                                    student.busPoint1 ||
                                    ""
                                  : "",
                                busPoint2: on
                                  ? draft.busPoint2 || stops.drops[0] || student.busPoint2 || ""
                                  : "",
                                transportShift: on ? draft.transportShift || "both" : "both",
                              });
                            }}
                          />
                        </td>
                        <td className="px-2 py-2 align-middle font-mono text-black/50">
                          {index + 1}
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <div className="truncate font-semibold text-black" title={student.name}>
                            {student.name}
                          </div>
                          <div
                            className="mt-0.5 truncate font-mono text-[11px] text-black/45"
                            title={`${student.admissionNumber || student.id} · ${student.cls}`}
                          >
                            {student.admissionNumber || student.id} · {student.cls}
                          </div>
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <StopSelect
                            value={draft.busPoint1}
                            disabled={!draft.assigned}
                            options={stops.pickups}
                            orphan={draft.busPoint1}
                            onChange={(busPoint1) => patchDraft(student.id, { busPoint1 })}
                          />
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <StopSelect
                            value={draft.busPoint2}
                            disabled={!draft.assigned}
                            options={stops.drops}
                            orphan={draft.busPoint2}
                            onChange={(busPoint2) => patchDraft(student.id, { busPoint2 })}
                          />
                        </td>
                        <td className="px-2 py-2 align-middle">
                          <Select
                            disabled={!draft.assigned}
                            value={draft.transportShift}
                            onValueChange={(v) =>
                              patchDraft(student.id, {
                                transportShift: v as TransportFeeShift,
                              })
                            }
                          >
                            <SelectTrigger className="h-9 w-full rounded-lg text-[12px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(["morning", "evening", "both"] as TransportFeeShift[]).map(
                                (shift) => (
                                  <SelectItem key={shift} value={shift}>
                                    {transportShiftLabel(shift)}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-2 align-middle font-mono text-[12px] font-semibold text-black">
                          {draft.assigned && fare != null && fare > 0 ? formatMoney(fare) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
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
