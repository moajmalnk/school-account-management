import { motion } from "motion/react";

import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function StoreBadge({
  variant,
  reduce,
  className,
}: {
  variant: "play" | "apple";
  reduce: boolean | null;
  className?: string;
}) {
  const isPlay = variant === "play";

  return (
    <motion.a
      href={isPlay ? BRAND.playStoreUrl : "#"}
      target={isPlay ? "_blank" : undefined}
      rel={isPlay ? "noopener noreferrer" : undefined}
      aria-label={isPlay ? "Get it on Google Play" : "Download on the App Store"}
      className={cn(
        "inline-flex h-[42px] min-w-0 flex-1 items-center gap-1.5 rounded-xl px-2.5 text-white shadow-[0_8px_24px_rgba(143,202,74,0.28)] transition-colors sm:h-[46px] sm:min-w-[132px] sm:flex-none sm:gap-2 sm:px-3.5",
        isPlay
          ? "bg-[var(--mkt-green)] hover:bg-[var(--mkt-green-deep)]"
          : "bg-[#A8D96A] hover:bg-[#97C85C]",
        className,
      )}
      whileHover={reduce ? undefined : { y: -2, scale: 1.02 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      {isPlay ? (
        <svg className="h-5 w-5 shrink-0 fill-current sm:h-6 sm:w-6" viewBox="0 0 24 24" aria-hidden>
          <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12 3.84 21.85C3.34 21.6 3 21.09 3 20.5m13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27m3.35-4.31c.34.27.59.69.59 1.19s-.22.9-.57 1.18L17.89 14.5 15.39 12l2.5-2.5 2.27 1.31M6.05 2.66l10.76 6.22-2.27 2.27L6.05 2.66Z" />
        </svg>
      ) : (
        <svg className="h-5 w-5 shrink-0 fill-current sm:h-6 sm:w-6" viewBox="0 0 24 24" aria-hidden>
          <path d="M16.4 12c0-2.8 2.3-4.1 2.4-4.2-1.3-1.9-3.3-2.2-4.1-2.2-1.7-.2-3.4 1-4.3 1-.9 0-2.2-1-3.6-1-1.9 0-3.6 1.1-4.6 2.8-2.1 3.5-.5 8.8 1.4 11.6 1 1.4 2.1 2.9 3.6 2.9 1.4 0 2-.9 3.7-.9 1.7 0 2.2.9 3.7.9 1.5 0 2.5-1.4 3.4-2.8.9-1.2 1.2-2.3 1.3-2.4-.1-.1-2.9-1.1-2.9-4.7zM14 3.7c.8-.9 1.3-2.2 1.1-3.5-1.1.1-2.5.7-3.3 1.6-.7.8-1.3 2.1-1.1 3.4 1.3.1 2.5-.6 3.3-1.5z" />
        </svg>
      )}
      <div className="flex min-w-0 flex-col leading-none">
        <span className="truncate text-[7px] font-semibold tracking-wide opacity-90 sm:text-[9px]">
          {isPlay ? "GET IT ON" : "Download on the"}
        </span>
        <span className="truncate text-[11px] font-bold tracking-tight sm:text-[14px]">
          {isPlay ? "Google Play" : "App Store"}
        </span>
      </div>
    </motion.a>
  );
}
