import { apiRequest } from "@/lib/api/client";
import type { PlatformInvoice } from "@/lib/api/super-admin";
import { normalizePlanFlags, type PlanFlags } from "@/lib/permissions";

export type SubscriptionPendingCheckout = {
  orderId: string;
  amount: number;
  billingCycle: string;
  invoiceNumber: string;
};

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
  pendingCheckout: SubscriptionPendingCheckout | null;
};

export type SubscriptionCheckout = {
  provider: "cashfree";
  orderId: string;
  paymentSessionId: string;
  amount: number;
  invoiceNumber: string;
  resumed?: boolean;
  paid?: boolean;
};

/** Cashfree return lands on settings with tab + order_id (via /pay-return.html). */
export const SUBSCRIPTION_CHECKOUT_PATH = "/tenant/settings?tab=subscription";

export function startSubscriptionCheckout(cycle: "Monthly" | "Annual") {
  return apiRequest<SubscriptionCheckout>("/api/tenant/subscription-checkout.php", {
    method: "POST",
    body: { action: "order", cycle },
    timeoutMs: 20_000,
  });
}

export function resumeSubscriptionCheckout(orderId: string) {
  return apiRequest<SubscriptionCheckout>("/api/tenant/subscription-checkout.php", {
    method: "POST",
    body: { action: "resume", orderId },
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
  const pending = data.pendingCheckout;
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
    pendingCheckout:
      pending && typeof pending.orderId === "string" && pending.orderId
        ? {
            orderId: pending.orderId,
            amount: Number(pending.amount) || 0,
            billingCycle: pending.billingCycle || "Monthly",
            invoiceNumber: pending.invoiceNumber || "",
          }
        : null,
  };
}
