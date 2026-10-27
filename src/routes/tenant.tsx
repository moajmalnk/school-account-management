import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  Home,
  LifeBuoy,
  MoreHorizontal,
  Moon,
  RefreshCw,
  Search,
  Settings,
  Sun,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AcademicYearBooksFade,
  AcademicYearSwitcher,
  BranchSwitcher,
  ImpersonationChip,
  TenantDesktopTopBar,
  TenantMacDock,
  useWorkspaceSubViewBack,
} from "@/components/layout/TenantGlassShell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SchoolLogo } from "@/components/ui/school-logo";
import { hardRefreshApp } from "@/lib/app-version";
import {
  SettingsUnsavedProvider,
  useTenantNavigationGuard,
} from "@/components/school/settings-unsaved-guard";
import {
  openTenantGlobalSearch,
  TenantGlobalSearch,
  TenantGlobalSearchTrigger,
} from "@/components/school/TenantGlobalSearch";
import { WorkspaceOpeningScreen } from "@/components/school/TenantDirectorySkeleton";
import { FeezoAssistant } from "@/components/ai/FeezoAssistant";
import {
  MobileTabBar,
  mobileMainPadding,
  type MobileTabItem,
} from "@/components/layout/MobileTabBar";
import {
  useAuth,
  isStaffSelfPreviewSession,
  isTenantWorkspaceSession,
  sessionAllowedBranchIds,
  sessionCanAccessSettings,
  sessionHasAnyFinance,
  sessionHasPermission,
  sessionStaffClassScopeId,
} from "@/lib/auth";
import { apiMe } from "@/lib/api/auth";
import { apiFetchDashboardSummary } from "@/lib/api/dashboard";
import { resolveMediaUrl } from "@/lib/media";
import {
  normalizePlanFlags,
  planAllowsGlobalSearch,
  planAllowsStudentAttendance,
} from "@/lib/permissions";
import { TenantStoreProvider, schoolInitials, useTenantStore } from "@/lib/tenant-store";
import { cn, glassInsetClass } from "@/lib/utils";

export const Route = createFileRoute("/tenant")({
  component: TenantLayout,
  pendingComponent: WorkspaceOpeningScreen,
});

const MOBILE_TABS: MobileTabItem[] = [
  {
    to: "/tenant/dashboard",
    label: "Home",
    icon: Home,
    match: (p) => p.startsWith("/tenant/dashboard"),
  },
  {
    to: "/tenant/students",
    label: "Students",
    icon: Users,
    match: (p) => p.startsWith("/tenant/students"),
  },
  {
    to: "/tenant/attendance",
    label: "Attendance",
    icon: CalendarDays,
    match: (p) => p.startsWith("/tenant/attendance"),
  },
  {
    to: "/tenant/staff",
    label: "Staff",
    icon: UserCog,
    match: (p) => p.startsWith("/tenant/staff"),
  },
  {
    to: "/tenant/finance",
    label: "Finance",
    icon: Wallet,
    match: (p) => p.startsWith("/tenant/finance"),
  },
  {
    to: "/tenant/settings",
    label: "Settings",
    icon: Settings,
    match: (p) => p.startsWith("/tenant/settings"),
  },
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
    <TenantStoreProvider tenantId={session.tenantId} tenantName={session.tenantName}>
      <SettingsUnsavedProvider>
        <TenantShell />
      </SettingsUnsavedProvider>
    </TenantStoreProvider>
  );
}

function TenantShell() {
  const { session, updateSession } = useAuth();
  const { themeSettings, hydrated, branchSyncing, activeBranchId, branches, openBranch } =
    useTenantStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDashboardRoute =
    pathname === "/tenant" ||
    pathname === "/tenant/" ||
    pathname.startsWith("/tenant/dashboard");
  const [dashboardSummaryReady, setDashboardSummaryReady] = useState(false);
  const placement = themeSettings.navPlacement ?? "Left";
  const isVertical = placement === "Left" || placement === "Right";
  const isBottom = placement === "Bottom";
  const isTop = placement === "Top";

  // Warm the heavy workspace chunk while chrome paints — avoids a blank main pane.
  useEffect(() => {
    void import("@/components/school/SchoolAdminWorkspace");
  }, []);

  // Unblock Home as soon as lightweight COUNT/SUM summary returns.
  useEffect(() => {
    if (hydrated || !isDashboardRoute) return;
    let cancelled = false;
    void apiFetchDashboardSummary().then((data) => {
      if (!cancelled && data) setDashboardSummaryReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, isDashboardRoute]);

  // Refresh subscription plan flags so Super Admin Plan toggles apply without re-login.
  useEffect(() => {
    if (session?.impersonated) return;
    let cancelled = false;
    void (async () => {
      try {
        const me = await apiMe();
        if (cancelled) return;
        updateSession({
          ...(me.planFlags
            ? {
                tier: me.tier,
                planName: me.planName,
                planFlags: normalizePlanFlags(me.planFlags),
              }
            : {}),
          branchIds: Array.isArray(me.branchIds)
            ? me.branchIds.filter((id): id is string => typeof id === "string" && id.trim() !== "")
            : [],
        });
      } catch {
        // 401 is handled globally (logout). Other errors keep cached flags.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.impersonated, updateSession]);

  // If this login is limited to specific campuses, leave any campus they cannot open.
  useEffect(() => {
    if (!hydrated || !session) return;
    const allowed = sessionAllowedBranchIds(session);
    if (!allowed || allowed.length === 0) return;
    if (allowed.includes(activeBranchId)) return;
    const next = branches.find((b) => allowed.includes(b.id) && b.isActive !== false);
    if (next) void openBranch(next.id);
  }, [hydrated, session, activeBranchId, branches, openBranch]);

  return (
    <div className="tenant-canvas flex min-h-dvh max-w-[100vw] flex-col overflow-x-clip text-slate-900 dark:text-zinc-100">
      <TenantMobileHeader />
      <div
        className={cn(
          "flex min-h-0 w-full min-w-0 max-w-full flex-1 gap-3 overflow-x-clip px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 md:gap-5 md:px-5 md:py-5",
          isVertical && placement === "Left" && "flex-row",
          isVertical && placement === "Right" && "flex-row-reverse",
          (isTop || isBottom) && "flex-col",
          isBottom && "md:pb-28",
        )}
      >
        {isTop && <TenantMacDock placement={placement} className="order-first" />}
        {isVertical && <TenantMacDock placement={placement} />}

        <div className="relative z-0 flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-x-clip">
          <TenantDesktopTopBar />
          {/* Thin progress while campus sync runs with content already visible */}
          {(branchSyncing || !hydrated) && (
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-teal-900/5 dark:bg-white/5"
              aria-hidden
            >
              <div className="h-full w-1/3 animate-[workspace-boot-bar_1.1s_ease-in-out_infinite] rounded-full bg-[#0F766E] dark:bg-[#2DD4BF]" />
            </div>
          )}
          <main
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col",
              mobileMainPadding,
              isBottom ? "md:pb-8" : "md:pb-6",
            )}
          >
            <AcademicYearBooksFade>
              {!hydrated && !(isDashboardRoute && dashboardSummaryReady) ? (
                <WorkspaceOpeningScreen
                  label="Opening workspace"
                  detail="Preparing campus data for this school…"
                />
              ) : (
                <Outlet />
              )}
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
      {/* Single dialog host — desktop bar + mobile icon open via event / ⌘K */}
      <TenantGlobalSearch trigger="none" />
      <FeezoAssistant />
    </div>
  );
}

function TenantMobileHeader() {
  const { session } = useAuth();
  const { guardedNavigate, tryNavigate } = useTenantNavigationGuard();
  const { notifications, schoolDetails, themeSettings, setThemeSettings } = useTenantStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { showBack, goBack, backLabel } = useWorkspaceSubViewBack();
  const onNotifications = pathname.startsWith("/tenant/notifications");
  const staffNavHome =
    Boolean(sessionStaffClassScopeId(session)) || isStaffSelfPreviewSession(session);
  const NAV_LABELS: Record<string, string> = {
    "/tenant/dashboard": "Home",
    "/tenant/students": "Students",
    "/tenant/parents": "Parents",
    "/tenant/attendance": "Attendance",
    "/tenant/academics": "Academics",
    "/tenant/staff": staffNavHome ? "My Profile" : "Staff",
    "/tenant/finance": "Finance",
    "/tenant/support": "Support",
    "/tenant/settings": "Settings",
  };
  const activeKey = Object.keys(NAV_LABELS).find((k) => pathname.startsWith(k));
  const unreadCount = notifications.filter((n) => !n.read).length;
  const tenantName = schoolDetails.name || session?.tenantName || "Silver Hills Global";
  const sectionLabel = onNotifications
    ? "Notifications"
    : activeKey
      ? (NAV_LABELS[activeKey] ?? "Home")
      : "Home";
  const logoUrl = resolveMediaUrl(schoolDetails.logoUrl);
  const initials = schoolInitials(tenantName);
  const isDark = themeSettings.mode === "Dark";
  const iconBtnClass =
    "grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/80 bg-white/70 text-slate-600 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-300";

  return (
    <header
      data-tenant-mobile-header
      className="sticky top-0 z-30 max-w-[100vw] overflow-x-clip bg-gradient-to-b from-white/80 to-transparent px-2.5 pb-2 pt-[calc(0.65rem+env(safe-area-inset-top))] backdrop-blur-xl dark:from-[#0a0a0a]/95 dark:via-[#0a0a0a]/65 dark:to-transparent sm:px-3 sm:pb-2.5 md:hidden"
    >
      {/* Fixed icon row — never wraps; campus/year use compact icons */}
      <div className="flex w-full min-w-0 max-w-full items-center gap-1">
        {showBack ? (
          <button
            type="button"
            onClick={() => {
              if (tryNavigate) tryNavigate(goBack);
              else goBack();
            }}
            aria-label={backLabel}
            className={cn(
              glassInsetClass,
              "grid h-8 w-8 shrink-0 place-items-center text-slate-700 transition-colors hover:text-[#0F766E] dark:text-zinc-200 dark:hover:text-[#2DD4BF]",
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : (
          <div
            className={cn(
              "relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-xl text-[10px] font-bold text-white",
              !logoUrl && "bg-gradient-to-br from-[#0F766E] to-[#115E59]",
            )}
            title={tenantName}
            aria-label={`${tenantName} · ${sectionLabel}`}
          >
            {logoUrl ? <SchoolLogo src={logoUrl} className="absolute inset-0" /> : initials}
          </div>
        )}

        <div className="min-w-0 flex-1" aria-hidden />

        <div className="flex shrink-0 items-center gap-1">
          <ImpersonationChip compact />
          <BranchSwitcher iconOnly />
          <AcademicYearSwitcher iconOnly />
          <TenantGlobalSearchTrigger variant="icon" className={iconBtnClass} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More actions"
                className={cn(iconBtnClass, "relative")}
              >
                <MoreHorizontal className="h-4 w-4" />
                {unreadCount > 0 ? (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full border-2 border-white bg-[#0F766E] dark:border-zinc-900" />
                ) : null}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              collisionPadding={12}
              className="z-[250] min-w-[12rem] rounded-xl border-white/60 bg-white/95 p-1 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900"
            >
              {planAllowsGlobalSearch(session?.planFlags) ? (
                <DropdownMenuItem
                  className="cursor-pointer gap-2 rounded-lg text-[13px]"
                  onSelect={() => openTenantGlobalSearch()}
                >
                  <Search className="h-3.5 w-3.5" />
                  Search workspace
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-[13px]"
                onSelect={() => guardedNavigate("/tenant/notifications")}
              >
                <Bell className="h-3.5 w-3.5" />
                Notifications
                {unreadCount > 0 ? (
                  <span className="ml-auto rounded-full bg-[#0F766E] px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-[13px]"
                onSelect={() =>
                  setThemeSettings((prev) => ({
                    ...prev,
                    mode: prev.mode === "Dark" ? "Light" : "Dark",
                  }))
                }
              >
                {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {isDark ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-[13px]"
                onSelect={() => {
                  toast.message("Hard refresh", {
                    description: "Clearing cache and reloading latest data…",
                  });
                  void hardRefreshApp().catch(() =>
                    toast.error("Could not refresh", { description: "Try again in a moment." }),
                  );
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Hard refresh
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-lg text-[13px]"
                onSelect={() => guardedNavigate("/tenant/support")}
              >
                <LifeBuoy className="h-3.5 w-3.5" />
                Help & support
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function TenantMobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session } = useAuth();
  const staffNavHome =
    Boolean(sessionStaffClassScopeId(session)) || isStaffSelfPreviewSession(session);
  const items = MOBILE_TABS.filter((tab) => {
    if (tab.to.startsWith("/tenant/dashboard")) return sessionHasPermission(session, "dashboard");
    if (tab.to.startsWith("/tenant/students")) return sessionHasPermission(session, "students");
    if (tab.to.startsWith("/tenant/attendance")) {
      return (
        sessionHasPermission(session, "students") &&
        planAllowsStudentAttendance(session?.planFlags)
      );
    }
    if (tab.to.startsWith("/tenant/staff")) return sessionHasPermission(session, "staff");
    if (tab.to.startsWith("/tenant/finance")) return sessionHasAnyFinance(session);
    if (tab.to.startsWith("/tenant/settings")) return sessionCanAccessSettings(session);
    return true;
  }).map((tab) =>
    staffNavHome && tab.to === "/tenant/staff" ? { ...tab, label: "My Profile" } : tab,
  );
  return <MobileTabBar items={items} pathname={pathname} className="md:hidden" />;
}
