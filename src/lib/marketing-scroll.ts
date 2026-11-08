import type { MouseEvent } from "react";

import {
  notifyMarketingSectionChange,
  type MarketingSectionId,
} from "@/hooks/useMarketingActiveSection";
import { router } from "@/router";

let cachedHeaderOffset = 88;
let headerOffsetCachedAt = 0;

/** Read marketing header height sparingly — avoid forced reflow on every click. */
function getMarketingHeaderOffset(): number {
  const now = Date.now();
  if (now - headerOffsetCachedAt < 1000) return cachedHeaderOffset;
  const header = document.querySelector<HTMLElement>(".marketing-header");
  if (!header) return cachedHeaderOffset;
  cachedHeaderOffset = Math.ceil(header.offsetHeight) + 8;
  headerOffsetCachedAt = now;
  return cachedHeaderOffset;
}

function scrollToElement(sectionId: string): boolean {
  const el = document.getElementById(sectionId);
  if (!el) return false;

  const top = el.offsetTop - getMarketingHeaderOffset();
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  window.history.replaceState(null, "", `#${sectionId}`);
  notifyMarketingSectionChange(sectionId as MarketingSectionId);
  return true;
}

/** Scroll to a landing-page section; retries while lazy chunks mount. */
export function scrollToMarketingSection(sectionId: string): void {
  if (scrollToElement(sectionId)) return;

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (scrollToElement(sectionId) || attempts >= 40) {
      window.clearInterval(timer);
    }
  }, 100);
}

function isMarketingHomePath(): boolean {
  const path = window.location.pathname;
  return path === "/" || path === "" || path === "/home";
}

export function handleMarketingSectionClick(
  event: MouseEvent<HTMLAnchorElement>,
  sectionId: string,
  onAfterNavigate?: () => void,
): void {
  event.preventDefault();
  document.body.style.overflow = "";
  onAfterNavigate?.();

  if (sectionId === "product") {
    void import("@/components/marketing/sections/DigitalTransformation").catch(() => undefined);
  }

  if (!isMarketingHomePath()) {
    preloadMarketingSections();
    void router.navigate({ to: "/home", hash: sectionId }).then(() => {
      scrollToMarketingSection(sectionId);
    });
    return;
  }

  scrollToMarketingSection(sectionId);
}

/** Warm lazy marketing sections so anchor links resolve quickly. */
export function preloadMarketingSections(): void {
  const warm = (factory: () => Promise<unknown>) => {
    void factory().catch(() => undefined);
  };
  warm(() => import("@/components/marketing/sections/HowItWorks"));
  warm(() => import("@/components/marketing/sections/Features"));
  warm(() => import("@/components/marketing/sections/DigitalTransformation"));
  warm(() => import("@/components/marketing/sections/Testimonials"));
  warm(() => import("@/components/marketing/sections/Pricing"));
}
