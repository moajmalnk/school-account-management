import { motion, useReducedMotion } from "motion/react";

import { StoreBadge } from "@/components/marketing/StoreBadge";
import { easeOutExpo } from "@/components/marketing/motion";
import { MARKETING } from "@/lib/marketing-content";

export function Hero({ noDelay = false }: { noDelay?: boolean }) {
  const reduce = useReducedMotion();
  const baseDelay = noDelay ? 0 : 0.12;

  return (
    <section className="relative overflow-hidden bg-white pt-4 pb-14 sm:pt-8 sm:pb-20 lg:pb-24">
      <div className="mx-auto flex max-w-6xl flex-col px-5 sm:px-8 lg:px-10">
        <motion.h1
          id="hero-heading"
          className="text-center text-[clamp(2.75rem,8vw,5.25rem)] font-extrabold leading-[1.08] tracking-tight text-[var(--mkt-ink)]"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: easeOutExpo, delay: baseDelay }}
        >
          Welcome To
          <br />
          <span className="text-[var(--mkt-green)]">Feezo</span>
        </motion.h1>

        <motion.div
          className="relative mt-8 w-full sm:mt-10 lg:mt-12"
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: easeOutExpo, delay: baseDelay + 0.1 }}
        >
          <img
            src="/home/home.png"
            alt={MARKETING.hero.productImageAlt}
            width={1600}
            height={900}
            decoding="async"
            fetchPriority="high"
            className="mx-auto block w-full max-w-[920px] h-auto bg-white object-contain"
          />
        </motion.div>

        <motion.div
          className="mt-10 flex flex-col gap-8 sm:mt-14 sm:flex-row sm:items-end sm:justify-between sm:gap-10"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: easeOutExpo, delay: baseDelay + 0.22 }}
        >
          <p className="max-w-lg text-left text-[clamp(1rem,2.4vw,1.375rem)] font-medium leading-snug text-[var(--mkt-ink)]">
            {MARKETING.hero.support}
          </p>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
            <StoreBadge variant="play" reduce={reduce} />
            <StoreBadge variant="apple" reduce={reduce} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
