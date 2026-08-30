import { createFileRoute } from "@tanstack/react-router";

import { StaffRoster } from "@/components/school/SchoolAdminWorkspace";
import { isStaffProfileTab, type StaffProfileTabId } from "@/components/school/ProfileDetailTabs";
import { useRequirePermission } from "@/hooks/useRequirePermission";

export type StaffSearch = {
  id?: string;
  tab?: StaffProfileTabId;
};

export const Route = createFileRoute("/tenant/staff")({
  validateSearch: (search: Record<string, unknown>): StaffSearch => ({
    id: typeof search.id === "string" && search.id.length > 0 ? search.id : undefined,
    tab: isStaffProfileTab(search.tab) ? search.tab : undefined,
  }),
  component: StaffRoute,
});

function StaffRoute() {
  useRequirePermission("staff");
  return <StaffRoster />;
}
