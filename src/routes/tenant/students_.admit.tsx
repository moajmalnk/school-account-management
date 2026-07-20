import { createFileRoute } from "@tanstack/react-router";

import { AdmitStudentPage } from "@/components/school/SchoolAdminWorkspace";

export const Route = createFileRoute("/tenant/students_/admit")({
  component: AdmitStudentPage,
});
