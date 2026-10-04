import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, KeyRound, Loader2, Mail, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import {
  SupportChatBubble,
  SupportChatShell,
  ConversationMeta,
} from "@/components/support/SupportChatBubble";
import { usePinnedChatFrame } from "@/hooks/usePinnedChatFrame";
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
import { InfoTip } from "@/components/ui/info-tip";
import { OrganicCard } from "@/components/ui/organic-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sessionCanAccessSettingsTab, useAuth } from "@/lib/auth";
import { SUPPORT_CHAT_TIP } from "@/lib/help/settings-tips";
import { ApiError, getApiToken } from "@/lib/api/client";
import {
  closeSupportTicket,
  createSupportTicket,
  deleteSupportMessage,
  editSupportMessage,
  fetchSupportDesk,
  fetchSupportTickets,
  formatWhatsAppDisplay,
  markSupportTicketRead,
  matchSupportFaq,
  reopenSupportTicket,
  replySupportTicket,
  requestSupportPasswordReset,
  SUPPORT_MESSAGE_EDIT_WINDOW_MS,
  whatsappDigits,
  type SupportAttachment,
  type SupportAutoReplyEvent,
  type SupportFaq,
  type SupportMessage,
  type SupportSettings,
  type SupportTicket,
  type SupportTicketStatus,
} from "@/lib/api/support";
import { formatChatStamp } from "@/lib/dates";
import {
  isSupportFaqIntent,
  supportFaqNavForIntent,
  type SupportFaqIntent,
  type SupportFaqNavLink,
} from "@/lib/support-faq-actions";
import { useTenantStore, type TenantUser } from "@/lib/tenant-store";
import { cn, glassCardClass } from "@/lib/utils";

const workspacePanelClass = cn(glassCardClass, "rounded-2xl");

type ChatLine = {
  id: string;
  role: "bot" | "you";
  body: string;
  /** ISO / SQL datetime — must be stable across re-renders */
  createdAt: string;
  pendingTicket?: string;
  intent?: SupportFaqIntent;
};

function chatNow(): string {
  return new Date().toISOString();
}

function chatLinesFromAutoReplies(
  greeting: string,
  events: SupportAutoReplyEvent[],
): ChatLine[] {
  const lines: ChatLine[] = [
    {
      id: "greet",
      role: "bot",
      body: greeting,
      createdAt: events[0]?.createdAt || chatNow(),
    },
  ];
  for (const event of events) {
    const question = (event.queryText || event.faqQuestion || "").trim();
    if (question) {
      lines.push({
        id: `you-${event.id}`,
        role: "you",
        body: question,
        createdAt: event.createdAt,
      });
    }
    const answer = (event.answerText || "").trim();
    if (answer) {
      const intent = isSupportFaqIntent(event.intent) ? event.intent : undefined;
      lines.push({
        id: `bot-${event.id}`,
        role: "bot",
        body: answer,
        createdAt: event.createdAt,
        intent,
        pendingTicket: event.matched ? undefined : question || undefined,
      });
    }
  }
  return lines;
}

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

function supportActionShellClass(className?: string) {
  return cn(
    "mt-1.5 max-w-[min(100%,22rem)] rounded-xl border border-[#99F6E4]/70 bg-[#F0FDFA] p-3 dark:border-teal-800/50 dark:bg-teal-950/30",
    className,
  );
}

function SupportFaqNavCard({ title, links }: { title: string; links: SupportFaqNavLink[] }) {
  return (
    <div className={supportActionShellClass()}>
      <p className="text-[12px] font-semibold text-[#0F766E] dark:text-teal-300">{title}</p>
      <div className="mt-2.5 flex flex-col gap-1.5">
        {links.map((link) => (
          <Link
            key={`${link.to}-${link.label}`}
            to={link.to}
            search={link.search}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-full px-3 text-[12px] font-semibold transition-colors",
              link.primary
                ? "bg-[#0F766E] text-white hover:bg-[#0D9488]"
                : "border border-[#E5E5E5] bg-white text-black/70 hover:border-[#0F766E]/35 hover:text-[#0F766E] dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-300",
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function ContactHumanCard({
  onEmail,
  onWhatsApp,
  onTicket,
}: {
  onEmail: () => void;
  onWhatsApp: () => void;
  onTicket: () => void;
}) {
  return (
    <div className={supportActionShellClass()}>
      <p className="text-[12px] font-semibold text-[#0F766E] dark:text-teal-300">
        Reach the Feezo team
      </p>
      <div className="mt-2.5 flex flex-col gap-1.5">
        <Button
          type="button"
          size="sm"
          className="h-9 justify-center rounded-full bg-[#0F766E] px-3 text-[12px] text-white hover:bg-[#0D9488]"
          onClick={onTicket}
        >
          Send to Feezo (ticket)
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 justify-center rounded-full text-[12px]"
          onClick={onEmail}
        >
          <Mail className="mr-1.5 h-3.5 w-3.5" />
          Email support
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 justify-center rounded-full text-[12px]"
          onClick={onWhatsApp}
        >
          <WhatsAppMark className="mr-1.5 h-3.5 w-3.5" />
          WhatsApp
        </Button>
        <Link
          to="/tenant/support"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 text-[12px] font-medium text-black/70 transition-colors hover:border-[#0F766E]/35 hover:text-[#0F766E] dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <BookOpen className="h-3.5 w-3.5" />
          Browse guides
        </Link>
      </div>
    </div>
  );
}

function PasswordResetBotCard({
  canResetTeam,
  teamUsers,
  busy,
  onResetSelf,
  onResetUser,
}: {
  canResetTeam: boolean;
  teamUsers: TenantUser[];
  busy: boolean;
  onResetSelf: () => void;
  onResetUser: (userId: string) => void;
}) {
  const [pickedUserId, setPickedUserId] = useState("");
  const activeUsers = useMemo(
    () =>
      teamUsers
        .filter((u) => u.active !== false)
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [teamUsers],
  );

  return (
    <div className={supportActionShellClass()}>
      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0F766E] dark:text-teal-300">
        <KeyRound className="h-3.5 w-3.5 shrink-0" />
        Reset password — no Feezo ticket needed
      </p>
      <div className="mt-2.5 flex flex-col gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy}
          className="h-9 justify-start rounded-full bg-[#0F766E] px-3 text-[12px] text-white hover:bg-[#0D9488]"
          onClick={onResetSelf}
        >
          {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          Send reset link to my email
        </Button>
        {canResetTeam ? (
          <div className="space-y-1.5 rounded-lg border border-[#99F6E4]/50 bg-white/80 p-2 dark:border-teal-800/40 dark:bg-zinc-950/50">
            <p className="text-[11px] font-medium text-black/55 dark:text-zinc-400">
              Reset a team member
            </p>
            <Select value={pickedUserId || undefined} onValueChange={setPickedUserId}>
              <SelectTrigger className="h-9 rounded-lg border-[#E5E5E5] bg-white text-[12px] dark:border-white/10 dark:bg-zinc-900">
                <SelectValue placeholder="Choose user…" />
              </SelectTrigger>
              <SelectContent className="z-[120]">
                {activeUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id} className="text-[12px]">
                    {user.displayName} · {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy || !pickedUserId}
              className="h-8 w-full rounded-full text-[12px]"
              onClick={() => pickedUserId && onResetUser(pickedUserId)}
            >
              Send reset link
            </Button>
          </div>
        ) : null}
        <Link
          to="/tenant/settings"
          search={(prev) => ({ ...prev, tab: "users", chat: undefined })}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 text-[12px] font-medium text-black/70 transition-colors hover:border-[#0F766E]/35 hover:text-[#0F766E] dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <Users className="h-3.5 w-3.5" />
          Open Users
        </Link>
      </div>
    </div>
  );
}

function botLineFromMatch(result: {
  faq?: { answer?: string } | null;
  intent?: string | null;
  event?: SupportAutoReplyEvent | null;
}): ChatLine {
  const intent = isSupportFaqIntent(result.intent) ? result.intent : undefined;
  return {
    id: result.event?.id ? `bot-${result.event.id}` : `bot-${Date.now()}`,
    role: "bot",
    body: (result.faq?.answer as string) || "",
    createdAt: result.event?.createdAt || chatNow(),
    intent,
  };
}

export function CustomerSupportCard({
  onBackToSettings,
  pinToViewport = false,
}: {
  onBackToSettings?: () => void;
  pinToViewport?: boolean;
}) {
  const navigate = useNavigate();
  const search = useSearch({ from: "/tenant/settings" });
  const chatId = search.chat;
  const { session } = useAuth();
  const { schoolDetails, tenantUsers } = useTenantStore();
  const schoolName = schoolDetails.name || session?.tenantName || "School";
  const userName = session?.displayName || session?.email || "School admin";
  const canResetTeam = sessionCanAccessSettingsTab(session, "users");
  const [resetBusy, setResetBusy] = useState(false);

  const [settings, setSettings] = useState<SupportSettings | null>(null);
  const [faqs, setFaqs] = useState<SupportFaq[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [ticketBusy, setTicketBusy] = useState(false);
  const [editingMessage, setEditingMessage] = useState<SupportMessage | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<SupportMessage | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<"closed" | "open" | null>(null);
  const threadScrollRef = useRef<HTMLDivElement>(null);

  const canEditMessage = useCallback((msg: SupportMessage) => {
    if (msg.author !== "school") return false;
    if (!(msg.body || "").trim()) return false;
    const age = Date.now() - new Date(msg.createdAt).getTime();
    return age >= 0 && age <= SUPPORT_MESSAGE_EDIT_WINDOW_MS;
  }, []);

  const canDeleteMessage = useCallback((msg: SupportMessage) => msg.author === "school", []);

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
      const history = Array.isArray(desk.autoReplies) ? desk.autoReplies : [];
      setChat((prev) => {
        if (prev.length > 1) return prev;
        if (history.length > 0) {
          return chatLinesFromAutoReplies(desk.settings.greeting, history);
        }
        if (prev.length) return prev;
        return [
          {
            id: "greet",
            role: "bot",
            body: desk.settings.greeting,
            createdAt: chatNow(),
          },
        ];
      });
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
    const email = settings?.supportEmail || "support@feezo.app";
    const href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
      `Support · ${schoolName}`,
    )}&body=${encodeURIComponent(channelMessage())}`;
    window.location.href = href;
  };

  const openWhatsApp = () => {
    const digits = whatsappDigits(settings?.whatsappE164);
    window.open(
      `https://wa.me/${digits}?text=${encodeURIComponent(channelMessage())}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const ask = async (text: string, faqId?: string) => {
    const question = text.trim();
    if (!question || sending) return;
    setSending(true);
    const youId = `you-${Date.now()}`;
    const askedAt = chatNow();
    setChat((prev) => [
      ...prev,
      { id: youId, role: "you", body: question, createdAt: askedAt },
    ]);
    try {
      const result = await matchSupportFaq({ text: question, faqId });
      const stamp = result.event?.createdAt || askedAt;
      setChat((prev) =>
        prev.map((line) =>
          line.id === youId
            ? {
                ...line,
                id: result.event?.id ? `you-${result.event.id}` : line.id,
                createdAt: stamp,
              }
            : line,
        ),
      );
      if (result.matched && result.faq?.answer) {
        setChat((prev) => [...prev, botLineFromMatch(result)]);
      } else {
        setChat((prev) => [
          ...prev,
          {
            id: result.event?.id ? `bot-${result.event.id}` : `bot-${Date.now()}`,
            role: "bot",
            body: result.fallback,
            createdAt: stamp,
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

  const handlePasswordReset = async (target: "self" | "user", userId?: string) => {
    if (resetBusy) return;
    setResetBusy(true);
    try {
      const result = await requestSupportPasswordReset({ target, userId });
      const emailLabel = result.targetEmail || (target === "self" ? "your email" : "that user");
      setChat((prev) => [
        ...prev,
        {
          id: `bot-reset-${Date.now()}`,
          role: "bot",
          createdAt: chatNow(),
          body: result.emailed
            ? `Reset link sent to ${emailLabel}. It expires in about an hour.`
            : `Reset requested for ${emailLabel}. ${result.message}${
                result.resetUrl
                  ? `\n\nEmail delivery may be delayed — open the reset link directly:\n${result.resetUrl}`
                  : ""
              }`,
        },
      ]);
      toast.success(result.emailed ? "Reset email sent" : "Reset requested", {
        description: result.emailed
          ? `Check ${emailLabel}`
          : result.resetUrl
            ? "Use the link in chat if mail is delayed"
            : result.message,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not send reset link";
      toast.error("Password reset failed", { description: msg });
    } finally {
      setResetBusy(false);
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
            ? {
                ...line,
                pendingTicket: undefined,
                body: `${line.body}\n\nSent to Feezo as ${ticket.id}.`,
              }
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
  const activeTicket =
    chatId && chatId !== "new" ? (tickets.find((t) => t.id === chatId) ?? null) : null;
  const onMobileThread = Boolean(activeTicket) || composing;
  const frameRef = usePinnedChatFrame(pinToViewport);

  useEffect(() => {
    setEditingMessage(null);
    setDeletingMessage(null);
  }, [chatId]);

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

  const saveEditedMessage = async (input: { body: string; attachments: SupportAttachment[] }) => {
    if (!activeTicket || !editingMessage) return;
    if (!input.body.trim()) return;
    setTicketBusy(true);
    try {
      const next = await editSupportMessage({
        ticketId: activeTicket.id,
        messageId: editingMessage.id,
        body: input.body.trim(),
      });
      setTickets((prev) => prev.map((t) => (t.id === next.id ? next : t)));
      setEditingMessage(null);
      toast.success("Message updated");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not edit message";
      toast.error("Could not edit", { description: msg });
      throw err instanceof Error ? err : new Error(msg);
    } finally {
      setTicketBusy(false);
    }
  };

  const confirmDeleteMessage = async () => {
    if (!activeTicket || !deletingMessage) return;
    setTicketBusy(true);
    try {
      const next = await deleteSupportMessage({
        ticketId: activeTicket.id,
        messageId: deletingMessage.id,
      });
      setTickets((prev) => prev.map((t) => (t.id === next.id ? next : t)));
      if (editingMessage?.id === deletingMessage.id) {
        setEditingMessage(null);
      }
      setDeletingMessage(null);
      toast.success("Message deleted");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not delete message";
      toast.error("Could not delete", { description: msg });
    } finally {
      setTicketBusy(false);
    }
  };

  const startTicket = async (input: { body: string; attachments: SupportAttachment[] }) => {
    if (!input.body.trim() && input.attachments.length === 0) return;
    const text = input.body.trim();

    // Text-only messages: try FAQ / password intent before opening a Feezo ticket.
    if (text && input.attachments.length === 0) {
      setTicketBusy(true);
      try {
        const result = await matchSupportFaq({ text });
        if (result.matched && result.faq?.answer) {
          const stamp = result.event?.createdAt || chatNow();
          setChat((prev) => [
            ...prev,
            {
              id: result.event?.id ? `you-${result.event.id}` : `you-${Date.now()}`,
              role: "you",
              body: text,
              createdAt: stamp,
            },
            botLineFromMatch(result),
          ]);
          return;
        }
      } catch {
        // Fall through to ticket create
      } finally {
        setTicketBusy(false);
      }
    }

    setTicketBusy(true);
    try {
      const ticket = await createSupportTicket({
        subject: text || undefined,
        body: text,
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
      setPendingStatusChange(null);
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

  const confirmStatusChange = () => {
    if (!pendingStatusChange) return;
    void setTicketStatus(pendingStatusChange);
  };

  useEffect(() => {
    if (!chatId || chatId === "new") return;
    const ticket = tickets.find((item) => item.id === chatId);
    if (!ticket) return;
    if (!ticket.schoolUnread && !(ticket.schoolUnreadCount ?? 0)) return;
    void markSupportTicketRead(chatId)
      .then((next) => {
        setTickets((prev) =>
          prev.map((item) => (item.id === next.id ? { ...item, ...next } : item)),
        );
      })
      .catch(() => {
        // ignore
      });
  }, [chatId, tickets]);

  const shellClass =
    "flex h-full min-h-0 flex-col overflow-hidden md:h-[min(calc(100dvh-8rem),760px)] lg:h-[min(calc(100dvh-11rem),760px)] lg:flex-row";
  const frameClass = cn(
    "h-full min-h-0",
    pinToViewport &&
      "max-md:fixed max-md:inset-x-0 max-md:top-[calc(4rem+env(safe-area-inset-top,0px))] max-md:bottom-[calc(60px+0.75rem+env(safe-area-inset-bottom,0px))] max-md:z-20 max-md:overflow-hidden",
  );

  return (
    <>
      <div ref={frameRef} className={frameClass}>
        {loading ? (
          <OrganicCard
            tone="white"
            cornerSide="tr"
            padded={false}
            className={cn(workspacePanelClass, "h-full overflow-hidden p-0 max-md:rounded-none")}
          >
            <div
              className={cn(
                "flex items-center justify-center gap-2 text-[13px] text-black/45 dark:text-zinc-400",
                shellClass,
              )}
            >
              <Loader2 className="h-4 w-4 animate-spin" /> Opening chat…
            </div>
          </OrganicCard>
        ) : (
          <OrganicCard
            tone="white"
            cornerSide="br"
            padded={false}
            className={cn(
              workspacePanelClass,
              "col-span-12 h-full overflow-hidden p-0 max-md:rounded-none",
            )}
          >
            <div className={shellClass}>
          <div
            className={cn(
              "flex w-full min-h-0 flex-1 flex-col border-[#EFEFEF] bg-white dark:border-white/10 dark:bg-zinc-950 lg:w-[300px] lg:max-w-[300px] lg:flex-none lg:border-r",
              onMobileThread ? "hidden lg:flex" : "flex",
            )}
          >
            <div className="flex items-center gap-1 border-b border-[#EFEFEF] px-2 py-2 dark:border-white/10">
              {onBackToSettings ? (
                <button
                  type="button"
                  onClick={onBackToSettings}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-black/55 transition-colors hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10 lg:hidden"
                  aria-label="Back to settings"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              ) : null}
              <div className="min-w-0 flex-1 px-1">
                <div className="flex items-center gap-1 text-[16px] font-semibold text-black dark:text-zinc-100">
                  Chats
                  <InfoTip content={SUPPORT_CHAT_TIP} side="bottom" />
                </div>
              </div>
              <div className="flex shrink-0 items-center">
                <Link
                  to="/tenant/support"
                  className="grid h-9 w-9 place-items-center rounded-full text-black/45 hover:bg-black/5 hover:text-[#0F766E] dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-teal-300"
                  aria-label="Browse guides"
                  title="Browse guides"
                >
                  <BookOpen className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={openGmail}
                  className="grid h-9 w-9 place-items-center rounded-full text-black/45 hover:bg-black/5 hover:text-[#0F766E] dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-teal-300"
                  aria-label={`Email ${settings?.supportEmail || "support"}`}
                  title={settings?.supportEmail || "Email"}
                >
                  <Mail className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={openWhatsApp}
                  className="grid h-9 w-9 place-items-center rounded-full text-black/45 hover:bg-black/5 hover:text-[#0F766E] dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-teal-300"
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
                <li className="px-4 py-10 text-center text-[13px] text-black/40 dark:text-zinc-500">
                  No tickets yet. Pick a suggested topic in the assistant, or message Feezo when you
                  need a human.
                </li>
              ) : (
                tickets.map((ticket) => {
                  const active = ticket.id === chatId;
                  const preview = ticket.lastMessage?.body || ticket.subject;
                  const unread = ticket.schoolUnreadCount ?? (ticket.schoolUnread ? 1 : 0);
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
                                unread > 0
                                  ? "font-semibold text-[#0F766E] dark:text-teal-300"
                                  : "text-black/35 dark:text-zinc-500",
                              )}
                            >
                              {formatStamp(ticket.updatedAt)}
                            </span>
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className={cn(
                                "min-w-0 flex-1 truncate text-[13px]",
                                unread > 0
                                  ? "font-medium text-black/70 dark:text-zinc-300"
                                  : "text-black/50 dark:text-zinc-400",
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
                <div className="flex shrink-0 items-center gap-2 border-b border-black/5 bg-white/90 px-1.5 py-1.5 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-950/90">
                  <Link
                    to="/tenant/settings"
                    search={{ tab: "support" }}
                    className="grid h-10 w-10 place-items-center rounded-full text-black/55 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10 lg:hidden"
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
                    <div className="text-[12px] text-black/45 dark:text-zinc-400">
                      {STATUS_LABEL[activeTicket.status]}
                    </div>
                  </div>
                  {activeTicket.status === "closed" ? (
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 shrink-0 rounded-full bg-[#0F766E] px-3 text-[12px] text-white hover:bg-[#0D9488]"
                      disabled={ticketBusy}
                      onClick={() => setPendingStatusChange("open")}
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
                      onClick={() => setPendingStatusChange("closed")}
                    >
                      Close
                    </Button>
                  )}
                </div>
                <div
                  ref={threadScrollRef}
                  className="mobile-scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3 sm:px-3"
                >
                  <div className="flex min-h-full flex-col justify-end gap-1">
                    {(activeTicket.messages ?? []).map((msg) => (
                      <SupportChatBubble
                        key={msg.id}
                        fromYou={msg.author === "school"}
                        createdAt={msg.createdAt}
                        updatedAt={msg.updatedAt}
                        body={msg.body}
                        attachments={msg.attachments}
                        canEdit={activeTicket.status !== "closed" && canEditMessage(msg)}
                        canDelete={canDeleteMessage(msg)}
                        onEdit={
                          activeTicket.status !== "closed" && canEditMessage(msg)
                            ? () => setEditingMessage(msg)
                            : undefined
                        }
                        onDelete={canDeleteMessage(msg) ? () => setDeletingMessage(msg) : undefined}
                      />
                    ))}
                  </div>
                </div>
                <div className="shrink-0 bg-[#E8EEE9] px-1.5 pb-2 pt-1 sm:px-2 md:pb-[max(0.5rem,env(safe-area-inset-bottom))] dark:bg-zinc-950">
                  {activeTicket.status === "closed" ? (
                    <p className="rounded-2xl bg-white/80 px-3 py-2 text-center text-[12px] text-black/50 dark:bg-zinc-900/80 dark:text-zinc-400">
                      Chat closed. Reopen it from the header, or start a new one from the list.
                    </p>
                  ) : (
                    <SupportComposer
                      key={`${activeTicket.id}-${editingMessage?.id ?? "new"}`}
                      ticketId={activeTicket.id}
                      placeholder={editingMessage ? "Edit message" : "Message"}
                      autoFocus
                      disabled={ticketBusy}
                      busy={ticketBusy}
                      initialDraft={editingMessage?.body ?? ""}
                      editingMessageId={editingMessage?.id ?? null}
                      onCancelEdit={() => setEditingMessage(null)}
                      onSend={editingMessage ? saveEditedMessage : sendTicketReply}
                    />
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex shrink-0 items-center gap-2 border-b border-black/5 bg-white/90 px-1.5 py-1.5 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-950/90">
                  {tickets.length > 0 ? (
                    <Link
                      to="/tenant/settings"
                      search={{ tab: "support" }}
                      className="grid h-10 w-10 place-items-center rounded-full text-black/55 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10 lg:hidden"
                      aria-label="Back to chats"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Link>
                  ) : null}
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0F766E] text-[11px] font-bold text-white">
                    F
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-black dark:text-zinc-100">
                      Feezo
                    </div>
                    <div className="text-[12px] text-black/45 dark:text-zinc-400">
                      Tap to type — or use Email / WhatsApp
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={openGmail}
                    className="grid h-9 w-9 place-items-center rounded-full text-black/45 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10 lg:hidden"
                    aria-label="Email"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={openWhatsApp}
                    className="grid h-9 w-9 place-items-center rounded-full text-black/45 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10 lg:hidden"
                    aria-label="WhatsApp"
                  >
                    <WhatsAppMark className="h-4 w-4" />
                  </button>
                </div>
                <div
                  ref={threadScrollRef}
                  className="mobile-scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3 sm:px-3"
                >
                  <div className="flex min-h-full flex-col justify-end gap-1">
                    {chat.map((line) => (
                      <div key={line.id}>
                        <SupportChatBubble
                          fromYou={line.role === "you"}
                          createdAt={line.createdAt}
                          body={line.body}
                        />
                        {line.intent === "password_reset" ? (
                          <div className="px-1">
                            <PasswordResetBotCard
                              canResetTeam={canResetTeam}
                              teamUsers={tenantUsers}
                              busy={resetBusy || sending}
                              onResetSelf={() => void handlePasswordReset("self")}
                              onResetUser={(userId) => void handlePasswordReset("user", userId)}
                            />
                          </div>
                        ) : null}
                        {line.intent === "contact_human" ? (
                          <div className="px-1">
                            <ContactHumanCard
                              onEmail={openGmail}
                              onWhatsApp={openWhatsApp}
                              onTicket={() =>
                                void sendToFeezo(
                                  lastUserLine || "I need help from the Feezo team.",
                                  line.id,
                                )
                              }
                            />
                          </div>
                        ) : null}
                        {line.intent &&
                        line.intent !== "password_reset" &&
                        line.intent !== "contact_human"
                          ? (() => {
                              const nav = supportFaqNavForIntent(line.intent);
                              return nav ? (
                                <div className="px-1">
                                  <SupportFaqNavCard title={nav.title} links={nav.links} />
                                </div>
                              ) : null;
                            })()
                          : null}
                        {line.pendingTicket && !line.intent ? (
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
                      <div className="mt-2 space-y-1.5 px-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40 dark:text-zinc-500">
                          Suggested topics
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {faqs.map((faq) => (
                            <button
                              key={faq.id}
                              type="button"
                              disabled={sending}
                              onClick={() => void ask(faq.question, faq.id)}
                              className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[12px] text-black/70 hover:border-[#0F766E]/40 hover:text-[#0F766E] dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-teal-500/40 dark:hover:text-teal-300"
                            >
                              {faq.question}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0 bg-[#E8EEE9] px-1.5 pb-2 pt-1 sm:px-2 md:pb-[max(0.5rem,env(safe-area-inset-bottom))] dark:bg-zinc-950">
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
        )}
      </div>

      <AlertDialog
        open={pendingStatusChange !== null}
        onOpenChange={(open) => {
          if (!open && !ticketBusy) setPendingStatusChange(null);
        }}
      >
        <AlertDialogContent className="max-w-sm rounded-2xl border border-[#E5E5E5] bg-white dark:border-white/10 dark:bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black dark:text-zinc-50">
              {pendingStatusChange === "closed" ? "Close this chat?" : "Reopen this chat?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-black/60 dark:text-zinc-400">
              {pendingStatusChange === "closed"
                ? "You will not be able to send new messages until the chat is reopened."
                : "Reopening lets you and Feezo support continue this conversation."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ticketBusy} className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={ticketBusy}
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
          if (!open) setDeletingMessage(null);
        }}
      >
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This message will be removed for you and Feezo support. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ticketBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={ticketBusy}
              className="bg-[#EF4444] text-white hover:bg-[#DC2626]"
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
