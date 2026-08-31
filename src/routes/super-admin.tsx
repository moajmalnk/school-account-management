import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { ADMIN_NAV } from "@/components/admin/admin-nav";
import { TenantsViewSkeleton } from "@/components/admin/TenantsViewSkeleton";
import { TopNav } from "@/components/admin/TopNav";
import {
  MobileTabBar,
  mobileMainPadding,
  type MobileTabItem,
} from "@/components/layout/MobileTabBar";
import { Skeleton } from "@/components/ui/skeleton";
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

function TopNavSkeleton() {
  return (
    <header className="sticky top-0 z-30 bg-[#F4F6F9]/92 px-3 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-xl sm:px-4 sm:pt-[calc(1rem+env(safe-area-inset-top))] lg:border-b lg:border-[#E5E5E5]/60 lg:bg-[#F4F6F9]/92 lg:px-6 lg:pb-3 lg:pt-[calc(1.25rem+env(safe-area-inset-top))] lg:backdrop-blur-xl">
      <div className="mobile-app-rail flex min-w-0 items-center justify-between gap-2 rounded-xl border border-white/70 bg-white/88 px-3 py-2.5 shadow-[0_14px_44px_-32px_rgba(0,0,0,0.45)] sm:gap-3 lg:mx-auto lg:max-w-[1480px] lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        <div className="flex min-w-0 shrink items-center gap-2.5">
          <Skeleton className="h-10 w-10 shrink-0 rounded-2xl bg-black/10" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28 rounded-md bg-black/[0.07]" />
            <Skeleton className="h-2.5 w-20 rounded-md bg-black/[0.05]" />
          </div>
        </div>
        <div className="hidden items-center gap-0.5 rounded-full border border-[#E5E5E5] bg-white p-1 lg:flex xl:gap-1">
          {Array.from({ length: ADMIN_NAV.length }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-9 rounded-full bg-black/[0.06] ${i === 1 ? "w-16 xl:w-20" : "w-14 xl:w-16"}`}
            />
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Skeleton className="hidden h-10 w-56 rounded-full bg-black/[0.06] xl:block" />
          <Skeleton className="h-10 w-10 rounded-full bg-black/[0.06] xl:hidden" />
          <Skeleton className="hidden h-10 w-10 rounded-full bg-black/[0.06] xl:block" />
          <Skeleton className="hidden h-10 w-10 rounded-full bg-black/[0.06] xl:block" />
          <Skeleton className="h-10 w-10 rounded-full bg-black/10" />
        </div>
      </div>
    </header>
  );
}

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

  if (!hydrated) {
    return (
      <div
        className="min-h-dvh bg-[#F4F6F9] text-black"
        aria-busy="true"
        aria-label="Loading control plane"
      >
        <TopNavSkeleton />
        <main
          className={`mobile-app-rail min-w-0 px-3 pb-6 pt-4 sm:px-4 sm:pt-6 lg:mx-auto lg:max-w-[1480px] lg:px-6 lg:pb-24 lg:pt-8 ${mobileMainPadding}`}
        >
          {pathname.startsWith("/super-admin/tenants") ? (
            <TenantsViewSkeleton />
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-8 w-56 rounded-lg bg-black/[0.07]" />
                <Skeleton className="h-3.5 w-72 max-w-full rounded-md bg-black/[0.05]" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-[1.75rem] bg-black/[0.05]" />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (!session || session.role !== "super_admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F6F9]">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-black/45">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-black/45" />
          Redirecting to sign in…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F4F6F9] text-black">
      <TopNav />
      <main
        className={`mobile-app-rail min-w-0 px-3 pb-6 pt-4 sm:px-4 sm:pt-6 lg:mx-auto lg:max-w-[1480px] lg:px-6 lg:pb-24 lg:pt-8 ${mobileMainPadding}`}
      >
        <Outlet />
      </main>
      <MobileTabBar items={MOBILE_TABS} pathname={pathname} />
    </div>
  );
}
