import { useEffect, useRef } from "react";

/**
 * Pins a chat shell between the tenant mobile header and the tab dock, then
 * shrinks with the visual viewport so the composer stays above the keyboard.
 */
export function usePinnedChatFrame(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;

    const mq = window.matchMedia("(max-width: 767.98px)");

    const headerPx = () => {
      const header = document.querySelector<HTMLElement>("[data-tenant-mobile-header]");
      return header ? Math.round(header.getBoundingClientRect().height) : 64;
    };

    const dockPx = () => {
      const dock = document.querySelector<HTMLElement>("[data-mobile-tab-dock]");
      return dock ? Math.round(dock.getBoundingClientRect().height) : 84;
    };

    const clearInline = () => {
      el.style.position = "";
      el.style.top = "";
      el.style.left = "";
      el.style.right = "";
      el.style.bottom = "";
      el.style.height = "";
      el.style.zIndex = "";
    };

    const apply = () => {
      if (!mq.matches) {
        clearInline();
        document.body.style.removeProperty("overflow");
        return;
      }
      document.body.style.overflow = "hidden";
      const vv = window.visualViewport;
      const visTop = vv?.offsetTop ?? 0;
      const visH = vv?.height ?? window.innerHeight;
      const overlapHeader = Math.max(0, headerPx() - visTop);
      const keyboardOpen = window.innerHeight - visH > 80;
      const dock = keyboardOpen ? 0 : dockPx();
      el.style.position = "fixed";
      el.style.left = "0px";
      el.style.right = "0px";
      el.style.bottom = "auto";
      el.style.zIndex = "20";
      el.style.top = `${visTop + overlapHeader}px`;
      el.style.height = `${Math.max(220, visH - overlapHeader - dock)}px`;
    };

    apply();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    window.addEventListener("resize", apply);
    mq.addEventListener("change", apply);
    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
      mq.removeEventListener("change", apply);
      document.body.style.removeProperty("overflow");
      clearInline();
    };
  }, [active]);

  return ref;
}
