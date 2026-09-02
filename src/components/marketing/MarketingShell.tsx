import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { FeezoMark } from "@/components/brand/FeezoBrand";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingMobileNav } from "@/components/marketing/MarketingMobileNav";
import { MARKETING_THEME_VARS } from "@/components/marketing/marketing-theme";
import { useMarketingActiveSection } from "@/hooks/useMarketingActiveSection";
import { BRAND } from "@/lib/brand";
import { MARKETING } from "@/lib/marketing-content";
import { handleMarketingSectionClick } from "@/lib/marketing-scroll";

export function MarketingShell({ children }: { children: ReactNode }) {
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
      className="marketing-root min-h-dvh scroll-smooth bg-white flex flex-col antialiased"
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
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-5 sm:h-16 sm:gap-4 sm:px-10">
          <Link
            to="/"
            className="shrink-0 rounded-lg outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--mkt-green)] transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
            aria-label={`${BRAND.name} home`}
          >
            <FeezoMark className="h-9 w-9 sm:h-10 sm:w-10" />
            <div className="flex flex-col -gap-1">
              <span className="font-bold text-[22px] sm:text-[26px] leading-none tracking-tight text-[var(--mkt-ink)]">Feezo</span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-[var(--mkt-ink)] self-end tracking-wider">Edu Books</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Page sections">
            {MARKETING.nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(event) => handleMarketingSectionClick(event, item.id)}
                className={`text-[15px] font-medium transition-colors hover:text-[var(--mkt-green-deep)] ${
                  item.id === activeSection
                    ? "text-[var(--mkt-green)]"
                    : "text-[var(--mkt-ink)] hover:text-[var(--mkt-green)]"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[var(--mkt-green)] px-6 text-[14px] font-medium text-white transition-all duration-200 hover:bg-[var(--mkt-green-deep)] hover:shadow-lg hover:shadow-[var(--mkt-green)]/20 hover:-translate-y-0.5 active:translate-y-0 lg:px-7 lg:text-[15px]"
            >
              Sign in
            </Link>
            <MarketingMobileNav />
          </div>
        </div>
      </header>

      {/* Reserve space for fixed header (incl. notch safe area) */}
      <div
        aria-hidden
        className="marketing-header-spacer shrink-0 h-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:h-[calc(4rem+env(safe-area-inset-top,0px))]"
      />

      <div className="flex-1 bg-white overflow-x-hidden flex flex-col relative text-[var(--mkt-ink)]">
        <main id="main">{children}</main>

        <MarketingFooter />
      </div>
    </div>
  );
}
