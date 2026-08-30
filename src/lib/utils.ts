import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Tone = "white" | "lime" | "limePale" | "black";

export const TONE_HEX = {
  ink: "#0F172A",
  canvas: "#F4F6F9",
  surface: "#FFFFFF",
  surfaceMuted: "#F4F6F9",
  hairline: "#E5E5E5",
  lime: "#0F766E",
  limePale: "#F0FDFA",
  success: "#10B981",
  destructive: "#EF4444",
  destructiveSoft: "#FEE2E2",
} as const;

export const toneClasses: Record<Tone, string> = {
  white:
    "bg-white text-[#0F172A] border border-[#E5E5E5] dark:bg-[#171717] dark:text-zinc-100 dark:border-white/10",
  lime: "bg-gradient-to-br from-[#0F766E] to-[#115E59] text-white border border-white/10",
  limePale:
    "bg-[#F0FDFA] text-[#134E4A] border border-[#99F6E4]/35 dark:bg-[#0F766E]/15 dark:text-[#99F6E4] dark:border-[#0F766E]/40",
  black: "bg-[#0F172A] text-white border border-[#0F172A]",
};

export type CornerSide = "tl" | "tr" | "bl" | "br";

export const cornerClasses: Record<CornerSide, string> = {
  tl: "organic-corner-tl",
  tr: "organic-corner-tr",
  bl: "organic-corner-bl",
  br: "organic-corner-br",
};

/** Uniform premium card shell for mobile-first workspace panels */
export const premiumCardClass =
  "rounded-2xl border border-slate-100/60 bg-white shadow-sm shadow-slate-200/40 dark:border-white/10 dark:bg-[#171717] dark:shadow-black/40";

/** Glassmorphism shells — tablet & desktop */
export const glassPanelClass = "glass-panel rounded-2xl";
export const glassCardClass = "glass-card rounded-2xl";
export const glassInsetClass = "glass-inset rounded-xl";
export const glassNavTileClass = "glass-nav-tile rounded-xl";
export const glassTableWrapClass = "glass-card overflow-hidden rounded-2xl border border-white/70";
export const dashCardClass = "dash-card";
