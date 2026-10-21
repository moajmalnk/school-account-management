import { jsPDF } from "jspdf";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { toast } from "sonner";

import { FamilyCard, FamilyHeader, FamilySkeleton } from "@/components/family/FamilyChrome";
import { Button } from "@/components/ui/button";
import { familyAcademics, familyReport } from "@/lib/api/family";
import { ApiError } from "@/lib/api/client";
import { useFamily } from "@/lib/family-session";

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
    try {
      const report = await familyReport(student.id, id);
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(report.school.name || "Report card", 14, 18);
      doc.setFontSize(12);
      doc.text(`${report.result.exam.name} · ${report.result.exam.academicYear}`, 14, 28);
      doc.text(`${report.student.name} · ${report.student.cls}`, 14, 36);
      let y = 48;
      report.result.subjects.forEach((subject) => {
        doc.text(`${subject.name}: ${subject.score} / ${subject.max}`, 14, y);
        y += 8;
      });
      doc.text(`Total: ${report.result.score} / ${report.result.max} (${report.result.percent}%)`, 14, y + 4);
      if (report.attendancePercent !== null) {
        doc.text(`Attendance: ${report.attendancePercent}%`, 14, y + 14);
      }
      doc.save(`${report.student.name}-${report.result.exam.name}.pdf`);
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
            <h1 className="text-lg font-semibold">Academics</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-zinc-300">
              {unavailable
                ? "Exam results are not available for this school yet."
                : error}
            </p>
          </FamilyCard>
        </div>
      </>
    );
  }
  if (!data) {
    return (
      <>
        <FamilyHeader />
        <FamilySkeleton />
      </>
    );
  }

  return (
    <>
      <FamilyHeader />
      <div className="space-y-4 px-4 pb-4">
        {mode === "home" ? (
          <>
            <FamilyCard>
              <h2 className="text-sm font-semibold">Performance</h2>
              {data.performance.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Published exam results will appear here.</p>
              ) : (
                <div className="mt-3 h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.performance}>
                      <XAxis dataKey="name" hide />
                      <Tooltip />
                      <Area dataKey="percent" stroke="#0F766E" fill="#99F6E4" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </FamilyCard>
            <div className="grid grid-cols-2 gap-3">
              <Tile label="Attendance" onClick={() => (window.location.href = "/family/attendance")} />
              <Tile label="Leave" onClick={() => (window.location.href = "/family/leave")} />
              <Tile label="Exam & result" onClick={() => setMode("results")} />
              <Tile label="Report card" onClick={() => setMode("report")} />
            </div>
          </>
        ) : null}
        {mode !== "home" ? (
          <button type="button" className="text-sm font-medium text-[#0F766E]" onClick={() => setMode("home")}>
            Back
          </button>
        ) : null}
        {mode === "results" || mode === "report" ? (
          data.exams.length === 0 ? (
            <FamilyCard>
              <p className="text-sm text-slate-500">No published exams for this year.</p>
            </FamilyCard>
          ) : (
            data.exams.map((exam) => (
              <FamilyCard key={exam.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{exam.name}</p>
                  <p className="text-xs text-slate-500">{exam.academicYear}</p>
                </div>
                {mode === "report" ? (
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => void download(exam.id)}
                    className="rounded-xl bg-[#0F766E] text-white hover:bg-[#0D9488]"
                  >
                    {busy && examId === exam.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "PDF"}
                  </Button>
                ) : (
                  <button
                    type="button"
                    className="text-sm font-medium text-[#0F766E]"
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

function Tile({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-24 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-medium dark:border-white/10 dark:bg-zinc-900"
    >
      {label}
    </button>
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
      <p className="text-sm font-semibold">{report.result.percent}%</p>
      <ul className="mt-3 space-y-2">
        {report.result.subjects.map((subject) => (
          <li key={subject.name} className="flex justify-between text-sm">
            <span>{subject.name}</span>
            <span>
              {subject.score} / {subject.max}
            </span>
          </li>
        ))}
      </ul>
      {report.result.subjects.length === 0 ? <p className="text-sm text-slate-500">Marks are not entered yet.</p> : null}
    </FamilyCard>
  );
}
