import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Bus,
  CheckCheck,
  GraduationCap,
  UserCog,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

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
import { OrganicCard } from "@/components/ui/organic-card";
import type { TenantNotification } from "@/lib/tenant-store";
import { useTenantStore } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "unread";

const categoryMeta: Record<
  TenantNotification["category"],
  { label: string; icon: typeof Bell; tone: string }
> = {
  fees: {
    label: "Fees",
    icon: Wallet,
    tone: "bg-[#FEE2E2] text-[#EF4444] dark:bg-rose-950/45 dark:text-rose-300",
  },
  admissions: {
    label: "Admissions",
    icon: GraduationCap,
    tone: "bg-[#CCFBF1] text-[#0F766E] dark:bg-teal-950/45 dark:text-teal-300",
  },
  staff: {
    label: "Staff",
    icon: UserCog,
    tone: "bg-[#F4F4F5] text-black dark:bg-zinc-800 dark:text-zinc-300",
  },
  system: {
    label: "System",
    icon: Bell,
    tone: "bg-[#0F766E] text-white dark:bg-teal-800 dark:text-teal-100",
  },
  transport: {
    label: "Transport",
    icon: Bus,
    tone: "bg-[#FEF3C7] text-[#B45309] dark:bg-amber-950/45 dark:text-amber-300",
  },
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, setNotifications } = useTenantStore();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [confirmMarkAllOpen, setConfirmMarkAllOpen] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const visible = useMemo(() => {
    const list = [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return filter === "unread" ? list.filter((n) => !n.read) : list;
  }, [filter, notifications]);

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllRead = () => {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setConfirmMarkAllOpen(false);
    toast.success("All notifications marked as read");
  };

  const openNotification = (notification: TenantNotification) => {
    markRead(notification.id);
    if (!notification.href) return;
    try {
      const url = new URL(notification.href, window.location.origin);
      const search = Object.fromEntries(url.searchParams.entries());
      navigate({
        to: url.pathname,
        search: Object.keys(search).length ? search : undefined,
      });
    } catch {
      navigate({ to: notification.href });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">


      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex shrink-0 rounded-full border border-[#E5E5E5] bg-white p-1 dark:border-white/10 dark:bg-zinc-900">
          {(
            [
              { key: "all", label: "All" },
              { key: "unread", label: `Unread (${unreadCount})` },
            ] as const
          ).map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
                  active
                    ? "bg-[#0F766E] text-white"
                    : "text-black/55 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setConfirmMarkAllOpen(true)}
          disabled={unreadCount === 0}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-4 text-[12.5px] font-semibold text-black transition-colors hover:border-black/20 hover:bg-[#F4F4F5] disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-white/20 dark:hover:bg-zinc-800"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Mark all read
        </button>
      </div>

      <AlertDialog open={confirmMarkAllOpen} onOpenChange={setConfirmMarkAllOpen}>
        <AlertDialogContent className="max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[22px] font-semibold text-black dark:text-zinc-50">
              Mark all as read?
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60 dark:text-zinc-400">
              This will mark all {unreadCount} unread notification
              {unreadCount === 1 ? "" : "s"} as read.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5 flex-row justify-end gap-2 sm:space-x-0">
            <AlertDialogCancel className="mt-0 rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={markAllRead}
              className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
            >
              Mark all read
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OrganicCard tone="white" cornerSide="tr" padded className="overflow-hidden">
        {visible.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#F4F4F5] text-black/40 dark:bg-zinc-800 dark:text-zinc-500">
              <Bell className="h-5 w-5" />
            </div>
            <div className="mt-3 text-[14px] font-semibold text-black dark:text-zinc-100">
              No notifications
            </div>
            <p className="mt-1 text-[12px] text-black/55 dark:text-zinc-400">
              {filter === "unread"
                ? "Unread alerts will appear here"
                : "New alerts will show up in this feed"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0F0F0] dark:divide-white/10">
            {visible.map((notification) => {
              const meta = categoryMeta[notification.category];
              const Icon = meta.icon;
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openNotification(notification)}
                  className={cn(
                    "flex w-full items-start gap-3 px-1 py-3.5 text-left transition-colors first:pt-0 last:pb-0 hover:bg-[#FAFAFA] dark:hover:bg-white/5 sm:gap-4 sm:px-2",
                    !notification.read && "bg-[#FCFEF5]/80 dark:bg-teal-950/35",
                  )}
                >
                  <div
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                      meta.tone,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13.5px] font-semibold text-black dark:text-zinc-100">
                            {notification.title}
                          </span>
                          {!notification.read && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#0F766E] dark:bg-teal-400" />
                          )}
                        </div>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-black/60 dark:text-zinc-400">
                          {notification.body}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-[10.5px] text-black/45 dark:text-zinc-500">
                        {notification.timeLabel}
                      </span>
                    </div>
                    <span className="mt-2 inline-flex rounded-full bg-[#F4F4F5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-black/50 dark:bg-zinc-800 dark:text-zinc-400">
                      {meta.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </OrganicCard>
    </div>
  );
}
