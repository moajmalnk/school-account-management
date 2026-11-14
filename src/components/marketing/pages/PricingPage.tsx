import { useEffect } from "react";

import {
  MarketingPageBody,
  MarketingPageHero,
  MarketingPageH2,
  MarketingPageSection,
  MarketingRelatedLinks,
  SectionReveal,
} from "@/components/marketing/MarketingPageChrome";
import { Pricing } from "@/components/marketing/sections/Pricing";
import { PRICING_PAGE } from "@/lib/seo/marketing-pages-content";
import { applyDocumentSeo, PUBLIC_PAGE_SEO } from "@/lib/seo/public-pages";

export function PricingPage() {
  const p = PRICING_PAGE;

  useEffect(() => {
    applyDocumentSeo(PUBLIC_PAGE_SEO.pricing);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <MarketingPageHero
        eyebrow="Pricing"
        title={p.h1}
        lead="Compare Feezo plans for schools and academies. Every plan includes a 14-day free trial so you can try the system with your own school data before you subscribe."
      />

      <MarketingPageSection soft className="pt-0 sm:pt-2">
        <SectionReveal>
          <MarketingPageH2 className="mb-2 text-center">{p.choosePlan.h2}</MarketingPageH2>
        </SectionReveal>
      </MarketingPageSection>

      <Pricing showHeading={false} />

      <MarketingPageSection soft>
        <SectionReveal>
          <MarketingPageH2>{p.trial.h2}</MarketingPageH2>
          <MarketingPageBody>{p.trial.body}</MarketingPageBody>
        </SectionReveal>

        <SectionReveal>
          <MarketingPageH2 className="mt-12">{p.questions.h2}</MarketingPageH2>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {p.questions.items.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-[var(--mkt-line)] bg-white p-5 shadow-[0_12px_36px_-28px_rgba(26,28,44,0.4)]"
              >
                <dt className="text-[15px] font-semibold text-[var(--mkt-ink)]">{item.q}</dt>
                <dd className="mt-2 text-[14px] leading-relaxed text-[var(--mkt-muted)]">{item.a}</dd>
              </div>
            ))}
          </dl>
        </SectionReveal>

        <MarketingRelatedLinks
          links={[
            { to: "/setup", label: "Setup" },
            { to: "/features", label: "Features" },
            { to: "/contact", label: "Contact" },
          ]}
        />
      </MarketingPageSection>
    </div>
  );
}
