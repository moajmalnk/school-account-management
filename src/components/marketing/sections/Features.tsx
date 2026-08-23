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
      className="scroll-mt-20 bg-white py-16 sm:py-20"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--mkt-green-deep)]">
          {features.eyebrow}
        </p>
        <h2
          id="features-heading"
          className="mt-2 max-w-xl text-[clamp(1.6rem,3.5vw,2.15rem)] font-bold tracking-tight text-[var(--mkt-ink)]"
        >
          {features.title}
        </h2>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--mkt-muted)]">
          {features.subtitle}
        </p>

        <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {features.items.map((item, i) => {
            const Icon = ICONS[i] ?? Calculator;
            return (
              <motion.li
                key={item.title}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.35,
                  delay: reduce ? 0 : i * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex gap-3"
              >
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--mkt-line)] bg-[var(--mkt-soft)] text-[var(--mkt-ink)]">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold tracking-tight text-[var(--mkt-ink)]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--mkt-muted)]">
                    {item.hint}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
