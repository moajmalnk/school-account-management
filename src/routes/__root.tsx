import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

import { DashboardPwaPrompts } from "@/components/pwa/DashboardPwaPrompts";
import {
  isPublicIndexablePath,
  PublicPageFallback,
} from "@/components/seo/PublicPageFallback";
import { AuthProvider } from "@/lib/auth";
import { dismissBootShell } from "@/lib/boot-shell";
import { LocaleProvider } from "@/lib/locale/LocaleProvider";
import { OrgCurrencyBridge } from "@/lib/locale/OrgCurrencyBridge";
import { PwaProvider } from "@/lib/pwa";
import { installCheckoutReturn } from "@/lib/cashfree-checkout";
import { applyWorkspaceThemeMode, peekStoredThemeMode } from "@/lib/workspace-theme";

installCheckoutReturn();

const Toaster = lazy(() =>
  import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })),
);

function useStoredColorScheme() {
  useEffect(() => {
    applyWorkspaceThemeMode(peekStoredThemeMode());
  }, []);
}

/** Keep sonner off the marketing LCP/TBT path. */
function DeferredToaster() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const marketing = Boolean(
      (window as Window & { __feezoIsMarketingHome?: boolean }).__feezoIsMarketingHome,
    );
    if (!marketing) {
      setReady(true);
      return;
    }
    const timer = window.setTimeout(() => setReady(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <Toaster />
    </Suspense>
  );
}

function NotFoundComponent() {
  useStoredColorScheme();
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 dark:bg-zinc-950">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-zinc-950 dark:text-zinc-50">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          That URL is not part of Feezo. Head home or start a free trial.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          >
            Go to homepage
          </Link>
          <Link
            to="/signup/$step"
            params={{ step: "school" }}
            className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            Start 14-day trial
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  useStoredColorScheme();
  console.error(error);
  const router = useRouter();
  const pathname = typeof window === "undefined" ? "/" : window.location.pathname;
  const isPublic = isPublicIndexablePath(pathname);

  useEffect(() => {
    if (!isPublic) return;
    try {
      const key = `feezo-public-retry:${pathname}`;
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      return;
    }
    router.invalidate();
    reset();
  }, [isPublic, pathname, reset, router]);

  if (isPublic) {
    return <PublicPageFallback pathname={pathname} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 dark:bg-zinc-950">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        {import.meta.env.DEV && error?.message ? (
          <p className="mt-3 break-words rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-[11px] text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
            {error.message}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function BootShellGuard() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (pathname === "/" || pathname === "/index.html") return;
    dismissBootShell();
  }, [pathname]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocaleProvider>
          <OrgCurrencyBridge />
          <PwaProvider>
            <BootShellGuard />
            <Outlet />
            <DashboardPwaPrompts />
            <DeferredToaster />
          </PwaProvider>
        </LocaleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
