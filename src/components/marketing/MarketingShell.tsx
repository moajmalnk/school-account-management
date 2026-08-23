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
      className="marketing-root min-h-dvh bg-white text-[var(--mkt-ink)] antialiased"
      style={MKT_VARS}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-[var(--mkt-line)] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="shrink-0 rounded-lg outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--mkt-green)]"
            aria-label={`${BRAND.name} home`}
          >
            <FeezoBrand markClassName="h-9 w-9" />
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Page sections"
          >
            {MARKETING.nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--mkt-muted)] transition-colors hover:text-[var(--mkt-ink)]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <Link
            to="/login"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[var(--mkt-ink)] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-black"
          >
            Sign in
          </Link>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto border-t border-[var(--mkt-line)] px-4 py-2 md:hidden"
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

      <footer className="border-t border-[var(--mkt-line)] bg-[var(--mkt-ink)] text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 shrink-0">
                <FeezoMark />
              </div>
              <div className="leading-tight">
                <div className="text-[14px] font-semibold tracking-tight text-white">
                  Fee<span className="text-[var(--mkt-green)]">zo</span>
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-white/50">
                  {BRAND.tagline}
                </div>
              </div>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-white/65">
              School accounts simplified — fees, receipts, and reports in one
              place.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-[13px] font-medium">
            <a
              href={BRAND.legal.privacyPath}
              className="text-white/70 transition-colors hover:text-white"
            >
              Privacy Policy
            </a>
            <a
              href={BRAND.legal.dataDeletionPath}
              className="text-white/70 transition-colors hover:text-white"
            >
              Data deletion
            </a>
            <Link
              to="/login"
              className="text-white/70 transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <a
              href={`mailto:${BRAND.legal.supportEmail}`}
              className="text-white/70 transition-colors hover:text-white"
            >
              {BRAND.legal.supportEmail}
            </a>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center font-mono text-[10px] uppercase tracking-wider text-white/40">
          © {new Date().getFullYear()} {BRAND.name} · {BRAND.tagline}
        </div>
      </footer>
    </div>
  );
}
