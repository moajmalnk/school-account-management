import { getDefaultCurrency } from "@/lib/money";

const ONES = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** Major / minor unit names per currency (singular, plural). */
const UNITS: Record<string, { major: [string, string]; minor: [string, string] }> = {
  INR: { major: ["Rupee", "Rupees"], minor: ["Paisa", "Paise"] },
  USD: { major: ["Dollar", "Dollars"], minor: ["Cent", "Cents"] },
  AUD: { major: ["Australian Dollar", "Australian Dollars"], minor: ["Cent", "Cents"] },
  CAD: { major: ["Canadian Dollar", "Canadian Dollars"], minor: ["Cent", "Cents"] },
  AED: { major: ["Dirham", "Dirhams"], minor: ["Fils", "Fils"] },
  SAR: { major: ["Riyal", "Riyals"], minor: ["Halala", "Halalas"] },
  EUR: { major: ["Euro", "Euros"], minor: ["Cent", "Cents"] },
  GBP: { major: ["Pound", "Pounds"], minor: ["Penny", "Pence"] },
  CHF: { major: ["Franc", "Francs"], minor: ["Centime", "Centimes"] },
};

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return one ? `${TENS[ten]} ${ONES[one]}` : TENS[ten];
}

function threeDigits(n: number): string {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  if (hundred && rest) return `${ONES[hundred]} hundred ${twoDigits(rest)}`;
  if (hundred) return `${ONES[hundred]} hundred`;
  return twoDigits(rest);
}

function indianChunk(value: number): string {
  if (value === 0) return "";
  const crore = Math.floor(value / 1_00_00_000);
  const lakh = Math.floor((value % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((value % 1_00_000) / 1_000);
  const rest = value % 1_000;
  const parts: string[] = [];
  if (crore) {
    const croreWords = crore >= 100 ? indianChunk(crore) : twoDigits(crore);
    parts.push(`${croreWords} crore`);
  }
  if (lakh) parts.push(`${twoDigits(lakh)} lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} thousand`);
  if (rest) parts.push(threeDigits(rest));
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function internationalChunk(value: number): string {
  if (value === 0) return "";
  const scales: Array<[number, string]> = [
    [1e12, "trillion"],
    [1e9, "billion"],
    [1e6, "million"],
    [1e3, "thousand"],
  ];
  const parts: string[] = [];
  let rest = value;
  for (const [size, name] of scales) {
    const count = Math.floor(rest / size);
    if (count) {
      parts.push(`${threeDigits(count)} ${name}`);
      rest %= size;
    }
  }
  if (rest) parts.push(threeDigits(rest));
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function capitalize(words: string): string {
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function titleCase(words: string): string {
  return words.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/** Whole number in words — Indian lakh/crore for INR, million/billion otherwise. */
export function numberToWords(n: number, currency: string = getDefaultCurrency()): string {
  if (!Number.isFinite(n) || n < 0) return "";
  const value = Math.floor(n);
  if (value === 0) return "Zero";
  const words = currency === "INR" ? indianChunk(value) : internationalChunk(value);
  return words ? capitalize(words) : "Zero";
}

/** @deprecated Use numberToWords(n, "INR"). */
export function amountToIndianWords(n: number): string {
  return numberToWords(n, "INR");
}

/**
 * Receipt-style amount in words, e.g. "One Thousand Rupees Only",
 * "Twelve Dirhams and Fifty Fils Only". ASCII-only (safe for jsPDF).
 */
export function amountInWords(amount: number, currency: string = getDefaultCurrency()): string {
  const abs = Math.abs(Number(amount) || 0);
  const major = Math.floor(abs + 1e-9);
  const minor = Math.round((abs - major) * 100);
  const units = UNITS[currency];
  const majorWords = titleCase(numberToWords(major, currency));
  if (!units) {
    const minorPart = minor > 0 ? ` and ${minor}/100` : "";
    return `${currency} ${majorWords}${minorPart} Only`;
  }
  const majorLabel = major === 1 ? units.major[0] : units.major[1];
  if (minor <= 0) return `${majorWords} ${majorLabel} Only`;
  const minorLabel = minor === 1 ? units.minor[0] : units.minor[1];
  return `${majorWords} ${majorLabel} and ${titleCase(numberToWords(minor, currency))} ${minorLabel} Only`;
}
