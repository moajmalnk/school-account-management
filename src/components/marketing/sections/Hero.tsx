import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";

import { HeroShowcase } from "@/components/marketing/HeroShowcase";
import { StoreBadge } from "@/components/marketing/StoreBadge";
import { TrialSignupLink } from "@/components/marketing/TrialSignupLink";
import { easeOutExpo } from "@/components/marketing/motion";
import { MARKETING } from "@/lib/marketing-content";
import { pushMarketingEvent } from "@/lib/seo/analytics";

export function Hero({ noDelay = false }: { noDelay?: boolean }) {
  const reduce = useReducedMotion();
  const baseDelay = noDelay ? 0 : 0.12;

  return (
    <section className="relative overflow-hidden bg-white pt-4 pb-14 sm:pt-8 sm:pb-20 lg:pb-24">
      <div className="mx-auto flex max-w-6xl flex-col px-5 sm:px-8 lg:px-10">
        <h1
          id="hero-heading"
          className="text-center text-[clamp(2.75rem,8vw,5.25rem)] font-extrabold leading-[1.08] tracking-tight text-[var(--mkt-ink)]"
        >
          Welcome To
          <br />
          <span className="text-[var(--mkt-green)]">Feezo</span>
        </h1>

        <div className="relative mt-8 w-full sm:mt-10 lg:mt-12">
          <HeroShowcase alt={MARKETING.hero.productImageAlt} startDelayMs={noDelay ? 0 : 900} />
        </div>

        <motion.div
          className="mt-10 flex flex-col items-center gap-6 sm:mt-14 sm:flex-row sm:items-end sm:justify-between sm:gap-10"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: easeOutExpo, delay: baseDelay + 0.22 }}
        >
          <p className="max-w-lg text-center text-[clamp(1rem,2.4vw,1.375rem)] font-medium leading-snug text-[var(--mkt-ink)] sm:text-left">
            {MARKETING.hero.support}
          </p>

          <div className="flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:w-auto">
            <div className="flex flex-row items-stretch gap-2 sm:gap-3">
              <TrialSignupLink
                ctaLocation="hero"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-[var(--mkt-green)] px-4 text-[14px] font-semibold text-white transition hover:bg-[var(--mkt-green-deep)] sm:flex-none sm:px-5"
              >
                Start 14-day trial
              </TrialSignupLink>
              <Link
                to="/contact"
                onClick={() => pushMarketingEvent("demo_request", { cta_location: "hero" })}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-[var(--mkt-line)] bg-white px-4 text-[14px] font-semibold text-[var(--mkt-ink)] transition hover:border-[var(--mkt-green)]/40 sm:flex-none sm:px-5"
              >
                Book a demo
              </Link>
            </div>
            <div className="flex flex-row items-stretch gap-2 sm:gap-3">
              <StoreBadge
                variant="play"
                reduce={reduce}
                onClick={() =>
                  pushMarketingEvent("app_download_click", {
                    cta_location: "hero",
                    store: "google_play",
                  })
                }
              />
              <StoreBadge
                variant="apple"
                reduce={reduce}
                onClick={() =>
                  pushMarketingEvent("app_download_click", {
                    cta_location: "hero",
                    store: "app_store",
                  })
                }
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
