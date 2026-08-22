import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { ClipboardList, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
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
import { Textarea } from "@/components/ui/textarea";
import { FieldSelect, classSelectOptions } from "@/components/school/SchoolAdminWorkspace";
import {
  BLOOD_GROUPS,
  DEFAULT_STUDENT_DOCUMENTS,
  GUARDIAN_RELATIONS,
  STUDENT_CATEGORIES,
  STUDENT_RELIGIONS,
  composeClassName,
  resolveTransportFeeForStudent,
  splitClassName,
  studentNeedsTransport,
  transportBusPointOptions,
  upsertStudentInSnapshot,
  useTenantStore,
  type GuardianRelation,
  type Student,
} from "@/lib/tenant-store";
import { apiUpsertStudent } from "@/lib/api/records";
import { apiUpsertClass } from "@/lib/api/settings";
import { getApiToken } from "@/lib/api/client";
import {
  buildClassFromLabel,
  matchExistingClass,
  nextPrefixedId,
} from "@/lib/student-csv";
import { toDobIso } from "@/lib/dates";
import { cn, glassCardClass } from "@/lib/utils";

type StudentDraft = {
  name: string;
  gender: "" | "M" | "F";
  cls: string;
  guardian: string;
  phone: string;
  dob: string;
  email: string;
  address: string;
  motherName: string;
  fatherOccupation: string;
  guardianRelation: "" | GuardianRelation;
  guardianOccupation: string;
  aadhaar: string;
  admissionNumber: string;
  placeOfBirth: string;
  nationality: string;
  religion: string;
  studentCategory: string;
  bloodGroup: string;
  needsBus: boolean;
  busPoint1: string;
  busPoint2: string;
};

function draftFromStudent(student: Student): StudentDraft {
  return {
    name: student.name,
    gender: student.gender ?? "",
    cls: student.cls,
    guardian: student.guardian,
    phone: student.phone ?? "",
    dob: student.dob ?? "",
    email: student.email ?? "",
    address: student.address ?? "",
    motherName: student.motherName ?? "",
    fatherOccupation: student.fatherOccupation ?? "",
    guardianRelation: student.guardianRelation ?? "",
    guardianOccupation: student.guardianOccupation ?? "",
    aadhaar: student.aadhaar ?? "",
    admissionNumber: student.admissionNumber ?? "",
    placeOfBirth: student.placeOfBirth ?? "",
    nationality: student.nationality ?? "",
    religion: student.religion ?? "",
    studentCategory: student.studentCategory ?? "",
    bloodGroup: student.bloodGroup ?? "",
    needsBus: student.needsBus === true || Boolean(student.busPoint1 || student.busPoint2),
    busPoint1: student.busPoint1 ?? "",
    busPoint2: student.busPoint2 ?? "",
  };
}

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ensureStudentDocuments(student: Student) {
  if (Array.isArray(student.documents) && student.documents.length > 0) {
    return student.documents;
  }
  return DEFAULT_STUDENT_DOCUMENTS.map((def) => ({
    ...def,
    number: def.id === "doc-aadhaar" ? student.aadhaar ?? "" : "",
    levels: def.levels.map((l) => ({ ...l })),
    attachments: [],
  }));
}

function applyDraftToStudent(student: Student, draft: StudentDraft): Student {
  const nextDocs = ensureStudentDocuments(student).map((d) =>
    d.id === "doc-aadhaar" ? { ...d, number: draft.aadhaar.trim() } : d,
  );
  return {
    ...student,
    name: draft.name.trim(),
    gender: draft.gender || undefined,
    cls: draft.cls.trim(),
    guardian: draft.guardian.trim(),
    phone: emptyToUndefined(draft.phone),
    dob: toDobIso(draft.dob),
    email: emptyToUndefined(draft.email),
    address: emptyToUndefined(draft.address),
    motherName: emptyToUndefined(draft.motherName),
    fatherOccupation: emptyToUndefined(draft.fatherOccupation),
    guardianRelation: draft.guardianRelation || undefined,
    guardianOccupation: emptyToUndefined(draft.guardianOccupation),
    aadhaar: emptyToUndefined(draft.aadhaar),
    admissionNumber: emptyToUndefined(draft.admissionNumber),
    placeOfBirth: emptyToUndefined(draft.placeOfBirth),
    nationality: emptyToUndefined(draft.nationality),
    religion: emptyToUndefined(draft.religion),
    studentCategory: emptyToUndefined(draft.studentCategory),
    bloodGroup: emptyToUndefined(draft.bloodGroup),
    needsBus: draft.needsBus,
    busPoint1: draft.needsBus ? emptyToUndefined(draft.busPoint1) : undefined,
    busPoint2: draft.needsBus ? emptyToUndefined(draft.busPoint2) : undefined,
    documents: nextDocs,
  };
}

export function StudentEditPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/tenant/students_/edit" }) as { id?: string };
  const {
    activeStudents: students,
    setStudents,
    classes,
    setClasses,
    transportRoutes,
  } = useTenantStore();

  const student = useMemo(
    () => (search.id ? students.find((s) => s.id === search.id) ?? null : null),
    [search.id, students],
  );

  const [draft, setDraft] = useState<StudentDraft>(() =>
    student ? draftFromStudent(student) : draftFromStudent({} as Student),
  );
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [newClassGrade, setNewClassGrade] = useState("");
  const [newClassSection, setNewClassSection] = useState("");
  const [savingClass, setSavingClass] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) setDraft(draftFromStudent(student));
  }, [student]);

  const matchedClass = useMemo(
    () => classes.find((c) => c.className === draft.cls),
    [classes, draft.cls],
  );

  const busPointOptions = useMemo(() => {
    const { pickups, drops } = transportBusPointOptions(transportRoutes);
    const withCurrent = (current: string, pool: string[]) => {
      const value = current.trim();
      if (value && !pool.includes(value)) return [value, ...pool];
      return pool;
    };
    const dropPool = drops.length > 0 ? drops : pickups;
    return {
      point1: withCurrent(draft.busPoint1, pickups),
      point2: withCurrent(draft.busPoint2, dropPool),
    };
  }, [draft.busPoint1, draft.busPoint2, transportRoutes]);

  const draftTransportFee = useMemo(
    () =>
      resolveTransportFeeForStudent(
        {
          needsBus: draft.needsBus,
          busPoint1: draft.busPoint1,
          busPoint2: draft.busPoint2,
          cls: draft.cls,
        },
        transportRoutes,
        matchedClass,
      ),
    [draft, transportRoutes, matchedClass],
  );

  const patchDraft = <K extends keyof StudentDraft>(key: K, value: StudentDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const backToProfile = () => {
    if (student) {
      navigate({ to: "/tenant/students", search: { id: student.id } });
      return;
    }
    navigate({ to: "/tenant/students", search: {} });
  };

  const openCollectVehicleFee = (target: Student) => {
    navigate({
      to: "/tenant/finance",
      search: { tab: "receive", studentId: target.id },
    });
  };

  const submitNewClass = async (e: FormEvent) => {
    e.preventDefault();
    const grade = newClassGrade.trim();
    const section = newClassSection.trim();
    if (!grade) {
      toast.error("Class name is required");
      return;
    }
    if (!section) {
      toast.error("Division is required");
      return;
    }
    const className = composeClassName(grade, section);
    const existing = matchExistingClass(classes, className);
    if (existing) {
      patchDraft("cls", existing.className);
      setAddClassOpen(false);
      setNewClassGrade("");
      setNewClassSection("");
      toast.message(`Using existing class ${existing.className}`);
      return;
    }
    const created = buildClassFromLabel(
      nextPrefixedId(
        "CLS",
        classes.map((c) => c.id),
        3,
      ),
      className,
    );
    setSavingClass(true);
    try {
      setClasses((prev) => [...prev, created]);
      if (getApiToken()) {
        await apiUpsertClass(created);
      }
      patchDraft("cls", created.className);
      setAddClassOpen(false);
      setNewClassGrade("");
      setNewClassSection("");
      toast.success(`${created.className} added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add class");
    } finally {
      setSavingClass(false);
    }
  };

  const persistStudent = async (updated: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    upsertStudentInSnapshot(updated);
    try {
      const saved = await apiUpsertStudent(updated);
      const merged = { ...updated, ...saved };
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? merged : s)));
      upsertStudentInSnapshot(merged);
      return merged;
    } catch (err) {
      toast.error("Could not save student to server", {
        description: err instanceof Error ? err.message : "Save failed",
      });
      throw err;
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!student) return;
    if (!draft.name.trim()) {
      toast.error("Student name is required");
      return;
    }
    if (!draft.guardian.trim()) {
      toast.error("Guardian name is required");
      return;
    }
    if (!draft.cls.trim()) {
      toast.error("Class is required");
      return;
    }
    setSaving(true);
    try {
      const updated = applyDraftToStudent(student, draft);
      await persistStudent(updated);
      const fee = resolveTransportFeeForStudent(updated, transportRoutes, matchedClass);
      const canCollect = studentNeedsTransport(updated) && Boolean(fee.amount && fee.amount > 0);
      toast.success("Profile updated", {
        description: `${updated.name} · ${updated.id}`,
        ...(canCollect
          ? {
              action: {
                label: "Collect fee",
                onClick: () => openCollectVehicleFee(updated),
              },
            }
          : {}),
      });
      navigate({ to: "/tenant/students", search: { id: updated.id } });
    } finally {
      setSaving(false);
    }
  };

  if (!student) {
    return (
      <div className={cn(glassCardClass, "mx-auto max-w-lg p-6 text-center")}>
        <h1 className="text-lg font-bold text-slate-900">Student not found</h1>
        <p className="mt-2 text-[13px] text-slate-500">
          This student may have been removed or the link is invalid.
        </p>
        <Button type="button" variant="outline" className="mt-4 rounded-full" onClick={backToProfile}>
          Back to students
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <section className={cn(glassCardClass, "w-full p-5 md:p-6")}>
        <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
          <div>
            <div className="text-[17px] font-bold leading-tight tracking-tight text-slate-900 sm:text-title">
              Edit Student Profile
            </div>
            <p className="mt-1 text-[12px] text-slate-500">
              Update core details for {student.name} · {student.id}
            </p>
          </div>

          <div className="rounded-lg border border-[#CCFBF1] bg-[#F0FDFA]/70 px-3.5 py-3 text-[12px] text-slate-600">
            Update identity, family, contact, and transport details. Vehicle fees are calculated
            from assigned bus routes and can be collected in Finance after saving.
          </div>

          <FormField label="Student Name">
            <Input
              value={draft.name}
              onChange={(e) => patchDraft("name", e.target.value)}
              placeholder="Student full name"
              autoFocus
            />
          </FormField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Class">
              <FieldSelect
                value={draft.cls}
                onValueChange={(cls) => patchDraft("cls", cls)}
                options={classSelectOptions(classes, draft.cls)}
                placeholder="Select class"
                onAddNew={() => {
                  const parts = splitClassName(draft.cls);
                  setNewClassGrade(parts.grade);
                  setNewClassSection(parts.section);
                  setAddClassOpen(true);
                }}
                addNewLabel="Add new class"
              />
            </FormField>
            <FormField label="Admission Number">
              <Input
                value={draft.admissionNumber}
                onChange={(e) => patchDraft("admissionNumber", e.target.value)}
                placeholder="e.g. ADM-2841"
                className="font-mono"
              />
            </FormField>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Gender
            </Label>
            <div className="inline-flex w-full items-center rounded-full border border-black/10 bg-white p-1">
              {(
                [
                  { key: "M" as const, label: "Male" },
                  { key: "F" as const, label: "Female" },
                ] as const
              ).map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => patchDraft("gender", g.key)}
                  className={cn(
                    "min-h-9 flex-1 rounded-full text-[12px] font-semibold transition-colors",
                    draft.gender === g.key
                      ? "bg-[#0F766E] text-white"
                      : "text-black/55 hover:bg-black/5",
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Mother Name">
              <Input
                value={draft.motherName}
                onChange={(e) => patchDraft("motherName", e.target.value)}
                placeholder="e.g. Anita Verma"
              />
            </FormField>
            <FormField label="Father Occupation">
              <Input
                value={draft.fatherOccupation}
                onChange={(e) => patchDraft("fatherOccupation", e.target.value)}
                placeholder="e.g. Engineer"
              />
            </FormField>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              If Guardian Is
            </Label>
            <div className="inline-flex w-full items-center rounded-full border border-black/10 bg-white p-1">
              {GUARDIAN_RELATIONS.map((relation) => (
                <button
                  key={relation}
                  type="button"
                  onClick={() => patchDraft("guardianRelation", relation)}
                  className={cn(
                    "min-h-9 flex-1 rounded-full text-[12px] font-semibold transition-colors",
                    draft.guardianRelation === relation
                      ? "bg-[#0F766E] text-white"
                      : "text-black/55 hover:bg-black/5",
                  )}
                >
                  {relation}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Guardian Name">
              <Input
                value={draft.guardian}
                onChange={(e) => patchDraft("guardian", e.target.value)}
                placeholder="e.g. Anita Verma"
              />
            </FormField>
            <FormField label="Guardian Occupation">
              <Input
                value={draft.guardianOccupation}
                onChange={(e) => patchDraft("guardianOccupation", e.target.value)}
                placeholder="e.g. Teacher"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Guardian Mobile">
              <Input
                value={draft.phone}
                onChange={(e) => patchDraft("phone", e.target.value)}
                placeholder="9810045221"
                className="font-mono"
              />
            </FormField>
            <FormField label="Aadhaar">
              <Input
                value={draft.aadhaar}
                onChange={(e) =>
                  patchDraft("aadhaar", e.target.value.replace(/\D/g, "").slice(0, 12))
                }
                placeholder="12-digit Aadhaar"
                className="font-mono"
                inputMode="numeric"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Date of Birth">
              <DatePicker
                value={draft.dob ?? ""}
                onChange={(dob) => patchDraft("dob", dob)}
                placeholder="14 Mar 2012"
                valueFormat="iso"
                variant="pill"
                quickPicks={[]}
                min="1990-01-01"
                max={todayISO()}
                className="h-9 w-full"
              />
            </FormField>
            <FormField label="Place of Birth">
              <Input
                value={draft.placeOfBirth}
                onChange={(e) => patchDraft("placeOfBirth", e.target.value)}
                placeholder="e.g. Kozhikode"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Nationality">
              <Input
                value={draft.nationality}
                onChange={(e) => patchDraft("nationality", e.target.value)}
                placeholder="e.g. Indian"
              />
            </FormField>
            <FormField label="Religion">
              <Select
                value={draft.religion || undefined}
                onValueChange={(religion) => patchDraft("religion", religion)}
              >
                <SelectTrigger className="h-9 w-full rounded-lg border-[#E5E5E5] bg-white text-[13px]">
                  <SelectValue placeholder="Select religion" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[250]">
                  {STUDENT_RELIGIONS.map((religion) => (
                    <SelectItem key={religion} value={religion}>
                      {religion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Student Category">
              <Select
                value={draft.studentCategory || undefined}
                onValueChange={(studentCategory) => patchDraft("studentCategory", studentCategory)}
              >
                <SelectTrigger className="h-9 w-full rounded-lg border-[#E5E5E5] bg-white text-[13px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[250]">
                  {STUDENT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Blood Group">
              <Select
                value={draft.bloodGroup || undefined}
                onValueChange={(bloodGroup) => patchDraft("bloodGroup", bloodGroup)}
              >
                <SelectTrigger className="h-9 w-full rounded-lg border-[#E5E5E5] bg-white text-[13px]">
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[250]">
                  {BLOOD_GROUPS.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Email Address">
            <Input
              type="email"
              value={draft.email}
              onChange={(e) => patchDraft("email", e.target.value)}
              placeholder="guardian@email.com"
              className="font-mono text-[13px]"
            />
          </FormField>

          <FormField label="Residential Mailing Address">
            <Textarea
              value={draft.address}
              onChange={(e) => patchDraft("address", e.target.value)}
              placeholder="House / Flat, Street, City, PIN"
              className="min-h-[72px] resize-none rounded-2xl text-[13px]"
            />
          </FormField>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] px-3.5 py-3">
            <Checkbox
              checked={draft.needsBus === true}
              onCheckedChange={(checked) =>
                setDraft((prev) => ({
                  ...prev,
                  needsBus: checked === true,
                  ...(checked === true ? {} : { busPoint1: "", busPoint2: "" }),
                }))
              }
              className="mt-0.5 h-5 w-5 rounded-md border-slate-300"
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-slate-900">
                Requires school bus
              </span>
              <span className="mt-0.5 block text-[12px] text-slate-500">
                Check if your child needs transport · then pick pickup points
              </span>
            </span>
          </label>

          {draft.needsBus && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Bus Point 1">
                <Select
                  value={draft.busPoint1 || "__none__"}
                  onValueChange={(busPoint1) =>
                    patchDraft("busPoint1", busPoint1 === "__none__" ? "" : busPoint1)
                  }
                >
                  <SelectTrigger className="h-9 w-full rounded-lg border-[#E5E5E5] bg-white text-[13px]">
                    <SelectValue placeholder="Select pickup point" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[250]">
                    <SelectItem value="__none__" className="text-slate-500">
                      No pickup point
                    </SelectItem>
                    {busPointOptions.point1.map((point) => (
                      <SelectItem key={point} value={point}>
                        {point}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Bus Point 2">
                <Select
                  value={draft.busPoint2 || "__none__"}
                  onValueChange={(busPoint2) =>
                    patchDraft("busPoint2", busPoint2 === "__none__" ? "" : busPoint2)
                  }
                >
                  <SelectTrigger className="h-9 w-full rounded-lg border-[#E5E5E5] bg-white text-[13px]">
                    <SelectValue placeholder="Select drop point" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[250]">
                    <SelectItem value="__none__" className="text-slate-500">
                      No drop point
                    </SelectItem>
                    {busPointOptions.point2.map((point) => (
                      <SelectItem key={point} value={point}>
                        {point}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          )}

          {draft.needsBus && draftTransportFee.amount && draftTransportFee.amount > 0 ? (
            <div className="rounded-xl border border-[#CCFBF1] bg-[#F0FDFA]/70 px-3.5 py-3 text-[12px] text-slate-600">
              Vehicle fee for selected route:{" "}
              <span className="font-mono font-semibold text-slate-900">
                ₹ {draftTransportFee.amount.toLocaleString("en-IN")}
              </span>
              . Save changes, then collect in Finance.
            </div>
          ) : null}

          <div className="flex flex-nowrap items-center gap-1.5 pt-2 sm:justify-end sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={backToProfile}
              className="h-9 shrink-0 px-2.5 text-[12px] sm:h-10 sm:px-4 sm:text-sm"
            >
              Cancel
            </Button>
            {draftTransportFee.amount && draftTransportFee.amount > 0 && draft.needsBus ? (
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={async () => {
                  if (!student) return;
                  if (!draft.name.trim() || !draft.guardian.trim() || !draft.cls.trim()) {
                    toast.error("Fill required fields before collecting fee");
                    return;
                  }
                  setSaving(true);
                  try {
                    const updated = applyDraftToStudent(student, draft);
                    await persistStudent(updated);
                    openCollectVehicleFee(updated);
                  } finally {
                    setSaving(false);
                  }
                }}
                className="h-9 min-w-0 flex-1 rounded-full px-2 text-[11px] sm:h-10 sm:flex-none sm:px-4 sm:text-sm"
              >
                <ClipboardList className="mr-1 h-3.5 w-3.5 shrink-0 sm:mr-1.5" />
                <span className="truncate">Save & Collect</span>
              </Button>
            ) : null}
            <Button
              type="submit"
              disabled={saving}
              className="h-9 min-w-0 flex-1 rounded-full bg-[#0F766E] px-2 text-[11px] text-white hover:bg-[#0D9488] sm:h-10 sm:flex-none sm:px-4 sm:text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </section>

      <Dialog
        open={addClassOpen}
        onOpenChange={(open) => {
          setAddClassOpen(open);
          if (!open) {
            setNewClassGrade("");
            setNewClassSection("");
          }
        }}
      >
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Add class</DialogTitle>
            <DialogDescription>
              Creates a class tier for admissions and fee posting.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void submitNewClass(e)} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Class">
                <Input
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  placeholder="e.g. Grade 4, 2025"
                  autoFocus
                />
              </FormField>
              <FormField label="Division">
                <Input
                  value={newClassSection}
                  onChange={(e) => setNewClassSection(e.target.value)}
                  placeholder="e.g. A, B"
                />
              </FormField>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setAddClassOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingClass || !newClassGrade.trim() || !newClassSection.trim()}
                className="rounded-full bg-[#0F766E] hover:bg-[#0D9488]"
              >
                {savingClass ? "Adding…" : "Add class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
