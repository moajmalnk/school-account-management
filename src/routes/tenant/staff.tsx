import { createFileRoute } from "@tanstack/react-router";

import { StaffRoster } from "@/components/school/SchoolAdminWorkspace";

export const Route = createFileRoute("/tenant/staff")({
  component: StaffRoster,
});
