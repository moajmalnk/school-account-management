import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LayoutDashboard, Settings, UserCog, Users, Wallet } from "lucide-react";
import { useEffect } from "react";

import {
  TenantDesktopTopBar,
  TenantMacDock,
} from "@/components/layout/TenantGlassShell";
import {
  MobileTabBar,
  mobileMainPadding,
  type MobileTabItem,
} from "@/components/layout/MobileTabBar";
import { useAuth } from "@/lib/auth";
import { TenantStoreProvider, schoolInitials, useTenantStore } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

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
      <TenantShell />
    </TenantStoreProvider>
  );
}

function TenantShell() {
  const { themeSettings } = useTenantStore();
  const placement = themeSettings.navPlacement ?? "Left";
  const isVertical = placement === "Left" || placement === "Right";
  const isBottom = placement === "Bottom";
  const isTop = placement === "Top";

  return (
    <div className="tenant-canvas min-h-dvh text-slate-900">
      <TenantMobileHeader />
      <div
        className={cn(
          "flex min-h-dvh w-full gap-4 px-4 py-4 md:gap-5 md:px-5 md:py-5",
          isVertical && placement === "Left" && "flex-row",
          isVertical && placement === "Right" && "flex-row-reverse",
          (isTop || isBottom) && "flex-col",
          isBottom && "md:pb-28",
        )}
      >
        {isTop && <TenantMacDock placement={placement} className="order-first" />}
        {isVertical && <TenantMacDock placement={placement} />}

        <div className="relative z-0 flex min-w-0 flex-1 flex-col">
          <TenantDesktopTopBar />
          <main
            className={cn(
              "min-w-0 flex-1",
              mobileMainPadding,
              isBottom ? "md:pb-8" : "md:pb-6",
            )}
          >
            <Outlet />
          </main>
        </div>
      </div>

      {isBottom && (
        <TenantMacDock
          placement={placement}
          className="pointer-events-none fixed inset-x-0 bottom-4 z-50 hidden justify-center md:flex [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_div]:pointer-events-auto"
        />
      )}

      <TenantMobileNav />
    </div>
  );
}

function TenantMobileHeader() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { notifications, schoolDetails } = useTenantStore();
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
  const tenantName = schoolDetails.name || session?.tenantName || "Silver Hills Global";
  const tenantLabel = tenantName.toUpperCase();
  const sectionLabel = onNotifications ? "NOTIFICATIONS" : activeKey ? NAV_LABELS[activeKey] : "DASHBOARD";
  const logoUrl = schoolDetails.logoUrl;
  const initials = schoolInitials(tenantName);

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-b from-white/80 to-transparent px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-xl md:hidden">
      <div className="flex w-full items-center gap-3">
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl text-[11px] font-bold text-white",
            !logoUrl && "bg-gradient-to-br from-[#2563EB] to-[#4C69A4]",
          )}
        >
          {logoUrl ? (
            <img src={logoUrl} alt={tenantName} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
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
