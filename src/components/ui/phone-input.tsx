"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  COUNTRY_LABELS,
  countryDial,
  countryFlag,
  currencyDefaultCountry,
} from "@/lib/locale/currencies";
import { useOrgCurrency } from "@/lib/money";
import { composeE164, nationalPlaceholder, parsePhone, phoneDigits } from "@/lib/phone";
import { cn } from "@/lib/utils";

export type PhoneInputProps = {
  value?: string;
  onChange: (e164: string) => void;
  /** Override org-currency default country (e.g. signup wizard currency). */
  defaultCountry?: string;
  className?: string;
  /** Styles for the national number input only. */
  inputClassName?: string;
  /** Styles for the country dial trigger button. */
  triggerClassName?: string;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  "aria-label"?: string;
};

type CountryOption = { code: string; label: string; dial: string; flag: string };

const COUNTRY_OPTIONS: CountryOption[] = Object.entries(COUNTRY_LABELS)
  .map(([code, label]) => ({
    code,
    label,
    dial: countryDial(code),
    flag: countryFlag(code),
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export function PhoneInput({
  value = "",
  onChange,
  defaultCountry,
  className,
  inputClassName,
  triggerClassName,
  disabled,
  placeholder,
  id,
  name,
  "aria-label": ariaLabel,
}: PhoneInputProps) {
  const orgCurrency = useOrgCurrency();
  const currencyCountry = currencyDefaultCountry(orgCurrency);
  const resolvedDefault = (defaultCountry?.trim().toUpperCase() || currencyCountry).toUpperCase();

  const parsed = useMemo(
    () => parsePhone(value, resolvedDefault),
    [value, resolvedDefault],
  );

  const [country, setCountry] = useState(parsed.country);
  const [national, setNational] = useState(parsed.national);
  const [open, setOpen] = useState(false);
  const manualCountryRef = useRef(false);
  const lastValueRef = useRef(value);

  // Sync from external value (edit forms / reset)
  useEffect(() => {
    if (value === lastValueRef.current) return;
    lastValueRef.current = value;
    const next = parsePhone(value, manualCountryRef.current ? country : resolvedDefault);
    if (!manualCountryRef.current || !value) {
      setCountry(next.country);
    }
    setNational(next.national);
  }, [value, resolvedDefault, country]);

  // When default country changes (currency) and field is empty / not manually overridden
  useEffect(() => {
    if (manualCountryRef.current) return;
    if (phoneDigits(national) || phoneDigits(value)) return;
    setCountry(resolvedDefault);
  }, [resolvedDefault, national, value]);

  const emit = (nextCountry: string, nextNational: string) => {
    const e164 = composeE164(nextCountry, nextNational);
    lastValueRef.current = e164;
    onChange(e164);
  };

  const selected = COUNTRY_OPTIONS.find((o) => o.code === country) ?? {
    code: country,
    label: COUNTRY_LABELS[country] ?? country,
    dial: countryDial(country),
    flag: countryFlag(country),
  };

  return (
    <div className={cn("flex min-w-0 items-stretch gap-1.5", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label="Country dial code"
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm transition-colors",
              "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              triggerClassName,
            )}
          >
            <span className="text-base leading-none" aria-hidden>
              {selected.flag}
            </span>
            <span className="font-mono text-[12px] tabular-nums text-foreground/80">
              +{selected.dial}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country or code…" />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {COUNTRY_OPTIONS.map((o) => (
                  <CommandItem
                    key={o.code}
                    value={`${o.label} ${o.code} +${o.dial}`}
                    onSelect={() => {
                      manualCountryRef.current = true;
                      setCountry(o.code);
                      setOpen(false);
                      emit(o.code, national);
                    }}
                  >
                    <span className="mr-2 text-base leading-none" aria-hidden>
                      {o.flag}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                      +{o.dial}
                    </span>
                    {o.code === country ? <Check className="ml-1 h-3.5 w-3.5 shrink-0" /> : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        disabled={disabled}
        aria-label={ariaLabel ?? "Phone number"}
        placeholder={placeholder ?? nationalPlaceholder(country)}
        value={national}
        onChange={(e) => {
          const next = phoneDigits(e.target.value);
          setNational(next);
          emit(country, next);
        }}
        className={cn("min-w-0 flex-1 font-mono", inputClassName)}
      />
    </div>
  );
}
