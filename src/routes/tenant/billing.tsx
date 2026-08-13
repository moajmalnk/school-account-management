import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { PlatformInvoicesPanel } from "@/components/admin/PlatformInvoicesPanel";
import { OrganicCard } from "@/components/ui/organic-card";
import { sessionCanAccessSettingsTab, useAuth } from "@/lib/auth";
import { resolveMediaUrl } from "@/lib/media";
import { schoolInitials, useTenantStore } from "@/lib/tenant-store";
import { cn, glassCardClass } from "@/lib/utils";

export const Route = createFileRoute("/tenant/billing")({
  component: TenantBillingPage,
});

function TenantBillingPage() {
  const navigate = useNavigate();
  const { session, hydrated } = useAuth();
  const { schoolDetails } = useTenantStore();
  const tenantName = schoolDetails.name || session?.tenantName || "School";
  const logoUrl = resolveMediaUrl(schoolDetails.logoUrl);

  useEffect(() => {
    if (!hydrated) return;
    if (!sessionCanAccessSettingsTab(session, "billing")) {
      navigate({ to: "/tenant/dashboard", replace: true });
    }
  }, [hydrated, session, navigate]);

  if (!hydrated || !sessionCanAccessSettingsTab(session, "billing")) {
    return null;
  }

  return (
    <OrganicCard
      tone="white"
      cornerSide="tr"
      padded
      className={cn(glassCardClass, "rounded-2xl")}
    >
      <div className="mb-4 flex items-start gap-3">
        <div
          className={
            logoUrl
              ? "grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl"
              : "grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#0F766E] to-[#115E59] text-[11px] font-bold text-white"
          }
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={tenantName}
              className="h-full w-full object-cover"
            />
          ) : (
            schoolInitials(tenantName)
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[17px] font-bold tracking-tight text-black dark:text-zinc-50">
            Platform billing
          </div>
          <p className="mt-1 text-[12px] text-black/55 dark:text-zinc-400">
            Subscription invoices and payment receipts for {tenantName}
            {session?.tier ? ` · ${session.tier} plan` : ""}
          </p>
        </div>
      </div>
      <PlatformInvoicesPanel
        mode="tenant"
        tenantId={session?.tenantId}
        tenantName={tenantName}
        schoolHost={typeof window !== "undefined" ? window.location.hostname : undefined}
      />
    </OrganicCard>
  );
}
