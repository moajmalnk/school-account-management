import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { easeOutExpo } from "./motion";

// Import real pages/sections to use as previews
import { Hero } from "@/components/marketing/sections/Hero";
import { HowItWorks } from "@/components/marketing/sections/HowItWorks";
import { Features } from "@/components/marketing/sections/Features";
import { DigitalTransformation } from "@/components/marketing/sections/DigitalTransformation";
import { Testimonials } from "@/components/marketing/sections/Testimonials";
import { Pricing } from "@/components/marketing/sections/Pricing";
import { MarketingShell } from "@/components/marketing/MarketingShell";

// Helper component that renders a section at 33.33% scale to act as a mini-page
const MiniPage = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full h-full p-4 relative pointer-events-none">
    <div className="w-full h-full relative overflow-hidden rounded-3xl border border-white/20 shadow-2xl bg-black/10 backdrop-blur-md">
      <div 
        className="absolute top-0 left-0 w-screen h-screen origin-top-left opacity-90" 
        style={{ transform: "scale(0.33333)" }}
      >
        {/* We add a div with pointer-events-none to prevent any interaction within the preview */}
        <div className="w-full h-full overflow-hidden pointer-events-none">
          {children}
        </div>
      </div>
      <div className="absolute inset-0 bg-white/5 z-10 pointer-events-none" />
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
          className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-lg overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          onAnimationComplete={() => setIsVisible(false)}
        >
          {/* Top Row */}
          <motion.div
            className="absolute top-0 left-0 w-[33.33%] h-[33.33%]"
            initial={{ x: 0 }}
            animate={{ x: "100vw" }}
            transition={{ duration: 1.2, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><Hero /></MiniPage>
          </motion.div>
          <motion.div
            className="absolute top-0 left-[33.33%] w-[33.33%] h-[33.33%]"
            initial={{ x: 0 }}
            animate={{ x: "100vw" }}
            transition={{ duration: 1.2, ease: easeOutExpo, delay: 0.55 }}
          >
            <MiniPage><HowItWorks /></MiniPage>
          </motion.div>
          <motion.div
            className="absolute top-0 left-[66.66%] w-[33.33%] h-[33.33%]"
            initial={{ x: 0 }}
            animate={{ x: "100vw" }}
            transition={{ duration: 1.2, ease: easeOutExpo, delay: 0.6 }}
          >
            <MiniPage><Features /></MiniPage>
          </motion.div>

          {/* Bottom Row */}
          <motion.div
            className="absolute bottom-0 left-0 w-[33.33%] h-[33.33%]"
            initial={{ x: 0 }}
            animate={{ x: "-100vw" }}
            transition={{ duration: 1.2, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><Testimonials /></MiniPage>
          </motion.div>
          <motion.div
            className="absolute bottom-0 left-[33.33%] w-[33.33%] h-[33.33%]"
            initial={{ x: 0 }}
            animate={{ x: "-100vw" }}
            transition={{ duration: 1.2, ease: easeOutExpo, delay: 0.55 }}
          >
            <MiniPage><Pricing /></MiniPage>
          </motion.div>
          <motion.div
            className="absolute bottom-0 left-[66.66%] w-[33.33%] h-[33.33%]"
            initial={{ x: 0 }}
            animate={{ x: "-100vw" }}
            transition={{ duration: 1.2, ease: easeOutExpo, delay: 0.6 }}
          >
            <MiniPage><Hero /></MiniPage>
          </motion.div>

          {/* Middle Left */}
          <motion.div
            className="absolute top-[33.33%] left-0 w-[33.33%] h-[33.33%]"
            initial={{ x: 0 }}
            animate={{ x: "-100vw" }}
            transition={{ duration: 1.2, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><DigitalTransformation /></MiniPage>
          </motion.div>

          {/* Middle Right */}
          <motion.div
            className="absolute top-[33.33%] left-[66.66%] w-[33.33%] h-[33.33%]"
            initial={{ x: 0 }}
            animate={{ x: "100vw" }}
            transition={{ duration: 1.2, ease: easeOutExpo, delay: 0.6 }}
          >
            <MiniPage><HowItWorks /></MiniPage>
          </motion.div>

          {/* Center piece */}
          <motion.div
            className="absolute z-10 flex items-start justify-start shadow-2xl"
            initial={{ 
              top: "33.33%", 
              left: "33.33%", 
              width: "33.33%", 
              height: "33.33%",
              padding: "1rem"
            }}
            animate={{ 
              top: "0%", 
              left: "0%", 
              width: "100%", 
              height: "100%",
              padding: "0rem"
            }}
            transition={{ duration: 1.2, ease: easeOutExpo, delay: 1.2 }}
            onAnimationComplete={() => {
              setTimeout(() => setIsFinished(true), 100);
            }}
          >
            <motion.div 
               className="w-full h-full relative overflow-hidden bg-background"
               initial={{ borderRadius: "1.5rem", border: "1px solid rgba(255,255,255,0.2)" }}
               animate={{ borderRadius: "0rem", border: "0px solid rgba(255,255,255,0)" }}
               transition={{ duration: 1.2, ease: easeOutExpo, delay: 1.2 }}
            >
               <motion.div 
                 className="absolute top-0 left-0 w-screen h-screen origin-top-left pointer-events-none"
                 initial={{ scale: 0.33333 }}
                 animate={{ scale: 1 }}
                 transition={{ duration: 1.2, ease: easeOutExpo, delay: 1.2 }}
               >
                 <MarketingShell>
                   <Hero />
                 </MarketingShell>
               </motion.div>
               <motion.div 
                 className="absolute inset-0 bg-white/5 z-10 pointer-events-none"
                 initial={{ opacity: 1 }}
                 animate={{ opacity: 0 }}
                 transition={{ duration: 1.2, ease: easeOutExpo, delay: 1.2 }}
               />
            </motion.div>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
