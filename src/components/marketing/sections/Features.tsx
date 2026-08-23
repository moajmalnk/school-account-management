import {
  BarChart3,
  Bus,
  Calculator,
  FileCheck2,
  LineChart,
  MessageSquare,
  Receipt,
  UserRound,
  Users,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import {
  SectionReveal,
  StaggerItem,
  StaggerReveal,
} from "@/components/marketing/SectionReveal";
import { MARKETING } from "@/lib/marketing-content";

const ICONS = [
  Calculator,
  MessageSquare,
  FileCheck2,
  Receipt,
  BarChart3,
  Users,
  UserRound,
  Bus,
  LineChart,
] as const;

const { features } = MARKETING;

export function Features() {
  const reduce = useReducedMotion();

  return (
    <section
      id="features"
      className="scroll-mt-24 bg-white py-14 sm:py-20 lg:py-24"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionReveal>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--mkt-green-deep)]">
            {features.eyebrow}
          </p>
          <h2
            id="features-heading"
            className="mt-2 max-w-xl text-[clamp(1.55rem,3.8vw,2.25rem)] font-bold tracking-tight text-[var(--mkt-ink)]"
          >
            {features.title}
          </h2>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--mkt-muted)]">
            {features.subtitle}
          </p>
        </SectionReveal>

        <StaggerReveal className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {features.items.map((item, i) => {
            const Icon = ICONS[i] ?? Calculator;
            return (
              <StaggerItem key={item.title}>
                <motion.div
                  whileHover={
                    reduce
                      ? undefined
                      : { y: -3, borderColor: "rgba(143,202,74,0.45)" }
                  }
                  className="flex h-full gap-3 rounded-2xl border border-[var(--mkt-line)] bg-[var(--mkt-soft)]/50 p-4 transition-colors sm:p-5"
                >
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--mkt-ink)] shadow-sm">
                    <Icon
                      className="h-[18px] w-[18px]"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold tracking-tight text-[var(--mkt-ink)]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--mkt-muted)]">
                      {item.hint}
                    </p>
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerReveal>
      </div>
    </section>
  );
}
