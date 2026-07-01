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
        "fixed inset-x-3 bottom-3 z-40 rounded-[2rem] border border-white/70 bg-white/92 shadow-[0_18px_55px_-24px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:hidden",
        "pb-[calc(0.375rem+env(safe-area-inset-bottom))]",
        className,
      )}
      aria-label="Mobile navigation"
    >
      <div className="mobile-app-rail flex items-stretch justify-around gap-1 px-1.5 pt-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match ? item.match(pathname) : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex min-h-[54px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[1.5rem] px-1 text-[10.5px] font-semibold transition-all duration-200",
                active
                  ? "bg-black text-white shadow-[0_10px_24px_-16px_rgba(0,0,0,0.7)]"
                  : "text-black/50 hover:bg-[#F4F4F5] hover:text-black",
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.4 : 2} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const mobileMainPadding = "pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-12";
