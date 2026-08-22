import { apiBaseUrl, getApiToken } from "@/lib/api/client";

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

function isCrossOriginUrl(resolved: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URL(resolved, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Fetch tenant media for canvas / crop editors.
 * Public media.php assets must not use credentials — production CORS rejects * with cookies.
 */
export async function fetchMediaBlob(src: string): Promise<Blob> {
  const trimmed = src.trim();
  if (!trimmed) throw new Error("No media URL");
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    throw new Error("Use data/blob URLs directly");
  }

  const resolved = resolveMediaUrl(trimmed) ?? trimmed;
  const headers: Record<string, string> = {};
  const crossOrigin = isCrossOriginUrl(resolved);
  const token = getApiToken();
  const base = apiBaseUrl();

  if (token && !crossOrigin && (resolved.startsWith("/") || resolved.startsWith(base))) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(resolved, {
    credentials: "omit",
    headers,
  });
  if (!res.ok) throw new Error(`Media fetch failed (${res.status})`);
  const blob = await res.blob();
  if (!blob.type.startsWith("image/") && !blob.type.startsWith("audio/")) {
    throw new Error("Unexpected media type");
  }
  return blob;
}
