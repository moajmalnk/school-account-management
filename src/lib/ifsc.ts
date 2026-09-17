/** Indian IFSC lookup via Razorpay's public IFSC API. */

export type IfscDetails = {
  ifsc: string;
  bankName: string;
  branch: string;
  address: string;
  city: string;
  state: string;
  micr: string | null;
};

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function normalizeIfsc(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function isValidIfsc(raw: string): boolean {
  return IFSC_RE.test(normalizeIfsc(raw));
}

export async function fetchIfscDetails(raw: string): Promise<IfscDetails> {
  const ifsc = normalizeIfsc(raw);
  if (!isValidIfsc(ifsc)) {
    throw new Error("Enter a valid 11-character IFSC (e.g. HDFC0001234)");
  }

  const res = await fetch(`https://ifsc.razorpay.com/${encodeURIComponent(ifsc)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (res.status === 404) {
    throw new Error("IFSC not found — check the code and try again");
  }
  if (!res.ok) {
    throw new Error("Could not look up IFSC right now");
  }

  const data = (await res.json()) as Record<string, unknown>;
  const bankName = String(data.BANK ?? data.BANKNAME ?? "").trim();
  if (!bankName) {
    throw new Error("IFSC lookup returned no bank name");
  }

  return {
    ifsc: String(data.IFSC ?? ifsc).trim().toUpperCase(),
    bankName,
    branch: String(data.BRANCH ?? "").trim(),
    address: String(data.ADDRESS ?? "").trim(),
    city: String(data.CITY ?? data.DISTRICT ?? "").trim(),
    state: String(data.STATE ?? "").trim(),
    micr: data.MICR ? String(data.MICR).trim() : null,
  };
}
