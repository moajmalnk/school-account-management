import { formatEventDateTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import {
  DEFAULT_GENERAL_WHATSAPP_TEMPLATE,
  DEFAULT_OVERDUE_WHATSAPP_TEMPLATE,
  LEGACY_OVERDUE_WHATSAPP_TEMPLATES,
  renderWhatsAppTemplate,
} from "@/lib/whatsapp-notify";

const STORAGE_KEY = "feezo/whatsapp-messages/v1";

export const DEFAULT_FEE_RECEIPT_WHATSAPP = `Dear {{guardian}},

{{school}} has received a fee payment for {{student_name}} ({{class}}).

Receipt: {{receipt_no}}
Amount: {{amount}}
Paid by: {{mode}}
Date: {{date}}
Year: {{academic_year}}

The receipt PDF is attached. Thank you.`;

export const DEFAULT_FEE_REMINDER_WHATSAPP = DEFAULT_OVERDUE_WHATSAPP_TEMPLATE;

/** Bulk / multi-period reminder — Payments → WhatsApp overdue / due / all open. */
export const DEFAULT_FEE_REMINDER_BULK_WHATSAPP = `Dear {{guardian}},

{{school}} — fee reminder for *{{student_name}}* ({{class}}).

*Total balance: {{amount}}*
• Overdue: {{overdue_amount}} ({{overdue_count}} periods)
• Due: {{due_amount}} ({{due_count}} periods)
• Open: {{open_count}} · {{period_range}}
• Year: {{academic_year}} · {{fees_status}}

{{detail_block}}

Kindly arrange payment at the earliest. Thank you.`;

export const DEFAULT_PAYMENT_VOUCHER_WHATSAPP = `Hello {{payee}},

{{kind}} from {{school}} has been recorded.

Reference: {{voucher_no}}
Amount: {{amount}}
Details: {{description}}
Paid by: {{mode}}
Status: {{status}}
Date: {{date}}

Thank you.`;

const DEFAULT_ATTENDANCE_ABSENT_WHATSAPP = `Dear {{guardian}},

This is an attendance notice from {{school}} for {{student_name}} ({{class}}).

Date: {{date}}
Status: {{status}}

Please contact the school office if you have any questions.

Thank you.`;

const DEFAULT_ATTENDANCE_DAILY_REPORT_WHATSAPP = `Dear Parent,

Please find the daily attendance register from {{school}} for {{date}}.

{{summary}}

Thank you.`;

const DEFAULT_ATTENDANCE_MONTHLY_REPORT_WHATSAPP = `Dear Parent,

Please find the monthly attendance summary from {{school}} for {{period}}.

{{summary}}

Thank you.`;

export type WhatsAppMessageKind =
  | "feeReceipt"
  | "feeReminder"
  | "feeReminderBulk"
  | "paymentVoucher"
  | "attendanceAbsent"
  | "attendanceDailyReport"
  | "attendanceMonthlyReport";

export type WhatsAppMessageTemplates = Record<WhatsAppMessageKind, string>;

export const WHATSAPP_MESSAGE_FIELDS: Record<
  WhatsAppMessageKind,
  { title: string; hint: string; vars: { key: string; label: string }[] }
> = {
  feeReceipt: {
    title: "Fee receipt",
    hint: "Sent to parents when a receipt is shared on WhatsApp.",
    vars: [
      { key: "guardian", label: "Guardian" },
      { key: "student_name", label: "Student" },
      { key: "class", label: "Class" },
      { key: "student_id", label: "Student ID" },
      { key: "school", label: "School" },
      { key: "receipt_no", label: "Receipt no." },
      { key: "amount", label: "Amount" },
      { key: "mode", label: "Mode" },
      { key: "date", label: "Date" },
      { key: "academic_year", label: "Year" },
      { key: "category", label: "Category" },
    ],
  },
  feeReminder: {
    title: "Fee reminder",
    hint: "One fee line — row WhatsApp on student Payments.",
    vars: [
      { key: "guardian", label: "Guardian" },
      { key: "student_name", label: "Student" },
      { key: "class", label: "Class" },
      { key: "student_id", label: "Student ID" },
      { key: "school", label: "School" },
      { key: "amount", label: "Balance" },
      { key: "due_date", label: "Due date" },
      { key: "fees_status", label: "Status" },
      { key: "fee", label: "Fee / period" },
      { key: "charge", label: "Charge" },
      { key: "paid", label: "Paid" },
      { key: "academic_year", label: "Year" },
    ],
  },
  feeReminderBulk: {
    title: "Bulk reminder",
    hint: "Used when you WhatsApp overdue, due, or all open from student Payments. Keep it short — Detail block fills the period summary.",
    vars: [
      { key: "guardian", label: "Guardian" },
      { key: "student_name", label: "Student" },
      { key: "class", label: "Class" },
      { key: "student_id", label: "Student ID" },
      { key: "school", label: "School" },
      { key: "amount", label: "Balance" },
      { key: "open_count", label: "Open count" },
      { key: "overdue_count", label: "Overdue count" },
      { key: "due_count", label: "Due count" },
      { key: "overdue_amount", label: "Overdue amt" },
      { key: "due_amount", label: "Due amt" },
      { key: "period_range", label: "Period range" },
      { key: "each_amount", label: "Each amount" },
      { key: "fees_status", label: "Status" },
      { key: "academic_year", label: "Year" },
      { key: "detail_block", label: "Detail block" },
    ],
  },
  paymentVoucher: {
    title: "Payment voucher",
    hint: "Sent with salary slips and expense vouchers.",
    vars: [
      { key: "payee", label: "Payee" },
      { key: "school", label: "School" },
      { key: "kind", label: "Kind" },
      { key: "voucher_no", label: "Reference" },
      { key: "amount", label: "Amount" },
      { key: "description", label: "Details" },
      { key: "mode", label: "Mode" },
      { key: "status", label: "Status" },
      { key: "date", label: "Date" },
    ],
  },
  attendanceAbsent: {
    title: "Attendance alert",
    hint: "Sent to parents after saving non-Present marks.",
    vars: [
      { key: "guardian", label: "Guardian" },
      { key: "student_name", label: "Student" },
      { key: "class", label: "Class" },
      { key: "student_id", label: "Student ID" },
      { key: "school", label: "School" },
      { key: "date", label: "Date" },
      { key: "status", label: "Status" },
    ],
  },
  attendanceDailyReport: {
    title: "Daily attendance report",
    hint: "Caption when sharing the daily attendance PDF on WhatsApp.",
    vars: [
      { key: "school", label: "School" },
      { key: "date", label: "Date" },
      { key: "summary", label: "Summary" },
    ],
  },
  attendanceMonthlyReport: {
    title: "Monthly attendance report",
    hint: "Caption when sharing the monthly attendance PDF on WhatsApp.",
    vars: [
      { key: "school", label: "School" },
      { key: "period", label: "Period" },
      { key: "summary", label: "Summary" },
    ],
  },
};

export function defaultWhatsAppTemplates(): WhatsAppMessageTemplates {
  return {
    feeReceipt: DEFAULT_FEE_RECEIPT_WHATSAPP,
    feeReminder: DEFAULT_FEE_REMINDER_WHATSAPP,
    feeReminderBulk: DEFAULT_FEE_REMINDER_BULK_WHATSAPP,
    paymentVoucher: DEFAULT_PAYMENT_VOUCHER_WHATSAPP,
    attendanceAbsent: DEFAULT_ATTENDANCE_ABSENT_WHATSAPP,
    attendanceDailyReport: DEFAULT_ATTENDANCE_DAILY_REPORT_WHATSAPP,
    attendanceMonthlyReport: DEFAULT_ATTENDANCE_MONTHLY_REPORT_WHATSAPP,
  };
}

function normalizeTemplateText(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

function migrateFeeReminderTemplate(saved: string | undefined, fallback: string): string {
  const text = textOr(saved, fallback);
  const normalized = normalizeTemplateText(text);
  if (
    LEGACY_OVERDUE_WHATSAPP_TEMPLATES.some(
      (legacy) => normalizeTemplateText(legacy) === normalized,
    )
  ) {
    return fallback;
  }
  return text;
}

/** Drop label-only lines left empty when a detail was not available for this send. */
function stripEmptyLabeledLines(text: string): string {
  return text
    .replace(/^[^\n:]{1,48}:[ \t]*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function loadWhatsAppTemplates(): WhatsAppMessageTemplates {
  const defaults = defaultWhatsAppTemplates();
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<WhatsAppMessageTemplates>;
    return {
      feeReceipt: textOr(parsed.feeReceipt, defaults.feeReceipt),
      feeReminder: migrateFeeReminderTemplate(parsed.feeReminder, defaults.feeReminder),
      feeReminderBulk: textOr(parsed.feeReminderBulk, defaults.feeReminderBulk),
      paymentVoucher: textOr(parsed.paymentVoucher, defaults.paymentVoucher),
      attendanceAbsent: textOr(parsed.attendanceAbsent, defaults.attendanceAbsent),
      attendanceDailyReport: textOr(parsed.attendanceDailyReport, defaults.attendanceDailyReport),
      attendanceMonthlyReport: textOr(
        parsed.attendanceMonthlyReport,
        defaults.attendanceMonthlyReport,
      ),
    };
  } catch {
    return defaults;
  }
}

export function saveWhatsAppTemplates(next: WhatsAppMessageTemplates): void {
  const defaults = defaultWhatsAppTemplates();
  const stored: WhatsAppMessageTemplates = {
    feeReceipt: textOr(next.feeReceipt, defaults.feeReceipt),
    feeReminder: textOr(next.feeReminder, defaults.feeReminder),
    feeReminderBulk: textOr(next.feeReminderBulk, defaults.feeReminderBulk),
    paymentVoucher: textOr(next.paymentVoucher, defaults.paymentVoucher),
    attendanceAbsent: textOr(next.attendanceAbsent, defaults.attendanceAbsent),
    attendanceDailyReport: textOr(next.attendanceDailyReport, defaults.attendanceDailyReport),
    attendanceMonthlyReport: textOr(
      next.attendanceMonthlyReport,
      defaults.attendanceMonthlyReport,
    ),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

function textOr(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim() ?? "";
  return trimmed || fallback;
}

function tidyDetail(value: string): string {
  const parts = value
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
  const unique: string[] = [];
  for (const part of parts) {
    if (unique[unique.length - 1]?.toLowerCase() === part.toLowerCase()) continue;
    unique.push(part);
  }
  return unique.join(" · ");
}

export function buildFeeReceiptWhatsApp(input: {
  school: string;
  guardian?: string;
  studentName: string;
  className?: string;
  studentId?: string;
  receiptNo: string;
  amount: number;
  mode?: string;
  date?: string;
  academicYear?: string;
  category?: string;
}): string {
  const template = loadWhatsAppTemplates().feeReceipt;
  return renderWhatsAppTemplate(template, {
    guardian: input.guardian?.trim() || "Parent",
    student_name: input.studentName,
    class: input.className?.trim() || "—",
    student_id: input.studentId?.trim() || "",
    school: input.school.trim() || "School",
    receipt_no: input.receiptNo,
    amount: formatMoney(input.amount),
    mode: input.mode?.trim() || "—",
    date: input.date?.trim() || "—",
    academic_year: input.academicYear?.trim() || "",
    category: input.category?.trim() || "",
  }).trim();
}

export function feeReminderTemplateFor(hasOverdue: boolean): string {
  const saved = loadWhatsAppTemplates().feeReminder.trim();
  const customized = saved !== DEFAULT_FEE_REMINDER_WHATSAPP.trim();
  if (customized || hasOverdue) return saved;
  return DEFAULT_GENERAL_WHATSAPP_TEMPLATE;
}

/** Render the saved Fee reminder template for one student / fee line. */
export function buildFeeReminderWhatsApp(input: {
  guardian?: string;
  studentName: string;
  className?: string;
  studentId?: string;
  school: string;
  /** Outstanding balance (maps to {{amount}}). */
  amount: number;
  dueDate?: string;
  feesStatus?: string;
  academicYear?: string;
  /** Period / line label e.g. Term 2 (maps to {{fee}}). */
  feeLabel?: string;
  charge?: number;
  paid?: number;
}): string {
  const template = loadWhatsAppTemplates().feeReminder;
  const balance = Math.max(0, Number.isFinite(input.amount) ? input.amount : 0);
  const status =
    input.feesStatus?.trim() ||
    (balance > 0 ? "Due" : "Paid");
  return stripEmptyLabeledLines(
    renderWhatsAppTemplate(template, {
      guardian: input.guardian?.trim() || "Parent",
      student_name: input.studentName,
      class: input.className?.trim() || "—",
      student_id: input.studentId?.trim() || "",
      school: input.school.trim() || "School",
      amount: formatMoney(balance),
      due_date: input.dueDate?.trim() || "—",
      fees_status: status,
      status,
      academic_year: input.academicYear?.trim() || "",
      fee: input.feeLabel?.trim() || "",
      category: input.feeLabel?.trim() || "",
      charge:
        input.charge != null && Number.isFinite(input.charge)
          ? formatMoney(Math.max(0, input.charge))
          : "",
      paid:
        input.paid != null && Number.isFinite(input.paid)
          ? formatMoney(Math.max(0, input.paid))
          : "",
    }),
  );
}

export type FeeReminderLineInput = {
  label: string;
  balance: number;
  dueDate?: string;
  status?: string;
  charge?: number;
  paid?: number;
};

const BULK_LIST_LIMIT = 8;

function isOverdueStatus(status?: string): boolean {
  return (status || "").trim().toLowerCase() === "overdue";
}

type BulkFeeStats = {
  totalBalance: number;
  overdueCount: number;
  dueCount: number;
  overdueAmount: number;
  dueAmount: number;
  periodRange: string;
  eachAmount: string;
  detailBlock: string;
  feesStatus: string;
};

/** Compact detail lines for the {{detail_block}} token (keeps WhatsApp readable). */
function buildBulkFeeStats(lines: FeeReminderLineInput[]): BulkFeeStats {
  const overdue = lines.filter((line) => isOverdueStatus(line.status));
  const pending = lines.filter((line) => !isOverdueStatus(line.status));
  const overdueAmount = overdue.reduce((sum, line) => sum + line.balance, 0);
  const dueAmount = pending.reduce((sum, line) => sum + line.balance, 0);
  const totalBalance = overdueAmount + dueAmount;

  const dues = lines
    .map((line) => line.dueDate?.trim())
    .filter((value): value is string => Boolean(value && value !== "—"));
  const firstDue = dues[0];
  const lastDue = dues[dues.length - 1];
  const periodRange =
    firstDue && lastDue && firstDue !== lastDue
      ? `${firstDue} – ${lastDue}`
      : firstDue || "—";

  const byAmount = new Map<number, number>();
  for (const line of lines) {
    const key = Math.round(line.balance);
    byAmount.set(key, (byAmount.get(key) ?? 0) + 1);
  }
  const amountGroups = [...byAmount.entries()].sort((a, b) => b[1] - a[1]);
  const uniform = amountGroups.length === 1 && amountGroups[0][1] === lines.length;
  const eachAmount = uniform ? formatMoney(amountGroups[0][0]) : "";

  const block: string[] = [];
  if (uniform) {
    const [amount, count] = amountGroups[0];
    block.push(`*Detail*`);
    block.push(`${formatMoney(amount)} × ${count} = *${formatMoney(amount * count)}*`);
  } else {
    block.push("*By amount*");
    for (const [amount, count] of amountGroups.slice(0, 6)) {
      block.push(
        count === 1
          ? `• ${formatMoney(amount)}`
          : `• ${formatMoney(amount)} × ${count} = ${formatMoney(amount * count)}`,
      );
    }
    if (amountGroups.length > 6) {
      block.push(`…and ${amountGroups.length - 6} more amounts`);
    }

    if (lines.length <= BULK_LIST_LIMIT) {
      block.push("");
      block.push("*Periods*");
      for (const line of lines) {
        const due = line.dueDate?.trim();
        block.push(
          due && due !== "—"
            ? `• ${line.label} — ${formatMoney(line.balance)} (${due})`
            : `• ${line.label} — ${formatMoney(line.balance)}`,
        );
      }
    } else {
      block.push("");
      block.push("*Next periods*");
      for (const line of lines.slice(0, 5)) {
        const due = line.dueDate?.trim();
        block.push(
          due && due !== "—"
            ? `• ${line.label} — ${formatMoney(line.balance)} (${due})`
            : `• ${line.label} — ${formatMoney(line.balance)}`,
        );
      }
      block.push(`…and ${lines.length - 5} more`);
    }
  }

  return {
    totalBalance,
    overdueCount: overdue.length,
    dueCount: pending.length,
    overdueAmount,
    dueAmount,
    periodRange,
    eachAmount,
    detailBlock: block.join("\n").trim(),
    feesStatus: overdue.length > 0 ? "Overdue" : "Due",
  };
}

/** Multi-period reminder — uses Settings → WhatsApp → Bulk reminder template. */
export function buildBulkFeeReminderWhatsApp(input: {
  guardian?: string;
  studentName: string;
  className?: string;
  studentId?: string;
  school: string;
  academicYear?: string;
  lines: FeeReminderLineInput[];
}): string {
  const open = input.lines.filter((line) => line.balance > 0);
  if (open.length === 0) return "";
  if (open.length === 1) {
    const only = open[0];
    return buildFeeReminderWhatsApp({
      guardian: input.guardian,
      studentName: input.studentName,
      className: input.className,
      studentId: input.studentId,
      school: input.school,
      academicYear: input.academicYear,
      amount: only.balance,
      dueDate: only.dueDate,
      feesStatus: only.status,
      feeLabel: only.label,
      charge: only.charge,
      paid: only.paid,
    });
  }

  const stats = buildBulkFeeStats(open);
  const template = loadWhatsAppTemplates().feeReminderBulk;
  return stripEmptyLabeledLines(
    renderWhatsAppTemplate(template, {
      guardian: input.guardian?.trim() || "Parent",
      student_name: input.studentName,
      class: input.className?.trim() || "—",
      student_id: input.studentId?.trim() || "",
      school: input.school.trim() || "School",
      amount: formatMoney(stats.totalBalance),
      open_count: String(open.length),
      overdue_count: String(stats.overdueCount),
      due_count: String(stats.dueCount),
      overdue_amount: formatMoney(stats.overdueAmount),
      due_amount: formatMoney(stats.dueAmount),
      period_range: stats.periodRange,
      period_from: stats.periodRange.split("–")[0]?.trim() || "",
      period_to: stats.periodRange.split("–")[1]?.trim() || "",
      each_amount: stats.eachAmount,
      fees_status: stats.feesStatus,
      status: stats.feesStatus,
      academic_year: input.academicYear?.trim() || "",
      detail_block: stats.detailBlock,
      summary: stats.detailBlock,
    }),
  );
}

export function buildPaymentVoucherWhatsApp(input: {
  school: string;
  payee: string;
  payeeType?: string;
  voucherNo: string;
  description?: string;
  mode?: string;
  amount: number;
  status?: string;
  time?: string;
}): string {
  const salary = (input.payeeType || "").toLowerCase() === "salary";
  const template = loadWhatsAppTemplates().paymentVoucher;
  return renderWhatsAppTemplate(template, {
    payee: input.payee.trim() || "there",
    school: input.school.trim() || "School",
    kind: salary ? "Salary payment" : "Payment",
    voucher_no: input.voucherNo,
    description: tidyDetail(input.description || (salary ? "Salary" : "Payment")),
    mode: input.mode?.trim() || "—",
    amount: formatMoney(input.amount),
    status: input.status?.trim() || "Cleared",
    date: input.time ? formatEventDateTime(input.time) : "—",
  }).trim();
}
