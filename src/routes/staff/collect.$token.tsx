import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { WorkspacePending } from "@/components/workspace/WorkspacePending";

const StaffCollectPage = lazy(() =>
  import("./StaffCollectPage").then((m) => ({ default: m.StaffCollectPage })),
);

export const Route = createFileRoute("/staff/collect/$token")({
  component: StaffCollectRoute,
});

function StaffCollectRoute() {
  return (
    <Suspense fallback={<WorkspacePending label="Opening form…" />}>
      <StaffCollectPage />
    </Suspense>
  );
}
