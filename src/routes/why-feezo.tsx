import { createFileRoute } from "@tanstack/react-router";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import { WhyFeezoPage } from "@/components/marketing/pages/WhyFeezoPage";
import "@/file-routes";

export const Route = createFileRoute("/why-feezo")({
  component: WhyFeezoRoute,
});

function WhyFeezoRoute() {
  return (
    <MarketingShell>
      <WhyFeezoPage />
    </MarketingShell>
  );
}
