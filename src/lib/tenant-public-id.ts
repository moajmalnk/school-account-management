/** Control-plane tenant public IDs — same style as Settings document numbers. */
export const TENANT_PUBLIC_ID_PREFIX = "TN-";
export const TENANT_PUBLIC_ID_PADDING = 6;

/** Digits only from a tenant public id (T-2029 / TN-002029 / "2029"). */
export function tenantPublicIdDigits(id: string): string {
  return String(id || "").replace(/\D/g, "");
}

/**
 * Canonical display / mint form: TN-002029.
 * Legacy T-2029 stays readable as TN-002029 when formatting for UI.
 */
export function formatTenantPublicId(id: string): string {
  const digits = tenantPublicIdDigits(id);
  if (!digits) return String(id || "").trim();
  const n = Number(digits);
  if (!Number.isFinite(n) || n < 1) return String(id || "").trim();
  return `${TENANT_PUBLIC_ID_PREFIX}${String(n).padStart(TENANT_PUBLIC_ID_PADDING, "0")}`;
}

/** Haystack so ID search matches TN-002029, T-2029, 2029, tn-2029, etc. */
export function tenantIdSearchText(id: string, name = "", subdomain = ""): string {
  const raw = String(id || "").trim();
  const digits = tenantPublicIdDigits(raw);
  const padded = digits ? formatTenantPublicId(raw) : "";
  const parts = [
    name,
    subdomain,
    raw,
    padded,
    digits,
    digits ? `T-${digits}` : "",
    digits ? `t-${digits}` : "",
    digits ? `tn-${digits}` : "",
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

export function tenantIdsMatch(a: string, b: string): boolean {
  const da = tenantPublicIdDigits(a);
  const db = tenantPublicIdDigits(b);
  if (da && db) return Number(da) === Number(db);
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}
