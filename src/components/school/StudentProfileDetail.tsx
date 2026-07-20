import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  Download,
  MessageCircle,
  Pencil,
  Phone,
  Check,
  AlertTriangle,
  CheckCircle2,
  Share2,
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
import { OrganicCard } from "@/components/ui/organic-card";
import {
  BLOOD_GROUPS,
  createStudentShareToken,
  GUARDIAN_RELATIONS,
  STUDENT_CATEGORIES,
  STUDENT_RELIGIONS,
  upsertStudentInSnapshot,
  useTenantStore,
  type GuardianRelation,
  type Student,
} from "@/lib/tenant-store";
import { ShareParentLinkDialog } from "@/components/school/ShareParentLinkDialog";
import { downloadReceiptPdf } from "@/lib/finance-export";
import { useAuth } from "@/lib/auth";
import {
  EnrollmentStatusBadge,
  isRecordActive,
  ProfileAccountActions,
} from "@/components/school/ProfileAccountActions";
import { cn } from "@/lib/utils";

type LedgerStatus = "Paid" | "Partially Paid" | "Overdue";

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
    placeOfBirth: student.placeOfBirth ?? "",
    nationality: student.nationality ?? "",
    religion: student.religion ?? "",
    studentCategory: student.studentCategory ?? "",
    bloodGroup: student.bloodGroup ?? "",
    needsBus:
      student.needsBus === true ||
      Boolean(student.busPoint1 || student.busPoint2),
    busPoint1: student.busPoint1 ?? "",
    busPoint2: student.busPoint2 ?? "",
  };
}

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

type LedgerRow = {
  date: string;
  desc: string;
  due: string;
  charge: number;
  paid: number;
  balance: number;
  status: LedgerStatus;
};

type Receipt = {
  id: string;
  date: string;
  amount: number;
  mode: string;
};

const META_LABEL = "text-black/45 font-semibold tracking-wider text-[11px] uppercase";

const inr = (n: number) => `₹ ${n.toLocaleString("en-IN")}`;

function deriveFees(due: number) {
  const factor = due === 0 ? 0 : due / 5500;
  const round = (n: number) => Math.round(n);
  return {
    factor,
    totalDue: due === 0 ? 12000 : round(12000 * factor),
    totalPaid: due === 0 ? 12000 : round(6500 * factor),
    balance: due,
    overdue: due > 0,
  };
}

function deriveLedger(due: number): LedgerRow[] {
  const factor = due === 0 ? 1 : due / 5500;
  const round = (n: number) => Math.round(n);

  if (due === 0) {
    return [
      {
        date: "1/12/25",
        desc: "Tuition Fee",
        due: "05/08/25",
        charge: 4000,
        paid: 4000,
        balance: 0,
        status: "Paid",
      },
      {
        date: "12/05/25",
        desc: "Annual Fee",
        due: "04/05/26",
        charge: 800,
        paid: 800,
        balance: 0,
        status: "Paid",
      },
      {
        date: "19/06/25",
        desc: "Vehicle Fee",
        due: "12/12/24",
        charge: 800,
        paid: 800,
        balance: 0,
        status: "Paid",
      },
    ];
  }

  return [
    {
      date: "1/12/25",
      desc: "Tuition Fee",
      due: "05/08/25",
      charge: round(4000 * factor),
      paid: round(2500 * factor),
      balance: round(1500 * factor),
      status: "Partially Paid",
    },
    {
      date: "12/05/25",
      desc: "Annual Fee",
      due: "04/05/26",
      charge: round(800 * factor),
      paid: round(800 * factor),
      balance: 0,
      status: "Paid",
    },
    {
      date: "19/06/25",
      desc: "Vehicle Fee",
      due: "12/12/24",
      charge: round(800 * factor),
      paid: 0,
      balance: round(800 * factor),
      status: "Overdue",
    },
  ];
}

function deriveReceipts(due: number): Receipt[] {
  const factor = due === 0 ? 1 : due / 5500;
  const round = (n: number) => Math.round(n);
  return [
    { id: "REC-2026-104", date: "12/01/2026", amount: round(2500 * factor), mode: "UPI - GPay" },
    { id: "REC-2025-098", date: "08/11/2025", amount: round(800 * factor), mode: "Bank - NEFT" },
    {
      id: "REC-2025-072",
      date: "22/09/2025",
      amount: round(3200 * factor),
      mode: "Cash - Counter",
    },
  ];
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
  const { setStudents, academicYear, schoolDetails, classes: classConfigs } = useTenantStore();
  const { session } = useAuth();
  const schoolName = schoolDetails.name || session?.tenantName || "Silver Hills Global";
  const [editing, setEditing] = useState(initialEdit);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareToken, setShareToken] = useState(student.shareToken ?? "");
  const [draft, setDraft] = useState<StudentDraft>(() => draftFromStudent(student));

  const classOptions = useMemo(() => {
    const fromConfig = classConfigs.map((c) => c.className);
    return Array.from(new Set([...fromConfig, student.cls, draft.cls].filter(Boolean)));
  }, [classConfigs, draft.cls, student.cls]);

  useEffect(() => {
    setShareToken(student.shareToken ?? "");
  }, [student.shareToken]);

  // Only resync the draft when switching students, or when leaving edit mode
  // after an external student update — never while the user is typing.
  useEffect(() => {
    if (!editing) {
      setDraft(draftFromStudent(student));
    }
  }, [student, editing]);

  useEffect(() => {
    setDraft(draftFromStudent(student));
  }, [student.id]);

  useEffect(() => {
    if (initialEdit) {
      setEditing(true);
      navigate({ to: "/tenant/students", search: { id: student.id }, replace: true });
    }
  }, [initialEdit, navigate, student.id]);

  const fees = useMemo(() => deriveFees(student.due), [student.due]);
  const ledger = useMemo(() => deriveLedger(student.due), [student.due]);
  const receipts = useMemo(() => deriveReceipts(student.due), [student.due]);

  const phoneDigits = (draft.phone || "").replace(/[^0-9]/g, "");
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
      setStudents((prev) => prev.map((s) => (s.id === student.id ? next : s)));
      upsertStudentInSnapshot(next);
    }
    setShareToken(token);
    setShareOpen(true);
  };

  const toggleEdit = () => {
    if (editing) {
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
        placeOfBirth: emptyToUndefined(draft.placeOfBirth),
        nationality: emptyToUndefined(draft.nationality),
        religion: emptyToUndefined(draft.religion),
        studentCategory: emptyToUndefined(draft.studentCategory),
        bloodGroup: emptyToUndefined(draft.bloodGroup),
        needsBus: draft.needsBus,
        busPoint1: draft.needsBus ? emptyToUndefined(draft.busPoint1) : undefined,
        busPoint2: draft.needsBus ? emptyToUndefined(draft.busPoint2) : undefined,
      };
      setStudents((prev) => prev.map((s) => (s.id === student.id ? updated : s)));
      upsertStudentInSnapshot(updated);
      toast.success(`${updated.name}'s profile updated`, {
        description: `${updated.id} · all profile fields saved`,
      });
      setEditing(false);
    } else {
      setDraft(draftFromStudent(student));
      setEditing(true);
    }
  };

  const updatePhoto = (photoUrl: string | undefined) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === student.id ? { ...s, photoUrl } : s)),
    );
    toast.success(
      photoUrl ? `${student.name}'s photo updated` : `${student.name}'s photo removed`,
    );
  };

  const isActive = isRecordActive(student.active);

  const toggleActive = (nextActive: boolean) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === student.id ? { ...s, active: nextActive } : s)),
    );
    toast.success(
      nextActive ? `${student.name} reactivated` : `${student.name} deactivated`,
      { description: student.id },
    );
  };

  const deleteStudent = () => {
    setStudents((prev) => prev.filter((s) => s.id !== student.id));
    toast.error(`${student.name} removed from directory`, { description: student.id });
    onBack();
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <TopBar
        studentName={editing ? draft.name : student.name}
        onBack={onBack}
        editing={editing}
        onToggleEdit={toggleEdit}
        onShare={openShare}
      />

      <ShareParentLinkDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        token={shareToken}
        studentName={editing ? draft.name : student.name}
        guardianPhone={draft.phone || student.phone}
        guardianName={draft.guardian}
      />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:items-start">
        <OrganicCard
          tone="white"
          cornerSide="tr"
          padded
          className="relative z-10 flex min-h-0 flex-col overflow-hidden lg:sticky lg:top-4 lg:col-span-4 lg:h-[calc(100dvh-8.5rem)]"
        >
          <IdentityHeader
            student={student}
            displayName={draft.name}
            gender={draft.gender}
            editing={editing}
            onNameChange={(name) => patchDraft("name", name)}
            onGenderChange={(gender) => patchDraft("gender", gender)}
            onPhotoChange={updatePhoto}
            active={isActive}
          />

          <div className="mobile-scrollbar-none mt-6 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain pb-1">
              <MetaField
                label="Guardian"
                value={draft.guardian}
                editing={editing}
                onChange={(v) => patchDraft("guardian", v)}
                placeholder="Guardian full name"
              />

              <div>
                <div className={META_LABEL}>Contact Phone</div>
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  {editing ? (
                    <Input
                      value={draft.phone}
                      onChange={(e) => patchDraft("phone", e.target.value)}
                      placeholder="9810045221"
                      className="h-9 flex-1 bg-white font-mono text-[13px]"
                    />
                  ) : (
                    <span className="font-mono text-[14px] font-medium text-black">
                      {draft.phone || "—"}
                    </span>
                  )}
                  {phoneDigits.length > 0 && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <a
                        href={`tel:${phoneDigits}`}
                        className="inline-flex items-center gap-1 rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition-colors hover:border-[#2563EB]/40 hover:bg-[#DBEAFE] hover:text-[#2563EB]"
                      >
                        <Phone className="h-3 w-3" /> Call
                      </a>
                      {waHref && (
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 rounded-full bg-[#2563EB] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[#0F172A] hover:text-white"
                        >
                          <MessageCircle className="h-3 w-3" /> Quick Connect
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <MetaField
                label="Date of Birth"
                value={draft.dob}
                editing={editing}
                onChange={(v) => patchDraft("dob", v)}
                placeholder="14 Mar 2012"
                date
              />

              <MetaField
                label="Email Address"
                value={draft.email}
                editing={editing}
                onChange={(v) => patchDraft("email", v)}
                placeholder="aarav.sharma@silverhills.in"
                mono
              />

              <div className="border-t border-[#EFEFEF] pt-5">
                <div className={META_LABEL}>Class</div>
                <div className="mt-1.5">
                  {editing ? (
                    <Select value={draft.cls || undefined} onValueChange={(cls) => patchDraft("cls", cls)}>
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
                  ) : (
                    <span className="inline-flex rounded-full bg-[#DBEAFE] px-3 py-1.5 text-[12px] font-semibold text-black">
                      {student.cls}
                    </span>
                  )}
                </div>
              </div>

              <MetaField
                label="Residential Mailing Address"
                value={draft.address}
                editing={editing}
                onChange={(v) => patchDraft("address", v)}
                placeholder="B-204, Lotus Greens, Sector 21, Noida 201301"
                multiline
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MetaField
                  label="Mother Name"
                  value={draft.motherName}
                  editing={editing}
                  onChange={(v) => patchDraft("motherName", v)}
                  placeholder="e.g. Anita Verma"
                />
                <MetaField
                  label="Father Occupation"
                  value={draft.fatherOccupation}
                  editing={editing}
                  onChange={(v) => patchDraft("fatherOccupation", v)}
                  placeholder="e.g. Engineer"
                />
                <div>
                  <div className={META_LABEL}>If Guardian Is</div>
                  <div className="mt-1.5">
                    {editing ? (
                      <div className="relative z-10 inline-flex w-full items-center rounded-full border border-black/10 bg-white p-1">
                        {GUARDIAN_RELATIONS.map((relation) => (
                          <button
                            key={relation}
                            type="button"
                            onClick={() => patchDraft("guardianRelation", relation)}
                            className={cn(
                              "min-h-8 flex-1 cursor-pointer rounded-full px-1 text-[11px] font-semibold transition-colors",
                              draft.guardianRelation === relation
                                ? "bg-[#2563EB] text-white"
                                : "text-black/55 hover:bg-black/5",
                            )}
                          >
                            {relation}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[14px] font-medium text-black">
                        {draft.guardianRelation || "—"}
                      </div>
                    )}
                  </div>
                </div>
                <MetaField
                  label="Guardian Occupation"
                  value={draft.guardianOccupation}
                  editing={editing}
                  onChange={(v) => patchDraft("guardianOccupation", v)}
                  placeholder="e.g. Teacher"
                />
                <MetaField
                  label="Aadhaar"
                  value={draft.aadhaar}
                  editing={editing}
                  onChange={(v) =>
                    patchDraft("aadhaar", v.replace(/\D/g, "").slice(0, 12))
                  }
                  placeholder="12-digit Aadhaar"
                  mono
                />
                <MetaField
                  label="Place of Birth"
                  value={draft.placeOfBirth}
                  editing={editing}
                  onChange={(v) => patchDraft("placeOfBirth", v)}
                  placeholder="e.g. Kozhikode"
                />
                <MetaField
                  label="Nationality"
                  value={draft.nationality}
                  editing={editing}
                  onChange={(v) => patchDraft("nationality", v)}
                  placeholder="e.g. Indian"
                />
                <MetaSelect
                  label="Religion"
                  value={draft.religion}
                  editing={editing}
                  onChange={(v) => patchDraft("religion", v)}
                  options={[...STUDENT_RELIGIONS]}
                  placeholder="Select religion"
                />
                <MetaSelect
                  label="Student Category"
                  value={draft.studentCategory}
                  editing={editing}
                  onChange={(v) => patchDraft("studentCategory", v)}
                  options={[...STUDENT_CATEGORIES]}
                  placeholder="Select category"
                />
                <MetaSelect
                  label="Blood Group"
                  value={draft.bloodGroup}
                  editing={editing}
                  onChange={(v) => patchDraft("bloodGroup", v)}
                  options={[...BLOOD_GROUPS]}
                  placeholder="Select blood group"
                />
                <div className="sm:col-span-2">
                  <div className={META_LABEL}>School Bus</div>
                  <div className="mt-1.5">
                    {editing ? (
                      <label className="flex items-center gap-2.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2.5 text-[13px] font-medium text-black">
                        <Checkbox
                          checked={draft.needsBus}
                          onCheckedChange={(checked) =>
                            patchDraft("needsBus", checked === true)
                          }
                        />
                        Requires school bus transport
                      </label>
                    ) : (
                      <div className="text-[14px] font-medium text-black">
                        {draft.needsBus ? "Required" : "Not required"}
                      </div>
                    )}
                  </div>
                </div>
                {draft.needsBus && (
                  <>
                    <MetaField
                      label="Bus Point 1"
                      value={draft.busPoint1}
                      editing={editing}
                      onChange={(v) => patchDraft("busPoint1", v)}
                      placeholder="Pickup point"
                    />
                    <MetaField
                      label="Bus Point 2"
                      value={draft.busPoint2}
                      editing={editing}
                      onChange={(v) => patchDraft("busPoint2", v)}
                      placeholder="Drop point"
                    />
                  </>
                )}
              </div>
          </div>
        </OrganicCard>

        <div className="flex flex-col lg:col-span-8">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-6 sm:gap-4 md:grid-cols-3">
            <MetricTile label="Total Due" value={inr(fees.totalDue)} cornerSide="tr" />
            <MetricTile
              label="Total Paid"
              value={inr(fees.totalPaid)}
              cornerSide="bl"
              valueClassName="text-[#10B981]"
            />
            <BalanceTile balance={fees.balance} overdue={fees.overdue} />
          </div>

          <FeesTable
            ledger={ledger}
            student={student}
            guardian={draft.guardian}
            phone={draft.phone}
            schoolName={schoolName}
            academicYear={academicYear}
          />

          <div className="mt-6">
            <ReceiptsList
              receipts={receipts}
              student={student}
              schoolName={schoolName}
              academicYear={academicYear}
            />
          </div>
        </div>
      </div>

      <ProfileAccountActions
        name={student.name}
        recordId={student.id}
        active={isActive}
        entityLabel="student"
        onToggleActive={toggleActive}
        onDelete={deleteStudent}
      />
    </div>
  );
}

function TopBar({
  studentName,
  onBack,
  editing,
  onToggleEdit,
  onShare,
}: {
  studentName: string;
  onBack: () => void;
  editing: boolean;
  onToggleEdit: () => void;
  onShare: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#E5E5E5] bg-white p-2 shadow-[0_10px_28px_-24px_rgba(0,0,0,0.35)] sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
      <div className="min-w-0 flex-1 truncate pl-0.5 text-[12px] sm:text-[14px]">
        <button
          type="button"
          onClick={onBack}
          className="font-medium text-black/55 transition-colors hover:text-black"
        >
          Students
        </button>
        <span className="text-black/30"> / </span>
        <span className="font-semibold text-black">{studentName}</span>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] px-3 text-[11.5px] font-medium text-black/75 transition-colors hover:bg-[#F4F4F5] sm:gap-1.5 sm:px-4 sm:text-[13px]"
      >
        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="hidden min-[380px]:inline sm:inline">Back</span>
      </button>

      <button
        type="button"
        onClick={onShare}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-3 text-[11.5px] font-semibold text-[#2563EB] transition-colors hover:bg-[#DBEAFE] sm:gap-1.5 sm:px-4 sm:text-[13px]"
      >
        <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="hidden min-[380px]:inline sm:inline">Share</span>
      </button>

      <button
        type="button"
        onClick={onToggleEdit}
        className={`inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-full px-3 text-[11.5px] font-semibold shadow-sm transition-colors sm:gap-1.5 sm:px-5 sm:text-[13px] ${
          editing
            ? "bg-[#2563EB] text-white hover:bg-[#DBEAFE]"
            : "bg-black text-white hover:bg-black/85"
        }`}
      >
        {editing ? (
          <>
            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Save</span>
          </>
        ) : (
          <>
            <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Edit</span>
          </>
        )}
      </button>
    </div>
  );
}

function IdentityHeader({
  student,
  displayName,
  gender,
  editing,
  onNameChange,
  onGenderChange,
  onPhotoChange,
  active,
}: {
  student: Student;
  displayName: string;
  gender: "" | "M" | "F";
  editing: boolean;
  onNameChange: (name: string) => void;
  onGenderChange: (gender: "" | "M" | "F") => void;
  onPhotoChange: (photoUrl: string | undefined) => void;
  active: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

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
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          {student.photoUrl ? (
            <img
              src={student.photoUrl}
              alt={`${displayName} profile`}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-lg bg-black text-lg font-semibold text-white">
              {initials(displayName || student.name)}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label={`Change photo for ${displayName}`}
            title="Change photo"
            className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#2563EB] text-white shadow-sm transition-colors hover:bg-black hover:text-[#2563EB]"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          {student.photoUrl && (
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              aria-label={`Remove photo for ${displayName}`}
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
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <Input
                value={displayName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Student full name"
                className="h-9 text-[15px] font-semibold"
              />
              <div className="inline-flex items-center rounded-full border border-black/10 bg-white p-1">
                {(["M", "F"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => onGenderChange(g)}
                    className={cn(
                      "min-h-7 rounded-full px-3 text-[11px] font-semibold transition-colors",
                      gender === g
                        ? g === "F"
                          ? "bg-black text-[#2563EB]"
                          : "bg-black text-white"
                        : "text-black/55 hover:bg-black/5",
                    )}
                  >
                    {g === "M" ? "Male" : "Female"}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="truncate text-[18px] font-semibold text-black">{displayName}</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-[#F4F4F5] px-2.5 py-0.5 font-mono text-[10.5px] font-medium text-black/65">
                  {student.id}
                </span>
                {gender && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${
                      gender === "F" ? "bg-black text-[#2563EB]" : "bg-black text-white"
                    }`}
                  >
                    {gender}
                  </span>
                )}
                <EnrollmentStatusBadge active={active} />
              </div>
            </>
          )}
          {editing && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-[#F4F4F5] px-2.5 py-0.5 font-mono text-[10.5px] font-medium text-black/65">
                {student.id}
              </span>
              <EnrollmentStatusBadge active={active} />
            </div>
          )}
        </div>
      </div>

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent className="max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">
              Remove photo
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60">
              Remove {displayName}&apos;s profile photo? You can upload a new one anytime.
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
              multiline ? "whitespace-pre-line leading-snug text-black/85" : "text-black",
            )}
          >
            {value || <span className="font-normal text-black/40">—</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  cornerSide,
  valueClassName,
}: {
  label: string;
  value: string;
  cornerSide: "tl" | "tr" | "bl" | "br";
  valueClassName?: string;
}) {
  return (
    <OrganicCard tone="white" cornerSide={cornerSide} padded>
      <div className="flex items-start justify-between">
        <div className={META_LABEL}>{label}</div>
        <span className="h-2.5 w-2.5 rounded-full bg-black" />
      </div>
      <div
        className={`mt-3 font-mono text-2xl font-semibold tracking-tight ${
          valueClassName ?? "text-black"
        }`}
      >
        {value}
      </div>
    </OrganicCard>
  );
}

function BalanceTile({ balance, overdue }: { balance: number; overdue: boolean }) {
  if (!overdue) {
    return (
      <OrganicCard tone="white" cornerSide="br" padded>
        <div className="flex items-start justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
            Current Balance
          </div>
          <CheckCircle2 className="h-4 w-4 text-black" />
        </div>
        <div className="mt-3 font-mono text-2xl font-semibold tracking-tight text-black">
          {inr(balance)}
        </div>
        <span className="mt-2 inline-flex items-center rounded-full bg-[#0F172A] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#10B981]">
          [ CLEARED ]
        </span>
      </OrganicCard>
    );
  }
  return (
    <OrganicCard tone="lime" cornerSide="br" padded>
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-white/75">
          Current Balance
        </div>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0F172A]">
          <AlertTriangle className="h-3.5 w-3.5 text-[#EF4444]" />
        </span>
      </div>
      <div className="mt-3 font-mono text-2xl font-semibold tracking-tight text-white">
        {inr(balance)}
      </div>
      <span className="overdue-flash mt-2 inline-flex items-center rounded-full bg-[#0F172A] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#EF4444]">
        [ OVERDUE ]
      </span>
    </OrganicCard>
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

function OverdueWhatsAppButton({
  href,
  compact,
}: {
  href: string | null;
  compact?: boolean;
}) {
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
      <OrganicCard tone="white" cornerSide="tr" padded>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-title">Fees Details</div>
            <div className="mt-1 text-[12px] text-black/55">
              Statement ledger sheet · {ledger.length} line items on file
            </div>
          </div>
          <span className="rounded-full border border-[#E5E5E5] bg-[#F4F4F5] px-2.5 py-1 font-mono text-[10.5px] font-medium text-black/65">
            AY 2025-26
          </span>
        </div>

        <div className="space-y-2.5 md:hidden">
          {ledger.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedRow(r)}
              aria-label={`View details for ${r.desc}`}
              className="w-full rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] p-3.5 text-left transition-colors hover:border-black/15 hover:bg-[#F4F4F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
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
                  className="cursor-pointer border-b border-[#F0F0F0] transition-colors last:border-b-0 hover:bg-[#F4F4F5] focus-visible:bg-[#F4F4F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]"
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
      </OrganicCard>

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
                    className="h-full rounded-full bg-[#2563EB] transition-all"
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

function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
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
  schoolName,
  academicYear,
}: {
  receipts: Receipt[];
  student: Student;
  schoolName: string;
  academicYear: string;
}) {
  const { schoolDetails } = useTenantStore();
  const handleDownload = (r: Receipt) => {
    try {
      downloadReceiptPdf(
        {
          id: r.id,
          name: student.name,
          cat: `Fee Payment · ${student.cls}`,
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

  return (
    <OrganicCard tone="white" cornerSide="bl" padded>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-title">Receipts</div>
          <div className="mt-1 text-[12px] text-black/55">
            {receipts.length} historical digital receipts
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#2563EB] px-2.5 py-1 text-[10.5px] font-semibold text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-black" />
          Reconciled
        </span>
      </div>
      <ul className="divide-y divide-[#F0F0F0]">
        {receipts.map((r) => (
          <li
            key={r.id}
            className="-mx-2 flex items-center gap-4 rounded-lg px-3 py-3.5 transition-colors hover:bg-[#F4F4F5]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[13px] font-semibold text-black">{r.id}</span>
                <span className="rounded-full bg-[#F4F4F5] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-black/65">
                  {r.mode}
                </span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-black/55">{r.date}</div>
            </div>
            <div className="font-mono text-base font-semibold text-black">{inr(r.amount)}</div>
            <button
              type="button"
              onClick={() => handleDownload(r)}
              aria-label={`Download receipt ${r.id}`}
              className="grid h-10 w-10 place-items-center rounded-lg border border-[#E5E5E5] bg-white text-black/55 shadow-sm transition-colors hover:bg-black hover:text-white"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </OrganicCard>
  );
}

const STATUS_STYLE: Record<LedgerStatus, { wrap: string; dot: string }> = {
  Paid: {
    wrap: "bg-[#F4F4F5] text-black",
    dot: "bg-black",
  },
  "Partially Paid": {
    wrap: "bg-[#DBEAFE] text-black",
    dot: "bg-black",
  },
  Overdue: {
    wrap: "bg-[#2563EB] text-white",
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
