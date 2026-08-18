/** Active campus public id for authenticated API requests (`X-Branch-Id`). */

const STORAGE_PREFIX = "school-accounts/active-branch/";

let currentTenantId: string | null = null;
let currentBranchPublicId: string | null = null;

export function getActiveBranchPublicId(): string | null {
  return currentBranchPublicId;
}

export function setActiveBranchPublicId(branchPublicId: string | null) {
  currentBranchPublicId = branchPublicId && branchPublicId.trim() ? branchPublicId.trim() : null;
  persist();
}

export function setBranchTenantId(tenantId: string | null) {
  currentTenantId = tenantId && tenantId.trim() ? tenantId.trim() : null;
  persist();
}

export function setBranchContext(tenantId: string | null, branchPublicId: string | null) {
  currentTenantId = tenantId && tenantId.trim() ? tenantId.trim() : null;
  currentBranchPublicId = branchPublicId && branchPublicId.trim() ? branchPublicId.trim() : null;
  persist();
}

export function readStoredBranchPublicId(tenantId?: string | null): string | null {
  if (typeof window === "undefined") return null;
  const id = typeof tenantId === "string" ? tenantId.trim() : "";
  if (!id) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + id);
    return raw && raw.trim() ? raw.trim() : null;
  } catch {
    return null;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  if (!currentTenantId || !currentBranchPublicId) return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + currentTenantId, currentBranchPublicId);
  } catch {
    // ignore quota / private mode
  }
}
