import { useCallback, useRef, useState, type ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { SupportMessageContent } from "@/components/support/SupportMessageContent";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
        <span className="tabular-nums text-[10px] font-medium text-black/40 dark:text-zinc-500">
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

function MessageActionSheet({
  open,
  onOpenChange,
  canEdit,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Message actions</SheetTitle>
          <SheetDescription>Edit or delete this message</SheetDescription>
        </SheetHeader>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/10 dark:bg-white/15" />
        <div className="flex flex-col gap-1">
          {canEdit && onEdit ? (
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onEdit();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-[15px] font-medium text-black transition-colors hover:bg-black/[0.04] dark:text-zinc-100 dark:hover:bg-white/5"
            >
              <Pencil className="h-5 w-5 shrink-0 text-[#0F766E]" />
              Edit message
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onDelete();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-[15px] font-medium text-[#EF4444] transition-colors hover:bg-[#FEF2F2] dark:hover:bg-rose-950/40"
            >
              <Trash2 className="h-5 w-5 shrink-0" />
              Delete message
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="mt-3 w-full rounded-xl border border-black/10 py-3 text-[15px] font-semibold text-black/70 dark:border-white/10 dark:text-zinc-300"
        >
          Cancel
        </button>
      </SheetContent>
    </Sheet>
  );
}

export function SupportChatBubble({
  fromYou,
  createdAt,
  updatedAt,
  body,
  attachments,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}: {
  fromYou: boolean;
  createdAt: string;
  updatedAt?: string | null;
  body?: string;
  attachments?: SupportAttachment[] | null;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);
  const manageable = fromYou && (canEdit || canDelete) && (onEdit || onDelete);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const openActions = useCallback(() => {
    if (!manageable) return;
    setActionsOpen(true);
  }, [manageable]);

  const handleTouchStart = () => {
    if (!manageable) return;
    longPressTriggered.current = false;
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      openActions();
    }, 480);
  };

  const handleTouchEnd = () => {
    clearLongPress();
  };

  const edited =
    Boolean(updatedAt) &&
    updatedAt !== createdAt &&
    new Date(updatedAt!).getTime() > new Date(createdAt).getTime();

  const bubble = (
    <div
      className={cn(
        "max-w-[min(82%,28rem)] px-2.5 py-1.5 text-[15px] leading-snug shadow-sm",
        fromYou
          ? "rounded-[18px] rounded-br-[4px] bg-[#0F766E] text-white"
          : "rounded-[18px] rounded-bl-[4px] bg-white text-slate-800 shadow-sm dark:border dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100",
        manageable && "cursor-pointer select-none active:opacity-90",
      )}
      role={manageable ? "button" : undefined}
      tabIndex={manageable ? 0 : undefined}
      onContextMenu={(event) => {
        if (!manageable) return;
        event.preventDefault();
        openActions();
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClick={() => {
        if (longPressTriggered.current) {
          longPressTriggered.current = false;
          return;
        }
      }}
      onKeyDown={(event) => {
        if (!manageable) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openActions();
        }
      }}
    >
      <SupportMessageContent body={body} attachments={attachments} inverted={fromYou} />
      <div
        className={cn(
          "mt-0.5 text-right font-normal text-[10px] leading-none tabular-nums",
          fromYou ? "text-white/70" : "text-black/35 dark:text-zinc-500",
        )}
      >
        {formatChatTime(createdAt)}
        {edited ? <span className="ml-1 italic opacity-90">· edited</span> : null}
      </div>
    </div>
  );

  return (
    <div className={cn("flex px-1", fromYou ? "justify-end" : "justify-start")}>
      {bubble}
      {manageable ? (
        <MessageActionSheet
          open={actionsOpen}
          onOpenChange={setActionsOpen}
          canEdit={canEdit}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : null}
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
