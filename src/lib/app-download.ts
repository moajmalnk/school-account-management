import { BRAND } from "@/lib/brand";

export type AppStoreTarget = "ios" | "android" | "unknown";

/** Detect store target from a User-Agent string (browser or QR scanner). */
export function detectAppStoreTarget(ua: string): AppStoreTarget {
  const value = ua.toLowerCase();
  if (/iphone|ipad|ipod/.test(value)) return "ios";
  // iPadOS 13+ may report as Macintosh with touch
  if (/macintosh/.test(value) && /mobile|touch/.test(value)) return "ios";
  if (/android/.test(value)) return "android";
  return "unknown";
}

export function storeUrlForTarget(target: AppStoreTarget): string {
  if (target === "ios") return BRAND.appStoreUrl;
  if (target === "android") return BRAND.playStoreUrl;
  return BRAND.downloadUrl;
}

/** Absolute URL encoded in marketing QR codes (always production). */
export function appDownloadQrUrl(): string {
  return BRAND.downloadUrl;
}
