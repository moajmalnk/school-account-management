import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

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

export function MobileTabBar({ items, pathname, className }: MobileTabBarProps) {
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 rounded-t-xl border-t border-slate-100/80 bg-white",
        "dark:border-white/10 dark:bg-[#121214]/95 dark:shadow-[0_-12px_40px_-20px_rgba(0,0,0,0.65)] dark:backdrop-blur-xl",
        "pb-[env(safe-area-inset-bottom)] lg:hidden",
        className,
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex w-full items-stretch justify-around gap-0.5 px-2 pt-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match ? item.match(pathname) : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex min-h-[58px] min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-1.5 text-[11px] font-semibold transition-colors duration-200 sm:min-h-[62px]",
                active
                  ? "font-bold text-black dark:text-[#5EEAD4]"
                  : "font-medium text-slate-400 dark:text-zinc-400",
              )}
            >
              <Icon className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" strokeWidth={active ? 2.5 : 2} />
              <span className="max-w-full truncate text-[11px] sm:text-[12px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const mobileMainPadding =
  "pb-[calc(5.75rem+env(safe-area-inset-bottom))] lg:pb-12";
