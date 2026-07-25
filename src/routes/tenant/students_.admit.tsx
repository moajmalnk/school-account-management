import { createFileRoute } from "@tanstack/react-router";

import { AdmitStudentPage } from "@/components/school/SchoolAdminWorkspace";
import { useRequirePermission } from "@/hooks/useRequirePermission";

export const Route = createFileRoute("/tenant/students_/admit")({
  component: AdmitRoute,
});

function AdmitRoute() {
  useRequirePermission("students");
  return <AdmitStudentPage />;
}
