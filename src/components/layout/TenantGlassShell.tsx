import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Crown,
  LayoutDashboard,
  Loader2,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Sun,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { FeezoBrand } from "@/components/brand/FeezoBrand";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FinancialYearFields, resolveFinancialYearInput } from "@/components/school/FinancialYearFields";
import { AddBranchDialog } from "@/components/school/AddBranchDialog";
import { FloatingDock, type FloatingDockItem } from "@/components/ui/floating-dock";
import {
  sessionCanAccessSettings,
  sessionHasAnyFinance,
  sessionHasPermission,
  useAuth,
} from "@/lib/auth";
import { defaultClosingMonthKey, suggestNextBooksMonthKey } from "@/lib/academic-year";
import {
  isMainCampusBranch,
  schoolInitials,
  useTenantStore,
  type ThemeSettings,
} from "@/lib/tenant-store";
import { planAllowsMultipleBranches } from "@/lib/permissions";
import { isFinanceTab } from "@/lib/finance-tabs";
import { resolveMediaUrl } from "@/lib/media";
import { cn, glassInsetClass, glassPanelClass } from "@/lib/utils";

/** Soft fade when academic year books or campus switch. */
export function AcademicYearBooksFade({ children }: { children: ReactNode }) {
  const { academicYear, activeBranchId, hydrated } = useTenantStore();
  const [visible, setVisible] = useState(true);
  const booksKey = `${academicYear}|${activeBranchId}`;
  const [displayKey, setDisplayKey] = useState(booksKey);
  const booksReady = useRef(false);

  useEffect(() => {
    // Skip the fade on first hydrate so seed→API year swaps don't blink the page.
    if (!hydrated) {
      setDisplayKey(booksKey);
      return;
    }
    if (!booksReady.current) {
      booksReady.current = true;
      setDisplayKey(booksKey);
      setVisible(true);
      return;
    }
    if (booksKey === displayKey) return;
    setVisible(false);
    const t = window.setTimeout(() => {
      setDisplayKey(booksKey);
      setVisible(true);
    }, 140);
    return () => window.clearTimeout(t);
  }, [booksKey, displayKey, hydrated]);

  return (
    <div
      key={displayKey || "books-loading"}
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col transition-opacity duration-200 ease-out",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {children}
    </div>
  );
}

export function BranchSwitcher({ compact = false }: { compact?: boolean }) {
  const { session } = useAuth();
  const { branches, activeBranchId, activeBranch, openBranch, hydrated, branchSyncing } =
    useTenantStore();
  const [addOpen, setAddOpen] = useState(false);
  const selectable = branches.filter((b) => b.isActive !== false);
  const canManage = sessionCanAccessSettings(session);
  const canAdd = canManage && planAllowsMultipleBranches(session?.planFlags);
  const label = activeBranch?.name ?? selectable[0]?.name ?? "Main Campus";

  if (!hydrated) {
    return (
      <Skeleton
        aria-label="Loading campus"
        className={cn(
          "h-9 w-[8.5rem] rounded-full bg-white/70 sm:w-[10rem]",
          compact && "h-8 w-[7.5rem]",
        )}
      />
    );
  }

  const requestAdd = () => {
    if (!canManage) {
      toast.error("You do not have permission to add a campus");
      return;
    }
    if (!canAdd) {
      toast.error("Multiple campuses are not included in this plan", {
        description: "Upgrade to Premium or Enterprise to add another branch",
      });
      return;
    }
    setAddOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={branchSyncing}>
          <button
            type="button"
            disabled={branchSyncing}
            aria-busy={branchSyncing}
            className={cn(
              "inline-flex max-w-[11rem] items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-2 text-[11px] font-semibold text-slate-800 shadow-sm backdrop-blur-md transition-colors hover:border-[#0F766E]/40 hover:text-[#0F766E] disabled:cursor-wait disabled:opacity-70 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:text-[#2DD4BF] sm:max-w-none sm:gap-1.5 sm:px-3.5 sm:text-[12px]",
              compact && "max-w-[9rem] px-2 py-1.5 text-[10px] sm:max-w-[11rem]",
            )}
          >
            {branchSyncing ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" strokeWidth={2.25} />
            ) : (
              <Building2 className="hidden h-3.5 w-3.5 shrink-0 sm:block" strokeWidth={2.25} />
            )}
            <span className="truncate">{label}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[13rem] rounded-lg border-white/60 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900"
        >
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-400">
            Branches
          </DropdownMenuLabel>
          {selectable.length === 0 ? (
            <div className="px-2 py-2 text-[12px] text-slate-400">No campuses yet</div>
          ) : (
            <DropdownMenuRadioGroup
              value={activeBranchId}
              onValueChange={(id) => {
                if (branchSyncing) return;
                void (async () => {
                  const stats = await openBranch(id);
                  const name = selectable.find((b) => b.id === id)?.name ?? "campus";
                  toast.success(`Opened ${name}`, {
                    description: `${stats.students} student${stats.students === 1 ? "" : "s"} · ${stats.receipts} receipt${stats.receipts === 1 ? "" : "s"}`,
                  });
                })();
              }}
            >
              {selectable.map((b) => (
                <DropdownMenuRadioItem key={b.id} value={b.id} className="rounded-md text-[13px]">
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">
                      {b.name}
                      {isMainCampusBranch(b, branches) ? (
                        <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Main
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      {b.code}
                    </span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          )}
          {canManage ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-md text-[13px]" onSelect={requestAdd}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add branch
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <AddBranchDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}

export function ThemeModeToggle({ className }: { className?: string }) {
  const { themeSettings, setThemeSettings } = useTenantStore();
  const isDark = themeSettings.mode === "Dark";

  return (
    <button
      type="button"
      onClick={() =>
        setThemeSettings((prev) => ({
          ...prev,
          mode: prev.mode === "Dark" ? "Light" : "Dark",
        }))
      }
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={cn(
        glassInsetClass,
        "grid h-10 w-10 place-items-center text-slate-600 transition-colors hover:text-[#0F766E] dark:text-zinc-300 dark:hover:text-[#2DD4BF]",
        className,
      )}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

export function useWorkspaceSubViewBack() {
  const navigate = useNavigate();
  const { pathname, search } = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      search: s.location.search as Record<string, unknown>,
    }),
  });

  const detailId = typeof search.id === "string" && search.id ? search.id : null;
  const financeTab = isFinanceTab(search.tab) ? search.tab : null;
  const onFinanceSubView = pathname.startsWith("/tenant/finance") && Boolean(financeTab);
  const onAdmitStudent = pathname.startsWith("/tenant/students/admit");
  const onStudentProfile = pathname === "/tenant/students" && Boolean(detailId);
  const onStaffDetail = pathname === "/tenant/staff" && Boolean(detailId);
  const showBack = onFinanceSubView || onAdmitStudent || onStudentProfile || onStaffDetail;

  const goBack = () => {
    if (onAdmitStudent || onStudentProfile) {
      navigate({ to: "/tenant/students", search: {}, replace: true });
      return;
    }
    if (onStaffDetail) {
      navigate({ to: "/tenant/staff", search: {}, replace: true });
      return;
    }
    navigate({ to: "/tenant/finance", search: {}, replace: true });
  };

  const backLabel = onStaffDetail
    ? "Back to staff directory"
    : onAdmitStudent || onStudentProfile
      ? "Back to students directory"
      : "Back to finance overview";

  return { showBack, goBack, backLabel };
}

type NavEntry = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const NAV: NavEntry[] = [
  { to: "/tenant/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tenant/students", label: "Students", icon: Users },
  { to: "/tenant/staff", label: "Staff", icon: UserCog },
  { to: "/tenant/finance", label: "Finance", icon: Wallet },
  { to: "/tenant/billing", label: "Subscription", icon: Crown },
  { to: "/tenant/settings", label: "Settings", icon: Settings },
];

function navAllowed(
  to: string,
  session: ReturnType<typeof useAuth>["session"],
): boolean {
  if (to.startsWith("/tenant/dashboard")) return sessionHasPermission(session, "dashboard");
  if (to.startsWith("/tenant/students")) return sessionHasPermission(session, "students");
  if (to.startsWith("/tenant/staff")) return sessionHasPermission(session, "staff");
  if (to.startsWith("/tenant/finance")) return sessionHasAnyFinance(session);
  if (to.startsWith("/tenant/billing")) return sessionCanAccessSettings(session);
  if (to.startsWith("/tenant/settings")) return sessionCanAccessSettings(session);
  return true;
}

const SIDEBAR_COLLAPSED_KEY = "tenant-sidebar-collapsed";

function dockScale(distance: number) {
  if (distance === 0) return 1.18;
  if (distance === 1) return 1.08;
  if (distance === 2) return 1.03;
  return 1;
}

export function TenantMacDock({
  placement: placementProp,
  className,
}: {
  placement?: ThemeSettings["navPlacement"];
  className?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session } = useAuth();
  const { themeSettings, schoolDetails, activeBranch, branches } = useTenantStore();
  const placement = placementProp ?? themeSettings.navPlacement ?? "Left";
  const tenantName = schoolDetails.name || session?.tenantName || "Silver Hills Global";
  const logoUrl = resolveMediaUrl(schoolDetails.logoUrl);
  const initials = useMemo(() => schoolInitials(tenantName), [tenantName]);

  const isVertical = placement === "Left" || placement === "Right";
  const [hovered, setHovered] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  };

  const showCollapse = isVertical;
  const expanded = isVertical && !collapsed;

  const visibleNav = useMemo(
    () => NAV.filter((item) => navAllowed(item.to, session)),
    [session],
  );

  const floatingItems = useMemo<FloatingDockItem[]>(
    () =>
      visibleNav.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.to);
        return {
          title: item.label,
          href: item.to,
          active,
          icon: (
            <Icon
              className={cn(
                "h-full w-full",
                active
                  ? "text-[#0F766E] dark:text-[#5EEAD4]"
                  : "text-slate-700 dark:text-zinc-300",
              )}
              strokeWidth={active ? 2.35 : 2}
            />
          ),
        };
      }),
    [pathname, visibleNav],
  );

  if (!isVertical) {
    return (
      <aside
        className={cn(
          "relative z-40 hidden w-full shrink-0 flex-row justify-center overflow-visible md:flex",
          className,
        )}
        aria-label="Primary navigation"
      >
        <FloatingDock
          desktopOnly
          items={floatingItems}
          desktopClassName="pointer-events-auto"
        />
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "relative z-40 hidden shrink-0 self-stretch overflow-visible transition-[width] duration-200 md:flex",
        "sticky top-4 max-h-[calc(100dvh-2rem)] flex-col",
        expanded
          ? "w-[220px] min-w-0 max-w-[220px] xl:w-[240px] xl:max-w-[240px]"
          : "w-[84px] min-w-0 max-w-[84px] items-center xl:w-[92px] xl:max-w-[92px]",
        className,
      )}
      onMouseLeave={() => setHovered(null)}
    >
      <div
        className={cn(
          glassPanelClass,
          "relative z-40 flex h-full min-h-[calc(100dvh-2rem)] w-full min-w-0 flex-col overflow-visible rounded-xl border border-white/70 bg-white/55 py-3 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.35)] backdrop-blur-2xl",
          expanded ? "items-stretch px-2.5 sm:px-3" : "items-center px-1.5",
        )}
      >
        <div
          className={cn(
            "mb-3 flex w-full min-w-0 shrink-0 flex-col items-center border-b border-slate-200/60 pb-3 dark:border-white/10",
            expanded ? "gap-1.5 px-0.5" : "",
          )}
        >
          <div
            className={cn(
              "grid shrink-0 place-items-center overflow-hidden rounded-xl font-bold text-white shadow-md shadow-teal-900/20",
              expanded
                ? "h-12 w-12 text-[12px] xl:h-14 xl:w-14"
                : "h-11 w-11 text-[11px] xl:h-12 xl:w-12",
              !logoUrl && "bg-gradient-to-br from-[#0F766E] to-[#115E59]",
            )}
            title={tenantName}
            aria-label={tenantName}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-full w-full bg-white object-contain p-0.5" />
            ) : (
              initials
            )}
          </div>
          {expanded && (
            <div className="w-full min-w-0 px-1 text-center leading-tight">
              <div
                className="line-clamp-2 break-words text-[12px] font-semibold text-slate-800 xl:text-[13px] dark:text-zinc-100"
                title={tenantName}
              >
                {tenantName}
              </div>
              <div className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-slate-400 xl:text-[10px] dark:text-zinc-500">
                {branches.length > 1 ? activeBranch?.name ?? "Campus" : "Tenant"}
              </div>
            </div>
          )}
        </div>

        <nav
          className={cn(
            "flex min-h-0 w-full flex-1 flex-col overflow-visible",
            expanded ? "gap-1.5 xl:gap-2" : "items-center gap-1",
          )}
          aria-label="Primary navigation"
        >
          {visibleNav.map((item, index) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.to);
            const distance = hovered === null ? 99 : Math.abs(hovered - index);
            const scale = expanded ? 1 : dockScale(distance);
            const tooltipSide =
              placement === "Left"
                ? "left-full top-1/2 ml-3 -translate-y-1/2"
                : "right-full top-1/2 mr-3 -translate-y-1/2";

            if (expanded) {
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors xl:gap-3.5 xl:px-3 xl:py-3",
                    active
                      ? "bg-[#0F766E]/12 text-[#0F172A] ring-1 ring-[#0F766E]/25 dark:bg-[#0F766E]/30 dark:text-[#99F6E4] dark:ring-[#2DD4BF]/35"
                      : "text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/70 dark:border-white/10 xl:h-11 xl:w-11",
                      active
                        ? "bg-white text-[#0F766E] dark:bg-[#0F766E] dark:text-white"
                        : "bg-white/70 text-slate-700 dark:bg-white/5 dark:text-zinc-300",
                    )}
                  >
                    <Icon
                      className="h-5 w-5 xl:h-6 xl:w-6"
                      strokeWidth={active ? 2.35 : 2}
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold xl:text-[14px]">
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                onMouseEnter={() => setHovered(index)}
                className={cn(
                  "group relative z-10 flex h-14 w-14 shrink-0 items-center justify-center xl:h-16 xl:w-16",
                  distance === 0 && "z-50",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none absolute z-[60] whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100",
                    tooltipSide,
                  )}
                >
                  {item.label}
                </span>
                <span
                  className="relative flex flex-col items-center justify-center transition-transform duration-150 ease-out"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                    zIndex: distance === 0 ? 20 : 10 - Math.min(distance, 5),
                  }}
                >
                  <span
                    className={cn(
                      "grid h-12 w-12 place-items-center rounded-xl border border-white/70 bg-gradient-to-br from-white/95 to-white/70 shadow-[0_6px_18px_-10px_rgba(15,23,42,0.45)] xl:h-14 xl:w-14",
                      active && "ring-2 ring-[#0F766E]/40",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6 xl:h-7 xl:w-7",
                        active ? "text-[#0F766E]" : "text-slate-700",
                      )}
                      strokeWidth={active ? 2.35 : 2}
                    />
                  </span>
                  <span
                    className={cn(
                      "mt-1 h-1 w-1 rounded-full bg-slate-800 transition-opacity",
                      active ? "opacity-100" : "opacity-0",
                    )}
                  />
                </span>
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            "mt-auto flex shrink-0 flex-col gap-1.5 border-t border-slate-200/60 pt-2 dark:border-white/10",
            expanded ? "items-stretch" : "items-center",
          )}
        >
          <div className={cn(expanded ? "mx-0.5 px-1.5 py-1.5" : "")}>
            <FeezoBrand compact={!expanded} />
          </div>

          {showCollapse && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleCollapsed();
              }}
              aria-pressed={collapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(
                "flex shrink-0 items-center justify-center gap-2 rounded-xl text-slate-500 transition-colors hover:bg-white/70 hover:text-[#0F766E] dark:hover:bg-white/5",
                expanded ? "mx-1 h-10 w-auto px-3" : "h-10 w-10",
              )}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4" />
                  <span className="text-[12px] font-semibold">Collapse</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

/** @deprecated Prefer TenantMacDock */
export function TenantGlassSidebar(props: { className?: string }) {
  return <TenantMacDock {...props} />;
}

export function TenantDesktopTopBar() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const {
    academicYear,
    academicYears,
    closedAcademicYears,
    openAcademicYear,
    addAcademicYear,
    notifications,
    schoolDetails,
    hydrated,
  } = useTenantStore();
  const { showBack, goBack, backLabel } = useWorkspaceSubViewBack();
  const [pendingLogout, setPendingLogout] = useState(false);
  const [addYearOpen, setAddYearOpen] = useState(false);
  const [addMonthKey, setAddMonthKey] = useState(() =>
    suggestNextBooksMonthKey(academicYear, academicYears),
  );
  const [addEndMonthKey, setAddEndMonthKey] = useState(() =>
    defaultClosingMonthKey(suggestNextBooksMonthKey(academicYear, academicYears)),
  );

  const resetYearDraft = () => {
    const next = suggestNextBooksMonthKey(academicYear, academicYears);
    setAddMonthKey(next);
    setAddEndMonthKey(defaultClosingMonthKey(next));
  };
  const unreadCount = notifications.filter((n) => !n.read).length;
  const tenantName = schoolDetails.name || session?.tenantName || "Silver Hills Global";
  const selectableYears = useMemo(
    () => academicYears.filter((y) => !closedAcademicYears.includes(y) || y === academicYear),
    [academicYear, academicYears, closedAcademicYears],
  );

  const confirmLogout = () => {
    const name = session?.displayName ?? "Tenant Admin";
    logout();
    toast.success("Signed out · session cleared", { description: `Goodbye, ${name}` });
    setPendingLogout(false);
    navigate({ to: "/login", replace: true });
  };

  const submitNewYear = (e: FormEvent) => {
    e.preventDefault();
    const label = resolveFinancialYearInput(addMonthKey, addEndMonthKey);
    if (!label) {
      toast.error("Choose start and closing months", {
        description: "Closing month must be on or after the start month",
      });
      return;
    }
    const added = addAcademicYear(label);
    if (!added) {
      toast.error(`${label} already exists`);
      return;
    }
    toast.success(`Opened books for ${label}`, {
      description: "Fee periods cloned from the previous year · ready to enroll students",
    });
    resetYearDraft();
    setAddYearOpen(false);
  };

  return (
    <>
      <header
        className={cn(
          glassPanelClass,
          "mb-5 hidden items-center justify-between gap-2 rounded-2xl px-3 py-3 md:flex md:gap-3 md:px-5 md:py-3.5",
        )}
      >
        <div className="flex min-w-0 flex-1 basis-0 items-center gap-2.5 sm:gap-3">
          {showBack && (
            <button
              type="button"
              onClick={goBack}
              aria-label={backLabel}
              className={cn(
                glassInsetClass,
                "inline-flex h-9 w-9 shrink-0 items-center justify-center text-slate-700 transition-colors hover:text-[#0F766E] dark:text-zinc-300 dark:hover:text-[#2DD4BF] sm:h-10 sm:w-auto sm:gap-1.5 sm:px-3",
              )}
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="hidden text-[13px] font-semibold sm:inline">Back</span>
            </button>
          )}
          <div className="min-w-0">
            <h1 className="line-clamp-2 text-[13px] font-bold uppercase tracking-wide text-slate-900 sm:text-[14px] xl:line-clamp-1 xl:text-[16px] dark:text-zinc-100">
              {tenantName}
            </h1>
            <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-zinc-400">Tenant administration workspace</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <BranchSwitcher />
          {!hydrated || !academicYear ? (
            <Skeleton
              aria-label="Loading academic year"
              className="h-9 w-[9.5rem] rounded-full bg-emerald-500/25 sm:w-[11rem]"
            />
          ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex max-w-[11rem] items-center gap-1 rounded-full bg-[#10B981] px-2.5 py-2 text-[11px] font-semibold text-white shadow-sm shadow-emerald-500/25 transition-opacity hover:opacity-90 sm:max-w-none sm:gap-1.5 sm:px-3.5 sm:text-[12px]"
              >
                <CheckCircle2 className="hidden h-3.5 w-3.5 shrink-0 sm:block" strokeWidth={2.5} />
                <span className="truncate">{academicYear} Active</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[11rem] rounded-lg border-white/60 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900"
            >
              <DropdownMenuRadioGroup
                value={academicYear}
                onValueChange={(y) => {
                  const stats = openAcademicYear(y);
                  toast.success(`Opened books for ${y}`, {
                    description: `${stats.receipts} receipt${stats.receipts === 1 ? "" : "s"} · ${stats.enrolled} student${stats.enrolled === 1 ? "" : "s"} enrolled`,
                  });
                }}
              >
                {selectableYears.map((y) => (
                  <DropdownMenuRadioItem key={y} value={y} className="rounded-md text-[13px]">
                    {y}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              {closedAcademicYears.filter((y) => y !== academicYear).length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-400">
                    Closed years
                  </DropdownMenuLabel>
                  {closedAcademicYears
                    .filter((y) => y !== academicYear)
                    .map((y) => (
                      <DropdownMenuItem
                        key={`closed-${y}`}
                        className="rounded-md text-[13px] text-slate-500"
                        onSelect={() => {
                          const stats = openAcademicYear(y);
                          toast.success(`Reopened books for ${y}`, {
                            description: `${stats.receipts} receipt${stats.receipts === 1 ? "" : "s"} · ${stats.enrolled} student${stats.enrolled === 1 ? "" : "s"} enrolled`,
                          });
                        }}
                      >
                        {y} · reopen
                      </DropdownMenuItem>
                    ))}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="rounded-md text-[13px]"
                onSelect={() => {
                  resetYearDraft();
                  setAddYearOpen(true);
                }}
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add academic year
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}

          <ThemeModeToggle />

          <button
            type="button"
            onClick={() => navigate({ to: "/tenant/settings" })}
            aria-label="Settings"
            className="glass-inset grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition-colors hover:text-[#0F766E] dark:text-zinc-300 dark:hover:text-[#2DD4BF]"
          >
            <Settings className="h-[18px] w-[18px]" />
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: "/tenant/notifications" })}
            aria-label="Notifications"
            className="glass-inset relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition-colors hover:text-[#0F766E]"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-[#0F766E]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setPendingLogout(true)}
            aria-label="Logout"
            className="glass-inset grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition-colors hover:text-[#EF4444]"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      <Dialog
        open={addYearOpen}
        onOpenChange={(open) => {
          setAddYearOpen(open);
          if (!open) resetYearDraft();
        }}
      >
        <DialogContent
          className="max-w-md rounded-xl border border-white/60 bg-white/90 p-6 backdrop-blur-xl"
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest("[data-radix-popper-content-wrapper]")) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest("[data-radix-popper-content-wrapper]")) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-slate-900">
              Add Academic Year
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-slate-500">
              Choose the first month and the last month of these books.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitNewYear} className="mt-4 space-y-4">
            <FinancialYearFields
              startMonthKey={addMonthKey}
              endMonthKey={addEndMonthKey}
              onStartMonthKeyChange={setAddMonthKey}
              onEndMonthKeyChange={setAddEndMonthKey}
            />
            <DialogFooter className="flex-row justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddYearOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]">
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingLogout} onOpenChange={setPendingLogout}>
        <DialogContent className="max-w-sm rounded-xl border border-white/60 bg-white/90 p-6 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-slate-900">Sign Out</DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-slate-500">
              Are you sure you want to sign out of {tenantName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingLogout(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmLogout}
              className="rounded-full bg-[#EF4444] text-white hover:bg-[#DC2626]"
            >
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
