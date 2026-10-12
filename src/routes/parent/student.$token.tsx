import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Camera, GraduationCap, Lock, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
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
  normalizeStudent,
  parentFieldsFromStudent,
  resolveTransportFeeForStudent,
  studentNeedsTransport,
  STUDENT_CATEGORIES,
  STUDENT_RELIGIONS,
  transportBusPointOptions,
  type ParentEditableStudentFields,
  type Student,
} from "@/lib/tenant-store";
import { ApiError } from "@/lib/api/client";
import { apiGetParentStudent, apiSubmitParentStudent } from "@/lib/api/records";
import { cn, glassCardClass } from "@/lib/utils";
import type { ReactNode } from "react";
import { formatMoney, getOrgCurrency, useOrgCurrency } from "@/lib/money";

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
  const cached = getStudentByShareToken(token);
  const [student, setStudent] = useState<Student | null>(cached);
  const [lookup, setLookup] = useState<"ready" | "loading" | "missing">(
    cached ? "ready" : "loading",
  );
  const orgCurrency = useOrgCurrency();
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ParentEditableStudentFields>(() =>
    cached ? parentFieldsFromStudent(cached) : emptyParentFields(),
  );

  useEffect(() => {
    let cancelled = false;
    setLookup("loading");
    void apiGetParentStudent(token)
      .then((remote) => {
        if (cancelled) return;
        const next = normalizeStudent({ ...remote, shareToken: token });
        setStudent(next);
        setForm(parentFieldsFromStudent(next));
        setLookup("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        const offline = !(err instanceof ApiError) || err.status === 0;
        const local = offline ? getStudentByShareToken(token) : null;
        if (local) {
          setStudent(local);
          setForm(parentFieldsFromStudent(local));
          setLookup("ready");
          return;
        }
        setStudent(null);
        setLookup("missing");
      });
    return () => {
      cancelled = true;
    };
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
    const routes = getTransportRoutesForParent();
    const { pickups, drops } = transportBusPointOptions(routes);
    const withCurrent = (current: string | undefined, pool: string[]) => {
      const value = current?.trim();
      if (value && !pool.includes(value)) return [value, ...pool];
      return pool;
    };
    const dropPool = drops.length > 0 ? drops : pickups;
    return {
      point1: withCurrent(form.busPoint1, pickups),
      point2: withCurrent(form.busPoint2, dropPool),
    };
  }, [form.busPoint1, form.busPoint2]);

  const formTransportFee = useMemo(
    () =>
      resolveTransportFeeForStudent(
        {
          needsBus: form.needsBus,
          busPoint1: form.busPoint1,
          busPoint2: form.busPoint2,
          cls: student?.cls ?? "",
        },
        getTransportRoutesForParent(),
      ),
    [form.busPoint1, form.busPoint2, form.needsBus, student?.cls],
  );

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted || saving) return;
    if (!form.guardian.trim()) {
      toast.error("Guardian name is required");
      return;
    }
    const aadhaarDigits = (form.aadhaar ?? "").replace(/\D/g, "");
    if (aadhaarDigits && aadhaarDigits.length !== 12) {
      toast.error("Aadhaar must be 12 digits");
      return;
    }
    const patch = {
      ...form,
      aadhaar: aadhaarDigits || undefined,
    };
    setSaving(true);
    try {
      let updated: Student | null = null;
      try {
        updated = await apiSubmitParentStudent(token, patch);
        applyParentStudentUpdate(token, patch);
      } catch (err) {
        const offline = !(err instanceof ApiError) || err.status === 0;
        if (!offline) {
          if (err instanceof ApiError && err.status === 404) {
            setStudent(null);
            setLookup("missing");
            toast.error("This link has expired. Ask the school for a new link.");
            return;
          }
          toast.error(err instanceof Error ? err.message : "Could not save");
          return;
        }
        updated = applyParentStudentUpdate(token, patch);
        if (!updated) {
          toast.error("Could not save. This link may be invalid or expired.");
          return;
        }
      }
      setStudent({ ...updated, shareToken: undefined });
      setSubmitted(true);
      const fee = resolveTransportFeeForStudent(updated, getTransportRoutesForParent());
      const transportNote =
        studentNeedsTransport(updated) && fee.amount && fee.amount > 0
          ? `Vehicle fee ${formatMoney(fee.amount, getOrgCurrency())}. The school will collect this separately.`
          : "School records have been synced with your changes.";
      setSavedNote(
        `${transportNote} This link is now closed. Ask the school for a new link if anything else needs to change.`,
      );
    } finally {
      setSaving(false);
    }
  };

  if (lookup === "loading") {
    return (
      <div className="tenant-canvas flex min-h-dvh items-center justify-center px-4">
        <p className="text-[13px] font-medium text-slate-500">Opening profile…</p>
      </div>
    );
  }

  if (!student || !locked) {
    return (
      <div className="tenant-canvas flex min-h-dvh items-center justify-center px-4">
        <div className={cn(glassCardClass, "max-w-md p-6 text-center")}>
          <h1 className="text-lg font-bold text-slate-900">Link expired</h1>
          <p className="mt-2 text-[13px] text-slate-500">
            This link can be used once. It has already been submitted, or it is no longer active.
            Ask the school office for a new link if you need to update the profile again.
          </p>
          <Link
            to="/login"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#0F766E] px-5 text-[13px] font-semibold text-white"
          >
            School login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="tenant-canvas min-h-dvh px-4 py-6 sm:py-10">
      <ProfileSavedPopup
        open={Boolean(savedNote)}
        message={savedNote ?? ""}
        onClose={() => setSavedNote(null)}
      />
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <header className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Parent profile update
          </div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
            Complete {locked.name}&apos;s details
          </h1>
          <p className="text-[13px] text-slate-500">
            {submitted
              ? "Your update was saved and this link is now closed."
              : "School-filled fields are locked. Update the profile photo and remaining details, then save. This link closes after one save."}
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
              icon={<GraduationCap className="h-3.5 w-3.5 text-[#0F766E]" />}
            />
          </div>
        </section>

        {submitted ? (
          <section className={cn(glassCardClass, "flex flex-col items-center px-6 py-10 text-center")}>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#22C55E]/15 text-[#16A34A]">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-[18px] font-bold tracking-tight text-slate-900">
              Profile submitted
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-slate-500">
              {savedNote ??
                "School records have been synced. This link is closed. Ask the school for a new link if anything else needs to change."}
            </p>
          </section>
        ) : (
        <section className={cn(glassCardClass, "p-5 md:p-6")}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-slate-600">
              Parent updates
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-3">
              <div className="relative h-14 w-14 shrink-0">
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#0F766E] text-sm font-semibold text-white">
                    {personInitials(locked.name)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  aria-label="Upload profile photo"
                  className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#0F766E] text-white shadow-sm"
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
                <PhoneInput
                  value={form.phone}
                  onChange={(phone) => setForm({ ...form, phone })}
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
                    ...(checked === true ? {} : { busPoint1: "", busPoint2: "" }),
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

            {form.needsBus === true && formTransportFee.amount && formTransportFee.amount > 0 ? (
              <div className="rounded-xl border border-[#CCFBF1] bg-[#F0FDFA]/70 px-3.5 py-3 text-[12px] text-slate-600 dark:border-teal-500/30 dark:bg-teal-950/40 dark:text-zinc-300">
                Estimated vehicle fee:{" "}
                <span className="font-mono font-semibold text-slate-900 dark:text-teal-50">
                  {formatMoney(formTransportFee.amount, orgCurrency)}
                </span>
                . The school will collect this in Finance after route confirmation.
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
              >
                {saving ? "Saving…" : "Save profile"}
              </Button>
            </div>
          </form>
        </section>
        )}
      </div>
    </div>
  );
}

const SPARKS = [
  { x: "-22px", y: "-28px", color: "#34D399", delay: "0ms" },
  { x: "18px", y: "-26px", color: "#FBBF24", delay: "40ms" },
  { x: "-30px", y: "-8px", color: "#2DD4BF", delay: "80ms" },
  { x: "26px", y: "-6px", color: "#F472B6", delay: "20ms" },
  { x: "0px", y: "-34px", color: "#A7F3D0", delay: "60ms" },
  { x: "12px", y: "-16px", color: "#FDE68A", delay: "100ms" },
] as const;

function ProfileSavedPopup({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => onCloseRef.current(), 4200);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[80] flex justify-center px-4">
      <div
        role="status"
        className="pointer-events-auto relative flex w-full max-w-md items-start gap-3 rounded-2xl border border-white/10 bg-[#1C1C1E] px-4 py-3.5 text-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)]"
      >
        <span className="relative grid h-9 w-9 shrink-0 place-items-center">
          {SPARKS.map((spark) => (
            <span
              key={`${spark.x}-${spark.y}`}
              className="absolute h-1.5 w-1.5 rounded-full"
              style={{
                background: spark.color,
                animation: "feezo-spark 700ms ease-out forwards",
                animationDelay: spark.delay,
                ["--spark-x" as string]: spark.x,
                ["--spark-y" as string]: spark.y,
              }}
            />
          ))}
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#22C55E]/15 text-[#22C55E]">
            <CheckCircle2 className="h-5 w-5" />
          </span>
        </span>
        <span className="min-w-0 flex-1 pt-0.5">
          <span className="block text-[14px] font-semibold leading-snug">Profile updated</span>
          <span className="mt-0.5 block text-[12.5px] leading-snug text-white/75">{message}</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Dismiss"
        >
          ×
        </button>
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
  const resolved =
    value && options.includes(value) ? value : allowNone && !value ? "__none__" : undefined;
  return (
    <Select value={resolved} onValueChange={onValueChange}>
      <SelectTrigger className="h-10 w-full rounded-lg border border-[#E5E5E5] bg-white px-3 text-[13px] shadow-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-0">
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

function LockedField({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
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
