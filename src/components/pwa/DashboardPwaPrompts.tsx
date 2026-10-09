import { useRouterState } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { useAuth } from "@/lib/auth";

const PwaInstallBanner = lazy(() =>
  import("@/components/pwa/PwaInstallBanner").then((m) => ({ default: m.PwaInstallBanner })),
);
const PwaUpdateToast = lazy(() =>
  import("@/components/pwa/PwaUpdateToast").then((m) => ({ default: m.PwaUpdateToast })),
);

const DASHBOARD_PREFIXES = ["/tenant", "/super-admin"] as const;

function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Install + update prompts belong to signed-in workspaces, never the public site. */
export function DashboardPwaPrompts() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, hydrated } = useAuth();

  if (!hydrated || !session || !isDashboardPath(pathname)) return null;

  return (
    <Suspense fallback={null}>
      <PwaInstallBanner />
      <PwaUpdateToast />
    </Suspense>
  );
}
