import { apiBaseUrl } from "@/lib/api/client";

/** True when value is an in-browser data URL (not yet uploaded). */
export function isDataUrl(value?: string | null): boolean {
  return typeof value === "string" && value.startsWith("data:");
}

/**
 * Resolve stored photo/logo URLs for <img src>.
 * - data: / blob: / http(s): leave as-is
 * - /uploads/... or /api/media.php?... → prefix production API origin
 */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // Truncated / corrupt data URLs cannot render — treat as missing.
  if (trimmed.startsWith("data:")) {
    if (trimmed.length < 64 || !trimmed.includes(";base64,")) return undefined;
    return trimmed;
  }

  if (
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const base = apiBaseUrl();
  return `${base}${path}`;
}
