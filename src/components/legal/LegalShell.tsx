import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { FeezoBrand } from "@/components/brand/FeezoBrand";
import { LegalMobileNav } from "@/components/legal/LegalMobileNav";
import { MARKETING_THEME_VARS } from "@/components/marketing/marketing-theme";
import { BRAND } from "@/lib/brand";
import { LEGAL_LAST_UPDATED, LEGAL_PAGES, type LegalPageId } from "@/lib/legal-pages";
import { cn } from "@/lib/utils";

export function LegalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "font-medium text-[var(--mkt-green-deep)] underline-offset-2 transition hover:text-[var(--mkt-green)] hover:underline",
        className,
      )}
    >
      {children}
    </a>
  );
}

export function LegalShell({
  title,
  subtitle,
  activePage,
  children,
}: {
  title: string;
  subtitle?: string;
  activePage?: LegalPageId;
  children: ReactNode;
}) {
  return (
    <div
      className="min-h-dvh text-[var(--mkt-ink)]"
      style={{
        ...MARKETING_THEME_VARS,
        background:
          "linear-gradient(180deg, #f8fff4 0%, #ffffff 32%, #f4f6f9 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-3xl px-4 py-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:py-12">
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/"
              className="inline-flex w-fit min-w-0 items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-3 py-2.5 shadow-[0_14px_44px_-32px_rgba(26,28,44,0.35)] backdrop-blur-xl transition hover:shadow-[0_18px_48px_-28px_rgba(143,202,74,0.35)]"
            >
              <FeezoBrand
                subtitle={BRAND.tagline}
                markClassName="h-10 w-10"
                className="text-left"
              />
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/login"
                className="hidden sm:inline-flex h-10 items-center justify-center rounded-xl border border-[var(--mkt-line)] bg-white px-4 text-[13px] font-semibold text-[var(--mkt-ink)] transition hover:border-[var(--mkt-green)]/40 hover:text-[var(--mkt-green-deep)]"
              >
                Sign in
              </Link>
              <LegalMobileNav activePage={activePage} />
            </div>
          </div>

          <nav
            className="mt-5 hidden gap-2 overflow-x-auto pb-1 sm:flex [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Legal documents"
          >
            {LEGAL_PAGES.map((page) => {
              const isActive = activePage === page.id;
              return (
                <a
                  key={page.id}
                  href={page.path}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition",
                    isActive
                      ? "border-[var(--mkt-green)]/35 bg-[var(--mkt-soft)] text-[var(--mkt-green-deep)]"
                      : "border-[var(--mkt-line)] bg-white/80 text-[var(--mkt-muted)] hover:border-[var(--mkt-green)]/25 hover:text-[var(--mkt-ink)]",
                  )}
                >
                  {page.label}
                </a>
              );
            })}
          </nav>
        </header>

        <article className="rounded-[28px] border border-white/90 bg-white px-5 py-7 shadow-[0_24px_60px_-40px_rgba(26,28,44,0.28)] sm:px-8 sm:py-9">
          <div className="border-b border-[var(--mkt-line)] pb-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--mkt-muted)]">
              Legal
            </p>
            <h1 className="mt-2 text-[1.65rem] font-bold tracking-tight text-[var(--mkt-ink)] sm:text-[1.9rem]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--mkt-muted)]">{subtitle}</p>
            ) : null}
            <p className="mt-3 text-[12px] font-medium text-[var(--mkt-muted)]">
              Last updated: {LEGAL_LAST_UPDATED}
            </p>
          </div>

          <div className="mt-6 space-y-6 text-[14px] leading-relaxed text-[var(--mkt-ink)]/80">
            {children}
          </div>

          <footer className="mt-8 border-t border-[var(--mkt-line)] pt-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--mkt-muted)]">
              Related documents
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
              {LEGAL_PAGES.filter((page) => page.id !== activePage).map((page) => (
                <li key={page.id}>
                  <LegalLink href={page.path}>{page.label}</LegalLink>
                </li>
              ))}
            </ul>
          </footer>
        </article>

        <p className="mt-6 text-center text-[12px] text-[var(--mkt-muted)]">
          © {new Date().getFullYear()} {BRAND.name}. Questions?{" "}
          <a
            href={`mailto:${BRAND.legal.supportEmail}`}
            className="font-medium text-[var(--mkt-green-deep)] hover:underline"
          >
            {BRAND.legal.supportEmail}
          </a>
        </p>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h2 className="text-[15px] font-bold tracking-tight text-[var(--mkt-ink)]">{title}</h2>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}
