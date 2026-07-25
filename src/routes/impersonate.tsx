import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  readPersistentSession,
  writeImpersonationSession,
} from "@/lib/auth";
import { firstAllowedTenantPath, normalizePermissionSet } from "@/lib/permissions";
import { findTenantUserById } from "@/lib/tenant-store";

type ImpersonateSearch = {
  /** Impersonate a stored workspace user by id. */
  user?: string;
  /** Or preview an ephemeral permission set (comma-separated keys or "*") without storing a user. */
  perms?: string;
  name?: string;
};

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/impersonate")({
  validateSearch: (search: Record<string, unknown>): ImpersonateSearch => ({
    user: str(search.user),
    perms: str(search.perms),
    name: str(search.name),
  }),
  component: ImpersonatePage,
});

function ImpersonatePage() {
  const { user: userId, perms, name } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const adminSession = readPersistentSession();
    if (
      !adminSession ||
      (adminSession.role !== "school_admin" && adminSession.role !== "super_admin")
    ) {
      setError("Sign in as School Admin first, then use Login as from Settings · Users.");
      return;
    }

    if (userId) {
      const user = findTenantUserById(userId);
      if (!user) {
        setError("User not found. It may have been deleted.");
        return;
      }
      if (!user.active) {
        setError(`${user.displayName} is inactive. Activate the user before impersonating.`);
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
      });
      // Full reload so AuthProvider hydrates with the impersonated session.
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
      });
      window.location.replace(firstAllowedTenantPath(permissions));
      return;
    }

    setError("Missing user reference.");
  }, [userId, perms, name]);

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
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#2563EB]/60" />
            Starting impersonation…
          </div>
        )}
      </div>
    </div>
  );
}
