import { createFileRoute } from "@tanstack/react-router";

import { StudentsLedger } from "@/components/school/SchoolAdminWorkspace";
import {
  isStudentProfileTab,
  type StudentProfileTabId,
} from "@/components/school/ProfileDetailTabs";
import { useRequirePermission } from "@/hooks/useRequirePermission";

export type StudentsSearch = {
  id?: string;
  tab?: StudentProfileTabId;
};

export const Route = createFileRoute("/tenant/students")({
  validateSearch: (search: Record<string, unknown>): StudentsSearch => ({
    id: typeof search.id === "string" && search.id.length > 0 ? search.id : undefined,
    tab: isStudentProfileTab(search.tab) ? search.tab : undefined,
  }),
  component: StudentsRoute,
});

function StudentsRoute() {
  useRequirePermission("students");
  return <StudentsLedger />;
}
