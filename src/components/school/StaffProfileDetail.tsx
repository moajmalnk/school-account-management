import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  MessageSquare,
  Pencil,
  Phone,
  Camera,
  X,
  FileText,
  Paperclip,
  Upload,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { Staff, StaffDocument, StaffDocumentAttachment } from "@/lib/tenant-store";
import { DEFAULT_STAFF_DOCUMENTS, useTenantStore } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

const META_LABEL = "text-black/45 font-semibold tracking-wider text-[11px] uppercase";
const CARD_FRAME = "rounded-[2rem] bg-white border border-slate-100 shadow-sm p-6";
const MAX_FILE_BYTES = 1_500_000;
const MAX_FILES_PER_DOC = 8;

const phoneDigits = (raw?: string) => (raw ?? "").replace(/[^0-9]/g, "");

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StaffPhotoAvatar({
  staff,
  onPhotoChange,
}: {
  staff: Staff;
  onPhotoChange: (photoUrl: string | undefined) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (dataUrl) onPhotoChange(dataUrl);
    };
    reader.onerror = () => toast.error("Could not read the selected image");
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="relative h-16 w-16 shrink-0">
      {staff.photoUrl ? (
        <img
          src={staff.photoUrl}
          alt={`${staff.name} profile`}
          className="h-16 w-16 rounded-2xl object-cover"
        />
      ) : (
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-black text-lg font-semibold text-white">
          {initials(staff.name)}
        </div>
      )}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        aria-label={`Change photo for ${staff.name}`}
        title="Change photo"
        className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#C7F33C] text-black shadow-sm transition-colors hover:bg-black hover:text-[#C7F33C]"
      >
        <Camera className="h-3.5 w-3.5" />
      </button>
      {staff.photoUrl && (
        <button
          type="button"
          onClick={() => onPhotoChange(undefined)}
          aria-label={`Remove photo for ${staff.name}`}
          title="Remove photo"
          className="absolute -left-1 -top-1 grid h-6 w-6 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 shadow-sm transition-colors hover:bg-[#FEE2E2] hover:text-[#B91C1C]"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

function formatJoinedAt(iso: string) {
  const d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

function totalSalarySizeClass(formatted: string) {
  if (formatted.length > 14) return "text-sm leading-tight";
  if (formatted.length > 10) return "text-base leading-tight";
  if (formatted.length > 7) return "text-lg leading-tight";
  return "text-2xl leading-tight";
}

function parseSalaryInput(raw: string) {
  const n = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function isDocumentComplete(doc: StaffDocument) {
  return doc.number.trim().length > 0 || (doc.attachments?.length ?? 0) > 0;
}

export function StaffProfileDetail({
  staff,
  onBack,
  initialEdit = false,
}: {
  staff: Staff;
  onBack: () => void;
  initialEdit?: boolean;
}) {
  const navigate = useNavigate();
  const { setStaff, staff: allStaff, departments, roles } = useTenantStore();
  const [editOpen, setEditOpen] = useState(initialEdit);
  const [draft, setDraft] = useState({
    name: staff.name,
    role: staff.role,
    dept: staff.dept,
    id: staff.id,
    photoUrl: staff.photoUrl ?? "",
  });
  const editPhotoRef = useRef<HTMLInputElement>(null);

  const resetDraft = () => {
    setDraft({
      name: staff.name,
      role: staff.role,
      dept: staff.dept,
      id: staff.id,
      photoUrl: staff.photoUrl ?? "",
    });
  };

  useEffect(() => {
    resetDraft();
  }, [staff]);

  useEffect(() => {
    if (initialEdit) {
      navigate({ to: "/tenant/staff", search: { id: staff.id }, replace: true });
    }
  }, [initialEdit, navigate, staff.id]);

  useEffect(() => {
    const needsNormalize =
      !staff.documents?.length ||
      staff.documents.some((d) => !Array.isArray(d.attachments)) ||
      staff.documents.some((d) => !DEFAULT_STAFF_DOCUMENTS.some((def) => def.id === d.id));
    if (!needsNormalize) return;
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staff.id
          ? {
              ...s,
              documents: DEFAULT_STAFF_DOCUMENTS.map((def) => {
                const existing = s.documents?.find((d) => d.id === def.id);
                return {
                  ...def,
                  number: existing?.number ?? "",
                  attachments: existing?.attachments ?? [],
                };
              }),
            }
          : s,
      ),
    );
  }, [staff.documents, staff.id, setStaff]);

  const documents = useMemo(() => {
    const byId = new Map(
      (staff.documents?.length ? staff.documents : DEFAULT_STAFF_DOCUMENTS).map((d) => [d.id, d]),
    );
    return DEFAULT_STAFF_DOCUMENTS.map((def) => {
      const existing = byId.get(def.id);
      return {
        ...def,
        number: existing?.number ?? "",
        attachments: existing?.attachments ?? [],
      };
    });
  }, [staff.documents]);

  const digits = phoneDigits(staff.phone);
  const totalSalary = useMemo(
    () => staff.basicSalary + staff.additionalAllowances,
    [staff.basicSalary, staff.additionalAllowances],
  );

  const documentsOnFile = useMemo(
    () => documents.filter(isDocumentComplete).length,
    [documents],
  );

  const totalAttachments = useMemo(
    () => documents.reduce((sum, doc) => sum + (doc.attachments?.length ?? 0), 0),
    [documents],
  );

  const updatePayroll = (patch: Partial<Pick<Staff, "basicSalary" | "additionalAllowances">>) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === staff.id ? { ...s, ...patch } : s)),
    );
  };

  const updateDocument = (docId: string, number: string) => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staff.id
          ? {
              ...s,
              documents: (s.documents ?? DEFAULT_STAFF_DOCUMENTS).map((d) =>
                d.id === docId ? { ...d, number } : d,
              ),
            }
          : s,
      ),
    );
  };

  const updateDocumentAttachments = (
    docId: string,
    attachments: StaffDocumentAttachment[],
  ) => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staff.id
          ? {
              ...s,
              documents: (s.documents ?? DEFAULT_STAFF_DOCUMENTS).map((d) =>
                d.id === docId ? { ...d, attachments } : d,
              ),
            }
          : s,
      ),
    );
  };

  const addAttachments = async (docId: string, files: FileList | null) => {
    if (!files?.length) return;
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    const currentCount = doc.attachments?.length ?? 0;
    if (currentCount >= MAX_FILES_PER_DOC) {
      toast.error(`Maximum ${MAX_FILES_PER_DOC} files per document`);
      return;
    }

    const next: StaffDocumentAttachment[] = [...(doc.attachments ?? [])];
    let added = 0;

    for (const file of Array.from(files)) {
      if (next.length >= MAX_FILES_PER_DOC) break;
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} exceeds ${formatFileSize(MAX_FILE_BYTES)} limit`);
        continue;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        next.push({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        });
        added += 1;
      } catch {
        toast.error(`Could not read ${file.name}`);
      }
    }

    if (added > 0) {
      updateDocumentAttachments(docId, next);
      toast.success(`${added} file${added === 1 ? "" : "s"} attached`);
    }
  };

  const removeAttachment = (docId: string, attachmentId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    updateDocumentAttachments(
      docId,
      doc.attachments.filter((a) => a.id !== attachmentId),
    );
    toast.success("Attachment removed");
  };

  const toggleEdit = () => {
    resetDraft();
    setEditOpen(true);
  };

  const handleEditPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (dataUrl) setDraft((prev) => ({ ...prev, photoUrl: dataUrl }));
    };
    reader.onerror = () => toast.error("Could not read the selected image");
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim() || !draft.role.trim()) {
      toast.error("Name and role are required");
      return;
    }
    const nextId = draft.id.trim() || staff.id;
    if (nextId !== staff.id && allStaff.some((s) => s.id === nextId)) {
      toast.error("Employee ID already in use");
      return;
    }
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staff.id
          ? {
              ...s,
              id: nextId,
              name: draft.name.trim(),
              role: draft.role.trim(),
              dept: draft.dept,
              photoUrl: draft.photoUrl || undefined,
            }
          : s,
      ),
    );
    toast.success(`${draft.name.trim()} updated`, {
      description: `${nextId} · ${draft.dept}`,
    });
    if (nextId !== staff.id) {
      navigate({ to: "/tenant/staff", search: { id: nextId }, replace: true });
    }
    setEditOpen(false);
  };

  const handleMessage = () => {
    if (!digits) {
      toast.error("No phone number on file for this staff member");
      return;
    }
    window.location.href = `sms:${digits}`;
  };

  const handleCall = () => {
    if (!digits) {
      toast.error("No phone number on file for this staff member");
      return;
    }
    window.location.href = `tel:${digits}`;
  };

  const updatePhoto = (photoUrl: string | undefined) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === staff.id ? { ...s, photoUrl } : s)),
    );
    toast.success(
      photoUrl ? `${staff.name}'s photo updated` : `${staff.name}'s photo removed`,
    );
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
          <StaffPhotoAvatar staff={staff} onPhotoChange={updatePhoto} />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-black sm:text-2xl">{staff.name}</h1>
            <p className="mt-0.5 text-sm text-black/60">{staff.role}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex rounded-full bg-[#E1F2AE] px-2.5 py-0.5 text-[11px] font-medium text-black">
                {staff.dept}
              </span>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold",
                  staff.active ? "bg-[#C7F33C] text-black" : "bg-black/10 text-black/55",
                )}
              >
                {staff.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleMessage}
            disabled={!digits}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <MessageSquare className="h-4 w-4" />
            Message
          </button>
          <button
            type="button"
            onClick={handleCall}
            disabled={!digits}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Phone className="h-4 w-4" />
            Call
          </button>
          <button
            type="button"
            onClick={toggleEdit}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <section className={CARD_FRAME}>
          <h2 className="text-base font-semibold text-black">Personal Information</h2>
          <div className="mt-5 space-y-5">
            <MetaRow label="Employee ID" mono>
              {staff.id}
            </MetaRow>

            <MetaRow label="Date of Joining" mono>
              {formatJoinedAt(staff.joinedAt)}
            </MetaRow>

            <MetaRow label="Department" mono>
              {staff.dept}
            </MetaRow>

            {staff.phone && (
              <MetaRow label="Phone" mono>
                {staff.phone}
              </MetaRow>
            )}
          </div>
        </section>

        <section className={cn(CARD_FRAME, "min-w-0")}>
          <h2 className="text-base font-semibold text-black">Payroll</h2>
          <div className="mt-5 space-y-4">
            <div>
              <label className={META_LABEL} htmlFor="basic-salary">
                Basic Salary (₹)
              </label>
              <Input
                id="basic-salary"
                type="text"
                inputMode="numeric"
                value={String(staff.basicSalary)}
                onChange={(e) =>
                  updatePayroll({ basicSalary: parseSalaryInput(e.target.value) })
                }
                className="mt-1.5 h-10 font-mono text-[14px]"
              />
            </div>
            <div>
              <label className={META_LABEL} htmlFor="additional-allowances">
                Bonus / Additional Allowances (₹)
              </label>
              <Input
                id="additional-allowances"
                type="text"
                inputMode="numeric"
                value={String(staff.additionalAllowances)}
                onChange={(e) =>
                  updatePayroll({ additionalAllowances: parseSalaryInput(e.target.value) })
                }
                className="mt-1.5 h-10 font-mono text-[14px]"
              />
            </div>

            <div className="min-w-0 rounded-2xl bg-slate-50 p-4 sm:p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                Total Salary
              </div>
              <div className="mt-2 flex min-w-0 items-baseline gap-1.5">
                <span className="shrink-0 font-mono text-base font-bold text-black sm:text-lg">
                  ₹
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 break-all font-mono font-bold tracking-tight text-black",
                    totalSalarySizeClass(totalSalary.toLocaleString("en-IN")),
                  )}
                >
                  {totalSalary.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className={cn(CARD_FRAME, "lg:col-span-2")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-black">Identity Documents</h2>
              <p className="mt-1 text-[12.5px] text-black/50">
                Aadhaar and PAN records with multiple file attachments per document.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
              <FileText className="h-4 w-4 text-black/45" />
              <div className="text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                  On File
                </div>
                <div className="font-mono text-lg font-bold text-black">
                  {documentsOnFile} / {documents.length}
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-black/45">
                  {totalAttachments} attachment{totalAttachments === 1 ? "" : "s"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onNumberChange={(number) => updateDocument(doc.id, number)}
                onAttach={(files) => addAttachments(doc.id, files)}
                onRemoveAttachment={(attachmentId) => removeAttachment(doc.id, attachmentId)}
              />
            ))}
          </div>
        </section>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) resetDraft();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Profile</DialogTitle>
            <DialogDescription>
              Update core roster details for {staff.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div className="flex items-center gap-4 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-3">
              <div className="relative h-14 w-14 shrink-0">
                {draft.photoUrl ? (
                  <img
                    src={draft.photoUrl}
                    alt=""
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-black text-sm font-semibold text-white">
                    {draft.name.trim() ? initials(draft.name) : "?"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => editPhotoRef.current?.click()}
                  aria-label="Upload profile photo"
                  className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#C7F33C] text-black shadow-sm"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="min-w-0 text-[12px] text-black/55">
                <div className="font-medium text-black">Profile Photo</div>
                <div className="mt-0.5">Optional · JPG, PNG or WebP up to 2 MB</div>
                {draft.photoUrl && (
                  <button
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, photoUrl: "" }))}
                    className="mt-1.5 text-[11px] font-semibold text-[#B91C1C] hover:underline"
                  >
                    Remove photo
                  </button>
                )}
              </div>
              <input
                ref={editPhotoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleEditPhoto}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Full Name
              </Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Sneha Pillai"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Role
              </Label>
              <Select
                value={roles.some((r) => r.title === draft.role) ? draft.role : undefined}
                onValueChange={(role) => setDraft({ ...draft, role })}
                disabled={roles.length === 0}
              >
                <SelectTrigger className="h-10 w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 text-[13px] font-normal text-black shadow-none focus:ring-2 focus:ring-[#C7F33C]">
                  <SelectValue placeholder="No roles configured" />
                </SelectTrigger>
                <SelectContent className="z-[250] rounded-2xl border border-[#E5E5E5] bg-white p-1.5">
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.title}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10.5px] text-black/45">
                Manage role catalogue under Settings · Roles
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                  Department
                </Label>
                <Select
                  value={departments.some((d) => d.name === draft.dept) ? draft.dept : undefined}
                  onValueChange={(dept) => setDraft({ ...draft, dept })}
                  disabled={departments.length === 0}
                >
                  <SelectTrigger className="h-10 w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 text-[13px] font-normal text-black shadow-none focus:ring-2 focus:ring-[#C7F33C]">
                    <SelectValue placeholder="No departments configured" />
                  </SelectTrigger>
                  <SelectContent className="z-[250] rounded-2xl border border-[#E5E5E5] bg-white p-1.5">
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                  Employee ID
                </Label>
                <Input
                  value={draft.id}
                  onChange={(e) => setDraft({ ...draft, id: e.target.value })}
                  placeholder={staff.id}
                  className="font-mono"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
                Save Profile
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentCard({
  doc,
  onNumberChange,
  onAttach,
  onRemoveAttachment,
}: {
  doc: StaffDocument;
  onNumberChange: (number: string) => void;
  onAttach: (files: FileList | null) => void;
  onRemoveAttachment: (attachmentId: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const complete = isDocumentComplete(doc);

  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className={META_LABEL}>{doc.label}</div>
        <span
          className={cn(
            "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            complete ? "bg-[#E1F2AE] text-black" : "bg-slate-200/80 font-medium text-black/50",
          )}
        >
          {complete ? "On file" : "Not provided"}
        </span>
      </div>

      <Input
        value={doc.number}
        onChange={(e) => onNumberChange(e.target.value)}
        placeholder={doc.label === "Aadhaar" ? "XXXX XXXX XXXX" : "Enter number"}
        className="mt-1.5 h-10 border-slate-200 bg-white font-mono text-[13px]"
      />

      <div className="mt-4 border-t border-slate-200/80 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-black/45">
            <Paperclip className="h-3.5 w-3.5" />
            Attachments
          </div>
          <span className="font-mono text-[10px] text-black/45">
            {doc.attachments.length} / {MAX_FILES_PER_DOC}
          </span>
        </div>

        {doc.attachments.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {doc.attachments.map((file) => (
              <li
                key={file.id}
                className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-black/40" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-medium text-black">{file.name}</div>
                  <div className="font-mono text-[10px] text-black/45">{formatFileSize(file.size)}</div>
                </div>
                <a
                  href={file.dataUrl}
                  download={file.name}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-black/60 transition-colors hover:bg-slate-50"
                  aria-label={`Open ${file.name}`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(file.id)}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[12px] text-black/45">No files attached yet.</p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => {
            onAttach(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={doc.attachments.length >= MAX_FILES_PER_DOC}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white text-[12px] font-medium text-black/70 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Upload className="h-3.5 w-3.5" />
          Attach files
        </button>
        <p className="mt-1.5 text-[10px] text-black/40">
          PDF or images · up to {formatFileSize(MAX_FILE_BYTES)} each
        </p>
      </div>
    </div>
  );
}

function MetaRow({
  label,
  mono,
  children,
}: {
  label: string;
  mono?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <div className={META_LABEL}>{label}</div>
      <div className={cn("mt-1.5 text-[14px] font-medium text-black", mono && "font-mono")}>
        {children}
      </div>
    </div>
  );
}
