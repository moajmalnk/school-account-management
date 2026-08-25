import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DEFAULT_FEE_COLLECTION_START_MONTH,
  FEE_MONTHS,
  installmentLabel,
  type ClassBillingCycle,
  type ClassFeeAmountMode,
  type ClassFeeLine,
} from "@/lib/tenant-store";

export type FeeScheduleDraft = {
  billingModeChosen: boolean;
  billingCycle: Extract<ClassBillingCycle, "Monthly" | "Term">;
  feeAmountMode: ClassFeeAmountMode;
  installmentCount: string;
  fixedAmount: string;
  feeCollectionStartMonth: string;
  installments: Array<{
    id: string;
    label: string;
    amount: string;
    dueDate: string;
  }>;
};

export function emptyFeeScheduleDraft(startMonth?: string): FeeScheduleDraft {
  const month =
    startMonth && FEE_MONTHS.some((m) => m.toLowerCase() === startMonth.toLowerCase())
      ? FEE_MONTHS.find((m) => m.toLowerCase() === startMonth.toLowerCase())!
      : DEFAULT_FEE_COLLECTION_START_MONTH;
  return {
    billingModeChosen: false,
    billingCycle: "Monthly",
    feeAmountMode: "fixed",
    installmentCount: "10",
    fixedAmount: "1000",
    feeCollectionStartMonth: month,
    installments: [],
  };
}

export function draftFromFeeSchedule(input: {
  billingCycle?: Extract<ClassBillingCycle, "Monthly" | "Term">;
  feeAmountMode?: ClassFeeAmountMode;
  feeSchedule?: ClassFeeLine[];
  feeCollectionStartMonth?: string;
  startMonthFallback?: string;
}): FeeScheduleDraft {
  const cycle = input.billingCycle === "Term" ? "Term" : "Monthly";
  const lines = (input.feeSchedule ?? []).filter((l) => l.kind !== "one_time");
  const mode =
    input.feeAmountMode === "custom" ||
    (lines.length > 1 && new Set(lines.map((l) => l.amount)).size > 1)
      ? "custom"
      : "fixed";
  const count = Math.max(1, lines.length || (cycle === "Term" ? 4 : 10));
  const fixed = lines[0]?.amount ? String(lines[0].amount) : "1000";
  const installments = Array.from({ length: count }, (_, index) => {
    const existing = lines[index];
    return {
      id: existing?.id || `fl-i-${index + 1}`,
      label: existing?.label || installmentLabel(index, cycle),
      amount: existing ? String(existing.amount) : mode === "fixed" ? fixed : "",
      dueDate: existing?.dueDate ?? "",
    };
  });
  return {
    billingModeChosen: true,
    billingCycle: cycle,
    feeAmountMode: mode,
    installmentCount: String(count),
    fixedAmount: fixed,
    feeCollectionStartMonth:
      input.feeCollectionStartMonth?.trim() ||
      input.startMonthFallback ||
      DEFAULT_FEE_COLLECTION_START_MONTH,
    installments,
  };
}

export function feeScheduleFromDraft(draft: FeeScheduleDraft): ClassFeeLine[] {
  const count = Math.max(
    1,
    Math.floor(Number(draft.installmentCount) || 0) || draft.installments.length,
  );
  const fixed = Math.max(0, Math.round(Number(draft.fixedAmount) || 0));
  return Array.from({ length: count }, (_, index) => {
    const row = draft.installments[index];
    const amount =
      draft.feeAmountMode === "fixed"
        ? fixed
        : Math.max(0, Math.round(Number(row?.amount) || 0));
    const dueDate = row?.dueDate?.trim();
    return {
      id: row?.id || `fl-i-${index + 1}`,
      kind: "installment" as const,
      label: row?.label?.trim() || installmentLabel(index, draft.billingCycle),
      amount,
      ...(dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? { dueDate } : {}),
    };
  });
}

type FeeScheduleEditorProps = {
  value: FeeScheduleDraft;
  onChange: (next: FeeScheduleDraft) => void;
  amountLabel?: string;
};

export function FeeScheduleEditor({
  value,
  onChange,
  amountLabel = "Amount each (₹)",
}: FeeScheduleEditorProps) {
  const defaultCount = (cycle: FeeScheduleDraft["billingCycle"]) =>
    cycle === "Term" ? 4 : 10;

  const rebuildRows = (
    prev: FeeScheduleDraft,
    count: number,
    cycle = prev.billingCycle,
    mode = prev.feeAmountMode,
    cycleChanged = false,
  ) =>
    Array.from({ length: Math.max(1, count) }, (_, index) => {
      const existing = cycleChanged ? undefined : prev.installments[index];
      return {
        id: existing?.id || `fl-i-${index + 1}`,
        label: installmentLabel(index, cycle),
        amount:
          mode === "fixed"
            ? prev.fixedAmount || existing?.amount || ""
            : existing?.amount || prev.fixedAmount || "",
        dueDate: existing?.dueDate || "",
      };
    });

  const applyBillingCycle = (cycle: FeeScheduleDraft["billingCycle"]) => {
    const cycleChanged = value.billingCycle !== cycle;
    const count = cycleChanged
      ? defaultCount(cycle)
      : Math.max(1, Math.floor(Number(value.installmentCount) || 0) || defaultCount(cycle));
    onChange({
      ...value,
      billingModeChosen: true,
      billingCycle: cycle,
      installmentCount: String(count),
      installments: rebuildRows(value, count, cycle, value.feeAmountMode, cycleChanged),
      feeCollectionStartMonth:
        cycle === "Monthly"
          ? value.feeCollectionStartMonth || DEFAULT_FEE_COLLECTION_START_MONTH
          : value.feeCollectionStartMonth,
    });
  };

  const patchInstallment = (
    index: number,
    patch: Partial<FeeScheduleDraft["installments"][number]>,
  ) => {
    onChange({
      ...value,
      installments: value.installments.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    });
  };

  const scheduleTotal = feeScheduleFromDraft(value).reduce(
    (sum, line) => sum + line.amount,
    0,
  );

  return (
    <div className="space-y-3 rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] p-3.5 dark:border-white/10 dark:bg-zinc-900/50">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-500">
          Fee structure
        </p>
        <p className="mt-1 text-[12px] leading-snug text-black/50 dark:text-zinc-400">
          {value.billingModeChosen
            ? value.billingCycle === "Term"
              ? "Term billing is selected — only term periods will appear in Fee Collection."
              : "Monthly billing is selected — only month periods will appear in Fee Collection."
            : "Choose monthly or term fee mode. Only that schedule will be shown."}
        </p>
      </div>

      {!value.billingModeChosen ? (
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
            Fee billing mode
          </Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(
              [
                {
                  cycle: "Monthly" as const,
                  title: "Monthly",
                  hint: "Bill by calendar month · Fee Collection shows months only",
                },
                {
                  cycle: "Term" as const,
                  title: "Term",
                  hint: "Bill by terms · Fee Collection shows terms only",
                },
              ] as const
            ).map((option) => (
              <button
                key={option.cycle}
                type="button"
                onClick={() => applyBillingCycle(option.cycle)}
                className="rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-3 text-left transition-colors hover:border-[#0F766E]/50 hover:bg-[#F0FDFA] dark:border-white/15 dark:bg-zinc-950 dark:hover:border-[#2DD4BF]/40 dark:hover:bg-teal-950/30"
              >
                <div className="text-[14px] font-semibold text-black dark:text-zinc-100">
                  {option.title}
                </div>
                <p className="mt-1 text-[11px] leading-snug text-black/50 dark:text-zinc-400">
                  {option.hint}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#CCFBF1] bg-[#F0FDFA] px-3 py-2.5 dark:border-teal-900/50 dark:bg-teal-950/30">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#0F766E]/70 dark:text-[#5EEAD4]/70">
                Billing mode
              </div>
              <div className="text-[14px] font-semibold text-[#0F766E] dark:text-[#5EEAD4]">
                {value.billingCycle === "Term" ? "Term" : "Monthly"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange({ ...value, billingModeChosen: false })}
              className="shrink-0 text-[12px] font-semibold text-[#0F766E] hover:underline dark:text-[#5EEAD4]"
            >
              Change billing mode
            </button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
              Amounts
            </Label>
            <div className="flex gap-1 rounded-full border border-[#E5E5E5] bg-white p-1 dark:border-white/15 dark:bg-zinc-950">
              {(
                [
                  {
                    key: "fixed" as const,
                    label:
                      value.billingCycle === "Term"
                        ? "Same for every term"
                        : "Same each month",
                  },
                  {
                    key: "custom" as const,
                    label:
                      value.billingCycle === "Term"
                        ? "Different per term"
                        : "Different per month",
                  },
                ] as const
              ).map((option) => {
                const active = value.feeAmountMode === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      const count = Math.max(
                        1,
                        Math.floor(Number(value.installmentCount) || 0) ||
                          defaultCount(value.billingCycle),
                      );
                      onChange({
                        ...value,
                        feeAmountMode: option.key,
                        installmentCount: String(count),
                        installments: rebuildRows(
                          value,
                          count,
                          value.billingCycle,
                          option.key,
                        ),
                      });
                    }}
                    className={cn(
                      "flex-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                      active
                        ? "bg-[#0F766E] text-white"
                        : "text-black/65 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-black/45 dark:text-zinc-500">
              {value.feeAmountMode === "fixed"
                ? "One amount applies to every period. Set a due date for each below."
                : "Enter a separate amount and due date for each period."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                {value.billingCycle === "Term"
                  ? "Number of terms"
                  : "Number of installments"}
              </Label>
              <Input
                inputMode="numeric"
                value={value.installmentCount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  const count = Math.max(1, Math.floor(Number(raw) || 0));
                  onChange({
                    ...value,
                    installmentCount: raw,
                    installments: rebuildRows(value, count),
                  });
                }}
                placeholder={value.billingCycle === "Term" ? "4" : "10"}
                className="bg-white font-mono dark:bg-zinc-950"
              />
            </div>
            {value.feeAmountMode === "fixed" ? (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  {value.billingCycle === "Term" ? "Amount per term (₹)" : amountLabel}
                </Label>
                <Input
                  inputMode="numeric"
                  value={value.fixedAmount}
                  onChange={(e) => {
                    const fixedAmount = e.target.value.replace(/[^0-9]/g, "");
                    onChange({
                      ...value,
                      fixedAmount,
                      installments: value.installments.map((row) => ({
                        ...row,
                        amount: fixedAmount,
                      })),
                    });
                  }}
                  placeholder="1000"
                  className="bg-white font-mono dark:bg-zinc-950"
                />
              </div>
            ) : (
              <p className="self-end text-[12px] text-black/45 dark:text-zinc-500">
                Set each {value.billingCycle === "Term" ? "term" : "installment"} amount in the
                schedule below.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-500">
                {value.billingCycle === "Term" ? "Term schedule" : "Installment schedule"}
              </p>
              {value.feeAmountMode === "custom" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full text-[11px]"
                  onClick={() => {
                    const nextIndex = value.installments.length;
                    onChange({
                      ...value,
                      installmentCount: String(nextIndex + 1),
                      installments: [
                        ...value.installments,
                        {
                          id: `fl-i-${nextIndex + 1}`,
                          label: installmentLabel(nextIndex, value.billingCycle),
                          amount: "",
                          dueDate: "",
                        },
                      ],
                    });
                  }}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add {value.billingCycle === "Term" ? "term" : "installment"}
                </Button>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-lg border border-[#E5E5E5] bg-white dark:border-white/10 dark:bg-zinc-950">
              <div
                className={cn(
                  "grid gap-2 border-b border-[#EFEFEF] bg-[#FAFAFA] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-black/45 dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-500",
                  value.feeAmountMode === "custom"
                    ? "grid-cols-[minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,1fr)_auto]"
                    : "grid-cols-[minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,1fr)]",
                )}
              >
                <span>Label</span>
                <span>Amount (₹)</span>
                <span>Due date</span>
                {value.feeAmountMode === "custom" ? (
                  <span className="sr-only">Remove</span>
                ) : null}
              </div>
              <div className="divide-y divide-[#F0F0F0] dark:divide-white/10">
                {value.installments.map((row, index) => (
                  <div
                    key={row.id}
                    className={cn(
                      "grid items-center gap-2 px-3 py-2",
                      value.feeAmountMode === "custom"
                        ? "grid-cols-[minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,1fr)_auto]"
                        : "grid-cols-[minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,1fr)]",
                    )}
                  >
                    {value.feeAmountMode === "custom" ? (
                      <Input
                        value={row.label}
                        onChange={(e) => patchInstallment(index, { label: e.target.value })}
                        className="h-8 text-[12px]"
                      />
                    ) : (
                      <span className="truncate text-[12.5px] font-medium text-black dark:text-zinc-100">
                        {row.label}
                      </span>
                    )}
                    {value.feeAmountMode === "fixed" ? (
                      <span className="font-mono text-[12.5px] text-black/70 dark:text-zinc-300">
                        ₹ {(Number(value.fixedAmount) || 0).toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <Input
                        inputMode="numeric"
                        value={row.amount}
                        onChange={(e) =>
                          patchInstallment(index, {
                            amount: e.target.value.replace(/[^0-9]/g, ""),
                          })
                        }
                        className="h-8 font-mono text-[12px]"
                      />
                    )}
                    <DatePicker
                      value={row.dueDate || undefined}
                      onChange={(dueDate) =>
                        patchInstallment(index, { dueDate: dueDate || "" })
                      }
                      placeholder="Due date"
                      className="h-8"
                    />
                    {value.feeAmountMode === "custom" ? (
                      <button
                        type="button"
                        aria-label={`Remove ${row.label}`}
                        disabled={value.installments.length <= 1}
                        onClick={() => {
                          const next = value.installments.filter((_, i) => i !== index);
                          onChange({
                            ...value,
                            installmentCount: String(next.length),
                            installments: next,
                          });
                        }}
                        className="grid h-8 w-8 place-items-center rounded-full text-[#EF4444] transition-colors hover:bg-[#FEF2F2] disabled:opacity-40 dark:hover:bg-rose-950/50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {value.billingCycle === "Monthly" ? (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                Fee collection starts from
              </Label>
              <Select
                value={value.feeCollectionStartMonth}
                onValueChange={(month) =>
                  onChange({ ...value, feeCollectionStartMonth: month })
                }
              >
                <SelectTrigger className="h-9 bg-white text-[13px] dark:bg-zinc-950">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {FEE_MONTHS.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-black/45 dark:text-zinc-500">
                Total · ₹{" "}
                <span className="font-mono font-semibold text-[#0F766E]">
                  {scheduleTotal.toLocaleString("en-IN")}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-black/45 dark:text-zinc-500">
              Total · ₹{" "}
              <span className="font-mono font-semibold text-[#0F766E]">
                {scheduleTotal.toLocaleString("en-IN")}
              </span>
            </p>
          )}
        </>
      )}
    </div>
  );
}
