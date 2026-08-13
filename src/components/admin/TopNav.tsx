import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Settings, UserCog } from "lucide-react";
import { toast } from "sonner";

import { ADMIN_NAV, type ViewKey } from "@/components/admin/admin-nav";
import { GlobalSearch } from "@/components/admin/GlobalSearch";
import { FeezoBrand } from "@/components/brand/FeezoBrand";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";

function deriveActive(pathname: string): ViewKey {
  const match = ADMIN_NAV.find((n) => pathname.startsWith(n.to));
  return match?.key ?? "overview";
}

export function TopNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = deriveActive(pathname);
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    const name = session?.displayName ?? "Super Admin";
    logout();
    toast.success("Signed out · session cleared", { description: `Goodbye, ${name}` });
    navigate({ to: "/login", replace: true });
  };

  const initials =
    session?.displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "SA";

  const activeLabel = ADMIN_NAV.find((n) => n.key === active)?.label ?? "Overview";

  return (
    <header className="sticky top-0 z-30 bg-[#F4F6F9]/92 px-3 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-xl sm:px-4 sm:pt-[calc(1rem+env(safe-area-inset-top))] lg:border-b lg:border-[#E5E5E5]/60 lg:bg-[#F4F6F9]/92 lg:px-6 lg:pb-3 lg:pt-[calc(1.25rem+env(safe-area-inset-top))] lg:backdrop-blur-xl">
      <div className="mobile-app-rail flex min-w-0 items-center justify-between gap-2 rounded-xl border border-white/70 bg-white/88 px-3 py-2.5 shadow-[0_14px_44px_-32px_rgba(0,0,0,0.45)] sm:gap-3 lg:mx-auto lg:max-w-[1480px] lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        <Link to="/super-admin/overview" className="flex min-w-0 shrink items-center">
          <FeezoBrand
            subtitle={activeLabel}
            markClassName="h-10 w-10"
            className="lg:hidden"
          />
          <FeezoBrand
            subtitle="Control Plane"
            markClassName="h-10 w-10"
            className="hidden lg:flex"
          />
        </Link>

        <nav className="hidden min-w-0 items-center gap-0.5 rounded-full border border-[#E5E5E5] bg-white p-1 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-12px_rgba(0,0,0,0.1)] lg:flex xl:gap-1">
          {ADMIN_NAV.map((n) => {
            const isActive = active === n.key;
            return (
              <Link
                key={n.key}
                to={n.to}
                className={`relative rounded-full px-3 py-2 text-[12.5px] font-medium transition-all xl:px-5 xl:text-[13px] ${
                  isActive ? "bg-black text-white shadow-sm" : "text-black/65 hover:text-black"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden xl:block">
            <GlobalSearch variant="field" />
          </div>
          <div className="xl:hidden">
            <GlobalSearch variant="icon" />
          </div>

          <button
            onClick={() =>
              toast("Settings drawer coming online", { description: "Module placeholder · v2.1" })
            }
            className="hidden h-10 w-10 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 transition-colors hover:bg-black hover:text-white xl:grid"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              toast("3 unread platform alerts", {
                description: "Open the notification stream from the bell icon",
              })
            }
            className="relative hidden h-10 w-10 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 transition-colors hover:bg-black hover:text-white xl:grid"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#0F766E]" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="grid h-10 w-10 place-items-center rounded-full bg-black text-[12px] font-semibold text-white transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 sm:ml-1"
                aria-label="Account menu"
              >
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-lg">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-[12px] font-semibold text-black">
                  {session?.displayName ?? "Super Admin"}
                </span>
                <span className="font-mono text-[10.5px] text-black/55">
                  {session?.email ?? "—"}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  toast("Account settings open in v2.2", {
                    description: "Profile & security pane queued",
                  })
                }
              >
                <UserCog className="mr-2 h-3.5 w-3.5" /> Account settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-[#EF4444] focus:text-[#EF4444]"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
