/**
 * How fee receipts are laid out for print / download. Stored per device because it
 * depends on the printer and paper loaded at that counter.
 */
export type ReceiptPrintLayout = "a4-portrait" | "a5-duplicate" | "a5-single-right";

export const RECEIPT_PRINT_LAYOUTS: {
  value: ReceiptPrintLayout;
  label: string;
  description: string;
}[] = [
  {
    value: "a4-portrait",
    label: "A4 Portrait",
    description: "One full-page receipt",
  },
  {
    value: "a5-duplicate",
    label: "A5 × 2 · Landscape",
    description: "Office copy + student copy on one A4 sheet",
  },
  {
    value: "a5-single-right",
    label: "A5 Right · Landscape",
    description: "One A5 receipt on the right half of an A4 sheet",
  },
];

const STORAGE_KEY = "feezo/receipt-print-layout";
const DEFAULT_LAYOUT: ReceiptPrintLayout = "a4-portrait";

function isLayout(value: unknown): value is ReceiptPrintLayout {
  return RECEIPT_PRINT_LAYOUTS.some((option) => option.value === value);
}

export function getReceiptPrintLayout(): ReceiptPrintLayout {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLayout(stored) ? stored : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function setReceiptPrintLayout(layout: ReceiptPrintLayout): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, layout);
  } catch {
    /* private mode / storage full */
  }
}
