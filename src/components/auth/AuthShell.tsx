import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { FeezoBrand } from "@/components/brand/FeezoBrand";
import { OrganicCard } from "@/components/ui/organic-card";
import { PwaInstallCard } from "@/components/pwa/PwaInstallBanner";
import { BRAND } from "@/lib/brand";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center overflow-x-hidden bg-[#F4F6F9] px-3 py-[calc(1rem+env(safe-area-inset-top))] sm:px-4 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-5 flex flex-col items-center text-center sm:mb-8">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl border border-white/70 bg-white/80 px-3 py-2.5 shadow-[0_14px_44px_-32px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-opacity hover:opacity-90"
          >
            <FeezoBrand
              subtitle="Unified Control"
              markClassName="h-11 w-11"
              className="text-left"
            />
          </Link>
        </div>

        <OrganicCard tone="white" cornerSide="tr" className="p-6 sm:p-8">
          <h1 className="text-title">{title}</h1>
          <p className="mt-2 text-[14px] text-black/55">{subtitle}</p>
          {children}
        </OrganicCard>

        <div className="mt-4">
          <PwaInstallCard />
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] font-medium text-black/45">
            <a href={BRAND.legal.privacyPath} className="hover:text-black hover:underline">
              Privacy Policy
            </a>
            <span aria-hidden className="text-black/25">
              ·
            </span>
            <a href={BRAND.legal.dataDeletionPath} className="hover:text-black hover:underline">
              Data deletion
            </a>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-black/40">
            {BRAND.name} SaaS · v2.0
          </div>
        </div>
      </div>
    </div>
  );
}
