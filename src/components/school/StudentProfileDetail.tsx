import { useEffect, useMemo, useRef, useState, startTransition, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Camera,
  Download,
  ExternalLink,
  FileText,
  MessageCircle,
  Paperclip,
  Pencil,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Send,
  ClipboardList,
  Upload,
  X,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BLOOD_GROUPS,
  createStudentShareToken,
  DEFAULT_STUDENT_DOCUMENTS,
  GUARDIAN_RELATIONS,
  STUDENT_CATEGORIES,
  STUDENT_RELIGIONS,
  upsertStudentInSnapshot,
  useTenantStore,
  type GuardianRelation,
  type StaffDocument,
  type StaffDocumentAttachment,
  type Student,
} from "@/lib/tenant-store";
import {
  buildStudentFeeStatement,
  type StudentLedgerRow as LedgerRow,
  type StudentLedgerStatus as LedgerStatus,
  type StudentReceipt as Receipt,
} from "@/lib/student-fees";
import { ShareParentLinkDialog } from "@/components/school/ShareParentLinkDialog";
import { downloadReceiptPdf } from "@/lib/finance-export";
import { sendWhatsAppNotify, toNotifyWhatsAppNumber } from "@/lib/whatsapp-notify";
import { apiDeleteStudent, apiUpsertStudent } from "@/lib/api/records";
import { useAuth } from "@/lib/auth";
import {
  EnrollmentStatusBadge,
  isRecordActive,
  ProfileAccountActions,
} from "@/components/school/ProfileAccountActions";
import {
  ProfileDetailTabs,
  ProfileTabPanel,
  STUDENT_PROFILE_TABS,
  type ProfileDetailTabId,
} from "@/components/school/ProfileDetailTabs";
import { cn } from "@/lib/utils";

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

const META_LABEL =
  "text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-400";
const CARD_FRAME =
  "rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 dark:border-white/10 dark:bg-[#171717] dark:text-zinc-100 dark:shadow-black/40";
const profileBottomPad = "pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-0";
const MAX_FILES_PER_DOC = 8;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const EMPTY = <span className="font-normal text-black/40 dark:text-zinc-500">—</span>;

type ProfileTableRow = {
  label: string;
  value: ReactNode;
  mono?: boolean;
};

/** Responsive field/value table — stacks on mobile, two columns from sm up. */
function ProfileDataTable({
  title,
  description,
  rows,
  className,
}: {
  title: string;
  description?: string;
  rows: ProfileTableRow[];
  className?: string;
}) {
  return (
    <section className={cn(CARD_FRAME, className)}>
      <h2 className="text-base font-semibold text-black dark:text-zinc-50">{title}</h2>
      {description ? (
        <p className="mt-1 text-[12.5px] text-black/50 dark:text-zinc-400">{description}</p>
      ) : null}
      <div className="mt-4 -mx-1 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-0 border-collapse text-left">
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-b-0 last:pb-0 first:pt-0 sm:table-row sm:border-slate-100/90 dark:border-white/10"
              >
                <th
                  scope="row"
                  className={cn(
                    META_LABEL,
                    "whitespace-nowrap text-left font-semibold sm:w-[38%] sm:max-w-[14rem] sm:py-3 sm:pr-4 sm:align-top",
                  )}
                >
                  {row.label}
                </th>
                <td
                  className={cn(
                    "min-w-0 break-words text-[14px] font-medium text-black dark:text-zinc-100 sm:py-3 sm:align-top",
                    row.mono && "font-mono",
                  )}
                >
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
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

function ensureStudentDocuments(student: Student): StaffDocument[] {
  if (Array.isArray(student.documents) && student.documents.length > 0) {
    const byId = new Map(student.documents.map((d) => [d.id, d]));
    return DEFAULT_STUDENT_DOCUMENTS.map((def) => {
      const existing = byId.get(def.id);
      if (!existing) {
        return {
          ...def,
          number: def.id === "doc-aadhaar" ? student.aadhaar ?? "" : "",
          levels: def.levels.map((l) => ({ ...l })),
          attachments: [],
        };
      }
      return {
        ...def,
        number:
          existing.number?.trim() ||
          (def.id === "doc-aadhaar" ? student.aadhaar ?? "" : ""),
        levels: existing.levels?.length ? existing.levels : def.levels.map((l) => ({ ...l })),
        attachments: Array.isArray(existing.attachments) ? existing.attachments : [],
      };
    });
  }
  return DEFAULT_STUDENT_DOCUMENTS.map((def) => ({
    ...def,
    number: def.id === "doc-aadhaar" ? student.aadhaar ?? "" : "",
    levels: def.levels.map((l) => ({ ...l })),
    attachments: [],
  }));
}

const inr = (n: number) => `₹ ${n.toLocaleString("en-IN")}`;

function formatPhone(raw?: string) {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return raw?.trim() || "";
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StudentPhotoAvatar({
  student,
  onPhotoChange,
  size = "md",
}: {
  student: Student;
  onPhotoChange: (photoUrl: string | undefined) => void;
  size?: "md" | "lg";
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const dim = size === "lg" ? "h-20 w-20 sm:h-24 sm:w-24" : "h-16 w-16";
  const text = size === "lg" ? "text-2xl sm:text-3xl" : "text-lg";
  const cam = size === "lg" ? "h-8 w-8" : "h-7 w-7";
  const camIcon = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";

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
    <>
      <div className={cn("relative shrink-0", dim)}>
        {student.photoUrl ? (
          <img
            src={student.photoUrl}
            alt={`${student.name} profile`}
            className={cn(dim, "rounded-2xl object-cover ring-2 ring-white shadow-md")}
          />
        ) : (
          <div
            className={cn(
              dim,
              "grid place-items-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 font-semibold text-white shadow-md ring-2 ring-white",
              text,
            )}
          >
            {initials(student.name)}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label={`Change photo for ${student.name}`}
          title="Change photo"
          className={cn(
            "absolute -bottom-1 -right-1 grid place-items-center rounded-full border-2 border-white bg-[#0F766E] text-white shadow-sm transition-colors hover:bg-slate-900",
            cam,
          )}
        >
          <Camera className={camIcon} />
        </button>
        {student.photoUrl && (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            aria-label={`Remove photo for ${student.name}`}
            title="Remove photo"
            className="absolute -left-1 -top-1 grid h-6 w-6 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 shadow-sm transition-colors hover:bg-[#FEE2E2] hover:text-[#EF4444]"
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

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent className="max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">Remove photo</DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60 dark:text-zinc-400">
              Remove {student.name}&apos;s profile photo? You can upload a new one anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmRemove(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full bg-[#EF4444] text-white hover:bg-[#DC2626]"
              onClick={() => {
                onPhotoChange(undefined);
                setConfirmRemove(false);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function StudentProfileDetail({
  student,
  onBack,
  initialEdit = false,
}: {
  student: Student;
  onBack: () => void;
  initialEdit?: boolean;
}) {
  const navigate = useNavigate();
  const { setStudents, academicYear, schoolDetails, classes: classConfigs, activePayments, activeFeeTerms } =
    useTenantStore();
  const { session } = useAuth();
  const schoolName = schoolDetails.name || session?.tenantName || "Silver Hills Global";
  const [editOpen, setEditOpen] = useState(initialEdit);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareToken, setShareToken] = useState(student.shareToken ?? "");
  const [activeTab, setActiveTab] = useState<ProfileDetailTabId>("profile");
  const [draft, setDraft] = useState<StudentDraft>(() => draftFromStudent(student));

  const resetDraft = () => {
    setDraft(draftFromStudent(student));
  };

  const classOptions = useMemo(() => {
    const fromConfig = classConfigs.map((c) => c.className);
    return Array.from(new Set([...fromConfig, student.cls, draft.cls].filter(Boolean)));
  }, [classConfigs, draft.cls, student.cls]);

  useEffect(() => {
    setShareToken(student.shareToken ?? "");
    if (!editOpen) {
      setDraft(draftFromStudent(student));
    }
  }, [student, editOpen]);

  useEffect(() => {
    if (initialEdit) {
      setEditOpen(true);
      navigate({ to: "/tenant/students", search: { id: student.id }, replace: true });
    }
  }, [initialEdit, navigate, student.id]);

  const feeStatement = useMemo(
    () =>
      buildStudentFeeStatement({
        student,
        payments: activePayments,
        classes: classConfigs,
        feeTerms: activeFeeTerms,
        academicYear,
      }),
    [student, activePayments, classConfigs, activeFeeTerms, academicYear],
  );
  const fees = feeStatement;
  const ledger = feeStatement.ledger;
  const receipts = feeStatement.receipts;
  const documents = useMemo(() => ensureStudentDocuments(student), [student]);
  const docsNormalizedForId = useRef<string | null>(null);

  useEffect(() => {
    if (docsNormalizedForId.current === student.id) return;
    const needsNormalize =
      !Array.isArray(student.documents) ||
      student.documents.length === 0 ||
      DEFAULT_STUDENT_DOCUMENTS.some((def) => !student.documents?.some((d) => d.id === def.id));
    docsNormalizedForId.current = student.id;
    if (!needsNormalize) return;
    const next = { ...student, documents: ensureStudentDocuments(student) };
    // Defer so the profile can paint once before store rewrite.
    startTransition(() => {
      setStudents((prev) => prev.map((s) => (s.id === student.id ? next : s)));
      upsertStudentInSnapshot(next);
    });
  }, [student, setStudents]);

  const syncStudent = (updated: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === student.id ? updated : s)));
    upsertStudentInSnapshot(updated);
    void apiUpsertStudent(updated)
      .then((saved) => {
        const merged = { ...updated, ...saved };
        setStudents((prev) => prev.map((s) => (s.id === student.id ? merged : s)));
        upsertStudentInSnapshot(merged);
      })
      .catch((err) =>
        toast.error("Could not save student to server", {
          description: err instanceof Error ? err.message : "Save failed",
        }),
      );
  };

  const persistDocuments = (nextDocs: StaffDocument[], aadhaarOverride?: string) => {
    const aadhaarDoc = nextDocs.find((d) => d.id === "doc-aadhaar");
    const nextAadhaar =
      aadhaarOverride !== undefined
        ? aadhaarOverride.trim() || undefined
        : aadhaarDoc?.number.trim() || student.aadhaar;
    const updated: Student = {
      ...student,
      aadhaar: nextAadhaar,
      documents: nextDocs,
    };
    syncStudent(updated);
  };

  const updateDocumentNumber = (docId: string, number: string) => {
    const nextDocs = documents.map((d) => (d.id === docId ? { ...d, number } : d));
    persistDocuments(nextDocs, docId === "doc-aadhaar" ? number : undefined);
  };

  const updateDocumentAttachments = (docId: string, attachments: StaffDocumentAttachment[]) => {
    const nextDocs = documents.map((d) => (d.id === docId ? { ...d, attachments } : d));
    persistDocuments(nextDocs);
  };

  const attachFiles = async (docId: string, levelId: string, fileList: FileList | null) => {
    if (!fileList?.length) return;
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    const currentCount = doc.attachments?.length ?? 0;
    if (currentCount >= MAX_FILES_PER_DOC) {
      toast.error(`Maximum ${MAX_FILES_PER_DOC} files per document`);
      return;
    }

    const next: StaffDocumentAttachment[] = [...(doc.attachments ?? [])];
    for (const file of Array.from(fileList)) {
      if (next.length >= MAX_FILES_PER_DOC) break;
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} is larger than 5 MB`);
        continue;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        if (!dataUrl) {
          toast.error(`Could not read ${file.name}`);
          continue;
        }
        next.push({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          dataUrl,
          uploadedAt: new Date().toISOString(),
          levelId,
        });
      } catch {
        toast.error(`Could not read ${file.name}`);
      }
    }

    if (next.length === currentCount) return;
    updateDocumentAttachments(docId, next);
    const added = next.length - currentCount;
    toast.success(
      added === 1 ? `${next[next.length - 1].name} attached` : `${added} files attached`,
    );
  };

  const removeAttachment = (docId: string, attachmentId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    updateDocumentAttachments(
      docId,
      doc.attachments.filter((a) => a.id !== attachmentId),
    );
  };

  const docsOnFile = documents.filter((d) => isDocumentComplete(d)).length;
  const docsTotal = documents.length;

  const phoneDigits = (student.phone || "").replace(/[^0-9]/g, "");
  const waHref = phoneDigits
    ? `https://wa.me/${phoneDigits.length === 10 ? "91" : ""}${phoneDigits}`
    : undefined;

  const patchDraft = <K extends keyof StudentDraft>(key: K, value: StudentDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const openShare = () => {
    let token = student.shareToken ?? shareToken;
    if (!token) {
      token = createStudentShareToken();
      const next = { ...student, shareToken: token };
      syncStudent(next);
    }
    setShareToken(token);
    setShareOpen(true);
  };

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
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
    const nextDocs = ensureStudentDocuments(student).map((d) =>
      d.id === "doc-aadhaar" ? { ...d, number: draft.aadhaar.trim() } : d,
    );
    const updated: Student = {
      ...student,
      name: draft.name.trim(),
      gender: draft.gender || undefined,
      cls: draft.cls.trim(),
      guardian: draft.guardian.trim(),
      phone: emptyToUndefined(draft.phone),
      dob: emptyToUndefined(draft.dob),
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
    syncStudent(updated);
    toast.success(`${updated.name}'s profile updated`, {
      description: `${updated.id} · all profile fields saved`,
    });
    setEditOpen(false);
  };

  const updatePhoto = (photoUrl: string | undefined) => {
    const updated = { ...student, photoUrl };
    syncStudent(updated);
    toast.success(photoUrl ? `${student.name}'s photo updated` : `${student.name}'s photo removed`);
  };

  const isActive = isRecordActive(student.active);

  const toggleActive = (nextActive: boolean) => {
    const updated = { ...student, active: nextActive };
    syncStudent(updated);
    toast.success(nextActive ? `${student.name} reactivated` : `${student.name} deactivated`, {
      description: student.id,
    });
  };

  const deleteStudent = () => {
    const updated = { ...student, deletedAt: new Date().toISOString() };
    setStudents((prev) => prev.map((s) => (s.id === student.id ? updated : s)));
    void apiDeleteStudent(student.id).catch((err) =>
      toast.error("Could not move student to recycle bin on server", {
        description: err instanceof Error ? err.message : "Delete failed",
      }),
    );
    toast.error(`${student.name} moved to recycle bin`, { description: student.id });
    onBack();
  };

  return (
    <div className={cn("flex flex-col gap-4 sm:gap-6", profileBottomPad)}>
      <ShareParentLinkDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        token={shareToken}
        studentName={student.name}
        guardianPhone={student.phone}
        guardianName={student.guardian}
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#171717] dark:shadow-black/40">
        <div className="h-1 bg-gradient-to-r from-[#0F766E] via-[#115E59] to-[#99F6E4]" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
            <StudentPhotoAvatar student={student} onPhotoChange={updatePhoto} size="lg" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Student profile
              </p>
              <h1 className="mt-1 truncate text-[1.65rem] font-semibold tracking-tight text-slate-950 dark:text-zinc-50 sm:text-[1.85rem]">
                {student.name}
              </h1>
              <p className="mt-1 text-[14px] font-medium text-slate-500">{student.cls}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-medium text-slate-600">
                  {student.id}
                </span>
                {student.gender && (
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      student.gender === "F"
                        ? "bg-[#F0FDFA] text-[#0F766E]"
                        : "bg-slate-900 text-white",
                    )}
                  >
                    {student.gender === "F" ? "Female" : student.gender === "M" ? "Male" : student.gender}
                  </span>
                )}
                <EnrollmentStatusBadge active={isActive} />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={openShare}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:border-[#99F6E4] hover:bg-[#F0FDFA] hover:text-[#0F766E]"
            >
              <ClipboardList className="h-4 w-4" />
              Collect
            </button>
            <button
              type="button"
              onClick={() => {
                resetDraft();
                setEditOpen(true);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#0F766E] px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#0D9488]"
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </button>
          </div>
        </div>
      </section>

      <ProfileDetailTabs tabs={STUDENT_PROFILE_TABS} value={activeTab} onValueChange={setActiveTab}>
        <ProfileTabPanel value="profile">
          <div className="grid grid-cols-1 gap-4 sm:gap-5">
            <ProfileDataTable
              title="Personal Information"
              description={`Core identity, contact, and personal details for ${student.name}.`}
              rows={[
                { label: "Guardian", value: student.guardian || EMPTY },
                {
                  label: "Contact Phone",
                  mono: true,
                  value: student.phone ? (
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span>{formatPhone(student.phone)}</span>
                      {phoneDigits.length > 0 && (
                        <span className="inline-flex flex-wrap items-center gap-1.5">
                          <a
                            href={`tel:${phoneDigits}`}
                            className="inline-flex items-center gap-1 rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition-colors hover:border-[#0F766E]/40 hover:bg-[#CCFBF1] hover:text-[#0F766E] dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-200"
                          >
                            <Phone className="h-3 w-3" /> Call
                          </a>
                          {waHref && (
                            <a
                              href={waHref}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1 rounded-full bg-[#10B981] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[#059669]"
                            >
                              <MessageCircle className="h-3 w-3" /> WhatsApp
                            </a>
                          )}
                        </span>
                      )}
                    </div>
                  ) : (
                    EMPTY
                  ),
                },
                { label: "Date of Birth", mono: true, value: student.dob || EMPTY },
                { label: "Email Address", mono: true, value: student.email || EMPTY },
                {
                  label: "Residential Mailing Address",
                  value: student.address ? (
                    <span className="whitespace-pre-line leading-snug text-black/85 dark:text-zinc-200">
                      {student.address}
                    </span>
                  ) : (
                    EMPTY
                  ),
                },
                { label: "Nationality", value: student.nationality || EMPTY },
                { label: "Religion", value: student.religion || EMPTY },
                { label: "Place of Birth", value: student.placeOfBirth || EMPTY },
                { label: "Blood Group", value: student.bloodGroup || EMPTY },
              ]}
            />

            <ProfileDataTable
              title="Family Details"
              description="Parent and guardian information on file."
              rows={[
                { label: "Mother Name", value: student.motherName || EMPTY },
                { label: "Father Occupation", value: student.fatherOccupation || EMPTY },
                { label: "If Guardian Is", value: student.guardianRelation || EMPTY },
                { label: "Guardian Occupation", value: student.guardianOccupation || EMPTY },
              ]}
            />
          </div>
        </ProfileTabPanel>

        <ProfileTabPanel value="professional">
          <div className="grid grid-cols-1 gap-4 sm:gap-5">
            <ProfileDataTable
              title="Academic Placement"
              description="Class assignment and school category details."
              rows={[
                {
                  label: "Admission Number",
                  mono: true,
                  value: student.admissionNumber || EMPTY,
                },
                {
                  label: "Class",
                  value: (
                    <span className="inline-flex rounded-full bg-[#CCFBF1] px-3 py-1.5 text-[12px] font-semibold text-black dark:bg-[#0F766E]/35 dark:text-[#5EEAD4]">
                      {student.cls}
                    </span>
                  ),
                },
                { label: "Student Category", value: student.studentCategory || EMPTY },
              ]}
            />

            <ProfileDataTable
              title="Transport"
              description="School bus requirement and pickup points."
              rows={
                [
                  {
                    label: "School Bus",
                    value: student.needsBus ? "Required" : "Not required",
                  },
                  ...(student.needsBus
                    ? [
                        {
                          label: "Bus Point 1",
                          value: student.busPoint1 || EMPTY,
                        },
                        {
                          label: "Bus Point 2",
                          value: student.busPoint2 || EMPTY,
                        },
                      ]
                    : [
                        {
                          label: "Route",
                          value: (
                            <span className="font-normal text-black/50 dark:text-zinc-400">
                              No transport route assigned for this student.
                            </span>
                          ),
                        },
                      ]),
                ] satisfies ProfileTableRow[]
              }
            />
          </div>
        </ProfileTabPanel>

        <ProfileTabPanel value="documents">
          <section className={CARD_FRAME}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-black">Identity Documents</h2>
                <p className="mt-1 text-[12.5px] text-black/50">
                  Government ID and supporting records for {student.name}. Attach PDF or image
                  scans directly here.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 dark:bg-zinc-900/70">
                <FileText className="h-4 w-4 text-black/45" />
                <div className="text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    On File
                  </div>
                  <div className="font-mono text-lg font-bold text-black">
                    {docsOnFile} / {docsTotal}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {documents.map((doc) => (
                <StudentDocumentCard
                  key={doc.id}
                  doc={doc}
                  onNumberChange={(number) => updateDocumentNumber(doc.id, number)}
                  onAttach={(levelId, files) => {
                    void attachFiles(doc.id, levelId, files);
                  }}
                  onRemoveAttachment={(attachmentId) => removeAttachment(doc.id, attachmentId)}
                />
              ))}
            </div>
          </section>
        </ProfileTabPanel>

        <ProfileTabPanel value="payments" className="space-y-4 sm:space-y-6">
          <section className={CARD_FRAME}>
            <h2 className="text-base font-semibold text-black">Fees Overview</h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FeeStatBox label="Total Due" value={inr(fees.totalDue)} />
              <FeeStatBox
                label="Total Paid"
                value={inr(fees.totalPaid)}
                valueClassName="text-[#10B981]"
              />
              <FeeBalanceBox balance={fees.balance} overdue={fees.overdue} />
            </div>
          </section>

          <section className={CARD_FRAME}>
            <FeesTable
              ledger={ledger}
              student={student}
              guardian={student.guardian}
              phone={student.phone ?? ""}
              schoolName={schoolName}
              academicYear={academicYear}
            />
          </section>

          <section className={CARD_FRAME}>
            <ReceiptsList
              receipts={receipts}
              student={student}
              guardian={student.guardian}
              phone={student.phone}
              schoolName={schoolName}
              academicYear={academicYear}
            />
          </section>
        </ProfileTabPanel>
      </ProfileDetailTabs>

      <ProfileAccountActions
        name={student.name}
        recordId={student.id}
        active={isActive}
        entityLabel="student"
        onToggleActive={toggleActive}
        onDelete={deleteStudent}
      />

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) resetDraft();
        }}
      >
        <DialogContent className="max-h-[min(90dvh,720px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Student Profile</DialogTitle>
            <DialogDescription>Update core details for {student.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <MetaField
                  label="Student Name"
                  value={draft.name}
                  editing
                  onChange={(v) => patchDraft("name", v)}
                  placeholder="Student full name"
                />
              </div>
              <div className="sm:col-span-2">
                <div className={META_LABEL}>Gender</div>
                <div className="mt-1.5 inline-flex items-center rounded-full border border-black/10 bg-white p-1">
                  {(["M", "F"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => patchDraft("gender", g)}
                      className={cn(
                        "min-h-8 rounded-full px-3 text-[11px] font-semibold transition-colors",
                        draft.gender === g
                          ? g === "F"
                            ? "bg-black text-[#0F766E]"
                            : "bg-[#0F766E] text-white"
                          : "text-black/55 hover:bg-black/5",
                      )}
                    >
                      {g === "M" ? "Male" : "Female"}
                    </button>
                  ))}
                </div>
              </div>
              <MetaField
                label="Guardian"
                value={draft.guardian}
                editing
                onChange={(v) => patchDraft("guardian", v)}
                placeholder="Guardian full name"
              />
              <MetaField
                label="Contact Phone"
                value={draft.phone}
                editing
                onChange={(v) => patchDraft("phone", v)}
                placeholder="9810045221"
                mono
              />
              <MetaField
                label="Date of Birth"
                value={draft.dob}
                editing
                onChange={(v) => patchDraft("dob", v)}
                placeholder="14 Mar 2012"
                date
              />
              <MetaField
                label="Email Address"
                value={draft.email}
                editing
                onChange={(v) => patchDraft("email", v)}
                placeholder="student@school.in"
                mono
              />
              <div>
                <div className={META_LABEL}>Class</div>
                <div className="mt-1.5">
                  <Select
                    value={draft.cls || undefined}
                    onValueChange={(cls) => patchDraft("cls", cls)}
                  >
                    <SelectTrigger className="h-9 w-full rounded-lg border-[#E5E5E5] bg-white text-[13px]">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      className="z-[250] rounded-lg border border-[#E5E5E5] bg-white"
                    >
                      {classOptions.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <MetaField
                label="Admission Number"
                value={draft.admissionNumber}
                editing
                onChange={(v) => patchDraft("admissionNumber", v)}
                placeholder="e.g. ADM-2841"
                mono
              />
              <div className="sm:col-span-2">
                <MetaField
                  label="Residential Mailing Address"
                  value={draft.address}
                  editing
                  onChange={(v) => patchDraft("address", v)}
                  placeholder="Full mailing address"
                  multiline
                />
              </div>
              <MetaField
                label="Mother Name"
                value={draft.motherName}
                editing
                onChange={(v) => patchDraft("motherName", v)}
                placeholder="e.g. Anita Verma"
              />
              <MetaField
                label="Father Occupation"
                value={draft.fatherOccupation}
                editing
                onChange={(v) => patchDraft("fatherOccupation", v)}
                placeholder="e.g. Engineer"
              />
              <div>
                <div className={META_LABEL}>If Guardian Is</div>
                <div className="mt-1.5 inline-flex w-full items-center rounded-full border border-black/10 bg-white p-1">
                  {GUARDIAN_RELATIONS.map((relation) => (
                    <button
                      key={relation}
                      type="button"
                      onClick={() => patchDraft("guardianRelation", relation)}
                      className={cn(
                        "min-h-8 flex-1 cursor-pointer rounded-full px-1 text-[11px] font-semibold transition-colors",
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
              <MetaField
                label="Guardian Occupation"
                value={draft.guardianOccupation}
                editing
                onChange={(v) => patchDraft("guardianOccupation", v)}
                placeholder="e.g. Teacher"
              />
              <MetaField
                label="Aadhaar"
                value={draft.aadhaar}
                editing
                onChange={(v) => patchDraft("aadhaar", v.replace(/\D/g, "").slice(0, 12))}
                placeholder="12-digit Aadhaar"
                mono
              />
              <MetaField
                label="Place of Birth"
                value={draft.placeOfBirth}
                editing
                onChange={(v) => patchDraft("placeOfBirth", v)}
                placeholder="e.g. Kozhikode"
              />
              <MetaField
                label="Nationality"
                value={draft.nationality}
                editing
                onChange={(v) => patchDraft("nationality", v)}
                placeholder="e.g. Indian"
              />
              <MetaSelect
                label="Religion"
                value={draft.religion}
                editing
                onChange={(v) => patchDraft("religion", v)}
                options={[...STUDENT_RELIGIONS]}
                placeholder="Select religion"
              />
              <MetaSelect
                label="Student Category"
                value={draft.studentCategory}
                editing
                onChange={(v) => patchDraft("studentCategory", v)}
                options={[...STUDENT_CATEGORIES]}
                placeholder="Select category"
              />
              <MetaSelect
                label="Blood Group"
                value={draft.bloodGroup}
                editing
                onChange={(v) => patchDraft("bloodGroup", v)}
                options={[...BLOOD_GROUPS]}
                placeholder="Select blood group"
              />
              <div className="sm:col-span-2">
                <div className={META_LABEL}>School Bus</div>
                <label className="mt-1.5 flex items-center gap-2.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2.5 text-[13px] font-medium text-black">
                  <Checkbox
                    checked={draft.needsBus}
                    onCheckedChange={(checked) => patchDraft("needsBus", checked === true)}
                  />
                  Requires school bus transport
                </label>
              </div>
              {draft.needsBus && (
                <>
                  <MetaField
                    label="Bus Point 1"
                    value={draft.busPoint1}
                    editing
                    onChange={(v) => patchDraft("busPoint1", v)}
                    placeholder="Pickup point"
                  />
                  <MetaField
                    label="Bus Point 2"
                    value={draft.busPoint2}
                    editing
                    onChange={(v) => patchDraft("busPoint2", v)}
                    placeholder="Drop point"
                  />
                </>
              )}
            </div>
            <DialogFooter className="flex-row justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeeStatBox({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-zinc-900/70">
      <div className={META_LABEL}>{label}</div>
      <div
        className={cn(
          "mt-2 font-mono text-xl font-semibold tracking-tight text-black dark:text-zinc-100",
          valueClassName,
        )}
      >
        {value}
      </div>
    </div>
  );
}

function FeeBalanceBox({ balance, overdue }: { balance: number; overdue: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg p-4",
        overdue ? "bg-[#0F766E]" : "bg-slate-50 dark:bg-zinc-900/70",
      )}
    >
      <div
        className={cn(
          "flex items-start justify-between",
          overdue ? "text-white/75" : "text-black/55 dark:text-zinc-400",
        )}
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider">Current Balance</div>
        {overdue ? (
          <AlertTriangle className="h-4 w-4 text-[#EF4444]" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-black" />
        )}
      </div>
      <div
        className={cn(
          "mt-2 font-mono text-xl font-semibold tracking-tight",
          overdue ? "text-white" : "text-black",
        )}
      >
        {inr(balance)}
      </div>
      <span
        className={cn(
          "mt-2 inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
          overdue ? "bg-[#0F172A] text-[#EF4444]" : "bg-[#0F172A] text-[#10B981]",
        )}
      >
        {overdue ? "[ OVERDUE ]" : "[ CLEARED ]"}
      </span>
    </div>
  );
}

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function MetaSelect({
  label,
  value,
  editing,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div>
      <div className={META_LABEL}>{label}</div>
      <div className="mt-1.5">
        {editing ? (
          <Select value={value || undefined} onValueChange={onChange}>
            <SelectTrigger className="h-9 w-full rounded-lg border-[#E5E5E5] bg-white text-[13px]">
              <SelectValue placeholder={placeholder ?? "Select…"} />
            </SelectTrigger>
            <SelectContent
              position="popper"
              className="z-[250] rounded-lg border border-[#E5E5E5] bg-white"
            >
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="text-[14px] font-medium text-black">{value?.trim() ? value : "—"}</div>
        )}
      </div>
    </div>
  );
}

function MetaField({
  label,
  value,
  editing,
  onChange,
  placeholder,
  mono,
  multiline,
  date,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  multiline?: boolean;
  date?: boolean;
}) {
  return (
    <div>
      <div className={META_LABEL}>{label}</div>
      <div className="mt-1.5">
        {editing ? (
          date ? (
            <DatePicker
              value={value}
              onChange={onChange}
              placeholder={placeholder ?? "Pick a date"}
              valueFormat="display"
              variant="pill"
              quickPicks={[]}
              min="1990-01-01"
              max={todayISO()}
              className="h-9 bg-white"
            />
          ) : multiline ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="min-h-[72px] w-full resize-y rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-[13px] text-black shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={cn("h-9 bg-white text-[13px]", mono && "font-mono")}
            />
          )
        ) : (
          <div
            className={cn(
              "text-[14px] font-medium",
              mono && "font-mono",
              multiline ? "whitespace-pre-line leading-snug text-black/85 dark:text-zinc-200" : "text-black dark:text-zinc-100",
            )}
          >
            {value || <span className="font-normal text-black/40 dark:text-zinc-500">—</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function buildOverdueWhatsAppHref({
  phone,
  guardian,
  studentName,
  studentId,
  schoolName,
  academicYear,
  row,
}: {
  phone: string;
  guardian: string;
  studentName: string;
  studentId: string;
  schoolName: string;
  academicYear: string;
  row: LedgerRow;
}) {
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const to = `${digits.length === 10 ? "91" : ""}${digits}`;
  const greetingName = guardian.trim() || "Parent/Guardian";
  const message = [
    `Dear ${greetingName},`,
    "",
    `This is a reminder from ${schoolName} regarding an overdue fee for ${studentName} (${studentId}).`,
    "",
    `Fee: ${row.desc}`,
    `Due Date: ${row.due}`,
    `Charge: ${inr(row.charge)}`,
    `Paid: ${inr(row.paid)}`,
    `Balance Due: ${inr(row.balance)}`,
    `Academic Year: ${academicYear}`,
    "",
    "Please clear the outstanding amount at your earliest convenience.",
    "",
    "Thank you.",
  ].join("\n");
  return `https://wa.me/${to}?text=${encodeURIComponent(message)}`;
}

function OverdueWhatsAppButton({ href, compact }: { href: string | null; compact?: boolean }) {
  if (!href) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toast.error("No contact phone on file", {
            description: "Add a guardian phone number to send WhatsApp reminders.",
          });
        }}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-[#25D366]/35 bg-[#25D366]/10 font-semibold text-[#128C7E] transition-colors hover:bg-[#25D366]/18",
          compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1 text-[11px]",
        )}
      >
        <MessageCircle className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        WhatsApp
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[#25D366]/35 bg-[#25D366]/10 font-semibold text-[#128C7E] transition-colors hover:bg-[#25D366]/18",
        compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1 text-[11px]",
      )}
    >
      <MessageCircle className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      WhatsApp
    </a>
  );
}

function FeesTable({
  ledger,
  student,
  guardian,
  phone,
  schoolName,
  academicYear,
}: {
  ledger: LedgerRow[];
  student: Student;
  guardian: string;
  phone: string;
  schoolName: string;
  academicYear: string;
}) {
  const [selectedRow, setSelectedRow] = useState<LedgerRow | null>(null);
  const paidPct =
    selectedRow && selectedRow.charge > 0
      ? Math.round((selectedRow.paid / selectedRow.charge) * 100)
      : 0;

  const overdueHref = (row: LedgerRow) =>
    buildOverdueWhatsAppHref({
      phone,
      guardian,
      studentName: student.name,
      studentId: student.id,
      schoolName,
      academicYear,
      row,
    });

  return (
    <>
      <div>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-black">Fees Details</h2>
            <div className="mt-1 text-[12px] text-black/55">
              Statement ledger sheet · {ledger.length} line items on file
            </div>
          </div>
          <span className="rounded-full border border-[#E5E5E5] bg-[#F4F4F5] px-2.5 py-1 font-mono text-[10.5px] font-medium text-black/65">
            AY {academicYear}
          </span>
        </div>

        {ledger.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E5E5E5] bg-[#FAFAFA] px-4 py-10 text-center">
            <p className="text-[13px] font-medium text-black/70">No fee lines for this year</p>
            <p className="mt-1 text-[12px] text-black/45">
              Charges appear from class tier fees and student receipts posted in {academicYear}.
            </p>
          </div>
        ) : (
          <>
        <div className="space-y-2.5 md:hidden">
          {ledger.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedRow(r)}
              aria-label={`View details for ${r.desc}`}
              className="w-full rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] p-3.5 text-left transition-colors hover:border-black/15 hover:bg-[#F4F4F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold text-black">{r.desc}</div>
                  <div className="mt-1 font-mono text-[11px] text-black/45">{r.date}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StatusBadge status={r.status} />
                  {r.status === "Overdue" && (
                    <OverdueWhatsAppButton href={overdueHref(r)} compact />
                  )}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    Due Date
                  </div>
                  <div className="mt-0.5 font-mono text-[12px] text-black/70">{r.due}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    Charge
                  </div>
                  <div className="mt-0.5 font-mono text-[12px] text-black">{inr(r.charge)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    Paid
                  </div>
                  <div className="mt-0.5 font-mono text-[12px] font-medium text-black">
                    {inr(r.paid)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    Balance
                  </div>
                  <div
                    className={`mt-0.5 font-mono text-[12px] ${
                      r.balance === 0 ? "text-black/40" : "font-semibold text-black"
                    }`}
                  >
                    {inr(r.balance)}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr>
                <th className="border-b border-[#E5E5E5] pb-4 pl-1 pr-4 text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  Date
                </th>
                <th className="border-b border-[#E5E5E5] px-4 pb-4 text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  Description
                </th>
                <th className="border-b border-[#E5E5E5] px-4 pb-4 text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  Due Date
                </th>
                <th className="border-b border-[#E5E5E5] px-4 pb-4 text-right text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  Charge Amount
                </th>
                <th className="border-b border-[#E5E5E5] px-4 pb-4 text-right text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  Paid Amount
                </th>
                <th className="border-b border-[#E5E5E5] px-4 pb-4 text-right text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  Balance
                </th>
                <th className="border-b border-[#E5E5E5] pb-4 pl-4 pr-1 text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((r, i) => (
                <tr
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedRow(r)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedRow(r);
                    }
                  }}
                  aria-label={`View details for ${r.desc}`}
                  className="cursor-pointer border-b border-[#F0F0F0] transition-colors last:border-b-0 hover:bg-[#F4F4F5] focus-visible:bg-[#F4F4F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F766E]"
                >
                  <td className="py-4 pl-1 pr-4 font-mono text-[13px] text-black/55">{r.date}</td>
                  <td className="px-4 py-4 text-[13px] font-medium text-black">{r.desc}</td>
                  <td className="px-4 py-4 font-mono text-[13px] text-black/55">{r.due}</td>
                  <td className="px-4 py-4 text-right font-mono text-[13px] text-black/75">
                    {inr(r.charge)}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-[13px] font-medium text-black">
                    {inr(r.paid)}
                  </td>
                  <td
                    className={`px-4 py-4 text-right font-mono text-[13px] ${
                      r.balance === 0 ? "text-black/40" : "text-black"
                    }`}
                  >
                    {inr(r.balance)}
                  </td>
                  <td className="py-4 pl-4 pr-1">
                    <div className="flex flex-col items-start gap-1.5">
                      <StatusBadge status={r.status} />
                      {r.status === "Overdue" && (
                        <OverdueWhatsAppButton href={overdueHref(r)} compact />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          </>
        )}
      </div>

      <Dialog open={Boolean(selectedRow)} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent className="max-w-md rounded-xl border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[24px] font-semibold text-black">
              Fee Line Detail
            </DialogTitle>
            <DialogDescription className="text-[13px] text-black/55">
              Full statement entry for the selected ledger row.
            </DialogDescription>
          </DialogHeader>

          {selectedRow && (
            <div className="mt-2 space-y-3">
              <div className="rounded-lg bg-[#F4F4F5] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-black/50">
                  Description
                </div>
                <div className="mt-1 text-[18px] font-semibold text-black">{selectedRow.desc}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={selectedRow.status} />
                  {selectedRow.status === "Overdue" && (
                    <OverdueWhatsAppButton href={overdueHref(selectedRow)} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <DetailField label="Posted Date" value={selectedRow.date} mono />
                <DetailField label="Due Date" value={selectedRow.due} mono />
                <DetailField label="Charge Amount" value={inr(selectedRow.charge)} mono />
                <DetailField label="Paid Amount" value={inr(selectedRow.paid)} mono />
                <DetailField label="Balance Due" value={inr(selectedRow.balance)} mono />
                <DetailField label="Collection" value={`${paidPct}% collected`} />
              </div>

              <div className="rounded-lg border border-[#E5E5E5] p-3">
                <div className="flex items-center justify-between text-[11px] text-black/55">
                  <span>Payment progress</span>
                  <span className="font-mono text-black">{paidPct}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F4F4F5]">
                  <div
                    className="h-full rounded-full bg-[#0F766E] transition-all"
                    style={{ width: `${paidPct}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-[#E5E5E5] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
        {label}
      </div>
      <div className={cn("mt-1 text-[12px] text-black", mono && "font-mono")}>{value}</div>
    </div>
  );
}

function ReceiptsList({
  receipts,
  student,
  guardian,
  phone,
  schoolName,
  academicYear,
}: {
  receipts: Receipt[];
  student: Student;
  guardian: string;
  phone?: string;
  schoolName: string;
  academicYear: string;
}) {
  const { schoolDetails } = useTenantStore();
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleDownload = (r: Receipt) => {
    try {
      downloadReceiptPdf(
        {
          id: r.id,
          name: student.name,
          cat: r.cat ? `${r.cat}${r.period ? ` · ${r.period}` : ""}` : `Fee Payment · ${student.cls}`,
          mode: r.mode,
          amount: r.amount,
          time: r.date,
        },
        schoolName,
        academicYear,
        {
          letterheadUrl: schoolDetails.letterheadUrl,
          address: schoolDetails.address,
          phone: schoolDetails.phone,
          email: schoolDetails.email,
        },
      );
      toast.success(`Receipt ${r.id} downloaded`, {
        description: `PDF saved · ${inr(r.amount)}`,
      });
    } catch {
      toast.error(`Could not download receipt ${r.id}`, {
        description: "Try again or check your browser download settings",
      });
    }
  };

  const handleSend = async (r: Receipt) => {
    const number = toNotifyWhatsAppNumber(phone);
    if (!number) {
      toast.error("No guardian phone on file", {
        description: "Add a contact phone to send this receipt on WhatsApp.",
      });
      return;
    }

    const greeting = guardian.trim() ? `Dear ${guardian.trim()},` : "Dear Parent,";
    const message = [
      greeting,
      "",
      `Please find the fee receipt for ${student.name} (${student.id}).`,
      "",
      `${schoolName} · Fee Receipt`,
      `Receipt: ${r.id}`,
      `Student: ${student.name} · ${student.cls}`,
      `Mode: ${r.mode}`,
      `Amount: ${inr(r.amount)}`,
      `Date: ${r.date}`,
      `AY: ${academicYear}`,
      "Status: Complete",
      "",
      "Thank you.",
    ].join("\n");

    setSendingId(r.id);
    try {
      const result = await sendWhatsAppNotify({ numbers: [number], message });
      if (!result.ok) {
        toast.error(`Could not send receipt ${r.id}`, {
          description: result.body.slice(0, 180) || `HTTP ${result.status}`,
        });
        return;
      }
      toast.success(`Receipt ${r.id} sent`, {
        description: `WhatsApp · ${phone}`,
      });
    } catch (err) {
      toast.error(`Could not send receipt ${r.id}`, {
        description: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-black">Receipts</h2>
          <div className="mt-1 text-[12px] text-black/55">
            {receipts.length === 0
              ? `No receipts posted for ${academicYear}`
              : `${receipts.length} digital receipt${receipts.length === 1 ? "" : "s"} · ${academicYear}`}
          </div>
        </div>
        {receipts.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#0F766E] px-2.5 py-1 text-[10.5px] font-semibold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-black" />
            On file
          </span>
        )}
      </div>
      {receipts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E5E5E5] bg-[#FAFAFA] px-4 py-10 text-center">
          <p className="text-[13px] font-medium text-black/70">No receipts yet</p>
          <p className="mt-1 text-[12px] text-black/45">
            Post a payment under Finance → Receive Payment to attach receipts to this student.
          </p>
        </div>
      ) : (
      <ul className="divide-y divide-[#F0F0F0]">
        {receipts.map((r) => {
          const isSending = sendingId === r.id;
          return (
            <li
              key={r.id}
              className="-mx-2 flex items-center gap-3 rounded-lg px-3 py-3.5 transition-colors hover:bg-[#F4F4F5] sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[13px] font-semibold text-black">{r.id}</span>
                  <span className="rounded-full bg-[#F4F4F5] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-black/65">
                    {r.mode}
                  </span>
                  {r.cat ? (
                    <span className="truncate text-[11px] text-black/45">{r.cat}</span>
                  ) : null}
                </div>
                <div className="mt-1 font-mono text-[11px] text-black/55">
                  {r.date}
                  {r.period ? ` · ${r.period}` : ""}
                </div>
              </div>
              <div className="shrink-0 font-mono text-base font-semibold text-black">
                {inr(r.amount)}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void handleSend(r)}
                  disabled={isSending || sendingId !== null}
                  aria-label={`Send receipt ${r.id}`}
                  title="Send receipt"
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#25D366]/40 bg-[#25D366]/10 px-2.5 text-[11px] font-semibold text-[#128C7E] shadow-sm transition-colors hover:bg-[#25D366]/18 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3"
                >
                  {isSending ? (
                    <span className="font-mono text-[10px]">…</span>
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{isSending ? "Sending" : "Send"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(r)}
                  aria-label={`Download receipt ${r.id}`}
                  title="Download receipt"
                  className="grid h-10 w-10 place-items-center rounded-lg border border-[#E5E5E5] bg-white text-black/55 shadow-sm transition-colors hover:bg-[#0F766E] hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      )}
    </div>
  );
}

const STATUS_STYLE: Record<LedgerStatus, { wrap: string; dot: string }> = {
  Paid: {
    wrap: "bg-[#F4F4F5] text-black",
    dot: "bg-black",
  },
  "Partially Paid": {
    wrap: "bg-[#CCFBF1] text-black",
    dot: "bg-black",
  },
  Overdue: {
    wrap: "bg-[#0F766E] text-white",
    dot: "bg-black",
  },
};

function StatusBadge({ status }: { status: LedgerStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${s.wrap}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function StudentDocumentCard({
  doc,
  onNumberChange,
  onAttach,
  onRemoveAttachment,
}: {
  doc: StaffDocument;
  onNumberChange: (number: string) => void;
  onAttach: (levelId: string, files: FileList | null) => void;
  onRemoveAttachment: (attachmentId: string) => void;
}) {
  const isOther = doc.id === "doc-other";
  const complete = isDocumentComplete(doc);
  const levels = useMemo(() => {
    if (doc.levels?.length) return doc.levels;
    if (isOther) return [{ id: "files", label: "Files" }];
    return [
      { id: "front", label: "Front" },
      { id: "back", label: "Back" },
    ];
  }, [doc.levels, isOther]);
  const showLevelTabs = !isOther && levels.length > 1;
  const [activeLevelId, setActiveLevelId] = useState(() => levels[0]?.id ?? "front");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!levels.some((l) => l.id === activeLevelId)) {
      setActiveLevelId(levels[0]?.id ?? "front");
    }
  }, [levels, activeLevelId]);

  const levelFiles = showLevelTabs
    ? doc.attachments.filter((a) => a.levelId === activeLevelId)
    : doc.attachments;
  const activeLevel = levels.find((l) => l.id === activeLevelId) ?? levels[0];
  const attachLevelId = showLevelTabs ? activeLevelId : (levels[0]?.id ?? "files");

  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-white/10 dark:bg-zinc-900/70">
      <div className="flex items-start justify-between gap-2">
        <div className={META_LABEL}>{doc.label}</div>
        <span
          className={cn(
            "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            complete
              ? "bg-[#CCFBF1] text-black dark:bg-[#0F766E]/35 dark:text-[#5EEAD4]"
              : "bg-slate-200/80 font-medium text-black/50 dark:bg-white/10 dark:text-zinc-400",
          )}
        >
          {complete ? "On file" : "Not provided"}
        </span>
      </div>

      {!isOther && (
        <Input
          value={doc.number}
          onChange={(e) => onNumberChange(e.target.value)}
          placeholder="XXXX XXXX XXXX"
          className="mt-1.5 h-10 border-slate-200 bg-white font-mono text-[13px] dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
        />
      )}

      {isOther && (
        <p className="mt-1.5 text-[12px] leading-snug text-black/50 dark:text-zinc-400">
          Birth certificate, transfer certificate, photos, or other supporting files.
        </p>
      )}

      <div className={cn("border-t border-slate-200/80 pt-4 dark:border-white/10", isOther ? "mt-3" : "mt-4")}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-400">
            <Paperclip className="h-3.5 w-3.5" />
            {showLevelTabs ? "Attachments" : "Files"}
          </div>
          <span className="font-mono text-[10px] text-black/45 dark:text-zinc-500">
            {doc.attachments.length} / {MAX_FILES_PER_DOC}
          </span>
        </div>

        {showLevelTabs && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {levels.map((level) => {
              const count = doc.attachments.filter((a) => a.levelId === level.id).length;
              const active = level.id === activeLevelId;
              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setActiveLevelId(level.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    active
                      ? "bg-[#0F766E] text-white dark:bg-[#14B8A6]"
                      : "bg-white text-black/65 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-white/15 dark:hover:bg-white/10",
                  )}
                >
                  {level.label}
                  <span
                    className={cn(
                      "font-mono text-[10px]",
                      active ? "text-white/70" : "text-black/40 dark:text-zinc-500",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950/80">
          {showLevelTabs && (
            <div className="mb-2 text-[11px] font-semibold text-black/55 dark:text-zinc-400">
              {activeLevel?.label ?? "Side"} scan
            </div>
          )}
          {levelFiles.length > 0 ? (
            <ul className="space-y-1.5">
              {levelFiles.map((file) => (
                <li
                  key={file.id}
                  className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2 dark:border-white/10 dark:bg-zinc-900/80"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-black/40 dark:text-zinc-500" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-medium text-black dark:text-zinc-100">{file.name}</div>
                    <div className="font-mono text-[10px] text-black/45 dark:text-zinc-500">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                  <a
                    href={file.dataUrl}
                    download={file.name}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-black/60 transition-colors hover:bg-white dark:border-white/15 dark:text-zinc-400 dark:hover:bg-white/10"
                    aria-label={`Open ${file.name}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(file.id)}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-950/50"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-black/45 dark:text-zinc-500">
              {showLevelTabs
                ? `No ${activeLevel?.label?.toLowerCase() ?? ""} file yet.`
                : "No files attached yet."}
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              onAttach(attachLevelId, e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={doc.attachments.length >= MAX_FILES_PER_DOC}
            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white text-[12px] font-medium text-black/70 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/20 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white/35 dark:hover:bg-white/5"
          >
            <Upload className="h-3.5 w-3.5" />
            {showLevelTabs ? `Attach ${activeLevel?.label ?? "file"}` : "Add files"}
          </button>
        </div>

        <p className="mt-1.5 text-[10px] text-black/40 dark:text-zinc-500">
          PDF or images · up to {formatFileSize(MAX_FILE_BYTES)} each
          {showLevelTabs ? " · Front and Back" : ""}
        </p>
      </div>
    </div>
  );
}
