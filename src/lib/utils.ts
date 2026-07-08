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
  lime: "#2563EB",
  limePale: "#DBEAFE",
  success: "#10B981",
  destructive: "#EF4444",
  destructiveSoft: "#FEE2E2",
} as const;

export const toneClasses: Record<Tone, string> = {
  white: "bg-white text-[#0F172A] border border-[#E5E5E5]",
  lime: "bg-[#2563EB] text-white border border-black/0",
  limePale: "bg-[#DBEAFE] text-[#0F172A] border border-black/0",
  black: "bg-[#0F172A] text-white border border-[#0F172A]",
};

export type CornerSide = "tl" | "tr" | "bl" | "br";

export const cornerClasses: Record<CornerSide, string> = {
  tl: "organic-corner-tl",
  tr: "organic-corner-tr",
  bl: "organic-corner-bl",
  br: "organic-corner-br",
};
