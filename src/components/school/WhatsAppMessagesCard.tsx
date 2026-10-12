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

const ORDER: WhatsAppMessageKind[] = ["feeReceipt", "feeReminder", "paymentVoucher"];

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
        : {
            guardian: "Rajesh Sharma",
            student_name: "Ararav Sharma",
            class: "2025 - JULY",
            student_id: "STU-2887",
            school,
            receipt_no: "RC-1023",
            amount: active === "feeReminder" ? "SAR 61,000" : "SAR 46,000",
            mode: "Bank",
            date: "12 Oct 2026",
            academic_year: "AY 2025-26",
            category: "Tuition",
            due_date: "31 Oct 2026",
            fees_status: "Overdue",
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
          <p className="mt-0.5 max-w-xl text-[11px] leading-relaxed text-black/45">
            The message parents and payees receive. Tap a detail to place it in the sentence — it
            fills in for each person. Saved on this device for {school}.
          </p>
        </div>
        <Button
          type="button"
          className="h-8 rounded-full bg-black px-3 text-[12px] text-white hover:bg-black/85"
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
                  : "rounded-full border border-[#E5E5E5] bg-white px-3 py-1 text-[12px] font-medium text-black/60 hover:border-black/30 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300"
              }
            >
              {WHATSAPP_MESSAGE_FIELDS[kind].title}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <p className="text-[11px] text-black/45">{meta.hint}</p>
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
            className="mt-2 text-[11px] font-medium text-black/45 underline-offset-2 hover:text-black hover:underline"
          >
            Reset this message
          </button>
        </div>
        <WhatsAppChatPreview
          title={active === "paymentVoucher" ? "Suhail K K" : "Rajesh Sharma"}
          message={preview}
        />
      </div>
    </div>
  );
}

function WhatsAppChatPreview({ title, message }: { title: string; message: string }) {
  const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-xl border border-[#d1d7db] bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-[#e9edef] bg-[#f0f2f5] px-3 py-2">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#dfe5e7] text-[12px] font-semibold text-[#54656f]">
          {initials || "?"}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-medium leading-tight text-[#111b21]">{title}</div>
          <div className="text-[12px] leading-tight text-[#667781]">online</div>
        </div>
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto px-[12px] py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          backgroundColor: "#efeae2",
          backgroundImage:
            "radial-gradient(rgba(11,20,26,0.045) 0.6px, transparent 0.7px), radial-gradient(rgba(11,20,26,0.03) 0.6px, transparent 0.7px)",
          backgroundPosition: "0 0, 18px 22px",
          backgroundSize: "36px 36px",
        }}
      >
        <div className="relative ml-auto w-fit max-w-[92%] rounded-[7.5px] rounded-tr-[0] bg-[#d9fdd3] px-[9px] pb-1 pt-[6px] text-[#d9fdd3] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
          <svg viewBox="0 0 8 13" width="8" height="13" aria-hidden className="absolute -right-2 top-0">
            <path
              fill="rgba(11,20,26,0.13)"
              d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"
            />
            <path fill="currentColor" d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" />
          </svg>
          <div
            className="whitespace-pre-wrap break-words text-[14.2px] leading-[19px] text-[#111b21] after:clear-both after:block after:content-['']"
            style={{ fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif' }}
          >
            {message || "Write a message to see it here."}
            <span className="float-right ml-3 mt-[6px] inline-flex translate-y-[3px] items-center gap-[3px] text-[11px] leading-none text-[#667781]">
              {time}
              <svg viewBox="0 0 16 11" width="16" height="11" aria-hidden className="block">
                <path
                  fill="#53bdeb"
                  d="m10.9 1.1-6.4 6.4L2.2 5.2 1.1 6.3l3.4 3.4 7.5-7.5-1.1-1.1z"
                />
                <path
                  fill="#53bdeb"
                  d="m15.2 1.1-6.4 6.4-.7-.7-1.1 1.1 1.8 1.8 7.5-7.5-1.1-1.1z"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
