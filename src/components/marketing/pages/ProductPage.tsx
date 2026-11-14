import {
  BellRing,
  LayoutDashboard,
  Receipt,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

import { MarketingNavLink } from "@/components/marketing/MarketingNavLink";
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
import { PRODUCT_PAGE } from "@/lib/seo/marketing-pages-content";
import { PUBLIC_PAGE_SEO } from "@/lib/seo/public-pages";
import "@/file-routes";

const CAN_DO = [
  { icon: Wallet, title: "Record student fees and payments" },
  { icon: Receipt, title: "Issue online receipts" },
  { icon: BellRing, title: "Send fee follow-ups to parents" },
  { icon: Users, title: "Track pending fees" },
  { icon: LayoutDashboard, title: "See income, expenses and cash position" },
] as const;

export function ProductPage() {
  const p = PRODUCT_PAGE;

  return (
    <MarketingPageChrome seo={PUBLIC_PAGE_SEO.product}>
      <MarketingPageHero eyebrow="Product" title={p.h1} lead={p.intro} />

      <MarketingPageSection soft>
        <SectionReveal>
          <MarketingPageH2 className="text-center">{p.whatYouCanDo.h2}</MarketingPageH2>
        </SectionReveal>
        <StaggerReveal className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAN_DO.map((item, index) => (
            <MarketingIconCard key={item.title} icon={item.icon} title={item.title} index={index} />
          ))}
        </StaggerReveal>
        <SectionReveal>
          <div className="mt-8 flex justify-center">
            <MarketingNavLink
              path="/features"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--mkt-green-deep)] underline-offset-2 hover:underline"
            >
              See all features
            </MarketingNavLink>
          </div>
        </SectionReveal>
      </MarketingPageSection>

      <MarketingPageSection>
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionReveal>
            <article className="h-full rounded-[24px] border border-[var(--mkt-line)] bg-white p-6 shadow-[0_14px_40px_-32px_rgba(26,28,44,0.4)] sm:p-8">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--mkt-soft)] text-[var(--mkt-green-deep)]">
                <LayoutDashboard className="h-5 w-5" aria-hidden />
              </span>
              <MarketingPageH2 className="mt-4">{p.oneSystem.h2}</MarketingPageH2>
              <MarketingPageBody>{p.oneSystem.body}</MarketingPageBody>
            </article>
          </SectionReveal>
          <SectionReveal delay={0.08}>
            <article className="h-full rounded-[24px] border border-[var(--mkt-line)] bg-white p-6 shadow-[0_14px_40px_-32px_rgba(26,28,44,0.4)] sm:p-8">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--mkt-soft)] text-[var(--mkt-green-deep)]">
                <Smartphone className="h-5 w-5" aria-hidden />
              </span>
              <MarketingPageH2 className="mt-4">{p.webAndMobile.h2}</MarketingPageH2>
              <MarketingPageBody>{p.webAndMobile.body}</MarketingPageBody>
              <Link
                to="/download"
                className="mt-4 inline-flex text-[14px] font-semibold text-[var(--mkt-green-deep)] underline-offset-2 hover:underline"
              >
                Download the Feezo app
              </Link>
            </article>
          </SectionReveal>
        </div>
      </MarketingPageSection>

      <MarketingPageSection soft>
        <SectionReveal>
          <div className="mx-auto max-w-2xl text-center">
            <MarketingPageH2>{p.madeFor.h2}</MarketingPageH2>
            <MarketingPageBody className="mx-auto">{p.madeFor.body}</MarketingPageBody>
          </div>
        </SectionReveal>
        <div className="mt-10">
          <MarketingCtaBand
            title="See Feezo with your own school data"
            body="Start a 14-day free trial or book a demo — no accounting staff needed to begin."
            location="product"
            showDownload
          />
        </div>
        <MarketingRelatedLinks
          links={[
            { to: "/features", label: "Features" },
            { to: "/setup", label: "Setup" },
            { to: "/pricing", label: "Pricing" },
          ]}
        />
      </MarketingPageSection>
    </MarketingPageChrome>
  );
}
