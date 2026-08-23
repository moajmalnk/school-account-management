import { Check, X } from "lucide-react";

import { MARKETING } from "@/lib/marketing-content";

const { compare } = MARKETING;

export function Compare() {
  return (
    <section
      id="compare"
      className="scroll-mt-20 bg-[var(--mkt-soft)] py-16 sm:py-20"
      aria-labelledby="compare-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--mkt-green-deep)]">
          {compare.eyebrow}
        </p>
        <h2
          id="compare-heading"
          className="mt-2 max-w-xl text-[clamp(1.6rem,3.5vw,2.15rem)] font-bold tracking-tight text-[var(--mkt-ink)]"
        >
          {compare.title}
        </h2>

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
          <img
            src={compare.image}
            alt={compare.imageAlt}
            width={900}
            height={700}
            className="h-auto w-full object-contain"
            loading="lazy"
            decoding="async"
          />

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="rounded-t-xl bg-[var(--mkt-ink)] px-4 py-2.5 text-[13px] font-semibold text-white">
                {compare.before.title}
              </h3>
              <ul className="space-y-0 overflow-hidden rounded-b-xl border border-t-0 border-[var(--mkt-line)] bg-white">
                {compare.before.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 border-b border-[var(--mkt-line)] px-4 py-3 text-[13.5px] text-[var(--mkt-muted)] last:border-b-0"
                  >
                    <X
                      className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="rounded-t-xl bg-[var(--mkt-green-deep)] px-4 py-2.5 text-[13px] font-semibold text-white">
                {compare.after.title}
              </h3>
              <ul className="space-y-0 overflow-hidden rounded-b-xl border border-t-0 border-[var(--mkt-line)] bg-white">
                {compare.after.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 border-b border-[var(--mkt-line)] px-4 py-3 text-[13.5px] font-medium text-[var(--mkt-ink)] last:border-b-0"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--mkt-green-deep)]"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
