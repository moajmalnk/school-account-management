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
const COPIES_KEY = "feezo/receipt-print-copies";
const DEFAULT_LAYOUT: ReceiptPrintLayout = "a4-portrait";

/** How many identical sheets a print job sends. Downloads stay a single file. */
export const RECEIPT_PRINT_COPY_OPTIONS = [1, 2, 3] as const;
export const DEFAULT_RECEIPT_PRINT_COPIES = 1;

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

export function getReceiptPrintCopies(): number {
  if (typeof window === "undefined") return DEFAULT_RECEIPT_PRINT_COPIES;
  try {
    const stored = Number(window.localStorage.getItem(COPIES_KEY));
    return (RECEIPT_PRINT_COPY_OPTIONS as readonly number[]).includes(stored)
      ? stored
      : DEFAULT_RECEIPT_PRINT_COPIES;
  } catch {
    return DEFAULT_RECEIPT_PRINT_COPIES;
  }
}

export function setReceiptPrintCopies(copies: number): void {
  if (typeof window === "undefined") return;
  const next = (RECEIPT_PRINT_COPY_OPTIONS as readonly number[]).includes(copies)
    ? copies
    : DEFAULT_RECEIPT_PRINT_COPIES;
  try {
    window.localStorage.setItem(COPIES_KEY, String(next));
  } catch {
    /* private mode / storage full */
  }
}
