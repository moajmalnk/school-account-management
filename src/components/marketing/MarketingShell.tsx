import { Link } from "@tanstack/react-router";
import type { CSSProperties, ReactNode } from "react";

import { FeezoBrand, FeezoMark } from "@/components/brand/FeezoBrand";
import { BRAND } from "@/lib/brand";
import { MARKETING } from "@/lib/marketing-content";

const MKT_VARS = {
  "--mkt-green": "#8FCA4A",
  "--mkt-green-deep": "#6BA832",
  "--mkt-ink": "#1A1C2C",
  "--mkt-muted": "rgba(26, 28, 44, 0.58)",
  "--mkt-line": "rgba(26, 28, 44, 0.1)",
  "--mkt-soft": "#F4FBF0",
} as CSSProperties;

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="marketing-root min-h-dvh scroll-smooth bg-white text-[var(--mkt-ink)] antialiased"
      style={MKT_VARS}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-[var(--mkt-line)] bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
          <Link
            to="/"
            className="shrink-0 rounded-lg outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--mkt-green)]"
            aria-label={`${BRAND.name} home`}
          >
            <FeezoBrand markClassName="h-8 w-8 sm:h-9 sm:w-9" />
          </Link>

          <nav className="hidden items-center gap-2 lg:flex" aria-label="Page sections">
            {MARKETING.nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-lg px-2.5 py-2 text-[13px] font-medium text-[var(--mkt-muted)] transition-colors hover:text-[var(--mkt-ink)] xl:px-3"
              >
                {item.id}
              </a>
            ))}
          </nav>

          <Link
            to="/login"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-[var(--mkt-green)] px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[var(--mkt-green-deep)] sm:h-10 sm:px-4 sm:text-[13px] shadow-sm"
          >
            Sign in
          </Link>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto border-t border-[var(--mkt-line)] px-4 py-2 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Page sections"
        >
          {MARKETING.nav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium text-[var(--mkt-muted)] hover:bg-[var(--mkt-soft)] hover:text-[var(--mkt-ink)]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main id="main">{children}</main>

      <footer className="border-t border-[var(--mkt-line)] bg-white text-[var(--mkt-ink)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-6 md:w-2/3">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 shrink-0">
                  <FeezoMark />
                </div>
                <div className="leading-tight">
                  <div className="text-[18px] font-bold tracking-tight text-[var(--mkt-ink)]">
                    Fee<span className="text-[var(--mkt-green)]">zo</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-[var(--mkt-ink)] font-medium">
                School accounts simplified — fees,<br/>receipts, and reports in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-[13px] font-bold mt-2">
              {MARKETING.nav.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`transition-colors hover:opacity-80 ${item.id === 'product' ? 'text-[var(--mkt-green)]' : 'text-[var(--mkt-ink)]'}`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col gap-3 md:items-end pt-2">
            <a href="#" className="inline-flex h-[44px] items-center justify-start rounded-md bg-[var(--mkt-green)] px-3 text-white transition-colors hover:bg-[var(--mkt-green-deep)] w-[145px] gap-2">
              <svg className="h-6 w-6 fill-current shrink-0" viewBox="0 0 24 24"><path d="M17.523 15.3414C17.523 15.3414 17.502 15.321 17.472 15.2897L17.4666 15.284C17.4666 15.284 12.3364 12.1643 12.3364 12.1643L12.3331 12.1623L12.3274 12.1587C12.3274 12.1587 7.20232 9.04169 7.20232 9.04169L7.19839 9.03923C7.1147 8.98894 6.99961 8.97011 6.89297 9.00405C6.77259 9.04169 6.67139 9.1362 6.62145 9.25556C6.59567 9.31753 6.58661 9.38793 6.60275 9.45663L6.60481 9.46743L6.61111 9.48866L11.5363 21.0346L11.5393 21.0422L11.542 21.0506L16.4883 24.318C16.4883 24.318 16.5186 24.3377 16.5413 24.3483C16.6346 24.3916 16.7451 24.3976 16.8436 24.3644C16.9634 24.3245 17.0601 24.2285 17.1065 24.1082C17.1322 24.043 17.1384 23.9678 17.1182 23.8967L17.1148 23.8824L17.1092 23.8647L12.3323 12.1628L17.5255 15.3441L17.523 15.3414Z" /><path d="M11.666 11.7584L6.96316 22.7828L5.78913 20.0272L10.4907 9.00392L11.666 11.7584Z" /><path d="M2.93608 13.336L3.93179 15.6706L9.46313 2.70327L8.46742 0.368652L2.93608 13.336Z" /><path d="M4.09068 16.0425L5.43468 19.1923L10.9637 6.22383L9.61966 3.07406L4.09068 16.0425Z" /></svg>
              <div className="flex flex-col items-start justify-center leading-none">
                <span className="text-[9px] font-semibold tracking-wide mb-[3px]">GET IT ON</span>
                <span className="text-[14px] font-bold tracking-tight">Google Play</span>
              </div>
            </a>
            <a href="#" className="inline-flex h-[44px] items-center justify-start rounded-md bg-[var(--mkt-green)] px-3 text-white transition-colors hover:bg-[var(--mkt-green-deep)] w-[145px] gap-2">
              <svg className="h-6 w-6 fill-current shrink-0" viewBox="0 0 24 24"><path d="M16.4 12c0-2.8 2.3-4.1 2.4-4.2-1.3-1.9-3.3-2.2-4.1-2.2-1.7-.2-3.4 1-4.3 1-.9 0-2.2-1-3.6-1-1.9 0-3.6 1.1-4.6 2.8-2.1 3.5-.5 8.8 1.4 11.6 1 1.4 2.1 2.9 3.6 2.9 1.4 0 2-.9 3.7-.9 1.7 0 2.2.9 3.7.9 1.5 0 2.5-1.4 3.4-2.8.9-1.2 1.2-2.3 1.3-2.4-.1-.1-2.9-1.1-2.9-4.7zM14 3.7c.8-.9 1.3-2.2 1.1-3.5-1.1.1-2.5.7-3.3 1.6-.7.8-1.3 2.1-1.1 3.4 1.3.1 2.5-.6 3.3-1.5z"/></svg>
              <div className="flex flex-col items-start justify-center leading-none">
                <span className="text-[9px] font-semibold tracking-wide mb-[3px]">Download on the</span>
                <span className="text-[14px] font-bold tracking-tight">App Store</span>
              </div>
            </a>
          </div>
        </div>
        <div className="mx-auto max-w-6xl flex items-center justify-between border-t border-[var(--mkt-line)] px-4 py-8 sm:px-6">
          <div className="text-[11px] font-semibold text-[var(--mkt-muted)]">
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </div>
          <div className="flex gap-4 text-[var(--mkt-muted)]">
            <a href="#" aria-label="Facebook" className="hover:text-[var(--mkt-ink)] transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>
            <a href="#" aria-label="Twitter" className="hover:text-[var(--mkt-ink)] transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg></a>
            <a href="#" aria-label="Instagram" className="hover:text-[var(--mkt-ink)] transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>
            <a href="#" aria-label="Github" className="hover:text-[var(--mkt-ink)] transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg></a>
            <a href="#" aria-label="LinkedIn" className="hover:text-[var(--mkt-ink)] transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
