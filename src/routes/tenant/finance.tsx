import { createFileRoute } from "@tanstack/react-router";

import { FinanceModule } from "@/components/school/SchoolAdminWorkspace";
import { useRequirePermission } from "@/hooks/useRequirePermission";

type FinanceSearch = {
  tab?: "receive" | "make";
};

export const Route = createFileRoute("/tenant/finance")({
  validateSearch: (search: Record<string, unknown>): FinanceSearch => ({
    tab: search.tab === "receive" || search.tab === "make" ? search.tab : undefined,
  }),
  component: FinanceRoute,
});

function FinanceRoute() {
  useRequirePermission("finance");
  return <FinanceModule />;
}
