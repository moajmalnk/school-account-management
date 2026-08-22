import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";

import { SupportComposer } from "@/components/support/SupportComposer";
import { SupportMessageContent } from "@/components/support/SupportMessageContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrganicCard } from "@/components/ui/organic-card";
import { useAuth } from "@/lib/auth";
import { ApiError, getApiToken } from "@/lib/api/client";
import {
  createSupportTicket,
  fetchSupportDesk,
  fetchSupportTickets,
  formatWhatsAppDisplay,
  markSupportTicketRead,
  matchSupportFaq,
  replySupportTicket,
  whatsappDigits,
  type SupportAttachment,
  type SupportFaq,
  type SupportSettings,
  type SupportTicket,
  type SupportTicketStatus,
} from "@/lib/api/support";
import { useTenantStore } from "@/lib/tenant-store";
import { cn, glassCardClass } from "@/lib/utils";

const workspacePanelClass = cn(glassCardClass, "rounded-2xl");

type ChatLine = {
  id: string;
  role: "bot" | "you";
  body: string;
  pendingTicket?: string;
};

function WhatsAppMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.04 2c-5.46 0-9.91 4.43-9.91 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.9-4.44 9.9-9.9C21.94 6.43 17.5 2 12.04 2zm5.79 14.15c-.24.68-1.4 1.25-1.94 1.33-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.66-.61-2.92-1.26-4.83-4.2-4.98-4.39-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.24-.27.64-.39 1.02-.39.12 0 .23 0 .33.01.29.01.44.03.63.49.24.55.82 2 .89 2.15.07.14.12.31.02.5-.09.2-.14.32-.28.49-.14.17-.29.38-.42.51-.14.14-.28.29-.12.56.16.27.7 1.16 1.5 1.88 1.04.93 1.91 1.22 2.18 1.36.27.14.43.12.59-.07.16-.2.69-.8.87-1.08.18-.27.37-.23.62-.14.25.09 1.6.76 1.87.89.27.14.45.2.52.32.07.12.07.68-.17 1.36z"
      />
    </svg>
  );
}

const STATUS_LABEL: Record<SupportTicketStatus, string> = {
  open: "Waiting",
  answered: "Replied",
  closed: "Closed",
};

function formatStamp(raw: string): string {
  const parsed = Date.parse(raw.replace(" ", "T"));
  if (!Number.isFinite(parsed)) return raw;
  return new Date(parsed).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusPill({ status }: { status: SupportTicketStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        status === "open" && "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-zinc-300",
        status === "answered" && "bg-[#CCFBF1] text-[#0F766E]",
        status === "closed" && "bg-black/5 text-black/45 dark:bg-white/10 dark:text-zinc-500",
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function CustomerSupportCard() {
  const { session } = useAuth();
  const { schoolDetails } = useTenantStore();
  const schoolName = schoolDetails.name || session?.tenantName || "School";
  const userName = session?.displayName || session?.email || "School admin";

  const [settings, setSettings] = useState<SupportSettings | null>(null);
  const [faqs, setFaqs] = useState<SupportFaq[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [ticketBusy, setTicketBusy] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const lastUserLine = useMemo(
    () => [...chat].reverse().find((line) => line.role === "you")?.body ?? "",
    [chat],
  );

  const load = useCallback(async () => {
    if (!getApiToken()) {
      setLoading(false);
      return;
    }
    try {
      const [desk, nextTickets] = await Promise.all([fetchSupportDesk(), fetchSupportTickets()]);
      setSettings(desk.settings);
      setFaqs(desk.faqs);
      setTickets(nextTickets);
      setChat((prev) =>
        prev.length
          ? prev
          : [{ id: "greet", role: "bot", body: desk.settings.greeting }],
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not load support";
      toast.error("Support unavailable", { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const channelMessage = (question?: string) => {
    const q = (question || lastUserLine || "I need help with Feezo.").trim();
    return [`School: ${schoolName}`, `From: ${userName}`, "", q].join("\n");
  };

  const openGmail = () => {
    const email = settings?.supportEmail || "support@schoolaccounts.in";
    const href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
      `Support · ${schoolName}`,
    )}&body=${encodeURIComponent(channelMessage())}`;
    window.location.href = href;
  };

  const openWhatsApp = () => {
    const digits = whatsappDigits(settings?.whatsappE164);
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(channelMessage())}`, "_blank", "noopener,noreferrer");
  };

  const ask = async (text: string, faqId?: string) => {
    const question = text.trim();
    if (!question || sending) return;
    setSending(true);
    setDraft("");
    const youId = `you-${Date.now()}`;
    setChat((prev) => [...prev, { id: youId, role: "you", body: question }]);
    try {
      const result = await matchSupportFaq({ text: question, faqId });
      if (result.matched && result.faq?.answer) {
        setChat((prev) => [
          ...prev,
          { id: `bot-${Date.now()}`, role: "bot", body: result.faq!.answer as string },
        ]);
      } else {
        setChat((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: "bot",
            body: result.fallback,
            pendingTicket: question,
          },
        ]);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not reach the assistant";
      toast.error("Assistant failed", { description: msg });
    } finally {
      setSending(false);
    }
  };

  const sendToFeezo = async (question: string, lineId: string) => {
    setSending(true);
    try {
      const ticket = await createSupportTicket({ subject: question, body: question });
      setTickets((prev) => [ticket, ...prev.filter((t) => t.id !== ticket.id)]);
      setActiveTicketId(ticket.id);
      setChat((prev) =>
        prev.map((line) =>
          line.id === lineId
            ? { ...line, pendingTicket: undefined, body: `${line.body}\n\nSent to Feezo as ${ticket.id}.` }
            : line,
        ),
      );
      toast.success("Sent to Feezo", { description: "The team will reply in Your messages" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not open a ticket";
      toast.error("Could not send to Feezo", { description: msg });
    } finally {
      setSending(false);
    }
  };

  const activeTicket = tickets.find((t) => t.id === activeTicketId) ?? tickets[0] ?? null;

  useEffect(() => {
    if (!activeTicketId && tickets[0]) setActiveTicketId(tickets[0].id);
  }, [tickets, activeTicketId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: "end" });
  }, [activeTicketId, activeTicket?.messages?.length]);

  const sendTicketReply = async (input: { body: string; attachments: SupportAttachment[] }) => {
    if (!activeTicket) return;
    if (!input.body.trim() && input.attachments.length === 0) return;
    setTicketBusy(true);
    try {
      const next = await replySupportTicket({
        ticketId: activeTicket.id,
        body: input.body.trim(),
        attachments: input.attachments,
      });
      setTickets((prev) => prev.map((t) => (t.id === next.id ? next : t)));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Reply failed";
      throw err instanceof Error ? err : new Error(msg);
    } finally {
      setTicketBusy(false);
    }
  };

  const startTicket = async (input: { body: string; attachments: SupportAttachment[] }) => {
    if (!input.body.trim() && input.attachments.length === 0) return;
    setTicketBusy(true);
    try {
      const ticket = await createSupportTicket({
        subject: input.body.trim() || undefined,
        body: input.body.trim(),
        attachments: input.attachments,
      });
      setTickets((prev) => [ticket, ...prev.filter((item) => item.id !== ticket.id)]);
      setActiveTicketId(ticket.id);
      toast.success("Sent to Feezo", { description: "The team will reply in Your messages" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not open a ticket";
      throw err instanceof Error ? err : new Error(msg);
    } finally {
      setTicketBusy(false);
    }
  };

  const openTicket = async (ticket: SupportTicket) => {
    setActiveTicketId(ticket.id);
    if (!ticket.schoolUnread) return;
    try {
      const next = await markSupportTicketRead(ticket.id);
      setTickets((prev) => prev.map((t) => (t.id === next.id ? { ...t, ...next } : t)));
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass}>
        <div className="flex items-center gap-2 text-[13px] text-black/45">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading support…
        </div>
      </OrganicCard>
    );
  }

  return (
    <div className="grid grid-cols-12 items-start gap-3 sm:gap-4 lg:gap-5">
      <OrganicCard
        tone="white"
        cornerSide="tr"
        padded
        className={cn(workspacePanelClass, "col-span-12")}
      >
        <div className="text-[18px] font-bold leading-tight tracking-tight text-black">Customer Support</div>
        <p className="mt-1 text-[12px] text-black/55 dark:text-zinc-400">
          Email, WhatsApp, or a message to Feezo — for the whole school, not one campus.
        </p>
        <div className="mt-4 grid grid-cols-1 overflow-hidden rounded-xl border border-[#EFEFEF] bg-white sm:grid-cols-2 dark:border-white/10 dark:bg-zinc-950/40">
          <button
            type="button"
            onClick={openGmail}
            className="flex w-full items-center justify-between gap-3 border-b border-[#EFEFEF] px-4 py-3.5 text-left transition-colors hover:bg-[#FAFAFA] sm:border-b-0 sm:border-r dark:border-white/10 dark:hover:bg-white/5"
          >
            <span className="min-w-0">
              <span className="block text-[14px] font-medium text-slate-900 dark:text-zinc-100">Email</span>
              <span className="mt-0.5 block truncate text-[11px] font-normal text-black/40 dark:text-zinc-500">
                {settings?.supportEmail || "support@schoolaccounts.in"}
              </span>
            </span>
            <Mail className="h-4 w-4 shrink-0 text-slate-500" />
          </button>
          <button
            type="button"
            onClick={openWhatsApp}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#FAFAFA] dark:hover:bg-white/5"
          >
            <span className="min-w-0">
              <span className="block text-[14px] font-medium text-slate-900 dark:text-zinc-100">WhatsApp</span>
              <span className="mt-0.5 block text-[11px] font-normal text-black/40 dark:text-zinc-500">
                {formatWhatsAppDisplay(settings?.whatsappE164)}
              </span>
            </span>
            <WhatsAppMark className="h-4 w-4 shrink-0 text-slate-700 dark:text-zinc-200" />
          </button>
        </div>
      </OrganicCard>

      <OrganicCard
        tone="white"
        cornerSide="bl"
        padded
        className={cn(workspacePanelClass, "col-span-12")}
      >
        <div className="text-[13px] font-semibold text-black">Help answers</div>
        <p className="mt-1 text-[12px] text-black/55">Pick a question or type your own. If we do not have an answer, send it to Feezo.</p>
        <div className="mt-3 min-h-[140px] space-y-2.5 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] p-3 dark:border-white/10 dark:bg-zinc-950/40">
          {chat.map((line) => (
            <div
              key={line.id}
              className={cn("flex", line.role === "you" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[92%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
                  line.role === "you"
                    ? "bg-[#0F766E] text-white"
                    : "bg-white text-slate-800 shadow-sm dark:bg-zinc-900 dark:text-zinc-100",
                )}
              >
                {line.body}
                {line.pendingTicket ? (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2 h-8 rounded-full bg-black px-3 text-[11px] text-white hover:bg-black/85"
                    disabled={sending}
                    onClick={() => void sendToFeezo(line.pendingTicket!, line.id)}
                  >
                    Send to Feezo
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {faqs.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {faqs.slice(0, 8).map((faq) => (
              <button
                key={faq.id}
                type="button"
                onClick={() => void ask(faq.question, faq.id)}
                className="rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 text-[11px] font-medium text-black/70 hover:border-[#0F766E]/40 hover:text-[#0F766E] dark:border-white/10 dark:bg-zinc-900"
              >
                {faq.question}
              </button>
            ))}
          </div>
        ) : null}
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(draft);
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask a question…"
            className="h-10 rounded-xl"
          />
          <Button
            type="submit"
            disabled={sending || !draft.trim()}
            className="h-10 rounded-full bg-[#0F766E] px-4 text-white hover:bg-[#0D9488]"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </OrganicCard>

      <OrganicCard
        tone="white"
        cornerSide="br"
        padded
        className={cn(workspacePanelClass, "col-span-12")}
      >
        <div className="text-[13px] font-semibold text-black">Your messages</div>
        <p className="mt-1 text-[12px] text-black/55">Feezo replies here.</p>
        {tickets.length === 0 ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-dashed border-black/15 px-4 py-6 text-center text-[13px] text-black/45">
              No messages yet. Write below, or send a screenshot or voice note to Feezo.
            </div>
            <SupportComposer
              placeholder="Describe the issue, or attach a screenshot…"
              disabled={ticketBusy}
              busy={ticketBusy}
              onSend={startTicket}
            />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-12 gap-3">
            <ul className="mobile-scrollbar-none col-span-12 max-h-[28rem] space-y-1.5 overflow-y-auto lg:col-span-4">
              {tickets.map((ticket) => {
                const active = ticket.id === activeTicket?.id;
                const preview = ticket.lastMessage?.body || ticket.subject;
                return (
                  <li key={ticket.id}>
                    <button
                      type="button"
                      onClick={() => void openTicket(ticket)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                        active
                          ? "border-[#0F766E]/40 bg-[#F0FDFA]"
                          : "border-[#EFEFEF] bg-white hover:bg-[#FAFAFA] dark:border-white/10 dark:bg-zinc-900",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold text-black dark:text-zinc-100">
                          {ticket.subject}
                        </span>
                        {ticket.schoolUnread ? (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#0F766E]" />
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-black/50">{preview}</p>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <StatusPill status={ticket.status} />
                        <span className="text-[10.5px] text-black/35">{formatStamp(ticket.updatedAt)}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="col-span-12 flex min-h-[18rem] flex-col rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] p-3 lg:col-span-8 dark:border-white/10 dark:bg-zinc-950/40">
              {activeTicket ? (
                <>
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-[#EFEFEF] pb-3 dark:border-white/10">
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-semibold text-black dark:text-zinc-100">
                        {activeTicket.subject}
                      </div>
                      <div className="mt-0.5 text-[12px] text-black/50">Feezo team</div>
                    </div>
                    <StatusPill status={activeTicket.status} />
                  </div>
                  <div className="mobile-scrollbar-none min-h-0 flex-1 space-y-2 overflow-y-auto">
                    {(activeTicket.messages ?? []).map((msg) => {
                      const fromYou = msg.author === "school";
                      return (
                        <div key={msg.id} className={cn("flex", fromYou ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[88%] rounded-2xl px-3 py-2 text-[13px]",
                              fromYou
                                ? "bg-[#0F766E] text-white"
                                : "bg-white text-slate-800 shadow-sm dark:bg-zinc-900 dark:text-zinc-100",
                            )}
                          >
                            <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                              {fromYou ? "You" : msg.author === "admin" ? "Feezo" : "Help chat"}
                              {" · "}
                              {formatStamp(msg.createdAt)}
                            </div>
                            <div className="mt-1">
                              <SupportMessageContent
                                body={msg.body}
                                attachments={msg.attachments}
                                inverted={fromYou}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={threadEndRef} />
                  </div>
                  {activeTicket.status === "closed" ? (
                    <p className="mt-3 text-[12px] text-black/45">Closed. Send a new message to start again.</p>
                  ) : (
                    <div className="mt-3">
                      <SupportComposer
                        key={activeTicket.id}
                        ticketId={activeTicket.id}
                        disabled={ticketBusy}
                        busy={ticketBusy}
                        onSend={sendTicketReply}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="grid flex-1 place-items-center text-center text-[13px] text-black/45">
                  Pick a message on the left.
                </div>
              )}
            </div>
          </div>
        )}
      </OrganicCard>
    </div>
  );
}
