import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { OrganicCard } from "@/components/ui/organic-card";
import { PwaInstallCard } from "@/components/pwa/PwaInstallBanner";

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
            to="/login"
            className="flex items-center gap-3 rounded-xl border border-white/70 bg-white/80 px-3 py-2.5 shadow-[0_14px_44px_-32px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-opacity hover:opacity-90"
          >
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0F766E] text-base font-bold text-white">
              S
            </div>
            <div className="text-left leading-tight">
              <div className="text-[15px] font-semibold text-black">School Accounts</div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-black/50">
                Unified Control
              </div>
            </div>
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

        <div className="mt-6 text-center font-mono text-[10px] uppercase tracking-wider text-black/40">
          School Accounts SaaS · v2.0
        </div>
      </div>
    </div>
  );
}
