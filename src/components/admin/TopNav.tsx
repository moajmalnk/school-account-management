import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Search, Settings, LogOut, UserCog } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";

export type ViewKey = "overview" | "tenants" | "plans" | "audits";

type NavEntry = { key: ViewKey; label: string; to: string };

const NAV: NavEntry[] = [
  { key: "overview", label: "Overview", to: "/super-admin/overview" },
  { key: "tenants", label: "Tenants", to: "/super-admin/tenants" },
  { key: "plans", label: "Plans", to: "/super-admin/plans" },
  { key: "audits", label: "Audits", to: "/super-admin/audits" },
];

function deriveActive(pathname: string): ViewKey {
  const match = NAV.find((n) => pathname.startsWith(n.to));
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

  return (
    <header className="sticky top-0 z-30 px-6 pt-6">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4">
        <Link to="/super-admin/overview" className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-black text-sm font-bold text-white">
            S
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold text-black">School Accounts</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-black/45">
              Control Plane
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 rounded-full border border-[#E5E5E5] bg-white p-1 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-12px_rgba(0,0,0,0.1)]">
          {NAV.map((n) => {
            const isActive = active === n.key;
            return (
              <Link
                key={n.key}
                to={n.to}
                className={`relative rounded-full px-5 py-2 text-[13px] font-medium transition-all ${
                  isActive ? "bg-black text-white shadow-sm" : "text-black/65 hover:text-black"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/40" />
            <Input
              placeholder="Search…"
              className="h-10 w-56 rounded-full border-[#E5E5E5] bg-white pl-9 text-[13px] placeholder:text-black/35"
            />
          </div>

          <button
            onClick={() =>
              toast("Settings drawer coming online", { description: "Module placeholder · v2.1" })
            }
            className="grid h-10 w-10 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 transition-colors hover:bg-black hover:text-white"
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
            className="relative grid h-10 w-10 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 transition-colors hover:bg-black hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#C7F33C]" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="ml-1 grid h-10 w-10 place-items-center rounded-full bg-black text-[12px] font-semibold text-white transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                aria-label="Account menu"
              >
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-2xl">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-[12px] font-semibold text-black">
                  {session?.displayName ?? "Super Admin"}
                </span>
                <span className="font-mono text-[10.5px] text-black/55">
                  {session?.email ?? "superadmin@saas.com"}
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
                className="text-[#B91C1C] focus:text-[#B91C1C]"
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
