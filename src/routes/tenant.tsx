import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useEffect } from "react";

import {
  TenantDesktopTopBar,
  TenantGlassSidebar,
} from "@/components/layout/TenantGlassShell";
import {
  MobileTabBar,
  mobileMainPadding,
  type MobileTabItem,
} from "@/components/layout/MobileTabBar";
import { LayoutDashboard, Settings, UserCog, Users, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { TenantStoreProvider, useTenantStore } from "@/lib/tenant-store";

export const Route = createFileRoute("/tenant")({
  component: TenantLayout,
});

const MOBILE_TABS: MobileTabItem[] = [
  { to: "/tenant/dashboard", label: "Home", icon: LayoutDashboard, match: (p) => p.startsWith("/tenant/dashboard") },
  { to: "/tenant/students", label: "Students", icon: Users, match: (p) => p.startsWith("/tenant/students") },
  { to: "/tenant/staff", label: "Staff", icon: UserCog, match: (p) => p.startsWith("/tenant/staff") },
  { to: "/tenant/finance", label: "Finance", icon: Wallet, match: (p) => p.startsWith("/tenant/finance") },
  { to: "/tenant/settings", label: "Settings", icon: Settings, match: (p) => p.startsWith("/tenant/settings") },
];

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
      <div className="tenant-canvas flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-slate-500">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#2563EB]/60" />
          Validating tenant session…
        </div>
      </div>
    );
  }

  return (
    <TenantStoreProvider>
      <div className="tenant-canvas min-h-dvh text-slate-900">
        <TenantMobileHeader />
        <div className="mx-auto flex min-h-dvh max-w-[1600px] gap-4 px-4 py-4 md:gap-5 md:px-5 md:py-5">
          <TenantGlassSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TenantDesktopTopBar />
            <main className={`min-w-0 flex-1 ${mobileMainPadding} md:pb-6`}>
              <Outlet />
            </main>
          </div>
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
  const NAV_LABELS: Record<string, string> = {
    "/tenant/dashboard": "DASHBOARD",
    "/tenant/students": "STUDENTS",
    "/tenant/staff": "STAFF",
    "/tenant/finance": "FINANCE",
    "/tenant/settings": "SETTINGS",
  };
  const activeKey = Object.keys(NAV_LABELS).find((k) => pathname.startsWith(k));
  const unreadCount = notifications.filter((n) => !n.read).length;
  const tenantLabel = (session?.tenantName ?? "Silver Hills Global").toUpperCase();
  const sectionLabel = onNotifications ? "NOTIFICATIONS" : activeKey ? NAV_LABELS[activeKey] : "DASHBOARD";

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-b from-white/80 to-transparent px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-xl md:hidden">
      <div className="flex w-full items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#4C69A4] text-[11px] font-bold text-white">
          SH
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-bold uppercase leading-tight tracking-[0.04em] text-slate-900">
            {tenantLabel} - {sectionLabel}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: "/tenant/notifications" })}
          aria-label="Notifications"
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/80 bg-white/70 text-slate-600 shadow-sm backdrop-blur-md"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-[#2563EB]" />
          )}
        </button>
      </div>
    </header>
  );
}

function TenantMobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return <MobileTabBar items={MOBILE_TABS} pathname={pathname} className="md:hidden" />;
}
