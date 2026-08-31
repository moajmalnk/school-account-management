import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";

import { useTenantNavigationGuard } from "@/components/school/settings-unsaved-guard";
import { cn } from "@/lib/utils";

export type MobileTabItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
};

type MobileTabBarProps = {
  items: MobileTabItem[];
  pathname: string;
  className?: string;
};

const TAB_BAR_HEIGHT = 52;

function isTabActive(item: MobileTabItem, pathname: string) {
  return item.match ? item.match(pathname) : pathname.startsWith(item.to);
}

export function MobileTabBar({ items, pathname, className }: MobileTabBarProps) {
  const { onGuardedLinkClick } = useTenantNavigationGuard();
  const reduceMotion = useReducedMotion();

  const activeIndex = useMemo(
    () => items.findIndex((item) => isTabActive(item, pathname)),
    [items, pathname],
  );

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 px-5 lg:hidden",
        "pb-[calc(1rem+env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <nav
        className={cn(
          "pointer-events-auto relative mx-auto w-full max-w-md",
          "overflow-hidden rounded-[26px]",
          "border border-black/[0.05] bg-white/82",
          "shadow-[0_0_0_0.5px_rgba(0,0,0,0.03),0_10px_40px_-12px_rgba(0,0,0,0.22),0_2px_6px_-2px_rgba(0,0,0,0.06)]",
          "backdrop-blur-2xl backdrop-saturate-150",
          "supports-[backdrop-filter]:bg-white/72",
          "before:pointer-events-none before:absolute before:inset-x-4 before:top-0 before:z-10 before:h-px",
          "before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent",
          "dark:border-white/[0.09] dark:bg-[#161618]/86",
          "dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.05),0_12px_44px_-12px_rgba(0,0,0,0.72)]",
          "dark:supports-[backdrop-filter]:bg-[#161618]/74",
          "dark:before:via-white/15",
        )}
        aria-label="Mobile navigation"
        style={{ WebkitBackdropFilter: "blur(24px) saturate(1.5)" }}
      >
        <div
          className="relative flex w-full items-stretch justify-around px-1.5"
          style={{ height: TAB_BAR_HEIGHT }}
          role="tablist"
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            const active = index === activeIndex;
            return (
              <Link
                key={item.to}
                to={item.to}
                role="tab"
                onClick={(event) => onGuardedLinkClick(item.to, event, active)}
                aria-label={item.label}
                aria-selected={active}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center",
                  "touch-manipulation select-none [-webkit-tap-highlight-color:transparent]",
                  "outline-none transition-transform duration-200 ease-out active:scale-[0.92]",
                  "focus-visible:outline-none focus-visible:ring-0",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="mobile-tab-indicator"
                    className="absolute inset-x-1 inset-y-1.5 rounded-[18px] bg-black/[0.055] dark:bg-white/[0.09]"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 520, damping: 38, mass: 0.8 }
                    }
                  />
                ) : null}
                <Icon
                  className={cn(
                    "relative z-10 h-6 w-6 shrink-0",
                    "transition-[color,stroke-width,transform] duration-200 ease-out",
                    active
                      ? "scale-100 text-black dark:text-white"
                      : "scale-[0.96] text-[#737373] dark:text-[#9A9A9A]",
                  )}
                  strokeWidth={active ? 2.25 : 1.75}
                  fill="none"
                  aria-hidden
                />
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export const mobileMainPadding = "pb-[calc(52px+1rem+env(safe-area-inset-bottom))] lg:pb-12";
