import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { filterByAcademicYear, getYearLedger } from "@/lib/academic-year";
import {
  PLACEMENT_DECISION_LABEL,
  academicYearExists,
  canonicalAcademicYearLabel,
  placementDecisionOptions,
  placementEntries,
  planStudentPlacements,
  summarizePlacements,
  targetAcademicYearOptions,
  suggestNextAcademicYearLabel,
  type PlacementChoice,
  type PlacementDecision,
  type PlacementStudent,
} from "@/lib/academic-promotion";
import { useTenantStore } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

const selectClass =
  "h-9 w-full min-w-0 rounded-lg border border-[#E5E5E5] bg-white px-2 text-[12.5px] text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100";

/**
 * Review next-year class for the open books year, then write only that next year.
 */
export function AcademicPromotionDialog({
  open,
  onOpenChange,
  sourceYear,
  students,
  scopeLabel,
  startWithInactive = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceYear: string;
  students: PlacementStudent[];
  scopeLabel: string;
  /** When the user already selected inactive students, show them immediately. */
  startWithInactive?: boolean;
}) {
  const {
    academicYears,
    closedAcademicYears,
    classes,
    studentYearLedgers,
    addAcademicYear,
    placeStudentsInYear,
  } = useTenantStore();
  const [targetYear, setTargetYear] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [choices, setChoices] = useState<Record<string, PlacementChoice | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);
  const savingRef = useRef(false);
  const openedRef = useRef(false);

  const yearOptions = useMemo(
    () => targetAcademicYearOptions(sourceYear, academicYears),
    [sourceYear, academicYears],
  );

  useEffect(() => {
    if (open && !openedRef.current) {
      setTargetYear(suggestNextAcademicYearLabel(sourceYear, academicYears) ?? "");
      setChoices({});
      setIncludeInactive(startWithInactive);
      setSaving(false);
      setCreating(false);
    }
    openedRef.current = open;
  }, [open, sourceYear, academicYears, startWithInactive]);

  const yearLabel = canonicalAcademicYearLabel(targetYear, academicYears);
  const yearReady = academicYearExists(targetYear, academicYears);
  const yearClosed = closedAcademicYears.some(
    (year) => year.trim().toLowerCase() === yearLabel.trim().toLowerCase(),
  );
  const catalog = useMemo(
    () => (yearReady ? filterByAcademicYear(classes, yearLabel) : []),
    [classes, yearLabel, yearReady],
  );

  const existingByStudentId = useMemo(() => {
    if (!yearReady) return {};
    const ledger = getYearLedger(studentYearLedgers, yearLabel).byStudentId;
    const map: Record<string, string> = {};
    for (const [id, fields] of Object.entries(ledger)) {
      const cls = fields.cls?.trim();
      if (cls) map[id] = cls;
    }
    return map;
  }, [studentYearLedgers, yearLabel, yearReady]);

  const rows = useMemo(
    () =>
      yearReady
        ? planStudentPlacements({
            students,
            classes: catalog,
            existingByStudentId,
            includeInactive,
            choices,
          })
        : [],
    [yearReady, students, catalog, existingByStudentId, includeInactive, choices],
  );
  const summary = useMemo(() => summarizePlacements(rows), [rows]);
  const inactiveCount = students.filter((student) => student.active === false).length;
  const catalogMissing = yearReady && !yearClosed && catalog.length === 0;
  const canPlace =
    yearReady &&
    !yearClosed &&
    !catalogMissing &&
    rows.length > 0 &&
    summary.pending === 0 &&
    summary.writes > 0 &&
    !saving;

  const setDecision = (studentId: string, decision: PlacementDecision) => {
    setChoices((prev) => ({ ...prev, [studentId]: { decision } }));
  };

  const setSection = (studentId: string, decision: PlacementDecision, targetClass: string) => {
    setChoices((prev) => ({ ...prev, [studentId]: { decision, targetClass } }));
  };

  const applyBulk = (decision: PlacementDecision) => {
    setChoices((prev) => {
      const next = { ...prev };
      for (const row of rows) next[row.studentId] = { decision };
      return next;
    });
  };

  const createYear = () => {
    if (creatingRef.current || !targetYear.trim()) return;
    creatingRef.current = true;
    setCreating(true);
    const added = addAcademicYear(targetYear.trim(), { activate: false });
    creatingRef.current = false;
    setCreating(false);
    if (!added) {
      toast.error("That academic year already exists");
      return;
    }
    toast.success(`${targetYear.trim()} is ready`, {
      description: "Class tiers and fee periods were copied. This year stays open.",
    });
  };

  const confirm = async () => {
    if (!canPlace) return;
    const entries = placementEntries(rows);
    if (!entries.length) return;
    setSaving(true);
    try {
      await placeStudentsInYear(yearLabel, entries);
      const parts = [
        summary.promote ? `${summary.promote} promoted` : "",
        summary.repeat ? `${summary.repeat} repeating` : "",
        summary.demote ? `${summary.demote} demoted` : "",
        summary.graduate ? `${summary.graduate} graduated` : "",
      ].filter(Boolean);
      toast.success(`Placed ${entries.length} student${entries.length === 1 ? "" : "s"} in ${yearLabel}`, {
        description: parts.join(" · ") || `${sourceYear} is unchanged`,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error("Could not save placements", {
        description: err instanceof Error ? err.message : "Try again",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (saving) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[min(90dvh,820px)] w-[calc(100%-1.5rem)] max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white p-0 dark:border-white/10 dark:bg-zinc-950 sm:max-w-4xl">
        <DialogHeader className="shrink-0 space-y-1.5 border-b border-[#F0F0F0] px-5 pb-4 pt-5 pr-12 text-left dark:border-white/10 sm:px-6 sm:pt-6">
          <DialogTitle className="text-[20px] font-semibold text-black dark:text-zinc-50">
            Academic promotion
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60 dark:text-zinc-400">
            Place {scopeLabel} from {sourceYear || "this year"} into the next academic year.
            {sourceYear ? ` ${sourceYear} classes, dues, and receipts stay as they are.` : ""} Next
            year’s fees follow the new class.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3.5 py-3 dark:border-white/10 dark:bg-zinc-900">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-400">
                From
              </div>
              <div className="mt-1 text-[14px] font-semibold text-black dark:text-zinc-50">
                {sourceYear || "Current year"}
              </div>
            </div>
            <div className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3.5 py-3 dark:border-white/10 dark:bg-zinc-900">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-400">
                To
              </div>
              {yearOptions.length > 1 ? (
                <select
                  className={cn(selectClass, "mt-1")}
                  value={targetYear}
                  disabled={saving || creating}
                  aria-label="Target academic year"
                  onChange={(event) => {
                    setTargetYear(event.target.value);
                    setChoices({});
                  }}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                      {academicYearExists(year, academicYears) ? "" : " · not created"}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-1 text-[14px] font-semibold text-black dark:text-zinc-50">
                  {targetYear || "No next year"}
                </div>
              )}
            </div>
          </div>

          {!targetYear ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              This year’s label can’t be moved forward. Add the next academic year in Settings, then
              come back.
            </p>
          ) : null}

          {targetYear && !yearReady ? (
            <div className="flex flex-col gap-3 rounded-xl border border-[#CCFBF1] bg-[#F0FDFA] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-teal-500/30 dark:bg-teal-950/40">
              <p className="text-[13px] leading-relaxed text-[#115E59] dark:text-teal-100">
                {targetYear} is not on file yet. Creating it copies class tiers and fee periods and
                keeps {sourceYear || "this year"} open.
              </p>
              <Button
                type="button"
                disabled={creating || saving}
                className="h-9 shrink-0 rounded-xl bg-[#0F766E] text-white hover:bg-[#0D9488]"
                onClick={createYear}
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create {targetYear}
              </Button>
            </div>
          ) : null}

          {yearClosed ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              {yearLabel} is closed. Reopen it before placing students.
            </p>
          ) : null}

          {catalogMissing ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              {yearLabel} has no class tiers. Add them in Settings before promoting into that year.
            </p>
          ) : null}

          {yearReady && !yearClosed && !catalogMissing ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {(["promote", "repeat", "demote"] as const).map((decision) => (
                    <button
                      key={decision}
                      type="button"
                      disabled={saving || rows.length === 0}
                      onClick={() => applyBulk(decision)}
                      className="inline-flex h-8 items-center rounded-lg border border-[#E5E5E5] bg-white px-2.5 text-[12px] font-semibold text-slate-800 transition-colors hover:border-[#0F766E]/40 hover:bg-[#F0FDFA] disabled:opacity-50 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-teal-950/40"
                    >
                      {PLACEMENT_DECISION_LABEL[decision]} all
                    </button>
                  ))}
                </div>
                {inactiveCount > 0 ? (
                  <label className="inline-flex items-center gap-2 text-[12.5px] text-slate-700 dark:text-zinc-200">
                    <Checkbox
                      checked={includeInactive}
                      disabled={saving}
                      onCheckedChange={(checked) => setIncludeInactive(checked === true)}
                    />
                    Include {inactiveCount} inactive
                  </label>
                ) : null}
              </div>

              {rows.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#E5E5E5] px-3.5 py-6 text-center text-[13px] text-slate-500 dark:border-white/10 dark:text-zinc-400">
                  No students to place. Choose a class, or include inactive students.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#E5E5E5] dark:border-white/10">
                  <table className="w-full min-w-[640px] border-collapse text-left">
                    <thead className="bg-[#FAFAFA] text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:bg-zinc-900 dark:text-zinc-400">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">Student</th>
                        <th className="px-3 py-2.5 font-semibold">This year</th>
                        <th className="px-3 py-2.5 font-semibold">Decision</th>
                        <th className="px-3 py-2.5 font-semibold">Next year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.studentId}
                          className="border-t border-[#F0F0F0] dark:border-white/10"
                        >
                          <td className="px-3 py-2.5 text-[13px] font-medium text-black dark:text-zinc-50">
                            {row.studentName}
                            {!row.active ? (
                              <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                Inactive
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2.5 text-[13px] text-slate-700 dark:text-zinc-200">
                            {row.sourceClass || "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <select
                              className={selectClass}
                              aria-label={`${row.studentName} decision`}
                              value={row.decision}
                              disabled={saving}
                              onChange={(event) =>
                                setDecision(row.studentId, event.target.value as PlacementDecision)
                              }
                            >
                              {placementDecisionOptions(row).map((decision) => (
                                <option key={decision} value={decision}>
                                  {PLACEMENT_DECISION_LABEL[decision]}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2.5">
                            {row.decision === "graduate" ? (
                              <span className="text-[12.5px] text-slate-500 dark:text-zinc-400">
                                No class
                              </span>
                            ) : row.decision === "keep" ? (
                              <span className="text-[13px] font-medium text-slate-800 dark:text-zinc-100">
                                {row.targetClass}
                              </span>
                            ) : row.sectionOptions.length > 0 ? (
                              <select
                                className={selectClass}
                                aria-label={`${row.studentName} next class`}
                                value={row.targetClass}
                                disabled={saving}
                                onChange={(event) =>
                                  setSection(row.studentId, row.decision, event.target.value)
                                }
                              >
                                {!row.targetClass ? <option value="">Choose section</option> : null}
                                {row.sectionOptions.map((className) => (
                                  <option key={className} value={className}>
                                    {className}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-[12.5px] text-amber-800 dark:text-amber-200">
                                {row.reason || "—"}
                              </span>
                            )}
                            {row.needsSection ? (
                              <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-200">
                                Choose a section
                              </p>
                            ) : row.reason && row.decision !== "graduate" && row.decision !== "keep" && row.ready ? (
                              <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                                {row.reason}
                              </p>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-3 border-t border-[#F0F0F0] bg-white px-5 py-4 dark:border-white/10 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-left text-[12px] leading-relaxed text-slate-500 dark:text-zinc-400">
            {rows.length
              ? `${summary.promote} promote · ${summary.repeat} repeat · ${summary.demote} demote · ${summary.graduate} graduate · ${summary.keep} kept`
              : "Nothing to place yet"}
            {summary.pending > 0
              ? ` · choose a class for ${summary.pending} student${summary.pending === 1 ? "" : "s"}`
              : ""}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canPlace}
              className="rounded-xl bg-[#0F766E] text-white hover:bg-[#0D9488]"
              onClick={() => void confirm()}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {summary.writes > 0
                ? `Place ${summary.writes} student${summary.writes === 1 ? "" : "s"}`
                : "Place students"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
