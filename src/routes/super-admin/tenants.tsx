import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { TenantsView } from "@/components/admin/TenantsView";

const DETAIL_TABS = [
  "overview",
  "subscriptions",
  "invoices",
  "activity",
  "access",
  "audit",
] as const;

type DetailTab = (typeof DETAIL_TABS)[number];

type TenantsSearch = {
  tenant?: string;
  tab?: DetailTab;
};

function isDetailTab(value: unknown): value is DetailTab {
  return typeof value === "string" && (DETAIL_TABS as readonly string[]).includes(value);
}

export const Route = createFileRoute("/super-admin/tenants")({
  validateSearch: (search: Record<string, unknown>): TenantsSearch => {
    const tenant = typeof search.tenant === "string" ? search.tenant.trim() : "";
    return {
      tenant: tenant && tenant.length <= 64 ? tenant : undefined,
      tab: isDetailTab(search.tab) ? search.tab : undefined,
    };
  },
  component: TenantsPage,
});

/** Open impersonation without relying on popup-window features (Chrome blocks those). */
function openImpersonateTab(href: string): "tab" | "same" {
  // No windowFeatures string — that forces a popup window Chrome often blocks.
  const tab = window.open(href, "_blank");
  if (tab) {
    try {
      tab.opener = null;
    } catch {
      // ignore
    }
    return "tab";
  }

  // Fallback: same tab (always works when pop-ups are disabled).
  window.location.assign(href);
  return "same";
}

function TenantsPage() {
  const { tenant, tab } = Route.useSearch();
  return (
    <TenantsView
      initialTenantId={tenant}
      initialDetailTab={tab}
      onImpersonate={(selected) => {
        if (selected.status === "Suspended") {
          toast.error("Cannot open this school", {
            description: `${selected.name} is deactivated. Open Tenant Details → Access and click Activate workspace, then try Impersonate again.`,
            duration: 7000,
          });
          return;
        }
        const href = `/impersonate?tenant=${encodeURIComponent(selected.id)}`;
        const mode = openImpersonateTab(href);
        if (mode === "tab") {
          toast.success(`Opening ${selected.name}`, {
            description: "New tab · your control-plane session stays here",
          });
        } else {
          toast.message(`Opening ${selected.name}`, {
            description: "Pop-ups blocked · continuing in this tab",
          });
        }
      }}
    />
  );
}
