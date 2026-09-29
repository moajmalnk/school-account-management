import { currencySymbol } from "@/lib/locale/currencies";
import { useMoneyCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Drop-in replacement for a rupee icon — renders the active currency symbol at icon size. */
export function CurrencyGlyph({
  className,
  currency,
  size = 16,
}: {
  className?: string;
  currency?: string;
  size?: number;
}) {
  const active = useMoneyCurrency();
  const symbol = currencySymbol(currency ?? active);
  const scale = symbol.length >= 3 ? 0.5 : symbol.length === 2 ? 0.7 : 1;
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold leading-none",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * scale) }}
    >
      {symbol}
    </span>
  );
}
