import { ApiError, apiRequest, getApiToken } from "@/lib/api/client";
import { getActiveBranchPublicId } from "@/lib/branch-context";

export type DashboardTodosPayload = {
  dashboardTodos: string[];
  dashboardNote: string;
};

/** Fast COUNT/SUM snapshot for School Overview first paint. */
export type DashboardSummary = {
  academicYear: string;
  totalStudents: number;
  studentsWithDue: number;
  studentsPaid: number;
  outstandingPayments: number;
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  monthIncome: number;
  monthReceiptCount: number;
  monthExpenses: number;
  monthExpenseCount: number;
  totalIncome: number;
  totalExpenses: number;
  cashPosition: number;
};

function hasToken() {
  return Boolean(getApiToken());
}

function summaryCacheKey(academicYear?: string) {
  return `${getApiToken() ?? ""}|${getActiveBranchPublicId() ?? ""}|${academicYear?.trim() ?? ""}`;
}

let summaryInflight: { key: string; promise: Promise<DashboardSummary | null> } | null = null;
let summaryCache: { key: string; data: DashboardSummary; at: number } | null = null;

export async function apiFetchDashboardSummary(
  academicYear?: string,
): Promise<DashboardSummary | null> {
  if (!hasToken()) return null;
  const key = summaryCacheKey(academicYear);
  if (summaryCache && summaryCache.key === key && Date.now() - summaryCache.at < 45_000) {
    return summaryCache.data;
  }
  if (summaryInflight?.key === key) return summaryInflight.promise;

  const q = new URLSearchParams();
  if (academicYear?.trim()) q.set("academicYear", academicYear.trim());
  const suffix = q.toString() ? `?${q.toString()}` : "";
  const promise = apiRequest<DashboardSummary>(`/api/dashboard/summary.php${suffix}`, {
    timeoutMs: 8_000,
  })
    .then((data) => {
      summaryCache = { key, data, at: Date.now() };
      return data;
    })
    .catch(() => null)
    .finally(() => {
      if (summaryInflight?.key === key) summaryInflight = null;
    });

  summaryInflight = { key, promise };
  return promise;
}

/** Fire-and-forget warm of the summary cache (call at hydrate start). */
export function prefetchDashboardSummary(academicYear?: string): void {
  void apiFetchDashboardSummary(academicYear);
}

export async function apiFetchDashboardTodos(): Promise<DashboardTodosPayload | null> {
  if (!hasToken()) return null;
  return apiRequest<DashboardTodosPayload>("/api/dashboard/todos.php");
}

/** Persist dashboard to-do list + notes to MySQL (tenant-scoped). */
export async function apiSaveDashboardTodos(
  dashboardTodos: string[],
  dashboardNote: string,
): Promise<DashboardTodosPayload> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to save tasks/notes");
  }
  const body = { dashboardTodos, dashboardNote };
  // POST first — some Hostinger builds only allow GET/POST. Fall back to PUT on 405.
  try {
    return await apiRequest<DashboardTodosPayload>("/api/dashboard/todos.php", {
      method: "POST",
      body,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 405) {
      return apiRequest<DashboardTodosPayload>("/api/dashboard/todos.php", {
        method: "PUT",
        body,
      });
    }
    throw err;
  }
}
