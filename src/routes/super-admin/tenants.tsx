import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { TenantsView } from "@/components/admin/TenantsView";

export const Route = createFileRoute("/super-admin/tenants")({
  component: TenantsPage,
});

function TenantsPage() {
  return (
    <TenantsView
      onImpersonate={(name) =>
        toast.warning("Impersonation requires a tenant session", {
          description: `Sign in directly as the ${name} tenant admin from /login.`,
        })
      }
    />
  );
}
