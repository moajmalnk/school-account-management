import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { WorkspacePending } from "@/components/workspace/WorkspacePending";

const ParentStudentPage = lazy(() =>
  import("./ParentStudentPage").then((m) => ({ default: m.ParentStudentPage })),
);

export const Route = createFileRoute("/parent/student/$token")({
  component: ParentStudentRoute,
});

function ParentStudentRoute() {
  return (
    <Suspense fallback={<WorkspacePending label="Opening form…" />}>
      <ParentStudentPage />
    </Suspense>
  );
}
