import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type SubscriptionCycle = "Monthly" | "Annual";

type SubscriptionRenewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  monthly: number;
  annually: number;
  currencySymbol: string;
  currentCycle: SubscriptionCycle;
  renewalDate: string | null;
  autoRenew: boolean;
  onAutoRenewChange: (next: boolean) => void;
  onComplete: (cycle: SubscriptionCycle) => void;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addBillingPeriod(fromIso: string | null, cycle: SubscriptionCycle): string {
  const today = startOfDay(new Date());
  let base = fromIso ? startOfDay(parseIsoDate(fromIso)) : today;
  if (Number.isNaN(base.getTime()) || base < today) {
    base = today;
  }
  const next = new Date(base);
  if (cycle === "Annual") next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return toIsoDate(next);
}

function formatMoney(symbol: string, amount: number): string {
  return `${symbol} ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function SubscriptionRenewDialog({
  open,
  onOpenChange,
  planName,
  monthly,
  annually,
  currencySymbol,
  currentCycle,
  renewalDate,
  autoRenew,
  onAutoRenewChange,
  onComplete,
}: SubscriptionRenewDialogProps) {
  const [cycle, setCycle] = useState<SubscriptionCycle>(currentCycle);

  useEffect(() => {
    if (open) setCycle(currentCycle);
  }, [open, currentCycle]);

  const options = useMemo(
    () => [
      {
        id: "Annual" as const,
        label: "1 year",
        price: annually,
        unit: "/yr",
      },
      {
        id: "Monthly" as const,
        label: "1 month",
        price: monthly,
        unit: "/mo",
      },
    ],
    [annually, monthly],
  );

  const selected = options.find((option) => option.id === cycle) ?? options[1];
  const newEndDate = addBillingPeriod(renewalDate, cycle);
  const lineLabel =
    cycle === "Annual" ? `${planName} plan (12 months)` : `${planName} plan (1 month)`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto rounded-2xl p-0 sm:max-w-[440px]"
        showCloseButton
      >
        <DialogHeader className="space-y-1 px-6 pb-0 pt-6 text-left">
          <DialogTitle className="text-[18px] font-semibold tracking-tight text-black dark:text-zinc-50">
            Renew your {planName} plan
          </DialogTitle>
          <DialogDescription className="text-[13px] text-black/55 dark:text-zinc-400">
            Choose a billing period. Online auto-charge is not enabled yet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          <div className="space-y-2">
            {options.map((option) => {
              const active = option.id === cycle;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCycle(option.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition",
                    active
                      ? "border-[#0F766E] bg-[#F0FDFA] dark:border-[#2DD4BF] dark:bg-[#0F766E]/15"
                      : "border-[#E5E5E5] bg-white hover:border-[#0F766E]/40 dark:border-white/10 dark:bg-zinc-900",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid h-4 w-4 place-items-center rounded-full border",
                        active
                          ? "border-[#0F766E] dark:border-[#2DD4BF]"
                          : "border-[#C4C4C4] dark:border-white/30",
                      )}
                    >
                      {active ? (
                        <span className="h-2 w-2 rounded-full bg-[#0F766E] dark:bg-[#2DD4BF]" />
                      ) : null}
                    </span>
                    <span className="text-[14px] font-medium text-black dark:text-zinc-50">
                      {option.label}
                    </span>
                  </span>
                  <span className="text-[14px] font-semibold text-black dark:text-zinc-50">
                    {formatMoney(currencySymbol, option.price)}
                    <span className="font-normal text-black/45 dark:text-zinc-500">
                      {option.unit}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl bg-[#F4F6F9] px-4 py-3 dark:bg-zinc-800/80">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-black/55 dark:text-zinc-400">Expiration date</span>
              <span className="font-medium text-black dark:text-zinc-100">{newEndDate}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[13px]">
              <span className="text-black/55 dark:text-zinc-400">{lineLabel}</span>
              <span className="font-medium text-black dark:text-zinc-100">
                {formatMoney(currencySymbol, selected.price)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-black/8 pt-3 dark:border-white/10">
              <span className="text-[13px] font-medium text-black dark:text-zinc-200">Total</span>
              <span className="text-[18px] font-bold tracking-tight text-black dark:text-zinc-50">
                {formatMoney(currencySymbol, selected.price)}
              </span>
            </div>
          </div>

          <label className="flex items-start justify-between gap-3 rounded-xl border border-[#E5E5E5] px-4 py-3 dark:border-white/10">
            <span className="text-[13px] leading-snug text-black/70 dark:text-zinc-300">
              Auto-renewal: remind you before the due date and keep this plan running.
            </span>
            <Switch
              checked={autoRenew}
              onCheckedChange={onAutoRenewChange}
              className="mt-0.5 data-[state=checked]:bg-[#0F766E]"
              aria-label="Auto-renewal"
            />
          </label>
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-3 border-t border-[#E5E5E5] px-6 py-4 dark:border-white/10 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="px-0 text-[14px] text-black/55 hover:bg-transparent hover:text-black dark:text-zinc-400"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-lg bg-[#0F766E] px-5 text-white hover:bg-[#0D9488]"
            onClick={() => onComplete(cycle)}
          >
            Complete payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
