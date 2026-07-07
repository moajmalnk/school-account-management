import { createFileRoute } from "@tanstack/react-router";

import { FinanceModule } from "@/components/school/SchoolAdminWorkspace";

type FinanceSearch = {
  tab?: "receive";
};

export const Route = createFileRoute("/tenant/finance")({
  validateSearch: (search: Record<string, unknown>): FinanceSearch => ({
    tab: search.tab === "receive" ? "receive" : undefined,
  }),
  component: FinanceModule,
});
