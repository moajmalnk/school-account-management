import { FileQuestion, Receipt, Wallet } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import {
  SectionReveal,
  StaggerItem,
  StaggerReveal,
} from "@/components/marketing/SectionReveal";
import { MARKETING } from "@/lib/marketing-content";

const ICONS = [Wallet, Receipt, FileQuestion] as const;
const { problems } = MARKETING;

export function Problems() {
  const reduce = useReducedMotion();

  return (
    <section
      id="problems"
      className="scroll-mt-24 bg-[var(--mkt-soft)] py-14 sm:py-20 lg:py-24"
      aria-labelledby="problems-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionReveal>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--mkt-green-deep)]">
            {problems.eyebrow}
          </p>
          <h2
            id="problems-heading"
            className="mt-2 max-w-2xl text-[clamp(1.55rem,3.8vw,2.25rem)] font-bold tracking-tight text-[var(--mkt-ink)]"
          >
            {problems.title}
          </h2>
        </SectionReveal>

        <StaggerReveal className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-3 sm:gap-5">
          {problems.items.map((item, i) => {
            const Icon = ICONS[i] ?? Wallet;
            return (
              <StaggerItem key={item.title}>
                <motion.div
                  whileHover={reduce ? undefined : { y: -4 }}
                  transition={{ type: "spring", stiffness: 360, damping: 28 }}
                  className="h-full rounded-3xl border border-[var(--mkt-line)] bg-white p-5 shadow-[0_16px_40px_-32px_rgba(26,28,44,0.35)] sm:p-6"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--mkt-soft)] text-[var(--mkt-green-deep)]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </div>
                  <h3 className="text-[16px] font-semibold tracking-tight text-[var(--mkt-ink)] sm:text-[17px]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--mkt-muted)]">
                    {item.body}
                  </p>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerReveal>
      </div>
    </section>
  );
}
