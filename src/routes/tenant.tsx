import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronLeft, LayoutDashboard, Settings, UserCog, Users, Wallet } from "lucide-react";
import { useEffect } from "react";

import {
  AcademicYearBooksFade,
  BranchSwitcher,
  TenantDesktopTopBar,
  TenantMacDock,
  ThemeModeToggle,
  useWorkspaceSubViewBack,
} from "@/components/layout/TenantGlassShell";
import {
  MobileTabBar,
  mobileMainPadding,
  type MobileTabItem,
} from "@/components/layout/MobileTabBar";
import {
  useAuth,
  endImpersonation,
  isTenantWorkspaceSession,
  sessionCanAccessSettings,
  sessionHasAnyFinance,
  sessionHasPermission,
} from "@/lib/auth";
import { apiMe } from "@/lib/api/auth";
import { resolveMediaUrl } from "@/lib/media";
import { normalizePlanFlags } from "@/lib/permissions";
import { TenantStoreProvider, schoolInitials, useTenantStore } from "@/lib/tenant-store";
import { cn, glassInsetClass } from "@/lib/utils";
import { KeyRound, X } from "lucide-react";

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
    if (!isTenantWorkspaceSession(session)) {
      navigate({ to: "/login", replace: true });
    }
  }, [hydrated, session, navigate]);

  if (!hydrated || !isTenantWorkspaceSession(session)) {
    return (
      <div className="tenant-canvas flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-slate-500">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#0F766E]/60" />
          Validating tenant session…
        </div>
      </div>
    );
  }

  return (
    <TenantStoreProvider
      tenantId={session.tenantId}
      tenantName={session.tenantName}
    >
      <TenantShell />
    </TenantStoreProvider>
  );
}

function TenantShell() {
  const { session, updateSession } = useAuth();
  const { themeSettings } = useTenantStore();
  const placement = themeSettings.navPlacement ?? "Left";
  const isVertical = placement === "Left" || placement === "Right";
  const isBottom = placement === "Bottom";
  const isTop = placement === "Top";

  // Refresh subscription plan flags so Super Admin Plan toggles apply without re-login.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const me = await apiMe();
        if (cancelled || !me.planFlags) return;
        updateSession({
          tier: me.tier,
          planName: me.planName,
          planFlags: normalizePlanFlags(me.planFlags),
        });
      } catch {
        // 401 is handled globally (logout). Other errors keep cached flags.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [updateSession]);

  return (
    <div className="tenant-canvas flex min-h-dvh flex-col text-slate-900 dark:text-zinc-100">
      <ImpersonationBanner />
      <TenantMobileHeader />
      <div
        className={cn(
          "flex min-h-0 w-full flex-1 gap-4 px-4 py-4 md:gap-5 md:px-5 md:py-5",
          isVertical && placement === "Left" && "flex-row",
          isVertical && placement === "Right" && "flex-row-reverse",
          (isTop || isBottom) && "flex-col",
          isBottom && "md:pb-28",
        )}
      >
        {isTop && <TenantMacDock placement={placement} className="order-first" />}
        {isVertical && <TenantMacDock placement={placement} />}

        <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col">
          <TenantDesktopTopBar />
          <main
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col",
              mobileMainPadding,
              isBottom ? "md:pb-8" : "md:pb-6",
            )}
          >
            <AcademicYearBooksFade>
              <Outlet />
            </AcademicYearBooksFade>
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

function ImpersonationBanner() {
  const { session } = useAuth();
  const { schoolDetails } = useTenantStore();
  if (!session?.impersonated) return null;

  const workspace =
    schoolDetails.name || session.tenantName || session.displayName || "tenant";
  const fromSuper = session.impersonationSource === "super_admin";
  const ticket = session.impersonationTicket;

  return (
    <div
      role="status"
      className="sticky top-0 z-[60] overflow-hidden border-b border-black/20 text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)]"
      style={{
        background:
          "repeating-linear-gradient(-45deg, #0F766E, #0F766E 12px, #0d6a63 12px, #0d6a63 24px)",
      }}
    >
      <div className="relative flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-[#CCFBF1]" />
        <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black/25 ring-1 ring-white/25 sm:mt-0">
            <KeyRound className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                Impersonate mode
              </span>
              {ticket ? (
                <span className="font-mono text-[10px] text-white/80">{ticket}</span>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-[12.5px] font-medium leading-snug">
              Viewing <strong>{workspace}</strong>
              <span className="text-white/80">
                {" "}
                as {session.displayName}
                {session.email ? ` · ${session.email}` : ""}
              </span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const redirect = endImpersonation();
            window.location.replace(redirect);
          }}
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/40 bg-white px-4 py-1.5 text-[12px] font-semibold text-[#0F766E] shadow-sm transition hover:bg-[#CCFBF1]"
        >
          <X className="h-3.5 w-3.5" />
          Exit impersonation
        </button>
      </div>
    </div>
  );
}

function TenantMobileHeader() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { notifications, schoolDetails, activeBranch, branches } = useTenantStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { showBack, goBack, backLabel } = useWorkspaceSubViewBack();
  const onNotifications = pathname.startsWith("/tenant/notifications");
  const NAV_LABELS: Record<string, string> = {
    "/tenant/dashboard": "DASHBOARD",
    "/tenant/students": "STUDENTS",
    "/tenant/staff": "STAFF",
    "/tenant/finance": "FINANCE",
    "/tenant/billing": "SUBSCRIPTION",
    "/tenant/settings": "SETTINGS",
  };
  const activeKey = Object.keys(NAV_LABELS).find((k) => pathname.startsWith(k));
  const unreadCount = notifications.filter((n) => !n.read).length;
  const tenantName = schoolDetails.name || session?.tenantName || "Silver Hills Global";
  const tenantLabel = tenantName.toUpperCase();
  const sectionLabel = onNotifications ? "NOTIFICATIONS" : activeKey ? NAV_LABELS[activeKey] : "DASHBOARD";
  const logoUrl = resolveMediaUrl(schoolDetails.logoUrl);
  const initials = schoolInitials(tenantName);

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-b from-white/80 to-transparent px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-xl dark:from-[#0a0a0a]/95 dark:via-[#0a0a0a]/65 dark:to-transparent md:hidden">
      <div className="flex w-full items-center gap-3">
        {showBack ? (
          <button
            type="button"
            onClick={goBack}
            aria-label={backLabel}
            className={cn(
              glassInsetClass,
              "grid h-10 w-10 shrink-0 place-items-center text-slate-700 transition-colors hover:text-[#0F766E] dark:text-zinc-200 dark:hover:text-[#2DD4BF]",
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : (
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl text-[11px] font-bold text-white",
              !logoUrl && "bg-gradient-to-br from-[#0F766E] to-[#115E59]",
            )}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={tenantName} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-bold uppercase leading-tight tracking-[0.04em] text-slate-900 dark:text-zinc-100">
            {tenantLabel} - {sectionLabel}
          </div>
          {branches.length > 1 && activeBranch?.name ? (
            <div className="truncate text-[10px] font-medium text-slate-500 dark:text-zinc-400">
              {activeBranch.name}
            </div>
          ) : null}
        </div>
        <BranchSwitcher compact />
        <ThemeModeToggle className="rounded-full border border-white/80 bg-white/70 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-200" />
        <button
          type="button"
          onClick={() => navigate({ to: "/tenant/notifications" })}
          aria-label="Notifications"
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/80 bg-white/70 text-slate-600 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-300"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-[#0F766E] dark:border-zinc-900" />
          )}
        </button>
      </div>
    </header>
  );
}

function TenantMobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session } = useAuth();
  const items = MOBILE_TABS.filter((tab) => {
    if (tab.to.startsWith("/tenant/dashboard")) return sessionHasPermission(session, "dashboard");
    if (tab.to.startsWith("/tenant/students")) return sessionHasPermission(session, "students");
    if (tab.to.startsWith("/tenant/staff")) return sessionHasPermission(session, "staff");
    if (tab.to.startsWith("/tenant/finance")) return sessionHasAnyFinance(session);
    if (tab.to.startsWith("/tenant/settings")) return sessionCanAccessSettings(session);
    return true;
  });
  return <MobileTabBar items={items} pathname={pathname} className="md:hidden" />;
}
