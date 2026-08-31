import { MonthPicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  academicYearCoverageCaption,
  defaultClosingMonthKey,
  formatBooksRangeLabel,
} from "@/lib/academic-year";
import { cn } from "@/lib/utils";

export function FinancialYearFields({
  startMonthKey,
  endMonthKey,
  onStartMonthKeyChange,
  onEndMonthKeyChange,
  className,
}: {
  startMonthKey: string;
  endMonthKey: string;
  onStartMonthKeyChange: (key: string) => void;
  onEndMonthKeyChange: (key: string) => void;
  className?: string;
}) {
  const preview = formatBooksRangeLabel(startMonthKey, endMonthKey);
  const caption = preview ? academicYearCoverageCaption(preview) : null;
  const invalid = Boolean(startMonthKey && endMonthKey && endMonthKey < startMonthKey);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-12 min-w-0 sm:col-span-6">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
            Start month & year
          </Label>
          <MonthPicker
            value={startMonthKey}
            onChange={(key) => {
              const prevDefault = defaultClosingMonthKey(startMonthKey);
              onStartMonthKeyChange(key);
              if (!endMonthKey || endMonthKey === prevDefault || endMonthKey < key) {
                onEndMonthKeyChange(defaultClosingMonthKey(key));
              }
            }}
            placeholder="Start month"
            allowClear={false}
            className="mt-1.5 h-9"
          />
        </div>
        <div className="col-span-12 min-w-0 sm:col-span-6">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
            Closing month & year
          </Label>
          <MonthPicker
            value={endMonthKey}
            onChange={onEndMonthKeyChange}
            placeholder="Closing month"
            min={startMonthKey || undefined}
            allowClear={false}
            className="mt-1.5 h-9"
          />
        </div>
      </div>
      {invalid ? (
        <p className="text-[10.5px] text-[#DC2626]">
          Closing month must be on or after the start month.
        </p>
      ) : caption ? (
        <p className="text-[10.5px] text-black/45 dark:text-zinc-500">
          Books run <span className="font-medium text-black/65 dark:text-zinc-300">{caption}</span>
          {preview ? (
            <>
              {" "}
              · stored as <span className="font-mono">{preview}</span>
            </>
          ) : null}
        </p>
      ) : (
        <p className="text-[10.5px] text-black/45 dark:text-zinc-500">
          Choose the first month and the last month of these books.
        </p>
      )}
    </div>
  );
}

export function resolveFinancialYearInput(
  startMonthKey: string,
  endMonthKey: string,
): string | null {
  return formatBooksRangeLabel(startMonthKey, endMonthKey);
}
