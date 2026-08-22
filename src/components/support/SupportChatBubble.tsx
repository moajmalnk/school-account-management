import type { ReactNode } from "react";

import { SupportMessageContent } from "@/components/support/SupportMessageContent";
import type { SupportAttachment } from "@/lib/api/support";
import { formatChatStamp } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function formatChatTime(raw: string): string {
  return formatChatStamp(raw, "bubble");
}

export function ConversationMeta({
  unreadCount = 0,
  messageCount = 0,
}: {
  unreadCount?: number;
  messageCount?: number;
}) {
  const msgs = Math.max(0, messageCount);
  const unread = Math.max(0, unreadCount);
  if (msgs < 1 && unread < 1) return null;
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      {msgs > 0 ? (
        <span className="tabular-nums text-[10px] font-medium text-black/40">
          {msgs} {msgs === 1 ? "msg" : "msgs"}
        </span>
      ) : null}
      {unread > 0 ? (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0F766E] px-1.5 font-mono text-[10px] font-bold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </span>
  );
}

export function SupportChatBubble({
  fromYou,
  createdAt,
  body,
  attachments,
}: {
  fromYou: boolean;
  createdAt: string;
  body?: string;
  attachments?: SupportAttachment[] | null;
}) {
  return (
    <div className={cn("flex px-1", fromYou ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[min(82%,28rem)] px-2.5 py-1.5 text-[15px] leading-snug shadow-sm",
          fromYou
            ? "rounded-[18px] rounded-br-[4px] bg-[#0F766E] text-white"
            : "rounded-[18px] rounded-bl-[4px] bg-white text-slate-800 dark:bg-zinc-900 dark:text-zinc-100",
        )}
      >
        <SupportMessageContent body={body} attachments={attachments} inverted={fromYou} />
        <div
          className={cn(
            "mt-0.5 text-right font-normal text-[10px] leading-none tabular-nums",
            fromYou ? "text-white/70" : "text-black/35 dark:text-zinc-500",
          )}
        >
          {formatChatTime(createdAt)}
        </div>
      </div>
    </div>
  );
}

export function SupportChatShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden bg-[#E8EEE9] dark:bg-zinc-950",
        className,
      )}
    >
      {children}
    </div>
  );
}
