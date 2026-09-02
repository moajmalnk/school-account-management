import { useEffect, useState } from "react";

import { MARKETING } from "@/lib/marketing-content";

export type MarketingSectionId = (typeof MARKETING.nav)[number]["id"];

const SECTION_IDS = MARKETING.nav.map((item) => item.id);

function getMarketingHeaderOffset(): number {
  const header = document.querySelector<HTMLElement>(".marketing-header");
  if (!header) return 88;
  return Math.ceil(header.getBoundingClientRect().height) + 8;
}

function readHashSection(): MarketingSectionId | null {
  const hash = window.location.hash.replace(/^#/, "");
  return SECTION_IDS.includes(hash as MarketingSectionId) ? (hash as MarketingSectionId) : null;
}

function readScrollSection(): MarketingSectionId | null {
  const offset = getMarketingHeaderOffset() + 32;
  const scrollPos = window.scrollY + offset;

  const sections = SECTION_IDS.map((id) => {
    const el = document.getElementById(id);
    if (!el) return null;
    return {
      id,
      top: el.getBoundingClientRect().top + window.scrollY,
    };
  })
    .filter((section): section is { id: MarketingSectionId; top: number } => section !== null)
    .sort((a, b) => a.top - b.top);

  let current: MarketingSectionId | null = null;
  for (const section of sections) {
    if (section.top <= scrollPos) {
      current = section.id;
    } else {
      break;
    }
  }

  return current;
}

function resolveActiveSection(): MarketingSectionId | null {
  const fromHash = readHashSection();
  const fromScroll = readScrollSection();
  if (fromScroll && fromHash && fromScroll !== fromHash) {
    // Prefer hash while the page is still scrolling to the requested anchor.
    const el = document.getElementById(fromHash);
    if (el) {
      const targetTop = el.getBoundingClientRect().top + window.scrollY;
      const distance = Math.abs(window.scrollY + getMarketingHeaderOffset() - targetTop);
      if (distance > 48) return fromHash;
    }
  }
  return fromScroll ?? fromHash;
}

/** Tracks which landing-page section is active for nav highlighting. */
export function useMarketingActiveSection(): MarketingSectionId | null {
  const [activeSection, setActiveSection] = useState<MarketingSectionId | null>(null);

  useEffect(() => {
    const update = () => {
      setActiveSection(resolveActiveSection());
    };

    const onNavigate = (event: Event) => {
      const sectionId = (event as CustomEvent<MarketingSectionId | undefined>).detail;
      if (sectionId) {
        setActiveSection(sectionId);
        return;
      }
      update();
    };

    update();

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("hashchange", update);
    window.addEventListener("resize", update);
    window.addEventListener("marketing-section-navigate", onNavigate);

    const interval = window.setInterval(update, 400);
    const stop = window.setTimeout(() => window.clearInterval(interval), 10_000);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("hashchange", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("marketing-section-navigate", onNavigate);
      window.clearInterval(interval);
      window.clearTimeout(stop);
    };
  }, []);

  return activeSection;
}

export function notifyMarketingSectionChange(sectionId?: MarketingSectionId): void {
  window.dispatchEvent(
    new CustomEvent<MarketingSectionId | undefined>("marketing-section-navigate", {
      detail: sectionId,
    }),
  );
}
