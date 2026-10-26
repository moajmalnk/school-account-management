import QRCode from "react-qr-code";

import { appDownloadQrUrl } from "@/lib/app-download";
import { cn } from "@/lib/utils";

/**
 * CheQ-style floating “Scan to download app” QR — fixed bottom-right on marketing pages.
 * Encodes https://www.feezo.app/download which redirects iOS → App Store, Android → Play.
 * Hidden on small screens (already on a phone); shown from md up.
 */
export function AppDownloadQr({ className }: { className?: string }) {
  const url = appDownloadQrUrl();

  return (
    <aside
      aria-label="Scan to download the Feezo app"
      className={cn(
        "pointer-events-auto fixed z-[85] hidden flex-col items-center",
        "bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))]",
        "md:flex",
        className,
      )}
    >
      <div className="flex w-[118px] flex-col items-center rounded-[14px] bg-[#7D9F8C] px-3 pb-3 pt-3.5 shadow-[0_12px_32px_-12px_rgba(20,50,40,0.45)] sm:w-[128px] sm:rounded-2xl sm:px-3.5 sm:pb-3.5 sm:pt-4">
        <p className="mb-2.5 text-center text-[11px] font-medium leading-[1.25] tracking-[-0.01em] text-white sm:text-[12px]">
          Scan to
          <br />
          download app
        </p>
        <div className="rounded-[10px] bg-white p-1.5 sm:rounded-xl sm:p-2">
          <QRCode
            value={url}
            size={96}
            level="M"
            bgColor="#FFFFFF"
            fgColor="#0B1B33"
            title="Feezo app download QR code"
            className="block h-[88px] w-[88px] sm:h-[96px] sm:w-[96px]"
            style={{ height: "auto", width: "100%", maxWidth: "100%" }}
            viewBox="0 0 96 96"
          />
        </div>
      </div>
    </aside>
  );
}
