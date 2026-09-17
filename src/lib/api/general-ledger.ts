import { apiRequest, getApiToken } from "@/lib/api/client";

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

/** Live `reports.php` — chart.php / journals.php / periods.php are not on Hostinger yet. */
function glResourcePath(
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

async function glSafe<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch {
    return fallback;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function apiGlChartTree(): Promise<{
  sectors: string[];
  groups: GlAccountGroup[];
}> {
  if (!hasToken()) return { sectors: [], groups: [] };
  const empty = { sectors: [] as string[], groups: [] as GlAccountGroup[] };
  const data = await glSafe(
    () => apiRequest<unknown>(glResourcePath("chart", { resource: "tree" })),
    empty,
  );
  if (!isRecord(data) || !Array.isArray(data.groups)) return empty;
  return {
    sectors: Array.isArray(data.sectors) ? (data.sectors as string[]) : [],
    groups: data.groups as GlAccountGroup[],
  };
}

export async function apiGlListAccounts(activeOnly = true): Promise<GlAccount[]> {
  if (!hasToken()) return [];
  const data = await glSafe(
    () => apiRequest<unknown>(glResourcePath("chart", { active: activeOnly ? "1" : "0" })),
    [] as unknown,
  );
  return Array.isArray(data) ? (data as GlAccount[]) : [];
}

export async function apiGlCreateAccount(body: {
  name: string;
  groupId: string;
  code?: string;
  isCash?: boolean;
  isBank?: boolean;
  isPartyStudent?: boolean;
  isPartyStaff?: boolean;
}): Promise<GlAccount> {
  return apiRequest(glResourcePath("chart"), { method: "POST", body });
}

export async function apiGlUpdateAccount(
  id: string,
  body: Partial<GlAccount> & { groupId?: string },
): Promise<GlAccount> {
  return apiRequest(glResourcePath("chart"), {
    method: "PUT",
    body: { id, ...body },
  });
}

export async function apiGlBackfill(): Promise<{
  payments: number;
  disbursements: number;
  skipped: number;
}> {
  return apiRequest(glResourcePath("chart"), {
    method: "POST",
    body: { _backfill: true },
  });
}

export async function apiGlListJournals(params?: {
  from?: string;
  to?: string;
  academicYear?: string;
  voucherType?: string;
}): Promise<GlJournal[]> {
  if (!hasToken()) return [];
  const data = await glSafe(
    () =>
      apiRequest<unknown>(
        glResourcePath("journals", {
          from: params?.from,
          to: params?.to,
          academicYear: params?.academicYear,
          voucherType: params?.voucherType,
        }),
      ),
    [] as unknown,
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
  return apiRequest(glResourcePath("journals"), { method: "POST", body });
}

export async function apiGlVoidJournal(id: string): Promise<GlJournal> {
  return apiRequest(glResourcePath("journals"), {
    method: "POST",
    body: { _void: true, id },
  });
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
  const data = await glSafe(
    () => apiRequest<unknown>(glResourcePath("periods", { academicYear: year })),
    fallback,
  );
  if (!isRecord(data) || typeof data.status !== "string") return fallback;
  return {
    yearLabel: typeof data.yearLabel === "string" ? data.yearLabel : year,
    status: data.status,
    closedAt: typeof data.closedAt === "string" ? data.closedAt : null,
    reopenNote: typeof data.reopenNote === "string" ? data.reopenNote : null,
  };
}

export async function apiGlClosePeriod(year: string): Promise<GlPeriod> {
  return apiRequest(glResourcePath("periods"), {
    method: "POST",
    body: { action: "close", academicYear: year },
  });
}

export async function apiGlReopenPeriod(year: string, note?: string): Promise<GlPeriod> {
  return apiRequest(glResourcePath("periods"), {
    method: "POST",
    body: { action: "reopen", academicYear: year, note: note ?? "Reopened" },
  });
}
