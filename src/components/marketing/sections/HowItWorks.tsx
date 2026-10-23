import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { easeOutExpo } from "@/components/marketing/motion";
import { MARKETING } from "@/lib/marketing-content";

const { problems, showcase } = MARKETING;

function useCountUp(target: number, duration = 1.4, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    let frame = 0;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [start, target, duration]);
  return count;
}

function StatPill({
  value,
  suffix = "",
  label,
  delay,
}: {
  value: number;
  suffix?: string;
  label: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const count = useCountUp(value, 1.35, inView);
  const reduce = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className="flex min-w-[8.5rem] flex-1 flex-col items-center px-5 py-4 text-center"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: easeOutExpo, delay }}
    >
      <div className="text-[2.1rem] font-semibold leading-none tracking-tight text-[var(--mkt-ink)] sm:text-[2.4rem]">
        <span className="text-[var(--mkt-green-deep)]">
          {count}
          {suffix}
        </span>
      </div>
      <div className="mt-2 text-[12.5px] font-medium tracking-wide text-[var(--mkt-muted)]">
        {label}
      </div>
    </motion.div>
  );
}

function ShowcaseCard({
  item,
  index,
  featured = false,
}: {
  item: (typeof showcase.items)[number];
  index: number;
  featured?: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.figure
      className={featured ? "mx-auto w-full max-w-[22rem] sm:max-w-[26rem] lg:max-w-[28rem]" : "w-full"}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, ease: easeOutExpo, delay: Math.min(index, 3) * 0.07 }}
    >
      <motion.div
        className="relative"
        whileHover={reduce ? undefined : { y: -4 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
      >
        {/* Soft ambient glow — elegant depth without a heavy card chrome */}
        <div
          className="pointer-events-none absolute -inset-5 rounded-[2.5rem] opacity-70 sm:-inset-7"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 55%, rgba(143,202,74,0.18) 0%, transparent 72%)",
          }}
          aria-hidden
        />
        <div className="relative overflow-hidden rounded-[1.35rem] bg-white/40 shadow-[0_30px_80px_-48px_rgba(26,28,44,0.55)] ring-1 ring-black/[0.04] sm:rounded-[1.6rem]">
          <img
            src={item.image}
            alt={item.alt}
            width={768}
            height={1024}
            className="h-auto w-full object-cover object-top"
            loading={index < 2 ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={index === 0 ? "high" : "auto"}
          />
        </div>
      </motion.div>

      <figcaption className="mt-5 text-center sm:mt-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--mkt-green-deep)]/90">
          {item.eyebrow}
        </p>
        <p className="mx-auto mt-1.5 max-w-[18rem] text-[14px] font-medium leading-snug text-[var(--mkt-ink)]/80 sm:text-[15px]">
          {item.headline}
        </p>
      </figcaption>
    </motion.figure>
  );
}

export function HowItWorks() {
  const reduce = useReducedMotion();

  return (
    <section
      id="problems"
      className="scroll-mt-24 relative overflow-hidden py-16 sm:py-24 lg:py-28"
      style={{
        background:
          "radial-gradient(ellipse 55% 40% at 50% 0%, rgba(143,202,74,0.08) 0%, transparent 60%)," +
          "linear-gradient(180deg, #ffffff 0%, #fafdf7 42%, #ffffff 100%)",
      }}
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: easeOutExpo }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--mkt-green-deep)]">
            {problems.eyebrow}
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-4 text-[clamp(1.85rem,4.5vw,3rem)] font-semibold leading-[1.15] tracking-tight text-[var(--mkt-ink)]"
          >
            {problems.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] font-normal leading-relaxed text-[var(--mkt-muted)] sm:text-[16px]">
            {showcase.subtitle}
          </p>
        </motion.div>

        <div className="mx-auto mt-10 flex max-w-3xl flex-col divide-y divide-[var(--mkt-line)] sm:mt-12 sm:flex-row sm:divide-x sm:divide-y-0">
          <StatPill value={80} suffix="+" label="Schools on Feezo" delay={0.05} />
          <StatPill value={14} label="Day free trial" delay={0.1} />
          <StatPill value={5} label="Core modules in one app" delay={0.15} />
        </div>

        <div className="mt-14 grid gap-5 sm:mt-16 sm:grid-cols-3 sm:gap-6">
          {problems.items.map((item, i) => (
            <motion.div
              key={item.title}
              className="rounded-2xl border border-[var(--mkt-line)]/70 bg-white/60 px-5 py-6 text-left backdrop-blur-sm sm:px-6"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: easeOutExpo, delay: i * 0.05 }}
            >
              <h3 className="text-[15px] font-semibold text-[var(--mkt-ink)] sm:text-[16px]">
                {item.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--mkt-muted)] sm:text-[13.5px]">
                {item.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Showcase — full-bleed elegance */}
      <div className="relative mt-20 sm:mt-24 lg:mt-28">
        <motion.div
          className="mx-auto max-w-2xl px-5 text-center sm:px-8"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--mkt-green-deep)]">
            {showcase.eyebrow}
          </p>
          <h3 className="mt-4 text-[clamp(1.65rem,3.8vw,2.5rem)] font-semibold leading-[1.2] tracking-tight text-[var(--mkt-ink)]">
            {showcase.title}
          </h3>
        </motion.div>

        <div className="mt-12 sm:mt-14 lg:mt-16">
          <ShowcaseCard item={showcase.items[0]} index={0} featured />
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-12 px-5 sm:mt-16 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-14 sm:px-8 lg:mt-20 lg:gap-x-14 lg:gap-y-16 lg:px-10">
          {showcase.items.slice(1).map((item, index) => (
            <ShowcaseCard key={item.id} item={item} index={index + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
