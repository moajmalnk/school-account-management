import { ArrowRight, Bell } from "lucide-react";
import { motion } from "motion/react";

import { easeOutExpo } from "@/components/marketing/motion";
import { MARKETING } from "@/lib/marketing-content";

const SETUP_HIGHLIGHTS = MARKETING.setup.highlights;
const FOLLOW_UP = MARKETING.followUp;
const BRANDING_STEP = MARKETING.setup.steps[0];
const STAFF_STEP = MARKETING.setup.steps[2];

const CARD =
  "relative overflow-hidden rounded-3xl border border-[rgba(26,28,44,0.08)] shadow-[0_2px_16px_rgba(26,28,44,0.04)]";

const FOLLOW_BTN_SHADOW = "shadow-[0_4px_14px_rgba(143,202,74,0.38)]";

function MintGlow({ position }: { position: "bottom-right" | "top-right" }) {
  const style =
    position === "bottom-right"
      ? "radial-gradient(ellipse 95% 85% at 100% 100%, rgba(143,202,74,0.32) 0%, rgba(143,202,74,0.08) 45%, transparent 74%)"
      : "radial-gradient(ellipse 90% 80% at 100% 0%, rgba(143,202,74,0.3) 0%, rgba(143,202,74,0.08) 42%, transparent 72%)";

  return (
    <div className="pointer-events-none absolute inset-0" style={{ background: style }} aria-hidden />
  );
}

export function DigitalTransformation() {
  return (
    <section
      id="product"
      className="scroll-mt-24 bg-white py-14 sm:py-20 lg:py-24"
      aria-labelledby="digital-transformation-heading"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <h2 id="digital-transformation-heading" className="sr-only">
          Product overview
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {/* Top left — brand setup */}
          <motion.article
            className={`${CARD} min-h-[300px] bg-white p-6 sm:min-h-[340px] sm:p-8`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, ease: easeOutExpo }}
          >
            <MintGlow position="bottom-right" />
            <div className="relative z-10 flex h-full flex-col">
              <h3 className="text-[22px] font-bold leading-[1.15] text-[var(--mkt-ink)] sm:text-[26px]">
                From school brand
                <br />
                to day-one profiles
              </h3>
              <p className="mt-2.5 max-w-[95%] text-[13px] leading-relaxed text-[var(--mkt-ink)]">
                {MARKETING.setup.body}
              </p>
              <div className="mt-6 flex flex-col gap-2.5 sm:mt-auto sm:pt-10">
                {SETUP_HIGHLIGHTS.map((pill, idx) => (
                  <motion.span
                    key={pill}
                    className="inline-flex w-fit max-w-full items-center rounded-full border border-[var(--mkt-ink)]/80 bg-white px-3.5 py-1.5 text-[11.5px] font-semibold text-[var(--mkt-ink)]"
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, ease: easeOutExpo, delay: 0.08 + idx * 0.05 }}
                  >
                    {pill}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.article>

          {/* Top right — follow-up */}
          <motion.article
            className={`${CARD} overflow-hidden bg-[#f4fbf0] md:h-[380px]`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, ease: easeOutExpo, delay: 0.06 }}
          >
            <MintGlow position="top-right" />
            <div className="relative z-10 flex flex-col md:h-[380px]">
              <div className="relative z-10 flex w-full flex-col p-6 sm:p-8 md:w-[36%] md:pr-0 md:pb-4 lg:w-[38%]">
                <h3 className="text-[22px] font-bold leading-[1.15] text-[var(--mkt-ink)] sm:text-[26px]">
                  One-click
                  <br />
                  follow-up
                </h3>
                <p className="mt-2.5 max-w-[28rem] text-[13px] leading-relaxed text-[var(--mkt-ink)] md:max-w-none">
                  {FOLLOW_UP.body}
                </p>
                <div className="mt-5 flex flex-col gap-2 sm:mt-6 md:mt-auto md:pt-4">
                  {FOLLOW_UP.steps.map((label, idx) => (
                    <span
                      key={label}
                      className={`inline-flex w-fit items-center gap-2 rounded-md px-3 py-1.5 text-[11px] font-semibold text-white ${FOLLOW_BTN_SHADOW} ${
                        idx === 2
                          ? "bg-[#A8D96A]"
                          : "bg-[var(--mkt-green)]"
                      }`}
                    >
                      {label}
                      {idx < 2 ? (
                        <ArrowRight className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>

              <motion.div
                className="relative mx-auto mt-1 flex h-[210px] w-full max-w-[320px] items-end justify-center sm:h-[240px] sm:max-w-[360px] md:pointer-events-none md:absolute md:inset-y-0 md:right-0 md:mx-0 md:mt-0 md:h-full md:max-w-none md:w-[64%] md:items-end md:justify-end lg:w-[62%]"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.75, ease: easeOutExpo, delay: 0.2 }}
              >
                <img
                  src="/digital/2.png"
                  alt={FOLLOW_UP.imageAlt}
                  className="h-full w-auto max-w-full object-contain object-bottom drop-shadow-[0_14px_32px_rgba(0,0,0,0.14)] md:max-w-none md:object-right-bottom"
                  decoding="async"
                />
              </motion.div>
            </div>
          </motion.article>

          {/* Bottom left — school details */}
          <motion.article
            className={`${CARD} flex min-h-[200px] flex-col gap-5 bg-white p-6 sm:min-h-[230px] sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:p-8`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, ease: easeOutExpo, delay: 0.04 }}
          >
            <div className="relative z-10 max-w-none sm:max-w-[70%]">
              <h3 className="text-xl font-bold leading-tight text-[var(--mkt-ink)] sm:text-[22px]">
                School details
                <br />
                & assets
              </h3>
              <p className="mt-2.5 text-[12px] leading-relaxed text-[var(--mkt-ink)] sm:text-[13px]">
                {BRANDING_STEP.body}
              </p>
            </div>
            <div className="relative z-10 flex h-[84px] w-[84px] shrink-0 items-center justify-center self-start rounded-2xl border border-[var(--mkt-line)] bg-white shadow-sm sm:mt-0.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--mkt-green)] shadow-[0_4px_12px_rgba(143,202,74,0.35)]">
                <Bell className="h-5 w-5 text-white" strokeWidth={2.5} aria-hidden />
              </div>
            </div>
          </motion.article>

          {/* Bottom right — staff setup */}
          <motion.article
            className={`${CARD} flex min-h-[230px] flex-col bg-white p-6 sm:min-h-[280px] sm:p-8`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, ease: easeOutExpo, delay: 0.08 }}
          >
            <div className="relative z-10">
              <h3 className="text-[22px] font-bold leading-tight text-[var(--mkt-ink)] sm:text-[26px]">
                Staff setup that scales
              </h3>
              <p className="mt-2.5 max-w-[95%] text-[13px] leading-relaxed text-[var(--mkt-ink)]">
                {STAFF_STEP.body}
              </p>
            </div>

            <div className="relative z-10 mt-auto flex items-center justify-between rounded-full border border-[var(--mkt-line)] bg-white p-1.5 shadow-sm">
              <span className="rounded-full bg-[var(--mkt-green)] px-5 py-1.5 text-[12px] font-bold text-white shadow-[0_3px_10px_rgba(143,202,74,0.3)]">
                Stats
              </span>
              <span className="px-4 text-[11px] font-medium text-[var(--mkt-muted)]">January 2026</span>
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
