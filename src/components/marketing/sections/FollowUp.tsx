import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { SectionReveal } from "@/components/marketing/SectionReveal";
import { easeOutExpo } from "@/components/marketing/motion";
import { MARKETING } from "@/lib/marketing-content";

const { followUp } = MARKETING;

export function FollowUp() {
  const reduce = useReducedMotion();

  return (
    <section
      className="bg-white py-14 sm:py-20 lg:py-24"
      aria-labelledby="followup-heading"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
        <SectionReveal className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--mkt-green-deep)]">
            {followUp.eyebrow}
          </p>
          <h2
            id="followup-heading"
            className="mt-2 text-[clamp(1.55rem,3.8vw,2.25rem)] font-bold tracking-tight text-[var(--mkt-ink)]"
          >
            {followUp.title}
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--mkt-muted)]">
            {followUp.body}
          </p>

          <ol className="mt-8 flex flex-wrap items-center gap-2 sm:gap-3">
            {followUp.steps.map((step, i) => (
              <li key={step} className="flex items-center gap-2 sm:gap-3">
                <motion.span
                  initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: reduce ? 0 : i * 0.12,
                    duration: 0.4,
                    ease: easeOutExpo,
                  }}
                  className="inline-flex h-10 items-center rounded-full bg-[var(--mkt-green)] px-4 text-[13px] font-semibold text-[var(--mkt-ink)]"
                >
                  {step}
                </motion.span>
                {i < followUp.steps.length - 1 ? (
                  <ArrowRight
                    className="h-4 w-4 text-[var(--mkt-muted)]"
                    aria-hidden
                  />
                ) : null}
              </li>
            ))}
          </ol>
        </SectionReveal>

        <SectionReveal delay={0.08}>
          <img
            src={followUp.image}
            alt={followUp.imageAlt}
            width={800}
            height={640}
            className="h-auto w-full object-contain"
            loading="lazy"
            decoding="async"
          />
        </SectionReveal>
      </div>
    </section>
  );
}
