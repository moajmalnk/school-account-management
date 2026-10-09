import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  getReceiptPrintLayout,
  RECEIPT_PRINT_LAYOUTS,
  setReceiptPrintLayout,
  type ReceiptPrintLayout,
} from "@/lib/receipt-layout";

function SheetPreview({ layout }: { layout: ReceiptPrintLayout }) {
  const slip = (
    <div className="flex h-full flex-col gap-[3px] rounded-[2px] bg-white p-[4px] ring-1 ring-black/10">
      <div className="mx-auto h-[3px] w-1/2 rounded-full bg-[#0F766E]" />
      <div className="h-[2px] w-3/4 rounded-full bg-black/15" />
      <div className="h-[2px] w-2/3 rounded-full bg-black/15" />
      <div className="mt-auto h-[3px] w-1/3 self-end rounded-full bg-[#0F766E]/70" />
    </div>
  );

  if (layout === "a4-portrait") {
    return <div className="mx-auto h-[64px] w-[46px]">{slip}</div>;
  }
  return (
    <div className="mx-auto flex h-[46px] w-[66px] rounded-[2px] bg-black/[0.04] ring-1 ring-black/10">
      <div className="h-full w-1/2 p-[2px]">{layout === "a5-duplicate" ? slip : null}</div>
      <div className="h-full w-px border-l border-dashed border-black/25" />
      <div className="h-full w-1/2 p-[2px]">{slip}</div>
    </div>
  );
}

/** Settings → School: paper layout for printed / downloaded fee receipts on this device. */
export function ReceiptPrintLayoutCard() {
  const [layout, setLayout] = useState<ReceiptPrintLayout>(() => getReceiptPrintLayout());

  const choose = (next: ReceiptPrintLayout) => {
    if (next === layout) return;
    setLayout(next);
    setReceiptPrintLayout(next);
    const option = RECEIPT_PRINT_LAYOUTS.find((o) => o.value === next);
    toast.success(`Receipts will print as ${option?.label ?? next}`, {
      description: "Saved on this device",
    });
  };

  return (
    <div>
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
        Receipt print layout
      </Label>
      <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {RECEIPT_PRINT_LAYOUTS.map((option) => {
          const active = option.value === layout;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => choose(option.value)}
              aria-pressed={active}
              className={cn(
                "relative flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition sm:flex-col sm:items-stretch sm:text-center",
                active
                  ? "border-[#0F766E] bg-[#0F766E]/[0.06] ring-1 ring-[#0F766E]"
                  : "border-black/10 hover:border-[#0F766E]/40 dark:border-white/10",
              )}
            >
              {active ? (
                <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-[#0F766E] text-white">
                  <Check className="h-3 w-3" />
                </span>
              ) : null}
              <div className="grid h-[68px] w-[72px] shrink-0 place-items-center sm:w-full">
                <SheetPreview layout={option.value} />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-black dark:text-zinc-100">
                  {option.label}
                </div>
                <div className="mt-0.5 text-[11.5px] leading-snug text-black/50 dark:text-zinc-400">
                  {option.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11.5px] leading-snug text-black/50 dark:text-zinc-400">
        Used for receipt print and download on this device. Landscape layouts print on A4 landscape
        with a dashed cut line; receipts with too many fee lines for A5 fall back to A4 portrait.
        WhatsApp shares always send the A4 copy.
      </p>
    </div>
  );
}
