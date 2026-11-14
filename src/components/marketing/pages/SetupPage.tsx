import { ClipboardCheck, LifeBuoy } from "lucide-react";

import {
  MarketingCtaBand,
  MarketingPageBody,
  MarketingPageChrome,
  MarketingPageHero,
  MarketingPageH2,
  MarketingPageSection,
  MarketingRelatedLinks,
  MarketingStepCard,
  SectionReveal,
  StaggerReveal,
} from "@/components/marketing/MarketingPageChrome";
import { SETUP_PAGE } from "@/lib/seo/marketing-pages-content";
import { PUBLIC_PAGE_SEO } from "@/lib/seo/public-pages";

export function SetupPage() {
  const p = SETUP_PAGE;

  return (
    <MarketingPageChrome seo={PUBLIC_PAGE_SEO.setup}>
      <MarketingPageHero
        eyebrow="Setup"
        title={p.h1}
        lead="Most schools finish setup in a single sitting. No accounting knowledge required to begin."
      />

      <MarketingPageSection soft>
        <SectionReveal>
          <MarketingPageH2 className="text-center">{p.steps.h2}</MarketingPageH2>
        </SectionReveal>
        <StaggerReveal className="mt-8 grid gap-4 sm:grid-cols-2">
          {p.steps.items.map((step, index) => (
            <MarketingStepCard
              key={step.title}
              step={index + 1}
              title={step.title}
              body={step.body}
            />
          ))}
        </StaggerReveal>
      </MarketingPageSection>

      <MarketingPageSection>
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionReveal>
            <article className="h-full rounded-[24px] border border-[var(--mkt-line)] bg-white p-6 shadow-[0_14px_40px_-32px_rgba(26,28,44,0.4)] sm:p-8">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--mkt-soft)] text-[var(--mkt-green-deep)]">
                <ClipboardCheck className="h-5 w-5" aria-hidden />
              </span>
              <MarketingPageH2 className="mt-4">{p.keepReady.h2}</MarketingPageH2>
              <MarketingPageBody>{p.keepReady.body}</MarketingPageBody>
            </article>
          </SectionReveal>
          <SectionReveal delay={0.08}>
            <article className="h-full rounded-[24px] border border-[var(--mkt-line)] bg-white p-6 shadow-[0_14px_40px_-32px_rgba(26,28,44,0.4)] sm:p-8">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--mkt-soft)] text-[var(--mkt-green-deep)]">
                <LifeBuoy className="h-5 w-5" aria-hidden />
              </span>
              <MarketingPageH2 className="mt-4">{p.needHelp.h2}</MarketingPageH2>
              <MarketingPageBody>{p.needHelp.body}</MarketingPageBody>
            </article>
          </SectionReveal>
        </div>
      </MarketingPageSection>

      <MarketingPageSection soft>
        <MarketingCtaBand
          title="Ready to set up your school?"
          body="Create your account and start the 14-day free trial, or book a demo with our team in Malappuram."
          location="setup"
        />
        <MarketingRelatedLinks
          links={[
            { to: "/features", label: "Features" },
            { to: "/pricing", label: "Pricing" },
            { to: "/contact", label: "Book a demo" },
          ]}
        />
      </MarketingPageSection>
    </MarketingPageChrome>
  );
}
