import { useMemo, useState } from "react";
import { toast } from "sonner";

import { WhatsAppMessageComposer } from "@/components/school/WhatsAppMessageComposer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  WHATSAPP_MESSAGE_FIELDS,
  defaultWhatsAppTemplates,
  loadWhatsAppTemplates,
  saveWhatsAppTemplates,
  type WhatsAppMessageKind,
  type WhatsAppMessageTemplates,
} from "@/lib/whatsapp-messages";
import { renderWhatsAppTemplate } from "@/lib/whatsapp-notify";
import { useTenantStore } from "@/lib/tenant-store";

const ORDER: WhatsAppMessageKind[] = [
  "feeReceipt",
  "feeReminder",
  "feeReminderBulk",
  "paymentVoucher",
  "attendanceAbsent",
  "attendanceDailyReport",
  "attendanceMonthlyReport",
];

export function WhatsAppMessagesCard() {
  const { schoolDetails } = useTenantStore();
  const schoolName = schoolDetails.name || "";
  const [draft, setDraft] = useState<WhatsAppMessageTemplates>(() => loadWhatsAppTemplates());
  const [active, setActive] = useState<WhatsAppMessageKind>("feeReceipt");
  const school = schoolName.trim() || "School";
  const meta = WHATSAPP_MESSAGE_FIELDS[active];

  const preview = useMemo(() => {
    const sample =
      active === "paymentVoucher"
        ? {
            payee: "Suhail K K",
            school,
            kind: "Salary payment",
            voucher_no: "DISB-356790",
            amount: "SAR 28,846",
            description: "Graphic Designer · September 2026",
            mode: "Bank",
            status: "Cleared",
            date: "7 Oct 2026, 10:30",
          }
        : active === "feeReminderBulk"
          ? {
              guardian: "Mohan Krishnan",
              student_name: "Aanya Krishnan",
              class: "Grade 8 - B",
              student_id: "STU-031",
              school,
              amount: "SAR 57,600",
              open_count: "36",
              overdue_count: "31",
              due_count: "5",
              overdue_amount: "SAR 49,600",
              due_amount: "SAR 8,000",
              period_range: "1 Apr 2024 – 1 Mar 2027",
              each_amount: "SAR 1,600",
              fees_status: "Overdue",
              academic_year: "AY 2025-26",
              detail_block: "*Detail*\nSAR 1,600 × 36 = *SAR 57,600*",
            }
          : active === "attendanceAbsent"
            ? {
                guardian: "Rajesh Sharma",
                student_name: "Ararav Sharma",
                class: "Grade 8 - B",
                student_id: "STU-2887",
                school,
                date: "18 Oct 2026",
                status: "Absent",
              }
            : active === "attendanceDailyReport"
              ? {
                  school,
                  date: "18 Oct 2026",
                  summary: "Present 976 · Absent 54 · Halfday 53 · Leave 61",
                }
              : active === "attendanceMonthlyReport"
                ? {
                    school,
                    period: "October 2026",
                    summary: "1,144 students · avg 88% present",
                  }
                : {
                    guardian: "Rajesh Sharma",
                    student_name: "Ararav Sharma",
                    class: "Grade 8 - B",
                    student_id: "STU-2887",
                    school,
                    receipt_no: "RC-1023",
                    amount: active === "feeReminder" ? "SAR 5,000" : "SAR 46,000",
                    mode: "Bank",
                    date: "12 Oct 2026",
                    academic_year: "AY 2025-26",
                    category: "Tuition",
                    due_date: "10 Sep 2026",
                    fees_status: "Overdue",
                    fee: "Term 2",
                    charge: "SAR 5,000",
                    paid: "SAR 0",
                  };
    return renderWhatsAppTemplate(draft[active], sample).trim();
  }, [active, draft, school]);

  const save = () => {
    saveWhatsAppTemplates(draft);
    setDraft(loadWhatsAppTemplates());
    toast.success("WhatsApp messages saved", {
      description: "New shares use this wording. Earlier chats stay as sent.",
    });
  };

  const resetActive = () => {
    const defaults = defaultWhatsAppTemplates();
    setDraft((prev) => ({ ...prev, [active]: defaults[active] }));
  };

  return (
    <div className="col-span-12 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5 dark:border-white/10 dark:bg-zinc-900/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
            WhatsApp messages
          </Label>
          <p className="mt-0.5 max-w-xl text-[11px] leading-relaxed text-black/45 dark:text-zinc-400">
            Manage fee, voucher, and attendance WhatsApp wording. Tap a detail to insert it — saved
            on this device for {school}.
          </p>
        </div>
        <Button
          type="button"
          className="h-8 rounded-full bg-black px-3 text-[12px] text-white hover:bg-black/85 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          onClick={save}
        >
          Save messages
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {ORDER.map((kind) => {
          const selected = kind === active;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => setActive(kind)}
              className={
                selected
                  ? "rounded-full bg-[#0F766E] px-3 py-1 text-[12px] font-semibold text-white"
                  : "rounded-full border border-[#E5E5E5] bg-white px-3 py-1 text-[12px] font-medium text-black/60 hover:border-black/30 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-zinc-100"
              }
            >
              {WHATSAPP_MESSAGE_FIELDS[kind].title}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <p className="text-[11px] text-black/45 dark:text-zinc-400">{meta.hint}</p>
          <div className="mt-2">
            <WhatsAppMessageComposer
              value={draft[active]}
              onChange={(next) => setDraft((prev) => ({ ...prev, [active]: next }))}
              fields={meta.vars}
              placeholder="Write the message in plain words…"
            />
          </div>
          <button
            type="button"
            onClick={resetActive}
            className="mt-2 text-[11px] font-medium text-black/45 underline-offset-2 hover:text-black hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Reset this message
          </button>
        </div>
        <WhatsAppChatPreview
          title={
            active === "paymentVoucher"
              ? "Suhail K K"
              : active === "feeReminderBulk"
                ? "Mohan Krishnan"
                : "Rajesh Sharma"
          }
          message={preview}
        />
      </div>
    </div>
  );
}

/** WhatsApp Web–accurate chat wallpaper (doodle icons on #efeae2). */
const WA_WALLPAPER = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" viewBox="0 0 260 260">
    <g fill="none" stroke="#0b141a" stroke-opacity="0.045" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M28 36c8-10 22-8 28 2 4 7 2 16-5 21-8 6-19 4-24-4-4-7-3-14 1-19z"/>
      <path d="M92 48h18M101 39v18"/>
      <circle cx="168" cy="42" r="11"/>
      <path d="M162 42h12M168 36v12"/>
      <path d="M220 34l14 8-14 8-14-8z"/>
      <path d="M40 110c0-8 6-14 14-14h10v28H54c-8 0-14-6-14-14z"/>
      <path d="M98 98c10 0 18 8 18 18s-8 18-18 18-18-8-18-18 8-18 18-18z"/>
      <path d="M98 108v16M90 116h16"/>
      <path d="M160 102h28v22h-28z"/>
      <path d="M166 102v-6h16v6"/>
      <path d="M218 108c8-2 16 4 14 12-2 6-8 10-14 8l-10 6 2-12c-4-4-4-10 0-14 2-2 5-2 8 0z"/>
      <path d="M36 178h22l-4 10H32z"/>
      <circle cx="47" cy="198" r="7"/>
      <path d="M96 172c12 0 20 10 16 20-3 8-12 12-20 9"/>
      <path d="M158 176l18-8 8 18-18 8z"/>
      <path d="M214 174h24v8h-24zM218 182h16v16h-16z"/>
      <path d="M48 236c10-6 22 0 24 12"/>
      <path d="M110 230h20M120 220v20"/>
      <circle cx="178" cy="236" r="9"/>
      <path d="M222 228c8 4 12 14 6 22"/>
    </g>
  </svg>`,
)}")`;

function WhatsAppChatPreview({ title, message }: { title: string; message: string }) {
  const time = new Date()
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s?[AP]M$/i, "")
    .trim();
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="force-light flex h-full min-h-[320px] flex-col overflow-hidden rounded-xl border border-[#d1d7db] bg-[#ffffff] text-[#111b21] shadow-[0_1px_3px_rgba(11,20,26,0.08)] dark:border-[#3b4a54] dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
      style={{
        fontFamily: '"Segoe UI","Helvetica Neue",Helvetica,Arial,sans-serif',
        colorScheme: "light",
      }}
    >
      {/* Chat header — WhatsApp Web (always light) */}
      <div className="flex items-center gap-3 border-b border-[#e9edef] bg-[#f0f2f5] px-4 py-2.5">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[13px] font-semibold tracking-wide"
          style={{ backgroundColor: "#dfe5e7", color: "#54656f" }}
        >
          {initials || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-normal leading-[21px]" style={{ color: "#111b21" }}>
            {title}
          </div>
          <div className="text-[13px] leading-[18px]" style={{ color: "#667781" }}>
            online
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-5" style={{ color: "#54656f" }}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden fill="currentColor">
            <path d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.6 1.6-4.2 0-3.5-2.9-6.4-6.4-6.4S3.5 6.3 3.5 9.8s2.9 6.4 6.4 6.4c1.6 0 3.1-.6 4.2-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5.1-5zm-6 0c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z" />
          </svg>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden fill="currentColor">
            <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 15z" />
          </svg>
        </div>
      </div>

      {/* Message pane */}
      <div
        className="relative min-h-0 flex-1 overflow-y-auto px-4 py-3 [scrollbar-width:thin] [scrollbar-color:#cfcfcf_transparent]"
        style={{
          backgroundColor: "#efeae2",
          backgroundImage: WA_WALLPAPER,
          backgroundRepeat: "repeat",
          backgroundSize: "260px 260px",
          color: "#111b21",
        }}
      >
        <div className="flex justify-end">
          <div
            className="relative max-w-[85%] rounded-[7.5px] rounded-tr-[0] px-[9px] pb-[5px] pt-[6px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]"
            style={{ backgroundColor: "#d9fdd3", color: "#d9fdd3" }}
          >
            {/* Outgoing bubble tail */}
            <svg
              viewBox="0 0 8 13"
              width="8"
              height="13"
              aria-hidden
              className="absolute -right-[7px] top-0"
            >
              <path
                fill="rgba(11,20,26,0.13)"
                d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"
              />
              <path
                fill="#d9fdd3"
                d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z"
              />
            </svg>
            <div
              className="whitespace-pre-wrap break-words text-[14.2px] font-normal leading-[19px] after:clear-both after:block after:content-['']"
              style={{ color: "#111b21" }}
            >
              {message || "Write a message to see it here."}
              <span
                className="float-right ml-3 mt-[5px] inline-flex translate-y-[2px] items-center gap-[3px] text-[11px] leading-none"
                style={{ color: "#667781" }}
              >
                {time}
                {/* Double blue ticks (read) */}
                <svg viewBox="0 0 16 11" width="16" height="11" aria-hidden className="block">
                  <path
                    fill="#53bdeb"
                    d="M11.071.593 4.5 7.164 1.929 4.593.5 6.021l4 4 8-8L11.071.593z"
                  />
                  <path
                    fill="#53bdeb"
                    d="M15.071.593 8.5 7.164l-.9-.9-1.429 1.428 2.329 2.329 8-8L15.071.593z"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview-only composer (no emoji control) */}
      <div
        className="flex items-center gap-2.5 px-3 py-2.5"
        style={{ backgroundColor: "#f0f2f5" }}
      >
        <div
          className="flex min-h-[42px] min-w-0 flex-1 items-center rounded-full px-4 text-[15px] leading-none"
          style={{ backgroundColor: "#ffffff", color: "#8696a0" }}
        >
          Type a message
        </div>
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          aria-hidden
          className="shrink-0"
          fill="#54656f"
        >
          <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z" />
        </svg>
      </div>
    </div>
  );
}
