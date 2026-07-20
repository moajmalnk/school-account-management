import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FloatingDock, type FloatingDockItem } from "@/components/ui/floating-dock";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import {
  normalizeAcademicYearLabel,
  schoolInitials,
  useTenantStore,
  type ThemeSettings,
} from "@/lib/tenant-store";
import { cn, glassPanelClass } from "@/lib/utils";

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
  { to: "/tenant/settings", label: "Settings", icon: Settings },
];

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
  const { themeSettings, schoolDetails } = useTenantStore();
  const placement = placementProp ?? themeSettings.navPlacement ?? "Left";
  const tenantName = schoolDetails.name || session?.tenantName || "Silver Hills Global";
  const logoUrl = schoolDetails.logoUrl;
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

  const floatingItems = useMemo<FloatingDockItem[]>(
    () =>
      NAV.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.to);
        return {
          title: item.label,
          href: item.to,
          active,
          icon: (
            <Icon
              className={cn("h-full w-full", active ? "text-[#2563EB]" : "text-slate-700")}
              strokeWidth={active ? 2.35 : 2}
            />
          ),
        };
      }),
    [pathname],
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
        "relative z-40 hidden shrink-0 overflow-visible transition-[width] duration-200 md:flex",
        "sticky top-4 h-[calc(100dvh-2rem)] flex-col",
        expanded ? "w-[200px]" : "w-[76px] items-center",
        className,
      )}
      onMouseLeave={() => setHovered(null)}
    >
      <div
        className={cn(
          glassPanelClass,
          "relative z-40 flex h-full w-full flex-col overflow-visible rounded-xl border border-white/70 bg-white/55 py-3 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.35)] backdrop-blur-2xl",
          expanded ? "items-stretch px-2.5" : "items-center px-1.5",
        )}
      >
        <div
          className={cn(
            "mb-2 grid shrink-0 place-items-center overflow-hidden rounded-lg font-bold text-white shadow-md shadow-blue-900/20",
            expanded ? "mx-auto h-11 w-11 text-[11px]" : "h-10 w-10 text-[11px]",
            !logoUrl && "bg-gradient-to-br from-[#2563EB] to-[#4C69A4]",
          )}
          title={tenantName}
        >
          {logoUrl ? (
            <img src={logoUrl} alt={tenantName} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        {expanded && (
          <div className="mb-3 px-1 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
            {initials}
          </div>
        )}

        <nav
          className={cn(
            "flex min-h-0 w-full flex-1 flex-col overflow-visible",
            expanded ? "gap-1.5" : "items-center gap-0.5",
          )}
          aria-label="Primary navigation"
        >
          {NAV.map((item, index) => {
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
                    "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors",
                    active
                      ? "bg-[#2563EB]/12 text-[#0F172A] ring-1 ring-[#2563EB]/25"
                      : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/70",
                      active ? "bg-white text-[#2563EB]" : "bg-white/70 text-slate-700",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.35 : 2} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{item.label}</span>
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
                  "group relative z-10 flex h-14 w-14 shrink-0 items-center justify-center",
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
                      "grid h-11 w-11 place-items-center rounded-lg border border-white/70 bg-gradient-to-br from-white/95 to-white/70 shadow-[0_6px_18px_-10px_rgba(15,23,42,0.45)]",
                      active && "ring-2 ring-[#2563EB]/40",
                    )}
                  >
                    <Icon
                      className={cn("h-5 w-5", active ? "text-[#2563EB]" : "text-slate-700")}
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
              "mt-auto flex shrink-0 items-center justify-center gap-2 rounded-xl text-slate-500 transition-colors hover:bg-white/70 hover:text-[#2563EB]",
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
  const { academicYear, setAcademicYear, academicYears, setAcademicYears, notifications, schoolDetails } =
    useTenantStore();
  const [pendingLogout, setPendingLogout] = useState(false);
  const [addYearOpen, setAddYearOpen] = useState(false);
  const [yearDraft, setYearDraft] = useState("");
  const unreadCount = notifications.filter((n) => !n.read).length;
  const tenantName = schoolDetails.name || session?.tenantName || "Silver Hills Global";

  const confirmLogout = () => {
    const name = session?.displayName ?? "Tenant Admin";
    logout();
    toast.success("Signed out · session cleared", { description: `Goodbye, ${name}` });
    setPendingLogout(false);
    navigate({ to: "/login", replace: true });
  };

  const submitNewYear = (e: FormEvent) => {
    e.preventDefault();
    const label = normalizeAcademicYearLabel(yearDraft);
    if (!label) return;
    if (academicYears.some((y) => y.toLowerCase() === label.toLowerCase())) {
      toast.error(`${label} already exists`);
      return;
    }
    setAcademicYears((prev) => [...prev, label]);
    setAcademicYear(label);
    toast.success(`Academic year added · ${label}`, {
      description: "Set as the active academic year",
    });
    setYearDraft("");
    setAddYearOpen(false);
  };

  return (
    <>
      <header
        className={cn(
          glassPanelClass,
          "mb-5 hidden items-center justify-between gap-4 rounded-lg px-5 py-3.5 md:flex",
        )}
      >
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-bold uppercase tracking-wide text-slate-900 xl:text-[16px]">
            {tenantName}
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500">Tenant administration workspace</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="glass-inset flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold text-slate-800 transition-colors hover:bg-white/50"
              >
                <span>{academicYear}</span>
                <span className="rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-bold text-[#10B981]">
                  Active
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[11rem] rounded-lg border-white/60 bg-white/90 backdrop-blur-xl"
            >
              <DropdownMenuRadioGroup
                value={academicYear}
                onValueChange={(y) => {
                  setAcademicYear(y);
                  toast.success(`Academic year set to ${y}`);
                }}
              >
                {academicYears.map((y) => (
                  <DropdownMenuRadioItem key={y} value={y} className="rounded-md text-[13px]">
                    {y}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="rounded-md text-[13px]"
                onSelect={() => {
                  setYearDraft("");
                  setAddYearOpen(true);
                }}
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add academic year
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => navigate({ to: "/tenant/settings" })}
            aria-label="Settings"
            className="glass-inset grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition-colors hover:text-[#2563EB]"
          >
            <Settings className="h-[18px] w-[18px]" />
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: "/tenant/notifications" })}
            aria-label="Notifications"
            className="glass-inset relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition-colors hover:text-[#2563EB]"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-[#2563EB]" />
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
          if (!open) setYearDraft("");
        }}
      >
        <DialogContent className="max-w-sm rounded-xl border border-white/60 bg-white/90 p-6 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-slate-900">
              Add Academic Year
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-slate-500">
              Enter a year range such as 2027-28. It will be normalized to AY format and set active.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitNewYear} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="header-academic-year" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Academic Year
              </Label>
              <Input
                id="header-academic-year"
                value={yearDraft}
                onChange={(e) => setYearDraft(e.target.value)}
                placeholder="e.g. 2027-28"
                autoFocus
              />
            </div>
            <DialogFooter className="flex-row justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddYearOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
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
