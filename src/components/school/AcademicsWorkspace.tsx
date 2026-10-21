import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { schoolAcademics, schoolAcademicsAction } from "@/lib/api/school-family";
import { ApiError } from "@/lib/api/client";
import { useTenantStore } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

type Subject = { id: string; name: string; code: string; active: boolean };
type Exam = { id: string; name: string; academicYear: string; published: boolean };
type MarkRow = { id: string; name: string; scores: Record<string, string> };

const NAME_MAX = 80;

/**
 * School exam setup lives in Settings. Subjects are the columns,
 * exams are the papers, and marks are entered one class at a time.
 */
export function AcademicsWorkspace() {
  const { classes, academicYear } = useTenantStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [examName, setExamName] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const [examError, setExamError] = useState("");
  const [examId, setExamId] = useState("");
  const [className, setClassName] = useState("");
  const [markSubjects, setMarkSubjects] = useState<Subject[]>([]);
  const [grid, setGrid] = useState<MarkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridBusy, setGridBusy] = useState(false);
  const [saving, setSaving] = useState<"subject" | "exam" | "marks" | "">("");
  const [publishingId, setPublishingId] = useState("");
  const [blocked, setBlocked] = useState("");

  const classOptions = useMemo(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const item of classes) {
      const name = item.className.trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      names.push(name);
    }
    return names.sort((a, b) => a.localeCompare(b));
  }, [classes]);

  useEffect(() => {
    if (!academicYear) return;
    let cancelled = false;
    setLoading(true);
    schoolAcademics(`?academicYear=${encodeURIComponent(academicYear)}`)
      .then((data) => {
        if (cancelled) return;
        setSubjects(data.subjects ?? []);
        setExams(data.exams ?? []);
        setBlocked("");
      })
      .catch((err) => {
        if (!cancelled) setBlocked(err instanceof ApiError ? err.message : "Exam grading is not on this plan");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [academicYear]);

  useEffect(() => {
    if (!examId && exams[0]) setExamId(exams[0].id);
  }, [exams, examId]);

  useEffect(() => {
    if (!className && classOptions[0]) setClassName(classOptions[0]);
  }, [classOptions, className]);

  useEffect(() => {
    if (!examId || !className) {
      setGrid([]);
      setMarkSubjects([]);
      return;
    }
    let cancelled = false;
    setGridBusy(true);
    schoolAcademics(`?examId=${encodeURIComponent(examId)}&className=${encodeURIComponent(className)}`)
      .then((data) => {
        if (cancelled) return;
        const columns = (data.subjects?.length ? data.subjects : subjects).filter((subject) => subject.active !== false);
        setMarkSubjects(columns);
        setGrid(
          (data.students ?? []).map((student) => {
            const scores: Record<string, string> = {};
            columns.forEach((subject) => {
              const found = student.subjects.find((item) => item.id === subject.id);
              scores[subject.id] = found ? String(found.score) : "";
            });
            return { id: student.id, name: student.name, scores };
          }),
        );
      })
      .catch((err) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Could not open the class");
      })
      .finally(() => {
        if (!cancelled) setGridBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [examId, className, subjects]);

  async function reload() {
    const data = await schoolAcademics(`?academicYear=${encodeURIComponent(academicYear)}`);
    setSubjects(data.subjects ?? []);
    setExams(data.exams ?? []);
    setBlocked("");
  }

  async function addSubject() {
    const name = subjectName.trim();
    if (!name) {
      setSubjectError("Enter a subject name");
      return;
    }
    setSubjectError("");
    setSaving("subject");
    try {
      await schoolAcademicsAction({ action: "save-subject", name });
      setSubjectName("");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save subject");
    } finally {
      setSaving("");
    }
  }

  async function addExam() {
    const name = examName.trim();
    if (!name) {
      setExamError("Enter an exam name");
      return;
    }
    setExamError("");
    setSaving("exam");
    try {
      await schoolAcademicsAction({ action: "save-exam", name, academicYear });
      setExamName("");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save exam");
    } finally {
      setSaving("");
    }
  }

  async function togglePublish(exam: Exam) {
    setPublishingId(exam.id);
    try {
      await schoolAcademicsAction({ action: "publish", id: exam.id, published: !exam.published });
      toast.success(exam.published ? "Hidden from parents" : "Published to parents");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the exam");
    } finally {
      setPublishingId("");
    }
  }

  async function saveMarks() {
    const invalid = grid.some((student) =>
      markSubjects.some((subject) => {
        const value = student.scores[subject.id] ?? "";
        if (value === "") return false;
        const score = Number(value);
        return Number.isNaN(score) || score < 0 || score > 100;
      }),
    );
    if (invalid) {
      toast.error("Marks must be between 0 and 100");
      return;
    }
    const marks = grid.flatMap((student) =>
      markSubjects
        .filter((subject) => (student.scores[subject.id] ?? "") !== "")
        .map((subject) => ({
          studentId: student.id,
          subjectId: subject.id,
          score: Number(student.scores[subject.id]),
          max: 100,
        })),
    );
    setSaving("marks");
    try {
      await schoolAcademicsAction({ action: "save-marks", examId, marks });
      toast.success("Marks saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save marks");
    } finally {
      setSaving("");
    }
  }

  if (blocked) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
        {blocked}
      </section>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading academics">
        <div className="h-8 w-40 animate-pulse rounded-xl bg-slate-200 dark:bg-zinc-800" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-56 animate-pulse rounded-2xl bg-slate-200 dark:bg-zinc-800" />
          <div className="h-56 animate-pulse rounded-2xl bg-slate-200 dark:bg-zinc-800" />
        </div>
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-950 dark:text-zinc-50">Subjects</h2>
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">{subjects.length} added</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-zinc-400">These become the columns in mark entry.</p>
          {subjects.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500 dark:bg-white/5 dark:text-zinc-400">
              No subjects yet. Add English, Mathematics, and the rest used in class.
            </p>
          ) : (
            <ul className="mt-3 max-h-52 space-y-1 overflow-y-auto">
              {subjects.map((subject) => (
                <li
                  key={subject.id}
                  className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm text-slate-800 dark:text-zinc-100"
                >
                  <span className="truncate font-medium">{subject.name}</span>
                  {subject.code ? <span className="shrink-0 font-mono text-[11px] text-slate-400">{subject.code}</span> : null}
                </li>
              ))}
            </ul>
          )}
          <form
            className="mt-auto grid grid-cols-1 gap-2 pt-4 sm:grid-cols-[minmax(0,1fr)_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              if (saving !== "subject") void addSubject();
            }}
          >
            <div>
              <Input
                value={subjectName}
                maxLength={NAME_MAX}
                onChange={(event) => {
                  setSubjectName(event.target.value.slice(0, NAME_MAX));
                  if (subjectError) setSubjectError("");
                }}
                placeholder="Subject name"
                aria-label="Subject name"
                className="h-10 rounded-xl"
              />
              {subjectError ? <p className="mt-1 text-xs text-rose-600">{subjectError}</p> : null}
            </div>
            <Button
              type="submit"
              variant="outline"
              disabled={saving === "subject" || !subjectName.trim()}
              className="h-10 rounded-xl"
            >
              {saving === "subject" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add subject
            </Button>
          </form>
        </section>

        <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-950 dark:text-zinc-50">Exams</h2>
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">{academicYear}</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-zinc-400">Publish an exam when parents should see the marks.</p>
          {exams.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500 dark:bg-white/5 dark:text-zinc-400">
              No exams for this year yet.
            </p>
          ) : (
            <ul className="mt-3 max-h-52 space-y-1 overflow-y-auto">
              {exams.map((exam) => (
                <li key={exam.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-zinc-100">{exam.name}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      exam.published
                        ? "bg-[#F0FDFA] text-[#0F766E] dark:bg-teal-950 dark:text-[#5EEAD4]"
                        : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-zinc-400",
                    )}
                  >
                    {exam.published ? "Published" : "Draft"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={publishingId === exam.id}
                    className="h-8 shrink-0 rounded-xl px-3 text-xs"
                    onClick={() => void togglePublish(exam)}
                  >
                    {publishingId === exam.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : exam.published ? "Unpublish" : "Publish"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <form
            className="mt-auto grid grid-cols-1 gap-2 pt-4 sm:grid-cols-[minmax(0,1fr)_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              if (saving !== "exam") void addExam();
            }}
          >
            <div>
              <Input
                value={examName}
                maxLength={NAME_MAX}
                onChange={(event) => {
                  setExamName(event.target.value.slice(0, NAME_MAX));
                  if (examError) setExamError("");
                }}
                placeholder="Exam name"
                aria-label="Exam name"
                className="h-10 rounded-xl"
              />
              {examError ? <p className="mt-1 text-xs text-rose-600">{examError}</p> : null}
            </div>
            <Button
              type="submit"
              disabled={saving === "exam" || !examName.trim()}
              className="h-10 rounded-xl bg-[#0F766E] text-white hover:bg-[#0D9488]"
            >
              {saving === "exam" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add exam
            </Button>
          </form>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900 sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-950 dark:text-zinc-50">Mark entry</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-zinc-400">
              Choose the exam and class. Scores are out of 100. Leave a cell blank to skip it.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:max-w-xl">
          <label className="block space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Exam</span>
            <Select value={examId || undefined} onValueChange={setExamId} disabled={exams.length === 0}>
              <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950" aria-label="Exam">
                <SelectValue placeholder="Choose an exam" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[250] max-h-72 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900">
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id} className="rounded-lg">
                    {exam.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Class</span>
            <Select value={className || undefined} onValueChange={setClassName} disabled={classOptions.length === 0}>
              <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-950" aria-label="Class">
                <SelectValue placeholder="Choose a class" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[250] max-h-72 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900">
                {classOptions.map((name) => (
                  <SelectItem key={name} value={name} className="rounded-lg">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>

        {subjects.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500 dark:bg-white/5 dark:text-zinc-400">
            Add a subject above before entering marks.
          </p>
        ) : exams.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500 dark:bg-white/5 dark:text-zinc-400">
            Add an exam for {academicYear} before entering marks.
          </p>
        ) : gridBusy ? (
          <div className="mt-4 space-y-2" aria-busy="true" aria-label="Loading class marks">
            <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-zinc-800" />
            <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-zinc-800" />
            <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-zinc-800" />
          </div>
        ) : grid.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500 dark:bg-white/5 dark:text-zinc-400">
            No students in {className || "this class"}.
          </p>
        ) : (
          <form
            className="mt-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (saving !== "marks") void saveMarks();
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
                      Student
                    </th>
                    {markSubjects.map((subject) => (
                      <th
                        key={subject.id}
                        className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400"
                      >
                        {subject.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grid.map((student, index) => (
                    <tr key={student.id}>
                      <td className="sticky left-0 z-10 border-b border-slate-100 bg-white px-3 py-2 font-medium text-slate-800 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100">
                        {student.name}
                      </td>
                      {markSubjects.map((subject) => (
                        <td key={subject.id} className="border-b border-slate-100 px-3 py-2 dark:border-white/10">
                          <Input
                            inputMode="decimal"
                            value={student.scores[subject.id] ?? ""}
                            aria-label={`${student.name} ${subject.name}`}
                            onChange={(event) => {
                              const next = markDraft(event.target.value);
                              if (next === null) return;
                              setGrid((current) =>
                                current.map((row, rowIndex) =>
                                  rowIndex === index
                                    ? { ...row, scores: { ...row.scores, [subject.id]: next } }
                                    : row,
                                ),
                              );
                            }}
                            className="h-9 w-20 rounded-xl"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                type="submit"
                disabled={saving === "marks" || markSubjects.length === 0}
                className="h-10 rounded-xl bg-[#0F766E] px-5 text-white hover:bg-[#0D9488]"
              >
                {saving === "marks" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save marks
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function markDraft(value: string) {
  if (value === "") return "";
  if (!/^\d{0,3}(\.\d?)?$/.test(value)) return null;
  if (value !== "" && Number(value) > 100) return "100";
  return value;
}
