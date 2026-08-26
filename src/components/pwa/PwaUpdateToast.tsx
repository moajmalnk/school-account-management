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
  isUpdatePromptOnCooldown,
} from "@/lib/app-version";
import { cn } from "@/lib/utils";

/** Gentle poll — enough for deploys, not aggressive enough to blink. */
const UPDATE_CHECK_MS = 60_000;

let swUpdatePollStarted = false;

export function PwaUpdateToast() {
  const [versionOutdated, setVersionOutdated] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);
  const checkingRef = useRef(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
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

      window.setTimeout(check, 8_000);
      window.setInterval(check, UPDATE_CHECK_MS);

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
    },
    onRegisterError(error) {
      console.error("[pwa] registration failed", error);
    },
  });

  const checkRemoteVersion = useCallback(async () => {
    if (!isAppVersionCheckEnabled || checkingRef.current) return;
    if (isUpdatePromptOnCooldown()) return;
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
    if (isUpdatePromptOnCooldown()) return;

    void checkRemoteVersion();
    const id = window.setInterval(() => void checkRemoteVersion(), UPDATE_CHECK_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void checkRemoteVersion();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [checkRemoteVersion]);

  useEffect(() => {
    if (!offlineReady) return;
    toast.success("Ready for offline use");
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  const showBanner =
    !dismissed &&
    !isUpdatePromptOnCooldown() &&
    (needRefresh || versionOutdated);

  const onUpdateNow = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      await hardRefreshApp({
        updateServiceWorker: needRefresh ? updateServiceWorker : undefined,
      });
    } catch (error) {
      console.error("[pwa] update failed", error);
      setUpdating(false);
      toast.error("Could not apply update", {
        description: "Try again, or refresh the page manually.",
      });
    }
  };

  const onLater = () => {
    setDismissed(true);
    setNeedRefresh(false);
    setVersionOutdated(false);
  };

  if (!showBanner) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="App update available"
      className={cn(
        "fixed z-[80] w-full max-w-lg px-3",
        "left-1/2 -translate-x-1/2",
        "bottom-[max(0.75rem,env(safe-area-inset-bottom))]",
        "sm:bottom-5 sm:px-4",
        "md:left-auto md:right-5 md:translate-x-0 md:max-w-[380px] md:px-0",
      )}
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_18px_50px_-20px_rgba(15,118,110,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95">
        <div className="h-1 w-full bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#0F766E]" />
        <div className="flex items-start gap-3 p-3.5 sm:p-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#0F766E]/12 text-[#0F766E]">
            <RefreshCw className={cn("h-5 w-5", updating && "animate-spin")} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
              New version available
            </div>
            <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500 dark:text-zinc-400">
              A fresh update is ready. Reload to get the latest screens and data.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={updating}
                onClick={() => void onUpdateNow()}
                className="min-h-10 flex-1 rounded-full bg-[#0F766E] px-4 text-white hover:bg-[#0D9488] sm:flex-none"
              >
                <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", updating && "animate-spin")} />
                {updating ? "Updating…" : "Update now"}
              </Button>
              <button
                type="button"
                disabled={updating}
                onClick={onLater}
                className="min-h-10 rounded-full px-3 py-1.5 text-[12px] font-medium text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
