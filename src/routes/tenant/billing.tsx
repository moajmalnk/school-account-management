import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { TenantSubscriptionPanel } from "@/components/school/TenantSubscriptionPanel";
import { OrganicCard } from "@/components/ui/organic-card";
import { sessionCanAccessSettings, useAuth } from "@/lib/auth";
import { useTenantStore } from "@/lib/tenant-store";
import { cn, glassCardClass } from "@/lib/utils";

export const Route = createFileRoute("/tenant/billing")({
  component: TenantBillingPage,
});

function TenantBillingPage() {
  const navigate = useNavigate();
  const { session, hydrated } = useAuth();
  const { schoolDetails } = useTenantStore();
  const tenantName = schoolDetails.name || session?.tenantName || "School";

  useEffect(() => {
    if (!hydrated) return;
    if (!sessionCanAccessSettings(session)) {
      navigate({ to: "/tenant/dashboard", replace: true });
    }
  }, [hydrated, session, navigate]);

  if (!hydrated || !sessionCanAccessSettings(session)) {
    return null;
  }

  return (
    <OrganicCard
      tone="white"
      cornerSide="tr"
      padded
      className={cn(glassCardClass, "rounded-2xl")}
    >
      <TenantSubscriptionPanel
        tenantId={session?.tenantId}
        tenantName={tenantName}
        schoolHost={typeof window !== "undefined" ? window.location.hostname : undefined}
      />
    </OrganicCard>
  );
}
