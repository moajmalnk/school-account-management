import { Link } from "@tanstack/react-router";
import type { CSSProperties, ReactNode } from "react";

import {
  pushMarketingEvent,
  type MarketingCtaLocation,
} from "@/lib/seo/analytics";

/**
 * Marketing CTA → signup wizard (school step).
 */
export function TrialSignupLink({
  className,
  style,
  children,
  onClick,
  ctaLocation = "header",
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  onClick?: () => void;
  ctaLocation?: MarketingCtaLocation;
}) {
  return (
    <Link
      to="/signup/$step"
      params={{ step: "school" }}
      className={className}
      style={style}
      onClick={() => {
        pushMarketingEvent("trial_start", { cta_location: ctaLocation });
        onClick?.();
      }}
    >
      {children}
    </Link>
  );
}
