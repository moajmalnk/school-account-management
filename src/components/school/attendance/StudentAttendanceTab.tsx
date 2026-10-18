import { CalendarDays, Loader2, UserCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { MarkStudentAttendanceModal } from "@/components/school/attendance/MarkStudentAttendanceModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiAttendanceStudentHistory } from "@/lib/api/attendance";
import {
  ATTENDANCE_STATUS_COLORS,
  ATTENDANCE_STATUS_LABELS,
  monthBounds,
  parseClassDivision,
  todayYmd,
  type AttendanceStudentHistoryResponse,
  type StudentAttendanceStatus,
} from "@/lib/student-attendance";
import type { Student } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

export function StudentAttendanceTab({ student }: { student: Student }) {
  const initialMonth = todayYmd().slice(0, 7);
  const [month, setMonth] = useState(initialMonth);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<AttendanceStudentHistoryResponse | null>(null);
  const [markOpen, setMarkOpen] = useState(false);

  const bounds = useMemo(() => monthBounds(month), [month]);
  const { grade, division } = useMemo(() => parseClassDivision(student.cls || ""), [student.cls]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiAttendanceStudentHistory({
        studentId: student.id,
        from: bounds.from,
        to: bounds.to,
      });
      setHistory(data);
    } catch (err) {
      toast.error("Could not load attendance", {
        description: err instanceof Error ? err.message : "Try again",
      });
      setHistory(null);
    } finally {
      setLoading(false);
    }
  }, [student.id, bounds.from, bounds.to]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const counts = history?.counts;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900 dark:text-zinc-50">
            Attendance history
          </h3>
          <p className="text-[12px] text-slate-500 dark:text-zinc-400">
            Daily marks for {student.name}
            {student.cls ? ` · ${student.cls}` : ""}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="space-y-1">
            <Label htmlFor="stu-att-month" className="text-[11px] text-slate-500">
              Month
            </Label>
            <Input
              id="stu-att-month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-9 w-[10.5rem] rounded-xl"
            />
          </div>
          <Button
            type="button"
            className="h-9 rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
            onClick={() => setMarkOpen(true)}
          >
            <UserCheck className="mr-1.5 h-3.5 w-3.5" />
            Mark today
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {(
          [
            ["Present", counts?.present ?? 0, "present"],
            ["Absent", counts?.absent ?? 0, "absent"],
            ["Halfday", counts?.halfday ?? 0, "halfday"],
            ["Late", counts?.late ?? 0, "late"],
            ["Leave", counts?.leave ?? 0, "leave"],
          ] as const
        ).map(([label, value, tone]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-white/10 dark:bg-white/5"
          >
            <div
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                ATTENDANCE_STATUS_COLORS[tone].soft.split(" ").slice(1).join(" "),
              )}
            >
              {label}
            </div>
            <div className="text-[18px] font-semibold tabular-nums text-slate-900 dark:text-zinc-50">
              {loading ? "—" : value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-zinc-900/40">
        <CalendarDays className="h-4 w-4 text-[#0F766E]" />
        <div className="text-[13px] text-slate-600 dark:text-zinc-300">
          {loading ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </span>
          ) : (
            <>
              <span className="font-semibold text-slate-900 dark:text-zinc-50">
                {history?.percent ?? 0}%
              </span>{" "}
              attendance this month
              {counts?.total ? (
                <span className="text-slate-400"> · {counts.total} day(s) marked</span>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-white/10">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : !history?.marks.length ? (
          <div className="px-4 py-10 text-center text-[13px] text-slate-500">
            No attendance marked for this month yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {history.marks.map((m) => (
              <li
                key={m.date}
                className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-slate-900 dark:text-zinc-50">
                    {m.date}
                  </div>
                  {m.note ? (
                    <div className="truncate text-[11px] text-slate-500">{m.note}</div>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    ATTENDANCE_STATUS_COLORS[m.status as StudentAttendanceStatus]?.soft,
                  )}
                >
                  {ATTENDANCE_STATUS_LABELS[m.status as StudentAttendanceStatus]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <MarkStudentAttendanceModal
        open={markOpen}
        onOpenChange={setMarkOpen}
        date={todayYmd()}
        initialClass={grade || "all"}
        initialDivision={division || "all"}
        onSaved={() => void refresh()}
      />
    </div>
  );
}
