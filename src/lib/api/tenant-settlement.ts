import { apiRequest } from "@/lib/api/client";

export type TenantSettlement = {
  tenantId: string;
  tenantName: string;
  subdomain: string;
  settlementEnabled: boolean;
  vendorId: string;
  vendorStatus: string;
  platformFee: number;
  settlementAccountLast4: string;
  settlementIfsc: string;
  settlementHolder: string;
  settlementReady: boolean;
  parentPayEnabled: boolean;
  cashfreeReady: boolean;
  configured: boolean;
};

export async function fetchSuperAdminTenantSettlement(tenantId: string): Promise<TenantSettlement> {
  return apiRequest<TenantSettlement>(
    `/api/super-admin/tenants/settlement.php?tenantId=${encodeURIComponent(tenantId)}`,
  );
}

export async function saveSuperAdminTenantSettlement(input: {
  tenantId: string;
  settlementEnabled: boolean;
  vendorId: string;
  vendorStatus: string;
  platformFee: number;
  settlementAccountLast4?: string;
  settlementIfsc?: string;
  settlementHolder?: string;
}): Promise<TenantSettlement> {
  return apiRequest<TenantSettlement>("/api/super-admin/tenants/settlement.php", {
    method: "POST",
    body: input,
  });
}
