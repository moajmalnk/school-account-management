import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CheckCheck,
  GraduationCap,
  UserCog,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { OrganicCard } from "@/components/ui/organic-card";
import type { TenantNotification } from "@/lib/tenant-store";
import { useTenantStore } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "unread";

const categoryMeta: Record<
  TenantNotification["category"],
  { label: string; icon: typeof Bell; tone: string }
> = {
  fees: { label: "Fees", icon: Wallet, tone: "bg-[#FEE2E2] text-[#B91C1C]" },
  admissions: { label: "Admissions", icon: GraduationCap, tone: "bg-[#E1F2AE] text-black" },
  staff: { label: "Staff", icon: UserCog, tone: "bg-[#F4F4F5] text-black" },
  system: { label: "System", icon: Bell, tone: "bg-black text-white" },
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, setNotifications } = useTenantStore();
  const [filter, setFilter] = useState<FilterKey>("all");

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
    toast.success("All notifications marked as read");
  };

  const openNotification = (notification: TenantNotification) => {
    markRead(notification.id);
    if (notification.href) {
      navigate({ to: notification.href });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold leading-none tracking-tight text-black sm:text-title">
          Notifications
        </h1>
        <p className="mt-1 text-[12px] text-black/55">
          {unreadCount > 0
            ? `${unreadCount} unread · fee reminders, admissions, and staff updates`
            : "You're all caught up"}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex shrink-0 rounded-full border border-[#E5E5E5] bg-white p-1">
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
                  active ? "bg-[#C7F33C] text-black" : "text-black/55 hover:bg-black/5",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-4 text-[12.5px] font-semibold text-black transition-colors hover:border-black/20 hover:bg-[#F4F4F5] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Mark all read
        </button>
      </div>

      <OrganicCard tone="white" cornerSide="tr" padded className="overflow-hidden">
        {visible.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#F4F4F5] text-black/40">
              <Bell className="h-5 w-5" />
            </div>
            <div className="mt-3 text-[14px] font-semibold text-black">No notifications</div>
            <p className="mt-1 text-[12px] text-black/55">
              {filter === "unread"
                ? "Unread alerts will appear here"
                : "New alerts will show up in this feed"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0F0F0]">
            {visible.map((notification) => {
              const meta = categoryMeta[notification.category];
              const Icon = meta.icon;
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openNotification(notification)}
                  className={cn(
                    "flex w-full items-start gap-3 px-1 py-3.5 text-left transition-colors first:pt-0 last:pb-0 hover:bg-[#FAFAFA] sm:gap-4 sm:px-2",
                    !notification.read && "bg-[#FCFEF5]/80",
                  )}
                >
                  <div
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-2xl",
                      meta.tone,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13.5px] font-semibold text-black">
                            {notification.title}
                          </span>
                          {!notification.read && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#C7F33C]" />
                          )}
                        </div>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-black/60">
                          {notification.body}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-[10.5px] text-black/45">
                        {notification.timeLabel}
                      </span>
                    </div>
                    <span className="mt-2 inline-flex rounded-full bg-[#F4F4F5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-black/50">
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
