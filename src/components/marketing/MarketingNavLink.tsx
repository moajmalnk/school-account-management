import { Link, type useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import type { MarketingNavPath } from "@/lib/seo/marketing-pages-content";
import "@/file-routes";

type NavigateFn = ReturnType<typeof useNavigate>;

/**
 * Navigate to a marketing path. Uses `as never` because routeTree.gen.ts is
 * @ts-nocheck and IDE Link/navigate unions can lag behind new public routes.
 */
export function navigateToMarketingPath(
  navigate: NavigateFn,
  path: MarketingNavPath,
  options?: { replace?: boolean },
): void {
  void navigate({ to: path, replace: options?.replace } as never);
}

/**
 * Typed marketing nav link for MARKETING_NAV paths.
 */
export function MarketingNavLink({
  path,
  className,
  activeProps,
  onClick,
  children,
}: {
  path: MarketingNavPath;
  className?: string;
  activeProps?: { className?: string };
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      to={path as never}
      className={className}
      activeProps={activeProps}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
