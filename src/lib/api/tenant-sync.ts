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

/**
 * Campus workspace payload for branch switches (mini-tenant).
 * Includes branding + settings catalogs scoped by `X-Branch-Id`.
 * Org-wide fields (users, theme, academic years, branches, notifications) are omitted.
 */
export type BranchWorkspaceBundle = BranchOperationalBundle & {
  schoolDetails: SchoolDetails;
  departments: Department[];
  leaveTypes: LeaveType[];
  roles: Role[];
  classes: ClassConfig[];
  paymentCategories: PaymentCategory[];
  feeTerms: FeeTerm[];
  transportRoutes: TransportRoute[];
  transportVehicles: TransportVehicle[];
};

function mapOperationalFromBundle(bundled: TenantBundleApiResponse): BranchOperationalBundle {
  const yearFieldRows = Array.isArray(bundled.yearFieldRows) ? bundled.yearFieldRows : [];
  return {
    students: Array.isArray(bundled.students) ? bundled.students : [],
    staff: Array.isArray(bundled.staff) ? bundled.staff : [],
    payments: Array.isArray(bundled.payments) ? bundled.payments : [],
    dashboardTodos: Array.isArray(bundled.dashboardTodos)
      ? bundled.dashboardTodos
      : ["", "", "", "", ""],
    dashboardNote: typeof bundled.dashboardNote === "string" ? bundled.dashboardNote : "",
    studentYearLedgers: ledgersFromYearFieldRows(yearFieldRows),
    studentFeeBreaks: Array.isArray(bundled.studentFeeBreaks) ? bundled.studentFeeBreaks : [],
  };
}

function mapWorkspaceFromBundle(bundled: TenantBundleApiResponse): BranchWorkspaceBundle {
  return {
    ...mapOperationalFromBundle(bundled),
    schoolDetails: bundled.schoolDetails ?? { ...EMPTY_SCHOOL_DETAILS },
    departments: Array.isArray(bundled.departments) ? bundled.departments : [],
    leaveTypes: Array.isArray(bundled.leaveTypes) ? bundled.leaveTypes : [],
    roles: Array.isArray(bundled.roles) ? bundled.roles : [],
    classes: Array.isArray(bundled.classes) ? bundled.classes : [],
    paymentCategories: Array.isArray(bundled.paymentCategories) ? bundled.paymentCategories : [],
    feeTerms: Array.isArray(bundled.feeTerms) ? bundled.feeTerms : [],
    transportRoutes: Array.isArray(bundled.transportRoutes) ? bundled.transportRoutes : [],
    transportVehicles: Array.isArray(bundled.transportVehicles) ? bundled.transportVehicles : [],
  };
}

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

type YearFieldRow = {
  studentId: string;
  academicYear: string;
  cls: string;
  due: number;
  active: boolean;
};

type TenantBundleApiResponse = {
  schoolDetails?: SchoolDetails;
  themeSettings?: ThemeSettings;
  academicYear?: string;
  academicYears?: string[];
  closedAcademicYears?: string[];
  activeBranchId?: string;
  branches?: unknown[];
  students?: Student[];
  staff?: Staff[];
  payments?: Payment[];
  departments?: Department[];
  leaveTypes?: LeaveType[];
  roles?: Role[];
  classes?: ClassConfig[];
  transportRoutes?: TransportRoute[];
  transportVehicles?: TransportVehicle[];
  paymentCategories?: PaymentCategory[];
  feeTerms?: FeeTerm[];
  studentFeeBreaks?: StudentFeeBreak[];
  tenantUsers?: TenantUser[];
  notifications?: TenantNotification[];
  dashboardTodos?: string[];
  dashboardNote?: string;
  yearFieldRows?: YearFieldRow[];
};

function mapBundleToRemote(
  data: TenantBundleApiResponse,
  options?: { tenantId?: string },
): RemoteTenantBundle {
  const branches = Array.isArray(data.branches)
    ? data.branches.map(normalizeCampusBranch).filter((b): b is CampusBranch => Boolean(b))
    : [];
  const activeBranchId = pickActiveBranchId(
    branches,
    data.activeBranchId ?? null,
    options?.tenantId,
  );
  if (activeBranchId) setActiveBranchPublicId(activeBranchId);

  const academicYear = data.academicYear ?? "AY 2025-26";
  const yearFieldRows = Array.isArray(data.yearFieldRows) ? data.yearFieldRows : [];

  return {
    students: Array.isArray(data.students) ? data.students : [],
    staff: Array.isArray(data.staff) ? data.staff : [],
    payments: Array.isArray(data.payments) ? data.payments : [],
    departments: Array.isArray(data.departments) ? data.departments : [],
    leaveTypes: Array.isArray(data.leaveTypes) ? data.leaveTypes : [],
    roles: Array.isArray(data.roles) ? data.roles : [],
    classes: Array.isArray(data.classes) ? data.classes : [],
    transportRoutes: Array.isArray(data.transportRoutes) ? data.transportRoutes : [],
    transportVehicles: Array.isArray(data.transportVehicles) ? data.transportVehicles : [],
    paymentCategories: Array.isArray(data.paymentCategories) ? data.paymentCategories : [],
    feeTerms: Array.isArray(data.feeTerms) ? data.feeTerms : [],
    studentFeeBreaks: Array.isArray(data.studentFeeBreaks) ? data.studentFeeBreaks : [],
    tenantUsers: Array.isArray(data.tenantUsers) ? data.tenantUsers : [],
    notifications: Array.isArray(data.notifications) ? data.notifications : [],
    schoolDetails: data.schoolDetails ?? { ...EMPTY_SCHOOL_DETAILS },
    themeSettings: data.themeSettings ?? { ...SEED_THEME_SETTINGS },
    academicYear,
    academicYears: data.academicYears?.length
      ? data.academicYears
      : ["AY 2024-25", "AY 2025-26", "AY 2026-27"],
    closedAcademicYears: Array.isArray(data.closedAcademicYears)
      ? data.closedAcademicYears.filter((y) => typeof y === "string" && y.trim())
      : [],
    dashboardTodos: Array.isArray(data.dashboardTodos)
      ? data.dashboardTodos
      : ["", "", "", "", ""],
    dashboardNote: typeof data.dashboardNote === "string" ? data.dashboardNote : "",
    branches,
    activeBranchId,
    studentYearLedgers: ledgersFromYearFieldRows(yearFieldRows),
  };
}

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

function isAbortLike(err: unknown): boolean {
  return (
    (typeof DOMException !== "undefined" &&
      err instanceof DOMException &&
      err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

function isTimeoutApiError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 0;
}

async function getSafe<T>(
  path: string,
  fallback: T,
  requestOptions?: { timeoutMs?: number; signal?: AbortSignal },
): Promise<T> {
  if (isUnauthorizedNotified()) {
    throw new ApiError("Unauthorized: Token expired", 401);
  }
  if (requestOptions?.signal?.aborted) {
    throw new ApiError("Request timed out — API may be unreachable", 0);
  }
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await apiRequest<T>(path, {
        timeoutMs: requestOptions?.timeoutMs,
        signal: requestOptions?.signal,
      });
    } catch (err) {
      // Never soft-fallback on auth failure — caller must abort hydration.
      if (isAuthExpiredError(err)) throw err;
      if (requestOptions?.signal?.aborted || isAbortLike(err)) throw err;

      const msg = err instanceof Error ? err.message : String(err);
      const retryable =
        /2002|Operation not permitted|Connection refused|Too many connections/i.test(msg);
      if (retryable && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 250 * attempt));
        if (requestOptions?.signal?.aborted) {
          throw new ApiError("Request timed out — API may be unreachable", 0);
        }
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
 * Prefers single bundle request; falls back to parallel per-endpoint calls.
 * @deprecated Prefer {@link fetchBranchWorkspaceBundle} for full campus isolation.
 */
export async function fetchBranchOperationalBundle(): Promise<BranchOperationalBundle | null> {
  const workspace = await fetchBranchWorkspaceBundle();
  if (!workspace) return null;
  const {
    students,
    staff,
    payments,
    dashboardTodos,
    dashboardNote,
    studentYearLedgers,
    studentFeeBreaks,
  } = workspace;
  return {
    students,
    staff,
    payments,
    dashboardTodos,
    dashboardNote,
    studentYearLedgers,
    studentFeeBreaks,
  };
}

/**
 * Full campus workspace for branch switches (branding + catalogs + books).
 * Prefer `bundle.php?scope=workspace`; fall back to operational + parallel settings GETs.
 *
 * ## Backend contract (api.feezo.app — PHP not in this repo)
 *
 * Authenticated requests send `X-Branch-Id` (see `branch-context.ts`).
 *
 * Required for campus isolation to persist after save:
 * 1. `GET|PUT /api/settings/school.php` — `schoolDetails` (logo/name/letterhead/seal/signature)
 *    is **per campus**; `themeSettings` / academic year fields remain **tenant-wide**.
 * 2. Catalog endpoints (`classes`, `departments`, `leave-types`, `roles`, `fees`, `transport`)
 *    already filter by `X-Branch-Id` (same as branch `copyFromId` seeding).
 * 3. `GET /api/tenant/bundle.php?scope=workspace` should return operational books **plus**
 *    `schoolDetails` and the catalogs above (omit tenantUsers / theme / academicYears /
 *    branches / notifications). Until deployed, the client falls back to
 *    `scope=operational` + parallel settings GETs.
 * 4. `POST /api/settings/branches.php` with `copyFromId` should copy School Details branding
 *    along with classes/departments/positions/fee catalogs (students/receipts stay empty).
 */
export async function fetchBranchWorkspaceBundle(): Promise<BranchWorkspaceBundle | null> {
  const token = getApiToken();
  if (!token) return null;

  try {
    const workspaceBundled = await getSafe<TenantBundleApiResponse | null>(
      "/api/tenant/bundle.php?scope=workspace",
      null,
    );
    if (
      workspaceBundled &&
      Array.isArray(workspaceBundled.students) &&
      workspaceBundled.schoolDetails
    ) {
      return mapWorkspaceFromBundle(workspaceBundled);
    }

    const operationalBundled = await getSafe<TenantBundleApiResponse | null>(
      "/api/tenant/bundle.php?scope=operational",
      null,
    );

    let operational: BranchOperationalBundle | null = null;
    if (operationalBundled && Array.isArray(operationalBundled.students)) {
      operational = mapOperationalFromBundle(operationalBundled);
    } else {
      const [students, staff, payments, feeBreaks, yearFields, todos] = await Promise.all([
        getSafe<Student[]>("/api/students/list.php?includeDeleted=1", []),
        getSafe<Staff[]>("/api/staff/list.php?includeDeleted=1", []),
        getSafe<Payment[]>("/api/finance/payments.php", []),
        getSafe<StudentFeeBreak[]>("/api/finance/fee-breaks.php", []),
        getSafe<YearFieldRow[]>("/api/students/year-fields.php", []),
        getSafe<{ dashboardTodos: string[]; dashboardNote: string } | null>(
          "/api/dashboard/todos.php",
          null,
        ),
      ]);
      operational = {
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
    }

    const [
      school,
      departments,
      leaveTypes,
      roles,
      classes,
      feeTerms,
      paymentCategories,
      routes,
      vehicles,
    ] = await Promise.all([
      getSafe<{ schoolDetails?: SchoolDetails } | null>("/api/settings/school.php", null),
      getSafe<Department[]>("/api/settings/departments.php", []),
      getSafe<LeaveType[]>("/api/settings/leave-types.php", []),
      getSafe<Role[]>("/api/settings/roles.php", []),
      getSafe<ClassConfig[]>("/api/settings/classes.php", []),
      getSafe<FeeTerm[]>("/api/settings/fees.php", []),
      getSafe<PaymentCategory[]>("/api/settings/fees.php?resource=categories", []),
      getSafe<TransportRoute[]>("/api/settings/transport.php", []),
      getSafe<TransportVehicle[]>("/api/settings/transport.php?type=vehicles", []),
    ]);

    return {
      ...operational,
      schoolDetails: school?.schoolDetails ?? { ...EMPTY_SCHOOL_DETAILS },
      departments,
      leaveTypes,
      roles,
      classes,
      paymentCategories,
      feeTerms,
      transportRoutes: routes,
      transportVehicles: vehicles,
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

/** Max wait for the tenant hydrate — avoids skeleton lock when API is down. */
const BUNDLE_HYDRATE_TIMEOUT_MS = 28_000;
/** Give the single bundle request almost the full hydrate window (don't abort at 12s then start sequential). */
const BUNDLE_REQUEST_TIMEOUT_MS = BUNDLE_HYDRATE_TIMEOUT_MS - 2_000;

async function loadRemoteTenantBundleSequential(
  options?: { tenantId?: string; signal?: AbortSignal },
): Promise<RemoteTenantBundle | null> {
  const safe = <T>(path: string, fallback: T) =>
    getSafe<T>(path, fallback, { signal: options?.signal });
  try {
    const school = await safe<{
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
          : ((
              await safe<{ branches?: unknown[]; activeBranchId?: string }>(
                "/api/settings/branches.php",
                { branches: [] },
              )
            ).branches
              ?.map(normalizeCampusBranch)
              .filter((b): b is CampusBranch => Boolean(b)) ?? []);
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
      const students = await safe<Student[]>("/api/students/list.php?includeDeleted=1", []);
      const yearFieldRows = await safe<YearFieldRow[]>("/api/students/year-fields.php", []);
      const staff = await safe<Staff[]>("/api/staff/list.php?includeDeleted=1", []);
      const payments = await safe<Payment[]>("/api/finance/payments.php", []);
      const departments = await safe<Department[]>("/api/settings/departments.php", []);
      const leaveTypes = await safe<LeaveType[]>("/api/settings/leave-types.php", []);
      const roles = await safe<Role[]>("/api/settings/roles.php", []);
      const classes = await safe<ClassConfig[]>("/api/settings/classes.php", []);

      const feeTerms = await safe<FeeTerm[]>(
        `/api/settings/fees.php?academicYear=${encodeURIComponent(academicYear)}`,
        [],
      );
      const allFeeTerms =
        feeTerms.length > 0
          ? await safe<FeeTerm[]>("/api/settings/fees.php", feeTerms)
          : feeTerms;
      const paymentCategories = await safe<PaymentCategory[]>(
        "/api/settings/fees.php?resource=categories",
        [],
      );
      const studentFeeBreaks = await safe<StudentFeeBreak[]>("/api/finance/fee-breaks.php", []);
      const routes = await safe<TransportRoute[]>("/api/settings/transport.php", []);
      const vehicles = await safe<TransportVehicle[]>(
        "/api/settings/transport.php?type=vehicles",
        [],
      );
      const users = await safe<TenantUser[]>("/api/settings/users.php", []);
      const notifications = await safe<TenantNotification[]>("/api/notifications/list.php", []);
      const todos = await safe<{
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
      if (options?.signal?.aborted || isAbortLike(err) || isTimeoutApiError(err)) return null;
      throw err;
    }
}

async function loadRemoteTenantBundle(
  options?: { tenantId?: string; signal?: AbortSignal },
): Promise<RemoteTenantBundle | null> {
  const signal = options?.signal;
  try {
    const bundled = await apiRequest<TenantBundleApiResponse>("/api/tenant/bundle.php", {
      timeoutMs: BUNDLE_REQUEST_TIMEOUT_MS,
      signal,
    });
    if (bundled && Array.isArray(bundled.students) && bundled.schoolDetails) {
      return mapBundleToRemote(bundled, options);
    }
  } catch (err) {
    if (isAuthExpiredError(err)) return null;
    if (signal?.aborted || isAbortLike(err)) return null;
    if (isTimeoutApiError(err)) {
      console.warn("[api] tenant bundle hydrate timed out — using local fallback");
      return null;
    }
    console.warn("[api] tenant bundle endpoint unavailable — falling back to sequential hydrate", err);
  }
  if (signal?.aborted) return null;
  return loadRemoteTenantBundleSequential(options);
}

export async function fetchRemoteTenantBundle(
  signal?: AbortSignal,
  options?: { force?: boolean; tenantId?: string },
): Promise<RemoteTenantBundle | null> {
  const token = getApiToken();
  if (!token) return null;
  if (!options?.force && inflightBundle && inflightKey === token) return inflightBundle;

  inflightKey = token;
  const timeoutController = new AbortController();
  const onCallerAbort = () => timeoutController.abort();
  if (signal) {
    if (signal.aborted) timeoutController.abort();
    else signal.addEventListener("abort", onCallerAbort, { once: true });
  }

  let timeoutId: number | undefined;
  inflightBundle = Promise.race([
    loadRemoteTenantBundle({ tenantId: options?.tenantId, signal: timeoutController.signal }),
    new Promise<RemoteTenantBundle | null>((resolve) => {
      timeoutId = window.setTimeout(() => {
        if (!timeoutController.signal.aborted) {
          timeoutController.abort();
          console.warn("[api] tenant bundle hydrate timed out — using local fallback");
        }
        resolve(null);
      }, BUNDLE_HYDRATE_TIMEOUT_MS);
    }),
  ]).finally(() => {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onCallerAbort);
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
