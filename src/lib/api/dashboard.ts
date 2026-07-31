import { ApiError, apiRequest, getApiToken } from "@/lib/api/client";

export type DashboardTodosPayload = {
  dashboardTodos: string[];
  dashboardNote: string;
};

function hasToken() {
  return Boolean(getApiToken());
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
