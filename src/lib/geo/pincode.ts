import { INDIA_STATES, districtsForState } from "@/lib/geo/india-states-districts";

export type PincodeMatch = {
  state: string;
  /** Empty when the postal district has no counterpart in our district list. */
  district: string;
  locality: string;
};

const cache = new Map<string, PincodeMatch | null>();

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z]/g, "");

function matchName(value: string, options: readonly string[]): string {
  const target = norm(value);
  if (!target) return "";
  return (
    options.find((o) => norm(o) === target) ??
    options.find((o) => norm(o).startsWith(target) || target.startsWith(norm(o))) ??
    ""
  );
}

export function isIndianPincode(value: string): boolean {
  return /^[1-9]\d{5}$/.test(value);
}

/**
 * Resolves an Indian PIN code to state / district via India Post's public API.
 * Results are memoised; failures resolve to null so the form stays usable.
 */
export async function lookupIndianPincode(
  pin: string,
  signal?: AbortSignal,
): Promise<PincodeMatch | null> {
  if (!isIndianPincode(pin)) return null;
  if (cache.has(pin)) return cache.get(pin) ?? null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as Array<{
      Status?: string;
      PostOffice?: Array<{ Name?: string; District?: string; State?: string }> | null;
    }>;
    const office = body?.[0]?.Status === "Success" ? body[0].PostOffice?.[0] : undefined;
    if (!office?.State) {
      cache.set(pin, null);
      return null;
    }
    const state = matchName(office.State, INDIA_STATES);
    const match: PincodeMatch | null = state
      ? {
          state,
          district: matchName(office.District ?? "", districtsForState(state)),
          locality: office.Name ?? "",
        }
      : null;
    cache.set(pin, match);
    return match;
  } catch {
    return null;
  }
}
