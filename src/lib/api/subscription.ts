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
  renewalAmount?: number | null;
  tenantName?: string;
  planFlags: PlanFlags;
  invoices: PlatformInvoice[];
};

export type SubscriptionCheckout = {
  provider: "cashfree";
  orderId: string;
  paymentSessionId: string;
  amount: number;
  invoiceNumber: string;
};

export function startSubscriptionCheckout(cycle: "Monthly" | "Annual") {
  return apiRequest<SubscriptionCheckout>("/api/tenant/subscription-checkout.php", {
    method: "POST",
    body: { action: "order", cycle },
    timeoutMs: 20_000,
  });
}

export function confirmSubscriptionCheckout(orderId: string) {
  return apiRequest<{ receiptNumber: string; nextDueDate: string; amount: number }>(
    "/api/tenant/subscription-checkout.php",
    { method: "POST", body: { action: "confirm", orderId }, timeoutMs: 20_000 },
  );
}

export function releaseSubscriptionCheckout(orderId: string) {
  return apiRequest<{ released: boolean }>("/api/tenant/subscription-checkout.php", {
    method: "POST",
    body: { action: "release", orderId },
  });
}

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
    renewalAmount:
      data.renewalAmount == null ? null : Number(data.renewalAmount) > 0 ? Number(data.renewalAmount) : null,
    tenantName: data.tenantName,
    planFlags: normalizePlanFlags(data.planFlags),
    invoices: Array.isArray(data.invoices) ? data.invoices : [],
  };
}
