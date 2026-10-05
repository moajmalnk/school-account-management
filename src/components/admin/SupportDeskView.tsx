import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, LifeBuoy, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { LeadsView } from "@/components/admin/LeadsView";
import { mobileChatViewportClass } from "@/components/layout/MobileTabBar";
import {
  SupportChatBubble,
  SupportChatShell,
  ConversationMeta,
} from "@/components/support/SupportChatBubble";
import { SupportComposer } from "@/components/support/SupportComposer";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrganicCard } from "@/components/ui/organic-card";
import { PhoneInput } from "@/components/ui/phone-input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, getApiToken } from "@/lib/api/client";
import {
  deleteSuperAdminSupportMessage,
  editSuperAdminSupportMessage,
  fetchSuperAdminAutoReplies,
  fetchSuperAdminSupport,
  fetchSuperAdminSupportTicket,
  postSuperAdminSupport,
  SUPPORT_DEFAULT_WHATSAPP_E164,
  SUPPORT_MESSAGE_EDIT_WINDOW_MS,
  type SupportAttachment,
  type SupportAutoReplyEvent,
  type SupportAutoReplyTenantSummary,
  type SupportFaq,
  type SupportMessage,
  type SupportSettings,
  type SupportTicket,
  type SupportTicketStatus,
} from "@/lib/api/support";
import { fetchLeadSummary, type LeadSummary } from "@/lib/api/leads";
import { formatChatStamp } from "@/lib/dates";
import { phoneDigits } from "@/lib/phone";
import { cn } from "@/lib/utils";

type Section = "messages" | "autoReply" | "help" | "contact" | "leads";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "messages", label: "Messages" },
  { id: "autoReply", label: "Auto Reply" },
  { id: "help", label: "Help answers" },
  { id: "contact", label: "Contact" },
  { id: "leads", label: "Leads" },
];

/** Absolute Support section paths (href avoids routeTree @ts-nocheck lag on `to`). */
const SUPPORT_SECTION_HREF: Record<Exclude<Section, "messages">, string> = {
  autoReply: "/super-admin/support/auto-reply",
  help: "/super-admin/support/help",
  contact: "/super-admin/support/contact",
  leads: "/super-admin/support/leads",
};

const STATUS_FILTERS: { id: "all" | SupportTicketStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Needs reply" },
  { id: "answered", label: "Replied" },
  { id: "closed", label: "Closed" },
];

function formatStamp(raw: string): string {
  return formatChatStamp(raw, "list");
}

function emptyFaq(): SupportFaq {
  return { id: "", question: "", keywords: "", answer: "", active: true };
}

function keywordsFromQuestion(question: string): string {
  const skip = new Set([
    "the",
    "and",
    "for",
    "how",
    "what",
    "can",
    "you",
    "are",
    "our",
    "with",
    "from",
    "this",
    "that",
    "have",
    "does",
    "do",
    "a",
    "an",
    "to",
    "of",
    "in",
    "is",
    "on",
  ]);
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !skip.has(word))
    .join(" ");
}

function supportLocation(pathname: string): { section: Section; ticketId?: string } {
  if (pathname.endsWith("/help")) return { section: "help" };
  if (pathname.endsWith("/contact")) return { section: "contact" };
  if (pathname.endsWith("/leads")) return { section: "leads" };
  if (pathname.endsWith("/auto-reply")) return { section: "autoReply" };
  const prefix = "/super-admin/support/";
  if (pathname.startsWith(prefix)) {
    const slug = decodeURIComponent(pathname.slice(prefix.length).replace(/\/$/, ""));
    if (slug && slug !== "auto-reply") return { section: "messages", ticketId: slug };
  }
  return { section: "messages" };
}

function autoReplySourceLabel(source: string): string {
  if (source === "faq_click") return "Suggested topic";
  if (source === "text_match") return "Typed match";
  if (source === "fallback") return "No match";
  return source || "Auto reply";
}

export function SupportDeskView() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { section, ticketId } = supportLocation(pathname);

  const [settings, setSettings] = useState<SupportSettings>({
    supportEmail: "support@feezo.app",
    whatsappE164: SUPPORT_DEFAULT_WHATSAPP_E164,
    greeting: "",
  });
  const [faqs, setFaqs] = useState<SupportFaq[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [autoReplyCount, setAutoReplyCount] = useState(0);
  const [autoReplyTenants, setAutoReplyTenants] = useState<SupportAutoReplyTenantSummary[]>([]);
  const [autoReplyEvents, setAutoReplyEvents] = useState<SupportAutoReplyEvent[]>([]);
  const [autoReplyTenantId, setAutoReplyTenantId] = useState<string | null>(null);
  const [autoReplyLoading, setAutoReplyLoading] = useState(false);
  const [leadSummary, setLeadSummary] = useState<LeadSummary | null>(null);
  const [status, setStatus] = useState<"all" | SupportTicketStatus>("all");
  const [loading, setLoading] = useState(true);
  const [savingChannels, setSavingChannels] = useState(false);
  const [faqDraft, setFaqDraft] = useState<SupportFaq>(emptyFaq());
  const [faqBusy, setFaqBusy] = useState(false);
  const [thread, setThread] = useState<SupportTicket | null>(null);
  const [replyBusy, setReplyBusy] = useState(false);
  const [editingMessage, setEditingMessage] = useState<SupportMessage | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<SupportMessage | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<"closed" | "open" | null>(null);
  const threadScrollRef = useRef<HTMLDivElement>(null);

  const canEditMessage = useCallback((msg: SupportMessage) => {
    if (msg.author !== "admin") return false;
    if (!(msg.body || "").trim()) return false;
    const age = Date.now() - new Date(msg.createdAt).getTime();
    return age >= 0 && age <= SUPPORT_MESSAGE_EDIT_WINDOW_MS;
  }, []);

  const canDeleteMessage = useCallback((msg: SupportMessage) => msg.author === "admin", []);

  const applyThreadUpdate = useCallback((ticket: SupportTicket) => {
    setThread(ticket);
    setTickets((prev) =>
      prev.map((item) =>
        item.id === ticket.id ? { ...item, ...ticket, messages: undefined } : item,
      ),
    );
  }, []);

  useEffect(() => {
    const el = threadScrollRef.current;
    if (!el) return;
    const pin = () => {
      el.scrollTop = el.scrollHeight;
    };
    pin();
    const frame = requestAnimationFrame(pin);
    return () => cancelAnimationFrame(frame);
  }, [thread?.id, thread?.messages?.length]);

  const visibleTickets = useMemo(() => {
    if (status === "all") return tickets;
    return tickets.filter((ticket) => ticket.status === status);
  }, [tickets, status]);

  const statusCounts = useMemo(() => {
    const counts = { all: tickets.length, open: 0, answered: 0, closed: 0 };
    for (const ticket of tickets) counts[ticket.status] += 1;
    return counts;
  }, [tickets]);

  const load = useCallback(async () => {
    if (!getApiToken()) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchSuperAdminSupport("all");
      setSettings(data.settings);
      setFaqs(data.faqs);
      setTickets(data.tickets);
      setUnreadCount(data.unreadCount);
      setAutoReplyCount(data.autoReplyCount);
      // Seed Auto Reply tab from the main desk payload so the list is never blank
      // when the dedicated view endpoint fails or is slow.
      if (data.autoReplyTenants.length || data.autoReplyEvents.length) {
        let tenants = data.autoReplyTenants;
        const events = data.autoReplyEvents;
        if (tenants.length === 0 && events.length > 0) {
          const byTenant = new Map<string, SupportAutoReplyTenantSummary>();
          for (const event of events) {
            const key = event.tenantId || "unknown";
            const prev = byTenant.get(key);
            const stamp = event.createdAt || "";
            if (!prev) {
              byTenant.set(key, {
                tenantId: key,
                tenantName: event.tenantName || "School",
                replyCount: 1,
                matchedCount: event.matched ? 1 : 0,
                fallbackCount: event.matched ? 0 : 1,
                lastAt: stamp,
                lastPreview: event.queryText || event.faqQuestion || "Auto reply",
              });
              continue;
            }
            prev.replyCount += 1;
            if (event.matched) prev.matchedCount += 1;
            else prev.fallbackCount += 1;
            if (stamp && (!prev.lastAt || Date.parse(stamp) >= Date.parse(prev.lastAt))) {
              prev.lastAt = stamp;
              prev.lastPreview = event.queryText || event.faqQuestion || prev.lastPreview;
              prev.tenantName = event.tenantName || prev.tenantName;
            }
          }
          tenants = [...byTenant.values()].sort(
            (a, b) => (Date.parse(b.lastAt) || 0) - (Date.parse(a.lastAt) || 0),
          );
        }
        setAutoReplyTenants(tenants);
        setAutoReplyEvents(events);
        if (tenants[0]?.tenantId) {
          setAutoReplyTenantId((prev) => prev ?? tenants[0].tenantId);
        }
      }
      void fetchLeadSummary()
        .then(setLeadSummary)
        .catch(() => {
          /* leads badge is optional — older API without leads.php */
        });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not load support";
      toast.error("Support unavailable", { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  const synthesizeTenantsFromEvents = useCallback((events: SupportAutoReplyEvent[]) => {
    const byTenant = new Map<string, SupportAutoReplyTenantSummary>();
    for (const event of events) {
      const key = event.tenantId || "unknown";
      const prev = byTenant.get(key);
      const stamp = event.createdAt || "";
      if (!prev) {
        byTenant.set(key, {
          tenantId: key,
          tenantName: event.tenantName || "School",
          replyCount: 1,
          matchedCount: event.matched ? 1 : 0,
          fallbackCount: event.matched ? 0 : 1,
          lastAt: stamp,
          lastPreview: event.queryText || event.faqQuestion || "Auto reply",
        });
        continue;
      }
      prev.replyCount += 1;
      if (event.matched) prev.matchedCount += 1;
      else prev.fallbackCount += 1;
      if (stamp && (!prev.lastAt || Date.parse(stamp) >= Date.parse(prev.lastAt))) {
        prev.lastAt = stamp;
        prev.lastPreview = event.queryText || event.faqQuestion || prev.lastPreview;
        prev.tenantName = event.tenantName || prev.tenantName;
      }
    }
    return [...byTenant.values()].sort(
      (a, b) => (Date.parse(b.lastAt) || 0) - (Date.parse(a.lastAt) || 0),
    );
  }, []);

  const loadAutoReplies = useCallback(
    async (tenantId?: string | null) => {
      if (!getApiToken()) return;
      setAutoReplyLoading(true);
      try {
        const data = await fetchSuperAdminAutoReplies(tenantId || undefined);
        let tenants = data.tenants;
        const events = data.events;
        if (tenants.length === 0 && events.length > 0) {
          tenants = synthesizeTenantsFromEvents(events);
        }
        // Keep the school list populated even when drilling into one tenant.
        if (tenants.length) setAutoReplyTenants(tenants);
        else if (!tenantId) setAutoReplyTenants([]);
        setAutoReplyEvents(events);
        setAutoReplyCount(data.totalCount || events.length);
        if (tenants[0]?.tenantId) {
          setAutoReplyTenantId((prev) => {
            if (prev && tenants.some((row) => row.tenantId === prev)) return prev;
            return tenants[0].tenantId;
          });
        }
      } catch (err) {
        // Keep whatever was seeded from the main Support payload.
        const msg = err instanceof ApiError ? err.message : "Could not load auto replies";
        toast.error("Auto Reply unavailable", { description: msg });
      } finally {
        setAutoReplyLoading(false);
      }
    },
    [synthesizeTenantsFromEvents],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (section !== "autoReply") return;
    void loadAutoReplies(autoReplyTenantId);
  }, [section, autoReplyTenantId, loadAutoReplies]);

  const selectedAutoReplyTenant = useMemo(
    () => autoReplyTenants.find((row) => row.tenantId === autoReplyTenantId) ?? null,
    [autoReplyTenants, autoReplyTenantId],
  );

  const visibleAutoReplyEvents = useMemo(() => {
    const rows = autoReplyTenantId
      ? autoReplyEvents.filter((row) => row.tenantId === autoReplyTenantId)
      : autoReplyEvents;
    return [...rows].sort((a, b) => {
      const at = Date.parse(a.createdAt) || 0;
      const bt = Date.parse(b.createdAt) || 0;
      return at - bt;
    });
  }, [autoReplyEvents, autoReplyTenantId]);

  useEffect(() => {
    if (!ticketId) {
      setThread(null);
      return;
    }
    if (!getApiToken()) return;
    let cancelled = false;
    (async () => {
      try {
        const full = await fetchSuperAdminSupportTicket(ticketId);
        if (cancelled) return;
        setThread(full);
        setTickets((prev) => {
          const item = prev.find((row) => row.id === full.id);
          const pending = item?.adminUnreadCount ?? (item?.adminUnread ? 1 : 0);
          if (pending > 0) setUnreadCount((n) => Math.max(0, n - pending));
          return prev.map((row) =>
            row.id === full.id
              ? {
                  ...row,
                  adminUnread: false,
                  adminUnreadCount: 0,
                  status: full.status,
                  messageCount: full.messageCount ?? row.messageCount,
                }
              : row,
          );
        });
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof ApiError ? err.message : "Could not open message";
        toast.error("Could not open message", { description: msg });
        void navigate({ to: "/super-admin/support", replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticketId, navigate]);

  useEffect(() => {
    setEditingMessage(null);
    setDeletingMessage(null);
    setPendingStatusChange(null);
  }, [ticketId]);

  const sendReply = async (input: { body: string; attachments: SupportAttachment[] }) => {
    if (!thread) return;
    if (!input.body.trim() && input.attachments.length === 0) return;
    setReplyBusy(true);
    try {
      const data = await postSuperAdminSupport<{ ticket: SupportTicket }>({
        action: "ticket.reply",
        ticketId: thread.id,
        body: input.body.trim(),
        attachments: input.attachments,
      });
      applyThreadUpdate(data.ticket);
      toast.success("Reply sent");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Reply failed";
      throw err instanceof Error ? err : new Error(msg);
    } finally {
      setReplyBusy(false);
    }
  };

  const saveEditedMessage = async (input: { body: string; attachments: SupportAttachment[] }) => {
    if (!thread || !editingMessage) return;
    if (!input.body.trim()) return;
    setReplyBusy(true);
    try {
      const next = await editSuperAdminSupportMessage({
        ticketId: thread.id,
        messageId: editingMessage.id,
        body: input.body.trim(),
      });
      applyThreadUpdate(next);
      setEditingMessage(null);
      toast.success("Message updated");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not edit message";
      toast.error("Could not edit", { description: msg });
      throw err instanceof Error ? err : new Error(msg);
    } finally {
      setReplyBusy(false);
    }
  };

  const confirmDeleteMessage = async () => {
    if (!thread || !deletingMessage) return;
    setReplyBusy(true);
    try {
      const next = await deleteSuperAdminSupportMessage({
        ticketId: thread.id,
        messageId: deletingMessage.id,
      });
      applyThreadUpdate(next);
      if (editingMessage?.id === deletingMessage.id) {
        setEditingMessage(null);
      }
      setDeletingMessage(null);
      toast.success("Message deleted");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not delete message";
      toast.error("Could not delete", { description: msg });
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
      applyThreadUpdate(data.ticket);
      setPendingStatusChange(null);
      toast.success("Marked as closed");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Close failed";
      toast.error("Could not close", { description: msg });
    } finally {
      setReplyBusy(false);
    }
  };

  const reopenTicket = async () => {
    if (!thread) return;
    setReplyBusy(true);
    try {
      const data = await postSuperAdminSupport<{ ticket: SupportTicket }>({
        action: "ticket.reopen",
        ticketId: thread.id,
      });
      applyThreadUpdate(data.ticket);
      setPendingStatusChange(null);
      toast.success("Chat reopened");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Reopen failed";
      toast.error("Could not reopen", { description: msg });
    } finally {
      setReplyBusy(false);
    }
  };

  const confirmStatusChange = () => {
    if (!pendingStatusChange) return;
    if (pendingStatusChange === "closed") {
      void closeTicket();
      return;
    }
    void reopenTicket();
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
      toast.success("Contact details saved");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Save failed";
      toast.error("Could not save", { description: msg });
    } finally {
      setSavingChannels(false);
    }
  };

  const saveFaq = async () => {
    if (!faqDraft.question.trim() || !faqDraft.answer?.trim()) {
      toast.error("Add a question and an answer");
      return;
    }
    setFaqBusy(true);
    try {
      const data = await postSuperAdminSupport<{ faq: SupportFaq }>({
        action: "faq.upsert",
        faq: {
          id: faqDraft.id || undefined,
          question: faqDraft.question.trim(),
          keywords: keywordsFromQuestion(faqDraft.question),
          answer: faqDraft.answer.trim(),
          active: faqDraft.active !== false,
        },
      });
      setFaqs((prev) => {
        const rest = prev.filter((item) => item.id !== data.faq.id);
        return [...rest, data.faq].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      });
      setFaqDraft(emptyFaq());
      toast.success(faqDraft.id ? "Answer updated" : "Answer added");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Save failed";
      toast.error("Could not save answer", { description: msg });
    } finally {
      setFaqBusy(false);
    }
  };

  const deleteFaq = async (id: string) => {
    setFaqBusy(true);
    try {
      await postSuperAdminSupport({ action: "faq.delete", id });
      setFaqs((prev) => prev.filter((item) => item.id !== id));
      if (faqDraft.id === id) setFaqDraft(emptyFaq());
      toast.success("Answer removed");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Delete failed";
      toast.error("Could not remove answer", { description: msg });
    } finally {
      setFaqBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-3 sm:gap-4 lg:gap-5" aria-busy="true">
        <div className="col-span-12 h-9 animate-pulse rounded-full bg-black/[0.05] sm:col-span-6 lg:col-span-4" />
        <div className="col-span-12 h-80 animate-pulse rounded-3xl bg-black/[0.05]" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-12 gap-3 sm:gap-4 lg:gap-5">
        <div
          className={cn(
            "col-span-12 flex flex-wrap items-center gap-2",
            ticketId && "hidden lg:flex",
          )}
        >
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id !== "messages") {
                  void navigate({ href: SUPPORT_SECTION_HREF[item.id] });
                  return;
                }
                if (ticketId) {
                  void navigate({ to: "/super-admin/support/$ticketId", params: { ticketId } });
                  return;
                }
                void navigate({ to: "/super-admin/support" });
              }}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold transition-colors",
                section === item.id
                  ? "bg-[#0F766E] text-white"
                  : "bg-white text-black/60 ring-1 ring-[#E5E5E5] hover:text-black",
              )}
            >
              {item.label}
              {item.id === "messages" && unreadCount > 0 ? (
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-bold",
                    section === item.id ? "bg-white/20 text-white" : "bg-[#0F766E] text-white",
                  )}
                >
                  {unreadCount}
                </span>
              ) : null}
              {item.id === "autoReply" && autoReplyCount > 0 ? (
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-bold",
                    section === item.id ? "bg-white/20 text-white" : "bg-black/[0.06] text-black/55",
                  )}
                >
                  {autoReplyCount > 99 ? "99+" : autoReplyCount}
                </span>
              ) : null}
              {item.id === "leads" && leadSummary ? (
                <span
                  title={`${leadSummary.unreadCount} unread · ${leadSummary.counts.all} total`}
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-bold",
                    section === item.id
                      ? "bg-white/20 text-white"
                      : leadSummary.unreadCount > 0
                        ? "bg-sky-600 text-white"
                        : "bg-black/[0.06] text-black/55",
                  )}
                >
                  {leadSummary.unreadCount > 0 ? leadSummary.unreadCount : leadSummary.counts.all}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {section === "messages" ? (
          <OrganicCard
            tone="white"
            cornerSide="tr"
            padded
            className={cn(
              "col-span-12",
              ticketId &&
                "!p-0 max-lg:-mx-3 max-lg:-mt-4 max-lg:mb-[calc(-1*(60px+0.75rem+env(safe-area-inset-bottom,0px)))] lg:!p-6 lg:mx-0 lg:mt-0 lg:mb-0",
            )}
          >
            <div className={cn("space-y-3", ticketId && "hidden lg:block")}>
              <div>
                <div className="text-[13px] font-semibold text-black">School messages</div>
                <p className="mt-0.5 text-[12px] text-black/50">
                  {visibleTickets.length === 0
                    ? "Nothing in this list"
                    : `${visibleTickets.length} conversation${visibleTickets.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <div className="mobile-scrollbar-none -mx-0.5 overflow-x-auto pb-0.5">
                <div className="inline-flex min-w-max rounded-full border border-[#E5E5E5] bg-white p-1">
                  {STATUS_FILTERS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStatus(item.id)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap",
                        status === item.id
                          ? "bg-black text-white"
                          : "text-black/55 hover:text-black",
                      )}
                    >
                      {item.label}
                      {statusCounts[item.id] ? (
                        <span className="ml-1 font-mono text-[10px] opacity-70">
                          {statusCounts[item.id]}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              className={cn(
                "overflow-hidden rounded-2xl border border-[#EFEFEF]",
                ticketId
                  ? "mt-0 border-0 max-lg:rounded-none lg:mt-4 lg:rounded-2xl lg:border"
                  : "mt-4",
              )}
            >
              <div
                className={cn(
                  "grid min-h-[22rem] grid-cols-12",
                  ticketId
                    ? cn(mobileChatViewportClass, "lg:h-[min(calc(100dvh-16rem),720px)]")
                    : "h-[min(calc(100dvh-16rem),720px)]",
                )}
              >
                <ul
                  className={cn(
                    "mobile-scrollbar-none col-span-12 space-y-0 overflow-y-auto border-[#EFEFEF] bg-white lg:col-span-4 lg:border-r",
                    ticketId ? "hidden lg:block" : "block",
                  )}
                >
                  {visibleTickets.length === 0 ? (
                    <li className="rounded-xl border border-dashed border-[#E5E5E5] px-3 py-10 text-center text-[13px] text-black/45">
                      No messages here.
                    </li>
                  ) : (
                    visibleTickets.map((ticket) => {
                      const active = ticket.id === ticketId;
                      const preview = ticket.lastMessage?.body || ticket.subject;
                      const unread = ticket.adminUnreadCount ?? (ticket.adminUnread ? 1 : 0);
                      return (
                        <li key={ticket.id}>
                          <Link
                            to="/super-admin/support/$ticketId"
                            params={{ ticketId: ticket.id }}
                            className={cn(
                              "flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-black/[0.03]",
                              active && "bg-[#E6F4F1]",
                            )}
                          >
                            <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0F766E] text-[11px] font-bold text-white">
                              {(ticket.tenantName || "S").slice(0, 1).toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline justify-between gap-2">
                                <span
                                  className={cn(
                                    "truncate text-[14px] text-black",
                                    unread > 0 ? "font-bold" : "font-semibold",
                                  )}
                                >
                                  {ticket.tenantName || "School"}
                                </span>
                                <span
                                  className={cn(
                                    "shrink-0 text-[10px]",
                                    unread > 0 ? "font-semibold text-[#0F766E]" : "text-black/35",
                                  )}
                                >
                                  {formatStamp(ticket.updatedAt)}
                                </span>
                              </span>
                              <span className="mt-0.5 flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    "min-w-0 flex-1 truncate text-[12px]",
                                    unread > 0 ? "font-medium text-black/70" : "text-black/50",
                                  )}
                                >
                                  {preview}
                                </span>
                                <ConversationMeta
                                  unreadCount={unread}
                                  messageCount={ticket.messageCount ?? 0}
                                />
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })
                  )}
                </ul>

                <SupportChatShell
                  className={cn(
                    "col-span-12 min-h-0 lg:col-span-8",
                    ticketId ? "flex" : "hidden lg:flex",
                  )}
                >
                  {thread && thread.id === ticketId ? (
                    <>
                      <div className="flex shrink-0 items-center gap-2 border-b border-black/5 bg-white/90 px-1.5 py-1.5">
                        <Link
                          to="/super-admin/support"
                          className="grid h-10 w-10 place-items-center rounded-full text-black/55 hover:bg-black/5 lg:hidden"
                          aria-label="Back to chats"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0F766E] text-[11px] font-bold text-white">
                          {(thread.tenantName || "S").slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-semibold text-black">
                            {thread.tenantName || "School"}
                          </div>
                          <div className="truncate text-[11px] text-black/45">
                            {thread.createdByName || "School admin"}
                            {thread.subject ? ` · ${thread.subject}` : ""}
                          </div>
                        </div>
                        {thread.status !== "closed" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-full"
                            disabled={replyBusy}
                            onClick={() => setPendingStatusChange("closed")}
                          >
                            Close
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 rounded-full bg-[#0F766E] px-3 text-white hover:bg-[#0D9488]"
                            disabled={replyBusy}
                            onClick={() => setPendingStatusChange("open")}
                          >
                            Reopen
                          </Button>
                        )}
                      </div>
                      <div
                        ref={threadScrollRef}
                        className="mobile-scrollbar-none min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-3"
                      >
                        <div className="flex min-h-full flex-col justify-end gap-1.5">
                          {(thread.messages ?? []).map((msg) => (
                            <SupportChatBubble
                              key={msg.id}
                              fromYou={msg.author === "admin"}
                              createdAt={msg.createdAt}
                              updatedAt={msg.updatedAt}
                              body={msg.body}
                              attachments={msg.attachments}
                              canEdit={thread.status !== "closed" && canEditMessage(msg)}
                              canDelete={canDeleteMessage(msg)}
                              onEdit={
                                thread.status !== "closed" && canEditMessage(msg)
                                  ? () => setEditingMessage(msg)
                                  : undefined
                              }
                              onDelete={
                                canDeleteMessage(msg) ? () => setDeletingMessage(msg) : undefined
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 border-t border-black/5 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 dark:border-white/10 sm:px-3">
                        {thread.status === "closed" ? (
                          <p className="rounded-2xl bg-white/80 px-3 py-2 text-center text-[12px] text-black/50 dark:bg-zinc-900/80 dark:text-zinc-400">
                            Closed. Reopen from the header, or the school can write again.
                          </p>
                        ) : (
                          <SupportComposer
                            key={`${thread.id}-${editingMessage?.id ?? "new"}`}
                            ticketId={thread.id}
                            placeholder={editingMessage ? "Edit message" : "Message"}
                            autoFocus
                            disabled={replyBusy}
                            busy={replyBusy}
                            initialDraft={editingMessage?.body ?? ""}
                            editingMessageId={editingMessage?.id ?? null}
                            onCancelEdit={() => setEditingMessage(null)}
                            onSend={editingMessage ? saveEditedMessage : sendReply}
                          />
                        )}
                      </div>
                    </>
                  ) : ticketId ? (
                    <div className="grid flex-1 place-items-center text-center">
                      <div className="flex items-center gap-2 text-[13px] text-black/45">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Opening…
                      </div>
                    </div>
                  ) : (
                    <div className="grid flex-1 place-items-center text-center">
                      <div>
                        <LifeBuoy className="mx-auto h-8 w-8 text-black/25" />
                        <p className="mt-2 text-[13px] font-medium text-black/55">Pick a chat</p>
                        <p className="mt-0.5 text-[12px] text-black/40">
                          Reply from here like WhatsApp.
                        </p>
                      </div>
                    </div>
                  )}
                </SupportChatShell>
              </div>
            </div>
          </OrganicCard>
        ) : null}

        {section === "autoReply" ? (
          <OrganicCard tone="white" cornerSide="tr" padded className="col-span-12">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-[13px] font-semibold text-black">Auto Reply history</div>
                <p className="mt-0.5 text-[12px] text-black/50">
                  Full FAQ assistant usage per school — stored with stable timestamps so refresh
                  keeps the real reply time.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={autoReplyLoading}
                onClick={() => void loadAutoReplies(autoReplyTenantId)}
              >
                {autoReplyLoading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : null}
                Refresh
              </Button>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-[#EFEFEF]">
              <div className="grid min-h-[22rem] grid-cols-12 h-[min(calc(100dvh-16rem),720px)]">
                <ul className="mobile-scrollbar-none col-span-12 space-y-0 overflow-y-auto border-[#EFEFEF] bg-white lg:col-span-4 lg:border-r">
                  {autoReplyTenants.length === 0 ? (
                    <li className="rounded-xl border border-dashed border-[#E5E5E5] m-3 px-3 py-10 text-center text-[13px] text-black/45">
                      {autoReplyLoading
                        ? "Loading schools…"
                        : "No auto replies yet. Schools create history when they use Support FAQ answers."}
                    </li>
                  ) : (
                    autoReplyTenants.map((tenant) => {
                      const active = tenant.tenantId === autoReplyTenantId;
                      return (
                        <li key={tenant.tenantId}>
                          <button
                            type="button"
                            onClick={() => setAutoReplyTenantId(tenant.tenantId)}
                            className={cn(
                              "flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-black/[0.03]",
                              active && "bg-[#E6F4F1]",
                            )}
                          >
                            <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0F766E] text-[11px] font-bold text-white">
                              {(tenant.tenantName || "S").slice(0, 1).toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-[14px] font-semibold text-black">
                                  {tenant.tenantName || "School"}
                                </span>
                                <span className="shrink-0 text-[10px] text-black/35">
                                  {tenant.lastAt ? formatStamp(tenant.lastAt) : "—"}
                                </span>
                              </span>
                              <span className="mt-0.5 flex items-center gap-1.5">
                                <span className="min-w-0 flex-1 truncate text-[12px] text-black/50">
                                  {tenant.lastPreview || "Auto reply"}
                                </span>
                                <ConversationMeta messageCount={tenant.replyCount} />
                              </span>
                              <span className="mt-1 text-[10px] text-black/40">
                                {tenant.matchedCount} matched
                                {tenant.fallbackCount > 0
                                  ? ` · ${tenant.fallbackCount} unmatched`
                                  : ""}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>

                <SupportChatShell className="col-span-12 min-h-0 lg:col-span-8 flex">
                  {selectedAutoReplyTenant ? (
                    <div className="flex min-h-0 flex-1 flex-col">
                      <div className="flex items-center justify-between gap-2 border-b border-black/5 bg-white/80 px-3 py-2.5 dark:border-white/10 dark:bg-zinc-900/80">
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-semibold text-black dark:text-zinc-50">
                            {selectedAutoReplyTenant.tenantName}
                          </div>
                          <p className="truncate text-[11px] text-black/45 dark:text-zinc-500">
                            {selectedAutoReplyTenant.replyCount} auto{" "}
                            {selectedAutoReplyTenant.replyCount === 1 ? "reply" : "replies"} · last{" "}
                            {selectedAutoReplyTenant.lastAt
                              ? formatStamp(selectedAutoReplyTenant.lastAt)
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="mobile-scrollbar-none flex-1 space-y-3 overflow-y-auto px-3 py-3">
                        {autoReplyLoading && visibleAutoReplyEvents.length === 0 ? (
                          <div className="grid h-full place-items-center text-[13px] text-black/45">
                            <Loader2 className="h-5 w-5 animate-spin text-[#0F766E]" />
                          </div>
                        ) : visibleAutoReplyEvents.length === 0 ? (
                          <div className="grid h-full place-items-center text-center text-[13px] text-black/45">
                            No auto replies for this school yet.
                          </div>
                        ) : (
                          visibleAutoReplyEvents.map((event) => {
                            const question = event.queryText || event.faqQuestion || "Question";
                            return (
                              <div key={event.id} className="space-y-1.5">
                                <div className="flex justify-end px-1">
                                  <div className="max-w-[min(82%,28rem)] rounded-[18px] rounded-br-[4px] bg-[#0F766E] px-2.5 py-1.5 text-[15px] leading-snug text-white shadow-sm">
                                    <div>{question}</div>
                                    <div className="mt-0.5 text-right text-[10px] leading-none text-white/70 tabular-nums">
                                      {formatChatStamp(event.createdAt, "bubble")}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-start px-1">
                                  <div className="max-w-[min(82%,28rem)] rounded-[18px] rounded-bl-[4px] bg-white px-2.5 py-1.5 text-[15px] leading-snug text-slate-800 shadow-sm dark:border dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100">
                                    <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#0F766E]/80 dark:text-teal-300/90">
                                      <span>{autoReplySourceLabel(String(event.source))}</span>
                                      {event.userName ? (
                                        <span className="font-medium normal-case tracking-normal text-black/35 dark:text-zinc-500">
                                          · {event.userName}
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="whitespace-pre-wrap">
                                      {event.answerText || "—"}
                                    </div>
                                    <div className="mt-0.5 text-right text-[10px] leading-none text-black/35 tabular-nums dark:text-zinc-500">
                                      {formatChatStamp(event.createdAt, "bubble")}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid flex-1 place-items-center text-center">
                      <div>
                        <LifeBuoy className="mx-auto h-8 w-8 text-black/25" />
                        <p className="mt-2 text-[13px] font-medium text-black/55">
                          Pick a school
                        </p>
                        <p className="mt-0.5 text-[12px] text-black/40">
                          Review every FAQ auto reply that school used.
                        </p>
                      </div>
                    </div>
                  )}
                </SupportChatShell>
              </div>
            </div>
          </OrganicCard>
        ) : null}

        {section === "help" ? (
          <OrganicCard tone="white" cornerSide="tr" padded className="col-span-12">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-[13px] font-semibold text-black">Help answers</div>
                <p className="mt-0.5 text-[12px] text-black/50">
                  Question and answer only. Schools see these in Settings → Customer Support.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setFaqDraft(emptyFaq())}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                New answer
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-12 gap-3">
              <ul className="mobile-scrollbar-none col-span-12 max-h-[28rem] space-y-1.5 overflow-y-auto lg:col-span-5">
                {faqs.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-[#E5E5E5] px-3 py-10 text-center text-[13px] text-black/45">
                    No help answers yet. Add the first one.
                  </li>
                ) : (
                  faqs.map((faq) => (
                    <li key={faq.id}>
                      <button
                        type="button"
                        onClick={() => setFaqDraft(faq)}
                        className={cn(
                          "flex w-full items-start justify-between gap-2 rounded-xl border px-3 py-2.5 text-left",
                          faqDraft.id === faq.id
                            ? "border-[#0F766E]/40 bg-[#F0FDFA]"
                            : "border-[#EFEFEF] bg-white hover:bg-[#FAFAFA]",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-semibold text-black">
                            {faq.question}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-black/40">
                            {faq.active === false ? "Hidden from schools" : "Shown to schools"}
                          </span>
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`Remove ${faq.question}`}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-black/40 hover:bg-red-50 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            void deleteFaq(faq.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              void deleteFaq(faq.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>

              <div className="col-span-12 space-y-3 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5 lg:col-span-7">
                <label className="block space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                    Question
                  </Label>
                  <Input
                    value={faqDraft.question}
                    onChange={(e) => setFaqDraft((prev) => ({ ...prev, question: e.target.value }))}
                    placeholder="How do I admit a student?"
                    className="h-9 rounded-lg bg-white"
                  />
                </label>
                <label className="block space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                    Answer
                  </Label>
                  <Textarea
                    value={faqDraft.answer ?? ""}
                    onChange={(e) => setFaqDraft((prev) => ({ ...prev, answer: e.target.value }))}
                    placeholder="Write a short, clear answer…"
                    className="min-h-[140px] rounded-lg bg-white"
                  />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-[13px] text-black/65">
                    <Switch
                      checked={faqDraft.active !== false}
                      onCheckedChange={(on) => setFaqDraft((prev) => ({ ...prev, active: on }))}
                    />
                    Show to schools
                  </label>
                  <Button
                    type="button"
                    disabled={faqBusy}
                    onClick={() => void saveFaq()}
                    className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
                  >
                    {faqBusy ? "Saving…" : faqDraft.id ? "Save answer" : "Add answer"}
                  </Button>
                </div>
              </div>
            </div>
          </OrganicCard>
        ) : null}

        {section === "leads" ? <LeadsView onSummary={setLeadSummary} /> : null}

        {section === "contact" ? (
          <OrganicCard tone="white" cornerSide="tr" padded className="col-span-12">
            <div className="text-[13px] font-semibold text-black">How schools reach you</div>
            <p className="mt-0.5 text-[12px] text-black/50">
              These details appear in every school under Settings → Customer Support.
            </p>
            <div className="mt-4 grid grid-cols-12 gap-3">
              <label className="col-span-12 space-y-1.5 sm:col-span-6">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  Email
                </Label>
                <Input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, supportEmail: e.target.value }))
                  }
                  placeholder="support@feezo.app"
                  className="h-9 rounded-lg"
                />
                <p className="text-[11px] text-black/40">Opens Gmail when a school taps Email.</p>
              </label>
              <label className="col-span-12 space-y-1.5 sm:col-span-6">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  WhatsApp number
                </Label>
                <PhoneInput
                  value={
                    settings.whatsappE164
                      ? settings.whatsappE164.startsWith("+")
                        ? settings.whatsappE164
                        : `+${settings.whatsappE164}`
                      : ""
                  }
                  onChange={(e164) =>
                    setSettings((prev) => ({
                      ...prev,
                      whatsappE164: phoneDigits(e164) || SUPPORT_DEFAULT_WHATSAPP_E164,
                    }))
                  }
                  defaultCountry="IN"
                  className="h-9"
                  inputClassName="h-9 rounded-lg"
                />
                <p className="text-[11px] text-black/40">
                  Country code is selected automatically; change it anytime.
                </p>
              </label>
              <label className="col-span-12 space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  Welcome message
                </Label>
                <Textarea
                  value={settings.greeting}
                  onChange={(e) => setSettings((prev) => ({ ...prev, greeting: e.target.value }))}
                  placeholder="Hi — how can we help?"
                  className="min-h-[96px] rounded-lg"
                />
                <p className="text-[11px] text-black/40">
                  First line schools see in the help chat.
                </p>
              </label>
              <div className="col-span-12">
                <Button
                  type="button"
                  onClick={() => void saveChannels()}
                  disabled={savingChannels}
                  className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
                >
                  {savingChannels ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-1.5 h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          </OrganicCard>
        ) : null}
      </div>

      <AlertDialog
        open={pendingStatusChange !== null}
        onOpenChange={(open) => {
          if (!open && !replyBusy) setPendingStatusChange(null);
        }}
      >
        <AlertDialogContent className="max-w-sm rounded-2xl border border-[#E5E5E5] bg-white dark:border-white/10 dark:bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black dark:text-zinc-50">
              {pendingStatusChange === "closed" ? "Close this chat?" : "Reopen this chat?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-black/60 dark:text-zinc-400">
              {pendingStatusChange === "closed"
                ? "The school will not be able to send new messages until this chat is reopened."
                : "Reopening lets you and the school continue this conversation."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={replyBusy} className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={replyBusy}
              className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
              onClick={(event) => {
                event.preventDefault();
                confirmStatusChange();
              }}
            >
              {pendingStatusChange === "closed" ? "Close chat" : "Reopen chat"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deletingMessage)}
        onOpenChange={(open) => {
          if (!open && !replyBusy) setDeletingMessage(null);
        }}
      >
        <AlertDialogContent className="max-w-sm rounded-2xl border border-[#E5E5E5] bg-white dark:border-white/10 dark:bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black dark:text-zinc-50">
              Delete message?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-black/60 dark:text-zinc-400">
              This message will be removed for you and the school. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={replyBusy} className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={replyBusy}
              className="rounded-full bg-[#EF4444] text-white hover:bg-[#DC2626]"
              onClick={(event) => {
                event.preventDefault();
                void confirmDeleteMessage();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
