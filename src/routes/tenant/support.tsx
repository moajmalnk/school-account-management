import { createFileRoute } from "@tanstack/react-router";

import { HelpCenter } from "@/components/help/HelpCenter";

type SupportSearch = {
  /** Open a guide by id */
  guide?: string;
  /** Prefill the search box */
  q?: string;
};

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 120) : undefined;
}

export const Route = createFileRoute("/tenant/support")({
  validateSearch: (search: Record<string, unknown>): SupportSearch => ({
    guide: optionalString(search.guide),
    q: optionalString(search.q),
  }),
  component: SupportRoute,
});

function SupportRoute() {
  return <HelpCenter />;
}
