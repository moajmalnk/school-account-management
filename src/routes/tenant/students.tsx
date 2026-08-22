import { createFileRoute } from "@tanstack/react-router";

import { StudentsLedger } from "@/components/school/SchoolAdminWorkspace";
import { useRequirePermission } from "@/hooks/useRequirePermission";

type StudentsSearch = { id?: string };

export const Route = createFileRoute("/tenant/students")({
  validateSearch: (search: Record<string, unknown>): StudentsSearch => ({
    id: typeof search.id === "string" && search.id.length > 0 ? search.id : undefined,
  }),
  component: StudentsRoute,
});

function StudentsRoute() {
  useRequirePermission("students");
  return <StudentsLedger />;
}
