import { motion, useReducedMotion } from "motion/react";
import { easeOutExpo } from "@/components/marketing/motion";
import { MARKETING } from "@/lib/marketing-content";

const { hero } = MARKETING;

export function Hero({ noDelay = false }: { noDelay?: boolean }) {
  const reduce = useReducedMotion();

  return (
    <section
      className="relative overflow-hidden bg-white"
      aria-labelledby="hero-heading"
    >
      <div className="relative mx-auto flex max-w-[1080px] flex-col items-center px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOutExpo, delay: noDelay ? 0 : 1.0 }}
          className="relative z-10 flex flex-col items-center text-center w-full"
        >
          <h1
            id="hero-heading"
            className="text-[clamp(2.15rem,6vw,3.5rem)] font-bold leading-[1.05] tracking-tight text-[var(--mkt-ink)] mb-10"
          >
            Welcome To
            <br />
            <span className="text-[var(--mkt-green)]">Feezo</span>
          </h1>

          <div className="w-full relative flex justify-center">
            <motion.div 
              className="relative z-10 w-full max-w-4xl"
              initial={reduce ? false : { opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: easeOutExpo, delay: noDelay ? 0 : 1.2 }}
            >
              <img
                src="/home/home.png"
                alt="Feezo Dashboard on Laptop and Mobile"
                className="w-full h-auto object-contain"
                priority="true"
              />
            </motion.div>
          </div>

          {/* Bottom text and buttons row */}
          <div className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-start sm:items-end mt-8 sm:mt-10">
            <p className="text-left text-[14px] leading-relaxed text-[var(--mkt-muted)] mb-6 sm:mb-0">
              School accounts simplified — fees,<br />
              receipts, and reports in one place.<br />
              Start a 14-day trial.
            </p>

            <div className="flex gap-3">
              <a href="#" className="inline-flex h-10 sm:h-11 items-center justify-center rounded-lg bg-[var(--mkt-green)] px-4 sm:px-5 text-[13px] sm:text-[14px] font-bold text-white shadow-lg transition-transform hover:bg-[var(--mkt-green-deep)] hover:scale-105 active:scale-95">
                <svg className="mr-2 h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M17.523 15.3414C17.523 15.3414 17.502 15.321 17.472 15.2897L17.4666 15.284C17.4666 15.284 12.3364 12.1643 12.3364 12.1643L12.3331 12.1623L12.3274 12.1587C12.3274 12.1587 7.20232 9.04169 7.20232 9.04169L7.19839 9.03923C7.1147 8.98894 6.99961 8.97011 6.89297 9.00405C6.77259 9.04169 6.67139 9.1362 6.62145 9.25556C6.59567 9.31753 6.58661 9.38793 6.60275 9.45663L6.60481 9.46743L6.6111 9.48866L11.5363 21.0346L11.5393 21.0422L11.542 21.0506L16.4883 24.318C16.4883 24.318 16.5186 24.3377 16.5413 24.3483C16.6346 24.3916 16.7451 24.3976 16.8436 24.3644C16.9634 24.3245 17.0601 24.2285 17.1065 24.1082C17.1322 24.043 17.1384 23.9678 17.1182 23.8967L17.1148 23.8824L17.1092 23.8647L12.3323 12.1628L17.5255 15.3441L17.523 15.3414Z" /><path d="M11.666 11.7584L6.96316 22.7828L5.78913 20.0272L10.4907 9.00392L11.666 11.7584Z" /><path d="M2.93608 13.336L3.93179 15.6706L9.46313 2.70327L8.46742 0.368652L2.93608 13.336Z" /><path d="M4.09068 16.0425L5.43468 19.1923L10.9637 6.22383L9.61966 3.07406L4.09068 16.0425Z" /></svg>
                Google Play
              </a>
              <a href="#" className="inline-flex h-10 sm:h-11 items-center justify-center rounded-lg bg-[var(--mkt-green)] px-4 sm:px-5 text-[13px] sm:text-[14px] font-bold text-white shadow-lg transition-transform hover:bg-[var(--mkt-green-deep)] hover:scale-105 active:scale-95">
                <svg className="mr-2 h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M16.4 12c0-2.8 2.3-4.1 2.4-4.2-1.3-1.9-3.3-2.2-4.1-2.2-1.7-.2-3.4 1-4.3 1-.9 0-2.2-1-3.6-1-1.9 0-3.6 1.1-4.6 2.8-2.1 3.5-.5 8.8 1.4 11.6 1 1.4 2.1 2.9 3.6 2.9 1.4 0 2-.9 3.7-.9 1.7 0 2.2.9 3.7.9 1.5 0 2.5-1.4 3.4-2.8.9-1.2 1.2-2.3 1.3-2.4-.1-.1-2.9-1.1-2.9-4.7zM14 3.7c.8-.9 1.3-2.2 1.1-3.5-1.1.1-2.5.7-3.3 1.6-.7.8-1.3 2.1-1.1 3.4 1.3.1 2.5-.6 3.3-1.5z" /></svg>
                App Store
              </a>
            </div>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
