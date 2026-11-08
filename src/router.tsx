import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import "./file-routes";
import { routeTree } from "./routeTree.gen";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

export const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
  /**
   * Do not flash the workspace skeleton on marketing pages — that wipes the
   * early HTML hero and tanks LCP. Tenant routes set their own pending UI.
   */
  defaultPendingMs: 1000,
  defaultPendingMinMs: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
