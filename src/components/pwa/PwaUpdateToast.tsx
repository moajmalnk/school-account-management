import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  fetchRemoteAppVersion,
  hardRefreshApp,
  isAppVersionCheckEnabled,
  isNewerBuild,
} from "@/lib/app-version";
import { cn } from "@/lib/utils";

/** Poll often — mobile PWAs keep old shells open for a long time. */
const UPDATE_CHECK_MS = 20_000;
/** Auto-apply after this many seconds so "Later" can't leave phones stuck. */
const AUTO_UPDATE_SECONDS = 8;

let swUpdatePollStarted = false;

export function PwaUpdateToast() {
  const [versionOutdated, setVersionOutdated] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const checkingRef = useRef(false);
  const autoStartedRef = useRef(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration || swUpdatePollStarted) return;
      swUpdatePollStarted = true;

      const check = () => {
        void registration.update().catch(() => {
          /* network / offline — ignore */
        });
      };

      window.setTimeout(check, 2_000);
      window.setInterval(check, UPDATE_CHECK_MS);

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
      window.addEventListener("focus", check);
    },
    onRegisterError(error) {
      console.error("[pwa] registration failed", error);
    },
  });

  const checkRemoteVersion = useCallback(async () => {
    if (!isAppVersionCheckEnabled || checkingRef.current) return;
    checkingRef.current = true;
    try {
      const remote = await fetchRemoteAppVersion();
      if (isNewerBuild(remote)) setVersionOutdated(true);
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isAppVersionCheckEnabled) return;

    void checkRemoteVersion();
    const id = window.setInterval(() => void checkRemoteVersion(), UPDATE_CHECK_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void checkRemoteVersion();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [checkRemoteVersion]);

  useEffect(() => {
    if (!offlineReady) return;
    toast.success("Ready for offline use");
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  const showBanner = needRefresh || versionOutdated;

  const onUpdateNow = useCallback(async () => {
    if (updating) return;
    setUpdating(true);
    setCountdown(null);
    try {
      await hardRefreshApp({
        updateServiceWorker: needRefresh ? updateServiceWorker : undefined,
      });
    } catch (error) {
      console.error("[pwa] update failed", error);
      setUpdating(false);
      toast.error("Could not apply update", {
        description: "Try again, or close the app and reopen feezo.app.",
      });
    }
  }, [needRefresh, updateServiceWorker, updating]);

  // Auto hard-refresh shortly after an update is detected (critical for phones).
  useEffect(() => {
    if (!showBanner || updating || autoStartedRef.current) return;
    autoStartedRef.current = true;
    setCountdown(AUTO_UPDATE_SECONDS);

    const tick = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          window.clearInterval(tick);
          void onUpdateNow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [showBanner, updating, onUpdateNow]);

  if (!showBanner) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="App update available"
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:items-center"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_18px_50px_-20px_rgba(15,118,110,0.55)] dark:border-white/10 dark:bg-zinc-950">
        <div className="h-1 w-full bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#0F766E]" />
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#0F766E]/12 text-[#0F766E]">
            <RefreshCw className={cn("h-5 w-5", updating && "animate-spin")} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
              New version available
            </div>
            <p className="mt-1 text-[13px] leading-snug text-slate-500 dark:text-zinc-400">
              Your phone still has an old cached app (wrong student counts). Update now
              to load the latest data — same as on laptop.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                type="button"
                size="sm"
                disabled={updating}
                onClick={() => void onUpdateNow()}
                className="min-h-11 w-full rounded-full bg-[#0F766E] px-4 text-white hover:bg-[#0D9488] sm:w-auto"
              >
                <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", updating && "animate-spin")} />
                {updating
                  ? "Updating…"
                  : countdown !== null && countdown > 0
                    ? `Update now (${countdown})`
                    : "Update now"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
