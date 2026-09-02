import { Calculator, MousePointerClick, Receipt, School, LineChart, GraduationCap, Users, Bus, FileSpreadsheet, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { easeOutExpo } from "@/components/marketing/motion";
import { MARKETING } from "@/lib/marketing-content";

const ICONS = [Calculator, MousePointerClick, Receipt, School, LineChart, GraduationCap, Users, Bus, FileSpreadsheet];
const { features } = MARKETING;

/* Floating particles */
const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  left: `${8 + (i * 9) % 84}%`,
  top: `${10 + (i * 13) % 75}%`,
  delay: i * 0.7,
  duration: 3.5 + (i % 3),
}));

export function Features() {
  return (
    <section
      id="features"
      className="relative py-14 sm:py-20 lg:py-24 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 70% 60% at 80% 20%, rgba(143,202,74,0.09) 0%, transparent 55%)," +
          "radial-gradient(ellipse 60% 50% at 15% 70%, rgba(107,168,50,0.07) 0%, transparent 50%)," +
          "linear-gradient(180deg, #ffffff 0%, #f8fff4 100%)",
      }}
    >
      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              left: p.left,
              top: p.top,
              background: "rgba(143,202,74,0.5)",
              boxShadow: "0 0 6px rgba(143,202,74,0.4)",
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0, 0.8, 0],
              scale: [1, 0.5, 1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Section top/bottom gradient lines */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(143,202,74,0.35), transparent)" }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(143,202,74,0.25), transparent)" }}
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: easeOutExpo }}
        >
          <h2 className="text-[clamp(2.5rem,6vw,3.5rem)] font-bold text-[var(--mkt-ink)] tracking-tight leading-[1.1]">
            a{" "}
            <motion.span
              className="inline-block text-white px-3 py-0.5 rounded-lg"
              style={{
                background: "linear-gradient(135deg, #8FCA4A, #5ec45f)",
                boxShadow: "0 4px 18px rgba(143,202,74,0.4)",
              }}
              animate={{
                boxShadow: [
                  "0 4px 18px rgba(143,202,74,0.3)",
                  "0 4px 28px rgba(143,202,74,0.6)",
                  "0 4px 18px rgba(143,202,74,0.3)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              mini ERP
            </motion.span>
            <br />
            for your school
          </h2>
          <p className="text-[15px] text-[var(--mkt-ink)] mt-4 font-medium">
            {MARKETING.features.subtitle}
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {features.items.map((item, i) => {
            const Icon = ICONS[i] ?? Wallet;
            return (
              <motion.div
                key={item.title}
                className="group flex items-center gap-4 rounded-2xl px-5 py-4 cursor-default mkt-aurora-border relative overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(20px) saturate(180%)",
                  WebkitBackdropFilter: "blur(20px) saturate(180%)",
                  border: "1px solid rgba(143,202,74,0.18)",
                  boxShadow: "0 4px 16px rgba(143,202,74,0.08), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.85)",
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.55, ease: easeOutExpo, delay: i * 0.04 }}
                whileHover={{
                  y: -6,
                  background: "rgba(255,255,255,0.9)",
                  boxShadow: "0 16px 40px rgba(143,202,74,0.22), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
                  border: "1px solid rgba(143,202,74,0.38)",
                }}
              >
                {/* Shimmer on hover */}
                <motion.div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.45) 50%, transparent 80%)",
                  }}
                  animate={{ x: ["-100%", "300%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
                />

                {/* Icon with glow ring */}
                <div className="flex-shrink-0 relative">
                  {/* Pulsing ring */}
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{ background: "rgba(143,202,74,0.2)" }}
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.4, 0, 0.4],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="relative w-11 h-11 rounded-xl flex items-center justify-center z-10 transition-all duration-300"
                    style={{
                      background: "linear-gradient(135deg, rgba(143,202,74,0.15), rgba(107,168,50,0.22))",
                      border: "1px solid rgba(143,202,74,0.28)",
                      boxShadow: "0 2px 8px rgba(143,202,74,0.2)",
                    }}
                    whileHover={{
                      scale: 1.15,
                      boxShadow: "0 6px 20px rgba(143,202,74,0.45)",
                      background: "linear-gradient(135deg, rgba(143,202,74,0.25), rgba(107,168,50,0.35))",
                    }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Icon className="w-5 h-5 text-[var(--mkt-green)]" strokeWidth={1.8} />
                  </motion.div>
                </div>

                <div className="relative z-10">
                  <h3 className="text-[14px] font-bold text-[var(--mkt-ink)] leading-tight">{item.title}</h3>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
