import { ContactForm } from "@/components/marketing/ContactPage";
import { MARKETING_THEME_VARS } from "@/components/marketing/marketing-theme";

/** Compact demo / trial lead form for the marketing homepage. */
export function HomeLeadSection() {
  return (
    <section
      id="demo"
      className="border-t border-[var(--mkt-line)] bg-[#F7FCFA] py-16 sm:py-20"
      style={MARKETING_THEME_VARS}
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-start lg:px-10">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--mkt-green-deep)]">
            Get started
          </p>
          <h2 className="mt-3 text-[1.75rem] font-bold tracking-tight text-[var(--mkt-ink)] sm:text-[2.1rem]">
            Book a demo or request a trial
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--mkt-muted)]">
            Tell us about your school. We will reply within one business day with next steps — or
            start the 14-day trial yourself anytime.
          </p>
        </div>
        <ContactForm compact />
      </div>
    </section>
  );
}
