import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { FeezoBrand } from "@/components/brand/FeezoBrand";
import { StoreBadge } from "@/components/marketing/StoreBadge";
import "@/file-routes";
import { detectAppStoreTarget } from "@/lib/app-download";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/download")({
  component: DownloadRoute,
});

function DownloadRoute() {
  const [target] = useState(() =>
    typeof navigator === "undefined" ? "unknown" : detectAppStoreTarget(navigator.userAgent),
  );
  const storeUrl = useMemo(() => {
    if (target === "ios") return BRAND.appStoreUrl;
    if (target === "android") return BRAND.playStoreUrl;
    return null;
  }, [target]);
  const [redirecting, setRedirecting] = useState(Boolean(storeUrl));

  useEffect(() => {
    if (!storeUrl) return;
    const t = window.setTimeout(() => {
      window.location.replace(storeUrl);
    }, 80);
    return () => window.clearTimeout(t);
  }, [storeUrl]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#F7FCFA] px-5 py-12">
      <Link to="/home" className="mb-8 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/30">
        <FeezoBrand subtitle="Edu Books" markClassName="h-11 w-11" className="text-left" />
      </Link>

      <div className="w-full max-w-sm rounded-[28px] border border-[#EEF2F0] bg-white px-6 py-8 text-center shadow-[0_24px_64px_-24px_rgba(15,50,40,0.22)]">
        {redirecting && storeUrl ? (
          <>
            <h1 className="text-[22px] font-bold tracking-tight text-[#0B1B33]">Opening the store…</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-[#64748B]">
              {target === "ios"
                ? "Taking you to the App Store for Feezo."
                : "Taking you to Google Play for Feezo."}
            </p>
            <a
              href={storeUrl}
              className="mt-5 inline-flex text-[14px] font-semibold text-[#0F766E] underline-offset-2 hover:underline"
            >
              Tap here if nothing happens
            </a>
            <button
              type="button"
              className="mt-4 block w-full text-[12.5px] text-[#94A3B8] hover:text-[#64748B]"
              onClick={() => setRedirecting(false)}
            >
              Stay on this page
            </button>
          </>
        ) : (
          <>
            <h1 className="text-[22px] font-bold tracking-tight text-[#0B1B33]">Download Feezo</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-[#64748B]">
              Choose your store — or scan the QR on feezo.app from your phone.
            </p>
            <div className="mt-6 flex w-full flex-col items-stretch gap-3">
              <StoreBadge variant="apple" reduce={false} className="w-full flex-none justify-center" />
              <StoreBadge variant="play" reduce={false} className="w-full flex-none justify-center" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
