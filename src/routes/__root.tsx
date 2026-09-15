import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { PwaInstallBanner } from "@/components/pwa/PwaInstallBanner";
import { PwaUpdateToast } from "@/components/pwa/PwaUpdateToast";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { PwaProvider } from "@/lib/pwa";
import { applyWorkspaceThemeMode, peekStoredThemeMode } from "@/lib/tenant-store";

function useStoredColorScheme() {
  useEffect(() => {
    applyWorkspaceThemeMode(peekStoredThemeMode());
  }, []);
}

function NotFoundComponent() {
  useStoredColorScheme();
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 dark:bg-zinc-950">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-zinc-950 dark:text-zinc-50">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-zinc-950 dark:text-zinc-50">Page not found</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          >
            Go home
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PwaProvider>
          <Outlet />
          <PwaInstallBanner />
          <PwaUpdateToast />
          <Toaster />
        </PwaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
