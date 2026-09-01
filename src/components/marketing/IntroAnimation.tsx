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
    {/* Page Container with Glassmorphism */}
    <div className="w-full h-full relative overflow-hidden rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-white/30 bg-white/10 backdrop-blur-xl">
      {/* Glossy reflection on the glass */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/60 via-transparent to-transparent pointer-events-none mix-blend-overlay z-10" />
      <div 
        className="absolute top-0 left-0 w-screen h-screen origin-top-left" 
        style={{ transform: "scale(0.33333)" }}
      >
        <div className="w-full h-full pointer-events-none opacity-80">
          {children}
        </div>
      </div>
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
          className="fixed inset-0 z-[100] bg-[#050505] overflow-hidden flex items-center justify-center"
          style={{ perspective: "2000px" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          onAnimationComplete={() => setIsVisible(false)}
        >
          {/* Cinematic "Video Effect" Glow Background */}
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(143,202,74,0.25)_0%,transparent_60%)]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Top Row (Moves Right & Tumbles in 3D) */}
          <motion.div
            className="absolute top-0 left-0 w-[33.33%] h-[33.33%]"
            initial={{ x: 0, rotateY: 0, rotateX: 0 }}
            animate={{ x: "100vw", y: "-20vh", rotateY: 45, rotateX: 45 }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><Hero noDelay={true} /></MiniPage>
          </motion.div>
          <motion.div
            className="absolute top-0 left-[33.33%] w-[33.33%] h-[33.33%]"
            initial={{ x: 0, rotateY: 0, rotateX: 0 }}
            animate={{ x: "50vw", y: "-50vh", rotateY: -45, rotateX: 45 }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><HowItWorks /></MiniPage>
          </motion.div>
          <motion.div
            className="absolute top-0 left-[66.66%] w-[33.33%] h-[33.33%]"
            initial={{ x: 0, rotateY: 0, rotateX: 0 }}
            animate={{ x: "100vw", y: "-20vh", rotateY: -60, rotateX: 45 }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><Features /></MiniPage>
          </motion.div>

          {/* Bottom Row (Moves Left & Tumbles in 3D) */}
          <motion.div
            className="absolute bottom-0 left-0 w-[33.33%] h-[33.33%]"
            initial={{ x: 0, rotateY: 0, rotateX: 0 }}
            animate={{ x: "-100vw", y: "20vh", rotateY: 45, rotateX: -45 }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><Testimonials /></MiniPage>
          </motion.div>
          <motion.div
            className="absolute bottom-0 left-[33.33%] w-[33.33%] h-[33.33%]"
            initial={{ x: 0, rotateY: 0, rotateX: 0 }}
            animate={{ x: "-50vw", y: "50vh", rotateY: 45, rotateX: -45 }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><Pricing /></MiniPage>
          </motion.div>
          <motion.div
            className="absolute bottom-0 left-[66.66%] w-[33.33%] h-[33.33%]"
            initial={{ x: 0, rotateY: 0, rotateX: 0 }}
            animate={{ x: "-100vw", y: "20vh", rotateY: -45, rotateX: -45 }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><Hero noDelay={true} /></MiniPage>
          </motion.div>

          {/* Middle Left (Moves Left & Tumbles) */}
          <motion.div
            className="absolute top-[33.33%] left-0 w-[33.33%] h-[33.33%]"
            initial={{ x: 0, rotateY: 0, rotateX: 0 }}
            animate={{ x: "-100vw", rotateY: 60, rotateX: 0 }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><DigitalTransformation /></MiniPage>
          </motion.div>

          {/* Middle Right (Moves Right & Tumbles) */}
          <motion.div
            className="absolute top-[33.33%] left-[66.66%] w-[33.33%] h-[33.33%]"
            initial={{ x: 0, rotateY: 0, rotateX: 0 }}
            animate={{ x: "100vw", rotateY: -60, rotateX: 0 }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
          >
            <MiniPage><HowItWorks /></MiniPage>
          </motion.div>

          {/* Center piece (Expands & Zooms from 3D) */}
          <motion.div
            className="absolute z-10 flex items-start justify-start shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
            initial={{ 
              top: "33.33%", left: "33.33%", width: "33.33%", height: "33.33%",
              padding: "0.5rem", z: 0
            }}
            animate={{ 
              top: "0%", left: "0%", width: "100%", height: "100%",
              padding: "0rem", z: 0 // Keep at z:0 so scale perfectly matches real page
            }}
            transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
            onAnimationComplete={() => {
              // Minimal delay before handing over to real DOM to prevent flash
              setTimeout(() => setIsFinished(true), 50);
            }}
          >
            {/* Center Piece Glass Content Container */}
            <motion.div 
               className="w-full h-full relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/30"
               initial={{ borderRadius: "1rem", backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.3)" }}
               animate={{ borderRadius: "0rem", backgroundColor: "rgba(8,24,10,1)", borderColor: "rgba(8,24,10,0)" }}
               transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
            >
               <motion.div 
                 className="absolute top-0 left-0 w-screen h-screen origin-top-left pointer-events-none"
                 initial={{ scale: 0.33333, opacity: 0.8 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
               >
                 <MarketingShell>
                   <Hero noDelay={true} />
                   {/* Push the bottom of the card off-screen to perfectly match the real tall page */}
                   <div className="h-[200vh]" />
                 </MarketingShell>
               </motion.div>
               {/* 3D Video "Light Sweep" effect fading out */}
               <motion.div 
                 className="absolute inset-0 bg-gradient-to-tr from-[#8FCA4A]/30 via-transparent to-transparent pointer-events-none mix-blend-overlay"
                 initial={{ opacity: 1, x: "-100%" }}
                 animate={{ opacity: 0, x: "100%" }}
                 transition={{ duration: 1.5, ease: easeOutExpo, delay: 0.5 }}
               />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
