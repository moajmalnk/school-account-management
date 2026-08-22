import { createFileRoute } from "@tanstack/react-router";

import { FinanceModule } from "@/components/school/SchoolAdminWorkspace";
import { useRequirePermission } from "@/hooks/useRequirePermission";
import { isFinanceTab, type FinanceTab } from "@/lib/finance-tabs";

type FinanceSearch = {
  tab?: FinanceTab;
  /** Make Payment · prefill staff salary disbursal */
  staffId?: string;
  /** Receive Payment · prefill student vehicle / fee collection */
  studentId?: string;
  amount?: string;
  /** Payroll month · YYYY-MM */
  month?: string;
};

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export const Route = createFileRoute("/tenant/finance")({
  validateSearch: (search: Record<string, unknown>): FinanceSearch => ({
    tab: isFinanceTab(search.tab) ? search.tab : undefined,
    staffId: optionalString(search.staffId),
    studentId: optionalString(search.studentId),
    amount: optionalString(search.amount),
    month:
      typeof search.month === "string" && /^\d{4}-\d{2}$/.test(search.month.trim())
        ? search.month.trim()
        : undefined,
  }),
  component: FinanceRoute,
});

function FinanceRoute() {
  useRequirePermission("finance");
  return <FinanceModule />;
}
