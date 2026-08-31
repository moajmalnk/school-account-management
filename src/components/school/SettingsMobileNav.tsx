import { ArrowLeft } from "lucide-react";
import { createContext, useContext, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const SettingsMobileNavContext = createContext<(() => void) | null>(null);

export function SettingsMobileNavProvider({
  onBack,
  children,
}: {
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <SettingsMobileNavContext.Provider value={onBack}>{children}</SettingsMobileNavContext.Provider>
  );
}

export function useSettingsMobileBack() {
  return useContext(SettingsMobileNavContext);
}

export function SettingsMobileBackButton({ className }: { className?: string }) {
  const onBack = useSettingsMobileBack();
  if (!onBack) return null;
  return (
    <button
      type="button"
      onClick={onBack}
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full text-black/55 transition-colors hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10 lg:hidden",
        className,
      )}
      aria-label="Back to settings"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}

export function SettingsResponsiveCardHeader({
  title,
  subtitle,
  action,
  titleClassName,
  subtitleClassName,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  titleClassName?: string;
  subtitleClassName?: string;
}) {
  const onBack = useSettingsMobileBack();

  return (
    <>
      {onBack ? (
        <div className="mb-3 flex items-center gap-1 border-b border-[#EFEFEF] pb-2.5 dark:border-white/10 lg:hidden">
          <SettingsMobileBackButton />
          <div className="min-w-0 flex-1 px-1">
            <div
              className={cn(
                "truncate text-[16px] font-semibold text-black dark:text-zinc-100",
                titleClassName,
              )}
            >
              {title}
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn("flex items-start justify-between gap-3", onBack && "hidden lg:flex")}>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "truncate text-[18px] font-bold leading-tight tracking-tight text-slate-900 dark:text-zinc-50",
              titleClassName,
            )}
          >
            {title}
          </div>
          <p
            className={cn("mt-1 text-[12px] text-slate-500 dark:text-zinc-400", subtitleClassName)}
          >
            {subtitle}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {onBack ? (
        <p
          className={cn(
            "mt-1 text-[12px] text-slate-500 lg:hidden dark:text-zinc-400",
            subtitleClassName,
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </>
  );
}
