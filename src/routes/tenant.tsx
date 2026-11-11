import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect } from "react";

import { WorkspacePending } from "@/components/workspace/WorkspacePending";
import { applyNoindex } from "@/lib/seo/public-pages";

const TenantLayoutApp = lazy(() =>
  import("./TenantLayoutApp").then((m) => ({ default: m.TenantLayoutApp })),
);

export const Route = createFileRoute("/tenant")({
  component: TenantLayoutRoute,
  pendingComponent: WorkspacePending,
});

function TenantLayoutRoute() {
  useEffect(() => {
    applyNoindex();
  }, []);

  return (
    <Suspense fallback={<WorkspacePending />}>
      <TenantLayoutApp />
    </Suspense>
  );
}
