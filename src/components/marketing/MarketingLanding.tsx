import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { HomeLeadSection } from "@/components/marketing/HomeLeadSection";
import { navigateToMarketingPath } from "@/components/marketing/MarketingNavLink";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Hero } from "@/components/marketing/sections/Hero";
import { HomeSummaries } from "@/components/marketing/sections/HomeSummaries";
import { dismissBootShell } from "@/lib/boot-shell";
import { LEGACY_HASH_REDIRECTS } from "@/lib/seo/marketing-pages-content";
import { applyDocumentSeo, PUBLIC_PAGE_SEO } from "@/lib/seo/public-pages";

export function MarketingLanding() {
  const navigate = useNavigate();
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    applyDocumentSeo(PUBLIC_PAGE_SEO.home);
    const timer = window.setTimeout(() => {
      dismissBootShell();
      window.dispatchEvent(new Event("feezo:hydrated"));
      setShowFooter(true);
    }, 1200);
    return () => {
      window.clearTimeout(timer);
      dismissBootShell();
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const target = LEGACY_HASH_REDIRECTS[hash];
    if (!target) return;
    navigateToMarketingPath(navigate, target, { replace: true });
  }, [navigate]);

  return (
    <MarketingShell showFooter={showFooter}>
      <Hero />
      <HomeSummaries />
      <HomeLeadSection />
    </MarketingShell>
  );
}
