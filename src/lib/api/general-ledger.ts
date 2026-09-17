import { ApiError, apiRequest, getApiToken } from "@/lib/api/client";

export type GlSector =
  | "assets"
  | "liabilities"
  | "equity"
  | "income"
  | "expenses"
  | "other";

export type GlAccountGroup = {
  id: string;
  sector: GlSector | string;
  name: string;
  uid: string;
  nature: string;
  sortOrder: number;
  isSystem: boolean;
  accounts?: GlAccount[];
};

/** Matches backend `gl_default_account_groups()` so the picker works before Hostinger GL tables exist. */
const GL_DEFAULT_GROUP_SEED: Array<{
  sector: GlSector;
  name: string;
  uid: string;
  nature: string;
  sort: number;
}> = [
  { sector: "assets", name: "Bank Accounts", uid: "Bank Acc", nature: "asset", sort: 10 },
  { sector: "assets", name: "Bank OD A/c", uid: "Bank OD", nature: "asset", sort: 20 },
  { sector: "assets", name: "Cash-in-Hand", uid: "Cash-in-", nature: "asset", sort: 30 },
  { sector: "assets", name: "Current Assets", uid: "Current", nature: "asset", sort: 40 },
  { sector: "assets", name: "Deposits (Asset)", uid: "Deposits", nature: "asset", sort: 50 },
  { sector: "assets", name: "Fixed Assets", uid: "Fixed As", nature: "asset", sort: 60 },
  { sector: "assets", name: "Investments", uid: "Investme", nature: "asset", sort: 70 },
  { sector: "assets", name: "Loans & Advances (Asset)", uid: "Loans &", nature: "asset", sort: 80 },
  { sector: "assets", name: "Misc. Expenses (Asset)", uid: "Misc. Ex", nature: "asset", sort: 90 },
  { sector: "assets", name: "Sundry Debtors", uid: "Sundry D", nature: "asset", sort: 100 },
  { sector: "liabilities", name: "Current Liabilities", uid: "Current L", nature: "liability", sort: 110 },
  { sector: "liabilities", name: "Duties & Taxes", uid: "Duties &", nature: "liability", sort: 120 },
  { sector: "liabilities", name: "Loans (Liability)", uid: "Loans (L", nature: "liability", sort: 130 },
  { sector: "liabilities", name: "Provisions", uid: "Provisio", nature: "liability", sort: 140 },
  { sector: "liabilities", name: "Secured Loans", uid: "Secured", nature: "liability", sort: 150 },
  { sector: "liabilities", name: "Sundry Creditors", uid: "Sundry C", nature: "liability", sort: 160 },
  { sector: "liabilities", name: "Unsecured Loans", uid: "Unsecure", nature: "liability", sort: 170 },
  { sector: "equity", name: "Capital Account", uid: "Capital", nature: "equity", sort: 180 },
  { sector: "equity", name: "Drawings", uid: "Drawings", nature: "equity", sort: 190 },
  { sector: "equity", name: "Reserves & Surplus", uid: "Reserves", nature: "equity", sort: 200 },
  { sector: "equity", name: "Retained Earnings", uid: "Retained", nature: "equity", sort: 210 },
  { sector: "income", name: "Direct Incomes", uid: "Direct I", nature: "income", sort: 220 },
  { sector: "income", name: "Indirect Incomes", uid: "Indirect I", nature: "income", sort: 230 },
  { sector: "income", name: "Sales Accounts", uid: "Sales Ac", nature: "income", sort: 240 },
  { sector: "expenses", name: "Direct Expenses", uid: "Direct E", nature: "expense", sort: 250 },
  { sector: "expenses", name: "Indirect Expenses", uid: "Indirect E", nature: "expense", sort: 260 },
  { sector: "expenses", name: "Purchase Accounts", uid: "Purchase", nature: "expense", sort: 270 },
  { sector: "other", name: "Suspense A/c", uid: "Suspense", nature: "other", sort: 280 },
];

export const GL_SECTORS: GlSector[] = [
  "assets",
  "liabilities",
  "equity",
  "income",
  "expenses",
  "other",
];

export function defaultGlAccountGroups(): GlAccountGroup[] {
  return GL_DEFAULT_GROUP_SEED.map((g) => ({
    id: g.uid,
    sector: g.sector,
    name: g.name,
    uid: g.uid,
    nature: g.nature,
    sortOrder: g.sort,
    isSystem: true,
    accounts: [],
  }));
}

export type GlAccount = {
  id: string;
  groupId: string | null;
  groupName: string;
  sector: string;
  nature: string;
  code: string;
  name: string;
  isCash: boolean;
  isBank: boolean;
  bankName?: string | null;
  bankAccountNo?: string | null;
  bankIfsc?: string | null;
  bankBranch?: string | null;
  bankAccountHolder?: string | null;
  bankAccountType?: string | null;
  bankAddress?: string | null;
  bankCity?: string | null;
  bankState?: string | null;
  bankMicr?: string | null;
  isPartyStudent: boolean;
  isPartyStaff: boolean;
  isSystem: boolean;
  active: boolean;
  sortOrder: number;
};

export type GlJournalLine = {
  accountId: string;
  accountName?: string;
  accountCode?: string;
  debit: number;
  credit: number;
  partyType?: string | null;
  partyId?: string | null;
  description?: string | null;
};

export type GlJournal = {
  id: string;
  voucherType: string;
  voucherNo: string;
  date: string;
  academicYear?: string | null;
  narration?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  isLocked: boolean;
  isVoid: boolean;
  lines?: GlJournalLine[];
  totalDebit?: number;
  totalCredit?: number;
  createdAt?: string | null;
};

export type GlTrialBalanceRow = {
  accountId: string;
  code: string;
  name: string;
  groupName: string;
  sector: string;
  nature: string;
  debit: number;
  credit: number;
};

export type GlAccountLedger = {
  account: GlAccount;
  openingBalance: number;
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
  lines: Array<{
    date: string;
    voucherNo: string;
    voucherType: string;
    entryId: string;
    narration: string;
    debit: number;
    credit: number;
    balance: number;
  }>;
};

export type GlPeriod = {
  yearLabel: string;
  status: "open" | "closed" | string;
  closedAt?: string | null;
  reopenNote?: string | null;
};

function hasToken() {
  return Boolean(getApiToken());
}

/**
 * GL transport:
 * - "direct": `/api/finance/chart.php` (preferred when file exists with CORS)
 * - "reports": `/api/finance/reports.php?gl=chart|journals|periods`
 */
type GlTransport = "direct" | "reports";
let glTransport: GlTransport = "direct";

const GL_UNAVAILABLE_KEY = "feezo.gl.mutateUnavailable";

function readGlUnavailableFlag(): boolean {
  try {
    return sessionStorage.getItem(GL_UNAVAILABLE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeGlUnavailableFlag(value: boolean) {
  try {
    if (value) sessionStorage.setItem(GL_UNAVAILABLE_KEY, "1");
    else sessionStorage.removeItem(GL_UNAVAILABLE_KEY);
  } catch {
    /* ignore */
  }
}

/** After 404/405/503 on GL mutate, skip further POSTs this session (stops console spam). */
let glMutateUnavailable = readGlUnavailableFlag();

function glDirectPath(
  resource: "chart" | "journals" | "periods",
  params?: Record<string, string | undefined>,
): string {
  const q = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) q.set(key, value);
    }
  }
  const qs = q.toString();
  return `/api/finance/${resource}.php${qs ? `?${qs}` : ""}`;
}

function glReportsProxyPath(
  resource: "chart" | "journals" | "periods",
  params?: Record<string, string | undefined>,
): string {
  const q = new URLSearchParams();
  q.set("gl", resource);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) q.set(key, value);
    }
  }
  return `/api/finance/reports.php?${q}`;
}

function glResourcePath(
  resource: "chart" | "journals" | "periods",
  params?: Record<string, string | undefined>,
): string {
  return glTransport === "direct"
    ? glDirectPath(resource, params)
    : glReportsProxyPath(resource, params);
}

async function glGet<T>(
  resource: "chart" | "journals" | "periods",
  params: Record<string, string | undefined> | undefined,
  fallback: T,
): Promise<T> {
  if (!hasToken()) return fallback;
  try {
    return (await apiRequest<unknown>(glResourcePath(resource, params))) as T;
  } catch {
    if (glTransport === "direct") {
      try {
        glTransport = "reports";
        return (await apiRequest<unknown>(glResourcePath(resource, params))) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

async function glSafe<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch {
    return fallback;
  }
}

const GL_NOT_INSTALLED =
  "General ledger tables are missing. Import sql/schema_general_ledger.sql in phpMyAdmin, then tap Update all books.";

const GL_INSTALL_HINT =
  "phpMyAdmin → import sql/schema_general_ledger.sql, then re-upload chart.php + general_ledger.php if Sync still fails (see backend/UPLOAD_GENERAL_LEDGER.txt).";

function markGlUnavailable(status?: number) {
  if (status === 405 || status === 503 || status === 404) {
    glMutateUnavailable = true;
    writeGlUnavailableFlag(true);
  }
}

/** True when Sync/Fill should not hammer a missing GL install. */
export function isGlMutateUnavailable(): boolean {
  return glMutateUnavailable || readGlUnavailableFlag();
}

/** After uploading PHP / importing SQL, call this (or hard-refresh) before Sync. */
export function resetGlTransportProbe(): void {
  glTransport = "direct";
  glMutateUnavailable = false;
  writeGlUnavailableFlag(false);
}

/** Force reports.php?gl= proxy (legacy). */
export function preferReportsGlProxy(): void {
  glTransport = "reports";
  glMutateUnavailable = false;
  writeGlUnavailableFlag(false);
}

/**
 * Prefer dedicated chart.php once uploaded.
 */
export function preferDirectGlEndpoints(): void {
  glTransport = "direct";
  glMutateUnavailable = false;
  writeGlUnavailableFlag(false);
}

async function glMutate<T>(run: () => Promise<T>): Promise<T> {
  if (isGlMutateUnavailable()) {
    throw new ApiError(GL_NOT_INSTALLED, 503);
  }
  try {
    return await run();
  } catch (e) {
    if (e instanceof ApiError && (e.status === 405 || e.status === 503 || e.status === 404)) {
      markGlUnavailable(e.status);
      throw new ApiError(GL_NOT_INSTALLED, e.status);
    }
    throw e;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function apiGlChartTree(): Promise<{
  sectors: string[];
  groups: GlAccountGroup[];
}> {
  const fallback = { sectors: GL_SECTORS as string[], groups: defaultGlAccountGroups() };
  const data = await glGet<unknown>("chart", { resource: "tree" }, fallback);
  if (!isRecord(data) || !Array.isArray(data.groups) || data.groups.length === 0) {
    return fallback;
  }
  return {
    sectors: Array.isArray(data.sectors) ? (data.sectors as string[]) : GL_SECTORS,
    groups: data.groups as GlAccountGroup[],
  };
}

export async function apiGlListAccounts(activeOnly = true): Promise<GlAccount[]> {
  const data = await glGet<unknown>("chart", { active: activeOnly ? "1" : "0" }, []);
  return Array.isArray(data) ? (data as GlAccount[]) : [];
}

export async function apiGlCreateAccount(body: {
  name: string;
  groupId: string;
  code?: string;
  openingBalance?: number;
  openingDate?: string;
  academicYear?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankBranch?: string;
  bankAccountHolder?: string;
  bankAccountType?: string;
  bankAddress?: string;
  bankCity?: string;
  bankState?: string;
  bankMicr?: string;
}): Promise<GlAccount> {
  return glMutate(() => apiRequest(glResourcePath("chart"), { method: "POST", body }));
}

export async function apiGlUpdateAccount(
  id: string,
  body: Partial<GlAccount> & {
    groupId?: string;
    bankName?: string | null;
    bankAccountNo?: string | null;
    bankIfsc?: string | null;
    bankBranch?: string | null;
    bankAccountHolder?: string | null;
    bankAccountType?: string | null;
    bankAddress?: string | null;
    bankCity?: string | null;
    bankState?: string | null;
    bankMicr?: string | null;
  },
): Promise<GlAccount> {
  return glMutate(() =>
    apiRequest(glResourcePath("chart"), {
      method: "PUT",
      body: { id, ...body },
    }),
  );
}

export async function apiGlDeleteAccount(id: string): Promise<GlAccount> {
  return apiGlUpdateAccount(id, { active: false });
}

export async function apiGlBackfill(): Promise<{
  payments: number;
  disbursements: number;
  skipped: number;
}> {
  return glMutate(() =>
    apiRequest(glResourcePath("chart"), {
      method: "POST",
      body: { _backfill: true },
    }),
  );
}

/** Mirror expense ledgers + fee categories into the chart of accounts (no-op if GL not installed). */
export async function apiGlSyncCatalogs(): Promise<boolean> {
  if (!hasToken() || isGlMutateUnavailable()) return false;
  try {
    await apiRequest(glResourcePath("chart"), {
      method: "POST",
      body: { _sync: true },
    });
    return true;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404 && glTransport === "direct") {
      preferReportsGlProxy();
      try {
        await apiRequest(glResourcePath("chart"), {
          method: "POST",
          body: { _sync: true },
        });
        return true;
      } catch (e2) {
        if (e2 instanceof ApiError) markGlUnavailable(e2.status);
        return false;
      }
    }
    if (e instanceof ApiError) markGlUnavailable(e.status);
    return false;
  }
}

/**
 * Sync Receive/Make Payment ledgers into the chart, then post historical receipts & payments
 * as journals so Journals / Trial balance / P&L / Balance sheet fill in.
 */
export async function apiGlUpdateAllBooks(): Promise<{
  payments: number;
  disbursements: number;
  skipped: number;
}> {
  if (!hasToken()) {
    throw new ApiError("Sign in to update finance books", 401);
  }
  resetGlTransportProbe();
  const synced = await apiGlSyncCatalogs();
  if (!synced) {
    throw new ApiError(GL_NOT_INSTALLED, 503);
  }
  return apiGlBackfill();
}

export function glInstallHint(): string {
  return GL_INSTALL_HINT;
}

export async function apiGlListJournals(params?: {
  from?: string;
  to?: string;
  academicYear?: string;
  voucherType?: string;
}): Promise<GlJournal[]> {
  const data = await glGet<unknown>(
    "journals",
    {
      from: params?.from,
      to: params?.to,
      academicYear: params?.academicYear,
      voucherType: params?.voucherType,
    },
    [],
  );
  return Array.isArray(data) ? (data as GlJournal[]) : [];
}

export async function apiGlCreateJournal(body: {
  voucherType: string;
  date: string;
  academicYear?: string;
  narration?: string;
  lines: Array<{ accountId: string; debit: number; credit: number; description?: string }>;
}): Promise<GlJournal> {
  return glMutate(() => apiRequest(glResourcePath("journals"), { method: "POST", body }));
}

export async function apiGlUpdateJournal(body: {
  id: string;
  date: string;
  academicYear?: string;
  narration?: string;
  lines: Array<{ accountId: string; debit: number; credit: number; description?: string }>;
}): Promise<GlJournal> {
  return glMutate(() =>
    apiRequest(glResourcePath("journals"), {
      method: "POST",
      body: { _update: true, ...body },
    }),
  );
}

export async function apiGlVoidJournal(id: string): Promise<GlJournal> {
  return glMutate(() =>
    apiRequest(glResourcePath("journals"), {
      method: "POST",
      body: { _void: true, id },
    }),
  );
}

function glReportsQuery(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) q.set(key, value);
  }
  return `/api/finance/reports.php?${q}`;
}

export async function apiGlReportTrialBalance(params?: {
  from?: string;
  to?: string;
  academicYear?: string;
}): Promise<{
  rows: GlTrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
}> {
  if (!hasToken()) return { rows: [], totalDebit: 0, totalCredit: 0, balanced: true };
  const data = await apiRequest<unknown>(
    glReportsQuery({
      report: "trialBalance",
      from: params?.from,
      to: params?.to,
      academicYear: params?.academicYear,
    }),
  );
  if (!isRecord(data) || !Array.isArray(data.rows)) {
    return { rows: [], totalDebit: 0, totalCredit: 0, balanced: true };
  }
  return {
    rows: data.rows as GlTrialBalanceRow[],
    totalDebit: Number(data.totalDebit) || 0,
    totalCredit: Number(data.totalCredit) || 0,
    balanced: data.balanced !== false,
  };
}

export async function apiGlReportAccountLedger(params: {
  accountId: string;
  from?: string;
  to?: string;
  academicYear?: string;
}): Promise<GlAccountLedger | null> {
  const data = await glSafe(
    () =>
      apiRequest<unknown>(
        glReportsQuery({
          report: "accountLedger",
          accountId: params.accountId,
          from: params.from,
          to: params.to,
          academicYear: params.academicYear,
        }),
      ),
    null,
  );
  if (!isRecord(data) || !isRecord(data.account) || !Array.isArray(data.lines)) return null;
  return data as unknown as GlAccountLedger;
}

export async function apiGlReportProfitLoss(params?: {
  from?: string;
  to?: string;
  academicYear?: string;
}): Promise<{
  groups: Array<{
    groupName: string;
    sector: string;
    nature: string;
    accounts: Array<{ accountId: string; code: string; name: string; amount: number; signed: number }>;
    total: number;
  }>;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}> {
  if (!hasToken()) {
    return { groups: [], totalIncome: 0, totalExpenses: 0, netProfit: 0 };
  }
  const data = await apiRequest<unknown>(
    glReportsQuery({
      report: "profitLoss",
      from: params?.from,
      to: params?.to,
      academicYear: params?.academicYear,
    }),
  );
  if (!isRecord(data) || !Array.isArray(data.groups)) {
    return { groups: [], totalIncome: 0, totalExpenses: 0, netProfit: 0 };
  }
  return {
    groups: data.groups as Array<{
      groupName: string;
      sector: string;
      nature: string;
      accounts: Array<{ accountId: string; code: string; name: string; amount: number; signed: number }>;
      total: number;
    }>,
    totalIncome: Number(data.totalIncome) || 0,
    totalExpenses: Number(data.totalExpenses) || 0,
    netProfit: Number(data.netProfit) || 0,
  };
}

export async function apiGlReportBalanceSheet(params?: {
  to?: string;
  academicYear?: string;
}): Promise<{
  groups: Array<{
    groupName: string;
    sector: string;
    nature: string;
    accounts: Array<{ accountId: string; code: string; name: string; amount: number; signed: number }>;
    total: number;
  }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  currentPeriodProfit: number;
  balanced: boolean;
}> {
  const empty = {
    groups: [],
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    currentPeriodProfit: 0,
    balanced: true,
  };
  if (!hasToken()) return empty;
  const data = await apiRequest<unknown>(
    glReportsQuery({
      report: "balanceSheet",
      to: params?.to,
      academicYear: params?.academicYear,
    }),
  );
  if (!isRecord(data) || typeof data.totalAssets !== "number" || !Array.isArray(data.groups)) {
    return empty;
  }
  return {
    groups: data.groups as Array<{
      groupName: string;
      sector: string;
      nature: string;
      accounts: Array<{ accountId: string; code: string; name: string; amount: number; signed: number }>;
      total: number;
    }>,
    totalAssets: Number(data.totalAssets) || 0,
    totalLiabilities: Number(data.totalLiabilities) || 0,
    totalEquity: Number(data.totalEquity) || 0,
    currentPeriodProfit: Number(data.currentPeriodProfit) || 0,
    balanced: data.balanced !== false,
  };
}

export async function apiGlGetPeriod(year: string): Promise<GlPeriod> {
  const fallback: GlPeriod = { yearLabel: year, status: "open" };
  const data = await glGet<unknown>("periods", { academicYear: year }, fallback);
  if (!isRecord(data) || typeof data.status !== "string") return fallback;
  return {
    yearLabel: typeof data.yearLabel === "string" ? data.yearLabel : year,
    status: data.status,
    closedAt: typeof data.closedAt === "string" ? data.closedAt : null,
    reopenNote: typeof data.reopenNote === "string" ? data.reopenNote : null,
  };
}

export async function apiGlClosePeriod(year: string): Promise<GlPeriod> {
  return glMutate(() =>
    apiRequest(glResourcePath("periods"), {
      method: "POST",
      body: { action: "close", academicYear: year },
    }),
  );
}

export async function apiGlReopenPeriod(year: string, note?: string): Promise<GlPeriod> {
  return glMutate(() =>
    apiRequest(glResourcePath("periods"), {
      method: "POST",
      body: { action: "reopen", academicYear: year, note: note ?? "Reopened" },
    }),
  );
}
