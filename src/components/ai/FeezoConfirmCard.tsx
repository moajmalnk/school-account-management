import { Check, Loader2, X } from "lucide-react";

import type { FeezoPendingAction } from "@/lib/api/ai";
import { cn, glassInsetClass } from "@/lib/utils";

type Props = {
  action: FeezoPendingAction;
  locale: "en" | "ml";
  confirming: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

type Row = { label: string; value: string };

const LABEL_EN: Record<string, string> = {
  name: "Name",
  amount: "Amount",
  cat: "Category",
  mode: "Payment mode",
  payerType: "Payer type",
  payeeType: "Payee type",
  payee: "Payee",
  studentId: "Student ID",
  staffId: "Staff ID",
  id: "ID",
  reduceDue: "Reduce fee due",
  time: "Date & time",
  narration: "Narration",
  desc: "Description",
  cls: "Class",
  guardian: "Guardian",
  phone: "Phone",
  email: "Email",
  address: "Address",
  gender: "Gender",
  admissionNumber: "Admission no.",
  role: "Role",
  dept: "Department",
  basicSalary: "Basic salary",
  joinedAt: "Joined on",
  status: "Status",
  academicYear: "Academic year",
  className: "Class",
  feePeriod: "Fee period",
  feeMonth: "Fee month",
  feePeriodKind: "Period type",
  hard: "Permanent delete",
  area: "Settings area",
  summary: "Summary",
};

const LABEL_ML: Record<string, string> = {
  name: "പേര്",
  amount: "തുക",
  cat: "വിഭാഗം",
  mode: "പേയ്മെന്റ് രീതി",
  payerType: "പേയർ തരം",
  payeeType: "പേയീ തരം",
  payee: "പേയീ",
  studentId: "വിദ്യാർത്ഥി ID",
  staffId: "സ്റ്റാഫ് ID",
  id: "ID",
  reduceDue: "കുടിശ്ശിക കുറയ്ക്കുക",
  time: "തീയതി & സമയം",
  narration: "വിവരണം",
  desc: "വിവരണം",
  cls: "ക്ലാസ്",
  guardian: "രക്ഷിതാവ്",
  phone: "ഫോൺ",
  email: "ഇമെയിൽ",
  address: "വിലാസം",
  gender: "ലിംഗം",
  admissionNumber: "അഡ്മിഷൻ നമ്പർ",
  role: "റോൾ",
  dept: "വകുപ്പ്",
  basicSalary: "അടിസ്ഥാന ശമ്പളം",
  joinedAt: "ചേർന്ന തീയതി",
  status: "സ്ഥിതി",
  academicYear: "അക്കാദമിക് വർഷം",
  className: "ക്ലാസ്",
  feePeriod: "ഫീസ് കാലയളവ്",
  feeMonth: "ഫീസ് മാസം",
  feePeriodKind: "കാലയളവ് തരം",
  hard: "ശാശ്വതമായി ഇക്കുക",
  area: "സെറ്റിംഗ്സ് ഏരിയ",
  summary: "സംഗ്രഹം",
};

const HIDDEN_KEYS = new Set([
  "payload",
  "attachments",
  "documents",
  "additionalAllowances",
  "fields",
]);

function humanLabel(key: string, locale: "en" | "ml"): string {
  const map = locale === "ml" ? LABEL_ML : LABEL_EN;
  if (map[key]) return map[key];
  // camelCase / snake_case → Title Case
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMoney(n: number): string {
  return `₹ ${n.toLocaleString("en-IN")}`;
}

function formatValue(key: string, value: unknown, locale: "en" | "ml"): string {
  if (value == null || value === "") return "—";

  if (typeof value === "boolean") {
    if (locale === "ml") return value ? "അതെ" : "അല്ല";
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    if (
      key === "amount" ||
      key === "due" ||
      key === "basicSalary" ||
      key.toLowerCase().includes("amount") ||
      key.toLowerCase().includes("salary") ||
      key.toLowerCase().includes("fee")
    ) {
      return formatMoney(value);
    }
    return value.toLocaleString("en-IN");
  }

  if (typeof value === "string") {
    // ISO datetime
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString(locale === "ml" ? "en-IN" : "en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }
    }
    // Date only
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const d = new Date(`${value}T00:00:00`);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(", ");
  }

  if (typeof value === "object") {
    // Flatten one level for nested objects (e.g. settings payload)
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v != null && v !== "")
      .slice(0, 6)
      .map(([k, v]) => `${humanLabel(k, locale)}: ${formatValue(k, v, locale)}`)
      .join(" · ");
  }

  return String(value);
}

function preferredOrder(api: string): string[] {
  if (api.startsWith("finance.payments")) {
    return ["name", "amount", "cat", "mode", "payerType", "studentId", "className", "academicYear", "feePeriod", "feeMonth", "reduceDue", "time", "narration"];
  }
  if (api.startsWith("finance.disbursements")) {
    return ["payee", "name", "amount", "mode", "payeeType", "desc", "narration", "status", "time"];
  }
  if (api.startsWith("students")) {
    return ["id", "name", "cls", "guardian", "phone", "email", "due", "admissionNumber", "gender", "address", "hard"];
  }
  if (api.startsWith("staff")) {
    return ["id", "name", "role", "dept", "phone", "basicSalary", "joinedAt", "hard"];
  }
  if (api.startsWith("settings")) {
    return ["area", "summary"];
  }
  return [];
}

function buildRows(action: FeezoPendingAction, locale: "en" | "ml"): Row[] {
  const payload = action.payload ?? {};
  // Unwrap nested payload for settings patches
  const source: Record<string, unknown> =
    payload.payload && typeof payload.payload === "object" && !Array.isArray(payload.payload)
      ? { ...payload, ...(payload.payload as Record<string, unknown>) }
      : { ...payload };

  delete source.payload;

  const order = preferredOrder(action.api);
  const keys = [
    ...order.filter((k) => k in source && !HIDDEN_KEYS.has(k)),
    ...Object.keys(source).filter((k) => !order.includes(k) && !HIDDEN_KEYS.has(k)),
  ];

  const rows: Row[] = [];
  for (const key of keys) {
    const raw = source[key];
    if (raw == null || raw === "") continue;
    if (typeof raw === "object" && !Array.isArray(raw) && Object.keys(raw as object).length === 0) {
      continue;
    }
    rows.push({
      label: humanLabel(key, locale),
      value: formatValue(key, raw, locale),
    });
  }
  return rows.slice(0, 14);
}

export function FeezoConfirmCard({ action, locale, confirming, onConfirm, onDismiss }: Props) {
  if (action.status === "confirmed") {
    return (
      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
        {locale === "ml" ? "സ്ഥിരീകരിച്ചു" : "Confirmed"} — {action.summary}
      </div>
    );
  }
  if (action.status === "dismissed") {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs text-slate-500 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-400">
        {locale === "ml" ? "റദ്ദാക്കി" : "Cancelled"} — {action.summary}
      </div>
    );
  }

  const rows = buildRows(action, locale);

  return (
    <div
      className={cn(
        glassInsetClass,
        "space-y-3 rounded-2xl border border-amber-200/70 bg-amber-50/80 p-3 dark:border-amber-900/40 dark:bg-amber-950/30",
      )}
    >
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
          {locale === "ml" ? "സ്ഥിരീകരണം ആവശ്യമാണ്" : "Verification required"}
        </div>
        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-zinc-100">{action.summary}</p>

        {rows.length > 0 ? (
          <div className="mt-2 overflow-hidden rounded-xl border border-amber-200/60 bg-white/90 dark:border-amber-900/30 dark:bg-zinc-950/60">
            <table className="w-full text-left text-[11px]">
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={`${row.label}-${i}`}
                    className="border-b border-slate-100 last:border-b-0 dark:border-white/5"
                  >
                    <th
                      scope="row"
                      className="w-[38%] whitespace-nowrap px-2.5 py-1.5 align-top font-medium text-slate-500 dark:text-zinc-400"
                    >
                      {row.label}
                    </th>
                    <td className="px-2.5 py-1.5 font-semibold text-slate-800 dark:text-zinc-100">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={confirming}
          onClick={onConfirm}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d6a63] disabled:opacity-60"
        >
          {confirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {locale === "ml" ? "സ്ഥിരീകരിച്ച് ചെയ്യുക" : "Verify & Confirm"}
        </button>
        <button
          type="button"
          disabled={confirming}
          onClick={onDismiss}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <X className="h-3.5 w-3.5" />
          {locale === "ml" ? "റദ്ദാക്കുക" : "Cancel"}
        </button>
      </div>
    </div>
  );
}
