import { Download, Share, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePwa } from "@/lib/pwa";
import { cn } from "@/lib/utils";

export function PwaInstallBanner() {
  const { showBanner, isIos, installing, install, dismissBanner } = usePwa();
  const [iosOpen, setIosOpen] = useState(false);

  if (!showBanner) return null;

  const onDownload = async () => {
    if (isIos) {
      setIosOpen(true);
      return;
    }
    const result = await install();
    if (result === "accepted") {
      toast.success("App installed", { description: "School Admin is ready on your device" });
      dismissBanner();
    } else if (result === "ios") {
      setIosOpen(true);
    } else if (result === "unavailable") {
      toast.message("Install unavailable", {
        description: "Use your browser menu → Install app / Add to Home Screen",
      });
    }
  };

  return (
    <>
      <div
        role="region"
        aria-label="Install app"
        className={cn(
          "fixed inset-x-0 z-[70] px-3",
          "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] pb-2",
          "md:inset-x-auto md:bottom-5 md:right-5 md:w-[380px] md:px-0 md:pb-0",
        )}
      >
        <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_18px_50px_-20px_rgba(15,118,110,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95">
          <div className="h-1 w-full bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#0F766E]" />
          <div className="flex items-start gap-3 p-3.5 sm:p-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#0F766E]">
              <img src="/icons/icon-192.png" alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
                Download School Admin
              </div>
              <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500 dark:text-zinc-400">
                Install the app for faster launch, home-screen access, and offline shell support.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={installing}
                  onClick={onDownload}
                  className="rounded-full bg-[#0F766E] px-4 text-white hover:bg-[#0D9488]"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {installing ? "Opening…" : "Download app"}
                </Button>
                <button
                  type="button"
                  onClick={dismissBanner}
                  className="rounded-full px-3 py-1.5 text-[12px] font-medium text-slate-500 transition hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              type="button"
              aria-label="Dismiss install prompt"
              onClick={dismissBanner}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <IosInstallDialog open={iosOpen} onOpenChange={setIosOpen} />
    </>
  );
}

export function PwaInstallButton({
  className,
  label = "Download app",
  compact = false,
}: {
  className?: string;
  label?: string;
  compact?: boolean;
}) {
  const { canInstall, isInstalled, isIos, installing, install, resetDismiss } = usePwa();
  const [iosOpen, setIosOpen] = useState(false);

  if (isInstalled) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
          className,
        )}
      >
        Installed on this device
      </div>
    );
  }

  if (!canInstall) return null;

  const onClick = async () => {
    resetDismiss();
    if (isIos) {
      setIosOpen(true);
      return;
    }
    const result = await install();
    if (result === "accepted") {
      toast.success("App installed");
    } else if (result === "ios") {
      setIosOpen(true);
    } else if (result === "unavailable") {
      toast.message("Open your browser menu to Install app");
    }
  };

  return (
    <>
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        disabled={installing}
        onClick={onClick}
        className={cn(
          "rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]",
          className,
        )}
      >
        <Download className={cn("h-3.5 w-3.5", !compact && "mr-1.5")} />
        {!compact && (installing ? "Opening…" : label)}
        {compact && <span className="sr-only">{label}</span>}
      </Button>
      <IosInstallDialog open={iosOpen} onOpenChange={setIosOpen} />
    </>
  );
}

export function PwaInstallCard({ className }: { className?: string }) {
  const { canInstall, isInstalled, isIos, installing, install, resetDismiss } = usePwa();
  const [iosOpen, setIosOpen] = useState(false);

  const onDownload = async () => {
    resetDismiss();
    if (isIos) {
      setIosOpen(true);
      return;
    }
    const result = await install();
    if (result === "accepted") toast.success("App installed");
    else if (result === "ios") setIosOpen(true);
    else if (result === "unavailable") {
      toast.message("Use browser menu → Install app / Add to Home Screen");
    }
  };

  return (
    <>
      <div
        className={cn(
          "rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] p-4 dark:border-white/10 dark:bg-zinc-900/50",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#0F766E]">
            <img src="/icons/icon-192.png" alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-slate-900 dark:text-zinc-50">
              Progressive Web App
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500 dark:text-zinc-400">
              {isInstalled
                ? "You're running the installed app. Updates install automatically when available."
                : "Download School Admin to your device for a native-like experience with offline shell caching."}
            </p>
            <div className="mt-3">
              {isInstalled ? (
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  Installed
                </span>
              ) : canInstall ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={installing}
                  onClick={onDownload}
                  className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {installing ? "Opening…" : "Download app"}
                </Button>
              ) : (
                <p className="text-[12px] text-slate-500 dark:text-zinc-400">
                  Open this site in Chrome or Edge on a supported device to enable one-tap install.
                  On iPhone, use Share → Add to Home Screen.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <IosInstallDialog open={iosOpen} onOpenChange={setIosOpen} />
    </>
  );
}

function IosInstallDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border border-white/60 bg-white/95 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-semibold text-slate-900 dark:text-zinc-50">
            Install on iPhone / iPad
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400">
            Safari doesn’t show a native install prompt. Add School Admin to your Home Screen instead.
          </DialogDescription>
        </DialogHeader>
        <ol className="mt-4 space-y-3 text-[13px] text-slate-700 dark:text-zinc-200">
          <li className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0F766E]/10 text-[11px] font-bold text-[#0F766E]">
              1
            </span>
            <span>
              Tap the <Share className="mx-0.5 inline h-3.5 w-3.5" /> Share button in Safari.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0F766E]/10 text-[11px] font-bold text-[#0F766E]">
              2
            </span>
            <span>Scroll and choose <strong>Add to Home Screen</strong>.</span>
          </li>
          <li className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0F766E]/10 text-[11px] font-bold text-[#0F766E]">
              3
            </span>
            <span>Confirm with <strong>Add</strong> — the app icon appears on your Home Screen.</span>
          </li>
        </ol>
        <Button
          type="button"
          className="mt-5 w-full rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
          onClick={() => onOpenChange(false)}
        >
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
