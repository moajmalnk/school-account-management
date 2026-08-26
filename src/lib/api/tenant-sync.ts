import {
  ApiError,
  apiRequest,
  getApiToken,
  isAuthExpiredError,
  isUnauthorizedNotified,
} from "@/lib/api/client";
import {
  SEED_BRANCHES,
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
  type CampusBranch,
  type ClassConfig,
  type Department,
  type FeeTerm,
  type LeaveType,
  type Payment,
  type PaymentCategory,
  type Role,
  type SchoolDetails,
  type Staff,
  type Student,
  type StudentFeeBreak,
  type TenantNotification,
  type TenantUser,
  type ThemeSettings,
  type TransportRoute,
  type TransportVehicle,
  normalizeCampusBranch,
} from "@/lib/tenant-store";
import {
  buildLedgerFromStudents,
  ledgersFromYearFieldRows,
  type StudentYearLedger,
} from "@/lib/academic-year";
import { readStoredBranchPublicId, setActiveBranchPublicId } from "@/lib/branch-context";

export type BranchOperationalBundle = {
  students: Student[];
  staff: Staff[];
  payments: Payment[];
  dashboardTodos: string[];
  dashboardNote: string;
  studentYearLedgers: StudentYearLedger[];
  studentFeeBreaks: StudentFeeBreak[];
};

export type RemoteTenantBundle = {
  students: Student[];
  staff: Staff[];
  payments: Payment[];
  departments: Department[];
  leaveTypes: LeaveType[];
  roles: Role[];
  classes: ClassConfig[];
  transportRoutes: TransportRoute[];
  transportVehicles: TransportVehicle[];
  paymentCategories: PaymentCategory[];
  feeTerms: FeeTerm[];
  studentFeeBreaks: StudentFeeBreak[];
  tenantUsers: TenantUser[];
  notifications: TenantNotification[];
  schoolDetails: SchoolDetails;
  themeSettings: ThemeSettings;
  academicYear: string;
  academicYears: string[];
  closedAcademicYears: string[];
  dashboardTodos: string[];
  dashboardNote: string;
  branches: CampusBranch[];
  activeBranchId: string;
  /** Year enrollments — prefer server rows so every device sees the same roster. */
  studentYearLedgers: StudentYearLedger[];
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
let inflightKey: string | null = null;
/** Bumped when branches are edited locally so stale hydrates keep the new names. */
let branchCatalogWriteEpoch = 0;

/** Clear cached tenant bundle fetches after branch catalog edits. */
export function invalidateRemoteTenantBundleCache(): void {
  inflightBundle = null;
  inflightKey = null;
  branchCatalogWriteEpoch += 1;
}

export function branchCatalogWriteEpochValue(): number {
  return branchCatalogWriteEpoch;
}

function pickActiveBranchId(
  branches: CampusBranch[],
  serverActive: string | null | undefined,
  tenantId?: string,
): string {
  const stored = readStoredBranchPublicId(tenantId);
  if (stored && branches.some((b) => b.id === stored)) return stored;
  if (serverActive && branches.some((b) => b.id === serverActive)) return serverActive;
  return branches[0]?.id ?? "";
}

/**
 * Fast branch-scoped operational data for campus switches.
 * Four parallel calls — students, staff, payments, dashboard todos.
 */
export async function fetchBranchOperationalBundle(): Promise<BranchOperationalBundle | null> {
  const token = getApiToken();
  if (!token) return null;

  try {
    const [students, staff, payments, feeBreaks, yearFields, todos] = await Promise.all([
      getSafe<Student[]>("/api/students/list.php?includeDeleted=1", []),
      getSafe<Staff[]>("/api/staff/list.php?includeDeleted=1", []),
      getSafe<Payment[]>("/api/finance/payments.php", []),
      getSafe<StudentFeeBreak[]>("/api/finance/fee-breaks.php", []),
      getSafe<
        Array<{
          studentId: string;
          academicYear: string;
          cls: string;
          due: number;
          active: boolean;
        }>
      >("/api/students/year-fields.php", []),
      getSafe<{ dashboardTodos: string[]; dashboardNote: string } | null>(
        "/api/dashboard/todos.php",
        null,
      ),
    ]);

    return {
      students,
      staff,
      payments,
      dashboardTodos: Array.isArray(todos?.dashboardTodos)
        ? todos.dashboardTodos
        : ["", "", "", "", ""],
      dashboardNote: typeof todos?.dashboardNote === "string" ? todos.dashboardNote : "",
      studentYearLedgers: ledgersFromYearFieldRows(Array.isArray(yearFields) ? yearFields : []),
      studentFeeBreaks: Array.isArray(feeBreaks) ? feeBreaks : [],
    };
  } catch (err) {
    if (isAuthExpiredError(err)) return null;
    throw err;
  }
}

/**
 * Load tenant workspace data from production API when a JWT is present.
 * Empty lists are kept empty — do NOT substitute mock/seed data for a live school
 * (new tenants would otherwise show Silver Hills demo rows).
 * Requests run one-at-a-time — Hostinger shared MySQL drops sockets under storms
 * (SQLSTATE[HY000] [2002] Operation not permitted).
 */
export async function fetchRemoteTenantBundle(
  signal?: AbortSignal,
  options?: { force?: boolean; tenantId?: string },
): Promise<RemoteTenantBundle | null> {
  const token = getApiToken();
  if (!token) return null;
  const cacheKey = `${token}|${options?.force ? Date.now() : "hydrate"}`;
  if (!options?.force && inflightBundle && inflightKey === token) return inflightBundle;

  inflightKey = token;
  inflightBundle = (async (): Promise<RemoteTenantBundle | null> => {
    void signal;
    void cacheKey;

    try {
    const school = await getSafe<{
      schoolDetails: SchoolDetails;
      themeSettings: ThemeSettings;
      academicYear: string;
      academicYears: string[];
      closedAcademicYears?: string[];
      activeBranchId?: string;
      branches?: unknown[];
    } | null>("/api/settings/school.php", null);

    const fromSchool = Array.isArray(school?.branches)
      ? school!.branches.map(normalizeCampusBranch).filter((b): b is CampusBranch => Boolean(b))
      : [];
    const listed =
      fromSchool.length > 0
        ? fromSchool
        : (await getSafe<{ branches?: unknown[]; activeBranchId?: string }>(
            "/api/settings/branches.php",
            { branches: [] },
          )).branches?.map(normalizeCampusBranch).filter((b): b is CampusBranch => Boolean(b)) ?? [];
    const branches = listed.length ? listed : [];
    const activeBranchId = pickActiveBranchId(
      branches,
      school?.activeBranchId ?? null,
      options?.tenantId,
    );
    if (activeBranchId) setActiveBranchPublicId(activeBranchId);

    const academicYear = school?.academicYear ?? "AY 2025-26";
    const academicYears = school?.academicYears?.length
      ? school.academicYears
      : ["AY 2024-25", "AY 2025-26", "AY 2026-27"];
    const closedAcademicYears = Array.isArray(school?.closedAcademicYears)
      ? school.closedAcademicYears.filter((y) => typeof y === "string" && y.trim())
      : [];

    // Sequential on purpose — do not Promise.all these on shared hosting.
    const students = await getSafe<Student[]>(
      "/api/students/list.php?includeDeleted=1",
      [],
    );
    const yearFieldRows = await getSafe<
      Array<{
        studentId: string;
        academicYear: string;
        cls: string;
        due: number;
        active: boolean;
      }>
    >("/api/students/year-fields.php", []);
    const staff = await getSafe<Staff[]>("/api/staff/list.php?includeDeleted=1", []);
    const payments = await getSafe<Payment[]>("/api/finance/payments.php", []);
    const departments = await getSafe<Department[]>(
      "/api/settings/departments.php",
      [],
    );
    const leaveTypes = await getSafe<LeaveType[]>(
      "/api/settings/leave-types.php",
      [],
    );
    const roles = await getSafe<Role[]>("/api/settings/roles.php", []);
    const classes = await getSafe<ClassConfig[]>(
      "/api/settings/classes.php",
      [],
    );

    const feeTerms = await getSafe<FeeTerm[]>(
      `/api/settings/fees.php?academicYear=${encodeURIComponent(academicYear)}`,
      [],
    );
    const allFeeTerms =
      feeTerms.length > 0
        ? await getSafe<FeeTerm[]>("/api/settings/fees.php", feeTerms)
        : feeTerms;
    const paymentCategories = await getSafe<PaymentCategory[]>(
      "/api/settings/fees.php?resource=categories",
      [],
    );
    const studentFeeBreaks = await getSafe<StudentFeeBreak[]>(
      "/api/finance/fee-breaks.php",
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
    const todos = await getSafe<{
      dashboardTodos: string[];
      dashboardNote: string;
    } | null>("/api/dashboard/todos.php", null);

    return {
      students,
      staff,
      payments,
      departments,
      leaveTypes,
      roles,
      classes,
      transportRoutes: routes,
      transportVehicles: vehicles,
      paymentCategories,
      feeTerms: allFeeTerms,
      studentFeeBreaks: Array.isArray(studentFeeBreaks) ? studentFeeBreaks : [],
      tenantUsers: users,
      notifications,
      schoolDetails: school?.schoolDetails ?? { ...EMPTY_SCHOOL_DETAILS },
      themeSettings: school?.themeSettings ?? { ...SEED_THEME_SETTINGS },
      academicYear,
      academicYears,
      closedAcademicYears,
      dashboardTodos: Array.isArray(todos?.dashboardTodos)
        ? todos.dashboardTodos
        : ["", "", "", "", ""],
      dashboardNote: typeof todos?.dashboardNote === "string" ? todos.dashboardNote : "",
      branches,
      activeBranchId,
      studentYearLedgers: ledgersFromYearFieldRows(
        Array.isArray(yearFieldRows) ? yearFieldRows : [],
      ),
    };
    } catch (err) {
      if (isAuthExpiredError(err)) return null;
      throw err;
    }
  })().finally(() => {
    if (inflightKey === token) {
      inflightBundle = null;
      inflightKey = null;
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
    leaveTypes: [],
    roles: SEED_ROLES,
    classes: SEED_CLASSES,
    transportRoutes: SEED_TRANSPORT,
    transportVehicles: SEED_VEHICLES,
    paymentCategories: SEED_PAYMENT_CATEGORIES,
    feeTerms: SEED_FEE_TERMS,
    studentFeeBreaks: [],
    tenantUsers: [],
    notifications: [...SEED_NOTIFICATIONS],
    schoolDetails: { ...SEED_SCHOOL_DETAILS },
    themeSettings: { ...SEED_THEME_SETTINGS },
    academicYear,
    academicYears: ["AY 2024-25", "AY 2025-26", "AY 2026-27"],
    closedAcademicYears: [],
    dashboardTodos: ["", "", "", "", ""],
    dashboardNote: "",
    branches: [...SEED_BRANCHES],
    activeBranchId: SEED_BRANCHES[0]?.id ?? "",
    studentYearLedgers: [buildLedgerFromStudents(SEED_STUDENTS, academicYear)],
  };
}
