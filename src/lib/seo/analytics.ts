export type MarketingCtaLocation =
  | "header"
  | "hero"
  | "floating"
  | "footer"
  | "form"
  | "download"
  | "why_feezo"
  | "product"
  | "features"
  | "setup"
  | "pricing"
  | "home_section";

export type MarketingEventName =
  | "trial_start"
  | "demo_request"
  | "lead_form_submit"
  | "whatsapp_click"
  | "call_click"
  | "app_download_click";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function pushMarketingEvent(
  event: MarketingEventName,
  params: {
    page_path?: string;
    cta_location: MarketingCtaLocation;
    [key: string]: unknown;
  },
): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    page_path: params.page_path ?? window.location.pathname,
    ...params,
  });
}
