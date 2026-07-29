import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";

import {
  getStoredNavPlacement,
  NAV_PLACEMENT_CHANGE_EVENT,
  peekStoredThemeMode,
  type ThemeSettings,
} from "@/lib/tenant-store";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const DESKTOP_MQ = "(min-width: 768px)";

function isDesktopViewport(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia(DESKTOP_MQ).matches;
}

/**
 * Desktop: always bottom-center.
 * Mobile + bottom dock: top-right so toasts clear the tab bar.
 */
function resolveToastPosition(
  placement: ThemeSettings["navPlacement"],
  desktop = isDesktopViewport(),
): ToasterProps["position"] {
  if (desktop) return "bottom-center";
  return placement === "Bottom" ? "top-right" : "bottom-center";
}

function resolveToastOffset(
  placement: ThemeSettings["navPlacement"],
  position: ToasterProps["position"],
  desktop = isDesktopViewport(),
): number {
  // Clear the floating Mac dock / mobile tab bar when toast sits at the bottom.
  if (position === "bottom-center" && (placement === "Bottom" || desktop)) {
    return desktop ? 96 : 88;
  }
  return 28;
}

function resolveToastTheme(): NonNullable<ToasterProps["theme"]> {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
    return "dark";
  }
  return peekStoredThemeMode() === "Dark" ? "dark" : "light";
}

const Toaster = ({ ...props }: ToasterProps) => {
  const [placement, setPlacement] = useState<ThemeSettings["navPlacement"]>(() =>
    getStoredNavPlacement(),
  );
  const [desktop, setDesktop] = useState(() => isDesktopViewport());
  const position = resolveToastPosition(placement, desktop);
  const offset = resolveToastOffset(placement, position, desktop);
  const [theme, setTheme] = useState<NonNullable<ToasterProps["theme"]>>(() => resolveToastTheme());

  useEffect(() => {
    const syncPlacement = (next?: ThemeSettings["navPlacement"]) => {
      setPlacement(next ?? getStoredNavPlacement());
    };

    const syncTheme = () => setTheme(resolveToastTheme());

    const onPlacement = (event: Event) => {
      const detail = (event as CustomEvent<ThemeSettings["navPlacement"]>).detail;
      syncPlacement(detail);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key && !event.key.includes("tenant-store")) return;
      syncPlacement();
      syncTheme();
    };

    const mq = window.matchMedia(DESKTOP_MQ);
    const onMq = () => setDesktop(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);

    const root = document.documentElement;
    const observer = new MutationObserver(() => syncTheme());
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener(NAV_PLACEMENT_CHANGE_EVENT, onPlacement);
    window.addEventListener("storage", onStorage);
    syncTheme();

    return () => {
      observer.disconnect();
      mq.removeEventListener("change", onMq);
      window.removeEventListener(NAV_PLACEMENT_CHANGE_EVENT, onPlacement);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <Sonner
      className="toaster group"
      richColors
      closeButton
      expand
      offset={offset}
      gap={12}
      visibleToasts={4}
      duration={4500}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3.5 text-[13px] font-medium text-black shadow-[0_24px_60px_-24px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)]",
          title: "text-[13px] font-semibold leading-tight tracking-tight text-black dark:text-zinc-50",
          description: "mt-0.5 text-[12px] font-normal leading-snug text-black/55 dark:text-zinc-400",
          actionButton:
            "group-[.toast]:rounded-full group-[.toast]:bg-black group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:text-[11px] group-[.toast]:font-semibold group-[.toast]:text-white dark:group-[.toast]:bg-[#0F766E]",
          cancelButton:
            "group-[.toast]:rounded-full group-[.toast]:border group-[.toast]:border-black/15 group-[.toast]:bg-white group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:text-[11px] group-[.toast]:font-semibold group-[.toast]:text-black dark:group-[.toast]:border-white/15 dark:group-[.toast]:bg-zinc-800 dark:group-[.toast]:text-zinc-100",
          closeButton:
            "group-[.toast]:left-auto group-[.toast]:right-2 group-[.toast]:top-2 group-[.toast]:size-6 group-[.toast]:rounded-full group-[.toast]:border-black/10 group-[.toast]:bg-white group-[.toast]:text-black/55 group-[.toast]:opacity-0 group-[.toast]:transition-opacity group-hover/toast:group-[.toast]:opacity-100 dark:group-[.toast]:border-white/15 dark:group-[.toast]:bg-zinc-800 dark:group-[.toast]:text-zinc-300",
          icon: "shrink-0",
          success:
            "group-[.toaster]:border-[#10B981]/30 dark:group-[.toaster]:!border-emerald-500/35 dark:group-[.toaster]:!bg-zinc-900 dark:group-[.toaster]:!text-zinc-50",
          error:
            "group-[.toaster]:border-rose-200/80 dark:group-[.toaster]:!border-rose-500/40 dark:group-[.toaster]:!bg-zinc-900 dark:group-[.toaster]:!text-zinc-50",
          warning:
            "group-[.toaster]:border-amber-200/80 dark:group-[.toaster]:!border-amber-500/35 dark:group-[.toaster]:!bg-zinc-900 dark:group-[.toaster]:!text-zinc-50",
          info: "group-[.toaster]:border-sky-200/80 dark:group-[.toaster]:!border-sky-500/35 dark:group-[.toaster]:!bg-zinc-900 dark:group-[.toaster]:!text-zinc-50",
        },
      }}
      style={
        {
          "--width": "380px",
          "--border-radius": "16px",
          "--font-family": "Inter, ui-sans-serif, system-ui, sans-serif",
          ...(theme === "dark"
            ? {
                "--normal-bg": "#18181b",
                "--normal-border": "rgba(255,255,255,0.1)",
                "--normal-text": "#fafafa",
                "--success-bg": "#18181b",
                "--success-border": "rgba(16,185,129,0.35)",
                "--success-text": "#fafafa",
                "--error-bg": "#18181b",
                "--error-border": "rgba(244,63,94,0.4)",
                "--error-text": "#fafafa",
                "--warning-bg": "#18181b",
                "--warning-border": "rgba(245,158,11,0.35)",
                "--warning-text": "#fafafa",
                "--info-bg": "#18181b",
                "--info-border": "rgba(14,165,233,0.35)",
                "--info-text": "#fafafa",
              }
            : {}),
        } as React.CSSProperties
      }
      {...props}
      theme={theme}
      position={position}
    />
  );
};

export { Toaster };
