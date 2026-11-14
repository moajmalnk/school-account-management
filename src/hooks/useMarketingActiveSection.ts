import { useRouterState } from "@tanstack/react-router";

import { MARKETING_NAV, type MarketingNavPath } from "@/lib/seo/marketing-pages-content";

const NAV_PATHS = new Set<string>(MARKETING_NAV.map((item) => item.path));

/** Highlights the current marketing nav item from the active route. */
export function useMarketingActiveSection(): MarketingNavPath | null {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (NAV_PATHS.has(pathname)) return pathname as MarketingNavPath;
  return null;
}
