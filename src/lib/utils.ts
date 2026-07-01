import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Tone = "white" | "lime" | "limePale" | "black";

export const TONE_HEX = {
  ink: "#000000",
  canvas: "#EAEAEA",
  surface: "#FFFFFF",
  surfaceMuted: "#F4F4F5",
  hairline: "#E5E5E5",
  lime: "#C7F33C",
  limePale: "#E1F2AE",
  destructive: "#B91C1C",
  destructiveSoft: "#FEE2E2",
} as const;

export const toneClasses: Record<Tone, string> = {
  white: "bg-white text-black border border-[#E5E5E5]",
  lime: "bg-[#C7F33C] text-black border border-black/0",
  limePale: "bg-[#E1F2AE] text-black border border-black/0",
  black: "bg-black text-white border border-black",
};

export type CornerSide = "tl" | "tr" | "bl" | "br";

export const cornerClasses: Record<CornerSide, string> = {
  tl: "organic-corner-tl",
  tr: "organic-corner-tr",
  bl: "organic-corner-bl",
  br: "organic-corner-br",
};
