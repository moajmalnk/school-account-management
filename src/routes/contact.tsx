import { createFileRoute } from "@tanstack/react-router";

import { ContactPage } from "@/components/marketing/ContactPage";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const Route = createFileRoute("/contact")({
  component: ContactRoute,
});

function ContactRoute() {
  return (
    <MarketingShell>
      <ContactPage />
    </MarketingShell>
  );
}
