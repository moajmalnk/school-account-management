import { MonthPicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  academicYearCoverageCaption,
  booksYearToMonthKey,
  monthKeyToBooksYearLabel,
  normalizeAcademicYearLabel,
  parseBooksYearParts,
} from "@/lib/academic-year";
import { cn } from "@/lib/utils";

export function FinancialYearFields({
  monthKey,
  typedValue,
  onMonthKeyChange,
  onTypedChange,
  className,
  typedPlaceholder = "or type 2027-28 / 2027 June",
}: {
  monthKey: string;
  typedValue: string;
  onMonthKeyChange: (key: string) => void;
  onTypedChange: (value: string) => void;
  className?: string;
  typedPlaceholder?: string;
}) {
  const pickerLabel = monthKeyToBooksYearLabel(monthKey);
  const preview = normalizeAcademicYearLabel(typedValue) ?? pickerLabel ?? "";
  const caption = preview ? academicYearCoverageCaption(preview) : null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="min-w-0">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
            Start month
          </Label>
          <MonthPicker
            value={monthKey}
            onChange={(key) => {
              onMonthKeyChange(key);
              const next = monthKeyToBooksYearLabel(key);
              if (next) onTypedChange(next);
            }}
            placeholder="Choose month & year"
            allowClear={false}
            className="mt-1.5"
          />
        </div>
        <div className="min-w-0">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
            Label
          </Label>
          <Input
            value={typedValue}
            onChange={(e) => {
              const value = e.target.value;
              onTypedChange(value);
              const parts = parseBooksYearParts(value);
              if (parts) onMonthKeyChange(booksYearToMonthKey(parts.year, parts.month));
            }}
            placeholder={typedPlaceholder}
            className="mt-1.5"
          />
        </div>
      </div>
      {caption && (
        <p className="text-[10.5px] text-black/45 dark:text-zinc-500">
          Books run <span className="font-medium text-black/65 dark:text-zinc-300">{caption}</span>
          {preview ? (
            <>
              {" "}
              · stored as <span className="font-mono">{preview}</span>
            </>
          ) : null}
        </p>
      )}
    </div>
  );
}

export function resolveFinancialYearInput(typedValue: string, monthKey: string): string | null {
  return normalizeAcademicYearLabel(typedValue) ?? monthKeyToBooksYearLabel(monthKey);
}
