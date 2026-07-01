import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { TopNav } from "@/components/admin/TopNav";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/super-admin")({
  component: SuperAdminLayout,
});

function SuperAdminLayout() {
  const navigate = useNavigate();
  const { session, hydrated } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (!session || session.role !== "super_admin") {
      navigate({ to: "/login", replace: true });
    }
  }, [hydrated, session, navigate]);

  if (!hydrated || !session || session.role !== "super_admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAEAEA]">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-black/45">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-black/45" />
          Validating control-plane session…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EAEAEA] text-black">
      <TopNav />
      <main className="mx-auto max-w-[1480px] px-6 pb-24 pt-8">
        <Outlet />
      </main>
    </div>
  );
}
