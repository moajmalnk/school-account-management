import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { SectionReveal, StaggerItem, StaggerReveal } from "@/components/marketing/SectionReveal";
import { TrialSignupLink } from "@/components/marketing/TrialSignupLink";
import { formatInr, MARKETING } from "@/lib/marketing-content";

const { pricing } = MARKETING;

export function Pricing() {
  const reduce = useReducedMotion();

  return (
    <section
      id="pricing"
      className="scroll-mt-24 bg-[var(--mkt-soft)] py-14 sm:py-20 lg:py-24"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <h2
            id="pricing-heading"
            className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight text-[var(--mkt-ink)]"
          >
            Start with a <span className="inline-block px-3 py-1 rounded bg-[var(--mkt-green)] text-white ml-1">14-day trial</span>
          </h2>
          <p className="mt-4 text-[13px] leading-relaxed text-[var(--mkt-ink)] font-medium max-w-[280px] mx-auto">
            Every plan includes a full evaluation period.<br/>Sign in when your school is ready.
          </p>
        </SectionReveal>

        <StaggerReveal className="mt-10 grid gap-5 sm:mt-12 lg:grid-cols-3">
          {pricing.plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <motion.div
                whileHover={reduce ? undefined : { y: -6 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                className={
                  plan.highlight
                    ? "relative flex h-full flex-col rounded-[24px] bg-white p-6 shadow-md border-2 border-[var(--mkt-green)] pt-10"
                    : "flex h-full flex-col rounded-[24px] border border-[var(--mkt-line)] bg-white p-6 pt-10"
                }
              >
                {plan.highlight ? (
                  <div className="absolute top-0 inset-x-0 h-8 bg-[var(--mkt-green)] text-white flex items-center justify-center text-[11px] font-bold uppercase tracking-wider rounded-t-[21px]">
                    Most Popular <Check className="w-3.5 h-3.5 ml-1 inline" />
                  </div>
                ) : null}

                <h3 className="text-[15px] font-bold text-[var(--mkt-ink)]">
                  {plan.name}
                </h3>
                <p className="mt-3 text-[2.25rem] font-bold tracking-tight text-[var(--mkt-ink)] leading-none">
                  ₹{formatInr(plan.monthly)}
                  <span className="text-[12px] font-medium text-[var(--mkt-muted)] ml-1 tracking-normal">
                    / month
                  </span>
                </p>
                
                <p className="mt-5 text-[12px] leading-relaxed text-[var(--mkt-ink)] font-medium">
                  {plan.blurb}
                </p>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-[12px] text-[var(--mkt-muted)]"
                    >
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--mkt-green)]"
                        aria-hidden
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <TrialSignupLink
                  className="mt-8 inline-flex h-10 items-center justify-center rounded-sm bg-[var(--mkt-green)] text-[13px] font-bold text-white transition-opacity hover:opacity-90 w-full"
                >
                  Start 14-day trial
                </TrialSignupLink>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
