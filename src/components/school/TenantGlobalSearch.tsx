import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Command as CommandPrimitive } from "cmdk";
import {
  Bell,
  Building2,
  Bus,
  CalendarDays,
  CreditCard,
  Crown,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  Search,
  Settings,
  Sparkles,
  UserCog,
  Users,
  UserPlus,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

import { useTenantNavigationGuard } from "@/components/school/settings-unsaved-guard";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  sessionCanAccessFinanceView,
  sessionCanAccessSettings,
  sessionCanAccessSettingsTab,
  sessionHasAnyFinance,
  sessionHasPermission,
  useAuth,
} from "@/lib/auth";
import type { FeezoNavPath } from "@/lib/ai-navigation";
import type { FinanceViewKey, SettingsTabId } from "@/lib/permissions";
import { planAllowsGlobalSearch, planAllowsStudentAttendance } from "@/lib/permissions";
import { useTenantStore } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

const PEOPLE_LIMIT = 12;

type NavSearchItem = {
  id: string;
  label: string;
  hint?: string;
  keywords: string;
  to: FeezoNavPath;
  search?: Record<string, string>;
  icon: LucideIcon;
  allowed: boolean;
};

function isMacPlatform() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

function normalize(text: string) {
  return text.toLowerCase().normalize("NFKD");
}

function matchesQuery(haystack: string, query: string) {
  const q = normalize(query).trim();
  if (!q) return true;
  const hay = normalize(haystack);
  return q.split(/\s+/).every((token) => hay.includes(token));
}

function buildNavCatalog(session: ReturnType<typeof useAuth>["session"]): NavSearchItem[] {
  const canStudents = sessionHasPermission(session, "students");
  const canStaff = sessionHasPermission(session, "staff");
  const canFinance = sessionHasAnyFinance(session);
  const canSettings = sessionCanAccessSettings(session);
  const canDashboard = sessionHasPermission(session, "dashboard");
  const financeView = (view: FinanceViewKey) => sessionCanAccessFinanceView(session, view);
  const settingsTab = (tab: SettingsTabId) => sessionCanAccessSettingsTab(session, tab);

  const pages: NavSearchItem[] = [
    {
      id: "page-dashboard",
      label: "Dashboard",
      hint: "Home overview",
      keywords: "home dashboard overview",
      to: "/tenant/dashboard",
      icon: LayoutDashboard,
      allowed: canDashboard,
    },
    {
      id: "page-students",
      label: "Students",
      hint: "Directory",
      keywords: "students pupils enrollment directory",
      to: "/tenant/students",
      icon: Users,
      allowed: canStudents,
    },
    {
      id: "page-admit",
      label: "Admit student",
      hint: "New admission",
      keywords: "admit admission enroll new student",
      to: "/tenant/students/admit",
      icon: UserPlus,
      allowed: canStudents,
    },
    {
      id: "page-attendance",
      label: "Attendance",
      hint: "Mark students & reports",
      keywords: "attendance absent present halfday leave late register roll call",
      to: "/tenant/attendance",
      icon: CalendarDays,
      allowed: canStudents && planAllowsStudentAttendance(session?.planFlags),
    },
    {
      id: "page-parents",
      label: "Parents app",
      hint: "Open a student, then the Parents app tab",
      keywords: "parents guardians family invite parent app",
      to: "/tenant/students",
      icon: Users,
      allowed: canStudents,
    },
    {
      id: "page-academics",
      label: "Academics",
      hint: "Exams and report cards",
      keywords: "academics exams marks report card grades results",
      to: "/tenant/settings",
      search: { tab: "academics" },
      icon: GraduationCap,
      allowed: settingsTab("academics"),
    },
    {
      id: "page-staff",
      label: "Staff",
      hint: "Roster",
      keywords: "staff employees teachers roster",
      to: "/tenant/staff",
      icon: UserCog,
      allowed: canStaff,
    },
    {
      id: "page-finance",
      label: "Finance",
      hint: "Fees & ledger",
      keywords: "finance money fees payments accounts",
      to: "/tenant/finance",
      icon: Wallet,
      allowed: canFinance,
    },
    {
      id: "page-ai",
      label: "Feezo AI",
      hint: "Assistant",
      keywords: "ai assistant feezo chat help",
      to: "/tenant/ai",
      icon: Sparkles,
      allowed: true,
    },
    {
      id: "page-support",
      label: "Help & support",
      hint: "Guides",
      keywords: "help support guides faq",
      to: "/tenant/support",
      icon: LifeBuoy,
      allowed: true,
    },
    {
      id: "page-settings",
      label: "Settings",
      hint: "School administration",
      keywords: "settings admin configuration",
      to: "/tenant/settings",
      icon: Settings,
      allowed: canSettings,
    },
    {
      id: "page-notifications",
      label: "Notifications",
      hint: "Alerts",
      keywords: "notifications alerts bell",
      to: "/tenant/notifications",
      icon: Bell,
      allowed: true,
    },
  ];

  const settingsTabs: NavSearchItem[] = [
    {
      id: "settings-school",
      label: "School Details",
      hint: "Settings",
      keywords: "school details profile address phone email",
      to: "/tenant/settings",
      search: { tab: "school" },
      icon: Building2,
      allowed: settingsTab("school"),
    },
    {
      id: "settings-branches",
      label: "Branches",
      hint: "Settings",
      keywords: "branches campus locations",
      to: "/tenant/settings",
      search: { tab: "branches" },
      icon: Building2,
      allowed: settingsTab("branches"),
    },
    {
      id: "settings-classes",
      label: "Class Tier",
      hint: "Settings",
      keywords: "class tier classes divisions departments roles",
      to: "/tenant/settings",
      search: { tab: "classes" },
      icon: Settings,
      allowed:
        settingsTab("classes") || settingsTab("departments") || settingsTab("roles"),
    },
    {
      id: "settings-leave",
      label: "Leave",
      hint: "Settings",
      keywords: "leave holiday calendar",
      to: "/tenant/settings",
      search: { tab: "leave" },
      icon: Settings,
      allowed: settingsTab("leave"),
    },
    {
      id: "settings-fees",
      label: "Fee Category",
      hint: "Settings",
      keywords: "fee category fees tuition",
      to: "/tenant/settings",
      search: { tab: "fees" },
      icon: CreditCard,
      allowed: settingsTab("fees"),
    },
    {
      id: "settings-users",
      label: "Users",
      hint: "Settings",
      keywords: "users logins accounts permissions",
      to: "/tenant/settings",
      search: { tab: "users" },
      icon: Users,
      allowed: settingsTab("users"),
    },
    {
      id: "settings-subscription",
      label: "Subscription",
      hint: "Settings",
      keywords: "billing subscription plan invoice renewal",
      to: "/tenant/settings",
      search: { tab: "subscription" },
      icon: Crown,
      allowed: settingsTab("subscription"),
    },
    {
      id: "settings-transport",
      label: "Bus Point",
      hint: "Settings",
      keywords: "bus point transport vehicles route",
      to: "/tenant/settings",
      search: { tab: "transport" },
      icon: Bus,
      allowed: settingsTab("transport") || settingsTab("vehicles"),
    },
    {
      id: "settings-system",
      label: "System",
      hint: "Settings",
      keywords: "system theme branding whatsapp",
      to: "/tenant/settings",
      search: { tab: "system" },
      icon: Settings,
      allowed: settingsTab("system"),
    },
    {
      id: "settings-support",
      label: "Live chat",
      hint: "Settings · Support",
      keywords: "support live chat helpdesk",
      to: "/tenant/settings",
      search: { tab: "support" },
      icon: LifeBuoy,
      allowed: settingsTab("support"),
    },
  ];

  const financeTabs: NavSearchItem[] = [
    {
      id: "finance-receive",
      label: "Receive payment",
      hint: "Finance",
      keywords: "receive payment collect fees",
      to: "/tenant/finance",
      search: { tab: "receive" },
      icon: Wallet,
      allowed: financeView("receive"),
    },
    {
      id: "finance-make",
      label: "Make payment",
      hint: "Finance",
      keywords: "make payment disburse expense",
      to: "/tenant/finance",
      search: { tab: "make" },
      icon: Wallet,
      allowed: financeView("make"),
    },
    {
      id: "finance-transfer",
      label: "Fund transfer",
      hint: "Finance",
      keywords: "fund transfer",
      to: "/tenant/finance",
      search: { tab: "transfer" },
      icon: Wallet,
      allowed: financeView("transfer"),
    },
    {
      id: "finance-transfers",
      label: "Transfer reports",
      hint: "Finance",
      keywords: "transfer reports",
      to: "/tenant/finance",
      search: { tab: "transfers" },
      icon: Wallet,
      allowed: financeView("transfers"),
    },
    {
      id: "finance-analytics",
      label: "Analytics",
      hint: "Finance",
      keywords: "analytics charts reports",
      to: "/tenant/finance",
      search: { tab: "analytics" },
      icon: Wallet,
      allowed: financeView("analytics"),
    },
    {
      id: "finance-ledger",
      label: "Ledger",
      hint: "Finance",
      keywords: "ledger accounts",
      to: "/tenant/finance",
      search: { tab: "ledger" },
      icon: Wallet,
      allowed: financeView("ledger"),
    },
    {
      id: "finance-journals",
      label: "Journals",
      hint: "Finance",
      keywords: "journals entries",
      to: "/tenant/finance",
      search: { tab: "journals" },
      icon: Wallet,
      allowed: financeView("journals"),
    },
    {
      id: "finance-trial",
      label: "Trial balance",
      hint: "Finance",
      keywords: "trial balance",
      to: "/tenant/finance",
      search: { tab: "trial" },
      icon: Wallet,
      allowed: financeView("trial"),
    },
    {
      id: "finance-pl",
      label: "Profit & loss",
      hint: "Finance",
      keywords: "profit loss p&l",
      to: "/tenant/finance",
      search: { tab: "pl" },
      icon: Wallet,
      allowed: financeView("pl"),
    },
    {
      id: "finance-balance",
      label: "Balance sheet",
      hint: "Finance",
      keywords: "balance sheet",
      to: "/tenant/finance",
      search: { tab: "balance" },
      icon: Wallet,
      allowed: financeView("balance"),
    },
    {
      id: "finance-fees",
      label: "Fees report",
      hint: "Finance",
      keywords: "fees report overdue",
      to: "/tenant/finance",
      search: { tab: "fees" },
      icon: CreditCard,
      allowed: financeView("fees"),
    },
    {
      id: "finance-concession",
      label: "Concession report",
      hint: "Finance",
      keywords: "concession scholarship",
      to: "/tenant/finance",
      search: { tab: "concession" },
      icon: CreditCard,
      allowed: financeView("concession"),
    },
    {
      id: "finance-salary",
      label: "Salary report",
      hint: "Finance",
      keywords: "salary payroll",
      to: "/tenant/finance",
      search: { tab: "salary" },
      icon: Wallet,
      allowed: financeView("salary"),
    },
    {
      id: "finance-daybook",
      label: "Day book",
      hint: "Finance",
      keywords: "day book daybook",
      to: "/tenant/finance",
      search: { tab: "daybook" },
      icon: Wallet,
      allowed: financeView("daybook"),
    },
    {
      id: "finance-recon",
      label: "Bank reconciliation",
      hint: "Finance",
      keywords: "bank reconciliation recon",
      to: "/tenant/finance",
      search: { tab: "reconciliation" },
      icon: Wallet,
      allowed: financeView("reconciliation"),
    },
    {
      id: "finance-cashflow",
      label: "Cash flow",
      hint: "Finance",
      keywords: "cash flow cashflow statement",
      to: "/tenant/finance",
      search: { tab: "cashflow" },
      icon: Wallet,
      allowed: financeView("cashflow"),
    },
    {
      id: "finance-vehicle",
      label: "Vehicle fees",
      hint: "Finance",
      keywords: "vehicle fees transport bus route",
      to: "/tenant/finance",
      search: { tab: "vehicle" },
      icon: CreditCard,
      allowed: financeView("vehicle"),
    },
    {
      id: "finance-aging",
      label: "Fee aging",
      hint: "Finance",
      keywords: "fee aging overdue buckets receivables",
      to: "/tenant/finance",
      search: { tab: "aging" },
      icon: CreditCard,
      allowed: financeView("aging"),
    },
    {
      id: "finance-heads",
      label: "Fee heads",
      hint: "Finance",
      keywords: "fee heads category collection billed",
      to: "/tenant/finance",
      search: { tab: "heads" },
      icon: CreditCard,
      allowed: financeView("heads"),
    },
  ];

  return [...pages, ...settingsTabs, ...financeTabs].filter((item) => item.allowed);
}

const OPEN_EVENT = "feezo:open-global-search";

/** Open the tenant palette from overflow menus or other chrome. */
export function openTenantGlobalSearch() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** Whether this tenant’s plan includes workspace global search. */
export function tenantPlanAllowsGlobalSearch(
  planFlags: Parameters<typeof planAllowsGlobalSearch>[0],
): boolean {
  return planAllowsGlobalSearch(planFlags);
}

type TenantGlobalSearchProps = {
  className?: string;
  onOpenChange?: (open: boolean) => void;
  /**
   * `bar` — desktop search field (default).
   * `icon` — compact header icon (mobile).
   * `none` — dialog + ⌘K host only (no visible trigger).
   */
  trigger?: "bar" | "icon" | "none";
};

/** Icon / bar control that opens the shared global-search dialog. */
export function TenantGlobalSearchTrigger({
  variant = "icon",
  className,
}: {
  variant?: "bar" | "icon";
  className?: string;
}) {
  const { session } = useAuth();
  const [modKey, setModKey] = useState("⌘");
  useEffect(() => {
    setModKey(isMacPlatform() ? "⌘" : "Ctrl");
  }, []);

  if (!planAllowsGlobalSearch(session?.planFlags)) return null;

  if (variant === "bar") {
    return (
      <button
        type="button"
        onClick={() => openTenantGlobalSearch()}
        aria-label="Open global search"
        className={cn(
          "glass-inset group flex h-8 w-[8.5rem] min-w-[2.25rem] max-w-full shrink basis-[8.5rem] items-center gap-1.5 overflow-hidden rounded-xl px-2.5 text-left text-slate-500 transition-colors hover:text-[#0F766E] dark:text-zinc-400 dark:hover:text-[#2DD4BF] lg:h-9 lg:w-52 lg:basis-52 lg:gap-2 lg:px-3 xl:h-10 xl:w-60 xl:basis-60",
          className,
        )}
      >
        <Search className="h-4 w-4 shrink-0 opacity-70" strokeWidth={2} />
        <span className="min-w-0 flex-1 truncate text-[13px]">Search workspace…</span>
        <kbd className="pointer-events-none hidden h-5 shrink-0 items-center rounded-md border border-slate-200/80 bg-white/70 px-1.5 font-mono text-[10px] font-medium text-slate-400 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-500 lg:inline-flex">
          {modKey}K
        </kbd>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openTenantGlobalSearch()}
      aria-label="Search workspace"
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/80 bg-white/70 text-slate-600 shadow-sm backdrop-blur-md transition-colors hover:text-[#0F766E] dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:text-[#2DD4BF]",
        className,
      )}
    >
      <Search className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}

export function TenantGlobalSearch({
  className,
  onOpenChange,
  trigger = "bar",
}: TenantGlobalSearchProps): ReactElement | null {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [modKey, setModKey] = useState("⌘");
  const navigate = useNavigate();
  const { tryNavigate } = useTenantNavigationGuard();
  const { session } = useAuth();
  const { activeStudents, staff, tenantUsers } = useTenantStore();

  const setOpenTracked = useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
      if (!next) setQuery("");
    },
    [onOpenChange],
  );

  useEffect(() => {
    setModKey(isMacPlatform() ? "⌘" : "Ctrl");
  }, []);

  const searchAllowed = planAllowsGlobalSearch(session?.planFlags);

  useEffect(() => {
    if (!searchAllowed) {
      setOpenTracked(false);
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      setOpen((prev) => {
        const next = !prev;
        onOpenChange?.(next);
        if (!next) setQuery("");
        return next;
      });
    };
    const onExternalOpen = () => setOpenTracked(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onExternalOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onExternalOpen);
    };
  }, [onOpenChange, setOpenTracked, searchAllowed]);

  const navItems = useMemo(() => buildNavCatalog(session), [session]);

  const filteredNav = useMemo(() => {
    const matched = navItems.filter((item) =>
      matchesQuery(`${item.label} ${item.hint ?? ""} ${item.keywords}`, query),
    );
    // Idle state: primary destinations only — keep the palette calm until they type.
    if (!query.trim()) {
      return matched.filter((item) => item.id.startsWith("page-")).slice(0, 8);
    }
    return matched;
  }, [navItems, query]);

  const canStudents = sessionHasPermission(session, "students");
  const canStaff = sessionHasPermission(session, "staff");
  const canUsers = sessionCanAccessSettingsTab(session, "users");
  const q = query.trim();
  const searchPeople = q.length >= 1;

  const matchedStudents = useMemo(() => {
    if (!canStudents || !searchPeople) return [];
    const hits = activeStudents.filter((s) =>
      matchesQuery(
        [s.name, s.id, s.admissionNumber, s.phone, s.email, s.guardian, s.cls]
          .filter(Boolean)
          .join(" "),
        q,
      ),
    );
    return hits.slice(0, PEOPLE_LIMIT);
  }, [activeStudents, canStudents, q, searchPeople]);

  const matchedStaff = useMemo(() => {
    if (!canStaff || !searchPeople) return [];
    const live = staff.filter((s) => !s.deletedAt && s.active);
    const hits = live.filter((s) =>
      matchesQuery(
        [s.name, s.id, s.phone, s.altPhone, s.guardianPhone, s.role, s.dept]
          .filter(Boolean)
          .join(" "),
        q,
      ),
    );
    return hits.slice(0, PEOPLE_LIMIT);
  }, [canStaff, q, searchPeople, staff]);

  const matchedUsers = useMemo(() => {
    if (!canUsers || !searchPeople) return [];
    const hits = tenantUsers
      .filter((u) => u.active)
      .filter((u) =>
        matchesQuery([u.displayName, u.email, u.id].filter(Boolean).join(" "), q),
      );
    return hits.slice(0, PEOPLE_LIMIT);
  }, [canUsers, q, searchPeople, tenantUsers]);

  const go = (to: FeezoNavPath, search?: Record<string, string>) => {
    setOpenTracked(false);
    const run = () => {
      const query = new URLSearchParams(search ?? {}).toString();
      void navigate({ href: query ? `${to}?${query}` : to });
    };
    if (tryNavigate) tryNavigate(run);
    else run();
  };

  const hasResults =
    filteredNav.length > 0 ||
    matchedStudents.length > 0 ||
    matchedStaff.length > 0 ||
    matchedUsers.length > 0;

  const groupClass =
    "px-1.5 pb-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-slate-500 dark:[&_[cmdk-group-heading]]:text-zinc-400";

  // Light selected state so icons, titles, and meta stay readable (no dark teal wash).
  const rowClass =
    "group flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left text-slate-900 outline-none transition-colors data-[selected=true]:bg-[#ECFDF5] data-[selected=true]:shadow-[inset_0_0_0_1px_rgba(15,118,110,0.22)] dark:text-zinc-100 dark:data-[selected=true]:bg-[#0F766E]/25 dark:data-[selected=true]:shadow-[inset_0_0_0_1px_rgba(45,212,191,0.28)]";

  const iconBoxClass =
    "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-data-[selected=true]:bg-white group-data-[selected=true]:text-[#0F766E] dark:bg-white/10 dark:text-zinc-300 dark:group-data-[selected=true]:bg-zinc-900 dark:group-data-[selected=true]:text-[#5EEAD4]";

  const titleClass =
    "truncate text-[13px] font-semibold leading-tight text-slate-800 group-data-[selected=true]:text-[#0F766E] dark:text-zinc-100 dark:group-data-[selected=true]:text-[#5EEAD4]";

  const metaClass =
    "truncate text-[11px] leading-tight text-slate-500 group-data-[selected=true]:text-[#0F766E]/80 dark:text-zinc-400 dark:group-data-[selected=true]:text-[#99F6E4]/90";

  const badgeClass =
    "shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 transition-colors group-data-[selected=true]:bg-white group-data-[selected=true]:text-[#0F766E] dark:bg-white/10 dark:text-zinc-400 dark:group-data-[selected=true]:bg-zinc-900 dark:group-data-[selected=true]:text-[#5EEAD4]";

  if (!searchAllowed) return null;

  return (
    <>
      {trigger === "bar" ? (
        <button
          type="button"
          onClick={() => setOpenTracked(true)}
          aria-label="Open global search"
          className={cn(
            "glass-inset group flex h-8 w-[8.5rem] min-w-[2.25rem] max-w-full shrink basis-[8.5rem] items-center gap-1.5 overflow-hidden rounded-xl px-2.5 text-left text-slate-500 transition-colors hover:text-[#0F766E] dark:text-zinc-400 dark:hover:text-[#2DD4BF] lg:h-9 lg:w-52 lg:basis-52 lg:gap-2 lg:px-3 xl:h-10 xl:w-60 xl:basis-60",
            className,
          )}
        >
          <Search className="h-4 w-4 shrink-0 opacity-70" strokeWidth={2} />
          <span className="min-w-0 flex-1 truncate text-[13px]">Search workspace…</span>
          <kbd className="pointer-events-none hidden h-5 shrink-0 items-center rounded-md border border-slate-200/80 bg-white/70 px-1.5 font-mono text-[10px] font-medium text-slate-400 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-500 lg:inline-flex">
            {modKey}K
          </kbd>
        </button>
      ) : null}
      {trigger === "icon" ? (
        <button
          type="button"
          onClick={() => setOpenTracked(true)}
          aria-label="Search workspace"
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/80 bg-white/70 text-slate-600 shadow-sm backdrop-blur-md transition-colors hover:text-[#0F766E] dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:text-[#2DD4BF]",
            className,
          )}
        >
          <Search className="h-4 w-4" strokeWidth={2} />
        </button>
      ) : null}

      <Dialog open={open} onOpenChange={setOpenTracked}>
        <DialogContent className="top-[max(0.75rem,env(safe-area-inset-top))] w-[calc(100%-1.25rem)] max-w-xl translate-y-0 gap-0 overflow-hidden rounded-2xl border border-white/70 bg-white/95 p-0 shadow-[0_28px_80px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95 sm:top-[16%] sm:w-full [&>button]:hidden">
          <DialogTitle className="sr-only">Global search</DialogTitle>
          <DialogDescription className="sr-only">
            Search pages, settings tabs, students, staff, and users by name, email, phone, or ID
          </DialogDescription>

          <CommandPrimitive
            shouldFilter={false}
            data-feezo-global-search=""
            className="flex flex-col overflow-hidden bg-transparent text-slate-900 dark:text-zinc-100"
          >
            <div className="flex items-center gap-2 border-b border-slate-200/80 px-3 dark:border-white/10 sm:px-3.5">
              <Search
                className="h-4 w-4 shrink-0 text-[#0F766E] dark:text-[#2DD4BF]"
                strokeWidth={2}
              />
              <CommandPrimitive.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search pages, students, staff…"
                className="h-12 min-w-0 flex-1 bg-transparent text-[16px] text-slate-900 outline-none placeholder:text-slate-500 dark:text-zinc-100 dark:placeholder:text-zinc-400 sm:text-[14px]"
                autoFocus
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="shrink-0 text-[11px] font-semibold text-slate-500 transition-colors hover:text-[#0F766E] dark:text-zinc-400 dark:hover:text-[#2DD4BF]"
                >
                  Clear
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpenTracked(false)}
                aria-label="Close search"
                className="ml-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200/90 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-white/25 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>
            </div>

            <CommandPrimitive.List className="max-h-[min(52dvh,420px)] overflow-y-auto overflow-x-hidden overscroll-contain px-1.5 py-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:max-h-[min(420px,55vh)]">
              {!hasResults ? (
                <CommandPrimitive.Empty className="px-4 py-12 text-center">
                  <p className="text-[13px] font-medium text-slate-700 dark:text-zinc-200">
                    {q ? "No matches" : "Start typing to search"}
                  </p>
                  <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">
                    {q
                      ? "Try another name, phone, email, admission no., or page"
                      : "Students, staff, users, settings tabs, and finance views"}
                  </p>
                </CommandPrimitive.Empty>
              ) : null}

              {filteredNav.length > 0 ? (
                <CommandPrimitive.Group
                  heading={q ? "Pages & tabs" : "Quick jump"}
                  className={groupClass}
                >
                  {filteredNav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandPrimitive.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => go(item.to, item.search)}
                        className={rowClass}
                      >
                        <span data-gs-icon="" className={iconBoxClass}>
                          <Icon className="h-4 w-4" strokeWidth={1.85} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div data-gs-title="" className={titleClass}>
                            {item.label}
                          </div>
                          {item.hint ? (
                            <div data-gs-meta="" className={metaClass}>
                              {item.hint}
                            </div>
                          ) : null}
                        </div>
                      </CommandPrimitive.Item>
                    );
                  })}
                </CommandPrimitive.Group>
              ) : null}

              {matchedStudents.length > 0 ? (
                <CommandPrimitive.Group heading="Students" className={groupClass}>
                  {matchedStudents.map((s) => (
                    <CommandPrimitive.Item
                      key={`stu-${s.id}`}
                      value={`stu-${s.id}`}
                      onSelect={() => go("/tenant/students", { id: s.id })}
                      className={rowClass}
                    >
                      <span
                        data-gs-icon=""
                        className={cn(
                          iconBoxClass,
                          "bg-[#0F766E]/10 text-[11px] font-semibold text-[#0F766E] dark:bg-[#2DD4BF]/15 dark:text-[#5EEAD4]",
                        )}
                      >
                        {initials(s.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div data-gs-title="" className={titleClass}>
                          {s.name}
                        </div>
                        <div data-gs-meta="" className={cn(metaClass, "font-mono text-[10.5px]")}>
                          {[s.cls, s.admissionNumber || s.id, s.phone || s.email]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                      <span data-gs-badge="" className={badgeClass}>
                        Student
                      </span>
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>
              ) : null}

              {matchedStaff.length > 0 ? (
                <CommandPrimitive.Group heading="Staff" className={groupClass}>
                  {matchedStaff.map((s) => (
                    <CommandPrimitive.Item
                      key={`stf-${s.id}`}
                      value={`stf-${s.id}`}
                      onSelect={() => go("/tenant/staff", { id: s.id })}
                      className={rowClass}
                    >
                      <span
                        data-gs-icon=""
                        className={cn(
                          iconBoxClass,
                          "bg-sky-500/10 text-[11px] font-semibold text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
                        )}
                      >
                        {initials(s.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div data-gs-title="" className={titleClass}>
                          {s.name}
                        </div>
                        <div data-gs-meta="" className={cn(metaClass, "font-mono text-[10.5px]")}>
                          {[s.role, s.dept, s.phone || s.id].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <span data-gs-badge="" className={badgeClass}>
                        Staff
                      </span>
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>
              ) : null}

              {matchedUsers.length > 0 ? (
                <CommandPrimitive.Group heading="Users" className={groupClass}>
                  {matchedUsers.map((u) => (
                    <CommandPrimitive.Item
                      key={`usr-${u.id}`}
                      value={`usr-${u.id}`}
                      onSelect={() => go("/tenant/settings", { tab: "users" })}
                      className={rowClass}
                    >
                      <span
                        data-gs-icon=""
                        className={cn(iconBoxClass, "text-[11px] font-semibold")}
                      >
                        {initials(u.displayName || u.email)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div data-gs-title="" className={titleClass}>
                          {u.displayName}
                        </div>
                        <div data-gs-meta="" className={cn(metaClass, "font-mono text-[10.5px]")}>
                          {u.email}
                        </div>
                      </div>
                      <span data-gs-badge="" className={badgeClass}>
                        User
                      </span>
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>
              ) : null}
            </CommandPrimitive.List>

            <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 bg-slate-50/90 px-3.5 py-2 text-[11px] text-slate-500 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-400">
              <span className="hidden sm:inline">↑↓ to move · ↵ to open · esc to close</span>
              <span className="sm:hidden">Tap a result to open</span>
              <span className="font-mono text-slate-600 dark:text-zinc-300">{modKey}K</span>
            </div>
          </CommandPrimitive>
        </DialogContent>
      </Dialog>
    </>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}
