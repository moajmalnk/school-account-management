import { ApiError, apiRequest, getApiToken } from "@/lib/api/client";
import type { Payment, Staff, Student } from "@/lib/tenant-store";

function hasToken() {
  return Boolean(getApiToken());
}

/** Prefer POST (Hostinger-friendly); fall back to PUT on 405. */
async function mutate<T>(
  path: string,
  body: unknown,
  methods: Array<"POST" | "PUT" | "PATCH" | "DELETE"> = ["POST", "PUT"],
): Promise<T> {
  let lastErr: unknown;
  for (const method of methods) {
    try {
      return await apiRequest<T>(path, { method, body });
    } catch (err) {
      lastErr = err;
      if (err instanceof ApiError && err.status === 405) continue;
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Request failed");
}

export async function apiUpsertStudent(student: Student): Promise<Student> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to save student changes");
  }
  try {
    await apiRequest(`/api/students/get.php?id=${encodeURIComponent(student.id)}`);
    return mutate<Student>("/api/students/update.php", student);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return apiRequest<Student>("/api/students/create.php", {
        method: "POST",
        body: student,
      });
    }
    // get.php failed for other reasons — still try update, then create
    try {
      return await mutate<Student>("/api/students/update.php", student);
    } catch {
      return apiRequest<Student>("/api/students/create.php", {
        method: "POST",
        body: student,
      });
    }
  }
}

export async function apiDeleteStudent(
  id: string,
  opts?: { hard?: boolean; restore?: boolean },
): Promise<void> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to delete students");
  }
  await mutate("/api/students/delete.php", {
    id,
    hard: opts?.hard,
    restore: opts?.restore,
  });
}

export async function apiUpsertStaff(staff: Staff): Promise<Staff> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to save staff changes");
  }
  try {
    await apiRequest(`/api/staff/get.php?id=${encodeURIComponent(staff.id)}`);
    return mutate<Staff>("/api/staff/update.php", staff);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return apiRequest<Staff>("/api/staff/create.php", {
        method: "POST",
        body: staff,
      });
    }
    try {
      return await mutate<Staff>("/api/staff/update.php", staff);
    } catch {
      return apiRequest<Staff>("/api/staff/create.php", {
        method: "POST",
        body: staff,
      });
    }
  }
}

export async function apiDeleteStaff(
  id: string,
  opts?: { hard?: boolean; restore?: boolean },
): Promise<void> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to delete staff");
  }
  await mutate("/api/staff/delete.php", {
    id,
    hard: opts?.hard,
    restore: opts?.restore,
  });
}

export async function apiCreatePayment(
  payment: Payment,
  extras?: { reduceDue?: boolean; studentId?: string },
): Promise<Payment> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to save payments");
  }
  return apiRequest<Payment>("/api/finance/payments.php", {
    method: "POST",
    body: { ...payment, ...extras },
  });
}

export async function apiUpdatePayment(payment: Payment): Promise<Payment> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to update payments");
  }
  try {
    return await apiRequest<Payment>("/api/finance/payments.php", {
      method: "POST",
      body: { ...payment, _update: true },
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 405) {
      return mutate<Payment>("/api/finance/payments.php", payment, ["PUT", "PATCH"]);
    }
    try {
      return await mutate<Payment>("/api/finance/payments.php", payment, ["PUT", "PATCH"]);
    } catch {
      throw err;
    }
  }
}

export async function apiDeletePayment(id: string): Promise<void> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to delete payments");
  }
  try {
    await apiRequest("/api/finance/payments.php", {
      method: "POST",
      body: { id, _delete: true },
    });
  } catch (err) {
    try {
      await apiRequest(`/api/finance/payments.php?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch {
      throw err;
    }
  }
}

export type DisbursementPayload = {
  id?: string;
  payee: string;
  desc: string;
  amount: number;
  mode: string;
  payeeType: string;
  time?: string;
  status?: string;
  attachments?: unknown[];
  staffId?: string;
};

export async function apiCreateDisbursement(
  disbursement: DisbursementPayload,
): Promise<DisbursementPayload> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to save disbursements");
  }
  return apiRequest<DisbursementPayload>("/api/finance/disbursements.php", {
    method: "POST",
    body: disbursement,
  });
}

export async function apiUpdateDisbursement(
  disbursement: DisbursementPayload,
): Promise<DisbursementPayload> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to update disbursements");
  }
  try {
    return await apiRequest<DisbursementPayload>("/api/finance/disbursements.php", {
      method: "POST",
      body: { ...disbursement, _update: true },
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 405) {
      return mutate<DisbursementPayload>("/api/finance/disbursements.php", disbursement, [
        "PUT",
        "PATCH",
      ]);
    }
    try {
      return await mutate<DisbursementPayload>("/api/finance/disbursements.php", disbursement, [
        "PUT",
        "PATCH",
      ]);
    } catch {
      throw err;
    }
  }
}

export async function apiDeleteDisbursement(id: string): Promise<void> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to delete disbursements");
  }
  try {
    await apiRequest("/api/finance/disbursements.php", {
      method: "POST",
      body: { id, _delete: true },
    });
  } catch (err) {
    try {
      await apiRequest(`/api/finance/disbursements.php?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch {
      throw err;
    }
  }
}

export async function apiListDisbursements(): Promise<DisbursementPayload[]> {
  if (!hasToken()) return [];
  return apiRequest<DisbursementPayload[]>("/api/finance/disbursements.php");
}
