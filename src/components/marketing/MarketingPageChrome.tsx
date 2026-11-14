import { Link } from "@tanstack/react-router";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { TrialSignupLink } from "@/components/marketing/TrialSignupLink";
import { easeOutExpo } from "@/components/marketing/motion";
import { SectionReveal, StaggerItem, StaggerReveal } from "@/components/marketing/SectionReveal";
import {
  pushMarketingEvent,
  type MarketingCtaLocation,
} from "@/lib/seo/analytics";
import { applyDocumentSeo, type PublicPageSeo } from "@/lib/seo/public-pages";
import { cn } from "@/lib/utils";

export function MarketingPageChrome({
  seo,
  children,
  className,
}: {
  seo: PublicPageSeo;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    applyDocumentSeo(seo);
  }, [seo]);

  return <div className={cn("relative overflow-hidden", className)}>{children}</div>;
}

export function MarketingPageHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(143,202,74,0.2) 0%, rgba(143,202,74,0.07) 42%, transparent 72%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-24 h-56 w-56 rounded-full bg-[var(--mkt-green-bright)]/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-40 h-44 w-44 rounded-full bg-[var(--mkt-green)]/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl px-5 pb-10 pt-12 text-center sm:px-8 sm:pb-14 sm:pt-16 lg:px-10">
        {eyebrow ? (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
            className="inline-flex items-center rounded-full border border-[var(--mkt-green)]/25 bg-white/80 px-3 py-1 text-[12px] font-semibold tracking-[0.04em] text-[var(--mkt-green-deep)] shadow-sm"
          >
            {eyebrow}
          </motion.p>
        ) : null}
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.05 }}
          className="mx-auto mt-4 max-w-3xl text-[clamp(1.85rem,4.5vw,3rem)] font-bold leading-[1.12] tracking-tight text-[var(--mkt-ink)]"
        >
          {title}
        </motion.h1>
        {lead ? (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: easeOutExpo, delay: 0.12 }}
            className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--mkt-muted)] sm:text-[17px]"
          >
            {lead}
          </motion.p>
        ) : null}
        {children ? (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.18 }}
            className="mt-8 flex justify-center"
          >
            {children}
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}

export function MarketingPageSection({
  children,
  className,
  soft = false,
  id,
}: {
  children: ReactNode;
  className?: string;
  soft?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-12 sm:py-16",
        soft && "bg-[linear-gradient(180deg,#f8fff4_0%,#ffffff_55%,#f8fff4_100%)]",
        className,
      )}
    >
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8 lg:px-10">{children}</div>
    </section>
  );
}

export function MarketingPageH2({ children, id, className }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <h2
      id={id}
      className={cn(
        "text-[clamp(1.35rem,3vw,1.85rem)] font-bold tracking-tight text-[var(--mkt-ink)]",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function MarketingPageBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("mt-4 max-w-3xl text-[15px] leading-relaxed text-[var(--mkt-muted)] sm:text-[16px]", className)}>
      {children}
    </p>
  );
}

export function MarketingIconCard({
  icon: Icon,
  title,
  body,
  index = 0,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  index?: number;
}) {
  return (
    <StaggerItem>
      <div
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--mkt-line)] bg-white/85 p-5 shadow-[0_10px_36px_-28px_rgba(26,28,44,0.45)] transition duration-300 hover:-translate-y-1 hover:border-[var(--mkt-green)]/35 hover:shadow-[0_18px_48px_-28px_rgba(63,122,31,0.35)] sm:p-6"
        style={{ animationDelay: `${index * 40}ms` }}
      >
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--mkt-soft)] text-[var(--mkt-green-deep)] transition group-hover:bg-[var(--mkt-green)] group-hover:text-white">
          <Icon className="h-5 w-5" strokeWidth={2.1} aria-hidden />
        </span>
        <h3 className="mt-4 text-[16px] font-semibold tracking-tight text-[var(--mkt-ink)]">{title}</h3>
        {body ? (
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--mkt-muted)]">{body}</p>
        ) : null}
      </div>
    </StaggerItem>
  );
}

export function MarketingStepCard({
  step,
  title,
  body,
}: {
  step: number;
  title: string;
  body: string;
}) {
  return (
    <StaggerItem>
      <div className="relative flex h-full flex-col rounded-2xl border border-[var(--mkt-line)] bg-white/90 p-5 shadow-[0_10px_36px_-28px_rgba(26,28,44,0.4)] sm:p-6">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--mkt-green)] text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(63,122,31,0.35)]">
          {step}
        </span>
        <h3 className="mt-4 text-[16px] font-semibold text-[var(--mkt-ink)]">{title}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--mkt-muted)]">{body}</p>
      </div>
    </StaggerItem>
  );
}

export function MarketingPageCtas({
  showDownload = false,
  location,
  className,
}: {
  showDownload?: boolean;
  location: MarketingCtaLocation;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-3", className)}>
      <TrialSignupLink
        ctaLocation={location}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--mkt-green)] px-5 text-[14px] font-semibold text-white transition hover:bg-[var(--mkt-green-deep)] hover:shadow-[0_10px_28px_rgba(63,122,31,0.28)]"
      >
        Start free 14-day trial
      </TrialSignupLink>
      <Link
        to="/contact"
        onClick={() => pushMarketingEvent("demo_request", { cta_location: location })}
        className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--mkt-line)] bg-white px-5 text-[14px] font-semibold text-[var(--mkt-ink)] transition hover:border-[var(--mkt-green)]/40"
      >
        Book a demo
      </Link>
      {showDownload ? (
        <Link
          to="/download"
          onClick={() =>
            pushMarketingEvent("app_download_click", { cta_location: "download", store: "landing" })
          }
          className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--mkt-line)] bg-white px-5 text-[14px] font-semibold text-[var(--mkt-ink)] transition hover:border-[var(--mkt-green)]/40"
        >
          Download the app
        </Link>
      ) : null}
    </div>
  );
}

export function MarketingCtaBand({
  title,
  body,
  location,
  showDownload = false,
}: {
  title: string;
  body: string;
  location: MarketingCtaLocation;
  showDownload?: boolean;
}) {
  return (
    <SectionReveal>
      <div
        className="relative overflow-hidden rounded-[28px] px-6 py-10 text-center sm:px-10 sm:py-12"
        style={{
          background:
            "linear-gradient(145deg, rgba(248,255,244,0.95) 0%, rgba(255,255,255,0.92) 45%, rgba(244,251,240,0.98) 100%)",
          border: "1px solid rgba(143,202,74,0.22)",
          boxShadow: "0 24px 60px -36px rgba(63,122,31,0.35)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--mkt-green-bright)]/25 blur-3xl"
        />
        <h2 className="relative text-[clamp(1.35rem,3vw,1.75rem)] font-bold tracking-tight text-[var(--mkt-ink)]">
          {title}
        </h2>
        <p className="relative mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--mkt-muted)]">
          {body}
        </p>
        <MarketingPageCtas location={location} showDownload={showDownload} className="relative mt-7" />
      </div>
    </SectionReveal>
  );
}

export function MarketingRelatedLinks({
  links,
}: {
  links: { to: "/product" | "/features" | "/pricing" | "/setup" | "/why-feezo" | "/download" | "/contact"; label: string }[];
}) {
  return (
    <nav className="mt-8 flex flex-wrap justify-center gap-2" aria-label="Related pages">
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to as never}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--mkt-line)] bg-white px-3.5 py-2 text-[13px] font-semibold text-[var(--mkt-ink)] transition hover:border-[var(--mkt-green)]/40 hover:text-[var(--mkt-green-deep)]"
        >
          {link.label}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ))}
    </nav>
  );
}

export function MarketingFeatureRow({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <SectionReveal>
      <article className="grid gap-4 rounded-[24px] border border-[var(--mkt-line)] bg-white/90 p-5 shadow-[0_14px_40px_-32px_rgba(26,28,44,0.45)] sm:grid-cols-[auto_1fr] sm:gap-6 sm:p-7">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--mkt-soft)] text-[var(--mkt-green-deep)]">
          <Icon className="h-5 w-5" strokeWidth={2.1} aria-hidden />
        </span>
        <div>
          <h2 className="text-[clamp(1.15rem,2.4vw,1.4rem)] font-bold tracking-tight text-[var(--mkt-ink)]">
            {title}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--mkt-muted)]">{body}</p>
        </div>
      </article>
    </SectionReveal>
  );
}

export { SectionReveal, StaggerReveal, StaggerItem };
