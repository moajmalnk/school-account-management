import { Download, Loader2, Save, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiAttendanceDay, apiAttendanceMark } from "@/lib/api/attendance";
import { downloadAttendanceDayCsv } from "@/lib/attendance-export";
import {
  ATTENDANCE_STATUS_COLORS,
  ATTENDANCE_STATUS_LABELS,
  STUDENT_ATTENDANCE_STATUSES,
  parseClassDivision,
  type AttendanceRosterStudent,
  type StudentAttendanceStatus,
} from "@/lib/student-attendance";
import { useTenantStore } from "@/lib/tenant-store";
import {
  loadWhatsAppTemplates,
  type WhatsAppMessageTemplates,
} from "@/lib/whatsapp-messages";
import {
  renderWhatsAppTemplate,
  sendPersonalizedWhatsApp,
  toNotifyWhatsAppNumber,
} from "@/lib/whatsapp-notify";
import { cn } from "@/lib/utils";

type DraftMap = Record<string, StudentAttendanceStatus>;

export function MarkStudentAttendanceModal({
  open,
  onOpenChange,
  date,
  initialClass = "all",
  initialDivision = "all",
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  initialClass?: string;
  initialDivision?: string;
  onSaved?: () => void;
}) {
  const { classes: classConfigs, schoolDetails } = useTenantStore();
  const schoolName = schoolDetails.name || "School";

  const [gradeFilter, setGradeFilter] = useState(initialClass);
  const [divisionFilter, setDivisionFilter] = useState(initialDivision);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roster, setRoster] = useState<AttendanceRosterStudent[]>([]);
  const [draft, setDraft] = useState<DraftMap>({});
  const [baseline, setBaseline] = useState<DraftMap>({});
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmPresentOpen, setConfirmPresentOpen] = useState(false);
  const [confirmWhatsAppOpen, setConfirmWhatsAppOpen] = useState(false);
  const [pendingNotify, setPendingNotify] = useState<AttendanceRosterStudent[]>([]);
  const [sendingWa, setSendingWa] = useState(false);

  const gradeOptions = useMemo(() => {
    const grades = new Set<string>();
    for (const c of classConfigs) {
      const { grade } = parseClassDivision(c.className || `${c.grade}${c.section ? ` - ${c.section}` : ""}`);
      if (grade) grades.add(grade);
    }
    return Array.from(grades).sort();
  }, [classConfigs]);

  const divisionOptions = useMemo(() => {
    const divs = new Set<string>();
    for (const c of classConfigs) {
      const label = c.className || `${c.grade}${c.section ? ` - ${c.section}` : ""}`;
      const { grade, division } = parseClassDivision(label);
      if (gradeFilter !== "all" && grade !== gradeFilter) continue;
      if (division) divs.add(division);
    }
    return Array.from(divs).sort();
  }, [classConfigs, gradeFilter]);

  useEffect(() => {
    if (!open) return;
    setGradeFilter(initialClass);
    setDivisionFilter(initialDivision);
  }, [open, initialClass, initialDivision]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    void apiAttendanceDay({
      date,
      class: gradeFilter,
      division: divisionFilter,
    })
      .then((res) => {
        if (cancelled) return;
        setRoster(res.students);
        const next: DraftMap = {};
        for (const s of res.students) {
          if (s.status) next[s.studentId] = s.status;
        }
        setDraft(next);
        setBaseline({ ...next });
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error("Could not load roster", {
          description: err instanceof Error ? err.message : "Try again",
        });
        setRoster([]);
        setDraft({});
        setBaseline({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, date, gradeFilter, divisionFilter]);

  const dirtyMarks = useMemo(() => {
    const marks: Array<{ studentId: string; status: StudentAttendanceStatus }> = [];
    for (const s of roster) {
      const status = draft[s.studentId];
      if (!status) continue;
      if (baseline[s.studentId] !== status) {
        marks.push({ studentId: s.studentId, status });
      }
    }
    return marks;
  }, [roster, draft, baseline]);

  const setStatus = (studentId: string, status: StudentAttendanceStatus) => {
    setDraft((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    setDraft((prev) => {
      const next = { ...prev };
      for (const s of roster) next[s.studentId] = "present";
      return next;
    });
    setConfirmPresentOpen(false);
    toast.message("All present", { description: `${roster.length} students marked present (not saved yet).` });
  };

  const persistMarks = async () => {
    const marks =
      dirtyMarks.length > 0
        ? dirtyMarks
        : roster
            .filter((s) => draft[s.studentId])
            .map((s) => ({ studentId: s.studentId, status: draft[s.studentId]! }));

    if (marks.length === 0) {
      toast.message("Nothing to save", { description: "Set a status for at least one student." });
      return;
    }

    setSaving(true);
    try {
      const result = await apiAttendanceMark({ date, marks });
      toast.success("Attendance saved", {
        description: `${result.saved} student${result.saved === 1 ? "" : "s"} updated.`,
      });
      const nextBaseline: DraftMap = { ...draft };
      setBaseline(nextBaseline);
      setRoster((prev) =>
        prev.map((s) => ({
          ...s,
          status: draft[s.studentId] ?? s.status,
        })),
      );
      onSaved?.();

      const nonPresent = roster
        .map((s) => ({
          ...s,
          status: (draft[s.studentId] ?? s.status) as StudentAttendanceStatus | null,
        }))
        .filter(
          (s) =>
            s.status &&
            s.status !== "present" &&
            toNotifyWhatsAppNumber(s.phone ?? undefined),
        );

      if (nonPresent.length > 0) {
        setPendingNotify(nonPresent);
        setConfirmWhatsAppOpen(true);
      } else {
        onOpenChange(false);
      }
    } catch (err) {
      toast.error("Save failed", {
        description: err instanceof Error ? err.message : "Try again",
      });
    } finally {
      setSaving(false);
      setConfirmSaveOpen(false);
    }
  };

  const sendAbsenceWhatsApp = async () => {
    setSendingWa(true);
    try {
      const templates: WhatsAppMessageTemplates = loadWhatsAppTemplates();
      const template = templates.attendanceAbsent;
      const recipients = pendingNotify
        .map((s) => {
          const number = toNotifyWhatsAppNumber(s.phone ?? undefined);
          if (!number || !s.status) return null;
          const message = renderWhatsAppTemplate(template, {
            guardian: s.guardian || "Parent",
            student_name: s.name,
            class: s.cls,
            student_id: s.studentId,
            school: schoolName,
            date,
            status: ATTENDANCE_STATUS_LABELS[s.status],
          });
          return { number, message };
        })
        .filter((r): r is { number: string; message: string } => Boolean(r));

      if (!recipients.length) {
        toast.message("No parent numbers", { description: "None of the selected students have a valid phone." });
        setConfirmWhatsAppOpen(false);
        onOpenChange(false);
        return;
      }

      const result = await sendPersonalizedWhatsApp({ recipients });
      toast.success("WhatsApp sent", {
        description: `${result.sent} sent${result.failed ? `, ${result.failed} failed` : ""}.`,
      });
      setConfirmWhatsAppOpen(false);
      onOpenChange(false);
    } catch (err) {
      toast.error("WhatsApp failed", {
        description: err instanceof Error ? err.message : "Try again",
      });
    } finally {
      setSendingWa(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[min(92dvh,880px)] w-[min(100vw-1.5rem,720px)] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 dark:border-white/10 dark:bg-[#121212]">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-5 py-4 dark:border-white/10">
            <DialogTitle className="text-[18px] font-semibold text-slate-900 dark:text-zinc-50">
              Mark student attendance
            </DialogTitle>
            <DialogDescription className="text-[13px] text-slate-500 dark:text-zinc-400">
              {date} · choose status for each person, then save.
            </DialogDescription>
          </DialogHeader>

          <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-slate-100 px-5 py-3 dark:border-white/10">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Class
              </Label>
              <Select
                value={gradeFilter}
                onValueChange={(v) => {
                  setGradeFilter(v);
                  setDivisionFilter("all");
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {gradeOptions.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Division
              </Label>
              <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="All divisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All divisions</SelectItem>
                  {divisionOptions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3">
            {loading ? (
              <div className="space-y-3 p-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : roster.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                <Users className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">
                  No active students in this filter
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-white/5">
                {roster.map((s) => {
                  const selected = draft[s.studentId] ?? null;
                  return (
                    <li
                      key={s.studentId}
                      className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-semibold uppercase tracking-wide text-slate-900 dark:text-zinc-50">
                          {s.name}
                        </div>
                        <div className="truncate text-[12px] text-slate-500 dark:text-zinc-400">
                          {s.studentId} · {s.cls || "—"}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 sm:justify-end">
                        {STUDENT_ATTENDANCE_STATUSES.map((status) => {
                          const active = selected === status;
                          const colors = ATTENDANCE_STATUS_COLORS[status];
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setStatus(s.studentId, status)}
                              className={cn(
                                "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                                active
                                  ? cn(colors.bg, colors.text)
                                  : "bg-transparent text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5",
                              )}
                            >
                              {ATTENDANCE_STATUS_LABELS[status]}
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <DialogFooter className="shrink-0 flex-col gap-2 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={loading || roster.length === 0}
                onClick={() =>
                  downloadAttendanceDayCsv(
                    date,
                    roster.map((s) => ({ ...s, status: draft[s.studentId] ?? s.status })),
                    schoolName,
                  )
                }
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={loading || roster.length === 0 || saving}
                onClick={() => setConfirmPresentOpen(true)}
              >
                All present
              </Button>
            </div>
            <div className="flex gap-2 self-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={saving}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
                disabled={loading || saving || roster.length === 0}
                onClick={() => setConfirmSaveOpen(true)}
              >
                {saving ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmPresentOpen} onOpenChange={setConfirmPresentOpen}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Mark all present?</DialogTitle>
            <DialogDescription>
              Set every student in the current filter ({roster.length}) to Present. You still need to
              Save to commit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmPresentOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#0F766E] text-white hover:bg-[#0D9488]"
              onClick={markAllPresent}
            >
              Mark all present
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Save attendance?</DialogTitle>
            <DialogDescription>
              Save marks for {date}
              {dirtyMarks.length > 0
                ? ` (${dirtyMarks.length} change${dirtyMarks.length === 1 ? "" : "s"})`
                : ""}
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setConfirmSaveOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#0F766E] text-white hover:bg-[#0D9488]"
              disabled={saving}
              onClick={() => void persistMarks()}
            >
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Confirm save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmWhatsAppOpen}
        onOpenChange={(next) => {
          setConfirmWhatsAppOpen(next);
          if (!next) onOpenChange(false);
        }}
      >
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Notify parents on WhatsApp?</DialogTitle>
            <DialogDescription>
              Send attendance alerts to {pendingNotify.length} parent
              {pendingNotify.length === 1 ? "" : "s"} for students marked Absent, Halfday, Late, or
              Leave.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={sendingWa}
              onClick={() => {
                setConfirmWhatsAppOpen(false);
                onOpenChange(false);
              }}
            >
              Skip
            </Button>
            <Button
              type="button"
              className="bg-[#0F766E] text-white hover:bg-[#0D9488]"
              disabled={sendingWa}
              onClick={() => void sendAbsenceWhatsApp()}
            >
              {sendingWa ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Send WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
