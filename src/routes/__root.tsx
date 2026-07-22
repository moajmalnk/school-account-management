import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter } from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6F9] px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-black">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-black">Page not found</h2>
        <p className="mt-2 text-sm text-black/55">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/85"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6F9] px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-black">This page didn't load</h1>
        <p className="mt-2 text-sm text-black/55">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/85"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-[#E5E5E5] bg-white px-5 py-2.5 text-sm font-medium text-black/75 transition-colors hover:bg-[#F4F4F5]"
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
        <Outlet />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
