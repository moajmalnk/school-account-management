import { ArrowRight } from "lucide-react";

import { MARKETING } from "@/lib/marketing-content";

const { followUp } = MARKETING;

export function FollowUp() {
  return (
    <section
      className="bg-white py-16 sm:py-20"
      aria-labelledby="followup-heading"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--mkt-green-deep)]">
            {followUp.eyebrow}
          </p>
          <h2
            id="followup-heading"
            className="mt-2 text-[clamp(1.6rem,3.5vw,2.15rem)] font-bold tracking-tight text-[var(--mkt-ink)]"
          >
            {followUp.title}
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--mkt-muted)]">
            {followUp.body}
          </p>

          <ol className="mt-8 flex flex-wrap items-center gap-2 sm:gap-3">
            {followUp.steps.map((step, i) => (
              <li key={step} className="flex items-center gap-2 sm:gap-3">
                <span className="inline-flex h-10 items-center rounded-full bg-[var(--mkt-green)] px-4 text-[13px] font-semibold text-[var(--mkt-ink)]">
                  {step}
                </span>
                {i < followUp.steps.length - 1 ? (
                  <ArrowRight
                    className="h-4 w-4 text-[var(--mkt-muted)]"
                    aria-hidden
                  />
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <img
          src={followUp.image}
          alt={followUp.imageAlt}
          width={800}
          height={640}
          className="h-auto w-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  );
}
