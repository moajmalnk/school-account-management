import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  formatEventDate,
  formatEventDateTime,
  formatReceiptDateTimeFromParts,
  parseReceiptDateTimeParts,
  toClockLocal,
} from "@/lib/dates";
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
  /** Show "Today" / "Yesterday" instead of numeric dates when applicable. */
  relativeDisplay?: boolean;
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
  relativeDisplay = false,
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
    ? relativeDisplay
      ? formatEventDate(selected)
      : valueFormat === "display"
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
            "inline-flex h-10 w-full items-center justify-between gap-2 border bg-white text-left text-[13px] font-medium text-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
            variant === "pill"
              ? "rounded-lg border-black px-4 hover:bg-[#FAFAFA]"
              : "rounded-lg border-[#E5E5E5] px-3 hover:border-black/30 focus-visible:ring-black/15",
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
        className="z-[250] w-[min(280px,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-[#E5E5E5] bg-white p-0 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)]"
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
              <SelectTrigger className="h-7 w-[4.5rem] rounded-md border-transparent bg-transparent px-2 text-[12px] font-semibold shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[300] rounded-lg border border-[#E5E5E5] bg-white p-1 dark:border-white/10 dark:bg-zinc-900">
                {MONTHS.map((m, i) => (
                  <SelectItem
                    key={m}
                    value={String(i)}
                    className="rounded-md text-[12px] focus:bg-[#CCFBF1] focus:text-[#0F172A] data-[state=checked]:bg-[#0F766E] data-[state=checked]:text-white dark:focus:bg-[#0F766E]/40 dark:focus:text-white"
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
              <SelectTrigger className="h-7 w-[4.5rem] rounded-md border-transparent bg-transparent px-2 text-[12px] font-semibold shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[300] max-h-56 rounded-lg border border-[#E5E5E5] bg-white p-1 dark:border-white/10 dark:bg-zinc-900">
                {yearOptions.map((y) => (
                  <SelectItem
                    key={y}
                    value={String(y)}
                    className="rounded-md font-mono text-[12px] focus:bg-[#CCFBF1] focus:text-[#0F172A] data-[state=checked]:bg-[#0F766E] data-[state=checked]:text-white dark:focus:bg-[#0F766E]/40 dark:focus:text-white"
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
                        ? "bg-[#0F766E] font-semibold text-white shadow-[0_4px_10px_-6px_rgba(0,0,0,0.35)]"
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

const RECEIPT_TIME_QUICK_PICKS: NonNullable<DatePickerProps["quickPicks"]> = [
  { label: "Today", getDate: (t) => t },
  {
    label: "Yesterday",
    getDate: (t) => new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1),
  },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i);

function parseClock24(value: string): { hour: number; minute: number } {
  const [hh, mm] = (value || "00:00").split(":");
  const hour = Number(hh);
  const minute = Number(mm);
  return {
    hour: Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : 0,
    minute: Number.isFinite(minute) ? Math.min(59, Math.max(0, minute)) : 0,
  };
}

function formatClock24(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function TimeScrollColumn({
  label,
  items,
  value,
  onChange,
  active,
}: {
  label: string;
  items: number[];
  value: number;
  onChange: (next: number) => void;
  active: boolean;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !listRef.current) return;
    const selected = listRef.current.querySelector(`[data-value="${value}"]`);
    selected?.scrollIntoView({ block: "center" });
  }, [active, value]);

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-500">
        {label}
      </div>
      <div
        ref={listRef}
        className="mobile-scrollbar-none h-[11.5rem] overflow-y-auto overscroll-contain rounded-lg border border-[#EEEEEE] bg-[#FAFAFA] py-1 dark:border-white/10 dark:bg-zinc-900/80"
      >
        {items.map((item) => {
          const selected = item === value;
          return (
            <button
              key={item}
              type="button"
              data-value={item}
              onClick={() => onChange(item)}
              className={cn(
                "mx-1 block w-[calc(100%-0.5rem)] rounded-md py-1.5 text-center font-mono text-[13px] tabular-nums transition-colors",
                selected
                  ? "bg-[#0F766E] font-semibold text-white shadow-sm"
                  : "text-black/75 hover:bg-white dark:text-zinc-200 dark:hover:bg-zinc-800",
              )}
            >
              {String(item).padStart(2, "0")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type TimePicker24Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
};

/** 24-hour time picker · HH:mm without native browser UI quirks. */
export function TimePicker24({
  value,
  onChange,
  disabled,
  className,
  align = "end",
}: TimePicker24Props) {
  const [open, setOpen] = useState(false);
  const { hour, minute } = useMemo(() => parseClock24(value), [value]);

  const setHour = (next: number) => onChange(formatClock24(next, minute));
  const setMinute = (next: number) => onChange(formatClock24(hour, next));
  const setNow = () => onChange(toClockLocal(new Date()));

  return (
    <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "inline-flex h-full min-w-[4.75rem] items-center gap-1.5 border-0 bg-transparent px-2.5 font-mono text-[13px] tabular-nums text-black transition-colors hover:bg-[#F4F4F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/30 disabled:cursor-not-allowed dark:text-zinc-100 dark:hover:bg-zinc-800",
            className,
          )}
          aria-label="Receipt time"
        >
          <Clock3 className="h-3.5 w-3.5 shrink-0 text-black/35 dark:text-zinc-500" />
          <span>{formatClock24(hour, minute)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={6}
        collisionPadding={12}
        className="z-[260] w-[min(15rem,calc(100vw-1.5rem))] rounded-xl border border-[#E5E5E5] bg-white p-3 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-zinc-900"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-500">
            Time · 24h
          </span>
          <span className="font-mono text-[14px] font-semibold tabular-nums text-[#0F766E]">
            {formatClock24(hour, minute)}
          </span>
        </div>
        <div className="flex gap-2">
          <TimeScrollColumn
            label="Hour"
            items={HOUR_OPTIONS}
            value={hour}
            onChange={setHour}
            active={open}
          />
          <TimeScrollColumn
            label="Min"
            items={MINUTE_OPTIONS}
            value={minute}
            onChange={setMinute}
            active={open}
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#EEEEEE] pt-3 dark:border-white/10">
          <button
            type="button"
            onClick={setNow}
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#0F766E] transition hover:bg-[#CCFBF1]/50 dark:hover:bg-[#0F766E]/20"
          >
            Now
          </button>
          <Button
            type="button"
            size="sm"
            onClick={() => setOpen(false)}
            className="h-8 rounded-full bg-[#0F766E] px-3 text-white hover:bg-[#0D9488]"
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export type ReceiptDateTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

/** Combined date + time control for fee receipts · stores "Today · 15:03" labels. */
export function ReceiptDateTimePicker({
  value,
  onChange,
  className,
  disabled,
}: ReceiptDateTimePickerProps) {
  const parts = useMemo(() => parseReceiptDateTimeParts(value), [value]);

  const setDate = (iso: string) => {
    onChange(formatReceiptDateTimeFromParts(iso || parts.date, parts.clock));
  };

  const setClock = (clock: string) => {
    onChange(formatReceiptDateTimeFromParts(parts.date, clock || parts.clock));
  };

  const setNow = () => {
    onChange(formatEventDateTime(new Date()));
  };

  return (
    <div
      className={cn(
        "flex h-11 min-w-0 flex-1 items-stretch overflow-hidden rounded-lg border border-[#E5E5E5] bg-white transition focus-within:border-[#0F766E] focus-within:ring-2 focus-within:ring-[#0F766E]/20 dark:border-white/10 dark:bg-zinc-900 dark:focus-within:border-[#0F766E]",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <DatePicker
        value={parts.date}
        onChange={(iso) => setDate(iso || parts.date)}
        valueFormat="iso"
        relativeDisplay
        disabled={disabled}
        placeholder="Date"
        quickPicks={RECEIPT_TIME_QUICK_PICKS}
        className="h-full min-w-0 flex-1 rounded-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-zinc-900"
      />
      <span
        aria-hidden
        className="flex shrink-0 items-center px-0.5 font-mono text-[13px] text-black/25 dark:text-zinc-500"
      >
        ·
      </span>
      <TimePicker24
        value={parts.clock}
        onChange={setClock}
        disabled={disabled}
        className="shrink-0 sm:min-w-[5.25rem]"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={setNow}
        className="hidden shrink-0 border-l border-[#E5E5E5] px-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#0F766E] transition hover:bg-[#CCFBF1]/40 disabled:cursor-not-allowed sm:inline-flex sm:items-center dark:border-white/10 dark:hover:bg-[#0F766E]/15"
        title="Set to current date and time"
      >
        Now
      </button>
    </div>
  );
}

function parseMonthKey(v?: string): { year: number; month: number } | null {
  if (!v) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(v.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!year || month < 1 || month > 12) return null;
  return { year, month };
}

function toMonthKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function formatMonthDisplay(year: number, monthIndex: number) {
  return `${MONTHS[monthIndex]} ${year}`;
}

export type MonthPickerProps = {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  align?: "start" | "center" | "end";
  className?: string;
  disabled?: boolean;
  allowClear?: boolean;
};

export function MonthPicker({
  id,
  value,
  onChange,
  placeholder = "Select month",
  min,
  max,
  align = "start",
  className,
  disabled,
  allowClear = true,
}: MonthPickerProps) {
  const selected = useMemo(() => parseMonthKey(value), [value]);
  const minMonth = useMemo(() => parseMonthKey(min), [min]);
  const maxMonth = useMemo(() => parseMonthKey(max), [max]);
  const today = useMemo(() => {
    const t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() + 1 };
  }, []);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => selected?.year ?? today.year);
  const initialised = useRef(false);

  useEffect(() => {
    if (open && !initialised.current) {
      setViewYear(selected?.year ?? today.year);
      initialised.current = true;
    }
    if (!open) initialised.current = false;
  }, [open, selected, today.year]);

  const yearBounds = useMemo(() => {
    const start = minMonth?.year ?? today.year - 10;
    const end = maxMonth?.year ?? today.year + 10;
    return { start, end };
  }, [minMonth, maxMonth, today.year]);

  const isMonthDisabled = (year: number, monthIndex: number) => {
    const key = monthIndex + 1;
    if (minMonth && (year < minMonth.year || (year === minMonth.year && key < minMonth.month))) {
      return true;
    }
    if (maxMonth && (year > maxMonth.year || (year === maxMonth.year && key > maxMonth.month))) {
      return true;
    }
    return false;
  };

  const commit = (year: number, monthIndex: number) => {
    if (isMonthDisabled(year, monthIndex)) return;
    onChange(toMonthKey(year, monthIndex));
    setOpen(false);
  };

  const displayText = selected
    ? formatMonthDisplay(selected.year, selected.month - 1)
    : null;

  return (
    <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "inline-flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-[#E5E5E5] bg-white px-3 text-left text-[13px] font-medium text-black transition hover:border-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-white/25",
            !selected && "text-black/45 dark:text-zinc-500",
            className,
          )}
        >
          <span className="truncate tracking-tight">{displayText ?? placeholder}</span>
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-black/45 dark:text-zinc-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={6}
        collisionPadding={12}
        sticky="always"
        className="z-[250] w-[min(260px,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-[#E5E5E5] bg-white p-0 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-zinc-900"
      >
        <div className="flex items-center gap-1.5 border-b border-[#EEEEEE] px-2.5 py-2 dark:border-white/10">
          <button
            type="button"
            onClick={() => setViewYear((y) => Math.max(yearBounds.start, y - 1))}
            disabled={viewYear <= yearBounds.start}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-black/55 transition hover:bg-[#F4F4F5] hover:text-black disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-50"
            aria-label="Previous year"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <div className="flex-1 text-center text-[13px] font-semibold tracking-tight text-black dark:text-zinc-50">
            {viewYear}
          </div>
          <button
            type="button"
            onClick={() => setViewYear((y) => Math.min(yearBounds.end, y + 1))}
            disabled={viewYear >= yearBounds.end}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-black/55 transition hover:bg-[#F4F4F5] hover:text-black disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-50"
            aria-label="Next year"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 p-2.5">
          {MONTH_ABBR.map((label, monthIndex) => {
            const isSel =
              !!selected && selected.year === viewYear && selected.month === monthIndex + 1;
            const isCurrent = today.year === viewYear && today.month === monthIndex + 1;
            const off = isMonthDisabled(viewYear, monthIndex);
            return (
              <button
                key={label}
                type="button"
                disabled={off}
                onClick={() => commit(viewYear, monthIndex)}
                aria-pressed={isSel}
                aria-label={`${MONTHS[monthIndex]} ${viewYear}`}
                className={cn(
                  "h-9 rounded-md text-[12px] font-medium transition",
                  isSel
                    ? "bg-[#0F766E] font-semibold text-white shadow-[0_4px_10px_-6px_rgba(0,0,0,0.35)]"
                    : isCurrent
                      ? "ring-1 ring-inset ring-black/50 hover:bg-black/5 dark:ring-zinc-400 dark:hover:bg-white/10"
                      : "text-black/80 hover:bg-[#F4F4F5] dark:text-zinc-200 dark:hover:bg-white/10",
                  off && "cursor-not-allowed text-black/20 hover:bg-transparent dark:text-zinc-600",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-[#EEEEEE] px-2.5 py-2 dark:border-white/10">
          {allowClear ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded-full px-2 py-1 text-[11px] font-semibold text-[#0F766E] transition hover:bg-[#CCFBF1]/50 dark:hover:bg-[#0F766E]/20"
            >
              Clear
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => commit(today.year, today.month - 1)}
            disabled={isMonthDisabled(today.year, today.month - 1)}
            className="rounded-full px-2 py-1 text-[11px] font-semibold text-[#0F766E] transition hover:bg-[#CCFBF1]/50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-[#0F766E]/20"
          >
            This month
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
