import { Star } from "lucide-react";
import { motion } from "motion/react";
import { easeOutExpo } from "@/components/marketing/motion";

export function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: "ABC School",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      content: "Fees overview, installment table, overdue badges, and WhatsApp reminders — collect without leaving the student."
    },
    {
      id: 2,
      name: "ABC School",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      content: "Fees overview, installment table, overdue badges, and WhatsApp reminders — collect without leaving the student."
    }
  ];

  return (
    <section
      className="relative py-14 sm:py-20 lg:py-24 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 70% 60% at 10% 30%, rgba(143,202,74,0.08) 0%, transparent 55%)," +
          "radial-gradient(ellipse 60% 50% at 90% 70%, rgba(107,168,50,0.07) 0%, transparent 50%)," +
          "linear-gradient(180deg,#ffffff 0%,#f8fff4 100%)",
      }}
    >
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-0 right-0 w-72 h-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(143,202,74,0.10) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.25, 1], x: [0, 25, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(107,168,50,0.08) 0%, transparent 70%)" }}
          animate={{ scale: [1.1, 1, 1.1], x: [0, -18, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Floating stars */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${10 + i * 15}%`,
              top: `${15 + (i * 17) % 65}%`,
              color: "rgba(143,202,74,0.4)",
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.3, 0.9, 0.3],
              rotate: [0, 20, 0],
            }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }}
          >
            <Star size={8 + (i % 3) * 4} fill="rgba(143,202,74,0.4)" stroke="none" />
          </motion.div>
        ))}
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 relative z-10">
        <motion.h2
          className="text-center text-[clamp(1.5rem,4vw,2rem)] font-bold tracking-tight text-[var(--mkt-ink)] mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: easeOutExpo }}
        >
          testimonials
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              className="group rounded-2xl p-6 flex items-start gap-5 cursor-default relative overflow-hidden mkt-aurora-border"
              style={{
                background: "rgba(255,255,255,0.70)",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                border: "1px solid rgba(143,202,74,0.20)",
                boxShadow: "0 6px 24px rgba(143,202,74,0.10), 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.88)",
              }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, ease: easeOutExpo, delay: i * 0.12 }}
              whileHover={{
                y: -8,
                boxShadow: "0 24px 56px rgba(143,202,74,0.26), 0 6px 16px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.95)",
                border: "1px solid rgba(143,202,74,0.42)",
              }}
            >
              {/* Top shine */}
              <div
                className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.9) 40%,rgba(255,255,255,0.9) 60%,transparent)" }}
              />
              {/* Shimmer sweep */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(120deg,transparent 20%,rgba(255,255,255,0.4) 50%,transparent 80%)",
                }}
                initial={{ x: "-100%" }}
                animate={{ x: "320%" }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 + i * 1.5, ease: "easeInOut" }}
              />

              <div className="relative flex-shrink-0 z-10">
                <div
                  className="rounded-full p-0.5"
                  style={{
                    background: "linear-gradient(135deg, rgba(143,202,74,0.7), rgba(107,168,50,0.9))",
                    boxShadow: "0 3px 14px rgba(143,202,74,0.35)",
                  }}
                >
                  <img src={t.image} alt={t.name} className="w-[52px] h-[52px] rounded-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                  <div
                    className="text-white rounded-full w-4 h-4 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#8FCA4A,#5ec45f)" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-[16px] font-bold text-[var(--mkt-green)]">{t.name}</h3>
                <div className="flex items-center gap-0.5 mt-0.5 mb-2">
                  {[...Array(5)].map((_, j) => (
                    <motion.div
                      key={j}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.4, delay: j * 0.08, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Star className="w-3.5 h-3.5 fill-[var(--mkt-green)] text-[var(--mkt-green)]" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-[11px] text-[var(--mkt-muted)] leading-relaxed font-medium">
                  {t.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
