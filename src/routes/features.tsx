import { createFileRoute } from "@tanstack/react-router";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import { FeaturesPage } from "@/components/marketing/pages/FeaturesPage";
import "@/file-routes";

export const Route = createFileRoute("/features")({
  component: FeaturesRoute,
});

function FeaturesRoute() {
  return (
    <MarketingShell>
      <FeaturesPage />
    </MarketingShell>
  );
}
