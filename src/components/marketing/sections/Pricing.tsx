import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { SectionReveal, StaggerItem, StaggerReveal } from "@/components/marketing/SectionReveal";
import { TrialSignupLink } from "@/components/marketing/TrialSignupLink";
import { formatInr, MARKETING } from "@/lib/marketing-content";

const { pricing } = MARKETING;

export function Pricing() {
  const reduce = useReducedMotion();

  return (
    <section
      id="pricing"
      className="scroll-mt-24 relative py-14 sm:py-20 lg:py-24 overflow-hidden"
      aria-labelledby="pricing-heading"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(143,202,74,0.13) 0%, transparent 55%)," +
          "radial-gradient(ellipse 60% 50% at 10% 80%, rgba(107,168,50,0.09) 0%, transparent 50%)," +
          "radial-gradient(ellipse 50% 40% at 90% 90%, rgba(143,202,74,0.08) 0%, transparent 45%)," +
          "linear-gradient(160deg, #f8fff4 0%, #faffe8 50%, #f8fff4 100%)",
      }}
    >
      {/* Animated bg elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-24 -left-24 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(143,202,74,0.16) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.22, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(107,168,50,0.12) 0%, transparent 70%)" }}
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Rotating ring decoration */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border"
          style={{ borderColor: "rgba(143,202,74,0.08)", borderStyle: "dashed" }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border"
          style={{ borderColor: "rgba(143,202,74,0.06)", borderStyle: "dashed" }}
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(rgba(143,202,74,0.3) 1.5px, transparent 1.5px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <h2
            id="pricing-heading"
            className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight text-[var(--mkt-ink)]"
          >
            Start with a{" "}
            <motion.span
              className="inline-block px-3 py-1 rounded text-white ml-1"
              style={{
                background: "linear-gradient(135deg, #8FCA4A, #5ec45f)",
                boxShadow: "0 4px 18px rgba(143,202,74,0.4)",
              }}
              animate={{
                boxShadow: [
                  "0 4px 18px rgba(143,202,74,0.3)",
                  "0 4px 30px rgba(143,202,74,0.65)",
                  "0 4px 18px rgba(143,202,74,0.3)",
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              14-day trial
            </motion.span>
          </h2>
          <p className="mt-4 text-[13px] leading-relaxed text-[var(--mkt-ink)] font-medium max-w-[280px] mx-auto">
            Every plan includes a full evaluation period.<br />Sign in when your school is ready.
          </p>
        </SectionReveal>

        <StaggerReveal className="mt-10 grid gap-5 sm:mt-12 lg:grid-cols-3">
          {pricing.plans.map((plan) => (
            <StaggerItem key={plan.name}>
              {plan.highlight ? (
                /* ── Featured card with rotating aurora border ── */
                <div className="relative h-full group">
                  {/* Rotating aurora border */}
                  <motion.div
                    className="absolute -inset-[2px] rounded-[26px] z-0"
                    style={{
                      background: "linear-gradient(90deg,rgba(143,202,74,0.9),rgba(200,235,160,0.7),rgba(107,168,50,0.9),rgba(143,202,74,0.9))",
                      backgroundSize: "300% 300%",
                      filter: "blur(4px)",
                    }}
                    animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="relative flex h-full flex-col z-10"
                    style={{
                      borderRadius: "24px",
                      background: "rgba(255,255,255,0.92)",
                      backdropFilter: "blur(24px) saturate(200%)",
                      WebkitBackdropFilter: "blur(24px) saturate(200%)",
                      border: "1.5px solid rgba(143,202,74,0.55)",
                      boxShadow: "0 20px 60px rgba(143,202,74,0.28), 0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
                      padding: "2.5rem 1.5rem 1.5rem",
                    }}
                    whileHover={reduce ? undefined : {
                      y: -10,
                      boxShadow: "0 32px 80px rgba(143,202,74,0.38), 0 8px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.98)",
                    }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  >
                    {/* Top banner */}
                    <div
                      className="absolute top-0 inset-x-0 h-8 text-white flex items-center justify-center text-[11px] font-bold uppercase tracking-wider"
                      style={{ background: "linear-gradient(90deg,#8FCA4A,#5ec45f)", borderRadius: "21px 21px 0 0" }}
                    >
                      Most Popular <Check className="w-3.5 h-3.5 ml-1 inline" />
                    </div>
                    {/* Glowing dot */}
                    <motion.div
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full"
                      style={{ background: "#8FCA4A", boxShadow: "0 0 12px rgba(143,202,74,0.9)" }}
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                    />
                    {/* Shimmer */}
                    <motion.div
                      className="absolute inset-0 rounded-[24px] pointer-events-none"
                      style={{ background: "linear-gradient(120deg,transparent 20%,rgba(255,255,255,0.5) 50%,transparent 80%)" }}
                      initial={{ x: "-100%" }}
                      animate={{ x: "320%" }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                    />

                    <PlanContent plan={plan} highlighted />
                  </motion.div>
                </div>
              ) : (
                /* ── Regular card ── */
                <motion.div
                  className="relative flex h-full flex-col cursor-default overflow-hidden mkt-aurora-border"
                  style={{
                    borderRadius: "24px",
                    background: "rgba(255,255,255,0.65)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    border: "1px solid rgba(143,202,74,0.22)",
                    boxShadow: "0 6px 28px rgba(143,202,74,0.10), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.88)",
                    padding: "2.5rem 1.5rem 1.5rem",
                  }}
                  whileHover={reduce ? undefined : {
                    y: -8,
                    boxShadow: "0 24px 60px rgba(143,202,74,0.24), 0 6px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
                    border: "1px solid rgba(143,202,74,0.4)",
                  }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                >
                  {/* Top shine */}
                  <div
                    className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                    style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.95) 40%,rgba(255,255,255,0.95) 60%,transparent)" }}
                  />
                  {/* Shimmer */}
                  <motion.div
                    className="absolute inset-0 rounded-[24px] pointer-events-none"
                    style={{ background: "linear-gradient(120deg,transparent 20%,rgba(255,255,255,0.4) 50%,transparent 80%)" }}
                    initial={{ x: "-100%" }}
                    animate={{ x: "320%" }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                  />
                  <PlanContent plan={plan} highlighted={false} />
                </motion.div>
              )}
            </StaggerItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}

function PlanContent({
  plan,
  highlighted,
}: {
  plan: (typeof pricing.plans)[number];
  highlighted: boolean;
}) {
  return (
    <>
      <h3 className="text-[15px] font-bold text-[var(--mkt-ink)] relative z-10">{plan.name}</h3>
      <p className="mt-3 text-[2.25rem] font-bold tracking-tight text-[var(--mkt-ink)] leading-none relative z-10">
        ₹{formatInr(plan.monthly)}
        <span className="text-[12px] font-medium text-[var(--mkt-muted)] ml-1 tracking-normal">/ month</span>
      </p>

      <p className="mt-5 text-[12px] leading-relaxed text-[var(--mkt-ink)] font-medium relative z-10">{plan.blurb}</p>

      <ul className="mt-6 flex-1 space-y-3 relative z-10">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-[12px] text-[var(--mkt-muted)]">
            <div
              className="mt-0.5 h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: highlighted ? "rgba(143,202,74,0.2)" : "rgba(143,202,74,0.12)" }}
            >
              <Check className="h-2.5 w-2.5 text-[var(--mkt-green)]" aria-hidden />
            </div>
            {f}
          </li>
        ))}
      </ul>

      <TrialSignupLink
        className="mt-8 inline-flex h-10 items-center justify-center text-[13px] font-bold text-white w-full relative z-10 overflow-hidden rounded-[10px] transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: highlighted
            ? "linear-gradient(135deg,#8FCA4A,#5ec45f)"
            : "linear-gradient(135deg,#8FCA4A,#6BA832)",
          boxShadow: highlighted
            ? "0 6px 22px rgba(143,202,74,0.55)"
            : "0 3px 12px rgba(143,202,74,0.3)",
        }}
      >
        Start 14-day trial
      </TrialSignupLink>
    </>
  );
}
