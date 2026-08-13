import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

export function FeezoMark({ className }: { className?: string }) {
  return (
    <img
      src={BRAND.mark}
      alt=""
      className={cn("h-full w-full object-contain", className)}
    />
  );
}

export function FeezoBrand({
  subtitle,
  compact = false,
  stacked = false,
  className,
  markClassName,
}: {
  subtitle?: string;
  compact?: boolean;
  stacked?: boolean;
  className?: string;
  markClassName?: string;
}) {
  const caption = subtitle ?? BRAND.tagline;

  if (compact) {
    return (
      <div
        className={cn("grid place-items-center", className)}
        title={`${BRAND.name} · ${caption}`}
      >
        <img
          src={BRAND.mark}
          alt={BRAND.name}
          className={cn("h-11 w-11 object-contain xl:h-12 xl:w-12", markClassName)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-w-0",
        stacked ? "flex flex-col items-center gap-1.5 text-center" : "flex items-center gap-2.5",
        className,
      )}
    >
      <img
        src={BRAND.mark}
        alt=""
        className={cn(
          "shrink-0 object-contain",
          stacked ? "h-12 w-12 xl:h-14 xl:w-14" : "h-9 w-9",
          markClassName,
        )}
      />
      <div className={cn("min-w-0 leading-tight", stacked && "px-0.5")}>
        <div
          className={cn(
            "truncate font-semibold tracking-tight text-slate-900 dark:text-zinc-50",
            stacked ? "text-[13px] xl:text-[14px]" : "text-[14px]",
          )}
        >
          Fee<span className="text-[#8FCA4A]">zo</span>
        </div>
        <div
          className={cn(
            "truncate font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500",
            stacked ? "text-[9px] xl:text-[10px]" : "text-[10px]",
          )}
        >
          {caption}
        </div>
      </div>
    </div>
  );
}
