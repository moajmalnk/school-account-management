import { ArrowRight } from "lucide-react";

import { SectionReveal } from "@/components/marketing/SectionReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HOME_PAGE } from "@/lib/seo/marketing-pages-content";
import { cn } from "@/lib/utils";

function SectionLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--mkt-green-deep)] underline-offset-2 transition hover:gap-2 hover:underline"
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
    </a>
  );
}

function SummaryBlock({
  id,
  headingId,
  h2,
  children,
  soft = false,
}: {
  id: string;
  headingId: string;
  h2: string;
  children: React.ReactNode;
  soft?: boolean;
}) {
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "relative py-14 sm:py-16",
        soft && "bg-[linear-gradient(180deg,#f8fff4_0%,#ffffff_60%,#f8fff4_100%)]",
      )}
    >
      <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-10">
        <SectionReveal>
          <h2
            id={headingId}
            className="text-[clamp(1.4rem,3vw,1.85rem)] font-bold tracking-tight text-[var(--mkt-ink)]"
          >
            {h2}
          </h2>
          {children}
        </SectionReveal>
      </div>
    </section>
  );
}

export function HomeSummaries() {
  const s = HOME_PAGE.sections;

  return (
    <div className="border-t border-[var(--mkt-line)]/50">
      <SummaryBlock id={s.whyFeezo.id} headingId="home-why-heading" h2={s.whyFeezo.h2} soft>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--mkt-muted)] sm:text-[16px]">
          {s.whyFeezo.body}
        </p>
        <SectionLink href={s.whyFeezo.href}>{s.whyFeezo.linkLabel}</SectionLink>
      </SummaryBlock>

      <SummaryBlock id={s.product.id} headingId="home-product-heading" h2={s.product.h2}>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--mkt-muted)] sm:text-[16px]">
          {s.product.body}
        </p>
        <SectionLink href={s.product.href}>{s.product.linkLabel}</SectionLink>
      </SummaryBlock>

      <SummaryBlock id={s.features.id} headingId="home-features-heading" h2={s.features.h2} soft>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {s.features.items.map((item) => (
            <div
              key={item.h3}
              className="rounded-2xl border border-[var(--mkt-line)] bg-white/90 p-4 shadow-[0_10px_30px_-28px_rgba(26,28,44,0.4)]"
            >
              <h3 className="text-[15px] font-semibold text-[var(--mkt-ink)]">{item.h3}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--mkt-muted)]">{item.body}</p>
            </div>
          ))}
        </div>
        <SectionLink href={s.features.href}>{s.features.linkLabel}</SectionLink>
      </SummaryBlock>

      <SummaryBlock id={s.setup.id} headingId="home-setup-heading" h2={s.setup.h2}>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--mkt-muted)] sm:text-[16px]">
          {s.setup.body}
        </p>
        <SectionLink href={s.setup.href}>{s.setup.linkLabel}</SectionLink>
      </SummaryBlock>

      <SummaryBlock id={s.pricing.id} headingId="home-pricing-heading" h2={s.pricing.h2} soft>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--mkt-muted)] sm:text-[16px]">
          {s.pricing.body}
        </p>
        <SectionLink href={s.pricing.href}>{s.pricing.linkLabel}</SectionLink>
      </SummaryBlock>

      <SummaryBlock id={s.faq.id} headingId="home-faq-heading" h2={s.faq.h2}>
        <Accordion type="single" collapsible className="mt-4 w-full">
          {s.faq.items.map((item, index) => (
            <AccordionItem key={item.q} value={`faq-${index}`} className="border-[var(--mkt-line)]">
              <AccordionTrigger className="text-left text-[15px] font-semibold text-[var(--mkt-ink)] hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-[var(--mkt-muted)]">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </SummaryBlock>
    </div>
  );
}
