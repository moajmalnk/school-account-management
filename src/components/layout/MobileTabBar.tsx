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
        "fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E5E5] bg-white/95 backdrop-blur-md lg:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        className,
      )}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-0.5 px-1 pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match ? item.match(pathname) : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-medium transition-colors",
                active
                  ? "bg-[#C7F33C] text-black"
                  : "text-black/55 hover:bg-[#F4F4F5] hover:text-black",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 2} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const mobileMainPadding = "pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-12";
