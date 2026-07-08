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
        "fixed inset-x-0 bottom-0 z-40 rounded-t-[1.5rem] border-t border-slate-100/80 bg-white lg:hidden",
        "pb-[env(safe-area-inset-bottom)]",
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
                "relative flex min-h-[54px] min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-1.5 text-[11px] font-semibold transition-colors duration-200",
                active ? "font-bold text-black" : "font-medium text-slate-400",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const mobileMainPadding =
  "pb-[calc(5.75rem+env(safe-area-inset-bottom))] lg:pb-12";
