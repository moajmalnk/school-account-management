import { ArrowUpRight } from "lucide-react";
import * as React from "react";

import { cn, cornerClasses, toneClasses, type CornerSide, type Tone } from "@/lib/utils";

type OrganicCardProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: Tone;
  cornerSide?: CornerSide;
  arrow?: boolean;
  onArrowClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  arrowAriaLabel?: string;
  padded?: boolean;
};

const SHADOW = "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-32px_rgba(0,0,0,0.18)]";

const contentPadByCorner: Record<CornerSide, string> = {
  tr: "pr-14",
  tl: "pl-14",
  br: "pr-14 pb-14",
  bl: "pl-14 pb-14",
};

export function OrganicCard({
  tone = "white",
  cornerSide = "tr",
  arrow = false,
  onArrowClick,
  arrowAriaLabel = "Open detail",
  padded = false,
  className,
  children,
  ...rest
}: OrganicCardProps) {
  return (
    <div
      {...rest}
      className={cn(
        "organic-card relative",
        toneClasses[tone],
        cornerClasses[cornerSide],
        SHADOW,
        padded ? "p-4 sm:p-6" : "",
        className,
      )}
    >
      {arrow ? (
        <div className={cn("relative", contentPadByCorner[cornerSide])}>{children}</div>
      ) : (
        children
      )}
      {arrow && (
        <ArrowGlyph
          tone={tone}
          cornerSide={cornerSide}
          onClick={onArrowClick}
          aria-label={arrowAriaLabel}
        />
      )}
    </div>
  );
}

type ArrowGlyphProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone;
  cornerSide?: CornerSide;
};

export function ArrowGlyph({
  tone = "white",
  cornerSide = "tr",
  className,
  onClick,
  ...rest
}: ArrowGlyphProps) {
  const isOnHighlight = tone === "lime";
  const isOnBlack = tone === "black";

  // Position floats opposite the cut corner on the same edge for a balanced silhouette.
  const positionByCorner: Record<CornerSide, string> = {
    tr: "absolute right-4 top-4",
    tl: "absolute left-4 top-4",
    bl: "absolute left-4 bottom-4",
    br: "absolute right-4 bottom-4",
  };

  const inkClass = isOnHighlight
    ? "bg-white text-[#2563EB] hover:bg-white/90"
    : isOnBlack
      ? "bg-white text-[#0F172A] hover:bg-white/90"
      : "bg-white text-[#0F172A] border border-[#0F172A] hover:bg-[#0F172A] hover:text-white";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={cn(
        positionByCorner[cornerSide],
        "z-10 grid h-10 w-10 place-items-center rounded-full transition-colors",
        "shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
        inkClass,
        className,
      )}
      {...rest}
    >
      <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
    </button>
  );
}
