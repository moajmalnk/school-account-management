import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import {
  emptyFeeScheduleDraft,
  FeeScheduleEditor,
  type FeeScheduleDraft,
  type FeeScheduleHints,
} from "@/components/school/FeeScheduleEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InfoTip, type InfoTipContent } from "@/components/ui/info-tip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type AddFeeCategoryDialogVariant = "feeDescription" | "feeCategory" | "ledger";

export type AddFeeCategoryFormValue = {
  label: string;
  active: boolean;
  schedule: FeeScheduleDraft;
};

const CREATE_TIP: InfoTipContent = {
  title: "Add Fee Category",
  points: [
    "Creates a named fee for Receive Payment and receipts.",
    "Optional monthly or term structure is saved with the category for reference.",
    "Students are not charged automatically — money is recorded when you collect it.",
    "Same create flow from Settings → Fee Category and Finance → Receive Payment.",
  ],
};

const NAME_TIP: InfoTipContent = {
  title: "Category name",
  points: [
    "Shown as the fee description in Receive Payment and printed on receipts.",
    "Each name must be unique; “Hostel Fee” and “hostel fee” count as the same.",
  ],
};

const ACTIVE_TIP: InfoTipContent = {
  title: "Active",
  points: [
    "On: listed in Receive Payment for new receipts.",
    "Off: hidden from new receipts, but past receipts and reports still show it.",
  ],
};

const SCHEDULE_HINTS: FeeScheduleHints = {
  structure: {
    title: "Fee structure",
    points: [
      "Optional plan for how often this fee is billed and typical amounts.",
      "Saved with the category for reference. Students are not charged from it yet.",
    ],
  },
  billingMode: {
    title: "Billing mode",
    points: [
      "Monthly: periods are calendar months (June, July…).",
      "Term: periods are Term 1, Term 2…",
      "Leave unset to keep a label-only category for Receive Payment.",
    ],
  },
  amounts: {
    title: "Amounts",
    points: [
      "Same each period: one amount is used for every installment.",
      "Different per period: type each installment's amount.",
    ],
  },
  count: {
    title: "Number of installments",
    points: [
      "How many times this fee is billed in the academic year.",
      "Increasing adds rows at the end; decreasing removes from the end.",
    ],
  },
  schedule: {
    title: "Installment schedule",
    points: [
      "Each row is one billing period with its amount and an optional due date.",
      "The total below is the full-year amount for one student.",
    ],
  },
  startMonth: {
    title: "Fee collection starts from",
    points: [
      "The month the 1st installment covers.",
      "Example: June → 1st installment = June, 2nd = July, and so on.",
    ],
  },
};

const LEDGER_COPY = {
  title: "Create income ledger",
  description:
    "Used on receipts and mirrored into Ledgers under Direct Incomes when the chart is installed.",
  label: "Ledger name",
  placeholder: "e.g. Donation, Grant, Alumni Fund",
  submit: "Create ledger",
  submitting: "Creating…",
};

type AddFeeCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: AddFeeCategoryDialogVariant;
  /** Pre-fill when reopening (usually empty). */
  initialValue?: string;
  /** Default start month for monthly fee structure. */
  startMonthFallback?: string;
  saving?: boolean;
  onSubmit: (value: AddFeeCategoryFormValue) => void | Promise<void>;
};

/**
 * Shared create dialog for fee categories (Settings + Finance) and income ledgers.
 * Category create matches the professional Add Fee Category flow (name, structure, active).
 */
export function AddFeeCategoryDialog({
  open,
  onOpenChange,
  variant = "feeCategory",
  initialValue = "",
  startMonthFallback,
  saving = false,
  onSubmit,
}: AddFeeCategoryDialogProps) {
  const isLedger = variant === "ledger";
  const [label, setLabel] = useState(initialValue);
  const [active, setActive] = useState(true);
  const [schedule, setSchedule] = useState<FeeScheduleDraft>(() =>
    emptyFeeScheduleDraft(startMonthFallback),
  );

  useEffect(() => {
    if (!open) return;
    setLabel(initialValue);
    setActive(true);
    setSchedule(emptyFeeScheduleDraft(startMonthFallback));
  }, [open, initialValue, startMonthFallback]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed || saving) return;
    void onSubmit({
      label: trimmed,
      active: isLedger ? true : active,
      schedule: isLedger ? emptyFeeScheduleDraft(startMonthFallback) : schedule,
    });
  };

  if (isLedger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>{LEDGER_COPY.title}</DialogTitle>
            <DialogDescription>{LEDGER_COPY.description}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                {LEDGER_COPY.label}
              </Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={LEDGER_COPY.placeholder}
                autoFocus
                className="h-11"
                disabled={saving}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={saving}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !label.trim()}
                className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {LEDGER_COPY.submitting}
                  </>
                ) : (
                  LEDGER_COPY.submit
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,760px)] w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 space-y-1.5 border-b border-[#EFEFEF] px-4 py-3 pr-12 sm:px-6 sm:py-4 dark:border-white/10">
          <DialogTitle className="flex items-center gap-1">
            Add Fee Category
            <InfoTip content={CREATE_TIP} side="bottom" />
          </DialogTitle>
          <DialogDescription>
            Name the fee and set installments. Student assignment and dues come in a later update.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6 sm:py-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Category name
                <InfoTip content={NAME_TIP} className="-my-1" />
              </Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Hostel Fee"
                autoFocus
                disabled={saving}
              />
            </div>
            <FeeScheduleEditor value={schedule} onChange={setSchedule} hints={SCHEDULE_HINTS} />
            <div className="flex items-center justify-between gap-3 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3 py-2.5 dark:border-white/10 dark:bg-zinc-900/70">
              <div>
                <div className="flex items-center gap-1 text-[13px] font-semibold text-black dark:text-zinc-100">
                  Active
                  <InfoTip content={ACTIVE_TIP} />
                </div>
                <div className="text-[11.5px] text-black/55 dark:text-zinc-400">
                  Inactive categories stay in history but are hidden from new receipts
                </div>
              </div>
              <Switch checked={active} onCheckedChange={setActive} disabled={saving} />
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-[#EFEFEF] px-4 py-3 sm:px-6 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !label.trim()}
              className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add Category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
