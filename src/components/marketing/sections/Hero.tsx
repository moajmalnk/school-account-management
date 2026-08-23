import { Link } from "@tanstack/react-router";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef } from "react";

import {
  DeviceFrame,
  ProductShot,
} from "@/components/marketing/DeviceFrame";
import { easeOutExpo } from "@/components/marketing/motion";
import { MARKETING } from "@/lib/marketing-content";

const { hero } = MARKETING;

export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  const yArt = useTransform(smooth, [0, 1], [0, reduce ? 0 : 48]);
  const yShot = useTransform(smooth, [0, 1], [0, reduce ? 0 : -28]);
  const opacity = useTransform(smooth, [0, 0.85], [1, reduce ? 1 : 0.55]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-white"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 90% 10%, rgba(143,202,74,0.18), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(26,28,44,0.04), transparent 50%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(143,202,74,0.2) 1px, transparent 0)",
          backgroundSize: "18px 18px",
          maskImage:
            "radial-gradient(ellipse 65% 70% at 88% 18%, black 15%, transparent 72%)",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-10 sm:gap-12 sm:px-6 sm:pb-20 sm:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-10 lg:pb-24 lg:pt-16">
        <motion.div
          style={{ opacity }}
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
          className="relative z-10 min-w-0"
        >
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45, ease: easeOutExpo }}
            className="text-[13px] font-semibold tracking-wide text-[var(--mkt-green-deep)]"
          >
            {hero.brandLine}
          </motion.p>
          <h1
            id="hero-heading"
            className="mt-3 text-[clamp(2.15rem,7vw,3.75rem)] font-bold leading-[1.05] tracking-tight"
          >
            <span className="text-[var(--mkt-green-deep)]">
              {hero.headlineGreen}
            </span>
            <br />
            <span className="text-[var(--mkt-ink)]">{hero.headlineInk}</span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--mkt-muted)] sm:mt-5 sm:text-[17px]">
            {hero.support}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
            <motion.div
              whileHover={reduce ? undefined : { scale: 1.02 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
            >
              <Link
                to="/signup"
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--mkt-green)] px-6 text-[14px] font-semibold text-[var(--mkt-ink)] shadow-[0_12px_32px_-14px_rgba(107,168,50,0.55)] transition-colors hover:bg-[var(--mkt-green-deep)] hover:text-white sm:w-auto"
              >
                {hero.primaryCta}
              </Link>
            </motion.div>
            <motion.div
              whileHover={reduce ? undefined : { scale: 1.02 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
            >
              <Link
                to="/login"
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[var(--mkt-line)] bg-white px-6 text-[14px] font-semibold text-[var(--mkt-ink)] transition-colors hover:border-[var(--mkt-ink)]/25 hover:bg-[var(--mkt-soft)] sm:w-auto"
              >
                {hero.secondaryCta}
              </Link>
            </motion.div>
          </div>
          <p className="mt-4 text-[12px] font-medium text-[var(--mkt-muted)]">
            14-day trial · Create your school in minutes
          </p>
        </motion.div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <motion.div style={{ y: yShot }} className="relative z-10">
            <DeviceFrame label="app.feezo.app · dashboard">
              <ProductShot
                src={hero.productImage}
                alt={hero.productImageAlt}
                priority
              />
            </DeviceFrame>
          </motion.div>

          <motion.div
            style={{ y: yArt }}
            className="pointer-events-none absolute -bottom-6 -left-4 z-20 hidden w-[42%] max-w-[220px] sm:block lg:-left-8 lg:w-[46%]"
            initial={reduce ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.55, ease: easeOutExpo }}
          >
            <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_20px_50px_-28px_rgba(26,28,44,0.5)] ring-1 ring-[var(--mkt-line)]">
              <img
                src={hero.brandArt}
                alt=""
                width={400}
                height={300}
                className="h-auto w-full object-cover"
                loading="lazy"
                decoding="async"
                aria-hidden
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
