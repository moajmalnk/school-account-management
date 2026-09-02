import type { MouseEvent } from "react";

import {
  notifyMarketingSectionChange,
  type MarketingSectionId,
} from "@/hooks/useMarketingActiveSection";
import { router } from "@/router";

/** Read live marketing header height for anchor scroll offset. */
function getMarketingHeaderOffset(): number {
  const header = document.querySelector<HTMLElement>(".marketing-header");
  if (!header) return 88;
  return Math.ceil(header.getBoundingClientRect().height) + 8;
}

function scrollToElement(sectionId: string): boolean {
  const el = document.getElementById(sectionId);
  if (!el) return false;

  const top = el.getBoundingClientRect().top + window.scrollY - getMarketingHeaderOffset();
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
    void import("@/components/marketing/sections/DigitalTransformation");
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
  void import("@/components/marketing/sections/HowItWorks");
  void import("@/components/marketing/sections/Features");
  void import("@/components/marketing/sections/DigitalTransformation");
  void import("@/components/marketing/sections/Testimonials");
  void import("@/components/marketing/sections/Pricing");
}
