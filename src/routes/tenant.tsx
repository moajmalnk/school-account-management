import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowUpRight,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { TenantStoreProvider } from "@/lib/tenant-store";

export const Route = createFileRoute("/tenant")({
  component: TenantLayout,
});

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

function TenantLayout() {
  const navigate = useNavigate();
  const { session, hydrated } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (!session || session.role !== "school_admin") {
      navigate({ to: "/login", replace: true });
    }
  }, [hydrated, session, navigate]);

  if (!hydrated || !session || session.role !== "school_admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAEAEA]">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-black/45">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-black/45" />
          Validating tenant session…
        </div>
      </div>
    );
  }

  return (
    <TenantStoreProvider>
      <div className="min-h-screen bg-[#EAEAEA] text-black">
        <div className="flex gap-6 p-6">
          <TenantSidebar />
          <main className="min-w-0 flex-1 pb-12">
            <Outlet />
          </main>
        </div>
      </div>
    </TenantStoreProvider>
  );
}

function TenantSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  const handleLogout = () => {
    const name = session?.displayName ?? "Tenant Admin";
    logout();
    toast.success("Signed out · session cleared", { description: `Goodbye, ${name}` });
    navigate({ to: "/login", replace: true });
  };

  return (
    <aside className="sticky top-6 flex h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-[2rem] border border-[#E5E5E5] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-32px_rgba(0,0,0,0.18)]">
      <div className="mb-5 flex items-center gap-2.5 px-2 pt-1">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-black text-sm font-bold text-white">
          SH
        </div>
        <div className="leading-tight">
          <div className="text-[14px] font-semibold text-black">
            {session?.tenantName ?? "Silver Hills Global"}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-black/45">Tenant Workspace</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13.5px] font-medium transition-colors ${
                active
                  ? "bg-[#C7F33C] text-black shadow-sm"
                  : "text-black/70 hover:bg-[#F4F4F5] hover:text-black"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{n.label}</span>
              {active && <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[#F4F4F5] p-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold text-black">
            {session?.displayName ?? "Tenant Admin"}
          </div>
          <div className="mt-0.5 truncate font-mono text-[10px] text-black/55">
            {session?.email ?? "silverhills@tenant.com"}
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-black/65 transition-colors hover:bg-[#FEE2E2] hover:text-[#B91C1C]"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
