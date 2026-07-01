import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EAEAEA] px-4">
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
    <div className="flex min-h-screen items-center justify-center bg-[#EAEAEA] px-4">
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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "School Admin Console" },
      {
        name: "description",
        content:
          "School Admin Console is a multi-tenant SaaS platform for managing educational institutions.",
      },
      { property: "og:title", content: "School Admin Console" },
      {
        property: "og:description",
        content:
          "School Admin Console is a multi-tenant SaaS platform for managing educational institutions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "School Admin Console" },
      {
        name: "twitter:description",
        content:
          "School Admin Console is a multi-tenant SaaS platform for managing educational institutions.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster
          position="bottom-center"
          richColors
          closeButton
          expand
          offset={28}
          gap={12}
          visibleToasts={4}
          duration={4500}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
