import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { WorkspacePending } from "@/components/workspace/WorkspacePending";

const TenantLayoutApp = lazy(() =>
  import("./TenantLayoutApp").then((m) => ({ default: m.TenantLayoutApp })),
);

export const Route = createFileRoute("/tenant")({
  component: TenantLayoutRoute,
  pendingComponent: WorkspacePending,
});

function TenantLayoutRoute() {
  return (
    <Suspense fallback={<WorkspacePending />}>
      <TenantLayoutApp />
    </Suspense>
  );
}
