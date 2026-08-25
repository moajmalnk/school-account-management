import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Pencil,
  Camera,
  X,
  FileText,
  Paperclip,
  Upload,
  ExternalLink,
  Wallet,
  CalendarDays,
  Plus,
  Download,
  CheckCircle2,
  AlertTriangle,
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
import { MonthPicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { ImageCropDialog } from "@/components/ui/image-crop-dialog";
import type { Staff, StaffDocument, StaffDocumentAttachment, TenantUser } from "@/lib/tenant-store";
import { apiDeleteStaff, apiUpsertStaff } from "@/lib/api/records";
import {
  DEFAULT_STAFF_DOCUMENTS,
  normalizeTenantUser,
  useTenantStore,
  currentPayrollMonth,
  formatPayrollMonthLabel,
  staffPayableSalary,
  staffGrossSalary,
  upsertStaffAttendanceMonth,
  normalizeStaffAttendanceMonth,
  salaryHistoryPayrollMonth,
  salaryPaidAmountForMonth,
  isSalaryMonthSettled,
  type StaffSalaryHistoryEntry,
} from "@/lib/tenant-store";
import { sessionHasPermission, useAuth } from "@/lib/auth";
import {
  ALL_PERMISSIONS,
  FINANCE_ONLY_PRESET,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  hasFullAccess,
  summarizePermissions,
  type PermissionKey,
  type PermissionSet,
} from "@/lib/permissions";
import { Checkbox } from "@/components/ui/checkbox";
import { isRecordActive, ProfileAccountActions } from "@/components/school/ProfileAccountActions";
import {
  ProfileDetailTabs,
  ProfileTabPanel,
  STAFF_PROFILE_TABS,
  isStaffProfileTab,
  type ProfileDetailTabId,
  type StaffProfileTabId,
} from "@/components/school/ProfileDetailTabs";
import { formatEventDateTime, formatInAppZone } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { buildStaffPayrollStatement } from "@/lib/staff-payroll";
import { downloadStaffPayrollReportPdf, receiptBrandingFromSchool } from "@/lib/finance-export";

const CARD_FRAME =
  "rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#171717] dark:text-zinc-100 dark:shadow-black/40";
const META_LABEL =
  "text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-400";
const MAX_FILE_BYTES = 1_500_000;
const MAX_FILES_PER_DOC = 8;

function StaffPhotoAvatar({
  staff,
  onPhotoChange,
  size = "md",
}: {
  staff: Staff;
  onPhotoChange: (photoUrl: string | undefined) => void | Promise<void>;
  size?: "md" | "lg";
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const dim = size === "lg" ? "h-20 w-20 sm:h-24 sm:w-24" : "h-16 w-16";
  const text = size === "lg" ? "text-2xl sm:text-3xl" : "text-lg";
  const cam = size === "lg" ? "h-8 w-8" : "h-7 w-7";
  const camIcon = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";

  // Drop local blob preview once the store has a persisted server URL.
  useEffect(() => {
    if (
      localPreview &&
      staff.photoUrl &&
      !staff.photoUrl.startsWith("data:") &&
      staff.photoUrl !== localPreview
    ) {
      setLocalPreview(undefined);
    }
  }, [staff.photoUrl, localPreview]);

  const displayUrl = localPreview ?? staff.photoUrl;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const applyCrop = (dataUrl: string) => {
    setCropSrc(null);
    setLocalPreview(dataUrl);
    setUploading(true);
    void Promise.resolve(onPhotoChange(dataUrl)).finally(() => setUploading(false));
  };

  return (
    <>
      <div className={cn("relative shrink-0", dim)}>
        <ProfileAvatar
          name={staff.name}
          photoUrl={displayUrl}
          alt=""
          busy={uploading}
          className={cn(dim, "rounded-2xl shadow-md ring-2 ring-white")}
          imgClassName="object-cover"
          initialsClassName={cn(
            "bg-gradient-to-br from-slate-900 to-slate-700",
            text,
          )}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label={`Change photo for ${staff.name}`}
          title="Change photo"
          className={cn(
            "absolute -bottom-1 -right-1 grid place-items-center rounded-full border-2 border-white bg-[#0F766E] text-white shadow-sm transition-colors hover:bg-slate-900 disabled:opacity-60",
            cam,
          )}
        >
          <Camera className={camIcon} />
        </button>
        {(displayUrl || staff.photoUrl) && !uploading && (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            aria-label={`Remove photo for ${staff.name}`}
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
        onConfirm={applyCrop}
        onRetake={() => fileInputRef.current?.click()}
      />

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent className="max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">Remove photo</DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60 dark:text-zinc-400">
              Remove {staff.name}&apos;s profile photo? You can upload a new one anytime.
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
                setLocalPreview(undefined);
                void onPhotoChange(undefined);
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

function formatJoinedAt(iso: string) {
  return formatStatusDateTime(iso.includes("T") ? iso : `${iso}T09:30:00`);
}

function formatStatusDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return formatInAppZone(d, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function statusEventLabel(type: "joined" | "deactivated" | "reactivated") {
  if (type === "joined") return "Joined";
  if (type === "deactivated") return "Deactivated";
  return "Reactivated";
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
}: {
  staff: Staff;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const search = useSearch({ from: "/tenant/staff" });
  const { session } = useAuth();
  const { setStaff, departments, roles, tenantUsers, setTenantUsers, schoolDetails } =
    useTenantStore();
  const schoolName = schoolDetails.name || session?.tenantName || "School";

  const syncStaff = async (updated: Staff) => {
    setStaff((prev) => prev.map((s) => (s.id === staff.id ? updated : s)));
    try {
      const saved = await apiUpsertStaff(updated);
      const merged = { ...updated, ...saved };
      setStaff((prev) =>
        prev.map((s) => (s.id === staff.id || s.id === saved.id ? merged : s)),
      );
      return merged;
    } catch (err) {
      toast.error("Could not save staff to server", {
        description: err instanceof Error ? err.message : "Save failed",
      });
      throw err;
    }
  };

  const canManageUsers = sessionHasPermission(session, "settings.users");
  const linkedUser = useMemo(
    () => tenantUsers.find((u) => u.staffId === staff.id) ?? null,
    [tenantUsers, staff.id],
  );
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingRemoveLogin, setPendingRemoveLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    active: true,
    allFunctions: false,
    permissions: [] as PermissionKey[],
  });

  const openLoginDialog = () => {
    const matchedRole = roles.find((r) => r.title === staff.role);
    if (linkedUser) {
      const all = hasFullAccess(linkedUser.permissions);
      setLoginForm({
        email: linkedUser.email,
        password: linkedUser.password,
        active: linkedUser.active,
        allFunctions: all,
        permissions: all ? [] : ([...linkedUser.permissions] as PermissionKey[]),
      });
    } else {
      setLoginForm({
        email: "",
        password: "",
        active: true,
        allFunctions: false,
        permissions: [...FINANCE_ONLY_PRESET],
      });
    }
    void matchedRole;
    setLoginOpen(true);
  };

  const saveStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password;
    if (!email.includes("@")) {
      toast.error("Valid email is required");
      return;
    }
    if (password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    const permissions: PermissionSet = loginForm.allFunctions
      ? ALL_PERMISSIONS
      : loginForm.permissions;
    if (!loginForm.allFunctions && loginForm.permissions.length === 0) {
      toast.error("Assign at least one permission");
      return;
    }
    const emailTaken = tenantUsers.some(
      (u) => u.email === email && u.staffId !== staff.id,
    );
    if (emailTaken) {
      toast.error("Email already used by another user");
      return;
    }
    const matchedRole = roles.find((r) => r.title === staff.role);
    if (linkedUser) {
      setTenantUsers((prev) =>
        prev.map((u) =>
          u.id === linkedUser.id
            ? normalizeTenantUser({
                ...u,
                email,
                password,
                displayName: staff.name,
                roleId: matchedRole?.id,
                staffId: staff.id,
                permissions,
                active: loginForm.active,
              })
            : u,
        ),
      );
      toast.success("Workspace login updated", { description: email });
    } else {
      const next: TenantUser = normalizeTenantUser({
        id: `USR-${Date.now().toString().slice(-6)}`,
        email,
        password,
        displayName: staff.name,
        roleId: matchedRole?.id,
        staffId: staff.id,
        permissions,
        active: loginForm.active,
        createdAt: new Date().toISOString(),
      });
      setTenantUsers((prev) => [next, ...prev]);
      toast.success("Workspace login enabled", {
        description: `${email} · sign in under School Admin tier`,
      });
    }
    setLoginOpen(false);
  };

  const removeStaffLogin = () => {
    if (!linkedUser) return;
    setTenantUsers((prev) => prev.filter((u) => u.id !== linkedUser.id));
    toast.error("Workspace login removed", { description: staff.name });
    setPendingRemoveLogin(false);
  };
  const activeTab: StaffProfileTabId = isStaffProfileTab(search.tab) ? search.tab : "profile";
  const setActiveTab = (tab: ProfileDetailTabId) => {
    if (!isStaffProfileTab(tab)) return;
    navigate({
      to: "/tenant/staff",
      search: {
        id: staff.id,
        ...(tab !== "profile" ? { tab } : {}),
      },
      replace: true,
    });
  };
  useEffect(() => {
    const needsNormalize =
      !staff.documents?.length ||
      !Array.isArray(staff.salaryHistory) ||
      !Array.isArray(staff.statusHistory) ||
      staff.documents.some((d) => !Array.isArray(d.attachments) || !Array.isArray(d.levels)) ||
      DEFAULT_STAFF_DOCUMENTS.some((def) => !staff.documents?.some((d) => d.id === def.id));
    if (!needsNormalize) return;
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staff.id
          ? {
              ...s,
              salaryHistory: Array.isArray(s.salaryHistory) ? s.salaryHistory : [],
              statusHistory: Array.isArray(s.statusHistory)
                ? s.statusHistory
                : [
                    {
                      id: `EVT-${s.id}-joined`,
                      type: "joined" as const,
                      at: `${s.joinedAt.includes("T") ? s.joinedAt : `${s.joinedAt}T09:30:00.000Z`}`,
                      note: "Joined the school roster",
                    },
                  ],
              documents: DEFAULT_STAFF_DOCUMENTS.map((def) => {
                const existing = s.documents?.find((d) => d.id === def.id);
                const levels = existing?.levels?.length
                  ? existing.levels
                  : def.levels.map((l) => ({ ...l }));
                return {
                  ...def,
                  number: existing?.number ?? "",
                  levels,
                  attachments: (existing?.attachments ?? []).map((a) => ({
                    ...a,
                    levelId: a.levelId || (def.id === "doc-other" ? "files" : "front"),
                  })),
                };
              }),
            }
          : s,
      ),
    );
  }, [staff.documents, staff.salaryHistory, staff.statusHistory, staff.id, setStaff]);

  const documents = useMemo(() => {
    const byId = new Map(
      (staff.documents?.length ? staff.documents : DEFAULT_STAFF_DOCUMENTS).map((d) => [d.id, d]),
    );
    return DEFAULT_STAFF_DOCUMENTS.map((def) => {
      const existing = byId.get(def.id);
      const attachments = (existing?.attachments ?? []).map((a) => ({
        ...a,
        levelId: a.levelId || (def.id === "doc-other" ? "files" : "front"),
      }));
      const levels = (() => {
        const base = def.levels.map((l) => ({ ...l }));
        const levelIds = new Set(base.map((l) => l.id));
        const existingLevels = existing?.levels ?? [];
        for (const file of attachments) {
          if (levelIds.has(file.levelId)) continue;
          const known = existingLevels.find((l) => l.id === file.levelId);
          base.push(
            known ?? {
              id: file.levelId,
              label:
                file.levelId === "other"
                  ? "Other"
                  : file.levelId === "files"
                    ? "Files"
                    : file.levelId,
            },
          );
          levelIds.add(file.levelId);
        }
        return base;
      })();
      return {
        ...def,
        number: existing?.number ?? "",
        levels,
        attachments,
      };
    });
  }, [staff.documents]);

  const salaryHistory = useMemo(
    () =>
      [...(staff.salaryHistory ?? [])].sort((a, b) =>
        String(b.paidAt).localeCompare(String(a.paidAt)),
      ),
    [staff.salaryHistory],
  );

  const statusHistory = useMemo(
    () => [...(staff.statusHistory ?? [])].sort((a, b) => String(b.at).localeCompare(String(a.at))),
    [staff.statusHistory],
  );

  const totalSalary = useMemo(
    () => staff.basicSalary + staff.additionalAllowances,
    [staff.basicSalary, staff.additionalAllowances],
  );
  const payrollMonth = currentPayrollMonth();
  const payrollStatement = useMemo(
    () => buildStaffPayrollStatement(staff, payrollMonth),
    [staff, payrollMonth],
  );
  const attendancePay = useMemo(
    () => staffPayableSalary(staff, payrollMonth),
    [staff, payrollMonth],
  );
  const attendanceHistory = useMemo(
    () =>
      [...(staff.attendanceByMonth ?? [])].sort((a, b) => b.month.localeCompare(a.month)),
    [staff.attendanceByMonth],
  );

  const lastSalaryPayment = salaryHistory[0] ?? null;

  const handleDownloadPayrollReport = async () => {
    try {
      await downloadStaffPayrollReportPdf({
        staff,
        schoolName,
        payrollMonth,
        payrollMonthLabel: formatPayrollMonthLabel(payrollMonth),
        statement: payrollStatement,
        branding: receiptBrandingFromSchool(schoolDetails),
      });
      toast.success("Payroll report downloaded", {
        description: "PDF ready to share with the employee",
      });
    } catch (err) {
      toast.error("Could not generate payroll report", {
        description: err instanceof Error ? err.message : "Download failed",
      });
    }
  };

  const monthlyPayrollLedger = payrollStatement.ledger;
  const currentMonthSettled = payrollStatement.currentMonthSettled;
  const currentMonthOutstanding = payrollStatement.currentMonthDue;

  const [attendanceForm, setAttendanceForm] = useState({
    month: payrollMonth,
    daysPresent: "",
    workingDays: "24",
    paidLeaveDays: "",
    unpaidLeaveDays: "",
  });
  const [pendingDeleteMonth, setPendingDeleteMonth] = useState<string | null>(null);

  useEffect(() => {
    const existing = (staff.attendanceByMonth ?? []).find(
      (row) => row.month === attendanceForm.month,
    );
    setAttendanceForm((prev) => ({
      ...prev,
      daysPresent: existing ? String(existing.daysPresent) : "",
      workingDays: existing ? String(existing.workingDays) : prev.workingDays || "24",
      paidLeaveDays: existing ? String(existing.paidLeaveDays || 0) : "",
      unpaidLeaveDays: existing ? String(existing.unpaidLeaveDays || 0) : "",
    }));
    // Sync fields when month or staff changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceForm.month, staff.id, staff.attendanceByMonth]);

  const saveAttendanceMonth = (e: React.FormEvent) => {
    e.preventDefault();
    const working = Number(attendanceForm.workingDays);
    const present = Number(attendanceForm.daysPresent);
    const paidLeave = Number(attendanceForm.paidLeaveDays || 0);
    const unpaidLeave = Number(attendanceForm.unpaidLeaveDays || 0);
    if (
      Number.isFinite(working) &&
      working > 0 &&
      present + paidLeave + unpaidLeave > working
    ) {
      toast.error("Present + paid leave + unpaid leave cannot exceed working days");
      return;
    }
    const normalized = normalizeStaffAttendanceMonth({
      month: attendanceForm.month,
      daysPresent: present,
      workingDays: working,
      paidLeaveDays: paidLeave,
      unpaidLeaveDays: unpaidLeave,
    });
    if (!normalized) {
      toast.error("Enter a valid month and working days");
      return;
    }
    const updated: Staff = {
      ...staff,
      attendanceByMonth: upsertStaffAttendanceMonth(staff.attendanceByMonth, normalized),
    };
    syncStaff(updated);
    const payableDays = normalized.daysPresent + normalized.paidLeaveDays;
    toast.success(`Attendance saved · ${formatPayrollMonthLabel(normalized.month)}`, {
      description: `${payableDays}/${normalized.workingDays} payable days · payroll updates automatically`,
    });
  };

  const removeAttendanceMonth = (month: string) => {
    const updated: Staff = {
      ...staff,
      attendanceByMonth: (staff.attendanceByMonth ?? []).filter((row) => row.month !== month),
    };
    syncStaff(updated);
    setPendingDeleteMonth(null);
    toast.error(`Attendance removed · ${formatPayrollMonthLabel(month)}`);
  };

  const documentsOnFile = useMemo(() => documents.filter(isDocumentComplete).length, [documents]);

  const totalAttachments = useMemo(
    () => documents.reduce((sum, doc) => sum + (doc.attachments?.length ?? 0), 0),
    [documents],
  );

  const updatePayroll = (patch: Partial<Pick<Staff, "basicSalary" | "additionalAllowances">>) => {
    syncStaff({ ...staff, ...patch });
  };

  const updateDocument = (docId: string, number: string) => {
    const updated: Staff = {
      ...staff,
      documents: (staff.documents ?? DEFAULT_STAFF_DOCUMENTS).map((d) =>
        d.id === docId ? { ...d, number } : d,
      ),
    };
    syncStaff(updated);
  };

  const updateDocumentAttachments = (docId: string, attachments: StaffDocumentAttachment[]) => {
    const updated: Staff = {
      ...staff,
      documents: (staff.documents ?? DEFAULT_STAFF_DOCUMENTS).map((d) =>
        d.id === docId ? { ...d, attachments } : d,
      ),
    };
    syncStaff(updated);
  };

  const addAttachments = async (docId: string, levelId: string, files: FileList | null) => {
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
          levelId,
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

  const openEditPage = () => {
    navigate({ to: "/tenant/staff/edit", search: { id: staff.id } });
  };

  const updatePhoto = async (photoUrl: string | undefined) => {
    try {
      await syncStaff({ ...staff, photoUrl });
      toast.success(photoUrl ? `${staff.name}'s photo updated` : `${staff.name}'s photo removed`);
    } catch {
      // Error toast already shown by syncStaff
    }
  };

  const isActive = isRecordActive(staff.active);

  const toggleActive = (nextActive: boolean) => {
    const at = new Date().toISOString();
    const eventType = nextActive ? ("reactivated" as const) : ("deactivated" as const);
    const event = {
      id: `EVT-${staff.id}-${Date.now().toString().slice(-6)}`,
      type: eventType,
      at,
      note: nextActive ? "Account reactivated from archive" : "Account deactivated and archived",
    };
    const updated: Staff = {
      ...staff,
      active: nextActive,
      statusHistory: [event, ...(staff.statusHistory ?? [])],
    };
    syncStaff(updated);
    toast.success(nextActive ? `${staff.name} reactivated` : `${staff.name} deactivated`, {
      description: `${staff.id} · ${formatStatusDateTime(at)}`,
    });
  };

  const deleteStaff = () => {
    setStaff((prev) =>
      prev.map((s) => (s.id === staff.id ? { ...s, deletedAt: new Date().toISOString() } : s)),
    );
    void apiDeleteStaff(staff.id).catch((err) =>
      toast.error("Could not move staff to recycle bin on server", {
        description: err instanceof Error ? err.message : "Delete failed",
      }),
    );
    toast.error(`${staff.name} moved to recycle bin`, { description: staff.id });
    onBack();
  };

  return (
    <div className="flex flex-col gap-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:gap-6 md:pb-0">
      <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#171717] dark:shadow-black/40">
        <div className="h-1 bg-gradient-to-r from-[#0F766E] via-[#115E59] to-[#99F6E4]" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
            <StaffPhotoAvatar staff={staff} onPhotoChange={updatePhoto} size="lg" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Staff profile
              </p>
              <h1 className="mt-1 truncate text-[1.65rem] font-semibold tracking-tight text-slate-950 dark:text-zinc-50 sm:text-[1.85rem]">
                {staff.name}
              </h1>
              <p className="mt-1 text-[14px] font-medium text-slate-500">{staff.role}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-medium text-slate-600">
                  {staff.id}
                </span>
                <span className="inline-flex rounded-full border border-[#99F6E4] bg-[#F0FDFA] px-2.5 py-1 text-[11px] font-medium text-[#0F766E]">
                  {staff.dept}
                </span>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    isActive ? "bg-[#0F766E] text-white" : "bg-black/10 text-black/55",
                  )}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openEditPage}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#0F766E] px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#0D9488]"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </button>
        </div>
      </section>

      <ProfileDetailTabs tabs={STAFF_PROFILE_TABS} value={activeTab} onValueChange={setActiveTab}>
        <ProfileTabPanel value="profile">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            <section className={CARD_FRAME}>
              <h2 className="text-base font-semibold text-black">Personal Information</h2>
              <p className="mt-1 text-[12.5px] text-black/50">
                Contact and identity details for {staff.name}.
              </p>
              <div className="mt-5 space-y-5">
                <MetaRow label="Employee ID" mono>
                  {staff.id}
                </MetaRow>

                <MetaRow label="Phone" mono>
                  {staff.phone || <span className="font-normal text-black/40">—</span>}
                </MetaRow>

                <MetaRow label="Alternative Number" mono>
                  {staff.altPhone || <span className="font-normal text-black/40">—</span>}
                </MetaRow>

                <MetaRow label="Guardian Number" mono>
                  {staff.guardianPhone || <span className="font-normal text-black/40">—</span>}
                </MetaRow>
              </div>
            </section>

            <section className={CARD_FRAME}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-black">Account History</h2>
                  <p className="mt-1 text-[12.5px] text-black/50">
                    Joined, deactivated, and reactivated events.
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-slate-50 px-3 py-1.5 font-mono text-[11px] font-semibold text-black/60 dark:bg-white/10 dark:text-zinc-400">
                  {statusHistory.length} event{statusHistory.length === 1 ? "" : "s"}
                </span>
              </div>

              {statusHistory.length === 0 ? (
                <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-[13px] text-black/50 dark:border-white/15 dark:bg-zinc-900/60 dark:text-zinc-400">
                  No account events recorded yet.
                </div>
              ) : (
                <ol className="mt-5 space-y-3">
                  {statusHistory.map((event) => {
                    const tone =
                      event.type === "joined"
                        ? "bg-[#CCFBF1] text-[#0F766E] dark:bg-[#0F766E]/30 dark:text-[#5EEAD4]"
                        : event.type === "deactivated"
                          ? "bg-[#FEE2E2] text-[#B91C1C] dark:bg-rose-950/50 dark:text-rose-300"
                          : "bg-[#D1F2E1] text-[#047857] dark:bg-emerald-950/45 dark:text-emerald-300";
                    return (
                      <li
                        key={event.id}
                        className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-zinc-900/70"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                tone,
                              )}
                            >
                              {statusEventLabel(event.type)}
                            </span>
                            <span className="font-mono text-[12px] font-medium text-black dark:text-zinc-200">
                              {formatStatusDateTime(event.at)}
                            </span>
                          </div>
                          {event.note && (
                            <p className="mt-1 text-[12px] text-black/55 dark:text-zinc-400">{event.note}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </div>
        </ProfileTabPanel>

        <ProfileTabPanel value="professional">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            <section className={CARD_FRAME}>
              <h2 className="text-base font-semibold text-black">Employment</h2>
              <p className="mt-1 text-[12.5px] text-black/50">
                Role, department, and joining details.
              </p>
              <div className="mt-5 space-y-5">
                <MetaRow label="Role">{staff.role}</MetaRow>
                <MetaRow label="Department" mono>
                  {staff.dept}
                </MetaRow>
                <MetaRow label="Date of Joining">
                  <span className="font-mono text-[13px]">{formatJoinedAt(staff.joinedAt)}</span>
                </MetaRow>
              </div>
            </section>

            <section className={cn(CARD_FRAME, "min-w-0")}>
              <h2 className="text-base font-semibold text-black">Payroll Structure</h2>
              <p className="mt-1 text-[12.5px] text-black/50">
                Salary components used for make-payment runs.
              </p>
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

                <div className="min-w-0 rounded-lg bg-slate-50 p-4 sm:p-5 dark:bg-zinc-900/70">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-400">
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
                  <p className="mt-2 text-[11px] text-black/45">
                    Pro-rata payable is calculated on the Attendance tab from days present.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </ProfileTabPanel>

        <ProfileTabPanel value="attendance">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
            <section className={cn(CARD_FRAME, "lg:col-span-4")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-black">This Month</h2>
                  <p className="mt-1 text-[12.5px] text-black/50">
                    {formatPayrollMonthLabel(payrollMonth)} · used for salary payable
                  </p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#CCFBF1] text-[#0F766E]">
                  <CalendarDays className="h-5 w-5" />
                </div>
              </div>

              {attendancePay.attendance ? (
                <div className="mt-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                        Present
                      </div>
                      <div className="mt-1 font-mono text-[22px] font-bold text-black">
                        {attendancePay.attendance.daysPresent}
                      </div>
                    </div>
                    <div className="rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                        Working
                      </div>
                      <div className="mt-1 font-mono text-[22px] font-bold text-black">
                        {attendancePay.attendance.workingDays}
                      </div>
                    </div>
                    <div className="rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                        Paid leave
                      </div>
                      <div className="mt-1 font-mono text-[22px] font-bold text-black">
                        {attendancePay.attendance.paidLeaveDays || 0}
                      </div>
                    </div>
                    <div className="rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                        Unpaid leave
                      </div>
                      <div className="mt-1 font-mono text-[22px] font-bold text-black">
                        {attendancePay.attendance.unpaidLeaveDays || 0}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#D1FAE5] bg-[#F0FDFA] px-3.5 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#0F766E]">
                      Payable Salary
                    </div>
                    <div className="mt-1 font-mono text-[20px] font-bold text-[#0F766E]">
                      ₹ {attendancePay.payable.toLocaleString("en-IN")}
                    </div>
                    <p className="mt-1 text-[11px] text-black/50">
                      Gross ₹ {staffGrossSalary(staff).toLocaleString("en-IN")} ×{" "}
                      {attendancePay.payableDays}/{attendancePay.attendance.workingDays} payable
                      days ({Math.round(attendancePay.ratio * 100)}%)
                    </p>
                    {currentMonthSettled ? (
                      <div className="mt-3 space-y-2">
                        <div className="inline-flex rounded-full bg-[#D1F2E1] px-2.5 py-1 text-[11px] font-semibold text-[#059669]">
                          Settled for {formatPayrollMonthLabel(payrollMonth)}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 w-full rounded-full text-[12.5px] font-semibold"
                          onClick={() => setActiveTab("payments")}
                        >
                          <Wallet className="mr-1.5 h-3.5 w-3.5" />
                          View salary history
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        className="mt-3 h-9 w-full rounded-full bg-[#0F766E] text-[12.5px] font-semibold text-white hover:bg-[#0D9488]"
                        onClick={() =>
                          navigate({
                            to: "/tenant/finance",
                            search: {
                              tab: "make",
                              staffId: staff.id,
                              amount: String(currentMonthOutstanding || attendancePay.payable),
                              month: payrollMonth,
                            },
                          })
                        }
                      >
                        <Wallet className="mr-1.5 h-3.5 w-3.5" />
                        Pay ₹{" "}
                        {(currentMonthOutstanding || attendancePay.payable).toLocaleString("en-IN")}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center dark:border-white/15 dark:bg-zinc-900/60">
                  <p className="text-[13px] font-medium text-black/70">No attendance for this month</p>
                  <p className="mt-1 text-[12px] text-black/45">
                    Add a month below, or upload a CSV from Staff Directory → Attendance.
                  </p>
                  <p className="mt-3 font-mono text-[12px] text-black/55">
                    Full gross ₹ {staffGrossSalary(staff).toLocaleString("en-IN")} applies
                  </p>
                </div>
              )}
            </section>

            <section className={cn(CARD_FRAME, "lg:col-span-8")}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-black">Record Attendance</h2>
                  <p className="mt-1 text-[12.5px] text-black/50">
                    Payable days = present + paid leave. Unpaid leave is loss of pay.
                  </p>
                </div>
              </div>

              <form
                onSubmit={saveAttendanceMonth}
                className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:items-end"
              >
                <div className="space-y-1.5 sm:col-span-1">
                  <Label className={META_LABEL} htmlFor="attendance-month">
                    Month
                  </Label>
                  <MonthPicker
                    id="attendance-month"
                    value={attendanceForm.month}
                    onChange={(month) =>
                      setAttendanceForm((prev) => ({
                        ...prev,
                        month: month || currentPayrollMonth(),
                      }))
                    }
                    allowClear={false}
                    placeholder="Select month"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={META_LABEL} htmlFor="days-present">
                    Days Present
                  </Label>
                  <Input
                    id="days-present"
                    inputMode="numeric"
                    value={attendanceForm.daysPresent}
                    onChange={(e) =>
                      setAttendanceForm((prev) => ({
                        ...prev,
                        daysPresent: e.target.value.replace(/[^0-9]/g, ""),
                      }))
                    }
                    placeholder="20"
                    className="h-10 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={META_LABEL} htmlFor="paid-leave-days">
                    Paid Leave
                  </Label>
                  <Input
                    id="paid-leave-days"
                    inputMode="numeric"
                    value={attendanceForm.paidLeaveDays}
                    onChange={(e) =>
                      setAttendanceForm((prev) => ({
                        ...prev,
                        paidLeaveDays: e.target.value.replace(/[^0-9]/g, ""),
                      }))
                    }
                    placeholder="0"
                    className="h-10 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={META_LABEL} htmlFor="unpaid-leave-days">
                    Unpaid Leave
                  </Label>
                  <Input
                    id="unpaid-leave-days"
                    inputMode="numeric"
                    value={attendanceForm.unpaidLeaveDays}
                    onChange={(e) =>
                      setAttendanceForm((prev) => ({
                        ...prev,
                        unpaidLeaveDays: e.target.value.replace(/[^0-9]/g, ""),
                      }))
                    }
                    placeholder="0"
                    className="h-10 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={META_LABEL} htmlFor="working-days">
                    Working Days
                  </Label>
                  <Input
                    id="working-days"
                    inputMode="numeric"
                    value={attendanceForm.workingDays}
                    onChange={(e) =>
                      setAttendanceForm((prev) => ({
                        ...prev,
                        workingDays: e.target.value.replace(/[^0-9]/g, ""),
                      }))
                    }
                    placeholder="24"
                    className="h-10 font-mono"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="h-10 rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Save Month
                </Button>
              </form>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                    Attendance History
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("payments")}
                    className="text-[11px] font-semibold text-[#0F766E] hover:underline"
                  >
                    Salary history →
                  </button>
                </div>

                {attendanceHistory.length === 0 ? (
                  <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-[13px] text-black/50 dark:border-white/15 dark:bg-zinc-900/60 dark:text-zinc-400">
                    No monthly attendance yet for {staff.name}.
                  </div>
                ) : (
                  <div className="mt-3 overflow-x-auto rounded-lg border border-slate-100 dark:border-white/10">
                    <table className="w-full min-w-[620px] text-left text-[12.5px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-zinc-900/70">
                          {["Month", "Present", "Paid", "Unpaid", "Working", "Rate", "Payable", ""].map(
                            (header) => (
                              <th
                                key={header || "actions"}
                                className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-black/50 dark:text-zinc-400"
                              >
                                {header}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceHistory.map((row) => {
                          const pay = staffPayableSalary(
                            {
                              basicSalary: staff.basicSalary,
                              additionalAllowances: staff.additionalAllowances,
                              attendanceByMonth: [row],
                            },
                            row.month,
                          );
                          const isCurrent = row.month === payrollMonth;
                          const monthPaid = salaryPaidAmountForMonth(salaryHistory, row.month);
                          const monthSettled = isSalaryMonthSettled(
                            salaryHistory,
                            row.month,
                            pay.payable,
                          );
                          return (
                            <tr
                              key={row.month}
                              className={cn(
                                "border-b border-slate-50 last:border-0",
                                isCurrent && "bg-[#F0FDFA]/70",
                              )}
                            >
                              <td className="px-3 py-3">
                                <div className="font-medium text-black">
                                  {formatPayrollMonthLabel(row.month)}
                                </div>
                                <div className="font-mono text-[10.5px] text-black/40">
                                  {row.month}
                                  {isCurrent ? " · current" : ""}
                                </div>
                              </td>
                              <td className="px-3 py-3 font-mono font-semibold text-black">
                                {row.daysPresent}
                              </td>
                              <td className="px-3 py-3 font-mono text-black/70">
                                {row.paidLeaveDays || 0}
                              </td>
                              <td className="px-3 py-3 font-mono text-black/70">
                                {row.unpaidLeaveDays || 0}
                              </td>
                              <td className="px-3 py-3 font-mono text-black/70">
                                {row.workingDays}
                              </td>
                              <td className="px-3 py-3 font-mono text-black/70">
                                {Math.round(pay.ratio * 100)}%
                              </td>
                              <td className="px-3 py-3">
                                <div className="font-mono font-semibold text-[#0F766E]">
                                  ₹ {pay.payable.toLocaleString("en-IN")}
                                </div>
                                <div className="mt-1">
                                  {monthSettled ? (
                                    <span className="inline-flex rounded-full bg-[#D1F2E1] px-2 py-0.5 text-[10px] font-semibold text-[#059669]">
                                      Paid
                                    </span>
                                  ) : monthPaid > 0 ? (
                                    <span className="inline-flex rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-semibold text-[#B45309]">
                                      Partial
                                    </span>
                                  ) : (
                                    <span className="inline-flex rounded-full bg-[#F4F4F5] px-2 py-0.5 text-[10px] font-semibold text-black/55">
                                      Unpaid
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAttendanceForm({
                                        month: row.month,
                                        daysPresent: String(row.daysPresent),
                                        workingDays: String(row.workingDays),
                                        paidLeaveDays: String(row.paidLeaveDays || 0),
                                        unpaidLeaveDays: String(row.unpaidLeaveDays || 0),
                                      })
                                    }
                                    className="grid h-8 w-8 place-items-center rounded-full text-black/45 transition-colors hover:bg-[#0F766E] hover:text-white"
                                    aria-label={`Edit ${row.month}`}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPendingDeleteMonth(row.month)}
                                    className="grid h-8 w-8 place-items-center rounded-full text-black/45 transition-colors hover:bg-[#EF4444] hover:text-white"
                                    aria-label={`Remove ${row.month}`}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        </ProfileTabPanel>

        <ProfileTabPanel value="documents">
          <section className={cn(CARD_FRAME)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-black">Identity Documents</h2>
                <p className="mt-1 text-[12.5px] text-black/50">
                  Aadhaar, PAN Card, and any other attachments (certificates, contracts, etc.).
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 dark:bg-zinc-900/70">
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

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onNumberChange={(number) => updateDocument(doc.id, number)}
                  onAttach={(levelId, files) => addAttachments(doc.id, levelId, files)}
                  onRemoveAttachment={(attachmentId) => removeAttachment(doc.id, attachmentId)}
                />
              ))}
            </div>
          </section>
        </ProfileTabPanel>

        <ProfileTabPanel value="payments" className="space-y-4 sm:space-y-6">
          <section className={CARD_FRAME}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-black">Salary Overview</h2>
                <p className="mt-1 text-[12.5px] text-black/50">
                  Payroll summary for {staff.name} · {formatPayrollMonthLabel(payrollMonth)}
                </p>
              </div>
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full rounded-full text-[12.5px] font-semibold sm:w-auto"
                  onClick={() => void handleDownloadPayrollReport()}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download payroll report
                </Button>
                {!currentMonthSettled && payrollStatement.currentMonthPayable > 0 && (
                  <Button
                    type="button"
                    className="h-9 w-full shrink-0 rounded-full bg-[#0F766E] px-4 text-[12.5px] font-semibold text-white hover:bg-[#0D9488] sm:w-auto"
                    onClick={() =>
                      navigate({
                        to: "/tenant/finance",
                        search: {
                          tab: "make",
                          staffId: staff.id,
                          amount: String(currentMonthOutstanding || payrollStatement.currentMonthPayable),
                          month: payrollMonth,
                        },
                      })
                    }
                  >
                    <Wallet className="mr-1.5 h-3.5 w-3.5" />
                    Pay outstanding
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <PayrollStatBox
                label="Total Payable"
                value={`₹ ${payrollStatement.totalPayable.toLocaleString("en-IN")}`}
                hint={`${monthlyPayrollLedger.length} payroll month${monthlyPayrollLedger.length === 1 ? "" : "s"} on record`}
              />
              <PayrollStatBox
                label="Total Paid"
                value={`₹ ${payrollStatement.totalPaid.toLocaleString("en-IN")}`}
                valueClassName="text-[#059669]"
                hint={`${salaryHistory.length} payment${salaryHistory.length === 1 ? "" : "s"} recorded`}
              />
              <PayrollDueBox
                totalDue={payrollStatement.totalDue}
                overdue={payrollStatement.overdue}
                hint={
                  currentMonthSettled
                    ? "Settled for this payroll month"
                    : currentMonthOutstanding > 0
                      ? `₹ ${currentMonthOutstanding.toLocaleString("en-IN")} due this month`
                      : "No outstanding balance"
                }
              />
            </div>

            {lastSalaryPayment && (
              <div className="mt-4 rounded-lg border border-slate-100 bg-[#FAFAFA] px-4 py-3 dark:border-white/10 dark:bg-zinc-900/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                      Last payment
                    </div>
                    <p className="mt-0.5 text-[13px] font-medium text-black">
                      {lastSalaryPayment.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[14px] font-semibold text-[#0F766E]">
                      ₹ {lastSalaryPayment.amount.toLocaleString("en-IN")}
                    </div>
                    <div className="font-mono text-[11px] text-black/45">
                      {formatEventDateTime(lastSalaryPayment.paidAt)} · {lastSalaryPayment.mode}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className={CARD_FRAME}>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-black">Monthly Payroll Ledger</h2>
                <p className="mt-1 text-[12.5px] text-black/50">
                  Month-by-month payable vs paid · attendance drives the amount due.
                </p>
              </div>
              <span className="font-mono text-[11px] text-black/40">
                {monthlyPayrollLedger.length} month
                {monthlyPayrollLedger.length === 1 ? "" : "s"}
              </span>
            </div>

            {monthlyPayrollLedger.length === 0 ? (
              <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-[13px] text-black/50 dark:border-white/15 dark:bg-zinc-900/60 dark:text-zinc-400">
                No payroll months yet. Record attendance or confirm a salary payment to start the
                ledger.
              </div>
            ) : (
              <>
                <div className="mt-5 space-y-2.5 sm:hidden">
                  {monthlyPayrollLedger.map((row) => (
                    <article
                      key={row.month}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-zinc-900/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[13px] font-semibold text-black">
                            {row.monthLabel}
                          </div>
                          <div className="mt-0.5 font-mono text-[10.5px] text-black/40">
                            {row.month}
                            {row.month === payrollMonth ? " · current" : ""}
                          </div>
                        </div>
                        <SalaryStatusBadge status={row.status} />
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-200/70 pt-3 text-center dark:border-white/10">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                            Payable
                          </div>
                          <div className="mt-0.5 font-mono text-[12.5px] font-semibold text-black">
                            ₹ {row.payable.toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                            Paid
                          </div>
                          <div className="mt-0.5 font-mono text-[12.5px] font-semibold text-[#059669]">
                            ₹ {row.paid.toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                            Due
                          </div>
                          <div className="mt-0.5 font-mono text-[12.5px] font-semibold text-black">
                            ₹ {row.outstanding.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                      {row.outstanding > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          className="mt-3 h-8 w-full rounded-full bg-[#0F766E] text-[11px] font-semibold text-white hover:bg-[#0D9488]"
                          onClick={() =>
                            navigate({
                              to: "/tenant/finance",
                              search: {
                                tab: "make",
                                staffId: staff.id,
                                amount: String(row.outstanding),
                                month: row.month,
                              },
                            })
                          }
                        >
                          Pay ₹ {row.outstanding.toLocaleString("en-IN")}
                        </Button>
                      )}
                    </article>
                  ))}
                </div>

                <div className="mt-5 hidden overflow-x-auto rounded-lg border border-slate-100 dark:border-white/10 sm:block">
                  <table className="w-full min-w-[640px] text-left text-[12.5px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-zinc-900/70">
                        {["Month", "Attendance", "Payable", "Paid", "Outstanding", "Status", ""].map(
                          (header) => (
                            <th
                              key={header || "actions"}
                              className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-black/50 dark:text-zinc-400"
                            >
                              {header}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyPayrollLedger.map((row) => (
                        <tr
                          key={row.month}
                          className={cn(
                            "border-b border-slate-50 last:border-0",
                            row.month === payrollMonth && "bg-[#F0FDFA]/70",
                          )}
                        >
                          <td className="px-3 py-3">
                            <div className="font-medium text-black">{row.monthLabel}</div>
                            <div className="font-mono text-[10.5px] text-black/40">
                              {row.month}
                              {row.month === payrollMonth ? " · current" : ""}
                            </div>
                          </td>
                          <td className="px-3 py-3 font-mono text-black/70">
                            {row.attendanceLabel}
                          </td>
                          <td className="px-3 py-3 font-mono font-semibold text-black">
                            ₹ {row.payable.toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-3 font-mono font-semibold text-[#059669]">
                            ₹ {row.paid.toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-3 font-mono font-semibold text-black">
                            ₹ {row.outstanding.toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-3">
                            <SalaryStatusBadge status={row.status} />
                          </td>
                          <td className="px-3 py-3 text-right">
                            {row.outstanding > 0 ? (
                              <Button
                                type="button"
                                size="sm"
                                className="h-7 rounded-full bg-[#0F766E] px-2.5 text-[11px] font-semibold text-white hover:bg-[#0D9488]"
                                onClick={() =>
                                  navigate({
                                    to: "/tenant/finance",
                                    search: {
                                      tab: "make",
                                      staffId: staff.id,
                                      amount: String(row.outstanding),
                                      month: row.month,
                                    },
                                  })
                                }
                              >
                                Pay
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <section className={CARD_FRAME}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-black">Payment History</h2>
                <p className="mt-1 text-[12.5px] text-black/50">
                  Individual salary disbursements for {staff.name}.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 dark:bg-zinc-900/70">
                <Wallet className="h-4 w-4 text-black/45" />
                <div className="text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    Transactions
                  </div>
                  <div className="font-mono text-lg font-bold text-black">
                    {salaryHistory.length}
                  </div>
                </div>
              </div>
            </div>

            {salaryHistory.length === 0 ? (
              <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-[13px] text-black/50 dark:border-white/15 dark:bg-zinc-900/60 dark:text-zinc-400">
                No salary payments recorded yet. Confirm a salary payment from Finance → Make
                Payment to see it here.
              </div>
            ) : (
              <>
                <div className="mt-5 space-y-2.5 sm:hidden">
                  {salaryHistory.map((row) => (
                    <SalaryPaymentCard key={row.id} row={row} />
                  ))}
                </div>

                <div className="mt-5 hidden overflow-x-auto rounded-lg border border-slate-100 dark:border-white/10 sm:block">
                  <table className="w-full min-w-[640px] text-left text-[12.5px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-zinc-900/70">
                        {["Date", "Payroll month", "Description", "Mode", "Amount", "Status"].map(
                          (header) => (
                            <th
                              key={header}
                              className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-black/50 dark:text-zinc-400"
                            >
                              {header}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {salaryHistory.map((row) => {
                        const month = salaryHistoryPayrollMonth(row);
                        return (
                          <tr key={row.id} className="border-b border-slate-50 last:border-0">
                            <td className="px-3 py-3 font-mono text-[11px] text-black/60 dark:text-zinc-400">
                              {formatEventDateTime(row.paidAt)}
                            </td>
                            <td className="px-3 py-3 text-black/70">
                              {month ? formatPayrollMonthLabel(month) : "—"}
                            </td>
                            <td className="px-3 py-3 font-medium text-black">{row.description}</td>
                            <td className="px-3 py-3 text-black/65">{row.mode}</td>
                            <td className="px-3 py-3 font-mono font-semibold text-black">
                              ₹ {row.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold",
                                  row.status === "Cleared" || row.status === "Paid"
                                    ? "bg-[#D1F2E1] text-[#059669]"
                                    : "bg-[#FEF3C7] text-[#B45309]",
                                )}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </ProfileTabPanel>
      </ProfileDetailTabs>

      {canManageUsers && (
        <section className={CARD_FRAME}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-black">Workspace Login</h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-black/55">
                Allow this staff member to sign in with limited module permissions.
              </p>
              {linkedUser ? (
                <div className="mt-2 text-[12px] text-black/60 dark:text-zinc-400">
                  <div className="font-medium text-black">{linkedUser.email}</div>
                  <div className="mt-0.5">
                    {linkedUser.active ? "Active" : "Inactive"} ·{" "}
                    {summarizePermissions(linkedUser.permissions)}
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-[12px] text-black/45">No login enabled yet</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full dark:border-white/20 dark:bg-transparent dark:text-zinc-100 dark:hover:bg-white/10"
                onClick={openLoginDialog}
              >
                {linkedUser ? "Edit login" : "Enable login"}
              </Button>
              {linkedUser && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full dark:border-white/20 dark:bg-transparent dark:text-zinc-100 dark:hover:bg-white/10"
                    onClick={() =>
                      navigate({ to: "/tenant/settings", search: { tab: "users" } })
                    }
                  >
                    Manage in Users
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-[#FECACA] text-[#EF4444] hover:bg-[#FEF2F2] hover:text-[#EF4444] dark:border-rose-400/45 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-950/55 dark:hover:text-rose-200"
                    onClick={() => setPendingRemoveLogin(true)}
                  >
                    Remove login
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      <ProfileAccountActions
        name={staff.name}
        recordId={staff.id}
        active={isActive}
        entityLabel="staff member"
        onToggleActive={toggleActive}
        onDelete={deleteStaff}
      />

      <Dialog
        open={pendingDeleteMonth !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteMonth(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">
              Remove attendance
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60 dark:text-zinc-400">
              Remove {pendingDeleteMonth ? formatPayrollMonthLabel(pendingDeleteMonth) : "this month"}
              &apos;s attendance for {staff.name}? Payroll will use full gross until a new record is
              saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingDeleteMonth(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full bg-[#EF4444] text-white hover:bg-[#DC2626]"
              onClick={() => {
                if (pendingDeleteMonth) removeAttendanceMonth(pendingDeleteMonth);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {linkedUser ? "Edit workspace login" : "Enable workspace login"}
            </DialogTitle>
            <DialogDescription>
              {staff.name} will sign in under the School Admin login tier with the email below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveStaffLogin} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="staff@school.edu"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input
                  type="text"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Min 4 characters"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 text-[11px] font-semibold"
                onClick={() =>
                  setLoginForm((p) => ({ ...p, allFunctions: true, permissions: [] }))
                }
              >
                All functions
              </button>
              <button
                type="button"
                className="rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 text-[11px] font-semibold"
                onClick={() =>
                  setLoginForm((p) => ({
                    ...p,
                    allFunctions: false,
                    permissions: [...FINANCE_ONLY_PRESET],
                  }))
                }
              >
                Finance only
              </button>
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-3">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.id}>
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {group.keys.map((key) => {
                      const checked =
                        loginForm.allFunctions || loginForm.permissions.includes(key);
                      return (
                        <label
                          key={key}
                          className="flex cursor-pointer items-center gap-2 text-[12px]"
                        >
                          <Checkbox
                            checked={checked}
                            disabled={loginForm.allFunctions}
                            onCheckedChange={(v) => {
                              setLoginForm((prev) => {
                                const next = new Set(prev.permissions);
                                if (v === true) next.add(key);
                                else next.delete(key);
                                return {
                                  ...prev,
                                  allFunctions: false,
                                  permissions: Array.from(next),
                                };
                              });
                            }}
                          />
                          {PERMISSION_LABELS[key]}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[13px]">
              <Checkbox
                checked={loginForm.active}
                onCheckedChange={(v) =>
                  setLoginForm({ ...loginForm, active: v === true })
                }
              />
              Active
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLoginOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]">
                Save login
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingRemoveLogin}
        onOpenChange={(next) => {
          if (!next) setPendingRemoveLogin(false);
        }}
      >
        <DialogContent className="max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black dark:text-zinc-100">
              Remove workspace login
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60 dark:text-zinc-400">
              {linkedUser
                ? `Remove login for ${staff.name} (${linkedUser.email})? They will no longer be able to sign in.`
                : `Remove workspace login for ${staff.name}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingRemoveLogin(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full bg-[#EF4444] text-white hover:bg-[#DC2626]"
              onClick={removeStaffLogin}
            >
              Remove login
            </Button>
          </DialogFooter>
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
  onAttach: (levelId: string, files: FileList | null) => void;
  onRemoveAttachment: (attachmentId: string) => void;
}) {
  const isOther = doc.id === "doc-other";
  const complete = isDocumentComplete(doc);
  const levels = useMemo(() => {
    if (doc.levels?.length) return doc.levels;
    if (doc.id === "doc-other") return [{ id: "files", label: "Files" }];
    return [
      { id: "front", label: "Front" },
      { id: "back", label: "Back" },
    ];
  }, [doc.id, doc.levels]);
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

  const numberPlaceholder =
    doc.id === "doc-aadhaar"
      ? "XXXX XXXX XXXX"
      : doc.id === "doc-pan"
        ? "ABCDE1234F"
        : "Optional reference";

  return (
    <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-white/10 dark:bg-zinc-900/70">
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
          placeholder={numberPlaceholder}
          className="mt-1.5 h-10 border-slate-200 bg-white font-mono text-[13px] dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
        />
      )}

      {isOther && (
        <p className="mt-1.5 text-[12px] leading-snug text-black/50 dark:text-zinc-400">
          Certificates, contracts, offer letters, or any other staff files.
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

function PayrollStatBox({
  label,
  value,
  hint,
  valueClassName,
}: {
  label: string;
  value: string;
  hint?: string;
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
      {hint ? <p className="mt-1 text-[11px] text-black/45">{hint}</p> : null}
    </div>
  );
}

function PayrollDueBox({
  totalDue,
  overdue,
  hint,
}: {
  totalDue: number;
  overdue: boolean;
  hint?: string;
}) {
  const cleared = totalDue <= 0;
  return (
    <div
      className={cn(
        "rounded-lg p-4",
        !cleared && overdue ? "bg-[#0F766E]" : "bg-slate-50 dark:bg-zinc-900/70",
      )}
    >
      <div
        className={cn(
          "flex items-start justify-between",
          !cleared && overdue ? "text-white/75" : "text-black/55 dark:text-zinc-400",
        )}
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider">Total Due</div>
        {!cleared && overdue ? (
          <AlertTriangle className="h-4 w-4 text-[#EF4444]" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-black" />
        )}
      </div>
      <div
        className={cn(
          "mt-2 font-mono text-xl font-semibold tracking-tight",
          !cleared && overdue ? "text-white" : "text-black dark:text-zinc-100",
        )}
      >
        ₹ {totalDue.toLocaleString("en-IN")}
      </div>
      <span
        className={cn(
          "mt-2 inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
          cleared ? "bg-[#0F172A] text-[#10B981]" : overdue ? "bg-[#0F172A] text-[#EF4444]" : "bg-[#0F172A] text-[#F59E0B]",
        )}
      >
        {cleared ? "[ CLEARED ]" : overdue ? "[ OVERDUE ]" : "[ PENDING ]"}
      </span>
      {hint ? (
        <p
          className={cn(
            "mt-2 text-[11px]",
            !cleared && overdue ? "text-white/70" : "text-black/45",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function SalaryStatusBadge({
  status,
}: {
  status: "Paid" | "Queued" | "Partial" | "Due" | "No due";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold",
        status === "Paid" && "bg-[#D1F2E1] text-[#059669]",
        status === "Queued" && "bg-[#FEF3C7] text-[#B45309]",
        status === "Partial" && "bg-[#FEF3C7] text-[#B45309]",
        status === "Due" && "bg-[#FEE2E2] text-[#EF4444]",
        status === "No due" && "bg-[#F4F4F5] text-black/55",
      )}
    >
      {status}
    </span>
  );
}

function SalaryPaymentCard({ row }: { row: StaffSalaryHistoryEntry }) {
  const month = salaryHistoryPayrollMonth(row);
  return (
    <article className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-zinc-900/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[11px] text-black/50 dark:text-zinc-400">
            {formatEventDateTime(row.paidAt)}
            {month ? ` · ${formatPayrollMonthLabel(month)}` : ""}
          </div>
          <p className="mt-1 text-[13px] font-medium leading-snug text-black dark:text-zinc-100">
            {row.description}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold",
            row.status === "Cleared" || row.status === "Paid"
              ? "bg-[#D1F2E1] text-[#059669]"
              : "bg-[#FEF3C7] text-[#B45309]",
          )}
        >
          {row.status}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-3 dark:border-white/10">
        <span className="text-[12px] text-black/55 dark:text-zinc-400">{row.mode}</span>
        <span className="font-mono text-[14px] font-semibold text-[#0F766E] dark:text-[#5EEAD4]">
          ₹ {row.amount.toLocaleString("en-IN")}
        </span>
      </div>
    </article>
  );
}
