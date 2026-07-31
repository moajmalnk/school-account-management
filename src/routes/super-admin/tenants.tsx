import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { TenantsView } from "@/components/admin/TenantsView";
import { impersonateSuperAdminTenant } from "@/lib/api/super-admin";
import { ApiError, backupApiToken, setApiToken } from "@/lib/api/client";
import { writeImpersonationSession } from "@/lib/auth";
import { ALL_PERMISSIONS, type PermissionKey } from "@/lib/permissions";

export const Route = createFileRoute("/super-admin/tenants")({
  component: TenantsPage,
});

function TenantsPage() {
  return (
    <TenantsView
      onImpersonate={(tenant) => {
        void (async () => {
          try {
            const data = await impersonateSuperAdminTenant(tenant.id);
            backupApiToken();
            setApiToken(data.token);
            const rawPerms = data.session.permissions;
            const permissions =
              Array.isArray(rawPerms) && rawPerms.includes("*")
                ? ALL_PERMISSIONS
                : Array.isArray(rawPerms)
                  ? (rawPerms as PermissionKey[])
                  : ALL_PERMISSIONS;
            writeImpersonationSession({
              role:
                data.session.role === "school_admin"
                  ? "school_admin"
                  : "tenant_user",
              email: data.session.email,
              displayName: data.session.displayName,
              tenantName: data.session.tenantName || tenant.name,
              issuedAt: Date.now(),
              userId: data.session.userId,
              staffId: data.session.staffId || undefined,
              permissions,
              impersonationSource: "super_admin",
              impersonationTicket: data.ticket,
            });
            toast.success(`Impersonating ${tenant.name}`, {
              description: `Ticket ${data.ticket} · short-lived session`,
            });
            window.location.href = "/tenant/dashboard";
          } catch (err) {
            const msg =
              err instanceof ApiError ? err.message : "Impersonation failed";
            toast.error("Impersonation failed", { description: msg });
          }
        })();
      }}
    />
  );
}
