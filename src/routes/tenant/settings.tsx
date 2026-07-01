import { createFileRoute } from "@tanstack/react-router";

import { SchoolSettings } from "@/components/school/SchoolAdminWorkspace";

export const Route = createFileRoute("/tenant/settings")({
  component: SchoolSettings,
});
