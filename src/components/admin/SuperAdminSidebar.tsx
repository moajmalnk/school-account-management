import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  ClipboardList,
  Code2,
  LayoutDashboard,
  LogOut,
  Receipt,
  Search,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";

type NavEntry = {
  to: string;
  label: string;
  helper: string;
  icon: typeof LayoutDashboard;
};

const NAV: NavEntry[] = [
  {
    to: "/super-admin/overview",
    label: "Overview",
    helper: "Platform pulse",
    icon: LayoutDashboard,
  },
  {
    to: "/super-admin/tenants",
    label: "Tenant Management",
    helper: "Provisioning",
    icon: Building2,
  },
  {
    to: "/super-admin/plans",
    label: "Subscription Plans",
    helper: "Billing matrix",
    icon: Receipt,
  },
  { to: "/super-admin/audits", label: "System Audits", helper: "Trace logs", icon: ClipboardList },
];

export function SuperAdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const initials =
    session?.displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "SA";

  const handleLogout = () => {
    const name = session?.displayName ?? "Super Admin";
    logout();
    toast.success("Signed out · session cleared", { description: `Goodbye, ${name}` });
    navigate({ to: "/login", replace: true });
  };

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <div
          className="grid h-9 w-9 place-items-center rounded-lg text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg,#10B981,#6366F1)" }}
        >
          S
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-slate-900">School Accounts</div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Control Plane
          </div>
        </div>
      </div>

      <div className="mx-3 mb-3 flex items-center gap-1.5 rounded-md border border-slate-200/70 bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-500">
        <Code2 className="h-3 w-3" />
        <span>[Stitch: control_plane_v2]</span>
      </div>

      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search tenants, invoices…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-8 pr-2 text-[12.5px] placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                toast(`Search "${e.currentTarget.value}"`, {
                  description: "Search index will surface in v2.2",
                });
              }
            }}
          />
        </div>
      </div>

      <div className="px-3 pb-1 font-mono text-[9.5px] uppercase tracking-wider text-slate-400">
        Workspace
      </div>
      <nav className="flex-1 overflow-y-auto px-2">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`mb-1 flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                active ? "text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
              style={active ? { backgroundColor: "#0F172A" } : undefined}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1 leading-tight">
                <span className="block">{n.label}</span>
                <span
                  className={`block text-[10.5px] font-normal ${
                    active ? "text-slate-300" : "text-slate-400"
                  }`}
                >
                  {n.helper}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-2 pt-3 font-mono text-[9.5px] uppercase tracking-wider text-slate-400">
        Utilities
      </div>
      <div className="mx-2 mb-2 flex items-center gap-1.5">
        <UtilityButton
          icon={Settings}
          label="Settings"
          onClick={() =>
            toast("Settings drawer coming online", { description: "Module placeholder · v2.1" })
          }
        />
        <UtilityButton
          icon={Bell}
          label="Notifications"
          badge={3}
          onClick={() =>
            toast("3 unread platform alerts", {
              description: "Open the notification stream from the bell icon",
            })
          }
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="group m-2 mb-3 mt-1 flex items-center gap-2.5 rounded-lg border border-slate-200/70 bg-slate-50/80 px-2.5 py-2 text-left transition-colors hover:border-slate-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
            aria-label="Account menu"
          >
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#6366F1,#0F172A)" }}
            >
              {initials}
            </span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-[12.5px] font-semibold text-slate-900">
                {session?.displayName ?? "Super Admin"}
              </span>
              <span className="truncate font-mono text-[10px] text-slate-500">
                {session?.email ?? "superadmin@saas.com"}
              </span>
            </span>
            <span className="font-mono text-[10px] text-slate-400 group-hover:text-slate-600">
              ⌘K
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-60">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-[12px] font-semibold text-slate-900">
              {session?.displayName ?? "Super Admin"}
            </span>
            <span className="font-mono text-[10.5px] text-slate-500">
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
            <Settings className="mr-2 h-3.5 w-3.5" /> Account settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-rose-600 focus:text-rose-600">
            <LogOut className="mr-2 h-3.5 w-3.5" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </aside>
  );
}

function UtilityButton({
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  icon: typeof Settings;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="relative flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200/70 bg-white py-2 text-[11px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <span
          className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 font-mono text-[9px] font-semibold text-white"
          style={{ backgroundColor: "#F59E0B" }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
