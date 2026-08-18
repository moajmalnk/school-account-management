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

function chunkToWords(value: number): string {
  if (value === 0) return "";
  const crore = Math.floor(value / 1_00_00_000);
  const lakh = Math.floor((value % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((value % 1_00_000) / 1_000);
  const rest = value % 1_000;
  const parts: string[] = [];
  if (crore) {
    const croreWords = crore >= 100 ? chunkToWords(crore) : twoDigits(crore);
    parts.push(`${croreWords} crore`);
  }
  if (lakh) parts.push(`${twoDigits(lakh)} lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} thousand`);
  if (rest) parts.push(threeDigits(rest));
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** Convert a rupee amount to Indian English words, e.g. 1000 → "One thousand". */
export function amountToIndianWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  const value = Math.floor(n);
  if (value === 0) return "Zero";
  const words = chunkToWords(value);
  if (!words) return "Zero";
  return words.charAt(0).toUpperCase() + words.slice(1);
}
