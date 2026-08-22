import { useCallback, useEffect, useMemo, useRef, useState, startTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { useNavigate, useSearch, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Download,
  Upload,
  Phone,
  MessageCircle,
  MessageSquare,
  Pencil,
  Trash2,
  X,
  Camera,
  Check,
  ClipboardList,
  Share2,
  ChevronDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowDownRight,
  ArrowUpRight,
  ChartPie,
  BookOpen,
  Scale,
  GraduationCap,
  Briefcase,
  HandCoins,
  Banknote,
  Landmark,
  TriangleAlert,
  Users,
  Filter,
  Loader2,
  Recycle,
  RotateCcw,
  Search,
  Bus,
  Calendar,
  Clock,
  Wallet,
  ListTodo,
  StickyNote,
  Settings,
  ChevronLeft,
  ChevronRight,
  Archive,
  ArchiveRestore,
  ImagePlus,
  FileImage,
  PenLine,
  Paperclip,
  FileText,
  ExternalLink,
  LogOut,
  MapPin,
  Route,
  Scan,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker, MonthPicker } from "@/components/ui/date-picker";
import { FinancialYearFields, resolveFinancialYearInput } from "@/components/school/FinancialYearFields";
import { SignaturePadDialog } from "@/components/school/SignaturePadDialog";
import { OrganicCard } from "@/components/ui/organic-card";
import { ImageCropDialog } from "@/components/ui/image-crop-dialog";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import {
  academicYearCoverageCaption,
  booksRangeKeysFromLabel,
  defaultClosingMonthKey,
  suggestNextBooksMonthKey,
} from "@/lib/academic-year";
import {
  composeClassName,
  splitClassName,
  normalizeClassConfig,
  CLASS_SCHEDULE_CYCLES,
  CLASS_ONE_TIME_FEE_SUGGESTIONS,
  withClassFeeSchedule,
  buildFixedInstallments,
  installmentLabel,
  sumFeeSchedule,
  scheduleSummary,
  classFeePrefillAmount,
  DEFAULT_STAFF_DOCUMENTS,
  THEME_NAV_PLACEMENT_OPTIONS,
  useTenantStore,
  createStudentShareToken,
  upsertStudentInSnapshot,
  normalizeStudent,
  notifyNavPlacementChange,
  schoolInitials,
  createDefaultVehicleDocuments,
  daysUntilDate,
  VEHICLE_DOCUMENT_KINDS,
  VEHICLE_DOCUMENT_LABELS,
  DEFAULT_VEHICLE_NOTIFY_DAYS,
  FEE_MONTHS,
  FEE_TERM_KIND_LABELS,
  FEE_PERIOD_MODE_LABELS,
  currentFeeMonth,
  categoryFeeTermKind,
  formatFeeTermCoverage,
  filterFeePeriods,
  resolveFeePeriodMode,
  resolvePaymentFeePeriod,
  resolvePaymentFeePeriodKind,
  currentPayrollMonth,
  formatPayrollMonthLabel,
  staffPayableSalary,
  staffGrossSalary,
  upsertStaffAttendanceMonth,
  normalizeStaffAttendanceMonth,
  type ClassBillingCycle,
  type ClassFeeAmountMode,
  type ClassConfig,
  type Department,
  type FeePeriodKind,
  type FeePeriodMode,
  type FeeTerm,
  type FeeTermKind,
  type Payment,
  type PaymentAttachment,
  type PaymentCategory,
  type Role,
  type SchoolDetails,
  type Staff,
  type StaffAttendanceMonth,
  type Student,
  type ThemeSettings,
  type TransportRoute,
  type TransportVehicle,
  type TenantNotification,
  type VehicleDocument,
  type VehicleDocumentKind,
  type VehicleOwnership,
} from "@/lib/tenant-store";
import { StudentProfileDetail } from "@/components/school/StudentProfileDetail";
import { ShareParentLinkDialog } from "@/components/school/ShareParentLinkDialog";
import { StaffProfileDetail } from "@/components/school/StaffProfileDetail";
import { AttachmentPreviewDialog } from "@/components/school/AttachmentPreviewDialog";
import {
  TenantDashboardSkeleton,
  TenantDirectorySkeleton,
  TenantSystemSkeleton,
} from "@/components/school/TenantDirectorySkeleton";
import {
  EnrollmentStatusBadge,
  isRecordActive,
  isRecordDeleted,
} from "@/components/school/ProfileAccountActions";
import { SettingsUsersCard } from "@/components/school/SettingsUsersCard";
import { SettingsBranchesCard } from "@/components/school/SettingsBranchesCard";
import { CustomerSupportCard } from "@/components/school/CustomerSupportCard";
import { DefaultSchoolSeal } from "@/components/school/DefaultSchoolSeal";
import { BRAND_PRESETS, FONT_FAMILY_OPTIONS, FONT_SIZE_OPTIONS, normalizeHexColor } from "@/lib/brand-theme";
import {
  DEFAULT_FILE_NAMES,
  DOWNLOAD_KIND_LABELS,
  DOWNLOAD_KINDS,
  DOWNLOAD_TOKENS,
  formatDownloadFilename,
  previewDownloadFilename,
  slugYear,
  todayStamp,
  type DownloadKind,
} from "@/lib/download-names";
import { PwaInstallCard } from "@/components/pwa/PwaInstallBanner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  sessionCanAccessSettings,
  sessionCanAccessSettingsTab,
  sessionCanAccessFinanceView,
  useAuth,
} from "@/lib/auth";
import { planAllowsExtraUsers, planAllowsMultipleBranches, type SettingsTabId } from "@/lib/permissions";
import {
  sendWhatsAppNotify,
  sendPersonalizedWhatsApp,
  toNotifyWhatsAppNumber,
  templateHasPlaceholders,
  renderWhatsAppTemplate,
  buildStudentWhatsAppVars,
  WHATSAPP_TEMPLATE_VARS,
  DEFAULT_OVERDUE_WHATSAPP_TEMPLATE,
  DEFAULT_GENERAL_WHATSAPP_TEMPLATE,
} from "@/lib/whatsapp-notify";
import { FinanceBarCard, FinanceDonutCard } from "@/components/school/finance-charts";
import { LocationPicker } from "@/components/school/LocationPicker";
import {
  BalanceSheetReport,
  BankReconciliationReport,
  DayBookReport,
  FeesReport,
  GeneralLedgerReport,
  ProfitLossReport,
  SalaryReport,
} from "@/components/school/FinanceReports";
import {
  downloadCsv,
  downloadPaymentVoucherPdf,
  downloadReceiptPdf,
  downloadSalarySlipPdf,
  downloadTablePdf,
  findReceiptStudent,
  receiptBrandingFromSchool,
} from "@/lib/finance-export";
import {
  apiDeleteClass,
  apiDeleteDepartment,
  apiDeletePaymentCategory,
  apiDeleteTransportRoute,
  apiSaveSchoolDetails,
  apiUpsertClass,
  apiUpsertDepartment,
  apiUpsertPaymentCategory,
  apiUpsertTransportRoute,
} from "@/lib/api/settings";
import { apiCreateDisbursement, apiCreatePayment, apiDeleteDisbursement, apiDeletePayment, apiDeleteStaff, apiDeleteStudent, apiListDisbursements, apiUpdateDisbursement, apiUpdatePayment, apiUpsertStaff, apiUpsertStudent } from "@/lib/api/records";
import { apiSaveDashboardTodos } from "@/lib/api/dashboard";
import { apiUploadDataUrl } from "@/lib/api/settings";
import { getApiToken } from "@/lib/api/client";
import {
  buildClassFromLabel,
  isDuplicateStudent,
  matchExistingClass,
  nextPrefixedId,
  parseStudentCsv,
} from "@/lib/student-csv";
import { resolveMediaUrl, fetchMediaBlob } from "@/lib/media";
import { defaultSealToPng, resolveSealDisplaySrc, resolveSignatureDisplaySrc } from "@/lib/school-marks";
import {
  bankBalance,
  cashOnHand,
  expenseSegmentsFromDisbursements,
  formatInr,
  operatingExpenseForPeriod,
  queuedPayables,
  queuedSalaryPayables,
  salaryPayable,
  normalizePayeeType,
  type PayeeType,
} from "@/lib/dashboard-finance";
import { useDisbursements } from "@/lib/use-disbursements";
import {
  buildIncomeExpenseSeries,
  filterPaymentsByPeriod,
  PAYMENT_PERIOD_OPTIONS,
  type CustomDateRange,
  type PaymentPeriod,
} from "@/lib/payment-period";
import { amountToIndianWords } from "@/lib/amount-words";
import { formatEventDateTime, formatInAppZone, formatNow, isBlankDate, isEventToday, parseEventDate, toIsoDate, toSqlDateTime } from "@/lib/dates";
import { cn, dashCardClass, glassCardClass, glassInsetClass, glassPanelClass, glassTableWrapClass, premiumCardClass, type CornerSide, type Tone } from "@/lib/utils";

type PendingObligation = {
  id: string;
  payee: string;
  desc: string;
  amount: number;
  due: string;
  payeeType: PayeeType;
};

type MadePayment = {
  id: string;
  payee: string;
  desc: string;
  amount: number;
  mode: string;
  payeeType: PayeeType;
  time: string;
  status: "Queued" | "Cleared";
  attachments?: PaymentAttachment[];
};

const MAX_PAYMENT_ATTACHMENTS = 8;
const MAX_PAYMENT_ATTACHMENT_BYTES = 5 * 1024 * 1024;

function formatAttachmentSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

const EXPENSE_CHART_COLORS = ["#0F766E", "#10B981", "#F59E0B", "#EF4444", "#64748B"];

function formatDisbursalTime(date = new Date()) {
  return formatEventDateTime(date);
}

function toIsoDateLocal(date: Date): string {
  return toIsoDate(date);
}

function toClockLocal(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Parse stored disbursal time labels back into date + clock for the picker. */
function parseDisbursalTimeParts(label: string): { date: string; clock: string } {
  const parsed = parseEventDate(label);
  const date = parsed ?? new Date();
  return { date: toIsoDateLocal(date), clock: toClockLocal(date) };
}

function formatDisbursalTimeFromParts(dateIso: string, clock: string): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  const [hh, mm] = (clock || "00:00").split(":").map(Number);
  if (!y || !m || !d) return formatDisbursalTime();
  const date = new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
  return formatDisbursalTime(date);
}

function DashboardPeriodFilter({
  period,
  onPeriodChange,
  customRange,
  onCustomRangeChange,
  className,
}: {
  period: PaymentPeriod;
  onPeriodChange: (value: PaymentPeriod) => void;
  customRange: CustomDateRange;
  onCustomRangeChange: (value: CustomDateRange) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <Select value={period} onValueChange={(value) => onPeriodChange(value as PaymentPeriod)}>
        <SelectTrigger className="h-9 w-full rounded-full border-white/70 bg-white/80 text-[12px] font-semibold shadow-sm">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {PAYMENT_PERIOD_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {period === "custom" && (
        <div className="grid grid-cols-2 gap-2">
          <DatePicker
            value={customRange.from}
            onChange={(from) => onCustomRangeChange({ ...customRange, from })}
            placeholder="From date"
            valueFormat="iso"
            variant="pill"
            max={customRange.to || undefined}
            quickPicks={[{ label: "Today", getDate: (t) => t }]}
            className="h-9 w-full"
          />
          <DatePicker
            value={customRange.to}
            onChange={(to) => onCustomRangeChange({ ...customRange, to })}
            placeholder="To date"
            valueFormat="iso"
            variant="pill"
            min={customRange.from || undefined}
            quickPicks={[{ label: "Today", getDate: (t) => t }]}
            className="h-9 w-full"
          />
        </div>
      )}
    </div>
  );
}

function dashboardValueSize(value: string): string {
  if (value.length > 13) return "text-[13px] sm:text-[15px]";
  if (value.length > 10) return "text-[15px] sm:text-[17px]";
  return "text-[17px] sm:text-[20px]";
}

const mobileOutlineBtn =
  "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-4 text-[12.5px] font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-50 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

/** Compact outline chip used in directory bulk-selection filters */
const bulkFilterBtn =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-200/90 bg-white px-2.5 text-[11.5px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-45 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

const bulkFilterBtnOverdue = cn(
  bulkFilterBtn,
  "border-[#FECACA] text-[#DC2626] hover:bg-[#FEF2F2] dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-950/40",
);

const bulkFilterBtnPaid = cn(
  bulkFilterBtn,
  "border-[#A7F3D0] text-[#059669] hover:bg-[#ECFDF5] dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-950/40",
);

const bulkFilterBtnActive = cn(
  bulkFilterBtn,
  "border-[#99F6E4] text-[#0F766E] hover:bg-[#F0FDFA] dark:border-teal-500/40 dark:text-teal-300 dark:hover:bg-teal-950/40",
);

const bulkActionDeleteBtn =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#FECACA] bg-white px-3 text-[13px] font-semibold text-[#DC2626] shadow-sm transition-colors hover:bg-[#FEF2F2] dark:border-rose-500/40 dark:bg-zinc-900 dark:text-rose-300 dark:hover:bg-rose-950/40";

const bulkActionWhatsAppBtn =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#10B981] px-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#059669]";

/** Equal-width outline actions for directory toolbars on small screens */
const directoryToolbarBtn = cn(
  mobileOutlineBtn,
  "h-8 min-w-0 flex-1 gap-1 px-1.5 text-[11px] sm:h-10 sm:flex-none sm:gap-1.5 sm:px-4 sm:text-[12.5px]",
);

const mobilePrimaryBtn =
  "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-teal-700 to-teal-800 px-4 text-[12.5px] font-semibold text-white shadow-md shadow-teal-200/40 transition-all duration-200 hover:opacity-95";

const directoryToolbarRow =
  "flex w-full min-w-0 items-center gap-1.5 sm:w-auto sm:flex-wrap sm:justify-end sm:gap-2";

function MobileCompactStat({
  label,
  value,
  icon: Icon,
  iconClass,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string | number;
  icon: typeof CheckCircle2;
  iconClass: string;
  valueClass?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 px-2.5 py-2 sm:px-3 sm:py-2.5">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-50 dark:bg-white/5">
        <Icon className={cn("h-3.5 w-3.5", iconClass)} strokeWidth={2.25} />
      </div>
      <div className="min-w-0 text-left">
        <div
          className={cn(
            "font-mono text-[16px] font-bold leading-none tracking-tight",
            valueClass,
          )}
        >
          {value}
        </div>
        <div className="mt-0.5 truncate text-[10px] font-medium leading-tight text-slate-500">
          {label}
        </div>
      </div>
    </div>
  );
}

function MobileStatsOverview({
  items,
}: {
  items: {
    label: string;
    value: string | number;
    icon: typeof CheckCircle2;
    iconClass: string;
    valueClass?: string;
  }[];
}) {
  return (
    <section className="w-full lg:hidden">
      <div
        className={cn(
          premiumCardClass,
          "grid grid-cols-3 divide-x divide-slate-100 p-0 dark:divide-white/10",
        )}
      >
        {items.map((item) => (
          <MobileCompactStat key={item.label} {...item} />
        ))}
      </div>
    </section>
  );
}

const workspacePanelClass = cn(glassCardClass, "rounded-2xl");

const DASH = {
  overview:
    "border-teal-300/40 bg-gradient-to-br from-[#CCFBF1]/90 via-[#F0FDFA] to-[#99F6E4]/70 dark:border-teal-700/35 dark:from-zinc-900 dark:via-zinc-900 dark:to-[#0F766E]/25",
  finance:
    "border-slate-200/50 bg-white/90 dark:border-white/10 dark:bg-zinc-900/90",
  outstanding:
    "border-orange-300/40 bg-gradient-to-br from-[#FFEDD5] via-[#FED7AA]/55 to-[#FECACA]/45 dark:border-orange-800/35 dark:from-zinc-900 dark:via-zinc-900 dark:to-orange-950/45",
  cash:
    "border-violet-300/40 bg-gradient-to-br from-[#EDE9FE]/90 via-[#F5F3FF] to-[#E9D5FF]/70 dark:border-violet-800/35 dark:from-zinc-900 dark:via-zinc-900 dark:to-violet-950/40",
  receive:
    "border-emerald-400/50 bg-gradient-to-br from-[#6EE7B7] via-[#A7F3D0] to-[#D1FAE5] dark:border-emerald-600/40 dark:from-emerald-950/80 dark:via-zinc-900 dark:to-emerald-900/50",
  pay:
    "border-rose-400/50 bg-gradient-to-br from-[#FDA4AF] via-[#FECDD3] to-[#FFE4E6] dark:border-rose-700/40 dark:from-rose-950/80 dark:via-zinc-900 dark:to-rose-900/45",
  todo:
    "border-teal-300/40 bg-gradient-to-br from-[#CCFBF1]/90 via-[#F0FDFA] to-[#ECFDF5]/80 dark:border-teal-700/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-[#0F766E]/15",
  notes:
    "border-violet-200/50 bg-gradient-to-br from-[#E9D5FF]/70 via-[#EDE9FE]/80 to-white/80 dark:border-violet-800/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-violet-950/30",
  admissions:
    "border-emerald-200/50 bg-gradient-to-br from-[#BBF7D0]/50 via-[#ECFDF5] to-white/85 dark:border-emerald-800/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/30",
  incomeExpense:
    "border-rose-200/50 bg-gradient-to-br from-[#FECDD3]/45 via-[#FFF1F2] to-white/85 dark:border-rose-900/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-rose-950/30",
  transactions:
    "border-teal-800/20 bg-gradient-to-br from-[#0F766E] via-[#0D9488] to-[#115E59] text-white",
} as const;

const dashboardCountClass =
  "min-w-0 max-w-full overflow-hidden font-mono font-bold leading-none tracking-tight tabular-nums text-[clamp(1.5rem,3.6vw,2.5rem)]";

function dashboardAmountSize(formatted: string, compact = false): string {
  const len = formatted.replace(/\s/g, "").length;
  if (compact) {
    if (len > 12) return "text-[11px] sm:text-[12px] md:text-[13px]";
    if (len > 10) return "text-[12px] sm:text-[13px] md:text-[14px]";
    if (len > 8) return "text-[13px] sm:text-[14px] md:text-[15px]";
    return "text-[14px] sm:text-[15px] md:text-[16px]";
  }
  if (len > 12) return "text-[12px] sm:text-[13px] md:text-[15px]";
  if (len > 10) return "text-[14px] sm:text-[15px] md:text-[17px]";
  if (len > 8) return "text-[15px] sm:text-[17px] md:text-[19px]";
  return "text-[17px] sm:text-[19px] md:text-[21px]";
}

function DashboardAmount({
  value,
  className,
  compact = false,
}: {
  value: number;
  className?: string;
  compact?: boolean;
}) {
  const formatted = formatInr(value);
  return (
    <div
      className={cn(
        "min-w-0 max-w-full overflow-hidden font-mono font-bold leading-[1.15] tracking-tight tabular-nums",
        dashboardAmountSize(formatted, compact),
        className,
      )}
      title={formatted}
    >
      <span className="block truncate">{formatted}</span>
    </div>
  );
}

type PremiumDashboardProps = {
  students: Student[];
  staff: Staff[];
  periodIncome: number;
  expenseTotal: number;
  periodPayments: Payment[];
  totalDue: number;
  salaryOutstanding: number;
  salaryOutstandingStaff: number;
  inHand: number;
  inBank: number;
  totalBalance: number;
  overdueStudents: Student[];
  recentReceipts: Payment[];
  period: PaymentPeriod;
  setPeriod: (p: PaymentPeriod) => void;
  customRange: CustomDateRange;
  setCustomRange: (r: CustomDateRange) => void;
  onReceivePayment: () => void;
  onMakePayment: () => void;
  onViewStudents: () => void;
  onAdmitStudent: () => void;
  onViewStaff: () => void;
};

/** Isolated from PremiumDashboard so typing todos/notes does not re-render charts. */
function DashboardTodoNotesPanel() {
  const { dashboardTodos, setDashboardTodos, dashboardNote, setDashboardNote } = useTenantStore();
  const [todos, setTodos] = useState(() => [...dashboardTodos]);
  const [note, setNote] = useState(dashboardNote);
  const [moreTodosOpen, setMoreTodosOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const todosRef = useRef(todos);
  const noteRef = useRef(note);
  const dirtyRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  todosRef.current = todos;
  noteRef.current = note;

  // Hydrate from store only when we are not mid-edit (avoids wiping typed text).
  useEffect(() => {
    if (dirtyRef.current) return;
    setTodos([...dashboardTodos]);
    todosRef.current = [...dashboardTodos];
  }, [dashboardTodos]);

  useEffect(() => {
    if (dirtyRef.current) return;
    setNote(dashboardNote);
    noteRef.current = dashboardNote;
  }, [dashboardNote]);

  const pushToApi = useCallback(
    (nextTodos: string[], nextNote: string, immediate = false) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const run = async () => {
        setSaving(true);
        try {
          const saved = await apiSaveDashboardTodos(nextTodos, nextNote);
          dirtyRef.current = false;
          setDashboardTodos(saved.dashboardTodos);
          setDashboardNote(saved.dashboardNote);
          setTodos([...saved.dashboardTodos]);
          todosRef.current = [...saved.dashboardTodos];
          setNote(saved.dashboardNote);
          noteRef.current = saved.dashboardNote;
          setSavedFlash(true);
          if (flashTimer.current) clearTimeout(flashTimer.current);
          flashTimer.current = setTimeout(() => setSavedFlash(false), 1500);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Save failed";
          toast.error("Could not save tasks / notes", { description: msg });
        } finally {
          setSaving(false);
        }
      };
      if (immediate) {
        void run();
        return;
      }
      saveTimer.current = setTimeout(() => {
        void run();
      }, 500);
    },
    [setDashboardTodos, setDashboardNote],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      if (dirtyRef.current) {
        void apiSaveDashboardTodos(todosRef.current, noteRef.current).catch(() => {});
      }
    };
  }, []);

  const persistTodos = (next: string[]) => {
    dirtyRef.current = true;
    setTodos(next);
    todosRef.current = next;
    setDashboardTodos(next);
    pushToApi(next, noteRef.current);
  };

  const updateTodo = (index: number, value: string) => {
    dirtyRef.current = true;
    const next = [...todosRef.current];
    next[index] = value;
    todosRef.current = next;
    setTodos(next);
    pushToApi(next, noteRef.current);
  };

  const flushTodos = () => {
    dirtyRef.current = true;
    const next = todosRef.current;
    setDashboardTodos(next);
    pushToApi(next, noteRef.current, true);
  };

  const onNoteChange = (value: string) => {
    dirtyRef.current = true;
    setNote(value);
    noteRef.current = value;
    pushToApi(todosRef.current, value);
  };

  const flushNote = () => {
    dirtyRef.current = true;
    const nextNote = noteRef.current;
    setDashboardNote(nextNote);
    pushToApi(todosRef.current, nextNote, true);
  };

  const addTodo = () => {
    if (todos.length >= 20) {
      toast.error("Maximum 20 tasks reached");
      return;
    }
    if (todos.length >= 4) setMoreTodosOpen(true);
    persistTodos([...todos, ""]);
  };

  const removeTodo = (index: number) => {
    const next =
      todos.length <= 1 ? [""] : todos.filter((_, i) => i !== index);
    persistTodos(next);
  };

  const visibleTodos = todos.slice(0, 4);
  const overflowTodos = todos.slice(4);

  return (
    <section className={cn(dashCardClass, DASH.todo, "flex min-h-0 flex-1 flex-col p-4 sm:p-5")}>
      <div className="flex items-center justify-between gap-2">
        <DashboardPanelHeading icon={ListTodo} title="To Do List" />
        <div className="flex items-center gap-2">
          {saving ? (
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Saving…
            </span>
          ) : savedFlash ? (
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#0F766E]">
              Saved
            </span>
          ) : null}
          <button
            type="button"
            onClick={addTodo}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-2.5 text-[11px] font-semibold text-white shadow-sm shadow-teal-700/25 transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Add
          </button>
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        {visibleTodos.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-slate-300/80 bg-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            </span>
            <Input
              value={item}
              onChange={(e) => updateTodo(index, e.target.value)}
              onBlur={flushTodos}
              placeholder={`Task ${index + 1}`}
              className="h-9 flex-1 rounded-xl border-white/60 bg-white/70 shadow-sm"
            />
            <button
              type="button"
              onClick={() => removeTodo(index)}
              aria-label={`Remove task ${index + 1}`}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-[#FEE2E2] hover:text-[#EF4444]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {overflowTodos.length > 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setMoreTodosOpen((open) => !open)}
              aria-expanded={moreTodosOpen}
              className="flex h-9 w-full items-center justify-between gap-2 rounded-xl bg-white/55 px-3 text-left text-[12px] font-semibold text-slate-700 transition-colors hover:bg-white/75 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
            >
              <span>
                {moreTodosOpen
                  ? "Hide extra tasks"
                  : `${overflowTodos.length} more task${overflowTodos.length === 1 ? "" : "s"}`}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-slate-500 transition-transform dark:text-zinc-400",
                  moreTodosOpen && "rotate-180",
                )}
              />
            </button>
            {moreTodosOpen && (
              <div className="mt-2 space-y-2.5 rounded-xl bg-white/50 p-2.5 dark:bg-white/5 dark:ring-1 dark:ring-white/10">
                {overflowTodos.map((item, overflowIndex) => {
                  const index = overflowIndex + 4;
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-slate-300/80 bg-white/60 dark:border-white/20 dark:bg-white/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-zinc-500" />
                      </span>
                      <Input
                        value={item}
                        onChange={(e) => updateTodo(index, e.target.value)}
                        onBlur={flushTodos}
                        placeholder={`Task ${index + 1}`}
                        className="h-9 flex-1 rounded-xl border-white/60 bg-white/70 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-100"
                      />
                      <button
                        type="button"
                        onClick={() => removeTodo(index)}
                        aria-label={`Remove task ${index + 1}`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-[#FEE2E2] hover:text-[#EF4444] dark:text-zinc-500 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={cn(DASH.notes, "mt-5 flex min-h-0 flex-1 flex-col rounded-2xl border p-3.5 sm:p-4")}>
        <DashboardPanelHeading icon={StickyNote} title="Notes" />
        <Textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          onBlur={flushNote}
          placeholder="Write a quick note for today..."
          className="mt-3 min-h-[72px] w-full flex-1 resize-none rounded-xl border-white/60 bg-white/65"
        />
      </div>
    </section>
  );
}

function PremiumDashboard({
  students,
  staff,
  periodIncome,
  expenseTotal,
  periodPayments,
  totalDue,
  salaryOutstanding,
  salaryOutstandingStaff,
  inHand,
  inBank,
  totalBalance,
  overdueStudents,
  recentReceipts,
  period,
  setPeriod,
  customRange,
  setCustomRange,
  onReceivePayment,
  onMakePayment,
  onViewStudents,
  onAdmitStudent,
  onViewStaff,
}: PremiumDashboardProps) {
  const liveStudents = students.filter((s) => !isRecordDeleted(s.deletedAt));
  const liveStaff = staff.filter((s) => !isRecordDeleted(s.deletedAt));
  const paidCount = liveStudents.filter((s) => s.due === 0).length;
  const activeStaff = liveStaff.filter((s) => s.active).length;

  const admissionWeeks = useMemo(() => {
    const count = liveStudents.length;
    // Never invent admissions — empty school must show 0 across the chart.
    if (count === 0) {
      return [
        { label: "W1", value: 0 },
        { label: "W2", value: 0 },
        { label: "W3", value: 0 },
        { label: "W4", value: 0 },
        { label: "W5", value: 0 },
      ];
    }
    // Spread the real enrolment count across weeks (no fake inflation).
    const base = Math.floor(count / 5);
    const rem = count % 5;
    return [0, 1, 2, 3, 4].map((i) => ({
      label: `W${i + 1}`,
      value: base + (i < rem ? 1 : 0),
    }));
  }, [liveStudents.length]);

  const incomeExpenseWeeks = useMemo(
    () => buildIncomeExpenseSeries(periodPayments, expenseTotal, period, customRange),
    [periodPayments, expenseTotal, period, customRange],
  );

  const newAdmissions = liveStudents.length;

  const admissionChartConfig = {
    value: { label: "Admissions", color: "#10B981" },
  } satisfies ChartConfig;

  const incomeExpenseChartConfig = {
    income: { label: "Income", color: "#10B981" },
    expense: { label: "Expense", color: "#EF4444" },
  } satisfies ChartConfig;

  const periodLabel =
    PAYMENT_PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "This Month";

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-12">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:col-span-8">
          {/* School Overview */}
          <section className={cn(dashCardClass, DASH.overview, "flex min-w-0 flex-col p-4 sm:p-5")}>
            <DashboardPanelHeading icon={Users} title="School Overview" />
            <div className="mt-4 grid min-w-0 flex-1 grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onViewStudents}
                className="flex min-h-[120px] min-w-0 flex-col overflow-hidden rounded-2xl bg-white/55 p-3 text-center shadow-sm shadow-sky-200/40 transition-colors hover:bg-white/75 sm:min-h-[128px] sm:p-4"
              >
                <div className="flex items-start justify-between gap-2 text-left">
                  <span className="text-[12px] font-medium text-slate-600 dark:text-zinc-300">Total Students</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#99F6E4]/80">
                    <GraduationCap className="h-4 w-4 text-[#0F766E]" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center">
                  <div className={cn(dashboardCountClass, "text-slate-900")}>
                    {liveStudents.length}
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-[#059669] dark:text-emerald-400">
                    {paidCount} paid · {liveStudents.length - paidCount} overdue
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={onViewStaff}
                className="flex min-h-[120px] min-w-0 flex-col overflow-hidden rounded-2xl bg-white/55 p-3 text-center shadow-sm shadow-sky-200/40 transition-colors hover:bg-white/75 sm:min-h-[128px] sm:p-4"
              >
                <div className="flex items-start justify-between gap-2 text-left">
                  <span className="text-[12px] font-medium text-slate-600">Total Staff</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-orange-100">
                    <Briefcase className="h-4 w-4 text-orange-500" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center">
                  <div className={cn(dashboardCountClass, "text-slate-900")}>
                    {liveStaff.length}
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-slate-500">
                    {activeStaff} active · {liveStaff.length - activeStaff} inactive
                  </div>
                </div>
              </button>
            </div>
            <button
              type="button"
              onClick={onAdmitStudent}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-3 py-2.5 text-[12.5px] font-semibold text-white shadow-md shadow-teal-700/25 transition-opacity hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Admit a Student
            </button>
          </section>

          {/* Financial Summary */}
          <section className={cn(dashCardClass, DASH.finance, "flex min-w-0 flex-col p-4 sm:p-5")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <DashboardPanelHeading icon={Wallet} title="Financial Summary" />
              <div className="w-full max-w-[148px] shrink-0 sm:w-[148px]">
                <DashboardPeriodFilter
                  period={period}
                  onPeriodChange={setPeriod}
                  customRange={customRange}
                  onCustomRangeChange={setCustomRange}
                />
              </div>
            </div>
            <div className="mt-4 grid min-w-0 flex-1 grid-cols-2 gap-2 sm:gap-3">
              <div className="flex min-h-[104px] min-w-0 flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#059669] to-[#047857] px-2.5 py-3.5 text-center text-white shadow-md shadow-emerald-600/20 dark:from-emerald-950 dark:to-emerald-900 dark:shadow-none dark:ring-1 dark:ring-emerald-700/40 sm:min-h-[112px] sm:px-3.5 sm:py-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 dark:text-emerald-300/80">
                  Total Income
                </div>
                <DashboardAmount value={periodIncome} className="mt-2 w-full text-center text-white" />
              </div>
              <div className="flex min-h-[104px] min-w-0 flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#DC2626] to-[#B91C1C] px-2.5 py-3.5 text-center text-white shadow-md shadow-red-600/20 dark:from-rose-950 dark:to-rose-900 dark:shadow-none dark:ring-1 dark:ring-rose-700/40 sm:min-h-[112px] sm:px-3.5 sm:py-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-red-100 dark:text-rose-300/80">
                  Total Expense
                </div>
                <DashboardAmount value={expenseTotal} className="mt-2 w-full text-center text-white" />
              </div>
            </div>
          </section>

          {/* Outstanding Payments */}
          <section className={cn(dashCardClass, DASH.outstanding, "flex min-w-0 flex-col p-4 sm:p-5")}>
            <DashboardPanelHeading icon={HandCoins} title="Outstanding Payments" />
            <div className="mt-4 grid min-w-0 flex-1 grid-cols-1 gap-3">
              <div className="flex min-h-[96px] min-w-0 flex-col justify-between overflow-hidden rounded-2xl bg-white/55 p-3.5 shadow-sm shadow-orange-200/30 sm:min-h-[100px] sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 text-[12px] font-medium text-slate-600">Fee Outstanding</span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#FED7AA]/80">
                    <HandCoins className="h-4 w-4 text-orange-600" />
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500">
                    {overdueStudents.length} students
                  </div>
                  <DashboardAmount value={totalDue} className="mt-1 text-slate-900" />
                </div>
              </div>
              <div className="flex min-h-[96px] min-w-0 flex-col justify-between overflow-hidden rounded-2xl bg-white/55 p-3.5 shadow-sm shadow-orange-200/30 sm:min-h-[100px] sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 text-[12px] font-medium text-slate-600">Salary Outstanding</span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100">
                    <Banknote className="h-4 w-4 text-amber-600" />
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500">
                    {salaryOutstandingStaff > 0
                      ? `${salaryOutstandingStaff} queued`
                      : "No payroll created"}
                  </div>
                  <DashboardAmount value={salaryOutstanding} className="mt-1 text-slate-900" />
                </div>
              </div>
            </div>
          </section>

          {/* Cash Position */}
          <section className={cn(dashCardClass, DASH.cash, "flex min-w-0 flex-col p-4 sm:p-5")}>
            <DashboardPanelHeading icon={Landmark} title="Cash Position" />
            <div className="mt-4 grid min-w-0 flex-1 grid-cols-2 gap-2 sm:gap-3">
              <div className="flex min-h-[84px] min-w-0 flex-col justify-between overflow-hidden rounded-2xl bg-white/55 p-2.5 shadow-sm shadow-violet-200/30 sm:p-3.5">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="min-w-0 truncate text-[11px] font-medium text-slate-600 sm:text-[12px]">
                    Cash In Hand
                  </span>
                  <Banknote className="h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                </div>
                <DashboardAmount value={inHand} compact className="text-slate-900" />
              </div>
              <div className="flex min-h-[84px] min-w-0 flex-col justify-between overflow-hidden rounded-2xl bg-white/55 p-2.5 shadow-sm shadow-violet-200/30 sm:p-3.5">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="min-w-0 truncate text-[11px] font-medium text-slate-600 sm:text-[12px]">
                    Bank Balance
                  </span>
                  <Landmark className="h-3.5 w-3.5 shrink-0 text-violet-600" />
                </div>
                <DashboardAmount value={inBank} compact className="text-slate-900" />
              </div>
              <div className="col-span-2 flex min-h-[84px] min-w-0 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-[#6366F1]/20 via-[#A78BFA]/25 to-[#818CF8]/20 p-3.5 ring-1 ring-violet-200/40 dark:from-violet-950/50 dark:via-zinc-900 dark:to-indigo-950/40 dark:ring-violet-800/30 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[12px] font-semibold text-slate-700 dark:text-zinc-200">Total Balance</span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/80 dark:bg-white/10">
                    <Wallet className="h-4 w-4 text-[#4F46E5] dark:text-violet-300" />
                  </span>
                </div>
                <DashboardAmount value={totalBalance} className="text-slate-900 dark:text-zinc-50" />
              </div>
            </div>
          </section>
        </div>

        {/* Right column */}
        <aside className="flex min-h-0 flex-col gap-4 sm:gap-5 xl:col-span-4">
          <section className="grid shrink-0 grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onReceivePayment}
              className={cn(
                dashCardClass,
                DASH.receive,
                "flex min-h-[96px] flex-col items-start gap-3 p-4 text-left transition-transform hover:-translate-y-0.5",
              )}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/80 shadow-sm dark:bg-white/10">
                <ArrowDownToLine className="h-5 w-5 text-[#047857] dark:text-[#34D399]" />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-bold leading-snug text-emerald-950 dark:text-emerald-50">
                  Receive payment
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-emerald-900/65 dark:text-emerald-100/60">
                  Capture inbound fee receipts
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={onMakePayment}
              className={cn(
                dashCardClass,
                DASH.pay,
                "flex min-h-[96px] flex-col items-start gap-3 p-4 text-left transition-transform hover:-translate-y-0.5",
              )}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/80 shadow-sm dark:bg-white/10">
                <ArrowUpFromLine className="h-5 w-5 text-[#BE123C] dark:text-[#FB7185]" />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-bold leading-snug text-rose-950 dark:text-rose-50">
                  Make payment
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-rose-900/65 dark:text-rose-100/60">
                  Pay salaries and suppliers
                </p>
              </div>
            </button>
          </section>

          <DashboardTodoNotesPanel />
        </aside>

        {/* Bottom row */}
        <section className={cn(dashCardClass, DASH.admissions, "flex flex-col p-4 sm:p-5 xl:col-span-4")}>
          <div className="flex items-center justify-between gap-3">
            <DashboardPanelHeading icon={GraduationCap} title="Student Admissions" />
            <span className="rounded-full bg-emerald-100/80 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
              {periodLabel}
            </span>
          </div>
          <ChartContainer config={admissionChartConfig} className="mt-4 h-[160px] w-full">
            <AreaChart data={admissionWeeks} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="admissionFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="rgba(15,23,42,0.06)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#64748B" }}
              />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2.5}
                fill="url(#admissionFill)"
                dot={{ r: 3, fill: "#10B981", strokeWidth: 0 }}
              />
            </AreaChart>
          </ChartContainer>
          <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-2xl bg-white/55 p-4 text-center shadow-sm">
            <div className="text-[13px] font-medium text-slate-500">New Admissions</div>
            <div className={cn(dashboardCountClass, "mt-2 text-slate-900")}>{newAdmissions}</div>
          </div>
        </section>

        <section className={cn(dashCardClass, DASH.incomeExpense, "flex flex-col p-4 sm:p-5 xl:col-span-4")}>
          <div className="flex items-center justify-between gap-3">
            <DashboardPanelHeading icon={TrendingUp} title="Income vs Expense" />
            <span className="rounded-full bg-rose-100/80 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
              {periodLabel}
            </span>
          </div>
          <ChartContainer config={incomeExpenseChartConfig} className="mt-4 h-[160px] w-full">
            <AreaChart data={incomeExpenseWeeks} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="rgba(15,23,42,0.06)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#64748B" }}
              />
              <YAxis hide />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      formatInr(Number(value)),
                      String(name) === "income" ? "Income" : "Expense",
                    ]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="var(--color-expense)"
                strokeWidth={2}
                fill="url(#expenseFill)"
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="var(--color-income)"
                strokeWidth={2}
                fill="url(#incomeFill)"
              />
            </AreaChart>
          </ChartContainer>
          <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
            <div className="flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#D1FAE5]/70 px-2 py-3.5 text-center sm:px-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/80">
                Total Income
              </div>
              <DashboardAmount value={periodIncome} compact className="mt-1.5 w-full text-center text-emerald-800" />
            </div>
            <div className="flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#FEE2E2]/70 px-2 py-3.5 text-center sm:px-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700/80">
                Total Expense
              </div>
              <DashboardAmount value={expenseTotal} compact className="mt-1.5 w-full text-center text-rose-800" />
            </div>
          </div>
        </section>

        <section className={cn(dashCardClass, DASH.transactions, "flex flex-col p-4 sm:p-5 xl:col-span-4")}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15">
                <ArrowDownToLine className="h-4 w-4 text-teal-100" strokeWidth={2} />
              </span>
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-white">
                Recent Transactions
              </h3>
            </div>
            <Link
              to="/tenant/finance"
              search={{ tab: "receive" }}
              className="text-[12px] font-semibold text-teal-100 hover:text-white hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="mt-4 flex-1 divide-y divide-white/10">
            {recentReceipts.length === 0 && (
              <div className="py-6 text-center text-[12px] text-teal-100/70">No receipts logged yet</div>
            )}
            {recentReceipts.map((payment) => (
              <div key={payment.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15">
                  <ArrowUpRight className="h-4 w-4 text-emerald-300" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-white">{payment.name}</div>
                  <div className="mt-0.5 text-[11px] text-teal-100/70">
                    {payment.cat} · {payment.mode}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[13px] font-semibold text-white">
                    {formatInr(payment.amount)}
                  </div>
                  <div className="mt-0.5 text-[10px] text-teal-100/60">{formatEventDateTime(payment.time)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function DashboardPanelHeading({
  icon: Icon,
  title,
}: {
  icon: typeof Users;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/75 shadow-sm shadow-slate-200/50 dark:bg-white/10 dark:shadow-none">
        <Icon className="h-4 w-4 text-slate-700 dark:text-zinc-200" strokeWidth={2} />
      </span>
      <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
        {title}
      </h3>
    </div>
  );
}

function DashboardStatGrid({
  children,
  className,
  columns = 2,
}: {
  children: ReactNode;
  className?: string;
  columns?: 2 | 4;
}) {
  return (
    <div
      className={cn(
        "grid auto-rows-fr grid-cols-2 gap-2 sm:gap-3",
        columns === 4 && "lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

function DashboardSectionHeading({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400 sm:text-[12px]",
        className,
      )}
    >
      {title}
    </h2>
  );
}

function DashboardMetricsBand({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-2 sm:space-y-3", className)}>{children}</div>;
}

function DashboardStatCard({
  label,
  value,
  tone = "white",
  className,
}: {
  label: string;
  value: string;
  tone?: Tone;
  className?: string;
}) {
  const isHighlight = tone === "lime";

  return (
    <OrganicCard
      tone={tone}
      cornerSide="tr"
      padded={false}
      className={cn(
        "flex h-[92px] w-full min-w-0 flex-col justify-start p-3 sm:h-[100px] sm:p-4 lg:h-[104px]",
        className,
      )}
    >
      <div
        className={cn(
          "text-[10px] font-semibold uppercase leading-snug tracking-wider",
          isHighlight ? "text-white/75" : "text-black/45",
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "mt-auto min-w-0 font-mono font-semibold leading-none tracking-tight tabular-nums",
          isHighlight ? "text-white" : "text-black",
          dashboardValueSize(value),
        )}
      >
        <span className="block truncate">{value}</span>
      </div>
    </OrganicCard>
  );
}

export function SchoolDashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const {
    activeStudents: students,
    staff,
    activePayments: payments,
    academicYear,
    hydrated,
    branchSyncing,
    activeBranch,
    branches,
  } = useTenantStore();
  const tenantScope = `${session?.tenantId ?? session?.tenantName ?? "tenant"}|${academicYear}`;
  const { disbursements, loaded: disbursementsLoaded } = useDisbursements(
    tenantScope,
    hydrated && !branchSyncing,
  );

  const [period, setPeriod] = useState<PaymentPeriod>("this_month");
  const [customRange, setCustomRange] = useState<CustomDateRange>({ from: "", to: "" });

  const liveStudents = students.filter((s) => !isRecordDeleted(s.deletedAt));
  const liveStaff = staff.filter((s) => !isRecordDeleted(s.deletedAt));
  const totalDue = liveStudents.reduce((acc, s) => acc + s.due, 0);
  const overdueStudents = liveStudents.filter((s) => s.due > 0);

  const filteredPayments = useMemo(
    () => filterPaymentsByPeriod(payments, period, customRange),
    [payments, period, customRange],
  );

  const periodIncome = useMemo(
    () => filteredPayments.reduce((acc, p) => acc + p.amount, 0),
    [filteredPayments],
  );

  const inHand = useMemo(() => cashOnHand(payments), [payments]);
  const inBank = useMemo(() => bankBalance(payments), [payments]);
  const totalBalance = inHand + inBank;
  const expenseTotal = useMemo(
    () => operatingExpenseForPeriod(disbursements, period, customRange),
    [disbursements, period, customRange],
  );
  const salaryOutstandingRows = useMemo(
    () => queuedSalaryPayables(disbursements),
    [disbursements],
  );
  const salaryOutstanding = useMemo(
    () => salaryPayable(disbursements),
    [disbursements],
  );

  const recentReceipts = useMemo(() => filteredPayments.slice(0, 5), [filteredPayments]);

  if (!hydrated || branchSyncing || !disbursementsLoaded) {
    return <TenantDashboardSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="hidden flex-wrap items-center justify-between gap-2 rounded-2xl border border-teal-500/20 bg-teal-500/5 px-3.5 py-2.5 dark:border-teal-400/20 dark:bg-teal-400/10 md:flex">
        <p className="text-[12.5px] font-medium text-slate-700 dark:text-zinc-200">
          Books open for <span className="font-semibold text-teal-800 dark:text-teal-300">{academicYear}</span>
          {branches.length > 1 && activeBranch?.name ? (
            <>
              {" "}
              · <span className="font-semibold text-teal-800 dark:text-teal-300">{activeBranch.name}</span>
            </>
          ) : null}
        </p>
        <p className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
          {liveStudents.length} enrolled · {payments.length} receipt{payments.length === 1 ? "" : "s"}
        </p>
      </div>
      <PremiumDashboard
        students={students}
        staff={staff}
        periodIncome={periodIncome}
        expenseTotal={expenseTotal}
        periodPayments={filteredPayments}
        totalDue={totalDue}
        salaryOutstanding={salaryOutstanding}
        salaryOutstandingStaff={salaryOutstandingRows.length}
        inHand={inHand}
        inBank={inBank}
        totalBalance={totalBalance}
        overdueStudents={overdueStudents}
        recentReceipts={recentReceipts}
        period={period}
        setPeriod={setPeriod}
        customRange={customRange}
        setCustomRange={setCustomRange}
        onReceivePayment={() => navigate({ to: "/tenant/finance", search: { tab: "receive" } })}
        onMakePayment={() => navigate({ to: "/tenant/finance", search: { tab: "make" } })}
        onViewStudents={() => navigate({ to: "/tenant/students" })}
        onAdmitStudent={() => navigate({ to: "/tenant/students/admit" })}
        onViewStaff={() => navigate({ to: "/tenant/staff" })}
      />
    </div>
  );
}

type StatusFilter = "all" | "paid" | "overdue";
type EnrollmentFilter = "all" | "active" | "inactive";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All Students" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" },
];

function parseClassDivision(className: string) {
  const dash = className.lastIndexOf(" - ");
  if (dash === -1) {
    return { grade: className.trim(), division: null as string | null };
  }
  return {
    grade: className.slice(0, dash).trim(),
    division: className.slice(dash + 3).trim() || null,
  };
}

function studentMatchesClassDivisionFilter(
  cls: string,
  gradeFilter: string,
  divisionFilter: string,
) {
  const { grade, division } = parseClassDivision(cls);
  if (gradeFilter !== "all" && grade !== gradeFilter) return false;
  if (divisionFilter !== "all" && division !== divisionFilter) return false;
  return true;
}

function normalizeClassKey(className: string) {
  return className
    .trim()
    .toLowerCase()
    .replace(/\s*[-–—]\s*/g, "-")
    .replace(/\s+/g, " ");
}

/** True when the student is enrolled in the selected class (grade + section). */
function studentBelongsToClass(studentCls: string, selectedClass: string) {
  const selected = selectedClass.trim();
  const enrolled = studentCls.trim();
  if (!selected || !enrolled) return false;
  if (normalizeClassKey(enrolled) === normalizeClassKey(selected)) return true;
  const student = parseClassDivision(enrolled);
  const target = parseClassDivision(selected);
  if (student.grade.toLowerCase() !== target.grade.toLowerCase()) return false;
  if (!target.division) return true;
  if (!student.division) return false;
  return student.division.toLowerCase() === target.division.toLowerCase();
}

function buildClassDivisionIndex(classNames: string[]) {
  const gradeMap = new Map<string, Set<string>>();
  for (const name of classNames) {
    const { grade, division } = parseClassDivision(name);
    if (!grade) continue;
    if (!gradeMap.has(grade)) gradeMap.set(grade, new Set());
    if (division) gradeMap.get(grade)!.add(division);
  }
  return gradeMap;
}

const phoneDigits = (raw?: string) => (raw ?? "").replace(/[^0-9]/g, "");

const formatPhone = (raw?: string) => {
  const d = phoneDigits(raw);
  if (!d) return "";
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  if (d.length === 12 && d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return d;
};

type AdmitStudentForm = {
  name: string;
  cls: string;
  guardian: string;
  phone: string;
};

function emptyAdmitForm(cls: string): AdmitStudentForm {
  return {
    name: "",
    cls,
    guardian: "",
    phone: "",
  };
}

const admitTodayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function personInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const directoryStatCardClass =
  "flex min-w-0 w-full flex-row items-center justify-between gap-2 p-2.5 md:min-h-[108px] md:flex-col md:items-stretch md:justify-between md:p-6";
const directoryStatLabelClass =
  "text-[8px] font-semibold uppercase leading-tight tracking-wider md:text-[10px]";
const directoryStatValueClass =
  "shrink-0 font-mono text-[18px] font-semibold leading-none tracking-tight text-black dark:text-zinc-50 md:text-[32px]";

function DirectoryPersonAvatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  return (
    <ProfileAvatar
      name={name}
      photoUrl={photoUrl}
      alt=""
      className="h-9 w-9 shrink-0 rounded-lg sm:h-10 sm:w-10"
      imgClassName="object-cover ring-1 ring-black/5"
      initialsClassName="bg-[#0F766E] text-[11px] sm:text-[12px]"
    />
  );
}

const directoryMobileListClass =
  "grid w-full min-w-0 max-w-full grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3";

const directoryMobileCardClass = cn(
  premiumCardClass,
  "flex w-full min-w-0 max-w-full flex-col gap-2.5 overflow-hidden p-3 text-left transition-all active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 sm:gap-3 sm:p-3.5",
);

const directoryMintChipClass =
  "inline-flex max-w-full truncate rounded-full bg-[#CCFBF1] px-2 py-0.5 text-[10px] font-semibold text-[#0F172A] dark:bg-[#0F766E]/30 dark:text-[#5EEAD4] sm:px-2.5 sm:py-1 sm:text-[10.5px]";

const directoryEmptyClass = cn(
  premiumCardClass,
  "border-dashed px-4 py-10 text-center text-[13px] text-slate-500",
);

function DirectoryFloatingAddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r from-teal-700 to-teal-800 text-white shadow-xl shadow-teal-900/30 transition-all duration-200 hover:opacity-95 active:scale-95 md:hidden"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </button>
  );
}

function FinanceFloatingPaymentActions({
  onReceive,
  onMake,
}: {
  onReceive: () => void;
  onMake: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 px-3 md:hidden">
      <div
        role="tablist"
        aria-label="Payment actions"
        className="pointer-events-auto mx-auto flex max-w-lg gap-1 rounded-2xl border border-white/70 bg-white/90 p-1.5 shadow-[0_16px_40px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-[#171717]/92 dark:shadow-black/50"
      >
        <button
          type="button"
          role="tab"
          onClick={onReceive}
          aria-label="Receive payment"
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#059669] px-3 text-[12.5px] font-semibold text-white shadow-sm shadow-emerald-900/20 transition-transform active:scale-[0.98] dark:bg-[#10B981] dark:text-zinc-950"
        >
          <ArrowDownToLine className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          <span className="truncate">Receive</span>
        </button>
        <button
          type="button"
          role="tab"
          onClick={onMake}
          aria-label="Make payment"
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-3 text-[12.5px] font-semibold text-white shadow-sm shadow-rose-900/20 transition-transform active:scale-[0.98] dark:bg-[#EF4444] dark:text-zinc-950"
        >
          <ArrowUpFromLine className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          <span className="truncate">Make</span>
        </button>
      </div>
    </div>
  );
}

function DirectoryBulkActionBar({
  selectedCount,
  filters,
  actions,
  className,
}: {
  selectedCount: number;
  filters: ReactNode;
  actions: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-slate-100/80 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-8 items-center rounded-lg bg-[#F0FDFA] px-2.5 text-[12px] font-semibold text-[#0F766E] ring-1 ring-[#99F6E4]/60 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-500/30">
            {selectedCount} selected
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">{filters}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
    </div>
  );
}

function DirectoryRecycleBinList({
  items,
  emptyLabel,
  subtitleFor,
  onRestore,
  onPurge,
}: {
  items: { id: string; name: string; photoUrl?: string; deletedAt?: string }[];
  emptyLabel: string;
  subtitleFor: (item: { id: string; name: string; deletedAt?: string }) => string;
  onRestore: (id: string) => void;
  onPurge: (id: string) => void;
}) {
  if (items.length === 0) {
    return <div className={directoryEmptyClass}>{emptyLabel}</div>;
  }

  return (
    <div className={directoryMobileListClass}>
      {items.map((item) => {
        const deletedLabel = item.deletedAt
          ? formatInAppZone(new Date(item.deletedAt), {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "Deleted";
        return (
          <div
            key={item.id}
            className={cn(directoryMobileCardClass, "cursor-default sm:flex-row sm:items-center sm:justify-between")}
          >
            <div className="flex min-w-0 items-center gap-3">
              <DirectoryPersonAvatar name={item.name} photoUrl={item.photoUrl} />
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold leading-tight text-black">
                  {item.name}
                </div>
                <div className="mt-0.5 truncate font-mono text-[10.5px] text-black/45">
                  {subtitleFor(item)}
                </div>
                <div className="mt-1 text-[11px] text-black/40">Deleted {deletedLabel}</div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => onRestore(item.id)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#99F6E4] bg-[#F0FDFA] px-3 text-[12px] font-semibold text-[#0F766E] transition-colors hover:bg-[#CCFBF1]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore
              </button>
              <button
                type="button"
                onClick={() => onPurge(item.id)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-3 text-[12px] font-semibold text-[#EF4444] transition-colors hover:bg-[#FEE2E2]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StudentFeesStatusBadge({ due }: { due: number }) {
  if (due === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#CCFBF1] px-2.5 py-1 text-[10.5px] font-semibold text-[#10B981] dark:bg-[#0F766E]/30 dark:text-[#5EEAD4]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] dark:bg-[#2DD4BF]" />
        Paid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] px-2.5 py-1 text-[10.5px] font-semibold text-[#EF4444] dark:bg-rose-950/50 dark:text-[#FDA4AF]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444] dark:bg-[#FB7185]" />
      Overdue
    </span>
  );
}

function DirectoryEnrollmentStatusControl({
  active,
  onChange,
}: {
  active: boolean;
  onChange: (nextActive: boolean) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          aria-label={`Change status · currently ${active ? "Active" : "Inactive"}`}
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-1"
        >
          <EnrollmentStatusBadge active={active} className="cursor-pointer hover:opacity-90" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        collisionPadding={12}
        className="z-[250] w-40 rounded-lg border-[#E5E5E5] bg-white p-1 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem
          className="cursor-pointer rounded-md text-[13px]"
          disabled={active}
          onClick={() => onChange(true)}
        >
          Active
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer rounded-md text-[13px]"
          disabled={!active}
          onClick={() => onChange(false)}
        >
          Inactive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StudentsDirectoryTable({
  students,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onViewProfile,
  onEditData,
  onChangeStatus,
  bulkBar,
}: {
  students: Student[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string, selected: boolean) => void;
  onToggleSelectAll: (selected: boolean) => void;
  onViewProfile: (id: string) => void;
  onEditData: (id: string) => void;
  onChangeStatus: (id: string, nextActive: boolean) => void;
  bulkBar?: ReactNode;
}) {
  const allSelected = students.length > 0 && students.every((s) => selectedIds.has(s.id));
  const someSelected = students.some((s) => selectedIds.has(s.id));

  return (
    <>
      <div className="space-y-3 lg:hidden">
        {bulkBar ? (
          <div className={cn(glassCardClass, "overflow-hidden p-0")}>{bulkBar}</div>
        ) : null}
      <div className={cn(directoryMobileListClass)}>
        {students.length > 0 && (
          <div className="flex items-center gap-2 px-0.5 md:col-span-2">
            <Checkbox
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={(v) => onToggleSelectAll(v === true)}
              aria-label="Select all students"
            />
            <span className="text-[12px] font-medium text-slate-500">
              {allSelected ? "All selected" : someSelected ? `${selectedIds.size} selected` : "Select all"}
            </span>
          </div>
        )}
        {students.length === 0 && (
          <div className={cn(directoryEmptyClass, "md:col-span-2")}>
            No students enrolled for this academic year.
          </div>
        )}
        {students.map((student) => {
          const digits = phoneDigits(student.phone);
          const hasPhone = digits.length > 0;
          const waHref = `https://wa.me/${digits.length === 10 ? "91" : ""}${digits}`;
          const isSelected = selectedIds.has(student.id);
          const isActive = isRecordActive(student.active);
          return (
            <div
              key={student.id}
              role="button"
              tabIndex={0}
              onClick={() => onViewProfile(student.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onViewProfile(student.id);
                }
              }}
              aria-label={`Open profile for ${student.name}`}
              className={cn(
                directoryMobileCardClass,
                "cursor-pointer",
                isSelected && "ring-2 ring-[#0F766E]/35",
              )}
            >
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="shrink-0"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(v) => onToggleSelect(student.id, v === true)}
                      aria-label={`Select ${student.name}`}
                    />
                  </div>
                  <DirectoryPersonAvatar name={student.name} photoUrl={student.photoUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold leading-tight text-slate-900 dark:text-zinc-100 sm:text-[14px]">
                      {student.name}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[10px] text-slate-400 dark:text-zinc-500 sm:text-[10.5px]">
                      {student.id}
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <StudentFeesStatusBadge due={student.due} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className={directoryMintChipClass}>{student.cls}</span>
                <DirectoryEnrollmentStatusControl
                  active={isActive}
                  onChange={(next) => onChangeStatus(student.id, next)}
                />
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[#F0F0F0] pt-2 dark:border-white/10 sm:pt-2.5">
                <div className="min-w-0">
                  <div className="truncate text-[11.5px] font-medium text-black/75 dark:text-zinc-300 sm:text-[12px]">
                    {student.guardian}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[10px] text-black/45 dark:text-zinc-500 sm:text-[10.5px]">
                    {hasPhone ? formatPhone(student.phone) : "No contact on file"}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <ContactAction
                    icon={Phone}
                    label="Call"
                    accent="ink"
                    disabled={!hasPhone}
                    onClick={() => {
                      window.location.href = `tel:${digits}`;
                    }}
                  />
                  <ContactAction
                    icon={MessageCircle}
                    label="WhatsApp"
                    accent="emerald"
                    disabled={!hasPhone}
                    onClick={() => {
                      window.open(waHref, "_blank", "noopener,noreferrer");
                      toast.success(`WhatsApp opened for ${student.guardian}`);
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>

      <div className="mobile-scrollbar-none hidden w-full max-w-full overflow-x-auto lg:block">
        <div className={glassTableWrapClass}>
          {bulkBar}
      <table className="w-full min-w-[900px] table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[44px]" />
          <col className="w-[20%]" />
          <col className="w-[15%]" />
          <col className="w-[12%]" />
          <col className="w-[21%]" />
          <col className="w-[28%]" />
        </colgroup>
        <thead>
          <tr>
            <th className="border-b border-slate-100 px-3 pb-4 pt-4 sm:px-4 lg:px-5 sm:pt-5">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={(v) => onToggleSelectAll(v === true)}
                aria-label="Select all students"
                disabled={students.length === 0}
              />
            </th>
            {["Student", "Class", "Status", "Guardian & Contact", "Fees Status"].map((header) => (
              <th
                key={header}
                className={cn(
                  "border-b border-slate-100 px-3 pb-4 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:px-4 lg:px-6 sm:pt-5",
                  header === "Fees Status" && "text-right",
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-black/55 dark:text-zinc-400 sm:px-6">
                No students enrolled for this academic year.
              </td>
            </tr>
          )}
          {students.map((student) => {
            const digits = phoneDigits(student.phone);
            const hasPhone = digits.length > 0;
            const waHref = `https://wa.me/${digits.length === 10 ? "91" : ""}${digits}`;
            const isSelected = selectedIds.has(student.id);
            const isActive = isRecordActive(student.active);
            return (
              <tr
                key={student.id}
                role="button"
                tabIndex={0}
                onClick={() => onViewProfile(student.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onViewProfile(student.id);
                  }
                }}
                aria-label={`Open profile for ${student.name}`}
                className={cn(
                  "cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-[#F4F4F5] focus-visible:bg-[#F4F4F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F766E] dark:border-white/5 dark:hover:bg-white/5 dark:focus-visible:bg-white/5",
                  isSelected && "bg-[#F0FDFA]/70 hover:bg-[#F0FDFA] dark:bg-[#0F766E]/15 dark:hover:bg-[#0F766E]/25",
                )}
              >
                <td
                  className="px-3 py-3.5 align-middle sm:px-4 lg:px-5"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(v) => onToggleSelect(student.id, v === true)}
                    aria-label={`Select ${student.name}`}
                  />
                </td>
                <td className="px-3 py-3.5 align-middle sm:px-4 lg:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <ProfileAvatar
                      name={student.name}
                      photoUrl={student.photoUrl}
                      className="h-10 w-10 shrink-0 rounded-xl"
                      imgClassName="object-cover"
                      initialsClassName="bg-[#0F766E] text-[12px]"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-semibold text-black">
                        {student.name}
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[10.5px] text-black/45">
                        {student.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="min-w-0 px-3 py-3.5 align-middle sm:px-4 lg:px-6">
                  <span title={student.cls} className={cn(directoryMintChipClass, "block w-fit text-[11px] font-medium")}>
                    {student.cls}
                  </span>
                </td>
                <td className="px-3 py-3.5 align-middle sm:px-4 lg:px-6">
                  <DirectoryEnrollmentStatusControl
                    active={isActive}
                    onChange={(next) => onChangeStatus(student.id, next)}
                  />
                </td>
                <td className="min-w-0 px-3 py-3.5 align-middle sm:px-4 lg:px-6">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-black">
                      {student.guardian}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[11px] text-black/50">
                      {hasPhone ? formatPhone(student.phone) : "—"}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5 align-middle sm:px-4 lg:px-6">
                  <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
                    <div className="flex shrink-0 items-center gap-1">
                      <ContactAction
                        icon={MessageCircle}
                        label="WhatsApp"
                        accent="emerald"
                        disabled={!hasPhone}
                        onClick={() => {
                          window.open(waHref, "_blank", "noopener,noreferrer");
                          toast.success(`WhatsApp opened for ${student.guardian}`);
                        }}
                      />
                      <ContactAction
                        icon={Phone}
                        label="Call"
                        accent="ink"
                        disabled={!hasPhone}
                        onClick={() => {
                          window.location.href = `tel:${digits}`;
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditData(student.id);
                        }}
                        aria-label={`Edit data for ${student.name}`}
                        title="Edit Data"
                        className="grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/65 transition-colors hover:border-black/20 hover:bg-[#F4F4F5] hover:text-black"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <ContactAction
                        icon={MessageSquare}
                        label="SMS"
                        accent="ink"
                        disabled={!hasPhone}
                        onClick={() => {
                          window.location.href = `sms:${digits}`;
                        }}
                      />
                    </div>
                    <div className="flex w-[88px] shrink-0 justify-end">
                      <StudentFeesStatusBadge due={student.due} />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
        </div>
      </div>
    </>
  );
}

export function AdmitStudentPage() {
  const { students, classes, setClasses, admitStudentToActiveYear } = useTenantStore();
  const navigate = useNavigate();
  const defaultClass = classes[0]?.className ?? "";
  const [form, setForm] = useState<AdmitStudentForm>(() => emptyAdmitForm(defaultClass));
  const [shareOpen, setShareOpen] = useState(false);
  const [shareToken, setShareToken] = useState("");
  const [shareName, setShareName] = useState("");
  const [sharePhone, setSharePhone] = useState("");
  const [shareGuardian, setShareGuardian] = useState("");
  const [admittedId, setAdmittedId] = useState<string | null>(null);
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [newClassGrade, setNewClassGrade] = useState("");
  const [newClassSection, setNewClassSection] = useState("");
  const [savingClass, setSavingClass] = useState(false);

  useEffect(() => {
    if (!defaultClass) return;
    setForm((prev) =>
      classes.some((c) => c.className === prev.cls)
        ? prev
        : { ...prev, cls: defaultClass },
    );
  }, [classes, defaultClass]);

  const backToStudents = () => navigate({ to: "/tenant/students" });

  const submitNewClass = async (e: React.FormEvent) => {
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
      setForm((prev) => ({ ...prev, cls: existing.className }));
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
      setForm((prev) => ({ ...prev, cls: created.className }));
      setAddClassOpen(false);
      setNewClassGrade("");
      setNewClassSection("");
      toast.success(`${created.className} added`, {
        description: getApiToken()
          ? "Saved to class tier · configure fees in Settings"
          : "Configure fees anytime in Settings → Class Tier",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add class");
    } finally {
      setSavingClass(false);
    }
  };

  const createStudent = (): Student | null => {
    if (!form.name.trim() || !form.guardian.trim()) {
      toast.error("Name and guardian are required");
      return null;
    }
    const nextNum = 2847 + students.filter((s) => s.id.startsWith("STU-28")).length;
    const token = createStudentShareToken();
    const draft = normalizeStudent({
      id: `STU-${nextNum}`,
      admissionNumber: `ADM-${nextNum}`,
      name: form.name.trim(),
      cls: form.cls,
      guardian: form.guardian.trim(),
      due: 0,
      phone: form.phone.trim() || undefined,
      shareToken: token,
      active: true,
    });
    return admitStudentToActiveYear(draft, {
      cls: draft.cls,
      due: draft.due,
      active: true,
    });
  };

  const persistAdmitted = (student: Student) => {
    void apiUpsertStudent(student).catch((err) =>
      toast.error(err instanceof Error ? err.message : "Could not sync student to server"),
    );
  };

  const handleAdmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStu = createStudent();
    if (!newStu) return;
    persistAdmitted(newStu);
    startTransition(() => {
      navigate({ to: "/tenant/students", search: { id: newStu.id } });
    });
    // Toast after navigation frame so it doesn't fight the route swap / dock.
    window.setTimeout(() => {
      toast.success(`${newStu.name} admitted`, {
        description: `${newStu.id} · ${newStu.cls} · send the collection link to complete the profile`,
        position: "top-center",
      });
    }, 120);
  };

  const handleAdmitAndShare = (e: React.MouseEvent) => {
    e.preventDefault();
    const newStu = createStudent();
    if (!newStu?.shareToken) return;
    persistAdmitted(newStu);
    setAdmittedId(newStu.id);
    setShareToken(newStu.shareToken);
    setShareName(newStu.name);
    setSharePhone(newStu.phone ?? "");
    setShareGuardian(newStu.guardian);
    setShareOpen(true);
    toast.success(`${newStu.name} admitted`, {
      description: `${newStu.id} · collection link ready for parents`,
      position: "top-center",
    });
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <section className={cn(glassCardClass, "w-full p-5 md:p-6")}>
        <form onSubmit={handleAdmit} className="space-y-4">
          <div>
            <div className="text-[17px] font-bold leading-tight tracking-tight text-slate-900 sm:text-title">
              Admit New Student
            </div>
            <p className="mt-1 text-[12px] text-slate-500">
              Fill school details, then send a collection link so parents can complete the rest.
            </p>
          </div>

          <div className="rounded-lg border border-[#CCFBF1] bg-[#F0FDFA]/70 px-3.5 py-3 text-[12px] text-slate-600">
            Administrators enter name, class, guardian, and contact. Parents complete
            photo, gender, date of birth, email, and address via the collection link.
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              Full Name
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ishaan Verma"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              Class
            </Label>
            <FieldSelect
              value={form.cls}
              onValueChange={(cls) => setForm({ ...form, cls })}
              options={classSelectOptions(classes, form.cls)}
              placeholder="Select class"
              onAddNew={() => {
                const parts = splitClassName(form.cls);
                setNewClassGrade(parts.grade);
                setNewClassSection(parts.section);
                setAddClassOpen(true);
              }}
              addNewLabel="Add new class"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Guardian Name
              </Label>
              <Input
                value={form.guardian}
                onChange={(e) => setForm({ ...form, guardian: e.target.value })}
                placeholder="e.g. Anita Verma"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Contact Phone
              </Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="9810045221"
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex flex-nowrap items-center gap-1.5 pt-2 sm:justify-end sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={backToStudents}
              className="h-9 shrink-0 px-2.5 text-[12px] sm:h-10 sm:px-4 sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleAdmitAndShare}
              className="h-9 min-w-0 flex-1 rounded-full px-2 text-[11px] sm:h-10 sm:flex-none sm:px-4 sm:text-sm"
            >
              <ClipboardList className="mr-1 h-3.5 w-3.5 shrink-0 sm:mr-1.5" />
              <span className="truncate">Admit & Collect</span>
            </Button>
            <Button
              type="submit"
              className="h-9 min-w-0 flex-1 rounded-full bg-[#0F766E] px-2 text-[11px] text-white hover:bg-[#0D9488] sm:h-10 sm:flex-none sm:px-4 sm:text-sm"
            >
              <span className="truncate">Admit Student</span>
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
              Creates a class tier for admissions and fee posting. You can set fee amounts later in
              Settings → Class Tier.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void submitNewClass(e)} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Class
                </Label>
                <Input
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  placeholder="e.g. Grade 4, 2025"
                  autoFocus
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Division
                </Label>
                <Input
                  value={newClassSection}
                  onChange={(e) => setNewClassSection(e.target.value)}
                  placeholder="e.g. A, B"
                  className="h-11"
                />
              </div>
            </div>
            {newClassGrade.trim() || newClassSection.trim() ? (
              <p className="text-[12px] text-black/50 dark:text-zinc-400">
                Preview:{" "}
                <span className="font-semibold text-black dark:text-zinc-100">
                  {composeClassName(newClassGrade, newClassSection) || "—"}
                </span>
              </p>
            ) : null}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={savingClass}
                onClick={() => setAddClassOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingClass || !newClassGrade.trim() || !newClassSection.trim()}
                className="rounded-full bg-[#0F766E] hover:bg-[#0D9488]"
              >
                {savingClass ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding…
                  </>
                ) : (
                  "Add class"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ShareParentLinkDialog
        open={shareOpen}
        onOpenChange={(open) => {
          setShareOpen(open);
          if (!open && admittedId) {
            navigate({ to: "/tenant/students", search: { id: admittedId } });
          }
        }}
        token={shareToken}
        studentName={shareName}
        guardianPhone={sharePhone}
        guardianName={shareGuardian}
      />
    </div>
  );
}


export function StudentsLedger() {
  const {
    activeStudents: students,
    students: allStudents,
    setStudents,
    classes,
    setClasses,
    schoolDetails,
    enrollStudentInActiveYear,
    admitStudentToActiveYear,
    academicYear,
    hydrated,
    branchSyncing,
  } =
    useTenantStore();
  const navigate = useNavigate();
  const search = useSearch({ from: "/tenant/students" }) as {
    id?: string;
    edit?: string;
  };
  const activeStudentViewId = search.id ?? null;
  const initialEdit = search.edit === "1";
  const defaultClass = classes[0]?.className ?? "";
  const schoolName = schoolDetails.name || "Silver Hills Global";

  const openStudent = (id: string) => navigate({ to: "/tenant/students", search: { id } });
  const openStudentEdit = (id: string) =>
    navigate({ to: "/tenant/students", search: { id, edit: "1" } });
  const closeStudent = () => navigate({ to: "/tenant/students", search: {} });

  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [enrollmentFilter, setEnrollmentFilter] = useState<EnrollmentFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [pendingPurgeId, setPendingPurgeId] = useState<string | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkWhatsAppOpen, setBulkWhatsAppOpen] = useState(false);
  const [bulkWhatsAppMsg, setBulkWhatsAppMsg] = useState("");
  const [bulkWhatsAppSending, setBulkWhatsAppSending] = useState(false);

  useEffect(() => {
    setDivisionFilter("all");
  }, [gradeFilter]);

  const openAdmitPage = () => navigate({ to: "/tenant/students/admit" });

  const liveStudents = useMemo(
    () => students.filter((s) => !isRecordDeleted(s.deletedAt)),
    [students],
  );
  const deletedStudents = useMemo(
    () =>
      students
        .filter((s) => isRecordDeleted(s.deletedAt))
        .sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? "")),
    [students],
  );

  const activeStudent = useMemo(
    () =>
      activeStudentViewId
        ? (liveStudents.find((s) => s.id === activeStudentViewId) ?? null)
        : null,
    [activeStudentViewId, liveStudents],
  );

  const classDivisionIndex = useMemo(() => {
    const names = [
      ...classes.map((c) => c.className),
      ...liveStudents.map((s) => s.cls),
    ];
    return buildClassDivisionIndex(names);
  }, [classes, liveStudents]);

  const gradeOptions = useMemo(
    () => Array.from(classDivisionIndex.keys()).sort((a, b) => a.localeCompare(b, "en")),
    [classDivisionIndex],
  );

  const divisionOptions = useMemo(() => {
    if (gradeFilter === "all") {
      const divisions = new Set<string>();
      classDivisionIndex.forEach((set) => set.forEach((d) => divisions.add(d)));
      return Array.from(divisions).sort();
    }
    return Array.from(classDivisionIndex.get(gradeFilter) ?? []).sort();
  }, [classDivisionIndex, gradeFilter]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return liveStudents
      .filter((s) => studentMatchesClassDivisionFilter(s.cls, gradeFilter, divisionFilter))
      .filter((s) =>
        statusFilter === "all" ? true : statusFilter === "paid" ? s.due === 0 : s.due > 0,
      )
      .filter((s) => {
        const active = isRecordActive(s.active);
        return enrollmentFilter === "all"
          ? true
          : enrollmentFilter === "active"
            ? active
            : !active;
      })
      .filter((s) => {
        if (!q) return true;
        const haystack = [
          s.name,
          s.id,
          s.guardian,
          s.phone ?? "",
          s.cls,
          s.email ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
  }, [liveStudents, gradeFilter, divisionFilter, statusFilter, enrollmentFilter, searchQuery]);

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(filtered.map((s) => s.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visible.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [filtered]);

  const selectedStudents = useMemo(
    () => filtered.filter((s) => selectedIds.has(s.id)),
    [filtered, selectedIds],
  );

  const selectedWithPhone = useMemo(() => {
    return selectedStudents
      .map((s) => ({ student: s, number: toNotifyWhatsAppNumber(s.phone) }))
      .filter((row): row is { student: Student; number: string } => Boolean(row.number));
  }, [selectedStudents]);

  const toggleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAll = (selected: boolean) => {
    setSelectedIds((prev) => {
      if (!selected) {
        const next = new Set(prev);
        filtered.forEach((s) => next.delete(s.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectByFeesStatus = (kind: "paid" | "overdue") => {
    const matches = filtered.filter((s) => (kind === "paid" ? s.due === 0 : s.due > 0));
    if (!matches.length) {
      toast.error(
        kind === "paid"
          ? "No paid students in the current view"
          : "No overdue students in the current view",
      );
      return;
    }
    setSelectedIds(new Set(matches.map((s) => s.id)));
    toast.success(
      kind === "paid"
        ? `${matches.length} paid student${matches.length === 1 ? "" : "s"} selected`
        : `${matches.length} overdue student${matches.length === 1 ? "" : "s"} selected`,
    );
  };

  const changeStudentStatus = (id: string, nextActive: boolean) => {
    const target = liveStudents.find((s) => s.id === id);
    if (!target || isRecordActive(target.active) === nextActive) return;
    const updated = { ...target, active: nextActive };
    setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));
    void apiUpsertStudent(updated).catch((err) =>
      toast.error("Could not update student status on server", {
        description: err instanceof Error ? err.message : "Save failed",
      }),
    );
    toast.success(nextActive ? `${target.name} reactivated` : `${target.name} deactivated`, {
      description: target.id,
    });
  };

  const restoreStudent = (id: string) => {
    const target = deletedStudents.find((s) => s.id === id);
    if (!target) return;
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, deletedAt: undefined } : s)),
    );
    void apiDeleteStudent(id, { restore: true }).catch((err) =>
      toast.error("Could not restore student on server", {
        description: err instanceof Error ? err.message : "Restore failed",
      }),
    );
    toast.success(`${target.name} restored to directory`, { description: target.id });
  };

  const purgeStudent = (id: string) => {
    const target = deletedStudents.find((s) => s.id === id);
    if (!target) return;
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setPendingPurgeId(null);
    void apiDeleteStudent(id, { hard: true }).catch((err) =>
      toast.error("Could not permanently delete student on server", {
        description: err instanceof Error ? err.message : "Delete failed",
      }),
    );
    toast.error(`${target.name} permanently deleted`, { description: target.id });
  };

  const bulkChangeStatus = (nextActive: boolean) => {
    if (!selectedIds.size) {
      toast.error("Select at least one student");
      return;
    }
    const ids = selectedIds;
    setStudents((prev) =>
      prev.map((s) => (ids.has(s.id) ? { ...s, active: nextActive } : s)),
    );
    for (const id of ids) {
      const target = liveStudents.find((s) => s.id === id);
      if (!target) continue;
      void apiUpsertStudent({ ...target, active: nextActive }).catch(() => {});
    }
    toast.success(
      nextActive
        ? `${ids.size} student${ids.size === 1 ? "" : "s"} set to Active`
        : `${ids.size} student${ids.size === 1 ? "" : "s"} set to Inactive`,
    );
    clearSelection();
  };

  const confirmBulkDeleteStudents = () => {
    if (!selectedIds.size) {
      setPendingBulkDelete(false);
      return;
    }
    const ids = new Set(selectedIds);
    const stamp = new Date().toISOString();
    const count = ids.size;
    setStudents((prev) =>
      prev.map((s) => (ids.has(s.id) ? { ...s, deletedAt: stamp } : s)),
    );
    for (const id of ids) {
      void apiDeleteStudent(id).catch((err) =>
        toast.error("Could not delete student on server", {
          description: err instanceof Error ? err.message : "Delete failed",
        }),
      );
    }
    clearSelection();
    setPendingBulkDelete(false);
    toast.success(
      `${count} student${count === 1 ? "" : "s"} moved to recycle bin`,
      { description: "Restore anytime from Recycle" },
    );
  };

  const openBulkWhatsApp = () => {
    if (!selectedIds.size) {
      toast.error("Select at least one student");
      return;
    }
    if (!selectedWithPhone.length) {
      toast.error("No WhatsApp numbers on selected students", {
        description: "Add guardian phone numbers before sending",
      });
      return;
    }
    const hasOverdue = selectedWithPhone.some((row) => row.student.due > 0);
    setBulkWhatsAppMsg(
      hasOverdue ? DEFAULT_OVERDUE_WHATSAPP_TEMPLATE : DEFAULT_GENERAL_WHATSAPP_TEMPLATE,
    );
    setBulkWhatsAppOpen(true);
  };

  const insertTemplateVar = (key: string) => {
    const token = `{{${key}}}`;
    setBulkWhatsAppMsg((prev) => (prev.trim() ? `${prev}${prev.endsWith(" ") ? "" : " "}${token}` : token));
  };

  const bulkWhatsAppPreview = useMemo(() => {
    const sample = selectedWithPhone[0]?.student;
    if (!sample || !bulkWhatsAppMsg.trim()) return "";
    return renderWhatsAppTemplate(
      bulkWhatsAppMsg,
      buildStudentWhatsAppVars(sample, { schoolName, classes }),
    );
  }, [bulkWhatsAppMsg, selectedWithPhone, schoolName, classes]);

  const sendBulkWhatsApp = async () => {
    if (!bulkWhatsAppMsg.trim()) {
      toast.error("Enter a message to send");
      return;
    }
    if (!selectedWithPhone.length) {
      toast.error("No valid phone numbers selected");
      return;
    }
    setBulkWhatsAppSending(true);
    try {
      const personalized = templateHasPlaceholders(bulkWhatsAppMsg);
      if (personalized) {
        const recipients = selectedWithPhone.map((row) => ({
          number: row.number,
          message: renderWhatsAppTemplate(
            bulkWhatsAppMsg,
            buildStudentWhatsAppVars(row.student, { schoolName, classes }),
          ),
        }));
        const result = await sendPersonalizedWhatsApp({ recipients });
        const skipped = selectedStudents.length - selectedWithPhone.length;
        if (result.sent === 0) {
          toast.error("WhatsApp send failed", {
            description: result.errors[0] ?? "No messages accepted",
          });
          return;
        }
        toast.success(
          `WhatsApp sent to ${result.sent} guardian${result.sent === 1 ? "" : "s"}`,
          {
            description: [
              result.failed > 0 ? `${result.failed} failed` : null,
              skipped > 0 ? `${skipped} skipped · no phone` : null,
              "Personalized per student",
            ]
              .filter(Boolean)
              .join(" · "),
          },
        );
      } else {
        const numbers = selectedWithPhone.map((row) => row.number);
        const result = await sendWhatsAppNotify({
          numbers,
          message: bulkWhatsAppMsg,
        });
        if (!result.ok) {
          toast.error("WhatsApp send failed", {
            description: result.body.slice(0, 180) || `HTTP ${result.status}`,
          });
          return;
        }
        const skipped = selectedStudents.length - selectedWithPhone.length;
        toast.success(
          `WhatsApp sent to ${numbers.length} guardian${numbers.length === 1 ? "" : "s"}`,
          {
            description:
              skipped > 0
                ? `${skipped} skipped · no phone on file`
                : result.body.slice(0, 120) || "Notify API accepted",
          },
        );
      }
      setBulkWhatsAppOpen(false);
      clearSelection();
    } catch (err) {
      toast.error("WhatsApp send failed", {
        description: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setBulkWhatsAppSending(false);
    }
  };

  const analytics = useMemo(
    () => ({
      paid: liveStudents.filter((s) => s.due === 0).length,
      overdue: liveStudents.filter((s) => s.due > 0).length,
      total: liveStudents.length,
      male: liveStudents.filter((s) => s.gender === "M").length,
      female: liveStudents.filter((s) => s.gender === "F").length,
    }),
    [liveStudents],
  );

  const exportCsv = () => {
    if (!filtered.length) {
      toast.error("Nothing to export · current filter is empty");
      return;
    }
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      "Student,Class,Guardian,Phone,Balance",
      ...filtered.map((s) =>
        [escape(s.name), escape(s.cls), escape(s.guardian), escape(s.phone ?? ""), s.due].join(","),
      ),
    ].join("\n");
    const uri = encodeURI("data:text/csv;charset=utf-8," + rows);
    const a = document.createElement("a");
    a.href = uri;
    a.download = formatDownloadFilename("students", "csv", {
      school: schoolName,
      year: slugYear(academicYear),
      date: todayStamp(),
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`${filtered.length} students exported`, {
      description: "CSV ready in your downloads folder",
    });
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const downloadStudentTemplate = () => {
    downloadCsv(
      "students-bulk-upload-template.csv",
      ["Name", "Class", "Guardian", "Phone", "Balance"],
      [
        ["Aarav Sharma", defaultClass || "LKG - A", "Rajesh Sharma", "9810045221", "0"],
        ["Meera Iyer", "UKG - B", "Priya Iyer", "9876501234", "4500"],
      ],
    );
    toast.success("Student template downloaded", {
      description: "Fill Name, Class, Guardian, Phone, Balance · missing classes are created on upload",
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      void (async () => {
        const rows = parseStudentCsv(String(reader.result ?? ""));
        if (!rows.length) {
          toast.error("CSV had no student rows", {
            description: "Use the template: Name, Class, Guardian, Phone, Balance",
          });
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        setImporting(true);
        try {
          let classPool = [...classes];
          const createdClasses: ClassConfig[] = [];
          const admitted: Student[] = [];
          let skipped = 0;
          let usedIds = allStudents.map((s) => s.id);

          for (const row of rows) {
            const classLabel = row.classLabel || defaultClass;
            if (!classLabel) {
              skipped += 1;
              continue;
            }

            let cls = matchExistingClass(classPool, classLabel);
            if (!cls) {
              cls = buildClassFromLabel(
                nextPrefixedId("CLS", classPool.map((c) => c.id), 3),
                classLabel,
              );
              classPool = [...classPool, cls];
              createdClasses.push(cls);
            }

            const duplicateOf = {
              name: row.name,
              phone: row.phone,
              className: cls.className,
            };
            if (
              isDuplicateStudent(students, duplicateOf) ||
              isDuplicateStudent(admitted, duplicateOf)
            ) {
              skipped += 1;
              continue;
            }

            const phoneDigits = row.phone.replace(/\D/g, "");
            const prior = allStudents.find((student) => {
              if (student.deletedAt) return false;
              if (student.name.trim().toLowerCase() !== row.name.trim().toLowerCase()) {
                return false;
              }
              return phoneDigits
                ? (student.phone ?? "").replace(/\D/g, "") === phoneDigits
                : false;
            });
            if (prior) {
              enrollStudentInActiveYear(prior.id, {
                cls: cls.className,
                due: row.due,
                active: true,
              });
              admitted.push({
                ...prior,
                cls: cls.className,
                due: row.due,
                active: true,
              });
              continue;
            }

            const id = nextPrefixedId("STU", usedIds, 4);
            usedIds = [...usedIds, id];
            const draft = normalizeStudent({
              id,
              admissionNumber: `ADM-${id.replace(/^STU-/i, "")}`,
              name: row.name,
              cls: cls.className,
              guardian: row.guardian || "—",
              phone: row.phone || undefined,
              due: row.due,
              shareToken: createStudentShareToken(),
              active: true,
            });
            admitted.push(
              admitStudentToActiveYear(draft, {
                cls: draft.cls,
                due: draft.due,
                active: true,
              }),
            );
          }

          if (createdClasses.length) {
            setClasses((prev) => {
              const seen = new Set(prev.map((c) => c.id));
              return [...prev, ...createdClasses.filter((c) => !seen.has(c.id))];
            });
          }

          if (!admitted.length) {
            toast.error("No new students to admit", {
              description:
                skipped > 0
                  ? `${skipped} row${skipped === 1 ? "" : "s"} skipped · already enrolled or missing class`
                  : "Check the CSV columns and try again",
            });
            return;
          }

          for (const cls of createdClasses) {
            await apiUpsertClass(cls).catch(() => {
              /* local class kept; settings sync can retry */
            });
          }
          for (const student of admitted) {
            await apiUpsertStudent(student).catch((err) => {
              toast.error(
                err instanceof Error ? err.message : `Could not sync ${student.name}`,
              );
            });
          }

          const classNote = createdClasses.length
            ? `${createdClasses.length} class${createdClasses.length === 1 ? "" : "es"} created`
            : null;
          const skipNote =
            skipped > 0 ? `${skipped} skipped` : null;
          toast.success(
            `${admitted.length} student${admitted.length === 1 ? "" : "s"} admitted`,
            {
              description: [classNote, skipNote, academicYear].filter(Boolean).join(" · "),
            },
          );
        } finally {
          setImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      })();
    };
    reader.onerror = () => toast.error("Could not read the selected file");
    reader.readAsText(file);
  };

  const downloadPdf = () => {
    if (!filtered.length) {
      toast.error("Nothing to print · current filter is empty");
      return;
    }
    const win = window.open("", "_blank", "width=960,height=720");
    if (!win) {
      toast.error("Popup blocked · allow pop-ups for this site");
      return;
    }
    const stampedAt = formatNow();
    const contextLabel = [
      gradeFilter === "all"
        ? "All Grades"
        : divisionFilter === "all"
          ? gradeFilter
          : `${gradeFilter} · Div ${divisionFilter}`,
      statusFilter === "all"
        ? "All Students"
        : statusFilter === "paid"
          ? "Paid"
          : "Overdue",
    ].join(" · ");
    const rowsHtml = filtered
      .map(
        (s) => `<tr>
          <td>${s.id}</td>
          <td>${s.name}</td>
          <td>${s.cls}</td>
          <td>${s.guardian}</td>
          <td>${s.phone ?? ""}</td>
          <td>${s.due === 0 ? "Paid" : "Overdue"}</td>
          <td style="text-align:right">${s.due === 0 ? "Cleared" : "₹ " + s.due.toLocaleString("en-IN")}</td>
        </tr>`,
      )
      .join("");
    win.document.write(`<!doctype html><html><head><title>Students Ledger · ${stampedAt}</title>
      <style>
        @page { margin: 18mm; }
        body { font-family: Inter, system-ui, sans-serif; color: #111; margin: 0; padding: 0; }
        h1 { font-size: 16px; margin: 0 0 4px; }
        .meta { font-size: 11px; color: #666; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { padding: 8px 10px; border-bottom: 1px solid #E5E5E5; text-align: left; }
        th { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; }
        tbody tr:nth-child(odd) { background: #FAFAFA; }
        .paid { color: #10B981; font-weight: 600; }
        .overdue { color: #EF4444; font-weight: 600; }
      </style></head><body>
        <h1>Silver Hills Global · Students Directory</h1>
        <div class="meta">${contextLabel} · ${filtered.length} students · printed ${stampedAt}</div>
        <table>
          <thead><tr><th>ID</th><th>Student</th><th>Class</th><th>Guardian</th><th>Phone</th><th>Status</th><th style="text-align:right">Balance</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 100);
    toast.success("Print preview opened", { description: "Save as PDF from your browser dialog" });
  };

  const allShownSelected =
    filtered.length > 0 && filtered.every((s) => selectedIds.has(s.id));

  const studentsBulkBar =
    selectedIds.size > 0 ? (
      <DirectoryBulkActionBar
        selectedCount={selectedIds.size}
        className="lg:border-b"
        filters={
          <>
            {!allShownSelected && (
              <button type="button" onClick={() => toggleSelectAll(true)} className={bulkFilterBtn}>
                Select all shown
              </button>
            )}
            <button
              type="button"
              onClick={() => selectByFeesStatus("overdue")}
              className={bulkFilterBtnOverdue}
            >
              Select overdue
            </button>
            <button
              type="button"
              onClick={() => selectByFeesStatus("paid")}
              className={bulkFilterBtnPaid}
            >
              Select paid
            </button>
            <button type="button" onClick={clearSelection} className={bulkFilterBtn}>
              Clear
            </button>
          </>
        }
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={cn(mobileOutlineBtn, "h-9 rounded-lg px-3")}>
                  Change Status
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                collisionPadding={12}
                className="z-[250] w-44 rounded-lg border-[#E5E5E5] bg-white p-1 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)]"
              >
                <DropdownMenuItem
                  className="cursor-pointer rounded-md text-[13px]"
                  onClick={() => bulkChangeStatus(true)}
                >
                  Set Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer rounded-md text-[13px]"
                  onClick={() => bulkChangeStatus(false)}
                >
                  Set Inactive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button type="button" onClick={openBulkWhatsApp} className={bulkActionWhatsAppBtn}>
              <MessageCircle className="h-3.5 w-3.5" />
              Bulk WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setPendingBulkDelete(true)}
              className={bulkActionDeleteBtn}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </>
        }
      />
    ) : undefined;

  if (!hydrated || branchSyncing) {
    return <TenantDirectorySkeleton label="Loading students directory" />;
  }

  if (activeStudent) {
    return (
      <StudentProfileDetail
        student={activeStudent}
        onBack={closeStudent}
        initialEdit={initialEdit}
      />
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-3 overflow-x-clip lg:space-y-6">
      <MobileStatsOverview
        items={[
          {
            label: "Paid",
            value: analytics.paid,
            icon: CheckCircle2,
            iconClass: "text-[#10B981]",
          },
          {
            label: "Overdue",
            value: analytics.overdue,
            icon: AlertTriangle,
            iconClass: "text-[#EF4444]",
          },
          {
            label: "Total",
            value: analytics.total,
            icon: Users,
            iconClass: "text-[#0F766E]",
          },
        ]}
      />

      <div className="hidden w-full grid-cols-3 gap-3 lg:grid">
        <div className={cn(glassCardClass, directoryStatCardClass)}>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-1 md:items-start md:gap-2">
            <div className={cn(directoryStatLabelClass, "text-slate-500")}>Paid</div>
            <CheckCircle2 className="h-3 w-3 shrink-0 text-[#10B981] md:h-4 md:w-4" />
          </div>
          <div className={directoryStatValueClass}>{analytics.paid}</div>
        </div>

        <div className={cn(glassCardClass, directoryStatCardClass)}>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-1 md:items-start md:gap-2">
            <div className={cn(directoryStatLabelClass, "text-slate-500")}>Overdue</div>
            <AlertTriangle className="h-3 w-3 shrink-0 text-[#EF4444] md:h-4 md:w-4" />
          </div>
          <div className={directoryStatValueClass}>{analytics.overdue}</div>
        </div>

        <div className={cn(glassCardClass, directoryStatCardClass, "bg-[#CCFBF1]/40")}>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-1 md:items-start md:gap-2">
            <div className={cn(directoryStatLabelClass, "text-slate-600")}>
              <span className="md:hidden">Total</span>
              <span className="hidden md:inline">Total Students</span>
            </div>
            <Users className="h-3 w-3 shrink-0 text-slate-400 md:h-4 md:w-4" />
          </div>
          <div className="shrink-0 text-right md:text-left">
            <div className={directoryStatValueClass}>{analytics.total}</div>
            <div className="mt-0.5 font-mono text-[9px] text-slate-500 md:mt-1.5 md:text-[11px]">
              {analytics.male}M · {analytics.female}F
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full min-w-0 flex-col gap-2 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        <h1 className="shrink-0 text-[16px] font-bold leading-tight tracking-tight text-slate-900 dark:text-zinc-50 md:text-[24px] md:font-semibold xl:min-w-0 xl:flex-1 xl:truncate xl:text-[28px]">
          {showRecycleBin ? "Recycle Bin" : "Students Directory"}
        </h1>
        <div className={cn(directoryToolbarRow, "xl:max-w-full xl:shrink-0")}>
          <button
            type="button"
            onClick={() => setShowRecycleBin((v) => !v)}
            className={cn(
              directoryToolbarBtn,
              showRecycleBin
                ? "border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2]"
                : "text-slate-900",
              showRecycleBin && "sm:flex-none",
            )}
            aria-pressed={showRecycleBin}
          >
            <Recycle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate sm:hidden">Bin</span>
            <span className="hidden truncate sm:inline">Recycle</span>
            {deletedStudents.length > 0 && (
              <span
                className={cn(
                  "ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-bold",
                  showRecycleBin ? "bg-[#EF4444] text-white" : "bg-slate-900 text-white",
                )}
              >
                {deletedStudents.length}
              </span>
            )}
          </button>

          {!showRecycleBin && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={directoryToolbarBtn}>
                    <Filter className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Filter</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  collisionPadding={12}
                  className="z-[250] w-56 rounded-lg border-[#E5E5E5] bg-white p-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)]"
                >
                  <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    Fees Status
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                  >
                    {STATUS_TABS.map((t) => (
                      <DropdownMenuRadioItem key={t.key} value={t.key} className="rounded-xl text-[13px]">
                        {t.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    Enrollment
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={enrollmentFilter}
                    onValueChange={(v) => setEnrollmentFilter(v as EnrollmentFilter)}
                  >
                    <DropdownMenuRadioItem value="all" className="rounded-xl text-[13px]">
                      All students
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="active" className="rounded-xl text-[13px]">
                      Active
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="inactive" className="rounded-xl text-[13px]">
                      Inactive
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={directoryToolbarBtn}>
                    <Download className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Export</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  collisionPadding={12}
                  className="z-[250] w-52 rounded-lg border-[#E5E5E5] bg-white p-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)]"
                >
                  <DropdownMenuItem
                    onClick={downloadPdf}
                    className="cursor-pointer gap-2 rounded-xl text-[13px]"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={exportCsv}
                    className="cursor-pointer gap-2 rounded-xl text-[13px]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={directoryToolbarBtn} disabled={importing}>
                    <Upload className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate sm:hidden">Upload</span>
                    <span className="hidden truncate sm:inline">Bulk Upload</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  collisionPadding={12}
                  className="z-[250] w-56 rounded-lg border-[#E5E5E5] bg-white p-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)]"
                >
                  <DropdownMenuItem
                    onClick={downloadStudentTemplate}
                    className="cursor-pointer gap-2 rounded-xl text-[13px]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download template
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleImportClick}
                    disabled={importing}
                    className="cursor-pointer gap-2 rounded-xl text-[13px]"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={openAdmitPage}
                className={cn(
                  mobilePrimaryBtn,
                  "hidden md:inline-flex md:rounded-full md:bg-gradient-to-r md:from-[#0F766E] md:to-[#115E59] md:shadow-md md:shadow-teal-900/15 md:hover:opacity-95 md:hover:bg-gradient-to-r",
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                Admit Student
              </button>
            </>
          )}
        </div>
      </div>

      {showRecycleBin ? (
        <div className="space-y-3">
          <p className="text-[13px] text-slate-500">
            Deleted students stay here until you restore them or delete permanently.
          </p>
          <DirectoryRecycleBinList
            items={deletedStudents}
            emptyLabel="Recycle bin is empty — no deleted students."
            subtitleFor={(item) => {
              const student = deletedStudents.find((s) => s.id === item.id);
              return student ? `${student.id} · ${student.cls}` : item.id;
            }}
            onRestore={restoreStudent}
            onPurge={setPendingPurgeId}
          />
        </div>
      ) : (
        <>
      <div className={cn(glassCardClass, "min-w-0 p-2.5 md:p-5")}>
        <div className="flex flex-col gap-2 md:gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 hidden text-[10px] font-semibold uppercase tracking-wider text-slate-500 md:block">
              Search
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 md:h-4 md:w-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, ID, guardian, phone…"
                className="h-9 w-full rounded-lg border-[#E5E5E5] bg-white pl-9 pr-9 md:h-10"
                aria-label="Search students"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-end gap-2 lg:gap-4">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 md:gap-4">
              <div className="min-w-0">
                <div className="mb-1.5 hidden text-[10px] font-semibold uppercase tracking-wider text-slate-500 md:block">
                  Class / Grade
                </div>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger
                    className="h-9 w-full rounded-lg border-[#E5E5E5] bg-white md:h-10"
                    aria-label="Class / Grade"
                  >
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    className="z-[250] rounded-lg border-[#E5E5E5] bg-white"
                  >
                    <SelectItem value="all" className="rounded-md">
                      All classes
                    </SelectItem>
                    {gradeOptions.map((grade) => (
                      <SelectItem key={grade} value={grade} className="rounded-md">
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0">
                <div className="mb-1.5 hidden text-[10px] font-semibold uppercase tracking-wider text-slate-500 md:block">
                  Division
                </div>
                <Select
                  value={divisionFilter}
                  onValueChange={setDivisionFilter}
                  disabled={gradeFilter === "all" && divisionOptions.length === 0}
                >
                  <SelectTrigger
                    className="h-9 w-full rounded-lg border-[#E5E5E5] bg-white md:h-10"
                    aria-label="Division"
                  >
                    <SelectValue placeholder="All divisions" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    className="z-[250] rounded-lg border-[#E5E5E5] bg-white"
                  >
                    <SelectItem value="all" className="rounded-md">
                      All divisions
                    </SelectItem>
                    {divisionOptions.map((division) => (
                      <SelectItem key={division} value={division} className="rounded-md">
                        {division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-0.5 flex shrink-0 flex-col items-end gap-0.5 lg:mb-1">
              <span className="font-mono text-[10px] tabular-nums text-slate-400 md:text-[11px]">
                {filtered.length} shown
              </span>
              {(gradeFilter !== "all" || divisionFilter !== "all" || searchQuery.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    setGradeFilter("all");
                    setDivisionFilter("all");
                    setSearchQuery("");
                  }}
                  className="text-[10px] font-semibold text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleImport}
      />

      <Dialog open={importing}>
        <DialogContent
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-[min(22rem,calc(100%-2rem))] rounded-2xl border border-[#E5E5E5] bg-white p-8 text-center shadow-[0_24px_64px_-16px_rgba(0,0,0,0.28)] sm:max-w-sm"
        >
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#0F766E]/10">
            <Loader2 className="h-7 w-7 animate-spin text-[#0F766E]" />
          </div>
          <DialogHeader className="space-y-2 text-center sm:text-center">
            <DialogTitle className="text-[18px] font-semibold tracking-tight text-black">
              Importing students
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-black/55">
              Adding records and creating missing classes. Please keep this window open.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <StudentsDirectoryTable
        students={filtered}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onViewProfile={openStudent}
        onEditData={openStudentEdit}
        onChangeStatus={changeStudentStatus}
        bulkBar={studentsBulkBar}
      />
        </>
      )}

      <DeleteConfirmDialog
        open={Boolean(pendingPurgeId)}
        onOpenChange={(next) => {
          if (!next) setPendingPurgeId(null);
        }}
        title="Delete permanently"
        description={
          pendingPurgeId
            ? `Permanently delete ${deletedStudents.find((s) => s.id === pendingPurgeId)?.name ?? "this student"} (${pendingPurgeId})? This cannot be undone.`
            : "Permanently delete this student? This cannot be undone."
        }
        onConfirm={() => {
          if (pendingPurgeId) purgeStudent(pendingPurgeId);
        }}
      />

      <DeleteConfirmDialog
        open={pendingBulkDelete}
        onOpenChange={(next) => {
          if (!next) setPendingBulkDelete(false);
        }}
        title="Delete selected students"
        description={`Move ${selectedIds.size} selected student${selectedIds.size === 1 ? "" : "s"} to the recycle bin? You can restore them later from Recycle.`}
        onConfirm={confirmBulkDeleteStudents}
      />

      <Dialog open={bulkWhatsAppOpen} onOpenChange={setBulkWhatsAppOpen}>
        <DialogContent className="flex max-h-[min(90dvh,760px)] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 space-y-1.5 border-b border-[#F0F0F0] px-5 pb-4 pt-5 pr-12 text-left sm:px-6 sm:pt-6">
            <DialogTitle className="text-[20px] font-semibold text-black">
              Bulk WhatsApp
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60 dark:text-zinc-400">
              Sends via BugRicer Notify to {selectedWithPhone.length} guardian
              {selectedWithPhone.length === 1 ? "" : "s"}
              {selectedStudents.length > selectedWithPhone.length
                ? ` · ${selectedStudents.length - selectedWithPhone.length} without phone skipped`
                : ""}
              . Use {"{{amount}}"} and {"{{due_date}}"} for personalized overdue reminders.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6">
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <Label htmlFor="bulk-wa-msg" className="mr-1 text-[12px] text-slate-500">
                  Message template
                </Label>
                {WHATSAPP_TEMPLATE_VARS.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertTemplateVar(v.key)}
                    className="rounded-full border border-[#E5E5E5] bg-[#F8FAFC] px-2 py-0.5 font-mono text-[10px] font-medium text-slate-600 transition-colors hover:border-[#0F766E]/40 hover:bg-[#F0FDFA] hover:text-[#0F766E]"
                    title={`Insert {{${v.key}}}`}
                  >
                    {`{{${v.key}}}`}
                  </button>
                ))}
              </div>
              <Textarea
                id="bulk-wa-msg"
                value={bulkWhatsAppMsg}
                onChange={(e) => setBulkWhatsAppMsg(e.target.value)}
                rows={5}
                placeholder="Type the WhatsApp message… use {{amount}} {{due_date}}"
                className="mt-0.5 max-h-40 min-h-[120px] resize-y rounded-lg border-[#E5E5E5] bg-white font-mono text-[12.5px] leading-relaxed"
              />
            </div>
            {bulkWhatsAppPreview && (
              <div className="rounded-lg border border-[#CCFBF1] bg-[#F8FBFF] px-3 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#0F766E]">
                  Preview · {selectedWithPhone[0]?.student.name}
                </div>
                <pre className="mt-1.5 max-h-36 overflow-y-auto whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-slate-700">
                  {bulkWhatsAppPreview}
                </pre>
              </div>
            )}
            <div className="rounded-lg bg-[#F8FAFC] px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-500">
              {selectedWithPhone
                .slice(0, 6)
                .map((row) => `${row.student.name.split(" ")[0]}:${row.number}`)
                .join(" · ")}
              {selectedWithPhone.length > 6 ? ` · +${selectedWithPhone.length - 6} more` : ""}
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-[#F0F0F0] bg-white px-5 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              disabled={bulkWhatsAppSending}
              onClick={() => setBulkWhatsAppOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={bulkWhatsAppSending || !selectedWithPhone.length}
              className="rounded-full bg-[#10B981] text-white hover:bg-[#059669]"
              onClick={() => void sendBulkWhatsApp()}
            >
              {bulkWhatsAppSending ? "Sending…" : `Send to ${selectedWithPhone.length}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DirectoryFloatingAddButton label="Admit Student" onClick={openAdmitPage} />
    </div>
  );
}

function ContactAction({
  icon: Icon,
  label,
  accent,
  disabled,
  onClick,
}: {
  icon: typeof Phone;
  label: string;
  accent: "emerald" | "ink";
  disabled?: boolean;
  onClick: () => void;
}) {
  const palette =
    accent === "emerald"
      ? "bg-[#10B981] text-white hover:bg-[#059669]"
      : "bg-[#0F766E] text-white hover:bg-[#0D9488]";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      aria-label={label}
      title={disabled ? "No phone on file" : label}
      className={`grid h-8 w-8 place-items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:bg-black/15 disabled:text-black/40 ${palette}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

type StaffStatusFilter = "all" | "active" | "inactive";

function isTeachingStaff(member: Staff): boolean {
  return (member.role ?? "").toLowerCase().includes("teacher");
}

export function StaffRoster() {
  const { staff, setStaff, departments, roles, hydrated, branchSyncing, schoolDetails, academicYear } = useTenantStore();
  const schoolName = schoolDetails.name || "School";
  const navigate = useNavigate();
  const search = useSearch({ from: "/tenant/staff" }) as { id?: string; edit?: string };
  const activeStaffViewId = search.id ?? null;
  const initialEdit = search.edit === "1";

  const openStaff = (id: string) => navigate({ to: "/tenant/staff", search: { id } });
  const openStaffEdit = (id: string) =>
    navigate({ to: "/tenant/staff", search: { id, edit: "1" } });
  const closeStaff = () => navigate({ to: "/tenant/staff", search: {} });

  const defaultDept = departments[0]?.name ?? "";
  const defaultRole = roles[0]?.title ?? "Teacher";
  const [open, setOpen] = useState(false);
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [pendingPurgeId, setPendingPurgeId] = useState<string | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkWhatsAppOpen, setBulkWhatsAppOpen] = useState(false);
  const [bulkWhatsAppMsg, setBulkWhatsAppMsg] = useState("");
  const [bulkWhatsAppSending, setBulkWhatsAppSending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: defaultRole,
    dept: defaultDept,
    id: "",
    phone: "",
    altPhone: "",
    guardianPhone: "",
    photoUrl: "",
  });
  const [recruitCropSrc, setRecruitCropSrc] = useState<string | null>(null);
  const recruitPhotoRef = useRef<HTMLInputElement>(null);
  const staffImportRef = useRef<HTMLInputElement>(null);
  const attendanceImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      role: roles.some((r) => r.title === prev.role) ? prev.role : defaultRole,
      dept: departments.some((d) => d.name === prev.dept) ? prev.dept : defaultDept,
    }));
  }, [departments, defaultDept, defaultRole, roles]);

  const liveStaff = useMemo(
    () => staff.filter((s) => !isRecordDeleted(s.deletedAt)),
    [staff],
  );
  const deletedStaff = useMemo(
    () =>
      staff
        .filter((s) => isRecordDeleted(s.deletedAt))
        .sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? "")),
    [staff],
  );

  const activeStaff = useMemo(
    () =>
      activeStaffViewId
        ? (liveStaff.find((s) => s.id === activeStaffViewId) ?? null)
        : null,
    [activeStaffViewId, liveStaff],
  );

  const departmentOptions = useMemo(() => {
    const fromStaff = liveStaff.map((s) => s.dept).filter((d): d is string => Boolean(d?.trim()));
    const fromConfig = departments.map((d) => d.name).filter((d): d is string => Boolean(d?.trim()));
    return Array.from(new Set([...fromConfig, ...fromStaff])).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [departments, liveStaff]);

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return liveStaff.filter((member) => {
      const matchesDept = deptFilter === "all" || member.dept === deptFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? member.active : !member.active);
      if (!matchesDept || !matchesStatus) return false;
      if (!q) return true;
      const haystack = [
        member.name,
        member.id,
        member.role,
        member.dept,
        member.phone ?? "",
        member.altPhone ?? "",
        member.guardianPhone ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [liveStaff, deptFilter, statusFilter, searchQuery]);

  const staffFiltersActive = deptFilter !== "all" || statusFilter !== "all";

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(filteredStaff.map((s) => s.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visible.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [filteredStaff]);

  const selectedStaff = useMemo(
    () => filteredStaff.filter((s) => selectedIds.has(s.id)),
    [filteredStaff, selectedIds],
  );

  const selectedStaffWithPhone = useMemo(() => {
    return selectedStaff
      .map((s) => ({ member: s, number: toNotifyWhatsAppNumber(s.phone) }))
      .filter((row): row is { member: Staff; number: string } => Boolean(row.number));
  }, [selectedStaff]);

  const allStaffSelected =
    filteredStaff.length > 0 && filteredStaff.every((s) => selectedIds.has(s.id));
  const someStaffSelected = filteredStaff.some((s) => selectedIds.has(s.id));

  const renderStaffBulkBar = (className?: string) =>
    selectedIds.size > 0 ? (
      <DirectoryBulkActionBar
        selectedCount={selectedIds.size}
        className={className}
        filters={
          <>
            {!allStaffSelected && (
              <button
                type="button"
                onClick={() => toggleStaffSelectAll(true)}
                className={bulkFilterBtn}
              >
                Select all shown
              </button>
            )}
            <button
              type="button"
              onClick={() => selectStaffByStatus("active")}
              className={bulkFilterBtnActive}
            >
              Select active
            </button>
            <button
              type="button"
              onClick={() => selectStaffByStatus("inactive")}
              className={bulkFilterBtn}
            >
              Select inactive
            </button>
            <button type="button" onClick={clearStaffSelection} className={bulkFilterBtn}>
              Clear
            </button>
          </>
        }
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={cn(mobileOutlineBtn, "h-9 rounded-lg px-3")}>
                  Change Status
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                collisionPadding={12}
                className="z-[250] w-44 rounded-lg border-[#E5E5E5] bg-white p-1 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)]"
              >
                <DropdownMenuItem
                  className="cursor-pointer rounded-md text-[13px]"
                  onClick={() => bulkChangeStaffStatus(true)}
                >
                  Set Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer rounded-md text-[13px]"
                  onClick={() => bulkChangeStaffStatus(false)}
                >
                  Set Inactive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              onClick={openStaffBulkWhatsApp}
              className={bulkActionWhatsAppBtn}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Bulk WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setPendingBulkDelete(true)}
              className={bulkActionDeleteBtn}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </>
        }
      />
    ) : null;

  const toggleStaffSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleStaffSelectAll = (selected: boolean) => {
    setSelectedIds((prev) => {
      if (!selected) {
        const next = new Set(prev);
        filteredStaff.forEach((s) => next.delete(s.id));
        return next;
      }
      const next = new Set(prev);
      filteredStaff.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const clearStaffSelection = () => setSelectedIds(new Set());

  const selectStaffByStatus = (kind: "active" | "inactive") => {
    const matches = filteredStaff.filter((s) => (kind === "active" ? s.active : !s.active));
    if (!matches.length) {
      toast.error(
        kind === "active"
          ? "No active staff in the current view"
          : "No inactive staff in the current view",
      );
      return;
    }
    setSelectedIds(new Set(matches.map((s) => s.id)));
    toast.success(
      kind === "active"
        ? `${matches.length} active staff selected`
        : `${matches.length} inactive staff selected`,
    );
  };

  const bulkChangeStaffStatus = (nextActive: boolean) => {
    if (!selectedIds.size) {
      toast.error("Select at least one staff member");
      return;
    }
    const ids = selectedIds;
    setStaff((prev) =>
      prev.map((s) => (ids.has(s.id) ? { ...s, active: nextActive } : s)),
    );
    for (const id of ids) {
      const target = liveStaff.find((s) => s.id === id);
      if (!target) continue;
      void apiUpsertStaff({ ...target, active: nextActive }).catch(() => {});
    }
    toast.success(
      nextActive
        ? `${ids.size} staff set to Active`
        : `${ids.size} staff set to Inactive`,
    );
    clearStaffSelection();
  };

  const confirmBulkDeleteStaff = () => {
    if (!selectedIds.size) {
      setPendingBulkDelete(false);
      return;
    }
    const ids = new Set(selectedIds);
    const stamp = new Date().toISOString();
    const count = ids.size;
    setStaff((prev) =>
      prev.map((s) => (ids.has(s.id) ? { ...s, deletedAt: stamp } : s)),
    );
    for (const id of ids) {
      void apiDeleteStaff(id).catch((err) =>
        toast.error("Could not delete staff on server", {
          description: err instanceof Error ? err.message : "Delete failed",
        }),
      );
    }
    clearStaffSelection();
    setPendingBulkDelete(false);
    toast.success(
      `${count} staff member${count === 1 ? "" : "s"} moved to recycle bin`,
      { description: "Restore anytime from Recycle" },
    );
  };

  const openStaffBulkWhatsApp = () => {
    if (!selectedIds.size) {
      toast.error("Select at least one staff member");
      return;
    }
    if (!selectedStaffWithPhone.length) {
      toast.error("No WhatsApp numbers on selected staff", {
        description: "Add phone numbers before sending",
      });
      return;
    }
    setBulkWhatsAppMsg(
      "Hello, this is a message from the school office.",
    );
    setBulkWhatsAppOpen(true);
  };

  const sendStaffBulkWhatsApp = async () => {
    if (!bulkWhatsAppMsg.trim()) {
      toast.error("Enter a message to send");
      return;
    }
    if (!selectedStaffWithPhone.length) {
      toast.error("No valid phone numbers selected");
      return;
    }
    setBulkWhatsAppSending(true);
    try {
      const numbers = selectedStaffWithPhone.map((row) => row.number);
      const result = await sendWhatsAppNotify({
        numbers,
        message: bulkWhatsAppMsg,
      });
      if (!result.ok) {
        toast.error("WhatsApp send failed", {
          description: result.body.slice(0, 180) || `HTTP ${result.status}`,
        });
        return;
      }
      const skipped = selectedStaff.length - selectedStaffWithPhone.length;
      toast.success(
        `WhatsApp sent to ${numbers.length} staff member${numbers.length === 1 ? "" : "s"}`,
        {
          description:
            skipped > 0
              ? `${skipped} skipped · no phone on file`
              : result.body.slice(0, 120) || "Notify API accepted",
        },
      );
      setBulkWhatsAppOpen(false);
      clearStaffSelection();
    } catch (err) {
      toast.error("WhatsApp send failed", {
        description: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setBulkWhatsAppSending(false);
    }
  };

  const analytics = useMemo(() => {
    const activeMembers = liveStaff.filter((s) => s.active);
    const teachers = activeMembers.filter(isTeachingStaff).length;
    const nonTeaching = activeMembers.filter((s) => !isTeachingStaff(s)).length;
    const active = liveStaff.filter((s) => s.active).length;
    const inactive = liveStaff.length - active;
    return {
      teachers,
      nonTeaching,
      total: liveStaff.length,
      active,
      inactive,
    };
  }, [liveStaff]);

  const restoreStaffMember = (id: string) => {
    const target = deletedStaff.find((s) => s.id === id);
    if (!target) return;
    setStaff((prev) =>
      prev.map((s) => (s.id === id ? { ...s, deletedAt: undefined } : s)),
    );
    void apiDeleteStaff(id, { restore: true }).catch((err) =>
      toast.error("Could not restore staff on server", {
        description: err instanceof Error ? err.message : "Restore failed",
      }),
    );
    toast.success(`${target.name} restored to roster`, { description: target.id });
  };

  const purgeStaffMember = (id: string) => {
    const target = deletedStaff.find((s) => s.id === id);
    if (!target) return;
    setStaff((prev) => prev.filter((s) => s.id !== id));
    setPendingPurgeId(null);
    void apiDeleteStaff(id, { hard: true }).catch((err) =>
      toast.error("Could not permanently delete staff on server", {
        description: err instanceof Error ? err.message : "Delete failed",
      }),
    );
    toast.error(`${target.name} permanently deleted`, { description: target.id });
  };

  const handleRecruitPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (dataUrl) setRecruitCropSrc(dataUrl);
    };
    reader.onerror = () => toast.error("Could not read the selected image");
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRecruit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      toast.error("Name and role are required");
      return;
    }
    const empId = form.id.trim() || `STF-${(22 + staff.length).toString().padStart(3, "0")}`;
    const newStaff: Staff = {
      id: empId,
      name: form.name.trim(),
      role: form.role.trim(),
      dept: form.dept,
      active: true,
      joinedAt: new Date().toISOString().slice(0, 10),
      phone: form.phone.trim() || undefined,
      altPhone: form.altPhone.trim() || undefined,
      guardianPhone: form.guardianPhone.trim() || undefined,
      photoUrl: form.photoUrl || undefined,
      basicSalary: 8000,
      additionalAllowances: 0,
      documents: DEFAULT_STAFF_DOCUMENTS.map((d) => ({ ...d })),
      salaryHistory: [],
      statusHistory: [
        {
          id: `EVT-${empId}-joined`,
          type: "joined" as const,
          at: new Date().toISOString(),
          note: "Joined the school roster",
        },
      ],
    };
    setStaff((prev) => [newStaff, ...prev]);
    void (async () => {
      try {
        let payload = newStaff;
        if (payload.photoUrl?.startsWith("data:")) {
          const url = await apiUploadDataUrl(payload.photoUrl, "photo", "staff-photo.png");
          payload = { ...payload, photoUrl: url };
          setStaff((prev) =>
            prev.map((s) => (s.id === payload.id ? { ...s, photoUrl: url } : s)),
          );
        }
        await apiUpsertStaff(payload);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not sync staff to server");
      }
    })();
    toast.success(`${newStaff.name} recruited`, {
      description: `${newStaff.id} · ${newStaff.dept}`,
    });
    setForm({
      name: "",
      role: defaultRole,
      dept: defaultDept,
      id: "",
      phone: "",
      altPhone: "",
      guardianPhone: "",
      photoUrl: "",
    });
    setOpen(false);
  };

  const handleExport = () => {
    downloadCsv(
      formatDownloadFilename("staff", "csv", {
        school: schoolName,
        year: slugYear(academicYear),
        date: todayStamp(),
      }),
      ["ID", "Name", "Role", "Department", "Status"],
      filteredStaff.map((member) => [
        member.id,
        member.name,
        member.role,
        member.dept,
        member.active ? "Active" : "Inactive",
      ]),
    );
    toast.success("Staff directory exported", {
      description: `${filteredStaff.length} record${filteredStaff.length === 1 ? "" : "s"} saved to CSV`,
    });
  };

  const downloadStaffTemplate = () => {
    downloadCsv(
      "staff-bulk-upload-template.csv",
      ["Name", "Role", "Department", "Phone", "AltPhone", "GuardianPhone", "ID"],
      [
        [
          "Ananya Menon",
          defaultRole || "Teacher",
          defaultDept || "LP",
          "9810012345",
          "9810098765",
          "9876500001",
          "",
        ],
        ["Rahul Nair", "Accountant", "Administrative", "9876501122", "", "9876501123", ""],
      ],
    );
    toast.success("Staff template downloaded", {
      description: "Fill the sample rows, save as CSV, then Upload CSV",
    });
  };

  const handleStaffImportClick = () => staffImportRef.current?.click();

  const handleStaffImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const lines = text.trim().split(/\r?\n/);
      if (!lines.length) {
        toast.error("Empty CSV file");
        return;
      }
      const start = /name|role|staff/i.test(lines[0] ?? "") ? 1 : 0;
      const existingIds = new Set(staff.map((s) => s.id.toLowerCase()));
      const fresh: Staff[] = [];
      let nextSeq = staff.length + 22;
      for (let i = start; i < lines.length; i++) {
        const cells = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        let name = "";
        let role = "";
        let dept = "";
        let phone = "";
        let altPhone = "";
        let guardianPhone = "";
        let idCell = "";
        if (cells.length >= 7) {
          [name, role, dept, phone, altPhone, guardianPhone, idCell] = cells;
        } else if (cells.length >= 5) {
          [name, role, dept, phone, idCell] = cells;
        } else {
          [name, role, dept, phone] = cells;
        }
        if (!name) continue;
        let empId = (idCell || "").trim();
        if (!empId || existingIds.has(empId.toLowerCase())) {
          do {
            empId = `STF-${String(nextSeq++).padStart(3, "0")}`;
          } while (existingIds.has(empId.toLowerCase()));
        }
        existingIds.add(empId.toLowerCase());
        fresh.push({
          id: empId,
          name,
          role: role || defaultRole,
          dept: dept || defaultDept,
          active: true,
          joinedAt: new Date().toISOString().slice(0, 10),
          phone: phone || undefined,
          altPhone: altPhone || undefined,
          guardianPhone: guardianPhone || undefined,
          basicSalary: 8000,
          additionalAllowances: 0,
          documents: DEFAULT_STAFF_DOCUMENTS.map((d) => ({ ...d })),
          salaryHistory: [],
          statusHistory: [
            {
              id: `EVT-${empId}-joined`,
              type: "joined" as const,
              at: new Date().toISOString(),
              note: "Joined the school roster",
            },
          ],
        });
      }
      if (!fresh.length) {
        toast.error("CSV had no parsable rows");
      } else {
        setStaff((prev) => [...fresh, ...prev]);
        toast.success(`${fresh.length} staff imported`, {
          description: "Appended to the staff directory",
        });
      }
      if (staffImportRef.current) staffImportRef.current.value = "";
    };
    reader.onerror = () => toast.error("Could not read the selected file");
    reader.readAsText(file);
  };

  const payrollMonth = currentPayrollMonth();

  const downloadAttendanceDemo = () => {
    const sampleStaff = liveStaff.filter((s) => s.active).slice(0, 4);
    const rows =
      sampleStaff.length > 0
        ? sampleStaff.map((s, index) => [
            s.id,
            s.name,
            payrollMonth,
            String(22 - (index % 3)),
            "24",
          ])
        : [
            ["STF-018", "Anika Roy", payrollMonth, "22", "24"],
            ["STF-019", "Sample Staff", payrollMonth, "20", "24"],
          ];
    downloadCsv(
      `staff-attendance-demo-${payrollMonth}.csv`,
      ["Staff ID", "Name", "Month", "Days Present", "Working Days"],
      rows,
    );
    toast.success("Attendance demo downloaded", {
      description: "Fill Days Present / Working Days, then Upload attendance CSV",
    });
  };

  const handleAttendanceImportClick = () => attendanceImportRef.current?.click();

  const handleAttendanceImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const lines = text.trim().split(/\r?\n/).filter((line) => line.trim());
      if (!lines.length) {
        toast.error("Empty CSV file");
        return;
      }
      const header = (lines[0] ?? "").toLowerCase();
      const start = /staff\s*id|employee|days\s*present|working\s*days|month/i.test(header)
        ? 1
        : 0;
      const byId = new Map(staff.map((s) => [s.id.toLowerCase(), s]));
      const updates = new Map<string, StaffAttendanceMonth>();
      let skipped = 0;

      for (let i = start; i < lines.length; i++) {
        const cells = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        if (cells.length < 4) {
          skipped += 1;
          continue;
        }
        const [staffId, , monthRaw, presentRaw, workingRaw] = cells;
        const member = byId.get((staffId || "").toLowerCase());
        if (!member) {
          skipped += 1;
          continue;
        }
        let month = (monthRaw || "").trim();
        if (/^\d{4}-\d{1,2}$/.test(month)) {
          const [y, m] = month.split("-");
          month = `${y}-${m.padStart(2, "0")}`;
        } else if (!/^\d{4}-\d{2}$/.test(month)) {
          month = payrollMonth;
        }
        const daysPresent = Number(presentRaw);
        const workingDays = Number(workingRaw || presentRaw);
        const normalized = normalizeStaffAttendanceMonth({
          month,
          daysPresent,
          workingDays,
        });
        if (!normalized) {
          skipped += 1;
          continue;
        }
        updates.set(member.id, normalized);
      }

      if (!updates.size) {
        toast.error("No matching staff rows found", {
          description: "Use Staff ID from the directory · download the demo CSV first",
        });
      } else {
        setStaff((prev) =>
          prev.map((member) => {
            const row = updates.get(member.id);
            if (!row) return member;
            return {
              ...member,
              attendanceByMonth: upsertStaffAttendanceMonth(member.attendanceByMonth, row),
            };
          }),
        );
        const months = Array.from(
          new Set(Array.from(updates.values()).map((row) => row.month)),
        );
        toast.success(`Attendance imported · ${updates.size} staff`, {
          description: [
            months.map((m) => formatPayrollMonthLabel(m)).join(", "),
            skipped > 0 ? `${skipped} row${skipped === 1 ? "" : "s"} skipped` : null,
            "Payroll now uses days present ÷ working days",
          ]
            .filter(Boolean)
            .join(" · "),
        });
      }
      if (attendanceImportRef.current) attendanceImportRef.current.value = "";
    };
    reader.onerror = () => toast.error("Could not read the selected file");
    reader.readAsText(file);
  };

  if (!hydrated || branchSyncing) {
    return <TenantDirectorySkeleton label="Loading staff directory" />;
  }

  if (activeStaff) {
    return (
      <StaffProfileDetail
        staff={activeStaff}
        onBack={closeStaff}
        initialEdit={initialEdit}
      />
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-3 overflow-x-clip lg:space-y-6">
      <MobileStatsOverview
        items={[
          {
            label: "Teachers",
            value: analytics.teachers,
            icon: GraduationCap,
            iconClass: "text-[#0F766E]",
          },
          {
            label: "Admin",
            value: analytics.nonTeaching,
            icon: Briefcase,
            iconClass: "text-slate-600",
          },
          {
            label: "Total",
            value: analytics.total,
            icon: Users,
            iconClass: "text-[#0F766E]",
          },
        ]}
      />

      <div className="hidden w-full grid-cols-3 gap-3 lg:grid">
        <div className={cn(glassCardClass, directoryStatCardClass)}>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-1 md:items-start md:gap-2">
            <div className={cn(directoryStatLabelClass, "text-slate-500")}>Teachers</div>
            <GraduationCap className="h-3 w-3 shrink-0 text-slate-400 md:h-4 md:w-4" />
          </div>
          <div className={directoryStatValueClass}>{analytics.teachers}</div>
        </div>

        <div className={cn(glassCardClass, directoryStatCardClass)}>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-1 md:items-start md:gap-2">
            <div className={cn(directoryStatLabelClass, "text-slate-500")}>
              <span className="md:hidden">Admin</span>
              <span className="hidden md:inline">Non-Teaching / Administrative</span>
            </div>
            <Briefcase className="h-3 w-3 shrink-0 text-slate-400 md:h-4 md:w-4" />
          </div>
          <div className={directoryStatValueClass}>{analytics.nonTeaching}</div>
        </div>

        <div className={cn(glassCardClass, directoryStatCardClass, "bg-[#CCFBF1]/40")}>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-1 md:items-start md:gap-2">
            <div className={cn(directoryStatLabelClass, "text-slate-600")}>
              <span className="md:hidden">Total</span>
              <span className="hidden md:inline">Total Staff</span>
            </div>
            <Users className="h-3 w-3 shrink-0 text-slate-400 md:h-4 md:w-4" />
          </div>
          <div className="shrink-0 text-right md:text-left">
            <div className={directoryStatValueClass}>{analytics.total}</div>
            <div className="mt-0.5 font-mono text-[9px] text-slate-500 md:mt-1.5 md:text-[11px]">
              {analytics.active}A · {analytics.inactive}I
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full min-w-0 flex-col gap-2 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        <h1 className="shrink-0 text-[16px] font-bold leading-tight tracking-tight text-slate-900 dark:text-zinc-50 md:text-[24px] md:font-semibold xl:min-w-0 xl:flex-1 xl:truncate xl:text-[28px]">
          {showRecycleBin ? "Recycle Bin" : "Staff Directory"}
        </h1>
        <div className={cn(directoryToolbarRow, "xl:max-w-full xl:shrink-0")}>
          <button
            type="button"
            onClick={() => setShowRecycleBin((v) => !v)}
            className={cn(
              directoryToolbarBtn,
              showRecycleBin
                ? "border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2]"
                : "text-slate-900",
              showRecycleBin && "sm:flex-none",
            )}
            aria-pressed={showRecycleBin}
          >
            <Recycle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate sm:hidden">Bin</span>
            <span className="hidden truncate sm:inline">Recycle</span>
            {deletedStaff.length > 0 && (
              <span
                className={cn(
                  "ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-bold",
                  showRecycleBin ? "bg-[#EF4444] text-white" : "bg-slate-900 text-white",
                )}
              >
                {deletedStaff.length}
              </span>
            )}
          </button>

          {!showRecycleBin && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      directoryToolbarBtn,
                      "relative",
                      staffFiltersActive &&
                        "border-[#99F6E4] bg-[#F0FDFA] text-[#0F766E] hover:bg-[#CCFBF1]",
                    )}
                  >
                    <Filter className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Filter</span>
                    {staffFiltersActive && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#0F766E] ring-2 ring-white dark:ring-zinc-950" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  collisionPadding={12}
                  className="z-[250] w-56 rounded-lg border-[#E5E5E5] bg-white p-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)]"
                >
                  <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    Department
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={deptFilter} onValueChange={setDeptFilter}>
                    <DropdownMenuRadioItem value="all" className="rounded-xl text-[13px]">
                      All departments
                    </DropdownMenuRadioItem>
                    {departmentOptions.map((dept) => (
                      <DropdownMenuRadioItem
                        key={dept}
                        value={dept}
                        className="rounded-xl text-[13px]"
                      >
                        {dept}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    Status
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as StaffStatusFilter)}
                  >
                    <DropdownMenuRadioItem value="all" className="rounded-xl text-[13px]">
                      All statuses
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="active" className="rounded-xl text-[13px]">
                      Active
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="inactive" className="rounded-xl text-[13px]">
                      Inactive
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <button type="button" onClick={handleExport} className={directoryToolbarBtn}>
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Export</span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={directoryToolbarBtn}>
                    <Upload className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate sm:hidden">Upload</span>
                    <span className="hidden truncate sm:inline">Bulk Upload</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  collisionPadding={12}
                  className="z-[250] w-56 rounded-lg border-[#E5E5E5] bg-white p-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)]"
                >
                  <DropdownMenuItem
                    onClick={downloadStaffTemplate}
                    className="cursor-pointer gap-2 rounded-xl text-[13px]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download template
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleStaffImportClick}
                    className="cursor-pointer gap-2 rounded-xl text-[13px]"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={directoryToolbarBtn}>
                    <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate sm:hidden">Attend.</span>
                    <span className="hidden truncate sm:inline">Attendance</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  collisionPadding={12}
                  className="z-[250] w-64 rounded-lg border-[#E5E5E5] bg-white p-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)]"
                >
                  <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    Payroll · {formatPayrollMonthLabel(payrollMonth)}
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={downloadAttendanceDemo}
                    className="cursor-pointer gap-2 rounded-xl text-[13px]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download demo CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleAttendanceImportClick}
                    className="cursor-pointer gap-2 rounded-xl text-[13px]"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload attendance CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={() => setOpen(true)}
                className={cn(
                  mobilePrimaryBtn,
                  "hidden md:inline-flex md:rounded-full md:bg-gradient-to-r md:from-[#0F766E] md:to-[#115E59] md:shadow-md md:shadow-teal-900/15 md:hover:opacity-95 md:hover:bg-gradient-to-r",
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                Recruit Staff
              </button>
            </>
          )}
        </div>
      </div>

      <input
        ref={staffImportRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleStaffImport}
      />
      <input
        ref={attendanceImportRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleAttendanceImport}
      />

      {showRecycleBin ? (
        <div className="space-y-3">
          <p className="text-[13px] text-slate-500">
            Deleted staff stay here until you restore them or delete permanently.
          </p>
          <DirectoryRecycleBinList
            items={deletedStaff}
            emptyLabel="Recycle bin is empty — no deleted staff."
            subtitleFor={(item) => {
              const member = deletedStaff.find((s) => s.id === item.id);
              return member ? `${member.id} · ${member.role}` : item.id;
            }}
            onRestore={restoreStaffMember}
            onPurge={setPendingPurgeId}
          />
        </div>
      ) : (
        <>
      <div className={cn(glassCardClass, "min-w-0 p-2.5 md:p-5")}>
        <div className="flex flex-col gap-2 md:gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 hidden text-[10px] font-semibold uppercase tracking-wider text-slate-500 md:block">
              Search
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 md:h-4 md:w-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, ID, role, phone…"
                className="h-9 w-full rounded-lg border-[#E5E5E5] bg-white pl-9 pr-9 md:h-10"
                aria-label="Search staff"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-end gap-2 lg:gap-4">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 md:gap-4">
              <div className="min-w-0">
                <div className="mb-1.5 hidden text-[10px] font-semibold uppercase tracking-wider text-slate-500 md:block">
                  Department
                </div>
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger
                    className="h-9 w-full rounded-lg border-[#E5E5E5] bg-white md:h-10"
                    aria-label="Department"
                  >
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    className="z-[250] rounded-lg border-[#E5E5E5] bg-white"
                  >
                    <SelectItem value="all" className="rounded-md">
                      All departments
                    </SelectItem>
                    {departmentOptions.map((dept) => (
                      <SelectItem key={dept} value={dept} className="rounded-md">
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0">
                <div className="mb-1.5 hidden text-[10px] font-semibold uppercase tracking-wider text-slate-500 md:block">
                  Status
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as StaffStatusFilter)}
                >
                  <SelectTrigger
                    className="h-9 w-full rounded-lg border-[#E5E5E5] bg-white md:h-10"
                    aria-label="Status"
                  >
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    className="z-[250] rounded-lg border-[#E5E5E5] bg-white"
                  >
                    <SelectItem value="all" className="rounded-md">
                      All statuses
                    </SelectItem>
                    <SelectItem value="active" className="rounded-md">
                      Active
                    </SelectItem>
                    <SelectItem value="inactive" className="rounded-md">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-0.5 flex shrink-0 flex-col items-end gap-0.5 lg:mb-1">
              <span className="font-mono text-[10px] tabular-nums text-slate-400 md:text-[11px]">
                {filteredStaff.length} shown
              </span>
              {(deptFilter !== "all" || statusFilter !== "all" || searchQuery.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    setDeptFilter("all");
                    setStatusFilter("all");
                    setSearchQuery("");
                  }}
                  className="text-[10px] font-semibold text-[#0F766E] underline-offset-2 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedIds.size > 0 ? (
        <div className={cn(glassCardClass, "overflow-hidden p-0 lg:hidden")}>
          {renderStaffBulkBar()}
        </div>
      ) : null}

      <div className={cn(directoryMobileListClass, "lg:hidden")}>
        {filteredStaff.length > 0 && (
          <div className="flex items-center gap-2 px-0.5 md:col-span-2">
            <Checkbox
              checked={allStaffSelected ? true : someStaffSelected ? "indeterminate" : false}
              onCheckedChange={(v) => toggleStaffSelectAll(v === true)}
              aria-label="Select all staff"
            />
            <span className="text-[12px] font-medium text-slate-500">
              {allStaffSelected
                ? "All selected"
                : someStaffSelected
                  ? `${selectedIds.size} selected`
                  : "Select all"}
            </span>
          </div>
        )}
        {filteredStaff.length === 0 && (
          <div className={cn(directoryEmptyClass, "md:col-span-2")}>
            No staff records match the current filters.
          </div>
        )}
        {filteredStaff.map((member) => {
          const digits = phoneDigits(member.phone);
          const hasPhone = digits.length > 0;
          const isSelected = selectedIds.has(member.id);
          return (
            <div
              key={member.id}
              role="button"
              tabIndex={0}
              onClick={() => openStaff(member.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openStaff(member.id);
                }
              }}
              aria-label={`Open profile for ${member.name}`}
              className={cn(
                directoryMobileCardClass,
                "cursor-pointer",
                isSelected && "ring-2 ring-[#0F766E]/35",
              )}
            >
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="shrink-0"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(v) => toggleStaffSelect(member.id, v === true)}
                      aria-label={`Select ${member.name}`}
                    />
                  </div>
                  <DirectoryPersonAvatar name={member.name} photoUrl={member.photoUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold leading-tight text-black sm:text-[14px]">
                      {member.name}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[10px] text-black/45 sm:text-[10.5px]">
                      {member.id}
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <EnrollmentStatusBadge active={member.active} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className={directoryMintChipClass}>{member.role}</span>
                <span className="inline-flex max-w-full truncate rounded-full bg-[#F4F4F5] px-2 py-0.5 text-[10px] font-medium text-black/75 dark:bg-white/10 dark:text-zinc-300 sm:px-2.5 sm:py-1 sm:text-[10.5px]">
                  {member.dept}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[#F0F0F0] pt-2 sm:pt-2.5">
                <div className="min-w-0">
                  <div className="truncate text-[11.5px] font-medium text-black/75 sm:text-[12px]">{member.role}</div>
                  <div className="mt-0.5 truncate font-mono text-[10px] text-black/45 sm:text-[10.5px]">
                    {hasPhone ? formatPhone(member.phone) : "No contact on file"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openStaffEdit(member.id);
                  }}
                  aria-label={`Edit profile for ${member.name}`}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#E5E5E5] bg-[#F4F4F5] text-black/60 dark:text-zinc-400 transition-colors hover:border-black/20 hover:bg-white hover:text-black sm:h-8 sm:w-8"
                >
                  <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mobile-scrollbar-none hidden w-full max-w-full overflow-x-auto lg:block">
        <div className={glassTableWrapClass}>
          {renderStaffBulkBar()}
          <table className="w-full min-w-[700px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[44px]" />
              <col className="w-[32%]" />
              <col className="w-[22%]" />
              <col className="w-[22%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead>
              <tr>
                <th className="border-b border-slate-100 px-3 pb-4 pt-4 sm:px-4 sm:pt-5">
                  <Checkbox
                    checked={allStaffSelected ? true : someStaffSelected ? "indeterminate" : false}
                    onCheckedChange={(v) => toggleStaffSelectAll(v === true)}
                    aria-label="Select all staff"
                    disabled={filteredStaff.length === 0}
                  />
                </th>
                {["Name", "Role", "Department", "Status"].map((header) => (
                  <th
                    key={header}
                    className="border-b border-slate-100 px-4 pb-4 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:border-white/10 dark:text-zinc-400 sm:px-6 sm:pt-5"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-[13px] text-black/55 dark:text-zinc-400 sm:px-6"
                  >
                    No staff records match the current filters.
                  </td>
                </tr>
              )}
              {filteredStaff.map((member) => {
                const isSelected = selectedIds.has(member.id);
                return (
                <tr
                  key={member.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openStaff(member.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openStaff(member.id);
                    }
                  }}
                  aria-label={`Open profile for ${member.name}`}
                  className={cn(
                    "cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-[#F4F4F5] focus-visible:bg-[#F4F4F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F766E] dark:border-white/5 dark:hover:bg-white/5 dark:focus-visible:bg-white/5",
                    isSelected && "bg-[#F0FDFA]/70 hover:bg-[#F0FDFA] dark:bg-[#0F766E]/15 dark:hover:bg-[#0F766E]/25",
                  )}
                >
                  <td
                    className="px-3 py-3.5 align-middle sm:px-4"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(v) => toggleStaffSelect(member.id, v === true)}
                      aria-label={`Select ${member.name}`}
                    />
                  </td>
                  <td className="px-4 py-3.5 align-middle sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <ProfileAvatar
                        name={member.name}
                        photoUrl={member.photoUrl}
                        className="h-10 w-10 shrink-0 rounded-xl"
                        imgClassName="object-cover"
                        initialsClassName="bg-[#0F766E] text-[12px]"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-semibold text-black">
                          {member.name}
                        </div>
                        <div className="mt-0.5 truncate font-mono text-[10.5px] text-black/45">
                          {member.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 align-middle text-[13px] text-black/75 dark:text-zinc-300 sm:px-6">
                    <span className="block truncate">{member.role}</span>
                  </td>
                  <td className="px-4 py-3.5 align-middle text-[13px] text-black/75 dark:text-zinc-300 sm:px-6">
                    <span className="block truncate">{member.dept}</span>
                  </td>
                  <td className="px-4 py-3.5 align-middle sm:px-6">
                    <EnrollmentStatusBadge active={member.active} />
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      <DeleteConfirmDialog
        open={Boolean(pendingPurgeId)}
        onOpenChange={(next) => {
          if (!next) setPendingPurgeId(null);
        }}
        title="Delete permanently"
        description={
          pendingPurgeId
            ? `Permanently delete ${deletedStaff.find((s) => s.id === pendingPurgeId)?.name ?? "this staff member"} (${pendingPurgeId})? This cannot be undone.`
            : "Permanently delete this staff member? This cannot be undone."
        }
        onConfirm={() => {
          if (pendingPurgeId) purgeStaffMember(pendingPurgeId);
        }}
      />

      <DeleteConfirmDialog
        open={pendingBulkDelete}
        onOpenChange={(next) => {
          if (!next) setPendingBulkDelete(false);
        }}
        title="Delete selected staff"
        description={`Move ${selectedIds.size} selected staff member${selectedIds.size === 1 ? "" : "s"} to the recycle bin? You can restore them later from Recycle.`}
        onConfirm={confirmBulkDeleteStaff}
      />

      <Dialog open={bulkWhatsAppOpen} onOpenChange={setBulkWhatsAppOpen}>
        <DialogContent className="flex max-h-[min(90dvh,640px)] w-[calc(100%-1.5rem)] max-w-xl flex-col gap-0 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white p-0 sm:max-w-xl">
          <DialogHeader className="shrink-0 space-y-1.5 border-b border-[#F0F0F0] px-5 pb-4 pt-5 pr-12 text-left sm:px-6 sm:pt-6">
            <DialogTitle className="text-[20px] font-semibold text-black">
              Bulk WhatsApp
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60 dark:text-zinc-400">
              Sends via BugRicer Notify to {selectedStaffWithPhone.length} staff
              member{selectedStaffWithPhone.length === 1 ? "" : "s"}
              {selectedStaff.length > selectedStaffWithPhone.length
                ? ` · ${selectedStaff.length - selectedStaffWithPhone.length} without phone skipped`
                : ""}
              .
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6">
            <div>
              <Label htmlFor="staff-bulk-wa-msg" className="text-[12px] text-slate-500">
                Message
              </Label>
              <Textarea
                id="staff-bulk-wa-msg"
                value={bulkWhatsAppMsg}
                onChange={(e) => setBulkWhatsAppMsg(e.target.value)}
                rows={5}
                placeholder="Type the WhatsApp message…"
                className="mt-1.5 max-h-40 min-h-[120px] resize-y rounded-lg border-[#E5E5E5] bg-white text-[13px]"
              />
            </div>
            <div className="rounded-lg bg-[#F8FAFC] px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-500">
              {selectedStaffWithPhone
                .slice(0, 6)
                .map((row) => row.number)
                .join(", ")}
              {selectedStaffWithPhone.length > 6
                ? ` · +${selectedStaffWithPhone.length - 6} more`
                : ""}
            </div>
          </div>
          <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-[#F0F0F0] bg-white px-5 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              disabled={bulkWhatsAppSending}
              onClick={() => setBulkWhatsAppOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={bulkWhatsAppSending || !selectedStaffWithPhone.length}
              className="rounded-full bg-[#10B981] text-white hover:bg-[#059669]"
              onClick={() => void sendStaffBulkWhatsApp()}
            >
              {bulkWhatsAppSending ? "Sending…" : `Send to ${selectedStaffWithPhone.length}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recruit New Staff</DialogTitle>
            <DialogDescription>
              Provision a faculty / administrative profile for Silver Hills.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecruit} className="space-y-3">
            <div className="flex items-center gap-4 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] p-3">
              <div className="relative h-14 w-14 shrink-0">
                <ProfileAvatar
                  name={form.name.trim() || "Staff"}
                  photoUrl={form.photoUrl || undefined}
                  className="h-14 w-14 rounded-lg"
                  imgClassName="object-cover"
                  initialsClassName="bg-[#0F766E] text-sm"
                />
                <button
                  type="button"
                  onClick={() => recruitPhotoRef.current?.click()}
                  aria-label="Upload profile photo"
                  className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#0F766E] text-white shadow-sm"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="min-w-0 text-[12px] text-black/55 dark:text-zinc-400">
                <div className="font-medium text-black">Profile Photo</div>
                <div className="mt-0.5">Optional · JPG, PNG or WebP · crop after pick</div>
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
                ref={recruitPhotoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleRecruitPhoto}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Full Name
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Sneha Pillai"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Role
              </Label>
              <FieldSelect
                value={form.role}
                onValueChange={(role) => setForm({ ...form, role })}
                options={roles.map((r) => ({ value: r.title, label: r.title }))}
                placeholder="No roles configured"
                disabled={roles.length === 0}
              />
              <p className="text-[10.5px] text-black/45">
                Manage role catalogue under Settings · Roles
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Department
                </Label>
                <FieldSelect
                  value={form.dept}
                  onValueChange={(dept) => setForm({ ...form, dept })}
                  options={departments.map((d) => ({ value: d.name, label: d.name }))}
                  placeholder="No departments configured"
                  disabled={departments.length === 0}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Employee ID
                </Label>
                <Input
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  placeholder="Auto-generate"
                  className="font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Phone
              </Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Primary mobile"
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Alternative Number
                  <span className="ml-1 font-medium normal-case tracking-normal text-black/40">
                    (optional)
                  </span>
                </Label>
                <Input
                  value={form.altPhone}
                  onChange={(e) => setForm({ ...form, altPhone: e.target.value })}
                  placeholder="Optional"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Guardian Number
                </Label>
                <Input
                  value={form.guardianPhone}
                  onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                  placeholder="Emergency / guardian"
                  className="font-mono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]">
                Recruit Staff
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ImageCropDialog
        open={Boolean(recruitCropSrc)}
        imageSrc={recruitCropSrc}
        title="Change photo"
        description="Drag to reposition, zoom, then confirm the crop."
        aspect={1}
        outputSize={512}
        onOpenChange={(next) => {
          if (!next) setRecruitCropSrc(null);
        }}
        onConfirm={(dataUrl) => {
          setRecruitCropSrc(null);
          setForm((prev) => ({ ...prev, photoUrl: dataUrl }));
        }}
        onRetake={() => recruitPhotoRef.current?.click()}
      />

      <DirectoryFloatingAddButton label="Recruit Staff" onClick={() => setOpen(true)} />
    </div>
  );
}

export function FinanceModule() {
  type FinanceView =
    | "overview"
    | "receive"
    | "make"
    | "analytics"
    | "ledger"
    | "pl"
    | "balance"
    | "fees"
    | "salary"
    | "daybook"
    | "reconciliation";

  const { session } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/tenant/finance" });
  const [view, setView] = useState<FinanceView>(search.tab ?? "overview");

  useEffect(() => {
    setView(search.tab ?? "overview");
  }, [search.tab]);

  useEffect(() => {
    if (sessionCanAccessFinanceView(session, view)) return;
    const fallbacks: FinanceView[] = [
      "overview",
      "receive",
      "make",
      "analytics",
      "ledger",
      "pl",
      "balance",
      "fees",
      "salary",
      "daybook",
      "reconciliation",
    ];
    const next = fallbacks.find((v) => sessionCanAccessFinanceView(session, v));
    if (!next) {
      toast.error("You do not have access to finance");
      navigate({ to: "/tenant/dashboard", replace: true });
      return;
    }
    toast.error("You do not have access to this finance view");
    setView(next);
    if (next === "overview") {
      navigate({ to: "/tenant/finance", search: {}, replace: true });
    } else {
      navigate({ to: "/tenant/finance", search: { tab: next }, replace: true });
    }
  }, [session, view, navigate]);

  const openView = (next: FinanceView) => {
    if (!sessionCanAccessFinanceView(session, next)) {
      toast.error("You do not have access to this finance view");
      return;
    }
    setView(next);
    if (next === "overview") {
      navigate({ to: "/tenant/finance", search: {}, replace: true });
      return;
    }
    navigate({ to: "/tenant/finance", search: { tab: next }, replace: true });
  };

  if (view === "receive") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <ReceivePayment />
      </div>
    );
  }

  if (view === "make") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <MakePayment />
      </div>
    );
  }

  if (view === "analytics") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <LedgerAnalytics />
      </div>
    );
  }

  if (view === "ledger") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <GeneralLedgerReport />
      </div>
    );
  }

  if (view === "pl") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <ProfitLossReport />
      </div>
    );
  }

  if (view === "balance") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <BalanceSheetReport />
      </div>
    );
  }

  if (view === "fees") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <FeesReport />
      </div>
    );
  }

  if (view === "salary") {
    return (
      <div className="flex w-full flex-1 flex-col space-y-4 sm:space-y-5">
        <SalaryReport />
      </div>
    );
  }

  if (view === "daybook") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <DayBookReport />
      </div>
    );
  }

  if (view === "reconciliation") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <BankReconciliationReport />
      </div>
    );
  }

  return <FinanceOverview onOpenView={openView} />;
}

function FinanceOverview({
  onOpenView,
}: {
  onOpenView: (
    view:
      | "receive"
      | "make"
      | "analytics"
      | "ledger"
      | "pl"
      | "balance"
      | "fees"
      | "salary"
      | "daybook"
      | "reconciliation",
  ) => void;
}) {
  const { session } = useAuth();
  const {
    activePayments: payments,
    setPayments,
    setStudents,
    paymentCategories,
    academicYear,
    schoolDetails,
    activeStudents: students,
  } = useTenantStore();
  const isAdmin =
    session?.role === "school_admin" || session?.role === "super_admin";
  const schoolName = schoolDetails.name || "Silver Hills Global";
  const [incomePeriod, setIncomePeriod] = useState<PaymentPeriod>("this_month");
  const [customRange, setCustomRange] = useState<CustomDateRange>({ from: "", to: "" });
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [pendingDeletePayment, setPendingDeletePayment] = useState<Payment | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<PaymentAttachment | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    cat: "",
    mode: "Bank",
    amount: "",
    time: "",
    narration: "",
    payerType: "student" as "student" | "external",
  });

  const filteredPayments = useMemo(
    () => filterPaymentsByPeriod(payments, incomePeriod, customRange),
    [payments, incomePeriod, customRange],
  );

  const { disbursements } = useDisbursements();

  const incomeSegments = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const payment of filteredPayments) {
      const key = payment.cat || "Other";
      buckets.set(key, (buckets.get(key) ?? 0) + payment.amount);
    }
    return Array.from(buckets.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredPayments]);

  const incomeTotal = incomeSegments.reduce((sum, item) => sum + item.value, 0);

  const expenseSegments = useMemo(
    () => expenseSegmentsFromDisbursements(disbursements, incomePeriod, customRange),
    [disbursements, incomePeriod, customRange],
  );

  const expenseChartConfig = {
    value: { label: "Expense" },
  } satisfies ChartConfig;

  const overdueBills = useMemo(
    () =>
      queuedPayables(disbursements).map((item, index) => ({
        id: item.id || `OBL-${String(index + 1).padStart(3, "0")}`,
        name: item.payee,
        amount: item.amount,
        due: formatEventDateTime(item.time) === "—" ? "Due" : formatEventDateTime(item.time),
        type: normalizePayeeType(item.payeeType || item.payee),
      })),
    [disbursements],
  );

  const exportTransactionsCsv = () => {
    if (!payments.length) {
      toast.error("Nothing to export · no transactions yet");
      return;
    }
    downloadCsv(
      formatDownloadFilename("transactions", "csv", {
        school: schoolName,
        year: slugYear(academicYear),
        date: todayStamp(),
      }),
      ["Transaction ID", "Account", "Category", "Fee Period", "Mode", "Amount (INR)", "Time", "Status", "Narration"],
      payments.map((p) => [
        p.id,
        p.name,
        p.cat,
        resolvePaymentFeePeriod(p) ?? "",
        p.mode,
        p.amount,
        formatEventDateTime(p.time),
        "Complete",
        p.narration ?? "",
      ]),
    );
    toast.success("Transactions exported", {
      description: `${payments.length} row${payments.length === 1 ? "" : "s"} saved to CSV`,
    });
  };

  const exportTransactionsPdf = () => {
    if (!payments.length) {
      toast.error("Nothing to export · no transactions yet");
      return;
    }
    downloadTablePdf({
      filename: formatDownloadFilename("transactions", "pdf", {
        school: schoolName,
        year: slugYear(academicYear),
        date: todayStamp(),
      }),
      title: "Finance Transactions",
      subtitle: `${schoolName} · ${academicYear}`,
      headers: ["ID", "Account", "Category", "Period", "Mode", "Amount", "Time", "Status", "Narration"],
      rows: payments.map((p) => [
        p.id,
        p.name,
        p.cat,
        resolvePaymentFeePeriod(p) ?? "—",
        p.mode,
        p.amount.toLocaleString("en-IN"),
        formatEventDateTime(p.time),
        "Complete",
        p.narration ?? "",
      ]),
    });
    toast.success("Transactions PDF downloaded");
  };

  const downloadTransaction = async (payment: Payment) => {
    try {
      await downloadReceiptPdf(
        payment,
        schoolName,
        academicYear,
        receiptBrandingFromSchool(schoolDetails, findReceiptStudent(students, payment)),
      );
      toast.success(`Receipt ${payment.id} downloaded`);
    } catch {
      toast.error(`Could not download receipt ${payment.id}`);
    }
  };

  const sharePayload = async (title: string, text: string) => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text });
        toast.success("Shared", { description: title });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard", {
        description: "Paste into WhatsApp, email, or chat",
      });
    } catch {
      toast.error("Could not share · copy failed");
    }
  };

  const shareTransactionsSummary = () => {
    if (!payments.length) {
      toast.error("Nothing to share · no transactions yet");
      return;
    }
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const lines = [
      `${schoolName} · Transactions`,
      `Academic year: ${academicYear}`,
      `${payments.length} receipt${payments.length === 1 ? "" : "s"} · Total ₹ ${total.toLocaleString("en-IN")}`,
      "",
      ...payments.slice(0, 12).map(
        (p) =>
          `• ${p.id} · ${p.name} · ₹ ${p.amount.toLocaleString("en-IN")} · ${formatEventDateTime(p.time)}`,
      ),
    ];
    if (payments.length > 12) {
      lines.push(`…and ${payments.length - 12} more`);
    }
    void sharePayload("Finance Transactions", lines.join("\n"));
  };

  const shareTransaction = (payment: Payment) => {
    const text = [
      `${schoolName} · Fee Receipt`,
      `Receipt: ${payment.id}`,
      `Account: ${payment.name}`,
      `Category: ${payment.cat}`,
      resolvePaymentFeePeriod(payment)
        ? `${resolvePaymentFeePeriodKind(payment) === "term" ? "Fee term" : "Fee month"}: ${resolvePaymentFeePeriod(payment)}`
        : "",
      `Mode: ${payment.mode}`,
      `Amount: ₹ ${payment.amount.toLocaleString("en-IN")}`,
      `Time: ${formatEventDateTime(payment.time)}`,
      `AY: ${academicYear}`,
      "Status: Complete",
      payment.narration ? `Note: ${payment.narration}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    void sharePayload(`Receipt ${payment.id}`, text);
  };

  const isStudentReceipt = (payment: Payment) => payment.payerType !== "external";

  const adjustStudentDue = (payment: Payment, delta: number) => {
    if (!isStudentReceipt(payment) || delta === 0) return;
    setStudents((prev) =>
      prev.map((student) => {
        if (student.name !== payment.name) return student;
        if (payment.className && student.cls !== payment.className) return student;
        return { ...student, due: Math.max(0, student.due + delta) };
      }),
    );
  };

  const openEditPayment = (payment: Payment) => {
    if (!isAdmin) return;
    setEditingPayment(payment);
    setEditForm({
      name: payment.name,
      cat: payment.cat,
      mode: payment.mode,
      amount: String(payment.amount),
      time: receiptTimeForForm(payment.time),
      narration: payment.narration ?? "",
      payerType: payment.payerType === "external" ? "external" : "student",
    });
  };

  const saveEditedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingPayment) return;
    const name = editForm.name.trim();
    const amount = Number(editForm.amount);
    const rawTime = editForm.time.trim();
    const time = toSqlDateTime(rawTime);
    const cat = editForm.cat.trim();
    const mode = editForm.mode.trim();
    if (!name) {
      toast.error("Account name is required");
      return;
    }
    if (!cat) {
      toast.error("Category is required");
      return;
    }
    if (!mode) {
      toast.error("Payment mode is required");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!rawTime || formatEventDateTime(rawTime) === "—") {
      toast.error("Date / time is required");
      return;
    }

    const note = editForm.narration.trim();
    const nextPayment: Payment = {
      ...editingPayment,
      name,
      cat,
      mode,
      amount,
      time,
      payerType: editForm.payerType,
      ...(note ? { narration: note } : { narration: undefined }),
    };

    if (isStudentReceipt(editingPayment) && isStudentReceipt(nextPayment)) {
      adjustStudentDue(editingPayment, editingPayment.amount - amount);
    } else if (isStudentReceipt(editingPayment) && !isStudentReceipt(nextPayment)) {
      adjustStudentDue(editingPayment, editingPayment.amount);
    } else if (!isStudentReceipt(editingPayment) && isStudentReceipt(nextPayment)) {
      adjustStudentDue(nextPayment, -amount);
    }

    setPayments((prev) => prev.map((p) => (p.id === editingPayment.id ? nextPayment : p)));
    void apiUpdatePayment(nextPayment).catch((err) =>
      toast.error("Could not update receipt on server", {
        description: err instanceof Error ? err.message : "Save failed",
      }),
    );
    toast.success(`Receipt ${editingPayment.id} updated`);
    setEditingPayment(null);
  };

  const confirmDeletePayment = () => {
    if (!isAdmin || !pendingDeletePayment) return;
    adjustStudentDue(pendingDeletePayment, pendingDeletePayment.amount);
    setPayments((prev) => prev.filter((p) => p.id !== pendingDeletePayment.id));
    void apiDeletePayment(pendingDeletePayment.id).catch((err) =>
      toast.error("Could not delete receipt on server", {
        description: err instanceof Error ? err.message : "Delete failed",
      }),
    );
    toast.error(`Receipt ${pendingDeletePayment.id} deleted`);
    setPendingDeletePayment(null);
  };

  const shareOverdueBill = (bill: (typeof overdueBills)[number]) => {
    const text = [
      `${schoolName} · Overdue Bill`,
      `Reference: ${bill.id}`,
      `Payee: ${bill.name}`,
      `Type: ${bill.type}`,
      `Amount: ₹ ${bill.amount.toLocaleString("en-IN")}`,
      `Due: ${bill.due}`,
      `AY: ${academicYear}`,
      "Status: Open",
    ].join("\n");
    void sharePayload(`Overdue · ${bill.name}`, text);
  };

  const payOverdueBill = (bill: (typeof overdueBills)[number]) => {
    toast.success("Opening Make Payment", {
      description: `${bill.name} · ₹ ${bill.amount.toLocaleString("en-IN")}`,
    });
    onOpenView("make");
  };

  return (
    <div className="w-full space-y-5 pb-24 md:pb-0">

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {sessionCanAccessFinanceView(session, "receive") && (
          <button
            type="button"
            onClick={() => onOpenView("receive")}
            className={cn(
              glassCardClass,
              "flex min-h-[96px] items-center gap-4 p-4 text-left transition-colors hover:bg-white/70 sm:p-5",
            )}
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#D1F2E1]">
              <ArrowDownToLine className="h-5 w-5 text-[#10B981]" />
            </span>
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-slate-900">Receive payment</div>
              <p className="mt-0.5 text-[12px] text-slate-500">Capture inbound fee receipts</p>
            </div>
          </button>
        )}
        {sessionCanAccessFinanceView(session, "make") && (
          <button
            type="button"
            onClick={() => onOpenView("make")}
            className={cn(
              glassCardClass,
              "flex min-h-[96px] items-center gap-4 p-4 text-left transition-colors hover:bg-white/70 sm:p-5",
            )}
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#CCFBF1]">
              <ArrowUpFromLine className="h-5 w-5 text-[#0F766E]" />
            </span>
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-slate-900">Make payment</div>
              <p className="mt-0.5 text-[12px] text-slate-500">Pay salaries and suppliers</p>
            </div>
          </button>
        )}
      </div>

      <section className={cn(glassCardClass, "p-4 sm:p-5")}>
        <h3 className="text-[15px] font-bold text-slate-900">Reports</h3>
        <p className="mt-0.5 text-[12px] text-slate-500">Financial statements and analytics</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4">
          {(
            [
              {
                k: "fees" as const,
                l: "Fees Report",
                d: "Collections & dues",
                icon: GraduationCap,
                iconClass: "bg-[#CCFBF1] text-[#0F766E]",
              },
              {
                k: "daybook" as const,
                l: "Day Book",
                d: "Daily cash activity",
                icon: BookOpen,
                iconClass: "bg-[#FEF3C7] text-amber-700",
              },
              {
                k: "analytics" as const,
                l: "Analytics",
                d: "Financial insights",
                icon: ChartPie,
                iconClass: "bg-[#D1F2E1] text-[#059669]",
              },
              {
                k: "ledger" as const,
                l: "Ledger",
                d: "Account entries",
                icon: ListTodo,
                iconClass: "bg-[#E0E7FF] text-indigo-600",
              },
              {
                k: "pl" as const,
                l: "Profit & Loss",
                d: "Income vs expense",
                icon: TrendingUp,
                iconClass: "bg-[#DCFCE7] text-emerald-700",
              },
              {
                k: "balance" as const,
                l: "Balance Sheet",
                d: "Assets & liabilities",
                icon: Scale,
                iconClass: "bg-[#FCE7F3] text-pink-700",
              },
              {
                k: "reconciliation" as const,
                l: "Bank Reconciliation",
                d: "Match statement & books",
                icon: Landmark,
                iconClass: "bg-[#CFFAFE] text-cyan-700",
              },
              {
                k: "salary" as const,
                l: "Salary Report",
                d: "Payroll & staff payables",
                icon: Users,
                iconClass: "bg-[#F3E8FF] text-violet-600",
              },
            ] as const
          )
            .filter((item) => sessionCanAccessFinanceView(session, item.k))
            .map((item, index, items) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.k}
                  type="button"
                  onClick={() => onOpenView(item.k)}
                  className={cn(
                    "group flex min-h-[116px] min-w-0 flex-col items-start justify-between gap-3 rounded-2xl border border-white/70 bg-white/70 p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] dark:border-white/10 dark:bg-zinc-900/70 dark:hover:border-white/20 dark:hover:bg-zinc-800 sm:min-h-[128px] sm:p-4",
                    items.length % 2 === 1 &&
                      index === items.length - 1 &&
                      "col-span-2 sm:col-span-1",
                  )}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-10 sm:w-10",
                        item.iconClass,
                      )}
                    >
                      <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#0F766E]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-bold leading-snug text-slate-900 dark:text-zinc-100 sm:text-[14px]">
                      {item.l}
                    </div>
                    <p className="mt-1 text-[10.5px] leading-snug text-slate-500 dark:text-zinc-400 sm:text-[11.5px]">
                      {item.d}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>
      </section>

      <div className="grid grid-cols-12 gap-5">
        <section className={cn(glassCardClass, "col-span-12 flex flex-col p-5 lg:col-span-4")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">Income</h3>
              <p className="mt-0.5 text-[12px] text-slate-500">Category share</p>
            </div>
            <div className="w-[140px] shrink-0">
              <DashboardPeriodFilter
                period={incomePeriod}
                onPeriodChange={setIncomePeriod}
                customRange={customRange}
                onCustomRangeChange={setCustomRange}
              />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {incomeSegments.length === 0 ? (
              <div className={cn(glassInsetClass, "px-3 py-6 text-center text-[12px] text-slate-500")}>
                No income recorded for this period
              </div>
            ) : (
              incomeSegments.map((segment) => {
              const pct = incomeTotal > 0 ? Math.round((segment.value / incomeTotal) * 100) : 0;
              return (
                <div key={segment.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px]">
                    <span className="font-medium text-slate-700">{segment.label}</span>
                    <span className="font-mono text-slate-500">{pct}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#0F766E]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
              })
            )}
          </div>
        </section>

        <section className={cn(glassCardClass, "col-span-12 flex flex-col p-5 lg:col-span-4")}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">Expense</h3>
              <p className="mt-0.5 text-[12px] text-slate-500">Operating outflow</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
              <Filter className="h-3 w-3" />
              Filter
            </span>
          </div>
          <ChartContainer config={expenseChartConfig} className="mx-auto mt-2 h-[180px] w-full max-w-[220px]">
            {expenseSegments.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-[12px] text-slate-500">
                No expenses recorded yet
              </div>
            ) : (
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [formatInr(Number(value)), String(name)]}
                  />
                }
              />
              <Pie
                data={expenseSegments}
                dataKey="value"
                nameKey="label"
                innerRadius="58%"
                outerRadius="88%"
                paddingAngle={2}
                strokeWidth={0}
              >
                {expenseSegments.map((segment, index) => (
                  <Cell
                    key={segment.label}
                    fill={EXPENSE_CHART_COLORS[index % EXPENSE_CHART_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
            )}
          </ChartContainer>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {expenseSegments.length === 0 ? (
              <div className={cn(glassInsetClass, "col-span-2 px-2.5 py-3 text-center text-[11px] text-slate-500")}>
                Make a payment to see outflow here
              </div>
            ) : (
              expenseSegments.slice(0, 4).map((segment) => (
              <div key={segment.label} className={cn(glassInsetClass, "px-2.5 py-2")}>
                <div className="truncate text-[10px] font-medium text-slate-500">{segment.label}</div>
                <div className="mt-0.5 truncate font-mono text-[11px] font-semibold text-slate-900">
                  {formatInr(segment.value)}
                </div>
              </div>
              ))
            )}
          </div>
        </section>

        <section className={cn(glassCardClass, "col-span-12 flex flex-col p-5 lg:col-span-4")}>
          <h3 className="text-[15px] font-bold text-slate-900">Overdue Bills</h3>
          <p className="mt-0.5 text-[12px] text-slate-500">
            {overdueBills.length} open obligation{overdueBills.length === 1 ? "" : "s"}
          </p>
          <div className="mt-4 flex-1 space-y-2.5">
            {overdueBills.length === 0 ? (
              <div className={cn(glassInsetClass, "px-3.5 py-6 text-center text-[12px] text-slate-500")}>
                No open obligations
              </div>
            ) : (
              overdueBills.map((bill, index) => (
              <div
                key={bill.id}
                className={cn(glassInsetClass, "flex flex-col gap-2.5 px-3.5 py-3")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-slate-900">
                      {index + 1}. {bill.name}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      Due {bill.due} · {bill.type}
                    </div>
                  </div>
                  <div className="shrink-0 font-mono text-[13px] font-semibold text-slate-900">
                    {formatInr(bill.amount)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => payOverdueBill(bill)}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#0F766E] px-3 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#0D9488]"
                  >
                    <HandCoins className="h-3.5 w-3.5" />
                    Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => shareOverdueBill(bill)}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 text-[11.5px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>
                </div>
              </div>
            ))
            )}
          </div>
        </section>
      </div>

      <section className={cn(glassCardClass, "p-5")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">Transactions</h3>
            <p className="mt-0.5 text-[12px] text-slate-500">
              {payments.length} receipt{payments.length === 1 ? "" : "s"} · most recent first
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-full border-[#E5E5E5] bg-white px-3.5 text-[12px]"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download
                  <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                collisionPadding={12}
                className="z-[250] w-48 rounded-lg border-[#E5E5E5] bg-white p-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)]"
              >
                <DropdownMenuItem
                  onClick={exportTransactionsPdf}
                  className="cursor-pointer gap-2 rounded-xl text-[13px]"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={exportTransactionsCsv}
                  className="cursor-pointer gap-2 rounded-xl text-[13px]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-full border-[#E5E5E5] bg-white px-3.5 text-[12px]"
              onClick={shareTransactionsSummary}
            >
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              Share
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2.5 md:hidden">
          {payments.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#E5E5E5] bg-white/60 px-4 py-8 text-center text-[12px] text-black/55 dark:text-zinc-400">
              No transactions recorded yet
            </div>
          )}
          {payments.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-[#E5E5E5] bg-white p-3.5 shadow-sm shadow-slate-200/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold text-slate-900">{p.name}</div>
                  <div className="mt-0.5 truncate font-mono text-[10.5px] text-black/45">{p.id}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[14px] font-bold text-slate-900">
                    ₹ {p.amount.toLocaleString("en-IN")}
                  </div>
                  <span className="mt-1 inline-flex rounded-full bg-[#D1F2E1] px-2 py-0.5 text-[9.5px] font-semibold text-[#059669]">
                    Complete
                  </span>
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex max-w-full truncate rounded-full bg-[#CCFBF1] px-2 py-0.5 text-[10px] font-semibold text-[#0F172A]">
                  {p.cat}
                </span>
                <span className="inline-flex max-w-full truncate rounded-full bg-[#F4F4F5] px-2 py-0.5 text-[10px] font-medium text-black/70">
                  {p.mode}
                </span>
                {p.payerType === "external" && (
                  <span className="inline-flex rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-semibold text-[#B45309]">
                    External
                  </span>
                )}
              </div>

              {p.narration && (
                <p className="mt-2 line-clamp-2 text-[11.5px] leading-snug text-black/55 dark:text-zinc-400">
                  {p.narration}
                </p>
              )}

              {(p.attachments?.length ?? 0) > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.attachments!.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => setPreviewAttachment(file)}
                      className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-[#E5E5E5] bg-[#F8F8F9] px-2 py-0.5 text-[10px] font-medium text-black/65 transition-colors hover:border-black/20 hover:bg-white"
                    >
                      <Paperclip className="h-3 w-3 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#F0F0F0] pt-2.5">
                <span className="min-w-0 truncate font-mono text-[10.5px] text-black/45">
                  {formatEventDateTime(p.time)}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        aria-label={`Edit receipt ${p.id}`}
                        onClick={() => openEditPayment(p)}
                        className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] text-black/55 dark:text-zinc-400 transition-colors hover:border-black hover:bg-[#F4F4F5] hover:text-black"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete receipt ${p.id}`}
                        onClick={() => setPendingDeletePayment(p)}
                        className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    aria-label={`Download receipt ${p.id}`}
                    onClick={() => downloadTransaction(p)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#E5E5E5] px-2.5 text-[11px] font-semibold text-black/65 transition-colors hover:border-black hover:bg-[#F4F4F5] hover:text-black"
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </button>
                  <button
                    type="button"
                    aria-label={`Share receipt ${p.id}`}
                    onClick={() => shareTransaction(p)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#CCFBF1] bg-[#F0FDFA] px-2.5 text-[11px] font-semibold text-[#0F766E] transition-colors hover:bg-[#CCFBF1]"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mobile-scrollbar-none mt-4 hidden overflow-x-auto rounded-lg border border-[#E5E5E5] md:block">
          <table className="w-full min-w-[780px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F4F4F5]">
                {["Transaction", "Account", "Date / Time", "Amount", "Status", "Actions"].map(
                  (header) => (
                  <th
                    key={header}
                    className={cn(
                      "px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400",
                      header === "Actions" && "text-right",
                    )}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[12px] text-black/55 dark:text-zinc-400">
                    No transactions recorded yet
                  </td>
                </tr>
              )}
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-[#F0F0F0] last:border-0">
                  <td className="px-3 py-3 font-mono text-[11px] text-black/70">{p.id}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-black">{p.name}</div>
                    <div className="text-[11px] text-black/50">
                      {p.cat} · {p.mode}
                      {p.payerType === "external" ? " · External" : ""}
                      {p.narration ? ` · ${p.narration}` : ""}
                      {(p.attachments?.length ?? 0) > 0
                        ? ` · ${p.attachments!.length} file${p.attachments!.length === 1 ? "" : "s"}`
                        : ""}
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px] text-black/55 dark:text-zinc-400">{formatEventDateTime(p.time)}</td>
                  <td className="px-3 py-3 font-mono font-semibold text-black">
                    ₹ {p.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex rounded-full bg-[#D1F2E1] px-2.5 py-1 text-[10px] font-semibold text-[#059669]">
                      Complete
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            aria-label={`Edit receipt ${p.id}`}
                            title="Edit"
                            onClick={() => openEditPayment(p)}
                            className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] text-black/55 dark:text-zinc-400 transition-colors hover:border-black hover:bg-[#F4F4F5] hover:text-black"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete receipt ${p.id}`}
                            title="Delete"
                            onClick={() => setPendingDeletePayment(p)}
                            className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        aria-label={`Download receipt ${p.id}`}
                        title="Download"
                        onClick={() => downloadTransaction(p)}
                        className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] text-black/55 dark:text-zinc-400 transition-colors hover:border-black hover:bg-[#F4F4F5] hover:text-black"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Share receipt ${p.id}`}
                        title="Share"
                        onClick={() => shareTransaction(p)}
                        className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] text-black/55 dark:text-zinc-400 transition-colors hover:border-[#0F766E] hover:bg-[#CCFBF1] hover:text-[#0F766E]"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isAdmin && (
        <>
          <Dialog
            open={Boolean(editingPayment)}
            onOpenChange={(open) => {
              if (!open) setEditingPayment(null);
            }}
          >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Transaction</DialogTitle>
                <DialogDescription>
                  Update receipt {editingPayment?.id}. Student ledger balance adjusts automatically
                  when the amount changes.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={saveEditedPayment} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                    Account
                  </Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Payer / student name"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                      Category
                    </Label>
                    <Select
                      value={editForm.cat}
                      onValueChange={(cat) =>
                        setEditForm({
                          ...editForm,
                          cat,
                          payerType: categorySuggestsExternal(cat) ? "external" : editForm.payerType,
                        })
                      }
                    >
                      <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E5E5] bg-white">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          new Set([
                            ...paymentCategories.map((c) => c.label),
                            editForm.cat,
                          ].filter(Boolean)),
                        ).map((label) => (
                          <SelectItem key={label} value={label}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                      Mode
                    </Label>
                    <Select
                      value={editForm.mode}
                      onValueChange={(mode) => setEditForm({ ...editForm, mode })}
                    >
                      <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E5E5] bg-white">
                        <SelectValue placeholder="Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          new Set(["Bank", "Cash", "Both", editForm.mode].filter(Boolean)),
                        ).map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                      Amount (₹)
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                      Payer type
                    </Label>
                    <Select
                      value={editForm.payerType}
                      onValueChange={(payerType) =>
                        setEditForm({
                          ...editForm,
                          payerType: payerType as "student" | "external",
                        })
                      }
                    >
                      <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E5E5] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="external">External</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                    Date / Time
                  </Label>
                  <Input
                    value={editForm.time}
                    onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                    placeholder="e.g. Today · 10:22"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                    Narration
                  </Label>
                  <Textarea
                    value={editForm.narration}
                    onChange={(e) => setEditForm({ ...editForm, narration: e.target.value })}
                    placeholder="Optional note"
                    className="min-h-[72px] resize-none"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingPayment(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]">
                    Save changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <DeleteConfirmDialog
            open={Boolean(pendingDeletePayment)}
            onOpenChange={(open) => {
              if (!open) setPendingDeletePayment(null);
            }}
            title="Delete Transaction"
            description={
              pendingDeletePayment
                ? `Delete receipt ${pendingDeletePayment.id} for ${pendingDeletePayment.name} (₹ ${pendingDeletePayment.amount.toLocaleString("en-IN")})? This cannot be undone.`
                : "Are you sure you want to delete this transaction?"
            }
            onConfirm={confirmDeletePayment}
          />

          <AttachmentPreviewDialog
            file={previewAttachment}
            open={Boolean(previewAttachment)}
            onOpenChange={(open) => {
              if (!open) setPreviewAttachment(null);
            }}
          />
        </>
      )}

      <FinanceFloatingPaymentActions
        onReceive={() => onOpenView("receive")}
        onMake={() => onOpenView("make")}
      />
    </div>
  );
}

function FieldLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-1 text-[10px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400",
        className,
      )}
    >
      {children}
    </div>
  );
}

function categorySuggestsExternal(category: string) {
  const lower = category.toLowerCase();
  return (
    lower.includes("donation") ||
    lower.includes("grant") ||
    lower.includes("sponsor") ||
    lower.includes("other")
  );
}

type FeeLineItem = {
  id: string;
  description: string;
  customDescription: string;
  amount: string;
  feePeriodKind: FeePeriodKind;
  feePeriod: string;
};

const RECEIVE_PAYMENT_MODES = ["Bank", "Cash", "Both"] as const;

function newFeeLineId() {
  return `fl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function newPaymentCategoryId() {
  return `PC-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

const FIELD_SELECT_ADD_NEW = "__field_select_add_new__";

function feeDescriptionSelectOptions(
  descriptionOptions: { value: string; label: string }[],
  currentDescription: string,
) {
  const options = [...descriptionOptions];
  if (
    currentDescription.trim() &&
    !options.some((o) => o.value.toLowerCase() === currentDescription.trim().toLowerCase())
  ) {
    options.push({ value: currentDescription, label: currentDescription });
  }
  return options;
}

function classSelectOptions(classes: ClassConfig[], currentClass: string) {
  const options = classes.map((c) => ({ value: c.className, label: c.className }));
  if (
    currentClass.trim() &&
    !options.some((o) => o.value.toLowerCase() === currentClass.trim().toLowerCase())
  ) {
    options.push({ value: currentClass, label: currentClass });
  }
  return options;
}

function isOtherFeeDescription(label: string) {
  return label.trim().toLowerCase() === "other";
}

function feeLineCategoryLabel(item: FeeLineItem) {
  if (isOtherFeeDescription(item.description) && item.customDescription.trim()) {
    return item.customDescription.trim();
  }
  return item.description.trim();
}

function createFeeLineItem(partial?: Partial<FeeLineItem>): FeeLineItem {
  return {
    id: newFeeLineId(),
    description: "Tuition Fee",
    customDescription: "",
    amount: "",
    feePeriodKind: "month",
    feePeriod: currentFeeMonth(),
    ...partial,
  };
}

function uniqueByLabel<T extends { label: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.label.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function feePeriodChoices(
  feeTerms: FeeTerm[],
  description: string,
): { value: string; label: string; kind: FeePeriodKind; period: string }[] {
  const termKind = categoryFeeTermKind(description);
  const terms = uniqueByLabel(termKind ? filterFeePeriods(feeTerms, "term", termKind) : []);
  const months = uniqueByLabel(termKind ? filterFeePeriods(feeTerms, "month", termKind) : []);
  const monthLabels = months.length > 0 ? months.map((t) => t.label) : [...FEE_MONTHS];
  const choices = [
    ...terms.map((t) => ({
      value: `term:${t.label}`,
      label: [t.label, t.coverage || formatFeeTermCoverage(t.startDate, t.endDate)]
        .filter(Boolean)
        .join(" · "),
      kind: "term" as const,
      period: t.label,
    })),
    ...monthLabels.map((label) => {
      const monthTerm = months.find((t) => t.label === label);
      return {
        value: `month:${label}`,
        label: monthTerm
          ? [label, monthTerm.coverage || formatFeeTermCoverage(monthTerm.startDate, monthTerm.endDate)]
              .filter(Boolean)
              .join(" · ")
          : label,
        kind: "month" as const,
        period: label,
      };
    }),
  ];
  const seen = new Set<string>();
  return choices.filter((choice) => {
    if (seen.has(choice.value)) return false;
    seen.add(choice.value);
    return true;
  });
}

function defaultFeePeriod(
  feeTerms: FeeTerm[],
  description: string,
  billingCycle?: string,
): { feePeriodKind: FeePeriodKind; feePeriod: string } {
  const choices = feePeriodChoices(feeTerms, description);
  if (billingCycle === "Term") {
    const term = choices.find((c) => c.kind === "term");
    if (term) return { feePeriodKind: "term", feePeriod: term.period };
  }
  const month = choices.find((c) => c.kind === "month");
  if (month) return { feePeriodKind: "month", feePeriod: month.period };
  const first = choices[0];
  if (first) return { feePeriodKind: first.kind, feePeriod: first.period };
  return { feePeriodKind: "month", feePeriod: currentFeeMonth() };
}

function parseFeePeriodValue(value: string): { feePeriodKind: FeePeriodKind; feePeriod: string } {
  const sep = value.indexOf(":");
  if (sep <= 0) return { feePeriodKind: "month", feePeriod: value };
  const kind = value.slice(0, sep);
  const period = value.slice(sep + 1);
  return {
    feePeriodKind: kind === "term" ? "term" : "month",
    feePeriod: period,
  };
}

function prefillAmountForFeeLine(
  item: Pick<FeeLineItem, "description" | "feePeriodKind" | "feePeriod">,
  matchedClass: ClassConfig | undefined,
  feeTerms: FeeTerm[],
  tuitionFee: number | undefined,
  vehicleFee: number | undefined,
): number | undefined {
  const category = item.description;
  const lower = category.toLowerCase();
  const termKind = categoryFeeTermKind(category);
  const termsForCategory = termKind ? filterFeePeriods(feeTerms, "term", termKind) : [];
  const monthsForCategory = termKind ? filterFeePeriods(feeTerms, "month", termKind) : [];
  const selectedTerm =
    item.feePeriodKind === "term"
      ? termsForCategory.find((t) => t.label === item.feePeriod)
      : undefined;
  const selectedMonthPeriod =
    item.feePeriodKind === "month"
      ? monthsForCategory.find((t) => t.label === item.feePeriod)
      : undefined;

  if (matchedClass) {
    const scheduled = withClassFeeSchedule(matchedClass, feeTerms);
    const periodList = item.feePeriodKind === "term" ? termsForCategory : monthsForCategory;
    const selectedPeriod = item.feePeriodKind === "term" ? selectedTerm : selectedMonthPeriod;
    const periodIndex = selectedPeriod
      ? periodList.findIndex((p) => p.id === selectedPeriod.id || p.label === selectedPeriod.label)
      : -1;
    const fromSchedule = classFeePrefillAmount(scheduled, {
      category,
      periodLabel: item.feePeriod || selectedPeriod?.label,
      periodIndex: periodIndex >= 0 ? periodIndex : undefined,
    });
    if (fromSchedule && fromSchedule > 0) return fromSchedule;
  }
  if (selectedTerm?.feeAmount && selectedTerm.feeAmount > 0) return selectedTerm.feeAmount;
  if (selectedMonthPeriod?.feeAmount && selectedMonthPeriod.feeAmount > 0) {
    return selectedMonthPeriod.feeAmount;
  }
  if (lower.includes("vehicle") || lower.includes("transport") || lower.includes("bus")) {
    return vehicleFee;
  }
  if (isOtherFeeDescription(category) || categorySuggestsExternal(category)) return undefined;
  return tuitionFee && tuitionFee > 0 ? tuitionFee : undefined;
}

function splitMatchesTotal(mode: string, bank: string, cash: string, total: number) {
  if (mode !== "Both") return true;
  const bankN = Number(bank);
  const cashN = Number(cash);
  return bankN > 0 && cashN > 0 && bankN + cashN === total;
}

function receiptTimeForForm(raw?: string) {
  const formatted = formatEventDateTime(raw);
  if (!formatted || formatted === "—") return formatDisbursalTime();
  return formatted;
}

function parseMoneyPart(part: string): { label: string; amount: number } | null {
  const match = part.trim().match(/^(.*?)\s+(?:₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)\s*$/i);
  if (!match) return null;
  const amount = Number(match[2].replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount < 0) return null;
  return { label: match[1].trim(), amount };
}

function parseStoredReceiptNarration(raw?: string): {
  note: string;
  breakdown: { label: string; amount: number }[];
  bankSplit: string;
  cashSplit: string;
} {
  const parts = (raw ?? "")
    .split(/\s*[·|]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  const leftover: string[] = [];
  const breakdown: { label: string; amount: number }[] = [];
  let bankSplit = "";
  let cashSplit = "";
  let inBreakdown = false;

  for (const part of parts) {
    const started = /^Fee breakdown:/i.test(part);
    if (started) inBreakdown = true;
    const cleaned = part.replace(/^Fee breakdown:\s*/i, "").trim();
    const parsed = parseMoneyPart(cleaned);
    if (parsed && /^Bank$/i.test(parsed.label)) {
      bankSplit = String(Math.round(parsed.amount));
      continue;
    }
    if (parsed && /^Cash$/i.test(parsed.label)) {
      cashSplit = String(Math.round(parsed.amount));
      continue;
    }
    if ((inBreakdown || started) && parsed) {
      breakdown.push({ label: parsed.label, amount: parsed.amount });
      continue;
    }
    leftover.push(part);
  }

  return { note: leftover.join(" · "), breakdown, bankSplit, cashSplit };
}

function feeLineFromStoredCategory(
  label: string,
  amount: number,
  kind: FeePeriodKind,
  period: string,
  categoryLabels: string[],
  fallbackCategory: string,
): FeeLineItem {
  const trimmed = label.trim() || fallbackCategory;
  const match = categoryLabels.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (match) {
    return createFeeLineItem({
      description: match,
      amount: String(Math.round(amount)),
      feePeriodKind: kind,
      feePeriod: period,
    });
  }
  const other = categoryLabels.find((c) => isOtherFeeDescription(c)) ?? "Other";
  return createFeeLineItem({
    description: other,
    customDescription: trimmed,
    amount: String(Math.round(amount)),
    feePeriodKind: kind,
    feePeriod: period,
  });
}

function PaymentModeControls({
  mode,
  onModeChange,
  bankSplitAmount,
  cashSplitAmount,
  onBankChange,
  onCashChange,
}: {
  mode: string;
  onModeChange: (next: string) => void;
  bankSplitAmount: string;
  cashSplitAmount: string;
  onBankChange: (next: string) => void;
  onCashChange: (next: string) => void;
}) {
  return (
    <>
      <FieldLabel>Payment Mode</FieldLabel>
      <div className="flex h-11 gap-1 rounded-full border border-[#E5E5E5] bg-white p-1 dark:border-white/10 dark:bg-zinc-900 sm:h-10">
        {RECEIVE_PAYMENT_MODES.map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              className={cn(
                "flex h-full flex-1 items-center justify-center rounded-full px-2 text-[12px] font-medium transition-colors sm:px-3",
                active
                  ? "bg-[#0F766E] text-white"
                  : "text-black/65 hover:text-black dark:text-zinc-300 dark:hover:text-zinc-50",
              )}
            >
              {m}
            </button>
          );
        })}
      </div>
      {mode === "Both" && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <div className="mb-1 text-[10px] font-medium text-black/45">Bank (₹)</div>
            <input
              value={bankSplitAmount}
              onChange={(e) => onBankChange(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              placeholder="0"
              className="h-10 w-full rounded-lg border border-[#E5E5E5] bg-white px-3 font-mono text-[13px] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <div className="mb-1 text-[10px] font-medium text-black/45">Cash (₹)</div>
            <input
              value={cashSplitAmount}
              onChange={(e) => onCashChange(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              placeholder="0"
              className="h-10 w-full rounded-lg border border-[#E5E5E5] bg-white px-3 font-mono text-[13px] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>
      )}
    </>
  );
}

function ReceivePayment() {
  const { session } = useAuth();
  const {
    activeStudents: students,
    setStudents,
    activePayments: payments,
    setPayments,
    classes: classConfigs,
    transportRoutes,
    paymentCategories,
    setPaymentCategories,
    activeFeeTerms: feeTerms,
    academicYear,
    schoolDetails,
  } = useTenantStore();
  const isAdmin =
    session?.role === "school_admin" || session?.role === "super_admin";
  const schoolName = schoolDetails.name || "Silver Hills Global";
  const classes = useMemo(() => {
    const fromConfig = classConfigs.map((c) => c.className);
    const fromStudents = Array.from(new Set(students.map((s) => s.cls)));
    return Array.from(new Set([...fromConfig, ...fromStudents]));
  }, [classConfigs, students]);
  const defaultCategory = paymentCategories[0]?.label ?? "Tuition Fee";
  const ledgerDefault =
    paymentCategories.find((c) => /donation/i.test(c.label))?.label ??
    paymentCategories.find((c) => categorySuggestsExternal(c.label))?.label ??
    defaultCategory;
  const [payerSource, setPayerSource] = useState<"student" | "external">("student");
  const [externalPayer, setExternalPayer] = useState("");
  const [externalAmount, setExternalAmount] = useState("");
  const [ledgerCategory, setLedgerCategory] = useState(ledgerDefault);
  const [cls, setCls] = useState(classes[0] ?? "");
  const studentsInClass = useMemo(
    () =>
      students
        .filter((s) => studentBelongsToClass(s.cls, cls))
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" })),
    [students, cls],
  );
  const [stu, setStu] = useState(studentsInClass[0]?.name ?? "");
  const [feeItems, setFeeItems] = useState<FeeLineItem[]>(() => [
    createFeeLineItem({ description: defaultCategory }),
  ]);
  const [mode, setMode] = useState("Bank");
  const [bankSplitAmount, setBankSplitAmount] = useState("");
  const [cashSplitAmount, setCashSplitAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [receiptTime, setReceiptTime] = useState(() => formatDisbursalTime());
  const [attachments, setAttachments] = useState<PaymentAttachment[]>([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const recordCardRef = useRef<HTMLDivElement>(null);
  const [previewAttachment, setPreviewAttachment] = useState<PaymentAttachment | null>(null);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [pendingDeletePayment, setPendingDeletePayment] = useState<Payment | null>(null);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addCategoryTarget, setAddCategoryTarget] = useState<
    { type: "feeLine"; id: string } | { type: "ledger" } | null
  >(null);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  const isExternal = payerSource === "external";
  const selected = !isExternal
    ? studentsInClass.find((s) => s.name === stu) ??
      (editingPayment ? students.find((s) => s.name === stu) : undefined)
    : undefined;
  const descriptionOptions = useMemo(
    () => paymentCategories.map((c) => ({ value: c.label, label: c.label })),
    [paymentCategories],
  );
  const filledFeeItems = useMemo(
    () => feeItems.filter((item) => Number(item.amount) > 0),
    [feeItems],
  );
  const studentTotal = useMemo(
    () => filledFeeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [filledFeeItems],
  );
  const externalValue = Number(externalAmount) || 0;
  const recordTotal = isExternal ? externalValue : studentTotal;
  const firstFilledLine = filledFeeItems[0];
  const primaryCategory = isExternal
    ? ledgerCategory.trim() || "Donation"
    : firstFilledLine
      ? feeLineCategoryLabel(firstFilledLine)
      : defaultCategory;
  const primaryPeriodKind = firstFilledLine?.feePeriodKind ?? "month";
  const primaryPeriod = firstFilledLine?.feePeriod ?? currentFeeMonth();
  const splitOk = splitMatchesTotal(mode, bankSplitAmount, cashSplitAmount, recordTotal);

  useEffect(() => {
    if (editingPayment) return;
    if (classes.length && !classes.includes(cls)) {
      setCls(classes[0]);
    }
  }, [classes, cls, editingPayment]);

  useEffect(() => {
    if (isExternal || editingPayment) return;
    if (!cls) {
      if (stu) setStu("");
      return;
    }
    if (studentsInClass.some((s) => s.name === stu)) return;
    setStu(studentsInClass[0]?.name ?? "");
  }, [cls, studentsInClass, stu, isExternal, editingPayment]);

  useEffect(() => {
    if (editingPayment) return;
    if (!paymentCategories.length) return;
    const labels = new Set(paymentCategories.map((c) => c.label));
    setFeeItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (labels.has(item.description)) return item;
        changed = true;
        return { ...item, description: paymentCategories[0].label, customDescription: "" };
      });
      return changed ? next : prev;
    });
    if (!labels.has(ledgerCategory)) {
      setLedgerCategory(ledgerDefault);
    }
  }, [paymentCategories, ledgerCategory, ledgerDefault, editingPayment]);

  const matchedRouteFee = useMemo(() => {
    if (!selected) return undefined;
    const haystack = `${selected.address ?? ""} ${selected.cls}`.toLowerCase();
    const matched = transportRoutes.find((r) =>
      r.mapFrom
        .toLowerCase()
        .split(/[ ,]+/)
        .some((token) => token.length > 3 && haystack.includes(token)),
    );
    return matched?.bothFee ?? transportRoutes[0]?.bothFee;
  }, [selected, transportRoutes]);

  const matchedClass = useMemo(
    () => classConfigs.find((c) => c.className === selected?.cls),
    [classConfigs, selected],
  );

  const tuitionFee = matchedClass?.tuitionFeeAmount;

  const vehicleFee = useMemo(() => {
    if (matchedClass && matchedClass.vehicleFeeAmount > 0) {
      return matchedClass.vehicleFeeAmount;
    }
    return matchedRouteFee;
  }, [matchedClass, matchedRouteFee]);

  const applyPrefillToLines = useCallback(
    (lines: FeeLineItem[]) => {
      let changed = false;
      const next = lines.map((item) => {
        if (item.amount.trim()) return item;
        const prefill = prefillAmountForFeeLine(
          item,
          matchedClass,
          feeTerms,
          tuitionFee,
          vehicleFee,
        );
        if (prefill && prefill > 0) {
          changed = true;
          return { ...item, amount: String(prefill) };
        }
        return item;
      });
      return changed ? next : lines;
    },
    [feeTerms, matchedClass, tuitionFee, vehicleFee],
  );

  useEffect(() => {
    if (isExternal || editingPayment) return;
    setFeeItems((prev) => applyPrefillToLines(prev));
  }, [applyPrefillToLines, isExternal, selected?.id, editingPayment]);

  useEffect(() => {
    if (isExternal || !matchedClass || editingPayment) return;
    setFeeItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        const choices = feePeriodChoices(feeTerms, item.description);
        const valid = choices.some(
          (c) => c.kind === item.feePeriodKind && c.period === item.feePeriod,
        );
        if (matchedClass.billingCycle === "Term") {
          const termChoice = choices.find((c) => c.kind === "term");
          if (termChoice && item.feePeriodKind !== "term") {
            changed = true;
            return { ...item, feePeriodKind: "term" as const, feePeriod: termChoice.period };
          }
        }
        if (matchedClass.billingCycle === "Monthly" && item.feePeriodKind === "term") {
          const monthChoice = choices.find((c) => c.kind === "month");
          if (monthChoice) {
            changed = true;
            return { ...item, feePeriodKind: "month" as const, feePeriod: monthChoice.period };
          }
        }
        if (!valid) {
          const fallback = defaultFeePeriod(feeTerms, item.description, matchedClass.billingCycle);
          changed = true;
          return { ...item, ...fallback };
        }
        return item;
      });
      return changed ? next : prev;
    });
  }, [feeTerms, isExternal, matchedClass, editingPayment]);

  const updateFeeLine = (id: string, patch: Partial<FeeLineItem>) => {
    setFeeItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        let next = { ...item, ...patch };
        if (patch.description) {
          const choices = feePeriodChoices(feeTerms, patch.description);
          const stillValid = choices.some(
            (c) => c.kind === next.feePeriodKind && c.period === next.feePeriod,
          );
          if (!stillValid) {
            const period = defaultFeePeriod(feeTerms, patch.description, matchedClass?.billingCycle);
            next = { ...next, ...period };
          }
          if (!isOtherFeeDescription(patch.description)) {
            next.customDescription = "";
          }
        }
        if (!("amount" in patch) && !next.amount.trim()) {
          const prefill = prefillAmountForFeeLine(
            next,
            matchedClass,
            feeTerms,
            tuitionFee,
            vehicleFee,
          );
          if (prefill && prefill > 0) next = { ...next, amount: String(prefill) };
        }
        return next;
      }),
    );
  };

  const addFeeItem = () => {
    const used = new Set(feeItems.map((item) => item.description));
    const nextCat =
      paymentCategories.find((c) => !used.has(c.label)) ??
      paymentCategories[0] ?? { label: defaultCategory };
    const period = defaultFeePeriod(feeTerms, nextCat.label, matchedClass?.billingCycle);
    const line = createFeeLineItem({ description: nextCat.label, ...period });
    const prefill = prefillAmountForFeeLine(line, matchedClass, feeTerms, tuitionFee, vehicleFee);
    if (prefill && prefill > 0) line.amount = String(prefill);
    setFeeItems((prev) => [...prev, line]);
  };

  const removeFeeItem = (id: string) => {
    setFeeItems((prev) => (prev.length <= 1 ? prev : prev.filter((item) => item.id !== id)));
  };

  const openAddCategoryDialog = (
    target: { type: "feeLine"; id: string } | { type: "ledger" },
  ) => {
    setAddCategoryTarget(target);
    setNewCategoryLabel("");
    setAddCategoryOpen(true);
  };

  const submitNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = newCategoryLabel.trim();
    if (!label) {
      toast.error("Enter a fee description");
      return;
    }
    if (
      paymentCategories.some((c) => c.label.trim().toLowerCase() === label.toLowerCase())
    ) {
      toast.error("This fee description already exists");
      return;
    }
    const draft: PaymentCategory = { id: newPaymentCategoryId(), label };
    setSavingCategory(true);
    try {
      const saved = getApiToken() ? await apiUpsertPaymentCategory(draft) : draft;
      setPaymentCategories((prev) => [...prev, saved]);
      if (addCategoryTarget?.type === "feeLine") {
        updateFeeLine(addCategoryTarget.id, { description: saved.label, customDescription: "" });
      } else if (addCategoryTarget?.type === "ledger") {
        setLedgerCategory(saved.label);
      }
      setAddCategoryOpen(false);
      setAddCategoryTarget(null);
      setNewCategoryLabel("");
      toast.success(`Added “${saved.label}”`, {
        description: getApiToken() ? "Saved to fee categories" : "Available for this session",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add fee description");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleModeChange = (next: string) => {
    setMode(next);
    if (next !== "Both") {
      setBankSplitAmount("");
      setCashSplitAmount("");
    }
  };

  const addAttachments = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const room = MAX_PAYMENT_ATTACHMENTS - attachments.length;
    if (room <= 0) {
      toast.error(`Maximum ${MAX_PAYMENT_ATTACHMENTS} attachments allowed`);
      return;
    }

    const files = Array.from(fileList).slice(0, room);
    const next: PaymentAttachment[] = [];

    for (const file of files) {
      if (file.size > MAX_PAYMENT_ATTACHMENT_BYTES) {
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
        });
      } catch {
        toast.error(`Could not read ${file.name}`);
      }
    }

    if (!next.length) return;
    setAttachments((prev) => [...prev, ...next]);
    toast.success(
      next.length === 1 ? `${next[0].name} attached` : `${next.length} files attached`,
    );
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const downloadHistoryReceipt = async (payment: Payment) => {
    try {
      await downloadReceiptPdf(
        payment,
        schoolName,
        academicYear,
        receiptBrandingFromSchool(schoolDetails, findReceiptStudent(students, payment)),
      );
      toast.success(`Receipt ${payment.id} downloaded`);
    } catch {
      toast.error(`Could not download receipt ${payment.id}`);
    }
  };

  const sharePayload = async (title: string, text: string) => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text });
        toast.success("Shared", { description: title });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard", {
        description: "Paste into WhatsApp, email, or chat",
      });
    } catch {
      toast.error("Could not share · copy failed");
    }
  };

  const isStudentReceipt = (payment: Payment) => payment.payerType !== "external";

  const adjustStudentDue = (payment: Payment, delta: number) => {
    if (!isStudentReceipt(payment) || delta === 0) return;
    setStudents((prev) =>
      prev.map((student) => {
        if (student.name !== payment.name) return student;
        if (payment.className && student.cls !== payment.className) return student;
        return { ...student, due: Math.max(0, student.due + delta) };
      }),
    );
  };

  const shareHistoryReceipt = (payment: Payment) => {
    const period = resolvePaymentFeePeriod(payment);
    const periodKind = resolvePaymentFeePeriodKind(payment);
    const text = [
      `${schoolName} · Fee Receipt`,
      `Receipt: ${payment.id}`,
      `Account: ${payment.name}`,
      `Category: ${payment.cat}`,
      period ? `${periodKind === "term" ? "Fee term" : "Fee month"}: ${period}` : "",
      `Mode: ${payment.mode}`,
      `Amount: ₹ ${payment.amount.toLocaleString("en-IN")}`,
      `Time: ${formatEventDateTime(payment.time)}`,
      `AY: ${academicYear}`,
      payment.narration ? `Note: ${payment.narration}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    void sharePayload(`Receipt ${payment.id}`, text);
  };

  const resetRecordForm = () => {
    setEditingPayment(null);
    setPayerSource("student");
    setExternalPayer("");
    setExternalAmount("");
    setLedgerCategory(ledgerDefault);
    setNarration("");
    setReceiptTime(formatDisbursalTime());
    setAttachments([]);
    setBankSplitAmount("");
    setCashSplitAmount("");
    setMode("Bank");
    const resetPeriod = defaultFeePeriod(feeTerms, defaultCategory, matchedClass?.billingCycle);
    setFeeItems([createFeeLineItem({ description: defaultCategory, ...resetPeriod })]);
  };

  const openEditHistoryPayment = (payment: Payment) => {
    setViewingPayment(null);
    setEditingPayment(payment);
    const parsed = parseStoredReceiptNarration(payment.narration);
    const isExt = payment.payerType === "external";
    const kind = resolvePaymentFeePeriodKind(payment);
    const period = resolvePaymentFeePeriod(payment) || currentFeeMonth();
    const categoryLabels = paymentCategories.map((c) => c.label);

    setPayerSource(isExt ? "external" : "student");
    setMode(payment.mode || "Bank");
    setReceiptTime(receiptTimeForForm(payment.time));
    setNarration(parsed.note);
    setAttachments(payment.attachments ? [...payment.attachments] : []);
    setBankSplitAmount(payment.mode === "Both" ? parsed.bankSplit : "");
    setCashSplitAmount(payment.mode === "Both" ? parsed.cashSplit : "");
    setExternalPayer(payment.name);
    setExternalAmount(String(payment.amount));
    setLedgerCategory(payment.cat || ledgerDefault);

    if (!isExt) {
      const className =
        payment.className ||
        students.find((s) => s.name.trim().toLowerCase() === payment.name.trim().toLowerCase())?.cls ||
        cls;
      setCls(className);
      setStu(payment.name);
      const lines = (parsed.breakdown.length
        ? parsed.breakdown
        : [{ label: payment.cat || defaultCategory, amount: payment.amount }]
      ).map((item) =>
        feeLineFromStoredCategory(
          item.label,
          item.amount,
          kind,
          period,
          categoryLabels,
          defaultCategory,
        ),
      );
      setFeeItems(lines.length ? lines : [createFeeLineItem({ description: defaultCategory, ...defaultFeePeriod(feeTerms, defaultCategory), amount: String(payment.amount) })]);
    }

    requestAnimationFrame(() => {
      recordCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const saveEditedHistoryPayment = () => {
    if (!editingPayment) return;
    const value = recordTotal;
    if (!value || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!receiptTime.trim()) {
      toast.error("Date / time is required");
      return;
    }
    if (!splitOk) {
      toast.error("Bank and cash amounts must add up to the total");
      return;
    }

    const stamp = toSqlDateTime(receiptTime.trim());
    const extras: string[] = [];
    if (!isExternal && filledFeeItems.length > 1) {
      extras.push(
        `Fee breakdown: ${filledFeeItems
          .map((item) => `${feeLineCategoryLabel(item)} ₹${Number(item.amount).toLocaleString("en-IN")}`)
          .join(" · ")}`,
      );
    }
    if (mode === "Both") {
      extras.push(
        `Bank ₹${Number(bankSplitAmount).toLocaleString("en-IN")} · Cash ₹${Number(cashSplitAmount).toLocaleString("en-IN")}`,
      );
    }
    const note = [narration.trim(), ...extras].filter(Boolean).join(" · ");
    const receiptAttachments = attachments.length ? attachments : undefined;

    if (isExternal) {
      const payer = externalPayer.trim();
      if (!payer) {
        toast.error("Enter the donor / payer name");
        return;
      }
      if (!primaryCategory) {
        toast.error("Select a ledger category");
        return;
      }
    } else {
      if (!stu.trim() && !selected) {
        toast.error("Select a valid student");
        return;
      }
      if (filledFeeItems.length === 0) {
        toast.error("Add at least one fee item with an amount");
        return;
      }
      for (const item of filledFeeItems) {
        if (!feeLineCategoryLabel(item)) {
          toast.error("Each fee item needs a description");
          return;
        }
        if (!item.feePeriod.trim()) {
          toast.error("Each fee item needs a fee period");
          return;
        }
      }
    }

    const periodLabel = isExternal
      ? resolvePaymentFeePeriod(editingPayment) || currentFeeMonth()
      : primaryPeriod.trim();
    const nextPayment: Payment = {
      ...editingPayment,
      name: isExternal ? externalPayer.trim() : selected?.name ?? stu.trim(),
      cat: primaryCategory,
      mode,
      amount: value,
      time: stamp,
      academicYear: editingPayment.academicYear ?? academicYear,
      feePeriodKind: isExternal ? "month" : primaryPeriodKind,
      feePeriod: periodLabel,
      feeMonth: periodLabel,
      payerType: isExternal ? "external" : "student",
      className: isExternal ? undefined : selected?.cls ?? editingPayment.className ?? cls,
      ...(note ? { narration: note } : { narration: undefined }),
      ...(receiptAttachments ? { attachments: receiptAttachments } : { attachments: undefined }),
    };

    if (isStudentReceipt(editingPayment) && isStudentReceipt(nextPayment)) {
      adjustStudentDue(editingPayment, editingPayment.amount - value);
    } else if (isStudentReceipt(editingPayment) && !isStudentReceipt(nextPayment)) {
      adjustStudentDue(editingPayment, editingPayment.amount);
    } else if (!isStudentReceipt(editingPayment) && isStudentReceipt(nextPayment)) {
      adjustStudentDue(nextPayment, -value);
    }

    setPayments((prev) => prev.map((p) => (p.id === editingPayment.id ? nextPayment : p)));
    void apiUpdatePayment(nextPayment).catch((err) =>
      toast.error("Could not update receipt on server", {
        description: err instanceof Error ? err.message : "Save failed",
      }),
    );
    toast.success(`Receipt ${editingPayment.id} updated`);
    resetRecordForm();
  };

  const confirmDeleteHistoryPayment = () => {
    if (!pendingDeletePayment) return;
    adjustStudentDue(pendingDeletePayment, pendingDeletePayment.amount);
    setPayments((prev) => prev.filter((p) => p.id !== pendingDeletePayment.id));
    void apiDeletePayment(pendingDeletePayment.id).catch((err) =>
      toast.error("Could not delete receipt on server", {
        description: err instanceof Error ? err.message : "Delete failed",
      }),
    );
    toast.error(`Receipt ${pendingDeletePayment.id} deleted`);
    if (editingPayment?.id === pendingDeletePayment.id) {
      resetRecordForm();
    }
    setPendingDeletePayment(null);
  };

  const handleRecord = async () => {
    if (savingReceipt) return;
    const value = recordTotal;
    if (!value || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!receiptTime.trim()) {
      toast.error("Date / time is required");
      return;
    }
    if (!splitOk) {
      toast.error("Bank and cash amounts must add up to the total");
      return;
    }

    const stamp = toSqlDateTime(receiptTime.trim());
    const extras: string[] = [];
    if (!isExternal && filledFeeItems.length > 1) {
      extras.push(
        `Fee breakdown: ${filledFeeItems
          .map((item) => `${feeLineCategoryLabel(item)} ₹${Number(item.amount).toLocaleString("en-IN")}`)
          .join(" · ")}`,
      );
    }
    if (mode === "Both") {
      extras.push(
        `Bank ₹${Number(bankSplitAmount).toLocaleString("en-IN")} · Cash ₹${Number(cashSplitAmount).toLocaleString("en-IN")}`,
      );
    }
    const note = [narration.trim(), ...extras].filter(Boolean).join(" · ");
    const receiptAttachments = attachments.length ? attachments : undefined;

    if (isExternal) {
      const payer = externalPayer.trim();
      if (!payer) {
        toast.error("Enter the donor / payer name");
        return;
      }
      if (!primaryCategory) {
        toast.error("Select a ledger category");
        return;
      }
      const periodLabel = currentFeeMonth();
      const draft: Payment = {
        id: "",
        name: payer,
        cat: primaryCategory,
        mode,
        amount: value,
        time: stamp,
        academicYear,
        feePeriodKind: "month",
        feePeriod: periodLabel,
        feeMonth: periodLabel,
        payerType: "external",
        ...(note ? { narration: note } : {}),
        ...(receiptAttachments ? { attachments: receiptAttachments } : {}),
      };
      setSavingReceipt(true);
      try {
        const saved = await apiCreatePayment(draft);
        setPayments((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
        toast.success(`Receipt ${saved.id} · ₹ ${value.toLocaleString("en-IN")} captured`, {
          description: `External · ${payer} · ${primaryCategory} · ${periodLabel}${
            receiptAttachments ? ` · ${receiptAttachments.length} file${receiptAttachments.length === 1 ? "" : "s"}` : ""
          }`,
        });
        setExternalAmount("");
        setExternalPayer("");
        setNarration("");
        setReceiptTime(formatDisbursalTime());
        setAttachments([]);
        setBankSplitAmount("");
        setCashSplitAmount("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save receipt");
      } finally {
        setSavingReceipt(false);
      }
      return;
    }

    if (!selected) {
      toast.error("Select a valid student");
      return;
    }
    if (filledFeeItems.length === 0) {
      toast.error("Add at least one fee item with an amount");
      return;
    }
    for (const item of filledFeeItems) {
      if (!feeLineCategoryLabel(item)) {
        toast.error("Each fee item needs a description");
        return;
      }
      if (!item.feePeriod.trim()) {
        toast.error("Each fee item needs a fee period");
        return;
      }
    }
    const periodLabel = primaryPeriod.trim();
    const draft: Payment = {
      id: "",
      name: selected.name,
      cat: primaryCategory,
      mode,
      amount: value,
      time: stamp,
      academicYear,
      feePeriodKind: primaryPeriodKind,
      feePeriod: periodLabel,
      feeMonth: periodLabel,
      payerType: "student",
      className: selected.cls,
      ...(note ? { narration: note } : {}),
      ...(receiptAttachments ? { attachments: receiptAttachments } : {}),
    };
    setSavingReceipt(true);
    try {
      const saved = await apiCreatePayment(draft, {
        reduceDue: true,
        studentId: selected.id,
      });
      setPayments((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
      setStudents((prev) =>
        prev.map((s) => (s.id === selected.id ? { ...s, due: Math.max(0, s.due - value) } : s)),
      );
      const remaining = Math.max(0, selected.due - value);
      toast.success(`Receipt ${saved.id} · ₹ ${value.toLocaleString("en-IN")} captured`, {
        description:
          remaining === 0
            ? `${selected.name}'s balance is now Cleared · ${periodLabel}`
            : `${selected.name} · ${periodLabel} · balance ₹ ${remaining.toLocaleString("en-IN")}`,
      });
      const resetPeriod = defaultFeePeriod(feeTerms, defaultCategory, matchedClass?.billingCycle);
      setFeeItems([createFeeLineItem({ description: defaultCategory, ...resetPeriod })]);
      setNarration("");
      setReceiptTime(formatDisbursalTime());
      setAttachments([]);
      setBankSplitAmount("");
      setCashSplitAmount("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save receipt");
    } finally {
      setSavingReceipt(false);
    }
  };

  const todayTotal = useMemo(
    () =>
      payments
        .filter((p) => isEventToday(p.time))
        .reduce((sum, p) => sum + p.amount, 0),
    [payments],
  );

  const filteredPayments = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) => {
      const haystack = [
        p.id,
        p.name,
        p.cat,
        p.mode,
        p.time,
        formatEventDateTime(p.time),
        p.feePeriod ?? "",
        p.feeMonth ?? "",
        resolvePaymentFeePeriodKind(p),
        p.className ?? "",
        p.narration ?? "",
        p.payerType === "external" ? "external donor payer" : "student",
        String(p.amount),
        p.amount.toLocaleString("en-IN"),
        ...(p.attachments?.map((a) => a.name) ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [payments, historyQuery]);

  const summaryName = isExternal ? externalPayer.trim() || "External payer" : stu;
  const studentLinesValid =
    filledFeeItems.length > 0 &&
    filledFeeItems.every(
      (item) => feeLineCategoryLabel(item).length > 0 && item.feePeriod.trim().length > 0,
    );
  const canSubmit =
    recordTotal > 0 &&
    splitOk &&
    receiptTime.trim().length > 0 &&
    (isExternal
      ? externalPayer.trim().length > 0 && primaryCategory.length > 0
      : (Boolean(selected) || Boolean(editingPayment && stu.trim())) && studentLinesValid);
  const classOptions = useMemo(() => {
    if (cls && !classes.includes(cls)) return [cls, ...classes];
    return classes;
  }, [classes, cls]);
  const studentOptions = useMemo(() => {
    const opts = studentsInClass.map((s) => ({ value: s.name, label: s.name }));
    if (editingPayment && stu && !opts.some((o) => o.value === stu)) {
      return [{ value: stu, label: stu }, ...opts];
    }
    return opts;
  }, [studentsInClass, stu, editingPayment]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div ref={recordCardRef}>
      <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="text-[17px] font-bold leading-tight tracking-tight text-black dark:text-zinc-50 sm:text-title">
              {editingPayment
                ? `Edit Receipt ${editingPayment.id}`
                : isExternal
                  ? "External payer"
                  : "Fee Collection"}
            </div>
            {editingPayment && (
              <p className="mt-1 text-[12px] leading-snug text-black/55 dark:text-zinc-400">
                Update this receipt on the same collection form. Student ledger balance adjusts
                automatically when the amount changes.
              </p>
            )}
          </div>
          {editingPayment && (
            <button
              type="button"
              onClick={resetRecordForm}
              className="inline-flex h-9 shrink-0 items-center rounded-full border border-[#E5E5E5] bg-white px-3.5 text-[12px] font-semibold text-black/70 transition-colors hover:bg-[#F4F4F5] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Cancel edit
            </button>
          )}
        </div>

        <input
          ref={attachmentInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => {
            void addAttachments(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="mt-5 grid grid-cols-12 gap-x-4 gap-y-5 sm:gap-x-5 sm:gap-y-6">
          <div className="col-span-12">
            <FieldLabel>Received From</FieldLabel>
            <div className="flex h-11 w-full gap-1 rounded-full border border-[#E5E5E5] bg-white p-1 dark:border-white/10 dark:bg-zinc-900 sm:h-10">
              {(
                [
                  { key: "student" as const, label: "Student" },
                  { key: "external" as const, label: "External payer" },
                ] as const
              ).map((option) => {
                const active = payerSource === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setPayerSource(option.key)}
                    className={cn(
                      "flex h-full flex-1 items-center justify-center rounded-full px-3 text-[12px] font-medium transition-colors",
                      active
                        ? "bg-[#0F766E] text-white"
                        : "text-black/65 hover:text-black dark:text-zinc-300 dark:hover:text-zinc-50",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {isExternal ? (
            <>
              <div className="col-span-12 grid grid-cols-12 gap-x-4 gap-y-5 lg:col-span-6 lg:grid-cols-1 lg:gap-y-5">
                <div className="col-span-12">
                  <FieldLabel>Donor / payer</FieldLabel>
                  <Input
                    value={externalPayer}
                    onChange={(e) => setExternalPayer(e.target.value)}
                    placeholder="e.g. Parent Association · Ravi Kumar"
                    className="h-11 sm:h-10"
                  />
                </div>
                <div className="col-span-12">
                  <FieldLabel>Amount</FieldLabel>
                  <input
                    value={externalAmount}
                    onChange={(e) => setExternalAmount(e.target.value.replace(/[^0-9]/g, ""))}
                    inputMode="numeric"
                    placeholder="0"
                    className="h-11 w-full rounded-lg border border-[#E5E5E5] bg-white px-3 font-mono text-[15px] font-semibold dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 sm:h-10 sm:text-[13px] sm:font-normal"
                  />
                </div>
                <div className="col-span-12 flex flex-col">
                  <FieldLabel>Narration</FieldLabel>
                  <Textarea
                    value={narration}
                    onChange={(e) => setNarration(e.target.value)}
                    placeholder="Optional note · purpose, reference, or remarks"
                    className="min-h-[140px] w-full flex-1 resize-none rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-[13px]"
                  />
                </div>
              </div>

              <div className="col-span-12 grid grid-cols-12 gap-x-4 gap-y-5 lg:col-span-6 lg:grid-cols-1">
                <div className="col-span-12">
                  <FieldLabel>Ledger Link</FieldLabel>
                  <FieldSelect
                    className="min-w-0"
                    value={ledgerCategory}
                    onValueChange={setLedgerCategory}
                    options={descriptionOptions}
                    placeholder="Select category"
                    triggerClassName="h-11 sm:h-10"
                    onAddNew={() => openAddCategoryDialog({ type: "ledger" })}
                    addNewLabel="Add new description"
                  />
                </div>
                <div className="col-span-12">
                  <PaymentModeControls
                    mode={mode}
                    onModeChange={handleModeChange}
                    bankSplitAmount={bankSplitAmount}
                    cashSplitAmount={cashSplitAmount}
                    onBankChange={setBankSplitAmount}
                    onCashChange={setCashSplitAmount}
                  />
                  {mode === "Both" && !splitOk && recordTotal > 0 && (
                    <p className="mt-1.5 text-[10.5px] text-red-600">
                      Bank + Cash must equal ₹ {recordTotal.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
                <div className="col-span-12 flex flex-col">
                  <div className="mb-1 flex min-h-[15px] items-center justify-between gap-2">
                    <FieldLabel className="mb-0">Attachment</FieldLabel>
                    <span className="text-[10.5px] font-medium text-black/45">
                      {attachments.length} / {MAX_PAYMENT_ATTACHMENTS}
                    </span>
                  </div>
                  <div className="flex min-h-[140px] flex-1 flex-col rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-3 dark:border-white/10 dark:bg-zinc-900/50">
                    {attachments.length > 0 ? (
                      <ul className="mb-3 max-h-28 flex-1 space-y-2 overflow-y-auto">
                        {attachments.map((file) => (
                          <li
                            key={file.id}
                            className="flex items-center gap-2 rounded-lg border border-[#EFEFEF] bg-white px-2.5 py-2 dark:border-white/10 dark:bg-zinc-900"
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0 text-black/40" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[12px] font-medium text-black">{file.name}</div>
                              <div className="font-mono text-[10px] text-black/45">
                                {formatAttachmentSize(file.size)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPreviewAttachment(file)}
                              className="inline-flex h-7 items-center rounded-lg border border-slate-200 px-2 text-[10.5px] font-semibold text-black/60 transition-colors hover:bg-slate-50"
                            >
                              Open
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAttachment(file.id)}
                              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50"
                              aria-label={`Remove ${file.name}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mb-3 flex-1 text-[12px] leading-snug text-black/45">
                        Attach bank slips, cheques, or supporting documents.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => attachmentInputRef.current?.click()}
                      disabled={attachments.length >= MAX_PAYMENT_ATTACHMENTS}
                      className="mt-auto inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3.5 text-[12px] font-semibold text-black transition-colors hover:border-black/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      Add files
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="col-span-12 sm:col-span-6">
                <FieldLabel>Class</FieldLabel>
                <FieldSelect
                  value={cls}
                  onValueChange={(next) => {
                    setCls(next);
                    if (editingPayment) return;
                    const first = students
                      .filter((s) => studentBelongsToClass(s.cls, next))
                      .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }))[0];
                    setStu(first?.name ?? "");
                  }}
                  options={classOptions.map((c) => ({ value: c, label: c }))}
                  placeholder="Select class"
                  disabled={classes.length === 0}
                  searchable
                  searchPlaceholder="Search class..."
                  triggerClassName="h-11 sm:h-10"
                />
              </div>
              <div className="col-span-12 sm:col-span-6">
                <FieldLabel>Student</FieldLabel>
                <FieldSelect
                  value={stu}
                  onValueChange={setStu}
                  options={studentOptions}
                  placeholder={
                    !cls
                      ? "Select a class first"
                      : studentsInClass.length
                        ? "Select student"
                        : "No students in this class"
                  }
                  disabled={!cls || (studentsInClass.length === 0 && !editingPayment)}
                  searchable
                  searchPlaceholder="Search student..."
                  triggerClassName="h-11 sm:h-10"
                />
              </div>

              {feeItems.map((item, index) => {
                const periodChoices = feePeriodChoices(feeTerms, item.description);
                const selectedPeriodLabel =
                  periodChoices.find(
                    (c) => c.kind === item.feePeriodKind && c.period === item.feePeriod,
                  )?.label ?? item.feePeriod;
                const itemAmount = Number(item.amount) || 0;
                return (
                  <div key={item.id} className="col-span-12">
                    <div className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-3.5 shadow-sm dark:border-white/10 dark:bg-zinc-900/50 sm:p-4">
                      <div className="flex items-start justify-between gap-3 border-b border-[#EFEFEF] pb-3 dark:border-white/10">
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-semibold text-black dark:text-zinc-100">
                            Fee item {index + 1}
                          </div>
                          <p className="mt-0.5 truncate text-[12px] text-black/50 dark:text-zinc-400">
                            {feeLineCategoryLabel(item) || "Choose fee and period"}
                          </p>
                          {selectedPeriodLabel ? (
                            <p className="mt-0.5 truncate text-[11px] text-black/40 dark:text-zinc-500">
                              {selectedPeriodLabel}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {itemAmount > 0 ? (
                            <span className="rounded-lg bg-white px-2.5 py-1 font-mono text-[13px] font-semibold text-[#0F766E] ring-1 ring-[#99F6E4]/60 dark:bg-zinc-950 dark:text-[#2DD4BF]">
                              ₹ {itemAmount.toLocaleString("en-IN")}
                            </span>
                          ) : null}
                          {feeItems.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeFeeItem(item.id)}
                              aria-label={`Remove fee item ${index + 1}`}
                              className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] transition-colors hover:bg-[#FEE2E2] dark:border-rose-500/40 dark:bg-rose-950/50 dark:text-rose-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-12 gap-3">
                        <div className="col-span-12 min-w-0">
                          <FieldLabel>Fee description</FieldLabel>
                          <FieldSelect
                            value={item.description}
                            onValueChange={(next) => updateFeeLine(item.id, { description: next })}
                            options={feeDescriptionSelectOptions(descriptionOptions, item.description)}
                            placeholder="Select fee"
                            triggerClassName="h-11 sm:h-10"
                            onAddNew={() => openAddCategoryDialog({ type: "feeLine", id: item.id })}
                            addNewLabel="Add new description"
                          />
                          {isOtherFeeDescription(item.description) && (
                            <Input
                              value={item.customDescription}
                              onChange={(e) =>
                                updateFeeLine(item.id, { customDescription: e.target.value })
                              }
                              placeholder="Describe this fee"
                              className="mt-1.5 h-10 border-red-200 text-[12px] text-red-700 placeholder:text-red-400"
                            />
                          )}
                        </div>
                        <div className="col-span-12 min-w-0 sm:col-span-5">
                          <FieldLabel>Amount</FieldLabel>
                          <input
                            value={item.amount}
                            onChange={(e) =>
                              updateFeeLine(item.id, {
                                amount: e.target.value.replace(/[^0-9]/g, ""),
                              })
                            }
                            inputMode="numeric"
                            placeholder="0"
                            className="h-11 w-full rounded-lg border border-[#E5E5E5] bg-white px-3 font-mono text-[15px] font-semibold dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 sm:h-10 sm:text-[13px] sm:font-normal"
                          />
                        </div>
                        <div className="col-span-12 min-w-0 sm:col-span-7">
                          <FieldLabel>Fee period</FieldLabel>
                          <FieldSelect
                            value={`${item.feePeriodKind}:${item.feePeriod}`}
                            onValueChange={(next) =>
                              updateFeeLine(item.id, parseFeePeriodValue(next))
                            }
                            options={periodChoices.map((c) => ({ value: c.value, label: c.label }))}
                            placeholder="Select period"
                            className="min-w-0"
                            triggerClassName="h-11 min-w-0 sm:h-10"
                            contentClassName="min-w-[min(100vw-1.5rem,20rem)]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="col-span-12">
                <button
                  type="button"
                  onClick={addFeeItem}
                  className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#0F766E]/35 bg-[#F0FDFA]/60 text-[13px] font-semibold text-[#0F766E] transition-colors hover:border-[#0F766E]/50 hover:bg-[#F0FDFA] dark:border-teal-500/30 dark:bg-teal-950/20 dark:text-[#2DD4BF] dark:hover:bg-teal-950/35"
                >
                  <Plus className="h-4 w-4" />
                  Add fee item
                </button>
              </div>

              <div className="col-span-12 flex items-center justify-between gap-4 rounded-xl border border-[#E8E8EA] bg-[#F8F8F9] px-4 py-3.5 dark:border-white/10 dark:bg-zinc-900/80">
                <div className="min-w-0">
                  <FieldLabel className="mb-0.5">Total Amount</FieldLabel>
                  <div className="text-[13px] text-black/65 dark:text-zinc-300">
                    {amountToIndianWords(recordTotal)}
                  </div>
                </div>
                <div className="shrink-0 rounded-lg border border-[#E5E5E5] bg-white px-3.5 py-2 font-mono text-[16px] font-semibold text-black dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50">
                  {recordTotal.toLocaleString("en-IN")}
                </div>
              </div>

              <div className="col-span-12 flex flex-col lg:col-span-7">
                <FieldLabel>Narration</FieldLabel>
                <Textarea
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  placeholder="Optional note · purpose, reference, or remarks"
                  className="min-h-[140px] w-full flex-1 resize-none rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-[13px] lg:min-h-[168px]"
                />
              </div>

              <div className="col-span-12 space-y-4 lg:col-span-5">
                <div>
                  <PaymentModeControls
                    mode={mode}
                    onModeChange={handleModeChange}
                    bankSplitAmount={bankSplitAmount}
                    cashSplitAmount={cashSplitAmount}
                    onBankChange={setBankSplitAmount}
                    onCashChange={setCashSplitAmount}
                  />
                  {mode === "Both" && !splitOk && recordTotal > 0 && (
                    <p className="mt-1.5 text-[10.5px] text-red-600">
                      Bank + Cash must equal ₹ {recordTotal.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
                <div>
                  <FieldLabel>Date / Time</FieldLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      value={receiptTime}
                      onChange={(e) => setReceiptTime(e.target.value)}
                      placeholder="e.g. Today · 10:22"
                      className="h-11 flex-1 font-mono sm:h-10"
                    />
                    <button
                      type="button"
                      onClick={() => attachmentInputRef.current?.click()}
                      disabled={attachments.length >= MAX_PAYMENT_ATTACHMENTS}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#E5E5E5] bg-white text-black/70 transition-colors hover:bg-[#F4F4F5] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900 sm:h-10 sm:w-10"
                      aria-label="Add files"
                      title="Add files"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                  </div>
                  {attachments.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {attachments.map((file) => (
                        <li
                          key={file.id}
                          className="flex items-center gap-2 rounded-lg border border-[#EFEFEF] bg-white px-2.5 py-1.5 dark:border-white/10 dark:bg-zinc-900"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0 text-black/40" />
                          <span className="min-w-0 flex-1 truncate text-[12px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setPreviewAttachment(file)}
                            className="text-[10.5px] font-semibold text-black/55 hover:text-black"
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAttachment(file.id)}
                            className="text-red-600"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[#E8E8EA] bg-[#F8F8F9] p-4 dark:border-white/10 dark:bg-zinc-900/80 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
          <div className="min-w-0 text-[13px] leading-relaxed text-black/65 dark:text-zinc-300">
            <div className="font-semibold text-black dark:text-zinc-50">
              {editingPayment ? `${editingPayment.id} · ${summaryName}` : summaryName}
            </div>
            <div className="mt-0.5 break-words text-[12px]">
              {isExternal
                ? `External — ${primaryCategory} ${currentFeeMonth()} — ${mode}`
                : `${cls} · ${primaryPeriod}`}
            </div>
            <div className="mt-0.5 text-[12px] text-black/45">{receiptTime}</div>
          </div>
          <div className="flex items-center gap-3 sm:shrink-0">
            <div className="rounded-lg border border-[#E5E5E5] bg-white px-3.5 py-2 font-mono text-[16px] font-semibold text-black dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50">
              {recordTotal.toLocaleString("en-IN")}
            </div>
            <button
              type="button"
              onClick={editingPayment ? saveEditedHistoryPayment : () => void handleRecord()}
              disabled={!canSubmit || savingReceipt}
              className="inline-flex h-12 min-w-[140px] flex-1 items-center justify-center rounded-full bg-[#0F766E] px-8 text-[14px] font-semibold tracking-tight text-white shadow-[0_8px_24px_-10px_rgba(15,118,110,0.45)] transition-all hover:bg-[#0D9488] hover:shadow-[0_10px_28px_-10px_rgba(15,118,110,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none sm:flex-none"
            >
              {savingReceipt ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingPayment ? (
                "Save changes"
              ) : isExternal ? (
                "Record"
              ) : (
                "Record Payment"
              )}
            </button>
          </div>
        </div>
      </OrganicCard>
      </div>

      <OrganicCard tone="white" cornerSide="bl" padded className={workspacePanelClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-title text-slate-900 dark:text-zinc-50">Payment History</div>
            <p className="mt-1 text-[11.5px] text-black/55 dark:text-zinc-400">
              {historyQuery.trim()
                ? `${filteredPayments.length} of ${payments.length} receipts`
                : `${payments.length} receipts · most recent first`}
            </p>
          </div>
          <div className="rounded-lg bg-[#F4F4F5] px-3.5 py-2 text-right dark:bg-zinc-800 dark:ring-1 dark:ring-white/10">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-400">
              Today&apos;s intake
            </div>
            <div className="font-mono text-[16px] font-semibold text-black dark:text-zinc-50">
              ₹ {todayTotal.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-zinc-500" />
          <Input
            value={historyQuery}
            onChange={(e) => setHistoryQuery(e.target.value)}
            placeholder="Search by payer, student, category, narration, amount…"
            className="h-10 rounded-xl border-[#E5E5E5] bg-white pl-9 pr-9 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
            aria-label="Search payment history"
          />
          {historyQuery && (
            <button
              type="button"
              onClick={() => setHistoryQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-black/45 transition-colors hover:bg-[#F4F4F5] hover:text-black"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="mt-4 space-y-2.5 md:hidden">
          {filteredPayments.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#E5E5E5] bg-white/60 px-4 py-8 text-center text-[12px] text-black/55 dark:text-zinc-400">
              {payments.length === 0
                ? "No receipts recorded yet"
                : "No receipts match your search"}
            </div>
          )}
          {filteredPayments.map((p) => (
            <div
              key={p.id}
              className={cn(
                "rounded-xl border bg-white p-3.5 shadow-sm shadow-slate-200/40",
                editingPayment?.id === p.id
                  ? "border-[#0F766E] ring-2 ring-[#0F766E]/15"
                  : "border-[#E5E5E5]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold text-slate-900">{p.name}</div>
                  <div className="mt-0.5 truncate text-[11px] text-black/45">
                    {p.payerType === "external"
                      ? "External payer"
                      : p.className
                        ? p.className
                        : "Student"}
                    <span className="text-black/30"> · </span>
                    <span className="font-mono text-[10.5px]">{p.id}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[14px] font-bold text-[#059669]">
                    +₹ {p.amount.toLocaleString("en-IN")}
                  </div>
                  <span className="mt-1 inline-flex rounded-full bg-[#D1F2E1] px-2 py-0.5 text-[9.5px] font-semibold text-[#059669]">
                    Complete
                  </span>
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex max-w-full truncate rounded-full bg-[#CCFBF1] px-2 py-0.5 text-[10px] font-semibold text-[#0F172A]">
                  {p.cat}
                </span>
                {resolvePaymentFeePeriod(p) && (
                  <span className="inline-flex max-w-full truncate rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-semibold text-[#92400E]">
                    {resolvePaymentFeePeriodKind(p) === "term" ? "Term · " : ""}
                    {resolvePaymentFeePeriod(p)}
                  </span>
                )}
                <span className="inline-flex max-w-full truncate rounded-full bg-[#F4F4F5] px-2 py-0.5 text-[10px] font-medium text-black/70">
                  {p.mode}
                </span>
                {(p.attachments?.length ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F4F5] px-2 py-0.5 text-[10px] font-medium text-black/55 dark:text-zinc-400">
                    <Paperclip className="h-3 w-3" />
                    {p.attachments!.length} file{p.attachments!.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              {p.narration && (
                <p className="mt-2 line-clamp-2 text-[11.5px] leading-snug text-black/55 dark:text-zinc-400">
                  {p.narration}
                </p>
              )}

              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#F0F0F0] pt-2.5">
                <span className="min-w-0 truncate font-mono text-[10.5px] text-black/45">
                  {formatEventDateTime(p.time)}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`View receipt details ${p.id}`}
                    onClick={() => setViewingPayment(p)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#99F6E4] bg-[#0F766E] px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#0D9488]"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Details
                  </button>
                  <button
                    type="button"
                    aria-label={`Download receipt ${p.id}`}
                    onClick={() => downloadHistoryReceipt(p)}
                    className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] text-black/55 dark:text-zinc-400 transition-colors hover:border-black hover:bg-[#F4F4F5] hover:text-black"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Share receipt ${p.id}`}
                    onClick={() => shareHistoryReceipt(p)}
                    className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#CCFBF1] bg-[#F0FDFA] text-[#0F766E] transition-colors hover:bg-[#CCFBF1]"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        aria-label={`Edit receipt ${p.id}`}
                        onClick={() => openEditHistoryPayment(p)}
                        className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] text-black/55 dark:text-zinc-400 transition-colors hover:border-black hover:bg-[#F4F4F5] hover:text-black"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete receipt ${p.id}`}
                        onClick={() => setPendingDeletePayment(p)}
                        className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] transition-colors hover:bg-[#FEE2E2] dark:border-rose-500/40 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-950/80"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mobile-scrollbar-none mt-4 hidden overflow-x-auto rounded-lg border border-[#E5E5E5] dark:border-white/10 md:block">
          <table className="w-full min-w-[760px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F4F4F5] dark:border-white/10 dark:bg-zinc-800/80">
                {["Account", "Category", "Period", "Mode", "Amount", "Time", "Actions"].map((header) => (
                  <th
                    key={header}
                    className={cn(
                      "px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400",
                      header === "Actions" && "text-right",
                    )}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-[12px] text-black/55 dark:text-zinc-400">
                    {payments.length === 0
                      ? "No receipts recorded yet"
                      : "No receipts match your search"}
                  </td>
                </tr>
              )}
              {filteredPayments.map((p) => (
                <tr
                  key={p.id}
                  className={cn(
                    "border-b border-[#F0F0F0] last:border-0",
                    editingPayment?.id === p.id && "bg-[#F0FDFA]",
                  )}
                >
                  <td className="px-3 py-3">
                    <div className="font-medium text-black">{p.name}</div>
                    <div className="text-[11px] text-black/45">
                      {p.payerType === "external"
                        ? "External payer"
                        : p.className
                          ? p.className
                          : "Student"}
                    </div>
                    {p.narration && (
                      <div className="mt-0.5 line-clamp-1 text-[11px] text-black/40">{p.narration}</div>
                    )}
                    {(p.attachments?.length ?? 0) > 0 && (
                      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#F4F4F5] px-2 py-0.5 text-[10px] font-medium text-black/55 dark:text-zinc-400">
                        <Paperclip className="h-3 w-3" />
                        {p.attachments!.length} file{p.attachments!.length === 1 ? "" : "s"}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-black/70 dark:text-zinc-300">{p.cat}</td>
                  <td className="px-3 py-3 text-black/70 dark:text-zinc-300">
                    {resolvePaymentFeePeriod(p)
                      ? `${resolvePaymentFeePeriodKind(p) === "term" ? "Term · " : ""}${resolvePaymentFeePeriod(p)}`
                      : "—"}
                  </td>
                  <td className="px-3 py-3 text-black/70 dark:text-zinc-300">{p.mode}</td>
                  <td className="px-3 py-3 font-mono font-semibold text-black">
                    +₹ {p.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px] text-black/55 dark:text-zinc-400">{formatEventDateTime(p.time)}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        aria-label={`View receipt details ${p.id}`}
                        title="View details"
                        onClick={() => setViewingPayment(p)}
                        className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] text-black/55 dark:text-zinc-400 transition-colors hover:border-black hover:bg-[#F4F4F5] hover:text-black"
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Download receipt ${p.id}`}
                        title="Download"
                        onClick={() => downloadHistoryReceipt(p)}
                        className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] text-black/55 dark:text-zinc-400 transition-colors hover:border-black hover:bg-[#F4F4F5] hover:text-black"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit receipt ${p.id}`}
                        title="Edit"
                        onClick={() => openEditHistoryPayment(p)}
                        className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] text-black/55 dark:text-zinc-400 transition-colors hover:border-black hover:bg-[#F4F4F5] hover:text-black"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Share receipt ${p.id}`}
                        title="Share"
                        onClick={() => shareHistoryReceipt(p)}
                        className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] text-black/55 dark:text-zinc-400 transition-colors hover:border-[#0F766E] hover:bg-[#CCFBF1] hover:text-[#0F766E]"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          aria-label={`Delete receipt ${p.id}`}
                          title="Delete"
                          onClick={() => setPendingDeletePayment(p)}
                          className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] text-[#EF4444] transition-colors hover:bg-[#FEF2F2] dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OrganicCard>

      <Dialog
        open={Boolean(viewingPayment)}
        onOpenChange={(open) => {
          if (!open) setViewingPayment(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {viewingPayment && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3 pr-7">
                  <div>
                    <DialogTitle>Receipt Details</DialogTitle>
                    <DialogDescription className="mt-1">
                      Complete transaction record and supporting documents.
                    </DialogDescription>
                  </div>
                  <span className="inline-flex shrink-0 rounded-full bg-[#D1F2E1] px-2.5 py-1 text-[10px] font-semibold text-[#059669]">
                    Complete
                  </span>
                </div>
              </DialogHeader>

              <div className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-black/45">
                      {viewingPayment.id}
                    </div>
                    <div className="mt-1 truncate text-[17px] font-bold text-black">
                      {viewingPayment.name}
                    </div>
                    <div className="mt-0.5 text-[12px] text-black/50">
                      {viewingPayment.payerType === "external"
                        ? "External payer"
                        : viewingPayment.className || "Student"}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-[20px] font-bold text-black">
                      ₹ {viewingPayment.amount.toLocaleString("en-IN")}
                    </div>
                    <div className="mt-1 font-mono text-[10.5px] text-black/45">
                      {formatEventDateTime(viewingPayment.time)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Category", viewingPayment.cat],
                  [
                    resolvePaymentFeePeriodKind(viewingPayment) === "term"
                      ? "Fee term"
                      : "Fee month",
                    resolvePaymentFeePeriod(viewingPayment) || "—",
                  ],
                  ["Payment mode", viewingPayment.mode],
                  [
                    "Payer type",
                    viewingPayment.payerType === "external" ? "External" : "Student",
                  ],
                  ["Academic year", academicYear],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-100 bg-white p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                      {label}
                    </div>
                    <div className="mt-1 text-[13px] font-semibold text-black">{value}</div>
                  </div>
                ))}
              </div>

              {viewingPayment.narration && (
                <div className="rounded-xl border border-slate-100 bg-white p-3.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    Narration
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-black/65">
                    {viewingPayment.narration}
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                    <Paperclip className="h-3.5 w-3.5" />
                    Attachments
                  </div>
                  <span className="font-mono text-[10.5px] text-black/45">
                    {viewingPayment.attachments?.length ?? 0} file
                    {(viewingPayment.attachments?.length ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>

                {(viewingPayment.attachments?.length ?? 0) > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {viewingPayment.attachments!.map((file) => (
                      <li
                        key={file.id}
                        className="flex min-w-0 items-center gap-2.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-3"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-black/45">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12px] font-semibold text-black">
                            {file.name}
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] text-black/45">
                            {formatAttachmentSize(file.size)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewAttachment(file)}
                          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 text-[11px] font-semibold text-black/65 transition-colors hover:border-black/20 hover:text-black"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-[12px] text-black/45">
                    No supporting documents attached to this receipt.
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setViewingPayment(null)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => downloadHistoryReceipt(viewingPayment)}
                  className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download receipt
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={addCategoryOpen}
        onOpenChange={(open) => {
          setAddCategoryOpen(open);
          if (!open) {
            setAddCategoryTarget(null);
            setNewCategoryLabel("");
          }
        }}
      >
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Add fee description</DialogTitle>
            <DialogDescription>
              Creates a reusable category for fee items, receipts, and ledger posting.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void submitNewCategory(e)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Description
              </Label>
              <Input
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
                placeholder="e.g. Library Fee, Lab Fee"
                autoFocus
                className="h-11"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={savingCategory}
                onClick={() => setAddCategoryOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingCategory || !newCategoryLabel.trim()}
                className="rounded-full bg-[#0F766E] hover:bg-[#0D9488]"
              >
                {savingCategory ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding…
                  </>
                ) : (
                  "Add description"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(pendingDeletePayment)}
        onOpenChange={(open) => {
          if (!open) setPendingDeletePayment(null);
        }}
        title="Delete Receipt"
        description={
          pendingDeletePayment
            ? `Delete receipt ${pendingDeletePayment.id} for ${pendingDeletePayment.name} (₹ ${pendingDeletePayment.amount.toLocaleString("en-IN")})? This cannot be undone.`
            : "Are you sure you want to delete this receipt?"
        }
        onConfirm={confirmDeleteHistoryPayment}
      />

      <AttachmentPreviewDialog
        file={previewAttachment}
        open={Boolean(previewAttachment)}
        onOpenChange={(open) => {
          if (!open) setPreviewAttachment(null);
        }}
      />
    </div>
  );
}

function StaffSearchSelect({
  staff,
  value,
  onChange,
  placeholder = "Choose staff member",
  allowNone = false,
  noneLabel = "No class teacher",
}: {
  staff: Staff[];
  value: string;
  onChange: (staffId: string) => void;
  placeholder?: string;
  allowNone?: boolean;
  noneLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const currentStaff = useMemo(
    () =>
      staff
        .filter((member) => isRecordActive(member.active) && !isRecordDeleted(member.deletedAt))
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [staff],
  );
  const selected = currentStaff.find((member) => member.id === value);
  const formatStaff = (member: Staff) =>
    `${member.name} · ${member.id} · ${member.role}${member.dept ? ` · ${member.dept}` : ""}`;
  const label = selected
    ? formatStaff(selected)
    : allowNone && !value
      ? noneLabel
      : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border border-[#E5E5E5] bg-white px-3 text-left text-[13px] shadow-sm transition-colors hover:bg-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10",
            selected || (allowNone && !value) ? "text-black" : "text-black/45",
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[250] w-[var(--radix-popover-trigger-width)] min-w-[300px] overflow-hidden p-0"
      >
        <Command className="rounded-lg border-0" shouldFilter>
          <CommandInput placeholder="Search current staff…" className="h-10 text-[13px]" />
          <CommandList className="max-h-64">
            <CommandEmpty className="py-4 text-[12px] text-black/50">
              No current staff found.
            </CommandEmpty>
            <CommandGroup
              heading={`${currentStaff.length} current staff`}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-black/45"
            >
              {allowNone && (
                <CommandItem
                  value="__none__ no class teacher"
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="cursor-pointer rounded-md text-[13px]"
                >
                  <Check
                    className={cn("mr-2 h-3.5 w-3.5 shrink-0", !value ? "opacity-100" : "opacity-0")}
                  />
                  {noneLabel}
                </CommandItem>
              )}
              {currentStaff.map((member) => (
                  <CommandItem
                    key={member.id}
                    value={`${member.name} ${member.id} ${member.role} ${member.dept ?? ""}`}
                    onSelect={() => {
                      onChange(member.id);
                      setOpen(false);
                    }}
                    className="cursor-pointer rounded-md text-[13px]"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3.5 w-3.5 shrink-0",
                        value === member.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium text-black">{member.name}</span>
                      <span className="text-black/45">
                        {" "}
                        · {member.id} · {member.role}
                        {member.dept ? ` · ${member.dept}` : ""}
                      </span>
                    </span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function MakePayment() {
  const { staff, setStaff, schoolDetails, academicYear } = useTenantStore();
  const schoolName = schoolDetails.name || "School";
  const navigate = useNavigate();
  const search = useSearch({ from: "/tenant/finance" });
  const [obligations, setObligations] = useState<PendingObligation[]>([]);
  const [madePayments, setMadePayments] = useState<MadePayment[]>([]);
  const [selectedObligationId, setSelectedObligationId] = useState<string | null>(
    search.staffId ? null : null,
  );
  const [payeeType, setPayeeType] = useState<PayeeType>(
    search.staffId ? "Salary" : "Salary",
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string>(search.staffId ?? "");
  const [salaryMonth, setSalaryMonth] = useState(
    () => search.month ?? currentPayrollMonth(),
  );
  const [daysPresent, setDaysPresent] = useState("");
  const [workingDays, setWorkingDays] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(search.amount ?? "");
  const [mode, setMode] = useState("Bank");
  const [attachments, setAttachments] = useState<PaymentAttachment[]>([]);
  const [pendingAuthorisation, setPendingAuthorisation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [previewAttachment, setPreviewAttachment] = useState<PaymentAttachment | null>(null);
  const [editingDisbursal, setEditingDisbursal] = useState<MadePayment | null>(null);
  const [pendingDeleteDisbursal, setPendingDeleteDisbursal] = useState<MadePayment | null>(null);
  const [disbursalEditForm, setDisbursalEditForm] = useState({
    payee: "",
    desc: "",
    amount: "",
    mode: "UPI Business",
    payeeType: "Supplier" as PayeeType,
    status: "Queued" as "Queued" | "Cleared",
    date: toIsoDateLocal(new Date()),
    clock: toClockLocal(new Date()),
  });
  const prefillAppliedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void apiListDisbursements()
      .then((rows) => {
        if (cancelled) return;
        const list = Array.isArray(rows) ? rows : [];
        setMadePayments(
          list.map((row) => ({
            id: row.id || `DISB-${Date.now()}`,
            payee: row.payee,
            desc: row.desc,
            amount: row.amount,
            mode: row.mode,
            payeeType: normalizePayeeType(row.payeeType),
            time: isBlankDate(row.time) ? toSqlDateTime(new Date()) : String(row.time),
            status: (row.status === "Queued" ? "Queued" : "Cleared") as "Queued" | "Cleared",
            attachments: Array.isArray(row.attachments)
              ? (row.attachments as PaymentAttachment[])
              : undefined,
          })),
        );
        setObligations(
          list
            .filter((row) => row.status === "Queued")
            .map((row) => ({
              id: row.id || `OBL-${Date.now()}`,
              payee: row.payee,
              desc: row.desc || "",
              amount: row.amount,
              due: formatEventDateTime(row.time) === "—" ? "Due" : formatEventDateTime(row.time),
              payeeType: normalizePayeeType(row.payeeType),
            })),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setMadePayments([]);
        setObligations([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeStaff = useMemo(
    () =>
      staff
        .filter((member) => isRecordActive(member.active) && !isRecordDeleted(member.deletedAt))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [staff],
  );

  useEffect(() => {
    if (payeeType !== "Salary" || selectedStaffId || !beneficiary.trim()) return;
    const matched = activeStaff.find(
      (member) => member.name.toLowerCase() === beneficiary.trim().toLowerCase(),
    );
    if (matched) setSelectedStaffId(matched.id);
  }, [activeStaff, beneficiary, payeeType, selectedStaffId]);

  const matchStaffByName = (name: string) =>
    activeStaff.find((member) => member.name.toLowerCase() === name.trim().toLowerCase());

  const applyStaff = (
    memberId: string,
    opts?: {
      month?: string;
      amount?: number;
      skipToast?: boolean;
      daysPresent?: number;
      workingDays?: number;
    },
  ) => {
    const member = activeStaff.find((s) => s.id === memberId);
    if (!member) {
      setSelectedStaffId("");
      return;
    }
    const month = opts?.month ?? salaryMonth;
    setSelectedStaffId(member.id);
    setBeneficiary(member.name);
    setSalaryMonth(month);
    const { payable, gross, attendance } = staffPayableSalary(member, month);
    const present =
      opts?.daysPresent ??
      attendance?.daysPresent ??
      0;
    const working =
      opts?.workingDays ??
      attendance?.workingDays ??
      26;
    setDaysPresent(String(present));
    setWorkingDays(String(working));
    const computed =
      working > 0
        ? Math.round(gross * (Math.max(0, Math.min(present, working)) / working))
        : gross;
    const nextAmount = opts?.amount ?? computed;
    if (nextAmount > 0) {
      setAmount(String(nextAmount));
    }
    const attendanceNote =
      working > 0
        ? ` · ${Math.max(0, Math.min(present, working))}/${working} days · ${formatPayrollMonthLabel(month)}`
        : ` · ${formatPayrollMonthLabel(month)}`;
    if (!description.trim() || /salary|payroll|staff|bus diesel/i.test(description)) {
      setDescription(
        `Salary · ${member.role}${member.dept ? ` · ${member.dept}` : ""}${attendanceNote}`,
      );
    }
    if (
      !opts?.skipToast &&
      opts?.amount === undefined &&
      working > 0 &&
      computed !== gross
    ) {
      toast.message("Payroll adjusted for attendance", {
        description: `Gross ₹ ${gross.toLocaleString("en-IN")} → payable ₹ ${computed.toLocaleString("en-IN")}`,
      });
    }
  };

  const recalcSalaryFromAttendance = (
    presentRaw: string,
    workingRaw: string,
    memberId = selectedStaffId,
  ) => {
    const member = activeStaff.find((s) => s.id === memberId);
    if (!member || payeeType !== "Salary") return;
    const gross = staffGrossSalary(member);
    const working = Number(workingRaw);
    const present = Number(presentRaw);
    if (!Number.isFinite(working) || working <= 0) {
      setAmount(String(gross));
      return;
    }
    const safePresent = Math.max(0, Math.min(Number.isFinite(present) ? present : 0, working));
    setAmount(String(Math.round(gross * (safePresent / working))));
    if (!description.trim() || /salary|payroll|staff/i.test(description)) {
      setDescription(
        `Salary · ${member.role}${member.dept ? ` · ${member.dept}` : ""} · ${safePresent}/${working} days · ${formatPayrollMonthLabel(salaryMonth)}`,
      );
    }
  };

  useEffect(() => {
    if (prefillAppliedRef.current) return;
    if (!search.staffId || activeStaff.length === 0) return;
    const member = activeStaff.find((s) => s.id === search.staffId);
    if (!member) return;
    prefillAppliedRef.current = true;
    const month = search.month ?? currentPayrollMonth();
    const parsedAmount = search.amount ? Number(search.amount) : undefined;
    applyStaff(member.id, {
      month,
      amount: parsedAmount && parsedAmount > 0 ? parsedAmount : undefined,
      skipToast: true,
    });
    setPayeeType("Salary");
    setMode("Bank");
    navigate({
      to: "/tenant/finance",
      search: { tab: "make" },
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStaff, search.staffId, search.month, search.amount]);

  const applySalaryMonth = (month: string) => {
    const next = month || currentPayrollMonth();
    setSalaryMonth(next);
    if (payeeType === "Salary" && selectedStaffId) {
      applyStaff(selectedStaffId, { month: next, skipToast: true });
    }
  };

  const applyObligation = (obligation: PendingObligation) => {
    setSelectedObligationId(obligation.id);
    setPayeeType(obligation.payeeType);
    setBeneficiary(obligation.payee);
    setDescription(obligation.desc);
    setAmount(String(obligation.amount));
    setAttachments([]);
    if (obligation.payeeType === "Salary") {
      const matched = matchStaffByName(obligation.payee);
      setSelectedStaffId(matched?.id ?? "");
      if (matched) {
        applyStaff(matched.id, {
          month: salaryMonth,
          amount: obligation.amount,
          skipToast: true,
        });
      }
    } else {
      setSelectedStaffId("");
    }
  };

  const resetForm = () => {
    setSelectedObligationId(null);
    setPayeeType("Salary");
    setSelectedStaffId("");
    setSalaryMonth(currentPayrollMonth());
    setDaysPresent("");
    setWorkingDays("");
    setBeneficiary("");
    setDescription("");
    setAmount("");
    setMode("Bank");
    setAttachments([]);
  };

  const setPayeeTypeAndClear = (next: PayeeType) => {
    setPayeeType(next);
    setSelectedObligationId(null);
    if (next === "Supplier") {
      setSelectedStaffId("");
      if (selectedStaffId) {
        setBeneficiary("");
        setDescription("");
        setAmount("");
      }
    } else if (next === "Salary" && !selectedStaffId) {
      // Keep typed values; user can pick staff next
    }
  };

  const addAttachments = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const room = MAX_PAYMENT_ATTACHMENTS - attachments.length;
    if (room <= 0) {
      toast.error(`Maximum ${MAX_PAYMENT_ATTACHMENTS} attachments allowed`);
      return;
    }

    const files = Array.from(fileList).slice(0, room);
    const next: PaymentAttachment[] = [];

    for (const file of files) {
      if (file.size > MAX_PAYMENT_ATTACHMENT_BYTES) {
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
        });
      } catch {
        toast.error(`Could not read ${file.name}`);
      }
    }

    if (!next.length) return;
    setAttachments((prev) => [...prev, ...next]);
    toast.success(
      next.length === 1
        ? `${next[0].name} attached`
        : `${next.length} files attached`,
    );
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const requestAuthorisation = () => {
    const value = Number(amount.replace(/[^0-9]/g, ""));
    if (payeeType === "Salary" && !selectedStaffId) {
      toast.error("Choose a staff member");
      return;
    }
    if (payeeType === "Salary" && !salaryMonth) {
      toast.error("Select the salary month");
      return;
    }
    if (payeeType === "Salary") {
      const working = Number(workingDays);
      const present = Number(daysPresent);
      if (!Number.isFinite(working) || working <= 0) {
        toast.error("Enter working days for this salary month");
        return;
      }
      if (!Number.isFinite(present) || present < 0) {
        toast.error("Enter days present for this salary month");
        return;
      }
    }
    if (!beneficiary.trim()) {
      toast.error(payeeType === "Salary" ? "Choose a staff member" : "Supplier name is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!value || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    // Ensure salary month is reflected on the disbursal line
    if (
      payeeType === "Salary" &&
      salaryMonth &&
      !description.toLowerCase().includes(formatPayrollMonthLabel(salaryMonth).toLowerCase()) &&
      !description.includes(salaryMonth)
    ) {
      setDescription((prev) => `${prev.trim()} · ${formatPayrollMonthLabel(salaryMonth)}`);
    }
    setPendingAuthorisation(true);
  };

  const confirmAuthorisation = () => {
    if (isSubmitting) return;
    const value = Number(amount.replace(/[^0-9]/g, ""));
    if (!beneficiary.trim() || !description.trim() || !value || value <= 0) {
      toast.error("Complete all required fields before confirming");
      setPendingAuthorisation(false);
      return;
    }

    setIsSubmitting(true);
    setPendingAuthorisation(false);

    if (selectedObligationId) {
      setObligations((prev) => prev.filter((item) => item.id !== selectedObligationId));
    }

    const disbursal: MadePayment = {
      id: `DISB-${Date.now().toString().slice(-6)}`,
      payee: beneficiary.trim(),
      desc: description.trim(),
      amount: value,
      mode,
      payeeType,
      time: toSqlDateTime(new Date()),
      status: "Queued",
      attachments: attachments.length ? attachments : undefined,
    };
    setMadePayments((prev) => [disbursal, ...prev]);

    void apiCreateDisbursement({
      ...disbursal,
      staffId: payeeType === "Salary" ? selectedStaffId || undefined : undefined,
    })
      .then((saved) => {
        const savedId = saved?.id;
        if (!savedId || savedId === disbursal.id) return;
        setMadePayments((prev) =>
          prev.map((p) =>
            p.id === disbursal.id
              ? {
                  ...disbursal,
                  id: savedId,
                  payee: saved.payee || disbursal.payee,
                  desc: saved.desc || disbursal.desc,
                  amount: saved.amount || disbursal.amount,
                  mode: saved.mode || disbursal.mode,
                  payeeType: saved.payeeType
                    ? normalizePayeeType(saved.payeeType)
                    : disbursal.payeeType,
                  time: saved.time || disbursal.time,
                  status:
                    saved.status === "Queued" || saved.status === "Cleared"
                      ? saved.status
                      : disbursal.status,
                }
              : p,
          ),
        );
      })
      .catch((err) =>
        toast.error("Could not save disbursement on server", {
          description: err instanceof Error ? err.message : "Save failed",
        }),
      );

    if (payeeType === "Salary" && selectedStaffId) {
      const paidAt = new Date().toISOString().slice(0, 10);
      const working = Math.max(0, Math.round(Number(workingDays) || 0));
      const present = Math.max(
        0,
        Math.min(Math.round(Number(daysPresent) || 0), working || Number.MAX_SAFE_INTEGER),
      );
      setStaff((prev) =>
        prev.map((member) =>
          member.id === selectedStaffId
            ? {
                ...member,
                ...(working > 0
                  ? {
                      attendanceByMonth: upsertStaffAttendanceMonth(member.attendanceByMonth, {
                        month: salaryMonth,
                        daysPresent: present,
                        workingDays: working,
                      }),
                    }
                  : {}),
                salaryHistory: [
                  {
                    id: `SAL-${member.id}-${Date.now().toString().slice(-5)}`,
                    amount: value,
                    mode,
                    paidAt,
                    description: description.trim() || `Salary · ${member.name}`,
                    status: "Queued" as const,
                  },
                  ...(member.salaryHistory ?? []),
                ],
              }
            : member,
        ),
      );
      const member = staff.find((s) => s.id === selectedStaffId);
      if (member) {
        const nextMember = {
          ...member,
          ...(working > 0
            ? {
                attendanceByMonth: upsertStaffAttendanceMonth(member.attendanceByMonth, {
                  month: salaryMonth,
                  daysPresent: present,
                  workingDays: working,
                }),
              }
            : {}),
        };
        void apiUpsertStaff(nextMember).catch(() => {});
      }
    }

    toast.success("Payment confirmed", {
      description: `${beneficiary.trim()} · ₹ ${value.toLocaleString("en-IN")} via ${mode}${
        attachments.length
          ? ` · ${attachments.length} attachment${attachments.length === 1 ? "" : "s"}`
          : ""
      }`,
    });

    const remaining = obligations.filter((item) => item.id !== selectedObligationId);
    if (remaining.length) {
      applyObligation(remaining[0]);
    } else {
      resetForm();
    }

    setIsSubmitting(false);
  };

  const handleDownloadDisbursals = () => {
    if (!madePayments.length) {
      toast.error("Nothing to download · no disbursals recorded yet");
      return;
    }
    downloadCsv(
      formatDownloadFilename("madePayments", "csv", {
        school: schoolName,
        year: slugYear(academicYear),
        date: todayStamp(),
      }),
      ["ID", "Payee", "Type", "Description", "Mode", "Amount (INR)", "Status", "Time"],
      madePayments.map((p) => [
        p.id,
        p.payee,
        p.payeeType,
        p.desc,
        p.mode,
        p.amount,
        p.status,
        formatEventDateTime(p.time),
      ]),
    );
    toast.success("Made payments exported", {
      description: `${madePayments.length} disbursal${madePayments.length === 1 ? "" : "s"} saved to CSV`,
    });
  };

  const sharePayload = async (title: string, text: string) => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text });
        toast.success("Shared", { description: title });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard", {
        description: "Paste into WhatsApp, email, or chat",
      });
    } catch {
      toast.error("Could not share · copy failed");
    }
  };

  const downloadDisbursal = async (payment: MadePayment) => {
    const member =
      staff.find((s) => s.id === payment.payee) ||
      staff.find((s) => s.name.trim().toLowerCase() === payment.payee.trim().toLowerCase());
    try {
      if (payment.payeeType === "Salary") {
        await downloadSalarySlipPdf(
          payment,
          schoolName,
          receiptBrandingFromSchool(schoolDetails),
          member
            ? {
                id: member.id,
                name: member.name,
                role: member.role,
                dept: member.dept,
                basicSalary: member.basicSalary,
                additionalAllowances: member.additionalAllowances,
              }
            : null,
          academicYear,
        );
        toast.success(`Salary slip ${payment.id} downloaded`);
        return;
      }
      await downloadPaymentVoucherPdf(
        payment,
        schoolName,
        receiptBrandingFromSchool(schoolDetails),
        {
          name: member?.name || payment.payee,
          phone: member?.phone,
          extra: [member?.role, member?.dept].filter(Boolean).join(" · ") || undefined,
        },
        academicYear,
      );
      toast.success(`Voucher ${payment.id} downloaded`);
    } catch {
      toast.error(`Could not download ${payment.id}`);
    }
  };

  const shareDisbursal = (payment: MadePayment) => {
    const text = [
      `Payment Voucher · ${payment.id}`,
      `Payee: ${payment.payee}`,
      `Type: ${payment.payeeType}`,
      `Description: ${payment.desc}`,
      `Mode: ${payment.mode}`,
      `Amount: ₹ ${payment.amount.toLocaleString("en-IN")}`,
      `Status: ${payment.status}`,
      `Time: ${formatEventDateTime(payment.time)}`,
    ].join("\n");
    void sharePayload(`Payment ${payment.id}`, text);
  };

  const openEditDisbursal = (payment: MadePayment) => {
    setEditingDisbursal(payment);
    const parts = parseDisbursalTimeParts(payment.time);
    setDisbursalEditForm({
      payee: payment.payee,
      desc: payment.desc,
      amount: String(payment.amount),
      mode: payment.mode,
      payeeType: payment.payeeType,
      status: payment.status,
      date: parts.date,
      clock: parts.clock,
    });
  };

  const saveEditedDisbursal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDisbursal) return;
    const payee = disbursalEditForm.payee.trim();
    const desc = disbursalEditForm.desc.trim();
    const nextAmount = Number(disbursalEditForm.amount);
    const modeValue = disbursalEditForm.mode.trim();
    const time = toSqlDateTime(
      formatDisbursalTimeFromParts(disbursalEditForm.date, disbursalEditForm.clock),
    );
    if (!payee) {
      toast.error("Payee is required");
      return;
    }
    if (!desc) {
      toast.error("Description is required");
      return;
    }
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!modeValue) {
      toast.error("Payment mode is required");
      return;
    }
    if (!disbursalEditForm.date || !disbursalEditForm.clock) {
      toast.error("Date and time are required");
      return;
    }

    const nextDisbursal: MadePayment = {
      ...editingDisbursal,
      payee,
      desc,
      amount: nextAmount,
      mode: modeValue,
      payeeType: disbursalEditForm.payeeType,
      status: disbursalEditForm.status,
      time,
    };
    setMadePayments((prev) =>
      prev.map((p) => (p.id === editingDisbursal.id ? nextDisbursal : p)),
    );
    void apiUpdateDisbursement(nextDisbursal).catch((err) =>
      toast.error("Could not update disbursement on server", {
        description: err instanceof Error ? err.message : "Save failed",
      }),
    );
    toast.success(`Payment ${editingDisbursal.id} updated`);
    setEditingDisbursal(null);
  };

  const confirmDeleteDisbursal = () => {
    if (!pendingDeleteDisbursal) return;
    setMadePayments((prev) => prev.filter((p) => p.id !== pendingDeleteDisbursal.id));
    void apiDeleteDisbursement(pendingDeleteDisbursal.id).catch((err) =>
      toast.error("Could not delete disbursement on server", {
        description: err instanceof Error ? err.message : "Delete failed",
      }),
    );
    toast.error(`Payment ${pendingDeleteDisbursal.id} deleted`);
    setPendingDeleteDisbursal(null);
  };

  return (
    <div className="grid grid-cols-12 gap-4 sm:gap-5">
      <OrganicCard tone="white" cornerSide="tr" padded className={cn(workspacePanelClass, "col-span-12 lg:col-span-8")}>
        <div className="min-w-0">
          <DashboardPanelHeading icon={ArrowUpFromLine} title="Make Payment" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Payee Type</FieldLabel>
            <div className="flex gap-1 rounded-full border border-[#E5E5E5] bg-white p-1">
              {(["Salary", "Supplier"] as const).map((p) => {
                const active = payeeType === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPayeeTypeAndClear(p)}
                    className={`flex-1 rounded-full px-3 py-1.5 text-[12px] font-medium ${
                      active ? "bg-[#0F766E] text-white" : "text-black/65"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <FieldLabel>{payeeType === "Salary" ? "Staff" : "Supplier"}</FieldLabel>
            {payeeType === "Salary" ? (
              <StaffSearchSelect
                staff={activeStaff}
                value={selectedStaffId}
                onChange={(id) => applyStaff(id)}
                placeholder="Choose current staff"
              />
            ) : (
              <Input
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                placeholder="e.g. BrightBus Logistics Pvt. Ltd."
              />
            )}
            {payeeType === "Salary" && selectedStaffId && (
              <div className="mt-1.5 text-[11px] text-black/45">
              </div>
            )}
          </div>
          {payeeType === "Salary" && (
            <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-3">
              <div className="min-w-0">
                <FieldLabel>Salary month</FieldLabel>
                <MonthPicker
                  value={salaryMonth}
                  onChange={applySalaryMonth}
                  allowClear={false}
                  placeholder="Select payroll month"
                />
                <p className="mt-1.5 text-[11px] text-black/45">
                  Which month this salary payment covers
                </p>
              </div>
              <div className="min-w-0">
                <FieldLabel>Days Present</FieldLabel>
                <Input
                  inputMode="numeric"
                  value={daysPresent}
                  onChange={(e) => {
                    const next = e.target.value.replace(/[^0-9]/g, "");
                    setDaysPresent(next);
                    recalcSalaryFromAttendance(next, workingDays);
                  }}
                  placeholder="0"
                  className="font-mono"
                  disabled={!selectedStaffId}
                />
              </div>
              <div className="min-w-0">
                <FieldLabel>Working Days</FieldLabel>
                <Input
                  inputMode="numeric"
                  value={workingDays}
                  onChange={(e) => {
                    const next = e.target.value.replace(/[^0-9]/g, "");
                    setWorkingDays(next);
                    recalcSalaryFromAttendance(daysPresent, next);
                  }}
                  placeholder="26"
                  className="font-mono"
                  disabled={!selectedStaffId}
                />
              </div>
            </div>
          )}
          <div className={payeeType === "Salary" ? "sm:col-span-2" : "sm:col-span-2"}>
            <FieldLabel>Description / Line Items</FieldLabel>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the payment purpose"
              className="min-h-[80px] w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-black/15"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] sm:items-start">
            <div>
              <FieldLabel>Amount (₹)</FieldLabel>
              <Input
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="0"
                className="font-mono"
              />
            </div>
            <div>
              <FieldLabel>Mode</FieldLabel>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {["Bank", "UPI", "Cheque", "Cash"].map((m) => {
                  const active = mode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={cn(
                        "h-11 w-full rounded-lg px-2 text-center text-[12px] font-medium leading-tight whitespace-nowrap transition-colors sm:px-3",
                        active
                          ? "bg-[#0F766E] text-white shadow-sm"
                          : "bg-[#CCFBF1]/50 text-slate-700 hover:bg-[#CCFBF1] dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15",
                      )}
                      title={m}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <FieldLabel>Attachments</FieldLabel>
              <span className="text-[10.5px] font-medium text-black/45">
                {attachments.length} / {MAX_PAYMENT_ATTACHMENTS} · max 5 MB each
              </span>
            </div>
            <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-3">
              {attachments.length > 0 ? (
                <ul className="mb-3 space-y-2">
                  {attachments.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center gap-2 rounded-lg border border-[#EFEFEF] bg-white px-2.5 py-2"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 text-black/40" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium text-black">{file.name}</div>
                        <div className="font-mono text-[10px] text-black/45">
                          {formatAttachmentSize(file.size)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewAttachment(file)}
                        className="inline-flex h-7 items-center rounded-lg border border-slate-200 px-2 text-[10.5px] font-semibold text-black/60 dark:text-zinc-400 transition-colors hover:bg-slate-50"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAttachment(file.id)}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-3 text-[12px] text-black/45">
                  Attach invoices, bills, approvals, or supporting documents.
                </p>
              )}
              <input
                ref={attachmentInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  void addAttachments(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                disabled={attachments.length >= MAX_PAYMENT_ATTACHMENTS}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3.5 text-[12px] font-semibold text-black transition-colors hover:border-black/20 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Paperclip className="h-3.5 w-3.5" />
                Add files
              </button>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={requestAuthorisation}
            disabled={isSubmitting}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#0F766E] px-8 text-[14px] font-semibold tracking-tight text-white shadow-[0_8px_24px_-10px_rgba(15,118,110,0.45)] transition-all hover:bg-[#0D9488] hover:shadow-[0_10px_28px_-10px_rgba(15,118,110,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none sm:w-auto sm:min-w-[200px]"
          >
            Confirm Payment
          </button>
        </div>
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="bl" padded className={cn(workspacePanelClass, "col-span-12 lg:col-span-4")}>
        <DashboardPanelHeading icon={AlertTriangle} title="Top Pending Obligations" />
        <div className="mt-3 space-y-3">
          {obligations.length === 0 && (
            <div className="rounded-lg border border-dashed border-black/15 bg-[#F4F4F5]/40 px-4 py-6 text-center text-[12px] text-black/55 dark:text-zinc-400">
              No pending obligations in the queue
            </div>
          )}
          {obligations.map((p) => {
            const isSelected = selectedObligationId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyObligation(p)}
                className={`w-full rounded-lg p-3 text-left transition-colors ${
                  isSelected
                    ? "bg-[#FEE2E2] text-[#7F1D1D] ring-2 ring-[#FECACA]"
                    : "bg-[#CCFBF1] text-[#0F172A] hover:bg-[#99F6E4] dark:hover:bg-[#5EEAD4]"
                }`}
              >
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-semibold">{p.payee}</span>
                  <span className="font-mono">₹ {p.amount.toLocaleString("en-IN")}</span>
                </div>
                <div
                  className={`mt-0.5 flex items-center justify-between text-[10.5px] ${
                    isSelected ? "text-[#991B1B]/75" : "text-black/55 dark:text-zinc-400"
                  }`}
                >
                  <span>{p.desc}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      isSelected ? "bg-[#EF4444] text-white" : "bg-black/10 text-black/65"
                    }`}
                  >
                    Due {p.due}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="br" padded className={cn(workspacePanelClass, "col-span-12")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <DashboardPanelHeading icon={CheckCircle2} title="Made Payment Details" />
            <div className="mt-1 text-[11.5px] text-black/55 dark:text-zinc-400">
              {madePayments.length} disbursals · most recent
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadDisbursals}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3.5 text-[12px] font-semibold text-black transition-colors hover:border-black/20 hover:bg-[#F4F4F5]"
          >
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </button>
        </div>
        <div className="mobile-scrollbar-none mt-3 max-h-[420px] divide-y divide-[#F0F0F0] overflow-y-auto">
          {madePayments.length === 0 && (
            <div className="py-6 text-center text-[12px] text-black/55 dark:text-zinc-400">
              No outbound payments recorded yet
            </div>
          )}
          {madePayments.map((payment) => (
            <div key={payment.id} className="py-2.5">
              <div className="flex items-start justify-between gap-2 text-[12.5px]">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-black">{payment.payee}</div>
                  <div className="mt-0.5 truncate text-[10.5px] text-black/55 dark:text-zinc-400">
                    {payment.payeeType} · {payment.desc} · {payment.mode}
                    {(payment.attachments?.length ?? 0) > 0 && (
                      <>
                        {" · "}
                        <span className="inline-flex items-center gap-0.5 font-semibold text-black/65">
                          <Paperclip className="inline h-3 w-3" />
                          {payment.attachments?.length}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-black">
                      −₹ {payment.amount.toLocaleString("en-IN")}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        payment.status === "Cleared"
                          ? "bg-[#CCFBF1] text-[#0F766E]"
                          : "bg-black/8 text-black/55 dark:text-zinc-400",
                      )}
                    >
                      {payment.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Download payment ${payment.id}`}
                      title="Download"
                      onClick={() => downloadDisbursal(payment)}
                      className="inline-grid h-7 w-7 place-items-center rounded-full border border-[#E5E5E5] text-black/55 dark:text-zinc-400 transition-colors hover:border-black hover:bg-[#F4F4F5] hover:text-black"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Edit payment ${payment.id}`}
                      title="Edit"
                      onClick={() => openEditDisbursal(payment)}
                      className="inline-grid h-7 w-7 place-items-center rounded-full border border-[#E5E5E5] text-black/55 dark:text-zinc-400 transition-colors hover:border-black hover:bg-[#F4F4F5] hover:text-black"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Share payment ${payment.id}`}
                      title="Share"
                      onClick={() => shareDisbursal(payment)}
                      className="inline-grid h-7 w-7 place-items-center rounded-full border border-[#E5E5E5] text-black/55 dark:text-zinc-400 transition-colors hover:border-[#0F766E] hover:bg-[#CCFBF1] hover:text-[#0F766E]"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete payment ${payment.id}`}
                      title="Delete"
                      onClick={() => setPendingDeleteDisbursal(payment)}
                      className="inline-grid h-7 w-7 place-items-center rounded-full border border-[#FECACA] text-[#EF4444] transition-colors hover:bg-[#FEF2F2]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="font-mono text-[10.5px] text-black/55 dark:text-zinc-400">{formatEventDateTime(payment.time)}</span>
                </div>
              </div>
              {(payment.attachments?.length ?? 0) > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {payment.attachments?.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => setPreviewAttachment(file)}
                      className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] px-2 py-0.5 text-[10px] font-medium text-black/70 transition-colors hover:border-black/20 hover:bg-white"
                      title={file.name}
                    >
                      <FileText className="h-3 w-3 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </OrganicCard>

      <Dialog
        open={Boolean(editingDisbursal)}
        onOpenChange={(open) => {
          if (!open) setEditingDisbursal(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>
              Update disbursal {editingDisbursal?.id}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveEditedDisbursal} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Payee
              </Label>
              <Input
                value={disbursalEditForm.payee}
                onChange={(e) =>
                  setDisbursalEditForm({ ...disbursalEditForm, payee: e.target.value })
                }
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Description
              </Label>
              <Textarea
                value={disbursalEditForm.desc}
                onChange={(e) =>
                  setDisbursalEditForm({ ...disbursalEditForm, desc: e.target.value })
                }
                className="min-h-[72px] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Type
                </Label>
                <Select
                  value={disbursalEditForm.payeeType}
                  onValueChange={(payeeType) =>
                    setDisbursalEditForm({
                      ...disbursalEditForm,
                      payeeType: payeeType as PayeeType,
                    })
                  }
                >
                  <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E5E5] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Salary">Salary</SelectItem>
                    <SelectItem value="Supplier">Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Status
                </Label>
                <Select
                  value={disbursalEditForm.status}
                  onValueChange={(status) =>
                    setDisbursalEditForm({
                      ...disbursalEditForm,
                      status: status as "Queued" | "Cleared",
                    })
                  }
                >
                  <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E5E5] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Queued">Queued</SelectItem>
                    <SelectItem value="Cleared">Cleared</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Amount (₹)
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={disbursalEditForm.amount}
                  onChange={(e) =>
                    setDisbursalEditForm({ ...disbursalEditForm, amount: e.target.value })
                  }
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Mode
                </Label>
                <Select
                  value={disbursalEditForm.mode}
                  onValueChange={(modeValue) =>
                    setDisbursalEditForm({ ...disbursalEditForm, mode: modeValue })
                  }
                >
                  <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E5E5] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      new Set([
                        "Bank",
                        "UPI",
                        "Cheque",
                        "Cash",
                        "UPI Business",
                        "Bank Transfer · NEFT",
                        disbursalEditForm.mode,
                      ].filter(Boolean)),
                    ).map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Date
                </Label>
                <DatePicker
                  value={disbursalEditForm.date}
                  onChange={(date) =>
                    setDisbursalEditForm({
                      ...disbursalEditForm,
                      date: date || toIsoDateLocal(new Date()),
                    })
                  }
                  valueFormat="iso"
                  placeholder="Select date"
                  quickPicks={[
                    { label: "Today", getDate: (t) => t },
                    {
                      label: "Yesterday",
                      getDate: (t) =>
                        new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1),
                    },
                  ]}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Time
                </Label>
                <Input
                  type="time"
                  value={disbursalEditForm.clock}
                  onChange={(e) =>
                    setDisbursalEditForm({
                      ...disbursalEditForm,
                      clock: e.target.value || toClockLocal(new Date()),
                    })
                  }
                  className="h-10 font-mono"
                />
              </div>
            </div>
            <p className="text-[11px] text-black/45">
              Saves as{" "}
              <span className="font-mono text-black/70">
                {formatDisbursalTimeFromParts(
                  disbursalEditForm.date,
                  disbursalEditForm.clock,
                )}
              </span>
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingDisbursal(null)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]">
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(pendingDeleteDisbursal)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteDisbursal(null);
        }}
        title="Delete Payment"
        description={
          pendingDeleteDisbursal
            ? `Delete payment ${pendingDeleteDisbursal.id} to ${pendingDeleteDisbursal.payee} (₹ ${pendingDeleteDisbursal.amount.toLocaleString("en-IN")})? This cannot be undone.`
            : "Are you sure you want to delete this payment?"
        }
        onConfirm={confirmDeleteDisbursal}
      />

      <Dialog
        open={pendingAuthorisation}
        onOpenChange={(next) => {
          if (!next) setPendingAuthorisation(false);
        }}
      >
        <DialogContent className="max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">
              Confirm Payment
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60 dark:text-zinc-400">
              Pay ₹ {Number(amount || 0).toLocaleString("en-IN")} to {beneficiary.trim()} via {mode}
              {attachments.length
                ? ` with ${attachments.length} attachment${attachments.length === 1 ? "" : "s"}`
                : ""}
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingAuthorisation(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmAuthorisation}
              disabled={isSubmitting}
              className="h-11 rounded-full bg-[#0F766E] px-6 text-[13px] font-semibold text-white hover:bg-[#0D9488]"
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AttachmentPreviewDialog
        file={previewAttachment}
        open={Boolean(previewAttachment)}
        onOpenChange={(open) => {
          if (!open) setPreviewAttachment(null);
        }}
      />
    </div>
  );
}

function LedgerAnalytics() {
  const { activePayments: payments } = useTenantStore();
  const { disbursements } = useDisbursements();

  const incomeSegments = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const payment of payments) {
      const key = payment.cat || "Other";
      buckets.set(key, (buckets.get(key) ?? 0) + payment.amount);
    }
    return Array.from(buckets.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [payments]);

  const outflowSegments = useMemo(
    () => expenseSegmentsFromDisbursements(disbursements),
    [disbursements],
  );

  return (
    <div className="grid grid-cols-12 gap-3 sm:gap-4 lg:gap-5">
      <div className="col-span-6 min-w-0">
        <FinanceDonutCard
          title="Income Distribution"
          cornerSide="tr"
          segments={incomeSegments}
        />
      </div>
      <div className="col-span-6 min-w-0">
        <FinanceDonutCard
          title="Monthly Outflow Breakdown"
          cornerSide="bl"
          segments={outflowSegments}
        />
      </div>
      <div className="col-span-6 min-w-0">
        <FinanceBarCard
          title="Income by Category"
          cornerSide="tr"
          segments={incomeSegments}
        />
      </div>
      <div className="col-span-6 min-w-0">
        <FinanceBarCard
          title="Outflow by Category"
          cornerSide="bl"
          fill="#0F766E"
          segments={outflowSegments}
        />
      </div>
    </div>
  );
}

export function SchoolSettings() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/tenant/settings" });
  const { session, logout } = useAuth();
  const tabParam = search.tab;
  const activeTab = (tabParam ?? "school") as SettingsTabId;
  /** Mobile: no ?tab → menu index. With ?tab → section page. Desktop always shows content. */
  const showMobileMenu = !tabParam;

  const {
    departments,
    setDepartments,
    roles,
    setRoles,
    tenantUsers,
    setTenantUsers,
    classes,
    setClasses,
    transportRoutes,
    setTransportRoutes,
    transportVehicles,
    setTransportVehicles,
    activeFeeTerms,
    academicYears,
    academicYear,
    closedAcademicYears,
    openAcademicYear,
    addAcademicYear,
    renameAcademicYear,
    setAcademicYearClosed,
    canDeleteAcademicYear,
    deleteAcademicYear,
    themeSettings,
    setThemeSettings,
    schoolDetails,
    setSchoolDetails,
    staff,
    setStaff,
    activeStudents: students,
    setStudents,
    hydrated,
    branches,
    setBranches,
    activeBranchId,
    activeBranch,
    openBranch,
  } = useTenantStore();

  const feeTerms = activeFeeTerms;

  const allSettingsTabs: { id: SettingsTabId; label: string }[] = useMemo(
    () => [
      { id: "school", label: "School Details" },
      { id: "branches", label: "Branches" },
      { id: "classes", label: "Class Tier" },
      { id: "departments", label: "Departments" },
      { id: "roles", label: "Positions" },
      { id: "users", label: "Users" },
      { id: "vehicles", label: "Vehicles" },
      { id: "transport", label: "Transport" },
      { id: "system", label: "System" },
      { id: "support", label: "Customer Support" },
    ],
    [],
  );

  const settingsTabs = useMemo(
    () => allSettingsTabs.filter((tab) => sessionCanAccessSettingsTab(session, tab.id)),
    [allSettingsTabs, session],
  );

  useEffect(() => {
    if (!sessionCanAccessSettings(session)) {
      toast.error("Settings access denied");
      navigate({ to: "/tenant/dashboard", replace: true });
      return;
    }
    // On the mobile menu (no tab), skip tab-level redirects.
    if (!tabParam) return;
    if (!sessionCanAccessSettingsTab(session, activeTab)) {
      navigate({ to: "/tenant/settings", search: {}, replace: true });
    }
  }, [session, activeTab, navigate, tabParam]);

  const activeTabLabel =
    settingsTabs.find((tab) => tab.id === activeTab)?.label ??
    allSettingsTabs.find((tab) => tab.id === activeTab)?.label ??
    "School Details";

  const [schoolDirty, setSchoolDirty] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [unsavedSaving, setUnsavedSaving] = useState(false);
  const schoolActionsRef = useRef<{
    save: () => Promise<boolean>;
    discard: () => void;
  } | null>(null);
  const pendingNavRef = useRef<(() => void) | null>(null);

  const runOrConfirmLeave = useCallback(
    (action: () => void) => {
      if (activeTab === "school" && schoolDirty) {
        pendingNavRef.current = action;
        setUnsavedDialogOpen(true);
        return;
      }
      action();
    },
    [activeTab, schoolDirty],
  );

  const handleUnsavedCancel = () => {
    setUnsavedDialogOpen(false);
    pendingNavRef.current = null;
  };

  const handleUnsavedDiscard = () => {
    schoolActionsRef.current?.discard();
    setUnsavedDialogOpen(false);
    const action = pendingNavRef.current;
    pendingNavRef.current = null;
    action?.();
  };

  const handleUnsavedSave = async () => {
    if (!schoolActionsRef.current) return;
    setUnsavedSaving(true);
    try {
      const ok = await schoolActionsRef.current.save();
      if (!ok) return;
      setUnsavedDialogOpen(false);
      const action = pendingNavRef.current;
      pendingNavRef.current = null;
      action?.();
    } finally {
      setUnsavedSaving(false);
    }
  };

  const setTab = (tab: SettingsTabId) => {
    runOrConfirmLeave(() => {
      navigate({
        to: "/tenant/settings",
        search: { tab },
      });
    });
  };

  const backToMenu = () => {
    runOrConfirmLeave(() => {
      navigate({ to: "/tenant/settings", search: {} });
    });
  };

  const handleLogout = () => {
    runOrConfirmLeave(() => {
      const name = session?.displayName ?? "Admin";
      logout();
      toast.success("Signed out · session cleared", { description: `Goodbye, ${name}` });
      navigate({ to: "/login", replace: true });
    });
  };

  const tenantName = schoolDetails.name || session?.tenantName || "School";
  const initials = schoolInitials(tenantName);
  const logoUrl = resolveMediaUrl(schoolDetails.logoUrl);

  const campusHint =
    branches.length > 1 && activeBranch ? (
      <p className="mb-2 text-[12px] text-black/55 dark:text-zinc-400">
        Configuring{" "}
        <span className="font-semibold text-black dark:text-zinc-100">{activeBranch.name}</span>
      </p>
    ) : null;

  const renderSettingsContent = (listLayout: "cards" | "table") => (
    <>
      {activeTab === "school" && (
        <SchoolDetailsCard
          schoolDetails={schoolDetails}
          setSchoolDetails={setSchoolDetails}
          onDirtyChange={setSchoolDirty}
          onBindActions={(actions: {
            save: () => Promise<boolean>;
            discard: () => void;
          }) => {
            schoolActionsRef.current = actions;
          }}
        />
      )}

      {activeTab === "branches" && (
        <SettingsBranchesCard
          branches={branches}
          setBranches={setBranches}
          activeBranchId={activeBranchId}
          openBranch={openBranch}
          canAddBranch={planAllowsMultipleBranches(session?.planFlags)}
        />
      )}

      {activeTab === "classes" && (
        <>
          {campusHint}
          <ClassesCard
          classes={classes}
          setClasses={setClasses}
          students={students}
          setStudents={setStudents}
          staff={staff}
          feeTerms={feeTerms}
        />
        </>
      )}

      {activeTab === "departments" && (
        <>
          {campusHint}
          <DepartmentsCard
            departments={departments}
            setDepartments={setDepartments}
            staff={staff}
            setStaff={setStaff}
            roles={roles}
          />
        </>
      )}

      {activeTab === "roles" && (
        <>
          {campusHint}
          <RolesCard
            roles={roles}
            setRoles={setRoles}
            departments={departments}
            staff={staff}
            setStaff={setStaff}
          />
        </>
      )}

      {activeTab === "users" && (
        <div className="space-y-3">
          <p className="text-[12px] text-black/55 dark:text-zinc-400">
            Users are organization-wide and can switch every campus.
          </p>
          <SettingsUsersCard
            tenantUsers={tenantUsers}
            setTenantUsers={setTenantUsers}
            roles={roles}
            staff={staff}
            canAddUser={planAllowsExtraUsers(session?.planFlags)}
          />
        </div>
      )}

      {activeTab === "vehicles" && (
        <>
          {campusHint}
          <VehicleCard
            listLayout={listLayout}
            transportVehicles={transportVehicles}
            setTransportVehicles={setTransportVehicles}
            transportRoutes={transportRoutes}
          />
        </>
      )}

      {activeTab === "transport" && (
        <>
          {campusHint}
          <TransportCard
            listLayout={listLayout}
            transportRoutes={transportRoutes}
            setTransportRoutes={setTransportRoutes}
            transportVehicles={transportVehicles}
            setTransportVehicles={setTransportVehicles}
          />
        </>
      )}

      {activeTab === "system" && (
        hydrated ? (
          <div className="grid grid-cols-12 gap-3 sm:gap-4 lg:gap-5">
            <CategoriesCard
              academicYears={academicYears}
              academicYear={academicYear}
              closedAcademicYears={closedAcademicYears}
              openAcademicYear={openAcademicYear}
              addAcademicYear={addAcademicYear}
              renameAcademicYear={renameAcademicYear}
              setAcademicYearClosed={setAcademicYearClosed}
              canDeleteAcademicYear={canDeleteAcademicYear}
              deleteAcademicYear={deleteAcademicYear}
              themeSettings={themeSettings}
              setThemeSettings={setThemeSettings}
            />
            <div className="col-span-12">
              <PwaInstallCard />
            </div>
          </div>
        ) : (
          <TenantSystemSkeleton />
        )
      )}

      {activeTab === "support" && <CustomerSupportCard />}
    </>
  );

  return (
    <div className="grid w-full grid-cols-12 gap-3 sm:gap-4 lg:gap-5">
      {/* Mobile: settings index — one card with list rows → section pages */}
      <div className={cn("col-span-12 min-w-0 lg:hidden", !showMobileMenu && "hidden")}>
        <div
          className={cn(
            glassCardClass,
            "overflow-hidden border border-white/70 bg-white/90 p-0 shadow-sm dark:border-white/10 dark:bg-zinc-900/90",
          )}
        >
          <div className="flex items-center gap-3 px-4 py-4">
            <div
              className={cn(
                "grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full text-[13px] font-bold text-white",
                !logoUrl && "bg-gradient-to-br from-[#0F766E] to-[#115E59]",
              )}
            >
              {logoUrl ? (
                <img src={logoUrl} alt={tenantName} className="h-full w-full bg-white object-contain p-0.5" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold text-slate-900 dark:text-zinc-50">
                {session?.displayName ?? "Admin"}
              </div>
              <div className="truncate text-[12px] text-slate-500 dark:text-zinc-400">{session?.email}</div>
            </div>
          </div>

          <ul className="border-t border-slate-100 dark:border-white/10">
            {settingsTabs.map((tab) => (
              <li key={tab.id} className="border-b border-slate-100 last:border-b-0 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setTab(tab.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors active:bg-slate-50 dark:active:bg-white/5"
                >
                  <span className="text-[15px] font-medium text-slate-900 dark:text-zinc-100">{tab.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500" />
                </button>
              </li>
            ))}
          </ul>

          <div className="p-3 pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-[14px] font-semibold text-white transition-colors active:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:active:bg-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: section page with back to menu */}
      <div className={cn("col-span-12 min-w-0 space-y-3 lg:hidden", showMobileMenu && "hidden")}>
        <button
          type="button"
          onClick={backToMenu}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-zinc-300 dark:hover:text-zinc-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Settings
        </button>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          {activeTabLabel}
        </div>
        {renderSettingsContent("cards")}
      </div>

      {/* Desktop: horizontal tabs + content */}
      <div className="col-span-12 hidden min-w-0 lg:block">
        <div className="mobile-scrollbar-none overflow-x-auto rounded-full border border-[#E5E5E5] bg-white/80 p-1 shadow-sm dark:border-white/10 dark:bg-zinc-900/80">
          <div className="flex min-w-max gap-1 lg:min-w-0 lg:w-full">
            {settingsTabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTab(tab.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors lg:min-w-0 lg:flex-1",
                    active
                      ? "bg-[#0F766E] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100",
                  )}
                >
                  <span className="block truncate text-center">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="col-span-12 hidden min-w-0 lg:block">{renderSettingsContent("table")}</div>

      <AlertDialog
        open={unsavedDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleUnsavedCancel();
        }}
      >
        <AlertDialogContent className="max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[20px] font-semibold text-black dark:text-zinc-50">
              Unsaved school details
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60 dark:text-zinc-400">
              You have changes that are not saved yet. Save them before leaving, or discard to
              revert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5 flex-col gap-2 sm:flex-row sm:justify-end sm:space-x-0">
            <AlertDialogCancel
              disabled={unsavedSaving}
              className="mt-0 w-full rounded-full sm:w-auto"
            >
              Keep editing
            </AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              disabled={unsavedSaving}
              onClick={handleUnsavedDiscard}
              className="w-full rounded-full sm:w-auto"
            >
              Discard
            </Button>
            <AlertDialogAction
              disabled={unsavedSaving}
              onClick={(e) => {
                e.preventDefault();
                void handleUnsavedSave();
              }}
              className="w-full rounded-full bg-[#0F766E] hover:bg-[#0D9488] sm:w-auto"
            >
              {unsavedSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CardHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[18px] font-bold leading-tight tracking-tight text-slate-900 dark:text-zinc-50 lg:text-black dark:lg:text-zinc-50">
          {title}
        </div>
        <p className="mt-1 text-[12px] text-slate-500 lg:text-black/55 dark:text-zinc-400">{subtitle}</p>
      </div>
      <button
        onClick={onAction}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-[#0F766E] to-[#115E59] px-3 py-2 text-[11.5px] font-semibold text-white shadow-md shadow-teal-900/15 transition-all hover:opacity-95"
        aria-label={actionLabel}
      >
        <Plus className="h-3.5 w-3.5" /> Add
      </button>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-black/15 bg-[#F4F4F5]/40 px-4 py-6 text-center text-[12px] text-black/55 dark:border-white/15 dark:bg-zinc-900/50 dark:text-zinc-400">
      {label}
    </div>
  );
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6">
        <DialogHeader>
          <DialogTitle className="text-[22px] font-semibold text-black">{title}</DialogTitle>
          <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60 dark:text-zinc-400">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-5 flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-[#EF4444] text-white hover:bg-[#DC2626]"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DepartmentsCard({
  departments,
  setDepartments,
  staff,
  setStaff,
  roles,
}: {
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  roles: Role[];
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: "", code: "" });

  const startCreate = () => {
    setEditingId(null);
    setForm({ name: "", code: "" });
    setOpen(true);
  };
  const startEdit = (d: Department) => {
    setEditingId(d.id);
    setForm({ name: d.name, code: d.code });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    if (!name || !code) {
      toast.error("Department name and code are required");
      return;
    }
    if (editingId) {
      const previous = departments.find((d) => d.id === editingId);
      const updated = { id: editingId, name, code };
      setDepartments((prev) => prev.map((d) => (d.id === editingId ? updated : d)));
      if (previous && previous.name !== name) {
        setStaff((prev) => prev.map((s) => (s.dept === previous.name ? { ...s, dept: name } : s)));
      }
      void apiUpsertDepartment(updated).catch((err) =>
        toast.error(err instanceof Error ? err.message : "Could not sync department"),
      );
      toast.success(`Department updated · ${name}`);
    } else {
      const nextId = `DEP-${(departments.length + 1).toString().padStart(3, "0")}`;
      const created = { id: nextId, name, code };
      setDepartments((prev) => [...prev, created]);
      void apiUpsertDepartment(created).catch((err) =>
        toast.error(err instanceof Error ? err.message : "Could not sync department"),
      );
      toast.success(`Department added · ${name}`);
    }
    setOpen(false);
  };

  const remove = (d: Department) => {
    const usedByStaff = staff.some((s) => s.dept === d.name);
    const usedByRole = roles.some((r) => r.departmentId === d.id);
    if (usedByStaff || usedByRole) {
      toast.error(`${d.name} is in use`, {
        description: usedByStaff
          ? "Reassign staff before deleting"
          : "Detach roles before deleting",
      });
      return;
    }
    setDepartments((prev) => prev.filter((x) => x.id !== d.id));
    void apiDeleteDepartment(d.id).catch((err) =>
      toast.error(err instanceof Error ? err.message : "Could not delete department"),
    );
    toast.error(`${d.name} removed`);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    remove(pendingDelete);
    setPendingDelete(null);
  };

  return (
    <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass}>
      <CardHeader
        title="Departments"
        subtitle={`${departments.length} divisions · live staff counts`}
        actionLabel="Add Department"
        onAction={startCreate}
      />

      <div className="mt-4 space-y-2">
        {departments.length === 0 && <EmptyRow label="No departments yet" />}
        {departments.map((d) => {
          const count = staff.filter(
            (s) => s.dept === d.name && !isRecordDeleted(s.deletedAt),
          ).length;
          return (
            <div
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5 dark:border-white/10 dark:bg-zinc-900/70"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#0F766E] text-[10.5px] font-semibold text-white">
                  {d.code.slice(0, 3)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-black dark:text-zinc-100">
                    {d.name}
                  </div>
                  <div className="font-mono text-[10.5px] uppercase tracking-wider text-black/45 dark:text-zinc-400">
                    {d.code}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <span className="rounded-full bg-[#CCFBF1] px-2 py-0.5 font-mono text-[10px] font-semibold text-black dark:bg-[#0F766E]/35 dark:text-[#5EEAD4] sm:px-2.5 sm:text-[11px]">
                  <span className="sm:hidden">{count}</span>
                  <span className="hidden sm:inline">{count} staff</span>
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(d)}
                  aria-label={`Rename ${d.name}`}
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 transition-colors hover:border-black/20 hover:bg-[#F4F4F5] hover:text-black dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(d)}
                  aria-label={`Delete ${d.name}`}
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2] dark:border-rose-500/40 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-950/80"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <DeleteConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title="Delete Department"
        description={
          pendingDelete
            ? `Are you sure you want to delete ${pendingDelete.name} (${pendingDelete.code})? This action cannot be undone.`
            : "Are you sure you want to delete this department?"
        }
        onConfirm={confirmDelete}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Rename Department" : "Add Department"}</DialogTitle>
            <DialogDescription>
              Define a new organisational unit. Staff and roles can be assigned to it immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Department Name
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Library Sciences"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Department Code
              </Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. LIB"
                className="font-mono uppercase"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]">
                {editingId ? "Save" : "Add Department"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrganicCard>
  );
}

function RolesCard({
  roles,
  setRoles,
  departments,
  staff,
  setStaff,
}: {
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  departments: Department[];
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Role | null>(null);
  const [form, setForm] = useState({
    title: "",
    departmentId: departments[0]?.id ?? "",
  });

  const startCreate = () => {
    setEditingId(null);
    setForm({ title: "", departmentId: departments[0]?.id ?? "" });
    setOpen(true);
  };
  const startEdit = (r: Role) => {
    setEditingId(r.id);
    setForm({ title: r.title, departmentId: r.departmentId });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      toast.error("Role title is required");
      return;
    }
    if (!form.departmentId) {
      toast.error("Pick a parent department");
      return;
    }
    if (editingId) {
      const previous = roles.find((r) => r.id === editingId);
      setRoles((prev) =>
        prev.map((r) =>
          r.id === editingId ? { ...r, title, departmentId: form.departmentId } : r,
        ),
      );
      if (previous && previous.title !== title) {
        setStaff((prev) =>
          prev.map((s) => (s.role === previous.title ? { ...s, role: title } : s)),
        );
      }
      toast.success(`Role updated · ${title}`);
    } else {
      const nextId = `ROL-${(roles.length + 1).toString().padStart(3, "0")}`;
      setRoles((prev) => [...prev, { id: nextId, title, departmentId: form.departmentId }]);
      toast.success(`Role added · ${title}`);
    }
    setOpen(false);
  };

  const remove = (r: Role) => {
    const usedByStaff = staff.some((s) => s.role === r.title);
    if (usedByStaff) {
      toast.error(`${r.title} is in use`, { description: "Reassign staff before deleting" });
      return;
    }
    setRoles((prev) => prev.filter((x) => x.id !== r.id));
    toast.error(`${r.title} removed`);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    remove(pendingDelete);
    setPendingDelete(null);
  };

  return (
    <OrganicCard tone="white" cornerSide="bl" padded className={workspacePanelClass}>
      <CardHeader
        title="Positions"
        subtitle={`${roles.length} position & role names · used in Recruit Staff and Users`}
        actionLabel="Add Position"
        onAction={startCreate}
      />

      <div className="mt-4 space-y-2">
        {roles.length === 0 && <EmptyRow label="No roles defined yet" />}
        {roles.map((r) => {
          const dept = departments.find((d) => d.id === r.departmentId);
          return (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5 dark:border-white/10 dark:bg-zinc-900/70"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-black dark:text-zinc-100">{r.title}</div>
                <div className="text-[11.5px] text-black/55 dark:text-zinc-400">{dept?.name ?? "Unassigned"}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => startEdit(r)}
                  aria-label={`Rename ${r.title}`}
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 transition-colors hover:border-black/20 hover:bg-[#F4F4F5] hover:text-black dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(r)}
                  aria-label={`Delete ${r.title}`}
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2] dark:border-rose-500/40 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-950/80"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <DeleteConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title="Delete Position / Role"
        description={
          pendingDelete
            ? `Are you sure you want to delete "${pendingDelete.title}"? This action cannot be undone.`
            : "Are you sure you want to delete this position?"
        }
        onConfirm={confirmDelete}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Position / Role" : "Add Position / Role"}</DialogTitle>
            <DialogDescription>
              Position and role names become selectable in Recruit Staff and workspace Users.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Position / Role name
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Chemistry · HOD"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Parent Department
              </Label>
              <FieldSelect
                value={form.departmentId}
                onValueChange={(departmentId) => setForm({ ...form, departmentId })}
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
                placeholder="Select department"
                disabled={departments.length === 0}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]">
                {editingId ? "Save" : "Add Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrganicCard>
  );
}

function ClassesCard({
  classes,
  setClasses,
  students,
  setStudents,
  staff,
  feeTerms,
}: {
  classes: ClassConfig[];
  setClasses: React.Dispatch<React.SetStateAction<ClassConfig[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  staff: Staff[];
  feeTerms: FeeTerm[];
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ClassConfig | null>(null);
  type FeeDraftRow = { id: string; label: string; amount: string; dueDate: string };

  const emptyOneTimeRows = (): FeeDraftRow[] =>
    CLASS_ONE_TIME_FEE_SUGGESTIONS.map((label, index) => ({
      id: `ot-${index + 1}`,
      label,
      amount: "",
      dueDate: "",
    }));

  const [form, setForm] = useState<{
    grade: string;
    section: string;
    billingCycle: Extract<ClassBillingCycle, "Monthly" | "Term">;
    feeAmountMode: ClassFeeAmountMode;
    installmentCount: string;
    fixedAmount: string;
    installments: FeeDraftRow[];
    oneTimeFees: FeeDraftRow[];
    classTeacherId: string;
  }>({
    grade: "",
    section: "",
    billingCycle: "Monthly",
    feeAmountMode: "fixed",
    installmentCount: "12",
    fixedAmount: "",
    installments: [],
    oneTimeFees: emptyOneTimeRows(),
    classTeacherId: "",
  });

  const teacherOptions = useMemo(
    () =>
      staff
        .filter((member) => isRecordActive(member.active) && !isRecordDeleted(member.deletedAt))
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [staff],
  );

  const teacherName = (id?: string) =>
    id ? teacherOptions.find((m) => m.id === id)?.name ?? staff.find((m) => m.id === id)?.name : undefined;

  const defaultInstallmentCount = (cycle: Extract<ClassBillingCycle, "Monthly" | "Term">) => {
    const mode = cycle === "Term" ? "term" : "month";
    const n = filterFeePeriods(feeTerms, mode, "tuition").length;
    if (n > 0) return String(n);
    return cycle === "Term" ? "4" : "12";
  };

  const schedulePreview = useMemo(() => {
    const count = Math.max(1, Math.floor(Number(form.installmentCount) || 0));
    const fixed = Math.max(0, Math.round(Number(form.fixedAmount) || 0));
    const installmentLines =
      form.feeAmountMode === "fixed"
        ? buildFixedInstallments(count, fixed, form.billingCycle)
        : form.installments.map((row, index) => ({
            id: row.id || `fl-i-${index + 1}`,
            kind: "installment" as const,
            label: row.label.trim() || installmentLabel(index, form.billingCycle),
            amount: Math.max(0, Math.round(Number(row.amount) || 0)),
            ...(row.dueDate ? { dueDate: row.dueDate } : {}),
          }));
    const oneTimeLines = form.oneTimeFees
      .map((row, index) => ({
        id: row.id || `fl-ot-${index + 1}`,
        kind: "one_time" as const,
        label: row.label.trim(),
        amount: Math.max(0, Math.round(Number(row.amount) || 0)),
        ...(row.dueDate ? { dueDate: row.dueDate } : {}),
      }))
      .filter((row) => row.label && row.amount > 0);
    const feeSchedule = [...installmentLines.filter((l) => l.amount > 0), ...oneTimeLines];
    return { installmentLines, oneTimeLines, feeSchedule, total: sumFeeSchedule(feeSchedule) };
  }, [form]);

  const emptyForm = () => ({
    grade: "",
    section: "",
    billingCycle: "Monthly" as Extract<ClassBillingCycle, "Monthly" | "Term">,
    feeAmountMode: "fixed" as ClassFeeAmountMode,
    installmentCount: defaultInstallmentCount("Monthly"),
    fixedAmount: "",
    installments: [],
    oneTimeFees: emptyOneTimeRows(),
    classTeacherId: "",
  });

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
  };
  const startEdit = (c: ClassConfig) => {
    const normalized = withClassFeeSchedule(normalizeClassConfig(c), feeTerms);
    const cycle: Extract<ClassBillingCycle, "Monthly" | "Term"> =
      normalized.billingCycle === "Term" ? "Term" : "Monthly";
    const installments = normalized.feeSchedule.filter((l) => l.kind === "installment");
    const oneTime = normalized.feeSchedule.filter((l) => l.kind === "one_time");
    const uniqueAmounts = [...new Set(installments.map((l) => l.amount))];
    setEditingId(c.id);
    setForm({
      grade: normalized.grade,
      section: normalized.section,
      billingCycle: cycle,
      feeAmountMode:
        normalized.feeAmountMode === "custom" || uniqueAmounts.length > 1 ? "custom" : "fixed",
      installmentCount: String(installments.length || defaultInstallmentCount(cycle)),
      fixedAmount: String(installments[0]?.amount || ""),
      installments: installments.map((line) => ({
        id: line.id,
        label: line.label,
        amount: line.amount ? String(line.amount) : "",
        dueDate: line.dueDate ?? "",
      })),
      oneTimeFees:
        oneTime.length > 0
          ? oneTime.map((line) => ({
              id: line.id,
              label: line.label,
              amount: line.amount ? String(line.amount) : "",
              dueDate: line.dueDate ?? "",
            }))
          : emptyOneTimeRows(),
      classTeacherId: normalized.classTeacherId ?? "",
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const grade = form.grade.trim();
    const section = form.section.trim();
    if (!grade) {
      toast.error("Class is required");
      return;
    }
    if (!section) {
      toast.error("Division is required");
      return;
    }
    const { feeSchedule, total } = schedulePreview;
    if (total <= 0) {
      toast.error("Add at least one fee amount");
      return;
    }
    const className = composeClassName(grade, section);
    const classTeacherId = form.classTeacherId || undefined;
    const existing = editingId ? classes.find((c) => c.id === editingId) : undefined;
    const next: Omit<ClassConfig, "id"> = {
      className,
      grade,
      section,
      tuitionFeeAmount: total,
      vehicleFeeAmount: existing?.vehicleFeeAmount ?? 0,
      billingCycle: form.billingCycle,
      feeAmountMode: form.feeAmountMode,
      feeSchedule,
      classTeacherId,
    };
    if (editingId) {
      const previous = classes.find((c) => c.id === editingId);
      const updated = { ...next, id: editingId };
      setClasses((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...next } : c)),
      );
      if (previous && previous.className !== className) {
        setStudents((prev) =>
          prev.map((s) => (s.cls === previous.className ? { ...s, cls: className } : s)),
        );
      }
      void apiUpsertClass(updated).catch((err) =>
        toast.error(err instanceof Error ? err.message : "Could not sync class"),
      );
      toast.success(`${className} updated`, {
        description: `₹ ${next.tuitionFeeAmount.toLocaleString("en-IN")} · ${scheduleSummary({ ...next, id: editingId })}`,
      });
    } else {
      const nextId = `CLS-${(classes.length + 1).toString().padStart(3, "0")}`;
      const created = { id: nextId, ...next };
      setClasses((prev) => [...prev, created]);
      void apiUpsertClass(created).catch((err) =>
        toast.error(err instanceof Error ? err.message : "Could not sync class"),
      );
      toast.success(`${className} added`, {
        description: `₹ ${next.tuitionFeeAmount.toLocaleString("en-IN")} · ${scheduleSummary(created)}`,
      });
    }
    setOpen(false);
  };

  const remove = (c: ClassConfig) => {
    const enrolled = students.some((s) => s.cls === c.className);
    if (enrolled) {
      toast.error(`${c.className} has students enrolled`, {
        description: "Move them to another class first",
      });
      return;
    }
    setClasses((prev) => prev.filter((x) => x.id !== c.id));
    void apiDeleteClass(c.id).catch((err) =>
      toast.error(err instanceof Error ? err.message : "Could not delete class"),
    );
    toast.error(`${c.className} removed`);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    remove(pendingDelete);
    setPendingDelete(null);
  };

  return (
    <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass}>
      <CardHeader
        title="Class Tier"
        subtitle="Per-class fee schedule for Receive Payment"
        actionLabel="Add Class"
        onAction={startCreate}
      />

      <div className="mt-4 space-y-2">
        {classes.length === 0 && <EmptyRow label="No class tiers configured" />}
        {classes.map((c) => {
          const normalized = withClassFeeSchedule(normalizeClassConfig(c), feeTerms);
          const teacher = teacherName(normalized.classTeacherId);
          return (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-black">
                  {normalized.className}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-black/55 dark:text-zinc-400">
                  <span className="font-mono text-black">
                    ₹ {normalized.tuitionFeeAmount.toLocaleString("en-IN")}
                  </span>
                  <span className="rounded-full bg-[#CCFBF1] px-2 py-0.5 text-[10.5px] font-semibold text-black">
                    {normalized.billingCycle}
                  </span>
                  <span className="text-[11px] text-black/50">{scheduleSummary(normalized)}</span>
                  {teacher && (
                    <span className="truncate text-[11px] text-black/50">Teacher · {teacher}</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  aria-label={`Edit ${normalized.className}`}
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 dark:text-zinc-400 transition-colors hover:border-black/20 hover:bg-[#F4F4F5] hover:text-black"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(c)}
                  aria-label={`Delete ${normalized.className}`}
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <DeleteConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title="Delete Class Tier"
        description={
          pendingDelete
            ? `Are you sure you want to delete ${pendingDelete.className}? Tuition prefills for this class will stop working.`
            : "Are you sure you want to delete this class tier?"
        }
        onConfirm={confirmDelete}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="mobile-scrollbar-none max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Class Tier" : "Add Class Tier"}</DialogTitle>
            <DialogDescription>
              Set the class, then define installments and one-time fees. Totals prefill Finance ·
              Receive Payment.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                Class identity
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                    Class
                  </Label>
                  <Input
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    placeholder="e.g. Grade 8"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                    Division
                  </Label>
                  <Input
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    placeholder="e.g. B"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Class Teacher{" "}
                  <span className="normal-case tracking-normal text-black/40">(optional)</span>
                </Label>
                <StaffSearchSelect
                  staff={teacherOptions}
                  value={form.classTeacherId}
                  onChange={(id) => setForm({ ...form, classTeacherId: id })}
                  placeholder="Choose staff member"
                  allowNone
                  noneLabel="No class teacher"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] p-3.5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  Fee structure
                </p>
                <p className="mt-1 text-[12px] leading-snug text-black/50">
                  Monthly or term installments, fixed or different amounts, plus optional one-time
                  fees.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Billing
                </Label>
                <div
                  role="tablist"
                  aria-label="Billing cycle"
                  className="flex border-b border-[#E8E8EA] dark:border-white/10"
                >
                  {CLASS_SCHEDULE_CYCLES.map((cycle) => {
                    const active = form.billingCycle === cycle;
                    return (
                      <button
                        key={cycle}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => {
                          const count = defaultInstallmentCount(cycle);
                          setForm((prev) => ({
                            ...prev,
                            billingCycle: cycle,
                            installmentCount: prev.installmentCount || count,
                            installments: prev.installments.map((row, index) => ({
                              ...row,
                              label: installmentLabel(index, cycle),
                            })),
                          }));
                        }}
                        className={cn(
                          "relative min-w-0 flex-1 px-2 py-2.5 text-center text-[12.5px] font-semibold tracking-tight transition-colors",
                          active
                            ? "text-[#0F766E] dark:text-[#5EEAD4]"
                            : "text-black/45 hover:text-black/70 dark:text-zinc-500 dark:hover:text-zinc-300",
                        )}
                      >
                        {cycle}
                        {active && (
                          <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#0F766E] dark:bg-[#2DD4BF]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Amounts
                </Label>
                <div className="flex gap-1 rounded-full border border-[#E5E5E5] bg-white p-1">
                  {(
                    [
                      { key: "fixed" as const, label: "Fixed" },
                      { key: "custom" as const, label: "Different" },
                    ] as const
                  ).map((option) => {
                    const active = form.feeAmountMode === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => {
                          setForm((prev) => {
                            if (option.key === "custom" && prev.installments.length === 0) {
                              const count = Math.max(1, Math.floor(Number(prev.installmentCount) || 0));
                              const amount = prev.fixedAmount;
                              return {
                                ...prev,
                                feeAmountMode: "custom",
                                installments: Array.from({ length: count }, (_, index) => ({
                                  id: `fl-i-${index + 1}`,
                                  label: installmentLabel(index, prev.billingCycle),
                                  amount,
                                  dueDate: "",
                                })),
                              };
                            }
                            return { ...prev, feeAmountMode: option.key };
                          });
                        }}
                        className={cn(
                          "flex-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                          active ? "bg-[#0F766E] text-white" : "text-black/65 hover:text-black",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.feeAmountMode === "fixed" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                      {form.billingCycle === "Term" ? "Terms" : "Installments"}
                    </Label>
                    <Input
                      inputMode="numeric"
                      value={form.installmentCount}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          installmentCount: e.target.value.replace(/[^0-9]/g, ""),
                        })
                      }
                      placeholder={form.billingCycle === "Term" ? "4" : "12"}
                      className="font-mono bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                      Amount each (₹)
                    </Label>
                    <Input
                      inputMode="numeric"
                      value={form.fixedAmount}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          fixedAmount: e.target.value.replace(/[^0-9]/g, ""),
                        })
                      }
                      placeholder="0"
                      className="font-mono bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {form.installments.map((row, index) => (
                    <div key={row.id} className="grid grid-cols-[1fr_7rem_auto] items-end gap-2">
                      <div className="space-y-1">
                        {index === 0 && (
                          <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                            Label
                          </Label>
                        )}
                        <Input
                          value={row.label}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              installments: form.installments.map((item) =>
                                item.id === row.id ? { ...item, label: e.target.value } : item,
                              ),
                            })
                          }
                          className="h-9 bg-white text-[13px]"
                        />
                      </div>
                      <div className="space-y-1">
                        {index === 0 && (
                          <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                            Amount
                          </Label>
                        )}
                        <Input
                          inputMode="numeric"
                          value={row.amount}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              installments: form.installments.map((item) =>
                                item.id === row.id
                                  ? { ...item, amount: e.target.value.replace(/[^0-9]/g, "") }
                                  : item,
                              ),
                            })
                          }
                          className="h-9 font-mono bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${row.label}`}
                        onClick={() =>
                          setForm({
                            ...form,
                            installments: form.installments.filter((item) => item.id !== row.id),
                            installmentCount: String(
                              Math.max(1, form.installments.length - 1),
                            ),
                          })
                        }
                        className="mb-0.5 grid h-9 w-9 place-items-center rounded-full text-black/40 hover:bg-[#FEE2E2] hover:text-[#EF4444]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        installments: [
                          ...form.installments,
                          {
                            id: `fl-i-${form.installments.length + 1}-${Date.now()}`,
                            label: installmentLabel(form.installments.length, form.billingCycle),
                            amount: form.fixedAmount,
                            dueDate: "",
                          },
                        ],
                        installmentCount: String(form.installments.length + 1),
                      })
                    }
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0F766E] hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add installment
                  </button>
                </div>
              )}

              <div className="space-y-2 border-t border-[#E8E8EA] pt-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                    One-time fees
                  </Label>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        oneTimeFees: [
                          ...form.oneTimeFees,
                          {
                            id: `ot-${Date.now()}`,
                            label: "",
                            amount: "",
                            dueDate: "",
                          },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0F766E] hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add fee
                  </button>
                </div>
                {form.oneTimeFees.map((row) => (
                  <div key={row.id} className="grid grid-cols-[1fr_7rem_auto] items-center gap-2">
                    <Input
                      value={row.label}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          oneTimeFees: form.oneTimeFees.map((item) =>
                            item.id === row.id ? { ...item, label: e.target.value } : item,
                          ),
                        })
                      }
                      placeholder="Admission Fee"
                      className="h-9 bg-white text-[13px]"
                    />
                    <Input
                      inputMode="numeric"
                      value={row.amount}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          oneTimeFees: form.oneTimeFees.map((item) =>
                            item.id === row.id
                              ? { ...item, amount: e.target.value.replace(/[^0-9]/g, "") }
                              : item,
                          ),
                        })
                      }
                      placeholder="0"
                      className="h-9 font-mono bg-white"
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${row.label || "fee"}`}
                      onClick={() =>
                        setForm({
                          ...form,
                          oneTimeFees: form.oneTimeFees.filter((item) => item.id !== row.id),
                        })
                      }
                      className="grid h-9 w-9 place-items-center rounded-full text-black/40 hover:bg-[#FEE2E2] hover:text-[#EF4444]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <p className="text-[10.5px] text-black/40">Leave amount blank to skip a row.</p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-[#D1FAE5] bg-white px-3 py-2.5">
                <span className="text-[12px] text-black/55">Class total</span>
                <span className="font-mono text-[15px] font-semibold text-[#0F766E]">
                  ₹ {schedulePreview.total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]">
                {editingId ? "Save Changes" : "Add Class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrganicCard>
  );
}

function VehicleCard({
  transportVehicles,
  setTransportVehicles,
  transportRoutes,
  listLayout = "table",
}: {
  transportVehicles: TransportVehicle[];
  setTransportVehicles: React.Dispatch<React.SetStateAction<TransportVehicle[]>>;
  transportRoutes: TransportRoute[];
  listLayout?: "cards" | "table";
}) {
  const MAX_VEHICLE_DOC_BYTES = 1_500_000;
  const emptyDocs = (): VehicleDocument[] => createDefaultVehicleDocuments();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TransportVehicle | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [routeQuery, setRouteQuery] = useState("");
  const [form, setForm] = useState({
    name: "",
    registrationNo: "",
    capacity: "",
    ownership: "owned" as VehicleOwnership,
    driverName: "",
    driverPhone: "",
    routeIds: [] as string[],
    active: true,
    documents: emptyDocs(),
  });

  const detailVehicle = useMemo(
    () => (detailId ? (transportVehicles.find((v) => v.id === detailId) ?? null) : null),
    [detailId, transportVehicles],
  );

  useEffect(() => {
    if (detailId && !transportVehicles.some((v) => v.id === detailId)) {
      setDetailId(null);
    }
  }, [detailId, transportVehicles]);

  const routeLabel = (routeId: string) => {
    const route = transportRoutes.find((r) => r.id === routeId);
    return route ? `${route.mapFrom} → ${route.mapTo}` : routeId;
  };

  const routesLabel = (routeIds: string[]) => {
    if (routeIds.length === 0) return "—";
    return routeIds.map(routeLabel).join(", ");
  };

  const filteredRoutes = useMemo(() => {
    const q = routeQuery.trim().toLowerCase();
    if (!q) return transportRoutes;
    return transportRoutes.filter((r) => {
      const haystack = `${r.mapFrom} ${r.mapTo} ${r.id}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [transportRoutes, routeQuery]);

  const toggleRoute = (routeId: string) => {
    setForm((prev) => ({
      ...prev,
      routeIds: prev.routeIds.includes(routeId)
        ? prev.routeIds.filter((id) => id !== routeId)
        : [...prev.routeIds, routeId],
    }));
  };

  const patchDocument = (
    kind: VehicleDocumentKind,
    patch: Partial<Omit<VehicleDocument, "kind">>,
  ) => {
    setForm((prev) => ({
      ...prev,
      documents: prev.documents.map((doc) =>
        doc.kind === kind ? { ...doc, ...patch } : doc,
      ),
    }));
  };

  const attachDocument = async (kind: VehicleDocumentKind, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (file.size > MAX_VEHICLE_DOC_BYTES) {
      toast.error(`${file.name} exceeds ${formatAttachmentSize(MAX_VEHICLE_DOC_BYTES)} limit`);
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      patchDocument(kind, {
        file: {
          id: `vdoc-${Date.now().toString(36)}`,
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        },
      });
      toast.success(`${VEHICLE_DOCUMENT_LABELS[kind]} attached`);
    } catch {
      toast.error(`Could not read ${file.name}`);
    }
  };

  const startCreate = () => {
    setEditingId(null);
    setRouteQuery("");
    setForm({
      name: "",
      registrationNo: "",
      capacity: "",
      ownership: "owned",
      driverName: "",
      driverPhone: "",
      routeIds: [],
      active: true,
      documents: emptyDocs(),
    });
    setOpen(true);
  };

  const startEdit = (v: TransportVehicle) => {
    setEditingId(v.id);
    setRouteQuery("");
    const docsByKind = new Map((v.documents ?? []).map((d) => [d.kind, d]));
    setForm({
      name: v.name,
      registrationNo: v.registrationNo,
      capacity: String(v.capacity),
      ownership: v.ownership ?? "owned",
      driverName: v.driverName ?? "",
      driverPhone: v.driverPhone ?? "",
      routeIds: [...v.routeIds],
      active: v.active,
      documents: VEHICLE_DOCUMENT_KINDS.map(
        (kind) =>
          docsByKind.get(kind) ?? {
            kind,
            notifyDaysBefore: DEFAULT_VEHICLE_NOTIFY_DAYS,
          },
      ),
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const registrationNo = form.registrationNo.trim();
    const capacity = Number(form.capacity);
    if (!name || !registrationNo) {
      toast.error("Vehicle name and registration number are required");
      return;
    }
    if (!capacity || capacity <= 0) {
      toast.error("Capacity must be a positive number");
      return;
    }
    const payload: Omit<TransportVehicle, "id"> = {
      name,
      registrationNo,
      capacity,
      ownership: form.ownership,
      driverName: form.driverName.trim() || undefined,
      driverPhone: form.driverPhone.trim() || undefined,
      routeIds: form.routeIds,
      active: form.active,
      documents: form.documents.map((doc) => ({
        kind: doc.kind,
        validUntil: doc.validUntil || undefined,
        notifyDaysBefore: doc.notifyDaysBefore ?? DEFAULT_VEHICLE_NOTIFY_DAYS,
        file: doc.file,
      })),
    };
    if (editingId) {
      setTransportVehicles((prev) =>
        prev.map((v) => (v.id === editingId ? { ...v, ...payload } : v)),
      );
      toast.success(`${name} updated`);
    } else {
      const nextId = `VH-${(transportVehicles.length + 1).toString().padStart(3, "0")}`;
      setTransportVehicles((prev) => [...prev, { id: nextId, ...payload }]);
      toast.success(`${name} added to fleet`);
    }
    setOpen(false);
  };

  const remove = (v: TransportVehicle) => {
    setTransportVehicles((prev) => prev.filter((x) => x.id !== v.id));
    toast.error(`${v.name} removed from fleet`);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const deletedId = pendingDelete.id;
    remove(pendingDelete);
    setPendingDelete(null);
    if (detailId === deletedId) setDetailId(null);
  };

  const activeCount = transportVehicles.filter((v) => v.active).length;

  const docAlert = (v: TransportVehicle) => {
    let worst: "expired" | "soon" | null = null;
    for (const doc of v.documents ?? []) {
      if (!doc.validUntil) continue;
      const days = daysUntilDate(doc.validUntil);
      if (days === null) continue;
      const warn = doc.notifyDaysBefore ?? DEFAULT_VEHICLE_NOTIFY_DAYS;
      if (days < 0) return "expired" as const;
      if (days <= warn) worst = "soon";
    }
    return worst;
  };

  const formatValidUntil = (iso?: string) => {
    if (!iso) return null;
    const match = iso.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return iso;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${Number(match[3])} ${months[Number(match[2]) - 1]} ${match[1]}`;
  };

  const detailMeta = useMemo(() => {
    if (!detailVehicle) return null;
    const v = detailVehicle;
    const alert = docAlert(v);
    const docs = VEHICLE_DOCUMENT_KINDS.map((kind) => {
      const existing = (v.documents ?? []).find((d) => d.kind === kind);
      return (
        existing ?? {
          kind,
          notifyDaysBefore: DEFAULT_VEHICLE_NOTIFY_DAYS,
        }
      );
    });
    const assignedRoutes = v.routeIds
      .map((id) => transportRoutes.find((r) => r.id === id))
      .filter((r): r is TransportRoute => Boolean(r));
    return { v, alert, docs, assignedRoutes };
  }, [detailVehicle, transportRoutes]);

  return (
    <>
      {detailMeta ? (
      <OrganicCard
        tone="white"
        cornerSide="tr"
        padded
        className={cn(workspacePanelClass, "col-span-12")}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setDetailId(null)}
              aria-label="Back to vehicle list"
              className={cn(
                glassInsetClass,
                "inline-flex h-9 w-9 shrink-0 items-center justify-center text-slate-700 transition-colors hover:text-[#0F766E] sm:h-10 sm:w-auto sm:gap-1.5 sm:px-3",
              )}
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="hidden text-[13px] font-semibold sm:inline">Back</span>
            </button>
            <div className="min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0F766E] text-white">
                  <Bus className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-[18px] font-bold leading-tight tracking-tight text-black sm:text-[20px]">
                      {detailMeta.v.name}
                    </h2>
                    {detailMeta.alert && (
                      <AlertTriangle
                        className={cn(
                          "h-4 w-4 shrink-0",
                          detailMeta.alert === "expired" ? "text-[#EF4444]" : "text-[#D97706]",
                        )}
                      />
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-[12px] text-black/50">
                    {detailMeta.v.registrationNo}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                detailMeta.v.active ? "bg-[#0F766E] text-white" : "bg-black/10 text-black/50",
              )}
            >
              {detailMeta.v.active ? "Active" : "Idle"}
            </span>
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-black/60 dark:text-zinc-400">
              {detailMeta.v.ownership === "rental" ? "Rental" : "Owned"}
            </span>
            <button
              type="button"
              onClick={() => startEdit(detailMeta.v)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 text-[12px] font-semibold text-black/70 transition-colors hover:bg-[#F4F4F5] hover:text-black"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setPendingDelete(detailMeta.v)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-3 text-[12px] font-semibold text-[#EF4444] transition-colors hover:bg-[#FEE2E2]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-12 gap-3">
          <div className="col-span-12 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] p-4 sm:col-span-6 lg:col-span-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
              Driver
            </div>
            <div className="mt-1.5 text-[14px] font-medium text-black">
              {detailMeta.v.driverName || (
                <span className="font-normal text-black/40">Not assigned</span>
              )}
            </div>
            <div className="mt-1 font-mono text-[12px] text-black/55 dark:text-zinc-400">
              {detailMeta.v.driverPhone || "No phone on file"}
            </div>
          </div>
          <div className="col-span-6 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] p-4 lg:col-span-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
              Seat Capacity
            </div>
            <div className="mt-1.5 font-mono text-[18px] font-bold text-black">
              {detailMeta.v.capacity}
            </div>
          </div>
          <div className="col-span-6 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] p-4 lg:col-span-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
              Vehicle ID
            </div>
            <div className="mt-1.5 font-mono text-[14px] font-semibold text-black">
              {detailMeta.v.id}
            </div>
          </div>

          <div className="col-span-12 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                Assigned Routes
              </div>
              <span className="font-mono text-[10.5px] text-black/45">
                {detailMeta.assignedRoutes.length} linked
              </span>
            </div>
            {detailMeta.assignedRoutes.length === 0 ? (
              <p className="mt-3 text-[13px] text-black/45">No routes assigned to this vehicle.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {detailMeta.assignedRoutes.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-[#E8E8EA] bg-white px-3.5 py-2.5 text-[13px] font-medium text-black"
                  >
                    {r.mapFrom} → {r.mapTo}
                    <div className="mt-1 font-mono text-[10.5px] font-normal text-black/45">
                      Morning ₹{r.morningFee.toLocaleString("en-IN")} · Evening ₹
                      {r.eveningFee.toLocaleString("en-IN")} · Both ₹
                      {r.bothFee.toLocaleString("en-IN")}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="col-span-12 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-black/45">
                <Paperclip className="h-3.5 w-3.5" />
                Documents & Validity
              </div>
              <span className="font-mono text-[10.5px] text-black/45">
                {detailMeta.docs.filter((d) => d.file || d.validUntil).length} /{" "}
                {detailMeta.docs.length} on file
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {detailMeta.docs.map((doc) => {
                const days = doc.validUntil ? daysUntilDate(doc.validUntil) : null;
                const warn = doc.notifyDaysBefore ?? DEFAULT_VEHICLE_NOTIFY_DAYS;
                const status =
                  days === null
                    ? null
                    : days < 0
                      ? "expired"
                      : days <= warn
                        ? "soon"
                        : "ok";
                return (
                  <div
                    key={doc.kind}
                    className="rounded-lg border border-[#E8E8EA] bg-white p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[12.5px] font-semibold text-black">
                        {VEHICLE_DOCUMENT_LABELS[doc.kind]}
                      </div>
                      {status && (
                        <span
                          className={cn(
                            "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase",
                            status === "expired"
                              ? "bg-[#FEE2E2] text-[#B91C1C]"
                              : status === "soon"
                                ? "bg-[#FEF3C7] text-[#B45309]"
                                : "bg-[#D1F2E1] text-[#047857]",
                          )}
                        >
                          {status === "expired"
                            ? "Expired"
                            : status === "soon"
                              ? `${days}d left`
                              : "Valid"}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                          Valid until
                        </div>
                        <div className="mt-0.5 font-mono text-black/75">
                          {formatValidUntil(doc.validUntil) ?? "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                          Alert window
                        </div>
                        <div className="mt-0.5 font-mono text-black/75">
                          {doc.notifyDaysBefore ?? DEFAULT_VEHICLE_NOTIFY_DAYS} days
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5">
                      {doc.file ? (
                        <a
                          href={doc.file.dataUrl}
                          download={doc.file.name}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2 transition-colors hover:bg-slate-100"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0 text-black/40" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[12px] font-medium text-black">
                              {doc.file.name}
                            </div>
                            <div className="font-mono text-[10px] text-black/45">
                              {formatAttachmentSize(doc.file.size)}
                            </div>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-black/40" />
                        </a>
                      ) : (
                        <p className="rounded-xl border border-dashed border-slate-200 px-2.5 py-2 text-[12px] text-black/40">
                          No file attached
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </OrganicCard>
      ) : (

    <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass}>
      <CardHeader
        title="Vehicle Management"
        subtitle={`${activeCount} active · ${transportVehicles.length} total in fleet`}
        actionLabel="Add Vehicle"
        onAction={startCreate}
      />

      {listLayout === "cards" ? (
      <div className="mt-4 space-y-2.5">
        {transportVehicles.length === 0 && <EmptyRow label="No vehicles in fleet yet" />}
        {transportVehicles.map((v) => {
          const alert = docAlert(v);
          return (
            <div
              key={v.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetailId(v.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setDetailId(v.id);
                }
              }}
              aria-label={`Open details for ${v.name}`}
              className="flex w-full cursor-pointer flex-col gap-2.5 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5 text-left transition-colors active:bg-[#F4F4F5]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0F766E] text-white">
                    <Bus className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[14px] font-semibold text-black">{v.name}</span>
                      {alert && (
                        <AlertTriangle
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            alert === "expired" ? "text-[#EF4444]" : "text-[#D97706]",
                          )}
                        />
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-black/50">
                      {v.driverName ?? "No driver assigned"}
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider",
                    v.active ? "bg-[#0F766E] text-white" : "bg-black/10 text-black/50",
                  )}
                >
                  {v.active ? "Active" : "Idle"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-black/60 dark:text-zinc-400">
                <span className="font-mono font-medium text-black/75">{v.registrationNo}</span>
                <span className="text-black/30">·</span>
                <span>{v.capacity} seats</span>
                <span className="text-black/30">·</span>
                <span>{v.ownership === "rental" ? "Rental" : "Owned"}</span>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-[#EFEFEF] pt-2">
                <span className="min-w-0 truncate text-[11px] text-black/45" title={routesLabel(v.routeIds)}>
                  {v.routeIds.length === 0 ? "No routes" : routesLabel(v.routeIds)}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(v);
                    }}
                    aria-label={`Edit vehicle ${v.name}`}
                    className="grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 dark:text-zinc-400"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDelete(v);
                    }}
                    aria-label={`Delete vehicle ${v.name}`}
                    className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      ) : (
      <div className="mt-4 overflow-x-auto rounded-lg border border-[#EFEFEF]">
        <table className="w-full min-w-[780px] table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[16%]" />
            <col className="w-[8%]" />
            <col className="w-[10%]" />
            <col className="w-[24%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead>
            <tr className="bg-[#F4F4F5] text-[10px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              <th className="px-3.5 py-2 font-semibold">Vehicle</th>
              <th className="px-3.5 py-2 font-semibold">Registration</th>
              <th className="px-3.5 py-2 text-right font-semibold">Seats</th>
              <th className="px-3.5 py-2 font-semibold">Type</th>
              <th className="px-3.5 py-2 font-semibold">Assigned Routes</th>
              <th className="px-3.5 py-2 font-semibold">Status</th>
              <th className="px-3.5 py-2 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {transportVehicles.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3.5 py-6 text-center text-[12px] text-black/55 dark:text-zinc-400">
                  No vehicles in fleet yet
                </td>
              </tr>
            ) : (
              transportVehicles.map((v) => {
                const alert = docAlert(v);
                return (
                  <tr
                    key={v.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailId(v.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setDetailId(v.id);
                      }
                    }}
                    aria-label={`Open details for ${v.name}`}
                    className="cursor-pointer border-t border-[#EFEFEF] text-[12.5px] transition-colors hover:bg-[#F8F8F9] focus-visible:bg-[#F8F8F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F766E]"
                  >
                    <td className="px-3.5 py-2.5 align-middle">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate font-medium text-black">
                          <Bus className="h-3.5 w-3.5 shrink-0 text-black/40" />
                          {v.name}
                          {alert && (
                            <AlertTriangle
                              className={cn(
                                "h-3.5 w-3.5 shrink-0",
                                alert === "expired" ? "text-[#EF4444]" : "text-[#D97706]",
                              )}
                              aria-label={
                                alert === "expired"
                                  ? "Document expired"
                                  : "Document expiring soon"
                              }
                            />
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-[10.5px] text-black/45">
                          {v.driverName ?? "No driver assigned"}
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 align-middle">
                      <span className="block truncate font-mono text-[11.5px] text-black/70">
                        {v.registrationNo}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-right align-middle font-mono text-black">
                      {v.capacity}
                    </td>
                    <td className="px-3.5 py-2.5 align-middle">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-black/60 dark:bg-white/10 dark:text-zinc-200">
                        {v.ownership === "rental" ? "Rental" : "Owned"}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 align-middle">
                      <span
                        className="block truncate text-[11.5px] text-black/70"
                        title={routesLabel(v.routeIds)}
                      >
                        {routesLabel(v.routeIds)}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 align-middle">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider",
                          v.active ? "bg-[#0F766E] text-white" : "bg-black/10 text-black/50",
                        )}
                      >
                        {v.active ? "Active" : "Idle"}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 align-middle">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(v);
                          }}
                          aria-label={`Edit vehicle ${v.name}`}
                          className="grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 dark:text-zinc-400 transition-colors hover:border-black/20 hover:bg-[#F4F4F5] hover:text-black"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete(v);
                          }}
                          aria-label={`Delete vehicle ${v.name}`}
                          className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}
    </OrganicCard>
      )}

      <DeleteConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title="Delete Vehicle"
        description={
          pendingDelete
            ? `Remove ${pendingDelete.name} (${pendingDelete.registrationNo}) from the fleet? This cannot be undone.`
            : "Are you sure you want to delete this vehicle?"
        }
        onConfirm={confirmDelete}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
            <DialogDescription>
              Register owned or rental vehicles, attach RC / insurance / pollution / licence
              documents with validity dates. Expiry alerts appear in Notifications.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Vehicle or Rental?
              </Label>
              <div className="inline-flex w-full rounded-full border border-[#E5E5E5] bg-[#F4F4F5] p-1">
                {(
                  [
                    { id: "owned" as const, label: "Owned vehicle" },
                    { id: "rental" as const, label: "Rental" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setForm({ ...form, ownership: option.id })}
                    className={cn(
                      "flex-1 rounded-full px-3 py-2 text-[12px] font-semibold transition-colors",
                      form.ownership === option.id
                        ? "bg-[#0F766E] text-white"
                        : "text-black/55 dark:text-zinc-400 hover:text-black",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Vehicle Name
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Bus 01"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Registration No.
                </Label>
                <Input
                  value={form.registrationNo}
                  onChange={(e) => setForm({ ...form, registrationNo: e.target.value })}
                  placeholder="KL-07-AB-4521"
                  className="font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Seat Capacity
                </Label>
                <Input
                  inputMode="numeric"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: e.target.value.replace(/[^0-9]/g, "") })
                  }
                  placeholder="42"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Driver Name
                </Label>
                <Input
                  value={form.driverName}
                  onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Assigned Routes
              </Label>
              {transportRoutes.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[#E5E5E5] px-3 py-4 text-center text-[12px] text-black/45">
                  No routes configured yet
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-[#E5E5E5] bg-[#FAFAFA]">
                  <div className="relative border-b border-[#E5E5E5] bg-white p-2">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/40" />
                    <Input
                      value={routeQuery}
                      onChange={(e) => setRouteQuery(e.target.value)}
                      placeholder="Search routes…"
                      className="h-9 border-[#E5E5E5] bg-white pl-8 text-[12px]"
                    />
                  </div>
                  <div className="max-h-36 space-y-1 overflow-y-auto p-2">
                    {filteredRoutes.length === 0 ? (
                      <p className="px-2 py-3 text-center text-[12px] text-black/45">
                        No routes match “{routeQuery.trim()}”
                      </p>
                    ) : (
                      filteredRoutes.map((r) => {
                        const checked = form.routeIds.includes(r.id);
                        return (
                          <label
                            key={r.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-2.5 rounded-xl px-2.5 py-2 transition-colors",
                              checked
                                ? "bg-[#CCFBF1] dark:bg-[#0F766E]/40"
                                : "hover:bg-white dark:hover:bg-white/5",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleRoute(r.id)}
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20 accent-[#0F766E]"
                            />
                            <span className="min-w-0 text-[12px] leading-snug text-black dark:text-zinc-100">
                              {r.mapFrom} → {r.mapTo}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
              <p className="text-[10.5px] text-black/45">
                {form.routeIds.length === 0
                  ? "No routes selected"
                  : `${form.routeIds.length} route${form.routeIds.length === 1 ? "" : "s"} selected`}
                {routeQuery.trim() && filteredRoutes.length > 0
                  ? ` · showing ${filteredRoutes.length} of ${transportRoutes.length}`
                  : ""}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Driver Phone
              </Label>
              <Input
                value={form.driverPhone}
                onChange={(e) => setForm({ ...form, driverPhone: e.target.value })}
                placeholder="Optional"
                className="font-mono"
              />
            </div>

            <div className="space-y-2 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  <Paperclip className="h-3.5 w-3.5" />
                  Documents & validity
                </div>
                <span className="text-[10px] text-black/40">
                  Alerts before expiry
                </span>
              </div>
              <div className="space-y-2.5">
                {form.documents.map((doc) => {
                  const days = doc.validUntil ? daysUntilDate(doc.validUntil) : null;
                  const warn = doc.notifyDaysBefore ?? DEFAULT_VEHICLE_NOTIFY_DAYS;
                  const status =
                    days === null
                      ? null
                      : days < 0
                        ? "expired"
                        : days <= warn
                          ? "soon"
                          : "ok";
                  return (
                    <div
                      key={doc.kind}
                      className="rounded-lg border border-[#E8E8EA] bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-[12px] font-semibold text-black">
                          {VEHICLE_DOCUMENT_LABELS[doc.kind]}
                        </div>
                        {status && (
                          <span
                            className={cn(
                              "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase",
                              status === "expired"
                                ? "bg-[#FEE2E2] text-[#B91C1C]"
                                : status === "soon"
                                  ? "bg-[#FEF3C7] text-[#B45309]"
                                  : "bg-[#D1F2E1] text-[#047857]",
                            )}
                          >
                            {status === "expired"
                              ? "Expired"
                              : status === "soon"
                                ? `${days}d left`
                                : "Valid"}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                            Valid until
                          </Label>
                          <DatePicker
                            value={doc.validUntil ?? ""}
                            onChange={(validUntil) =>
                              patchDocument(doc.kind, {
                                validUntil: validUntil || undefined,
                              })
                            }
                            placeholder="dd/mm/yyyy"
                            valueFormat="iso"
                            className="h-9 text-[12px]"
                            quickPicks={[
                              { label: "Today", getDate: (t) => t },
                              {
                                label: "+1y",
                                getDate: (t) =>
                                  new Date(t.getFullYear() + 1, t.getMonth(), t.getDate()),
                              },
                            ]}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                            Notify days before
                          </Label>
                          <Input
                            inputMode="numeric"
                            value={String(doc.notifyDaysBefore ?? DEFAULT_VEHICLE_NOTIFY_DAYS)}
                            onChange={(e) => {
                              const n = Number(e.target.value.replace(/[^0-9]/g, ""));
                              patchDocument(doc.kind, {
                                notifyDaysBefore: Number.isFinite(n)
                                  ? Math.min(365, n)
                                  : DEFAULT_VEHICLE_NOTIFY_DAYS,
                              });
                            }}
                            className="h-9 font-mono text-[12px]"
                            placeholder="30"
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        {doc.file ? (
                          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2">
                            <FileText className="h-3.5 w-3.5 shrink-0 text-black/40" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[12px] font-medium text-black">
                                {doc.file.name}
                              </div>
                              <div className="font-mono text-[10px] text-black/45">
                                {formatAttachmentSize(doc.file.size)}
                              </div>
                            </div>
                            <a
                              href={doc.file.dataUrl}
                              download={doc.file.name}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-black/60 dark:text-zinc-400 hover:bg-white"
                              aria-label={`Open ${doc.file.name}`}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => patchDocument(doc.kind, { file: undefined })}
                              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                              aria-label={`Remove ${doc.file.name}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white text-[12px] font-medium text-black/70 transition-colors hover:border-slate-400 hover:bg-slate-50">
                            <Upload className="h-3.5 w-3.5" />
                            Attach file
                            <input
                              type="file"
                              accept="image/*,.pdf,.jpg,.jpeg,.png,.webp"
                              className="hidden"
                              onChange={(e) => {
                                void attachDocument(doc.kind, e.target.files);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-black/40">
                PDF or images · up to {formatAttachmentSize(MAX_VEHICLE_DOC_BYTES)} each ·
                notifications appear under Notifications → Transport
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2.5">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-black/20 accent-black"
              />
              <span className="text-[12.5px] font-medium text-black">Active in fleet</span>
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]">
                {editingId ? "Save" : "Add Vehicle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}


function TransportCard({
  transportRoutes,
  setTransportRoutes,
  transportVehicles,
  setTransportVehicles,
  listLayout = "table",
}: {
  transportRoutes: TransportRoute[];
  setTransportRoutes: React.Dispatch<React.SetStateAction<TransportRoute[]>>;
  transportVehicles: TransportVehicle[];
  setTransportVehicles: React.Dispatch<React.SetStateAction<TransportVehicle[]>>;
  listLayout?: "cards" | "table";
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TransportRoute | null>(null);
  const [form, setForm] = useState({
    mapFrom: "",
    mapTo: "",
    fromLat: null as number | null,
    fromLng: null as number | null,
    toLat: null as number | null,
    toLng: null as number | null,
    morningFee: "",
    eveningFee: "",
    bothFee: "",
  });

  const vehiclesForRoute = (routeId: string) =>
    transportVehicles.filter((v) => v.routeIds.includes(routeId));

  const startCreate = () => {
    setEditingId(null);
    setForm({
      mapFrom: "",
      mapTo: "",
      fromLat: null,
      fromLng: null,
      toLat: null,
      toLng: null,
      morningFee: "",
      eveningFee: "",
      bothFee: "",
    });
    setOpen(true);
  };

  const startEdit = (r: TransportRoute) => {
    setEditingId(r.id);
    setForm({
      mapFrom: r.mapFrom,
      mapTo: r.mapTo,
      fromLat: r.fromLat ?? null,
      fromLng: r.fromLng ?? null,
      toLat: r.toLat ?? null,
      toLng: r.toLng ?? null,
      morningFee: String(r.morningFee),
      eveningFee: String(r.eveningFee),
      bothFee: String(r.bothFee),
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const mapFrom = form.mapFrom.trim();
    const mapTo = form.mapTo.trim();
    const morningFee = Number(form.morningFee);
    const eveningFee = Number(form.eveningFee);
    const bothFee = Number(form.bothFee);
    if (!mapFrom || !mapTo) {
      toast.error("Pickup hub and destination are required");
      return;
    }
    if (!morningFee || morningFee <= 0 || !eveningFee || eveningFee <= 0 || !bothFee || bothFee <= 0) {
      toast.error("Morning, evening, and both-shift fees must be positive amounts");
      return;
    }
    const payload: Omit<TransportRoute, "id"> = {
      mapFrom,
      mapTo,
      morningFee,
      eveningFee,
      bothFee,
      ...(form.fromLat != null ? { fromLat: form.fromLat } : {}),
      ...(form.fromLng != null ? { fromLng: form.fromLng } : {}),
      ...(form.toLat != null ? { toLat: form.toLat } : {}),
      ...(form.toLng != null ? { toLng: form.toLng } : {}),
    };
    if (editingId) {
      const updated: TransportRoute = { id: editingId, ...payload };
      if (form.fromLat == null) delete updated.fromLat;
      if (form.fromLng == null) delete updated.fromLng;
      if (form.toLat == null) delete updated.toLat;
      if (form.toLng == null) delete updated.toLng;
      setTransportRoutes((prev) =>
        prev.map((r) => (r.id !== editingId ? r : updated)),
      );
      void apiUpsertTransportRoute(updated).catch((err) =>
        toast.error(err instanceof Error ? err.message : "Could not sync route"),
      );
      toast.success(`Route updated · ${mapFrom} → ${mapTo}`);
    } else {
      const nextId = `TR-${(transportRoutes.length + 1).toString().padStart(3, "0")}`;
      const created = { id: nextId, ...payload };
      setTransportRoutes((prev) => [...prev, created]);
      void apiUpsertTransportRoute(created).catch((err) =>
        toast.error(err instanceof Error ? err.message : "Could not sync route"),
      );
      toast.success(`Route added · ${mapFrom} → ${mapTo}`);
    }
    setOpen(false);
  };

  const remove = (r: TransportRoute) => {
    setTransportRoutes((prev) => prev.filter((x) => x.id !== r.id));
    setTransportVehicles((prev) =>
      prev.map((v) => ({
        ...v,
        routeIds: v.routeIds.filter((id) => id !== r.id),
      })),
    );
    void apiDeleteTransportRoute(r.id).catch((err) =>
      toast.error(err instanceof Error ? err.message : "Could not delete route"),
    );
    toast.error(`${r.mapFrom} → ${r.mapTo} removed`);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    remove(pendingDelete);
    setPendingDelete(null);
  };

  const inr = (n: number) => `₹ ${n.toLocaleString("en-IN")}`;

  return (
    <OrganicCard tone="white" cornerSide="bl" padded className={workspacePanelClass}>
      <CardHeader
        title="Transport Routes"
        subtitle={`${transportRoutes.length} routes · morning, evening & both-shift fees`}
        actionLabel="Add Route"
        onAction={startCreate}
      />

      {listLayout === "cards" ? (
      <div className="mt-4 space-y-2.5">
        {transportRoutes.length === 0 && <EmptyRow label="No routes mapped yet" />}
        {transportRoutes.map((r) => {
          const vehicles = vehiclesForRoute(r.id);
          const vehicleNames =
            vehicles.length === 0 ? "No vehicles" : vehicles.map((v) => v.name).join(", ");
          const fromPinned =
            r.fromLat != null &&
            r.fromLng != null &&
            Number.isFinite(r.fromLat) &&
            Number.isFinite(r.fromLng);
          const toPinned =
            r.toLat != null &&
            r.toLng != null &&
            Number.isFinite(r.toLat) &&
            Number.isFinite(r.toLng);
          const directionsUrl =
            fromPinned && toPinned
              ? `https://www.google.com/maps/dir/?api=1&origin=${r.fromLat},${r.fromLng}&destination=${r.toLat},${r.toLng}`
              : null;
          return (
            <div
              key={r.id}
              className="rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1">
                    <div className="truncate text-[14px] font-semibold text-black">{r.mapFrom}</div>
                    {fromPinned ? (
                      <a
                        href={`https://www.google.com/maps?q=${r.fromLat},${r.fromLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${r.mapFrom} in Google Maps`}
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-black/40"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                  <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[12px] text-black/50">
                    <span className="truncate">→ {r.mapTo}</span>
                    {toPinned ? (
                      <a
                        href={`https://www.google.com/maps?q=${r.toLat},${r.toLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${r.mapTo} in Google Maps`}
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-black/40"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                    {directionsUrl ? (
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Directions from ${r.mapFrom} to ${r.mapTo}`}
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-black/40"
                      >
                        <Route className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(r)}
                    aria-label={`Edit route ${r.mapFrom} to ${r.mapTo}`}
                    className="grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 dark:text-zinc-400"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(r)}
                    aria-label={`Delete route ${r.mapFrom} to ${r.mapTo}`}
                    className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-white px-2.5 py-2">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-black/40">
                    Morning
                  </div>
                  <div className="mt-0.5 font-mono text-[12px] font-semibold text-black">
                    {inr(r.morningFee)}
                  </div>
                </div>
                <div className="rounded-lg bg-white px-2.5 py-2">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-black/40">
                    Evening
                  </div>
                  <div className="mt-0.5 font-mono text-[12px] font-semibold text-black">
                    {inr(r.eveningFee)}
                  </div>
                </div>
                <div className="rounded-lg bg-white px-2.5 py-2">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-black/40">
                    Both
                  </div>
                  <div className="mt-0.5 font-mono text-[12px] font-semibold text-black">
                    {inr(r.bothFee)}
                  </div>
                </div>
              </div>
              <div className="mt-2 truncate text-[11px] text-black/45 dark:text-zinc-400" title={vehicleNames}>
                {vehicleNames}
              </div>
            </div>
          );
        })}
      </div>
      ) : (
      <div className="mt-4 overflow-x-auto rounded-lg border border-[#EFEFEF]">
        <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[20%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[15%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="bg-[#F4F4F5] text-[10px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              <th className="px-3.5 py-2 font-semibold">From</th>
              <th className="px-3.5 py-2 font-semibold">To</th>
              <th className="px-3.5 py-2 text-right font-semibold">Morning</th>
              <th className="px-3.5 py-2 text-right font-semibold">Evening</th>
              <th className="px-3.5 py-2 text-right font-semibold">Both</th>
              <th className="px-3.5 py-2 font-semibold">Vehicles</th>
              <th className="px-3.5 py-2 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {transportRoutes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3.5 py-6 text-center text-[12px] text-black/55 dark:text-zinc-400">
                  No routes mapped yet
                </td>
              </tr>
            ) : (
              transportRoutes.map((r) => {
                const vehicles = vehiclesForRoute(r.id);
                const vehicleNames =
                  vehicles.length === 0 ? "—" : vehicles.map((v) => v.name).join(", ");
                const fromPinned =
                  r.fromLat != null &&
                  r.fromLng != null &&
                  Number.isFinite(r.fromLat) &&
                  Number.isFinite(r.fromLng);
                const toPinned =
                  r.toLat != null &&
                  r.toLng != null &&
                  Number.isFinite(r.toLat) &&
                  Number.isFinite(r.toLng);
                const directionsUrl =
                  fromPinned && toPinned
                    ? `https://www.google.com/maps/dir/?api=1&origin=${r.fromLat},${r.fromLng}&destination=${r.toLat},${r.toLng}`
                    : null;
                return (
                  <tr key={r.id} className="border-t border-[#EFEFEF] text-[12.5px]">
                    <td className="px-3.5 py-2.5 align-middle">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="block truncate text-black" title={r.mapFrom}>
                          {r.mapFrom}
                        </span>
                        {fromPinned ? (
                          <a
                            href={`https://www.google.com/maps?q=${r.fromLat},${r.fromLng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${r.mapFrom} in Google Maps`}
                            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-black/40 transition-colors hover:bg-[#F4F4F5] hover:text-black"
                            title="Open in Google Maps"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 align-middle">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="block truncate text-black/75" title={r.mapTo}>
                          {r.mapTo}
                        </span>
                        {toPinned ? (
                          <a
                            href={`https://www.google.com/maps?q=${r.toLat},${r.toLng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${r.mapTo} in Google Maps`}
                            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-black/40 transition-colors hover:bg-[#F4F4F5] hover:text-black"
                            title="Open in Google Maps"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                        {directionsUrl ? (
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Directions from ${r.mapFrom} to ${r.mapTo}`}
                            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-black/40 transition-colors hover:bg-[#F4F4F5] hover:text-black"
                            title="Directions in Google Maps"
                          >
                            <Route className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-right align-middle font-mono text-[11.5px] text-black">
                      {inr(r.morningFee)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right align-middle font-mono text-[11.5px] text-black">
                      {inr(r.eveningFee)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right align-middle font-mono text-[11.5px] font-semibold text-black">
                      {inr(r.bothFee)}
                    </td>
                    <td className="px-3.5 py-2.5 align-middle">
                      <span className="block truncate text-[11px] text-black/60 dark:text-zinc-300" title={vehicleNames}>
                        {vehicleNames}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 align-middle">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(r)}
                          aria-label={`Edit route ${r.mapFrom} to ${r.mapTo}`}
                          className="grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 dark:text-zinc-400 transition-colors hover:border-black/20 hover:bg-[#F4F4F5] hover:text-black"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(r)}
                          aria-label={`Delete route ${r.mapFrom} to ${r.mapTo}`}
                          className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}

      <DeleteConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title="Delete Transport Route"
        description={
          pendingDelete
            ? `Are you sure you want to delete the route ${pendingDelete.mapFrom} → ${pendingDelete.mapTo}? Linked vehicles will be unassigned.`
            : "Are you sure you want to delete this transport route?"
        }
        onConfirm={confirmDelete}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Route" : "Add Transport Route"}</DialogTitle>
            <DialogDescription>
              Set pickup → drop pairs with separate morning, evening, and combined shift fees. The
              both-shift fee prefills Vehicle Fee on Receive Payment. Search or pick each end on the
              map to save coordinates.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <LocationPicker
              label="Map From (Pickup Hub)"
              value={form.mapFrom}
              lat={form.fromLat}
              lng={form.fromLng}
              autoFocus
              placeholder="Search pickup location…"
              onChange={({ label, lat, lng }) =>
                setForm((prev) => ({
                  ...prev,
                  mapFrom: label,
                  fromLat: lat,
                  fromLng: lng,
                }))
              }
            />
            <LocationPicker
              label="Map To (Destination Node)"
              value={form.mapTo}
              lat={form.toLat}
              lng={form.toLng}
              placeholder="Search destination…"
              onChange={({ label, lat, lng }) =>
                setForm((prev) => ({
                  ...prev,
                  mapTo: label,
                  toLat: lat,
                  toLng: lng,
                }))
              }
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Morning Fee (₹)
                </Label>
                <Input
                  inputMode="numeric"
                  value={form.morningFee}
                  onChange={(e) =>
                    setForm({ ...form, morningFee: e.target.value.replace(/[^0-9]/g, "") })
                  }
                  placeholder="0"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Evening Fee (₹)
                </Label>
                <Input
                  inputMode="numeric"
                  value={form.eveningFee}
                  onChange={(e) =>
                    setForm({ ...form, eveningFee: e.target.value.replace(/[^0-9]/g, "") })
                  }
                  placeholder="0"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Both Shifts (₹)
                </Label>
                <Input
                  inputMode="numeric"
                  value={form.bothFee}
                  onChange={(e) =>
                    setForm({ ...form, bothFee: e.target.value.replace(/[^0-9]/g, "") })
                  }
                  placeholder="0"
                  className="font-mono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]">
                {editingId ? "Save" : "Add Route"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrganicCard>
  );
}

function readImageForCrop(
  file: File,
  opts: { maxBytes: number; label: string },
): string {
  if (!file.type.startsWith("image/")) {
    throw new Error(`Please choose a JPG, PNG, or WebP ${opts.label}`);
  }
  if (file.size > opts.maxBytes) {
    throw new Error(
      `${opts.label} must be ${Math.round(opts.maxBytes / (1024 * 1024))} MB or smaller`,
    );
  }
  return URL.createObjectURL(file);
}

async function prepareImageForCrop(src: string): Promise<string> {
  const trimmed = src.trim();
  if (!trimmed) throw new Error("No image to adjust");
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;
  const blob = await fetchMediaBlob(trimmed);
  if (!blob.type.startsWith("image/")) throw new Error("Could not load image for editing");
  return URL.createObjectURL(blob);
}

async function toRasterDataUrl(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;
  const objectUrl = await prepareImageForCrop(src);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image"));
      el.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, img.naturalWidth);
    canvas.height = Math.max(1, img.naturalHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare image");
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    if (objectUrl.startsWith("blob:")) URL.revokeObjectURL(objectUrl);
  }
}

const schoolBrandActionBtn =
  "inline-flex h-8 items-center gap-1 rounded-full bg-white px-2.5 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-black/10 transition-colors hover:bg-[#0F766E] hover:text-white disabled:pointer-events-none disabled:opacity-45";

function SchoolDetailsMediaField({
  label,
  badge,
  hint,
  preview,
  onAdjust,
  canAdjust = true,
  adjustLoading = false,
  onUpload,
  uploadLabel = "Upload",
  uploadIcon: UploadIcon = ImagePlus,
  onRemove,
  removeAriaLabel,
  extraActions,
}: {
  label: string;
  badge?: ReactNode;
  hint: string;
  preview: ReactNode;
  onAdjust?: () => void;
  canAdjust?: boolean;
  adjustLoading?: boolean;
  onUpload?: () => void;
  uploadLabel?: string;
  uploadIcon?: typeof ImagePlus;
  onRemove?: () => void;
  removeAriaLabel?: string;
  extraActions?: ReactNode;
}) {
  const showAdjust = Boolean(canAdjust && onAdjust);
  const previewShell = (
    <div className="relative shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-black/10">
      {preview}
      {showAdjust && (
        <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/45 via-black/10 to-transparent pb-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-800 shadow-sm">
            Adjust
          </span>
        </span>
      )}
    </div>
  );

  return (
    <div className="col-span-12 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] p-3 sm:col-span-6">
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-black/45">
          {label}
          {badge}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-1">
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="grid h-8 w-8 place-items-center rounded-full text-black/45 transition-colors hover:bg-[#FEE2E2] hover:text-[#EF4444]"
              aria-label={removeAriaLabel ?? `Remove ${label.toLowerCase()}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {extraActions}
          {showAdjust && (
            <button
              type="button"
              onClick={onAdjust}
              disabled={adjustLoading}
              className={schoolBrandActionBtn}
            >
              {adjustLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Scan className="h-3.5 w-3.5" />
              )}
              Adjust
            </button>
          )}
          {onUpload && (
            <button type="button" onClick={onUpload} className={schoolBrandActionBtn}>
              <UploadIcon className="h-3.5 w-3.5" />
              {uploadLabel}
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-start gap-3">
        {showAdjust ? (
          <button
            type="button"
            onClick={onAdjust}
            disabled={adjustLoading}
            className="group rounded-xl outline-none transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#0F766E]/40"
            aria-label={`Adjust ${label.toLowerCase()}`}
          >
            {previewShell}
          </button>
        ) : (
          previewShell
        )}
        <p className="min-w-0 pt-0.5 text-[11px] leading-relaxed text-black/50">{hint}</p>
      </div>
    </div>
  );
}

function SchoolDetailsCard({
  schoolDetails,
  setSchoolDetails,
  onDirtyChange,
  onBindActions,
}: {
  schoolDetails: SchoolDetails;
  setSchoolDetails: React.Dispatch<React.SetStateAction<SchoolDetails>>;
  onDirtyChange?: (dirty: boolean) => void;
  onBindActions?: (actions: {
    save: () => Promise<boolean>;
    discard: () => void;
  }) => void;
}) {
  const { updateSession } = useAuth();
  const [draft, setDraft] = useState<SchoolDetails>(schoolDetails);
  const [saving, setSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const letterheadInputRef = useRef<HTMLInputElement>(null);
  const sealInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const [cropTarget, setCropTarget] = useState<"logo" | "letterhead" | "seal" | "signature" | null>(
    null,
  );
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropLoading, setCropLoading] = useState<
    "logo" | "letterhead" | "seal" | "signature" | null
  >(null);
  const [drawSignatureOpen, setDrawSignatureOpen] = useState(false);

  useEffect(() => {
    setDraft(schoolDetails);
  }, [schoolDetails]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(schoolDetails);
  const initials = schoolInitials(draft.name || "School");

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const patch = <K extends keyof SchoolDetails>(key: K, value: SchoolDetails[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const closeCrop = () => {
    setCropSrc((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setCropTarget(null);
  };

  const performSave = useCallback(async (): Promise<boolean> => {
    const name = draft.name.trim();
    if (!name) {
      toast.error("School name is required");
      return false;
    }
    const next: SchoolDetails = {
      ...draft,
      name,
      tagline: draft.tagline.trim(),
      address: draft.address.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      website: draft.website.trim(),
      registrationNo: draft.registrationNo.trim(),
      affiliationNo: draft.affiliationNo.trim(),
      principalName: draft.principalName.trim(),
      establishedYear: draft.establishedYear.trim(),
    };
    setSaving(true);
    try {
      const saved = getApiToken() ? await apiSaveSchoolDetails(next) : next;
      setSchoolDetails(saved);
      setDraft(saved);
      updateSession({ tenantName: saved.name });
      toast.success("School details saved", {
        description: getApiToken()
          ? `${saved.name} · synced to spi.macadz.com`
          : saved.name,
      });
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save school details");
      return false;
    } finally {
      setSaving(false);
    }
  }, [draft, setSchoolDetails, updateSession]);

  const discardChanges = useCallback(() => {
    setDraft(schoolDetails);
  }, [schoolDetails]);

  useEffect(() => {
    onBindActions?.({ save: performSave, discard: discardChanges });
  }, [onBindActions, performSave, discardChanges]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSave();
  };

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = readImageForCrop(file, { maxBytes: 2 * 1024 * 1024, label: "Logo" });
      setCropSrc((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return url;
      });
      setCropTarget("logo");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload logo");
    }
  };

  const onLetterhead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = readImageForCrop(file, {
        maxBytes: 3 * 1024 * 1024,
        label: "Letterhead",
      });
      setCropSrc((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return url;
      });
      setCropTarget("letterhead");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload letterhead");
    }
  };

  const onSeal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = readImageForCrop(file, { maxBytes: 2 * 1024 * 1024, label: "Seal" });
      setCropSrc((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return url;
      });
      setCropTarget("seal");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload seal");
    }
  };

  const onSignatureFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = readImageForCrop(file, {
        maxBytes: 2 * 1024 * 1024,
        label: "Signature",
      });
      setCropSrc((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return url;
      });
      setCropTarget("signature");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload signature");
    }
  };

  const applyCrop = (dataUrl: string) => {
    if (cropTarget === "logo") {
      patch("logoUrl", dataUrl);
      toast.success("Logo ready — click Save Changes");
    } else if (cropTarget === "letterhead") {
      patch("letterheadUrl", dataUrl);
      toast.success("Letterhead ready — click Save Changes");
    } else if (cropTarget === "seal") {
      patch("sealUrl", dataUrl);
      toast.success("Seal ready — click Save Changes");
    } else if (cropTarget === "signature") {
      patch("signatureUrl", dataUrl);
      toast.success("Signature ready — click Save Changes");
    }
    closeCrop();
  };

  const openAdjust = async (target: "logo" | "letterhead" | "seal" | "signature") => {
    setCropLoading(target);
    try {
      let src: string;
      switch (target) {
        case "logo": {
          if (!draft.logoUrl) {
            toast.error("Upload a logo first");
            return;
          }
          src = await prepareImageForCrop(resolveMediaUrl(draft.logoUrl) ?? draft.logoUrl);
          break;
        }
        case "letterhead": {
          if (!draft.letterheadUrl) {
            toast.error("Upload a letterhead first");
            return;
          }
          src = await prepareImageForCrop(
            resolveMediaUrl(draft.letterheadUrl) ?? draft.letterheadUrl,
          );
          break;
        }
        case "seal": {
          if (draft.sealUrl) {
            src = await prepareImageForCrop(resolveMediaUrl(draft.sealUrl) ?? draft.sealUrl);
          } else {
            let logoDataUrl: string | undefined;
            if (draft.logoUrl) {
              logoDataUrl = await toRasterDataUrl(resolveMediaUrl(draft.logoUrl) ?? draft.logoUrl);
            }
            const png = await defaultSealToPng(draft.name || "School", {
              details: draft.address,
              logoDataUrl,
            });
            src = png.dataUrl;
          }
          break;
        }
        case "signature": {
          if (draft.signatureUrl) {
            src = await prepareImageForCrop(
              resolveMediaUrl(draft.signatureUrl) ?? draft.signatureUrl,
            );
          } else {
            src = resolveSignatureDisplaySrc(draft.principalName, undefined);
          }
          break;
        }
      }
      setCropSrc((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return src;
      });
      setCropTarget(target);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open image editor");
    } finally {
      setCropLoading(null);
    }
  };

  return (
    <OrganicCard tone="white" cornerSide="br" padded className={workspacePanelClass}>
      <form onSubmit={save}>
        <div className="flex flex-col gap-3 border-b border-black/[0.06] pb-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-[18px] font-bold leading-tight tracking-tight text-black dark:text-zinc-50">
              School Details
            </div>
            <p className="mt-1 text-[12px] text-black/55 dark:text-zinc-400">
              Logo, letterhead, signature, and seal used across the workspace
            </p>
          </div>
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
            {dirty && (
              <span className="rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#B45309]">
                Unsaved
              </span>
            )}
            <Button
              type="submit"
              disabled={!dirty || saving}
              className="w-full rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488] disabled:opacity-40 sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-5">
        <div className="grid grid-cols-12 gap-3">
          <SchoolDetailsMediaField
            label="Logo"
            hint="Dock & headers · square · click preview or Adjust to reposition and scale · PNG/JPG · max 2 MB"
            canAdjust={Boolean(draft.logoUrl)}
            adjustLoading={cropLoading === "logo"}
            onAdjust={() => void openAdjust("logo")}
            onUpload={() => logoInputRef.current?.click()}
            onRemove={draft.logoUrl ? () => patch("logoUrl", undefined) : undefined}
            removeAriaLabel="Remove logo"
            preview={
              draft.logoUrl ? (
                <img
                  src={resolveMediaUrl(draft.logoUrl) ?? draft.logoUrl}
                  alt="School logo"
                  className="h-16 w-16 object-contain p-1.5"
                />
              ) : (
                <div className="grid h-16 w-16 place-items-center bg-gradient-to-br from-[#0F766E] to-[#115E59] text-[13px] font-bold text-white">
                  {initials}
                </div>
              )
            }
          />

          <SchoolDetailsMediaField
            label="Letterhead"
            hint="Wide banner for receipts & PDFs · Adjust to crop and scale · max 3 MB"
            canAdjust={Boolean(draft.letterheadUrl)}
            adjustLoading={cropLoading === "letterhead"}
            onAdjust={() => void openAdjust("letterhead")}
            onUpload={() => letterheadInputRef.current?.click()}
            uploadIcon={FileImage}
            onRemove={draft.letterheadUrl ? () => patch("letterheadUrl", undefined) : undefined}
            removeAriaLabel="Remove letterhead"
            preview={
              draft.letterheadUrl ? (
                <img
                  src={resolveMediaUrl(draft.letterheadUrl) ?? draft.letterheadUrl}
                  alt="School letterhead"
                  className="h-16 w-[min(100%,12rem)] object-cover object-top sm:w-48"
                />
              ) : (
                <div className="flex h-16 w-[min(100%,12rem)] items-center justify-center border border-dashed border-black/10 px-3 text-center text-[10px] text-black/45 sm:w-48">
                  No letterhead
                </div>
              )
            }
          />
        </div>

        <div className="grid grid-cols-12 gap-3">
          <SchoolDetailsMediaField
            label="Seal"
            badge={
              !draft.sealUrl ? (
                <span className="rounded-full bg-[#CCFBF1] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#0F766E]">
                  Default
                </span>
              ) : undefined
            }
            hint="Official stamp on receipts · Adjust default or uploaded seal · PNG/JPG · max 2 MB"
            adjustLoading={cropLoading === "seal"}
            onAdjust={() => void openAdjust("seal")}
            onUpload={() => sealInputRef.current?.click()}
            onRemove={draft.sealUrl ? () => patch("sealUrl", undefined) : undefined}
            removeAriaLabel="Reset seal to default"
            preview={
              draft.sealUrl ? (
                <img
                  src={resolveSealDisplaySrc(draft.name, draft.sealUrl)}
                  alt="School seal"
                  className="h-20 w-20 rounded-full object-contain p-1"
                />
              ) : (
                <DefaultSchoolSeal
                  name={draft.name}
                  details={draft.address}
                  logoUrl={draft.logoUrl}
                  className="h-20 w-20 rounded-full"
                />
              )
            }
          />

          <SchoolDetailsMediaField
            label="Signature"
            badge={
              !draft.signatureUrl ? (
                <span className="rounded-full bg-[#CCFBF1] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#0F766E]">
                  Default
                </span>
              ) : undefined
            }
            hint="Authorised signatory · Draw, upload, or Adjust to reposition · max 2 MB"
            adjustLoading={cropLoading === "signature"}
            onAdjust={() => void openAdjust("signature")}
            onUpload={() => signatureInputRef.current?.click()}
            extraActions={
              <button
                type="button"
                onClick={() => setDrawSignatureOpen(true)}
                className={schoolBrandActionBtn}
              >
                <PenLine className="h-3.5 w-3.5" />
                Draw
              </button>
            }
            onRemove={draft.signatureUrl ? () => patch("signatureUrl", undefined) : undefined}
            removeAriaLabel="Reset signature to default"
            preview={
              <img
                src={resolveSignatureDisplaySrc(draft.principalName, draft.signatureUrl)}
                alt="Authorised signature"
                className="h-14 w-[min(100%,11rem)] object-contain object-left px-2"
              />
            }
          />
        </div>

        <input
          ref={logoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onLogo}
        />
        <input
          ref={letterheadInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onLetterhead}
        />
        <input
          ref={sealInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onSeal}
        />
        <input
          ref={signatureInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onSignatureFile}
        />

        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 lg:col-span-4">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              School Name
            </Label>
            <Input
              value={draft.name}
              onChange={(e) => patch("name", e.target.value)}
              placeholder="e.g. Silver Hills Global"
              className="mt-1.5"
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              Tagline
            </Label>
            <Input
              value={draft.tagline}
              onChange={(e) => patch("tagline", e.target.value)}
              placeholder="Short motto or subtitle"
              className="mt-1.5"
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              Website
            </Label>
            <Input
              value={draft.website}
              onChange={(e) => patch("website", e.target.value)}
              placeholder="www.…"
              className="mt-1.5"
            />
          </div>

          <div className="col-span-12">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              Address
            </Label>
            <Textarea
              value={draft.address}
              onChange={(e) => patch("address", e.target.value)}
              placeholder="Campus address"
              className="mt-1.5 min-h-[72px] resize-none"
            />
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              Phone
            </Label>
            <Input
              value={draft.phone}
              onChange={(e) => patch("phone", e.target.value)}
              placeholder="+91 …"
              className="mt-1.5"
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              Email
            </Label>
            <Input
              type="email"
              value={draft.email}
              onChange={(e) => patch("email", e.target.value)}
              placeholder="office@…"
              className="mt-1.5"
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              Registration No.
            </Label>
            <Input
              value={draft.registrationNo}
              onChange={(e) => patch("registrationNo", e.target.value)}
              className="mt-1.5 font-mono text-[12.5px]"
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              Affiliation No.
            </Label>
            <Input
              value={draft.affiliationNo}
              onChange={(e) => patch("affiliationNo", e.target.value)}
              className="mt-1.5 font-mono text-[12.5px]"
            />
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-6">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              Principal
            </Label>
            <Input
              value={draft.principalName}
              onChange={(e) => patch("principalName", e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-6">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              Established
            </Label>
            <Input
              value={draft.establishedYear}
              onChange={(e) => patch("establishedYear", e.target.value)}
              placeholder="e.g. 1998"
              className="mt-1.5"
            />
          </div>
        </div>
        </div>
      </form>

      <ImageCropDialog
        open={Boolean(cropTarget && cropSrc)}
        imageSrc={cropSrc}
        title={
          cropTarget === "letterhead"
            ? "Adjust letterhead"
            : cropTarget === "seal"
              ? "Adjust seal"
              : cropTarget === "signature"
                ? "Adjust signature"
                : "Adjust logo"
        }
        description={
          cropTarget === "logo"
            ? "Drag to reposition, zoom out to fit wide logos, then confirm."
            : cropTarget === "seal"
              ? "Reposition and scale the seal within the square frame."
              : cropTarget === "signature"
                ? "Reposition and scale the signature within the frame."
                : "Drag to reposition, zoom, then confirm."
        }
        aspect={
          cropTarget === "letterhead" ? 16 / 5 : cropTarget === "signature" ? 2.4 : 1
        }
        outputSize={
          cropTarget === "letterhead" ? 1280 : cropTarget === "signature" ? 960 : 512
        }
        outputMime={cropTarget === "letterhead" ? "image/jpeg" : "image/png"}
        fit="contain"
        background={cropTarget === "seal" || cropTarget === "signature" ? "transparent" : "#FFFFFF"}
        confirmLabel="Use image"
        onOpenChange={(next) => {
          if (!next) closeCrop();
        }}
        onConfirm={applyCrop}
        onRetake={() => {
          if (cropTarget === "letterhead") letterheadInputRef.current?.click();
          else if (cropTarget === "seal") sealInputRef.current?.click();
          else if (cropTarget === "signature") signatureInputRef.current?.click();
          else logoInputRef.current?.click();
        }}
      />
      <SignaturePadDialog
        open={drawSignatureOpen}
        onOpenChange={setDrawSignatureOpen}
        onConfirm={(dataUrl) => {
          patch("signatureUrl", dataUrl);
          toast.success("Signature ready — click Save Changes");
        }}
      />
    </OrganicCard>
  );
}

function CategoriesCard({
  academicYears,
  academicYear,
  closedAcademicYears,
  openAcademicYear,
  addAcademicYear,
  renameAcademicYear,
  setAcademicYearClosed,
  canDeleteAcademicYear,
  deleteAcademicYear,
  themeSettings,
  setThemeSettings,
}: {
  academicYears: string[];
  academicYear: string;
  closedAcademicYears: string[];
  openAcademicYear: (year: string) => { receipts: number; enrolled: number };
  addAcademicYear: (year: string) => boolean;
  renameAcademicYear: (from: string, to: string) => { ok: boolean; reason?: string };
  setAcademicYearClosed: (
    year: string,
    closed: boolean,
  ) => { ok: boolean; reason?: string };
  canDeleteAcademicYear: (year: string) => { ok: boolean; reason?: string };
  deleteAcademicYear: (year: string) => boolean;
  themeSettings: ThemeSettings;
  setThemeSettings: React.Dispatch<React.SetStateAction<ThemeSettings>>;
}) {
  const [addMonthKey, setAddMonthKey] = useState(() =>
    suggestNextBooksMonthKey(academicYear, academicYears),
  );
  const [addEndMonthKey, setAddEndMonthKey] = useState(() =>
    defaultClosingMonthKey(suggestNextBooksMonthKey(academicYear, academicYears)),
  );
  const [editMonthKey, setEditMonthKey] = useState("");
  const [editEndMonthKey, setEditEndMonthKey] = useState("");
  const [pendingYearDelete, setPendingYearDelete] = useState<string | null>(null);
  const [editingYear, setEditingYear] = useState<string | null>(null);
  const { payments, studentYearLedgers, feeTerms } = useTenantStore();

  const sortedYears = useMemo(
    () =>
      [...academicYears].sort((a, b) => {
        if (a === academicYear) return -1;
        if (b === academicYear) return 1;
        const aClosed = closedAcademicYears.includes(a);
        const bClosed = closedAcademicYears.includes(b);
        if (aClosed !== bClosed) return aClosed ? 1 : -1;
        return b.localeCompare(a);
      }),
    [academicYears, academicYear, closedAcademicYears],
  );

  const pendingDeleteImpact = useMemo(() => {
    if (!pendingYearDelete) return null;
    const receipts = payments.filter((p) => (p.academicYear ?? "") === pendingYearDelete).length;
    const enrolled = Object.keys(
      studentYearLedgers.find((l) => l.academicYear === pendingYearDelete)?.byStudentId ?? {},
    ).length;
    const periods = feeTerms.filter((t) => (t.academicYear ?? "") === pendingYearDelete).length;
    return { receipts, enrolled, periods };
  }, [pendingYearDelete, payments, studentYearLedgers, feeTerms]);

  const submitAcademicYear = (e: React.FormEvent) => {
    e.preventDefault();
    const nextLabel = resolveFinancialYearInput(addMonthKey, addEndMonthKey);
    if (!nextLabel) {
      toast.error("Choose start and closing months", {
        description: "Closing month must be on or after the start month",
      });
      return;
    }
    const added = addAcademicYear(nextLabel);
    if (!added) {
      toast.error(`${nextLabel} already exists`);
      return;
    }
    toast.success(`Opened books for ${nextLabel}`, {
      description: getApiToken()
        ? "Synced to server · fee periods cloned from the previous year"
        : "Fee periods cloned from the previous year · ready to enroll students",
    });
    const nextKey = suggestNextBooksMonthKey(nextLabel, academicYears);
    setAddMonthKey(nextKey);
    setAddEndMonthKey(defaultClosingMonthKey(nextKey));
  };

  const startEdit = (year: string) => {
    setEditingYear(year);
    const range = booksRangeKeysFromLabel(year);
    const start = range?.start ?? suggestNextBooksMonthKey(year, academicYears);
    setEditMonthKey(start);
    setEditEndMonthKey(range?.end ?? defaultClosingMonthKey(start));
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingYear) return;
    const nextLabel = resolveFinancialYearInput(editMonthKey, editEndMonthKey);
    if (!nextLabel) {
      toast.error("Choose start and closing months", {
        description: "Closing month must be on or after the start month",
      });
      return;
    }
    const result = renameAcademicYear(editingYear, nextLabel);
    if (!result.ok) {
      toast.error(result.reason ?? "Could not rename year");
      return;
    }
    toast.success(`Renamed to ${nextLabel}`);
    setEditingYear(null);
    setEditEndMonthKey("");
  };

  const activateYear = (year: string) => {
    if (year === academicYear) return;
    const stats = openAcademicYear(year);
    toast.success(`Opened books for ${year}`, {
      description: `${stats.receipts} receipt${stats.receipts === 1 ? "" : "s"} · ${stats.enrolled} student${stats.enrolled === 1 ? "" : "s"} enrolled`,
    });
  };

  const toggleClosed = (year: string, closed: boolean) => {
    const result = setAcademicYearClosed(year, closed);
    if (!result.ok) {
      toast.error(result.reason ?? "Could not update year status");
      return;
    }
    toast.success(closed ? `${year} closed` : `${year} reopened`, {
      description: closed
        ? "Closed years stay in history but are not used for new posting"
        : "Year is available to open for books again",
    });
  };

  const requestDelete = (year: string) => {
    const check = canDeleteAcademicYear(year);
    if (!check.ok) {
      toast.error(check.reason ?? "Cannot delete this year");
      return;
    }
    setPendingYearDelete(year);
  };

  const confirmYearDelete = () => {
    if (!pendingYearDelete) return;
    const year = pendingYearDelete;
    const check = canDeleteAcademicYear(year);
    if (!check.ok) {
      toast.error(check.reason ?? "Cannot delete this year");
      setPendingYearDelete(null);
      return;
    }
    if (!deleteAcademicYear(year)) {
      toast.error("Could not delete financial year");
      setPendingYearDelete(null);
      return;
    }
    toast.success(`${year} deleted`);
    setPendingYearDelete(null);
  };

  return (
    <OrganicCard
      tone="white"
      cornerSide="tr"
      padded
      className={cn(workspacePanelClass, "col-span-12")}
    >
      <div className="text-[18px] font-bold leading-tight tracking-tight text-black">
        System Constants
      </div>
      <p className="mt-1 text-[12px] text-black/55 dark:text-zinc-400">
        Financial year books, then how the workspace, invoices, and bills look
      </p>

      <div className="mt-4 grid grid-cols-12 gap-3">
        <div className="col-span-12 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5 lg:col-span-7 dark:border-white/10 dark:bg-zinc-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Financial Year
              </Label>
              <p className="mt-0.5 text-[11px] text-black/45">
                Open books · close finished years · edit start and closing months · hard-delete years and their data
              </p>
            </div>
            <span className="font-mono text-[10.5px] text-black/45">
              {academicYears.length} defined · {closedAcademicYears.length} closed
            </span>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white dark:border-white/10 dark:bg-zinc-950/40">
            <div className="hidden grid-cols-[minmax(0,1.2fr)_7.5rem_minmax(0,1fr)] gap-2 border-b border-[#EFEFEF] bg-[#F8FAFC] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-black/45 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-500 sm:grid">
              <span>Year</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            <ul className="divide-y divide-[#EFEFEF] dark:divide-white/10">
              {sortedYears.map((y) => {
                const isOpen = y === academicYear;
                const isClosed = closedAcademicYears.includes(y);
                const coverage = academicYearCoverageCaption(y);
                return (
                  <li
                    key={y}
                    className="flex flex-col gap-2.5 px-3 py-3 sm:grid sm:grid-cols-[minmax(0,1.2fr)_7.5rem_minmax(0,1fr)] sm:items-center sm:gap-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-black dark:text-zinc-100">
                        {y}
                      </div>
                      {coverage ? (
                        <p className="mt-0.5 truncate text-[10.5px] text-black/45 dark:text-zinc-500">
                          {coverage}
                        </p>
                      ) : null}
                      <p className="mt-0.5 text-[11px] text-black/45 sm:hidden">
                        {isOpen ? "Open books" : isClosed ? "Closed" : "Available"}
                      </p>
                    </div>
                    <div>
                      {isOpen ? (
                        <span className="inline-flex rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-bold text-[#059669]">
                          Open books
                        </span>
                      ) : isClosed ? (
                        <span className="inline-flex rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-zinc-300">
                          Closed
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-[#0F766E]/10 px-2 py-0.5 text-[10px] font-bold text-[#0F766E]">
                          Available
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                      {!isOpen && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-full px-2.5 text-[11px]"
                          onClick={() => activateYear(y)}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Open
                        </Button>
                      )}
                      {isClosed ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-full px-2.5 text-[11px]"
                          onClick={() => toggleClosed(y, false)}
                        >
                          <ArchiveRestore className="mr-1 h-3.5 w-3.5" />
                          Reopen
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-full px-2.5 text-[11px]"
                          disabled={academicYears.length <= 1}
                          onClick={() => toggleClosed(y, true)}
                        >
                          <Archive className="mr-1 h-3.5 w-3.5" />
                          Close
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full px-2.5 text-[11px]"
                        onClick={() => startEdit(y)}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full px-2.5 text-[11px] text-[#EF4444] hover:bg-[#FEE2E2] hover:text-[#DC2626]"
                        disabled={academicYears.length <= 1}
                        onClick={() => requestDelete(y)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <form onSubmit={submitAcademicYear} className="mt-3 space-y-3">
            <FinancialYearFields
              startMonthKey={addMonthKey}
              endMonthKey={addEndMonthKey}
              onStartMonthKeyChange={setAddMonthKey}
              onEndMonthKeyChange={setAddEndMonthKey}
            />
            <Button
              type="submit"
              className="w-full rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488] sm:w-auto"
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add year
            </Button>
          </form>
        </div>

        <div className="col-span-12 space-y-4 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5 lg:col-span-5 dark:border-white/10 dark:bg-zinc-900/40">
          <ThemeSection title="Colors">
            <ThemeColorField
              label="Primary"
              value={themeSettings.primaryColor}
              onChange={(primaryColor) => {
                setThemeSettings((prev) => ({
                  ...prev,
                  primaryColor,
                  iconColor: prev.iconColor === prev.primaryColor ? primaryColor : prev.iconColor,
                  menuColor: prev.menuColor === prev.primaryColor ? primaryColor : prev.menuColor,
                }));
              }}
            />
            <ThemeColorField
              label="Secondary"
              value={themeSettings.secondaryColor}
              onChange={(secondaryColor) => {
                setThemeSettings((prev) => ({ ...prev, secondaryColor }));
              }}
            />
            <div>
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-black/45">
                Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {BRAND_PRESETS.map((preset) => {
                  const active =
                    themeSettings.primaryColor === preset.primary &&
                    themeSettings.secondaryColor === preset.secondary;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      title={preset.name}
                      onClick={() => {
                        setThemeSettings((prev) => ({
                          ...prev,
                          primaryColor: preset.primary,
                          secondaryColor: preset.secondary,
                          iconColor: preset.primary,
                          menuColor: preset.primary,
                        }));
                        toast.success(`${preset.name} palette applied`);
                      }}
                      className={cn(
                        "h-7 w-7 rounded-full border-2 shadow-sm transition-transform hover:scale-105",
                        active ? "border-black dark:border-white" : "border-white dark:border-zinc-700",
                      )}
                      style={{
                        background: `linear-gradient(135deg, ${preset.primary} 50%, ${preset.secondary} 50%)`,
                      }}
                      aria-label={`${preset.name} brand preset`}
                    />
                  );
                })}
              </div>
            </div>
          </ThemeSection>

          <ThemeSection title="Text">
            <ThemeSelect
              label="Font"
              value={themeSettings.fontFamily || "Inter"}
              options={FONT_FAMILY_OPTIONS}
              onChange={(fontFamily) => {
                setThemeSettings((prev) => ({ ...prev, fontFamily }));
              }}
            />
            <ThemeColorField
              label="Color"
              value={themeSettings.fontColor}
              onChange={(fontColor) => {
                setThemeSettings((prev) => ({ ...prev, fontColor }));
              }}
            />
            <ThemeSelect
              label="Size"
              value={themeSettings.fontSize || "Medium"}
              options={FONT_SIZE_OPTIONS}
              onChange={(fontSize) => {
                setThemeSettings((prev) => ({ ...prev, fontSize }));
              }}
            />
          </ThemeSection>

          <ThemeSection title="Controls">
            <ThemeColorField
              label="Icons"
              value={themeSettings.iconColor}
              onChange={(iconColor) => {
                setThemeSettings((prev) => ({ ...prev, iconColor }));
              }}
            />
            <ThemeColorField
              label="Dropdowns"
              value={themeSettings.menuColor}
              onChange={(menuColor) => {
                setThemeSettings((prev) => ({ ...prev, menuColor }));
              }}
            />
          </ThemeSection>

          <ThemeSection title="Layout">
            <ThemeSelect
              label="Navigation"
              value={themeSettings.navPlacement ?? "Left"}
              options={THEME_NAV_PLACEMENT_OPTIONS}
              onChange={(navPlacement) => {
                setThemeSettings((prev) => ({ ...prev, navPlacement }));
                notifyNavPlacementChange(navPlacement);
                window.setTimeout(() => {
                  toast.success(`Navigation dock moved to ${navPlacement}`);
                }, 0);
              }}
            />
          </ThemeSection>
        </div>

        <div className="col-span-12 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5 dark:border-white/10 dark:bg-zinc-900/40">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-black/35 dark:text-zinc-500">
            Downloads
          </div>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-black/45 dark:text-zinc-500">
            File names for each download. Tokens: {DOWNLOAD_TOKENS.join(" ")}. Extension is added automatically.
          </p>
          <div className="mt-3 grid grid-cols-12 gap-3">
            {DOWNLOAD_KINDS.map((kind) => (
              <div key={kind} className="col-span-12 min-w-0 sm:col-span-6 lg:col-span-4 xl:col-span-3">
                <ThemePatternField
                  label={DOWNLOAD_KIND_LABELS[kind]}
                  kind={kind}
                  value={themeSettings.fileNames?.[kind] ?? DEFAULT_FILE_NAMES[kind]}
                  onChange={(next) => {
                    setThemeSettings((prev) => ({
                      ...prev,
                      fileNames: {
                        ...DEFAULT_FILE_NAMES,
                        ...prev.fileNames,
                        [kind]: next,
                      },
                    }));
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog
        open={Boolean(editingYear)}
        onOpenChange={(next) => {
          if (!next) {
            setEditingYear(null);
            setEditEndMonthKey("");
          }
        }}
      >
        <DialogContent
          className="max-w-md rounded-xl border border-[#E5E5E5] bg-white p-6"
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest("[data-radix-popper-content-wrapper]")) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest("[data-radix-popper-content-wrapper]")) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold text-black">
              Edit financial year
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] text-black/60">
              Set the start and closing month for {editingYear}. Receipts, fees, and enrollments move with the new label.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEdit} className="mt-4 space-y-3">
            <FinancialYearFields
              startMonthKey={editMonthKey}
              endMonthKey={editEndMonthKey}
              onStartMonthKeyChange={setEditMonthKey}
              onEndMonthKeyChange={setEditEndMonthKey}
            />
            <DialogFooter className="flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingYear(null);
                  setEditEndMonthKey("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(pendingYearDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingYearDelete(null);
        }}
        title="Hard delete financial year"
        description={
          pendingYearDelete
            ? [
                `Permanently remove "${pendingYearDelete}" and all of its year books data.`,
                pendingDeleteImpact
                  ? `This will delete ${pendingDeleteImpact.receipts} receipt${pendingDeleteImpact.receipts === 1 ? "" : "s"}, ${pendingDeleteImpact.enrolled} enrollment${pendingDeleteImpact.enrolled === 1 ? "" : "s"}, and ${pendingDeleteImpact.periods} fee period${pendingDeleteImpact.periods === 1 ? "" : "s"}.`
                  : null,
                pendingYearDelete === academicYear
                  ? "The next available year will become open books."
                  : null,
                "This cannot be undone.",
              ]
                .filter(Boolean)
                .join(" ")
            : "Hard delete this financial year?"
        }
        onConfirm={confirmYearDelete}
      />
    </OrganicCard>
  );
}

function ThemeSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-black/35 dark:text-zinc-500">
        {title}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function ThemePatternField({
  label,
  kind,
  value,
  onChange,
}: {
  label: string;
  kind: DownloadKind;
  value: string;
  onChange: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = (raw: string) => {
    const next = raw.trim() || DEFAULT_FILE_NAMES[kind];
    setDraft(next);
    if (next !== value) onChange(next);
  };

  const ext =
    kind === "students" || kind === "staff" || kind === "transactions" || kind === "madePayments"
      ? "csv"
      : "pdf";
  const example = previewDownloadFilename(kind, draft || DEFAULT_FILE_NAMES[kind], ext);

  return (
    <label className="space-y-1.5">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-black/45">
        {label}
      </span>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          commit(draft);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(draft);
          }
        }}
        spellCheck={false}
        className="h-9 rounded-lg border-[#E5E5E5] bg-white px-2.5 font-mono text-[12px] font-medium dark:border-white/10 dark:bg-zinc-900"
      />
      {focused ? (
        <span className="block font-mono text-[10px] text-black/40 dark:text-zinc-500">
          {example}
        </span>
      ) : null}
    </label>
  );
}

function ThemeColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = (raw: string) => {
    const next = normalizeHexColor(raw, value);
    setDraft(next);
    if (next !== value) onChange(next);
  };

  return (
    <label className="space-y-1.5">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-black/45">
        {label}
      </span>
      <div className="flex h-9 items-center gap-2 rounded-lg border border-[#E5E5E5] bg-white px-2 focus-within:ring-2 focus-within:ring-[#0F766E] dark:border-white/10 dark:bg-zinc-900">
        <input
          type="color"
          value={normalizeHexColor(value)}
          onChange={(e) => commit(e.target.value)}
          className="h-6 w-6 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
          aria-label={label}
        />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(draft);
            }
          }}
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent font-mono text-[12px] font-medium uppercase tracking-wide text-black outline-none dark:text-zinc-100"
        />
      </div>
    </label>
  );
}

function ThemeSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="space-y-1.5">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-black/45">
        {label}
      </span>
      <FieldSelect
        value={value}
        onValueChange={(next) => onChange(next as T)}
        options={options.map((option) => ({ value: option, label: option }))}
        triggerClassName="h-9 px-2.5 text-[12px] font-medium"
      />
    </label>
  );
}

function FieldSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  disabled,
  className,
  triggerClassName,
  contentClassName,
  searchable = false,
  searchPlaceholder = "Search…",
  onAddNew,
  addNewLabel = "Add new",
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onAddNew?: () => void;
  addNewLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const uniqueOptions = useMemo(() => {
    const seen = new Set<string>();
    return options.filter((opt) => {
      if (!opt.value || opt.value === FIELD_SELECT_ADD_NEW || seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  }, [options]);
  const resolvedValue = uniqueOptions.some((o) => o.value === value) ? value : undefined;
  const selectedLabel = uniqueOptions.find((o) => o.value === resolvedValue)?.label;
  const triggerOverflowClass =
    "min-w-0 gap-2 overflow-hidden [&>span:first-child]:min-w-0 [&>span:first-child]:flex-1 [&>span:first-child]:truncate";

  const handleValueChange = (next: string) => {
    if (next === FIELD_SELECT_ADD_NEW) {
      setOpen(false);
      onAddNew?.();
      return;
    }
    onValueChange(next);
    setOpen(false);
  };

  const handleAddNew = () => {
    setOpen(false);
    onAddNew?.();
  };

  const addNewRow = onAddNew ? (
    <button
      type="button"
      onPointerDown={(event) => event.preventDefault()}
      onClick={handleAddNew}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-[13px] font-semibold text-[#0F766E] transition-colors hover:bg-[#F0FDFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/30 dark:text-[#2DD4BF] dark:hover:bg-teal-950/40"
    >
      <Plus className="h-3.5 w-3.5 shrink-0" />
      {addNewLabel}
    </button>
  ) : null;

  if (!searchable) {
    return (
      <div className={cn("min-w-0", className)}>
        <Select
          open={open}
          onOpenChange={setOpen}
          value={resolvedValue}
          onValueChange={handleValueChange}
          disabled={disabled}
        >
          <SelectTrigger
            className={cn(
              "h-10 w-full rounded-lg border border-[#E5E5E5] bg-white px-3 text-[13px] font-normal text-black shadow-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-0 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100",
              triggerOverflowClass,
              triggerClassName,
            )}
          >
            <SelectValue placeholder={placeholder}>
              {selectedLabel ? <span className="block truncate">{selectedLabel}</span> : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            position="popper"
            sideOffset={4}
            className={cn(
              "z-[100] max-h-72 overflow-y-auto rounded-lg border border-[#E5E5E5] bg-white p-1.5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)] dark:border-white/10 dark:bg-zinc-900",
              "w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] max-w-[min(calc(100vw-1.5rem),24rem)]",
              contentClassName,
            )}
          >
            {addNewRow ? (
              <div className="mb-1 border-b border-[#E5E5E5] pb-1 dark:border-white/10">{addNewRow}</div>
            ) : null}
            {uniqueOptions.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="cursor-pointer rounded-md py-2 pl-3 pr-8 text-[13px] text-black focus:bg-[#CCFBF1] focus:text-[#0F172A] data-[highlighted]:bg-[#CCFBF1] data-[highlighted]:text-[#0F172A] data-[state=checked]:bg-[#0F766E] data-[state=checked]:font-semibold data-[state=checked]:text-white dark:text-zinc-100 dark:focus:bg-[#0F766E]/40 dark:focus:text-white dark:data-[highlighted]:bg-[#0F766E]/40 dark:data-[highlighted]:text-white"
              >
                <span className="block max-w-full whitespace-normal break-words">{opt.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className={cn("min-w-0", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-10 w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-lg border border-[#E5E5E5] bg-white px-3 text-left text-[13px] font-normal text-black shadow-none transition-colors hover:bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
              triggerClassName,
            )}
          >
            <span className={cn("min-w-0 flex-1 truncate", !selectedLabel && "text-black/45 dark:text-zinc-500")}>
              {selectedLabel ?? placeholder}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className={cn(
            "z-[100] w-[var(--radix-popover-trigger-width)] max-w-[min(calc(100vw-1.5rem),24rem)] rounded-lg border border-[#E5E5E5] bg-white p-0 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)] dark:border-white/10 dark:bg-zinc-900",
            contentClassName,
          )}
        >
          <Command className="rounded-lg bg-white dark:bg-zinc-900 dark:text-zinc-100">
            {addNewRow ? (
              <div className="border-b border-[#E5E5E5] p-1.5 dark:border-white/10">{addNewRow}</div>
            ) : null}
            <CommandInput placeholder={searchPlaceholder} className="h-10 text-[13px] dark:text-zinc-100" />
            <CommandList className="max-h-56">
              <CommandEmpty className="py-4 text-center text-[12px] text-slate-500 dark:text-zinc-400">
                No matches found
              </CommandEmpty>
              <CommandGroup className="p-1.5">
                {uniqueOptions.map((opt) => {
                  const active = opt.value === resolvedValue;
                  return (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      onSelect={() => {
                        handleValueChange(opt.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "cursor-pointer rounded-md px-3 py-2 text-[13px]",
                        active
                          ? "bg-[#0F766E] font-semibold text-white data-[selected=true]:bg-[#0F766E] data-[selected=true]:text-white"
                          : "text-black data-[selected=true]:bg-[#CCFBF1] data-[selected=true]:text-[#0F172A] dark:text-zinc-100 dark:data-[selected=true]:bg-[#0F766E]/40 dark:data-[selected=true]:text-white",
                      )}
                    >
                      <span className="min-w-0 flex-1 whitespace-normal break-words">{opt.label}</span>
                      {active && <Check className="h-4 w-4 shrink-0" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
