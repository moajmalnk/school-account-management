import { createFileRoute } from "@tanstack/react-router";

import { StaffEditPage } from "@/components/school/StaffEditPage";
import { useRequirePermission } from "@/hooks/useRequirePermission";

type EditSearch = { id?: string };

export const Route = createFileRoute("/tenant/staff_/edit")({
  validateSearch: (search: Record<string, unknown>): EditSearch => ({
    id: typeof search.id === "string" && search.id.length > 0 ? search.id : undefined,
  }),
  component: EditStaffRoute,
});

function EditStaffRoute() {
  useRequirePermission("staff");
  return <StaffEditPage />;
}
