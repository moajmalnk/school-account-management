import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Ban, KeyRound, Loader2, ShieldAlert, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiError, setImpersonationApiToken } from "@/lib/api/client";
import { impersonateSuperAdminTenant } from "@/lib/api/super-admin";
import { readPersistentSession, writeImpersonationSession } from "@/lib/auth";
import {
  ALL_PERMISSIONS,
  firstAllowedTenantPath,
  normalizePermissionSet,
  normalizePlanFlags,
  type PermissionKey,
} from "@/lib/permissions";
import { findTenantUserById } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

type ImpersonateSearch = {
  /** Impersonate a stored workspace user by id (school admin). */
  user?: string;
  /** Or preview an ephemeral permission set (comma-separated keys or "*"). */
  perms?: string;
  name?: string;
  /** Super-admin tenant impersonation (opens in this tab via API). */
  tenant?: string;
};

type ImpersonateErrorInfo = {
  title: string;
  summary: string;
  reasons: string[];
  nextSteps: string[];
  tone: "danger" | "warning" | "info";
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

function interpretError(message: string): ImpersonateErrorInfo {
  const msg = message.trim();
  if (/suspended/i.test(msg)) {
    return {
      title: "This school is suspended",
      summary:
        "Impersonation is blocked while the tenant account is suspended. The school workspace stays locked until an admin reactivates it.",
      reasons: [
        "Suspended schools cannot be opened in preview or support mode.",
        "This usually means billing issues, policy action, or a manual lock.",
      ],
      nextSteps: [
        "Go to Tenants and open Edit Tenant Meta for this school.",
        "Change Lifecycle Status from Suspended to Active or Trial.",
        "Save changes, then click Impersonate again.",
      ],
      tone: "danger",
    };
  }
  if (/overdue/i.test(msg)) {
    return {
      title: "This school is overdue",
      summary:
        "The tenant is marked overdue, so workspace access for support preview may be restricted.",
      reasons: ["Payment or subscription status needs attention before login preview."],
      nextSteps: [
        "Review billing for this tenant.",
        "Set status to Active when cleared, then try Impersonate again.",
      ],
      tone: "warning",
    };
  }
  if (/no active users/i.test(msg)) {
    return {
      title: "No active school admin found",
      summary:
        "This tenant has no active user account to enter as. Impersonation needs at least one active school admin login.",
      reasons: ["The primary admin may be missing, inactive, or not provisioned yet."],
      nextSteps: [
        "Open Edit Tenant Meta and set a Setup Username + Password.",
        "Confirm the school admin can sign in, then try Impersonate again.",
      ],
      tone: "warning",
    };
  }
  if (/not found/i.test(msg)) {
    return {
      title: "Tenant not found",
      summary: "We could not find this school in the registry.",
      reasons: ["The tenant may have been deleted, or the link is outdated."],
      nextSteps: ["Return to Tenants and pick the school from the live list."],
      tone: "info",
    };
  }
  if (/sign in|admin first/i.test(msg)) {
    return {
      title: "Admin sign-in required",
      summary: "Impersonation only works after you are signed in as a platform or school admin.",
      reasons: ["Your session may have expired."],
      nextSteps: ["Sign in again, then retry Impersonate from the Tenants page."],
      tone: "info",
    };
  }
  if (/Only platform super admins/i.test(msg)) {
    return {
      title: "Super admin access required",
      summary: "Only platform super admins can open another school’s workspace.",
      reasons: ["Your current role does not include tenant impersonation."],
      nextSteps: ["Ask a platform super admin to run Impersonate, or use your own school login."],
      tone: "warning",
    };
  }
  if (/inactive/i.test(msg)) {
    return {
      title: "User is inactive",
      summary: msg,
      reasons: ["Inactive users cannot be used for impersonation previews."],
      nextSteps: ["Activate the user in Settings → Users, then try again."],
      tone: "warning",
    };
  }
  return {
    title: "Impersonation could not start",
    summary: msg || "Something went wrong while opening the school workspace.",
    reasons: ["The request was blocked or failed before a session could be created."],
    nextSteps: [
      "Return to Tenants and try again.",
      "If it keeps failing, check the tenant status and admin login credentials.",
    ],
    tone: "danger",
  };
}

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
            role: data.session.role === "school_admin" ? "school_admin" : "tenant_user",
            email: data.session.email,
            displayName: data.session.displayName,
            tenantName: data.session.tenantName || tenantId,
            tenantId: data.session.tenantId || tenantId,
            issuedAt: Date.now(),
            userId: data.session.userId,
            staffId: data.session.staffId || undefined,
            permissions,
            tier: data.session.tier,
            planName: data.session.planName,
            planFlags: data.session.planFlags
              ? normalizePlanFlags(data.session.planFlags)
              : undefined,
            impersonationSource: "super_admin",
            impersonationTicket: data.ticket,
          });
          window.location.replace("/tenant/dashboard");
        } catch (err) {
          if (cancelled) return;
          const msg = err instanceof ApiError ? err.message : "Impersonation failed";
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

  const info = useMemo(() => (error ? interpretError(error) : null), [error]);

  const Icon =
    info?.tone === "danger" ? Ban : info?.tone === "warning" ? ShieldAlert : AlertTriangle;

  const iconWrap =
    info?.tone === "danger"
      ? "bg-[#FEF2F2] text-[#EF4444]"
      : info?.tone === "warning"
        ? "bg-[#FFF7ED] text-[#C2410C]"
        : "bg-[#F4F4F5] text-black/70";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F4F6F9] px-4 py-10">
      {info ? (
        <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)]">
          <div className="border-b border-[#E5E5E5] bg-[#FAFAFA] px-6 py-5">
            <div className="flex items-start gap-3">
              <div
                className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", iconWrap)}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  Impersonation blocked
                </div>
                <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-black">
                  {info.title}
                </h1>
                {tenantId ? (
                  <p className="mt-1 font-mono text-[11px] text-black/50">Tenant · {tenantId}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-5 px-6 py-5">
            <p className="text-[14px] leading-relaxed text-black/70">{info.summary}</p>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                Why this happened
              </div>
              <ul className="mt-2 space-y-2">
                {info.reasons.map((reason) => (
                  <li
                    key={reason}
                    className="flex gap-2 rounded-xl border border-[#EFEFEF] bg-[#Fafafa] px-3 py-2.5 text-[13px] leading-snug text-black/70"
                  >
                    <UserX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-black/35" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                What to do next
              </div>
              <ol className="mt-2 space-y-2">
                {info.nextSteps.map((step, i) => (
                  <li
                    key={step}
                    className="flex gap-3 rounded-xl border border-[#E5E5E5] bg-white px-3 py-2.5 text-[13px] leading-snug text-black/80"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-black text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-[#E5E5E5] bg-[#FAFAFA] px-6 py-4 sm:flex-row sm:justify-end">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/super-admin/tenants">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Tenants
              </Link>
            </Button>
            <Button asChild className="rounded-full bg-black text-white hover:bg-black/85">
              <Link to="/super-admin/tenants">
                <KeyRound className="h-3.5 w-3.5" />
                Fix status & retry
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex max-w-sm items-center justify-center gap-3 rounded-2xl border border-[#E5E5E5] bg-white px-6 py-5 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-[#0F766E]" />
          <div>
            <div className="text-[14px] font-semibold text-black">Opening school workspace</div>
            <div className="mt-0.5 text-[12px] text-black/55">
              Creating a secure impersonation session…
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
