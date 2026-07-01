import { createFileRoute } from "@tanstack/react-router";

import { SchoolDashboard } from "@/components/school/SchoolAdminWorkspace";

export const Route = createFileRoute("/tenant/dashboard")({
  component: SchoolDashboard,
});
