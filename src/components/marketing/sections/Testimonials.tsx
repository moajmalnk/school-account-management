import { Quote, Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { easeOutExpo } from "@/components/marketing/motion";
import { MARKETING } from "@/lib/marketing-content";
import { cn } from "@/lib/utils";

const { testimonials } = MARKETING;

const PLAN_STYLES = {
  Basic: "bg-slate-100 text-slate-700 border-slate-200",
  Premium: "bg-[#e8f7e0] text-[#3d7a28] border-[#c8e8b8]",
  Enterprise: "bg-[#1A1C2C] text-white border-[#1A1C2C]",
} as const;

const STATUS_STYLES = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Trial: "bg-violet-50 text-violet-700 border-violet-200",
} as const;

const MARQUEE_ITEMS = [...testimonials.items, ...testimonials.items];

function SchoolAvatar({ initials }: { initials: string }) {
  return (
    <div
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[13px] font-bold tracking-wide text-white shadow-[0_4px_14px_rgba(15,118,110,0.28)]"
      style={{ background: "linear-gradient(145deg, #0f766e 0%, #115e59 100%)" }}
      aria-hidden
    >
      {initials}
    </div>
  );
}

function PlanBadge({ plan }: { plan: keyof typeof PLAN_STYLES }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        PLAN_STYLES[plan],
      )}
    >
      {plan}
    </span>
  );
}

function StatusBadge({ status }: { status: keyof typeof STATUS_STYLES }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        STATUS_STYLES[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden />
      {status}
    </span>
  );
}

function TestimonialCard({
  item,
  reduce,
}: {
  item: (typeof testimonials.items)[number];
  reduce: boolean | null;
}) {
  const usagePct = Math.round((item.enrolled / item.seats) * 100);

  return (
    <article className="group relative flex h-full w-[min(88vw,360px)] shrink-0 flex-col overflow-hidden rounded-2xl border border-[rgba(26,28,44,0.1)] bg-white p-5 shadow-[0_10px_30px_rgba(26,28,44,0.08),0_2px_8px_rgba(26,28,44,0.04)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[rgba(143,202,74,0.4)] hover:shadow-[0_18px_44px_rgba(143,202,74,0.16),0_4px_12px_rgba(26,28,44,0.06)] sm:w-[380px] sm:p-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.95) 40%, rgba(255,255,255,0.95) 60%, transparent)",
        }}
      />

      <div className="flex items-start gap-3.5">
        <SchoolAvatar initials={item.initials} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold leading-snug tracking-tight text-[var(--mkt-ink)]">
            {item.school}
          </h3>
          <p className="mt-0.5 truncate font-mono text-[11px] text-[#0f766e]">
            {item.subdomain}.schoolaccounts.in
          </p>
          {"tenantId" in item && item.tenantId ? (
            <p className="mt-0.5 font-mono text-[10px] text-[var(--mkt-muted)]">{item.tenantId}</p>
          ) : null}
        </div>
        <Quote
          className="h-5 w-5 shrink-0 text-[var(--mkt-green)]/35 transition-colors group-hover:text-[var(--mkt-green)]/60"
          strokeWidth={2}
          aria-hidden
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <PlanBadge plan={item.plan} />
        <StatusBadge status={item.status} />
      </div>

      <div className="mt-4 flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, starIndex) => (
          <Star
            key={starIndex}
            className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
            strokeWidth={0}
            aria-hidden
          />
        ))}
        <span className="sr-only">5 out of 5 stars</span>
      </div>

      <blockquote className="mt-3 flex-1 text-[13px] leading-relaxed text-[var(--mkt-ink)]/78">
        “{item.quote}”
      </blockquote>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-[var(--mkt-muted)]">
        {item.role}
      </p>

      <div className="mt-4 rounded-xl border border-[rgba(26,28,44,0.08)] bg-[#f8fff4] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[var(--mkt-muted)]">
          <span>Seat usage</span>
          <span className="text-[var(--mkt-ink)]">{usagePct}%</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[12px]">
          <span>
            <strong className="font-bold text-[var(--mkt-ink)]">{item.enrolled}</strong>
            <span className="text-[var(--mkt-muted)]"> enrolled</span>
          </span>
          <span className="text-[var(--mkt-muted)]">{item.seats} seats</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #0f766e, #8FCA4A)",
              width: `${usagePct}%`,
              transformOrigin: "left center",
            }}
            initial={reduce ? undefined : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, ease: easeOutExpo }}
          />
        </div>
      </div>
    </article>
  );
}

export function Testimonials() {
  const reduce = useReducedMotion();
  const totalEnrolled = testimonials.items.reduce((sum, item) => sum + item.enrolled, 0);

  return (
    <section
      id="setup"
      className="scroll-mt-24 relative overflow-hidden py-14 sm:py-20 lg:py-24"
      aria-labelledby="testimonials-heading"
      style={{
        background:
          "radial-gradient(ellipse 70% 60% at 10% 30%, rgba(143,202,74,0.08) 0%, transparent 55%)," +
          "radial-gradient(ellipse 60% 50% at 90% 70%, rgba(107,168,50,0.07) 0%, transparent 50%)," +
          "linear-gradient(180deg,#ffffff 0%,#f8fff4 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 right-0 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(143,202,74,0.10) 0%, transparent 70%)" }}
          animate={reduce ? undefined : { scale: [1, 1.2, 1], x: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, ease: easeOutExpo }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--mkt-muted)]">
              {testimonials.eyebrow}
            </p>
            <h2
              id="testimonials-heading"
              className="mt-3 text-[clamp(1.75rem,4.5vw,2.5rem)] font-bold tracking-tight text-[var(--mkt-ink)]"
            >
              {testimonials.title}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--mkt-muted)] sm:text-[15px]">
              {testimonials.subtitle}
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--mkt-line)] bg-white/80 px-4 py-1.5 text-[12px] font-semibold text-[var(--mkt-ink)] shadow-sm backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-[var(--mkt-green)]" aria-hidden />
              {totalEnrolled}+ students enrolled across featured campuses
            </p>
          </motion.div>
        </div>

        <motion.div
          className="relative mt-12 lg:mt-14"
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-5% 0px" }}
          transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.1 }}
          aria-label="School testimonials"
        >
          <div className="relative overflow-hidden rounded-[28px] border border-[rgba(143,202,74,0.2)] bg-white/55 py-6 shadow-[0_16px_48px_rgba(26,28,44,0.06),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-sm sm:py-8">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-white/95 via-white/70 to-transparent sm:h-10"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-white/95 via-white/70 to-transparent sm:h-10"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white/95 via-white/75 to-transparent sm:w-20"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white/95 via-white/75 to-transparent sm:w-20"
              aria-hidden
            />

            <div className={cn("overflow-hidden", reduce && "overflow-x-auto")}>
              <div className={cn(!reduce && "mkt-testimonial-track", reduce && "flex gap-5 px-5")}>
                {MARQUEE_ITEMS.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="mkt-testimonial-slide shrink-0">
                    <TestimonialCard item={item} reduce={reduce} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
