import { apiRequest, getApiToken } from "@/lib/api/client";
import {
  SEED_CLASSES,
  SEED_DEPARTMENTS,
  SEED_FEE_TERMS,
  SEED_NOTIFICATIONS,
  SEED_PAYMENT_CATEGORIES,
  SEED_PAYMENTS,
  SEED_ROLES,
  SEED_SCHOOL_DETAILS,
  SEED_STAFF,
  SEED_STUDENTS,
  SEED_THEME_SETTINGS,
  SEED_TRANSPORT,
  SEED_VEHICLES,
  type ClassConfig,
  type Department,
  type FeeTerm,
  type Payment,
  type PaymentCategory,
  type Role,
  type SchoolDetails,
  type Staff,
  type Student,
  type TenantNotification,
  type TenantUser,
  type ThemeSettings,
  type TransportRoute,
  type TransportVehicle,
} from "@/lib/tenant-store";
import { buildLedgerFromStudents } from "@/lib/academic-year";

export type RemoteTenantBundle = {
  students: Student[];
  staff: Staff[];
  payments: Payment[];
  departments: Department[];
  roles: Role[];
  classes: ClassConfig[];
  transportRoutes: TransportRoute[];
  transportVehicles: TransportVehicle[];
  paymentCategories: PaymentCategory[];
  feeTerms: FeeTerm[];
  tenantUsers: TenantUser[];
  notifications: TenantNotification[];
  schoolDetails: SchoolDetails;
  themeSettings: ThemeSettings;
  academicYear: string;
  academicYears: string[];
  dashboardTodos: string[];
  dashboardNote: string;
  studentYearLedgers: ReturnType<typeof buildLedgerFromStudents>[];
};

async function getSafe<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiRequest<T>(path);
  } catch (err) {
    console.warn(`[api] ${path} failed — using fallback`, err);
    return fallback;
  }
}

function nonEmpty<T>(remote: T[], seed: T[]): T[] {
  return remote.length > 0 ? remote : seed;
}

/** Load tenant workspace data from production API when a JWT is present. */
export async function fetchRemoteTenantBundle(
  signal?: AbortSignal,
): Promise<RemoteTenantBundle | null> {
  if (!getApiToken()) return null;
  void signal;

  const [
    students,
    staff,
    payments,
    departments,
    roles,
    classes,
    feeTerms,
    paymentCategories,
    routes,
    vehicles,
    users,
    notifications,
    school,
    todos,
  ] = await Promise.all([
    getSafe<Student[]>("/api/students/list.php", []),
    getSafe<Staff[]>("/api/staff/list.php", []),
    getSafe<Payment[]>("/api/finance/payments.php", []),
    getSafe<Department[]>("/api/settings/departments.php", []),
    getSafe<Role[]>("/api/settings/roles.php", []),
    getSafe<ClassConfig[]>("/api/settings/classes.php", []),
    getSafe<FeeTerm[]>("/api/settings/fees.php", []),
    getSafe<PaymentCategory[]>(
      "/api/settings/fees.php?resource=categories",
      [],
    ),
    getSafe<TransportRoute[]>("/api/settings/transport.php", []),
    getSafe<TransportVehicle[]>(
      "/api/settings/transport.php?type=vehicles",
      [],
    ),
    getSafe<TenantUser[]>("/api/settings/users.php", []),
    getSafe<TenantNotification[]>("/api/notifications/list.php", []),
    getSafe<{
      schoolDetails: SchoolDetails;
      themeSettings: ThemeSettings;
      academicYear: string;
      academicYears: string[];
    } | null>("/api/settings/school.php", null),
    getSafe<{ dashboardTodos: string[]; dashboardNote: string } | null>(
      "/api/dashboard/todos.php",
      null,
    ),
  ]);

  const academicYear = school?.academicYear ?? "AY 2025-26";
  const academicYears = school?.academicYears?.length
    ? school.academicYears
    : ["AY 2024-25", "AY 2025-26", "AY 2026-27"];

  const nextStudents = nonEmpty(students, SEED_STUDENTS);
  return {
    students: nextStudents,
    staff: nonEmpty(staff, SEED_STAFF),
    payments: nonEmpty(payments, SEED_PAYMENTS),
    departments: nonEmpty(departments, SEED_DEPARTMENTS),
    roles: nonEmpty(roles, SEED_ROLES),
    classes: nonEmpty(classes, SEED_CLASSES),
    transportRoutes: nonEmpty(routes, SEED_TRANSPORT),
    transportVehicles: nonEmpty(vehicles, SEED_VEHICLES),
    paymentCategories: nonEmpty(paymentCategories, SEED_PAYMENT_CATEGORIES),
    feeTerms: nonEmpty(feeTerms, SEED_FEE_TERMS),
    tenantUsers: users,
    notifications: nonEmpty(notifications, [...SEED_NOTIFICATIONS]),
    schoolDetails: school?.schoolDetails ?? { ...SEED_SCHOOL_DETAILS },
    themeSettings: school?.themeSettings ?? { ...SEED_THEME_SETTINGS },
    academicYear,
    academicYears,
    dashboardTodos: todos?.dashboardTodos ?? [
      "Follow up overdue fees",
      "Confirm May payroll",
      "",
      "",
      "",
    ],
    dashboardNote:
      todos?.dashboardNote ??
      "Focus: close Term 1 fee collections before mid-May.",
    studentYearLedgers: [buildLedgerFromStudents(nextStudents, academicYear)],
  };
}
