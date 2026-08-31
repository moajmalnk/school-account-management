import { Star, ShieldCheck } from "lucide-react";
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
    <section className="bg-white py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
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
              className="rounded-2xl border border-[var(--mkt-line)] bg-white p-6 shadow-sm flex items-start gap-5"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, ease: easeOutExpo, delay: i * 0.1 }}
            >
              <div className="relative flex-shrink-0">
                <img src={t.image} alt={t.name} className="w-14 h-14 rounded-full object-cover" />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                  <div className="bg-[var(--mkt-green)] text-white rounded-full w-4 h-4 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[var(--mkt-green)]">{t.name}</h3>
                <div className="flex items-center gap-0.5 mt-0.5 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[var(--mkt-green)] text-[var(--mkt-green)]" />
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
