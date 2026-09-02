import { createFileRoute } from "@tanstack/react-router";

import { MarketingLanding } from "@/components/marketing/MarketingLanding";

/** Public marketing home — available even when signed in (unlike `/`). */
export const Route = createFileRoute("/home")({
  component: HomePage,
});

function HomePage() {
  return <MarketingLanding />;
}
