import { useCallback, useEffect, useState } from "react";
import { LifeBuoy, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrganicCard } from "@/components/ui/organic-card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, getApiToken } from "@/lib/api/client";
import {
  fetchSuperAdminSupport,
  fetchSuperAdminSupportTicket,
  postSuperAdminSupport,
  SUPPORT_DEFAULT_WHATSAPP_E164,
  type SupportFaq,
  type SupportSettings,
  type SupportTicket,
  type SupportTicketStatus,
} from "@/lib/api/support";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { id: "all" | SupportTicketStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "answered", label: "Answered" },
  { id: "closed", label: "Closed" },
];

function formatStamp(raw: string): string {
  const parsed = Date.parse(String(raw).replace(" ", "T"));
  if (!Number.isFinite(parsed)) return raw;
  return new Date(parsed).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function emptyFaq(): SupportFaq {
  return { id: "", question: "", keywords: "", answer: "", active: true };
}

export function SupportDeskView() {
  const [settings, setSettings] = useState<SupportSettings>({
    supportEmail: "support@schoolaccounts.in",
    whatsappE164: SUPPORT_DEFAULT_WHATSAPP_E164,
    greeting: "",
  });
  const [faqs, setFaqs] = useState<SupportFaq[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState<"all" | SupportTicketStatus>("all");
  const [loading, setLoading] = useState(true);
  const [savingChannels, setSavingChannels] = useState(false);
  const [faqDraft, setFaqDraft] = useState<SupportFaq>(emptyFaq());
  const [faqBusy, setFaqBusy] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);

  const load = useCallback(async () => {
    if (!getApiToken()) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchSuperAdminSupport(status);
      setSettings(data.settings);
      setFaqs(data.faqs);
      setTickets(data.tickets);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not load support";
      toast.error("Support desk unavailable", { description: msg });
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const openTicket = async (ticket: SupportTicket) => {
    setActiveId(ticket.id);
    try {
      const full = await fetchSuperAdminSupportTicket(ticket.id);
      setThread(full);
      setTickets((prev) =>
        prev.map((t) => (t.id === full.id ? { ...t, adminUnread: false, status: full.status } : t)),
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not open ticket";
      toast.error("Ticket failed to load", { description: msg });
    }
  };

  const sendReply = async () => {
    if (!thread || !reply.trim()) return;
    setReplyBusy(true);
    try {
      const data = await postSuperAdminSupport<{ ticket: SupportTicket }>({
        action: "ticket.reply",
        ticketId: thread.id,
        body: reply.trim(),
      });
      setReply("");
      setThread(data.ticket);
      setTickets((prev) =>
        prev.map((t) => (t.id === data.ticket.id ? { ...t, ...data.ticket, messages: undefined } : t)),
      );
      toast.success("Reply sent", { description: data.ticket.id });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Reply failed";
      toast.error("Could not send reply", { description: msg });
    } finally {
      setReplyBusy(false);
    }
  };

  const closeTicket = async () => {
    if (!thread) return;
    setReplyBusy(true);
    try {
      const data = await postSuperAdminSupport<{ ticket: SupportTicket }>({
        action: "ticket.close",
        ticketId: thread.id,
      });
      setThread(data.ticket);
      setTickets((prev) => prev.map((t) => (t.id === data.ticket.id ? { ...t, status: "closed" } : t)));
      toast.success("Ticket closed");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Close failed";
      toast.error("Could not close ticket", { description: msg });
    } finally {
      setReplyBusy(false);
    }
  };

  const saveChannels = async () => {
    setSavingChannels(true);
    try {
      const data = await postSuperAdminSupport<{ settings: SupportSettings }>({
        action: "settings",
        supportEmail: settings.supportEmail,
        whatsappE164: settings.whatsappE164,
        greeting: settings.greeting,
      });
      setSettings(data.settings);
      toast.success("Channels saved");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Save failed";
      toast.error("Could not save channels", { description: msg });
    } finally {
      setSavingChannels(false);
    }
  };

  const saveFaq = async () => {
    if (!faqDraft.question.trim() || !faqDraft.answer?.trim()) {
      toast.error("Question and answer are required");
      return;
    }
    setFaqBusy(true);
    try {
      const data = await postSuperAdminSupport<{ faq: SupportFaq }>({
        action: "faq.upsert",
        faq: {
          id: faqDraft.id || undefined,
          question: faqDraft.question.trim(),
          keywords: faqDraft.keywords ?? "",
          answer: faqDraft.answer.trim(),
          active: faqDraft.active !== false,
        },
      });
      setFaqs((prev) => {
        const rest = prev.filter((f) => f.id !== data.faq.id);
        return [...rest, data.faq].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      });
      setFaqDraft(emptyFaq());
      toast.success(faqDraft.id ? "FAQ updated" : "FAQ added");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Save failed";
      toast.error("Could not save FAQ", { description: msg });
    } finally {
      setFaqBusy(false);
    }
  };

  const deleteFaq = async (id: string) => {
    setFaqBusy(true);
    try {
      await postSuperAdminSupport({ action: "faq.delete", id });
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      if (faqDraft.id === id) setFaqDraft(emptyFaq());
      toast.success("FAQ removed");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Delete failed";
      toast.error("Could not remove FAQ", { description: msg });
    } finally {
      setFaqBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6" aria-busy="true">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-black/[0.07]" />
        <div className="grid grid-cols-12 gap-3 sm:gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="col-span-12 h-48 animate-pulse rounded-3xl bg-black/[0.05] lg:col-span-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-heading">Customer Support</h1>
        <p className="mt-2 text-[14px] text-black/55">
          School tickets, FAQ auto-replies, and Gmail / WhatsApp channels
          {unreadCount ? ` · ${unreadCount} unread` : ""}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-3 sm:gap-4 lg:gap-5">
        <OrganicCard tone="white" cornerSide="tr" padded className="col-span-12 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[13px] font-semibold uppercase tracking-wider text-black/45">Inbox</div>
              <p className="mt-0.5 text-[12px] text-black/55">{tickets.length} thread{tickets.length === 1 ? "" : "s"}</p>
            </div>
            <div className="inline-flex rounded-full border border-[#E5E5E5] bg-white p-1">
              {STATUS_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStatus(item.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[11px] font-semibold",
                    status === item.id ? "bg-black text-white" : "text-black/55 hover:text-black",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-12 gap-3">
            <ul className="col-span-12 max-h-[28rem] space-y-1.5 overflow-y-auto lg:col-span-5">
              {tickets.length === 0 ? (
                <li className="rounded-xl border border-dashed border-[#E5E5E5] px-3 py-8 text-center text-[12px] text-black/45">
                  No tickets in this filter.
                </li>
              ) : (
                tickets.map((ticket) => {
                  const active = ticket.id === activeId;
                  return (
                    <li key={ticket.id}>
                      <button
                        type="button"
                        onClick={() => void openTicket(ticket)}
                        className={cn(
                          "w-full rounded-xl border px-3 py-2.5 text-left",
                          active ? "border-[#0F766E]/40 bg-[#F0FDFA]" : "border-[#EFEFEF] bg-white hover:bg-[#FAFAFA]",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate text-[13px] font-semibold text-black">{ticket.subject}</span>
                          {ticket.adminUnread ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#0F766E]" /> : null}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-black/50">
                          {ticket.tenantName || ticket.tenantId || "School"}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-black/35">
                          {ticket.id} · {ticket.status}
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="col-span-12 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] p-3 lg:col-span-7">
              {thread ? (
                <>
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-[15px] font-semibold text-black">{thread.subject}</div>
                      <div className="text-[12px] text-black/50">
                        {thread.tenantName} · {thread.createdByName || "School admin"}
                      </div>
                      <div className="font-mono text-[10.5px] text-black/35">
                        {thread.id} · {thread.status}
                      </div>
                    </div>
                    {thread.status !== "closed" ? (
                      <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => void closeTicket()}>
                        Close
                      </Button>
                    ) : null}
                  </div>
                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {(thread.messages ?? []).map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "rounded-xl px-3 py-2 text-[13px]",
                          msg.author === "admin" ? "bg-[#0F766E] text-white" : "bg-white text-slate-800",
                        )}
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                          {msg.author === "admin" ? "Feezo" : msg.author === "school" ? "School" : "Assistant"}
                          {" · "}
                          {formatStamp(msg.createdAt)}
                        </div>
                        <div className="mt-1 whitespace-pre-wrap">{msg.body}</div>
                      </div>
                    ))}
                  </div>
                  {thread.status === "closed" ? (
                    <p className="mt-3 text-[12px] text-black/45">Closed. A school follow-up will reopen it.</p>
                  ) : (
                    <form
                      className="mt-3 space-y-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void sendReply();
                      }}
                    >
                      <Textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Reply to this school…"
                        className="min-h-[80px] rounded-xl bg-white"
                      />
                      <Button
                        type="submit"
                        disabled={replyBusy || !reply.trim()}
                        className="rounded-full bg-black text-white hover:bg-black/85"
                      >
                        {replyBusy ? "Sending…" : "Send reply"}
                      </Button>
                    </form>
                  )}
                </>
              ) : (
                <div className="grid min-h-[16rem] place-items-center text-center">
                  <div>
                    <LifeBuoy className="mx-auto h-8 w-8 text-black/25" />
                    <p className="mt-2 text-[13px] text-black/45">Select a ticket to read the thread.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </OrganicCard>

        <OrganicCard tone="white" cornerSide="bl" padded className="col-span-12 lg:col-span-5">
          <div className="text-[13px] font-semibold uppercase tracking-wider text-black/45">Channels</div>
          <p className="mt-0.5 text-[12px] text-black/55">Used by Settings → Customer Support in every school.</p>
          <div className="mt-4 space-y-3">
            <label className="block space-y-1.5">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/45">Gmail</Label>
              <Input
                value={settings.supportEmail}
                onChange={(e) => setSettings((prev) => ({ ...prev, supportEmail: e.target.value }))}
                className="h-9 rounded-lg"
              />
            </label>
            <label className="block space-y-1.5">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/45">WhatsApp</Label>
              <Input
                value={settings.whatsappE164}
                onChange={(e) => setSettings((prev) => ({ ...prev, whatsappE164: e.target.value }))}
                placeholder="+91 97440 09048"
                className="h-9 rounded-lg"
              />
            </label>
            <label className="block space-y-1.5">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/45">Assistant greeting</Label>
              <Textarea
                value={settings.greeting}
                onChange={(e) => setSettings((prev) => ({ ...prev, greeting: e.target.value }))}
                className="min-h-[88px] rounded-lg"
              />
            </label>
            <Button
              type="button"
              onClick={() => void saveChannels()}
              disabled={savingChannels}
              className="rounded-full bg-black text-white hover:bg-black/85"
            >
              {savingChannels ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Save channels
            </Button>
          </div>
        </OrganicCard>

        <OrganicCard tone="white" cornerSide="br" padded className="col-span-12">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-[13px] font-semibold uppercase tracking-wider text-black/45">FAQs</div>
              <p className="mt-0.5 text-[12px] text-black/55">
                Questionnaire chips and auto-replies. Keywords decide the match.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setFaqDraft(emptyFaq())}>
              <Plus className="mr-1 h-3.5 w-3.5" /> New
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-12 gap-3">
            <ul className="col-span-12 space-y-1.5 lg:col-span-5">
              {faqs.map((faq) => (
                <li key={faq.id}>
                  <button
                    type="button"
                    onClick={() => setFaqDraft(faq)}
                    className={cn(
                      "flex w-full items-start justify-between gap-2 rounded-xl border px-3 py-2.5 text-left",
                      faqDraft.id === faq.id ? "border-[#0F766E]/40 bg-[#F0FDFA]" : "border-[#EFEFEF] bg-white hover:bg-[#FAFAFA]",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-black">{faq.question}</span>
                      <span className="block text-[10.5px] uppercase tracking-wider text-black/35">
                        {faq.active === false ? "Off" : "Live"}
                      </span>
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-black/40 hover:bg-red-50 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteFaq(faq.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="col-span-12 space-y-3 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] p-3 lg:col-span-7">
              <label className="block space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/45">Question</Label>
                <Input
                  value={faqDraft.question}
                  onChange={(e) => setFaqDraft((prev) => ({ ...prev, question: e.target.value }))}
                  className="h-9 rounded-lg bg-white"
                />
              </label>
              <label className="block space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/45">Keywords</Label>
                <Input
                  value={faqDraft.keywords ?? ""}
                  onChange={(e) => setFaqDraft((prev) => ({ ...prev, keywords: e.target.value }))}
                  placeholder="student admit enrolment"
                  className="h-9 rounded-lg bg-white"
                />
              </label>
              <label className="block space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/45">Answer</Label>
                <Textarea
                  value={faqDraft.answer ?? ""}
                  onChange={(e) => setFaqDraft((prev) => ({ ...prev, answer: e.target.value }))}
                  className="min-h-[120px] rounded-lg bg-white"
                />
              </label>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[12px] text-black/60">
                  <Switch
                    checked={faqDraft.active !== false}
                    onCheckedChange={(on) => setFaqDraft((prev) => ({ ...prev, active: on }))}
                  />
                  Live in school chatbot
                </label>
                <Button
                  type="button"
                  disabled={faqBusy}
                  onClick={() => void saveFaq()}
                  className="rounded-full bg-black text-white hover:bg-black/85"
                >
                  {faqBusy ? "Saving…" : faqDraft.id ? "Update FAQ" : "Add FAQ"}
                </Button>
              </div>
            </div>
          </div>
        </OrganicCard>
      </div>
    </div>
  );
}
