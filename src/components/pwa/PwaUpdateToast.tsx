import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

export function PwaUpdateToast() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl) {
      if (import.meta.env.DEV) console.info("[pwa] registered", swUrl);
    },
    onRegisterError(error) {
      console.error("[pwa] registration failed", error);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    toast.success("Ready for offline use");
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (!needRefresh) return;
    toast("Update available — reload to apply", {
      duration: Infinity,
      action: {
        label: "Reload",
        onClick: () => {
          void updateServiceWorker(true);
        },
      },
      onDismiss: () => setNeedRefresh(false),
    });
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}
