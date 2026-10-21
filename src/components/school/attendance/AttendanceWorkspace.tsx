import {
  CalendarDays,
  ClipboardList,
  FileText,
  Loader2,
  MessageCircle,
  Upload,
  UserCheck,
  UserX,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ParentLeaveInbox } from "@/components/school/ParentLeaveInbox";
import { AttendanceActions, AttendanceToolbarProvider } from "@/components/school/attendance/attendance-toolbar";
import { AttendanceUploadDialog } from "@/components/school/attendance/AttendanceUploadDialog";
import { MarkStudentAttendanceModal } from "@/components/school/attendance/MarkStudentAttendanceModal";
import { StaffAttendancePanel } from "@/components/school/attendance/StaffAttendancePanel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  apiAttendanceDay,
  apiAttendanceMark,
  apiAttendanceReport,
  apiAttendanceSummary,
} from "@/lib/api/attendance";
import {
  buildAttendanceDailyPdfBlob,
  buildAttendanceMonthlyPdfBlob,
  downloadAttendanceDailyPdf,
  downloadAttendanceDetailedPdf,
  downloadAttendanceMonthlyPdf,
} from "@/lib/attendance-export";
import {
  ATTENDANCE_STATUS_COLORS,
  ATTENDANCE_STATUS_LABELS,
  monthBounds,
  parseClassDivision,
  todayYmd,
  type AttendanceReportResponse,
  type AttendanceRosterStudent,
  type AttendanceSummaryResponse,
  type StudentAttendanceStatus,
} from "@/lib/student-attendance";
import {
  parseStudentAttendanceTable,
  STUDENT_ATTENDANCE_HEADERS,
} from "@/lib/attendance-import";
import { formatDownloadFilename } from "@/lib/download-names";
import { downloadBlobFile } from "@/lib/finance-export";
import { buildXlsxBlob } from "@/lib/xlsx-workbook";
import { useTenantStore } from "@/lib/tenant-store";
import { cn, glassCardClass } from "@/lib/utils";
import { loadWhatsAppTemplates } from "@/lib/whatsapp-messages";
import {
  renderWhatsAppTemplate,
  sharePdfViaWhatsApp,
} from "@/lib/whatsapp-notify";

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "present" | "absent" | "halfday" | "leave" | "late";
}) {
  const soft =
    tone === "present"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "absent"
        ? "text-red-600 dark:text-red-300"
        : tone === "halfday"
          ? "text-orange-600 dark:text-orange-300"
          : tone === "late"
            ? "text-amber-700 dark:text-amber-300"
            : "text-sky-700 dark:text-sky-300";
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5">
      <div className={cn("text-[11px] font-semibold uppercase tracking-wide", soft)}>{label}</div>
      <div className="text-[20px] font-semibold tabular-nums text-slate-900 dark:text-zinc-50">
        {value}
      </div>
    </div>
  );
}

function TrendChart({
  points,
  enrolled,
}: {
  points: AttendanceSummaryResponse["trend"];
  enrolled: number;
}) {
  const max = Math.max(enrolled, 1, ...points.map((p) => p.present + p.halfday + p.late));
  const w = 320;
  const h = 120;
  const pad = 8;

  const toPath = (key: "present" | "absent" | "halfday" | "leave") => {
    if (points.length === 0) return "";
    return points
      .map((p, i) => {
        const x = pad + (i / Math.max(points.length - 1, 1)) * (w - pad * 2);
        const y = h - pad - (p[key] / max) * (h - pad * 2);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  };

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-36 w-full" role="img" aria-label="Attendance trend">
        <path d={toPath("present")} fill="none" stroke="#059669" strokeWidth="2" />
        <path d={toPath("halfday")} fill="none" stroke="#f97316" strokeWidth="1.5" />
        <path d={toPath("leave")} fill="none" stroke="#0284c7" strokeWidth="1.5" />
        <path d={toPath("absent")} fill="none" stroke="#ef4444" strokeWidth="1.5" />
      </svg>
      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-600" /> Present
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-orange-500" /> Half day
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sky-600" /> Leave
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Absent
        </span>
      </div>
    </div>
  );
}

function Donut({ percent }: { percent: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c - (clamped / 100) * c;
  return (
    <div className="relative mx-auto grid h-36 w-36 place-items-center">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" className="text-slate-100 dark:text-white/10" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#059669"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[22px] font-bold tabular-nums text-slate-900 dark:text-zinc-50">
            {clamped}%
          </div>
          <div className="text-[11px] font-medium text-slate-500">Present</div>
        </div>
      </div>
    </div>
  );
}

function StudentAttendanceBoard() {
  const { schoolDetails, classes: classConfigs, students } = useTenantStore();
  const schoolName = schoolDetails.name || "School";

  const [date, setDate] = useState(todayYmd);
  const [summary, setSummary] = useState<AttendanceSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [markOpen, setMarkOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [markClass, setMarkClass] = useState("all");
  const [markDivision, setMarkDivision] = useState("all");

  const [reportOpen, setReportOpen] = useState(false);
  const [reportMode, setReportMode] = useState<"daily" | "monthly" | "detailed">("daily");
  const [reportClass, setReportClass] = useState("all");
  const [reportDivision, setReportDivision] = useState("all");
  const [reportBusy, setReportBusy] = useState(false);
  const [reportData, setReportData] = useState<AttendanceReportResponse | null>(null);
  const [dayRoster, setDayRoster] = useState<AttendanceRosterStudent[]>([]);

  const gradeOptions = useMemo(() => {
    const grades = new Set<string>();
    for (const c of classConfigs) {
      const label = c.className || `${c.grade}${c.section ? ` - ${c.section}` : ""}`;
      const { grade } = parseClassDivision(label);
      if (grade) grades.add(grade);
    }
    return Array.from(grades).sort();
  }, [classConfigs]);

  const divisionOptions = useMemo(() => {
    const divs = new Set<string>();
    for (const c of classConfigs) {
      const label = c.className || `${c.grade}${c.section ? ` - ${c.section}` : ""}`;
      const { grade, division } = parseClassDivision(label);
      if (reportClass !== "all" && grade !== reportClass) continue;
      if (division) divs.add(division);
    }
    return Array.from(divs).sort();
  }, [classConfigs, reportClass]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiAttendanceSummary(date);
      setSummary(data);
    } catch (err) {
      toast.error("Could not load attendance", {
        description: err instanceof Error ? err.message : "Try again",
      });
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openMark = (cls = "all", division = "all") => {
    setMarkClass(cls);
    setMarkDivision(division);
    setMarkOpen(true);
  };

  const openReport = async (mode: "daily" | "monthly" | "detailed") => {
    setReportMode(mode);
    setReportOpen(true);
    setReportBusy(true);
    setReportData(null);
    try {
      if (mode === "daily") {
        const day = await apiAttendanceDay({
          date,
          class: reportClass,
          division: reportDivision,
        });
        setDayRoster(day.students);
      } else {
        const bounds = monthBounds(date);
        const from = mode === "monthly" ? bounds.from : bounds.from;
        const to = mode === "monthly" ? bounds.to : bounds.to;
        const report = await apiAttendanceReport({
          from,
          to,
          class: reportClass,
          division: reportDivision,
        });
        setReportData(report);
      }
    } catch (err) {
      toast.error("Could not load report", {
        description: err instanceof Error ? err.message : "Try again",
      });
    } finally {
      setReportBusy(false);
    }
  };

  const reloadReport = async () => {
    await openReport(reportMode);
  };

  const exportPdf = () => {
    if (reportMode === "daily") {
      downloadAttendanceDailyPdf({
        date,
        students: dayRoster,
        schoolName,
        classLabel:
          reportClass === "all"
            ? "All classes"
            : `${reportClass}${reportDivision !== "all" ? ` - ${reportDivision}` : ""}`,
      });
      return;
    }
    if (!reportData) return;
    if (reportMode === "monthly") {
      downloadAttendanceMonthlyPdf({ report: reportData, schoolName });
    } else {
      downloadAttendanceDetailedPdf({ report: reportData, schoolName });
    }
  };

  const shareWhatsAppReport = async () => {
    setReportBusy(true);
    try {
      const templates = loadWhatsAppTemplates();
      if (reportMode === "daily") {
        const { blob, filename } = buildAttendanceDailyPdfBlob({
          date,
          students: dayRoster,
          schoolName,
          classLabel:
            reportClass === "all"
              ? "All classes"
              : `${reportClass}${reportDivision !== "all" ? ` - ${reportDivision}` : ""}`,
        });
        const counts = {
          present: dayRoster.filter((s) => s.status === "present").length,
          absent: dayRoster.filter((s) => s.status === "absent").length,
          halfday: dayRoster.filter((s) => s.status === "halfday").length,
          leave: dayRoster.filter((s) => s.status === "leave").length,
        };
        const message = renderWhatsAppTemplate(templates.attendanceDailyReport, {
          school: schoolName,
          date,
          summary: `Present ${counts.present} · Absent ${counts.absent} · Halfday ${counts.halfday} · Leave ${counts.leave}`,
        });
        await sharePdfViaWhatsApp({
          blob,
          filename,
          message,
          downloadFallback: (b, name) => {
            const url = URL.createObjectURL(b);
            const a = document.createElement("a");
            a.href = url;
            a.download = name;
            a.click();
            URL.revokeObjectURL(url);
          },
        });
      } else if (reportData) {
        const { blob, filename } = buildAttendanceMonthlyPdfBlob({
          report: reportData,
          schoolName,
        });
        const avg =
          reportData.byStudent.length > 0
            ? Math.round(
                reportData.byStudent.reduce((sum, s) => sum + s.percent, 0) /
                  reportData.byStudent.length,
              )
            : 0;
        const message = renderWhatsAppTemplate(templates.attendanceMonthlyReport, {
          school: schoolName,
          period: `${reportData.from.slice(0, 7)}`,
          summary: `${reportData.enrolled} students · avg ${avg}% present`,
        });
        await sharePdfViaWhatsApp({
          blob,
          filename,
          message,
          downloadFallback: (b, name) => {
            const url = URL.createObjectURL(b);
            const a = document.createElement("a");
            a.href = url;
            a.download = name;
            a.click();
            URL.revokeObjectURL(url);
          },
        });
      }
      toast.success("Report ready", { description: "WhatsApp share opened (or PDF downloaded)." });
    } catch (err) {
      toast.error("Could not share report", {
        description: err instanceof Error ? err.message : "Try again",
      });
    } finally {
      setReportBusy(false);
    }
  };

  const counts = summary?.counts;
  const notPresent = summary?.notPresent ?? [];

  return (
    <div className="space-y-4">
      <ParentLeaveInbox />
      <AttendanceActions>
        <DatePicker
          value={date}
          onChange={setDate}
          valueFormat="iso"
          placeholder="Pick date"
          align="end"
          quickPicks={[{ label: "Today", getDate: (t) => t }]}
          className="h-10 w-full min-w-0 rounded-xl border-slate-200 dark:border-white/10"
        />
        <Button
          type="button"
          className="h-10 w-full rounded-full bg-[#0F766E] px-4 text-white hover:bg-[#0D9488]"
          onClick={() => openMark()}
        >
          <UserCheck className="mr-1.5 h-4 w-4 shrink-0" />
          <span className="truncate">Mark students</span>
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

      <div className="grid grid-cols-12 gap-4">
        <section className={cn(glassCardClass, "col-span-12 p-4 sm:p-5 lg:col-span-5")}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-[13px] font-semibold text-slate-900 dark:text-zinc-50">
                Students · this month
              </div>
              <div className="text-[12px] text-slate-500">
                {summary?.enrolled ?? "—"} enrolled
              </div>
            </div>
            <CalendarDays className="h-4 w-4 text-slate-400" />
          </div>
          {loading ? (
            <Skeleton className="h-36 w-full rounded-xl" />
          ) : (
            <TrendChart points={summary?.trend ?? []} enrolled={summary?.enrolled ?? 0} />
          )}
        </section>

        <section className={cn(glassCardClass, "col-span-12 p-4 sm:p-5 lg:col-span-4")}>
          <div className="mb-2 text-[13px] font-semibold text-slate-900 dark:text-zinc-50">
            Today&apos;s summary
          </div>
          {loading ? (
            <Skeleton className="mx-auto h-36 w-36 rounded-full" />
          ) : (
            <Donut percent={summary?.presentPercent ?? 0} />
          )}
          <div className="mt-3 max-h-40 space-y-1.5 overflow-y-auto">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Not present today
            </div>
            {loading ? (
              <Skeleton className="h-16 w-full rounded-xl" />
            ) : notPresent.length === 0 ? (
              <p className="text-[13px] text-slate-500">Everyone marked present — or not yet marked.</p>
            ) : (
              notPresent.slice(0, 12).map((row) => (
                <div
                  key={row.studentId}
                  className="flex items-center justify-between gap-2 rounded-lg px-1 py-1"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-slate-800 dark:text-zinc-100">
                      {row.name}
                    </div>
                    <div className="truncate text-[11px] text-slate-500">{row.cls}</div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      ATTENDANCE_STATUS_COLORS[row.status as StudentAttendanceStatus]?.soft,
                    )}
                  >
                    {ATTENDANCE_STATUS_LABELS[row.status as StudentAttendanceStatus]}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={cn(glassCardClass, "col-span-12 space-y-3 p-4 sm:p-5 lg:col-span-3")}>
          <div className="text-[13px] font-semibold text-slate-900 dark:text-zinc-50">
            Quick actions
          </div>
          <Button
            type="button"
            className="h-11 w-full rounded-xl bg-[#0F766E] text-white hover:bg-[#0D9488]"
            onClick={() => openMark()}
          >
            Mark students
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            Upload Excel
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => openMark()}>
              <ClipboardList className="mr-1 h-3.5 w-3.5" />
              Mark
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => void openReport("daily")}
            >
              <FileText className="mr-1 h-3.5 w-3.5" />
              Daily
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => void openReport("monthly")}
            >
              Monthly
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => void openReport("detailed")}
            >
              Detailed
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StatPill label="Present" value={counts?.present ?? 0} tone="present" />
            <StatPill label="Absent" value={counts?.absent ?? 0} tone="absent" />
            <StatPill label="Halfday" value={counts?.halfday ?? 0} tone="halfday" />
            <StatPill label="Leave" value={counts?.leave ?? 0} tone="leave" />
          </div>
        </section>

        <section className={cn(glassCardClass, "col-span-12 p-4 sm:p-5 lg:col-span-4")}>
          <div className="mb-3 text-[13px] font-semibold text-slate-900 dark:text-zinc-50">
            Reports &amp; analytics
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 justify-start rounded-xl"
              onClick={() => void openReport("daily")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Daily report
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 justify-start rounded-xl"
              onClick={() => void openReport("monthly")}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Monthly report
            </Button>
            <Button
              type="button"
              className="h-10 justify-start rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900"
              onClick={() => void openReport("detailed")}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Detailed report
            </Button>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-slate-500 dark:text-zinc-400">
            Export PDF registers and share them on WhatsApp. Absence alerts go out after you save
            marks.
          </p>
        </section>

        <section className={cn(glassCardClass, "col-span-12 p-4 sm:p-5 lg:col-span-8")}>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[13px] font-semibold text-slate-900 dark:text-zinc-50">
              Live snapshot · {date}
            </div>
            {(counts?.unmarked ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <UserX className="h-3 w-3" />
                {counts?.unmarked} unmarked
              </span>
            ) : null}
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StatPill label="Present" value={counts?.present ?? 0} tone="present" />
              <StatPill label="Absent" value={counts?.absent ?? 0} tone="absent" />
              <StatPill label="Halfday" value={counts?.halfday ?? 0} tone="halfday" />
              <StatPill label="Late" value={counts?.late ?? 0} tone="late" />
              <StatPill label="Leave" value={counts?.leave ?? 0} tone="leave" />
            </div>
          )}
        </section>
      </div>

      <AttendanceUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload student attendance"
        description="Download the mock Excel, set each status, then upload the same sheet."
        hint="Status is Present, Absent, Halfday, Late, or Leave. A blank status is saved as Present. Student ID must match the register."
        onDownloadMock={() => {
          const live = students.filter((student) => !student.deletedAt && student.active !== false);
          const sample = live.length
            ? live.map((student) => [date, student.id, student.name, student.cls || "", "Present"])
            : [
                [date, "STU-001", "Aarav Menon", "Grade 8 - B", "Present"],
                [date, "STU-009", "Aditya Joshi", "Grade 9 - A", "Absent"],
                [date, "STU-016", "Aisha Rahman", "Grade 9 - A", "Leave"],
              ];
          downloadBlobFile(
            buildXlsxBlob("Students", [[...STUDENT_ATTENDANCE_HEADERS], ...sample]),
            formatDownloadFilename("bulkDemo", "xlsx", {
              report: "student-attendance",
              date,
              school: schoolName,
            }),
          );
          toast.success("Mock Excel downloaded", {
            description: live.length
              ? `${live.length} students listed as Present for ${date}. Change only the exceptions.`
              : "Sample rows use STU-001 style IDs. Replace them with real student IDs before upload.",
          });
        }}
        parseTable={(table) =>
          parseStudentAttendanceTable(table, {
            fallbackDate: date,
            knownIds: new Set(
              students
                .filter((student) => !student.deletedAt && student.active !== false)
                .map((student) => student.id.toLowerCase()),
            ),
          })
        }
        onSave={async (rows) => {
          const canonical = new Map(
            students.map((student) => [student.id.toLowerCase(), student.id]),
          );
          const byDate = new Map<string, Array<{ studentId: string; status: StudentAttendanceStatus }>>();
          for (const row of rows) {
            const studentId = canonical.get(row.studentId.toLowerCase()) ?? row.studentId;
            const list = byDate.get(row.date) ?? [];
            list.push({ studentId, status: row.status });
            byDate.set(row.date, list);
          }
          let saved = 0;
          for (const [markDate, marks] of byDate) {
            const result = await apiAttendanceMark({ date: markDate, marks });
            saved += result.saved;
          }
          toast.success("Student attendance uploaded", {
            description: `${saved} mark${saved === 1 ? "" : "s"} saved.`,
          });
          await refresh();
        }}
      />

      <MarkStudentAttendanceModal
        open={markOpen}
        onOpenChange={setMarkOpen}
        date={date}
        initialClass={markClass}
        initialDivision={markDivision}
        onSaved={() => void refresh()}
      />

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="capitalize">{reportMode} attendance report</DialogTitle>
            <DialogDescription>
              Filter by class, then download PDF or share on WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Class</Label>
              <Select
                value={reportClass}
                onValueChange={(v) => {
                  setReportClass(v);
                  setReportDivision("all");
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
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
              <Label>Division</Label>
              <Select value={reportDivision} onValueChange={setReportDivision}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
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
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={reportBusy}
            onClick={() => void reloadReport()}
          >
            {reportBusy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Refresh data
          </Button>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={reportBusy || (reportMode === "daily" ? dayRoster.length === 0 : !reportData)}
              onClick={exportPdf}
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Download PDF
            </Button>
            <Button
              type="button"
              className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
              disabled={reportBusy || (reportMode === "daily" ? dayRoster.length === 0 : !reportData)}
              onClick={() => void shareWhatsAppReport()}
            >
              {reportBusy ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
              )}
              WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AttendanceWorkspace() {
  const [tab, setTab] = useState<"students" | "staff">("students");
  const [actionsHost, setActionsHost] = useState<HTMLDivElement | null>(null);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 pt-3 sm:px-4 md:px-6 md:pb-8">
      <h1 className="text-[22px] font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
        Attendance
      </h1>
      <div className="grid w-full grid-cols-1 gap-2 lg:grid-cols-5">
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value === "staff" ? "staff" : "students")}
          className="min-w-0 lg:col-span-2"
        >
          <TabsList className="grid h-10 w-full grid-cols-2 rounded-full bg-slate-100 p-1 dark:bg-white/10">
            <TabsTrigger value="students" className="h-8 w-full rounded-full px-2 data-[state=active]:text-[#0F766E]">
              <span className="truncate">Students attendance</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="h-8 w-full rounded-full px-2 data-[state=active]:text-[#0F766E]">
              <span className="truncate">Staff attendance</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div ref={setActionsHost} className="grid min-w-0 grid-cols-3 gap-2 lg:col-span-3" />
      </div>
      <AttendanceToolbarProvider host={actionsHost}>
        {tab === "students" ? <StudentAttendanceBoard /> : <StaffAttendancePanel />}
      </AttendanceToolbarProvider>
    </div>
  );
}
