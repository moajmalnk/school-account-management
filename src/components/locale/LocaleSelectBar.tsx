import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { COUNTRY_LABELS, CURRENCIES, type CurrencyCode } from "@/lib/locale/currencies";
import { useLocale } from "@/lib/locale/LocaleProvider";
import { cn } from "@/lib/utils";

type Variant = "light" | "dark";
type Density = "default" | "compact";

type Option = { value: string; label: string; hint?: string };

const COUNTRY_OPTIONS: Option[] = Object.entries(COUNTRY_LABELS)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

const CURRENCY_OPTIONS: Option[] = CURRENCIES.map((c) => ({
  value: c.code,
  label: `${c.code} · ${c.symbol}`,
  hint: c.label,
}));

function OptionList({
  options,
  selected,
  onSelect,
  variant,
}: {
  options: Option[];
  selected: string;
  onSelect: (value: string) => void;
  variant: Variant;
}) {
  return (
    <ul role="listbox" className="max-h-72 overflow-y-auto py-1">
      {options.map((o) => {
        const active = o.value === selected;
        return (
          <li key={o.value}>
            <button
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => onSelect(o.value)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
                variant === "dark"
                  ? "text-zinc-100 hover:bg-white/10"
                  : "text-zinc-800 hover:bg-zinc-100",
                active &&
                  (variant === "dark" ? "bg-white/10 font-semibold" : "bg-zinc-100 font-semibold"),
              )}
            >
              <span className="min-w-0">
                <span className="block truncate">{o.label}</span>
                {o.hint ? (
                  <span
                    className={cn(
                      "block truncate text-[11px]",
                      variant === "dark" ? "text-zinc-400" : "text-zinc-500",
                    )}
                  >
                    {o.hint}
                  </span>
                ) : null}
              </span>
              {active ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Picker({
  label,
  trigger,
  options,
  selected,
  onSelect,
  variant,
  density,
  side,
  footer,
}: {
  label: string;
  trigger: ReactNode;
  options: Option[];
  selected: string;
  onSelect: (value: string) => void;
  variant: Variant;
  density: Density;
  side: "top" | "bottom";
  footer?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const pick = (value: string) => {
    onSelect(value);
    setOpen(false);
  };

  const pillClass = cn(
    "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
    density === "compact" ? "h-7 px-2.5 text-[11px]" : "h-9 px-3.5 text-[12.5px]",
    variant === "dark"
      ? "border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10"
      : "border-zinc-200 bg-white/80 text-zinc-800 hover:bg-white",
  );

  const button = (
    <button
      type="button"
      aria-label={label}
      aria-haspopup="listbox"
      aria-expanded={open}
      className={pillClass}
    >
      {trigger}
      <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
    </button>
  );

  if (isMobile) {
    return (
      <>
        <span onClick={() => setOpen(true)}>{button}</span>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className={variant === "dark" ? "bg-zinc-900 text-zinc-100" : undefined}>
            <DrawerHeader>
              <DrawerTitle>{label}</DrawerTitle>
            </DrawerHeader>
            <div className="px-3 pb-6">
              <OptionList options={options} selected={selected} onSelect={pick} variant={variant} />
              {footer}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{button}</PopoverTrigger>
      <PopoverContent
        side={side}
        align="start"
        className={cn(
          "w-64 p-1.5",
          variant === "dark" && "border-white/10 bg-zinc-900 text-zinc-100",
        )}
      >
        <OptionList options={options} selected={selected} onSelect={pick} variant={variant} />
        {footer}
      </PopoverContent>
    </Popover>
  );
}

/** Region + currency switcher for public pages (pricing, footer). */
export function LocaleSelectBar({
  variant = "light",
  placement = "bottom",
  density = "default",
  className,
}: {
  variant?: Variant;
  placement?: "top" | "bottom";
  density?: Density;
  className?: string;
}) {
  const { currency, country, countryLabel, isAuto, setCurrency, setCountry, resetToAuto } =
    useLocale();
  const side = placement === "top" ? "top" : "bottom";

  const autoLink = !isAuto ? (
    <button
      type="button"
      onClick={resetToAuto}
      className={cn(
        "mt-1 w-full rounded-lg px-3 py-2 text-left text-[12px] font-semibold underline-offset-2 hover:underline",
        variant === "dark" ? "text-lime-300" : "text-emerald-700",
      )}
    >
      Auto-detect
    </button>
  ) : null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Picker
        label="Region"
        trigger={
          <>
            <Globe2 className="h-3.5 w-3.5 opacity-70" aria-hidden />
            <span className="max-w-[9rem] truncate">{countryLabel}</span>
          </>
        }
        options={COUNTRY_OPTIONS}
        selected={country}
        onSelect={setCountry}
        variant={variant}
        density={density}
        side={side}
        footer={autoLink}
      />
      <Picker
        label="Currency"
        trigger={<span>{currency}</span>}
        options={CURRENCY_OPTIONS}
        selected={currency}
        onSelect={(v) => setCurrency(v as CurrencyCode)}
        variant={variant}
        density={density}
        side={side}
        footer={autoLink}
      />
      {!isAuto ? (
        <button
          type="button"
          onClick={resetToAuto}
          className={cn(
            "text-[11px] font-semibold underline-offset-2 hover:underline",
            variant === "dark" ? "text-zinc-300" : "text-zinc-500",
          )}
        >
          Auto-detect
        </button>
      ) : null}
    </div>
  );
}
