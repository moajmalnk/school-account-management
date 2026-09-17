import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrganicCard } from "@/components/ui/organic-card";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { getApiToken } from "@/lib/api/client";
import {
  apiGlChartTree,
  apiGlClosePeriod,
  apiGlCreateAccount,
  apiGlCreateJournal,
  apiGlGetPeriod,
  apiGlListAccounts,
  apiGlListJournals,
  apiGlReopenPeriod,
  apiGlReportAccountLedger,
  apiGlReportBalanceSheet,
  apiGlReportProfitLoss,
  apiGlReportTrialBalance,
  apiGlSyncCatalogs,
  apiGlUpdateAllBooks,
  apiGlVoidJournal,
  defaultGlAccountGroups,
  glInstallHint,
  resetGlTransportProbe,
  GL_SECTORS,
  type GlAccount,
  type GlAccountGroup,
  type GlAccountLedger,
  type GlJournal,
  type GlPeriod,
  type GlTrialBalanceRow,
} from "@/lib/api/general-ledger";
import { useTenantStore } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

function inr(n: number) {
  const abs = Math.abs(n).toLocaleString("en-IN");
  if (n < 0) return `₹ −${abs}`;
  return `₹ ${abs}`;
}

/** Prefer Cash/Bank and Receive / Make Payment heads over rarely used system ledgers. */
function ledgerPaymentPriority(account: GlAccount): number {
  if (account.isCash || account.isBank) return 1000;
  const name = account.name.toLowerCase();
  const group = account.groupName.toLowerCase();
  if (account.nature === "income" || account.sector === "income") {
    if (/tuition|fee income|donation|vehicle|admission|transport/.test(name)) return 920;
    return 850;
  }
  if (account.nature === "expense" || account.sector === "expenses") {
    if (/salary|payroll/.test(name)) return 880;
    return 800;
  }
  if (
    account.isPartyStudent ||
    /receivable|debtor/.test(name) ||
    /debtor/.test(group)
  ) {
    return 650;
  }
  if (
    account.isPartyStaff ||
    /payable|creditor|salary payable/.test(name) ||
    /creditor/.test(group)
  ) {
    return 620;
  }
  if (account.nature === "equity" || /retained|capital|drawing/.test(name)) return 200;
  if (/suspense/.test(name)) return 50;
  return 400;
}

function sortLedgersByUsage(
  accounts: GlAccount[],
  activityById: Map<string, number>,
): GlAccount[] {
  return [...accounts].sort((a, b) => {
    const actA = activityById.get(a.id) ?? 0;
    const actB = activityById.get(b.id) ?? 0;
    const usedA = actA > 0 ? 1 : 0;
    const usedB = actB > 0 ? 1 : 0;
    if (usedB !== usedA) return usedB - usedA;
    if (actB !== actA) return actB - actA;
    const priB = ledgerPaymentPriority(b);
    const priA = ledgerPaymentPriority(a);
    if (priB !== priA) return priB - priA;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

function useGlUpdateAllBooks(onDone?: () => void) {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async () => {
    if (!getApiToken()) {
      toast.error("Sign in to update finance books");
      return;
    }
    setBusy(true);
    try {
      const r = await apiGlUpdateAllBooks();
      toast.success(`Books updated · ${r.payments} receipts · ${r.disbursements} payments`, {
        description: r.skipped
          ? `${r.skipped} already posted`
          : "Journals, trial balance, P&L and balance sheet refreshed",
      });
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update books", {
        description: glInstallHint(),
      });
    } finally {
      setBusy(false);
    }
  }, [onDone]);
  return { busy, run };
}

function GlUpdateAllBooksButton({
  onDone,
  className,
}: {
  onDone?: () => void;
  className?: string;
}) {
  const { busy, run } = useGlUpdateAllBooks(onDone);
  return (
    <Button
      type="button"
      size="sm"
      className={cn(
        "h-8 rounded-full bg-[#0F766E] text-[11px] text-white hover:bg-[#0D9488]",
        className,
      )}
      disabled={busy}
      onClick={() => void run()}
    >
      {busy ? (
        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
      ) : (
        <RotateCcw className="mr-1 h-3.5 w-3.5" />
      )}
      Update all books
    </Button>
  );
}

function workspacePanelClass() {
  return "rounded-2xl border border-[#EFEFEF] bg-white/90 dark:border-white/10 dark:bg-zinc-950/60";
}

const GL_GROUP_KIND_LABEL: Record<string, string> = {
  assets: "Money you have",
  liabilities: "Money you owe",
  equity: "School capital",
  income: "Money coming in",
  expenses: "Money going out",
  other: "Other",
};

function Bone({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn(
        "skeleton-shimmer relative overflow-hidden bg-black/[0.07] dark:bg-white/[0.08]",
        className,
      )}
    />
  );
}

function GlProfitLossSkeleton() {
  return (
    <div
      className="mt-4 overflow-hidden rounded-xl border border-[#E5E5E5] dark:border-white/10"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading profit and loss"
    >
      <div className="grid grid-cols-[1fr_4.5rem_6.5rem] gap-2 bg-[#F4F4F5] px-3 py-2.5 dark:bg-zinc-900">
        <Bone className="h-2.5 w-24 rounded-md" />
        <Bone className="ml-auto h-2.5 w-10 rounded-md" />
        <Bone className="ml-auto h-2.5 w-14 rounded-md" />
      </div>
      <div className="divide-y divide-[#EFEFEF] dark:divide-white/10">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_4.5rem_6.5rem] items-center gap-2 px-3 py-2.5">
            <Bone
              className={cn("h-3 rounded-md", i % 4 === 0 ? "w-28" : "w-[70%]")}
            />
            <Bone className="ml-auto h-3 w-8 rounded-md" />
            <Bone className="ml-auto h-3 w-14 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GlTrialBalanceSkeleton() {
  return (
    <div
      className="mt-4 overflow-hidden rounded-xl border border-[#EFEFEF] dark:border-white/10"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading trial balance"
    >
      <div className="grid grid-cols-5 gap-2 bg-[#F8FAFC] px-3 py-2 dark:bg-zinc-900">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className={cn("h-2.5 rounded-md", i > 2 && "ml-auto w-12")} />
        ))}
      </div>
      <div className="divide-y divide-[#EFEFEF] dark:divide-white/10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 items-center gap-2 px-3 py-2.5">
            <Bone className="h-3 w-10 rounded-md" />
            <Bone className="h-3 w-[80%] rounded-md" />
            <Bone className="h-3 w-[70%] rounded-md" />
            <Bone className="ml-auto h-3 w-14 rounded-md" />
            <Bone className="ml-auto h-3 w-14 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GlJournalsTableSkeleton() {
  return (
    <div
      className="mt-4 overflow-hidden rounded-xl border border-[#EFEFEF] dark:border-white/10"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading journals"
    >
      <div className="grid grid-cols-6 gap-2 bg-[#F8FAFC] px-3 py-2 dark:bg-zinc-900">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className={cn("h-2.5 rounded-md", i === 5 && "ml-auto w-12")} />
        ))}
      </div>
      <div className="divide-y divide-[#EFEFEF] dark:divide-white/10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-6 items-center gap-2 px-3 py-2.5">
            <Bone className="h-3 w-16 rounded-md" />
            <Bone className="h-3 w-[70%] rounded-md" />
            <Bone className="h-3 w-12 rounded-md" />
            <Bone className="h-3 w-[85%] rounded-md" />
            <Bone className="h-3 w-14 rounded-md" />
            <Bone className="ml-auto h-3 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GlAccountListSkeleton() {
  return (
    <ul
      className="mt-2 max-h-[420px] space-y-1 overflow-hidden rounded-xl border border-[#EFEFEF] p-1.5 dark:border-white/10"
      aria-busy="true"
      aria-label="Loading ledgers"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="rounded-lg px-2.5 py-2">
          <Bone className="h-3.5 w-[68%] rounded-md" />
          <Bone className="mt-1.5 h-2.5 w-[42%] rounded-md" />
        </li>
      ))}
    </ul>
  );
}

function GlStatementSkeleton() {
  return (
    <div
      className="rounded-xl border border-[#EFEFEF] dark:border-white/10"
      aria-busy="true"
      aria-label="Loading account statement"
    >
      <div className="flex items-start justify-between gap-2 border-b border-[#EFEFEF] bg-[#FAFAFA] px-3 py-3 dark:border-white/10 dark:bg-zinc-900/40">
        <div className="space-y-2">
          <Bone className="h-4 w-40 rounded-md" />
          <Bone className="h-2.5 w-28 rounded-md" />
        </div>
        <Bone className="h-12 w-[5.5rem] rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-2 border-b border-[#EFEFEF] px-3 py-2 dark:border-white/10">
        <Bone className="h-3 w-24 rounded-md" />
        <Bone className="h-3 w-20 rounded-md" />
        <Bone className="h-3 w-20 rounded-md" />
      </div>
      <div className="divide-y divide-[#EFEFEF] dark:divide-white/10">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="grid grid-cols-6 items-center gap-2 px-3 py-2.5">
            <Bone className="h-3 w-16 rounded-md" />
            <Bone className="h-3 w-[70%] rounded-md" />
            <Bone className="col-span-2 h-3 w-[90%] rounded-md" />
            <Bone className="ml-auto h-3 w-12 rounded-md" />
            <Bone className="ml-auto h-3 w-12 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function useAcademicYear() {
  const { academicYear } = useTenantStore();
  return academicYear;
}

function useBranchKey() {
  const { activeBranchId } = useTenantStore();
  return activeBranchId;
}

/* -------------------------------------------------------------------------- */
/* Chart of Accounts + Account Statement (Ledger tab)                         */
/* -------------------------------------------------------------------------- */

export function GlAccountStatementReport() {
  const academicYear = useAcademicYear();
  const branchId = useBranchKey();
  const [tree, setTree] = useState<GlAccountGroup[]>([]);
  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [activityById, setActivityById] = useState<Map<string, number>>(() => new Map());
  const [accountId, setAccountId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [statement, setStatement] = useState<GlAccountLedger | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [period, setPeriod] = useState<GlPeriod | null>(null);
  const [setupBusy, setSetupBusy] = useState<"sync" | "fill" | null>(null);

  const applyChart = useCallback(
    (
      t: Awaited<ReturnType<typeof apiGlChartTree>>,
      a: GlAccount[],
      p: GlPeriod | null,
      activity: Map<string, number>,
    ) => {
      setTree(t.groups.length ? t.groups : defaultGlAccountGroups());
      const ordered = sortLedgersByUsage(a, activity);
      setAccounts(ordered);
      setActivityById(activity);
      setPeriod(p);
      setAccountId((prev) => {
        if (prev && ordered.some((row) => row.id === prev)) return prev;
        return ordered[0]?.id ?? "";
      });
    },
    [],
  );

  const loadChart = useCallback(async () => {
    if (!getApiToken()) {
      setTree(defaultGlAccountGroups());
      setAccounts([]);
      setActivityById(new Map());
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // No auto POST here — live Hostinger reports.php still returns 405 for ?gl=chart
      // until chart.php + libs are uploaded. Use “Sync existing ledgers” after deploy.
      const [t, a, p, tb] = await Promise.all([
        apiGlChartTree(),
        apiGlListAccounts(true),
        academicYear ? apiGlGetPeriod(academicYear).catch(() => null) : Promise.resolve(null),
        apiGlReportTrialBalance({ academicYear: academicYear || undefined }).catch(() => ({
          rows: [] as GlTrialBalanceRow[],
          totalDebit: 0,
          totalCredit: 0,
          balanced: true,
        })),
      ]);

      const activity = new Map<string, number>();
      for (const row of tb.rows) {
        const raw = row as GlTrialBalanceRow & {
          turnoverDebit?: number;
          turnoverCredit?: number;
        };
        const turnover =
          (Number(raw.turnoverDebit) || 0) + (Number(raw.turnoverCredit) || 0);
        const closing = (Number(row.debit) || 0) + (Number(row.credit) || 0);
        activity.set(row.accountId, turnover > 0 ? turnover : closing);
      }

      applyChart(t, a, p, activity);
    } catch (e) {
      setTree(defaultGlAccountGroups());
      toast.error(e instanceof Error ? e.message : "Could not load chart of accounts");
    } finally {
      setLoading(false);
    }
  }, [academicYear, applyChart, branchId]);

  const syncExistingLedgers = useCallback(async () => {
    if (!getApiToken()) {
      toast.error("Sign in to sync ledgers");
      return;
    }
    setSetupBusy("sync");
    try {
      resetGlTransportProbe();
      const ok = await apiGlSyncCatalogs();
      if (!ok) {
        toast.error("General ledger tables are missing", {
          description: glInstallHint(),
        });
        return;
      }
      await loadChart();
      toast.success("Existing ledgers synced", {
        description: "Income and expense heads from Receive / Make Payment are in Ledgers",
      });
    } finally {
      setSetupBusy(null);
    }
  }, [loadChart]);

  const fillFromOldReceipts = useCallback(async () => {
    if (!getApiToken()) {
      toast.error("Sign in to fill from receipts");
      return;
    }
    setSetupBusy("fill");
    try {
      const r = await apiGlUpdateAllBooks();
      await loadChart();
      toast.success(`Added ${r.payments} receipts and ${r.disbursements} payments`, {
        description: r.skipped ? `${r.skipped} were already there` : "Journals and reports updated",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Backfill failed", {
        description: glInstallHint(),
      });
    } finally {
      setSetupBusy(null);
    }
  }, [loadChart]);

  useEffect(() => {
    void loadChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on campus/year
  }, [branchId, academicYear]);

  useEffect(() => {
    if (!accountId || !getApiToken()) {
      setStatement(null);
      setStatementLoading(false);
      return;
    }
    let cancelled = false;
    setStatementLoading(true);
    void apiGlReportAccountLedger({ accountId, academicYear: academicYear || undefined })
      .then((s) => {
        if (!cancelled) setStatement(s);
      })
      .catch(() => {
        if (!cancelled) setStatement(null);
      })
      .finally(() => {
        if (!cancelled) setStatementLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId, academicYear, branchId]);

  const filteredAccounts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = !q
      ? accounts
      : accounts.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.code.toLowerCase().includes(q) ||
            a.groupName.toLowerCase().includes(q),
        );
    return sortLedgersByUsage(matched, activityById);
  }, [accounts, activityById, query]);

  const selected = accounts.find((a) => a.id === accountId);

  return (
    <div className="space-y-4">
      <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass()}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-semibold text-black dark:text-zinc-50">
              Ledgers
            </h2>
            <p className="mt-0.5 text-[12px] text-black/50 dark:text-zinc-400">
              Most-used payment ledgers first · {academicYear || "this year"}
              {period?.status === "closed" ? " · year closed" : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <GlUpdateAllBooksButton onDone={() => void loadChart()} />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full text-[11px]"
              disabled={setupBusy !== null}
              onClick={() => void syncExistingLedgers()}
            >
              {setupBusy === "sync" ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
              )}
              Sync existing ledgers
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full text-[11px]"
              onClick={() => setChartOpen(true)}
            >
              <BookOpen className="mr-1 h-3.5 w-3.5" />
              Groups
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-full bg-[#0F766E] text-[11px] text-white hover:bg-[#0D9488]"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              New ledger
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/35" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="h-9 rounded-xl pl-8 text-[12px]"
              />
            </div>
            {loading ? (
              <GlAccountListSkeleton />
            ) : (
              <ul className="mt-2 max-h-[420px] space-y-1 overflow-y-auto rounded-xl border border-[#EFEFEF] p-1.5 dark:border-white/10">
                {filteredAccounts.length === 0 ? (
                  <li className="space-y-3 px-2 py-3 text-[12px] leading-relaxed text-black/45">
                    <p>
                      No accounts yet. Sync ledgers already used on Receive Payment and Make Payment,
                      then fill journals from old receipts.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 w-full rounded-full bg-[#0F766E] text-[12px] text-white hover:bg-[#0D9488]"
                        disabled={setupBusy !== null}
                        onClick={() => void syncExistingLedgers()}
                      >
                        {setupBusy === "sync" ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Sync existing ledgers
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 w-full rounded-full text-[12px]"
                        disabled={setupBusy !== null}
                        onClick={() => void fillFromOldReceipts()}
                      >
                        {setupBusy === "fill" ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Fill from old receipts
                      </Button>
                    </div>
                  </li>
                ) : (
                  filteredAccounts.map((a) => {
                    const activity = activityById.get(a.id) ?? 0;
                    const isPaymentHead =
                      a.isCash ||
                      a.isBank ||
                      a.nature === "income" ||
                      a.nature === "expense" ||
                      a.sector === "income" ||
                      a.sector === "expenses";
                    return (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => setAccountId(a.id)}
                          className={cn(
                            "flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                            accountId === a.id
                              ? "bg-[#0F766E]/10 text-[#0F766E]"
                              : "hover:bg-black/[0.03] dark:hover:bg-white/5",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block text-[12.5px] font-semibold">{a.name}</span>
                            <span className="mt-0.5 block text-[10px] opacity-70">
                              {a.groupName}
                              {isPaymentHead ? " · Payment book" : ""}
                            </span>
                          </span>
                          {activity > 0 ? (
                            <span
                              className={cn(
                                "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                                accountId === a.id
                                  ? "bg-[#0F766E]/15 text-[#0F766E]"
                                  : "bg-black/[0.04] text-black/55 dark:bg-white/10 dark:text-zinc-300",
                              )}
                            >
                              {inr(activity)}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </div>

          <div className="lg:col-span-8">
            {loading || statementLoading ? (
              <GlStatementSkeleton />
            ) : selected && statement ? (
              <div className="rounded-xl border border-[#EFEFEF] dark:border-white/10">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#EFEFEF] bg-[#FAFAFA] px-3 py-3 dark:border-white/10 dark:bg-zinc-900/40">
                  <div>
                    <div className="text-[15px] font-semibold text-black dark:text-zinc-50">
                      {statement.account.name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-black/45">
                      <span className="font-mono">#{statement.account.code}</span>
                      <span className="rounded-full bg-black/5 px-1.5 py-0.5 uppercase dark:bg-white/10">
                        {statement.account.nature}
                      </span>
                      <span>{statement.account.groupName}</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#0F766E] px-3 py-2 text-right text-white">
                    <div className="text-[9px] font-semibold uppercase tracking-wider opacity-80">
                      Closing
                    </div>
                    <div className="font-mono text-[16px] font-bold">
                      {inr(statement.closingBalance)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-[#EFEFEF] px-3 py-2 text-[11px] dark:border-white/10">
                  <div>
                    Opening{" "}
                    <span className="font-mono font-semibold">{inr(statement.openingBalance)}</span>
                  </div>
                  <div>
                    Debit{" "}
                    <span className="font-mono font-semibold text-emerald-700">
                      {inr(statement.totalDebit)}
                    </span>
                  </div>
                  <div>
                    Credit{" "}
                    <span className="font-mono font-semibold text-rose-600">
                      {inr(statement.totalCredit)}
                    </span>
                  </div>
                </div>
                <div className="max-h-[360px] overflow-auto">
                  <table className="w-full text-left text-[12px]">
                    <thead className="sticky top-0 bg-[#F8FAFC] text-[10px] uppercase tracking-wider text-black/45 dark:bg-zinc-900">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Voucher</th>
                        <th className="px-3 py-2">Narration</th>
                        <th className="px-3 py-2 text-right">Debit</th>
                        <th className="px-3 py-2 text-right">Credit</th>
                        <th className="px-3 py-2 text-right">Running</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFEFEF] dark:divide-white/10">
                      <tr className="bg-black/[0.02] text-black/55 dark:bg-white/[0.03]">
                        <td className="px-3 py-2" colSpan={5}>
                          Opening forward balance
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {inr(statement.openingBalance)}
                        </td>
                      </tr>
                      {statement.lines.map((line, i) => (
                        <tr key={`${line.entryId}-${i}`}>
                          <td className="whitespace-nowrap px-3 py-2">{line.date}</td>
                          <td className="px-3 py-2 font-mono text-[11px] text-[#0F766E]">
                            {line.voucherNo}
                          </td>
                          <td className="max-w-[220px] truncate px-3 py-2">{line.narration}</td>
                          <td className="px-3 py-2 text-right font-mono text-emerald-700">
                            {line.debit ? inr(line.debit) : "—"}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-rose-600">
                            {line.credit ? inr(line.credit) : "—"}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">{inr(line.balance)}</td>
                        </tr>
                      ))}
                      {statement.lines.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-black/40">
                            {selected?.name === "Fee Income"
                              ? "This is the fallback income head. Open Tuition Fee or Donation for live collections, then tap Update all books."
                              : selected?.nature === "expense" &&
                                  /fee|registration/i.test(selected.name)
                                ? "This is a Make Payment (expense) ledger, not fee collections. Use Tuition Fee / Donation under incomes."
                                : "No journals yet — tap Update all books to post Payment History"}
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid min-h-[200px] place-items-center rounded-xl border border-dashed border-[#E5E5E5] text-[13px] text-black/40 dark:border-white/10">
                Tap an account on the left to see money in and out.
              </div>
            )}
          </div>
        </div>
      </OrganicCard>

      <ChartOfAccountsDialog
        open={chartOpen}
        onOpenChange={setChartOpen}
        tree={tree}
        onSync={() => void syncExistingLedgers()}
        onFill={() => void fillFromOldReceipts()}
        busy={setupBusy}
      />
      <CreateLedgerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        groups={tree}
        academicYear={academicYear}
        onCreated={(acct) => {
          void loadChart().then(() => setAccountId(acct.id));
        }}
      />
    </div>
  );
}

function ChartOfAccountsDialog({
  open,
  onOpenChange,
  tree,
  onSync,
  onFill,
  busy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tree: GlAccountGroup[];
  onSync: () => void;
  onFill: () => void;
  busy: "sync" | "fill" | null;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return tree;
    return tree
      .map((g) => ({
        ...g,
        accounts: (g.accounts ?? []).filter(
          (a) =>
            a.name.toLowerCase().includes(needle) ||
            a.code.toLowerCase().includes(needle) ||
            g.name.toLowerCase().includes(needle),
        ),
      }))
      .filter((g) => (g.accounts?.length ?? 0) > 0 || g.name.toLowerCase().includes(needle));
  }, [tree, q]);

  const bySector = useMemo(() => {
    const map = new Map<string, GlAccountGroup[]>();
    for (const g of filtered) {
      const s = g.sector || "other";
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(g);
    }
    return map;
  }, [filtered]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden rounded-2xl p-0">
        <div className="border-b border-[#EFEFEF] px-5 py-4 dark:border-white/10">
          <DialogHeader>
            <DialogTitle>Account groups</DialogTitle>
            <DialogDescription>
              Folders for your money — bank, cash, fees, salary. Sync pulls ledgers from Receive /
              Make Payment; Fill posts old receipts into journals.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="h-9 flex-1 rounded-xl text-[12px]"
            />
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 rounded-full text-[11px]"
                disabled={busy !== null}
                onClick={onSync}
              >
                {busy === "sync" ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                )}
                Sync existing ledgers
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 rounded-full text-[11px]"
                disabled={busy !== null}
                onClick={onFill}
              >
                {busy === "fill" ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                )}
                Fill from old receipts
              </Button>
            </div>
          </div>
        </div>
        <div className="max-h-[55vh] space-y-4 overflow-y-auto px-5 py-4">
          {[...bySector.entries()].map(([sector, groups]) => (
            <div key={sector}>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#0F766E]">
                {GL_GROUP_KIND_LABEL[sector] ?? sector}
              </div>
              <div className="space-y-2">
                {groups.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-xl border border-[#EFEFEF] px-3 py-2 dark:border-white/10"
                  >
                    <div className="text-[12.5px] font-semibold text-black dark:text-zinc-50">
                      {g.name}
                    </div>
                    {(g.accounts?.length ?? 0) === 0 ? (
                      <p className="mt-1 text-[11px] text-black/40">Nothing in this group yet.</p>
                    ) : (
                      <ul className="mt-1.5 space-y-0.5">
                        {(g.accounts ?? []).map((a) => (
                          <li
                            key={a.id}
                            className="flex justify-between text-[12px] text-black/70 dark:text-zinc-300"
                          >
                            <span>{a.name}</span>
                            <span className="font-mono text-[10px] text-black/35">#{a.code}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {bySector.size === 0 ? (
            <p className="py-6 text-center text-[12px] text-black/40">
              No groups match your search. Sync existing ledgers to pull Receive / Make Payment heads.
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateLedgerDialog({
  open,
  onOpenChange,
  groups,
  academicYear,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groups: GlAccountGroup[];
  academicYear: string;
  onCreated: (a: GlAccount) => void;
}) {
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [opening, setOpening] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setOpening("");
    setGroupId(groups[0]?.id ?? "");
  }, [open, groups]);

  const selectedGroup = groups.find((g) => g.id === groupId);

  const submit = async () => {
    if (groups.length === 0) {
      toast.error("Chart of accounts is not installed on this server yet");
      return;
    }
    if (!name.trim() || !groupId) {
      toast.error("Enter a ledger name and choose a group");
      return;
    }
    const openingAmount = Math.round(Math.abs(Number.parseFloat(opening.replace(/,/g, "")) || 0));
    setSaving(true);
    try {
      const acct = await apiGlCreateAccount({
        name: name.trim(),
        groupId,
        openingBalance: openingAmount || undefined,
        openingDate: new Date().toISOString().slice(0, 10),
        academicYear: academicYear || undefined,
      });
      toast.success(`${acct.name} is ready`, {
        description: openingAmount
          ? `Opening balance ₹ ${openingAmount.toLocaleString("en-IN")}`
          : `Code #${acct.code}`,
      });
      onOpenChange(false);
      onCreated(acct);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create ledger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>New ledger</DialogTitle>
          <DialogDescription>
            Name the account, choose where it belongs, and add an opening balance if money is
            already sitting there.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-black/45">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-9 rounded-xl"
              placeholder="e.g. HDFC Current, Petty cash, Fee income"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-black/45">Group</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger className="mt-1 h-9 rounded-xl">
                <SelectValue placeholder="Where does this belong?" />
              </SelectTrigger>
              <SelectContent>
                {GL_SECTORS.map((sector) => {
                  const items = groups.filter((g) => g.sector === sector);
                  if (items.length === 0) return null;
                  return (
                    <SelectGroup key={sector}>
                      <SelectLabel className="uppercase tracking-wider text-black/40">
                        {GL_GROUP_KIND_LABEL[sector] ?? sector}
                      </SelectLabel>
                      {items.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-black/45">
              Opening balance
            </Label>
            <Input
              inputMode="decimal"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              className="mt-1 h-9 rounded-xl"
              placeholder="0"
            />
            <p className="mt-1.5 text-[11px] text-black/45">
              {selectedGroup?.nature === "liability" || selectedGroup?.nature === "income"
                ? "Amount already payable or earned. Leave 0 if this starts empty."
                : "Amount already in this account. Leave 0 if this starts empty."}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
            disabled={saving || groups.length === 0}
            onClick={() => void submit()}
          >
            {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}
            Save ledger
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Trial Balance                                                              */
/* -------------------------------------------------------------------------- */

export function GlTrialBalanceReport() {
  const academicYear = useAcademicYear();
  const branchId = useBranchKey();
  const [rows, setRows] = useState<GlTrialBalanceRow[]>([]);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [balanced, setBalanced] = useState(true);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!getApiToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void apiGlReportTrialBalance({ academicYear: academicYear || undefined })
      .then((r) => {
        setRows(r.rows);
        setTotalDebit(r.totalDebit);
        setTotalCredit(r.totalCredit);
        setBalanced(r.balanced);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Trial balance failed"))
      .finally(() => setLoading(false));
  }, [academicYear, branchId, reloadKey]);

  return (
    <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass()}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[18px] font-semibold">Trial balance</h2>
          <p className="text-[12px] text-black/50">
            Closing debit/credit by ledger · {academicYear || "all"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GlUpdateAllBooksButton onDone={() => setReloadKey((k) => k + 1)} />
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              loading
                ? "bg-black/[0.04] dark:bg-white/5"
                : balanced
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-rose-500/15 text-rose-700",
            )}
          >
            {loading ? (
              <Bone className="h-3 w-16 rounded-full" />
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {balanced ? "Balanced" : "Out of balance"}
              </>
            )}
          </span>
        </div>
      </div>
      {loading ? (
        <GlTrialBalanceSkeleton />
      ) : (
        <div className="mt-4 overflow-auto rounded-xl border border-[#EFEFEF] dark:border-white/10">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-[#F8FAFC] text-[10px] uppercase tracking-wider text-black/45 dark:bg-zinc-900">
              <tr>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Account</th>
                <th className="px-3 py-2">Group</th>
                <th className="px-3 py-2 text-right">Debit</th>
                <th className="px-3 py-2 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFEF] dark:divide-white/10">
              {rows.map((r) => (
                <tr key={r.accountId}>
                  <td className="px-3 py-2 font-mono text-[11px]">{r.code}</td>
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2 text-black/50">{r.groupName}</td>
                  <td className="px-3 py-2 text-right font-mono text-emerald-700">
                    {r.debit ? inr(r.debit) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-rose-600">
                    {r.credit ? inr(r.credit) : "—"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-black/40">
                    No journals yet — tap <span className="font-medium text-[#0F766E]">Update all books</span>
                  </td>
                </tr>
              ) : null}
            </tbody>
            <tfoot className="border-t-2 border-black/10 font-semibold dark:border-white/20">
              <tr>
                <td className="px-3 py-2" colSpan={3}>
                  Total
                </td>
                <td className="px-3 py-2 text-right font-mono">{inr(totalDebit)}</td>
                <td className="px-3 py-2 text-right font-mono">{inr(totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </OrganicCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Journals + Opening                                                         */
/* -------------------------------------------------------------------------- */

type DraftLine = { accountId: string; debit: string; credit: string; description: string };

export function GlJournalsReport() {
  const academicYear = useAcademicYear();
  const branchId = useBranchKey();
  const [journals, setJournals] = useState<GlJournal[]>([]);
  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [voucherType, setVoucherType] = useState<"journal" | "opening">("journal");
  const [narration, setNarration] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<DraftLine[]>([
    { accountId: "", debit: "", credit: "", description: "" },
    { accountId: "", debit: "", credit: "", description: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState<GlPeriod | null>(null);

  const reload = useCallback(async () => {
    if (!getApiToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [j, a, p] = await Promise.all([
        apiGlListJournals({ academicYear: academicYear || undefined }),
        apiGlListAccounts(true),
        academicYear ? apiGlGetPeriod(academicYear).catch(() => null) : Promise.resolve(null),
      ]);
      setJournals(j);
      setAccounts(a);
      setPeriod(p);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load journals");
    } finally {
      setLoading(false);
    }
  }, [academicYear, branchId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const totalDr = lines.reduce((s, l) => s + (Number.parseInt(l.debit, 10) || 0), 0);
  const totalCr = lines.reduce((s, l) => s + (Number.parseInt(l.credit, 10) || 0), 0);

  const save = async () => {
    const payload = lines
      .map((l) => ({
        accountId: l.accountId,
        debit: Number.parseInt(l.debit, 10) || 0,
        credit: Number.parseInt(l.credit, 10) || 0,
        description: l.description || undefined,
      }))
      .filter((l) => l.accountId && (l.debit > 0 || l.credit > 0));
    if (payload.length < 2) {
      toast.error("Add at least two balanced lines");
      return;
    }
    if (totalDr !== totalCr || totalDr < 1) {
      toast.error("Debits must equal credits");
      return;
    }
    setSaving(true);
    try {
      const je = await apiGlCreateJournal({
        voucherType,
        date,
        academicYear: academicYear || undefined,
        narration,
        lines: payload,
      });
      toast.success(`${voucherType === "opening" ? "Opening" : "Journal"} ${je.voucherNo} posted`);
      setComposeOpen(false);
      setNarration("");
      setLines([
        { accountId: "", debit: "", credit: "", description: "" },
        { accountId: "", debit: "", credit: "", description: "" },
      ]);
      void reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post journal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass()}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-semibold">Journal vouchers</h2>
            <p className="text-[12px] text-black/50">
              Manual journals and opening balances · {academicYear || "all"}
              {period?.status === "closed" ? " · closed" : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <GlUpdateAllBooksButton onDone={() => void reload()} />
            <PeriodCloseControls period={period} year={academicYear} onChange={() => void reload()} />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full text-[11px]"
              onClick={() => {
                setVoucherType("opening");
                setComposeOpen(true);
              }}
            >
              Opening balances
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-full bg-[#0F766E] text-[11px] text-white hover:bg-[#0D9488]"
              onClick={() => {
                setVoucherType("journal");
                setComposeOpen(true);
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              New journal
            </Button>
          </div>
        </div>

        {loading ? (
          <GlJournalsTableSkeleton />
        ) : (
          <div className="mt-4 overflow-auto rounded-xl border border-[#EFEFEF] dark:border-white/10">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#F8FAFC] text-[10px] uppercase tracking-wider text-black/45 dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Voucher</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Narration</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFEF] dark:divide-white/10">
                {journals.map((j) => (
                  <tr key={j.id} className={j.isVoid ? "opacity-40" : undefined}>
                    <td className="whitespace-nowrap px-3 py-2">{j.date}</td>
                    <td className="px-3 py-2 font-mono text-[#0F766E]">{j.voucherNo}</td>
                    <td className="px-3 py-2 uppercase">{j.voucherType}</td>
                    <td className="max-w-[240px] truncate px-3 py-2">{j.narration || "—"}</td>
                    <td className="px-3 py-2 text-[11px] text-black/45">
                      {j.sourceType ? `${j.sourceType}:${j.sourceId}` : "manual"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {!j.isVoid && !j.isLocked && !j.sourceType ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 text-rose-600"
                          onClick={() => {
                            void apiGlVoidJournal(j.id)
                              .then(() => {
                                toast.success(`Voided ${j.voucherNo}`);
                                void reload();
                              })
                              .catch((e) =>
                                toast.error(e instanceof Error ? e.message : "Void failed"),
                              );
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {journals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-black/40">
                      No journals yet — tap <span className="font-medium text-[#0F766E]">Update all books</span> to
                      post old receipts &amp; payments
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </OrganicCard>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {voucherType === "opening" ? "Opening balances" : "Journal voucher"}
            </DialogTitle>
            <DialogDescription>
              Debits must equal credits
              {voucherType === "opening" ? " · use balance-sheet accounts only" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-black/45">Date</Label>
              <DatePicker
                value={date}
                onChange={setDate}
                valueFormat="iso"
                variant="pill"
                placeholder="Pick a date"
                quickPicks={[{ label: "Today", getDate: (t) => t }]}
                className="mt-1 h-9 w-full"
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-black/45">Narration</Label>
              <Input
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                className="mt-1 h-9 rounded-xl"
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="mt-2 space-y-2">
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <Select
                    value={line.accountId || undefined}
                    onValueChange={(v) =>
                      setLines((prev) =>
                        prev.map((l, i) => (i === idx ? { ...l, accountId: v } : l)),
                      )
                    }
                  >
                    <SelectTrigger className="h-9 rounded-xl text-[11px]">
                      <SelectValue placeholder="Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} (#{a.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Input
                    value={line.debit}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l, i) =>
                          i === idx ? { ...l, debit: e.target.value, credit: "" } : l,
                        ),
                      )
                    }
                    placeholder="Debit"
                    className="h-9 rounded-xl font-mono text-[11px]"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    value={line.credit}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l, i) =>
                          i === idx ? { ...l, credit: e.target.value, debit: "" } : l,
                        ),
                      )
                    }
                    placeholder="Credit"
                    className="h-9 rounded-xl font-mono text-[11px]"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    value={line.description}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l, i) =>
                          i === idx ? { ...l, description: e.target.value } : l,
                        ),
                      )
                    }
                    placeholder="Note"
                    className="h-9 rounded-xl text-[11px]"
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full text-[11px]"
              onClick={() =>
                setLines((prev) => [
                  ...prev,
                  { accountId: "", debit: "", credit: "", description: "" },
                ])
              }
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add line
            </Button>
            <div className="flex justify-end gap-4 text-[12px] font-semibold">
              <span>
                Dr <span className="font-mono text-emerald-700">{inr(totalDr)}</span>
              </span>
              <span>
                Cr <span className="font-mono text-rose-600">{inr(totalCr)}</span>
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full bg-[#0F172A] text-white"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              Post voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PeriodCloseControls({
  period,
  year,
  onChange,
}: {
  period: GlPeriod | null;
  year: string;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  if (!year) return null;
  const closed = period?.status === "closed";
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-8 rounded-full text-[11px]"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        const op = closed
          ? apiGlReopenPeriod(year, "Reopened from Journals")
          : apiGlClosePeriod(year);
        void op
          .then(() => {
            toast.success(closed ? `${year} reopened` : `${year} closed · P&L rolled to Retained Earnings`);
            onChange();
          })
          .catch((e) => toast.error(e instanceof Error ? e.message : "Period action failed"))
          .finally(() => setBusy(false));
      }}
    >
      {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
      {closed ? "Reopen books" : "Close books"}
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/* P&L + Balance Sheet (GL)                                                   */
/* -------------------------------------------------------------------------- */

export function GlProfitLossReport() {
  const academicYear = useAcademicYear();
  const branchId = useBranchKey();
  const [data, setData] = useState<Awaited<ReturnType<typeof apiGlReportProfitLoss>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!getApiToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void apiGlReportProfitLoss({ academicYear: academicYear || undefined })
      .then(setData)
      .catch((e) => toast.error(e instanceof Error ? e.message : "P&L failed"))
      .finally(() => setLoading(false));
  }, [academicYear, branchId, reloadKey]);

  const incomeGroups = (data?.groups ?? []).filter((g) => g.sector === "income");
  const expenseGroups = (data?.groups ?? []).filter((g) => g.sector === "expenses");
  const net = data?.netProfit ?? 0;
  const isProfit = net >= 0;

  return (
    <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass()}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[18px] font-semibold">Profit &amp; Loss Statement</h2>
          <p className="mt-1 text-[12px] text-black/50">
            Income − Expenses = Net Profit / (Loss) · {academicYear || "all periods"}
          </p>
        </div>
        <GlUpdateAllBooksButton onDone={() => setReloadKey((k) => k + 1)} />
      </div>

      {!loading && data ? (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <StatPill label="A · Total Income" value={data.totalIncome} />
          <StatPill label="B · Total Expenses" value={data.totalExpenses} />
          <div
            className={cn(
              "rounded-xl border px-3 py-2",
              isProfit
                ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/30 dark:bg-emerald-950/30"
                : "border-rose-200 bg-rose-50/80 dark:border-rose-500/30 dark:bg-rose-950/30",
            )}
          >
            <div className="text-[9px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-400">
              A − B · Net {isProfit ? "Profit" : "Loss"}
            </div>
            <div
              className={cn(
                "font-mono text-[14px] font-semibold",
                isProfit ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300",
              )}
            >
              {inr(net)}
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <GlProfitLossSkeleton />
      ) : !data || (incomeGroups.length === 0 && expenseGroups.length === 0) ? (
        <div className="mt-4 rounded-xl border border-dashed border-black/15 px-4 py-10 text-center text-[12px] text-black/55">
          No income or expense journals yet — tap{" "}
          <span className="font-medium text-[#0F766E]">Update all books</span>
        </div>
      ) : (
        <div className="mobile-scrollbar-none relative z-0 mt-4 overflow-x-auto rounded-xl border border-[#E5E5E5] dark:border-white/10">
          <table className="w-full min-w-[520px] border-collapse text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F4F4F5] dark:border-white/10 dark:bg-zinc-900/80">
                <th className="px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-black/55">
                  Particulars
                </th>
                <th className="w-[5.5rem] px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-black/55">
                  Ledger
                </th>
                <th className="w-[8rem] px-3.5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-black/55">
                  Amount (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              <GlStatementSectionHeader label="Income" />
              {incomeGroups.map((g) => (
                <GlStatementGroupRows key={`in-${g.groupName}`} group={g} />
              ))}
              <GlStatementTotalRow
                label="A. Total Income"
                amount={data.totalIncome}
                tone="section"
              />

              <GlStatementSectionHeader label="Expenses" />
              {expenseGroups.map((g) => (
                <GlStatementGroupRows key={`ex-${g.groupName}`} group={g} />
              ))}
              <GlStatementTotalRow
                label="B. Total Expenses"
                amount={data.totalExpenses}
                tone="section"
              />

              <GlStatementTotalRow
                label={isProfit ? "Net Profit (A − B)" : "Net Loss (A − B)"}
                amount={net}
                tone={isProfit ? "profit" : "loss"}
              />
            </tbody>
          </table>
        </div>
      )}
    </OrganicCard>
  );
}

type GlStatementGroup = {
  groupName: string;
  accounts: Array<{
    accountId: string;
    code: string;
    name: string;
    amount: number;
    signed?: number;
  }>;
  total: number;
};

function GlStatementSectionHeader({ label }: { label: string }) {
  return (
    <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] dark:border-white/10 dark:bg-zinc-900/50">
      <td
        colSpan={3}
        className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-black/70 dark:text-zinc-200"
      >
        {label}
      </td>
    </tr>
  );
}

function GlStatementGroupRows({ group }: { group: GlStatementGroup }) {
  return (
    <>
      <tr className="border-b border-[#F0F0F0] bg-white dark:border-white/5 dark:bg-transparent">
        <td className="px-3.5 py-2 text-[12px] font-semibold text-[#0F766E]" colSpan={2}>
          {group.groupName}
        </td>
        <td className="px-3.5 py-2 text-right font-mono text-[12px] font-semibold text-[#0F766E]">
          {inr(group.total)}
        </td>
      </tr>
      {group.accounts.map((a) => {
        const signed = typeof a.signed === "number" ? a.signed : a.amount;
        return (
          <tr
            key={a.accountId}
            className="border-b border-[#F5F5F5] last:border-0 dark:border-white/5"
          >
            <td className="py-2 pl-8 pr-3.5 text-[12.5px] text-black dark:text-zinc-100">
              {a.name}
            </td>
            <td className="px-3 py-2 text-right font-mono text-[11px] text-black/45">
              {a.code || "—"}
            </td>
            <td
              className={cn(
                "px-3.5 py-2 text-right font-mono text-[12.5px] tabular-nums",
                signed < 0 ? "text-[#B91C1C]" : "text-black dark:text-zinc-100",
              )}
            >
              {inr(signed)}
            </td>
          </tr>
        );
      })}
    </>
  );
}

function GlStatementTotalRow({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: number;
  tone: "section" | "profit" | "loss";
}) {
  return (
    <tr
      className={cn(
        "border-b border-[#E5E5E5] dark:border-white/10",
        tone === "section" && "bg-[#F4F4F5] dark:bg-zinc-900/70",
        tone === "profit" && "bg-emerald-50 dark:bg-emerald-950/40",
        tone === "loss" && "bg-rose-50 dark:bg-rose-950/40",
      )}
    >
      <td
        colSpan={2}
        className={cn(
          "px-3.5 py-3 text-[13px] font-bold",
          tone === "profit" && "text-emerald-800 dark:text-emerald-200",
          tone === "loss" && "text-rose-800 dark:text-rose-200",
          tone === "section" && "text-black dark:text-zinc-50",
        )}
      >
        {label}
      </td>
      <td
        className={cn(
          "px-3.5 py-3 text-right font-mono text-[13px] font-bold tabular-nums",
          tone === "profit" && "text-emerald-800 dark:text-emerald-200",
          tone === "loss" && "text-rose-800 dark:text-rose-200",
          tone === "section" && "text-black dark:text-zinc-50",
        )}
      >
        {inr(amount)}
      </td>
    </tr>
  );
}

export function GlBalanceSheetReport() {
  const academicYear = useAcademicYear();
  const branchId = useBranchKey();
  const [data, setData] = useState<Awaited<ReturnType<typeof apiGlReportBalanceSheet>> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!getApiToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void apiGlReportBalanceSheet({ academicYear: academicYear || undefined })
      .then(setData)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Balance sheet failed"))
      .finally(() => setLoading(false));
  }, [academicYear, branchId, reloadKey]);

  const assetGroups = (data?.groups ?? []).filter((g) => g.sector === "assets");
  const liabilityGroups = (data?.groups ?? []).filter((g) => g.sector === "liabilities");
  const equityGroups = (data?.groups ?? []).filter((g) => g.sector === "equity");
  const liabilitiesAndEquity = (data?.totalLiabilities ?? 0) + (data?.totalEquity ?? 0);

  return (
    <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass()}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[18px] font-semibold">Balance Sheet</h2>
          <p className="mt-1 text-[12px] text-black/50">
            Assets = Liabilities + Equity · {academicYear || "as of now"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GlUpdateAllBooksButton onDone={() => setReloadKey((k) => k + 1)} />
          {loading ? (
            <Bone className="h-6 w-[6.5rem] rounded-full" />
          ) : data ? (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                data.balanced
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-amber-500/15 text-amber-800",
              )}
            >
              {data.balanced ? "In balance" : "Check Suspense / opening"}
            </span>
          ) : null}
        </div>
      </div>

      {!loading && data ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatPill label="Assets" value={data.totalAssets} />
          <StatPill label="Liabilities" value={data.totalLiabilities} />
          <StatPill label="Equity" value={data.totalEquity} />
          <StatPill label="Period P&L" value={data.currentPeriodProfit} />
        </div>
      ) : null}

      {loading ? (
        <GlProfitLossSkeleton />
      ) : !data || data.groups.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-black/15 px-4 py-10 text-center text-[12px] text-black/55">
          No journals yet — tap{" "}
          <span className="font-medium text-[#0F766E]">Update all books</span>
        </div>
      ) : (
        <div className="mobile-scrollbar-none relative z-0 mt-4 overflow-x-auto rounded-xl border border-[#E5E5E5] dark:border-white/10">
          <table className="w-full min-w-[520px] border-collapse text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F4F4F5] dark:border-white/10 dark:bg-zinc-900/80">
                <th className="px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-black/55">
                  Particulars
                </th>
                <th className="w-[5.5rem] px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-black/55">
                  Ledger
                </th>
                <th className="w-[8rem] px-3.5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-black/55">
                  Amount (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              <GlStatementSectionHeader label="Assets" />
              {assetGroups.map((g) => (
                <GlStatementGroupRows key={`as-${g.groupName}`} group={g} />
              ))}
              <GlStatementTotalRow
                label="Total Assets"
                amount={data.totalAssets}
                tone="section"
              />

              <GlStatementSectionHeader label="Liabilities" />
              {liabilityGroups.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3.5 py-2.5 text-[12px] text-black/40">
                    No liabilities
                  </td>
                </tr>
              ) : (
                liabilityGroups.map((g) => (
                  <GlStatementGroupRows key={`li-${g.groupName}`} group={g} />
                ))
              )}
              <GlStatementTotalRow
                label="Total Liabilities"
                amount={data.totalLiabilities}
                tone="section"
              />

              <GlStatementSectionHeader label="Equity" />
              {equityGroups.map((g) => (
                <GlStatementGroupRows key={`eq-${g.groupName}`} group={g} />
              ))}
              {data.currentPeriodProfit !== 0 ? (
                <tr className="border-b border-[#F5F5F5] dark:border-white/5">
                  <td colSpan={3} className="px-3.5 py-2 text-[11px] text-black/45">
                    Includes current period P&amp;L {inr(data.currentPeriodProfit)}
                  </td>
                </tr>
              ) : null}
              <GlStatementTotalRow
                label="Total Equity"
                amount={data.totalEquity}
                tone="section"
              />
              <GlStatementTotalRow
                label="Total Liabilities + Equity"
                amount={liabilitiesAndEquity}
                tone={data.balanced ? "profit" : "loss"}
              />
            </tbody>
          </table>
        </div>
      )}
    </OrganicCard>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] px-3 py-2 dark:border-white/10 dark:bg-zinc-900/40">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-black/45">{label}</div>
      <div className="font-mono text-[14px] font-semibold">{inr(value)}</div>
    </div>
  );
}
