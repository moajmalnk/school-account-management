import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { TenantsView } from "@/components/admin/TenantsView";

export const Route = createFileRoute("/super-admin/tenants")({
  component: TenantsPage,
});

function TenantsPage() {
  return (
    <TenantsView
      onImpersonate={(tenant) => {
        const opened = window.open(
          `/impersonate?tenant=${encodeURIComponent(tenant.id)}`,
          "_blank",
          "noopener",
        );
        if (!opened) {
          toast.error("Pop-up blocked", {
            description: "Allow pop-ups for this site to open Impersonate in a new tab.",
          });
          return;
        }
        toast.success(`Opening ${tenant.name}`, {
          description: "New tab · your control-plane session stays here",
        });
      }}
    />
  );
}
