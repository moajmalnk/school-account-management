import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { easeOutExpo } from "@/components/marketing/motion";
import { MARKETING } from "@/lib/marketing-content";
import { cn } from "@/lib/utils";

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

/** App Store–style single-row screenshot strip */
function ShowcaseStrip() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [active, setActive] = useState(0);
  const total = showcase.items.length;

  const sync = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    setCanPrev(el.scrollLeft > 6);
    setCanNext(el.scrollLeft < maxScroll - 6);

    const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-shot]"));
    if (!cards.length) return;

    const scrollerBox = el.getBoundingClientRect();
    // Prefer the card closest to the left padding edge (App Store primary shot)
    const targetX = scrollerBox.left + 20;
    let best = 0;
    let bestDist = Infinity;

    cards.forEach((card, i) => {
      const box = card.getBoundingClientRect();
      const dist = Math.abs(box.left - targetX);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });

    // At end of strip, lock to last shot
    if (maxScroll > 0 && el.scrollLeft >= maxScroll - 12) {
      best = cards.length - 1;
    }

    setActive(best);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      ro?.disconnect();
    };
  }, [sync]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const cards = el.querySelectorAll<HTMLElement>("[data-shot]");
      const card = cards[Math.max(0, Math.min(index, cards.length - 1))];
      if (!card) return;

      const pad = Number.parseFloat(getComputedStyle(el).paddingLeft) || 0;
      const delta =
        card.getBoundingClientRect().left - el.getBoundingClientRect().left - pad;
      el.scrollTo({
        left: Math.max(0, el.scrollLeft + delta),
        behavior: reduce ? "auto" : "smooth",
      });
      setActive(index);
    },
    [reduce],
  );

  const scrollByCard = (dir: -1 | 1) => {
    scrollToIndex(active + dir);
  };

  return (
    <div className="relative mt-10 sm:mt-12 lg:mt-14">
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#fafdf7] to-transparent transition-opacity sm:w-14",
          canPrev ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#fafdf7] to-transparent transition-opacity sm:w-14",
          canNext ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />

      <button
        type="button"
        onClick={() => scrollByCard(-1)}
        disabled={!canPrev}
        aria-label="Previous screenshot"
        className={cn(
          "absolute left-2 top-[42%] z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[var(--mkt-line)] bg-white/95 text-[var(--mkt-ink)] shadow-md backdrop-blur-sm transition enabled:hover:scale-105 enabled:hover:bg-white md:grid",
          !canPrev && "pointer-events-none opacity-0",
        )}
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        onClick={() => scrollByCard(1)}
        disabled={!canNext}
        aria-label="Next screenshot"
        className={cn(
          "absolute right-2 top-[42%] z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[var(--mkt-line)] bg-white/95 text-[var(--mkt-ink)] shadow-md backdrop-blur-sm transition enabled:hover:scale-105 enabled:hover:bg-white md:grid",
          !canNext && "pointer-events-none opacity-0",
        )}
      >
        <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
      </button>

      <div
        ref={scrollerRef}
        className="mkt-showcase-strip flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))] pb-2 pt-1 sm:gap-4 sm:px-[max(2rem,calc((100vw-72rem)/2+2rem))]"
        role="list"
        aria-label="App screenshots"
      >
        {showcase.items.map((item, index) => (
          <motion.figure
            key={item.id}
            data-shot
            data-index={index}
            role="listitem"
            className="mkt-showcase-shot relative shrink-0 snap-start"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, ease: easeOutExpo, delay: Math.min(index, 4) * 0.05 }}
          >
            <div className="h-full overflow-hidden rounded-[1.15rem] bg-white shadow-[0_18px_48px_-28px_rgba(26,28,44,0.45)] ring-1 ring-black/[0.05] sm:rounded-[1.35rem]">
              <img
                src={item.image}
                alt={item.alt}
                width={1080}
                height={1920}
                className="h-full w-full object-cover object-top"
                loading={index < 2 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                fetchPriority={index === 0 ? "high" : "auto"}
              />
            </div>
            <figcaption className="sr-only">
              {item.eyebrow}: {item.headline}
            </figcaption>
          </motion.figure>
        ))}
        {/* End spacer — lets last card snap fully into view */}
        <div className="w-[12vw] shrink-0 sm:w-[18vw]" aria-hidden />
      </div>

      {/* Page dots — one per screenshot, synced to scroll */}
      <div
        className="mt-7 flex items-center justify-center gap-2"
        role="tablist"
        aria-label="Screenshot pages"
      >
        {showcase.items.map((item, i) => {
          const isActive = i === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`${i + 1} of ${total}: ${item.eyebrow}`}
              onClick={() => scrollToIndex(i)}
              className={cn(
                "rounded-full transition-all duration-300 ease-out",
                isActive
                  ? "h-2 w-6 bg-[var(--mkt-green-deep)] shadow-[0_0_0_3px_rgba(107,168,50,0.18)]"
                  : "h-2 w-2 bg-[var(--mkt-ink)]/20 hover:bg-[var(--mkt-ink)]/40",
              )}
            />
          );
        })}
      </div>
    </div>
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

      {/* Showcase — App Store listing strip */}
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

        <ShowcaseStrip />
      </div>
    </section>
  );
}
