import { apiRequest } from "@/lib/api/client";
import type { PlatformInvoice } from "@/lib/api/super-admin";
import { normalizePlanFlags, type PlanFlags } from "@/lib/permissions";

export type TenantSubscription = {
  planName: string;
  tier: string;
  status: string;
  monthly: number;
  annually: number;
  currency: string;
  billingCycle: string;
  renewalDate: string | null;
  tenantName?: string;
  planFlags: PlanFlags;
  invoices: PlatformInvoice[];
};

export async function fetchTenantSubscription(): Promise<TenantSubscription> {
  const data = await apiRequest<TenantSubscription>("/api/tenant/subscription.php");
  return {
    planName: data.planName || data.tier || "Basic",
    tier: data.tier || "Basic",
    status: data.status || "Active",
    monthly: Number(data.monthly) || 0,
    annually: Number(data.annually) || 0,
    currency: data.currency || "INR",
    billingCycle: data.billingCycle || "Monthly",
    renewalDate: data.renewalDate || null,
    tenantName: data.tenantName,
    planFlags: normalizePlanFlags(data.planFlags),
    invoices: Array.isArray(data.invoices) ? data.invoices : [],
  };
}
