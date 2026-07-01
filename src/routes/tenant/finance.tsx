import { createFileRoute } from "@tanstack/react-router";

import { FinanceModule } from "@/components/school/SchoolAdminWorkspace";

export const Route = createFileRoute("/tenant/finance")({
  component: FinanceModule,
});
