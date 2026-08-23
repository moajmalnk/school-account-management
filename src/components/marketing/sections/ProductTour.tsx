import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import {
  DeviceFrame,
  ProductShot,
} from "@/components/marketing/DeviceFrame";
import { SectionReveal } from "@/components/marketing/SectionReveal";
import { easeOutExpo } from "@/components/marketing/motion";
import { MARKETING } from "@/lib/marketing-content";
import { cn } from "@/lib/utils";

const { product } = MARKETING;
const AUTO_MS = 5500;

export function ProductTour() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const tab = product.tabs[active] ?? product.tabs[0];

  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % product.tabs.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [reduce, paused]);

  return (
    <section
      id="product"
      className="scroll-mt-24 bg-white py-14 sm:py-20 lg:py-24"
      aria-labelledby="product-heading"
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
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--mkt-green-deep)]">
            {product.eyebrow}
          </p>
          <h2
            id="product-heading"
            className="mt-2 text-[clamp(1.55rem,3.8vw,2.25rem)] font-bold tracking-tight text-[var(--mkt-ink)]"
          >
            {product.title}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--mkt-muted)] sm:text-[16px]">
            {product.subtitle}
          </p>
        </SectionReveal>

        <SectionReveal className="mt-8 sm:mt-10" delay={0.05}>
          <div
            role="tablist"
            aria-label="Product views"
            className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {product.tabs.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-controls={`product-panel-${t.id}`}
                id={`product-tab-${t.id}`}
                onClick={() => setActive(i)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-[color,background-color,transform] active:scale-[0.98]",
                  i === active
                    ? "bg-[var(--mkt-ink)] text-white shadow-sm"
                    : "bg-[var(--mkt-soft)] text-[var(--mkt-muted)] hover:text-[var(--mkt-ink)]",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </SectionReveal>

        <div className="mt-8 grid items-start gap-8 lg:mt-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
          <SectionReveal className="min-w-0 lg:pt-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.id}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: easeOutExpo }}
              >
                <h3 className="text-[1.25rem] font-bold tracking-tight text-[var(--mkt-ink)] sm:text-[1.4rem]">
                  {tab.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[var(--mkt-muted)]">
                  {tab.body}
                </p>
                {!reduce ? (
                  <div
                    className="mt-6 h-1 overflow-hidden rounded-full bg-[var(--mkt-line)]"
                    aria-hidden
                  >
                    <motion.div
                      key={`bar-${tab.id}-${paused}`}
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

          <div
            role="tabpanel"
            id={`product-panel-${tab.id}`}
            aria-labelledby={`product-tab-${tab.id}`}
            className="min-w-0"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.image}
                initial={reduce ? false : { opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.4, ease: easeOutExpo }}
              >
                <DeviceFrame label={`feezo.app · ${tab.label.toLowerCase()}`}>
                  <ProductShot
                    src={tab.image}
                    alt={tab.alt}
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
