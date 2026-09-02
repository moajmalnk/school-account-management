import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { easeOutExpo } from "@/components/marketing/motion";
import { MARKETING } from "@/lib/marketing-content";

/* ── Glass card shared style ─────────────────────────── */
const glassCard = {
  background: "rgba(255,255,255,0.42)",
  backdropFilter: "blur(28px) saturate(200%)",
  WebkitBackdropFilter: "blur(28px) saturate(200%)",
  border: "1px solid rgba(143,202,74,0.30)",
  boxShadow:
    "0 8px 32px rgba(143,202,74,0.13), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.88)",
};

const hoverGlass = {
  y: -10,
  boxShadow:
    "0 28px 70px rgba(143,202,74,0.32), 0 8px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
  border: "1px solid rgba(143,202,74,0.55)",
};

/* ── Shimmer + corner-glint overlay ─────────────────── */
function CardShine() {
  return (
    <>
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(90deg,transparent,rgba(255,255,255,0.95) 40%,rgba(255,255,255,0.95) 60%,transparent)",
        }}
      />
      <div
        className="absolute top-0 left-0 w-28 h-28 pointer-events-none z-10 rounded-tl-3xl"
        style={{
          background:
            "radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.4) 0%, transparent 70%)",
        }}
      />
      {/* Animated shimmer sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(120deg,transparent 20%,rgba(255,255,255,0.5) 50%,transparent 80%)",
        }}
        initial={{ x: "-100%", skewX: -15 }}
        animate={{ x: "350%" }}
        transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 4 }}
      />
    </>
  );
}

/* ── Floating particles background ──────────────────── */
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 7) % 90}%`,
  top: `${10 + (i * 11) % 80}%`,
  size: 4 + (i % 3) * 3,
  delay: i * 0.6,
  duration: 3 + (i % 4),
  color:
    i % 3 === 0
      ? "rgba(143,202,74,0.55)"
      : i % 3 === 1
      ? "rgba(107,168,50,0.4)"
      : "rgba(200,235,160,0.6)",
}));

/* ── Count-up hook ───────────────────────────────────── */
function useCountUp(target: number, duration = 1.6, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

/* ── Stat card with count-up ─────────────────────────── */
function StatCard({
  value,
  suffix = "",
  label,
  label2,
  delay,
  colSpan = "md:col-span-3",
}: {
  value: number;
  suffix?: string;
  label: string;
  label2?: string;
  delay: number;
  colSpan?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const count = useCountUp(value, 1.5, inView);

  return (
    <motion.div
      ref={ref}
      className={`${colSpan} rounded-3xl p-8 flex flex-col justify-center items-center text-center cursor-default relative overflow-hidden mkt-aurora-border`}
      style={glassCard}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, ease: easeOutExpo, delay }}
      whileHover={hoverGlass}
    >
      <CardShine />
      {/* Rotating ring */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          background: "conic-gradient(from 0deg, rgba(143,202,74,0.06), rgba(107,168,50,0.12), rgba(143,202,74,0.06))",
          animation: "mkt-spin-slow 10s linear infinite",
        }}
      />
      <motion.div
        className="text-[4rem] font-bold leading-none mb-2 relative z-10"
        style={{
          color: "#5ec45f",
          textShadow: "0 0 30px rgba(94,196,95,0.35)",
          animation: "mkt-throb 4s ease-in-out infinite",
        }}
      >
        {count}{suffix}
      </motion.div>
      <div className="text-[20px] font-semibold text-[#1a1a1a] relative z-10 leading-tight">
        {label}{label2 && <><br />{label2}</>}
      </div>
    </motion.div>
  );
}


/* ══════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════ */
export function HowItWorks() {
  return (
    <section
      className="relative py-14 sm:py-24 lg:py-32 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(143,202,74,0.16) 0%, transparent 60%)," +
          "radial-gradient(ellipse 60% 50% at 80% 80%, rgba(107,168,50,0.13) 0%, transparent 55%)," +
          "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(200,235,160,0.10) 0%, transparent 65%)," +
          "linear-gradient(160deg, #f8fff4 0%, #ffffff 45%, #f2fae6 100%)",
      }}
      aria-labelledby="how-it-works-heading"
    >
      {/* ── Floating Particles ───────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
            animate={{
              y: [0, -60 - p.size * 4, 0],
              x: [0, (p.id % 2 === 0 ? 1 : -1) * 20, 0],
              opacity: [0, 0.8, 0],
              scale: [1, 0.6, 1],
            }}
            transition={{
              duration: p.duration + 2,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Drifting large orbs */}
        <motion.div
          className="absolute w-96 h-96 rounded-full"
          style={{
            top: "5%",
            left: "5%",
            background: "radial-gradient(circle, rgba(143,202,74,0.12) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, 50, 20, -30, 0],
            y: [0, -30, 30, -10, 0],
            scale: [1, 1.08, 0.96, 1.04, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full"
          style={{
            bottom: "8%",
            right: "5%",
            background: "radial-gradient(circle, rgba(107,168,50,0.10) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, -40, -10, 30, 0],
            y: [0, 25, -20, 10, 0],
            scale: [1, 0.95, 1.06, 0.98, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />

        {/* Dot grid texture */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(rgba(143,202,74,0.25) 1.5px, transparent 1.5px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="mx-auto max-w-[1080px] px-4 sm:px-6 relative z-10">

        {/* ── Header ───────────────────────────────────── */}
        <motion.div
          className="flex flex-col items-center text-center mb-24 relative w-full max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: easeOutExpo }}
        >
          <div className="relative inline-flex items-center justify-center mb-10 text-[28px] md:text-[34px] font-bold tracking-wide">
            <span className="text-[#1a1a1a] mr-2">How It</span>
            <span
              className="text-white px-2.5 py-1 rounded-[4px] leading-none relative"
              style={{
                background: "linear-gradient(135deg, #5ec45f, #8FCA4A)",
                boxShadow: "0 4px 18px rgba(94,196,95,0.4)",
              }}
            >
              Works
            </span>
            <div className="absolute -left-10 top-0 text-[#5ec45f] text-4xl font-light select-none pointer-events-none" style={{ WebkitTextStroke: "2px #5ec45f", color: "transparent", transform: "rotate(-10deg)" }}>!</div>
            <div className="absolute left-16 -top-8 text-[#5ec45f] text-3xl select-none pointer-events-none" style={{ WebkitTextStroke: "1px #5ec45f", color: "transparent" }}>*</div>
            <div className="absolute -right-12 -top-4 text-[#5ec45f] text-4xl font-light select-none pointer-events-none" style={{ WebkitTextStroke: "2px #5ec45f", color: "transparent", transform: "rotate(15deg)" }}>?</div>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[#5ec45f] text-3xl font-light select-none pointer-events-none" style={{ WebkitTextStroke: "2px #5ec45f", color: "transparent", transform: "rotate(10deg)" }}>#</div>
          </div>

          <div className="relative w-full flex flex-col items-center mt-6">
            {/* Top glassmorphism pill */}
            <motion.div
              className="absolute -top-10 left-1/2 -translate-x-1/2 text-[#1a1a1a] text-[13px] font-bold px-5 py-2 rounded-full whitespace-nowrap z-10"
              style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1.5px solid rgba(143,202,74,0.4)",
                boxShadow: "0 4px 20px rgba(143,202,74,0.2), 0 1px 4px rgba(0,0,0,0.05)",
              }}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              How Much is Outstanding
            </motion.div>

            <h2 id="how-it-works-heading" className="text-[3.5rem] md:text-[5.5rem] font-bold text-[#1a1a1a] leading-[1] tracking-tight relative z-0">
              How many
              <span className="absolute -right-14 top-4 text-[#5ec45f] text-7xl font-light select-none pointer-events-none" style={{ WebkitTextStroke: "2px #5ec45f", color: "transparent", transform: "rotate(15deg)" }}>?</span>
              <br />
              <span className="absolute -left-12 bottom-20 text-[#5ec45f] text-7xl font-light select-none pointer-events-none" style={{ WebkitTextStroke: "2px #5ec45f", color: "transparent", transform: "rotate(-10deg)" }}>!</span>
              fee{" "}
              <span
                className="inline-block text-white px-5 py-2 md:py-2.5 rounded-lg mx-1 -rotate-2"
                style={{
                  background: "linear-gradient(135deg, #5ec45f, #8FCA4A)",
                  boxShadow: "0 6px 24px rgba(94,196,95,0.4)",
                }}
              >
                payments
              </span>
              {" "}<br />
              are pending
            </h2>

            {/* Bottom pills */}
            <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-6 whitespace-nowrap w-full justify-center">
              {["Who Is Pending", "Who Has Paid"].map((label, i) => (
                <motion.div
                  key={label}
                  className="text-white text-sm font-bold px-6 py-2 rounded-full cursor-default"
                  style={{
                    background: "linear-gradient(135deg, #5ec45f, #6BA832)",
                    boxShadow: "0 6px 20px rgba(94,196,95,0.4)",
                    rotate: i === 0 ? "-3deg" : "3deg",
                  }}
                  whileHover={{ scale: 1.1, rotate: 0, boxShadow: "0 10px 30px rgba(94,196,95,0.55)" }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {label}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Bento Grid ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-[minmax(220px,auto)] mt-36">

          {/* Card 1: 80+ Schools */}
          <StatCard value={80} suffix="+" label="Schools" delay={0.1} />

          {/* Card 2: Built for */}
          <motion.div
            className="md:col-span-6 rounded-3xl p-8 pl-10 flex items-center justify-between overflow-hidden relative cursor-default mkt-aurora-border"
            style={glassCard}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.2 }}
            whileHover={hoverGlass}
          >
            <CardShine />
            <div className="relative z-10 w-[50%]">
              <h3 className="text-[28px] font-bold leading-[1.1] mb-3">
                <span className="text-[#1a1a1a]">Built for</span><br />
                <span style={{ color: "#5ec45f" }}>how schools</span><br />
                <span style={{ color: "#5ec45f" }}>actually work</span>
              </h3>
              <p className="text-[13px] text-[#6b7280] leading-relaxed pr-4">
                Dashboard, students, fees, staff, plans, and support — one workspace your team can open on day one
              </p>
            </div>
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-[55%] flex items-center justify-end"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.4 }}
            >
              <img src="/works/1.png" alt="Platform overview" className="w-full h-[110%] object-contain object-right drop-shadow-lg translate-x-2" />
            </motion.div>
          </motion.div>

          {/* Card 3: 14 Days */}
          <StatCard value={14} label="Days" label2="Free trial" delay={0.3} />

          {/* Card 4: Directory */}
          <motion.div
            className="md:col-span-6 rounded-3xl p-8 pl-10 flex items-center justify-between overflow-hidden relative min-h-[300px] cursor-default mkt-aurora-border"
            style={glassCard}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.1 }}
            whileHover={hoverGlass}
          >
            <CardShine />
            <div className="relative z-10 w-[45%] h-full flex flex-col justify-center">
              <h3 className="text-[28px] font-bold leading-[1.1] mb-4">
                <span className="text-[#1a1a1a]">Directory with</span><br />
                <span style={{ color: "#5ec45f" }}>fees &</span><br />
                <span style={{ color: "#5ec45f" }}>follow-up</span>
              </h3>
              <p className="text-[13px] text-[#6b7280] leading-relaxed">
                Search, filter by class, call or WhatsApp guardians, and see overdue fees without leaving the list.
              </p>
            </div>
            <motion.div
              className="absolute right-0 bottom-0 top-0 w-[55%] flex items-end justify-end pt-8 pr-2"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.3 }}
            >
              <img src="/works/2.png" alt="Directory features" className="w-[105%] max-h-full object-contain object-right-bottom drop-shadow-lg" />
            </motion.div>
          </motion.div>

          {/* Card 5: Student Fees */}
          <motion.div
            className="md:col-span-6 rounded-3xl p-8 pl-10 flex items-center justify-between overflow-hidden relative min-h-[300px] cursor-default mkt-aurora-border"
            style={glassCard}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.2 }}
            whileHover={hoverGlass}
          >
            <CardShine />
            <div className="relative z-10 w-[50%] h-full flex flex-col justify-center">
              <h3 className="text-[28px] font-bold leading-[1.1] mb-4">
                <span style={{ color: "#5ec45f" }}>Student fees,</span><br />
                <span className="text-[#1a1a1a]">installment by</span><br />
                <span className="text-[#1a1a1a]">installment</span>
              </h3>
              <p className="text-[13px] text-[#6b7280] leading-relaxed pr-2">
                See total fee, paid, and due. Collect payments, flag overdue installments, and WhatsApp parents from the profile.
              </p>
            </div>
            <motion.div
              className="absolute right-0 bottom-0 top-0 w-[55%] flex items-end justify-end pt-6"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.4 }}
            >
              <img src="/works/3.png" alt="Student fee management" className="w-full max-h-[105%] object-contain object-right-bottom drop-shadow-lg" />
            </motion.div>
          </motion.div>

          {/* Card 6: Financial Overview */}
          <motion.div
            className="md:col-span-9 rounded-3xl p-10 pl-12 flex overflow-hidden relative min-h-[340px] cursor-default mkt-aurora-border"
            style={glassCard}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.1 }}
            whileHover={hoverGlass}
          >
            <CardShine />
            <div className="relative z-10 w-[35%] flex flex-col justify-center">
              <h3 className="text-[32px] font-bold leading-[1.1] mb-5">
                <span style={{ color: "#5ec45f" }}>Financial</span><br />
                <span style={{ color: "#5ec45f" }}>overview</span><br />
                <span className="text-[#1a1a1a]">at a glance</span>
              </h3>
              <p className="text-[14px] text-[#6b7280] leading-relaxed pr-4">
                Income, expenses, outstanding fees, cash and bank — plus quick actions to receive or make payments.
              </p>
            </div>
            <motion.div
              className="absolute right-0 bottom-0 top-0 w-[65%] flex items-end justify-center pt-8 px-6"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.3 }}
            >
              <img src="/works/5.png" alt="Financial dashboard" className="w-full max-h-[95%] object-contain object-bottom drop-shadow-[0_8px_30px_rgba(0,0,0,0.14)]" />
            </motion.div>
          </motion.div>

          {/* Card 7: Help */}
          <motion.div
            className="md:col-span-3 rounded-3xl p-10 flex flex-col min-h-[340px] cursor-default relative overflow-hidden mkt-aurora-border"
            style={glassCard}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.2 }}
            whileHover={hoverGlass}
          >
            <CardShine />
            {/* Animated corner glow */}
            <motion.div
              className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(143,202,74,0.25) 0%, transparent 70%)" }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <h3 className="text-[30px] font-bold leading-[1.1] mb-6 text-[#1a1a1a] relative z-10">
              Help when<br />you need it
            </h3>
            <p className="text-[14px] text-[#6b7280] leading-relaxed relative z-10">
              Dashboard, students, fees, staff, plans, and support — one workspace your team can open on day one.
            </p>
            {/* Floating icon */}
            <motion.div
              className="mt-auto relative z-10"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(143,202,74,0.2), rgba(107,168,50,0.3))",
                  border: "1px solid rgba(143,202,74,0.35)",
                  boxShadow: "0 4px 16px rgba(143,202,74,0.25)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5ec45f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
