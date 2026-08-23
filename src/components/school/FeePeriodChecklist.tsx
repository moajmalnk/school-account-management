import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { StudentSchedulePeriodOption } from "@/lib/student-fees";

function inr(amount: number) {
  return `₹ ${amount.toLocaleString("en-IN")}`;
}

type FeePeriodChecklistProps = {
  options: StudentSchedulePeriodOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** When true, selected = billable; when false, selected = on break */
  mode?: "select" | "billable";
  disabled?: boolean;
  className?: string;
};

/**
 * Professional term / month period picker with amounts and bulk actions.
 */
export function FeePeriodChecklist({
  options,
  selected,
  onChange,
  mode = "select",
  disabled,
  className,
}: FeePeriodChecklistProps) {
  const selectedSet = new Set(selected.map((s) => s.trim().toLowerCase()));
  const isOn = (label: string) => selectedSet.has(label.trim().toLowerCase());

  const terms = options.filter((o) => o.mode === "term");
  const months = options.filter((o) => o.mode === "month");

  const toggle = (label: string) => {
    if (disabled) return;
    if (isOn(label)) {
      onChange(selected.filter((p) => p.trim().toLowerCase() !== label.trim().toLowerCase()));
    } else {
      onChange([...selected, label]);
    }
  };

  const setGroup = (group: StudentSchedulePeriodOption[], all: boolean) => {
    if (disabled) return;
    const keys = new Set(group.map((o) => o.label.trim().toLowerCase()));
    const kept = selected.filter((p) => !keys.has(p.trim().toLowerCase()));
    onChange(all ? [...kept, ...group.map((o) => o.label)] : kept);
  };

  const renderGroup = (
    title: string,
    group: StudentSchedulePeriodOption[],
    hint: string,
  ) => {
    if (group.length === 0) return null;
    const allSelected = group.every((o) => isOn(o.label));
    const someSelected = group.some((o) => isOn(o.label));
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-400">
              {title}
            </div>
            <p className="mt-0.5 text-[11px] text-black/45 dark:text-zinc-500">{hint}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              disabled={disabled || allSelected}
              onClick={() => setGroup(group, true)}
              className="rounded-full px-2 py-1 text-[11px] font-semibold text-[#0F766E] hover:bg-[#CCFBF1]/60 disabled:opacity-40"
            >
              All
            </button>
            <button
              type="button"
              disabled={disabled || !someSelected}
              onClick={() => setGroup(group, false)}
              className="rounded-full px-2 py-1 text-[11px] font-semibold text-black/55 hover:bg-black/5 disabled:opacity-40 dark:text-zinc-400"
            >
              None
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {group.map((opt) => {
            const checked = isOn(opt.label);
            return (
              <label
                key={`${opt.kind}-${opt.label}`}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-[13px] transition-colors",
                  checked
                    ? mode === "billable"
                      ? "border-[#0F766E]/40 bg-[#F0FDFA] dark:border-teal-500/40 dark:bg-teal-950/30"
                      : "border-[#0F766E] bg-[#CCFBF1]/70 dark:border-teal-500/50 dark:bg-teal-950/40"
                    : "border-[#E5E5E5] bg-white hover:border-black/15 dark:border-white/10 dark:bg-zinc-900/40",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Checkbox
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(value) => {
                      if (disabled) return;
                      const next = value === true;
                      if (next === checked) return;
                      toggle(opt.label);
                    }}
                    className="h-4 w-4 shrink-0"
                  />
                  <span className="truncate font-medium text-slate-900 dark:text-zinc-100">
                    {opt.label}
                  </span>
                </span>
                {opt.amount > 0 ? (
                  <span className="shrink-0 font-mono text-[12px] font-semibold text-slate-600 dark:text-zinc-300">
                    {inr(opt.amount)}
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  if (options.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[#E5E5E5] bg-[#FAFAFA] px-3 py-4 text-center text-[13px] text-black/50 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-400">
        No fee periods on this student&apos;s schedule yet.
      </p>
    );
  }

  const selectedCount = options.filter((o) => isOn(o.label)).length;
  const totalAmount = options
    .filter((o) => isOn(o.label))
    .reduce((s, o) => s + o.amount, 0);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-zinc-900/60">
        <p className="text-[12px] text-slate-600 dark:text-zinc-400">
          {mode === "billable" ? (
            <>
              <span className="font-semibold text-slate-900 dark:text-zinc-100">
                {selectedCount}
              </span>{" "}
              of {options.length} periods billable
              {totalAmount > 0 ? (
                <>
                  {" · "}
                  <span className="font-mono font-semibold text-[#0F766E]">
                    {inr(totalAmount)}
                  </span>
                </>
              ) : null}
            </>
          ) : (
            <>
              <span className="font-semibold text-slate-900 dark:text-zinc-100">
                {selectedCount}
              </span>{" "}
              period{selectedCount === 1 ? "" : "s"} selected
              {totalAmount > 0 ? (
                <>
                  {" · "}
                  <span className="font-mono font-semibold text-slate-700 dark:text-zinc-200">
                    {inr(totalAmount)}
                  </span>{" "}
                  paused
                </>
              ) : null}
            </>
          )}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={disabled || selectedCount === options.length}
            onClick={() => onChange(options.map((o) => o.label))}
            className="rounded-full px-2 py-1 text-[11px] font-semibold text-[#0F766E] hover:bg-[#CCFBF1]/60 disabled:opacity-40"
          >
            Select all
          </button>
          <button
            type="button"
            disabled={disabled || selectedCount === 0}
            onClick={() => onChange([])}
            className="rounded-full px-2 py-1 text-[11px] font-semibold text-black/55 hover:bg-black/5 disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </div>

      {renderGroup(
        "Terms",
        terms,
        mode === "billable"
          ? "Term installments on this schedule"
          : "Pause one or more terms",
      )}
      {renderGroup(
        "Months",
        months,
        mode === "billable"
          ? "Monthly installments on this schedule"
          : "Pause one or more months",
      )}
    </div>
  );
}
