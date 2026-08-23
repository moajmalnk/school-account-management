import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { scaleIn } from "@/components/marketing/motion";
import { cn } from "@/lib/utils";

/** Browser-chrome frame for product screenshots. */
export function DeviceFrame({
  children,
  className,
  label = "app.feezo.app",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--mkt-line)] bg-white shadow-[0_28px_80px_-40px_rgba(26,28,44,0.45)] sm:rounded-3xl",
        className,
      )}
      variants={scaleIn}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-8% 0px", amount: 0.25 }}
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
    >
      <div className="flex items-center gap-2 border-b border-[var(--mkt-line)] bg-[#F7F8FA] px-3 py-2.5 sm:px-4">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </span>
        <div className="mx-auto min-w-0 max-w-[min(100%,14rem)] truncate rounded-md bg-white px-2.5 py-1 text-center font-mono text-[10px] text-[var(--mkt-muted)] shadow-sm sm:max-w-xs sm:text-[11px]">
          {label}
        </div>
        <span className="w-[42px] shrink-0" aria-hidden />
      </div>
      <div className="relative bg-[#EEF2F6]">{children}</div>
    </motion.div>
  );
}

export function ProductShot({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={1440}
      height={900}
      className={cn("h-auto w-full object-cover object-top", className)}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}
