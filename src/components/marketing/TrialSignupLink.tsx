import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Marketing CTA to the trial signup route.
 * Cast keeps the IDE happy when routeTree.gen.ts (@ts-nocheck) lags the language service;
 * the runtime path remains `/signup` (registered in routeTree.gen.ts).
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
