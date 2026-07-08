import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Bell,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  MobileTabBar,
  mobileMainPadding,
  type MobileTabItem,
} from "@/components/layout/MobileTabBar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { TenantStoreProvider, useTenantStore } from "@/lib/tenant-store";

export const Route = createFileRoute("/tenant")({
  component: TenantLayout,
});

type NavEntry = {
  to: string;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
};

const NAV: NavEntry[] = [
  { to: "/tenant/dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { to: "/tenant/students", label: "Students", shortLabel: "Students", icon: Users },
  { to: "/tenant/staff", label: "Staff", shortLabel: "Staff", icon: UserCog },
  { to: "/tenant/finance", label: "Finance", shortLabel: "Finance", icon: Wallet },
  { to: "/tenant/settings", label: "Settings", shortLabel: "Settings", icon: Settings },
];

const MOBILE_TABS: MobileTabItem[] = NAV.map((n) => ({
  to: n.to,
  label: n.shortLabel,
  icon: n.icon,
  match: (pathname) => pathname.startsWith(n.to),
}));

function TenantLayout() {
  const navigate = useNavigate();
  const { session, hydrated } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (!session || session.role !== "school_admin") {
      navigate({ to: "/login", replace: true });
    }
  }, [hydrated, session, navigate]);

  if (!hydrated || !session || session.role !== "school_admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAEAEA]">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-black/45">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-black/45" />
          Validating tenant session…
        </div>
      </div>
    );
  }

  return (
    <TenantStoreProvider>
      <div className="min-h-dvh bg-[#EAEAEA] text-black">
        <TenantMobileHeader />
        <div className="flex min-h-[calc(100dvh-5rem)] items-stretch gap-4 px-3 py-4 sm:px-4 lg:min-h-[calc(100dvh-3rem)] lg:gap-6 lg:p-6">
          <TenantSidebar />
          <main className={`mobile-app-rail min-w-0 flex-1 ${mobileMainPadding}`}>
            <Outlet />
          </main>
        </div>
        <TenantMobileNav />
      </div>
    </TenantStoreProvider>
  );
}

function TenantMobileHeader() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { notifications } = useTenantStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onNotifications = pathname.startsWith("/tenant/notifications");
  const active = onNotifications
    ? { label: "Notifications" }
    : NAV.find((n) => pathname.startsWith(n.to));
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-[#EAEAEA]/92 px-3 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-xl sm:px-4 lg:hidden">
      <div className="mobile-app-rail flex items-center gap-2.5 rounded-[1.75rem] border border-white/70 bg-white/88 px-3 py-2.5 shadow-[0_14px_44px_-32px_rgba(0,0,0,0.45)]">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-black text-xs font-bold text-white">
          SH
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold text-black">
            {session?.tenantName ?? "Silver Hills Global"}
          </div>
          <div className="truncate text-[10px] uppercase tracking-wider text-black/45">
            {active?.label ?? "Tenant Workspace"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: "/tenant/notifications" })}
          aria-label="Notifications"
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#E5E5E5] bg-[#F4F4F5] text-black/60 transition-colors hover:bg-black hover:text-white"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-[#F4F4F5] bg-[#C7F33C]" />
          )}
        </button>
      </div>
    </header>
  );
}

function TenantMobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return <MobileTabBar items={MOBILE_TABS} pathname={pathname} />;
}

function TenantSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const { notifications } = useTenantStore();
  const [pendingLogout, setPendingLogout] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const confirmLogout = () => {
    const name = session?.displayName ?? "Tenant Admin";
    logout();
    toast.success("Signed out · session cleared", { description: `Goodbye, ${name}` });
    setPendingLogout(false);
    navigate({ to: "/login", replace: true });
  };

  return (
    <>
      <aside className="sticky top-6 hidden h-[calc(100dvh-5rem)] w-64 shrink-0 flex-col overflow-hidden rounded-[2rem] border border-[#E5E5E5] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-32px_rgba(0,0,0,0.18)] lg:flex lg:h-[calc(100dvh-3rem)]">
      <div className="mb-5 flex items-center gap-2.5 px-2 pt-1">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-black text-sm font-bold text-white">
          SH
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-[14px] font-semibold text-black">
            {session?.tenantName ?? "Silver Hills Global"}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-black/45">Tenant Workspace</div>
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: "/tenant/notifications" })}
          aria-label="Notifications"
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#E5E5E5] bg-[#F4F4F5] text-black/60 transition-colors hover:bg-black hover:text-white"
        >
          <Bell className="h-3.5 w-3.5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-[#F4F4F5] bg-[#C7F33C]" />
          )}
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-1">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13.5px] font-medium transition-colors ${
                active
                  ? "bg-[#C7F33C] text-black shadow-sm"
                  : "text-black/70 hover:bg-[#F4F4F5] hover:text-black"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{n.label}</span>
              {active && <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2 rounded-2xl bg-[#F4F4F5] p-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold text-black">
            {session?.displayName ?? "Tenant Admin"}
          </div>
          <div className="mt-0.5 truncate font-mono text-[10px] text-black/55">
            {session?.email ?? "silverhills@tenant.com"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPendingLogout(true)}
          aria-label="Logout"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-black/65 transition-colors hover:bg-[#FEE2E2] hover:text-[#B91C1C]"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>

      <Dialog
        open={pendingLogout}
        onOpenChange={(next) => {
          if (!next) setPendingLogout(false);
        }}
      >
        <DialogContent className="max-w-sm rounded-[1.5rem] border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">Sign Out</DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60">
              Are you sure you want to sign out of{" "}
              {session?.tenantName ?? "Silver Hills Global"}? You will need to log in again to
              access this workspace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingLogout(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmLogout}
              className="rounded-full bg-[#B91C1C] text-white hover:bg-[#991B1B]"
            >
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
