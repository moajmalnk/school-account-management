import { useEffect } from "react";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Features } from "@/components/marketing/sections/Features";
import { Hero } from "@/components/marketing/sections/Hero";
import { HowItWorks } from "@/components/marketing/sections/HowItWorks";
import { DigitalTransformation } from "@/components/marketing/sections/DigitalTransformation";
import { Testimonials } from "@/components/marketing/sections/Testimonials";
import { Pricing } from "@/components/marketing/sections/Pricing";
import { MARKETING } from "@/lib/marketing-content";

export function MarketingLanding() {
  useEffect(() => {
    document.title = MARKETING.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", MARKETING.description);
  }, []);

  return (
    <MarketingShell>
      <Hero />
      <HowItWorks />
      <Features />
      <DigitalTransformation />
      <Testimonials />
      <Pricing />
    </MarketingShell>
  );
}
