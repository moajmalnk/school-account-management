import { Calculator, MousePointerClick, Receipt, School, LineChart, GraduationCap, Users, Bus, FileSpreadsheet, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { easeOutExpo } from "@/components/marketing/motion";
import { MARKETING } from "@/lib/marketing-content";

const ICONS = [Calculator, MousePointerClick, Receipt, School, LineChart, GraduationCap, Users, Bus, FileSpreadsheet];
const { features } = MARKETING;

export function Features() {
  return (
    <section id="features" className="bg-white py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: easeOutExpo }}
        >
          <h2 className="text-[clamp(2.5rem,6vw,3.5rem)] font-bold text-[var(--mkt-ink)] tracking-tight leading-[1.1]">
            a <span className="inline-block bg-[var(--mkt-green)] text-white px-3 py-0.5 rounded-lg">mini ERP</span><br />
            for your school
          </h2>
          <p className="text-[15px] text-[var(--mkt-ink)] mt-4 font-medium">
            {MARKETING.features.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-8 max-w-4xl mx-auto">
          {features.items.map((item, i) => {
            const Icon = ICONS[i] ?? Wallet;
            return (
              <motion.div 
                key={item.title} 
                className="flex items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: easeOutExpo, delay: i * 0.05 }}
              >
                <div className="text-[var(--mkt-green)] flex-shrink-0">
                  <Icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <div>
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
