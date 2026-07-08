import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useTenantStore } from "@/lib/tenant-store";
import { cn, glassNavTileClass, glassPanelClass } from "@/lib/utils";

type NavEntry = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  section: "workspace" | "operations";
};

const NAV: NavEntry[] = [
  { to: "/tenant/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "workspace" },
  { to: "/tenant/students", label: "Students", icon: Users, section: "workspace" },
  { to: "/tenant/staff", label: "Staff", icon: UserCog, section: "workspace" },
  { to: "/tenant/finance", label: "Finance", icon: Wallet, section: "operations" },
  { to: "/tenant/settings", label: "Settings", icon: Settings, section: "operations" },
];

const SECTIONS = [
  { key: "workspace" as const, label: "Student Management" },
  { key: "operations" as const, label: "Operations" },
];

export function TenantGlassSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session } = useAuth();
  const tenantName = session?.tenantName ?? "Silver Hills Global";
  const initials = tenantName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={cn(
        glassPanelClass,
        "sticky top-4 hidden h-[calc(100dvh-2rem)] w-[220px] shrink-0 flex-col overflow-hidden p-4 md:flex xl:w-[240px]",
      )}
    >
      <div className="mb-5 flex flex-col items-center gap-2 px-1 pt-1 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#4C69A4] text-sm font-bold text-white shadow-lg shadow-blue-900/20">
          {initials}
        </div>
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700">
          {initials}
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto mobile-scrollbar-none">
        {SECTIONS.map((section) => (
          <div key={section.key}>
            <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {section.label}
            </div>
            <div className="flex flex-col gap-2">
              {NAV.filter((n) => n.section === section.key).map((n) => {
                const Icon = n.icon;
                const active = pathname.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={cn(
                      glassNavTileClass,
                      "flex min-h-[52px] w-full items-center gap-3 px-3 py-2.5",
                      active && "glass-nav-tile-active",
                    )}
                  >
                    <div
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                        active ? "bg-white/70" : "bg-white/45",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px]",
                          active ? "text-[#2563EB]" : "text-slate-600",
                        )}
                        strokeWidth={active ? 2.25 : 2}
                      />
                    </div>
                    <span
                      className={cn(
                        "min-w-0 flex-1 text-[12px] font-semibold leading-tight",
                        active ? "text-[#0F172A]" : "text-slate-600",
                      )}
                    >
                      {n.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function TenantDesktopTopBar() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const { academicYear, notifications } = useTenantStore();
  const [pendingLogout, setPendingLogout] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const tenantName = session?.tenantName ?? "Silver Hills Global";

  const confirmLogout = () => {
    const name = session?.displayName ?? "Tenant Admin";
    logout();
    toast.success("Signed out · session cleared", { description: `Goodbye, ${name}` });
    setPendingLogout(false);
    navigate({ to: "/login", replace: true });
  };

  return (
    <>
      <header
        className={cn(
          glassPanelClass,
          "mb-5 hidden items-center justify-between gap-4 rounded-2xl px-5 py-3.5 md:flex",
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
                className="glass-inset flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold text-slate-800 transition-colors hover:bg-white/50"
              >
                <span>{academicYear}</span>
                <span className="rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-bold text-[#10B981]">
                  Active
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl border-white/60 bg-white/90 backdrop-blur-xl">
              <DropdownMenuItem className="rounded-xl text-[13px]">{academicYear}</DropdownMenuItem>
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

      <Dialog open={pendingLogout} onOpenChange={setPendingLogout}>
        <DialogContent className="max-w-sm rounded-[1.5rem] border border-white/60 bg-white/90 p-6 backdrop-blur-xl">
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
