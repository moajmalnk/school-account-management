import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Hero } from "@/components/marketing/sections/Hero";
import { importWithRetry } from "@/lib/lazy-with-retry";
import { MARKETING } from "@/lib/marketing-content";
import { preloadMarketingSections, scrollToMarketingSection } from "@/lib/marketing-scroll";

const HowItWorks = lazy(() =>
  importWithRetry(() =>
    import("@/components/marketing/sections/HowItWorks").then((m) => ({ default: m.HowItWorks })),
  ),
);
const Features = lazy(() =>
  importWithRetry(() =>
    import("@/components/marketing/sections/Features").then((m) => ({ default: m.Features })),
  ),
);
const DigitalTransformation = lazy(() =>
  importWithRetry(() =>
    import("@/components/marketing/sections/DigitalTransformation").then((m) => ({
      default: m.DigitalTransformation,
    })),
  ),
);
const Testimonials = lazy(() =>
  importWithRetry(() =>
    import("@/components/marketing/sections/Testimonials").then((m) => ({
      default: m.Testimonials,
    })),
  ),
);
const Pricing = lazy(() =>
  importWithRetry(() =>
    import("@/components/marketing/sections/Pricing").then((m) => ({ default: m.Pricing })),
  ),
);

/** A failed below-the-fold chunk must not replace the whole landing page. */
class QuietSection extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function SectionFallback({ height }: { height: number }) {
  return <div style={{ minHeight: height }} aria-hidden />;
}

function BelowFoldSections({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);

  return (
    <>
      <QuietSection>
        <Suspense fallback={<SectionFallback height={980} />}>
          <HowItWorks />
        </Suspense>
      </QuietSection>
      <QuietSection>
        <Suspense fallback={<SectionFallback height={880} />}>
          <DigitalTransformation />
        </Suspense>
      </QuietSection>
      <QuietSection>
        <Suspense fallback={<SectionFallback height={520} />}>
          <Features />
        </Suspense>
      </QuietSection>
      <QuietSection>
        <Suspense fallback={<SectionFallback height={560} />}>
          <Testimonials />
        </Suspense>
      </QuietSection>
      <QuietSection>
        <Suspense fallback={<SectionFallback height={900} />}>
          <Pricing />
        </Suspense>
      </QuietSection>
    </>
  );
}

export function MarketingLanding() {
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    document.title = MARKETING.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", MARKETING.description);
    preloadMarketingSections();
    const dismiss = (window as Window & { __feezoDismissBootShell?: () => void })
      .__feezoDismissBootShell;
    const timer = window.setTimeout(() => dismiss?.(), 80);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const timer = window.setTimeout(() => scrollToMarketingSection(hash), 120);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <MarketingShell showFooter={showFooter}>
      <Hero />
      <BelowFoldSections onReady={() => setShowFooter(true)} />
    </MarketingShell>
  );
}
