import { lazy, Suspense, useEffect } from "react";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Hero } from "@/components/marketing/sections/Hero";
import { MARKETING } from "@/lib/marketing-content";

const HowItWorks = lazy(() =>
  import("@/components/marketing/sections/HowItWorks").then((m) => ({ default: m.HowItWorks })),
);
const Features = lazy(() =>
  import("@/components/marketing/sections/Features").then((m) => ({ default: m.Features })),
);
const DigitalTransformation = lazy(() =>
  import("@/components/marketing/sections/DigitalTransformation").then((m) => ({
    default: m.DigitalTransformation,
  })),
);
const Testimonials = lazy(() =>
  import("@/components/marketing/sections/Testimonials").then((m) => ({ default: m.Testimonials })),
);
const Pricing = lazy(() =>
  import("@/components/marketing/sections/Pricing").then((m) => ({ default: m.Pricing })),
);

export function MarketingLanding() {
  useEffect(() => {
    document.title = MARKETING.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", MARKETING.description);
  }, []);

  return (
    <MarketingShell>
      <Hero />
      <Suspense fallback={null}>
        <HowItWorks />
        <Features />
        <DigitalTransformation />
        <Testimonials />
        <Pricing />
      </Suspense>
    </MarketingShell>
  );
}
