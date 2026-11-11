import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { FeezoMark } from "@/components/brand/FeezoBrand";
import { MarketingAuthActions } from "@/components/marketing/MarketingAuthActions";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingMobileNav } from "@/components/marketing/MarketingMobileNav";
import { MARKETING_THEME_VARS } from "@/components/marketing/marketing-theme";
import { WhatsAppFab } from "@/components/marketing/WhatsAppFab";
import { useMarketingActiveSection } from "@/hooks/useMarketingActiveSection";
import { BRAND } from "@/lib/brand";
import { MARKETING } from "@/lib/marketing-content";
import { handleMarketingSectionClick } from "@/lib/marketing-scroll";
import { pushMarketingEvent } from "@/lib/seo/analytics";

export function MarketingShell({
  children,
  showFooter = true,
}: {
  children: ReactNode;
  /** Hide until below-the-fold sections exist so the footer does not jump. */
  showFooter?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const activeSection = useMarketingActiveSection();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="marketing-root flex min-h-dvh w-full max-w-[100vw] flex-col overflow-x-clip scroll-smooth bg-white antialiased"
      style={MARKETING_THEME_VARS}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        Skip to content
      </a>

      <header
        className="marketing-header fixed inset-x-0 top-0 z-[90] pt-[env(safe-area-inset-top,0px)] transition-[background,box-shadow] duration-300"
        style={{
          background: scrolled ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.78)",
          backdropFilter: "blur(16px) saturate(160%)",
          WebkitBackdropFilter: "blur(16px) saturate(160%)",
          boxShadow: scrolled
            ? "0 8px 30px rgba(26, 28, 44, 0.08)"
            : "0 4px 20px rgba(26, 28, 44, 0.04)",
        }}
      >
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-2 px-4 sm:h-16 sm:gap-3 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="shrink-0 rounded-lg outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--mkt-green)] transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
            aria-label={`${BRAND.name} home`}
          >
            <FeezoMark className="h-9 w-9 sm:h-10 sm:w-10" />
            <div className="flex flex-col -gap-1">
              <span className="font-bold text-[22px] sm:text-[26px] leading-none tracking-tight text-[var(--mkt-ink)]">
                Feezo
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-[var(--mkt-ink)] self-end tracking-wider">
                Edu Books
              </span>
            </div>
          </Link>

          <nav
            className="hidden min-w-0 flex-1 items-center justify-center gap-4 xl:flex 2xl:gap-6"
            aria-label="Page sections"
          >
            {MARKETING.nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(event) => handleMarketingSectionClick(event, item.id)}
                className={`shrink-0 whitespace-nowrap text-[14px] font-medium transition-colors hover:text-[var(--mkt-green-deep)] 2xl:text-[15px] ${
                  item.id === activeSection
                    ? "text-[var(--mkt-green)]"
                    : "text-[var(--mkt-ink)] hover:text-[var(--mkt-green)]"
                }`}
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/contact"
              className="shrink-0 whitespace-nowrap text-[14px] font-medium text-[var(--mkt-ink)] transition-colors hover:text-[var(--mkt-green)] 2xl:text-[15px]"
              activeProps={{ className: "!text-[var(--mkt-green)]" }}
            >
              Contact
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <a
              href={`tel:${BRAND.contact.phoneE164}`}
              className="hidden h-10 items-center whitespace-nowrap rounded-lg px-2 text-[13px] font-semibold text-[var(--mkt-ink)] transition-colors hover:text-[var(--mkt-green-deep)] 2xl:inline-flex"
              onClick={() =>
                pushMarketingEvent("call_click", {
                  cta_location: "header",
                })
              }
            >
              {BRAND.contact.phoneDisplay}
            </a>
            <MarketingAuthActions variant="header" />
            <MarketingMobileNav />
          </div>
        </div>
      </header>

      {/* Reserve space for fixed header (incl. notch safe area) */}
      <div
        aria-hidden
        className="marketing-header-spacer shrink-0 h-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:h-[calc(4rem+env(safe-area-inset-top,0px))]"
      />

      <div className="relative flex min-w-0 w-full flex-1 flex-col overflow-x-clip bg-white text-[var(--mkt-ink)]">
        <main id="main" className="min-w-0 w-full">
          {children}
        </main>

        {showFooter ? <MarketingFooter /> : null}
      </div>

      <WhatsAppFab />
    </div>
  );
}
