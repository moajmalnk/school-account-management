import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { toast } from "sonner";

import {
  FamilyCard,
  FamilyFeatureTile,
  FamilyHeader,
  FamilyPillButton,
  FamilySkeleton,
} from "@/components/family/FamilyChrome";
import { familyAcademics, familyReport } from "@/lib/api/family";
import { ApiError } from "@/lib/api/client";
import { downloadFamilyReportCard } from "@/lib/family-report-card-pdf";
import { useFamily } from "@/lib/family-session";

const ILLUSTRATIONS = {
  attendance: "/family/illustrations/attendance.svg",
  leave: "/family/illustrations/leave.svg",
  exam: "/family/illustrations/exam.svg",
  report: "/family/illustrations/report.svg",
} as const;

export function FamilyAcademics() {
  const { student } = useFamily();
  const [data, setData] = useState<Awaited<ReturnType<typeof familyAcademics>> | null>(null);
  const [examId, setExamId] = useState<string | null>(null);
  const [mode, setMode] = useState<"home" | "results" | "report">("home");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!student) return;
    let cancelled = false;
    setData(null);
    familyAcademics(student.id)
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load academics");
      });
    return () => {
      cancelled = true;
    };
  }, [student]);

  async function download(id: string) {
    if (!student || busy) return;
    setBusy(true);
    setExamId(id);
    try {
      const report = await familyReport(student.id, id);
      await downloadFamilyReportCard(report);
      toast.success("Report card downloaded");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not download the report card");
    } finally {
      setBusy(false);
    }
  }

  if (!student) return <p className="px-4 pt-6 text-sm">No student is linked yet.</p>;
  if (error) {
    const unavailable = /not available/i.test(error);
    return (
      <>
        <FamilyHeader showBell={false} />
        <div className="px-4">
          <FamilyCard>
            <h1 className="text-lg font-bold">Academics</h1>
            <p className="mt-2 text-sm text-[var(--family-ink-muted)]">
              {unavailable ? "Exam results are not available for this school yet." : error}
            </p>
          </FamilyCard>
        </div>
      </>
    );
  }
  if (!data) {
    return (
      <>
        <FamilyHeader showBell={false} />
        <FamilySkeleton />
      </>
    );
  }

  const chartData = data.performance.map((item, index) => ({
    ...item,
    label: `Test ${index + 1}`,
  }));

  return (
    <>
      <FamilyHeader showBell={false} />
      <div className="space-y-4 px-4 pb-6">
        {mode === "home" ? (
          <>
            <FamilyCard className="relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[15px] font-bold text-[var(--family-ink)]">Performance</h2>
                {chartData.length > 0 ? (
                  <span className="rounded-full bg-[var(--family-lavender)] px-2.5 py-1 text-[10px] font-bold text-[var(--family-lavender-deep)]">
                    Last {Math.min(chartData.length, 6)} tests
                  </span>
                ) : null}
              </div>
              {chartData.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--family-ink-muted)]">Published exam results will appear here.</p>
              ) : (
                <div className="mt-3 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.slice(-6)} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="familyPerf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B7CF7" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#8B7CF7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="rgba(26,26,75,0.08)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#6B6B8D", fontSize: 10, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "none",
                          boxShadow: "0 8px 24px rgba(26,26,75,0.12)",
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="percent"
                        stroke="#6B5CE7"
                        strokeWidth={2.5}
                        fill="url(#familyPerf)"
                        dot={{ r: 4, fill: "#6B5CE7", stroke: "#fff", strokeWidth: 2 }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </FamilyCard>

            <div className="grid grid-cols-2 gap-3">
              <FamilyFeatureTile
                label="Attendance"
                href="/family/attendance"
                illustration={ILLUSTRATIONS.attendance}
                tone="mint"
              />
              <FamilyFeatureTile
                label="Leave"
                href="/family/leave"
                illustration={ILLUSTRATIONS.leave}
                tone="lavender"
              />
              <FamilyFeatureTile
                label="Exam & Result"
                illustration={ILLUSTRATIONS.exam}
                tone="cream"
                onClick={() => setMode("results")}
              />
              <FamilyFeatureTile
                label="Report card"
                illustration={ILLUSTRATIONS.report}
                tone="sky"
                onClick={() => setMode("report")}
              />
            </div>
          </>
        ) : null}

        {mode !== "home" ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--family-lavender-deep)]"
            onClick={() => {
              setMode("home");
              setExamId(null);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        ) : null}

        {mode === "results" || mode === "report" ? (
          data.exams.length === 0 ? (
            <FamilyCard>
              <p className="text-sm text-[var(--family-ink-muted)]">No published exams for this year.</p>
            </FamilyCard>
          ) : (
            data.exams.map((exam) => (
              <FamilyCard key={exam.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{exam.name}</p>
                  <p className="text-xs text-[var(--family-ink-muted)]">{exam.academicYear}</p>
                </div>
                {mode === "report" ? (
                  <FamilyPillButton
                    className="h-10 px-4 text-xs"
                    disabled={busy}
                    onClick={() => void download(exam.id)}
                  >
                    {busy && examId === exam.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "PDF"}
                  </FamilyPillButton>
                ) : (
                  <button
                    type="button"
                    className="text-sm font-bold text-[var(--family-lavender-deep)]"
                    onClick={() => setExamId(exam.id === examId ? null : exam.id)}
                  >
                    {examId === exam.id ? "Hide" : "View"}
                  </button>
                )}
              </FamilyCard>
            ))
          )
        ) : null}
        {mode === "results" && examId ? <ExamDetail studentId={student.id} examId={examId} /> : null}
      </div>
    </>
  );
}

function ExamDetail({ studentId, examId }: { studentId: string; examId: string }) {
  const [report, setReport] = useState<Awaited<ReturnType<typeof familyReport>> | null>(null);
  useEffect(() => {
    let cancelled = false;
    familyReport(studentId, examId).then((next) => {
      if (!cancelled) setReport(next);
    });
    return () => {
      cancelled = true;
    };
  }, [studentId, examId]);
  if (!report) return <FamilySkeleton />;
  return (
    <FamilyCard>
      <p className="text-2xl font-extrabold text-[var(--family-lavender-deep)]">{report.result.percent}%</p>
      <ul className="mt-3 space-y-2">
        {report.result.subjects.map((subject) => (
          <li key={subject.name} className="flex justify-between text-sm font-medium">
            <span>{subject.name}</span>
            <span className="tabular-nums">
              {subject.score} / {subject.max}
            </span>
          </li>
        ))}
      </ul>
      {report.result.subjects.length === 0 ? (
        <p className="text-sm text-[var(--family-ink-muted)]">Marks are not entered yet.</p>
      ) : null}
    </FamilyCard>
  );
}
