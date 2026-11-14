import { BellRing, ClipboardList, LineChart, Receipt } from "lucide-react";

import {
  MarketingCtaBand,
  MarketingFeatureRow,
  MarketingPageChrome,
  MarketingPageHero,
  MarketingPageSection,
  MarketingRelatedLinks,
} from "@/components/marketing/MarketingPageChrome";
import { FEATURES_PAGE } from "@/lib/seo/marketing-pages-content";
import { PUBLIC_PAGE_SEO } from "@/lib/seo/public-pages";

const FEATURE_ICONS = [Receipt, BellRing, ClipboardList, LineChart] as const;

export function FeaturesPage() {
  const p = FEATURES_PAGE;

  return (
    <MarketingPageChrome seo={PUBLIC_PAGE_SEO.features}>
      <MarketingPageHero
        eyebrow="Features"
        title={p.h1}
        lead="Everything your school office needs for fees, receipts, reminders and accounts — in one clear system."
      />

      <MarketingPageSection soft>
        <div className="mx-auto max-w-3xl space-y-4">
          {p.features.map((feature, index) => (
            <MarketingFeatureRow
              key={feature.h2}
              icon={FEATURE_ICONS[index] ?? Receipt}
              title={feature.h2}
              body={feature.body}
            />
          ))}
        </div>
      </MarketingPageSection>

      <MarketingPageSection>
        <MarketingCtaBand
          title="Try these features with your school data"
          body="Start a free 14-day trial, or book a demo and we will walk you through receipts, reminders and reports."
          location="features"
        />
        <MarketingRelatedLinks
          links={[
            { to: "/product", label: "Product" },
            { to: "/setup", label: "Setup" },
            { to: "/pricing", label: "Pricing" },
          ]}
        />
      </MarketingPageSection>
    </MarketingPageChrome>
  );
}
