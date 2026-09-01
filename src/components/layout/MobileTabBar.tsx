import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
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

const TAB_BAR_HEIGHT = 60;

const INDICATOR_SPRING = {
  type: "spring",
  stiffness: 460,
  damping: 34,
  mass: 0.82,
} as const;

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

  const indicatorTransition = reduceMotion ? { duration: 0 } : INDICATOR_SPRING;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 px-5 lg:hidden",
        "pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <nav
        className="mobile-tab-dock pointer-events-auto relative mx-auto w-full max-w-md overflow-hidden rounded-[28px]"
        aria-label="Mobile navigation"
      >
        <LayoutGroup id="mobile-tab-bar">
          <div
            className="relative flex w-full items-stretch justify-around px-2"
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
                    "outline-none focus-visible:outline-none focus-visible:ring-0",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="mobile-tab-indicator"
                      className="mobile-tab-indicator absolute inset-x-0.5 inset-y-1.5 rounded-[20px]"
                      transition={indicatorTransition}
                    />
                  ) : null}

                  <motion.span
                    className="relative z-10 flex flex-col items-center justify-center gap-[3px] pt-0.5"
                    whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.55 }}
                  >
                    <Icon
                      className={cn(
                        "h-[21px] w-[21px] shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        active
                          ? "text-[#0F766E] dark:text-[#5EEAD4]"
                          : "text-[#64748B] dark:text-[#A1A1AA]",
                      )}
                      strokeWidth={active ? 2.1 : 1.75}
                      fill="none"
                      aria-hidden
                    />
                    <span
                      className={cn(
                        "max-w-[4.75rem] truncate text-[10px] leading-none tracking-[0.005em] transition-colors duration-300",
                        active
                          ? "font-semibold text-[#0F172A] dark:text-white"
                          : "font-medium text-[#64748B] dark:text-[#A1A1AA]",
                      )}
                    >
                      {item.label}
                    </span>
                  </motion.span>
                </Link>
              );
            })}
          </div>
        </LayoutGroup>
      </nav>
    </div>
  );
}

export const mobileMainPadding =
  "pb-[calc(60px+0.75rem+env(safe-area-inset-bottom))] lg:pb-12";

/** Fixed position for FABs — sits above the mobile tab dock. */
export const mobileFabClass =
  "fixed right-4 z-40 md:hidden bottom-[calc(60px+1.25rem+env(safe-area-inset-bottom))]";
