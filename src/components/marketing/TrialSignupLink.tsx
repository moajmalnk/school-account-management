import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Marketing CTA → signup (index redirects to /signup/school).
 * Cast keeps the IDE happy when routeTree.gen.ts lags the language service.
 */
export function TrialSignupLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link to={"/signup" as "/"} className={className}>
      {children}
    </Link>
  );
}
