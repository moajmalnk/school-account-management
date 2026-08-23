import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { MarketingLanding } from "@/components/marketing/MarketingLanding";
import { homePathForSession, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const navigate = useNavigate();
  const { session, hydrated } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (session) {
      navigate({ to: homePathForSession(session), replace: true });
    }
  }, [hydrated, session, navigate]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-black/45">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--mkt-green,#8FCA4A)]" />
          Loading…
        </div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-black/45">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-black/45" />
          Opening workspace…
        </div>
      </div>
    );
  }

  return <MarketingLanding />;
}
