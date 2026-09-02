import {
  Bus,
  Calculator,
  FileSpreadsheet,
  GraduationCap,
  LineChart,
  MousePointerClick,
  Receipt,
  School,
  Users,
} from "lucide-react";
import { motion } from "motion/react";

import { easeOutExpo } from "@/components/marketing/motion";
import { MARKETING } from "@/lib/marketing-content";

const ICONS = [
  Calculator,
  MousePointerClick,
  Receipt,
  School,
  LineChart,
  GraduationCap,
  Users,
  Bus,
  FileSpreadsheet,
];

const { features } = MARKETING;

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 bg-white py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <motion.div
          className="mb-12 text-center sm:mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: easeOutExpo }}
        >
          <h2
            className="text-[clamp(2rem,5.5vw,3.25rem)] font-bold leading-tight tracking-tight text-[var(--mkt-ink)]"
          >
            a{" "}
            <span className="inline-block rounded-lg bg-[var(--mkt-green)] px-3 py-0.5 text-white">
              mini ERP
            </span>
            {" "}
            for your school
          </h2>
          <p className="mt-4 text-[15px] font-normal text-[var(--mkt-ink)] sm:text-[16px]">
            {features.subtitle}
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 justify-items-center gap-x-10 gap-y-8 sm:grid-cols-2 sm:justify-items-start sm:gap-y-10 lg:grid-cols-3">
          {features.items.map((item, i) => {
            const Icon = ICONS[i] ?? FileSpreadsheet;
            return (
              <motion.div
                key={item.title}
                className="flex w-fit items-center justify-center gap-4 sm:w-full sm:justify-start"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease: easeOutExpo, delay: i * 0.03 }}
              >
                <Icon
                  className="h-8 w-8 shrink-0 text-[var(--mkt-green)]"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="text-[15px] font-semibold leading-snug text-[var(--mkt-ink)] sm:text-[16px]">
                  {item.title}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
