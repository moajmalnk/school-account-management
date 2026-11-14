import { createFileRoute } from "@tanstack/react-router";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import { SetupPage } from "@/components/marketing/pages/SetupPage";
import "@/file-routes";

export const Route = createFileRoute("/setup")({
  component: SetupRoute,
});

function SetupRoute() {
  return (
    <MarketingShell>
      <SetupPage />
    </MarketingShell>
  );
}
