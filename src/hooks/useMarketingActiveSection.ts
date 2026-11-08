import { useEffect, useState } from "react";

import { MARKETING } from "@/lib/marketing-content";

export type MarketingSectionId = (typeof MARKETING.nav)[number]["id"];

const SECTION_IDS = MARKETING.nav.map((item) => item.id);

function readHashSection(): MarketingSectionId | null {
  const hash = window.location.hash.replace(/^#/, "");
  return SECTION_IDS.includes(hash as MarketingSectionId) ? (hash as MarketingSectionId) : null;
}

/** Tracks which landing-page section is active for nav highlighting. */
export function useMarketingActiveSection(): MarketingSectionId | null {
  const [activeSection, setActiveSection] = useState<MarketingSectionId | null>(null);

  useEffect(() => {
    const ratios = new Map<MarketingSectionId, number>();

    const pickActive = () => {
      const fromHash = readHashSection();
      let bestId: MarketingSectionId | null = null;
      let bestRatio = 0;
      for (const id of SECTION_IDS) {
        const ratio = ratios.get(id) ?? 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      }
      setActiveSection(bestId ?? fromHash);
    };

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                const id = entry.target.id as MarketingSectionId;
                if (!SECTION_IDS.includes(id)) continue;
                ratios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
              }
              pickActive();
            },
            {
              // Approximate sticky header without measuring it every scroll.
              rootMargin: "-88px 0px -55% 0px",
              threshold: [0, 0.25, 0.5, 0.75, 1],
            },
          )
        : null;

    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) io?.observe(el);
    }

    const onHash = () => {
      setActiveSection((current) => readHashSection() ?? current);
    };
    const onNavigate = (event: Event) => {
      const sectionId = (event as CustomEvent<MarketingSectionId | undefined>).detail;
      if (sectionId) setActiveSection(sectionId);
    };

    setActiveSection(readHashSection());
    window.addEventListener("hashchange", onHash);
    window.addEventListener("marketing-section-navigate", onNavigate);

    return () => {
      io?.disconnect();
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("marketing-section-navigate", onNavigate);
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
