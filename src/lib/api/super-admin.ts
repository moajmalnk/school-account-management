import { apiRequest } from "@/lib/api/client";
import type { Status, Tenant, Tier } from "@/components/admin/data";

export type SuperAdminOverview = {
  totalActiveSchools: number;
  trialTenants?: number;
  mrr: number;
  arr: number;
  systemUptime: number;
  weeklyRegistrations: { d: string; v: number }[];
  planDistribution: { name: string; pct: number; count: number }[];
  recentRegistrations: {
    name: string;
    domain: string;
    step: string;
    flag: string;
    time: string;
  }[];
};

export type SuperAdminPlanFlags = {
  finance: boolean;
  students: boolean;
  classes: boolean;
  staff: boolean;
  vehicle: boolean;
  analytics: boolean;
  feeReminders: boolean;
  feeCollection: boolean;
  extraUsers: boolean;
  staffAttendance: boolean;
  payroll: boolean;
  autoFeeCollection: boolean;
  whatsapp: boolean;
};

export type SuperAdminPlan = {
  name: Tier | string;
  accent: string;
  monthly: number;
  annually: number;
  defaultCapacity?: number;
  flags: SuperAdminPlanFlags;
};

export type ImpersonationLogRow = {
  admin: string;
  tenant: string;
  ticket: string;
  time: string;
  duration: string;
};

export type WebhookEventRow = {
  source: string;
  event: string;
  status: number;
  time: string;
  payload: string;
};

export type AuditsBundle = {
  impersonationLogs: ImpersonationLogRow[];
  webhookEvents: WebhookEventRow[];
};

export type ProvisionInput = {
  name: string;
  subdomain: string;
  tier: Tier;
  capacity: number;
  adminName: string;
  adminEmail: string;
  password?: string;
};

export type ProvisionResult = {
  tenant: Tenant;
  admin: {
    email: string;
    displayName: string;
    userId: string;
    temporaryPassword: string;
  };
};

export type ImpersonateResult = {
  token: string;
  ticket: string;
  expiresInSeconds: number;
  tenant: Tenant;
  session: {
    role: string;
    email: string;
    displayName: string;
    tenantName: string;
    tenantId: string;
    userId: string;
    staffId?: string | null;
    permissions: string[];
    tier?: string;
    planName?: string;
    planFlags?: SuperAdminPlanFlags;
    impersonation?: boolean;
    ticket?: string;
  };
};

function formatWebhookPayload(payload: unknown): string {
  if (typeof payload === "string") return payload;
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.raw === "string") return obj.raw;
    const tenant =
      (obj.tenantName as string) ||
      (obj.tenantId as string) ||
      (obj.subdomain as string) ||
      "";
    const event = (obj.event as string) || "";
    return [event, tenant].filter(Boolean).join(" · ") || JSON.stringify(payload);
  }
  return "";
}

export async function fetchSuperAdminTenants(params?: {
  q?: string;
  tier?: string;
  status?: string;
}): Promise<Tenant[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.tier && params.tier !== "all") qs.set("tier", params.tier);
  if (params?.status && params.status !== "all") qs.set("status", params.status);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiRequest<Tenant[]>(`/api/super-admin/tenants.php${suffix}`);
}

export async function provisionSuperAdminTenant(
  input: ProvisionInput,
): Promise<ProvisionResult> {
  return apiRequest<ProvisionResult>("/api/super-admin/tenants/provision.php", {
    method: "POST",
    body: input,
  });
}

export type UpdateTenantInput = {
  id: string;
  name: string;
  subdomain: string;
  tier: Tier;
  status: Status;
  capacity: number;
  /** When set, updates the primary school admin login email (username). */
  username?: string;
  /** When set, resets the primary school admin login password. */
  password?: string;
};

export async function updateSuperAdminTenant(
  input: UpdateTenantInput,
): Promise<Tenant> {
  return apiRequest<Tenant>("/api/super-admin/tenants/update.php", {
    method: "POST",
    body: input,
  });
}

export async function deleteSuperAdminTenant(
  tenantId: string,
): Promise<{ id: string; name: string; subdomain: string; deleted: boolean }> {
  return apiRequest("/api/super-admin/tenants/delete.php", {
    method: "POST",
    body: { id: tenantId },
  });
}

export type PlatformInvoice = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  periodLabel: string;
  billingCycle: string;
  pricingModel?: "per_student" | "flat_cycle" | string | null;
  currency: string;
  studentsBilled: number;
  ratePerStudent: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  status: string;
  paymentMethod?: string | null;
  paidAt?: string | null;
  paymentRef?: string | null;
  receiptNumber?: string | null;
  notes?: string | null;
  tenantId?: string | null;
  tenantName?: string | null;
};

export async function fetchSuperAdminTenantInvoices(
  tenantId: string,
): Promise<PlatformInvoice[]> {
  return apiRequest<PlatformInvoice[]>(
    `/api/super-admin/tenants/invoices.php?tenantId=${encodeURIComponent(tenantId)}`,
  );
}

export async function issueSuperAdminTenantInvoice(input: {
  tenantId: string;
  billingCycle: string;
  pricingModel?: "per_student" | "flat_cycle";
  currency: string;
  studentsBilled: number;
  ratePerStudent: number;
  discountPercent: number;
  taxPercent: number;
  issueDate?: string;
  dueDate?: string;
  periodLabel?: string;
  paymentMethod?: string;
  markPaid?: boolean;
  notes?: string;
}): Promise<PlatformInvoice> {
  return apiRequest<PlatformInvoice>("/api/super-admin/tenants/invoices.php", {
    method: "POST",
    body: { action: "issue", ...input },
  });
}

export async function markSuperAdminTenantInvoicePaid(input: {
  tenantId: string;
  invoiceId: string;
  paymentMethod?: string;
  paymentRef?: string;
}): Promise<PlatformInvoice> {
  return apiRequest<PlatformInvoice>("/api/super-admin/tenants/invoices.php", {
    method: "POST",
    body: { action: "markPaid", ...input },
  });
}

export async function fetchTenantPlatformInvoices(): Promise<PlatformInvoice[]> {
  return apiRequest<PlatformInvoice[]>("/api/tenant/invoices.php");
}

export async function fetchSuperAdminOverview(): Promise<SuperAdminOverview> {
  return apiRequest<SuperAdminOverview>("/api/super-admin/overview.php");
}

export async function fetchSuperAdminPlans(): Promise<SuperAdminPlan[]> {
  return apiRequest<SuperAdminPlan[]>("/api/super-admin/plans.php");
}

export async function updateSuperAdminPlan(
  plan: Partial<SuperAdminPlan> & { name: string },
): Promise<SuperAdminPlan> {
  return apiRequest<SuperAdminPlan>("/api/super-admin/plans/update.php", {
    method: "POST",
    body: plan,
  });
}

export async function fetchSuperAdminAudits(): Promise<AuditsBundle> {
  const data = await apiRequest<{
    impersonationLogs: ImpersonationLogRow[];
    webhookEvents: Array<{
      source: string;
      event: string;
      status: number;
      time: string;
      payload: unknown;
    }>;
  }>("/api/super-admin/audits.php");

  return {
    impersonationLogs: data.impersonationLogs ?? [],
    webhookEvents: (data.webhookEvents ?? []).map((e) => ({
      source: e.source,
      event: e.event,
      status: e.status,
      time: e.time,
      payload: formatWebhookPayload(e.payload),
    })),
  };
}

export async function postIncomingWebhook(body: {
  provider: string;
  event: string;
  tenantName?: string;
  tenantId?: string;
  amount?: number;
  currency?: string;
  status?: number;
}): Promise<void> {
  await apiRequest("/api/webhooks/incoming.php", {
    method: "POST",
    body,
    auth: false,
  });
}

export type { Status };
