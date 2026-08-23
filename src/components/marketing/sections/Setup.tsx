import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import {
  DeviceFrame,
  ProductShot,
} from "@/components/marketing/DeviceFrame";
import {
  SectionReveal,
  StaggerItem,
  StaggerReveal,
} from "@/components/marketing/SectionReveal";
import { easeOutExpo } from "@/components/marketing/motion";
import { MARKETING } from "@/lib/marketing-content";
import { cn } from "@/lib/utils";

const { setup } = MARKETING;
const AUTO_MS = 6000;

export function Setup() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const step = setup.steps[active] ?? setup.steps[0];

  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % setup.steps.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [reduce, paused]);

  return (
    <section
      id="setup"
      className="scroll-mt-24 overflow-hidden bg-[var(--mkt-soft)] py-14 sm:py-20 lg:py-24"
      aria-labelledby="setup-heading"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0">
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

            <StaggerReveal className="mt-6 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
              {setup.highlights.map((item) => (
                <StaggerItem key={item}>
                  <motion.div
                    whileHover={reduce ? undefined : { y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    className="flex items-start gap-2.5 rounded-2xl border border-[var(--mkt-line)] bg-white px-3.5 py-3 shadow-[0_10px_30px_-24px_rgba(26,28,44,0.4)]"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--mkt-green)]/25 text-[var(--mkt-green-deep)]">
                      <Check
                        className="h-3 w-3"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                    </span>
                    <span className="text-[13px] font-medium leading-snug text-[var(--mkt-ink)] sm:text-[13.5px]">
                      {item}
                    </span>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerReveal>

            <SectionReveal className="mt-8" delay={0.05}>
              <div
                role="tablist"
                aria-label="Setup steps"
                className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {setup.steps.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={i === active}
                    aria-controls={`setup-panel-${s.id}`}
                    id={`setup-tab-${s.id}`}
                    onClick={() => setActive(i)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-[color,background-color,transform] active:scale-[0.98]",
                      i === active
                        ? "bg-[var(--mkt-ink)] text-white shadow-sm"
                        : "bg-white text-[var(--mkt-muted)] hover:text-[var(--mkt-ink)]",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  role="tabpanel"
                  id={`setup-panel-${step.id}`}
                  aria-labelledby={`setup-tab-${step.id}`}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: easeOutExpo }}
                  className="mt-5"
                >
                  <h3 className="text-[1.15rem] font-bold tracking-tight text-[var(--mkt-ink)] sm:text-[1.25rem]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--mkt-muted)] sm:text-[15px]">
                    {step.body}
                  </p>
                  {!reduce ? (
                    <div
                      className="mt-5 h-1 overflow-hidden rounded-full bg-[var(--mkt-line)]"
                      aria-hidden
                    >
                      <motion.div
                        key={`setup-bar-${step.id}-${paused}`}
                        className="h-full origin-left rounded-full bg-[var(--mkt-green)]"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: paused ? 0 : 1 }}
                        transition={{
                          duration: paused ? 0 : AUTO_MS / 1000,
                          ease: "linear",
                        }}
                      />
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </SectionReveal>
          </div>

          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.image}
                initial={reduce ? false : { opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.4, ease: easeOutExpo }}
              >
                <DeviceFrame
                  label={`feezo.app · ${step.label.toLowerCase()}`}
                >
                  <ProductShot
                    src={step.image}
                    alt={step.alt}
                    priority={active === 0}
                  />
                </DeviceFrame>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
