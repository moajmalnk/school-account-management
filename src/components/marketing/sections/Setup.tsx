import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import {
  DeviceFrame,
  ProductShot,
} from "@/components/marketing/DeviceFrame";
import {
  SectionReveal,
  StaggerItem,
  StaggerReveal,
} from "@/components/marketing/SectionReveal";
import { MARKETING } from "@/lib/marketing-content";

const { setup } = MARKETING;

export function Setup() {
  const reduce = useReducedMotion();

  return (
    <section
      id="setup"
      className="scroll-mt-24 overflow-hidden bg-[var(--mkt-soft)] py-14 sm:py-20 lg:py-24"
      aria-labelledby="setup-heading"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
        <div className="order-2 min-w-0 lg:order-1">
          <DeviceFrame label="feezo.app · school setup">
            <ProductShot src={setup.image} alt={setup.imageAlt} />
          </DeviceFrame>
        </div>

        <div className="order-1 min-w-0 lg:order-2">
          <SectionReveal>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--mkt-green-deep)]">
              {setup.eyebrow}
            </p>
            <h2
              id="setup-heading"
              className="mt-2 text-[clamp(1.55rem,3.8vw,2.25rem)] font-bold tracking-tight text-[var(--mkt-ink)]"
            >
              {setup.title}
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--mkt-muted)] sm:text-[16px]">
              {setup.body}
            </p>
          </SectionReveal>

          <StaggerReveal className="mt-8 grid gap-3 sm:grid-cols-2">
            {setup.highlights.map((item) => (
              <StaggerItem key={item}>
                <motion.div
                  whileHover={reduce ? undefined : { y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="flex items-start gap-2.5 rounded-2xl border border-[var(--mkt-line)] bg-white px-3.5 py-3 shadow-[0_10px_30px_-24px_rgba(26,28,44,0.4)]"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--mkt-green)]/25 text-[var(--mkt-green-deep)]">
                    <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                  </span>
                  <span className="text-[13.5px] font-medium leading-snug text-[var(--mkt-ink)]">
                    {item}
                  </span>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </div>
    </section>
  );
}
