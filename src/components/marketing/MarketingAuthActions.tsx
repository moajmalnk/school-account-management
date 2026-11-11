import { Link } from "@tanstack/react-router";
import { ArrowRight, LayoutDashboard } from "lucide-react";

import { TrialSignupLink } from "@/components/marketing/TrialSignupLink";
import { homePathForSession, useAuth } from "@/lib/auth";
import { pushMarketingEvent } from "@/lib/seo/analytics";
import { cn } from "@/lib/utils";

const PRIMARY =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--mkt-green)] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--mkt-green-deep)] hover:shadow-lg hover:shadow-[var(--mkt-green)]/20 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mkt-green)]/50 focus-visible:ring-offset-2";

const SECONDARY =
  "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold text-[var(--mkt-ink)] transition-colors hover:text-[var(--mkt-green-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mkt-green)]/50 focus-visible:ring-offset-2";

function initialsOf(name: string | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/**
 * Header CTAs that reflect the visitor's auth state. The cached session renders
 * instantly (no flash); AuthProvider re-validates it with the API in the
 * background and clears it if revoked, and every destination route is still
 * guarded server-side — this only decides which button to show.
 */
export function MarketingAuthActions({
  variant,
  onNavigate,
}: {
  variant: "header" | "sheet";
  onNavigate?: () => void;
}) {
  const { session } = useAuth();

  if (session) {
    const initials = initialsOf(session.displayName);
    const label = session.tenantName || session.displayName;
    return (
      <Link
        to={homePathForSession(session)}
        preload="intent"
        onClick={onNavigate}
        aria-label={label ? `My Account — ${label}` : "My Account"}
        className={cn(
          PRIMARY,
          variant === "header"
            ? "hidden h-10 pl-1.5 pr-4 text-[14px] sm:inline-flex lg:pr-5 lg:text-[15px]"
            : "h-12 w-full rounded-xl text-[15px] shadow-[0_8px_24px_rgba(143,202,74,0.35)]",
        )}
      >
        {variant === "header" ? (
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-md bg-white/20 text-[11px] font-bold tracking-wide"
          >
            {initials || <LayoutDashboard className="h-3.5 w-3.5" />}
          </span>
        ) : (
          <LayoutDashboard className="h-4 w-4" aria-hidden />
        )}
        My Account
        {variant === "sheet" ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
      </Link>
    );
  }

  if (variant === "sheet") {
    return (
      <>
        <TrialSignupLink
          ctaLocation="header"
          className={cn(
            PRIMARY,
            "h-12 w-full rounded-xl text-[15px] shadow-[0_8px_24px_rgba(143,202,74,0.35)]",
          )}
          onClick={onNavigate}
        >
          Start 14-day trial
          <ArrowRight className="h-4 w-4" aria-hidden />
        </TrialSignupLink>
        <Link
          to="/contact"
          preload="intent"
          onClick={() => {
            pushMarketingEvent("demo_request", { cta_location: "header" });
            onNavigate?.();
          }}
          className={cn(
            SECONDARY,
            "mt-3 h-11 w-full rounded-xl border border-[var(--mkt-line)] bg-white text-[14px] hover:border-[var(--mkt-green)]/40",
          )}
        >
          Book a demo
        </Link>
        <Link
          to="/login"
          preload="intent"
          onClick={onNavigate}
          className={cn(SECONDARY, "mt-2 h-10 w-full text-[13px] text-[var(--mkt-muted)]")}
        >
          Sign in
        </Link>
      </>
    );
  }

  return (
    <div className="hidden items-center gap-1 sm:flex sm:gap-2">
      <Link
        to="/contact"
        preload="intent"
        onClick={() => pushMarketingEvent("demo_request", { cta_location: "header" })}
        className={cn(SECONDARY, "h-10 px-3 text-[14px] lg:px-4 lg:text-[15px]")}
      >
        Book a demo
      </Link>
      <TrialSignupLink
        ctaLocation="header"
        className={cn(PRIMARY, "h-10 px-5 text-[14px] lg:px-6 lg:text-[15px]")}
      >
        Start 14-day trial
      </TrialSignupLink>
    </div>
  );
}
