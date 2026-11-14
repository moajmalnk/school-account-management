import { createFileRoute } from "@tanstack/react-router";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PricingPage } from "@/components/marketing/pages/PricingPage";
import "@/file-routes";

export const Route = createFileRoute("/pricing")({
  component: PricingRoute,
});

function PricingRoute() {
  return (
    <MarketingShell>
      <PricingPage />
    </MarketingShell>
  );
}
