import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ApiError, setImpersonationApiToken } from "@/lib/api/client";
import { impersonateSuperAdminTenant } from "@/lib/api/super-admin";
import {
  readPersistentSession,
  writeImpersonationSession,
} from "@/lib/auth";
import {
  ALL_PERMISSIONS,
  firstAllowedTenantPath,
  normalizePermissionSet,
  type PermissionKey,
} from "@/lib/permissions";
import { findTenantUserById } from "@/lib/tenant-store";

type ImpersonateSearch = {
  /** Impersonate a stored workspace user by id (school admin). */
  user?: string;
  /** Or preview an ephemeral permission set (comma-separated keys or "*"). */
  perms?: string;
  name?: string;
  /** Super-admin tenant impersonation (opens in this tab via API). */
  tenant?: string;
};

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/impersonate")({
  validateSearch: (search: Record<string, unknown>): ImpersonateSearch => ({
    user: str(search.user),
    perms: str(search.perms),
    name: str(search.name),
    tenant: str(search.tenant),
  }),
  component: ImpersonatePage,
});

function ImpersonatePage() {
  const { user: userId, perms, name, tenant: tenantId } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const adminSession = readPersistentSession();
      if (
        !adminSession ||
        (adminSession.role !== "school_admin" && adminSession.role !== "super_admin")
      ) {
        setError("Sign in as an admin first, then use Impersonate again.");
        return;
      }

      if (tenantId) {
        if (adminSession.role !== "super_admin") {
          setError("Only platform super admins can impersonate school tenants.");
          return;
        }
        try {
          const data = await impersonateSuperAdminTenant(tenantId);
          if (cancelled) return;
          setImpersonationApiToken(data.token);
          const rawPerms = data.session.permissions;
          const permissions =
            Array.isArray(rawPerms) && rawPerms.includes("*")
              ? ALL_PERMISSIONS
              : Array.isArray(rawPerms)
                ? (rawPerms as PermissionKey[])
                : ALL_PERMISSIONS;
          writeImpersonationSession({
            role:
              data.session.role === "school_admin" ? "school_admin" : "tenant_user",
            email: data.session.email,
            displayName: data.session.displayName,
            tenantName: data.session.tenantName || tenantId,
            tenantId: data.session.tenantId || tenantId,
            issuedAt: Date.now(),
            userId: data.session.userId,
            staffId: data.session.staffId || undefined,
            permissions,
            impersonationSource: "super_admin",
            impersonationTicket: data.ticket,
          });
          window.location.replace("/tenant/dashboard");
        } catch (err) {
          if (cancelled) return;
          const msg =
            err instanceof ApiError ? err.message : "Impersonation failed";
          setError(msg);
        }
        return;
      }

      if (userId) {
        const user = findTenantUserById(userId);
        if (!user) {
          setError("User not found. It may have been deleted.");
          return;
        }
        if (!user.active) {
          setError(
            `${user.displayName} is inactive. Activate the user before impersonating.`,
          );
          return;
        }
        writeImpersonationSession({
          role: "tenant_user",
          email: user.email,
          displayName: user.displayName,
          tenantName: adminSession.tenantName,
          issuedAt: Date.now(),
          userId: user.id,
          staffId: user.staffId,
          permissions: user.permissions,
          impersonationSource: "school_admin",
        });
        window.location.replace(firstAllowedTenantPath(user.permissions));
        return;
      }

      if (perms) {
        const permissions = normalizePermissionSet(perms.split(","));
        if (permissions.length === 0) {
          setError("No valid permissions in the preview link.");
          return;
        }
        writeImpersonationSession({
          role: "tenant_user",
          email: "preview@test",
          displayName: name || "Permission preview",
          tenantName: adminSession.tenantName,
          issuedAt: Date.now(),
          permissions,
          impersonationSource: "school_admin",
        });
        window.location.replace(firstAllowedTenantPath(permissions));
        return;
      }

      setError("Missing tenant or user reference.");
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [userId, perms, name, tenantId]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F4F6F9] px-4">
      <div className="max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6 text-center shadow-sm">
        {error ? (
          <>
            <div className="text-[15px] font-semibold text-black">Cannot impersonate</div>
            <p className="mt-2 text-[13px] leading-relaxed text-black/60">{error}</p>
          </>
        ) : (
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-wider text-slate-500">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#0F766E]/60" />
            Starting impersonation…
          </div>
        )}
      </div>
    </div>
  );
}
