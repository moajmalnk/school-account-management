import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const MarketingLanding = lazy(() =>
  import("@/components/marketing/MarketingLanding").then((m) => ({
    default: m.MarketingLanding,
  })),
);

/** Public marketing home — available even when signed in (unlike `/`). */
export const Route = createFileRoute("/home")({
  component: HomePage,
});

function HomePage() {
  return (
    <Suspense fallback={null}>
      <MarketingLanding />
    </Suspense>
  );
}
