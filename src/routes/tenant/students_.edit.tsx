import { createFileRoute } from "@tanstack/react-router";

import { StudentEditPage } from "@/components/school/StudentEditPage";
import { useRequirePermission } from "@/hooks/useRequirePermission";

type EditSearch = { id?: string };

export const Route = createFileRoute("/tenant/students_/edit")({
  validateSearch: (search: Record<string, unknown>): EditSearch => ({
    id: typeof search.id === "string" && search.id.length > 0 ? search.id : undefined,
  }),
  component: EditStudentRoute,
});

function EditStudentRoute() {
  useRequirePermission("students");
  return <StudentEditPage />;
}
