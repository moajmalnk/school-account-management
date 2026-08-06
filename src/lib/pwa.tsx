import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type PwaContextValue = {
  canInstall: boolean;
  isInstalled: boolean;
  isIos: boolean;
  isStandalone: boolean;
  isDismissed: boolean;
  showBanner: boolean;
  installing: boolean;
  install: () => Promise<"accepted" | "dismissed" | "unavailable" | "ios">;
  dismissBanner: () => void;
  resetDismiss: () => void;
};

const PwaContext = createContext<PwaContextValue | null>(null);

function detectIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return iOS && !(window as Window & { MSStream?: unknown }).MSStream;
}

function detectStandalone() {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  const twa = document.referrer.startsWith("android-app://");
  return media || iosStandalone || twa;
}

function readDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setIsIos(detectIos());
    setIsStandalone(detectStandalone());
    setIsDismissed(readDismissed());

    const onBip = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferred(e);
      setIsInstalled(false);
    };
    const onInstalled = () => {
      setDeferred(null);
      setIsInstalled(true);
      setIsStandalone(true);
    };
    const onDisplayMode = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true);
        setIsInstalled(true);
      }
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    const mql = window.matchMedia("(display-mode: standalone)");
    mql.addEventListener?.("change", onDisplayMode);

    if (detectStandalone()) setIsInstalled(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
      mql.removeEventListener?.("change", onDisplayMode);
    };
  }, []);

  const dismissBanner = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setIsDismissed(true);
  }, []);

  const resetDismiss = useCallback(() => {
    try {
      localStorage.removeItem(DISMISS_KEY);
    } catch {
      /* ignore */
    }
    setIsDismissed(false);
  }, []);

  const install = useCallback(async () => {
    if (detectIos() && !detectStandalone()) return "ios";
    if (!deferred) return "unavailable";
    setInstalling(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setIsStandalone(true);
      }
      return choice.outcome;
    } catch {
      return "unavailable";
    } finally {
      setInstalling(false);
    }
  }, [deferred]);

  const canInstall = Boolean(deferred) || (isIos && !isStandalone && !isInstalled);
  const showBanner = canInstall && !isStandalone && !isDismissed;

  const value = useMemo<PwaContextValue>(
    () => ({
      canInstall,
      isInstalled: isInstalled || isStandalone,
      isIos,
      isStandalone,
      isDismissed,
      showBanner,
      installing,
      install,
      dismissBanner,
      resetDismiss,
    }),
    [
      canInstall,
      isInstalled,
      isStandalone,
      isIos,
      isDismissed,
      showBanner,
      installing,
      install,
      dismissBanner,
      resetDismiss,
    ],
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const ctx = useContext(PwaContext);
  if (!ctx) throw new Error("usePwa must be used within PwaProvider");
  return ctx;
}
