import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";

import { FeezoBrand } from "@/components/brand/FeezoBrand";
import { AppDownloadQr } from "@/components/marketing/AppDownloadQr";
import { StoreBadge } from "@/components/marketing/StoreBadge";
import "@/file-routes";
import { pushMarketingEvent } from "@/lib/seo/analytics";
import { applyDocumentSeo, PUBLIC_PAGE_SEO } from "@/lib/seo/public-pages";

export const Route = createFileRoute("/download")({
  component: DownloadRoute,
});

function DownloadRoute() {
  useEffect(() => {
    applyDocumentSeo(PUBLIC_PAGE_SEO.download);
  }, []);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-[#F7FCFA] px-5 py-12">
      <Link to="/" className="mb-8 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/30">
        <FeezoBrand subtitle="Edu Books" markClassName="h-11 w-11" className="text-left" />
      </Link>

      <div className="w-full max-w-sm rounded-[28px] border border-[#EEF2F0] bg-white px-6 py-8 text-center shadow-[0_24px_64px_-24px_rgba(15,50,40,0.22)]">
        <h1 className="text-[22px] font-bold tracking-tight text-[#0B1B33]">Download Feezo</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#64748B]">
          Choose your store — or scan the QR below from another device.
        </p>
        <div className="mt-6 flex w-full flex-col items-stretch gap-3">
          <StoreBadge
            variant="apple"
            reduce={false}
            className="w-full flex-none justify-center"
            onClick={() =>
              pushMarketingEvent("app_download_click", {
                cta_location: "download",
                store: "app_store",
              })
            }
          />
          <StoreBadge
            variant="play"
            reduce={false}
            className="w-full flex-none justify-center"
            onClick={() =>
              pushMarketingEvent("app_download_click", {
                cta_location: "download",
                store: "google_play",
              })
            }
          />
        </div>
      </div>

      <p className="mt-8 text-center text-[13px] text-[#64748B]">
        <Link to="/contact" className="font-semibold text-[#0F766E] underline-offset-2 hover:underline">
          Contact the team
        </Link>
        {" · "}
        <Link
          to="/signup/$step"
          params={{ step: "school" }}
          className="font-semibold text-[#0F766E] underline-offset-2 hover:underline"
        >
          Start 14-day trial
        </Link>
      </p>

      <AppDownloadQr className="!static !mt-10 !right-auto !bottom-auto md:!flex" />
    </div>
  );
}
