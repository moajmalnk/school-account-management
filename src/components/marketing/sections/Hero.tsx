import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";

import { MARKETING } from "@/lib/marketing-content";

const { hero } = MARKETING;

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section
      className="relative overflow-hidden bg-white"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(143,202,74,0.22) 1px, transparent 0)",
          backgroundSize: "18px 18px",
          maskImage:
            "radial-gradient(ellipse 70% 80% at 85% 20%, black 20%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-2 lg:items-center lg:gap-12 lg:pb-24 lg:pt-20">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0"
        >
          <p className="text-[13px] font-semibold tracking-wide text-[var(--mkt-green-deep)]">
            {hero.brandLine}
          </p>
          <h1
            id="hero-heading"
            className="mt-3 text-[clamp(2.35rem,6vw,3.75rem)] font-bold leading-[1.05] tracking-tight"
          >
            <span className="text-[var(--mkt-green-deep)]">
              {hero.headlineGreen}
            </span>
            <br />
            <span className="text-[var(--mkt-ink)]">{hero.headlineInk}</span>
          </h1>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-[var(--mkt-muted)] sm:text-[17px]">
            {hero.support}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--mkt-green)] px-6 text-[14px] font-semibold text-[var(--mkt-ink)] shadow-[0_12px_32px_-14px_rgba(107,168,50,0.55)] transition-[transform,background-color] hover:bg-[var(--mkt-green-deep)] hover:text-white active:scale-[0.98]"
            >
              {hero.primaryCta}
            </Link>
            <Link
              to="/login"
              className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--mkt-line)] bg-white px-6 text-[14px] font-semibold text-[var(--mkt-ink)] transition-colors hover:border-[var(--mkt-ink)]/25 hover:bg-[var(--mkt-soft)]"
            >
              {hero.secondaryCta}
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="relative min-w-0"
        >
          <img
            src={hero.image}
            alt={hero.imageAlt}
            width={960}
            height={720}
            className="h-auto w-full object-contain object-center"
            fetchPriority="high"
            decoding="async"
          />
        </motion.div>
      </div>
    </section>
  );
}
