import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Upload, UserCheck } from "lucide-react";
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
import { MonthPicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttendanceActions } from "@/components/school/attendance/attendance-toolbar";
import { AttendanceUploadDialog } from "@/components/school/attendance/AttendanceUploadDialog";
import { MarkStaffAttendanceModal } from "@/components/school/attendance/MarkStaffAttendanceModal";
import { apiUpsertStaff } from "@/lib/api/records";
import {
  parseStaffAttendanceTable,
  STAFF_ATTENDANCE_HEADERS,
  weekdaysInMonth,
} from "@/lib/attendance-import";
import { formatDownloadFilename } from "@/lib/download-names";
import { downloadBlobFile } from "@/lib/finance-export";
import { buildXlsxBlob } from "@/lib/xlsx-workbook";
import {
  currentPayrollMonth,
  formatPayrollMonthLabel,
  getStaffAttendanceForMonth,
  normalizeStaff,
  normalizeStaffAttendanceMonth,
  upsertStaffAttendanceMonth,
  useTenantStore,
  type Staff,
  type StaffAttendanceMonth,
} from "@/lib/tenant-store";
import { cn, glassCardClass } from "@/lib/utils";

type Draft = {
  workingDays: string;
  daysPresent: string;
  paidLeaveDays: string;
  unpaidLeaveDays: string;
};

const emptyDraft = (): Draft => ({
  workingDays: "",
  daysPresent: "",
  paidLeaveDays: "",
  unpaidLeaveDays: "",
});

function digits(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max);
}

function draftFromRow(row?: StaffAttendanceMonth): Draft {
  if (!row) return emptyDraft();
  return {
    workingDays: String(row.workingDays),
    daysPresent: String(row.daysPresent),
    paidLeaveDays: String(row.paidLeaveDays || 0),
    unpaidLeaveDays: String(row.unpaidLeaveDays || 0),
  };
}

function draftProblems(draft: Draft): Record<string, string> {
  const problems: Record<string, string> = {};
  const working = Number(draft.workingDays);
  const present = Number(draft.daysPresent || 0);
  const paid = Number(draft.paidLeaveDays || 0);
  const unpaid = Number(draft.unpaidLeaveDays || 0);
  if (!draft.workingDays || !Number.isInteger(working) || working < 1 || working > 31) {
    problems.workingDays = "Enter working days from 1 to 31.";
  }
  if (working >= 1 && present + paid + unpaid > working) {
    problems.total = "Present, paid leave, and unpaid leave cannot exceed working days.";
  }
  return problems;
}

function attendancePercent(row: StaffAttendanceMonth) {
  if (row.workingDays <= 0) return 0;
  return Math.round(((row.daysPresent + row.paidLeaveDays) / row.workingDays) * 100);
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="mt-0.5 text-[20px] font-semibold tabular-nums text-slate-900 dark:text-zinc-50">
        {value}
      </div>
    </div>
  );
}

export function StaffAttendancePanel() {
  const { activeStaff, setStaff, activeDepartments, schoolDetails } = useTenantStore();
  const [month, setMonth] = useState(currentPayrollMonth);
  const [department, setDepartment] = useState("all");
  const [query, setQuery] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saving, setSaving] = useState(false);

  const roster = useMemo(
    () =>
      activeStaff
        .filter((member) => member.active && !member.deletedAt)
        .sort((a, b) => a.name.localeCompare(b.name, "en")),
    [activeStaff],
  );

  const departments = useMemo(() => {
    const names = new Set<string>();
    for (const dept of activeDepartments) {
      if (dept.name.trim()) names.add(dept.name.trim());
    }
    for (const member of roster) {
      if (member.dept.trim()) names.add(member.dept.trim());
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "en"));
  }, [activeDepartments, roster]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return roster
      .filter((member) => department === "all" || member.dept === department)
      .filter((member) => {
        if (!needle) return true;
        return (
          member.name.toLowerCase().includes(needle) ||
          member.id.toLowerCase().includes(needle) ||
          member.role.toLowerCase().includes(needle)
        );
      })
      .map((member) => ({
        member,
        record: getStaffAttendanceForMonth(member, month),
      }))
      .sort((a, b) => {
        if (Boolean(a.record) !== Boolean(b.record)) return a.record ? 1 : -1;
        return a.member.name.localeCompare(b.member.name, "en");
      });
  }, [department, month, query, roster]);

  const recorded = useMemo(
    () => rows.filter((row) => row.record).map((row) => row.record as StaffAttendanceMonth),
    [rows],
  );
  const average =
    recorded.length === 0
      ? null
      : Math.round(recorded.reduce((sum, row) => sum + attendancePercent(row), 0) / recorded.length);

  const problems = useMemo(() => draftProblems(draft), [draft]);
  const canSave = editing !== null && !saving && Object.keys(problems).length === 0;
  const dirty = useMemo(() => {
    if (!editing) return false;
    return JSON.stringify(draft) !== JSON.stringify(draftFromRow(getStaffAttendanceForMonth(editing, month)));
  }, [draft, editing, month]);

  useEffect(() => {
    if (!dirty) return;
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const openEditor = (member: Staff) => {
    setEditing(member);
    setDraft(draftFromRow(getStaffAttendanceForMonth(member, month)));
    setConfirmDiscard(false);
  };

  const closeEditor = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setConfirmDiscard(false);
    setSaving(false);
  };

  const requestClose = () => {
    if (saving) return;
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    closeEditor();
  };

  const patchDraft = (key: keyof Draft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: digits(value, 2) }));
    setConfirmDiscard(false);
  };

  const save = async () => {
    if (!editing || saving || !canSave) return;
    const normalized = normalizeStaffAttendanceMonth({
      month,
      workingDays: Number(draft.workingDays),
      daysPresent: Number(draft.daysPresent || 0),
      paidLeaveDays: Number(draft.paidLeaveDays || 0),
      unpaidLeaveDays: Number(draft.unpaidLeaveDays || 0),
    });
    if (!normalized) {
      toast.error("Enter working days before saving");
      return;
    }
    const previous = editing;
    const updated: Staff = {
      ...editing,
      attendanceByMonth: upsertStaffAttendanceMonth(editing.attendanceByMonth, normalized),
    };
    setSaving(true);
    setStaff((prev) => prev.map((member) => (member.id === updated.id ? updated : member)));
    try {
      const saved = await apiUpsertStaff(updated);
      const merged = normalizeStaff({
        ...updated,
        ...saved,
        attendanceByMonth: updated.attendanceByMonth,
      });
      setStaff((prev) => prev.map((member) => (member.id === updated.id ? merged : member)));
      toast.success(`Attendance saved · ${formatPayrollMonthLabel(month)}`, {
        description: `${updated.name} · ${normalized.daysPresent + normalized.paidLeaveDays}/${normalized.workingDays} payable days`,
      });
      closeEditor();
    } catch (err) {
      setStaff((prev) => prev.map((member) => (member.id === previous.id ? previous : member)));
      toast.error("Could not save staff attendance", {
        description: err instanceof Error ? err.message : "Try again",
      });
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AttendanceActions>
        <MonthPicker
          value={month}
          onChange={(next) => setMonth(next || currentPayrollMonth())}
          allowClear={false}
          placeholder="Select month"
          className="h-10 w-full min-w-0 rounded-xl"
        />
        <Button
          type="button"
          className="h-10 w-full rounded-full bg-[#0F766E] px-4 text-white hover:bg-[#0D9488]"
          disabled={roster.length === 0}
          onClick={() => setBulkOpen(true)}
        >
          <UserCheck className="mr-1.5 h-4 w-4 shrink-0" />
          <span className="truncate">Mark staff</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full rounded-full px-4"
          onClick={() => setUploadOpen(true)}
        >
          <Upload className="mr-1.5 h-4 w-4 shrink-0" />
          Upload
        </Button>
      </AttendanceActions>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryStat label="Staff" value={String(rows.length)} />
        <SummaryStat label="Recorded" value={String(recorded.length)} />
        <SummaryStat label="Not recorded" value={String(rows.length - recorded.length)} />
        <SummaryStat label="Average attendance" value={average === null ? "—" : `${average}%`} />
      </div>

      <section className={cn(glassCardClass, "p-4 sm:p-5")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, ID, or role"
              className="h-10 rounded-xl pl-9"
              aria-label="Search staff"
            />
          </div>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="h-10 w-full rounded-xl sm:w-56" aria-label="Department">
              <SelectValue placeholder="Department" />
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

        {rows.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-[13px] text-slate-500 dark:border-white/15 dark:text-zinc-400">
            {roster.length === 0
              ? "No active staff in this academic year."
              : "No staff match this search or department."}
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {["Staff", "Working", "Present", "Paid leave", "Unpaid", "Attendance", ""].map(
                    (header) => (
                      <th key={header || "action"} className="border-b border-slate-100 px-2 py-2 font-semibold dark:border-white/10">
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ member, record }) => (
                  <tr key={member.id} className="text-[13px] text-slate-800 dark:text-zinc-100">
                    <td className="border-b border-slate-100 px-2 py-3 dark:border-white/10">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {member.id} · {member.role}
                        {member.dept ? ` · ${member.dept}` : ""}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-2 py-3 font-mono dark:border-white/10">
                      {record ? record.workingDays : "—"}
                    </td>
                    <td className="border-b border-slate-100 px-2 py-3 font-mono dark:border-white/10">
                      {record ? record.daysPresent : "—"}
                    </td>
                    <td className="border-b border-slate-100 px-2 py-3 font-mono dark:border-white/10">
                      {record ? record.paidLeaveDays || 0 : "—"}
                    </td>
                    <td className="border-b border-slate-100 px-2 py-3 font-mono dark:border-white/10">
                      {record ? record.unpaidLeaveDays || 0 : "—"}
                    </td>
                    <td className="border-b border-slate-100 px-2 py-3 dark:border-white/10">
                      {record ? (
                        <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                          {attendancePercent(record)}%
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                          Not recorded
                        </span>
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-2 py-3 text-right dark:border-white/10">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-full px-3 text-[12px]"
                        onClick={() => openEditor(member)}
                      >
                        {record ? "Edit" : "Record"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AttendanceUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload staff attendance"
        description={`Download the mock Excel for ${formatPayrollMonthLabel(month)}, adjust leave, then upload.`}
        hint="Blank day counts mean full present for that month's weekdays. Present + paid leave + unpaid leave cannot pass working days."
        onDownloadMock={() => {
          const working = String(weekdaysInMonth(month) || 22);
          const sample = roster.length
            ? roster.map((member) => [member.id, member.name, month, working, working, "0", "0"])
            : [
                ["STF-004", "Anita Desai", month, working, working, "0", "0"],
                ["STF-002", "Arun Thomas", month, String(Math.max(0, Number(working) - 2)), working, "2", "0"],
                ["STF-013", "George Abraham", month, String(Math.max(0, Number(working) - 1)), working, "0", "1"],
              ];
          downloadBlobFile(
            buildXlsxBlob("Staff", [[...STAFF_ATTENDANCE_HEADERS], ...sample]),
            formatDownloadFilename("bulkDemo", "xlsx", {
              report: "staff-attendance",
              date: month,
              school: schoolDetails.name || "School",
            }),
          );
          toast.success("Mock Excel downloaded", {
            description: roster.length
              ? `${roster.length} staff listed as full present for ${formatPayrollMonthLabel(month)}.`
              : "Sample rows use STF-004 style IDs. Replace them with real staff IDs before upload.",
          });
        }}
        parseTable={(table) =>
          parseStaffAttendanceTable(table, {
            fallbackMonth: month,
            knownIds: new Set(roster.map((member) => member.id.toLowerCase())),
          })
        }
        onSave={async (rows) => {
          const byId = new Map(roster.map((member) => [member.id.toLowerCase(), member]));
          let savedCount = 0;
          for (const row of rows) {
            const member = byId.get(row.staffId.toLowerCase());
            if (!member) continue;
            const normalized = normalizeStaffAttendanceMonth({
              month: row.month,
              daysPresent: row.daysPresent,
              workingDays: row.workingDays,
              paidLeaveDays: row.paidLeaveDays,
              unpaidLeaveDays: row.unpaidLeaveDays,
            });
            if (!normalized) continue;
            const updated: Staff = {
              ...member,
              attendanceByMonth: upsertStaffAttendanceMonth(member.attendanceByMonth, normalized),
            };
            setStaff((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            try {
              const saved = await apiUpsertStaff(updated);
              const merged = normalizeStaff({
                ...updated,
                ...saved,
                attendanceByMonth: updated.attendanceByMonth,
              });
              setStaff((prev) => prev.map((item) => (item.id === updated.id ? merged : item)));
              byId.set(member.id.toLowerCase(), merged);
              savedCount += 1;
            } catch (err) {
              setStaff((prev) => prev.map((item) => (item.id === member.id ? member : item)));
              throw err instanceof Error
                ? new Error(
                    savedCount > 0
                      ? `${savedCount} saved before ${member.name} failed. ${err.message}`
                      : err.message,
                  )
                : err;
            }
          }
          toast.success("Staff attendance uploaded", {
            description: `${savedCount} staff recorded for ${formatPayrollMonthLabel(month)}.`,
          });
        }}
      />

      <MarkStaffAttendanceModal
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        month={month}
        roster={roster}
        departments={departments}
        initialDepartment={department}
      />

      <Dialog open={Boolean(editing)} onOpenChange={(open) => (open ? null : requestClose())}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Record attendance</DialogTitle>
            <DialogDescription>
              {editing?.name} · {formatPayrollMonthLabel(month)}. Payable days = present + paid
              leave.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Working days" error={problems.workingDays}>
              <Input
                inputMode="numeric"
                maxLength={2}
                value={draft.workingDays}
                onChange={(e) => patchDraft("workingDays", e.target.value)}
                placeholder="26"
                className="h-10 font-mono"
              />
            </Field>
            <Field label="Days present">
              <Input
                inputMode="numeric"
                maxLength={2}
                value={draft.daysPresent}
                onChange={(e) => patchDraft("daysPresent", e.target.value)}
                placeholder="0"
                className="h-10 font-mono"
              />
            </Field>
            <Field label="Paid leave">
              <Input
                inputMode="numeric"
                maxLength={2}
                value={draft.paidLeaveDays}
                onChange={(e) => patchDraft("paidLeaveDays", e.target.value)}
                placeholder="0"
                className="h-10 font-mono"
              />
            </Field>
            <Field label="Unpaid leave">
              <Input
                inputMode="numeric"
                maxLength={2}
                value={draft.unpaidLeaveDays}
                onChange={(e) => patchDraft("unpaidLeaveDays", e.target.value)}
                placeholder="0"
                className="h-10 font-mono"
              />
            </Field>
          </div>
          {problems.total ? (
            <p className="text-[12px] font-medium text-[#B91C1C]">{problems.total}</p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-2">
            {confirmDiscard ? (
              <>
                <Button type="button" variant="outline" onClick={() => setConfirmDiscard(false)}>
                  Keep editing
                </Button>
                <Button type="button" variant="outline" onClick={closeEditor}>
                  Discard
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={requestClose} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
                  disabled={!canSave}
                  onClick={() => void save()}
                >
                  {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  Save attendance
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
        {label}
      </Label>
      {children}
      {error ? <p className="text-[12px] font-medium text-[#B91C1C]">{error}</p> : null}
    </div>
  );
}
