import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  LifeBuoy,
  Eye,
  LayoutDashboard,
  Loader2,
  LogOut,
  Monitor,
  MonitorSmartphone,
  Moon,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sun,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { apiLogoutCurrentDevice, type LogoutScope } from "@/lib/api/auth";
import { FeezoBrand } from "@/components/brand/FeezoBrand";
import { SchoolLogo } from "@/components/ui/school-logo";
import { useOptionalSettingsUnsavedGuard } from "@/components/school/settings-unsaved-guard";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import {
  FinancialYearFields,
  resolveFinancialYearInput,
} from "@/components/school/FinancialYearFields";
import { AddBranchDialog } from "@/components/school/AddBranchDialog";
import {
  openTenantGlobalSearch,
  TenantGlobalSearchTrigger,
} from "@/components/school/TenantGlobalSearch";
import { useTenantNavigationGuard } from "@/components/school/settings-unsaved-guard";
import { FloatingDock, type FloatingDockItem } from "@/components/ui/floating-dock";
import {
  endImpersonation,
  isStaffSelfPreviewSession,
  sessionAllowedBranchIds,
  sessionCanAccessBranch,
  sessionCanAccessSettings,
  sessionHasAnyFinance,
  sessionHasPermission,
  sessionStaffClassScopeId,
  useAuth,
} from "@/lib/auth";
import { defaultClosingMonthKey, suggestNextBooksMonthKey } from "@/lib/academic-year";
import { getLastHardRefreshAt, hardRefreshApp } from "@/lib/app-version";
import { formatChatStamp } from "@/lib/dates";
import {
  isMainCampusBranch,
  schoolInitials,
  sortCampusBranches,
  useTenantStore,
  type ThemeSettings,
} from "@/lib/tenant-store";
import {
  planAllowsMultipleBranches,
  planAllowsStudentAttendance,
  planAllowsGlobalSearch,
} from "@/lib/permissions";
import { isFinanceTab } from "@/lib/finance-tabs";
import { resolveMediaUrl } from "@/lib/media";
import { WorkspaceOpeningScreen } from "@/components/school/TenantDirectorySkeleton";
import { cn, glassInsetClass, glassPanelClass } from "@/lib/utils";

/** Fire success toast after books skeleton settles (avoids toast over empty zeros). */
export function toastBooksOpened(
  verb: "Opened" | "Reopened",
  year: string,
  stats: { receipts: number; enrolled: number },
) {
  window.setTimeout(() => {
    toast.success(`${verb} books for ${year}`, {
      description: `${stats.receipts} receipt${stats.receipts === 1 ? "" : "s"} · ${stats.enrolled} student${stats.enrolled === 1 ? "" : "s"} enrolled`,
    });
  }, 640);
}

function BooksYearSkeleton({ year, pathname }: { year: string; pathname: string }) {
  const isDirectory =
    pathname.includes("/students") ||
    pathname.includes("/staff") ||
    pathname.includes("/finance");

  return (
    <WorkspaceOpeningScreen
      label={`Opening ${year} books`}
      detail="Loading enrollments, receipts, and fee schedules for this year…"
      variant={isDirectory ? "directory" : "dashboard"}
    />
  );
}

/**
 * When financial year (or cold campus) books change, swap the workspace for a
 * full skeleton until overlays settle — never flash empty ₹0 / empty tables.
 */
export function AcademicYearBooksFade({ children }: { children: ReactNode }) {
  const { activeBranch, branchSyncing, branchContentReady, booksOpening } = useTenantStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const yearBusy = Boolean(booksOpening);
  const branchBlocking = branchSyncing && !branchContentReady;
  const branchSoft = branchSyncing && branchContentReady && !yearBusy;

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col transition-[opacity,filter] duration-200 ease-out",
          branchSoft ? "pointer-events-none opacity-[0.72] saturate-[0.92]" : "opacity-100",
        )}
        aria-busy={yearBusy || branchBlocking || branchSoft}
      >
        {yearBusy && booksOpening ? (
          <BooksYearSkeleton year={booksOpening} pathname={pathname} />
        ) : branchBlocking ? (
          <WorkspaceOpeningScreen
            label={`Opening ${activeBranch?.name?.trim() || "campus"}`}
            detail="Loading campus books and catalogs…"
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

/** Compact impersonation control — sits beside the campus switcher. */
export function ImpersonationChip({ compact = false }: { compact?: boolean }) {
  const { session } = useAuth();
  const { schoolDetails } = useTenantStore();
  if (!session?.impersonated) return null;

  const workspace = schoolDetails.name || session.tenantName || session.displayName || "tenant";
  const ticket = session.impersonationTicket;
  const actor = session.displayName || session.email || "admin";

  const exit = () => {
    const redirect = endImpersonation();
    window.location.replace(redirect);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Previewing ${workspace} as ${actor}. Open to exit impersonation.`}
          className={cn(
            "inline-flex max-w-[7.5rem] items-center gap-1 rounded-full border border-amber-300/80 bg-amber-50 px-2 py-2 text-[11px] font-semibold text-amber-950 shadow-sm backdrop-blur-md transition-colors hover:border-amber-400 hover:bg-amber-100/90 dark:border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900/60 sm:gap-1.5 sm:px-2.5 sm:text-[12px] lg:max-w-[9rem]",
            compact &&
              "h-8 w-8 max-w-8 shrink-0 justify-center gap-0 px-0 py-0 sm:h-8 sm:w-8 sm:max-w-8 sm:gap-0 sm:px-0 lg:h-9 lg:w-9 lg:max-w-9 lg:gap-0 lg:px-0 xl:w-auto xl:max-w-[8.5rem] xl:justify-start xl:gap-1.5 xl:px-2.5",
          )}
        >
          <span className="relative grid h-3.5 w-3.5 shrink-0 place-items-center">
            <Eye className="h-3.5 w-3.5" strokeWidth={2.25} />
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amber-500 ring-1 ring-amber-50 dark:ring-amber-950" />
          </span>
          {compact ? (
            <>
              <span className="hidden truncate xl:inline">Preview</span>
              <span className="sr-only xl:hidden">Preview</span>
            </>
          ) : (
            <span className="truncate">Preview</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(18rem,calc(100vw-2rem))] rounded-xl border-white/60 bg-white/95 p-1 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900"
      >
        <div className="px-2.5 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-800 dark:text-amber-300">
            Impersonation preview
          </p>
          <p className="mt-1 truncate text-[12.5px] font-semibold text-slate-900 dark:text-zinc-100">
            {workspace}
          </p>
          <p className="mt-0.5 truncate text-[11.5px] text-slate-500 dark:text-zinc-400">
            as {actor}
            {session.email && session.displayName ? ` · ${session.email}` : ""}
          </p>
          {ticket ? (
            <p className="mt-1 font-mono text-[10px] text-slate-400 dark:text-zinc-500">{ticket}</p>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={exit}
          className="cursor-pointer gap-2 rounded-lg text-[12.5px] font-semibold text-rose-700 focus:bg-rose-50 focus:text-rose-800 dark:text-rose-300 dark:focus:bg-rose-950/40"
        >
          <X className="h-3.5 w-3.5" />
          Exit impersonation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Compact year label for tight headers — "AY 2026-27" → "26-27". */
export function shortAcademicYearLabel(year: string): string {
  const trimmed = year.trim();
  const range = trimmed.match(/(\d{2})(\d{2})\s*[-–/]\s*(\d{2,4})/);
  if (range) {
    const end = range[3]!.length === 4 ? range[3]!.slice(2) : range[3]!;
    return `${range[2]}-${end}`;
  }
  const plain = trimmed.match(/(\d{4})\s*[-–/]\s*(\d{2,4})/);
  if (plain) {
    const end = plain[2]!.length === 4 ? plain[2]!.slice(2) : plain[2]!;
    return `${plain[1]!.slice(2)}-${end}`;
  }
  return trimmed.replace(/^AY\s+/i, "").slice(0, 7);
}

export function BranchSwitcher({
  compact = false,
  iconOnly = false,
}: {
  compact?: boolean;
  /** Circular building icon — full campus name in the menu (mobile header). */
  iconOnly?: boolean;
}) {
  const { session } = useAuth();
  const { branches, activeBranchId, openBranch, hydrated, branchSyncing } = useTenantStore();
  const unsavedGuard = useOptionalSettingsUnsavedGuard();
  const [addOpen, setAddOpen] = useState(false);
  const allowedBranchIds = sessionAllowedBranchIds(session);
  const selectable = useMemo(() => {
    const active = sortCampusBranches(branches.filter((b) => b.isActive !== false));
    if (!allowedBranchIds) return active;
    const allow = new Set(allowedBranchIds);
    return active.filter((b) => allow.has(b.id));
  }, [branches, allowedBranchIds]);
  const effectiveBranchId =
    selectable.find((b) => b.id === activeBranchId)?.id ?? selectable[0]?.id ?? "";
  const label =
    selectable.find((b) => b.id === effectiveBranchId)?.name ?? selectable[0]?.name ?? "No campus";
  const canManage = sessionCanAccessSettings(session);
  const canAdd = canManage && planAllowsMultipleBranches(session?.planFlags);

  if (!hydrated) {
    return (
      <Skeleton
        aria-label="Loading campus"
        className={cn(
          "h-9 w-[8.5rem] rounded-full bg-white/70 sm:w-[10rem]",
          compact && !iconOnly && "h-8 w-8 sm:w-8 lg:h-9 lg:w-9 xl:w-[10rem]",
          iconOnly && "h-8 w-8 shrink-0",
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

  const switchToBranch = (id: string) => {
    if (branchSyncing || id === activeBranchId) return;
    if (!sessionCanAccessBranch(session, id)) {
      toast.error("You do not have access to this campus");
      return;
    }
    const run = () => {
      void (async () => {
        const stats = await openBranch(id);
        const name = selectable.find((b) => b.id === id)?.name ?? "campus";
        toast.success(`Opened ${name}`, {
          description: `${stats.students} student${stats.students === 1 ? "" : "s"} · ${stats.receipts} receipt${stats.receipts === 1 ? "" : "s"}`,
        });
      })();
    };
    if (unsavedGuard) {
      unsavedGuard.tryNavigate(run);
      return;
    }
    run();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={branchSyncing}>
          <button
            type="button"
            disabled={branchSyncing}
            aria-busy={branchSyncing}
            title={label}
            aria-label={`Campus: ${label}`}
            className={cn(
              "inline-flex max-w-[9.5rem] items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-2 text-[11px] font-semibold text-slate-800 shadow-sm backdrop-blur-md transition-colors hover:border-[#0F766E]/40 hover:text-[#0F766E] disabled:cursor-wait disabled:opacity-70 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:text-[#2DD4BF] lg:max-w-[12rem] lg:gap-1.5 lg:px-3.5 lg:text-[12px]",
              compact &&
                !iconOnly &&
                "h-8 w-8 max-w-8 shrink-0 justify-center gap-0 px-0 py-0 lg:h-9 lg:w-9 lg:max-w-9 lg:gap-0 lg:px-0 xl:w-auto xl:max-w-[12rem] xl:justify-start xl:gap-1.5 xl:px-2.5 xl:text-[12px]",
              iconOnly &&
                "h-8 w-8 max-w-8 shrink-0 justify-center px-0 py-0 text-slate-600 dark:text-zinc-300",
            )}
          >
            {branchSyncing ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" strokeWidth={2.25} />
            ) : (
              <Building2
                className={cn("h-3.5 w-3.5 shrink-0", !iconOnly && !compact && "hidden lg:block")}
                strokeWidth={2.25}
              />
            )}
            {!iconOnly ? (
              <>
                <span className={cn("min-w-0 truncate", compact && "hidden xl:inline")}>{label}</span>
                <ChevronDown
                  className={cn("h-3.5 w-3.5 shrink-0 opacity-70", compact && "hidden xl:block")}
                />
              </>
            ) : null}
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
            <DropdownMenuRadioGroup value={effectiveBranchId} onValueChange={switchToBranch}>
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
          {canAdd ? (
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

export function AcademicYearSwitcher({
  compact = false,
  iconOnly = false,
}: {
  compact?: boolean;
  /** Short year pill (e.g. 26-27) for mobile headers that must always fit. */
  iconOnly?: boolean;
}) {
  const {
    academicYear,
    academicYears,
    closedAcademicYears,
    openAcademicYear,
    hydrated,
    booksOpening,
  } = useTenantStore();
  const selectableYears = useMemo(
    () => academicYears.filter((y) => !closedAcademicYears.includes(y) || y === academicYear),
    [academicYear, academicYears, closedAcademicYears],
  );
  const closedOthers = closedAcademicYears.filter((y) => y !== academicYear);
  const yearBusy = Boolean(booksOpening);
  const shortLabel = academicYear ? shortAcademicYearLabel(academicYear) : "";

  const openYear = (y: string, verb: "Opened" | "Reopened") => {
    if (yearBusy || y === academicYear) return;
    const stats = openAcademicYear(y);
    toastBooksOpened(verb, y, stats);
  };

  if (!hydrated || !academicYear) {
    return (
      <Skeleton
        aria-label="Loading academic year"
        className={cn(
          "h-9 w-[7rem] shrink-0 rounded-full bg-emerald-500/25 sm:w-[9rem]",
          compact && !iconOnly && "h-8 w-[4.75rem] sm:w-[7rem]",
          iconOnly && "h-8 w-[3.25rem] shrink-0",
        )}
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={academicYear}
          aria-label={`Academic year: ${academicYear}`}
          disabled={yearBusy}
          aria-busy={yearBusy}
          className={cn(
            "inline-flex h-9 max-w-[11rem] shrink-0 items-center gap-1 rounded-full bg-[#10B981] px-2.5 text-[11px] font-semibold text-white shadow-sm shadow-emerald-500/25 transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-80",
            compact &&
              !iconOnly &&
              "h-8 max-w-[4.75rem] px-1.5 text-[10px] sm:max-w-[7.5rem] sm:px-2.5 sm:text-[11px]",
            iconOnly && "h-8 w-auto max-w-none gap-0.5 px-2 text-[10px] tabular-nums",
          )}
        >
          <span className="min-w-0 truncate">{iconOnly ? shortLabel : academicYear}</span>
          {!iconOnly ? <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" /> : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[11rem] rounded-lg border-white/60 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900"
      >
        <DropdownMenuRadioGroup value={academicYear} onValueChange={(y) => openYear(y, "Opened")}>
          {selectableYears.map((y) => (
            <DropdownMenuRadioItem key={y} value={y} className="rounded-md text-[13px]">
              {y}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {closedOthers.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-400">
              Closed years
            </DropdownMenuLabel>
            {closedOthers.map((y) => (
              <DropdownMenuItem
                key={`closed-${y}`}
                className="rounded-md text-[13px] text-slate-500"
                onSelect={() => openYear(y, "Reopened")}
              >
                {y} · reopen
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
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

export function HardRefreshButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(() => getLastHardRefreshAt());
  const unsaved = useOptionalSettingsUnsavedGuard();

  useEffect(() => {
    setLastRefreshAt(getLastHardRefreshAt());
  }, []);

  const run = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    toast.message("Hard refresh", { description: "Clearing cache and reloading latest data…" });
    try {
      await hardRefreshApp();
    } catch {
      setBusy(false);
      toast.error("Could not refresh", { description: "Try again in a moment." });
    }
  }, [busy]);

  const lastLabel = lastRefreshAt ? formatChatStamp(lastRefreshAt, "list") : null;
  const title = lastLabel
    ? `Hard refresh · last ${lastLabel}`
    : "Hard refresh — reload latest data";

  return (
    <button
      type="button"
      onClick={() => {
        if (busy) return;
        const start = () => void run();
        if (unsaved?.tryNavigate) unsaved.tryNavigate(start);
        else start();
      }}
      disabled={busy}
      aria-label={title}
      title={title}
      className={cn(
        glassInsetClass,
        "grid h-10 w-10 shrink-0 place-items-center text-slate-600 transition-colors hover:text-[#0F766E] disabled:opacity-60 dark:text-zinc-300 dark:hover:text-[#2DD4BF]",
        className,
      )}
    >
      <RefreshCw className={cn("h-[18px] w-[18px]", busy && "animate-spin")} />
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
  const onEditStudent = pathname.startsWith("/tenant/students/edit");
  const onEditStaff = pathname.startsWith("/tenant/staff/edit");
  const onStudentProfile = pathname === "/tenant/students" && Boolean(detailId);
  const onStaffDetail = pathname === "/tenant/staff" && Boolean(detailId);
  const showBack =
    onFinanceSubView ||
    onAdmitStudent ||
    onEditStudent ||
    onEditStaff ||
    onStudentProfile ||
    onStaffDetail;

  const goBack = () => {
    if (onEditStudent) {
      const id = typeof search.id === "string" && search.id ? search.id : undefined;
      navigate({
        to: "/tenant/students",
        search: id ? { id } : {},
        replace: true,
      });
      return;
    }
    if (onEditStaff) {
      const id = typeof search.id === "string" && search.id ? search.id : undefined;
      navigate({
        to: "/tenant/staff",
        search: id ? { id } : {},
        replace: true,
      });
      return;
    }
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
    : onEditStaff
      ? "Back to staff profile"
      : onEditStudent
        ? "Back to student profile"
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
  { to: "/tenant/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/tenant/students", label: "Students", icon: Users },
  { to: "/tenant/attendance", label: "Attendance", icon: CalendarDays },
  { to: "/tenant/staff", label: "Staff", icon: UserCog },
  { to: "/tenant/finance", label: "Finance", icon: Wallet },
  { to: "/tenant/support", label: "Support", icon: LifeBuoy },
  { to: "/tenant/settings", label: "Settings", icon: Settings },
];

function navAllowed(to: string, session: ReturnType<typeof useAuth>["session"]): boolean {
  if (to.startsWith("/tenant/dashboard")) return sessionHasPermission(session, "dashboard");
  if (to.startsWith("/tenant/students")) return sessionHasPermission(session, "students");
  if (to.startsWith("/tenant/attendance")) {
    return (
      planAllowsStudentAttendance(session?.planFlags) &&
      (sessionHasPermission(session, "attendance") || sessionHasPermission(session, "students"))
    );
  }
  if (to.startsWith("/tenant/staff")) return sessionHasPermission(session, "staff");
  if (to.startsWith("/tenant/finance")) return sessionHasAnyFinance(session);
  if (to.startsWith("/tenant/support")) {
    return (
      sessionHasPermission(session, "support") ||
      sessionHasPermission(session, "dashboard") ||
      sessionCanAccessSettings(session)
    );
  }
  if (to.startsWith("/tenant/settings")) return sessionCanAccessSettings(session);
  return true;
}

const SIDEBAR_COLLAPSED_KEY = "tenant-sidebar-collapsed";

function dockScale(distance: number) {
  if (distance === 0) return 1.12;
  if (distance === 1) return 1.05;
  if (distance === 2) return 1.02;
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

  const staffNavHome =
    Boolean(sessionStaffClassScopeId(session)) || isStaffSelfPreviewSession(session);
  const visibleNav = useMemo(
    () =>
      NAV.filter((item) => navAllowed(item.to, session)).map((item) =>
        staffNavHome && item.to === "/tenant/staff"
          ? { ...item, label: "My Profile" }
          : item,
      ),
    [session, staffNavHome],
  );
  const { onGuardedLinkClick } = useTenantNavigationGuard();

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
                active ? "text-[#0F766E] dark:text-[#5EEAD4]" : "text-slate-700 dark:text-zinc-300",
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
        <FloatingDock desktopOnly items={floatingItems} desktopClassName="pointer-events-auto" />
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "relative z-40 hidden shrink-0 self-stretch transition-[width] duration-200 md:flex",
        // Allow hover tooltips to escape when collapsed; expanded clips to enable nav scroll.
        expanded ? "overflow-hidden" : "overflow-visible",
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
          "relative z-40 flex h-full max-h-[calc(100dvh-2rem)] min-h-0 w-full min-w-0 flex-col rounded-xl border border-white/70 bg-white/55 py-2.5 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.35)] backdrop-blur-2xl max-[820px]:py-2 xl:py-3",
          expanded
            ? "items-stretch overflow-hidden px-2.5 sm:px-3"
            : "items-center overflow-visible px-0",
        )}
      >
        <div
          className={cn(
            "mb-2 flex w-full min-w-0 shrink-0 flex-col items-center border-b border-slate-200/60 pb-2 dark:border-white/10 max-[820px]:mb-1.5 max-[820px]:pb-1.5 xl:mb-3 xl:pb-3",
            expanded ? "gap-1 px-0.5 xl:gap-1.5" : "",
          )}
        >
          <div
            className={cn(
              "relative grid shrink-0 place-items-center overflow-hidden rounded-xl font-bold text-white shadow-md shadow-teal-900/20",
              expanded
                ? "h-11 w-11 text-[11px] max-[820px]:h-10 max-[820px]:w-10 xl:h-14 xl:w-14 xl:text-[12px]"
                : "h-11 w-11 text-[11px] xl:h-12 xl:w-12",
              !logoUrl && "bg-gradient-to-br from-[#0F766E] to-[#115E59]",
            )}
            title={tenantName}
            aria-label={tenantName}
          >
            {logoUrl ? <SchoolLogo src={logoUrl} className="absolute inset-0" /> : initials}
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
                {branches.length > 1 ? (activeBranch?.name ?? "Campus") : "Tenant"}
              </div>
            </div>
          )}
        </div>

        <nav
          className={cn(
            // Scroll nav when viewport is short; footer (brand + collapse) stays pinned.
            // Keep scrollable but hide the scrollbar chrome.
            "flex min-h-0 w-full flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            // Collapsed: padding lives inside the scroller so the active ring and hover
            // magnification (up to 1.18×) aren't clipped by overflow.
            expanded
              ? "gap-1 max-[820px]:gap-0.5 xl:gap-2"
              : "items-center gap-1.5 px-1.5 py-2 max-[820px]:gap-1 max-[820px]:py-1.5",
          )}
          aria-label="Primary navigation"
        >
          {visibleNav.map((item, index) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.to);
            const distance = hovered === null ? 99 : Math.abs(hovered - index);
            const scale = expanded ? 1 : dockScale(distance);
            if (expanded) {
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  onClick={(event) => onGuardedLinkClick(item.to, event, active)}
                  className={cn(
                    "flex w-full shrink-0 items-center gap-2.5 rounded-xl border px-2 py-2 transition-colors max-[820px]:gap-2 max-[820px]:py-1.5 xl:gap-3.5 xl:px-3 xl:py-3",
                    active
                      ? "border-[#0F766E]/35 bg-[#0F766E]/12 text-[#0F172A] dark:border-[#2DD4BF]/45 dark:bg-[#0F766E]/25 dark:text-[#CCFBF1]"
                      : "border-transparent text-slate-600 hover:border-slate-200/80 hover:bg-white/70 hover:text-slate-900 dark:text-zinc-300 dark:hover:border-white/15 dark:hover:bg-white/10 dark:hover:text-zinc-50",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-xl border max-[820px]:h-8 max-[820px]:w-8 xl:h-11 xl:w-11",
                      active
                        ? "border-[#99F6E4]/80 bg-white text-[#0F766E] shadow-sm dark:border-[#2DD4BF]/50 dark:bg-[#0F766E]/35 dark:text-[#5EEAD4]"
                        : "border-slate-200/90 bg-white/80 text-slate-700 dark:border-white/25 dark:bg-zinc-800/80 dark:text-zinc-100",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 max-[820px]:h-4 max-[820px]:w-4 xl:h-6 xl:w-6",
                        active
                          ? "text-[#0F766E] dark:text-[#5EEAD4]"
                          : "text-slate-700 dark:text-zinc-100",
                      )}
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
                onClick={(event) => onGuardedLinkClick(item.to, event, active)}
                onMouseEnter={() => setHovered(index)}
                className={cn(
                  "group relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl outline-none max-[820px]:h-11 max-[820px]:w-11 xl:h-16 xl:w-16",
                  distance === 0 && "z-50",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[#0F766E] shadow-[0_0_10px_rgba(15,118,110,0.55)] transition-all duration-200 dark:bg-[#2DD4BF] xl:h-8",
                    placement === "Left" ? "-left-1.5" : "-right-1.5",
                    active ? "opacity-100" : "scale-y-0 opacity-0",
                  )}
                />
                <span
                  className="relative flex items-center justify-center transition-transform duration-200 ease-out"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                    zIndex: distance === 0 ? 20 : 10 - Math.min(distance, 5),
                  }}
                >
                  <span
                    className={cn(
                      "grid h-11 w-11 place-items-center rounded-xl border transition-[background-color,border-color,box-shadow] duration-200 max-[820px]:h-10 max-[820px]:w-10 xl:h-14 xl:w-14",
                      "group-focus-visible:ring-2 group-focus-visible:ring-[#0F766E]/60 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-white dark:group-focus-visible:ring-[#2DD4BF]/70 dark:group-focus-visible:ring-offset-zinc-900",
                      active
                        ? "border-[#5EEAD4]/70 bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] shadow-[0_8px_20px_-10px_rgba(15,118,110,0.65),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-[#2DD4BF]/45 dark:from-[#0F766E]/55 dark:to-[#115E59]/60 dark:shadow-[0_8px_20px_-10px_rgba(45,212,191,0.5)]"
                        : "border-slate-200/90 bg-gradient-to-br from-white/95 to-white/70 shadow-[0_6px_18px_-10px_rgba(15,23,42,0.45)] group-hover:border-slate-300/90 group-hover:bg-white dark:border-white/25 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-900 dark:shadow-black/40 dark:group-hover:border-white/35",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 max-[820px]:h-4 max-[820px]:w-4 xl:h-7 xl:w-7",
                        active
                          ? "text-[#0F766E] dark:text-[#5EEAD4]"
                          : "text-slate-700 dark:text-zinc-100",
                      )}
                      strokeWidth={active ? 2.35 : 2}
                    />
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            "mt-auto flex shrink-0 flex-col gap-1 border-t border-slate-200/60 pt-1.5 dark:border-white/10 max-[820px]:gap-0.5 max-[820px]:pt-1 xl:gap-1.5 xl:pt-2",
            expanded ? "items-stretch" : "items-center",
          )}
        >
          <div className={cn(expanded ? "mx-0.5 px-1 py-1 xl:px-1.5 xl:py-1.5" : "py-0.5")}>
            <FeezoBrand
              compact={!expanded}
              markClassName={
                expanded
                  ? "h-7 w-7 max-[820px]:h-6 max-[820px]:w-6"
                  : "h-9 w-9 max-[820px]:h-8 max-[820px]:w-8 xl:h-11 xl:w-11"
              }
              className={expanded ? "gap-2" : undefined}
            />
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
                expanded
                  ? "mx-1 h-9 w-auto px-3 max-[820px]:h-8 xl:h-10"
                  : "h-9 w-9 max-[820px]:h-8 max-[820px]:w-8 xl:h-10 xl:w-10",
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
    booksOpening,
  } = useTenantStore();
  const yearBusy = Boolean(booksOpening);
  const { showBack, goBack, backLabel } = useWorkspaceSubViewBack();
  const { guardedNavigate, tryNavigate } = useTenantNavigationGuard();
  const [pendingLogout, setPendingLogout] = useState(false);
  const [logoutScope, setLogoutScope] = useState<LogoutScope>("device");
  const [signingOut, setSigningOut] = useState(false);
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

  const closeLogout = () => {
    if (signingOut) return;
    setPendingLogout(false);
    setLogoutScope("device");
  };

  const confirmLogout = async () => {
    if (signingOut) return;
    const name = session?.displayName ?? "Tenant Admin";
    if (session?.impersonated) {
      logout();
      toast.success("Preview closed", { description: "You are back in your own account." });
      setPendingLogout(false);
      setLogoutScope("device");
      return;
    }
    setSigningOut(true);
    try {
      const result = await apiLogoutCurrentDevice(logoutScope);
      logout("local");
      if (logoutScope === "everywhere" && !result.othersRevoked) {
        toast.warning("Signed out on this device", {
          description: "Other devices could not be reached. They may stay signed in until those sessions expire.",
        });
      } else if (logoutScope === "everywhere") {
        toast.success("Signed out everywhere", {
          description: `${name} · this browser and your other sessions were ended.`,
        });
      } else {
        toast.success("Signed out of this device", {
          description: `${name} · other devices stay signed in.`,
        });
      }
      setPendingLogout(false);
      setLogoutScope("device");
      navigate({ to: "/login", replace: true });
    } finally {
      setSigningOut(false);
    }
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
    window.setTimeout(() => {
      toast.success(`Opened books for ${label}`, {
        description: "Fee periods cloned from the previous year · ready to enroll students",
      });
    }, 640);
    resetYearDraft();
    setAddYearOpen(false);
  };

  return (
    <>
      <header
        className={cn(
          glassPanelClass,
          "mb-4 hidden w-full min-w-0 items-center gap-2 overflow-hidden rounded-2xl px-2.5 py-2 md:flex md:flex-nowrap md:gap-2 md:px-3 md:py-2.5 lg:mb-5 lg:gap-3 lg:px-4 lg:py-3 xl:px-5 xl:py-3.5",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5 lg:gap-2.5">
          {showBack && (
            <button
              type="button"
              onClick={() => {
                if (tryNavigate) tryNavigate(goBack);
                else goBack();
              }}
              aria-label={backLabel}
              className={cn(
                glassInsetClass,
                "inline-flex h-8 w-8 shrink-0 items-center justify-center text-slate-700 transition-colors hover:text-[#0F766E] dark:text-zinc-300 dark:hover:text-[#2DD4BF] lg:h-9 lg:w-auto lg:gap-1.5 lg:px-3 xl:h-10",
              )}
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="hidden text-[13px] font-semibold xl:inline">Back</span>
            </button>
          )}
          {/* Desktop: school title only (logo lives in the dock/sidebar) */}
          <div className="min-w-0 flex-1 overflow-hidden">
            <h1
              className="truncate text-[13px] font-bold tracking-tight text-slate-900 lg:text-[14px] xl:text-[16px] dark:text-zinc-100"
              title={tenantName}
            >
              {tenantName}
            </h1>
            <p className="mt-0.5 hidden truncate text-[11px] text-slate-500 2xl:block dark:text-zinc-400">
              Tenant administration workspace
            </p>
          </div>
        </div>

        <div className="flex min-w-0 shrink items-center justify-end gap-1 sm:gap-1.5 lg:gap-2">
          <div className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5 lg:gap-2">
            <ImpersonationChip compact />
            <BranchSwitcher compact />
            {!hydrated || !academicYear ? (
              <Skeleton
                aria-label="Loading academic year"
                className="h-8 w-16 shrink-0 rounded-full bg-emerald-500/25 lg:h-9 lg:w-20 xl:w-36"
              />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    title={academicYear}
                    disabled={yearBusy}
                    aria-busy={yearBusy}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-[#10B981] px-2 text-[10px] font-semibold text-white shadow-sm shadow-emerald-500/25 transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-80 lg:h-9 lg:px-2.5 lg:text-[11px] xl:gap-1.5 xl:px-3 xl:text-[12px]"
                  >
                    <CheckCircle2
                      className="hidden h-3.5 w-3.5 shrink-0 xl:block"
                      strokeWidth={2.5}
                    />
                    <span className="min-w-0 truncate xl:hidden">
                      {shortAcademicYearLabel(academicYear)}
                    </span>
                    <span className="hidden min-w-0 truncate xl:inline">
                      {academicYear}
                      <span className="hidden 2xl:inline"> Active</span>
                    </span>
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
                      if (yearBusy || y === academicYear) return;
                      const stats = openAcademicYear(y);
                      toastBooksOpened("Opened", y, stats);
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
                              toastBooksOpened("Reopened", y, stats);
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
          </div>

          <div className="flex min-w-0 flex-nowrap items-center gap-1 lg:gap-1.5">
            <ThemeModeToggle className="h-8 w-8 lg:h-9 lg:w-9 xl:h-10 xl:w-10" />

            {/* Opens the shared search host mounted in the tenant layout */}
            <TenantGlobalSearchTrigger variant="bar" />

            <div className="hidden items-center gap-1 lg:flex lg:gap-1.5">
              <HardRefreshButton className="h-9 w-9 xl:h-10 xl:w-10" />
              <button
                type="button"
                onClick={() => guardedNavigate("/tenant/notifications")}
                aria-label="Notifications"
                className="glass-inset relative grid h-9 w-9 place-items-center rounded-xl text-slate-600 transition-colors hover:text-[#0F766E] xl:h-10 xl:w-10"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-[#0F766E]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  const openLogout = () => setPendingLogout(true);
                  if (tryNavigate) tryNavigate(openLogout);
                  else openLogout();
                }}
                aria-label="Logout"
                className="glass-inset grid h-9 w-9 place-items-center rounded-xl text-slate-600 transition-colors hover:text-[#EF4444] xl:h-10 xl:w-10"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>

            {/* Compact overflow menu on tablet widths */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="More actions"
                  className="glass-inset relative grid h-8 w-8 place-items-center rounded-xl text-slate-600 transition-colors hover:text-[#0F766E] dark:text-zinc-300 lg:hidden"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full border-2 border-white bg-[#0F766E]" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-[12rem] rounded-lg border-white/60 bg-white/95 p-1 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900"
              >
                {planAllowsGlobalSearch(session?.planFlags) ? (
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 rounded-md text-[13px]"
                    onSelect={() => openTenantGlobalSearch()}
                  >
                    <Search className="h-3.5 w-3.5" />
                    Search workspace
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  className="cursor-pointer gap-2 rounded-md text-[13px]"
                  onSelect={() => {
                    void hardRefreshApp();
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Hard refresh
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2 rounded-md text-[13px]"
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
                  className="cursor-pointer gap-2 rounded-md text-[13px] text-rose-700 focus:bg-rose-50 focus:text-rose-800 dark:text-rose-300"
                  onSelect={() => {
                    const openLogout = () => setPendingLogout(true);
                    if (tryNavigate) tryNavigate(openLogout);
                    else openLogout();
                  }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
              <Button
                type="submit"
                className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingLogout}
        onOpenChange={(open) => {
          if (!open) closeLogout();
          else setPendingLogout(true);
        }}
      >
        <DialogContent className="max-w-sm rounded-xl border border-white/60 bg-white/95 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-slate-900 dark:text-zinc-50">
              {session?.impersonated ? "End preview" : "Sign out"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400">
              {session?.impersonated
                ? `This closes the preview of ${tenantName} and returns you to your own account.`
                : "Choose whether to end only this browser, or every place you are signed in."}
            </DialogDescription>
          </DialogHeader>
          {session?.impersonated ? null : (
            <RadioGroup
              value={logoutScope}
              onValueChange={(value) => setLogoutScope(value as LogoutScope)}
              className="mt-4 gap-2"
              disabled={signingOut}
            >
              {(
                [
                  {
                    value: "device" as const,
                    title: "This device",
                    body: "End your session in this browser. Phones, tablets, and other browsers stay signed in.",
                    icon: Monitor,
                  },
                  {
                    value: "everywhere" as const,
                    title: "All devices",
                    body: "Sign out here and end every other web session for this login. You will need to sign in again on each device.",
                    icon: MonitorSmartphone,
                  },
                ] as const
              ).map((option) => {
                const selected = logoutScope === option.value;
                const Icon = option.icon;
                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                      selected
                        ? "border-[#0F766E] bg-[#F0FDFA] dark:border-teal-400/50 dark:bg-teal-950/40"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-zinc-950 dark:hover:border-white/20",
                      signingOut && "pointer-events-none opacity-60",
                    )}
                  >
                    <RadioGroupItem value={option.value} className="mt-0.5" />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900 dark:text-zinc-50">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-[#0F766E] dark:text-teal-300" />
                        {option.title}
                      </span>
                      <span className="mt-1 block text-[12px] leading-relaxed text-slate-500 dark:text-zinc-400">
                        {option.body}
                      </span>
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          )}
          <Button
            type="button"
            disabled={signingOut}
            onClick={() => void confirmLogout()}
            className="mt-4 h-11 w-full rounded-xl bg-[#EF4444] text-white hover:bg-[#DC2626] disabled:opacity-70"
          >
            {signingOut ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-1.5 h-4 w-4" />
            )}
            {session?.impersonated ? "End preview" : "Sign out"}
          </Button>
          {session?.impersonated ? null : (
            <p className="mt-2 text-center text-[11.5px] text-slate-400 dark:text-zinc-500">
              Need to remove your login?{" "}
              <a
                href="/data-deletion"
                className="font-medium text-[#0F766E] hover:underline dark:text-teal-300"
                onClick={() => {
                  setPendingLogout(false);
                  setLogoutScope("device");
                }}
              >
                Request account deletion
              </a>
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
