import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";

import {
  getStoredNavPlacement,
  NAV_PLACEMENT_CHANGE_EVENT,
  type ThemeSettings,
} from "@/lib/tenant-store";

type ToasterProps = React.ComponentProps<typeof Sonner>;

function resolveToastPosition(placement: ThemeSettings["navPlacement"]): ToasterProps["position"] {
  return placement === "Bottom" ? "top-right" : "bottom-center";
}

const Toaster = ({ ...props }: ToasterProps) => {
  const [position, setPosition] = useState<ToasterProps["position"]>(() =>
    resolveToastPosition(getStoredNavPlacement()),
  );

  useEffect(() => {
    const sync = (placement?: ThemeSettings["navPlacement"]) => {
      setPosition(resolveToastPosition(placement ?? getStoredNavPlacement()));
    };

    const onPlacement = (event: Event) => {
      const detail = (event as CustomEvent<ThemeSettings["navPlacement"]>).detail;
      sync(detail);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key && !event.key.includes("tenant-store")) return;
      sync();
    };

    window.addEventListener(NAV_PLACEMENT_CHANGE_EVENT, onPlacement);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(NAV_PLACEMENT_CHANGE_EVENT, onPlacement);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <Sonner
      key={position}
      theme="light"
      className="toaster group"
      position={position}
      richColors
      closeButton
      expand
      offset={28}
      gap={12}
      visibleToasts={4}
      duration={4500}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3.5 text-[13px] font-medium text-black shadow-[0_24px_60px_-24px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.04)]",
          title: "text-[13px] font-semibold leading-tight tracking-tight",
          description: "mt-0.5 text-[12px] font-normal leading-snug text-black/55",
          actionButton:
            "group-[.toast]:rounded-full group-[.toast]:bg-black group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:text-[11px] group-[.toast]:font-semibold group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:rounded-full group-[.toast]:border group-[.toast]:border-black/15 group-[.toast]:bg-white group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:text-[11px] group-[.toast]:font-semibold group-[.toast]:text-black",
          closeButton:
            "group-[.toast]:left-auto group-[.toast]:right-2 group-[.toast]:top-2 group-[.toast]:size-6 group-[.toast]:rounded-full group-[.toast]:border-black/10 group-[.toast]:bg-white group-[.toast]:text-black/55 group-[.toast]:opacity-0 group-[.toast]:transition-opacity group-hover/toast:group-[.toast]:opacity-100",
          icon: "shrink-0",
          success: "group-[.toaster]:border-[#10B981]/30",
          error: "group-[.toaster]:border-rose-200/80",
          warning: "group-[.toaster]:border-amber-200/80",
          info: "group-[.toaster]:border-sky-200/80",
        },
      }}
      style={
        {
          "--width": "380px",
          "--border-radius": "16px",
          "--font-family": "Inter, ui-sans-serif, system-ui, sans-serif",
        } as React.CSSProperties
      }
      {...props}
      position={position}
    />
  );
};

export { Toaster };
