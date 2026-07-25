import { createFileRoute } from "@tanstack/react-router";

import { StaffRoster } from "@/components/school/SchoolAdminWorkspace";
import { useRequirePermission } from "@/hooks/useRequirePermission";

type StaffSearch = { id?: string; edit?: string };

export const Route = createFileRoute("/tenant/staff")({
  validateSearch: (search: Record<string, unknown>): StaffSearch => ({
    id: typeof search.id === "string" && search.id.length > 0 ? search.id : undefined,
    edit: search.edit === "1" ? "1" : undefined,
  }),
  component: StaffRoute,
});

function StaffRoute() {
  useRequirePermission("staff");
  return <StaffRoster />;
}
