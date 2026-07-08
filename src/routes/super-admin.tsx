import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { ADMIN_NAV } from "@/components/admin/admin-nav";
import { TopNav } from "@/components/admin/TopNav";
import {
  MobileTabBar,
  mobileMainPadding,
  type MobileTabItem,
} from "@/components/layout/MobileTabBar";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/super-admin")({
  component: SuperAdminLayout,
});

const MOBILE_TABS: MobileTabItem[] = ADMIN_NAV.map((n) => ({
  to: n.to,
  label: n.shortLabel,
  icon: n.icon,
  match: (pathname) => pathname.startsWith(n.to),
}));

function SuperAdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, hydrated } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (!session || session.role !== "super_admin") {
      navigate({ to: "/login", replace: true });
    }
  }, [hydrated, session, navigate]);

  if (!hydrated || !session || session.role !== "super_admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F6F9]">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-black/45">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-black/45" />
          Validating control-plane session…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F4F6F9] text-black">
      <TopNav />
      <main
        className={`mobile-app-rail px-3 pb-6 pt-4 sm:px-4 sm:pt-6 lg:mx-auto lg:max-w-[1480px] lg:px-6 lg:pb-24 lg:pt-8 ${mobileMainPadding}`}
      >
        <Outlet />
      </main>
      <MobileTabBar items={MOBILE_TABS} pathname={pathname} />
    </div>
  );
}
