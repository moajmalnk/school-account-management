import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import {
  SectionReveal,
  StaggerItem,
  StaggerReveal,
} from "@/components/marketing/SectionReveal";
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
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--mkt-green-deep)]">
            {pricing.eyebrow}
          </p>
          <h2
            id="pricing-heading"
            className="mt-2 text-[clamp(1.55rem,3.8vw,2.25rem)] font-bold tracking-tight text-[var(--mkt-ink)]"
          >
            {pricing.title}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--mkt-muted)]">
            {pricing.subtitle}
          </p>
          <p className="mt-4 inline-flex rounded-full border border-[var(--mkt-green)]/40 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[var(--mkt-green-deep)]">
            {pricing.trialBadge}
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
                    ? "relative flex h-full flex-col rounded-3xl bg-[var(--mkt-ink)] p-6 text-white shadow-[0_28px_70px_-36px_rgba(26,28,44,0.6)]"
                    : "flex h-full flex-col rounded-3xl border border-[var(--mkt-line)] bg-white p-6"
                }
              >
                {"badge" in plan && plan.badge ? (
                  <span className="absolute -top-3 left-6 rounded-full bg-[var(--mkt-green)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--mkt-ink)]">
                    {plan.badge}
                  </span>
                ) : null}

                <h3
                  className={
                    plan.highlight
                      ? "text-[15px] font-semibold text-white/90"
                      : "text-[15px] font-semibold text-[var(--mkt-ink)]"
                  }
                >
                  {plan.name}
                </h3>
                <p
                  className={
                    plan.highlight
                      ? "mt-3 text-[2rem] font-bold tracking-tight"
                      : "mt-3 text-[2rem] font-bold tracking-tight text-[var(--mkt-ink)]"
                  }
                >
                  ₹{formatInr(plan.monthly)}
                  <span
                    className={
                      plan.highlight
                        ? "text-[14px] font-medium text-white/55"
                        : "text-[14px] font-medium text-[var(--mkt-muted)]"
                    }
                  >
                    {" "}
                    / mo
                  </span>
                </p>
                <p
                  className={
                    plan.highlight
                      ? "mt-1 text-[12px] text-white/50"
                      : "mt-1 text-[12px] text-[var(--mkt-muted)]"
                  }
                >
                  Offer ₹{formatInr(plan.annuallyOffer)} / year
                </p>
                <p
                  className={
                    plan.highlight
                      ? "mt-3 text-[13px] leading-relaxed text-white/70"
                      : "mt-3 text-[13px] leading-relaxed text-[var(--mkt-muted)]"
                  }
                >
                  {plan.blurb}
                </p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={
                        plan.highlight
                          ? "flex items-start gap-2 text-[13px] text-white/85"
                          : "flex items-start gap-2 text-[13px] text-[var(--mkt-ink)]"
                      }
                    >
                      <Check
                        className={
                          plan.highlight
                            ? "mt-0.5 h-4 w-4 shrink-0 text-[var(--mkt-green)]"
                            : "mt-0.5 h-4 w-4 shrink-0 text-[var(--mkt-green-deep)]"
                        }
                        aria-hidden
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/login"
                  className={
                    plan.highlight
                      ? "mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[var(--mkt-green)] text-[13px] font-semibold text-[var(--mkt-ink)] transition-colors hover:bg-[var(--mkt-green-deep)] hover:text-white"
                      : "mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[var(--mkt-ink)] text-[13px] font-semibold text-white transition-colors hover:bg-black"
                  }
                >
                  Start 14-day trial
                </Link>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
