import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";

import { SectionReveal } from "@/components/marketing/SectionReveal";
import { TrialSignupLink } from "@/components/marketing/TrialSignupLink";
import { BRAND } from "@/lib/brand";
import { MARKETING } from "@/lib/marketing-content";

const { finalCta } = MARKETING;

export function FinalCta() {
  const reduce = useReducedMotion();

  return (
    <section
      className="bg-white py-14 sm:py-20 lg:py-24"
      aria-labelledby="final-cta-heading"
    >
      <SectionReveal className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[24px] bg-[var(--mkt-green)] px-5 py-12 text-center sm:rounded-[28px] sm:px-10 sm:py-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(26,28,44,0.12) 1px, transparent 0)",
              backgroundSize: "16px 16px",
            }}
          />
          <div className="relative">
            <h2
              id="final-cta-heading"
              className="text-[clamp(1.45rem,3.5vw,2.1rem)] font-bold tracking-tight text-[var(--mkt-ink)]"
            >
              {finalCta.title}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--mkt-ink)]/75">
              {finalCta.body}
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <motion.div
                whileHover={reduce ? undefined : { scale: 1.03 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
              >
                <TrialSignupLink className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--mkt-ink)] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-black sm:w-auto">
                  {finalCta.primaryCta}
                </TrialSignupLink>
              </motion.div>
              <motion.div
                whileHover={reduce ? undefined : { scale: 1.03 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
              >
                <Link
                  to="/login"
                  className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[var(--mkt-ink)]/20 bg-white/80 px-6 text-[14px] font-semibold text-[var(--mkt-ink)] backdrop-blur transition-colors hover:bg-white sm:w-auto"
                >
                  {finalCta.secondaryCta}
                </Link>
              </motion.div>
            </div>
            <p className="mt-6 text-[13px] text-[var(--mkt-ink)]/60">
              Need help?{" "}
              <a
                href={`mailto:${BRAND.legal.supportEmail}`}
                className="font-medium underline underline-offset-2 hover:text-[var(--mkt-ink)]"
              >
                {BRAND.legal.supportEmail}
              </a>
            </p>
          </div>
        </div>
      </SectionReveal>
    </section>
  );
}
