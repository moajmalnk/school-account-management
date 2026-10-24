import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { FeezoBrand } from "@/components/brand/FeezoBrand";
import { OrganicCard } from "@/components/ui/organic-card";
import { BRAND } from "@/lib/brand";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center overflow-x-hidden bg-[#F3F5F7] px-4 py-[calc(1.25rem+env(safe-area-inset-top))] sm:py-16">
      <div className="w-full max-w-[400px]">
        <div className="mb-7 flex justify-center sm:mb-9">
          <Link to="/" className="rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#0F766E]/30">
            <FeezoBrand
              subtitle="Unified Control"
              markClassName="h-10 w-10"
              className="text-left"
            />
          </Link>
        </div>

        <OrganicCard tone="white" cornerSide="tr" className="p-7 sm:p-8">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#0B1220] sm:text-[24px]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-black/50">{subtitle}</p>
          ) : null}
          {children}
        </OrganicCard>

        <nav
          aria-label="Legal"
          className="mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11.5px] text-black/40"
        >
          <a href={BRAND.legal.termsPath} className="hover:text-black/70">
            Terms
          </a>
          <span aria-hidden className="text-black/20">
            ·
          </span>
          <a href={BRAND.legal.privacyPath} className="hover:text-black/70">
            Privacy
          </a>
          <span aria-hidden className="text-black/20">
            ·
          </span>
          <a href={BRAND.legal.refundPolicyPath} className="hover:text-black/70">
            Refunds
          </a>
          <span aria-hidden className="text-black/20">
            ·
          </span>
          <a href={BRAND.legal.dataDeletionPath} className="hover:text-black/70">
            Data deletion
          </a>
        </nav>
      </div>
    </div>
  );
}
