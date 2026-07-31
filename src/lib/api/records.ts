import { apiRequest, getApiToken } from "@/lib/api/client";
import type { Payment, Staff, Student } from "@/lib/tenant-store";

function hasToken() {
  return Boolean(getApiToken());
}

export async function apiUpsertStudent(student: Student): Promise<Student> {
  if (!hasToken()) return student;
  try {
    await apiRequest(`/api/students/get.php?id=${encodeURIComponent(student.id)}`);
    return apiRequest<Student>("/api/students/update.php", {
      method: "PUT",
      body: student,
    });
  } catch {
    return apiRequest<Student>("/api/students/create.php", {
      method: "POST",
      body: student,
    });
  }
}

export async function apiDeleteStudent(
  id: string,
  opts?: { hard?: boolean; restore?: boolean },
): Promise<void> {
  if (!hasToken()) return;
  await apiRequest("/api/students/delete.php", {
    method: "POST",
    body: { id, hard: opts?.hard, restore: opts?.restore },
  });
}

export async function apiUpsertStaff(staff: Staff): Promise<Staff> {
  if (!hasToken()) return staff;
  try {
    await apiRequest(`/api/staff/get.php?id=${encodeURIComponent(staff.id)}`);
    return apiRequest<Staff>("/api/staff/update.php", {
      method: "PUT",
      body: staff,
    });
  } catch {
    return apiRequest<Staff>("/api/staff/create.php", {
      method: "POST",
      body: staff,
    });
  }
}

export async function apiDeleteStaff(
  id: string,
  opts?: { hard?: boolean; restore?: boolean },
): Promise<void> {
  if (!hasToken()) return;
  await apiRequest("/api/staff/delete.php", {
    method: "POST",
    body: { id, hard: opts?.hard, restore: opts?.restore },
  });
}

export async function apiCreatePayment(
  payment: Payment,
  extras?: { reduceDue?: boolean; studentId?: string },
): Promise<Payment> {
  if (!hasToken()) return payment;
  return apiRequest<Payment>("/api/finance/payments.php", {
    method: "POST",
    body: { ...payment, ...extras },
  });
}
