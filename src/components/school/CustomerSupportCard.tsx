import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Mail, Plus } from "lucide-react";
import { toast } from "sonner";

import { SupportChatBubble, SupportChatShell, ConversationMeta } from "@/components/support/SupportChatBubble";
import { SupportComposer } from "@/components/support/SupportComposer";
import { Button } from "@/components/ui/button";
import { OrganicCard } from "@/components/ui/organic-card";
import { useAuth } from "@/lib/auth";
import { ApiError, getApiToken } from "@/lib/api/client";
import {
  closeSupportTicket,
  createSupportTicket,
  fetchSupportDesk,
  fetchSupportTickets,
  formatWhatsAppDisplay,
  markSupportTicketRead,
  matchSupportFaq,
  reopenSupportTicket,
  replySupportTicket,
  whatsappDigits,
  type SupportAttachment,
  type SupportFaq,
  type SupportSettings,
  type SupportTicket,
  type SupportTicketStatus,
} from "@/lib/api/support";
import { formatChatStamp } from "@/lib/dates";
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
  return formatChatStamp(raw, "list");
}

export function CustomerSupportCard() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/tenant/settings" });
  const chatId = search.chat;
  const { session } = useAuth();
  const { schoolDetails } = useTenantStore();
  const schoolName = schoolDetails.name || session?.tenantName || "School";
  const userName = session?.displayName || session?.email || "School admin";

  const [settings, setSettings] = useState<SupportSettings | null>(null);
  const [faqs, setFaqs] = useState<SupportFaq[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [ticketBusy, setTicketBusy] = useState(false);
  const threadScrollRef = useRef<HTMLDivElement>(null);

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
      void navigate({
        to: "/tenant/settings",
        search: (prev) => ({ ...prev, tab: "support", chat: ticket.id }),
      });
      setChat((prev) =>
        prev.map((line) =>
          line.id === lineId
            ? { ...line, pendingTicket: undefined, body: `${line.body}\n\nSent to Feezo as ${ticket.id}.` }
            : line,
        ),
      );
      toast.success("Sent", { description: "Feezo will reply in this chat" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not open a ticket";
      toast.error("Could not send to Feezo", { description: msg });
    } finally {
      setSending(false);
    }
  };

  const composing = chatId === "new" || (!chatId && tickets.length === 0);
  const activeTicket = chatId && chatId !== "new" ? tickets.find((t) => t.id === chatId) ?? null : null;
  const onMobileThread = Boolean(activeTicket) || composing;

  useEffect(() => {
    const el = threadScrollRef.current;
    if (!el) return;
    const pin = () => {
      el.scrollTop = el.scrollHeight;
    };
    pin();
    const frame = requestAnimationFrame(pin);
    return () => cancelAnimationFrame(frame);
  }, [chatId, activeTicket?.messages?.length, chat.length]);

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
      void navigate({
        to: "/tenant/settings",
        search: (prev) => ({ ...prev, tab: "support", chat: ticket.id }),
      });
      toast.success("Sent", { description: "Feezo will reply in this chat" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not open a ticket";
      throw err instanceof Error ? err : new Error(msg);
    } finally {
      setTicketBusy(false);
    }
  };

  const setTicketStatus = async (next: "closed" | "open") => {
    if (!activeTicket || ticketBusy) return;
    setTicketBusy(true);
    try {
      const updated =
        next === "closed"
          ? await closeSupportTicket(activeTicket.id)
          : await reopenSupportTicket(activeTicket.id);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success(next === "closed" ? "Chat closed" : "Chat reopened");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not update chat";
      toast.error(next === "closed" ? "Could not close" : "Could not reopen", {
        description: msg,
      });
    } finally {
      setTicketBusy(false);
    }
  };

  useEffect(() => {
    if (!chatId || chatId === "new") return;
    const ticket = tickets.find((item) => item.id === chatId);
    if (!ticket?.schoolUnread && !(ticket.schoolUnreadCount ?? 0)) return;
    void markSupportTicketRead(chatId)
      .then((next) => {
        setTickets((prev) => prev.map((item) => (item.id === next.id ? { ...item, ...next } : item)));
      })
      .catch(() => {
        // ignore
      });
  }, [chatId, tickets]);

  if (loading) {
    return (
      <OrganicCard tone="white" cornerSide="tr" padded={false} className={cn(workspacePanelClass, "overflow-hidden p-0")}>
        <div className="flex h-[min(calc(100dvh-10rem),720px)] min-h-[22rem] items-center justify-center gap-2 text-[13px] text-black/45">
          <Loader2 className="h-4 w-4 animate-spin" /> Opening chat…
        </div>
      </OrganicCard>
    );
  }

  return (
    <OrganicCard
      tone="white"
      cornerSide="br"
      padded={false}
      className={cn(workspacePanelClass, "col-span-12 overflow-hidden p-0")}
    >
      <div className="flex h-[min(calc(100dvh-9.5rem),760px)] min-h-[22rem] flex-col lg:h-[min(calc(100dvh-11rem),760px)] lg:flex-row">
          <div
            className={cn(
              "flex w-full shrink-0 flex-col border-[#EFEFEF] bg-white dark:border-white/10 dark:bg-zinc-950 lg:w-[300px] lg:border-r",
              onMobileThread ? "hidden lg:flex" : "flex",
            )}
          >
            <div className="flex items-center justify-between gap-1 border-b border-[#EFEFEF] px-2 py-2 dark:border-white/10">
              <div className="min-w-0 px-1">
                <div className="text-[16px] font-semibold text-black dark:text-zinc-100">Chats</div>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={openGmail}
                  className="grid h-9 w-9 place-items-center rounded-full text-black/45 hover:bg-black/5 hover:text-[#0F766E]"
                  aria-label={`Email ${settings?.supportEmail || "support"}`}
                  title={settings?.supportEmail || "Email"}
                >
                  <Mail className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={openWhatsApp}
                  className="grid h-9 w-9 place-items-center rounded-full text-black/45 hover:bg-black/5 hover:text-[#0F766E]"
                  aria-label={`WhatsApp ${formatWhatsAppDisplay(settings?.whatsappE164)}`}
                  title={formatWhatsAppDisplay(settings?.whatsappE164)}
                >
                  <WhatsAppMark className="h-4 w-4" />
                </button>
                <Link
                  to="/tenant/settings"
                  search={{ tab: "support", chat: "new" }}
                  className="grid h-9 w-9 place-items-center rounded-full text-[#0F766E] hover:bg-[#0F766E]/10"
                  aria-label="New chat"
                >
                  <Plus className="h-5 w-5" />
                </Link>
              </div>
            </div>
            <ul className="mobile-scrollbar-none min-h-0 flex-1 overflow-y-auto">
              {tickets.length === 0 ? (
                <li className="px-4 py-10 text-center text-[13px] text-black/40">
                  No chats yet. Type a message to start.
                </li>
              ) : (
                tickets.map((ticket) => {
                  const active = ticket.id === chatId;
                  const preview = ticket.lastMessage?.body || ticket.subject;
                  const unread =
                    ticket.schoolUnreadCount ?? (ticket.schoolUnread ? 1 : 0);
                  const messageCount = ticket.messageCount ?? ticket.messages?.length ?? 0;
                  return (
                    <li key={ticket.id}>
                      <Link
                        to="/tenant/settings"
                        search={{ tab: "support", chat: ticket.id }}
                        className={cn(
                          "flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-black/[0.03] dark:hover:bg-white/5",
                          active && "bg-[#E6F4F1] dark:bg-[#0F766E]/20",
                        )}
                      >
                        <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0F766E] text-[13px] font-bold text-white">
                          F
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span
                              className={cn(
                                "truncate text-[15px] text-black dark:text-zinc-100",
                                unread > 0 ? "font-bold" : "font-semibold",
                              )}
                            >
                              {ticket.subject || "Feezo"}
                            </span>
                            <span
                              className={cn(
                                "shrink-0 text-[11px]",
                                unread > 0 ? "font-semibold text-[#0F766E]" : "text-black/35",
                              )}
                            >
                              {formatStamp(ticket.updatedAt)}
                            </span>
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className={cn(
                                "min-w-0 flex-1 truncate text-[13px]",
                                unread > 0 ? "font-medium text-black/70" : "text-black/50",
                              )}
                            >
                              {preview}
                            </span>
                            <ConversationMeta unreadCount={unread} messageCount={messageCount} />
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          <SupportChatShell className={cn(onMobileThread ? "flex" : "hidden lg:flex")}>
            {activeTicket ? (
              <>
                <div className="flex shrink-0 items-center gap-2 border-b border-black/5 bg-white/90 px-1.5 py-1.5 backdrop-blur-sm dark:bg-zinc-950/90">
                  <Link
                    to="/tenant/settings"
                    search={{ tab: "support" }}
                    className="grid h-10 w-10 place-items-center rounded-full text-black/55 hover:bg-black/5 lg:hidden"
                    aria-label="Back to chats"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0F766E] text-[11px] font-bold text-white">
                    F
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold text-black dark:text-zinc-100">
                      {activeTicket.subject || "Feezo"}
                    </div>
                    <div className="text-[12px] text-black/45">{STATUS_LABEL[activeTicket.status]}</div>
                  </div>
                  {activeTicket.status === "closed" ? (
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 shrink-0 rounded-full bg-[#0F766E] px-3 text-[12px] text-white hover:bg-[#0D9488]"
                      disabled={ticketBusy}
                      onClick={() => void setTicketStatus("open")}
                    >
                      Reopen
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 rounded-full px-3 text-[12px]"
                      disabled={ticketBusy}
                      onClick={() => void setTicketStatus("closed")}
                    >
                      Close
                    </Button>
                  )}
                </div>
                <div
                  ref={threadScrollRef}
                  className="mobile-scrollbar-none min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-3"
                >
                  <div className="flex min-h-full flex-col justify-end gap-1">
                    {(activeTicket.messages ?? []).map((msg) => (
                      <SupportChatBubble
                        key={msg.id}
                        fromYou={msg.author === "school"}
                        createdAt={msg.createdAt}
                        body={msg.body}
                        attachments={msg.attachments}
                      />
                    ))}
                  </div>
                </div>
                <div className="shrink-0 px-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1 sm:px-2">
                  {activeTicket.status === "closed" ? (
                    <p className="rounded-2xl bg-white/80 px-3 py-2 text-center text-[12px] text-black/50">
                      Chat closed. Reopen it from the header, or start a new one from the list.
                    </p>
                  ) : (
                    <SupportComposer
                      key={activeTicket.id}
                      ticketId={activeTicket.id}
                      placeholder="Message"
                      autoFocus
                      disabled={ticketBusy}
                      busy={ticketBusy}
                      onSend={sendTicketReply}
                    />
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex shrink-0 items-center gap-2 border-b border-black/5 bg-white/90 px-1.5 py-1.5">
                  {tickets.length > 0 ? (
                    <Link
                      to="/tenant/settings"
                      search={{ tab: "support" }}
                      className="grid h-10 w-10 place-items-center rounded-full text-black/55 hover:bg-black/5 lg:hidden"
                      aria-label="Back to chats"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Link>
                  ) : null}
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0F766E] text-[11px] font-bold text-white">
                    F
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-black">Feezo</div>
                    <div className="text-[12px] text-black/45">Tap to type — or use Email / WhatsApp</div>
                  </div>
                  <button
                    type="button"
                    onClick={openGmail}
                    className="grid h-9 w-9 place-items-center rounded-full text-black/45 hover:bg-black/5 lg:hidden"
                    aria-label="Email"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={openWhatsApp}
                    className="grid h-9 w-9 place-items-center rounded-full text-black/45 hover:bg-black/5 lg:hidden"
                    aria-label="WhatsApp"
                  >
                    <WhatsAppMark className="h-4 w-4" />
                  </button>
                </div>
                <div
                  ref={threadScrollRef}
                  className="mobile-scrollbar-none min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-3"
                >
                  <div className="flex min-h-full flex-col justify-end gap-1">
                    {chat.map((line) => (
                      <div key={line.id}>
                        <SupportChatBubble
                          fromYou={line.role === "you"}
                          createdAt={new Date().toISOString()}
                          body={line.body}
                        />
                        {line.pendingTicket ? (
                          <div className="mt-1 flex justify-start px-1">
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 rounded-full bg-[#0F766E] px-3 text-[12px] text-white hover:bg-[#0D9488]"
                              disabled={sending}
                              onClick={() => void sendToFeezo(line.pendingTicket!, line.id)}
                            >
                              Send to Feezo
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {faqs.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5 px-1">
                        {faqs.slice(0, 6).map((faq) => (
                          <button
                            key={faq.id}
                            type="button"
                            disabled={sending}
                            onClick={() => void ask(faq.question, faq.id)}
                            className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[12px] text-black/70 hover:border-[#0F766E]/40 hover:text-[#0F766E]"
                          >
                            {faq.question}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0 px-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1 sm:px-2">
                  <SupportComposer
                    placeholder="Message"
                    autoFocus={composing}
                    disabled={ticketBusy}
                    busy={ticketBusy}
                    onSend={startTicket}
                  />
                </div>
              </>
            )}
          </SupportChatShell>
        </div>
      </OrganicCard>
  );
}
