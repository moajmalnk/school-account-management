import { apiRequest, getApiToken } from "@/lib/api/client";
import type {
  ClassConfig,
  Department,
  PaymentCategory,
  SchoolDetails,
  ThemeSettings,
  TransportRoute,
  TransportVehicle,
} from "@/lib/tenant-store";

function hasToken() {
  return Boolean(getApiToken());
}

function isDataUrl(value?: string | null): boolean {
  return typeof value === "string" && value.startsWith("data:");
}

export async function apiUploadDataUrl(
  dataUrl: string,
  kind: "logo" | "letterhead" | "photo" | "document",
  fileName?: string,
): Promise<string> {
  const data = await apiRequest<{ url: string }>("/api/upload.php", {
    method: "POST",
    body: { dataUrl, kind, fileName },
  });
  return data.url;
}

/** Persist school identity; uploads data-URL logo/letterhead first. */
export async function apiSaveSchoolDetails(
  schoolDetails: SchoolDetails,
  extras?: {
    themeSettings?: ThemeSettings;
    academicYear?: string;
    academicYears?: string[];
  },
): Promise<SchoolDetails> {
  if (!hasToken()) return schoolDetails;

  let next = { ...schoolDetails };
  if (isDataUrl(next.logoUrl)) {
    next.logoUrl = await apiUploadDataUrl(next.logoUrl!, "logo", "logo.png");
  }
  if (isDataUrl(next.letterheadUrl)) {
    next.letterheadUrl = await apiUploadDataUrl(
      next.letterheadUrl!,
      "letterhead",
      "letterhead.png",
    );
  }

  const data = await apiRequest<{
    schoolDetails: SchoolDetails;
  }>("/api/settings/school.php", {
    method: "PUT",
    body: {
      schoolDetails: next,
      themeSettings: extras?.themeSettings,
      academicYear: extras?.academicYear,
      academicYears: extras?.academicYears,
    },
  });
  return data.schoolDetails;
}

/** Persist academic / financial year list + active year to the server. */
export async function apiSyncAcademicYears(input: {
  academicYears: string[];
  academicYear: string;
  closedAcademicYears?: string[];
  renameAcademicYear?: { from: string; to: string };
}): Promise<{
  academicYears: string[];
  academicYear: string;
  closedAcademicYears: string[];
}> {
  if (!hasToken()) {
    return {
      academicYears: input.academicYears,
      academicYear: input.academicYear,
      closedAcademicYears: input.closedAcademicYears ?? [],
    };
  }
  const data = await apiRequest<{
    academicYears: string[];
    academicYear: string;
    closedAcademicYears?: string[];
  }>("/api/settings/school.php", {
    method: "PUT",
    body: {
      academicYears: input.academicYears,
      academicYear: input.academicYear,
      closedAcademicYears: input.closedAcademicYears ?? [],
      renameAcademicYear: input.renameAcademicYear,
    },
  });
  return {
    academicYears: data.academicYears?.length ? data.academicYears : input.academicYears,
    academicYear: data.academicYear || input.academicYear,
    closedAcademicYears: Array.isArray(data.closedAcademicYears)
      ? data.closedAcademicYears
      : (input.closedAcademicYears ?? []),
  };
}

export async function apiUpsertFeeTerm(term: {
  id: string;
  kind: string;
  periodMode?: string;
  label: string;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  feeAmount?: number | null;
  coverage?: string;
}): Promise<void> {
  if (!hasToken()) return;
  const list = await apiRequest<Array<{ id: string }>>("/api/settings/fees.php");
  const exists = list.some((t) => t.id === term.id);
  await apiRequest("/api/settings/fees.php", {
    method: exists ? "PUT" : "POST",
    body: term,
  });
}

export async function apiDeleteFeeTerm(id: string): Promise<void> {
  if (!hasToken()) return;
  await apiRequest(`/api/settings/fees.php?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function apiUpsertClass(cls: ClassConfig): Promise<ClassConfig> {
  if (!hasToken()) return cls;
  const list = await apiRequest<ClassConfig[]>("/api/settings/classes.php");
  const exists = list.some((c) => c.id === cls.id);
  if (exists) {
    return apiRequest<ClassConfig>("/api/settings/classes.php", {
      method: "PUT",
      body: cls,
    });
  }
  return apiRequest<ClassConfig>("/api/settings/classes.php", {
    method: "POST",
    body: cls,
  });
}

export async function apiDeleteClass(id: string): Promise<void> {
  if (!hasToken()) return;
  await apiRequest(`/api/settings/classes.php?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function apiUpsertDepartment(dept: Department): Promise<Department> {
  if (!hasToken()) return dept;
  const list = await apiRequest<Department[]>("/api/settings/departments.php");
  const exists = list.some((d) => d.id === dept.id);
  if (exists) {
    return apiRequest<Department>("/api/settings/departments.php", {
      method: "PUT",
      body: dept,
    });
  }
  return apiRequest<Department>("/api/settings/departments.php", {
    method: "POST",
    body: dept,
  });
}

export async function apiDeleteDepartment(id: string): Promise<void> {
  if (!hasToken()) return;
  await apiRequest(`/api/settings/departments.php?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function apiUpsertPaymentCategory(
  cat: PaymentCategory,
): Promise<PaymentCategory> {
  if (!hasToken()) return cat;
  const list = await apiRequest<PaymentCategory[]>(
    "/api/settings/fees.php?resource=categories",
  );
  const exists = list.some((c) => c.id === cat.id);
  if (exists) {
    return apiRequest<PaymentCategory>(
      "/api/settings/fees.php?resource=categories",
      { method: "PUT", body: cat },
    );
  }
  return apiRequest<PaymentCategory>(
    "/api/settings/fees.php?resource=categories",
    { method: "POST", body: cat },
  );
}

export async function apiDeletePaymentCategory(id: string): Promise<void> {
  if (!hasToken()) return;
  await apiRequest(
    `/api/settings/fees.php?resource=categories&id=${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export async function apiUpsertTransportRoute(
  route: TransportRoute,
): Promise<TransportRoute> {
  if (!hasToken()) return route;
  const list = await apiRequest<TransportRoute[]>("/api/settings/transport.php");
  const exists = list.some((r) => r.id === route.id);
  if (exists) {
    return apiRequest<TransportRoute>("/api/settings/transport.php", {
      method: "PUT",
      body: route,
    });
  }
  return apiRequest<TransportRoute>("/api/settings/transport.php", {
    method: "POST",
    body: route,
  });
}

export async function apiDeleteTransportRoute(id: string): Promise<void> {
  if (!hasToken()) return;
  await apiRequest(`/api/settings/transport.php?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function apiUpsertVehicle(
  vehicle: TransportVehicle,
): Promise<TransportVehicle> {
  if (!hasToken()) return vehicle;
  const list = await apiRequest<TransportVehicle[]>(
    "/api/settings/transport.php?type=vehicles",
  );
  const exists = list.some((v) => v.id === vehicle.id);
  if (exists) {
    return apiRequest<TransportVehicle>(
      "/api/settings/transport.php?type=vehicles",
      { method: "PUT", body: vehicle },
    );
  }
  return apiRequest<TransportVehicle>(
    "/api/settings/transport.php?type=vehicles",
    { method: "POST", body: vehicle },
  );
}

export async function apiDeleteVehicle(id: string): Promise<void> {
  if (!hasToken()) return;
  await apiRequest(
    `/api/settings/transport.php?type=vehicles&id=${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export async function apiUpsertTenantUser(user: {
  id: string;
  email: string;
  password: string;
  displayName: string;
  roleId?: string;
  staffId?: string;
  permissions: unknown;
  active: boolean;
}): Promise<void> {
  if (!hasToken()) return;
  const list = await apiRequest<Array<{ id: string }>>("/api/settings/users.php");
  const exists = list.some((u) => u.id === user.id);
  await apiRequest("/api/settings/users.php", {
    method: exists ? "PUT" : "POST",
    body: user,
  });
}

export async function apiDeleteTenantUser(id: string): Promise<void> {
  if (!hasToken()) return;
  await apiRequest(`/api/settings/users.php?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
