import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { TenantsView } from "@/components/admin/TenantsView";

export const Route = createFileRoute("/super-admin/tenants")({
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
  return (
    <TenantsView
      onImpersonate={(tenant) => {
        if (tenant.status === "Suspended") {
          toast.error("Cannot open this school", {
            description:
              `${tenant.name} is suspended. Set Lifecycle Status to Active or Trial in Edit Tenant Meta, then try Impersonate again.`,
            duration: 7000,
          });
          return;
        }
        const href = `/impersonate?tenant=${encodeURIComponent(tenant.id)}`;
        const mode = openImpersonateTab(href);
        if (mode === "tab") {
          toast.success(`Opening ${tenant.name}`, {
            description: "New tab · your control-plane session stays here",
          });
        } else {
          toast.message(`Opening ${tenant.name}`, {
            description: "Pop-ups blocked · continuing in this tab",
          });
        }
      }}
    />
  );
}
