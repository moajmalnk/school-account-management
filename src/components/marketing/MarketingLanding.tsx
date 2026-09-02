import { lazy, Suspense, useEffect } from "react";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Hero } from "@/components/marketing/sections/Hero";
import { MARKETING } from "@/lib/marketing-content";
import { preloadMarketingSections, scrollToMarketingSection } from "@/lib/marketing-scroll";

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
    preloadMarketingSections();
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const timer = window.setTimeout(() => scrollToMarketingSection(hash), 120);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <MarketingShell>
      <Hero />
      <Suspense fallback={null}>
        <HowItWorks />
        <DigitalTransformation />
        <Features />
        <Testimonials />
        <Pricing />
      </Suspense>
    </MarketingShell>
  );
}
