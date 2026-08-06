import {
  ApiError,
  apiRequest,
  getApiToken,
  isAuthExpiredError,
  isUnauthorizedNotified,
} from "@/lib/api/client";
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

const EMPTY_SCHOOL_DETAILS: SchoolDetails = {
  name: "",
  tagline: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  registrationNo: "",
  affiliationNo: "",
  principalName: "",
  establishedYear: "",
};

async function getSafe<T>(path: string, fallback: T): Promise<T> {
  if (isUnauthorizedNotified()) {
    throw new ApiError("Unauthorized: Token expired", 401);
  }
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await apiRequest<T>(path);
    } catch (err) {
      // Never soft-fallback on auth failure — caller must abort hydration.
      if (isAuthExpiredError(err)) throw err;

      const msg = err instanceof Error ? err.message : String(err);
      const retryable =
        /2002|Operation not permitted|Connection refused|Too many connections/i.test(
          msg,
        );
      if (retryable && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 250 * attempt));
        continue;
      }
      console.warn(`[api] ${path} failed — using fallback`, err);
      return fallback;
    }
  }
  return fallback;
}

/** Dedupe concurrent hydrates (React Strict Mode mounts twice in dev). */
let inflightBundle: Promise<RemoteTenantBundle | null> | null = null;
let inflightToken: string | null = null;

/**
 * Load tenant workspace data from production API when a JWT is present.
 * Empty lists are kept empty — do NOT substitute mock/seed data for a live school
 * (new tenants would otherwise show Silver Hills demo rows).
 * Requests run one-at-a-time — Hostinger shared MySQL drops sockets under storms
 * (SQLSTATE[HY000] [2002] Operation not permitted).
 */
export async function fetchRemoteTenantBundle(
  signal?: AbortSignal,
): Promise<RemoteTenantBundle | null> {
  const token = getApiToken();
  if (!token) return null;
  if (inflightBundle && inflightToken === token) return inflightBundle;

  inflightToken = token;
  inflightBundle = (async (): Promise<RemoteTenantBundle | null> => {
    void signal;

    try {
    // Sequential on purpose — do not Promise.all these on shared hosting.
    const students = await getSafe<Student[]>(
      "/api/students/list.php?includeDeleted=1",
      [],
    );
    const staff = await getSafe<Staff[]>("/api/staff/list.php?includeDeleted=1", []);
    const payments = await getSafe<Payment[]>("/api/finance/payments.php", []);
    const departments = await getSafe<Department[]>(
      "/api/settings/departments.php",
      [],
    );
    const roles = await getSafe<Role[]>("/api/settings/roles.php", []);
    const classes = await getSafe<ClassConfig[]>(
      "/api/settings/classes.php",
      [],
    );
    const feeTerms = await getSafe<FeeTerm[]>("/api/settings/fees.php", []);
    const paymentCategories = await getSafe<PaymentCategory[]>(
      "/api/settings/fees.php?resource=categories",
      [],
    );
    const routes = await getSafe<TransportRoute[]>(
      "/api/settings/transport.php",
      [],
    );
    const vehicles = await getSafe<TransportVehicle[]>(
      "/api/settings/transport.php?type=vehicles",
      [],
    );
    const users = await getSafe<TenantUser[]>("/api/settings/users.php", []);
    const notifications = await getSafe<TenantNotification[]>(
      "/api/notifications/list.php",
      [],
    );
    const school = await getSafe<{
      schoolDetails: SchoolDetails;
      themeSettings: ThemeSettings;
      academicYear: string;
      academicYears: string[];
    } | null>("/api/settings/school.php", null);
    const todos = await getSafe<{
      dashboardTodos: string[];
      dashboardNote: string;
    } | null>("/api/dashboard/todos.php", null);

    const academicYear = school?.academicYear ?? "AY 2025-26";
    const academicYears = school?.academicYears?.length
      ? school.academicYears
      : ["AY 2024-25", "AY 2025-26", "AY 2026-27"];

    return {
      students,
      staff,
      payments,
      departments,
      roles,
      classes,
      transportRoutes: routes,
      transportVehicles: vehicles,
      paymentCategories,
      feeTerms,
      tenantUsers: users,
      notifications,
      schoolDetails: school?.schoolDetails ?? { ...EMPTY_SCHOOL_DETAILS },
      themeSettings: school?.themeSettings ?? { ...SEED_THEME_SETTINGS },
      academicYear,
      academicYears,
      // Prefer live API payload (including empty strings) — do not replace with seed copy.
      dashboardTodos: Array.isArray(todos?.dashboardTodos)
        ? todos.dashboardTodos
        : ["", "", "", "", ""],
      dashboardNote: typeof todos?.dashboardNote === "string" ? todos.dashboardNote : "",
      studentYearLedgers: [buildLedgerFromStudents(students, academicYear)],
    };
    } catch (err) {
      if (isAuthExpiredError(err)) return null;
      throw err;
    }
  })().finally(() => {
    if (inflightToken === token) {
      inflightBundle = null;
      inflightToken = null;
    }
  });

  return inflightBundle;
}

/** Offline / no-JWT demo bundle (seeds only). */
export function seedTenantBundle(): RemoteTenantBundle {
  const academicYear = "AY 2025-26";
  return {
    students: SEED_STUDENTS,
    staff: SEED_STAFF,
    payments: SEED_PAYMENTS,
    departments: SEED_DEPARTMENTS,
    roles: SEED_ROLES,
    classes: SEED_CLASSES,
    transportRoutes: SEED_TRANSPORT,
    transportVehicles: SEED_VEHICLES,
    paymentCategories: SEED_PAYMENT_CATEGORIES,
    feeTerms: SEED_FEE_TERMS,
    tenantUsers: [],
    notifications: [...SEED_NOTIFICATIONS],
    schoolDetails: { ...SEED_SCHOOL_DETAILS },
    themeSettings: { ...SEED_THEME_SETTINGS },
    academicYear,
    academicYears: ["AY 2024-25", "AY 2025-26", "AY 2026-27"],
    dashboardTodos: ["", "", "", "", ""],
    dashboardNote: "",
    studentYearLedgers: [buildLedgerFromStudents(SEED_STUDENTS, academicYear)],
  };
}
