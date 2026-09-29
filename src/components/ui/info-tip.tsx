import { useEffect, useRef, useState, type ReactNode } from "react";
import { Info } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type InfoTipContent = {
  title: string;
  points: ReactNode[];
  note?: ReactNode;
};

const CLOSE_DELAY_MS = 120;

/** Hover on desktop, tap on touch · Radix Tooltip never opens on tap. */
export function InfoTip({
  content,
  label,
  side = "top",
  align = "start",
  className,
}: {
  content: InfoTipContent;
  label?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  useEffect(() => cancelClose, []);

  const hoverProps = {
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      cancelClose();
      setOpen(true);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      scheduleClose();
    },
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label ?? content.title}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-grid h-5 w-5 shrink-0 place-items-center rounded-full align-middle text-black/35 transition-colors hover:bg-[#0F766E]/10 hover:text-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/30 dark:text-zinc-500 dark:hover:text-[#2DD4BF]",
            open && "bg-[#0F766E]/10 text-[#0F766E] dark:text-[#2DD4BF]",
            className,
          )}
          {...hoverProps}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        collisionPadding={12}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="z-[330] w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-[0_16px_40px_-12px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-zinc-900"
        {...hoverProps}
      >
        <p className="text-[12.5px] font-semibold normal-case tracking-normal text-slate-900 dark:text-zinc-50">
          {content.title}
        </p>
        <ul className="mt-1.5 space-y-1.5">
          {content.points.map((point, index) => (
            <li
              key={index}
              className="flex gap-2 text-[11.5px] font-normal normal-case leading-snug tracking-normal text-slate-600 dark:text-zinc-300"
            >
              <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[#0F766E] dark:bg-[#2DD4BF]" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        {content.note ? (
          <p className="mt-2 rounded-lg bg-[#F0FDFA] px-2.5 py-1.5 text-[11px] font-normal normal-case leading-snug tracking-normal text-[#115E59] dark:bg-teal-950/40 dark:text-teal-200">
            {content.note}
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
