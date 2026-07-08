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
  ChevronDown,
  ArrowDownToLine,
  ArrowUpFromLine,
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
  Bus,
} from "lucide-react";
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
  ACADEMIC_YEAR_OPTIONS,
  DEFAULT_STAFF_DOCUMENTS,
  THEME_ACCENT_OPTIONS,
  THEME_DENSITY_OPTIONS,
  THEME_MODE_OPTIONS,
  useTenantStore,
  type ClassConfig,
  type Department,
  type Payment,
  type PaymentCategory,
  type Role,
  type Staff,
  type Student,
  type ThemeSettings,
  type TransportRoute,
  type TransportVehicle,
  type TenantNotification,
} from "@/lib/tenant-store";
import { StudentProfileDetail } from "@/components/school/StudentProfileDetail";
import { StaffProfileDetail } from "@/components/school/StaffProfileDetail";
import { EnrollmentStatusBadge, isRecordActive } from "@/components/school/ProfileAccountActions";
import { FinanceBarCard, FinanceDonutCard } from "@/components/school/finance-charts";
import {
  BalanceSheetReport,
  GeneralLedgerReport,
  ProfitLossReport,
} from "@/components/school/FinanceReports";
import { downloadCsv, downloadReceiptPdf } from "@/lib/finance-export";
import {
  bankBalance,
  cashOnHand,
  formatInr,
  salaryPayable,
  totalOperatingExpense,
} from "@/lib/dashboard-finance";
import {
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
type MadePayment = Omit<(typeof MADE_PAYMENTS)[number], "status"> & {
  status: "Queued" | "Cleared";
};

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
        <SelectTrigger className="h-10 w-full rounded-full border-[#E5E5E5] bg-white">
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
        <div className="grid grid-cols-1 gap-2">
          <Input
            type="date"
            value={customRange.from}
            onChange={(event) =>
              onCustomRangeChange({ ...customRange, from: event.target.value })
            }
            className="h-9 w-full rounded-full border-[#E5E5E5] bg-white"
          />
          <Input
            type="date"
            value={customRange.to}
            onChange={(event) =>
              onCustomRangeChange({ ...customRange, to: event.target.value })
            }
            className="h-9 w-full rounded-full border-[#E5E5E5] bg-white"
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

const workspacePanelClass = cn(
  glassCardClass,
  "md:!rounded-3xl lg:organic-card lg:!rounded-[2rem]",
);

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
    <div className="relative flex min-h-[104px] min-w-0 flex-col justify-end rounded-[1.25rem] border border-slate-100/70 bg-white p-3.5 shadow-sm shadow-slate-200/35">
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
        <div className="mt-1 truncate font-mono text-[15px] font-bold leading-tight tracking-tight text-slate-900">
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
  unreadNotifications: number;
  onCollectFee: () => void;
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
  unreadNotifications,
  onCollectFee,
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
          <div className="flex min-h-[112px] min-w-0 flex-col justify-between rounded-[1.25rem] bg-[#D1F2E1] p-4">
            <div className="text-[12px] font-medium text-slate-800">Total Income</div>
            <div className="mt-3 truncate font-mono text-[17px] font-bold leading-tight tracking-tight text-slate-900">
              {formatInr(periodIncome)}
            </div>
          </div>
          <div className="relative flex min-h-[112px] min-w-0 flex-col justify-between overflow-hidden rounded-[1.25rem] bg-[#3B5998] p-4 text-white">
            <TriangleAlert
              className="absolute right-3 top-3 h-4 w-4 text-amber-300"
              strokeWidth={2.25}
              aria-hidden
            />
            <div className="pr-6 text-[12px] font-medium text-white/90">Total Expense</div>
            <div className="mt-3 truncate font-mono text-[17px] font-bold leading-tight tracking-tight text-white">
              {formatInr(expenseTotal)}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full space-y-3">
        <MobileDashboardSectionTitle>Financial Detail</MobileDashboardSectionTitle>
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

      <button
        type="button"
        onClick={onCollectFee}
        className="w-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-center text-[15px] font-semibold tracking-wide text-white shadow-md shadow-blue-200/50 transition-all duration-200 hover:opacity-95"
      >
        Collect Fee
      </button>
    </div>
  );
}

function GlassProgressRing({
  value,
  stroke = "#2563EB",
  label,
}: {
  value: number;
  stroke?: string;
  label: string;
}) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const offset = c - (pct / 100) * c;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg className="h-[88px] w-[88px]" viewBox="0 0 88 88" aria-hidden>
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="7" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
        />
        <text
          x="44"
          y="47"
          textAnchor="middle"
          className="fill-slate-900 text-[13px] font-bold"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {Math.round(pct)}%
        </text>
      </svg>
      <span className="text-[10px] font-medium text-slate-500">{label}</span>
    </div>
  );
}

type GlassModuleCardProps = {
  title: string;
  icon: typeof Users;
  accent: "blue" | "orange";
  stats: { label: string; value: string | number; tone?: "default" | "success" | "danger" }[];
  ringValue: number;
  ringLabel: string;
  actionLabel: string;
  onAction: () => void;
};

function GlassModuleCard({
  title,
  icon: Icon,
  accent,
  stats,
  ringValue,
  ringLabel,
  actionLabel,
  onAction,
}: GlassModuleCardProps) {
  const accentBar = accent === "blue" ? "bg-[#2563EB]" : "bg-orange-500";
  const ringColor = accent === "blue" ? "#2563EB" : "#f97316";

  return (
    <div className={cn(glassCardClass, "relative flex flex-col overflow-hidden p-5")}>
      <div className={cn("absolute inset-x-0 top-0 h-1", accentBar)} />
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/60 shadow-sm">
            <Icon className="h-5 w-5 text-slate-700" strokeWidth={2} />
          </div>
          <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
        </div>
        <GlassProgressRing value={ringValue} stroke={ringColor} label={ringLabel} />
      </div>
      <ul className="mt-4 space-y-2">
        {stats.map((s) => (
          <li key={s.label} className="flex items-center justify-between text-[13px]">
            <span className="text-slate-600">{s.label}</span>
            <span
              className={cn(
                "font-mono font-semibold",
                s.tone === "success" && "text-[#10B981]",
                s.tone === "danger" && "text-[#EF4444]",
                !s.tone && "text-slate-900",
              )}
            >
              {s.value}
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onAction}
        className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#4C69A4] py-3 text-[13px] font-semibold text-white shadow-md shadow-blue-900/15 transition-opacity hover:opacity-95"
      >
        {actionLabel}
      </button>
    </div>
  );
}

type GlassDesktopDashboardProps = {
  students: Student[];
  staff: Staff[];
  periodIncome: number;
  expenseTotal: number;
  totalDue: number;
  salaryOutstanding: number;
  inHand: number;
  inBank: number;
  totalBalance: number;
  overdueStudents: Student[];
  overdueWatchlist: Student[];
  recentReceipts: Payment[];
  unreadNotifications: number;
  notifications: TenantNotification[];
  dashboardTodos: string[];
  setDashboardTodos: React.Dispatch<React.SetStateAction<string[]>>;
  dashboardNote: string;
  setDashboardNote: (v: string) => void;
  period: PaymentPeriod;
  setPeriod: (p: PaymentPeriod) => void;
  customRange: CustomDateRange;
  setCustomRange: (r: CustomDateRange) => void;
  onCollectFee: () => void;
  onViewStudents: () => void;
  onViewStaff: () => void;
};

function GlassDesktopDashboard({
  students,
  staff,
  periodIncome,
  expenseTotal,
  totalDue,
  salaryOutstanding,
  inHand,
  inBank,
  totalBalance,
  overdueStudents,
  overdueWatchlist,
  recentReceipts,
  unreadNotifications,
  notifications,
  dashboardTodos,
  setDashboardTodos,
  dashboardNote,
  setDashboardNote,
  period,
  setPeriod,
  customRange,
  setCustomRange,
  onCollectFee,
  onViewStudents,
  onViewStaff,
}: GlassDesktopDashboardProps) {
  const paidCount = students.filter((s) => s.due === 0).length;
  const overdueCount = students.filter((s) => s.due > 0).length;
  const activeStaff = staff.filter((s) => s.active).length;
  const paidPct = students.length ? (paidCount / students.length) * 100 : 0;
  const activeStaffPct = staff.length ? (activeStaff / staff.length) * 100 : 0;

  const updateTodo = (index: number, value: string) => {
    setDashboardTodos((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const unreadFeed = notifications.filter((n) => !n.read).slice(0, 5);

  return (
    <div className="hidden space-y-5 md:block">
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 space-y-5 xl:col-span-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <GlassModuleCard
              title="All Students"
              icon={Users}
              accent="blue"
              ringValue={paidPct}
              ringLabel="Paid"
              stats={[
                { label: "Enrolled", value: students.length },
                { label: "Paid", value: paidCount, tone: "success" },
                { label: "Overdue", value: overdueCount, tone: "danger" },
              ]}
              actionLabel="View Students"
              onAction={onViewStudents}
            />
            <GlassModuleCard
              title="All Staff"
              icon={Briefcase}
              accent="orange"
              ringValue={activeStaffPct}
              ringLabel="Active"
              stats={[
                { label: "Total", value: staff.length },
                { label: "Active", value: activeStaff, tone: "success" },
                { label: "Inactive", value: staff.length - activeStaff },
              ]}
              actionLabel="View Staff"
              onAction={onViewStaff}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              { label: "Total Income", value: formatInr(periodIncome), tone: "bg-[#D1F2E1]" },
              { label: "Total Expense", value: formatInr(expenseTotal), tone: "bg-[#3B5998] text-white" },
              { label: "Fees Outstanding", value: formatInr(totalDue), tone: "glass-inset" },
              { label: "Cash + Bank", value: formatInr(totalBalance), tone: "glass-inset" },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex min-h-[100px] flex-col justify-between rounded-2xl p-4",
                  item.tone === "glass-inset" ? glassInsetClass : item.tone,
                  item.tone === "bg-[#3B5998] text-white" && "text-white",
                )}
              >
                <div
                  className={cn(
                    "text-[12px] font-medium",
                    item.tone === "bg-[#3B5998] text-white" ? "text-white/90" : "text-slate-600",
                  )}
                >
                  {item.label}
                </div>
                <div className="mt-2 truncate font-mono text-[16px] font-bold leading-tight xl:text-[17px]">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className={cn(glassCardClass, "flex flex-col p-5")}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[15px] font-bold text-slate-900">Overdue Watchlist</h3>
                <span className="rounded-full bg-[#2563EB] px-2.5 py-1 text-[10px] font-semibold text-white">
                  {overdueStudents.length} overdue
                </span>
              </div>
              <div className="mt-4 flex-1 space-y-2">
                {overdueWatchlist.length === 0 && (
                  <div className={cn(glassInsetClass, "px-4 py-6 text-center text-[12px] text-slate-500")}>
                    All student balances are cleared
                  </div>
                )}
                {overdueWatchlist.map((student) => (
                  <div
                    key={student.id}
                    className={cn(glassInsetClass, "flex items-center justify-between gap-3 px-3.5 py-2.5")}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-slate-900">{student.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {student.cls} · {student.id}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-[13px] font-semibold text-slate-900">
                        {formatInr(student.due)}
                      </div>
                      <div className="text-[10px] font-semibold uppercase text-[#EF4444]">Overdue</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={cn(glassCardClass, "flex flex-col p-5")}>
              <h3 className="text-[15px] font-bold text-slate-900">Recent Receipts</h3>
              <p className="mt-1 text-[12px] text-slate-500">
                Latest inbound payments · {recentReceipts.length} shown
              </p>
              <div className="mt-4 flex-1 divide-y divide-white/50">
                {recentReceipts.length === 0 && (
                  <div className="py-6 text-center text-[12px] text-slate-500">No receipts logged yet</div>
                )}
                {recentReceipts.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-slate-900">{payment.name}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {payment.cat} · {payment.mode}
                      </div>
                    </div>
                    <div className="shrink-0 font-mono text-[13px] font-semibold text-slate-900">
                      {formatInr(payment.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="col-span-12 space-y-4 xl:col-span-4">
          <div className={cn(glassPanelClass, "p-5")}>
            <DashboardPeriodFilter
              period={period}
              onPeriodChange={setPeriod}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
            />
            <button
              type="button"
              onClick={onCollectFee}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-[14px] font-semibold text-white shadow-md shadow-blue-200/40 transition-opacity hover:opacity-95"
            >
              Collect Fee
            </button>
          </div>

          <div className={cn(glassCardClass, "p-5")}>
            <div className="mb-3 flex items-center gap-2 border-b border-white/50 pb-3">
              <button type="button" className="text-[13px] font-bold text-[#2563EB]">
                Alerts
              </button>
              <span className="text-[13px] text-slate-400">·</span>
              <span className="text-[13px] font-medium text-slate-500">Notes</span>
            </div>
            {unreadFeed.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-slate-500">No unread alerts</div>
            ) : (
              <ul className="space-y-2">
                {unreadFeed.map((n) => (
                  <li key={n.id} className={cn(glassInsetClass, "px-3 py-2.5 text-[12px]")}>
                    <div className="font-semibold text-slate-800">{n.title}</div>
                    <p className="mt-0.5 line-clamp-2 text-slate-500">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
            {unreadNotifications > 0 && (
              <Link
                to="/tenant/notifications"
                className="mt-3 block text-center text-[12px] font-semibold text-[#2563EB] hover:underline"
              >
                View all {unreadNotifications} alerts
              </Link>
            )}
          </div>

          <div className={cn(glassCardClass, "space-y-3 p-5")}>
            <h3 className="text-[15px] font-bold text-slate-900">To do</h3>
            {dashboardTodos.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-5 text-right text-[11px] font-semibold text-slate-400">{index + 1}.</span>
                <Input
                  value={item}
                  onChange={(e) => updateTodo(index, e.target.value)}
                  placeholder={`Task ${index + 1}`}
                  className={cn(glassInsetClass, "h-9 flex-1 border-white/50 bg-white/40")}
                />
              </div>
            ))}
          </div>

          <div className={cn(glassCardClass, "p-5")}>
            <h3 className="text-[15px] font-bold text-slate-900">Quick Note</h3>
            <Textarea
              value={dashboardNote}
              onChange={(e) => setDashboardNote(e.target.value)}
              placeholder="Write a quick note for today..."
              className={cn(glassInsetClass, "mt-3 min-h-[120px] resize-none border-white/50 bg-white/40")}
            />
          </div>
        </aside>
      </div>
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
  const expenseTotal = totalOperatingExpense();
  const salaryOutstanding = salaryPayable();

  const recentReceipts = useMemo(() => filteredPayments.slice(0, 5), [filteredPayments]);

  const overdueWatchlist = useMemo(
    () => [...overdueStudents].sort((a, b) => b.due - a.due).slice(0, 5),
    [overdueStudents],
  );

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
        unreadNotifications={unreadNotifications}
        onCollectFee={() => navigate({ to: "/tenant/finance", search: { tab: "receive" } })}
      />

      <GlassDesktopDashboard
        students={students}
        staff={staff}
        periodIncome={periodIncome}
        expenseTotal={expenseTotal}
        totalDue={totalDue}
        salaryOutstanding={salaryOutstanding}
        inHand={inHand}
        inBank={inBank}
        totalBalance={totalBalance}
        overdueStudents={overdueStudents}
        overdueWatchlist={overdueWatchlist}
        recentReceipts={recentReceipts}
        unreadNotifications={unreadNotifications}
        notifications={notifications}
        dashboardTodos={dashboardTodos}
        setDashboardTodos={setDashboardTodos}
        dashboardNote={dashboardNote}
        setDashboardNote={setDashboardNote}
        period={period}
        setPeriod={setPeriod}
        customRange={customRange}
        setCustomRange={setCustomRange}
        onCollectFee={() => navigate({ to: "/tenant/finance", search: { tab: "receive" } })}
        onViewStudents={() => navigate({ to: "/tenant/students" })}
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

const directoryFilterPillClass = (active: boolean) =>
  cn(
    "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors",
    active
      ? "bg-[#2563EB] text-white shadow-sm"
      : "border border-[#E5E5E5] bg-[#DBEAFE] text-[#0F172A]/70 hover:border-[#2563EB]/25 hover:bg-[#BFDBFE] hover:text-[#0F172A]",
  );

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
  gender: "" | "M" | "F";
  phone: string;
  dob: string;
  email: string;
  address: string;
  photoUrl: string;
};

function emptyAdmitForm(cls: string): AdmitStudentForm {
  return {
    name: "",
    cls,
    guardian: "",
    due: "",
    gender: "",
    phone: "",
    dob: "",
    email: "",
    address: "",
    photoUrl: "",
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
  "flex min-w-0 flex-1 flex-row items-center justify-between gap-2 p-2.5 md:min-h-[108px] md:flex-col md:items-stretch md:justify-between md:p-6";
const directoryStatLabelClass =
  "text-[8px] font-semibold uppercase leading-tight tracking-wider md:text-[10px]";
const directoryStatValueClass =
  "shrink-0 font-mono text-[18px] font-semibold leading-none tracking-tight text-black md:text-[32px]";

function DirectoryPersonAvatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  if (photoUrl) {
    return (
      <img src={photoUrl} alt="" className="h-11 w-11 shrink-0 rounded-2xl object-cover ring-1 ring-black/5" />
    );
  }
  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-black text-[12px] font-semibold text-white">
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
                className="border-b border-slate-100 px-4 pb-4 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:px-6 sm:pt-5"
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
                  <div className="flex w-full items-center justify-between gap-3">
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
                    <StudentFeesStatusBadge due={student.due} />
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

export function StudentsLedger() {
  const { students, setStudents, classes } = useTenantStore();
  const navigate = useNavigate();
  const search = useSearch({ from: "/tenant/students" }) as { id?: string; edit?: string };
  const activeStudentViewId = search.id ?? null;
  const initialEdit = search.edit === "1";

  const openStudent = (id: string) => navigate({ to: "/tenant/students", search: { id } });
  const openStudentEdit = (id: string) =>
    navigate({ to: "/tenant/students", search: { id, edit: "1" } });
  const closeStudent = () => navigate({ to: "/tenant/students", search: {} });

  const [open, setOpen] = useState(false);
  const defaultClass = classes[0]?.className ?? "";
  const [form, setForm] = useState<AdmitStudentForm>(() => emptyAdmitForm(defaultClass));
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [enrollmentFilter, setEnrollmentFilter] = useState<EnrollmentFilter>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const admitPhotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!defaultClass) return;
    setForm((prev) =>
      classes.some((c) => c.className === prev.cls)
        ? prev
        : { ...prev, cls: defaultClass },
    );
  }, [classes, defaultClass]);

  useEffect(() => {
    setDivisionFilter("all");
  }, [gradeFilter]);

  const openAdmitDialog = () => {
    setForm(emptyAdmitForm(defaultClass));
    setOpen(true);
  };

  const handleAdmitPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleAdmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.guardian.trim()) {
      toast.error("Name and guardian are required");
      return;
    }
    const nextNum = 2847 + students.filter((s) => s.id.startsWith("STU-28")).length;
    const newStu: Student = {
      id: `STU-${nextNum}`,
      name: form.name.trim(),
      cls: form.cls,
      guardian: form.guardian.trim(),
      due: Number(form.due) || 0,
      gender: form.gender || undefined,
      phone: form.phone.trim() || undefined,
      dob: form.dob.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      photoUrl: form.photoUrl || undefined,
      active: true,
    };
    setStudents((prev) => [newStu, ...prev]);
    toast.success(`${newStu.name} admitted`, { description: `${newStu.id} · ${newStu.cls}` });
    setForm(emptyAdmitForm(defaultClass));
    setOpen(false);
  };

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

      <div className="hidden min-w-0 flex-row gap-1.5 md:flex md:gap-3">
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

      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="w-full shrink-0 text-[18px] font-bold leading-tight tracking-tight text-slate-900 md:text-[28px] md:font-semibold">
          Students Directory
        </h1>
        <div className="mobile-scrollbar-none flex w-full items-center gap-2 overflow-x-auto md:w-auto md:shrink-0 md:justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={mobileOutlineBtn}>
                <Filter className="h-3.5 w-3.5" />
                Filter
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-[#E5E5E5] p-2">
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
            <DropdownMenuContent align="end" className="w-52 rounded-2xl border-[#E5E5E5] p-2">
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
              <DropdownMenuItem
                onClick={handleImportClick}
                className="cursor-pointer gap-2 rounded-xl text-[13px]"
              >
                <Upload className="h-3.5 w-3.5" />
                Import CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={openAdmitDialog}
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
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:gap-5">
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-medium text-slate-500 md:text-[10px] md:font-semibold md:uppercase md:tracking-wider">
                Class / Grade
              </div>
              <div className="mobile-scrollbar-none mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setGradeFilter("all")}
                  className={directoryFilterPillClass(gradeFilter === "all")}
                >
                  All
                </button>
                {gradeOptions.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setGradeFilter(grade)}
                    className={directoryFilterPillClass(gradeFilter === grade)}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-medium text-slate-500 md:text-[10px] md:font-semibold md:uppercase md:tracking-wider">
                Division
              </div>
              <div className="mobile-scrollbar-none mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setDivisionFilter("all")}
                  className={directoryFilterPillClass(divisionFilter === "all")}
                >
                  All
                </button>
                {divisionOptions.map((division) => (
                  <button
                    key={division}
                    type="button"
                    onClick={() => setDivisionFilter(division)}
                    className={directoryFilterPillClass(divisionFilter === division)}
                  >
                    {division}
                  </button>
                ))}
                {divisionOptions.length === 0 && (
                  <span className="px-1 py-1.5 text-[12px] text-black/40">No divisions configured</span>
                )}
              </div>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(92dvh,720px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Admit New Student</DialogTitle>
            <DialogDescription>
              Provision a fresh enrollment record into the Silver Hills tenant ledger.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdmit} className="space-y-3">
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
                    {form.name.trim() ? personInitials(form.name) : "?"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => admitPhotoRef.current?.click()}
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
                ref={admitPhotoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAdmitPhoto}
              />
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                  Date of Birth
                </Label>
                <DatePicker
                  value={form.dob}
                  onChange={(dob) => setForm({ ...form, dob })}
                  placeholder="14 Mar 2012"
                  valueFormat="display"
                  variant="pill"
                  quickPicks={[]}
                  min="1990-01-01"
                  max={admitTodayISO()}
                  className="h-9 w-full"
                />
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
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Email Address
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="aarav.sharma@silverhills.in"
                className="font-mono text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Residential Mailing Address
              </Label>
              <Textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="B-204, Lotus Greens, Sector 21, Noida 201301"
                className="min-h-[72px] resize-none rounded-2xl text-[13px]"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
                Admit Student
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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

      <div className="hidden min-w-0 flex-row gap-1.5 md:flex md:gap-3">
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

      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="w-full shrink-0 text-[18px] font-bold leading-tight tracking-tight text-slate-900 md:text-[28px] md:font-semibold">
          Staff Directory
        </h1>
        <div className="mobile-scrollbar-none flex w-full items-center gap-2 overflow-x-auto md:w-auto md:shrink-0 md:justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={mobileOutlineBtn}>
                <Filter className="h-3.5 w-3.5" />
                Filter
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-[#E5E5E5] p-2">
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

      <div className="mobile-scrollbar-none hidden overflow-x-auto md:block">
        <div className={cn(glassTableWrapClass, "p-4 sm:p-6")}>
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr>
              {["Name", "Role", "Department", "Status"].map((header) => (
                <th
                  key={header}
                  className="border-b border-slate-100 pb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredStaff.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-[13px] text-black/55">
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
                <td className="py-3.5 pr-4 align-middle">
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
                      <div className="truncate text-[13.5px] font-semibold text-black">{member.name}</div>
                      <div className="mt-0.5 truncate font-mono text-[10.5px] text-black/45">{member.id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 pr-4 align-middle text-[13px] text-black/75">{member.role}</td>
                <td className="py-3.5 pr-4 align-middle text-[13px] text-black/75">{member.dept}</td>
                <td className="py-3.5 pr-4 align-middle">
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
  type FinanceTabKey = "receive" | "make" | "analytics" | "ledger" | "pl" | "balance";

  const search = useSearch({ from: "/tenant/finance" });
  const [tab, setTab] = useState<FinanceTabKey>(search.tab ?? "receive");
  const [sectionOpen, setSectionOpen] = useState(false);

  useEffect(() => {
    if (search.tab) {
      setTab(search.tab);
    }
  }, [search.tab]);

  const tabs: {
    k: FinanceTabKey;
    l: string;
    icon: typeof ArrowDownToLine;
  }[] = [
    { k: "receive", l: "Receive Payment", icon: ArrowDownToLine },
    { k: "make", l: "Make Payment", icon: ArrowUpFromLine },
    { k: "analytics", l: "Ledger Analytics", icon: ChartPie },
    { k: "ledger", l: "Ledger", icon: BookOpen },
    { k: "pl", l: "Profit & Loss Account", icon: TrendingUp },
    { k: "balance", l: "Balance Sheet", icon: Scale },
  ];

  const activeTab = tabs.find((t) => t.k === tab) ?? tabs[0];
  const ActiveIcon = activeTab.icon;

  const selectSection = (key: FinanceTabKey) => {
    setTab(key);
    setSectionOpen(false);
  };

  return (
    <div className="w-full space-y-6 lg:space-y-6">
      <MobileSectionTitle className="md:hidden">Finance</MobileSectionTitle>

      <button
        type="button"
        onClick={() => setSectionOpen(true)}
        className={cn(
          premiumCardClass,
          "flex w-full items-center gap-3 p-4 text-left transition-colors hover:border-slate-200 md:hidden",
        )}
      >
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#2563EB] text-white shadow-sm">
          <ActiveIcon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium text-slate-500">Finance Section</div>
          <div className="truncate text-[15px] font-semibold text-slate-900">{activeTab.l}</div>
        </div>
        <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
      </button>

      <Sheet open={sectionOpen} onOpenChange={setSectionOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] rounded-t-[2rem] border-t border-slate-100 bg-white p-0 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden [&>button]:hidden"
        >
          <div className="flex justify-center pt-3">
            <div className="h-1 w-10 rounded-full bg-slate-200" />
          </div>
          <SheetHeader className="space-y-1 px-5 pb-4 pt-2 text-left">
            <SheetTitle className="text-[22px] font-bold text-slate-900">Select Section</SheetTitle>
            <SheetDescription className="text-[13px] text-slate-500">
              Navigate to different finance areas
            </SheetDescription>
          </SheetHeader>
          <div className="mobile-scrollbar-none max-h-[min(52dvh,420px)] space-y-2 overflow-y-auto px-4 pb-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.k;
              return (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => selectSection(t.k)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors",
                    active
                      ? "bg-[#2563EB] text-white shadow-sm"
                      : "bg-slate-50 text-slate-900 hover:bg-[#DBEAFE]",
                  )}
                >
                  <div
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                      active ? "bg-white/20" : "bg-white",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </div>
                  <span className="min-w-0 flex-1 text-[15px] font-medium">{t.l}</span>
                  {active && (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-[#2563EB]">
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden w-full md:block">
        <div className={cn(glassPanelClass, "grid w-full grid-cols-12 gap-1 p-1.5")}>
          {tabs.map((t) => {
            const active = tab === t.k;
            return (
              <button
                key={t.k}
                type="button"
                onClick={() => setTab(t.k)}
                className={cn(
                  "col-span-2 rounded-xl px-3 py-2.5 text-center text-[12px] font-medium leading-tight transition-all",
                  active
                    ? "bg-gradient-to-r from-[#2563EB] to-[#4C69A4] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white/50 hover:text-slate-900",
                )}
              >
                {t.l}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "receive" && <ReceivePayment />}
      {tab === "make" && <MakePayment />}
      {tab === "analytics" && <LedgerAnalytics />}
      {tab === "ledger" && <GeneralLedgerReport />}
      {tab === "pl" && <ProfitLossReport />}
      {tab === "balance" && <BalanceSheetReport />}
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
  } = useTenantStore();
  const { session } = useAuth();
  const schoolName = session?.tenantName ?? "Silver Hills Global";
  const classes = useMemo(() => {
    const fromConfig = classConfigs.map((c) => c.className);
    const fromStudents = Array.from(new Set(students.map((s) => s.cls)));
    return Array.from(new Set([...fromConfig, ...fromStudents]));
  }, [classConfigs, students]);
  const [cls, setCls] = useState(classes[0] ?? "");
  const studentsInClass = useMemo(() => students.filter((s) => s.cls === cls), [students, cls]);
  const [stu, setStu] = useState(studentsInClass[0]?.name ?? students[0]?.name ?? "");
  const [category, setCategory] = useState(paymentCategories[0]?.label ?? "Tuition Fee");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("Bank");

  const selected = students.find((s) => s.name === stu);

  useEffect(() => {
    if (classes.length && !classes.includes(cls)) {
      setCls(classes[0]);
    }
  }, [classes, cls]);

  useEffect(() => {
    const pool = studentsInClass.length ? studentsInClass : students;
    if (pool.length && !pool.some((s) => s.name === stu)) {
      setStu(pool[0].name);
    }
  }, [students, studentsInClass, stu]);

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
    const lower = category.toLowerCase();
    if (lower.includes("tuition")) return tuitionFee;
    if (lower.includes("vehicle") || lower.includes("transport") || lower.includes("bus"))
      return matchedRouteFee;
    return undefined;
  }, [category, tuitionFee, matchedRouteFee]);

  useEffect(() => {
    if (prefill !== undefined && prefill > 0) {
      setAmount(String(prefill));
    } else {
      setAmount("");
    }
  }, [prefill]);

  const handleRecord = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!selected) {
      toast.error("Select a valid student");
      return;
    }
    const now = new Date();
    const stamp = `Today · ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const newPayment: Payment = {
      id: `RC-${9822 + payments.length}`,
      name: selected.name,
      cat: category,
      mode,
      amount: value,
      time: stamp,
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
  };

  const todayTotal = useMemo(
    () =>
      payments
        .filter((p) => p.time.startsWith("Today"))
        .reduce((sum, p) => sum + p.amount, 0),
    [payments],
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-title">Inbound Fee Capture</div>
            <p className="mt-1 text-[12px] text-black/55">
              Post fee receipts to student ledgers · {academicYear}
            </p>
          </div>
          {selected && (
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
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            />
          </div>
          <div>
            <FieldLabel>Amount (₹)</FieldLabel>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              placeholder="0"
              className="h-10 w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 font-mono text-[13px]"
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
                  onClick={() => setCategory(c.label)}
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

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#ECECEC] bg-[#F4F4F5] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[12.5px] text-black/65">
            Receipt for <span className="font-medium text-black">{stu}</span> · {cls} ·{" "}
            <span className="font-medium text-black">{category}</span> · {mode}
          </div>
          <button
            onClick={handleRecord}
            disabled={!Number(amount)}
            className="w-full shrink-0 rounded-full bg-black px-5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-colors hover:bg-black/85 disabled:opacity-50 sm:w-auto"
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
              {payments.length} receipts · most recent first
            </p>
          </div>
          <div className="rounded-2xl bg-[#F4F4F5] px-3.5 py-2 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
              Today&apos;s intake
            </div>
            <div className="font-mono text-[16px] font-semibold text-black">
              ₹ {todayTotal.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div className="mobile-scrollbar-none mt-4 overflow-x-auto rounded-2xl border border-[#E5E5E5]">
          <table className="w-full min-w-[640px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F4F4F5]">
                {["Student", "Category", "Mode", "Amount", "Time", ""].map((header) => (
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
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[12px] text-black/55">
                    No receipts recorded yet
                  </td>
                </tr>
              )}
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-[#F0F0F0] last:border-0">
                  <td className="px-3 py-3 font-medium text-black">{p.name}</td>
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
                        downloadReceiptPdf(p, schoolName, academicYear);
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
  const [pendingAuthorisation, setPendingAuthorisation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyObligation = (obligation: PendingObligation) => {
    setSelectedObligationId(obligation.id);
    setPayeeType(obligation.payeeType);
    setBeneficiary(obligation.payee);
    setDescription(obligation.desc);
    setAmount(String(obligation.amount));
  };

  const resetForm = () => {
    setSelectedObligationId(null);
    setPayeeType("Salary");
    setBeneficiary("");
    setDescription("");
    setAmount("");
    setMode("Bank Transfer · NEFT");
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
      toast.error("Complete all required fields before authorising");
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
    };
    setMadePayments((prev) => [disbursal, ...prev]);

    toast.success("Authorisation queued for treasury approval", {
      description: `${beneficiary.trim()} · ₹ ${value.toLocaleString("en-IN")} via ${mode}`,
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
        <div className="text-title">Outbound Disbursal</div>
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
              className="min-h-[80px] w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 py-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-black/15"
            />
          </div>
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
              {["Bank Transfer · NEFT", "UPI Business", "Cheque"].map((m) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "w-full rounded-2xl px-3 py-2.5 text-center text-[13px] font-medium transition-colors sm:px-4 sm:text-left sm:text-[14px]",
                      active
                        ? "bg-[#2563EB] text-white shadow-sm"
                        : "bg-[#DBEAFE]/50 text-slate-700 hover:bg-[#DBEAFE]",
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={requestAuthorisation}
            disabled={isSubmitting}
            className="rounded-full bg-black px-5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Authorise Disbursal
          </button>
        </div>
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="bl" padded className={cn(workspacePanelClass, "col-span-12 lg:col-span-4")}>
        <div className="text-title">Top Pending Obligations</div>
        <div className="mt-3 space-y-3">
          {obligations.length === 0 && (
            <div className="rounded-2xl border border-dashed border-black/15 bg-[#F4F4F5]/40 px-4 py-6 text-center text-[12px] text-black/55">
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
                className={`w-full rounded-2xl p-3 text-left transition-colors ${
                  isSelected
                    ? "bg-[#2563EB] text-white ring-2 ring-[#0F172A]/10"
                    : "bg-[#DBEAFE] text-[#0F172A] hover:bg-[#BFDBFE]"
                }`}
              >
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-semibold">{p.payee}</span>
                  <span className="font-mono">₹ {p.amount.toLocaleString("en-IN")}</span>
                </div>
                <div
                  className={`mt-0.5 flex items-center justify-between text-[10.5px] ${
                    isSelected ? "text-black/70" : "text-black/55"
                  }`}
                >
                  <span>{p.desc}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      isSelected ? "bg-black text-[#2563EB]" : "bg-black/10 text-black/65"
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
            <div className="text-title">Made Payment Details</div>
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
                </span>
                <span className="shrink-0 font-mono">{payment.time}</span>
              </div>
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
        <DialogContent className="max-w-sm rounded-[1.5rem] border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">
              Authorise Disbursal
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60">
              Authorise ₹ {Number(amount || 0).toLocaleString("en-IN")} to {beneficiary.trim()} via{" "}
              {mode}? This will queue the payment for treasury approval.
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
              className="rounded-full bg-black text-white hover:bg-black/85"
            >
              Authorise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
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
    academicYear,
    setAcademicYear,
    themeSettings,
    setThemeSettings,
    staff,
    setStaff,
    students,
    setStudents,
  } = useTenantStore();

  return (
    <div className="w-full space-y-6 lg:space-y-6">
      <MobileSectionTitle className="md:hidden">Settings</MobileSectionTitle>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
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
        <ClassesCard
          classes={classes}
          setClasses={setClasses}
          students={students}
          setStudents={setStudents}
        />
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 space-y-5 md:col-span-6">
          <VehicleCard
            transportVehicles={transportVehicles}
            setTransportVehicles={setTransportVehicles}
            transportRoutes={transportRoutes}
          />
          <TransportCard
            transportRoutes={transportRoutes}
            setTransportRoutes={setTransportRoutes}
            transportVehicles={transportVehicles}
            setTransportVehicles={setTransportVehicles}
          />
        </div>
        <div className="col-span-12 md:col-span-6">
          <CategoriesCard
            paymentCategories={paymentCategories}
            setPaymentCategories={setPaymentCategories}
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
    <div className="rounded-2xl border border-dashed border-black/15 bg-[#F4F4F5]/40 px-4 py-6 text-center text-[12px] text-black/55">
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
      <DialogContent className="max-w-sm rounded-[1.5rem] border border-[#E5E5E5] bg-white p-6">
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
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5"
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
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5"
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
            className="flex items-center justify-between gap-3 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5"
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

      <div className="mt-4 overflow-x-auto rounded-2xl border border-[#EFEFEF]">
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
                <p className="rounded-2xl border border-dashed border-[#E5E5E5] px-3 py-4 text-center text-[12px] text-black/45">
                  No routes configured yet
                </p>
              ) : (
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-2">
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
            <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2.5">
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

      <div className="mt-4 overflow-x-auto rounded-2xl border border-[#EFEFEF]">
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

function CategoriesCard({
  paymentCategories,
  setPaymentCategories,
  academicYear,
  setAcademicYear,
  themeSettings,
  setThemeSettings,
}: {
  paymentCategories: PaymentCategory[];
  setPaymentCategories: React.Dispatch<React.SetStateAction<PaymentCategory[]>>;
  academicYear: string;
  setAcademicYear: React.Dispatch<React.SetStateAction<string>>;
  themeSettings: ThemeSettings;
  setThemeSettings: React.Dispatch<React.SetStateAction<ThemeSettings>>;
}) {
  const [draft, setDraft] = useState("");
  const [pendingDelete, setPendingDelete] = useState<PaymentCategory | null>(null);

  const addCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const label = draft.trim();
    if (!label) return;
    if (paymentCategories.some((c) => c.label.toLowerCase() === label.toLowerCase())) {
      toast.error(`${label} already exists`);
      return;
    }
    const nextId = `PC-${(paymentCategories.length + 1).toString().padStart(3, "0")}`;
    setPaymentCategories((prev) => [...prev, { id: nextId, label }]);
    toast.success(`Category added · ${label}`, {
      description: "Now selectable on Receive Payment",
    });
    setDraft("");
  };

  const removeCategory = (c: PaymentCategory) => {
    setPaymentCategories((prev) => prev.filter((x) => x.id !== c.id));
    toast.error(`${c.label} removed`, { description: "Existing receipts retain the label" });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    removeCategory(pendingDelete);
    setPendingDelete(null);
  };

  return (
    <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass}>
      <div className="text-[18px] font-bold leading-tight tracking-tight text-black">
        System Constants
      </div>
      <p className="mt-1 text-[12px] text-black/55">
        Academic year, theme frame, and payment categories for Finance selectors
      </p>

      <div className="mt-4 grid gap-3 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5">
        <div>
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
            Academic Year
          </Label>
          <FieldSelect
            value={academicYear}
            onValueChange={(y) => {
              setAcademicYear(y);
              toast.success(`Academic year set to ${y}`);
            }}
            options={ACADEMIC_YEAR_OPTIONS.map((y) => ({ value: y, label: y }))}
            className="mt-1.5 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <ThemeSelect
            label="Theme"
            value={themeSettings.mode}
            options={THEME_MODE_OPTIONS}
            onChange={(mode) => {
              setThemeSettings((prev) => ({ ...prev, mode }));
              toast.success(`Theme mode set to ${mode}`);
            }}
          />
          <ThemeSelect
            label="Accent"
            value={themeSettings.accent}
            options={THEME_ACCENT_OPTIONS}
            onChange={(accent) => {
              setThemeSettings((prev) => ({ ...prev, accent }));
              toast.success(`Accent set to ${accent}`);
            }}
          />
          <ThemeSelect
            label="Density"
            value={themeSettings.density}
            options={THEME_DENSITY_OPTIONS}
            onChange={(density) => {
              setThemeSettings((prev) => ({ ...prev, density }));
              toast.success(`Workspace density set to ${density}`);
            }}
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
            Payment Categories
          </Label>
          <span className="font-mono text-[10.5px] text-black/45">
            {paymentCategories.length} active
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {paymentCategories.length === 0 && (
            <span className="text-[12px] text-black/55">No categories defined</span>
          )}
          {paymentCategories.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#DBEAFE] px-3 py-1 text-[12px] font-semibold text-black"
            >
              {c.label}
              <button
                type="button"
                onClick={() => setPendingDelete(c)}
                className="grid h-4 w-4 place-items-center rounded-full text-black/55 hover:bg-black hover:text-white"
                aria-label={`Remove ${c.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={addCategory} className="mt-3 flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Lab Fee"
            className="flex-1"
          />
          <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
            <Plus className="mr-1 h-3.5 w-3.5" /> Add
          </Button>
        </form>
      </div>

      <DeleteConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title="Delete Payment Category"
        description={
          pendingDelete
            ? `Are you sure you want to remove "${pendingDelete.label}" from payment categories? Existing receipts will keep this label.`
            : "Are you sure you want to delete this payment category?"
        }
        onConfirm={confirmDelete}
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
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}) {
  const resolvedValue = options.some((o) => o.value === value) ? value : undefined;

  return (
    <div className={className}>
      <Select value={resolvedValue} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          className={cn(
            "h-10 w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 text-[13px] font-normal text-black shadow-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-0",
            triggerClassName,
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          position="popper"
          className="z-[250] rounded-2xl border border-[#E5E5E5] bg-white p-1.5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)]"
        >
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="cursor-pointer rounded-xl py-2 pl-3 pr-8 text-[13px] text-black focus:bg-[#DBEAFE] focus:text-black data-[highlighted]:bg-[#DBEAFE] data-[highlighted]:text-black data-[state=checked]:bg-[#2563EB] data-[state=checked]:font-semibold data-[state=checked]:text-white"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
