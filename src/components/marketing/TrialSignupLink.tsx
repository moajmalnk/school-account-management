import { Link } from "@tanstack/react-router";
import type { CSSProperties, ReactNode } from "react";

/**
 * Marketing CTA → signup wizard (school step).
 */
export function TrialSignupLink({
  className,
  style,
  children,
  onClick,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      to="/signup/$step"
      params={{ step: "school" }}
      className={className}
      style={style}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
