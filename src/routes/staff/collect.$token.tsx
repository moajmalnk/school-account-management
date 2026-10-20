import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import "@/file-routes";
import { Camera, CheckCircle2, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import {
  apiGetStaffCollect,
  apiSubmitStaffCollect,
  type StaffCollectProfile,
  type StaffCollectSchool,
} from "@/lib/api/records";
import { phoneDigits } from "@/lib/phone";
import {
  applyStaffCollectUpdate,
  BLOOD_GROUPS,
  getStaffByShareToken,
  STAFF_EMERGENCY_RELATIONS,
  type StaffCollectFields,
} from "@/lib/tenant-store";
import { cn, glassCardClass } from "@/lib/utils";

export const Route = createFileRoute("/staff/collect/$token")({
  component: StaffCollectPage,
});

type CollectFields = {
  phone: string;
  altPhone: string;
  guardianPhone: string;
  photoUrl: string;
  gender: "" | "M" | "F";
  dob: string;
  email: string;
  address: string;
  bloodGroup: string;
  emergencyName: string;
  emergencyRelation: string;
};

type FieldKey = "phone" | "altPhone" | "guardianPhone" | "email" | "dob" | "address" | "emergencyName" | "bloodGroup" | "emergencyRelation";
type FieldErrors = Partial<Record<FieldKey, string>>;

const emptyFields = (): CollectFields => ({
  phone: "",
  altPhone: "",
  guardianPhone: "",
  photoUrl: "",
  gender: "",
  dob: "",
  email: "",
  address: "",
  bloodGroup: "",
  emergencyName: "",
  emergencyRelation: "",
});

/** Personal fields a staff member may change. Employment and pay stay locked. */
function fieldsFromProfile(staff: StaffCollectProfile): CollectFields {
  const gender = staff.gender === "M" || staff.gender === "F" ? staff.gender : "";
  return {
    phone: staff.phone ?? "",
    altPhone: staff.altPhone ?? "",
    guardianPhone: staff.guardianPhone ?? "",
    photoUrl: staff.photoUrl ?? "",
    gender,
    dob: staff.dob ?? "",
    email: staff.email ?? "",
    address: staff.address ?? "",
    bloodGroup: staff.bloodGroup ?? "",
    emergencyName: staff.emergencyName ?? "",
    emergencyRelation: staff.emergencyRelation ?? "",
  };
}

function todayISO() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function personInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Optional numbers may be blank. A filled number must be a real mobile length.
 */
function phoneError(value: string, label: string, required: boolean): string | null {
  const digits = phoneDigits(value);
  if (!digits) return required ? `${label} is required.` : null;
  if (digits.length < 8 || digits.length > 15) return `${label} must be 8 to 15 digits.`;
  return null;
}

function validateFields(form: CollectFields): FieldErrors {
  const errors: FieldErrors = {
    phone: phoneError(form.phone, "Mobile number", true) ?? undefined,
    altPhone: phoneError(form.altPhone, "Alternate number", false) ?? undefined,
    guardianPhone: phoneError(form.guardianPhone, "Emergency number", false) ?? undefined,
  };
  const email = form.email.trim();
  if (email && (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    errors.email = "Enter a valid email address.";
  }
  if (form.dob && form.dob > todayISO()) {
    errors.dob = "Date of birth cannot be in the future.";
  }
  if (form.address.trim().length > 2000) {
    errors.address = "Address is too long.";
  }
  if (form.emergencyName.trim().length > 120) {
    errors.emergencyName = "Emergency contact name is too long.";
  }
  if (form.bloodGroup && !(BLOOD_GROUPS as readonly string[]).includes(form.bloodGroup)) {
    errors.bloodGroup = "Choose a valid blood group.";
  }
  if (
    form.emergencyRelation &&
    !(STAFF_EMERGENCY_RELATIONS as readonly string[]).includes(form.emergencyRelation)
  ) {
    errors.emergencyRelation = "Choose who this contact is.";
  }
  const hasEmergencyName = form.emergencyName.trim().length > 0;
  const hasEmergencyPhone = phoneDigits(form.guardianPhone).length > 0;
  if (hasEmergencyPhone && !hasEmergencyName) {
    errors.emergencyName = "Add the emergency contact name.";
  }
  if (hasEmergencyName && !hasEmergencyPhone && !errors.guardianPhone) {
    errors.guardianPhone = "Add the emergency contact number.";
  }
  return errors;
}

function hasErrors(errors: FieldErrors) {
  return Object.values(errors).some(Boolean);
}

function StaffCollectPage() {
  const { token } = Route.useParams();
  const [lookup, setLookup] = useState<"loading" | "ready" | "missing">("loading");
  const [staff, setStaff] = useState<StaffCollectProfile | null>(null);
  const [school, setSchool] = useState<StaffCollectSchool | null>(null);
  const [form, setForm] = useState<CollectFields>(emptyFields);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const dirtyRef = useRef(false);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLookup("loading");
    setSubmitted(false);
    dirtyRef.current = false;
    void apiGetStaffCollect(token)
      .then((remote) => {
        if (cancelled) return;
        setStaff(remote.staff);
        setSchool(remote.school);
        setForm(fieldsFromProfile(remote.staff));
        setErrors({});
        setLookup("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        const offline = !(err instanceof ApiError) || err.status === 0;
        const local = offline ? getStaffByShareToken(token) : null;
        if (local) {
          const cached: StaffCollectProfile = {
            id: local.id,
            name: local.name,
            role: local.role,
            dept: local.dept,
            joinedAt: local.joinedAt,
            phone: local.phone,
            altPhone: local.altPhone,
            guardianPhone: local.guardianPhone,
            photoUrl: local.photoUrl,
            gender: local.gender,
            dob: local.dob,
            email: local.email,
            address: local.address,
            bloodGroup: local.bloodGroup,
            emergencyName: local.emergencyName,
            emergencyRelation: local.emergencyRelation,
          };
          setStaff(cached);
          setForm(fieldsFromProfile(cached));
          setErrors({});
          setLookup("ready");
          return;
        }
        setStaff(null);
        setLookup("missing");
      });
    return () => {
      cancelled = true;
      dirtyRef.current = false;
    };
  }, [token]);

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current || submitted || saving) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [submitted, saving]);

  const patch = (next: Partial<CollectFields>) => {
    dirtyRef.current = true;
    setForm((prev) => {
      const merged = { ...prev, ...next };
      setErrors(validateFields(merged));
      return merged;
    });
  };

  const handlePhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose a JPG, PNG, or WebP image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2 MB or smaller");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      if (dataUrl) patch({ photoUrl: dataUrl });
    };
    reader.onerror = () => toast.error("Could not read the selected image");
    reader.readAsDataURL(file);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitted || saving || !staff) return;
    const nextErrors = validateFields(form);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    const fields: StaffCollectFields = {
      phone: form.phone.trim(),
      altPhone: form.altPhone.trim() || undefined,
      guardianPhone: form.guardianPhone.trim() || undefined,
      photoUrl: form.photoUrl || undefined,
      gender: form.gender || undefined,
      dob: form.dob || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      bloodGroup: form.bloodGroup || undefined,
      emergencyName: form.emergencyName.trim() || undefined,
      emergencyRelation:
        form.emergencyRelation === "Spouse" ||
        form.emergencyRelation === "Parent" ||
        form.emergencyRelation === "Sibling" ||
        form.emergencyRelation === "Other"
          ? form.emergencyRelation
          : undefined,
    };

    setSaving(true);
    try {
      try {
        await apiSubmitStaffCollect(token, {
          phone: fields.phone ?? "",
          altPhone: fields.altPhone,
          guardianPhone: fields.guardianPhone,
          photoUrl: fields.photoUrl,
          gender: fields.gender,
          dob: fields.dob,
          email: fields.email,
          address: fields.address,
          bloodGroup: fields.bloodGroup,
          emergencyName: fields.emergencyName,
          emergencyRelation: fields.emergencyRelation,
        });
      } catch (err) {
        const offline = !(err instanceof ApiError) || err.status === 0;
        if (!offline) throw err;
        if (!applyStaffCollectUpdate(token, fields)) {
          toast.error("Could not save. This link may be invalid or expired.");
          return;
        }
      }
      applyStaffCollectUpdate(token, fields);
      dirtyRef.current = false;
      setForm(emptyFields());
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setStaff(null);
        setLookup("missing");
        toast.error("This link has expired", {
          description: "Ask the school office for a new collection link.",
        });
        return;
      }
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (lookup === "loading") {
    return <StaffCollectSkeleton />;
  }

  if (!staff) {
    return (
      <div className="tenant-canvas flex min-h-dvh items-center justify-center px-4">
        <div className={cn(glassCardClass, "max-w-md rounded-2xl p-6 text-center")}>
          <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-50">Link expired</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400">
            This link can be used once. It has already been submitted, or the school has closed it.
            Ask the school office for a new link if your contact details still need an update.
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

  const schoolLabel = school?.name?.trim() || "your school";
  const canSubmit = !saving && !hasErrors(validateFields(form));

  return (
    <div className="tenant-canvas min-h-dvh px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <header className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            {schoolLabel} · Staff details
          </div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            Complete your staff details
          </h1>
          <p className="text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400">
            {submitted
              ? "Your update was saved and this link is now closed."
              : "Name, role, and department are filled by the school. Add your photo and personal details, then save. This link closes after one save."}
          </p>
        </header>

        <section className={cn(glassCardClass, "space-y-3 rounded-2xl p-5")}>
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
            <Lock className="h-3.5 w-3.5" />
            Filled by school · read only
          </div>
          <div className="grid grid-cols-12 gap-3">
            <LockedField className="col-span-12 sm:col-span-6" label="Full name" value={staff.name} />
            <LockedField className="col-span-12 sm:col-span-6" label="Employee ID" value={staff.id} />
            <LockedField className="col-span-12 sm:col-span-6" label="Role" value={staff.role || "—"} />
            <LockedField
              className="col-span-12 sm:col-span-6"
              label="Department"
              value={staff.dept || "—"}
            />
            <LockedField
              className="col-span-12 sm:col-span-6"
              label="Date joined"
              value={
                staff.joinedAt
                  ? new Date(`${staff.joinedAt.slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"
              }
            />
          </div>
        </section>

        {submitted ? (
          <section
            className={cn(
              glassCardClass,
              "flex flex-col items-center rounded-2xl px-6 py-10 text-center",
            )}
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#22C55E]/15 text-[#16A34A]">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-[18px] font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              Details submitted
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400">
              {schoolLabel} now has your contact details. This link is closed. Ask the office for a
              new link if something else needs to change.
            </p>
          </section>
        ) : (
          <section className={cn(glassCardClass, "rounded-2xl p-5 md:p-6")}>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="text-[12px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                Your updates
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-3 dark:border-white/10 dark:bg-zinc-900/60">
                <div className="relative h-14 w-14 shrink-0">
                  {form.photoUrl ? (
                    <img
                      src={form.photoUrl}
                      alt=""
                      className="h-14 w-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#0F766E] text-sm font-semibold text-white">
                      {personInitials(staff.name)}
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
                <div className="min-w-0 text-[12px] text-black/55 dark:text-zinc-400">
                  <div className="font-medium text-black dark:text-zinc-100">Profile photo</div>
                  <div className="mt-0.5">Optional · JPG, PNG, or WebP up to 2 MB</div>
                  {form.photoUrl ? (
                    <button
                      type="button"
                      onClick={() => patch({ photoUrl: "" })}
                      className="mt-1.5 text-[11px] font-semibold text-[#EF4444] hover:underline"
                    >
                      Remove photo
                    </button>
                  ) : null}
                </div>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handlePhoto}
                />
              </div>

              <div className="grid grid-cols-12 gap-4">
                <Field className="col-span-12 sm:col-span-6" label="Gender">
                  <div className="inline-flex w-full items-center rounded-full border border-black/10 bg-white p-1 dark:border-white/10 dark:bg-zinc-950">
                    {(
                      [
                        { key: "M" as const, label: "Male" },
                        { key: "F" as const, label: "Female" },
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => patch({ gender: form.gender === option.key ? "" : option.key })}
                        className={cn(
                          "min-h-9 flex-1 rounded-full text-[12px] font-semibold transition-colors",
                          form.gender === option.key
                            ? "bg-[#0F766E] text-white"
                            : "text-black/55 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field className="col-span-12 sm:col-span-6" label="Date of birth" error={errors.dob}>
                  <DatePicker
                    value={form.dob}
                    max={todayISO()}
                    onChange={(dob) => patch({ dob: dob ?? "" })}
                  />
                </Field>
                <Field className="col-span-12 sm:col-span-6" label="Email" error={errors.email}>
                  <Input
                    type="email"
                    maxLength={255}
                    value={form.email}
                    onChange={(event) => patch({ email: event.target.value })}
                    placeholder="name@school.com"
                    autoComplete="email"
                  />
                </Field>
                <Field className="col-span-12 sm:col-span-6" label="Blood group" error={errors.bloodGroup}>
                  <Select
                    value={form.bloodGroup || undefined}
                    onValueChange={(bloodGroup) => patch({ bloodGroup })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field className="col-span-12" label="Address" error={errors.address}>
                  <Textarea
                    maxLength={2000}
                    value={form.address}
                    onChange={(event) => patch({ address: event.target.value })}
                    placeholder="Residential address"
                    rows={3}
                    className="rounded-xl"
                  />
                </Field>
                <Field
                  className="col-span-12 sm:col-span-6"
                  label="Mobile number"
                  error={errors.phone}
                  required
                >
                  <PhoneInput
                    value={form.phone}
                    onChange={(phone) => patch({ phone })}
                    aria-label="Mobile number"
                  />
                </Field>
                <Field
                  className="col-span-12 sm:col-span-6"
                  label="Alternate number"
                  error={errors.altPhone}
                >
                  <PhoneInput
                    value={form.altPhone}
                    onChange={(altPhone) => patch({ altPhone })}
                    aria-label="Alternate number"
                  />
                </Field>
                <div className="col-span-12 pt-1 text-[12px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                  Emergency contact
                </div>
                <Field
                  className="col-span-12 sm:col-span-6"
                  label="Name"
                  error={errors.emergencyName}
                >
                  <Input
                    maxLength={120}
                    value={form.emergencyName}
                    onChange={(event) => patch({ emergencyName: event.target.value })}
                    placeholder="Person to call"
                  />
                </Field>
                <Field
                  className="col-span-12 sm:col-span-6"
                  label="Relationship"
                  error={errors.emergencyRelation}
                >
                  <Select
                    value={form.emergencyRelation || undefined}
                    onValueChange={(emergencyRelation) => patch({ emergencyRelation })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAFF_EMERGENCY_RELATIONS.map((relation) => (
                        <SelectItem key={relation} value={relation}>
                          {relation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field
                  className="col-span-12"
                  label="Emergency number"
                  error={errors.guardianPhone}
                >
                  <PhoneInput
                    value={form.guardianPhone}
                    onChange={(guardianPhone) => patch({ guardianPhone })}
                    aria-label="Emergency number"
                  />
                </Field>
              </div>

              <p className="text-[12px] leading-relaxed text-slate-500 dark:text-zinc-400">
                The school keeps your role, department, and salary. This form only updates how they
                can reach you.
              </p>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
                >
                  {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                  {saving ? "Saving…" : "Save details"}
                </Button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}

function StaffCollectSkeleton() {
  return (
    <div
      className="tenant-canvas min-h-dvh px-4 py-6 sm:py-10"
      aria-busy="true"
      aria-label="Opening staff form"
    >
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-3 w-36 rounded-md" />
          <Skeleton className="h-7 w-64 max-w-full rounded-md" />
          <Skeleton className="h-4 w-full max-w-lg rounded-md" />
        </div>
        <div className={cn(glassCardClass, "space-y-3 rounded-2xl p-5")}>
          <Skeleton className="h-4 w-40 rounded-md" />
          <div className="grid grid-cols-12 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="col-span-12 h-14 rounded-xl sm:col-span-6" />
            ))}
          </div>
        </div>
        <div className={cn(glassCardClass, "space-y-3 rounded-2xl p-5")}>
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  required,
  className,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
        {label}
        {required ? <span className="ml-1 text-[#EF4444]">*</span> : null}
      </div>
      {children}
      {error ? (
        <p className="text-[12px] font-medium text-[#EF4444]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function LockedField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-zinc-900/70",
        className,
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-0.5 truncate text-[13px] font-semibold text-slate-800 dark:text-zinc-100">
        {value}
      </div>
    </div>
  );
}
