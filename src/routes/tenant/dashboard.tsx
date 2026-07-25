import { createFileRoute } from "@tanstack/react-router";

import { SchoolDashboard } from "@/components/school/SchoolAdminWorkspace";
import { useRequirePermission } from "@/hooks/useRequirePermission";

export const Route = createFileRoute("/tenant/dashboard")({
  component: DashboardRoute,
});

function DashboardRoute() {
  useRequirePermission("dashboard");
  return <SchoolDashboard />;
}
