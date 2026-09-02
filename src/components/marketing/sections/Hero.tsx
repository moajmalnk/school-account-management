import { useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";
import { easeOutExpo } from "@/components/marketing/motion";
import { MARKETING } from "@/lib/marketing-content";

/* ── 3D Interactive Hero ── */
export function Hero({ noDelay = false }: { noDelay?: boolean }) {
  const reduce = useReducedMotion();
  
  // Mouse tracking for 3D parallax
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  
  // Smooth springs for mouse movement to make it feel premium
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });
  
  // Map mouse position to 3D rotations
  const rotateX = useTransform(springY, [0, 1], [8, -8]);
  const rotateY = useTransform(springX, [0, 1], [-8, 8]);
  
  // Map mouse position for background panning
  const bgX = useTransform(springX, [0, 1], ["-52%", "-48%"]);
  const bgY = useTransform(springY, [0, 1], ["-52%", "-48%"]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current || reduce) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseX.set(x);
      mouseY.set(y);
    };
    
    // Reset on mouse leave
    const handleMouseLeave = () => {
      mouseX.set(0.5);
      mouseY.set(0.5);
    };

    const element = ref.current;
    if (element) {
      element.addEventListener("mousemove", handleMouseMove);
      element.addEventListener("mouseleave", handleMouseLeave);
      return () => {
        element.removeEventListener("mousemove", handleMouseMove);
        element.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, [mouseX, mouseY, reduce]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden min-h-[90vh] flex items-center justify-center pt-10 pb-20"
      style={{
        perspective: "1200px",
      }}
    >
      {/* ── Spotlight following mouse ── */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply opacity-40"
        style={{
          background: useTransform(
            [springX, springY],
            ([x, y]) => `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(143,202,74,0.15) 0%, transparent 40%)`
          )
        }}
      />

      {/* ── Parallax Concentric Background ── */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[1600px] h-[1600px] pointer-events-none z-0"
        style={{
          x: bgX,
          y: bgY,
          rotateX: useTransform(springY, [0, 1], [-15, 15]),
          rotateY: useTransform(springX, [0, 1], [15, -15]),
          transformStyle: "preserve-3d",
        }}
      >
        {/* Glow behind rings */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(143,202,74,0.05)_0%,transparent_60%)] blur-2xl" />
        
        {/* Crisp SVG Rings */}
        <svg viewBox="0 0 1600 1600" fill="none" className="w-full h-full opacity-40">
          {[300, 500, 700, 900, 1100, 1300].map((r, i) => (
            <motion.circle
              key={r}
              cx="800"
              cy="800"
              r={r}
              stroke="url(#ring-grad)"
              strokeWidth={i % 2 === 0 ? "1.5" : "1"}
              strokeDasharray={i % 3 === 0 ? "6 8" : "none"}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 - (i * 0.15) }}
              transition={{ duration: 1.5, delay: i * 0.1, ease: easeOutExpo }}
            />
          ))}
          <defs>
            <radialGradient id="ring-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(107,168,50,0.4)" />
              <stop offset="100%" stopColor="rgba(143,202,74,0.05)" />
            </radialGradient>
          </defs>
        </svg>

        {/* Orbiting particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full shadow-[0_0_10px_rgba(143,202,74,0.5)] bg-[var(--mkt-green)]"
            style={{
              width: i % 2 === 0 ? 6 : 4,
              height: i % 2 === 0 ? 6 : 4,
              left: "50%",
              top: "50%",
            }}
            animate={{
              rotate: 360,
              x: (300 + (i * 80)) * Math.cos(i),
              y: (300 + (i * 80)) * Math.sin(i),
            }}
            transition={{
              rotate: { duration: 20 + i * 5, repeat: Infinity, ease: "linear" },
            }}
          />
        ))}
      </motion.div>

      {/* ── 3D Tilted Content ── */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center w-full max-w-5xl px-4 py-20"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        <motion.div
          className="mb-8 inline-flex items-center gap-3 px-5 py-2.5 rounded-full text-[13px] font-semibold backdrop-blur-md border border-[var(--mkt-line)] shadow-sm bg-white/60 text-[var(--mkt-ink)]"
          initial={reduce ? false : { opacity: 0, y: -20, z: -50 }}
          animate={{ opacity: 1, y: 0, z: 20 }}
          transition={{ duration: 1, ease: easeOutExpo, delay: noDelay ? 0 : 0.8 }}
          style={{ transform: "translateZ(30px)" }} // Pop out in 3D
        >
          <motion.span
            className="w-2.5 h-2.5 rounded-full bg-[var(--mkt-green)] shadow-[0_0_8px_rgba(143,202,74,0.6)]"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          School fee management — simplified
        </motion.div>

        <motion.h1
          id="hero-heading"
          className="text-[clamp(2.5rem,7vw,4.5rem)] font-extrabold leading-[1.05] tracking-tight text-[var(--mkt-ink)] mb-8"
          initial={reduce ? false : { opacity: 0, y: 30, z: -100 }}
          animate={{ opacity: 1, y: 0, z: 50 }}
          transition={{ duration: 1, ease: easeOutExpo, delay: noDelay ? 0 : 1.0 }}
          style={{ transform: "translateZ(60px)" }} // Huge pop out
        >
          Welcome To
          <br />
          <motion.span
            className="inline-block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[var(--mkt-green-deep)] via-[var(--mkt-green)] to-[var(--mkt-green-deep)]"
            style={{
              backgroundSize: "200% auto",
            }}
            animate={{ backgroundPosition: ["0% center", "200% center"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            Feezo
          </motion.span>
        </motion.h1>

        {/* ── 3D Mockup Frame ── */}
        <motion.div 
          className="relative w-full max-w-[800px] mt-8"
          initial={reduce ? false : { opacity: 0, y: 60, scale: 0.9, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          transition={{ duration: 1.2, ease: easeOutExpo, delay: noDelay ? 0 : 1.2 }}
          style={{ transform: "translateZ(40px)" }}
        >
          {/* Glowing Aura behind mockup */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[var(--mkt-green)]/20 to-[var(--mkt-green-deep)]/20 blur-3xl -z-10 rounded-full opacity-60" />

          {/* Glass floating card around image */}
          <div className="relative rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_24px_80px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] overflow-hidden group">
            {/* Glossy reflection on the card */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[rgba(255,255,255,0.4)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -translate-x-full group-hover:translate-x-full" />
            
            <img
              src="/home/home.png"
              alt="Feezo Dashboard"
              className="w-full h-auto object-contain rounded-xl sm:rounded-2xl shadow-xl relative z-10"
            />
          </div>

          {/* Floating badge 1 */}
          <motion.div
            className="absolute -top-6 -right-6 hidden sm:flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/80 backdrop-blur-md border border-[var(--mkt-line)] shadow-[0_8px_32px_rgba(0,0,0,0.1)] z-20"
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easeOutExpo, delay: noDelay ? 0.4 : 1.9 }}
            style={{ transform: "translateZ(80px)" }} // Extreme 3D pop
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--mkt-green)] to-[var(--mkt-green-deep)] flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-medium text-[var(--mkt-muted)]">Trusted by</span>
              <span className="text-[14px] font-bold text-[var(--mkt-ink)] leading-tight">80+ Schools</span>
            </div>
          </motion.div>

          {/* Floating badge 2 */}
          <motion.div
            className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/80 backdrop-blur-md border border-[var(--mkt-line)] shadow-[0_8px_32px_rgba(0,0,0,0.1)] z-20"
            initial={{ opacity: 0, scale: 0, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easeOutExpo, delay: noDelay ? 0.5 : 2.1 }}
            style={{ transform: "translateZ(70px)" }}
          >
            <div className="w-10 h-10 rounded-full bg-[rgba(143,202,74,0.1)] border border-[var(--mkt-green)] flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-[var(--mkt-green-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[14px] font-bold text-[var(--mkt-ink)] leading-tight">14-day free trial</span>
              <span className="text-[11px] font-medium text-[var(--mkt-muted)]">No credit card</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
