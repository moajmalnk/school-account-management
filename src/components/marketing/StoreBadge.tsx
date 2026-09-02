import { motion } from "motion/react";

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
      href="#"
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
          <path d="M17.523 15.3414C17.523 15.3414 17.502 15.321 17.472 15.2897L17.4666 15.284C17.4666 15.284 12.3364 12.1643 12.3364 12.1643L12.3331 12.1623L12.3274 12.1587C12.3274 12.1587 7.20232 9.04169 7.20232 9.04169L7.19839 9.03923C7.1147 8.98894 6.99961 8.97011 6.89297 9.00405C6.77259 9.04169 6.67139 9.1362 6.62145 9.25556C6.59567 9.31753 6.58661 9.38793 6.60275 9.45663L6.60481 9.46743L6.61111 9.48866L11.5363 21.0346L11.5393 21.0422L11.542 21.0506L16.4883 24.318C16.4883 24.318 16.5186 24.3377 16.5413 24.3483C16.6346 24.3916 16.7451 24.3976 16.8436 24.3644C16.9634 24.3245 17.0601 24.2285 17.1065 24.1082C17.1322 24.043 17.1384 23.9678 17.1182 23.8967L17.1148 23.8824L17.1092 23.8647L12.3323 12.1628L17.5255 15.3441L17.523 15.3414Z" />
          <path d="M11.666 11.7584L6.96316 22.7828L5.78913 20.0272L10.4907 9.00392L11.666 11.7584Z" />
          <path d="M2.93608 13.336L3.93179 15.6706L9.46313 2.70327L8.46742 0.368652L2.93608 13.336Z" />
          <path d="M4.09068 16.0425L5.43468 19.1923L10.9637 6.22383L9.61966 3.07406L4.09068 16.0425Z" />
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
