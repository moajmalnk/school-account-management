import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const MarketingLanding = lazy(() =>
  import("@/components/marketing/MarketingLanding").then((m) => ({
    default: m.MarketingLanding,
  })),
);

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  // Always show the marketing homepage. Logged-in users reach their workspace
  // via login redirect / "My Account" — do not bounce "/" back to the app.
  return (
    <Suspense fallback={null}>
      <MarketingLanding />
    </Suspense>
  );
}
