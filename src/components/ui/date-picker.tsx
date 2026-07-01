import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_ABBR = MONTHS.map((m) => m.slice(0, 3));
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISO(v?: string) {
  if (!v) return null;
  const [y, m, d] = v.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function parseFlexibleDate(v?: string) {
  if (!v) return null;
  const iso = parseISO(v);
  if (iso) return iso;
  const match = v.trim().match(/^(\d{1,2})\s+([A-Za-z]{3}),?\s+(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const monthIdx = MONTH_ABBR.findIndex((m) => m.toLowerCase() === match[2].toLowerCase());
  const year = parseInt(match[3], 10);
  if (monthIdx < 0 || !day || !year) return null;
  return new Date(year, monthIdx, day);
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function stripTime(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDisplay(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()].slice(0, 3)}, ${d.getFullYear()}`;
}

function formatDisplayLong(d: Date) {
  return `${d.getDate()} ${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`;
}

function buildMonthGrid(viewMonth: Date) {
  const first = startOfMonth(viewMonth);
  const startWeekday = first.getDay();
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startWeekday);
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({ date: d, inMonth: d.getMonth() === viewMonth.getMonth() });
  }
  return cells;
}

export type DatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  align?: "start" | "center" | "end";
  className?: string;
  disabled?: boolean;
  valueFormat?: "iso" | "display";
  variant?: "default" | "pill";
  quickPicks?: { label: string; getDate: (today: Date) => Date }[];
};

const DEFAULT_QUICK_PICKS: NonNullable<DatePickerProps["quickPicks"]> = [
  { label: "Today", getDate: (t) => t },
  {
    label: "+30d",
    getDate: (t) => new Date(t.getFullYear(), t.getMonth(), t.getDate() + 30),
  },
  { label: "+1y", getDate: (t) => new Date(t.getFullYear() + 1, t.getMonth(), t.getDate()) },
];

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  min,
  max,
  align = "start",
  className,
  disabled,
  valueFormat = "iso",
  variant = "default",
  quickPicks = DEFAULT_QUICK_PICKS,
}: DatePickerProps) {
  const selected = useMemo(() => parseFlexibleDate(value), [value]);
  const minDate = useMemo(() => parseFlexibleDate(min) ?? parseISO(min), [min]);
  const maxDate = useMemo(() => parseFlexibleDate(max) ?? parseISO(max), [max]);
  const today = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(selected ?? today));
  const initialised = useRef(false);

  useEffect(() => {
    if (open && !initialised.current) {
      setViewMonth(startOfMonth(selected ?? today));
      initialised.current = true;
    }
    if (!open) initialised.current = false;
  }, [open, selected, today]);

  const yearOptions = useMemo(() => {
    const start = (minDate ?? new Date(today.getFullYear() - 10, 0, 1)).getFullYear();
    const end = (maxDate ?? new Date(today.getFullYear() + 10, 0, 1)).getFullYear();
    const years: number[] = [];
    for (let y = start; y <= end; y++) years.push(y);
    return years;
  }, [minDate, maxDate, today]);

  const days = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const isDisabled = (d: Date) => {
    if (minDate && d < stripTime(minDate)) return true;
    if (maxDate && d > stripTime(maxDate)) return true;
    return false;
  };

  const commit = (d: Date) => {
    if (isDisabled(d)) return;
    onChange(valueFormat === "display" ? formatDisplayLong(d) : toISO(d));
    setOpen(false);
  };

  const shiftMonth = (delta: number) =>
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  const displayText = selected
    ? valueFormat === "display"
      ? formatDisplayLong(selected)
      : formatDisplay(selected)
    : null;

  return (
    <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "inline-flex h-10 w-full items-center justify-between gap-2 border bg-white text-left text-[13px] font-medium text-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7F33C] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
            variant === "pill"
              ? "rounded-full border-black px-4 hover:bg-[#FAFAFA]"
              : "rounded-2xl border-[#E5E5E5] px-3 hover:border-black/30 focus-visible:ring-black/15",
            !selected && "text-black/45",
            className,
          )}
        >
          <span className={cn("truncate tracking-tight", variant === "pill" ? "" : "font-mono")}>
            {displayText ?? placeholder}
          </span>
          {variant !== "pill" && <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-black/45" />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={6}
        collisionPadding={12}
        sticky="always"
        className="z-[250] w-[min(280px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white p-0 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-center gap-1.5 border-b border-[#EEEEEE] px-2.5 py-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-black/55 transition hover:bg-[#F4F4F5] hover:text-black"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <div className="flex flex-1 items-center justify-center gap-1">
            <Select
              value={String(viewMonth.getMonth())}
              onValueChange={(v) => setViewMonth(new Date(viewMonth.getFullYear(), Number(v), 1))}
            >
              <SelectTrigger className="h-7 w-[4.5rem] rounded-full border-transparent bg-transparent px-2 text-[12px] font-semibold shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[300] rounded-2xl border border-[#E5E5E5] bg-white p-1">
                {MONTHS.map((m, i) => (
                  <SelectItem
                    key={m}
                    value={String(i)}
                    className="rounded-xl text-[12px] focus:bg-[#E1F2AE] data-[state=checked]:bg-[#C7F33C] data-[state=checked]:text-black"
                  >
                    {m.slice(0, 3)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(viewMonth.getFullYear())}
              onValueChange={(v) => setViewMonth(new Date(Number(v), viewMonth.getMonth(), 1))}
            >
              <SelectTrigger className="h-7 w-[4.5rem] rounded-full border-transparent bg-transparent px-2 text-[12px] font-semibold shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[300] max-h-56 rounded-2xl border border-[#E5E5E5] bg-white p-1">
                {yearOptions.map((y) => (
                  <SelectItem
                    key={y}
                    value={String(y)}
                    className="rounded-xl font-mono text-[12px] focus:bg-[#E1F2AE] data-[state=checked]:bg-[#C7F33C] data-[state=checked]:text-black"
                  >
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-black/55 transition hover:bg-[#F4F4F5] hover:text-black"
            aria-label="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="px-2.5 py-2.5">
          <div className="grid grid-cols-7 gap-y-0.5">
            {WEEKDAYS.map((w, i) => (
              <div
                key={i}
                className="grid h-6 place-items-center text-[10px] font-semibold uppercase tracking-wider text-black/45"
              >
                {w}
              </div>
            ))}
            {days.map(({ date, inMonth }) => {
              const isSel = !!selected && sameDay(date, selected);
              const isToday = sameDay(date, today);
              const off = isDisabled(date);
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  disabled={off}
                  onClick={() => commit(date)}
                  className="group/cell grid h-8 w-full place-items-center"
                  aria-pressed={isSel}
                  aria-label={formatDisplay(date)}
                >
                  <span
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-full font-mono text-[11.5px] leading-none transition",
                      isSel
                        ? "bg-[#C7F33C] font-semibold text-black shadow-[0_4px_10px_-6px_rgba(0,0,0,0.35)]"
                        : isToday
                          ? "ring-1 ring-inset ring-black/60 group-hover/cell:bg-black/5"
                          : "group-hover/cell:bg-[#F4F4F5]",
                      !inMonth && !isSel && "text-black/30",
                      inMonth && !isSel && "text-black/85",
                      off && "cursor-not-allowed text-black/20 group-hover/cell:bg-transparent",
                    )}
                  >
                    {date.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {quickPicks.length > 0 && (
          <div className="flex items-center gap-1 border-t border-[#EEEEEE] px-2.5 py-2">
            <div className="flex flex-1 items-center gap-1 overflow-hidden">
              {quickPicks.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => commit(stripTime(q.getDate(today)))}
                  className="inline-flex shrink-0 items-center rounded-full border border-[#E5E5E5] bg-white px-2 py-1 text-[10.5px] font-semibold text-black/70 transition hover:border-black hover:bg-black hover:text-white"
                >
                  {q.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="shrink-0 rounded-full px-2 py-1 text-[10.5px] font-semibold text-black/55 transition hover:bg-[#F4F4F5] hover:text-black"
            >
              Clear
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
