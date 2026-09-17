import { Sparkles } from "lucide-react";

import { mobileFabClass } from "@/components/layout/MobileTabBar";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpen: () => void;
  label?: string;
};

export function FeezoFab({ open, onOpen, label = "Feezo AI" }: Props) {
  if (open) return null;

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-label={label}
        className={cn(
          mobileFabClass,
          "grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#0F766E] to-[#115E59] text-white shadow-lg shadow-teal-900/25 ring-2 ring-white/70 transition hover:scale-[1.03] active:scale-95 dark:ring-zinc-900/60",
        )}
      >
        <Sparkles className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onOpen}
        aria-label={label}
        className="fixed bottom-6 right-6 z-40 hidden h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#0F766E] to-[#115E59] text-white shadow-xl shadow-teal-900/30 ring-2 ring-white/80 transition hover:scale-[1.03] active:scale-95 md:grid dark:ring-zinc-900/50"
      >
        <Sparkles className="h-[22px] w-[22px]" />
      </button>
    </>
  );
}
