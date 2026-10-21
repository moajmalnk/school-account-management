import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useSettingsUnsavedRegistration } from "@/components/school/settings-unsaved-guard";
import { filterByAcademicYear, getYearLedger } from "@/lib/academic-year";
import {
  PLACEMENT_DECISION_LABEL,
  academicYearExists,
  canonicalAcademicYearLabel,
  compareAcademicYearLabels,
  placementDecisionOptions,
  placementEntries,
  planStudentPlacements,
  suggestNextAcademicYearLabel,
  type PlacementChoice,
  type PlacementDecision,
} from "@/lib/academic-promotion";
import { useTenantStore, type Student } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

const selectClass =
  "h-9 w-full min-w-0 rounded-lg border border-[#E5E5E5] bg-white px-2 text-[13px] text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100";

/**
 * Next-year class for one student, plus the class already stored on each year.
 * Saving writes the next year only.
 */
export function StudentYearPlacement({ student }: { student: Student }) {
  const {
    academicYear,
    academicYears,
    closedAcademicYears,
    classes,
    studentYearLedgers,
    addAcademicYear,
    placeStudentsInYear,
  } = useTenantStore();
  const [choice, setChoice] = useState<PlacementChoice | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  const targetSuggestion = suggestNextAcademicYearLabel(academicYear, academicYears) ?? "";
  const yearLabel = canonicalAcademicYearLabel(targetSuggestion, academicYears);
  const yearReady = academicYearExists(targetSuggestion, academicYears);
  const yearClosed = closedAcademicYears.some(
    (year) => year.trim().toLowerCase() === yearLabel.trim().toLowerCase(),
  );

  useEffect(() => {
    setChoice(undefined);
  }, [student.id, academicYear, yearLabel]);

  const history = useMemo(() => {
    return studentYearLedgers
      .map((ledger) => ({
        year: ledger.academicYear,
        cls: ledger.byStudentId[student.id]?.cls?.trim() ?? "",
      }))
      .filter((row) => row.year && row.cls)
      .sort((a, b) => compareAcademicYearLabels(a.year, b.year));
  }, [student.id, studentYearLedgers]);

  const catalog = useMemo(
    () => (yearReady ? filterByAcademicYear(classes, yearLabel) : []),
    [classes, yearLabel, yearReady],
  );

  const existingTargetClass = useMemo(() => {
    if (!yearReady) return "";
    return getYearLedger(studentYearLedgers, yearLabel).byStudentId[student.id]?.cls?.trim() ?? "";
  }, [student.id, studentYearLedgers, yearLabel, yearReady]);

  const autoRow = useMemo(
    () =>
      planStudentPlacements({
        students: [student],
        classes: catalog,
        existingByStudentId: existingTargetClass ? { [student.id]: existingTargetClass } : {},
        includeInactive: true,
      })[0],
    [student, catalog, existingTargetClass],
  );

  const row = useMemo(
    () =>
      planStudentPlacements({
        students: [student],
        classes: catalog,
        existingByStudentId: existingTargetClass ? { [student.id]: existingTargetClass } : {},
        includeInactive: true,
        choices: choice ? { [student.id]: choice } : {},
      })[0],
    [student, catalog, existingTargetClass, choice],
  );

  const dirty = Boolean(
    choice &&
      row &&
      autoRow &&
      (choice.decision !== autoRow.decision || (choice.targetClass ?? "") !== ""),
  );

  const save = useCallback(async () => {
    if (!row || !yearReady || yearClosed || !row.ready || saving) return false;
    const entries = placementEntries([row]);
    if (!entries.length) return true;
    setSaving(true);
    try {
      await placeStudentsInYear(yearLabel, entries);
      setChoice(undefined);
      const next =
        row.decision === "graduate" ? "no class" : row.targetClass || yearLabel;
      toast.success(`${student.name} placed in ${yearLabel}`, { description: next });
      return true;
    } catch (err) {
      toast.error("Could not save the next-year class", {
        description: err instanceof Error ? err.message : "Try again",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [placeStudentsInYear, row, saving, student.name, yearClosed, yearLabel, yearReady]);

  const discard = useCallback(() => setChoice(undefined), []);

  useSettingsUnsavedRegistration(
    dirty
      ? {
          dirty: true,
          title: "Unsaved year placement",
          description: `${student.name}'s class for ${yearLabel || "next year"} has not been saved.`,
          save,
          discard,
        }
      : null,
  );

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const createYear = () => {
    if (creating || !targetSuggestion) return;
    setCreating(true);
    const added = addAcademicYear(targetSuggestion, { activate: false });
    setCreating(false);
    if (!added) {
      toast.error("That academic year already exists");
      return;
    }
    toast.success(`${targetSuggestion} is ready`, {
      description: "Class tiers were copied. This year stays open.",
    });
  };

  const canSave = Boolean(
    yearReady && !yearClosed && catalog.length > 0 && row?.ready && placementEntries(row ? [row] : []).length > 0 && !saving,
  );

  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 dark:border-white/10 dark:bg-[#171717] dark:text-zinc-100">
      <h2 className="text-base font-semibold text-black dark:text-zinc-50">Year placement</h2>
      <p className="mt-1 text-[12.5px] text-black/50 dark:text-zinc-400">
        Class on each academic year. The next year is saved on its own; {academicYear || "this year"}{" "}
        does not change.
      </p>

      {history.length ? (
        <ul className="mt-4 divide-y divide-slate-100 dark:divide-white/10">
          {history.map((item) => (
            <li key={item.year} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[13px] text-slate-700 dark:text-zinc-200">
                {item.year}
                {item.year === academicYear ? (
                  <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-[#0F766E]">
                    Current
                  </span>
                ) : null}
              </span>
              <span className="inline-flex rounded-full bg-[#CCFBF1] px-3 py-1 text-[12px] font-semibold text-black dark:bg-[#0F766E]/35 dark:text-[#5EEAD4]">
                {item.cls}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[13px] text-slate-500 dark:text-zinc-400">
          No year-by-year class is stored yet. {student.cls ? `${academicYear} shows ${student.cls}.` : ""}
        </p>
      )}

      <div className="mt-5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-3.5 dark:border-white/10 dark:bg-zinc-900/60">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-400">
          Next year {yearLabel ? `· ${yearLabel}` : ""}
        </div>

        {!targetSuggestion ? (
          <p className="mt-2 text-[13px] text-amber-900 dark:text-amber-100">
            Add the next academic year in Settings before placing {student.name}.
          </p>
        ) : null}

        {targetSuggestion && !yearReady ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] leading-relaxed text-slate-700 dark:text-zinc-200">
              {targetSuggestion} is not created yet. Creating it copies class tiers and keeps{" "}
              {academicYear || "this year"} open.
            </p>
            <Button
              type="button"
              disabled={creating}
              className="h-9 shrink-0 rounded-xl bg-[#0F766E] text-white hover:bg-[#0D9488]"
              onClick={createYear}
            >
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create {targetSuggestion}
            </Button>
          </div>
        ) : null}

        {yearClosed ? (
          <p className="mt-2 text-[13px] text-amber-900 dark:text-amber-100">
            {yearLabel} is closed. Reopen it before placing this student.
          </p>
        ) : null}

        {yearReady && !yearClosed && catalog.length === 0 ? (
          <p className="mt-2 text-[13px] text-amber-900 dark:text-amber-100">
            {yearLabel} has no class tiers yet.
          </p>
        ) : null}

        {yearReady && !yearClosed && catalog.length > 0 && row ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-400">
                Decision
              </span>
              <select
                className={cn(selectClass, "mt-1.5")}
                aria-label="Next year decision"
                value={row.decision}
                disabled={saving}
                onChange={(event) =>
                  setChoice({ decision: event.target.value as PlacementDecision })
                }
              >
                {placementDecisionOptions(row).map((decision) => (
                  <option key={decision} value={decision}>
                    {PLACEMENT_DECISION_LABEL[decision]}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-400">
                Class
              </span>
              {row.decision === "graduate" ? (
                <p className="mt-2 text-[13px] text-slate-600 dark:text-zinc-300">
                  {row.reason || "No class next year"}
                </p>
              ) : row.decision === "keep" ? (
                <p className="mt-2 text-[13px] font-medium text-slate-800 dark:text-zinc-100">
                  {row.targetClass}
                </p>
              ) : row.sectionOptions.length > 0 ? (
                <select
                  className={cn(selectClass, "mt-1.5")}
                  aria-label="Next year class"
                  value={row.targetClass}
                  disabled={saving}
                  onChange={(event) =>
                    setChoice({ decision: row.decision, targetClass: event.target.value })
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
                <p className="mt-2 text-[13px] text-amber-800 dark:text-amber-200">
                  {row.reason || "No class"}
                </p>
              )}
              {row.needsSection ? (
                <p className="mt-1 text-[12px] text-amber-800 dark:text-amber-200">
                  The same section is not in {yearLabel}. Choose one.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {yearReady && !yearClosed && catalog.length > 0 ? (
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              disabled={!canSave}
              className="h-9 rounded-xl bg-[#0F766E] px-4 text-white hover:bg-[#0D9488]"
              onClick={() => void save()}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {row?.decision === "keep" && !saving ? "Already placed" : `Save ${yearLabel}`}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
