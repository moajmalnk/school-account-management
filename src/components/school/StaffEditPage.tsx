import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { ImageCropDialog } from "@/components/ui/image-crop-dialog";
import { FieldSelect } from "@/components/school/SchoolAdminWorkspace";
import { StaffOrgQuickCreateDialogs } from "@/components/school/StaffOrgQuickCreate";
import { apiUpsertStaff } from "@/lib/api/records";
import { apiUploadDataUrl } from "@/lib/api/settings";
import { useTenantStore, type Staff } from "@/lib/tenant-store";
import { cn, glassCardClass } from "@/lib/utils";

type StaffDraft = {
  name: string;
  role: string;
  dept: string;
  phone: string;
  altPhone: string;
  guardianPhone: string;
  photoUrl: string;
};

function draftFromStaff(staff: Staff): StaffDraft {
  return {
    name: staff.name,
    role: staff.role,
    dept: staff.dept,
    phone: staff.phone ?? "",
    altPhone: staff.altPhone ?? "",
    guardianPhone: staff.guardianPhone ?? "",
    photoUrl: staff.photoUrl ?? "",
  };
}

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

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

function applyDraftToStaff(staff: Staff, draft: StaffDraft): Staff {
  return {
    ...staff,
    name: draft.name.trim(),
    role: draft.role.trim(),
    dept: draft.dept,
    phone: emptyToUndefined(draft.phone),
    altPhone: emptyToUndefined(draft.altPhone),
    guardianPhone: emptyToUndefined(draft.guardianPhone),
    photoUrl: draft.photoUrl || undefined,
  };
}

export function StaffEditPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/tenant/staff_/edit" }) as { id?: string };
  const { staff, setStaff, departments, roles } = useTenantStore();

  const member = useMemo(
    () => (search.id ? staff.find((s) => s.id === search.id) ?? null : null),
    [search.id, staff],
  );

  const [draft, setDraft] = useState<StaffDraft>(() =>
    member ? draftFromStaff(member) : draftFromStaff({} as Staff),
  );
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [createDeptOpen, setCreateDeptOpen] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (member) setDraft(draftFromStaff(member));
  }, [member]);

  const patchDraft = <K extends keyof StaffDraft>(key: K, value: StaffDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const backToProfile = () => {
    if (member) {
      navigate({ to: "/tenant/staff", search: { id: member.id } });
      return;
    }
    navigate({ to: "/tenant/staff", search: {} });
  };

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a JPG, PNG, or WebP image");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be 8 MB or smaller");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      if (dataUrl) setCropSrc(dataUrl);
    };
    reader.onerror = () => toast.error("Could not read the selected image");
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const persistStaff = async (updated: Staff) => {
    setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    try {
      let payload = updated;
      if (payload.photoUrl?.startsWith("data:")) {
        const url = await apiUploadDataUrl(payload.photoUrl, "photo", "staff-photo.png");
        payload = { ...payload, photoUrl: url };
        setStaff((prev) => prev.map((s) => (s.id === updated.id ? payload : s)));
      }
      const saved = await apiUpsertStaff(payload);
      const merged = { ...payload, ...saved };
      setStaff((prev) => prev.map((s) => (s.id === updated.id ? merged : s)));
      return merged;
    } catch (err) {
      toast.error("Could not save staff to server", {
        description: err instanceof Error ? err.message : "Save failed",
      });
      throw err;
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!member) return;
    if (!draft.name.trim() || !draft.role.trim()) {
      toast.error("Name and role are required");
      return;
    }
    setSaving(true);
    try {
      const updated = applyDraftToStaff(member, draft);
      await persistStaff(updated);
      toast.success(`${updated.name} updated`, {
        description: `${updated.id} · ${updated.dept}`,
      });
      navigate({ to: "/tenant/staff", search: { id: updated.id } });
    } finally {
      setSaving(false);
    }
  };

  if (!member) {
    return (
      <div className={cn(glassCardClass, "mx-auto max-w-lg p-6 text-center")}>
        <h1 className="text-lg font-bold text-slate-900">Staff member not found</h1>
        <p className="mt-2 text-[13px] text-slate-500">
          This profile may have been removed or the link is invalid.
        </p>
        <Button type="button" variant="outline" className="mt-4 rounded-full" onClick={backToProfile}>
          Back to staff
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
              Edit Staff Profile
            </div>
            <p className="mt-1 text-[12px] text-slate-500">
              Update core roster details for {member.name} · {member.id}
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] p-3">
            <div className="relative h-14 w-14 shrink-0">
              <ProfileAvatar
                name={draft.name.trim() || member.name}
                photoUrl={draft.photoUrl || undefined}
                className="h-14 w-14 rounded-lg"
                imgClassName="object-cover"
                initialsClassName="bg-[#0F766E] text-sm"
              />
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
              <div className="font-medium text-black">Profile Photo</div>
              <div className="mt-0.5">Optional · JPG, PNG or WebP · crop after pick</div>
              {draft.photoUrl && (
                <button
                  type="button"
                  onClick={() => patchDraft("photoUrl", "")}
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
              onChange={handlePhotoPick}
            />
          </div>

          <FormField label="Full Name">
            <Input
              value={draft.name}
              onChange={(e) => patchDraft("name", e.target.value)}
              placeholder="e.g. Sneha Pillai"
              autoFocus
            />
          </FormField>

          <FormField label="Role">
            <FieldSelect
              value={draft.role}
              onValueChange={(role) => patchDraft("role", role)}
              options={roles.map((r) => ({ value: r.title, label: r.title }))}
              placeholder="Select or add a role"
              onAddNew={() => setCreateRoleOpen(true)}
              addNewLabel="Add new role"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Department">
              <FieldSelect
                value={draft.dept}
                onValueChange={(dept) => patchDraft("dept", dept)}
                options={departments.map((d) => ({ value: d.name, label: d.name }))}
                placeholder="Select or add a department"
                onAddNew={() => setCreateDeptOpen(true)}
                addNewLabel="Add new department"
              />
            </FormField>
            <FormField label="Employee ID">
              <Input value={member.id} readOnly disabled className="font-mono" />
            </FormField>
          </div>

          <FormField label="Phone">
            <Input
              value={draft.phone}
              onChange={(e) => patchDraft("phone", e.target.value)}
              placeholder="Primary mobile"
              className="font-mono"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Alternative Number (optional)">
              <Input
                value={draft.altPhone}
                onChange={(e) => patchDraft("altPhone", e.target.value)}
                placeholder="Optional"
                className="font-mono"
              />
            </FormField>
            <FormField label="Guardian Number">
              <Input
                value={draft.guardianPhone}
                onChange={(e) => patchDraft("guardianPhone", e.target.value)}
                placeholder="Emergency / guardian"
                className="font-mono"
              />
            </FormField>
          </div>

          <div className="flex flex-nowrap items-center gap-1.5 pt-2 sm:justify-end sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={backToProfile}
              className="h-9 shrink-0 px-2.5 text-[12px] sm:h-10 sm:px-4 sm:text-sm"
            >
              Cancel
            </Button>
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
                "Save Profile"
              )}
            </Button>
          </div>
        </form>
      </section>

      <ImageCropDialog
        open={Boolean(cropSrc)}
        imageSrc={cropSrc}
        title="Change photo"
        description="Drag to reposition, zoom, then confirm the crop."
        aspect={1}
        outputSize={512}
        onOpenChange={(next) => {
          if (!next) setCropSrc(null);
        }}
        onConfirm={(dataUrl) => {
          setCropSrc(null);
          patchDraft("photoUrl", dataUrl);
        }}
        onRetake={() => photoRef.current?.click()}
      />

      <StaffOrgQuickCreateDialogs
        roleOpen={createRoleOpen}
        onRoleOpenChange={setCreateRoleOpen}
        departmentOpen={createDeptOpen}
        onDepartmentOpenChange={setCreateDeptOpen}
        onRoleCreated={(role) => patchDraft("role", role.title)}
        onDepartmentCreated={(dept) => patchDraft("dept", dept.name)}
      />
    </div>
  );
}
