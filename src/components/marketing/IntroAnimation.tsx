import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { easeOutExpo } from "./motion";

import { Hero } from "@/components/marketing/sections/Hero";
import { HowItWorks } from "@/components/marketing/sections/HowItWorks";
import { Features } from "@/components/marketing/sections/Features";
import { DigitalTransformation } from "@/components/marketing/sections/DigitalTransformation";
import { Testimonials } from "@/components/marketing/sections/Testimonials";
import { Pricing } from "@/components/marketing/sections/Pricing";
import { MarketingShell } from "@/components/marketing/MarketingShell";

const MiniPage = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full h-full p-2 relative pointer-events-none">
    {/* Page Container */}
    <div className="w-full h-full relative overflow-hidden rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-black/5 bg-white">
      <div 
        className="absolute top-0 left-0 w-screen h-screen origin-top-left" 
        style={{ transform: "scale(0.33333)" }}
      >
        <div className="w-full h-full pointer-events-none">
          {children}
        </div>
      </div>
      {/* Subtle shine on the box */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-transparent pointer-events-none rounded-2xl mix-blend-overlay" />
    </div>
  </div>
);

export function IntroAnimation() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {!isFinished && (
        <motion.div
          className="fixed inset-0 z-[100] bg-zinc-900/60 backdrop-blur-sm overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          onAnimationComplete={() => setIsVisible(false)}
        >
          {/* Top Row (Moves Right) */}
          <motion.div
            className="absolute top-0 left-0 w-[33.33%] h-[33.33%]"
            initial={{ x: 0 }}
            animate={{ x: "100vw" }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><Hero noDelay={true} /></MiniPage>
          </motion.div>
          <motion.div
            className="absolute top-0 left-[33.33%] w-[33.33%] h-[33.33%]"
            initial={{ x: 0 }}
            animate={{ x: "100vw" }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><HowItWorks /></MiniPage>
          </motion.div>
          <motion.div
            className="absolute top-0 left-[66.66%] w-[33.33%] h-[33.33%]"
            initial={{ x: 0 }}
            animate={{ x: "100vw" }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><Features /></MiniPage>
          </motion.div>

          {/* Bottom Row (Moves Left) */}
          <motion.div
            className="absolute bottom-0 left-0 w-[33.33%] h-[33.33%]"
            initial={{ x: 0 }}
            animate={{ x: "-100vw" }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><Testimonials /></MiniPage>
          </motion.div>
          <motion.div
            className="absolute bottom-0 left-[33.33%] w-[33.33%] h-[33.33%]"
            initial={{ x: 0 }}
            animate={{ x: "-100vw" }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><Pricing /></MiniPage>
          </motion.div>
          <motion.div
            className="absolute bottom-0 left-[66.66%] w-[33.33%] h-[33.33%]"
            initial={{ x: 0 }}
            animate={{ x: "-100vw" }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><Hero noDelay={true} /></MiniPage>
          </motion.div>

          {/* Middle Left (Moves Left) */}
          <motion.div
            className="absolute top-[33.33%] left-0 w-[33.33%] h-[33.33%]"
            initial={{ x: 0 }}
            animate={{ x: "-100vw" }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><DigitalTransformation /></MiniPage>
          </motion.div>

          {/* Middle Right (Moves Right) */}
          <motion.div
            className="absolute top-[33.33%] left-[66.66%] w-[33.33%] h-[33.33%]"
            initial={{ x: 0 }}
            animate={{ x: "100vw" }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><HowItWorks /></MiniPage>
          </motion.div>

          {/* Center piece (Expands) */}
          <motion.div
            className="absolute z-10 flex items-start justify-start shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
            initial={{ 
              top: "33.33%", left: "33.33%", width: "33.33%", height: "33.33%",
              padding: "0.5rem" // Matches p-2 gap
            }}
            animate={{ 
              top: "0%", left: "0%", width: "100%", height: "100%",
              padding: "0rem"
            }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
            onAnimationComplete={() => {
              setTimeout(() => setIsFinished(true), 100);
            }}
          >
            {/* Center Piece Content Container */}
            <motion.div 
               className="w-full h-full relative bg-white overflow-hidden"
               initial={{ borderRadius: "1rem", border: "1px solid rgba(0,0,0,0.05)" }}
               animate={{ borderRadius: "0rem", border: "0px solid rgba(0,0,0,0)" }}
               transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
            >
               <motion.div 
                 className="absolute top-0 left-0 w-screen h-screen origin-top-left pointer-events-none"
                 initial={{ scale: 0.33333 }}
                 animate={{ scale: 1 }}
                 transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
               >
                 <MarketingShell>
                   <Hero noDelay={true} />
                 </MarketingShell>
               </motion.div>
               {/* Shine fading out */}
               <motion.div 
                 className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-transparent pointer-events-none mix-blend-overlay"
                 initial={{ opacity: 1 }}
                 animate={{ opacity: 0 }}
                 transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
               />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
