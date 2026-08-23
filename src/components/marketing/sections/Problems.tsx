import { FileQuestion, Receipt, Wallet } from "lucide-react";

import { MARKETING } from "@/lib/marketing-content";

const ICONS = [Wallet, Receipt, FileQuestion] as const;
const { problems } = MARKETING;

export function Problems() {
  return (
    <section
      id="problems"
      className="scroll-mt-20 bg-[var(--mkt-soft)] py-16 sm:py-20"
      aria-labelledby="problems-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--mkt-green-deep)]">
          {problems.eyebrow}
        </p>
        <h2
          id="problems-heading"
          className="mt-2 max-w-2xl text-[clamp(1.6rem,3.5vw,2.15rem)] font-bold tracking-tight text-[var(--mkt-ink)]"
        >
          {problems.title}
        </h2>

        <ul className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {problems.items.map((item, i) => {
            const Icon = ICONS[i] ?? Wallet;
            return (
              <li key={item.title} className="min-w-0">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--mkt-green-deep)] shadow-[0_8px_24px_-16px_rgba(26,28,44,0.35)]">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="text-[17px] font-semibold tracking-tight text-[var(--mkt-ink)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--mkt-muted)]">
                  {item.body}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
