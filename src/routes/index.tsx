import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { MOCK_CREDENTIALS, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();
  const { session, hydrated } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (session) {
      navigate({ to: MOCK_CREDENTIALS[session.role].redirect, replace: true });
    } else {
      navigate({ to: "/login", replace: true });
    }
  }, [hydrated, session, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6F9]">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-black/45">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-black/45" />
        Routing session…
      </div>
    </div>
  );
}
