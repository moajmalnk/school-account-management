import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  AlertTriangle,
  Printer,
  Download,
  Upload,
  Phone,
  MessageCircle,
  MessageSquare,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChartPie,
  BookOpen,
  Scale,
} from "lucide-react";
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
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrganicCard } from "@/components/ui/organic-card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  ACADEMIC_YEAR_OPTIONS,
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
} from "@/lib/tenant-store";
import { StudentProfileDetail } from "@/components/school/StudentProfileDetail";
import { FinanceBarCard, FinanceDonutCard } from "@/components/school/finance-charts";
import {
  BalanceSheetReport,
  GeneralLedgerReport,
  ProfitLossReport,
} from "@/components/school/FinanceReports";
import { downloadReceiptPdf } from "@/lib/finance-export";
import { useAuth } from "@/lib/auth";
import { cn, type CornerSide, type Tone } from "@/lib/utils";

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

function gradeBand(cls: string): string {
  const c = cls.toUpperCase();
  if (c.includes("LKG") || c.includes("UKG") || c.includes("NURSERY")) {
    return "Pre-Primary (LKG–UKG)";
  }
  const gradeMatch = c.match(/GRADE\s*(\d+)/i);
  if (gradeMatch) {
    const grade = Number(gradeMatch[1]);
    if (grade <= 5) return "Primary (Gr 1–5)";
    if (grade <= 8) return "Middle (Gr 6–8)";
    return "Senior (Gr 9–12)";
  }
  return "Primary (Gr 1–5)";
}

const DAILY_CHART_CONFIG = {
  amount: { label: "Collection", color: "#111111" },
} satisfies ChartConfig;

const OUTSTANDING_CHART_CONFIG = {
  amount: { label: "Outstanding", color: "#C7F33C" },
} satisfies ChartConfig;

const PAYMENT_MODE_COLORS = ["#111111", "#C7F33C", "#E1F2AE"];

function PaymentModeChart({ data }: { data: { label: string; value: number }[] }) {
  const chartConfig = data.reduce<ChartConfig>((acc, row, index) => {
    acc[row.label] = {
      label: row.label,
      color: PAYMENT_MODE_COLORS[index % PAYMENT_MODE_COLORS.length],
    };
    return acc;
  }, {});

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => [
                `₹ ${Number(value).toLocaleString("en-IN")}`,
                String(name),
              ]}
            />
          }
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={52}
          outerRadius={78}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((row, index) => (
            <Cell key={row.label} fill={PAYMENT_MODE_COLORS[index % PAYMENT_MODE_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

function CategoryCollectionChart({ data }: { data: { label: string; amount: number }[] }) {
  const chartConfig = {
    amount: { label: "Collected", color: "#111111" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} strokeDasharray="4 4" stroke="#E5E5E5" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={88}
          tick={{ fontSize: 10, fill: "#525252" }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => [`₹ ${Number(value).toLocaleString("en-IN")}`, "Collected"]}
            />
          }
        />
        <Bar dataKey="amount" fill="#111111" radius={[0, 8, 8, 0]} maxBarSize={18} />
      </BarChart>
    </ChartContainer>
  );
}

function ClassEnrollmentChart({ data }: { data: { label: string; count: number }[] }) {
  const chartConfig = {
    count: { label: "Students", color: "#C7F33C" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#E5E5E5" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 9, fill: "#737373" }}
          interval={0}
          angle={-18}
          textAnchor="end"
          height={52}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tick={{ fontSize: 10, fill: "#737373" }}
          width={28}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent formatter={(value) => [`${Number(value)} enrolled`, "Students"]} />
          }
        />
        <Bar dataKey="count" fill="#C7F33C" radius={[8, 8, 4, 4]} maxBarSize={36} />
      </BarChart>
    </ChartContainer>
  );
}

function InsightCard({
  label,
  value,
  hint,
  tone = "white",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: Tone;
}) {
  return (
    <OrganicCard tone={tone} cornerSide="tr" padded className="!p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
        {label}
      </div>
      <div className="mt-2 font-mono text-[22px] font-semibold tracking-tight text-black">
        {value}
      </div>
      <div className="mt-1 text-[11px] text-black/55">{hint}</div>
    </OrganicCard>
  );
}

function DailyFeeCollectionChart({
  data,
  peakDay,
}: {
  data: { day: string; amount: number }[];
  peakDay: string;
}) {
  const weekTotal = data.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div className="rounded-2xl bg-[#F4F4F5] px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
            Week total
          </div>
          <div className="font-mono text-[16px] font-semibold text-black">
            ₹ {weekTotal.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10.5px] text-black/55">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-black" /> Regular days
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[#C7F33C]" /> Peak day
          </span>
        </div>
      </div>
      <ChartContainer config={DAILY_CHART_CONFIG} className="aspect-auto h-[240px] w-full">
        <BarChart data={data} margin={{ top: 12, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="peakBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C7F33C" />
              <stop offset="100%" stopColor="#A8D62E" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#E5E5E5" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#737373" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#737373" }}
            tickFormatter={(value) => `₹${Math.round(Number(value) / 1000)}k`}
            width={44}
          />
          <ChartTooltip
            cursor={{ fill: "rgba(0,0,0,0.04)", radius: 8 }}
            content={
              <ChartTooltipContent
                formatter={(value) => [`₹ ${Number(value).toLocaleString("en-IN")}`, "Collected"]}
              />
            }
          />
          <Bar dataKey="amount" radius={[10, 10, 4, 4]} maxBarSize={52}>
            {data.map((row) => (
              <Cell
                key={row.day}
                fill={row.day === peakDay ? "url(#peakBarGradient)" : "#111111"}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function OutstandingFeesChart({
  data,
}: {
  data: { label: string; shortLabel: string; amount: number }[];
}) {
  const maxAmount = Math.max(...data.map((row) => row.amount), 1);

  return (
    <ChartContainer config={OUTSTANDING_CHART_CONFIG} className="aspect-auto h-[280px] w-full">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} strokeDasharray="4 4" stroke="#E5E5E5" />
        <XAxis type="number" hide domain={[0, maxAmount * 1.15]} />
        <YAxis
          type="category"
          dataKey="shortLabel"
          tickLine={false}
          axisLine={false}
          width={72}
          tick={{ fontSize: 11, fill: "#525252" }}
        />
        <ChartTooltip
          cursor={{ fill: "rgba(199,243,60,0.12)" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? "Grade band"}
              formatter={(value) => [`₹ ${Number(value).toLocaleString("en-IN")}`, "Outstanding"]}
            />
          }
        />
        <Bar dataKey="amount" fill="#C7F33C" radius={[0, 10, 10, 0]} maxBarSize={22} />
      </BarChart>
    </ChartContainer>
  );
}

function KpiCard({
  label,
  value,
  delta,
  positive = true,
  tone = "white",
  cornerSide = "tr",
}: {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
  tone?: Tone;
  cornerSide?: CornerSide;
}) {
  const Icon = positive ? TrendingUp : TrendingDown;
  const isLime = tone === "lime";
  const isBlack = tone === "black";
  const labelClass = isLime || isBlack ? "" : "text-black/45";
  const deltaColor = isLime
    ? "text-black"
    : isBlack
      ? "text-[#C7F33C]"
      : positive
        ? "text-black"
        : "text-[#B91C1C]";
  return (
    <OrganicCard
      tone={tone}
      cornerSide={cornerSide}
      arrow
      padded
      className="min-w-0 w-full p-3 sm:p-6 [&_.relative]:pr-10 [&_.relative]:pl-10 [&_.relative]:pb-10 sm:[&_.relative]:pr-14 sm:[&_.relative]:pl-14 sm:[&_.relative]:pb-14"
    >
      <div
        className={`text-[9px] font-medium uppercase leading-tight tracking-wider sm:text-[11px] ${labelClass}`}
      >
        {label}
      </div>
      <div className="mt-1.5 font-mono text-[17px] font-semibold leading-none tracking-tight sm:mt-3 sm:text-[22px] md:text-[28px]">
        {value}
      </div>
      <div className={`mt-1 flex min-w-0 items-center gap-1 text-[10px] sm:text-[11.5px] ${deltaColor}`}>
        <Icon className="h-3 w-3 shrink-0" /> <span className="truncate">{delta}</span>
      </div>
    </OrganicCard>
  );
}

export function SchoolDashboard() {
  const { students, staff, payments, academicYear } = useTenantStore();
  const totalDue = students.reduce((acc, s) => acc + s.due, 0);
  const monthlyIncome = payments.reduce((acc, p) => acc + p.amount, 0);
  const clearedStudents = students.filter((s) => s.due === 0).length;
  const overdueStudents = students.filter((s) => s.due > 0);
  const collectionRate =
    students.length > 0 ? Math.round((clearedStudents / students.length) * 100) : 0;
  const avgReceipt = payments.length > 0 ? Math.round(monthlyIncome / payments.length) : 0;

  const dailyCollection = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const baseline = [42000, 58000, 74000, 96000, 88000, 51000, 33000];
    const receiptPulse = Math.round(monthlyIncome / Math.max(payments.length, 1));

    return days.map((day, index) => ({
      day,
      amount: baseline[index] + (index === 3 ? receiptPulse : Math.round(receiptPulse * 0.15)),
    }));
  }, [monthlyIncome, payments.length]);

  const peakDay = useMemo(
    () =>
      dailyCollection.reduce(
        (best, row) => (row.amount > best.amount ? row : best),
        dailyCollection[0],
      ).day,
    [dailyCollection],
  );

  const outstandingBands = useMemo(() => {
    const bandOrder = [
      "Pre-Primary (LKG–UKG)",
      "Primary (Gr 1–5)",
      "Middle (Gr 6–8)",
      "Senior (Gr 9–12)",
    ] as const;
    const totals = new Map<string, number>(bandOrder.map((label) => [label, 0]));

    for (const student of students) {
      const band = gradeBand(student.cls);
      totals.set(band, (totals.get(band) ?? 0) + student.due);
    }

    return bandOrder.map((label) => ({
      label,
      shortLabel: label.split("(")[0]?.trim() ?? label,
      amount: totals.get(label) ?? 0,
    }));
  }, [students]);

  const paymentModes = useMemo(() => {
    const totals = new Map<string, number>();
    for (const payment of payments) {
      totals.set(payment.mode, (totals.get(payment.mode) ?? 0) + payment.amount);
    }
    return Array.from(totals.entries()).map(([label, value]) => ({ label, value }));
  }, [payments]);

  const feeCategories = useMemo(() => {
    const totals = new Map<string, number>();
    for (const payment of payments) {
      totals.set(payment.cat, (totals.get(payment.cat) ?? 0) + payment.amount);
    }
    return Array.from(totals.entries())
      .map(([label, amount]) => ({ label, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [payments]);

  const classEnrollment = useMemo(() => {
    const totals = new Map<string, number>();
    for (const student of students) {
      totals.set(student.cls, (totals.get(student.cls) ?? 0) + 1);
    }
    return Array.from(totals.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [students]);

  const recentReceipts = useMemo(() => payments.slice(0, 5), [payments]);

  const overdueWatchlist = useMemo(
    () => [...overdueStudents].sort((a, b) => b.due - a.due).slice(0, 5),
    [overdueStudents],
  );

  return (
    <div className="space-y-4 sm:space-y-6">

      <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:gap-3 md:gap-4 xl:grid-cols-4">
        <div className="min-w-0">
          <KpiCard
            label="Total Students"
            value={students.length.toLocaleString("en-IN")}
            delta="live ledger"
            cornerSide="tr"
          />
        </div>
        <div className="min-w-0">
          <KpiCard
            label="Total Staff"
            value={staff.length.toString()}
            delta={`${staff.filter((s) => s.active).length} active`}
            cornerSide="bl"
          />
        </div>
        <div className="min-w-0">
          <KpiCard
            label="Receipts Captured"
            value={`₹ ${monthlyIncome.toLocaleString("en-IN")}`}
            delta={`${payments.length} receipts`}
            cornerSide="tr"
          />
        </div>
        <div className="min-w-0">
          <KpiCard
            label="Outstanding Dues"
            value={`₹ ${totalDue.toLocaleString("en-IN")}`}
            delta="across all classes"
            positive={false}
            tone="lime"
            cornerSide="bl"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <InsightCard
          label="Collection Rate"
          value={`${collectionRate}%`}
          hint={`${clearedStudents} of ${students.length} accounts cleared`}
          tone="lime"
        />
        <InsightCard
          label="Overdue Accounts"
          value={overdueStudents.length.toString()}
          hint={`₹ ${totalDue.toLocaleString("en-IN")} pending recovery`}
        />
        <InsightCard
          label="Average Receipt"
          value={`₹ ${avgReceipt.toLocaleString("en-IN")}`}
          hint="Mean value per captured receipt"
        />
        <InsightCard
          label="Active Staff Ratio"
          value={`1:${students.length > 0 ? Math.max(1, Math.round(students.length / Math.max(staff.filter((s) => s.active).length, 1))) : 0}`}
          hint={`${staff.filter((s) => s.active).length} active faculty & admin`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <OrganicCard tone="white" cornerSide="tr" arrow padded className="lg:col-span-2">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-title">Daily Fee Collection</div>
              <div className="mt-1 text-[12.5px] text-black/55">Last 7 working days</div>
            </div>
            <div className="rounded-full bg-[#F4F4F5] px-3 py-1 font-mono text-[10.5px] text-black/55">
              Peak · {peakDay}
            </div>
          </div>
          <DailyFeeCollectionChart data={dailyCollection} peakDay={peakDay} />
        </OrganicCard>

        <OrganicCard tone="white" cornerSide="bl" arrow padded>
          <div className="text-title">Outstanding Fees</div>
          <div className="mt-1 text-[12.5px] text-black/55">By academic grade band</div>
          <div className="mt-3 rounded-2xl bg-[#F4F4F5] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
              Total outstanding
            </div>
            <div className="font-mono text-[18px] font-semibold text-black">
              ₹ {totalDue.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="mt-4">
            <OutstandingFeesChart data={outstandingBands} />
          </div>
          <div className="mt-2 space-y-2">
            {outstandingBands.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between text-[11.5px] text-black/65"
              >
                <span>{row.label}</span>
                <span className="font-mono text-black">₹ {row.amount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </OrganicCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OrganicCard tone="white" cornerSide="tr" padded>
          <div className="text-title">Recent Receipts</div>
          <div className="mt-1 text-[12.5px] text-black/55">
            Latest inbound payments · {recentReceipts.length} shown
          </div>
          <div className="mt-4 divide-y divide-[#F0F0F0]">
            {recentReceipts.length === 0 && (
              <div className="py-6 text-center text-[12px] text-black/55">
                No receipts logged yet
              </div>
            )}
            {recentReceipts.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-black">
                    {payment.name}
                  </div>
                  <div className="mt-0.5 text-[11px] text-black/55">
                    {payment.cat} · {payment.mode} · {payment.time}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[13px] font-semibold text-black">
                    ₹ {payment.amount.toLocaleString("en-IN")}
                  </div>
                  <div className="font-mono text-[10px] text-black/45">{payment.id}</div>
                </div>
              </div>
            ))}
          </div>
        </OrganicCard>

        <OrganicCard tone="white" cornerSide="bl" padded>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-title">Overdue Watchlist</div>
            </div>
            <span className="rounded-full bg-[#C7F33C] px-2.5 py-1 text-[10px] font-semibold text-black">
              {overdueStudents.length} overdue
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {overdueWatchlist.length === 0 && (
              <div className="rounded-2xl bg-[#F4F4F5] px-4 py-6 text-center text-[12px] text-black/55">
                All student balances are cleared
              </div>
            )}
            {overdueWatchlist.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-black">
                    {student.name}
                  </div>
                  <div className="text-[11px] text-black/55">
                    {student.cls} · {student.id}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[13px] font-semibold text-black">
                    ₹ {student.due.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#B91C1C]">
                    Overdue
                  </div>
                </div>
              </div>
            ))}
          </div>
        </OrganicCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <OrganicCard tone="white" cornerSide="tr" padded>
          <div className="text-title">Payment Mode Mix</div>
          <div className="mt-1 text-[12.5px] text-black/55">Share of collections by channel</div>
          <div className="mt-4">
            <PaymentModeChart data={paymentModes} />
          </div>
          <div className="mt-3 space-y-2">
            {paymentModes.map((row, index) => (
              <div key={row.label} className="flex items-center justify-between text-[11.5px]">
                <span className="inline-flex items-center gap-2 text-black/65">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{
                      backgroundColor: PAYMENT_MODE_COLORS[index % PAYMENT_MODE_COLORS.length],
                    }}
                  />
                  {row.label}
                </span>
                <span className="font-mono text-black">₹ {row.value.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </OrganicCard>

        <OrganicCard tone="white" cornerSide="bl" padded>
          <div className="text-title">Fee Category Split</div>
          <div className="mt-1 text-[12.5px] text-black/55">Collections grouped by fee head</div>
          <div className="mt-4">
            <CategoryCollectionChart data={feeCategories} />
          </div>
        </OrganicCard>

        <OrganicCard tone="white" cornerSide="tr" padded>
          <div className="text-title">Class Enrollment</div>
          <div className="mt-1 text-[12.5px] text-black/55">
            Active students across configured class tiers
          </div>
          <div className="mt-4">
            <ClassEnrollmentChart data={classEnrollment} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {classEnrollment.slice(0, 4).map((row) => (
              <div key={row.label} className="rounded-2xl bg-[#F4F4F5] px-3 py-2">
                <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-black/45">
                  {row.label}
                </div>
                <div className="mt-1 font-mono text-[14px] font-semibold text-black">
                  {row.count}
                </div>
              </div>
            ))}
          </div>
        </OrganicCard>
      </div>
    </div>
  );
}

type StatusFilter = "all" | "paid" | "overdue";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All Students" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" },
];

const phoneDigits = (raw?: string) => (raw ?? "").replace(/[^0-9]/g, "");

const formatPhone = (raw?: string) => {
  const d = phoneDigits(raw);
  if (!d) return "";
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  if (d.length === 12 && d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return d;
};

export function StudentsLedger() {
  const { students, setStudents, classes } = useTenantStore();
  const navigate = useNavigate();
  const search = useSearch({ from: "/tenant/students" }) as { id?: string };
  const activeStudentViewId = search.id ?? null;

  const openStudent = (id: string) => navigate({ to: "/tenant/students", search: { id } });
  const closeStudent = () => navigate({ to: "/tenant/students", search: {} });

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const defaultClass = classes[0]?.className ?? "";
  const [form, setForm] = useState({ name: "", cls: defaultClass, guardian: "", due: "" });
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pendingLedgerAction, setPendingLedgerAction] = useState<"pdf" | "csv" | "import" | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!defaultClass) return;
    setForm((prev) =>
      classes.some((c) => c.className === prev.cls) ? prev : { ...prev, cls: defaultClass },
    );
  }, [classes, defaultClass]);

  const activeStudent = useMemo(
    () =>
      activeStudentViewId ? (students.find((s) => s.id === activeStudentViewId) ?? null) : null,
    [activeStudentViewId, students],
  );

  const grades = useMemo(
    () => Array.from(new Set(students.map((s) => s.cls.split(" - ")[0]))).sort(),
    [students],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter((s) => gradeFilter === "all" || s.cls.startsWith(gradeFilter))
      .filter((s) =>
        statusFilter === "all" ? true : statusFilter === "paid" ? s.due === 0 : s.due > 0,
      )
      .filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.guardian.toLowerCase().includes(q),
      );
  }, [students, query, gradeFilter, statusFilter]);

  const counts = useMemo(
    () => ({
      total: filtered.length,
      male: filtered.filter((s) => s.gender === "M").length,
      female: filtered.filter((s) => s.gender === "F").length,
    }),
    [filtered],
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
    };
    setStudents((prev) => [newStu, ...prev]);
    toast.success(`${newStu.name} admitted`, { description: `${newStu.id} · ${newStu.cls}` });
    setForm({ name: "", cls: defaultClass, guardian: "", due: "" });
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
      gradeFilter === "all" ? "All Grades" : gradeFilter,
      statusFilter === "all"
        ? "All Statuses"
        : statusFilter[0].toUpperCase() + statusFilter.slice(1),
    ].join(" · ");
    const rowsHtml = filtered
      .map(
        (s) => `<tr>
          <td>${s.id}</td>
          <td>${s.name}</td>
          <td>${s.cls}</td>
          <td>${s.guardian}</td>
          <td>${s.phone ?? ""}</td>
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
      </style></head><body>
        <h1>Silver Hills Global · Students Ledger</h1>
        <div class="meta">${contextLabel} · ${filtered.length} students · printed ${stampedAt}</div>
        <table>
          <thead><tr><th>ID</th><th>Student</th><th>Class</th><th>Guardian</th><th>Phone</th><th style="text-align:right">Balance</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 100);
    toast.success("Print preview opened", { description: "Save as PDF from your browser dialog" });
  };

  const confirmLedgerAction = () => {
    if (!pendingLedgerAction) return;
    if (pendingLedgerAction === "pdf") downloadPdf();
    else if (pendingLedgerAction === "csv") exportCsv();
    else handleImportClick();
    setPendingLedgerAction(null);
  };

  const ledgerActionCopy = {
    pdf: {
      title: "Download PDF",
      description: `Generate a print-ready PDF for ${filtered.length} student${filtered.length === 1 ? "" : "s"} matching the current filters?`,
      confirm: "Download PDF",
    },
    csv: {
      title: "Export CSV",
      description: `Export ${filtered.length} visible student${filtered.length === 1 ? "" : "s"} to a CSV file?`,
      confirm: "Export CSV",
    },
    import: {
      title: "Import CSV",
      description:
        "Import students from a CSV file? New records will be appended to the active tenant ledger.",
      confirm: "Choose File",
    },
  } as const;

  if (activeStudent) {
    return <StudentProfileDetail student={activeStudent} onBack={closeStudent} />;
  }

  const limeBtn =
    "flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-[#C7F33C] px-4 py-2 text-[12.5px] font-semibold text-black shadow-[0_8px_24px_-12px_rgba(199,243,60,0.6)] transition-colors hover:brightness-95";

  const statusTabs = (
    <div className="inline-flex min-w-max items-center rounded-full border border-black/10 bg-white p-1">
      {STATUS_TABS.map((t) => {
        const active = statusFilter === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => setStatusFilter(t.key)}
            className={`min-h-9 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors sm:px-3.5 sm:text-[12px] ${
              active ? "bg-[#C7F33C] text-black" : "text-black/55 hover:bg-black/5"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );

  const gradeFilterControl = (
    <div className="flex shrink-0 items-center gap-1.5">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-black/55 sm:text-[10.5px]">
        Grade
      </span>
      <Select value={gradeFilter} onValueChange={setGradeFilter}>
        <SelectTrigger className="h-10 w-[7.5rem] rounded-full border-black/10 bg-white text-[12px] font-medium text-black focus:ring-[#C7F33C] sm:h-11 sm:w-[160px] sm:text-[12.5px] lg:h-10">
          <SelectValue placeholder="All Grades" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Grades</SelectItem>
          {grades.map((g) => (
            <SelectItem key={g} value={g}>
              {g}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <OrganicCard tone="white" cornerSide="tr" className="space-y-3 p-3.5 sm:p-4">
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button onClick={() => setOpen(true)} className={`${limeBtn} w-full sm:w-auto`}>
              <Plus className="h-3.5 w-3.5" /> Student
            </button>
            <button
              onClick={() => setPendingLedgerAction("pdf")}
              className={`${limeBtn} w-full sm:w-auto`}
              title="Open print-ready PDF preview"
            >
              <Printer className="h-3.5 w-3.5" /> Download PDF
            </button>
            <button
              onClick={() => setPendingLedgerAction("csv")}
              className={`${limeBtn} w-full sm:w-auto`}
              title="Export visible rows as CSV"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button
              onClick={() => setPendingLedgerAction("import")}
              className={`${limeBtn} w-full sm:w-auto`}
              title="Append students from a CSV file"
            >
              <Upload className="h-3.5 w-3.5" /> Import CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImport}
            />
          </div>

          <div className="mobile-scrollbar-none hidden overflow-x-auto lg:block">{statusTabs}</div>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <div className="mobile-scrollbar-none min-w-0 flex-1 overflow-x-auto">{statusTabs}</div>
          {gradeFilterControl}
        </div>

        <div className="grid gap-2 lg:grid-cols-[auto_auto_minmax(260px,1fr)] lg:items-center">
          <div className="hidden lg:block">{gradeFilterControl}</div>

          <span className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#E1F2AE] px-3 py-1.5 text-[12px] font-semibold text-black lg:min-h-10 lg:w-auto lg:justify-start">
            <span className="font-mono">{counts.total}</span>
            Total Students
            <span className="font-mono text-black/65">
              ({counts.male}M | {counts.female}F)
            </span>
          </span>

          <div className="flex min-h-11 items-center gap-2 rounded-full border border-[#E5E5E5] bg-white px-3.5 shadow-[0_10px_28px_-24px_rgba(0,0,0,0.35)]">
            <Search className="h-3.5 w-3.5 shrink-0 text-black/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, ID, or guardian…"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-black outline-none placeholder:text-black/35"
            />
            {query && (
              <span className="shrink-0 font-mono text-[10px] text-black/45">
                {filtered.length} match
              </span>
            )}
          </div>
        </div>
      </OrganicCard>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((s, i) => {
          const isOverdue = s.due > 0;
          const tone: Tone = isOverdue ? "lime" : "white";
          const cornerSide: CornerSide = i % 2 === 0 ? "tr" : "bl";
          const digits = phoneDigits(s.phone);
          const hasPhone = digits.length > 0;
          const waHref = `https://wa.me/${digits.length === 10 ? "91" : ""}${digits}`;
          const openProfile = () => openStudent(s.id);
          return (
            <OrganicCard
              key={s.id}
              tone={tone}
              cornerSide={cornerSide}
              padded
              role="button"
              tabIndex={0}
              aria-label={`Open profile for ${s.name}`}
              onClick={openProfile}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openProfile();
                }
              }}
              className="flex cursor-pointer flex-col gap-3 transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-2"
            >
              <div className="pr-12">
                <div className="text-[15px] font-semibold leading-tight">{s.name}</div>
                <div
                  className={`mt-1 font-mono text-[11px] ${
                    isOverdue ? "text-black/65" : "text-black/55"
                  }`}
                >
                  {s.id} · {s.cls}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    isOverdue ? "bg-black text-[#C7F33C]" : "bg-[#F4F4F5] text-black/75"
                  }`}
                >
                  Guardian · {s.guardian}
                </span>
                {hasPhone && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10.5px] ${
                      isOverdue ? "bg-black/15 text-black/85" : "bg-[#F4F4F5] text-black/65"
                    }`}
                  >
                    <Phone className="h-2.5 w-2.5" />
                    {formatPhone(s.phone)}
                  </span>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between gap-3">
                <div>
                  <div
                    className={`text-[10.5px] font-semibold uppercase tracking-wider ${
                      isOverdue ? "text-black/70" : "text-black/45"
                    }`}
                  >
                    Due Balance
                  </div>
                  <div className="mt-0.5 font-mono text-[18px] font-semibold">
                    {s.due === 0 ? (
                      <span className="text-emerald-700">Cleared</span>
                    ) : (
                      <span>₹ {s.due.toLocaleString("en-IN")}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <ContactAction
                    icon={MessageCircle}
                    label="WhatsApp"
                    accent="emerald"
                    disabled={!hasPhone}
                    onClick={() => {
                      window.open(waHref, "_blank", "noopener,noreferrer");
                      toast.success(`WhatsApp opened for ${s.guardian}`);
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
              </div>
            </OrganicCard>
          );
        })}
        {filtered.length === 0 && (
          <OrganicCard tone="white" cornerSide="tr" padded className="md:col-span-2 xl:col-span-3">
            <div className="py-10 text-center text-[12.5px] text-black/45">
              No students match the current filters.
            </div>
          </OrganicCard>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admit New Student</DialogTitle>
            <DialogDescription>
              Provision a fresh enrollment record into the Silver Hills tenant ledger.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdmit} className="space-y-3">
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
                Guardian Name
              </Label>
              <Input
                value={form.guardian}
                onChange={(e) => setForm({ ...form, guardian: e.target.value })}
                placeholder="e.g. Anita Verma"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
                Student
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingLedgerAction)}
        onOpenChange={(next) => {
          if (!next) setPendingLedgerAction(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-[1.5rem] border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">
              {pendingLedgerAction ? ledgerActionCopy[pendingLedgerAction].title : "Confirm Action"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60">
              {pendingLedgerAction
                ? ledgerActionCopy[pendingLedgerAction].description
                : "Are you sure you want to continue?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingLedgerAction(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmLedgerAction}
              className="rounded-full bg-black text-white hover:bg-black/85"
            >
              {pendingLedgerAction ? ledgerActionCopy[pendingLedgerAction].confirm : "Continue"}
            </Button>
          </DialogFooter>
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
      ? "bg-emerald-500 text-white hover:bg-emerald-600"
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

export function StaffRoster() {
  const { staff, setStaff, departments, roles } = useTenantStore();
  const defaultDept = departments[0]?.name ?? "";
  const defaultRole = roles[0]?.title ?? "";
  const [open, setOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<Staff | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<Staff | null>(null);
  const [detailStaff, setDetailStaff] = useState<Staff | null>(null);
  const [form, setForm] = useState({
    name: "",
    role: defaultRole,
    dept: defaultDept,
    id: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    role: defaultRole,
    dept: defaultDept,
    id: "",
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      role: roles.some((r) => r.title === prev.role) ? prev.role : defaultRole,
      dept: departments.some((d) => d.name === prev.dept) ? prev.dept : defaultDept,
    }));
  }, [departments, defaultDept, defaultRole, roles]);

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
    };
    setStaff((prev) => [newStaff, ...prev]);
    toast.success(`${newStaff.name} recruited`, {
      description: `${newStaff.id} · ${newStaff.dept}`,
    });
    setForm({ name: "", role: defaultRole, dept: defaultDept, id: "" });
    setOpen(false);
  };

  const openEdit = (s: Staff) => {
    setEditForm({ name: s.name, role: s.role, dept: s.dept, id: s.id });
    setEditStaff(s);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStaff) return;
    if (!editForm.name.trim() || !editForm.role.trim()) {
      toast.error("Name and role are required");
      return;
    }
    setStaff((prev) =>
      prev.map((s) =>
        s.id === editStaff.id
          ? {
              ...s,
              name: editForm.name.trim(),
              role: editForm.role.trim(),
              dept: editForm.dept,
            }
          : s,
      ),
    );
    toast.success(`${editForm.name.trim()} updated`, {
      description: `${editStaff.id} · ${editForm.dept}`,
    });
    setEditStaff(null);
  };

  const confirmStatusChange = () => {
    if (!pendingStatusChange) return;
    const nextActive = !pendingStatusChange.active;
    setStaff((prev) =>
      prev.map((s) => (s.id === pendingStatusChange.id ? { ...s, active: nextActive } : s)),
    );
    toast(`${pendingStatusChange.name} marked ${nextActive ? "Active" : "Inactive"}`);
    setPendingStatusChange(null);
  };

  const removeStaff = (id: string) => {
    const s = staff.find((x) => x.id === id);
    setStaff((prev) => prev.filter((x) => x.id !== id));
    toast.error(`${s?.name} removed from roster`);
  };

  const confirmRemoveStaff = () => {
    if (!pendingRemoval) return;
    removeStaff(pendingRemoval.id);
    setPendingRemoval(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => setOpen(true)}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-[12.5px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] transition-colors hover:bg-black/85 sm:w-auto"
        >
          <Plus className="h-3.5 w-3.5" /> Recruit Staff
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        {staff.map((s, i) => {
          const tone: Tone = s.active ? "white" : "limePale";
          const cornerSide: CornerSide = i % 2 === 0 ? "tr" : "bl";
          return (
            <OrganicCard key={s.id} tone={tone} cornerSide={cornerSide} padded>
              <div className="flex w-full items-start gap-3">
                <button
                  type="button"
                  onClick={() => setDetailStaff(s)}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black text-[14px] font-semibold text-white"
                >
                  {s.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setDetailStaff(s)}
                    className="w-full text-left"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-black">{s.name}</div>
                        <div className="text-[11.5px] text-black/55">{s.role}</div>
                      </div>
                      <span className="shrink-0 font-mono text-[10px] text-black/45">{s.id}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
                      <span className="text-black/55">Department · {s.dept}</span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${
                          s.active ? "bg-[#C7F33C] text-black" : "bg-black/10 text-black/55"
                        }`}
                      >
                        {s.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </button>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => setPendingStatusChange(s)}
                      className="min-h-10 w-full rounded-full border border-[#E5E5E5] bg-white px-3 py-2 text-[11.5px] font-medium text-black transition-colors hover:border-black/20 hover:bg-[#F4F4F5] sm:min-w-[6.5rem] sm:flex-1"
                    >
                      {s.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="min-h-10 w-full rounded-full border border-[#E5E5E5] bg-white px-3 py-2 text-[11.5px] font-medium text-black transition-colors hover:border-black/20 hover:bg-[#F4F4F5] sm:min-w-[6.5rem] sm:flex-1"
                    >
                      Edit Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingRemoval(s)}
                      className="min-h-10 w-full rounded-full border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[11.5px] font-medium text-[#B91C1C] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2] sm:min-w-[6.5rem] sm:flex-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </OrganicCard>
          );
        })}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Recruit New Staff</SheetTitle>
            <SheetDescription>
              Provision a faculty / administrative profile for Silver Hills.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleRecruit} className="mt-5 space-y-3 px-1">
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
            <SheetFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
                Recruit
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(editStaff)} onOpenChange={(next) => !next && setEditStaff(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Staff Profile</SheetTitle>
            <SheetDescription>
              Update details for {editStaff?.name ?? "this staff member"}.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleEditSave} className="mt-5 space-y-3 px-1">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Full Name
              </Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="e.g. Sneha Pillai"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Role
              </Label>
              <FieldSelect
                value={editForm.role}
                onValueChange={(role) => setEditForm({ ...editForm, role })}
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
                  value={editForm.dept}
                  onValueChange={(dept) => setEditForm({ ...editForm, dept })}
                  options={departments.map((d) => ({ value: d.name, label: d.name }))}
                  placeholder="No departments configured"
                  disabled={departments.length === 0}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                  Employee ID
                </Label>
                <Input value={editForm.id} disabled className="font-mono opacity-60" />
              </div>
            </div>
            <SheetFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setEditStaff(null)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
                Save Changes
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Dialog
        open={Boolean(pendingStatusChange)}
        onOpenChange={(next) => {
          if (!next) setPendingStatusChange(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-[1.5rem] border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">
              {pendingStatusChange?.active ? "Deactivate Staff" : "Activate Staff"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60">
              {pendingStatusChange
                ? pendingStatusChange.active
                  ? `Are you sure you want to deactivate ${pendingStatusChange.name} (${pendingStatusChange.id})? They will be marked inactive on the roster.`
                  : `Are you sure you want to activate ${pendingStatusChange.name} (${pendingStatusChange.id})? They will be marked active on the roster.`
                : "Are you sure you want to change this staff member's status?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingStatusChange(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmStatusChange}
              className={
                pendingStatusChange?.active
                  ? "rounded-full bg-black text-white hover:bg-black/85"
                  : "rounded-full bg-[#C7F33C] text-black hover:bg-[#E1F2AE]"
              }
            >
              {pendingStatusChange?.active ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingRemoval)}
        onOpenChange={(next) => {
          if (!next) setPendingRemoval(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-[1.5rem] border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">Remove Staff</DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60">
              {pendingRemoval
                ? `Are you sure you want to remove ${pendingRemoval.name} (${pendingRemoval.id}) from the roster? This action cannot be undone.`
                : "Are you sure you want to remove this staff profile?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingRemoval(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmRemoveStaff}
              className="rounded-full bg-[#B91C1C] text-white hover:bg-[#991B1B]"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(detailStaff)}
        onOpenChange={(next) => {
          if (!next) setDetailStaff(null);
        }}
      >
        <DialogContent className="max-w-md rounded-[1.75rem] border border-[#E5E5E5] bg-white p-6 [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-[24px] font-semibold text-black">
              Staff Profile
            </DialogTitle>
            <DialogDescription className="text-[13px] text-black/55">
              Detailed view for selected faculty / administrative member.
            </DialogDescription>
          </DialogHeader>

          {detailStaff && (
            <div className="mt-2 space-y-3">
              <div className="rounded-2xl bg-[#F4F4F5] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-black/50">
                  Employee
                </div>
                <div className="mt-1 text-[18px] font-semibold text-black">{detailStaff.name}</div>
                <div className="text-[12px] text-black/60">{detailStaff.role}</div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#E5E5E5] p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    Employee ID
                  </div>
                  <div className="mt-1 font-mono text-[12px] text-black">{detailStaff.id}</div>
                </div>
                <div className="rounded-2xl border border-[#E5E5E5] p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    Status
                  </div>
                  <div className="mt-1 text-[12px] font-semibold text-black">
                    {detailStaff.active ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E5E5] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                  Department
                </div>
                <div className="mt-1 text-[12px] text-black">{detailStaff.dept}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPendingStatusChange(detailStaff);
                    setDetailStaff(null);
                  }}
                  className="min-h-10 rounded-full border border-[#E5E5E5] bg-white px-2 py-2 text-center text-[10px] font-medium leading-tight text-black transition-colors hover:border-black/20 hover:bg-[#F4F4F5] sm:px-3 sm:text-[11.5px]"
                >
                  {detailStaff.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openEdit(detailStaff);
                    setDetailStaff(null);
                  }}
                  className="min-h-10 rounded-full border border-[#E5E5E5] bg-white px-2 py-2 text-center text-[10px] font-medium leading-tight text-black transition-colors hover:border-black/20 hover:bg-[#F4F4F5] sm:px-3 sm:text-[11.5px]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingRemoval(detailStaff);
                    setDetailStaff(null);
                  }}
                  className="min-h-10 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-2 py-2 text-center text-[10px] font-medium leading-tight text-[#B91C1C] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2] sm:px-3 sm:text-[11.5px]"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FinanceModule() {
  type FinanceTabKey = "receive" | "make" | "analytics" | "ledger" | "pl" | "balance";

  const [tab, setTab] = useState<FinanceTabKey>("receive");
  const [sectionOpen, setSectionOpen] = useState(false);

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
    <div className="space-y-4 sm:space-y-6">
      <button
        type="button"
        onClick={() => setSectionOpen(true)}
        className="flex w-full items-center gap-3 rounded-[1.35rem] border border-[#E5E5E5] bg-white p-3.5 text-left shadow-[0_10px_28px_-24px_rgba(0,0,0,0.35)] transition-colors hover:bg-[#FAFAFA] lg:hidden"
      >
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-black text-white">
          <ActiveIcon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
            Finance Section
          </div>
          <div className="truncate text-[15px] font-semibold text-black">{activeTab.l}</div>
        </div>
        <ChevronDown className="h-5 w-5 shrink-0 text-black/45" />
      </button>

      <Sheet open={sectionOpen} onOpenChange={setSectionOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] rounded-t-[1.75rem] border-0 bg-[#0F1115] p-0 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:hidden [&>button]:hidden"
        >
          <div className="flex justify-center pt-3">
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>
          <SheetHeader className="space-y-1 px-5 pb-4 pt-2 text-left">
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
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors ${
                    active
                      ? "bg-[#C7F33C] text-black"
                      : "bg-white/[0.06] text-white hover:bg-white/[0.1]"
                  }`}
                >
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      active ? "bg-black/10" : "bg-white/10"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </div>
                  <span className="min-w-0 flex-1 text-[15px] font-medium">{t.l}</span>
                  {active && (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black text-white">
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden w-full lg:block">
        <div className="grid w-full grid-cols-12 gap-1 rounded-full border border-[#E5E5E5] bg-white p-1">
          {tabs.map((t) => {
            const active = tab === t.k;
            return (
              <button
                key={t.k}
                type="button"
                onClick={() => setTab(t.k)}
                className={`col-span-2 rounded-full px-4 py-2 text-center text-[12.5px] font-medium leading-tight transition-all ${
                  active ? "bg-black text-white shadow-sm" : "text-black/65 hover:text-black"
                }`}
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
    return matched?.fee ?? transportRoutes[0]?.fee;
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
      <OrganicCard tone="white" cornerSide="tr" padded>
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
                selected.due > 0 ? "bg-[#FEF3C7] text-black" : "bg-[#E1F2AE] text-black",
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
                      ? "border-transparent bg-[#C7F33C] text-black"
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

      <OrganicCard tone="white" cornerSide="bl" padded>
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

  return (
    <div className="grid grid-cols-12 gap-4 sm:gap-5">
      <OrganicCard tone="white" cornerSide="tr" padded className="col-span-12 lg:col-span-8">
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
            <FieldSelect
              value={mode}
              onValueChange={setMode}
              options={[
                { value: "Bank Transfer · NEFT", label: "Bank Transfer · NEFT" },
                { value: "UPI Business", label: "UPI Business" },
                { value: "Cheque", label: "Cheque" },
              ]}
            />
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

      <OrganicCard tone="white" cornerSide="bl" padded className="col-span-12 lg:col-span-4">
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
                    ? "bg-[#C7F33C] text-black ring-2 ring-black/10"
                    : "bg-[#F4F4F5] text-black hover:bg-[#ECECED]"
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
                      isSelected ? "bg-black text-[#C7F33C]" : "bg-black/10 text-black/65"
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

      <OrganicCard tone="white" cornerSide="br" padded className="col-span-12">
        <div className="text-title">Made Payment Details</div>
        <div className="mt-1 text-[11.5px] text-black/55">
          {madePayments.length} disbursals · most recent
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
                        ? "bg-[#E1F2AE] text-black"
                        : "bg-black text-[#C7F33C]",
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
          fill="#C7F33C"
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
    <div className="space-y-4 sm:space-y-6">

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
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
        <div className="col-span-12 lg:col-span-6">
          <TransportCard transportRoutes={transportRoutes} setTransportRoutes={setTransportRoutes} />
        </div>
        <div className="col-span-12 lg:col-span-6">
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
        <div className="truncate text-[18px] font-bold leading-tight tracking-tight text-black">
          {title}
        </div>
        <p className="mt-1 text-[12px] text-black/55">{subtitle}</p>
      </div>
      <button
        onClick={onAction}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-black px-3 py-2 text-[11.5px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] transition-colors hover:bg-black/85"
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
            className="rounded-full bg-[#B91C1C] text-white hover:bg-[#991B1B]"
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
    <OrganicCard tone="white" cornerSide="tr" padded>
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
                <span className="rounded-full bg-[#E1F2AE] px-2 py-0.5 font-mono text-[10px] font-semibold text-black sm:px-2.5 sm:text-[11px]">
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
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2]"
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
    <OrganicCard tone="white" cornerSide="bl" padded>
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
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2]"
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
    <OrganicCard tone="white" cornerSide="tr" padded>
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
                <span className="rounded-full bg-[#E1F2AE] px-2 py-0.5 text-[10.5px] font-semibold text-black">
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
                className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2]"
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

function TransportCard({
  transportRoutes,
  setTransportRoutes,
}: {
  transportRoutes: TransportRoute[];
  setTransportRoutes: React.Dispatch<React.SetStateAction<TransportRoute[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TransportRoute | null>(null);
  const [form, setForm] = useState({ mapFrom: "", mapTo: "", fee: "" });

  const startCreate = () => {
    setEditingId(null);
    setForm({ mapFrom: "", mapTo: "", fee: "" });
    setOpen(true);
  };
  const startEdit = (r: TransportRoute) => {
    setEditingId(r.id);
    setForm({ mapFrom: r.mapFrom, mapTo: r.mapTo, fee: String(r.fee) });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const mapFrom = form.mapFrom.trim();
    const mapTo = form.mapTo.trim();
    const fee = Number(form.fee);
    if (!mapFrom || !mapTo) {
      toast.error("Pickup hub and destination are required");
      return;
    }
    if (!fee || fee <= 0) {
      toast.error("Fee must be a positive amount");
      return;
    }
    if (editingId) {
      setTransportRoutes((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, mapFrom, mapTo, fee } : r)),
      );
      toast.success(`Route updated · ${mapFrom} → ${mapTo}`);
    } else {
      const nextId = `TR-${(transportRoutes.length + 1).toString().padStart(3, "0")}`;
      setTransportRoutes((prev) => [...prev, { id: nextId, mapFrom, mapTo, fee }]);
      toast.success(`Route added · ${mapFrom} → ${mapTo}`);
    }
    setOpen(false);
  };

  const remove = (r: TransportRoute) => {
    setTransportRoutes((prev) => prev.filter((x) => x.id !== r.id));
    toast.error(`${r.mapFrom} → ${r.mapTo} removed`);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    remove(pendingDelete);
    setPendingDelete(null);
  };

  return (
    <OrganicCard tone="white" cornerSide="bl" padded>
      <CardHeader
        title="Transport Routes"
        subtitle={`${transportRoutes.length} mapped pickup → drop pairs`}
        actionLabel="Add Route"
        onAction={startCreate}
      />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-[#EFEFEF]">
        <div className="min-w-[320px]">
          <div className="grid grid-cols-[1.4fr_1.4fr_0.7fr_auto] gap-2 bg-[#F4F4F5] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-black/55">
            <span>From</span>
            <span>To</span>
            <span className="text-right">Fee</span>
            <span />
          </div>
          {transportRoutes.length === 0 ? (
            <div className="px-3.5 py-6 text-center text-[12px] text-black/55">
              No routes mapped yet
            </div>
          ) : (
            transportRoutes.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-[1.4fr_1.4fr_0.7fr_auto] items-center gap-2 border-t border-[#EFEFEF] px-3.5 py-2.5 text-[12.5px] last:border-b-0"
              >
                <span className="truncate text-black">{r.mapFrom}</span>
                <span className="truncate text-black/75">{r.mapTo}</span>
                <span className="text-right font-mono text-black">
                  ₹ {r.fee.toLocaleString("en-IN")}
                </span>
                <div className="flex shrink-0 items-center gap-1">
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
                    className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title="Delete Transport Route"
        description={
          pendingDelete
            ? `Are you sure you want to delete the route ${pendingDelete.mapFrom} → ${pendingDelete.mapTo}? This action cannot be undone.`
            : "Are you sure you want to delete this transport route?"
        }
        onConfirm={confirmDelete}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Route" : "Add Transport Route"}</DialogTitle>
            <DialogDescription>
              Routes feed the Vehicle Fee prefill on Receive Payment when a student matches the
              pickup hub.
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
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Fee (₹)
              </Label>
              <Input
                inputMode="numeric"
                value={form.fee}
                onChange={(e) => setForm({ ...form, fee: e.target.value.replace(/[^0-9]/g, "") })}
                placeholder="0"
                className="font-mono"
              />
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
    <OrganicCard tone="white" cornerSide="tr" padded>
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
              className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#E1F2AE] px-3 py-1 text-[12px] font-semibold text-black"
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
            "h-10 w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 text-[13px] font-normal text-black shadow-none focus:ring-2 focus:ring-[#C7F33C] focus:ring-offset-0",
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
              className="cursor-pointer rounded-xl py-2 pl-3 pr-8 text-[13px] text-black focus:bg-[#E1F2AE] focus:text-black data-[highlighted]:bg-[#E1F2AE] data-[highlighted]:text-black data-[state=checked]:bg-[#C7F33C] data-[state=checked]:font-semibold data-[state=checked]:text-black"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
