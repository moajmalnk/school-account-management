import { ApiError, apiRequest, getApiToken } from "@/lib/api/client";
import { apiUploadDataUrl } from "@/lib/api/settings";
import { isDataUrl } from "@/lib/media";
import type { Payment, Staff, Student } from "@/lib/tenant-store";

function hasToken() {
  return Boolean(getApiToken());
}

/** True when create hit UNIQUE (tenant_id, public_id) or similar. */
export function isDuplicateKeyError(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  if (err.status === 409) return true;
  return /duplicate entry|integrity constraint/i.test(err.message);
}

/** Upload oversized data-URL photos before DB write (photo_url is short-URL only). */
async function withUploadedPhoto<T extends { photoUrl?: string }>(row: T): Promise<T> {
  if (!isDataUrl(row.photoUrl)) return row;
  const url = await apiUploadDataUrl(row.photoUrl!, "photo", "profile-photo.png");
  return { ...row, photoUrl: url };
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

/**
 * Create-first upsert — avoids probing get.php (which 404s for every new ID and
 * floods the browser console during bulk admit). On duplicate public_id, update.
 * Pass createOnly for bulk admit so collisions don't overwrite an existing student.
 */
export async function apiUpsertStudent(
  student: Student,
  opts?: { createOnly?: boolean },
): Promise<Student> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to save student changes");
  }
  const payload = await withUploadedPhoto(student);
  try {
    return await apiRequest<Student>("/api/students/create.php", {
      method: "POST",
      body: payload,
    });
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
    if (opts?.createOnly) {
      // Collision on client-picked ID / share token — server allocates a fresh public_id.
      const { id: _ignored, shareToken: _share, ...withoutId } = payload;
      return apiRequest<Student>("/api/students/create.php", {
        method: "POST",
        body: { ...withoutId, id: "" },
      });
    }
    return mutate<Student>("/api/students/update.php", payload);
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

/** Upsert academic-year ledger rows so every device shares the same enrollment set. */
export async function apiSyncStudentYearFields(
  entries: Array<{
    studentId: string;
    academicYear: string;
    cls: string;
    due: number;
    active: boolean;
  }>,
): Promise<void> {
  if (!hasToken() || entries.length === 0) return;
  await mutate("/api/students/year-fields.php", { entries });
}

export async function apiUpsertStaff(
  staff: Staff,
  opts?: { createOnly?: boolean },
): Promise<Staff> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to save staff changes");
  }
  const payload = await withUploadedPhoto(staff);
  try {
    return await apiRequest<Staff>("/api/staff/create.php", {
      method: "POST",
      body: payload,
    });
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
    if (opts?.createOnly) {
      const { id: _ignored, ...withoutId } = payload;
      return apiRequest<Staff>("/api/staff/create.php", {
        method: "POST",
        body: { ...withoutId, id: "" },
      });
    }
    return mutate<Staff>("/api/staff/update.php", payload);
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
  const { id: _clientId, ...payload } = payment;
  return apiRequest<Payment>("/api/finance/payments.php", {
    method: "POST",
    body: { ...payload, ...extras },
  });
}

export const FINANCE_BULK_CHUNK = 80;
export const FINANCE_BULK_TIMEOUT_MS = 60_000;

export type FinanceBulkSkip = { line: number; reason: string };

export type FinanceBulkResult<T> = {
  added: T[];
  skipped: FinanceBulkSkip[];
  failed: FinanceBulkSkip[];
  ledgersCreated?: number;
};

/** Old PHP (no `_bulk` handler) returns 404/405 or single-row validation 422. */
export function isFinanceBulkUnsupported(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  if (err.status === 404 || err.status === 405) return true;
  const msg = err.message.toLowerCase();
  return (
    (err.status === 400 || err.status === 422) &&
    (msg.includes("payee and amount") || msg.includes("name and amount"))
  );
}

export type PaymentBulkRow = Omit<Payment, "id"> & {
  line?: number;
  studentId?: string;
  reduceDue?: boolean;
};

export async function apiBulkCreatePayments(
  rows: PaymentBulkRow[],
): Promise<FinanceBulkResult<Payment & { line?: number }>> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to import receipts");
  }
  return apiRequest<FinanceBulkResult<Payment & { line?: number }>>("/api/finance/payments.php", {
    method: "POST",
    body: { _bulk: true, rows },
    timeoutMs: FINANCE_BULK_TIMEOUT_MS,
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
  ledgerId?: string | null;
  time?: string;
  status?: string;
  attachments?: unknown[];
  staffId?: string;
  category?: string;
  staffName?: string;
  line?: number;
};

export type ExpenseLedgerPayload = {
  id: string;
  name: string;
  label?: string;
  slug?: string | null;
  active?: boolean;
  sortOrder?: number;
};

export async function apiListExpenseLedgers(): Promise<ExpenseLedgerPayload[]> {
  if (!hasToken()) return [];
  return apiRequest<ExpenseLedgerPayload[]>("/api/finance/expense-ledgers.php");
}

export async function apiCreateExpenseLedger(input: {
  name: string;
  id?: string;
}): Promise<ExpenseLedgerPayload> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to create ledgers");
  }
  return apiRequest<ExpenseLedgerPayload>("/api/finance/expense-ledgers.php", {
    method: "POST",
    body: input,
  });
}

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

export async function apiBulkCreateDisbursements(
  rows: DisbursementPayload[],
): Promise<FinanceBulkResult<DisbursementPayload>> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to import expenses");
  }
  return apiRequest<FinanceBulkResult<DisbursementPayload>>("/api/finance/disbursements.php", {
    method: "POST",
    body: { _bulk: true, rows },
    timeoutMs: FINANCE_BULK_TIMEOUT_MS,
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

export type StudentFeeBreakPayload = {
  id?: string;
  studentId: string;
  academicYear: string;
  appliesTo: "tuition" | "vehicle" | "both";
  periods: string[];
  reason?: string | null;
  /** Signed delta applied to student.due (negative reduces due). */
  dueAdjustment?: number;
};

export type StudentFeeBreakResponse = StudentFeeBreakPayload & {
  id: string;
  studentDue?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export async function apiListFeeBreaks(opts?: {
  studentId?: string;
  academicYear?: string;
}): Promise<StudentFeeBreakResponse[]> {
  if (!hasToken()) return [];
  const params = new URLSearchParams();
  if (opts?.studentId) params.set("studentId", opts.studentId);
  if (opts?.academicYear) params.set("academicYear", opts.academicYear);
  const qs = params.toString();
  return apiRequest<StudentFeeBreakResponse[]>(`/api/finance/fee-breaks.php${qs ? `?${qs}` : ""}`);
}

export async function apiCreateFeeBreak(
  payload: StudentFeeBreakPayload,
): Promise<StudentFeeBreakResponse> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to save fee breaks");
  }
  const { id: _id, ...body } = payload;
  return apiRequest<StudentFeeBreakResponse>("/api/finance/fee-breaks.php", {
    method: "POST",
    body,
  });
}

export async function apiUpdateFeeBreak(
  payload: StudentFeeBreakPayload & { id: string },
): Promise<StudentFeeBreakResponse> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to update fee breaks");
  }
  try {
    return await apiRequest<StudentFeeBreakResponse>("/api/finance/fee-breaks.php", {
      method: "POST",
      body: { ...payload, _update: true },
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 405) {
      return mutate<StudentFeeBreakResponse>("/api/finance/fee-breaks.php", payload, [
        "PUT",
        "PATCH",
      ]);
    }
    throw err;
  }
}

export async function apiDeleteFeeBreak(
  id: string,
  extras?: { dueAdjustment?: number },
): Promise<{ id: string; deleted: boolean; studentDue?: number }> {
  if (!hasToken()) {
    throw new Error("Not signed in to API — log in again to delete fee breaks");
  }
  try {
    return await apiRequest("/api/finance/fee-breaks.php", {
      method: "POST",
      body: { id, _delete: true, dueAdjustment: extras?.dueAdjustment ?? 0 },
    });
  } catch (err) {
    try {
      return await apiRequest(`/api/finance/fee-breaks.php?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        body: { dueAdjustment: extras?.dueAdjustment ?? 0 },
      });
    } catch {
      throw err;
    }
  }
}
