import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { WorkspacePending } from "@/components/workspace/WorkspacePending";
import { useRequirePermission } from "@/hooks/useRequirePermission";

const SchoolDashboard = lazy(() =>
  import("@/components/school/SchoolAdminWorkspace").then((m) => ({
    default: m.SchoolDashboard,
  })),
);
const PostSignupSupportPrompt = lazy(() =>
  import("@/components/help/PostSignupSupportPrompt").then((m) => ({
    default: m.PostSignupSupportPrompt,
  })),
);

export const Route = createFileRoute("/tenant/dashboard")({
  component: DashboardRoute,
  pendingComponent: () => (
    <WorkspacePending label="Opening dashboard…" detail="Loading school overview…" />
  ),
});

function DashboardRoute() {
  useRequirePermission("dashboard");
  return (
    <Suspense fallback={<WorkspacePending label="Opening dashboard…" />}>
      <SchoolDashboard />
      <PostSignupSupportPrompt />
    </Suspense>
  );
}
