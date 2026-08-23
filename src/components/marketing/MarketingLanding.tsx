import { useEffect } from "react";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Compare } from "@/components/marketing/sections/Compare";
import { Features } from "@/components/marketing/sections/Features";
import { FinalCta } from "@/components/marketing/sections/FinalCta";
import { FollowUp } from "@/components/marketing/sections/FollowUp";
import { Hero } from "@/components/marketing/sections/Hero";
import { Pricing } from "@/components/marketing/sections/Pricing";
import { Problems } from "@/components/marketing/sections/Problems";
import { ProductTour } from "@/components/marketing/sections/ProductTour";
import { Setup } from "@/components/marketing/sections/Setup";
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
      <Problems />
      <ProductTour />
      <Features />
      <Setup />
      <Compare />
      <FollowUp />
      <Pricing />
      <FinalCta />
    </MarketingShell>
  );
}
