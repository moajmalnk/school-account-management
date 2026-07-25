/** BugRicer Notify API — WhatsApp bulk/single send + Jinja-style templates */

import type { ClassConfig, Student } from "@/lib/tenant-store";

const DEFAULT_API_KEY = "0fd1dd43b6c3ff5bb3770dfdd9c5346a";
const DIRECT_ENDPOINT = "https://notifyapi.bugricer.com/wapp/api/send";

/** Prefer Vite proxy in dev to avoid CORS; fall back to direct endpoint. */
function sendEndpoint() {
  if (import.meta.env.DEV) return "/api/bugricer-whatsapp/send";
  return DIRECT_ENDPOINT;
}

export function toNotifyWhatsAppNumber(raw?: string): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length >= 10) return digits;
  return null;
}

export type WhatsAppNotifyResult = {
  ok: boolean;
  status: number;
  body: string;
};

export async function sendWhatsAppNotify(params: {
  numbers: string[];
  message: string;
  apiKey?: string;
}): Promise<WhatsAppNotifyResult> {
  const unique = Array.from(
    new Set(params.numbers.map((n) => n.replace(/\D/g, "")).filter(Boolean)),
  );
  if (!unique.length) {
    throw new Error("No valid phone numbers to message");
  }
  const msg = params.message.trim();
  if (!msg) {
    throw new Error("Message is required");
  }

  const form = new FormData();
  form.append("apikey", params.apiKey || DEFAULT_API_KEY);
  form.append("number", unique.join(","));
  form.append("msg", msg);

  const res = await fetch(sendEndpoint(), {
    method: "POST",
    body: form,
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

/** Detects `{{ var }}` placeholders that need per-recipient rendering. */
export function templateHasPlaceholders(template: string) {
  return /\{\{\s*[\w.]+\s*\}\}/.test(template);
}

/** Simple Jinja-style `{{ variable }}` substitution (no filters / control flow). */
export function renderWhatsAppTemplate(
  template: string,
  vars: Record<string, string | number | undefined | null>,
) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
    const value = vars[key];
    if (value === undefined || value === null) return "";
    return String(value);
  });
}

export const WHATSAPP_TEMPLATE_VARS = [
  { key: "guardian", label: "Guardian" },
  { key: "student_name", label: "Student" },
  { key: "class", label: "Class" },
  { key: "student_id", label: "Student ID" },
  { key: "amount", label: "Amount" },
  { key: "due_date", label: "Due date" },
  { key: "fees_status", label: "Fees status" },
  { key: "school", label: "School" },
] as const;

export const DEFAULT_OVERDUE_WHATSAPP_TEMPLATE = `Dear {{guardian}},

This is a fee reminder from {{school}} for {{student_name}} ({{class}}).

Outstanding balance: ₹ {{amount}}
Due by: {{due_date}}

Kindly clear the dues at the earliest.

Thank you.`;

export const DEFAULT_GENERAL_WHATSAPP_TEMPLATE = `Dear {{guardian}},

This is a message from {{school}} regarding {{student_name}} ({{class}}).

Thank you.`;

function endOfMonthLabel(date = new Date()) {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return end.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function academicYearEndLabel(date = new Date()) {
  // Indian AY typically ends 31 Mar; if we're past Mar, use next year's Mar.
  const year = date.getMonth() >= 3 ? date.getFullYear() + 1 : date.getFullYear();
  return new Date(year, 2, 31).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function resolveStudentDueDate(
  student: Student,
  classes?: ClassConfig[],
): string {
  const cls = classes?.find((c) => c.className === student.cls);
  if (cls?.billingCycle === "Annually") return academicYearEndLabel();
  return endOfMonthLabel();
}

export function formatInrAmount(amount: number) {
  return amount.toLocaleString("en-IN");
}

export function buildStudentWhatsAppVars(
  student: Student,
  options?: {
    schoolName?: string;
    classes?: ClassConfig[];
  },
): Record<string, string> {
  const amount = Number.isFinite(student.due) ? student.due : 0;
  const dueDate = resolveStudentDueDate(student, options?.classes);
  const school = options?.schoolName?.trim() || "School";
  const feesStatus = amount > 0 ? "Overdue" : "Paid";

  return {
    guardian: student.guardian || "Parent",
    guardian_name: student.guardian || "Parent",
    student_name: student.name,
    name: student.name,
    class: student.cls,
    cls: student.cls,
    student_id: student.id,
    id: student.id,
    amount: formatInrAmount(amount),
    overdue_amount: formatInrAmount(amount),
    due: formatInrAmount(amount),
    amount_raw: String(amount),
    due_date: dueDate,
    fees_status: feesStatus,
    status: feesStatus,
    school,
    school_name: school,
    phone: student.phone ?? "",
  };
}

export async function sendPersonalizedWhatsApp(params: {
  recipients: { number: string; message: string }[];
  apiKey?: string;
  /** Small delay between sends to avoid rate limits */
  delayMs?: number;
}): Promise<{ sent: number; failed: number; errors: string[] }> {
  const delayMs = params.delayMs ?? 250;
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < params.recipients.length; i++) {
    const row = params.recipients[i];
    try {
      const result = await sendWhatsAppNotify({
        numbers: [row.number],
        message: row.message,
        apiKey: params.apiKey,
      });
      if (result.ok) {
        sent += 1;
      } else {
        failed += 1;
        errors.push(`${row.number}: ${result.body.slice(0, 120) || `HTTP ${result.status}`}`);
      }
    } catch (err) {
      failed += 1;
      errors.push(
        `${row.number}: ${err instanceof Error ? err.message : "Network error"}`,
      );
    }
    if (i < params.recipients.length - 1 && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return { sent, failed, errors };
}
