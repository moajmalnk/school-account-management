import { Loader2, Minus, Plus, Save, Search, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiUpsertStaff } from "@/lib/api/records";
import { weekdaysInMonth } from "@/lib/attendance-import";
import {
  formatPayrollMonthLabel,
  getStaffAttendanceForMonth,
  normalizeStaff,
  normalizeStaffAttendanceMonth,
  upsertStaffAttendanceMonth,
  useTenantStore,
  type Staff,
  type StaffAttendanceMonth,
} from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

type BulkLine = {
  workingDays: number;
  daysPresent: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
};

function fullPresent(workingDays: number): BulkLine {
  return {
    workingDays,
    daysPresent: workingDays,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
  };
}

function lineFromRecord(record: StaffAttendanceMonth | undefined, fallbackWorking: number): BulkLine {
  if (!record || record.workingDays <= 0) return fullPresent(Math.max(1, fallbackWorking));
  return {
    workingDays: record.workingDays,
    daysPresent: record.daysPresent,
    paidLeaveDays: record.paidLeaveDays || 0,
    unpaidLeaveDays: record.unpaidLeaveDays || 0,
  };
}

function sameLine(a: BulkLine, b: BulkLine): boolean {
  return (
    a.workingDays === b.workingDays &&
    a.daysPresent === b.daysPresent &&
    a.paidLeaveDays === b.paidLeaveDays &&
    a.unpaidLeaveDays === b.unpaidLeaveDays
  );
}

function isFullPresent(line: BulkLine): boolean {
  return (
    line.workingDays > 0 &&
    line.paidLeaveDays === 0 &&
    line.unpaidLeaveDays === 0 &&
    line.daysPresent === line.workingDays
  );
}

/** Leave is taken from present days. Reducing leave returns the day to present. */
function bumpLeave(line: BulkLine, field: "paidLeaveDays" | "unpaidLeaveDays", delta: 1 | -1): BulkLine {
  const next = { ...line };
  if (delta > 0) {
    if (next.daysPresent <= 0) return line;
    next[field] += 1;
    next.daysPresent -= 1;
    return next;
  }
  if (next[field] <= 0) return line;
  next[field] -= 1;
  if (next.daysPresent + next.paidLeaveDays + next.unpaidLeaveDays < next.workingDays) {
    next.daysPresent += 1;
  }
  return next;
}

function applyWorkingDays(line: BulkLine, workingDays: number): BulkLine {
  if (isFullPresent(line)) return fullPresent(workingDays);
  const paid = Math.min(line.paidLeaveDays, workingDays);
  const unpaid = Math.min(line.unpaidLeaveDays, Math.max(0, workingDays - paid));
  return {
    workingDays,
    paidLeaveDays: paid,
    unpaidLeaveDays: unpaid,
    daysPresent: Math.max(0, workingDays - paid - unpaid),
  };
}

export function MarkStaffAttendanceModal({
  open,
  onOpenChange,
  month,
  roster,
  departments,
  initialDepartment = "all",
  selfOnly = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  roster: Staff[];
  departments: string[];
  initialDepartment?: string;
  /** Class teacher / Login as — mark only their own row. */
  selfOnly?: boolean;
}) {
  const { setStaff } = useTenantStore();
  const [department, setDepartment] = useState(initialDepartment);
  const [query, setQuery] = useState("");
  const [workingDaysText, setWorkingDaysText] = useState("");
  const [lines, setLines] = useState<Record<string, BulkLine>>({});
  const [saving, setSaving] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmFull, setConfirmFull] = useState(false);
  const sessionRef = useRef("");

  const suggestedWorking = useMemo(() => {
    const counts = new Map<number, number>();
    for (const member of roster) {
      const row = getStaffAttendanceForMonth(member, month);
      if (!row) continue;
      counts.set(row.workingDays, (counts.get(row.workingDays) ?? 0) + 1);
    }
    let bestDays = weekdaysInMonth(month);
    let bestCount = 0;
    for (const [days, count] of counts) {
      if (count > bestCount) {
        bestCount = count;
        bestDays = days;
      }
    }
    return bestDays > 0 ? bestDays : 26;
  }, [month, roster]);

  useEffect(() => {
    const sessionKey = open ? month : "";
    if (!open) {
      sessionRef.current = "";
      return;
    }
    if (sessionRef.current === sessionKey) return;
    sessionRef.current = sessionKey;
    setDepartment(initialDepartment);
    setQuery("");
    setWorkingDaysText(String(suggestedWorking));
    const next: Record<string, BulkLine> = {};
    for (const member of roster) {
      next[member.id] = lineFromRecord(getStaffAttendanceForMonth(member, month), suggestedWorking);
    }
    setLines(next);
    setSaving(false);
    setConfirmSave(false);
    setConfirmDiscard(false);
    setConfirmFull(false);
  }, [open, month, roster, initialDepartment, suggestedWorking]);

  const workingDays = Number(workingDaysText);
  const workingDaysValid = Number.isInteger(workingDays) && workingDays >= 1 && workingDays <= 31;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return roster.filter((member) => {
      if (department !== "all" && member.dept !== department) return false;
      if (!needle) return true;
      return (
        member.name.toLowerCase().includes(needle) ||
        member.id.toLowerCase().includes(needle) ||
        member.role.toLowerCase().includes(needle)
      );
    });
  }, [department, query, roster]);

  const scope = useMemo(
    () => roster.filter((member) => department === "all" || member.dept === department),
    [department, roster],
  );

  const dirtyIds = useMemo(() => {
    return scope
      .filter((member) => {
        const line = lines[member.id];
        if (!line) return false;
        const savedRecord = getStaffAttendanceForMonth(member, month);
        if (!savedRecord) return true;
        return !sameLine(line, lineFromRecord(savedRecord, suggestedWorking));
      })
      .map((member) => member.id);
  }, [lines, month, scope, suggestedWorking]);

  const dirty = dirtyIds.length > 0;

  useEffect(() => {
    if (!open || !dirty) return;
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty, open]);

  const setWorkingDays = (raw: string) => {
    const text = raw.replace(/\D/g, "").slice(0, 2);
    setWorkingDaysText(text);
    const nextWorking = Number(text);
    if (!Number.isInteger(nextWorking) || nextWorking < 1 || nextWorking > 31) return;
    setLines((prev) => {
      const next = { ...prev };
      for (const member of roster) {
        if (getStaffAttendanceForMonth(member, month)) continue;
        const current = prev[member.id];
        if (!current) continue;
        next[member.id] = applyWorkingDays(current, nextWorking);
      }
      return next;
    });
  };

  const markFullPresent = (ids: string[]) => {
    if (!workingDaysValid) return;
    setLines((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = fullPresent(workingDays);
      return next;
    });
    setConfirmFull(false);
  };

  const requestClose = () => {
    if (saving) return;
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    onOpenChange(false);
  };

  const save = async () => {
    if (saving || dirtyIds.length === 0 || !workingDaysValid) return;
    const targets = roster.filter((member) => dirtyIds.includes(member.id));
    setSaving(true);
    let savedCount = 0;
    try {
      for (const member of targets) {
        const line = lines[member.id];
        const normalized = normalizeStaffAttendanceMonth({ month, ...line });
        if (!normalized) continue;
        const updated: Staff = {
          ...member,
          attendanceByMonth: upsertStaffAttendanceMonth(member.attendanceByMonth, normalized),
        };
        setStaff((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
        try {
          const saved = await apiUpsertStaff(updated);
          const merged = normalizeStaff({
            ...updated,
            ...saved,
            attendanceByMonth: updated.attendanceByMonth,
          });
          setStaff((prev) => prev.map((row) => (row.id === updated.id ? merged : row)));
          savedCount += 1;
        } catch (err) {
          setStaff((prev) => prev.map((row) => (row.id === member.id ? member : row)));
          throw err;
        }
      }
      toast.success(`Staff attendance saved · ${formatPayrollMonthLabel(month)}`, {
        description: `${savedCount} staff recorded. Payable days = present + paid leave.`,
      });
      setConfirmSave(false);
      onOpenChange(false);
    } catch (err) {
      toast.error("Could not save every staff record", {
        description:
          savedCount > 0
            ? `${savedCount} saved before the error. ${err instanceof Error ? err.message : "Try again."}`
            : err instanceof Error
              ? err.message
              : "Try again",
      });
      setSaving(false);
      setConfirmSave(false);
    }
  };

  const monthLabel = formatPayrollMonthLabel(month);

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
        <DialogContent className="flex max-h-[min(92dvh,880px)] w-[min(100vw-1.5rem,760px)] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 dark:border-white/10 dark:bg-[#121212]">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-5 py-4 dark:border-white/10">
            <DialogTitle className="text-[18px] font-semibold text-slate-900 dark:text-zinc-50">
              {selfOnly ? "Mark my attendance" : "Mark staff attendance"}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-slate-500 dark:text-zinc-400">
              {selfOnly
                ? `${monthLabel} · set working days and leave for your month, then save.`
                : `${monthLabel} · unrecorded staff start fully present. Enter leave only where needed, then save.`}
            </DialogDescription>
          </DialogHeader>

          <div
            className={cn(
              "grid shrink-0 gap-3 border-b border-slate-100 px-5 py-3 dark:border-white/10",
              selfOnly ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3",
            )}
          >
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Working days
              </Label>
              <Input
                inputMode="numeric"
                maxLength={2}
                value={workingDaysText}
                onChange={(e) => setWorkingDays(e.target.value)}
                className="h-10 rounded-xl font-mono"
                aria-label="Working days for unrecorded staff"
              />
              {!workingDaysValid ? (
                <p className="text-[12px] font-medium text-[#B91C1C]">Enter 1 to 31 working days.</p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  {weekdaysInMonth(month)} weekdays in {monthLabel}.
                </p>
              )}
            </div>
            {!selfOnly ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Department
                  </Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="h-10 rounded-xl" aria-label="Department">
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      {departments.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Name, ID, or role"
                      className="h-10 rounded-xl pl-9"
                      aria-label="Search staff in this month"
                    />
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                <Users className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">
                  No active staff in this filter
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-white/5">
                {visible.map((member) => {
                  const line = lines[member.id] ?? fullPresent(workingDaysValid ? workingDays : suggestedWorking);
                  const recorded = Boolean(getStaffAttendanceForMonth(member, month));
                  const full = isFullPresent(line);
                  return (
                    <li
                      key={member.id}
                      className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-semibold uppercase tracking-wide text-slate-900 dark:text-zinc-50">
                          {member.name}
                        </div>
                        <div className="truncate text-[12px] text-slate-500 dark:text-zinc-400">
                          {member.id} · {member.role}
                          {member.dept ? ` · ${member.dept}` : ""}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          {recorded ? "Already recorded" : "Not recorded"} · Present {line.daysPresent}/
                          {line.workingDays}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => markFullPresent([member.id])}
                          disabled={!workingDaysValid || saving}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50",
                            full
                              ? "bg-emerald-600 text-white"
                              : "text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5",
                          )}
                        >
                          Full present
                        </button>
                        <LeaveStepper
                          label="Paid leave"
                          value={line.paidLeaveDays}
                          disabled={saving}
                          canIncrease={line.daysPresent > 0}
                          onChange={(delta) =>
                            setLines((prev) => ({
                              ...prev,
                              [member.id]: bumpLeave(prev[member.id] ?? line, "paidLeaveDays", delta),
                            }))
                          }
                        />
                        <LeaveStepper
                          label="Unpaid"
                          value={line.unpaidLeaveDays}
                          disabled={saving}
                          canIncrease={line.daysPresent > 0}
                          onChange={(delta) =>
                            setLines((prev) => ({
                              ...prev,
                              [member.id]: bumpLeave(prev[member.id] ?? line, "unpaidLeaveDays", delta),
                            }))
                          }
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <DialogFooter className="shrink-0 flex-col gap-2 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={!workingDaysValid || saving || scope.length === 0}
              onClick={() => setConfirmFull(true)}
            >
              All full present
            </Button>
            <div className="flex gap-2 self-end">
              <Button type="button" variant="outline" className="rounded-full" disabled={saving} onClick={requestClose}>
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
                disabled={saving || !workingDaysValid || dirtyIds.length === 0}
                onClick={() => setConfirmSave(true)}
              >
                {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmFull} onOpenChange={setConfirmFull}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Mark the list fully present?</DialogTitle>
            <DialogDescription>
              Set {scope.length} staff in this department to {workingDaysValid ? workingDays : "—"} present
              days and clear leave. You still need to save.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmFull(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#0F766E] text-white hover:bg-[#0D9488]"
              onClick={() => markFullPresent(scope.map((member) => member.id))}
            >
              Mark full present
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmSave} onOpenChange={(next) => !saving && setConfirmSave(next)}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Save staff attendance?</DialogTitle>
            <DialogDescription>
              Save {monthLabel} for {dirtyIds.length} staff. Payable days are present plus paid leave.
              Unpaid leave is not paid.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" disabled={saving} onClick={() => setConfirmSave(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#0F766E] text-white hover:bg-[#0D9488]"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Confirm save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Discard attendance changes?</DialogTitle>
            <DialogDescription>The month has unsaved staff marks. They will not be recorded.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmDiscard(false)}>
              Keep editing
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmDiscard(false);
                onOpenChange(false);
              }}
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LeaveStepper({
  label,
  value,
  disabled,
  canIncrease,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  canIncrease: boolean;
  onChange: (delta: 1 | -1) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-1 py-0.5 dark:border-white/10">
      <span className="px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={disabled || value <= 0}
        onClick={() => onChange(-1)}
        className="grid h-6 w-6 place-items-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-white/10"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-5 text-center font-mono text-[12px] font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={disabled || !canIncrease}
        onClick={() => onChange(1)}
        className="grid h-6 w-6 place-items-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-white/10"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
