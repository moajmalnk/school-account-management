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

export const DEFAULT_PAYMENT_VOUCHER_WHATSAPP = `Hello {{payee}},

{{kind}} from {{school}} has been recorded.

Reference: {{voucher_no}}
Amount: {{amount}}
Details: {{description}}
Paid by: {{mode}}
Status: {{status}}
Date: {{date}}

Thank you.`;

export type WhatsAppMessageKind = "feeReceipt" | "feeReminder" | "paymentVoucher";

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
    hint: "Used for parent reminders from the student list and Payments → WhatsApp.",
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
};

export function defaultWhatsAppTemplates(): WhatsAppMessageTemplates {
  return {
    feeReceipt: DEFAULT_FEE_RECEIPT_WHATSAPP,
    feeReminder: DEFAULT_FEE_REMINDER_WHATSAPP,
    paymentVoucher: DEFAULT_PAYMENT_VOUCHER_WHATSAPP,
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
      paymentVoucher: textOr(parsed.paymentVoucher, defaults.paymentVoucher),
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
    paymentVoucher: textOr(next.paymentVoucher, defaults.paymentVoucher),
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
