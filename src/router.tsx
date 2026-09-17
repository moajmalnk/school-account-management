import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import { WorkspaceOpeningScreen } from "@/components/school/TenantDirectorySkeleton";
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
  /** Show opening UI immediately while route chunks (SchoolAdminWorkspace) load. */
  defaultPendingMs: 0,
  defaultPendingMinMs: 180,
  defaultPendingComponent: () => (
    <WorkspaceOpeningScreen
      label="Opening workspace"
      detail="Loading this section…"
    />
  ),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
