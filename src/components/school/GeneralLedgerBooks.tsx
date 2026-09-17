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
import { getApiToken } from "@/lib/api/client";
import {
  apiGlBackfill,
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
  apiGlVoidJournal,
  defaultGlAccountGroups,
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
  return `₹ ${Math.abs(n).toLocaleString("en-IN")}`;
}

function workspacePanelClass() {
  return "rounded-2xl border border-[#EFEFEF] bg-white/90 dark:border-white/10 dark:bg-zinc-950/60";
}

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

function GlStatPillsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] px-3 py-2 dark:border-white/10 dark:bg-zinc-900/40"
        >
          <Bone className="h-2.5 w-14 rounded-md" />
          <Bone className="mt-2 h-5 w-[4.5rem] rounded-md" />
        </div>
      ))}
    </div>
  );
}

function GlReportColumnSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-[#EFEFEF] dark:border-white/10">
      <div className="flex items-center justify-between border-b border-[#EFEFEF] bg-[#FAFAFA] px-3 py-2.5 dark:border-white/10 dark:bg-zinc-900/40">
        <Bone className="h-3 w-16 rounded-md" />
        <Bone className="h-3.5 w-20 rounded-md" />
      </div>
      <div className="space-y-3.5 p-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <Bone className="h-3 w-[42%] rounded-md" />
              <Bone className="h-3 w-14 shrink-0 rounded-md" />
            </div>
            <Bone className="h-2.5 w-[78%] rounded-md bg-black/[0.05] dark:bg-white/[0.05]" />
            <Bone className="h-2.5 w-[62%] rounded-md bg-black/[0.05] dark:bg-white/[0.05]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GlBalanceSheetSkeleton() {
  return (
    <div className="mt-3" aria-busy="true" aria-live="polite" aria-label="Loading balance sheet">
      <GlStatPillsSkeleton />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <GlReportColumnSkeleton rows={5} />
        <div className="space-y-4">
          <GlReportColumnSkeleton rows={3} />
          <GlReportColumnSkeleton rows={2} />
        </div>
      </div>
    </div>
  );
}

function GlProfitLossSkeleton() {
  return (
    <div
      className="mt-4 grid gap-4 md:grid-cols-2"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading profit and loss"
    >
      <GlReportColumnSkeleton rows={5} />
      <GlReportColumnSkeleton rows={5} />
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
  const [accountId, setAccountId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [statement, setStatement] = useState<GlAccountLedger | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [period, setPeriod] = useState<GlPeriod | null>(null);

  const loadChart = useCallback(async () => {
    if (!getApiToken()) {
      setTree(defaultGlAccountGroups());
      setAccounts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [t, a, p] = await Promise.all([
        apiGlChartTree(),
        apiGlListAccounts(true),
        academicYear ? apiGlGetPeriod(academicYear).catch(() => null) : Promise.resolve(null),
      ]);
      setTree(t.groups.length ? t.groups : defaultGlAccountGroups());
      setAccounts(a);
      setPeriod(p);
      if (!accountId && a[0]) setAccountId(a[0].id);
    } catch (e) {
      setTree(defaultGlAccountGroups());
      toast.error(e instanceof Error ? e.message : "Could not load chart of accounts");
    } finally {
      setLoading(false);
    }
  }, [academicYear, accountId, branchId]);

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
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.groupName.toLowerCase().includes(q),
    );
  }, [accounts, query]);

  const selected = accounts.find((a) => a.id === accountId);

  return (
    <div className="space-y-4">
      <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass()}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-semibold text-black dark:text-zinc-50">
              Account ledger
            </h2>
            <p className="mt-0.5 text-[12px] text-black/50 dark:text-zinc-400">
              Double-entry statement by ledger · {academicYear || "all years"}
              {period?.status === "closed" ? " · books closed" : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full text-[11px]"
              onClick={() => setChartOpen(true)}
            >
              <BookOpen className="mr-1 h-3.5 w-3.5" />
              Chart of accounts
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
                placeholder="Search ledgers…"
                className="h-9 rounded-xl pl-8 text-[12px]"
              />
            </div>
            {loading ? (
              <GlAccountListSkeleton />
            ) : (
              <ul className="mt-2 max-h-[420px] space-y-1 overflow-y-auto rounded-xl border border-[#EFEFEF] p-1.5 dark:border-white/10">
                {filteredAccounts.length === 0 ? (
                  <li className="px-2 py-3 text-[12px] text-black/45">No ledgers yet</li>
                ) : (
                  filteredAccounts.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => setAccountId(a.id)}
                        className={cn(
                          "flex w-full flex-col rounded-lg px-2.5 py-2 text-left transition-colors",
                          accountId === a.id
                            ? "bg-[#0F766E]/10 text-[#0F766E]"
                            : "hover:bg-black/[0.03] dark:hover:bg-white/5",
                        )}
                      >
                        <span className="text-[12.5px] font-semibold">{a.name}</span>
                        <span className="font-mono text-[10px] opacity-70">
                          #{a.code} · {a.groupName}
                        </span>
                      </button>
                    </li>
                  ))
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
                            No movements in this period
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid min-h-[200px] place-items-center rounded-xl border border-dashed border-[#E5E5E5] text-[13px] text-black/40 dark:border-white/10">
                Select a ledger to view its statement
              </div>
            )}
          </div>
        </div>
      </OrganicCard>

      <ChartOfAccountsDialog
        open={chartOpen}
        onOpenChange={setChartOpen}
        tree={tree}
        onRefresh={() => void loadChart()}
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
  onRefresh,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tree: GlAccountGroup[];
  onRefresh: () => void;
}) {
  const [q, setQ] = useState("");
  const [backfilling, setBackfilling] = useState(false);

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
            <DialogTitle>Chart of accounts</DialogTitle>
            <DialogDescription>
              Standard account groups by sector. Leaf ledgers feed P&amp;L and the balance sheet.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search groups or ledgers…"
              className="h-9 rounded-xl text-[12px]"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 shrink-0 rounded-full text-[11px]"
              disabled={backfilling}
              onClick={() => {
                setBackfilling(true);
                void apiGlBackfill()
                  .then((r) => {
                    toast.success(
                      `Posted ${r.payments} receipts · ${r.disbursements} payments into the ledger`,
                      { description: `${r.skipped} already posted or skipped` },
                    );
                    onRefresh();
                  })
                  .catch((e) =>
                    toast.error(e instanceof Error ? e.message : "Backfill failed"),
                  )
                  .finally(() => setBackfilling(false));
              }}
            >
              {backfilling ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
              )}
              Sync past entries
            </Button>
          </div>
        </div>
        <div className="max-h-[55vh] space-y-4 overflow-y-auto px-5 py-4">
          {[...bySector.entries()].map(([sector, groups]) => (
            <div key={sector}>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#0F766E]">
                {sector} sector
              </div>
              <div className="space-y-2">
                {groups.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-xl border border-[#EFEFEF] p-2.5 dark:border-white/10"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[13px] font-semibold">{g.name}</div>
                      <span className="font-mono text-[10px] text-black/40">UID: {g.uid}</span>
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {(g.accounts ?? []).map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center justify-between rounded-lg px-2 py-1 text-[12px] hover:bg-black/[0.03] dark:hover:bg-white/5"
                        >
                          <span>
                            {a.name}{" "}
                            <span className="font-mono text-[10px] text-black/40">#{a.code}</span>
                          </span>
                          {!a.active ? (
                            <span className="text-[10px] text-rose-500">inactive</span>
                          ) : null}
                        </li>
                      ))}
                      {(g.accounts ?? []).length === 0 ? (
                        <li className="px-2 py-1 text-[11px] text-black/35">No leaf ledgers</li>
                      ) : null}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
  const sectorLabel: Record<string, string> = {
    assets: "Money & property",
    liabilities: "Loans & payables",
    equity: "Capital",
    income: "Income",
    expenses: "Expenses",
    other: "Other",
  };

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
                        {sectorLabel[sector] ?? sector}
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
  }, [academicYear, branchId]);

  return (
    <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass()}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[18px] font-semibold">Trial balance</h2>
          <p className="text-[12px] text-black/50">
            Closing debit/credit by ledger · {academicYear || "all"}
          </p>
        </div>
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
                      No journals yet — receive/make payments auto-post here after backfill
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
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 h-9 rounded-xl"
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
  }, [academicYear, branchId]);

  return (
    <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass()}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[18px] font-semibold">Profit &amp; Loss</h2>
          <p className="text-[12px] text-black/50">
            From general ledger · {academicYear || "all"}
          </p>
        </div>
        {loading ? (
          <Bone className="h-6 w-[5.5rem] rounded-full" />
        ) : data ? (
          <div
            className={cn(
              "rounded-xl px-3 py-2 text-right text-white",
              data.netProfit >= 0 ? "bg-[#0F766E]" : "bg-rose-600",
            )}
          >
            <div className="text-[9px] font-semibold uppercase tracking-wider opacity-80">
              Net {data.netProfit >= 0 ? "profit" : "loss"}
            </div>
            <div className="font-mono text-[16px] font-bold">{inr(data.netProfit)}</div>
          </div>
        ) : null}
      </div>
      {loading ? (
        <GlProfitLossSkeleton />
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <GlReportGroupColumn
            title="Income"
            total={data?.totalIncome ?? 0}
            groups={(data?.groups ?? []).filter((g) => g.sector === "income")}
          />
          <GlReportGroupColumn
            title="Expenses"
            total={data?.totalExpenses ?? 0}
            groups={(data?.groups ?? []).filter((g) => g.sector === "expenses")}
          />
        </div>
      )}
    </OrganicCard>
  );
}

export function GlBalanceSheetReport() {
  const academicYear = useAcademicYear();
  const branchId = useBranchKey();
  const [data, setData] = useState<Awaited<ReturnType<typeof apiGlReportBalanceSheet>> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

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
  }, [academicYear, branchId]);

  return (
    <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass()}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[18px] font-semibold">Balance sheet</h2>
          <p className="text-[12px] text-black/50">
            Assets = Liabilities + Equity · {academicYear || "as of now"}
          </p>
        </div>
        {loading ? (
          <Bone className="h-6 w-[6.5rem] rounded-full" />
        ) : data ? (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
              data.balanced ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-800",
            )}
          >
            {data.balanced ? "In balance" : "Check Suspense / opening"}
          </span>
        ) : null}
      </div>
      {loading ? (
        <GlBalanceSheetSkeleton />
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatPill label="Assets" value={data?.totalAssets ?? 0} />
            <StatPill label="Liabilities" value={data?.totalLiabilities ?? 0} />
            <StatPill label="Equity" value={data?.totalEquity ?? 0} />
            <StatPill label="Period P&L" value={data?.currentPeriodProfit ?? 0} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <GlReportGroupColumn
              title="Assets"
              total={data?.totalAssets ?? 0}
              groups={(data?.groups ?? []).filter((g) => g.sector === "assets")}
            />
            <div className="space-y-4">
              <GlReportGroupColumn
                title="Liabilities"
                total={data?.totalLiabilities ?? 0}
                groups={(data?.groups ?? []).filter((g) => g.sector === "liabilities")}
              />
              <GlReportGroupColumn
                title="Equity"
                total={data?.totalEquity ?? 0}
                groups={(data?.groups ?? []).filter((g) => g.sector === "equity")}
                footer={
                  data?.currentPeriodProfit
                    ? `Includes current period P&L ${inr(data.currentPeriodProfit)}`
                    : undefined
                }
              />
            </div>
          </div>
        </>
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

function GlReportGroupColumn({
  title,
  total,
  groups,
  footer,
}: {
  title: string;
  total: number;
  groups: Array<{
    groupName: string;
    accounts: Array<{ accountId: string; code: string; name: string; amount: number }>;
    total: number;
  }>;
  footer?: string;
}) {
  return (
    <div className="rounded-xl border border-[#EFEFEF] dark:border-white/10">
      <div className="flex items-center justify-between border-b border-[#EFEFEF] bg-[#FAFAFA] px-3 py-2 dark:border-white/10 dark:bg-zinc-900/40">
        <span className="text-[12px] font-semibold uppercase tracking-wider">{title}</span>
        <span className="font-mono text-[13px] font-bold">{inr(total)}</span>
      </div>
      <div className="max-h-[420px] space-y-3 overflow-y-auto p-3">
        {groups.map((g) => (
          <div key={g.groupName}>
            <div className="mb-1 flex justify-between text-[11px] font-semibold text-[#0F766E]">
              <span>{g.groupName}</span>
              <span className="font-mono">{inr(Math.abs(g.total))}</span>
            </div>
            <ul className="space-y-0.5">
              {g.accounts.map((a) => (
                <li key={a.accountId} className="flex justify-between text-[12px]">
                  <span>
                    {a.name}{" "}
                    <span className="font-mono text-[10px] text-black/35">#{a.code}</span>
                  </span>
                  <span className="font-mono">{inr(a.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {groups.length === 0 ? (
          <p className="text-[12px] text-black/40">No balances yet — post receipts or backfill GL</p>
        ) : null}
        {footer ? <p className="text-[10.5px] text-black/45">{footer}</p> : null}
      </div>
    </div>
  );
}
