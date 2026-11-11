import { ContactForm } from "@/components/marketing/ContactPage";
import { MARKETING_THEME_VARS } from "@/components/marketing/marketing-theme";

/** Compact demo / trial lead form for the marketing homepage. */
export function HomeLeadSection() {
  return (
    <section
      id="demo"
      className="relative overflow-hidden border-t border-[var(--mkt-line)] bg-[#F4FBF8] py-16 sm:py-20"
      style={{
        ...MARKETING_THEME_VARS,
        backgroundImage:
          "radial-gradient(ellipse 70% 55% at 18% 72%, rgba(216,243,234,0.9) 0%, transparent 62%), radial-gradient(ellipse 50% 40% at 88% 18%, rgba(220,245,236,0.55) 0%, transparent 55%)",
      }}
    >
      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-10">
        <div className="min-w-0">
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

          <div className="relative mt-6 w-full max-w-xl sm:mt-8 lg:-ml-4 lg:mt-10 lg:max-w-none">
            <div
              className="relative w-full overflow-hidden"
              style={{
                WebkitMaskImage:
                  "radial-gradient(ellipse 82% 84% at 58% 54%, #000 46%, transparent 100%), linear-gradient(#000 0%, #000 82%, transparent 100%)",
                WebkitMaskComposite: "source-in",
                maskImage:
                  "radial-gradient(ellipse 82% 84% at 58% 54%, #000 46%, transparent 100%), linear-gradient(#000 0%, #000 82%, transparent 100%)",
                maskComposite: "intersect",
              }}
            >
              <img
                src="/auth/login-hero.jpg?v=9"
                alt="Students collaborating on a laptop with school books and campus"
                width={1280}
                height={720}
                className="pointer-events-none h-auto w-full select-none object-contain"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
              />
            </div>
          </div>
        </div>
        <ContactForm compact />
      </div>
    </section>
  );
}
