import {
  BarChart3,
  BellRing,
  Building2,
  CheckCircle2,
  MapPin,
  Receipt,
  Users,
} from "lucide-react";

import {
  MarketingCtaBand,
  MarketingIconCard,
  MarketingPageBody,
  MarketingPageChrome,
  MarketingPageHero,
  MarketingPageH2,
  MarketingPageSection,
  MarketingRelatedLinks,
  SectionReveal,
  StaggerReveal,
} from "@/components/marketing/MarketingPageChrome";
import { MARKETING } from "@/lib/marketing-content";
import { WHY_FEEZO_PAGE } from "@/lib/seo/marketing-pages-content";
import { PUBLIC_PAGE_SEO } from "@/lib/seo/public-pages";

const FIX_ICONS = [Receipt, BellRing, CheckCircle2, BarChart3] as const;

export function WhyFeezoPage() {
  const p = WHY_FEEZO_PAGE;
  const testimonials = MARKETING.testimonials.items.slice(0, 3);

  return (
    <MarketingPageChrome seo={PUBLIC_PAGE_SEO.whyFeezo}>
      <MarketingPageHero
        eyebrow="Why Feezo"
        title={p.h1}
        lead={p.intro}
      />

      <MarketingPageSection soft>
        <SectionReveal>
          <MarketingPageH2>{p.monthlyProblem.h2}</MarketingPageH2>
          <MarketingPageBody>{p.monthlyProblem.body}</MarketingPageBody>
        </SectionReveal>
      </MarketingPageSection>

      <MarketingPageSection>
        <SectionReveal>
          <MarketingPageH2 className="text-center sm:text-left">{p.howFeezoFixes.h2}</MarketingPageH2>
        </SectionReveal>
        <StaggerReveal className="mt-8 grid gap-4 sm:grid-cols-2">
          {p.howFeezoFixes.items.map((item, index) => (
            <MarketingIconCard
              key={item}
              icon={FIX_ICONS[index] ?? CheckCircle2}
              title={item}
              index={index}
            />
          ))}
        </StaggerReveal>
      </MarketingPageSection>

      <MarketingPageSection soft>
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <SectionReveal>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-[var(--mkt-green-deep)] shadow-sm">
              <Users className="h-5 w-5" aria-hidden />
            </span>
            <MarketingPageH2 className="mt-4">{p.whoFor.h2}</MarketingPageH2>
            <MarketingPageBody>{p.whoFor.body}</MarketingPageBody>
          </SectionReveal>
          <SectionReveal delay={0.08}>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-[var(--mkt-green-deep)] shadow-sm">
              <MapPin className="h-5 w-5" aria-hidden />
            </span>
            <MarketingPageH2 className="mt-4">{p.operatedFrom.h2}</MarketingPageH2>
            <MarketingPageBody>{p.operatedFrom.body}</MarketingPageBody>
            <p className="mt-3 inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--mkt-green-deep)]">
              <Building2 className="h-4 w-4" aria-hidden />
              MAC ADZ · Malappuram, Kerala
            </p>
          </SectionReveal>
        </div>
      </MarketingPageSection>

      <MarketingPageSection>
        <SectionReveal>
          <MarketingPageH2 className="text-center">Schools already using Feezo</MarketingPageH2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[15px] text-[var(--mkt-muted)]">
            Real campuses running fees, receipts and follow-ups on Feezo.
          </p>
        </SectionReveal>
        <StaggerReveal className="mt-8 grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="flex h-full flex-col rounded-2xl border border-[var(--mkt-line)] bg-white p-5 shadow-[0_12px_36px_-28px_rgba(26,28,44,0.4)]"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--mkt-soft)] text-[12px] font-bold text-[var(--mkt-green-deep)]">
                  {item.initials}
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-[var(--mkt-ink)]">{item.school}</p>
                  <p className="text-[12px] text-[var(--mkt-muted)]">
                    {item.enrolled > 0 ? `${item.enrolled} students · ` : null}
                    {item.plan}
                  </p>
                </div>
              </div>
              <p className="mt-4 flex-1 text-[14px] leading-relaxed text-[var(--mkt-ink)]/85">
                “{item.quote}”
              </p>
              <p className="mt-3 text-[12px] font-medium text-[var(--mkt-muted)]">{item.role}</p>
            </div>
          ))}
        </StaggerReveal>
      </MarketingPageSection>

      <MarketingPageSection soft>
        <MarketingCtaBand
          title="Ready to replace the monthly fee scramble?"
          body="Start a free 14-day trial with your own school data, or book a demo with the team in Malappuram."
          location="why_feezo"
        />
        <MarketingRelatedLinks
          links={[
            { to: "/product", label: "Product" },
            { to: "/features", label: "Features" },
            { to: "/pricing", label: "Pricing" },
          ]}
        />
      </MarketingPageSection>
    </MarketingPageChrome>
  );
}
