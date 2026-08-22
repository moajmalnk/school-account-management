import type { ReactNode } from "react";

import { SupportMessageContent } from "@/components/support/SupportMessageContent";
import type { SupportAttachment } from "@/lib/api/support";
import { cn } from "@/lib/utils";

export function formatChatTime(raw: string): string {
  const parsed = Date.parse(String(raw).replace(" ", "T"));
  if (!Number.isFinite(parsed)) return raw;
  const d = new Date(parsed);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
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
