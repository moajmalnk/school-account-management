import type { Transition, Variants } from "motion/react";

export const easeOutExpo: Transition["ease"] = [0.22, 1, 0.36, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOutExpo },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOutExpo },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.06 },
  },
};
