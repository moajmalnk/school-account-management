import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Camera, GraduationCap, Lock, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
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
import {
  applyParentStudentUpdate,
  BLOOD_GROUPS,
  getStudentByShareToken,
  getTransportRoutesForParent,
  GUARDIAN_RELATIONS,
  parentFieldsFromStudent,
  STUDENT_CATEGORIES,
  STUDENT_RELIGIONS,
  transportBusPointOptions,
  type ParentEditableStudentFields,
  type Student,
} from "@/lib/tenant-store";
import { cn, glassCardClass } from "@/lib/utils";
import type { ReactNode } from "react";

export const Route = createFileRoute("/parent/student/$token")({
  component: ParentStudentPage,
});

function personInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const emptyParentFields = (): ParentEditableStudentFields => ({
  guardian: "",
  phone: "",
  dob: "",
  email: "",
  address: "",
  photoUrl: "",
  aadhaar: "",
  placeOfBirth: "",
  nationality: "",
  religion: "",
  studentCategory: "",
  bloodGroup: "",
  fatherOccupation: "",
  motherName: "",
  guardianOccupation: "",
  needsBus: false,
  busPoint1: "",
  busPoint2: "",
});

function ParentStudentPage() {
  const { token } = Route.useParams();
  const [student, setStudent] = useState<Student | null>(() => getStudentByShareToken(token));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ParentEditableStudentFields>(() =>
    student ? parentFieldsFromStudent(student) : emptyParentFields(),
  );

  useEffect(() => {
    const next = getStudentByShareToken(token);
    setStudent(next);
    if (next) setForm(parentFieldsFromStudent(next));
  }, [token]);

  const locked = useMemo(
    () =>
      student
        ? {
            name: student.name,
            cls: student.cls,
            id: student.id,
          }
        : null,
    [student],
  );

  const busPointOptions = useMemo(() => {
    const { pickups } = transportBusPointOptions(getTransportRoutesForParent());
    const withCurrent = (current?: string) => {
      const value = current?.trim();
      if (value && !pickups.includes(value)) return [value, ...pickups];
      return pickups;
    };
    return {
      point1: withCurrent(form.busPoint1),
      point2: withCurrent(form.busPoint2),
    };
  }, [form.busPoint1, form.busPoint2]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a JPG, PNG, or WebP image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2 MB or smaller");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      if (dataUrl) setForm((prev) => ({ ...prev, photoUrl: dataUrl }));
    };
    reader.onerror = () => toast.error("Could not read the selected image");
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guardian.trim()) {
      toast.error("Guardian name is required");
      return;
    }
    const aadhaarDigits = (form.aadhaar ?? "").replace(/\D/g, "");
    if (aadhaarDigits && aadhaarDigits.length !== 12) {
      toast.error("Aadhaar must be 12 digits");
      return;
    }
    setSaving(true);
    const updated = applyParentStudentUpdate(token, {
      ...form,
      aadhaar: aadhaarDigits || undefined,
    });
    setSaving(false);
    if (!updated) {
      toast.error("Could not save · link may be invalid or expired");
      return;
    }
    setStudent(updated);
    setForm(parentFieldsFromStudent(updated));
    setSaved(true);
    toast.success("Profile updated", {
      description: "School records have been synced with your changes",
    });
  };

  if (!student || !locked) {
    return (
      <div className="tenant-canvas flex min-h-dvh items-center justify-center px-4">
        <div className={cn(glassCardClass, "max-w-md p-6 text-center")}>
          <h1 className="text-lg font-bold text-slate-900">Link not found</h1>
          <p className="mt-2 text-[13px] text-slate-500">
            This parent profile link is invalid or no longer active. Ask the school office for a
            fresh invite.
          </p>
          <Link
            to="/login"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-black px-5 text-[13px] font-semibold text-white"
          >
            School login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="tenant-canvas min-h-dvh px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <header className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Parent profile update
          </div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
            Complete {locked.name}&apos;s details
          </h1>
          <p className="text-[13px] text-slate-500">
            School-filled fields are locked. Update the profile photo and remaining details, then
            save.
          </p>
        </header>

        <section className={cn(glassCardClass, "space-y-3 p-5")}>
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-slate-600">
            <Lock className="h-3.5 w-3.5" />
            Filled by school · read only
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LockedField label="Full name" value={locked.name} />
            <LockedField label="Student ID" value={locked.id} />
            <LockedField
              label="Class"
              value={locked.cls}
              icon={<GraduationCap className="h-3.5 w-3.5 text-[#2563EB]" />}
            />
          </div>
        </section>

        <section className={cn(glassCardClass, "p-5 md:p-6")}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-slate-600">
              Parent updates
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-3">
              <div className="relative h-14 w-14 shrink-0">
                {form.photoUrl ? (
                  <img
                    src={form.photoUrl}
                    alt=""
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-black text-sm font-semibold text-white">
                    {personInitials(locked.name)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  aria-label="Upload profile photo"
                  className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#2563EB] text-white shadow-sm"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="min-w-0 text-[12px] text-black/55">
                <div className="font-medium text-black">Profile Photo</div>
                <div className="mt-0.5">Optional · JPG, PNG or WebP up to 2 MB</div>
                {form.photoUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, photoUrl: "" }))}
                    className="mt-1.5 text-[11px] font-semibold text-[#EF4444] hover:underline"
                  >
                    Remove photo
                  </button>
                )}
              </div>
              <input
                ref={photoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handlePhoto}
              />
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
                    onClick={() => setForm({ ...form, gender: g.key })}
                    className={cn(
                      "min-h-9 flex-1 rounded-full text-[12px] font-semibold transition-colors",
                      form.gender === g.key
                        ? "bg-[#2563EB] text-white"
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
                  value={form.motherName}
                  onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                  placeholder="e.g. Anita Verma"
                />
              </FormField>
              <FormField label="Father Occupation">
                <Input
                  value={form.fatherOccupation}
                  onChange={(e) => setForm({ ...form, fatherOccupation: e.target.value })}
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
                    onClick={() => setForm({ ...form, guardianRelation: relation })}
                    className={cn(
                      "min-h-9 flex-1 rounded-full text-[12px] font-semibold transition-colors",
                      form.guardianRelation === relation
                        ? "bg-[#2563EB] text-white"
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
                  value={form.guardian}
                  onChange={(e) => setForm({ ...form, guardian: e.target.value })}
                  placeholder="e.g. Anita Verma"
                />
              </FormField>
              <FormField label="Guardian Occupation">
                <Input
                  value={form.guardianOccupation}
                  onChange={(e) => setForm({ ...form, guardianOccupation: e.target.value })}
                  placeholder="e.g. Teacher"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Guardian Mobile">
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="9810045221"
                  className="font-mono"
                />
              </FormField>
              <FormField label="Aadhaar">
                <Input
                  value={form.aadhaar}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      aadhaar: e.target.value.replace(/\D/g, "").slice(0, 12),
                    })
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
                  value={form.dob ?? ""}
                  onChange={(dob) => setForm({ ...form, dob })}
                  placeholder="14 Mar 2012"
                  valueFormat="display"
                  variant="pill"
                  quickPicks={[]}
                  min="1990-01-01"
                  max={todayISO()}
                  className="h-9 w-full"
                />
              </FormField>
              <FormField label="Place of Birth">
                <Input
                  value={form.placeOfBirth}
                  onChange={(e) => setForm({ ...form, placeOfBirth: e.target.value })}
                  placeholder="e.g. Kozhikode"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Nationality">
                <Input
                  value={form.nationality}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                  placeholder="e.g. Indian"
                />
              </FormField>
              <FormField label="Religion">
                <FormSelect
                  value={form.religion ?? ""}
                  onValueChange={(religion) => setForm({ ...form, religion })}
                  options={STUDENT_RELIGIONS}
                  placeholder="Select religion"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Student Category">
                <FormSelect
                  value={form.studentCategory ?? ""}
                  onValueChange={(studentCategory) => setForm({ ...form, studentCategory })}
                  options={STUDENT_CATEGORIES}
                  placeholder="Select category"
                />
              </FormField>
              <FormField label="Blood Group">
                <FormSelect
                  value={form.bloodGroup ?? ""}
                  onValueChange={(bloodGroup) => setForm({ ...form, bloodGroup })}
                  options={BLOOD_GROUPS}
                  placeholder="Select blood group"
                />
              </FormField>
            </div>

            <FormField label="Email Address">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="guardian@email.com"
                className="font-mono text-[13px]"
              />
            </FormField>

            <FormField label="Residential Mailing Address">
              <Textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="House / Flat, Street, City, PIN"
                className="min-h-[72px] resize-none rounded-2xl text-[13px]"
              />
            </FormField>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] px-3.5 py-3">
              <Checkbox
                checked={form.needsBus === true}
                onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    needsBus: checked === true,
                    ...(checked === true
                      ? {}
                      : { busPoint1: "", busPoint2: "" }),
                  })
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

            {form.needsBus === true && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Bus Point 1">
                  <FormSelect
                    value={form.busPoint1 ?? ""}
                    onValueChange={(busPoint1) =>
                      setForm({
                        ...form,
                        busPoint1: busPoint1 === "__none__" ? "" : busPoint1,
                      })
                    }
                    options={busPointOptions.point1}
                    placeholder="Select pickup point"
                    allowNone
                    noneLabel="No pickup point"
                  />
                </FormField>
                <FormField label="Bus Point 2">
                  <FormSelect
                    value={form.busPoint2 ?? ""}
                    onValueChange={(busPoint2) =>
                      setForm({
                        ...form,
                        busPoint2: busPoint2 === "__none__" ? "" : busPoint2,
                      })
                    }
                    options={busPointOptions.point2}
                    placeholder="Select pickup point"
                    allowNone
                    noneLabel="No pickup point"
                  />
                </FormField>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              {saved && (
                <span className="mr-auto inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#10B981]">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </span>
              )}
              <Button
                type="submit"
                disabled={saving}
                className="rounded-full bg-black text-white hover:bg-black/85"
              >
                {saving ? "Saving…" : "Save profile"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
        {label}
      </Label>
      {children}
    </div>
  );
}

function FormSelect({
  value,
  onValueChange,
  options,
  placeholder,
  allowNone = false,
  noneLabel = "None",
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  allowNone?: boolean;
  noneLabel?: string;
}) {
  const resolved = value && options.includes(value) ? value : allowNone && !value ? "__none__" : undefined;
  return (
    <Select value={resolved} onValueChange={onValueChange}>
      <SelectTrigger className="h-10 w-full rounded-lg border border-[#E5E5E5] bg-white px-3 text-[13px] shadow-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-0">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-lg border border-[#E5E5E5] bg-white p-1.5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)]">
        {allowNone && (
          <SelectItem
            value="__none__"
            className="cursor-pointer rounded-md py-2 pl-3 pr-8 text-[13px] text-slate-500"
          >
            {noneLabel}
          </SelectItem>
        )}
        {options.map((option) => (
          <SelectItem
            key={option}
            value={option}
            className="cursor-pointer rounded-md py-2 pl-3 pr-8 text-[13px]"
          >
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function LockedField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[14px] font-semibold text-slate-900">
        {icon}
        <span className="min-w-0 break-words">{value}</span>
      </div>
    </div>
  );
}
