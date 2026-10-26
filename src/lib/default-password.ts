/** Matches backend `feezo_default_password` — Anita Desai +919700020004 → ani0004 */

export function phoneDigits(phone: string): string {
  let digits = phone.replace(/\D+/g, "");
  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (digits.length > 15) digits = digits.slice(0, 15);
  return digits;
}

export function defaultPassword(displayName: string, phone: string): string {
  const first = displayName.trim().split(/\s+/)[0] ?? "";
  const letters = first.replace(/[^\p{L}]+/gu, "").toLowerCase();
  let prefix = letters.slice(0, 3);
  if (!prefix) prefix = "usr";
  while (prefix.length < 3) prefix += "x";
  const digits = phoneDigits(phone);
  const last4 = digits.length >= 4 ? digits.slice(-4) : digits.padStart(4, "0");
  return `${prefix}${last4}`;
}
