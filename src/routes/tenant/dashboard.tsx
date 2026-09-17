import { createFileRoute } from "@tanstack/react-router";

import { SchoolDashboard } from "@/components/school/SchoolAdminWorkspace";
import { WorkspaceOpeningScreen } from "@/components/school/TenantDirectorySkeleton";
import { useRequirePermission } from "@/hooks/useRequirePermission";

export const Route = createFileRoute("/tenant/dashboard")({
  component: DashboardRoute,
  pendingComponent: () => (
    <WorkspaceOpeningScreen label="Opening dashboard" detail="Loading school overview…" />
  ),
});

function DashboardRoute() {
  useRequirePermission("dashboard");
  return <SchoolDashboard />;
}
