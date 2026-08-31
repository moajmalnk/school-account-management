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
const INSTALLED_KEY = "pwa-app-installed";
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
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
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

function readInstalledFlag() {
  try {
    return localStorage.getItem(INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeInstalledFlag() {
  try {
    localStorage.setItem(INSTALLED_KEY, "1");
    localStorage.removeItem(DISMISS_KEY);
  } catch {
    /* ignore */
  }
}

async function detectRelatedAppsInstalled(): Promise<boolean> {
  try {
    const nav = navigator as Navigator & {
      getInstalledRelatedApps?: () => Promise<unknown[]>;
    };
    if (typeof nav.getInstalledRelatedApps !== "function") return false;
    const apps = await nav.getInstalledRelatedApps();
    return Array.isArray(apps) && apps.length > 0;
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

  const markInstalled = useCallback(() => {
    writeInstalledFlag();
    setDeferred(null);
    setIsInstalled(true);
    setIsStandalone(detectStandalone() || true);
    setIsDismissed(true);
  }, []);

  useEffect(() => {
    const standalone = detectStandalone();
    const storedInstalled = readInstalledFlag();
    setIsIos(detectIos());
    setIsStandalone(standalone);
    setIsDismissed(readDismissed());
    if (standalone || storedInstalled) {
      setIsInstalled(true);
      writeInstalledFlag();
    }

    void detectRelatedAppsInstalled().then((related) => {
      if (related) {
        writeInstalledFlag();
        setIsInstalled(true);
      }
    });

    const onBip = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      // Never revive the prompt if the app is already installed / running standalone.
      if (detectStandalone() || readInstalledFlag()) {
        setDeferred(null);
        setIsInstalled(true);
        return;
      }
      setDeferred(e);
    };
    const onInstalled = () => {
      markInstalled();
    };
    const onDisplayMode = (e: MediaQueryListEvent) => {
      if (e.matches) markInstalled();
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    const mql = window.matchMedia("(display-mode: standalone)");
    mql.addEventListener?.("change", onDisplayMode);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
      mql.removeEventListener?.("change", onDisplayMode);
    };
  }, [markInstalled]);

  const dismissBanner = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setIsDismissed(true);
  }, []);

  const resetDismiss = useCallback(() => {
    // Do not revive prompts after a confirmed install.
    if (readInstalledFlag() || detectStandalone()) return;
    try {
      localStorage.removeItem(DISMISS_KEY);
    } catch {
      /* ignore */
    }
    setIsDismissed(false);
  }, []);

  const install = useCallback(async () => {
    if (detectStandalone() || readInstalledFlag()) {
      markInstalled();
      return "accepted";
    }
    if (detectIos() && !detectStandalone()) return "ios";
    if (!deferred) return "unavailable";
    setInstalling(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      if (choice.outcome === "accepted") {
        markInstalled();
      }
      return choice.outcome;
    } catch {
      return "unavailable";
    } finally {
      setInstalling(false);
    }
  }, [deferred, markInstalled]);

  const installed = isInstalled || isStandalone || readInstalledFlag();
  const canInstall = !installed && (Boolean(deferred) || (isIos && !isStandalone));
  const showBanner = canInstall && !isDismissed;

  const value = useMemo<PwaContextValue>(
    () => ({
      canInstall,
      isInstalled: installed,
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
      installed,
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
