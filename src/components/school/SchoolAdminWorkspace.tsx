import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useNavigate, useSearch, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  Plus,
  AlertTriangle,
  Bell,
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
  Search,
  Bus,
  Calendar,
  Clock,
  Wallet,
  ListTodo,
  StickyNote,
  Settings,
  ChevronLeft,
  ImagePlus,
  FileImage,
  Paperclip,
  FileText,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { OrganicCard } from "@/components/ui/organic-card";
import {
  normalizeAcademicYearLabel,
  DEFAULT_STAFF_DOCUMENTS,
  THEME_ACCENT_OPTIONS,
  THEME_DENSITY_OPTIONS,
  THEME_MODE_OPTIONS,
  THEME_NAV_PLACEMENT_OPTIONS,
  useTenantStore,
  createStudentShareToken,
  upsertStudentInSnapshot,
  schoolInitials,
  type ClassConfig,
  type Department,
  type Payment,
  type PaymentCategory,
  type Role,
  type SchoolDetails,
  type Staff,
  type Student,
  type ThemeSettings,
  type TransportRoute,
  type TransportVehicle,
  type TenantNotification,
} from "@/lib/tenant-store";
import { StudentProfileDetail } from "@/components/school/StudentProfileDetail";
import { ShareParentLinkDialog } from "@/components/school/ShareParentLinkDialog";
import { StaffProfileDetail } from "@/components/school/StaffProfileDetail";
import { EnrollmentStatusBadge, isRecordActive } from "@/components/school/ProfileAccountActions";
import { FinanceBarCard, FinanceDonutCard } from "@/components/school/finance-charts";
import {
  BalanceSheetReport,
  DayBookReport,
  FeesReport,
  GeneralLedgerReport,
  ProfitLossReport,
  SalaryReport,
} from "@/components/school/FinanceReports";
import { downloadCsv, downloadReceiptPdf, downloadTablePdf } from "@/lib/finance-export";
import {
  ACCOUNTS_PAYABLE,
  OPERATING_EXPENSES,
  bankBalance,
  cashOnHand,
  formatInr,
  operatingExpenseForPeriod,
  salaryPayable,
} from "@/lib/dashboard-finance";
import {
  buildIncomeExpenseSeries,
  filterPaymentsByPeriod,
  PAYMENT_PERIOD_OPTIONS,
  type CustomDateRange,
  type PaymentPeriod,
} from "@/lib/payment-period";
import { useAuth } from "@/lib/auth";
import { cn, glassCardClass, glassInsetClass, glassPanelClass, glassTableWrapClass, premiumCardClass, type CornerSide, type Tone } from "@/lib/utils";

const MADE_PAYMENTS = [
  {
    id: "DISB-2401",
    payee: "Faculty Payroll · April",
    desc: "34 staff · net payable",
    amount: 598_400,
    mode: "Bank Transfer · NEFT",
    payeeType: "Salary" as const,
    time: "Yesterday",
    status: "Cleared" as const,
  },
  {
    id: "DISB-2402",
    payee: "BrightBus Logistics",
    desc: "Bus diesel + maintenance",
    amount: 46_800,
    mode: "UPI Business",
    payeeType: "Vendor" as const,
    time: "Mon · 11:20",
    status: "Cleared" as const,
  },
  {
    id: "DISB-2403",
    payee: "Adani Electricity",
    desc: "Campus utility bill · Apr",
    amount: 17_920,
    mode: "Bank Transfer · NEFT",
    payeeType: "Vendor" as const,
    time: "28 Apr · 16:45",
    status: "Cleared" as const,
  },
  {
    id: "DISB-2404",
    payee: "Office Stationery Co.",
    desc: "Term-end print supplies",
    amount: 5_950,
    mode: "Cheque",
    payeeType: "Vendor" as const,
    time: "24 Apr · 10:12",
    status: "Cleared" as const,
  },
];

const PENDING_OBLIGATIONS = [
  {
    id: "OBL-001",
    payee: "BrightBus Logistics",
    desc: "Bus diesel + maintenance",
    amount: 48200,
    due: "Jun 02",
    payeeType: "Vendor" as const,
  },
  {
    id: "OBL-002",
    payee: "Faculty Payroll · May",
    desc: "35 staff · net payable",
    amount: 612000,
    due: "May 31",
    payeeType: "Salary" as const,
  },
  {
    id: "OBL-003",
    payee: "Adani Electricity",
    desc: "Campus utility bill",
    amount: 18450,
    due: "Jun 05",
    payeeType: "Vendor" as const,
  },
  {
    id: "OBL-004",
    payee: "Office Stationery Co.",
    desc: "Exam print supplies",
    amount: 6800,
    due: "Jun 08",
    payeeType: "Vendor" as const,
  },
];

type PendingObligation = (typeof PENDING_OBLIGATIONS)[number];
type PaymentAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
};
type MadePayment = Omit<(typeof MADE_PAYMENTS)[number], "status"> & {
  status: "Queued" | "Cleared";
  attachments?: PaymentAttachment[];
};

const MAX_DISBURSAL_ATTACHMENTS = 8;
const MAX_DISBURSAL_ATTACHMENT_BYTES = 5 * 1024 * 1024;

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

const LEDGER_INCOME_SEGMENTS = [
  { label: "Tuition", value: 1_840_000 },
  { label: "Transport", value: 320_000 },
  { label: "Donations", value: 95_000 },
  { label: "Other", value: 42_000 },
];

const LEDGER_OUTFLOW_SEGMENTS = [
  { label: "Salaries", value: 1_220_000 },
  { label: "Vehicle Upkeep", value: 184_000 },
  { label: "Utilities", value: 88_000 },
  { label: "Rent", value: 240_000 },
];

const EXPENSE_CHART_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#64748B"];

function formatDisbursalTime() {
  const now = new Date();
  return `Today · ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
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
        <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E5E5] bg-white">
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

function MobileDashboardSectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-[18px] font-bold leading-tight tracking-tight text-slate-900",
        className,
      )}
    >
      {children}
    </h2>
  );
}

const MobileSectionTitle = MobileDashboardSectionTitle;

const mobileOutlineBtn =
  "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-4 text-[12.5px] font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-50";

const mobilePrimaryBtn =
  "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-[12.5px] font-semibold text-white shadow-md shadow-blue-200/40 transition-all duration-200 hover:opacity-95";

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
    <div className="flex min-w-0 flex-col items-center px-1 py-3 text-center">
      <Icon className={cn("h-4 w-4 shrink-0", iconClass)} strokeWidth={2.25} />
      <div className="mt-1.5 text-[10px] font-medium leading-tight text-slate-500">{label}</div>
      <div
        className={cn(
          "mt-0.5 font-mono text-[20px] font-bold leading-none tracking-tight",
          valueClass,
        )}
      >
        {value}
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
    <section className="w-full space-y-3 md:hidden">
      <MobileSectionTitle>Overview</MobileSectionTitle>
      <div className={cn(premiumCardClass, "grid grid-cols-3 divide-x divide-slate-100 p-0")}>
        {items.map((item) => (
          <MobileCompactStat key={item.label} {...item} />
        ))}
      </div>
    </section>
  );
}

const workspacePanelClass = cn(glassCardClass, "rounded-2xl");

function MobileInsightSplit({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sublabel,
}: {
  icon: typeof GraduationCap;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center px-2 py-3 text-center">
      <div
        className={cn(
          "grid h-14 w-14 shrink-0 place-items-center rounded-full",
          iconBg,
        )}
      >
        <Icon className={cn("h-7 w-7", iconColor)} strokeWidth={2} />
      </div>
      <div className="mt-3 w-full text-[12px] font-medium leading-snug text-slate-500">{label}</div>
      <div className="mt-1 w-full text-[15px] font-bold leading-tight text-slate-900">
        {value} {sublabel}
      </div>
    </div>
  );
}

const dashboardCountClass =
  "min-w-0 max-w-full whitespace-normal break-words font-mono font-bold leading-none tracking-tight tabular-nums text-[clamp(1.5rem,3.6vw,2.5rem)]";

const dashboardAmountClass =
  "min-w-0 max-w-full whitespace-normal break-words font-mono font-bold leading-[1.1] tracking-tight tabular-nums text-[clamp(1.05rem,2.4vw,1.75rem)]";

const dashboardAmountCompactClass =
  "min-w-0 max-w-full whitespace-normal break-words font-mono font-bold leading-[1.1] tracking-tight tabular-nums text-[clamp(0.95rem,2.1vw,1.45rem)]";

function MobileFinancialDetailTile({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string;
  icon: typeof HandCoins;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="relative flex min-h-[104px] min-w-0 flex-col justify-end rounded-lg border border-slate-100/70 bg-white p-3.5 shadow-sm shadow-slate-200/35">
      <div
        className={cn(
          "absolute right-3 top-3 grid h-8 w-8 shrink-0 place-items-center rounded-full",
          iconBg,
        )}
      >
        <Icon className={cn("h-4 w-4", iconColor)} strokeWidth={2.25} />
      </div>
      <div className="min-w-0 pr-10">
        <div className="text-[12px] font-medium leading-snug text-slate-500">{title}</div>
        <div className={cn(dashboardAmountCompactClass, "mt-1 text-slate-900")}>
          {value}
        </div>
      </div>
    </div>
  );
}

type MobileDashboardMetrics = {
  studentCount: number;
  staffCount: number;
  periodIncome: number;
  expenseTotal: number;
  totalDue: number;
  salaryOutstanding: number;
  inHand: number;
  inBank: number;
  totalBalance: number;
  unreadNotifications: number;
  onReceivePayment: () => void;
  onMakePayment: () => void;
};

function MobilePremiumDashboard({
  studentCount,
  staffCount,
  periodIncome,
  expenseTotal,
  totalDue,
  salaryOutstanding,
  inHand,
  inBank,
  totalBalance,
  unreadNotifications,
  onReceivePayment,
  onMakePayment,
}: MobileDashboardMetrics) {
  return (
    <div className="w-full space-y-6 md:hidden">
      <section className="w-full space-y-3">
        <MobileDashboardSectionTitle>Key Insights</MobileDashboardSectionTitle>
        <div className={cn(premiumCardClass, "w-full overflow-hidden p-0")}>
          <div className="grid w-full grid-cols-2 divide-x divide-slate-100">
            <MobileInsightSplit
              icon={GraduationCap}
              iconBg="bg-[#DBEAFE]"
              iconColor="text-[#2563EB]"
              label="Total Students"
              value={studentCount.toLocaleString("en-IN")}
              sublabel="Students"
            />
            <MobileInsightSplit
              icon={Briefcase}
              iconBg="bg-slate-100"
              iconColor="text-slate-700"
              label="Total Staff"
              value={staffCount.toLocaleString("en-IN")}
              sublabel="Staff"
            />
          </div>
        </div>
      </section>

      <section className="w-full space-y-3">
        <MobileDashboardSectionTitle>Financial Overview</MobileDashboardSectionTitle>
        <div className="grid w-full grid-cols-2 gap-3">
          <div className="flex min-h-[112px] min-w-0 flex-col justify-between rounded-lg bg-[#D1F2E1] p-4">
            <div className="text-[12px] font-medium text-slate-800">Total Income</div>
            <div className={cn(dashboardAmountClass, "mt-3 text-slate-900")}>
              {formatInr(periodIncome)}
            </div>
          </div>
          <div className="relative flex min-h-[112px] min-w-0 flex-col justify-between overflow-hidden rounded-lg bg-[#3B5998] p-4 text-white">
            <TriangleAlert
              className="absolute right-3 top-3 h-4 w-4 text-amber-300"
              strokeWidth={2.25}
              aria-hidden
            />
            <div className="pr-6 text-[12px] font-medium text-white/90">Total Expense</div>
            <div className={cn(dashboardAmountClass, "mt-3 text-white")}>
              {formatInr(expenseTotal)}
            </div>
          </div>
        </div>
      </section>

      <section className={cn(premiumCardClass, "w-full space-y-3 p-4")}>
        <DashboardPanelHeading icon={HandCoins} title="Outstanding Payments" />
        <div className="grid w-full grid-cols-2 gap-3">
          <MobileFinancialDetailTile
            title="Fees Outstanding"
            value={formatInr(totalDue)}
            icon={HandCoins}
            iconBg="bg-[#DBEAFE]"
            iconColor="text-[#2563EB]"
          />
          <MobileFinancialDetailTile
            title="Salary Outstanding"
            value={formatInr(salaryOutstanding)}
            icon={Banknote}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
        </div>
      </section>

      <section className={cn(premiumCardClass, "w-full space-y-3 p-4")}>
        <DashboardPanelHeading icon={Landmark} title="Cash Position" />
        <div className="grid w-full grid-cols-2 gap-3">
          <MobileFinancialDetailTile
            title="Cash In Hand"
            value={formatInr(inHand)}
            icon={Banknote}
            iconBg="bg-emerald-50"
            iconColor="text-[#10B981]"
          />
          <MobileFinancialDetailTile
            title="Bank Balance"
            value={formatInr(inBank)}
            icon={Landmark}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
          <div className="col-span-2">
            <MobileFinancialDetailTile
              title="Total Balance"
              value={formatInr(totalBalance)}
              icon={Wallet}
              iconBg="bg-[#DBEAFE]"
              iconColor="text-[#2563EB]"
            />
          </div>
        </div>
      </section>

      {unreadNotifications > 0 && (
        <Link
          to="/tenant/notifications"
          className={cn(
            premiumCardClass,
            "flex w-full items-center gap-3 p-4 transition-colors hover:border-slate-200",
          )}
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#DBEAFE]">
            <Bell className="h-4 w-4 text-[#2563EB]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-slate-900">
              {unreadNotifications} unread alert{unreadNotifications === 1 ? "" : "s"}
            </div>
            <p className="mt-0.5 text-[12px] text-slate-500">Fee reminders & staff updates</p>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onReceivePayment}
          className={cn(
            premiumCardClass,
            "flex min-h-[88px] items-center gap-3 p-4 text-left transition-colors hover:border-slate-200",
          )}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#D1F2E1]">
            <ArrowDownToLine className="h-5 w-5 text-[#10B981]" />
          </span>
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-slate-900">Receive payment</div>
            <p className="mt-0.5 text-[12px] text-slate-500">Capture inbound fee receipts</p>
          </div>
        </button>
        <button
          type="button"
          onClick={onMakePayment}
          className={cn(
            premiumCardClass,
            "flex min-h-[88px] items-center gap-3 p-4 text-left transition-colors hover:border-slate-200",
          )}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#DBEAFE]">
            <ArrowUpFromLine className="h-5 w-5 text-[#2563EB]" />
          </span>
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-slate-900">Make payment</div>
            <p className="mt-0.5 text-[12px] text-slate-500">Pay vendors and salaries</p>
          </div>
        </button>
      </div>
    </div>
  );
}

type GlassDesktopDashboardProps = {
  students: Student[];
  staff: Staff[];
  periodIncome: number;
  expenseTotal: number;
  periodPayments: Payment[];
  totalDue: number;
  salaryOutstanding: number;
  inHand: number;
  inBank: number;
  totalBalance: number;
  overdueStudents: Student[];
  recentReceipts: Payment[];
  unreadNotifications: number;
  dashboardTodos: string[];
  setDashboardTodos: React.Dispatch<React.SetStateAction<string[]>>;
  dashboardNote: string;
  setDashboardNote: (v: string) => void;
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

function GlassDesktopDashboard({
  students,
  staff,
  periodIncome,
  expenseTotal,
  periodPayments,
  totalDue,
  salaryOutstanding,
  inHand,
  inBank,
  totalBalance,
  overdueStudents,
  recentReceipts,
  unreadNotifications,
  dashboardTodos,
  setDashboardTodos,
  dashboardNote,
  setDashboardNote,
  period,
  setPeriod,
  customRange,
  setCustomRange,
  onReceivePayment,
  onMakePayment,
  onViewStudents,
  onAdmitStudent,
  onViewStaff,
}: GlassDesktopDashboardProps) {
  const { session } = useAuth();
  const { schoolDetails } = useTenantStore();
  const paidCount = students.filter((s) => s.due === 0).length;
  const activeStaff = staff.filter((s) => s.active).length;
  const tenantName = schoolDetails.name || session?.tenantName || "Silver Hills Global";
  const displayName = session?.displayName ?? "Tenant Admin";

  const [moreTodosOpen, setMoreTodosOpen] = useState(false);

  const updateTodo = (index: number, value: string) => {
    setDashboardTodos((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const addTodo = () => {
    if (dashboardTodos.length >= 20) {
      toast.error("Maximum 20 tasks reached");
      return;
    }
    if (dashboardTodos.length >= 4) setMoreTodosOpen(true);
    setDashboardTodos((current) => [...current, ""]);
  };

  const removeTodo = (index: number) => {
    setDashboardTodos((current) => {
      if (current.length <= 1) {
        return [""];
      }
      return current.filter((_, i) => i !== index);
    });
  };

  const visibleTodos = dashboardTodos.slice(0, 4);
  const overflowTodos = dashboardTodos.slice(4);

  const admissionWeeks = useMemo(() => {
    const base = Math.max(1, Math.round(students.length / 5));
    return [
      { label: "W1", value: Math.max(1, base - 1) },
      { label: "W2", value: base },
      { label: "W3", value: base + 1 },
      { label: "W4", value: Math.max(1, base - 1) },
      { label: "W5", value: base + 2 },
    ];
  }, [students.length]);

  const incomeExpenseWeeks = useMemo(
    () => buildIncomeExpenseSeries(periodPayments, expenseTotal, period, customRange),
    [periodPayments, expenseTotal, period, customRange],
  );

  const newAdmissions = admissionWeeks.reduce((sum, week) => sum + week.value, 0);

  const nowLabel = useMemo(() => {
    const now = new Date();
    return {
      date: now.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      time: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  }, []);

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
    <div className="hidden space-y-5 md:block">
      <div className="grid grid-cols-12 gap-5">
        {/* Row 1–2 left/center + right stack */}
        <div className="col-span-12 grid grid-cols-1 gap-5 xl:col-span-8 xl:grid-cols-2">
          <section className={cn(glassCardClass, "flex flex-col p-5")}>
            <DashboardPanelHeading icon={Users} title="School Overview" />
            <div className="mt-4 grid flex-1 grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onViewStudents}
                className={cn(
                  glassInsetClass,
                  "flex min-h-[128px] flex-col p-4 text-center transition-colors hover:bg-white/55",
                )}
              >
                <div className="flex items-start justify-between gap-2 text-left">
                  <span className="text-[12px] font-medium text-slate-600">Total Students</span>
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#DBEAFE]">
                    <GraduationCap className="h-4 w-4 text-[#2563EB]" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center">
                  <div className={cn(dashboardCountClass, "text-slate-900")}>
                    {students.length}
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-[#10B981]">
                    {paidCount} paid · {students.length - paidCount} overdue
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={onViewStaff}
                className={cn(
                  glassInsetClass,
                  "flex min-h-[128px] flex-col p-4 text-center transition-colors hover:bg-white/55",
                )}
              >
                <div className="flex items-start justify-between gap-2 text-left">
                  <span className="text-[12px] font-medium text-slate-600">Total Staff</span>
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-50">
                    <Briefcase className="h-4 w-4 text-orange-500" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center">
                  <div className={cn(dashboardCountClass, "text-slate-900")}>
                    {staff.length}
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-slate-500">
                    {activeStaff} active · {staff.length - activeStaff} inactive
                  </div>
                </div>
              </button>
            </div>
            <button
              type="button"
              onClick={onAdmitStudent}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] px-3 py-2.5 text-[12px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Admit a Student
            </button>
          </section>

          <section className={cn(glassCardClass, "flex flex-col p-5")}>
            <div className="flex items-start justify-between gap-3">
              <DashboardPanelHeading icon={Wallet} title="Financial Summary" />
              <div className="w-[148px] shrink-0">
                <DashboardPeriodFilter
                  period={period}
                  onPeriodChange={setPeriod}
                  customRange={customRange}
                  onCustomRangeChange={setCustomRange}
                />
              </div>
            </div>
            <div className="mt-4 grid flex-1 grid-cols-2 gap-3">
              <div
                className={cn(
                  glassInsetClass,
                  "flex min-h-[112px] flex-col items-center justify-center px-3 py-4 text-center",
                )}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Total Income
                </div>
                <div className="mt-2 text-[18px] font-semibold tracking-tight text-emerald-700 tabular-nums sm:text-[20px]">
                  {formatInr(periodIncome)}
                </div>
              </div>
              <div
                className={cn(
                  glassInsetClass,
                  "flex min-h-[112px] flex-col items-center justify-center px-3 py-4 text-center",
                )}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Total Expense
                </div>
                <div className="mt-2 text-[18px] font-semibold tracking-tight text-rose-700 tabular-nums sm:text-[20px]">
                  {formatInr(expenseTotal)}
                </div>
              </div>
            </div>
          </section>

          <section className={cn(glassCardClass, "flex flex-col p-5")}>
            <DashboardPanelHeading icon={HandCoins} title="Outstanding Payments" />
            <div className="mt-4 grid flex-1 grid-cols-1 gap-3">
              <div className={cn(glassInsetClass, "flex min-h-[100px] flex-col justify-between p-4")}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[12px] font-medium text-slate-600">Fee Outstanding</span>
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#DBEAFE]">
                    <HandCoins className="h-4 w-4 text-[#2563EB]" />
                  </span>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500">
                    {overdueStudents.length} students
                  </div>
                  <div className={cn(dashboardAmountClass, "mt-1 whitespace-nowrap text-slate-900")}>
                    {formatInr(totalDue)}
                  </div>
                </div>
              </div>
              <div className={cn(glassInsetClass, "flex min-h-[100px] flex-col justify-between p-4")}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[12px] font-medium text-slate-600">Salary Outstanding</span>
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50">
                    <Banknote className="h-4 w-4 text-amber-600" />
                  </span>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500">{activeStaff} staff</div>
                  <div className={cn(dashboardAmountClass, "mt-1 whitespace-nowrap text-slate-900")}>
                    {formatInr(salaryOutstanding)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={cn(glassCardClass, "flex flex-col p-5")}>
            <DashboardPanelHeading icon={Landmark} title="Cash Position" />
            <div className="mt-4 grid flex-1 grid-cols-2 gap-3">
              <div className={cn(glassInsetClass, "flex min-h-[84px] flex-col justify-between p-3.5")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-medium text-slate-600">Cash In Hand</span>
                  <Banknote className="h-3.5 w-3.5 text-[#10B981]" />
                </div>
                <div className={cn(dashboardAmountCompactClass, "text-slate-900")}>
                  {formatInr(inHand)}
                </div>
              </div>
              <div className={cn(glassInsetClass, "flex min-h-[84px] flex-col justify-between p-3.5")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-medium text-slate-600">Bank Balance</span>
                  <Landmark className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <div className={cn(dashboardAmountCompactClass, "text-slate-900")}>
                  {formatInr(inBank)}
                </div>
              </div>
              <div className="col-span-2 flex min-h-[84px] flex-col justify-between rounded-lg bg-[#DBEAFE]/70 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[12px] font-medium text-slate-700">Total Balance</span>
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/80">
                    <Wallet className="h-4 w-4 text-[#2563EB]" />
                  </span>
                </div>
                <div className={cn(dashboardAmountClass, "text-slate-900")}>
                  {formatInr(totalBalance)}
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="col-span-12 flex h-full min-h-0 flex-col gap-5 xl:col-span-4">
          <section className="grid shrink-0 grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onReceivePayment}
              className={cn(
                glassCardClass,
                "flex min-h-[96px] flex-col items-start gap-3 p-4 text-left transition-colors hover:bg-white/70",
              )}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#D1F2E1]">
                <ArrowDownToLine className="h-5 w-5 text-[#10B981]" />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-bold leading-snug text-slate-900">Receive payment</div>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">Capture inbound fee receipts</p>
              </div>
            </button>
            <button
              type="button"
              onClick={onMakePayment}
              className={cn(
                glassCardClass,
                "flex min-h-[96px] flex-col items-start gap-3 p-4 text-left transition-colors hover:bg-white/70",
              )}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#DBEAFE]">
                <ArrowUpFromLine className="h-5 w-5 text-[#2563EB]" />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-bold leading-snug text-slate-900">Make payment</div>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">Pay vendors and salaries</p>
              </div>
            </button>
          </section>

          <section className={cn(glassCardClass, "flex min-h-0 flex-1 flex-col p-5")}>
            <div className="flex items-center justify-between gap-2">
              <DashboardPanelHeading icon={ListTodo} title="To Do List" />
              <button
                type="button"
                onClick={addTodo}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#2563EB] px-2.5 text-[11px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                Add
              </button>
            </div>
            <div className="mt-4 space-y-2.5">
              {visibleTodos.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  </span>
                  <Input
                    value={item}
                    onChange={(e) => updateTodo(index, e.target.value)}
                    placeholder={`Task ${index + 1}`}
                    className={cn(glassInsetClass, "h-9 flex-1 border-white/50 bg-white/40")}
                  />
                  <button
                    type="button"
                    onClick={() => removeTodo(index)}
                    aria-label={`Remove task ${index + 1}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-[#FEE2E2] hover:text-[#EF4444]"
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
                    className={cn(
                      glassInsetClass,
                      "flex h-9 w-full items-center justify-between gap-2 px-3 text-left text-[12px] font-semibold text-slate-700 transition-colors hover:bg-white/60",
                    )}
                  >
                    <span>
                      {moreTodosOpen ? "Hide extra tasks" : `${overflowTodos.length} more task${overflowTodos.length === 1 ? "" : "s"}`}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-slate-500 transition-transform",
                        moreTodosOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {moreTodosOpen && (
                    <div className={cn(glassInsetClass, "mt-2 space-y-2.5 p-2.5")}>
                      {overflowTodos.map((item, overflowIndex) => {
                        const index = overflowIndex + 4;
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-slate-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                            </span>
                            <Input
                              value={item}
                              onChange={(e) => updateTodo(index, e.target.value)}
                              placeholder={`Task ${index + 1}`}
                              className="h-9 flex-1 rounded-xl border-white/50 bg-white/70"
                            />
                            <button
                              type="button"
                              onClick={() => removeTodo(index)}
                              aria-label={`Remove task ${index + 1}`}
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-[#FEE2E2] hover:text-[#EF4444]"
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

            <div className="mt-5 flex min-h-0 flex-1 flex-col border-t border-slate-200/60 pt-5">
              <DashboardPanelHeading icon={StickyNote} title="Notes" />
              <Textarea
                value={dashboardNote}
                onChange={(e) => setDashboardNote(e.target.value)}
                placeholder="Write a quick note for today..."
                className={cn(
                  glassInsetClass,
                  "mt-4 min-h-[72px] w-full flex-1 resize-none border-white/50 bg-white/40",
                )}
              />
            </div>
          </section>
        </aside>

        {/* Bottom row */}
        <section className={cn(glassCardClass, "col-span-12 flex flex-col p-5 xl:col-span-4")}>
          <div className="flex items-center justify-between gap-3">
            <DashboardPanelHeading icon={GraduationCap} title="Student Admissions" />
            <span className="rounded-full bg-white/60 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
              {periodLabel}
            </span>
          </div>
          <ChartContainer config={admissionChartConfig} className="mt-4 h-[160px] w-full">
            <LineChart data={admissionWeeks} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="rgba(15,23,42,0.08)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#64748B" }}
              />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#10B981" }}
              />
            </LineChart>
          </ChartContainer>
          <div className="mt-4 grid flex-1 grid-cols-1 gap-3">
            <div className={cn(glassInsetClass, "flex flex-1 flex-col items-center justify-center p-4 text-center")}>
              <div className="text-[13px] font-medium text-slate-500">New Admissions</div>
              <div className={cn(dashboardCountClass, "mt-2 text-slate-900")}>{newAdmissions}</div>
            </div>
          </div>
        </section>

        <section className={cn(glassCardClass, "col-span-12 flex flex-col p-5 xl:col-span-4")}>
          <div className="flex items-center justify-between gap-3">
            <DashboardPanelHeading icon={TrendingUp} title="Income vs Expense" />
            <span className="rounded-full bg-white/60 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
              {periodLabel}
            </span>
          </div>
          <ChartContainer config={incomeExpenseChartConfig} className="mt-4 h-[160px] w-full">
            <BarChart data={incomeExpenseWeeks} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="rgba(15,23,42,0.08)" />
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
              <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} maxBarSize={14} />
              <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ChartContainer>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div
              className={cn(
                glassInsetClass,
                "flex flex-col items-center justify-center px-3 py-3.5 text-center",
              )}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Total Income
              </div>
              <div className="mt-1.5 text-[15px] font-semibold tracking-tight text-emerald-700 tabular-nums">
                {formatInr(periodIncome)}
              </div>
            </div>
            <div
              className={cn(
                glassInsetClass,
                "flex flex-col items-center justify-center px-3 py-3.5 text-center",
              )}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Total Expense
              </div>
              <div className="mt-1.5 text-[15px] font-semibold tracking-tight text-rose-700 tabular-nums">
                {formatInr(expenseTotal)}
              </div>
            </div>
          </div>
        </section>

        <section className={cn(glassCardClass, "col-span-12 flex flex-col p-5 xl:col-span-4")}>
          <div className="flex items-center justify-between gap-3">
            <DashboardPanelHeading icon={ArrowDownToLine} title="Recent Transactions" />
            <Link
              to="/tenant/finance"
              search={{ tab: "receive" }}
              className="text-[12px] font-semibold text-[#2563EB] hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="mt-4 flex-1 divide-y divide-white/50">
            {recentReceipts.length === 0 && (
              <div className="py-6 text-center text-[12px] text-slate-500">No receipts logged yet</div>
            )}
            {recentReceipts.map((payment) => (
              <div key={payment.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#D1F2E1]">
                  <ArrowUpRight className="h-4 w-4 text-[#10B981]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-slate-900">{payment.name}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {payment.cat} · {payment.mode}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[13px] font-semibold text-slate-900">
                    {formatInr(payment.amount)}
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-500">{payment.time}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer
          className={cn(
            glassPanelClass,
            "col-span-12 flex flex-wrap items-center justify-between gap-4 rounded-lg px-5 py-3.5",
          )}
        >
          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold uppercase tracking-wide text-slate-900">
              {tenantName}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">Tenant administration workspace</div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[12px] text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              {nowLabel.date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              {nowLabel.time}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[13px] font-semibold text-slate-900">{displayName}</div>
              <div className="text-[11px] text-slate-500">Administrator</div>
            </div>
            <Link
              to="/tenant/settings"
              aria-label="Settings"
              className="glass-inset grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition-colors hover:text-[#2563EB]"
            >
              <Settings className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </footer>
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
    <div className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/60 shadow-sm">
        <Icon className="h-4 w-4 text-slate-700" strokeWidth={2} />
      </span>
      <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-900">{title}</h3>
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
        "text-[11px] font-semibold uppercase tracking-wider text-black/55 sm:text-[12px]",
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
  const {
    students,
    staff,
    payments,
    dashboardTodos,
    setDashboardTodos,
    dashboardNote,
    setDashboardNote,
    notifications,
  } = useTenantStore();

  const [period, setPeriod] = useState<PaymentPeriod>("this_month");
  const [customRange, setCustomRange] = useState<CustomDateRange>({ from: "", to: "" });

  const totalDue = students.reduce((acc, s) => acc + s.due, 0);
  const overdueStudents = students.filter((s) => s.due > 0);

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
    () => operatingExpenseForPeriod(period, customRange),
    [period, customRange],
  );
  const salaryOutstanding = salaryPayable();

  const recentReceipts = useMemo(() => filteredPayments.slice(0, 5), [filteredPayments]);

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <MobilePremiumDashboard
        studentCount={students.length}
        staffCount={staff.length}
        periodIncome={periodIncome}
        expenseTotal={expenseTotal}
        totalDue={totalDue}
        salaryOutstanding={salaryOutstanding}
        inHand={inHand}
        inBank={inBank}
        totalBalance={totalBalance}
        unreadNotifications={unreadNotifications}
        onReceivePayment={() => navigate({ to: "/tenant/finance", search: { tab: "receive" } })}
        onMakePayment={() => navigate({ to: "/tenant/finance", search: { tab: "make" } })}
      />

      <GlassDesktopDashboard
        students={students}
        staff={staff}
        periodIncome={periodIncome}
        expenseTotal={expenseTotal}
        periodPayments={filteredPayments}
        totalDue={totalDue}
        salaryOutstanding={salaryOutstanding}
        inHand={inHand}
        inBank={inBank}
        totalBalance={totalBalance}
        overdueStudents={overdueStudents}
        recentReceipts={recentReceipts}
        unreadNotifications={unreadNotifications}
        dashboardTodos={dashboardTodos}
        setDashboardTodos={setDashboardTodos}
        dashboardNote={dashboardNote}
        setDashboardNote={setDashboardNote}
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
  due: string;
  phone: string;
};

function emptyAdmitForm(cls: string): AdmitStudentForm {
  return {
    name: "",
    cls,
    guardian: "",
    due: "",
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
  "shrink-0 font-mono text-[18px] font-semibold leading-none tracking-tight text-black md:text-[32px]";

function DirectoryPersonAvatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  if (photoUrl) {
    return (
      <img src={photoUrl} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-black/5" />
    );
  }
  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-black text-[12px] font-semibold text-white">
      {personInitials(name)}
    </div>
  );
}

const directoryMobileCardClass = cn(
  premiumCardClass,
  "flex flex-col gap-3 p-4 text-left transition-all active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2",
);

const directoryEmptyClass = cn(
  premiumCardClass,
  "border-dashed px-4 py-10 text-center text-[13px] text-slate-500",
);

function StudentFeesStatusBadge({ due }: { due: number }) {
  if (due === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DBEAFE] px-2.5 py-1 text-[10.5px] font-semibold text-[#10B981]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
        Paid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] px-2.5 py-1 text-[10.5px] font-semibold text-[#EF4444]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
      Overdue
    </span>
  );
}

function StudentsDirectoryTable({
  students,
  onViewProfile,
  onEditData,
}: {
  students: Student[];
  onViewProfile: (id: string) => void;
  onEditData: (id: string) => void;
}) {
  return (
    <>
      <div className="space-y-2.5 md:hidden">
        {students.length === 0 && (
          <div className={directoryEmptyClass}>
            No students match the current filters.
          </div>
        )}
        {students.map((student) => {
          const digits = phoneDigits(student.phone);
          const hasPhone = digits.length > 0;
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
              className={cn(directoryMobileCardClass, "cursor-pointer")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <DirectoryPersonAvatar name={student.name} photoUrl={student.photoUrl} />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold leading-tight text-slate-900">
                      {student.name}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[10.5px] text-slate-400">
                      {student.id}
                    </div>
                  </div>
                </div>
                <StudentFeesStatusBadge due={student.due} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex max-w-full truncate rounded-full bg-[#DBEAFE] px-2.5 py-1 text-[10.5px] font-semibold text-[#0F172A]">
                  {student.cls}
                </span>
                <EnrollmentStatusBadge active={isRecordActive(student.active)} />
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[#F0F0F0] pt-2.5">
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-black/75">
                    {student.guardian}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[10.5px] text-black/45">
                    {hasPhone ? formatPhone(student.phone) : "No contact on file"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditData(student.id);
                  }}
                  aria-label={`Edit data for ${student.name}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#E5E5E5] bg-[#F4F4F5] text-black/60 transition-colors hover:border-black/20 hover:bg-white hover:text-black"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mobile-scrollbar-none hidden w-full overflow-x-auto md:block">
        <div className={glassTableWrapClass}>
      <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[26%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[26%]" />
          <col className="w-[24%]" />
        </colgroup>
        <thead>
          <tr>
            {["Student", "Class", "Status", "Guardian & Contact", "Fees Status"].map((header) => (
              <th
                key={header}
                className={cn(
                  "border-b border-slate-100 px-4 pb-4 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:px-6 sm:pt-5",
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
              <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-black/55 sm:px-6">
                No students match the current filters.
              </td>
            </tr>
          )}
          {students.map((student) => {
            const digits = phoneDigits(student.phone);
            const hasPhone = digits.length > 0;
            const waHref = `https://wa.me/${digits.length === 10 ? "91" : ""}${digits}`;
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
                className="cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-[#F4F4F5] focus-visible:bg-[#F4F4F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]"
              >
                <td className="px-4 py-3.5 align-middle sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    {student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black text-[12px] font-semibold text-white">
                        {personInitials(student.name)}
                      </div>
                    )}
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
                <td className="px-4 py-3.5 align-middle sm:px-6">
                  <span className="inline-flex max-w-full truncate rounded-full bg-[#DBEAFE] px-2.5 py-1 text-[11px] font-medium text-black">
                    {student.cls}
                  </span>
                </td>
                <td className="px-4 py-3.5 align-middle sm:px-6">
                  <EnrollmentStatusBadge active={isRecordActive(student.active)} />
                </td>
                <td className="px-4 py-3.5 align-middle sm:px-6">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-black">
                      {student.guardian}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[11px] text-black/50">
                      {hasPhone ? formatPhone(student.phone) : "—"}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-middle sm:px-6">
                  <div className="flex w-full items-center justify-end gap-3">
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
  const { students, setStudents, classes } = useTenantStore();
  const navigate = useNavigate();
  const defaultClass = classes[0]?.className ?? "";
  const [form, setForm] = useState<AdmitStudentForm>(() => emptyAdmitForm(defaultClass));
  const [shareOpen, setShareOpen] = useState(false);
  const [shareToken, setShareToken] = useState("");
  const [shareName, setShareName] = useState("");
  const [sharePhone, setSharePhone] = useState("");
  const [shareGuardian, setShareGuardian] = useState("");
  const [admittedId, setAdmittedId] = useState<string | null>(null);

  useEffect(() => {
    if (!defaultClass) return;
    setForm((prev) =>
      classes.some((c) => c.className === prev.cls)
        ? prev
        : { ...prev, cls: defaultClass },
    );
  }, [classes, defaultClass]);

  const backToStudents = () => navigate({ to: "/tenant/students" });

  const createStudent = (): Student | null => {
    if (!form.name.trim() || !form.guardian.trim()) {
      toast.error("Name and guardian are required");
      return null;
    }
    const nextNum = 2847 + students.filter((s) => s.id.startsWith("STU-28")).length;
    const token = createStudentShareToken();
    const newStu: Student = {
      id: `STU-${nextNum}`,
      name: form.name.trim(),
      cls: form.cls,
      guardian: form.guardian.trim(),
      due: Number(form.due) || 0,
      phone: form.phone.trim() || undefined,
      shareToken: token,
      active: true,
    };
    setStudents((prev) => [newStu, ...prev]);
    upsertStudentInSnapshot(newStu);
    return newStu;
  };

  const handleAdmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStu = createStudent();
    if (!newStu) return;
    toast.success(`${newStu.name} admitted`, {
      description: `${newStu.id} · ${newStu.cls} · share the parent link to complete the profile`,
    });
    navigate({ to: "/tenant/students", search: { id: newStu.id } });
  };

  const handleAdmitAndShare = (e: React.MouseEvent) => {
    e.preventDefault();
    const newStu = createStudent();
    if (!newStu?.shareToken) return;
    toast.success(`${newStu.name} admitted`, {
      description: `${newStu.id} · share link ready for parents`,
    });
    setAdmittedId(newStu.id);
    setShareToken(newStu.shareToken);
    setShareName(newStu.name);
    setSharePhone(newStu.phone ?? "");
    setShareGuardian(newStu.guardian);
    setShareOpen(true);
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={backToStudents}
          className={cn(
            glassInsetClass,
            "inline-flex h-10 items-center gap-1.5 px-3 text-[13px] font-semibold text-slate-700 transition-colors hover:text-[#2563EB]",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Students directory
        </button>
        <div className="min-w-0">
          <MobileSectionTitle className="md:hidden">Admit New Student</MobileSectionTitle>
          <div className="hidden md:block">
            <div className="text-[15px] font-bold text-slate-900">Admit New Student</div>
            <p className="text-[12px] text-slate-500">
              Fill school details, then share a link so parents can complete the rest.
            </p>
          </div>
        </div>
      </div>

      <section className={cn(glassCardClass, "w-full p-5 md:p-6")}>
        <form onSubmit={handleAdmit} className="space-y-4">
          <div className="rounded-lg border border-[#DBEAFE] bg-[#EFF6FF]/70 px-3.5 py-3 text-[12px] text-slate-600">
            Administrators enter name, class, guardian, contact, and initial due. Parents complete
            photo, gender, date of birth, email, and address via the share link.
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Class
            </Label>
            <FieldSelect
              value={form.cls}
              onValueChange={(cls) => setForm({ ...form, cls })}
              options={classes.map((c) => ({ value: c.className, label: c.className }))}
              placeholder="Select class"
              disabled={classes.length === 0}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Guardian Name
              </Label>
              <Input
                value={form.guardian}
                onChange={(e) => setForm({ ...form, guardian: e.target.value })}
                placeholder="e.g. Anita Verma"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Initial Due (₹)
            </Label>
            <Input
              inputMode="numeric"
              value={form.due}
              onChange={(e) => setForm({ ...form, due: e.target.value.replace(/[^0-9]/g, "") })}
              placeholder="0"
              className="font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={backToStudents}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleAdmitAndShare}
              className="rounded-full"
            >
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              Admit & Share
            </Button>
            <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
              Admit Student
            </Button>
          </div>
        </form>
      </section>

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
  const { students, setStudents, classes } = useTenantStore();
  const navigate = useNavigate();
  const search = useSearch({ from: "/tenant/students" }) as {
    id?: string;
    edit?: string;
  };
  const activeStudentViewId = search.id ?? null;
  const initialEdit = search.edit === "1";
  const defaultClass = classes[0]?.className ?? "";

  const openStudent = (id: string) => navigate({ to: "/tenant/students", search: { id } });
  const openStudentEdit = (id: string) =>
    navigate({ to: "/tenant/students", search: { id, edit: "1" } });
  const closeStudent = () => navigate({ to: "/tenant/students", search: {} });

  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [enrollmentFilter, setEnrollmentFilter] = useState<EnrollmentFilter>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDivisionFilter("all");
  }, [gradeFilter]);

  const openAdmitPage = () => navigate({ to: "/tenant/students/admit" });

  const activeStudent = useMemo(
    () =>
      activeStudentViewId ? (students.find((s) => s.id === activeStudentViewId) ?? null) : null,
    [activeStudentViewId, students],
  );

  const classDivisionIndex = useMemo(() => {
    const names = [
      ...classes.map((c) => c.className),
      ...students.map((s) => s.cls),
    ];
    return buildClassDivisionIndex(names);
  }, [classes, students]);

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
    return students
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
      });
  }, [students, gradeFilter, divisionFilter, statusFilter, enrollmentFilter]);

  const analytics = useMemo(
    () => ({
      paid: students.filter((s) => s.due === 0).length,
      overdue: students.filter((s) => s.due > 0).length,
      total: students.length,
      male: students.filter((s) => s.gender === "M").length,
      female: students.filter((s) => s.gender === "F").length,
    }),
    [students],
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
    a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
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
      description: "Fill the sample rows, save as CSV, then Upload CSV",
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const start = /name|student/i.test(lines[0] ?? "") ? 1 : 0;
      const fresh: Student[] = [];
      let next = 2900 + students.length + fresh.length;
      for (let i = start; i < lines.length; i++) {
        const cells = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const [name, cls, guardian, phone, balance] = cells;
        if (!name) continue;
        fresh.push({
          id: `STU-${next++}`,
          name,
          cls: cls || defaultClass,
          guardian: guardian || "—",
          phone: phone || undefined,
          due: Number(balance) || 0,
        });
      }
      if (!fresh.length) {
        toast.error("CSV had no parsable rows");
      } else {
        setStudents((prev) => [...fresh, ...prev]);
        toast.success(`${fresh.length} students imported`, {
          description: "Appended to the active tenant ledger",
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
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
    const stampedAt = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
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
    <div className="w-full space-y-6 lg:space-y-6">
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
            iconClass: "text-[#2563EB]",
          },
        ]}
      />

      <div className="hidden w-full grid-cols-3 gap-3 md:grid">
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

        <div className={cn(glassCardClass, directoryStatCardClass, "bg-[#DBEAFE]/40")}>
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

      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <h1 className="min-w-0 flex-1 text-[18px] font-bold leading-tight tracking-tight text-slate-900 md:text-[28px] md:font-semibold">
          Students Directory
        </h1>
        <div className="mobile-scrollbar-none flex w-full items-center gap-2 overflow-x-auto md:w-auto md:shrink-0 md:justify-end md:overflow-visible">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={mobileOutlineBtn}>
                <Filter className="h-3.5 w-3.5" />
                Filter
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
              <button type="button" className={mobileOutlineBtn}>
                <Download className="h-3.5 w-3.5" />
                Export
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
              <button type="button" className={mobileOutlineBtn}>
                <Upload className="h-3.5 w-3.5" />
                Bulk Upload
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
              "md:rounded-full md:bg-gradient-to-r md:from-[#2563EB] md:to-[#4C69A4] md:shadow-md md:shadow-blue-900/15 md:hover:opacity-95 md:hover:bg-gradient-to-r",
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            Admit Student
          </button>
        </div>
      </div>

      <div className={cn(glassCardClass, "p-4 md:p-5")}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="min-w-0">
              <div className="mb-1.5 text-[12px] font-medium text-slate-500 md:text-[10px] md:font-semibold md:uppercase md:tracking-wider">
                Class / Grade
              </div>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E5E5] bg-white">
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
              <div className="mb-1.5 text-[12px] font-medium text-slate-500 md:text-[10px] md:font-semibold md:uppercase md:tracking-wider">
                Division
              </div>
              <Select
                value={divisionFilter}
                onValueChange={setDivisionFilter}
                disabled={gradeFilter === "all" && divisionOptions.length === 0}
              >
                <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E5E5] bg-white">
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

          <div className="flex shrink-0 items-center justify-between gap-3 md:flex-col md:items-end md:justify-end">
            <span className="font-mono text-[11px] text-black/45">
              {filtered.length} shown
            </span>
            {(gradeFilter !== "all" || divisionFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setGradeFilter("all");
                  setDivisionFilter("all");
                }}
                className="text-[11px] font-semibold text-black/55 underline-offset-2 hover:text-black hover:underline"
              >
                Clear class filters
              </button>
            )}
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

      <StudentsDirectoryTable
        students={filtered}
        onViewProfile={openStudent}
        onEditData={openStudentEdit}
      />
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
      : "bg-black text-white hover:bg-black/85";
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
  return member.role.toLowerCase().includes("teacher");
}

export function StaffRoster() {
  const { staff, setStaff, departments, roles } = useTenantStore();
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
  const [form, setForm] = useState({
    name: "",
    role: defaultRole,
    dept: defaultDept,
    id: "",
    photoUrl: "",
  });
  const recruitPhotoRef = useRef<HTMLInputElement>(null);
  const staffImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      role: roles.some((r) => r.title === prev.role) ? prev.role : defaultRole,
      dept: departments.some((d) => d.name === prev.dept) ? prev.dept : defaultDept,
    }));
  }, [departments, defaultDept, defaultRole, roles]);

  const activeStaff = useMemo(
    () => (activeStaffViewId ? (staff.find((s) => s.id === activeStaffViewId) ?? null) : null),
    [activeStaffViewId, staff],
  );

  const departmentOptions = useMemo(() => {
    const fromStaff = staff.map((s) => s.dept);
    const fromConfig = departments.map((d) => d.name);
    return Array.from(new Set([...fromConfig, ...fromStaff])).sort();
  }, [departments, staff]);

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesDept = deptFilter === "all" || member.dept === deptFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? member.active : !member.active);
      return matchesDept && matchesStatus;
    });
  }, [staff, deptFilter, statusFilter]);

  const analytics = useMemo(() => {
    const activeMembers = staff.filter((s) => s.active);
    const teachers = activeMembers.filter(isTeachingStaff).length;
    const nonTeaching = activeMembers.filter((s) => !isTeachingStaff(s)).length;
    const active = staff.filter((s) => s.active).length;
    const inactive = staff.length - active;
    return {
      teachers,
      nonTeaching,
      total: staff.length,
      active,
      inactive,
    };
  }, [staff]);

  const handleRecruitPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      photoUrl: form.photoUrl || undefined,
      basicSalary: 8000,
      additionalAllowances: 0,
      documents: DEFAULT_STAFF_DOCUMENTS.map((d) => ({ ...d })),
    };
    setStaff((prev) => [newStaff, ...prev]);
    toast.success(`${newStaff.name} recruited`, {
      description: `${newStaff.id} · ${newStaff.dept}`,
    });
    setForm({ name: "", role: defaultRole, dept: defaultDept, id: "", photoUrl: "" });
    setOpen(false);
  };

  const handleExport = () => {
    downloadCsv(
      "staff-directory.csv",
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
      ["Name", "Role", "Department", "Phone", "ID"],
      [
        ["Ananya Menon", defaultRole || "Teacher", defaultDept || "LP", "9810012345", ""],
        ["Rahul Nair", "Accountant", "Administrative", "9876501122", ""],
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
        const [name, role, dept, phone, idCell] = cells;
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
          basicSalary: 8000,
          additionalAllowances: 0,
          documents: DEFAULT_STAFF_DOCUMENTS.map((d) => ({ ...d })),
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
    <div className="w-full space-y-6 lg:space-y-6">
      <MobileStatsOverview
        items={[
          {
            label: "Teachers",
            value: analytics.teachers,
            icon: GraduationCap,
            iconClass: "text-[#2563EB]",
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
            iconClass: "text-[#2563EB]",
          },
        ]}
      />

      <div className="hidden w-full grid-cols-3 gap-3 md:grid">
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

        <div className={cn(glassCardClass, directoryStatCardClass, "bg-[#DBEAFE]/40")}>
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

      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <h1 className="min-w-0 flex-1 text-[18px] font-bold leading-tight tracking-tight text-slate-900 md:text-[28px] md:font-semibold">
          Staff Directory
        </h1>
        <div className="mobile-scrollbar-none flex w-full items-center gap-2 overflow-x-auto md:w-auto md:shrink-0 md:justify-end md:overflow-visible">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={mobileOutlineBtn}>
                <Filter className="h-3.5 w-3.5" />
                Filter
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
                  <DropdownMenuRadioItem key={dept} value={dept} className="rounded-xl text-[13px]">
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

          <button type="button" onClick={handleExport} className={mobileOutlineBtn}>
            <Download className="h-3.5 w-3.5" />
            Export
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={mobileOutlineBtn}>
                <Upload className="h-3.5 w-3.5" />
                Bulk Upload
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

          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              mobilePrimaryBtn,
              "md:rounded-full md:bg-gradient-to-r md:from-[#2563EB] md:to-[#4C69A4] md:shadow-md md:shadow-blue-900/15 md:hover:opacity-95 md:hover:bg-gradient-to-r",
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            Recruit Staff
          </button>
        </div>
      </div>

      <input
        ref={staffImportRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleStaffImport}
      />

      <div className="space-y-2.5 md:hidden">
        {filteredStaff.length === 0 && (
          <div className={directoryEmptyClass}>
            No staff records match the current filters.
          </div>
        )}
        {filteredStaff.map((member) => {
          const digits = phoneDigits(member.phone);
          const hasPhone = digits.length > 0;
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
              className={cn(directoryMobileCardClass, "cursor-pointer")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <DirectoryPersonAvatar name={member.name} photoUrl={member.photoUrl} />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold leading-tight text-black">
                      {member.name}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[10.5px] text-black/45">
                      {member.id}
                    </div>
                  </div>
                </div>
                <EnrollmentStatusBadge active={member.active} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex max-w-full truncate rounded-full bg-[#DBEAFE] px-2.5 py-1 text-[10.5px] font-semibold text-[#0F172A]">
                  {member.role}
                </span>
                <span className="inline-flex max-w-full truncate rounded-full bg-[#F4F4F5] px-2.5 py-1 text-[10.5px] font-medium text-black/75">
                  {member.dept}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[#F0F0F0] pt-2.5">
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-black/75">{member.role}</div>
                  <div className="mt-0.5 truncate font-mono text-[10.5px] text-black/45">
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
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#E5E5E5] bg-[#F4F4F5] text-black/60 transition-colors hover:border-black/20 hover:bg-white hover:text-black"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mobile-scrollbar-none hidden w-full overflow-x-auto md:block">
        <div className={glassTableWrapClass}>
          <table className="w-full min-w-[640px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[34%]" />
              <col className="w-[24%]" />
              <col className="w-[24%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead>
              <tr>
                {["Name", "Role", "Department", "Status"].map((header) => (
                  <th
                    key={header}
                    className="border-b border-slate-100 px-4 pb-4 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:px-6 sm:pt-5"
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
                    colSpan={4}
                    className="px-4 py-10 text-center text-[13px] text-black/55 sm:px-6"
                  >
                    No staff records match the current filters.
                  </td>
                </tr>
              )}
              {filteredStaff.map((member) => (
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
                  className="cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-[#F4F4F5] focus-visible:bg-[#F4F4F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]"
                >
                  <td className="px-4 py-3.5 align-middle sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                      {member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black text-[12px] font-semibold text-white">
                          {personInitials(member.name)}
                        </div>
                      )}
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
                  <td className="px-4 py-3.5 align-middle text-[13px] text-black/75 sm:px-6">
                    <span className="block truncate">{member.role}</span>
                  </td>
                  <td className="px-4 py-3.5 align-middle text-[13px] text-black/75 sm:px-6">
                    <span className="block truncate">{member.dept}</span>
                  </td>
                  <td className="px-4 py-3.5 align-middle sm:px-6">
                    <EnrollmentStatusBadge active={member.active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                {form.photoUrl ? (
                  <img
                    src={form.photoUrl}
                    alt=""
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-lg bg-black text-sm font-semibold text-white">
                    {form.name.trim() ? personInitials(form.name) : "?"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => recruitPhotoRef.current?.click()}
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
                ref={recruitPhotoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleRecruitPhoto}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
                Recruit Staff
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
    | "daybook";

  const navigate = useNavigate();
  const search = useSearch({ from: "/tenant/finance" });
  const [view, setView] = useState<FinanceView>(search.tab ?? "overview");

  useEffect(() => {
    if (search.tab === "receive" || search.tab === "make") {
      setView(search.tab);
    } else if (!search.tab) {
      setView((current) =>
        current === "receive" || current === "make" ? "overview" : current,
      );
    }
  }, [search.tab]);

  const openView = (next: FinanceView) => {
    setView(next);
    if (next === "receive" || next === "make") {
      navigate({ to: "/tenant/finance", search: { tab: next }, replace: true });
      return;
    }
    navigate({ to: "/tenant/finance", search: {}, replace: true });
  };

  const backToOverview = () => {
    setView("overview");
    navigate({ to: "/tenant/finance", search: {}, replace: true });
  };

  if (view === "receive") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <FinanceFlowHeader
          title="Receive Payment"
          description="Capture inbound fee receipts"
          onBack={backToOverview}
        />
        <ReceivePayment />
      </div>
    );
  }

  if (view === "make") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <FinanceFlowHeader
          title="Make Payment"
          description="Pay vendors and salaries"
          onBack={backToOverview}
        />
        <MakePayment />
      </div>
    );
  }

  if (view === "analytics") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <FinanceFlowHeader
          title="Ledger Analytics"
          description="Income and outflow distribution"
          onBack={backToOverview}
        />
        <LedgerAnalytics />
      </div>
    );
  }

  if (view === "ledger") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <FinanceFlowHeader title="Ledger" description="General ledger" onBack={backToOverview} />
        <GeneralLedgerReport />
      </div>
    );
  }

  if (view === "pl") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <FinanceFlowHeader
          title="Profit & Loss"
          description="Income versus operating expense"
          onBack={backToOverview}
        />
        <ProfitLossReport />
      </div>
    );
  }

  if (view === "balance") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <FinanceFlowHeader
          title="Balance Sheet"
          description="Position statement"
          onBack={backToOverview}
        />
        <BalanceSheetReport />
      </div>
    );
  }

  if (view === "fees") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <FinanceFlowHeader
          title="Fees Report"
          description="Student fee collections and outstanding dues"
          onBack={backToOverview}
        />
        <FeesReport />
      </div>
    );
  }

  if (view === "salary") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <FinanceFlowHeader
          title="Salary Report"
          description="Staff payroll register and salary obligations"
          onBack={backToOverview}
        />
        <SalaryReport />
      </div>
    );
  }

  if (view === "daybook") {
    return (
      <div className="w-full space-y-4 sm:space-y-5">
        <FinanceFlowHeader
          title="Day Book"
          description="Chronological cash book of receipts and payments"
          onBack={backToOverview}
        />
        <DayBookReport />
      </div>
    );
  }

  return <FinanceOverview onOpenView={openView} />;
}

function FinanceFlowHeader({
  title,
  description,
  onBack,
}: {
  title: string;
  description: string;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className={cn(
          glassInsetClass,
          "inline-flex h-10 items-center gap-1.5 px-3 text-[13px] font-semibold text-slate-700 transition-colors hover:text-[#2563EB]",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        Finance overview
      </button>
      <div className="min-w-0">
        <MobileSectionTitle className="md:hidden">{title}</MobileSectionTitle>
        <div className="hidden md:block">
          <div className="text-[15px] font-bold text-slate-900">{title}</div>
          <p className="text-[12px] text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );
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
      | "daybook",
  ) => void;
}) {
  const { payments, academicYear, schoolDetails } = useTenantStore();
  const schoolName = schoolDetails.name || "Silver Hills Global";
  const [incomePeriod, setIncomePeriod] = useState<PaymentPeriod>("this_month");
  const [customRange, setCustomRange] = useState<CustomDateRange>({ from: "", to: "" });

  const filteredPayments = useMemo(
    () => filterPaymentsByPeriod(payments, incomePeriod, customRange),
    [payments, incomePeriod, customRange],
  );

  const incomeSegments = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const payment of filteredPayments) {
      const key = payment.cat || "Other";
      buckets.set(key, (buckets.get(key) ?? 0) + payment.amount);
    }
    const rows = Array.from(buckets.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
    if (rows.length) return rows;
    return LEDGER_INCOME_SEGMENTS;
  }, [filteredPayments]);

  const incomeTotal = incomeSegments.reduce((sum, item) => sum + item.value, 0);

  const expenseSegments = useMemo(
    () => OPERATING_EXPENSES.map((item) => ({ label: item.account, value: item.amount })),
    [],
  );

  const expenseChartConfig = {
    value: { label: "Expense" },
  } satisfies ChartConfig;

  const overdueBills = useMemo(
    () =>
      ACCOUNTS_PAYABLE.map((item) => ({
        name: item.payee,
        amount: item.amount,
        due: /payroll|salary/i.test(item.payee) ? "25 May" : "18 May",
      })),
    [],
  );

  const exportTransactionsCsv = () => {
    if (!payments.length) {
      toast.error("Nothing to export · no transactions yet");
      return;
    }
    downloadCsv(
      "finance-transactions.csv",
      ["Transaction ID", "Account", "Category", "Mode", "Amount (INR)", "Time", "Status", "Narration"],
      payments.map((p) => [
        p.id,
        p.name,
        p.cat,
        p.mode,
        p.amount,
        p.time,
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
      filename: "finance-transactions.pdf",
      title: "Finance Transactions",
      subtitle: `${schoolName} · ${academicYear}`,
      headers: ["ID", "Account", "Category", "Mode", "Amount", "Time", "Status", "Narration"],
      rows: payments.map((p) => [
        p.id,
        p.name,
        p.cat,
        p.mode,
        p.amount.toLocaleString("en-IN"),
        p.time,
        "Complete",
        p.narration ?? "",
      ]),
    });
    toast.success("Transactions PDF downloaded");
  };

  const receiptBranding = {
    letterheadUrl: schoolDetails.letterheadUrl,
    address: schoolDetails.address,
    phone: schoolDetails.phone,
    email: schoolDetails.email,
  };

  const downloadTransaction = (payment: Payment) => {
    downloadReceiptPdf(payment, schoolName, academicYear, receiptBranding);
    toast.success(`Receipt ${payment.id} downloaded`);
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
          `• ${p.id} · ${p.name} · ₹ ${p.amount.toLocaleString("en-IN")} · ${p.time}`,
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
      `Mode: ${payment.mode}`,
      `Amount: ₹ ${payment.amount.toLocaleString("en-IN")}`,
      `Time: ${payment.time}`,
      `AY: ${academicYear}`,
      "Status: Complete",
      payment.narration ? `Note: ${payment.narration}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    void sharePayload(`Receipt ${payment.id}`, text);
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <MobileSectionTitle className="md:hidden">Finance</MobileSectionTitle>
          <h2 className="hidden text-[18px] font-bold tracking-tight text-slate-900 md:block">
            Finance overview
          </h2>
          <p className="mt-1 hidden text-[12px] text-slate-500 md:block">
            Receive and make payments, review transactions, and track income vs expense
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { k: "fees" as const, l: "Fees Report" },
              { k: "salary" as const, l: "Salary Report" },
              { k: "daybook" as const, l: "Day Book" },
              { k: "analytics" as const, l: "Analytics" },
              { k: "ledger" as const, l: "Ledger" },
              { k: "pl" as const, l: "P&L" },
              { k: "balance" as const, l: "Balance Sheet" },
            ] as const
          ).map((item) => (
            <button
              key={item.k}
              type="button"
              onClick={() => onOpenView(item.k)}
              className={cn(
                glassInsetClass,
                "px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:text-[#2563EB]",
              )}
            >
              {item.l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onOpenView("receive")}
          className={cn(
            glassCardClass,
            "flex min-h-[96px] items-center gap-4 p-5 text-left transition-colors hover:bg-white/70",
          )}
        >
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#D1F2E1]">
            <ArrowDownToLine className="h-5 w-5 text-[#10B981]" />
          </span>
          <div>
            <div className="text-[15px] font-bold text-slate-900">Receive payment</div>
            <p className="mt-0.5 text-[12px] text-slate-500">Capture inbound fee receipts</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onOpenView("make")}
          className={cn(
            glassCardClass,
            "flex min-h-[96px] items-center gap-4 p-5 text-left transition-colors hover:bg-white/70",
          )}
        >
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#DBEAFE]">
            <ArrowUpFromLine className="h-5 w-5 text-[#2563EB]" />
          </span>
          <div>
            <div className="text-[15px] font-bold text-slate-900">Make payment</div>
            <p className="mt-0.5 text-[12px] text-slate-500">Pay vendors and salaries</p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <section className={cn(glassCardClass, "col-span-12 flex flex-col p-5 lg:col-span-4")}>
          <h3 className="text-[15px] font-bold text-slate-900">Overdue Bills</h3>
          <p className="mt-0.5 text-[12px] text-slate-500">
            {overdueBills.length} open obligation{overdueBills.length === 1 ? "" : "s"}
          </p>
          <div className="mt-4 flex-1 space-y-2">
            {overdueBills.map((bill, index) => (
              <div
                key={bill.name}
                className={cn(glassInsetClass, "flex items-center justify-between gap-3 px-3.5 py-2.5")}
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-slate-900">
                    {index + 1}. {bill.name}
                  </div>
                  <div className="text-[11px] text-slate-500">Due {bill.due}</div>
                </div>
                <div className="shrink-0 font-mono text-[13px] font-semibold text-slate-900">
                  {formatInr(bill.amount)}
                </div>
              </div>
            ))}
          </div>
        </section>

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
            {incomeSegments.map((segment) => {
              const pct = incomeTotal > 0 ? Math.round((segment.value / incomeTotal) * 100) : 0;
              return (
                <div key={segment.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px]">
                    <span className="font-medium text-slate-700">{segment.label}</span>
                    <span className="font-mono text-slate-500">{pct}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#2563EB]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
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
          </ChartContainer>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {expenseSegments.slice(0, 4).map((segment) => (
              <div key={segment.label} className={cn(glassInsetClass, "px-2.5 py-2")}>
                <div className="truncate text-[10px] font-medium text-slate-500">{segment.label}</div>
                <div className="mt-0.5 truncate font-mono text-[11px] font-semibold text-slate-900">
                  {formatInr(segment.value)}
                </div>
              </div>
            ))}
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

        <div className="mobile-scrollbar-none mt-4 overflow-x-auto rounded-lg border border-[#E5E5E5]">
          <table className="w-full min-w-[780px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F4F4F5]">
                {["Transaction", "Account", "Date / Time", "Amount", "Status", "Actions"].map(
                  (header) => (
                  <th
                    key={header}
                    className={cn(
                      "px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-black/55",
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
                  <td colSpan={6} className="px-3 py-8 text-center text-[12px] text-black/55">
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
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px] text-black/55">{p.time}</td>
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
                      <button
                        type="button"
                        aria-label={`Download receipt ${p.id}`}
                        title="Download"
                        onClick={() => downloadTransaction(p)}
                        className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] text-black/55 transition-colors hover:border-black hover:bg-[#F4F4F5] hover:text-black"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Share receipt ${p.id}`}
                        title="Share"
                        onClick={() => shareTransaction(p)}
                        className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] text-black/55 transition-colors hover:border-[#2563EB] hover:bg-[#DBEAFE] hover:text-[#2563EB]"
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
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-black/55">
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

function ReceivePayment() {
  const {
    students,
    setStudents,
    payments,
    setPayments,
    classes: classConfigs,
    transportRoutes,
    paymentCategories,
    academicYear,
    schoolDetails,
  } = useTenantStore();
  const schoolName = schoolDetails.name || "Silver Hills Global";
  const classes = useMemo(() => {
    const fromConfig = classConfigs.map((c) => c.className);
    const fromStudents = Array.from(new Set(students.map((s) => s.cls)));
    return Array.from(new Set([...fromConfig, ...fromStudents]));
  }, [classConfigs, students]);
  const [payerSource, setPayerSource] = useState<"student" | "external">("student");
  const [externalPayer, setExternalPayer] = useState("");
  const [cls, setCls] = useState(classes[0] ?? "");
  const studentsInClass = useMemo(() => students.filter((s) => s.cls === cls), [students, cls]);
  const [stu, setStu] = useState(studentsInClass[0]?.name ?? students[0]?.name ?? "");
  const [category, setCategory] = useState(paymentCategories[0]?.label ?? "Tuition Fee");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("Bank");
  const [narration, setNarration] = useState("");
  const [historyQuery, setHistoryQuery] = useState("");

  const isExternal = payerSource === "external";
  const selected = !isExternal ? students.find((s) => s.name === stu) : undefined;

  useEffect(() => {
    if (classes.length && !classes.includes(cls)) {
      setCls(classes[0]);
    }
  }, [classes, cls]);

  useEffect(() => {
    if (isExternal) return;
    const pool = studentsInClass.length ? studentsInClass : students;
    if (pool.length && !pool.some((s) => s.name === stu)) {
      setStu(pool[0].name);
    }
  }, [students, studentsInClass, stu, isExternal]);

  useEffect(() => {
    if (paymentCategories.length && !paymentCategories.some((c) => c.label === category)) {
      setCategory(paymentCategories[0].label);
    }
  }, [category, paymentCategories]);

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

  const tuitionFee = useMemo(
    () => classConfigs.find((c) => c.className === selected?.cls)?.tuitionFeeAmount,
    [classConfigs, selected],
  );

  const prefill = useMemo(() => {
    if (isExternal) return undefined;
    const lower = category.toLowerCase();
    if (lower.includes("tuition")) return tuitionFee;
    if (lower.includes("vehicle") || lower.includes("transport") || lower.includes("bus"))
      return matchedRouteFee;
    return undefined;
  }, [category, tuitionFee, matchedRouteFee, isExternal]);

  useEffect(() => {
    if (prefill !== undefined && prefill > 0) {
      setAmount(String(prefill));
    } else if (!isExternal) {
      setAmount("");
    }
  }, [prefill, isExternal]);

  const selectCategory = (label: string) => {
    setCategory(label);
    if (categorySuggestsExternal(label)) {
      setPayerSource("external");
    } else {
      setPayerSource("student");
    }
  };

  const handleRecord = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    const now = new Date();
    const stamp = `Today · ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const note = narration.trim();

    if (isExternal) {
      const payer = externalPayer.trim();
      if (!payer) {
        toast.error("Enter the donor / payer name");
        return;
      }
      const newPayment: Payment = {
        id: `RC-${9822 + payments.length}`,
        name: payer,
        cat: category,
        mode,
        amount: value,
        time: stamp,
        payerType: "external",
        ...(note ? { narration: note } : {}),
      };
      setPayments((prev) => [newPayment, ...prev]);
      toast.success(`Receipt ${newPayment.id} · ₹ ${value.toLocaleString("en-IN")} captured`, {
        description: `External · ${payer} · ${category}`,
      });
      setAmount("");
      setExternalPayer("");
      setNarration("");
      return;
    }

    if (!selected) {
      toast.error("Select a valid student");
      return;
    }
    const newPayment: Payment = {
      id: `RC-${9822 + payments.length}`,
      name: selected.name,
      cat: category,
      mode,
      amount: value,
      time: stamp,
      payerType: "student",
      className: selected.cls,
      ...(note ? { narration: note } : {}),
    };
    setPayments((prev) => [newPayment, ...prev]);
    setStudents((prev) =>
      prev.map((s) => (s.id === selected.id ? { ...s, due: Math.max(0, s.due - value) } : s)),
    );
    const remaining = Math.max(0, selected.due - value);
    toast.success(`Receipt ${newPayment.id} · ₹ ${value.toLocaleString("en-IN")} captured`, {
      description:
        remaining === 0
          ? `${selected.name}'s balance is now Cleared`
          : `${selected.name} · balance ₹ ${remaining.toLocaleString("en-IN")}`,
    });
    setAmount("");
    setNarration("");
  };

  const todayTotal = useMemo(
    () =>
      payments
        .filter((p) => p.time.startsWith("Today"))
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
        p.className ?? "",
        p.narration ?? "",
        p.payerType === "external" ? "external donor payer" : "student",
        String(p.amount),
        p.amount.toLocaleString("en-IN"),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [payments, historyQuery]);

  const summaryName = isExternal ? externalPayer.trim() || "External payer" : stu;
  const summaryContext = isExternal ? "External" : cls;
  const canRecord =
    Number(amount) > 0 && (isExternal ? externalPayer.trim().length > 0 : Boolean(selected));

  return (
    <div className="space-y-4 sm:space-y-5">
      <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-title">Inbound Fee Capture</div>
            <p className="mt-1 text-[12px] text-black/55">
              {isExternal
                ? `Record school income from external payers · ${academicYear}`
                : `Post fee receipts to student ledgers · ${academicYear}`}
            </p>
          </div>
          {!isExternal && selected && (
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold",
                selected.due > 0 ? "bg-[#FEF3C7] text-black" : "bg-[#DBEAFE] text-black",
              )}
            >
              {selected.due > 0 ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Due ₹ {selected.due.toLocaleString("en-IN")}
                </>
              ) : (
                "Ledger Cleared"
              )}
            </span>
          )}
          {isExternal && (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#DBEAFE] px-3.5 py-1.5 text-[11.5px] font-semibold text-black">
              External income
            </span>
          )}
        </div>

        <div className="mt-5">
          <FieldLabel>Received From</FieldLabel>
          <div className="flex gap-1 rounded-full border border-[#E5E5E5] bg-white p-1 sm:max-w-md">
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
                    "flex-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                    active ? "bg-black text-white" : "text-black/65 hover:text-black",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isExternal ? (
            <div className="sm:col-span-2">
              <FieldLabel>Donor / Payer Name</FieldLabel>
              <Input
                value={externalPayer}
                onChange={(e) => setExternalPayer(e.target.value)}
                placeholder="e.g. Parent Association · Ravi Kumar"
                className="h-10"
              />
              <p className="mt-1 text-[10.5px] text-black/45">
                Not linked to a student ledger · counted as school income only
              </p>
            </div>
          ) : (
            <>
              <div>
                <FieldLabel>Class</FieldLabel>
                <FieldSelect
                  value={cls}
                  onValueChange={(next) => {
                    setCls(next);
                    const first = students.find((s) => s.cls === next);
                    if (first) setStu(first.name);
                  }}
                  options={classes.map((c) => ({ value: c, label: c }))}
                  placeholder="Select class"
                  disabled={classes.length === 0}
                  searchable
                  searchPlaceholder="Search class..."
                />
              </div>
              <div>
                <FieldLabel>Student</FieldLabel>
                <FieldSelect
                  value={stu}
                  onValueChange={setStu}
                  options={(studentsInClass.length ? studentsInClass : students).map((s) => ({
                    value: s.name,
                    label: s.name,
                  }))}
                  placeholder="Select student"
                  searchable
                  searchPlaceholder="Search student..."
                />
              </div>
            </>
          )}
          <div>
            <FieldLabel>Amount (₹)</FieldLabel>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              placeholder="0"
              className="h-10 w-full rounded-lg border border-[#E5E5E5] bg-white px-3 font-mono text-[13px]"
            />
            {prefill !== undefined && prefill > 0 && (
              <p className="mt-1 text-[10.5px] text-black/45">
                Prefilled ₹ {prefill.toLocaleString("en-IN")} from Settings · {category}
              </p>
            )}
          </div>
          <div>
            <FieldLabel>Payment Mode</FieldLabel>
            <div className="flex gap-1 rounded-full border border-[#E5E5E5] bg-white p-1">
              {["Bank", "UPI", "Cash"].map((m) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      active ? "bg-black text-white" : "text-black/65 hover:text-black"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <FieldLabel>Fee Categories</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {paymentCategories.length === 0 && (
              <span className="text-[12px] text-black/55">
                No categories configured · add them under Settings
              </span>
            )}
            {paymentCategories.map((c) => {
              const active = category === c.label;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCategory(c.label)}
                  className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                    active
                      ? "border-transparent bg-[#2563EB] text-white"
                      : "border-[#E5E5E5] text-black/65 hover:bg-[#F4F4F5]"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <FieldLabel>Narration</FieldLabel>
          <Textarea
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="Optional note · purpose, reference, or remarks"
            className="min-h-[72px] w-full resize-none rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-[13px]"
          />
        </div>

        <div className="mt-5 flex flex-col gap-4 rounded-xl border border-[#E8E8EA] bg-[#F8F8F9] p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
          <div className="min-w-0 text-[13px] leading-relaxed text-black/65">
            <div>
              Receipt for <span className="font-semibold text-black">{summaryName}</span> · {summaryContext} ·{" "}
              <span className="font-semibold text-black">{category}</span> · {mode}
            </div>
            {narration.trim() && (
              <div className="mt-1 truncate text-[12px] text-black/45">“{narration.trim()}”</div>
            )}
          </div>
          <button
            type="button"
            onClick={handleRecord}
            disabled={!canRecord}
            className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-full bg-black px-8 text-[14px] font-semibold tracking-tight text-white shadow-[0_8px_24px_-10px_rgba(0,0,0,0.45)] transition-all hover:bg-[#0F172A] hover:shadow-[0_10px_28px_-10px_rgba(15,23,42,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none sm:h-12 sm:min-w-[200px] sm:w-auto"
          >
            Record ₹ {(Number(amount) || 0).toLocaleString("en-IN")}
          </button>
        </div>
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="bl" padded className={workspacePanelClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-title">Payment History</div>
            <p className="mt-1 text-[11.5px] text-black/55">
              {historyQuery.trim()
                ? `${filteredPayments.length} of ${payments.length} receipts`
                : `${payments.length} receipts · most recent first`}
            </p>
          </div>
          <div className="rounded-lg bg-[#F4F4F5] px-3.5 py-2 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
              Today&apos;s intake
            </div>
            <div className="font-mono text-[16px] font-semibold text-black">
              ₹ {todayTotal.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
          <Input
            value={historyQuery}
            onChange={(e) => setHistoryQuery(e.target.value)}
            placeholder="Search by payer, student, category, narration, amount…"
            className="h-10 rounded-xl border-[#E5E5E5] bg-white pl-9 pr-9"
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

        <div className="mobile-scrollbar-none mt-4 overflow-x-auto rounded-lg border border-[#E5E5E5]">
          <table className="w-full min-w-[640px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F4F4F5]">
                {["Account", "Category", "Mode", "Amount", "Time", ""].map((header) => (
                  <th
                    key={header || "action"}
                    className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-black/55 last:text-right"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[12px] text-black/55">
                    {payments.length === 0
                      ? "No receipts recorded yet"
                      : "No receipts match your search"}
                  </td>
                </tr>
              )}
              {filteredPayments.map((p) => (
                <tr key={p.id} className="border-b border-[#F0F0F0] last:border-0">
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
                  </td>
                  <td className="px-3 py-3 text-black/70">{p.cat}</td>
                  <td className="px-3 py-3 text-black/70">{p.mode}</td>
                  <td className="px-3 py-3 font-mono font-semibold text-black">
                    +₹ {p.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px] text-black/55">{p.time}</td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      aria-label={`Download receipt ${p.id}`}
                      onClick={() => {
                        downloadReceiptPdf(p, schoolName, academicYear, {
                          letterheadUrl: schoolDetails.letterheadUrl,
                          address: schoolDetails.address,
                          phone: schoolDetails.phone,
                          email: schoolDetails.email,
                        });
                        toast.success(`Receipt ${p.id} downloaded`);
                      }}
                      className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] text-black/55 transition-colors hover:border-black hover:bg-[#F4F4F5] hover:text-black"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OrganicCard>
    </div>
  );
}

function MakePayment() {
  const initialObligation = PENDING_OBLIGATIONS[0];
  const [obligations, setObligations] = useState<PendingObligation[]>(PENDING_OBLIGATIONS);
  const [madePayments, setMadePayments] = useState<MadePayment[]>(MADE_PAYMENTS);
  const [selectedObligationId, setSelectedObligationId] = useState<string | null>(
    initialObligation?.id ?? null,
  );
  const [payeeType, setPayeeType] = useState<"Salary" | "Vendor">(
    initialObligation?.payeeType ?? "Salary",
  );
  const [beneficiary, setBeneficiary] = useState(initialObligation?.payee ?? "");
  const [description, setDescription] = useState(initialObligation?.desc ?? "");
  const [amount, setAmount] = useState(
    initialObligation ? String(initialObligation.amount) : "",
  );
  const [mode, setMode] = useState("UPI Business");
  const [attachments, setAttachments] = useState<PaymentAttachment[]>([]);
  const [pendingAuthorisation, setPendingAuthorisation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const applyObligation = (obligation: PendingObligation) => {
    setSelectedObligationId(obligation.id);
    setPayeeType(obligation.payeeType);
    setBeneficiary(obligation.payee);
    setDescription(obligation.desc);
    setAmount(String(obligation.amount));
    setAttachments([]);
  };

  const resetForm = () => {
    setSelectedObligationId(null);
    setPayeeType("Salary");
    setBeneficiary("");
    setDescription("");
    setAmount("");
    setMode("Bank Transfer · NEFT");
    setAttachments([]);
  };

  const addAttachments = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const room = MAX_DISBURSAL_ATTACHMENTS - attachments.length;
    if (room <= 0) {
      toast.error(`Maximum ${MAX_DISBURSAL_ATTACHMENTS} attachments allowed`);
      return;
    }

    const files = Array.from(fileList).slice(0, room);
    const next: PaymentAttachment[] = [];

    for (const file of files) {
      if (file.size > MAX_DISBURSAL_ATTACHMENT_BYTES) {
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
    if (!beneficiary.trim()) {
      toast.error("Beneficiary name is required");
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
      time: formatDisbursalTime(),
      status: "Queued",
      attachments: attachments.length ? attachments : undefined,
    };
    setMadePayments((prev) => [disbursal, ...prev]);

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
      "made-payments.csv",
      ["ID", "Payee", "Type", "Description", "Mode", "Amount (INR)", "Status", "Time"],
      madePayments.map((p) => [
        p.id,
        p.payee,
        p.payeeType,
        p.desc,
        p.mode,
        p.amount,
        p.status,
        p.time,
      ]),
    );
    toast.success("Made payments exported", {
      description: `${madePayments.length} disbursal${madePayments.length === 1 ? "" : "s"} saved to CSV`,
    });
  };

  return (
    <div className="grid grid-cols-12 gap-4 sm:gap-5">
      <OrganicCard tone="white" cornerSide="tr" padded className={cn(workspacePanelClass, "col-span-12 lg:col-span-8")}>
        <DashboardPanelHeading icon={ArrowUpFromLine} title="Make Payment" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Payee Type</FieldLabel>
            <div className="flex gap-1 rounded-full border border-[#E5E5E5] bg-white p-1">
              {(["Salary", "Vendor"] as const).map((p) => {
                const active = payeeType === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPayeeType(p)}
                    className={`flex-1 rounded-full px-3 py-1.5 text-[12px] font-medium ${
                      active ? "bg-black text-white" : "text-black/65"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <FieldLabel>Beneficiary</FieldLabel>
            <Input
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              placeholder="e.g. BrightBus Logistics Pvt. Ltd."
            />
          </div>
          <div className="sm:col-span-2">
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
              <div className="grid grid-cols-3 gap-2">
                {["Bank", "UPI", "Cheque"].map((m) => {
                  const active = mode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={cn(
                        "h-11 w-full rounded-lg px-2 text-center text-[12px] font-medium leading-tight whitespace-nowrap transition-colors sm:px-3",
                        active
                          ? "bg-[#2563EB] text-white shadow-sm"
                          : "bg-[#DBEAFE]/50 text-slate-700 hover:bg-[#DBEAFE]",
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
                {attachments.length} / {MAX_DISBURSAL_ATTACHMENTS} · max 5 MB each
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
                      <a
                        href={file.dataUrl}
                        download={file.name}
                        className="inline-flex h-7 items-center rounded-lg border border-slate-200 px-2 text-[10.5px] font-semibold text-black/60 transition-colors hover:bg-slate-50"
                      >
                        Open
                      </a>
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
                disabled={attachments.length >= MAX_DISBURSAL_ATTACHMENTS}
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
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-black px-8 text-[14px] font-semibold tracking-tight text-white shadow-[0_8px_24px_-10px_rgba(0,0,0,0.45)] transition-all hover:bg-[#0F172A] hover:shadow-[0_10px_28px_-10px_rgba(15,23,42,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none sm:w-auto sm:min-w-[200px]"
          >
            Confirm Payment
          </button>
        </div>
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="bl" padded className={cn(workspacePanelClass, "col-span-12 lg:col-span-4")}>
        <DashboardPanelHeading icon={AlertTriangle} title="Top Pending Obligations" />
        <div className="mt-3 space-y-3">
          {obligations.length === 0 && (
            <div className="rounded-lg border border-dashed border-black/15 bg-[#F4F4F5]/40 px-4 py-6 text-center text-[12px] text-black/55">
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
                    : "bg-[#DBEAFE] text-[#0F172A] hover:bg-[#BFDBFE]"
                }`}
              >
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-semibold">{p.payee}</span>
                  <span className="font-mono">₹ {p.amount.toLocaleString("en-IN")}</span>
                </div>
                <div
                  className={`mt-0.5 flex items-center justify-between text-[10.5px] ${
                    isSelected ? "text-[#991B1B]/75" : "text-black/55"
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
            <div className="mt-1 text-[11.5px] text-black/55">
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
            <div className="py-6 text-center text-[12px] text-black/55">
              No outbound payments recorded yet
            </div>
          )}
          {madePayments.map((payment) => (
            <div key={payment.id} className="py-2.5">
              <div className="flex items-center justify-between gap-2 text-[12.5px]">
                <span className="min-w-0 flex-1 truncate font-medium text-black">
                  {payment.payee}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-black">
                    −₹ {payment.amount.toLocaleString("en-IN")}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      payment.status === "Cleared"
                        ? "bg-[#DBEAFE] text-black"
                        : "bg-black text-[#2563EB]",
                    )}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2 text-[10.5px] text-black/55">
                <span className="min-w-0 truncate">
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
                </span>
                <span className="shrink-0 font-mono">{payment.time}</span>
              </div>
              {(payment.attachments?.length ?? 0) > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {payment.attachments?.map((file) => (
                    <a
                      key={file.id}
                      href={file.dataUrl}
                      download={file.name}
                      className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] px-2 py-0.5 text-[10px] font-medium text-black/70 transition-colors hover:border-black/20 hover:bg-white"
                      title={file.name}
                    >
                      <FileText className="h-3 w-3 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </OrganicCard>

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
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60">
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
              className="h-11 rounded-full bg-black px-6 text-[13px] font-semibold text-white hover:bg-black/85"
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LedgerAnalytics() {
  return (
    <div className="grid grid-cols-12 gap-3 sm:gap-4 lg:gap-5">
      <div className="col-span-6 min-w-0">
        <FinanceDonutCard
          title="Income Distribution"
          cornerSide="tr"
          segments={LEDGER_INCOME_SEGMENTS}
        />
      </div>
      <div className="col-span-6 min-w-0">
        <FinanceDonutCard
          title="Monthly Outflow Breakdown"
          cornerSide="bl"
          segments={LEDGER_OUTFLOW_SEGMENTS}
        />
      </div>
      <div className="col-span-6 min-w-0">
        <FinanceBarCard
          title="Income by Category"
          cornerSide="tr"
          segments={LEDGER_INCOME_SEGMENTS}
        />
      </div>
      <div className="col-span-6 min-w-0">
        <FinanceBarCard
          title="Outflow by Category"
          cornerSide="bl"
          fill="#2563EB"
          segments={LEDGER_OUTFLOW_SEGMENTS}
        />
      </div>
    </div>
  );
}

export function SchoolSettings() {
  const {
    departments,
    setDepartments,
    roles,
    setRoles,
    classes,
    setClasses,
    transportRoutes,
    setTransportRoutes,
    transportVehicles,
    setTransportVehicles,
    paymentCategories,
    setPaymentCategories,
    academicYears,
    setAcademicYears,
    academicYear,
    setAcademicYear,
    themeSettings,
    setThemeSettings,
    schoolDetails,
    setSchoolDetails,
    staff,
    setStaff,
    students,
    setStudents,
  } = useTenantStore();

  return (
    <div className="w-full space-y-6 lg:space-y-6">
      <MobileSectionTitle className="md:hidden">Settings</MobileSectionTitle>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12">
          <SchoolDetailsCard
            schoolDetails={schoolDetails}
            setSchoolDetails={setSchoolDetails}
            themeSettings={themeSettings}
            setThemeSettings={setThemeSettings}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <ClassesCard
          classes={classes}
          setClasses={setClasses}
          students={students}
          setStudents={setStudents}
        />
        <DepartmentsCard
          departments={departments}
          setDepartments={setDepartments}
          staff={staff}
          setStaff={setStaff}
          roles={roles}
        />
        <RolesCard
          roles={roles}
          setRoles={setRoles}
          departments={departments}
          staff={staff}
          setStaff={setStaff}
        />
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12">
          <VehicleCard
            transportVehicles={transportVehicles}
            setTransportVehicles={setTransportVehicles}
            transportRoutes={transportRoutes}
          />
        </div>
        <div className="col-span-12">
          <TransportCard
            transportRoutes={transportRoutes}
            setTransportRoutes={setTransportRoutes}
            transportVehicles={transportVehicles}
            setTransportVehicles={setTransportVehicles}
          />
        </div>
        <div className="col-span-12">
          <FeeCategoriesCard
            paymentCategories={paymentCategories}
            setPaymentCategories={setPaymentCategories}
          />
        </div>
        <div className="col-span-12">
          <CategoriesCard
            academicYears={academicYears}
            setAcademicYears={setAcademicYears}
            academicYear={academicYear}
            setAcademicYear={setAcademicYear}
            themeSettings={themeSettings}
            setThemeSettings={setThemeSettings}
          />
        </div>
      </div>
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
        <div className="truncate text-[18px] font-bold leading-tight tracking-tight text-slate-900 lg:text-black">
          {title}
        </div>
        <p className="mt-1 text-[12px] text-slate-500 lg:text-black/55">{subtitle}</p>
      </div>
      <button
        onClick={onAction}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-[#2563EB] to-[#4C69A4] px-3 py-2 text-[11.5px] font-semibold text-white shadow-md shadow-blue-900/15 transition-all hover:opacity-95"
        aria-label={actionLabel}
      >
        <Plus className="h-3.5 w-3.5" /> Add
      </button>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-black/15 bg-[#F4F4F5]/40 px-4 py-6 text-center text-[12px] text-black/55">
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
          <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60">
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
      setDepartments((prev) => prev.map((d) => (d.id === editingId ? { ...d, name, code } : d)));
      if (previous && previous.name !== name) {
        setStaff((prev) => prev.map((s) => (s.dept === previous.name ? { ...s, dept: name } : s)));
      }
      toast.success(`Department updated · ${name}`);
    } else {
      const nextId = `DEP-${(departments.length + 1).toString().padStart(3, "0")}`;
      setDepartments((prev) => [...prev, { id: nextId, name, code }]);
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
          const count = staff.filter((s) => s.dept === d.name).length;
          return (
            <div
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-black text-[10.5px] font-semibold text-white">
                  {d.code.slice(0, 3)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-black">{d.name}</div>
                  <div className="font-mono text-[10.5px] uppercase tracking-wider text-black/45">
                    {d.code}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 font-mono text-[10px] font-semibold text-black sm:px-2.5 sm:text-[11px]">
                  <span className="sm:hidden">{count}</span>
                  <span className="hidden sm:inline">{count} staff</span>
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(d)}
                  aria-label={`Rename ${d.name}`}
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 transition-colors hover:border-black/20 hover:bg-[#F4F4F5] hover:text-black"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(d)}
                  aria-label={`Delete ${d.name}`}
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
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
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
        title="Roles"
        subtitle={`${roles.length} role definitions · select in Recruit Staff`}
        actionLabel="Add Role"
        onAction={startCreate}
      />

      <div className="mt-4 space-y-2">
        {roles.length === 0 && <EmptyRow label="No roles defined yet" />}
        {roles.map((r) => {
          const dept = departments.find((d) => d.id === r.departmentId);
          return (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-black">{r.title}</div>
                <div className="text-[11.5px] text-black/55">{dept?.name ?? "Unassigned"}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => startEdit(r)}
                  aria-label={`Rename ${r.title}`}
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 transition-colors hover:border-black/20 hover:bg-[#F4F4F5] hover:text-black"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(r)}
                  aria-label={`Delete ${r.title}`}
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
        title="Delete Role"
        description={
          pendingDelete
            ? `Are you sure you want to delete the role "${pendingDelete.title}"? This action cannot be undone.`
            : "Are you sure you want to delete this role?"
        }
        onConfirm={confirmDelete}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Rename Role" : "Add Role"}</DialogTitle>
            <DialogDescription>
              Roles defined here become selectable inside the Recruit Staff workflow.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Role Title
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Chemistry · HOD"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
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
}: {
  classes: ClassConfig[];
  setClasses: React.Dispatch<React.SetStateAction<ClassConfig[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ClassConfig | null>(null);
  const [form, setForm] = useState<{
    className: string;
    tuitionFeeAmount: string;
    billingCycle: ClassConfig["billingCycle"];
  }>({ className: "", tuitionFeeAmount: "", billingCycle: "Monthly" });

  const startCreate = () => {
    setEditingId(null);
    setForm({ className: "", tuitionFeeAmount: "", billingCycle: "Monthly" });
    setOpen(true);
  };
  const startEdit = (c: ClassConfig) => {
    setEditingId(c.id);
    setForm({
      className: c.className,
      tuitionFeeAmount: String(c.tuitionFeeAmount),
      billingCycle: c.billingCycle,
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const className = form.className.trim();
    const tuitionFeeAmount = Number(form.tuitionFeeAmount);
    if (!className) {
      toast.error("Class name is required");
      return;
    }
    if (!tuitionFeeAmount || tuitionFeeAmount <= 0) {
      toast.error("Tuition fee must be a positive amount");
      return;
    }
    if (editingId) {
      const previous = classes.find((c) => c.id === editingId);
      setClasses((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, className, tuitionFeeAmount, billingCycle: form.billingCycle }
            : c,
        ),
      );
      if (previous && previous.className !== className) {
        setStudents((prev) =>
          prev.map((s) => (s.cls === previous.className ? { ...s, cls: className } : s)),
        );
      }
      toast.success(`${className} updated`, {
        description: `Receipts will prefill ₹ ${tuitionFeeAmount.toLocaleString("en-IN")}`,
      });
    } else {
      const nextId = `CLS-${(classes.length + 1).toString().padStart(3, "0")}`;
      setClasses((prev) => [
        ...prev,
        { id: nextId, className, tuitionFeeAmount, billingCycle: form.billingCycle },
      ]);
      toast.success(`${className} added`);
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
        title="Class Tiers & Tuition"
        subtitle="Receipt amounts prefill from this matrix"
        actionLabel="Add Class"
        onAction={startCreate}
      />

      <div className="mt-4 space-y-2">
        {classes.length === 0 && <EmptyRow label="No class tiers configured" />}
        {classes.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5"
          >
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-black">{c.className}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-black/55">
                <span className="font-mono text-black">
                  ₹ {c.tuitionFeeAmount.toLocaleString("en-IN")}
                </span>
                <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10.5px] font-semibold text-black">
                  {c.billingCycle}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => startEdit(c)}
                aria-label={`Edit ${c.className}`}
                className="grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 transition-colors hover:border-black/20 hover:bg-[#F4F4F5] hover:text-black"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPendingDelete(c)}
                aria-label={`Delete ${c.className}`}
                className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <DeleteConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title="Delete Class Tier"
        description={
          pendingDelete
            ? `Are you sure you want to delete ${pendingDelete.className}? Tuition prefill for this class will stop working.`
            : "Are you sure you want to delete this class tier?"
        }
        onConfirm={confirmDelete}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Class Tier" : "Add Class Tier"}</DialogTitle>
            <DialogDescription>
              Tuition fees set here drive the prefill amount inside Finance · Receive Payment.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Class / Grade Name
              </Label>
              <Input
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
                placeholder="e.g. Grade 8 - B"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                  Tuition Fee (₹)
                </Label>
                <Input
                  inputMode="numeric"
                  value={form.tuitionFeeAmount}
                  onChange={(e) =>
                    setForm({ ...form, tuitionFeeAmount: e.target.value.replace(/[^0-9]/g, "") })
                  }
                  placeholder="0"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                  Billing Cycle
                </Label>
                <FieldSelect
                  value={form.billingCycle}
                  onValueChange={(billingCycle) =>
                    setForm({
                      ...form,
                      billingCycle: billingCycle as ClassConfig["billingCycle"],
                    })
                  }
                  options={[
                    { value: "Monthly", label: "Monthly" },
                    { value: "Annually", label: "Annually" },
                  ]}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
                {editingId ? "Save" : "Add Class"}
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
}: {
  transportVehicles: TransportVehicle[];
  setTransportVehicles: React.Dispatch<React.SetStateAction<TransportVehicle[]>>;
  transportRoutes: TransportRoute[];
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TransportVehicle | null>(null);
  const [form, setForm] = useState({
    name: "",
    registrationNo: "",
    capacity: "",
    driverName: "",
    driverPhone: "",
    routeIds: [] as string[],
    active: true,
  });

  const routeLabel = (routeId: string) => {
    const route = transportRoutes.find((r) => r.id === routeId);
    return route ? `${route.mapFrom} → ${route.mapTo}` : routeId;
  };

  const routesLabel = (routeIds: string[]) => {
    if (routeIds.length === 0) return "—";
    return routeIds.map(routeLabel).join(", ");
  };

  const toggleRoute = (routeId: string) => {
    setForm((prev) => ({
      ...prev,
      routeIds: prev.routeIds.includes(routeId)
        ? prev.routeIds.filter((id) => id !== routeId)
        : [...prev.routeIds, routeId],
    }));
  };

  const startCreate = () => {
    setEditingId(null);
    setForm({
      name: "",
      registrationNo: "",
      capacity: "",
      driverName: "",
      driverPhone: "",
      routeIds: [],
      active: true,
    });
    setOpen(true);
  };

  const startEdit = (v: TransportVehicle) => {
    setEditingId(v.id);
    setForm({
      name: v.name,
      registrationNo: v.registrationNo,
      capacity: String(v.capacity),
      driverName: v.driverName ?? "",
      driverPhone: v.driverPhone ?? "",
      routeIds: [...v.routeIds],
      active: v.active,
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
    const payload = {
      name,
      registrationNo,
      capacity,
      driverName: form.driverName.trim() || undefined,
      driverPhone: form.driverPhone.trim() || undefined,
      routeIds: form.routeIds,
      active: form.active,
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
    remove(pendingDelete);
    setPendingDelete(null);
  };

  const activeCount = transportVehicles.filter((v) => v.active).length;

  return (
    <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass}>
      <CardHeader
        title="Vehicle Management"
        subtitle={`${activeCount} active · ${transportVehicles.length} total in fleet`}
        actionLabel="Add Vehicle"
        onAction={startCreate}
      />

      <div className="mt-4 overflow-x-auto rounded-lg border border-[#EFEFEF]">
        <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[18%]" />
            <col className="w-[8%]" />
            <col className="w-[30%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead>
            <tr className="bg-[#F4F4F5] text-[10px] font-semibold uppercase tracking-wider text-black/55">
              <th className="px-3.5 py-2 font-semibold">Vehicle</th>
              <th className="px-3.5 py-2 font-semibold">Registration</th>
              <th className="px-3.5 py-2 text-right font-semibold">Seats</th>
              <th className="px-3.5 py-2 font-semibold">Assigned Routes</th>
              <th className="px-3.5 py-2 font-semibold">Status</th>
              <th className="px-3.5 py-2 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {transportVehicles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3.5 py-6 text-center text-[12px] text-black/55">
                  No vehicles in fleet yet
                </td>
              </tr>
            ) : (
              transportVehicles.map((v) => (
                <tr key={v.id} className="border-t border-[#EFEFEF] text-[12.5px]">
                  <td className="px-3.5 py-2.5 align-middle">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate font-medium text-black">
                        <Bus className="h-3.5 w-3.5 shrink-0 text-black/40" />
                        {v.name}
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
                        v.active ? "bg-[#2563EB] text-white" : "bg-black/10 text-black/50",
                      )}
                    >
                      {v.active ? "Active" : "Idle"}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 align-middle">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(v)}
                        aria-label={`Edit vehicle ${v.name}`}
                        className="grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 transition-colors hover:border-black/20 hover:bg-[#F4F4F5] hover:text-black"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(v)}
                        aria-label={`Delete vehicle ${v.name}`}
                        className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
            <DialogDescription>
              Register buses and vans, assign drivers, and link each vehicle to one or more transport
              routes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Assigned Routes
              </Label>
              {transportRoutes.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[#E5E5E5] px-3 py-4 text-center text-[12px] text-black/45">
                  No routes configured yet
                </p>
              ) : (
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-2">
                  {transportRoutes.map((r) => {
                    const checked = form.routeIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 rounded-xl px-2.5 py-2 transition-colors",
                          checked ? "bg-[#DBEAFE]" : "hover:bg-white",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRoute(r.id)}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20 accent-black"
                        />
                        <span className="min-w-0 text-[12px] leading-snug text-black">
                          {r.mapFrom} → {r.mapTo}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="text-[10.5px] text-black/45">
                {form.routeIds.length === 0
                  ? "No routes selected"
                  : `${form.routeIds.length} route${form.routeIds.length === 1 ? "" : "s"} selected`}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Driver Phone
              </Label>
              <Input
                value={form.driverPhone}
                onChange={(e) => setForm({ ...form, driverPhone: e.target.value })}
                placeholder="Optional"
                className="font-mono"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2.5">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-black/20 accent-black"
              />
              <span className="text-[13px] font-medium text-black">Active in fleet</span>
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
                {editingId ? "Save" : "Add Vehicle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrganicCard>
  );
}

function TransportCard({
  transportRoutes,
  setTransportRoutes,
  transportVehicles,
  setTransportVehicles,
}: {
  transportRoutes: TransportRoute[];
  setTransportRoutes: React.Dispatch<React.SetStateAction<TransportRoute[]>>;
  transportVehicles: TransportVehicle[];
  setTransportVehicles: React.Dispatch<React.SetStateAction<TransportVehicle[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TransportRoute | null>(null);
  const [form, setForm] = useState({
    mapFrom: "",
    mapTo: "",
    morningFee: "",
    eveningFee: "",
    bothFee: "",
  });

  const vehiclesForRoute = (routeId: string) =>
    transportVehicles.filter((v) => v.routeIds.includes(routeId));

  const startCreate = () => {
    setEditingId(null);
    setForm({ mapFrom: "", mapTo: "", morningFee: "", eveningFee: "", bothFee: "" });
    setOpen(true);
  };

  const startEdit = (r: TransportRoute) => {
    setEditingId(r.id);
    setForm({
      mapFrom: r.mapFrom,
      mapTo: r.mapTo,
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
    const payload = { mapFrom, mapTo, morningFee, eveningFee, bothFee };
    if (editingId) {
      setTransportRoutes((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...payload } : r)),
      );
      toast.success(`Route updated · ${mapFrom} → ${mapTo}`);
    } else {
      const nextId = `TR-${(transportRoutes.length + 1).toString().padStart(3, "0")}`;
      setTransportRoutes((prev) => [...prev, { id: nextId, ...payload }]);
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
            <tr className="bg-[#F4F4F5] text-[10px] font-semibold uppercase tracking-wider text-black/55">
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
                <td colSpan={7} className="px-3.5 py-6 text-center text-[12px] text-black/55">
                  No routes mapped yet
                </td>
              </tr>
            ) : (
              transportRoutes.map((r) => {
                const vehicles = vehiclesForRoute(r.id);
                const vehicleNames =
                  vehicles.length === 0 ? "—" : vehicles.map((v) => v.name).join(", ");
                return (
                  <tr key={r.id} className="border-t border-[#EFEFEF] text-[12.5px]">
                    <td className="px-3.5 py-2.5 align-middle">
                      <span className="block truncate text-black">{r.mapFrom}</span>
                    </td>
                    <td className="px-3.5 py-2.5 align-middle">
                      <span className="block truncate text-black/75">{r.mapTo}</span>
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
                      <span className="block truncate text-[11px] text-black/60" title={vehicleNames}>
                        {vehicleNames}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 align-middle">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(r)}
                          aria-label={`Edit route ${r.mapFrom} to ${r.mapTo}`}
                          className="grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 transition-colors hover:border-black/20 hover:bg-[#F4F4F5] hover:text-black"
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Route" : "Add Transport Route"}</DialogTitle>
            <DialogDescription>
              Set pickup → drop pairs with separate morning, evening, and combined shift fees. The
              both-shift fee prefills Vehicle Fee on Receive Payment.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Map From (Pickup Hub)
              </Label>
              <Input
                value={form.mapFrom}
                onChange={(e) => setForm({ ...form, mapFrom: e.target.value })}
                placeholder="e.g. Lotus Greens Sector 21"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Map To (Destination Node)
              </Label>
              <Input
                value={form.mapTo}
                onChange={(e) => setForm({ ...form, mapTo: e.target.value })}
                placeholder="e.g. Main Campus Drop-off"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
                {editingId ? "Save" : "Add Route"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrganicCard>
  );
}

function readImageAsDataUrl(
  file: File,
  opts: { maxBytes: number; label: string },
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error(`Please choose a JPG, PNG, or WebP ${opts.label}`));
      return;
    }
    if (file.size > opts.maxBytes) {
      reject(
        new Error(
          `${opts.label} must be ${Math.round(opts.maxBytes / (1024 * 1024))} MB or smaller`,
        ),
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      if (!dataUrl) {
        reject(new Error(`Could not read the selected ${opts.label.toLowerCase()}`));
        return;
      }
      resolve(dataUrl);
    };
    reader.onerror = () =>
      reject(new Error(`Could not read the selected ${opts.label.toLowerCase()}`));
    reader.readAsDataURL(file);
  });
}

function SchoolDetailsCard({
  schoolDetails,
  setSchoolDetails,
  themeSettings,
  setThemeSettings,
}: {
  schoolDetails: SchoolDetails;
  setSchoolDetails: React.Dispatch<React.SetStateAction<SchoolDetails>>;
  themeSettings: ThemeSettings;
  setThemeSettings: React.Dispatch<React.SetStateAction<ThemeSettings>>;
}) {
  const { updateSession } = useAuth();
  const [draft, setDraft] = useState<SchoolDetails>(schoolDetails);
  const [themeDraft, setThemeDraft] = useState<Pick<ThemeSettings, "mode" | "accent">>({
    mode: themeSettings.mode,
    accent: themeSettings.accent,
  });
  const logoInputRef = useRef<HTMLInputElement>(null);
  const letterheadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(schoolDetails);
  }, [schoolDetails]);

  useEffect(() => {
    setThemeDraft({ mode: themeSettings.mode, accent: themeSettings.accent });
  }, [themeSettings.mode, themeSettings.accent]);

  const detailsDirty = JSON.stringify(draft) !== JSON.stringify(schoolDetails);
  const themeDirty =
    themeDraft.mode !== themeSettings.mode || themeDraft.accent !== themeSettings.accent;
  const dirty = detailsDirty || themeDirty;
  const initials = schoolInitials(draft.name || "School");

  const patch = <K extends keyof SchoolDetails>(key: K, value: SchoolDetails[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const name = draft.name.trim();
    if (!name) {
      toast.error("School name is required");
      return;
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
    setSchoolDetails(next);
    if (themeDirty) {
      setThemeSettings((prev) => ({
        ...prev,
        mode: themeDraft.mode,
        accent: themeDraft.accent,
      }));
    }
    updateSession({ tenantName: next.name });
    toast.success("School details saved", {
      description: `${next.name} · ${themeDraft.mode} · ${themeDraft.accent}`,
    });
  };

  const onLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file, {
        maxBytes: 2 * 1024 * 1024,
        label: "Logo",
      });
      patch("logoUrl", dataUrl);
      toast.success("Logo ready — click Save Changes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload logo");
    }
  };

  const onLetterhead = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file, {
        maxBytes: 3 * 1024 * 1024,
        label: "Letterhead",
      });
      patch("letterheadUrl", dataUrl);
      toast.success("Letterhead ready — click Save Changes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload letterhead");
    }
  };

  return (
    <OrganicCard tone="white" cornerSide="br" padded className={workspacePanelClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-[18px] font-bold leading-tight tracking-tight text-black">
            School Details
          </div>
          <p className="mt-1 text-[12px] text-black/55">
            Logo, letterhead, identity, theme, and accent used across the workspace
          </p>
        </div>
        {dirty && (
          <span className="w-fit shrink-0 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#B45309]">
            Unsaved
          </span>
        )}
      </div>

      <form onSubmit={save} className="mt-4 space-y-5">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] p-3 sm:col-span-6 lg:col-span-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                Logo
              </span>
              <div className="flex items-center gap-1">
                {draft.logoUrl && (
                  <button
                    type="button"
                    onClick={() => patch("logoUrl", undefined)}
                    className="grid h-7 w-7 place-items-center rounded-full text-black/45 hover:bg-[#FEE2E2] hover:text-[#EF4444]"
                    aria-label="Remove logo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-[11px] font-semibold text-black shadow-sm ring-1 ring-black/10 hover:bg-black hover:text-white"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  Upload
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              {draft.logoUrl ? (
                <img
                  src={draft.logoUrl}
                  alt="School logo"
                  className="h-14 w-14 rounded-lg object-cover ring-1 ring-black/10"
                />
              ) : (
                <div className="grid h-14 w-14 place-items-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#4C69A4] text-[13px] font-bold text-white">
                  {initials}
                </div>
              )}
              <p className="text-[11px] leading-relaxed text-black/50">
                Shown on the navigation dock and headers. JPG/PNG · max 2 MB.
              </p>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={onLogo}
            />
          </div>

          <div className="col-span-12 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] p-3 sm:col-span-6 lg:col-span-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                Letterhead
              </span>
              <div className="flex items-center gap-1">
                {draft.letterheadUrl && (
                  <button
                    type="button"
                    onClick={() => patch("letterheadUrl", undefined)}
                    className="grid h-7 w-7 place-items-center rounded-full text-black/45 hover:bg-[#FEE2E2] hover:text-[#EF4444]"
                    aria-label="Remove letterhead"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => letterheadInputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-[11px] font-semibold text-black shadow-sm ring-1 ring-black/10 hover:bg-black hover:text-white"
                >
                  <FileImage className="h-3.5 w-3.5" />
                  Upload
                </button>
              </div>
            </div>
            <div className="mt-3">
              {draft.letterheadUrl ? (
                <img
                  src={draft.letterheadUrl}
                  alt="School letterhead"
                  className="h-16 w-full rounded-xl object-cover object-top ring-1 ring-black/10"
                />
              ) : (
                <div className="flex h-16 items-center justify-center rounded-xl border border-dashed border-black/15 bg-white px-3 text-center text-[11px] text-black/45">
                  Wide image for receipts & PDFs · max 3 MB
                </div>
              )}
            </div>
            <input
              ref={letterheadInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={onLetterhead}
            />
          </div>

          <div className="col-span-12 grid grid-cols-1 gap-3 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] p-3 sm:grid-cols-2 lg:col-span-4">
            <ThemeSelect
              label="Theme"
              value={themeDraft.mode}
              options={THEME_MODE_OPTIONS}
              onChange={(mode) => setThemeDraft((prev) => ({ ...prev, mode }))}
            />
            <ThemeSelect
              label="Accent Color"
              value={themeDraft.accent}
              options={THEME_ACCENT_OPTIONS}
              onChange={(accent) => setThemeDraft((prev) => ({ ...prev, accent }))}
            />
            <p className="text-[11px] leading-relaxed text-black/50 sm:col-span-2">
              Theme mode and accent color apply across the tenant workspace.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 lg:col-span-4">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Registration No.
            </Label>
            <Input
              value={draft.registrationNo}
              onChange={(e) => patch("registrationNo", e.target.value)}
              className="mt-1.5 font-mono text-[12.5px]"
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Affiliation No.
            </Label>
            <Input
              value={draft.affiliationNo}
              onChange={(e) => patch("affiliationNo", e.target.value)}
              className="mt-1.5 font-mono text-[12.5px]"
            />
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-6">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Principal
            </Label>
            <Input
              value={draft.principalName}
              onChange={(e) => patch("principalName", e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-6">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
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

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            disabled={!dirty}
            className="w-full rounded-full bg-black text-white hover:bg-black/85 disabled:opacity-40 sm:w-auto"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </OrganicCard>
  );
}

function FeeCategoriesCard({
  paymentCategories,
  setPaymentCategories,
}: {
  paymentCategories: PaymentCategory[];
  setPaymentCategories: React.Dispatch<React.SetStateAction<PaymentCategory[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PaymentCategory | null>(null);
  const [label, setLabel] = useState("");

  const startCreate = () => {
    setEditingId(null);
    setLabel("");
    setOpen(true);
  };

  const startEdit = (category: PaymentCategory) => {
    setEditingId(category.id);
    setLabel(category.label);
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextLabel = label.trim();
    if (!nextLabel) {
      toast.error("Fee category name is required");
      return;
    }
    const duplicate = paymentCategories.some(
      (c) =>
        c.label.toLowerCase() === nextLabel.toLowerCase() &&
        c.id !== editingId,
    );
    if (duplicate) {
      toast.error(`${nextLabel} already exists`);
      return;
    }

    if (editingId) {
      setPaymentCategories((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, label: nextLabel } : c)),
      );
      toast.success(`Fee category updated · ${nextLabel}`, {
        description: "Shown on Receive Payment selectors",
      });
    } else {
      const maxNum = paymentCategories.reduce((max, c) => {
        const match = /^PC-(\d+)$/.exec(c.id);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0);
      const nextId = `PC-${(maxNum + 1).toString().padStart(3, "0")}`;
      setPaymentCategories((prev) => [...prev, { id: nextId, label: nextLabel }]);
      toast.success(`Fee category added · ${nextLabel}`, {
        description: "Now selectable on Receive Payment",
      });
    }
    setOpen(false);
  };

  const remove = (category: PaymentCategory) => {
    setPaymentCategories((prev) => prev.filter((c) => c.id !== category.id));
    toast.error(`${category.label} removed`, {
      description: "Existing receipts retain the label",
    });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    remove(pendingDelete);
    setPendingDelete(null);
  };

  return (
    <OrganicCard tone="white" cornerSide="bl" padded className={workspacePanelClass}>
      <CardHeader
        title="Fee Categories"
        subtitle={`${paymentCategories.length} categories · used on Receive Payment`}
        actionLabel="Add Fee Category"
        onAction={startCreate}
      />

      <div className="mt-4 space-y-2">
        {paymentCategories.length === 0 && <EmptyRow label="No fee categories yet" />}
        {paymentCategories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#DBEAFE] text-[10.5px] font-semibold text-[#2563EB]">
                {category.label.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-black">{category.label}</div>
                <div className="font-mono text-[10.5px] uppercase tracking-wider text-black/45">
                  {category.id}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => startEdit(category)}
                className="grid h-8 w-8 place-items-center rounded-full text-black/55 transition-colors hover:bg-black hover:text-white"
                aria-label={`Edit ${category.label}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPendingDelete(category)}
                className="grid h-8 w-8 place-items-center rounded-full text-black/55 transition-colors hover:bg-[#EF4444] hover:text-white"
                aria-label={`Delete ${category.label}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setEditingId(null);
            setLabel("");
          }
        }}
      >
        <DialogContent className="max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">
              {editingId ? "Edit Fee Category" : "Add Fee Category"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60">
              Categories appear as chips on Receive Payment · Fee Categories.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Category Name
              </Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Lab Fee"
                className="mt-1.5"
                autoFocus
              />
            </div>
            <DialogFooter className="flex-row justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
                {editingId ? "Save Changes" : "Add Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title="Delete Fee Category"
        description={
          pendingDelete
            ? `Are you sure you want to remove "${pendingDelete.label}" from fee categories? Existing receipts will keep this label.`
            : "Are you sure you want to delete this fee category?"
        }
        onConfirm={confirmDelete}
      />
    </OrganicCard>
  );
}

function CategoriesCard({
  academicYears,
  setAcademicYears,
  academicYear,
  setAcademicYear,
  themeSettings,
  setThemeSettings,
}: {
  academicYears: string[];
  setAcademicYears: React.Dispatch<React.SetStateAction<string[]>>;
  academicYear: string;
  setAcademicYear: React.Dispatch<React.SetStateAction<string>>;
  themeSettings: ThemeSettings;
  setThemeSettings: React.Dispatch<React.SetStateAction<ThemeSettings>>;
}) {
  const [yearDraft, setYearDraft] = useState("");
  const [pendingYearDelete, setPendingYearDelete] = useState<string | null>(null);

  const addAcademicYear = (e: React.FormEvent) => {
    e.preventDefault();
    const nextLabel = normalizeAcademicYearLabel(yearDraft);
    if (!nextLabel) return;
    if (academicYears.some((y) => y.toLowerCase() === nextLabel.toLowerCase())) {
      toast.error(`${nextLabel} already exists`);
      return;
    }
    setAcademicYears((prev) => [...prev, nextLabel]);
    setAcademicYear(nextLabel);
    toast.success(`Academic year added · ${nextLabel}`, {
      description: "Set as the active academic year",
    });
    setYearDraft("");
  };

  const removeAcademicYear = (year: string) => {
    if (academicYears.length <= 1) {
      toast.error("At least one academic year is required");
      return;
    }
    const next = academicYears.filter((y) => y !== year);
    setAcademicYears(next);
    if (academicYear === year) {
      setAcademicYear(next[0] ?? year);
    }
    toast.error(`${year} removed`);
  };

  const confirmYearDelete = () => {
    if (!pendingYearDelete) return;
    removeAcademicYear(pendingYearDelete);
    setPendingYearDelete(null);
  };

  return (
    <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass}>
      <div className="text-[18px] font-bold leading-tight tracking-tight text-black">
        System Constants
      </div>
      <p className="mt-1 text-[12px] text-black/55">
        Academic year, workspace density, and navigation dock placement
      </p>

      <div className="mt-4 grid gap-3 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] p-3.5">
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Academic Year
            </Label>
            <span className="font-mono text-[10.5px] text-black/45">
              {academicYears.length} defined
            </span>
          </div>
          <FieldSelect
            value={academicYear}
            onValueChange={(y) => {
              setAcademicYear(y);
              toast.success(`Academic year set to ${y}`);
            }}
            options={academicYears.map((y) => ({ value: y, label: y }))}
            className="mt-1.5 font-medium"
          />

          <div className="mt-2 flex flex-wrap gap-2">
            {academicYears.map((y) => (
              <span
                key={y}
                className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1 text-[12px] font-semibold text-black"
              >
                {y}
                {y === academicYear && (
                  <span className="rounded-full bg-[#10B981]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#10B981]">
                    Active
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setPendingYearDelete(y)}
                  className="grid h-4 w-4 place-items-center rounded-full text-black/55 hover:bg-black hover:text-white disabled:pointer-events-none disabled:opacity-40"
                  aria-label={`Remove ${y}`}
                  disabled={academicYears.length <= 1}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={addAcademicYear} className="mt-3 flex gap-2">
            <Input
              value={yearDraft}
              onChange={(e) => setYearDraft(e.target.value)}
              placeholder="e.g. 2027-28"
              className="flex-1"
            />
            <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
              <Plus className="mr-1 h-3.5 w-3.5" /> Add
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ThemeSelect
            label="Density"
            value={themeSettings.density}
            options={THEME_DENSITY_OPTIONS}
            onChange={(density) => {
              setThemeSettings((prev) => ({ ...prev, density }));
              toast.success(`Workspace density set to ${density}`);
            }}
          />
          <ThemeSelect
            label="Navigation"
            value={themeSettings.navPlacement ?? "Left"}
            options={THEME_NAV_PLACEMENT_OPTIONS}
            onChange={(navPlacement) => {
              setThemeSettings((prev) => ({ ...prev, navPlacement }));
              toast.success(`Navigation dock moved to ${navPlacement}`);
            }}
          />
        </div>
      </div>

      <DeleteConfirmDialog
        open={Boolean(pendingYearDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingYearDelete(null);
        }}
        title="Delete Academic Year"
        description={
          pendingYearDelete
            ? `Are you sure you want to remove "${pendingYearDelete}" from academic years?${
                pendingYearDelete === academicYear
                  ? " The next year in the list will become active."
                  : ""
              }`
            : "Are you sure you want to delete this academic year?"
        }
        onConfirm={confirmYearDelete}
      />
    </OrganicCard>
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
  searchable = false,
  searchPlaceholder = "Search…",
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const resolvedValue = options.some((o) => o.value === value) ? value : undefined;
  const selectedLabel = options.find((o) => o.value === resolvedValue)?.label;

  if (!searchable) {
    return (
      <div className={className}>
        <Select value={resolvedValue} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger
            className={cn(
              "h-10 w-full rounded-lg border border-[#E5E5E5] bg-white px-3 text-[13px] font-normal text-black shadow-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-0",
              triggerClassName,
            )}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent
            position="popper"
            className="z-[250] rounded-lg border border-[#E5E5E5] bg-white p-1.5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)]"
          >
            {options.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="cursor-pointer rounded-md py-2 pl-3 pr-8 text-[13px] text-black focus:bg-[#DBEAFE] focus:text-black data-[highlighted]:bg-[#DBEAFE] data-[highlighted]:text-black data-[state=checked]:bg-[#2563EB] data-[state=checked]:font-semibold data-[state=checked]:text-white"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-lg border border-[#E5E5E5] bg-white px-3 text-left text-[13px] font-normal text-black shadow-none transition-colors hover:bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
              triggerClassName,
            )}
          >
            <span className={cn("truncate", !selectedLabel && "text-black/45")}>
              {selectedLabel ?? placeholder}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="z-[250] w-[var(--radix-popover-trigger-width)] rounded-lg border border-[#E5E5E5] bg-white p-0 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)]"
        >
          <Command className="rounded-lg bg-white">
            <CommandInput placeholder={searchPlaceholder} className="h-10 text-[13px]" />
            <CommandList className="max-h-56">
              <CommandEmpty className="py-4 text-center text-[12px] text-slate-500">
                No matches found
              </CommandEmpty>
              <CommandGroup className="p-1.5">
                {options.map((opt) => {
                  const active = opt.value === resolvedValue;
                  return (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      onSelect={() => {
                        onValueChange(opt.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "cursor-pointer rounded-md px-3 py-2 text-[13px]",
                        active
                          ? "bg-[#2563EB] font-semibold text-white data-[selected=true]:bg-[#2563EB] data-[selected=true]:text-white"
                          : "text-black data-[selected=true]:bg-[#DBEAFE] data-[selected=true]:text-black",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{opt.label}</span>
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
