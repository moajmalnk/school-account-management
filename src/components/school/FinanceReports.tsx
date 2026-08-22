import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Landmark,
  Printer,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { isRecordDeleted } from "@/components/school/ProfileAccountActions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MonthPicker } from "@/components/ui/date-picker";
import { FinanceBarCard, FinanceDonutCard } from "@/components/school/finance-charts";
import { OrganicCard } from "@/components/ui/organic-card";
import {
  expenseSegmentsFromDisbursements,
  isSalaryDisbursement,
  normalizePayeeType,
  queuedPayables,
  totalAccountsPayable,
  totalOperatingExpense,
  type FinanceDisbursement,
} from "@/lib/dashboard-finance";
import { formatEventDate, formatEventDateTime } from "@/lib/dates";
import { downloadCsv, downloadTablePdf } from "@/lib/finance-export";
import { formatDownloadFilename, slugYear, todayStamp } from "@/lib/download-names";
import { useDisbursements } from "@/lib/use-disbursements";
import { useTenantStore, normalizePaymentCategoryLabel, resolvePaymentFeePeriod, currentPayrollMonth, formatPayrollMonthLabel, staffPayableSalary, salaryHistoryPayrollMonth, isSalaryMonthSettled, type Payment, type Student } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

export type LedgerRow = {
  date: string;
  voucher: string;
  particulars: string;
  account: string;
  debit: number;
  credit: number;
  balance: number;
};

function inr(n: number) {
  return `₹ ${n.toLocaleString("en-IN")}`;
}

function reportDownloadName(
  report: string,
  ext: "pdf" | "csv",
  schoolName: string,
  academicYear: string,
  extra?: { name?: string; id?: string },
) {
  return formatDownloadFilename("reports", ext, {
    report,
    school: schoolName,
    year: slugYear(academicYear),
    date: todayStamp(),
    name: extra?.name,
    id: extra?.id,
  });
}

/** Normalize payment/disbursement timestamps for ledger display. */
function formatLedgerDate(raw: string | undefined | null): string {
  return formatEventDate(raw);
}

function buildLedgerRows(payments: Payment[], disbursements: FinanceDisbursement[]): LedgerRow[] {
  const expenseRows: Omit<LedgerRow, "balance">[] = disbursements
    .filter((d) => (d.status || "Cleared") !== "Queued")
    .map((e) => ({
      date: formatLedgerDate(e.time),
      voucher: e.id || "",
      particulars: `${e.payee}${e.desc ? ` · ${e.desc}` : ""}`,
      account: e.payeeType ? normalizePayeeType(e.payeeType) : "Expense",
      debit: e.amount,
      credit: 0,
    }));

  const receiptRows: Omit<LedgerRow, "balance">[] = [...payments].reverse().map((p) => ({
    date: formatLedgerDate(p.time),
    voucher: p.id,
    particulars: `${p.name} · ${p.cat}`,
    account: p.cat,
    debit: 0,
    credit: p.amount,
  }));

  const merged = [...expenseRows, ...receiptRows];
  let balance = 0;
  return merged.map((row) => {
    balance += row.credit - row.debit;
    return { ...row, balance };
  });
}

function withRunningBalance(rows: Omit<LedgerRow, "balance">[]): LedgerRow[] {
  let balance = 0;
  return rows.map((row) => {
    balance += row.credit - row.debit;
    return { ...row, balance };
  });
}

function ExportBar({
  title,
  onCsv,
  onPdf,
  onPrint,
}: {
  title: string;
  onCsv: () => void;
  onPdf: () => void;
  onPrint: () => void;
}) {
  const [pendingExport, setPendingExport] = useState<"csv" | "pdf" | null>(null);

  const confirmExport = () => {
    if (pendingExport === "csv") onCsv();
    else if (pendingExport === "pdf") onPdf();
    setPendingExport(null);
  };

  const exportCopy = {
    csv: {
      title: "Export CSV",
      description: `Export ${title} as a CSV file? The download will start immediately after confirmation.`,
      confirm: "Export CSV",
    },
    pdf: {
      title: "Export PDF",
      description: `Export ${title} as a PDF file? The download will start immediately after confirmation.`,
      confirm: "Export PDF",
    },
  } as const;

  return (
    <>
      <div className="grid grid-cols-12 items-start gap-3 lg:items-center">
        <div className="col-span-12 lg:col-span-7">
          <div className="text-title text-slate-900 dark:text-zinc-50">{title}</div>
        </div>
        <div className="col-span-12 grid grid-cols-3 gap-2 lg:col-span-5">
          <button
            type="button"
            onClick={() => setPendingExport("csv")}
            className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 text-[11.5px] font-medium text-black transition-colors hover:bg-[#F4F4F5] dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:text-[12px]"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => setPendingExport("pdf")}
            className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full bg-[#0F766E] px-3 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#0D9488] sm:text-[12px]"
          >
            <Download className="h-3.5 w-3.5 shrink-0" /> Export PDF
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 text-[11.5px] font-medium text-black transition-colors hover:bg-[#F4F4F5] dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:text-[12px]"
          >
            <Printer className="h-3.5 w-3.5 shrink-0" /> Print PDF
          </button>
        </div>
      </div>

      <Dialog
        open={Boolean(pendingExport)}
        onOpenChange={(next) => {
          if (!next) setPendingExport(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">
              {pendingExport ? exportCopy[pendingExport].title : "Confirm Export"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60 dark:text-zinc-400">
              {pendingExport
                ? exportCopy[pendingExport].description
                : "Are you sure you want to export this report?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingExport(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmExport}
              className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
            >
              {pendingExport ? exportCopy[pendingExport].confirm : "Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReportTable({
  headers,
  rows,
  footer,
  compact = false,
  className,
  mobileCards = true,
}: {
  headers: string[];
  rows: (string | number)[][];
  footer?: ReactNode;
  compact?: boolean;
  className?: string;
  /** Render stacked cards below md. Set false when a custom mobile layout is used. */
  mobileCards?: boolean;
}) {
  const isSection = (cell: string | number) =>
    typeof cell === "string" && /^—\s+.+\s+—$/.test(cell.trim());

  return (
    <>
      {mobileCards ? (
        <div className="mt-4 space-y-2.5 md:hidden">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E5E5E5] bg-[#FAFAFA] px-4 py-8 text-center text-[13px] text-black/45 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-500">
              No rows to show
            </div>
          ) : (
            rows.map((row, i) => {
              if (isSection(row[0] ?? "")) {
                return (
                  <div
                    key={`section-${i}`}
                    className="px-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-500"
                  >
                    {String(row[0]).replace(/^—\s*|\s*—$/g, "")}
                  </div>
                );
              }

              const title = String(row[0] ?? "—");
              const detailPairs = headers
                .slice(1)
                .map((header, idx) => ({
                  header,
                  value: row[idx + 1],
                }))
                .filter((pair) => {
                  const v = pair.value;
                  return v !== "" && v !== undefined && v !== null;
                });

              const lastPair = detailPairs[detailPairs.length - 1];
              const isAmountHeavy =
                detailPairs.length <= 3 ||
                /amount|due|payable|gross|balance|receipt|payment/i.test(
                  lastPair?.header ?? "",
                );

              return (
                <article
                  key={i}
                  className="rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5 dark:border-white/10 dark:bg-zinc-900/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-black dark:text-zinc-100">
                        {title}
                      </div>
                      {detailPairs.length > 0 && !isAmountHeavy && (
                        <p className="mt-1 truncate text-[12px] text-black/55 dark:text-zinc-400">
                          {String(detailPairs[0]?.value ?? "")}
                        </p>
                      )}
                    </div>
                    {isAmountHeavy && lastPair ? (
                      <div className="shrink-0 text-right font-mono text-[13px] font-semibold text-black dark:text-zinc-100">
                        {String(lastPair.value)}
                      </div>
                    ) : null}
                  </div>

                  <div
                    className={cn(
                      "mt-3 grid gap-2 border-t border-[#EFEFEF] pt-3 dark:border-white/10",
                      detailPairs.length >= 4 ? "grid-cols-2" : "grid-cols-1",
                    )}
                  >
                    {detailPairs.map((pair) => {
                      if (isAmountHeavy && pair === lastPair && detailPairs.length > 1) {
                        return null;
                      }
                      return (
                        <div
                          key={pair.header}
                          className="rounded-xl bg-white px-2.5 py-2 ring-1 ring-black/5 dark:bg-zinc-800 dark:ring-white/10"
                        >
                          <div className="text-[9.5px] font-semibold uppercase tracking-wider text-black/40 dark:text-zinc-500">
                            {pair.header}
                          </div>
                          <div className="mt-0.5 truncate text-[12.5px] font-medium text-black dark:text-zinc-100">
                            {String(pair.value ?? "—")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })
          )}
          {footer ? (
            <div className="rounded-2xl border border-[#E5E5E5] bg-white px-3.5 py-3 text-[12px] font-semibold text-black dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100">
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "mobile-scrollbar-none mt-4 overflow-x-auto rounded-lg border border-[#E5E5E5] dark:border-white/10",
          mobileCards && "hidden md:block",
          className,
        )}
      >
        <table
          className={cn(
            "w-full text-left text-[12.5px]",
            compact ? "min-w-[320px]" : "min-w-[640px]",
          )}
        >
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#F4F4F5] dark:border-white/10 dark:bg-zinc-800/80">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-[#F0F0F0] last:border-0 dark:border-white/5">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={cn(
                      "px-3 py-2.5 text-black/80 dark:text-zinc-200",
                      j >= row.length - 3 && "font-mono text-black dark:text-zinc-100",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {footer}
      </div>
    </>
  );
}

function LedgerPostingCards({ rows }: { rows: LedgerRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-[#E5E5E5] bg-[#FAFAFA] px-4 py-10 text-center text-[13px] text-black/45 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-500">
        No ledger postings yet
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2.5 md:hidden">
      {rows.map((row, i) => (
        <article
          key={`${row.voucher}-${i}`}
          className="rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5 dark:border-white/10 dark:bg-zinc-900/50"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[12px] font-semibold text-black dark:text-zinc-100">
                  {row.date || "—"}
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0F766E] ring-1 ring-[#0F766E]/20 dark:bg-zinc-800">
                  {row.voucher || "—"}
                </span>
              </div>
              <p className="mt-1.5 text-[13px] font-medium leading-snug text-black dark:text-zinc-100">
                {row.particulars || "—"}
              </p>
              <p className="mt-1 text-[11px] text-black/50 dark:text-zinc-400">
                Account · {row.account || "—"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              {row.credit > 0 ? (
                <div className="font-mono text-[13px] font-semibold text-[#0F766E]">
                  +{inr(row.credit)}
                </div>
              ) : row.debit > 0 ? (
                <div className="font-mono text-[13px] font-semibold text-[#B45309]">
                  −{inr(row.debit)}
                </div>
              ) : (
                <div className="font-mono text-[13px] text-black/40">—</div>
              )}
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-black/40 dark:text-zinc-500">
                Bal {inr(row.balance)}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#EFEFEF] pt-3 dark:border-white/10">
            <div className="rounded-xl bg-white px-2.5 py-2 ring-1 ring-black/5 dark:bg-zinc-800 dark:ring-white/10">
              <div className="text-[9.5px] font-semibold uppercase tracking-wider text-black/40 dark:text-zinc-500">
                Debit
              </div>
              <div className="mt-0.5 font-mono text-[12.5px] font-semibold text-black dark:text-zinc-100">
                {row.debit ? inr(row.debit) : "—"}
              </div>
            </div>
            <div className="rounded-xl bg-white px-2.5 py-2 ring-1 ring-black/5 dark:bg-zinc-800 dark:ring-white/10">
              <div className="text-[9.5px] font-semibold uppercase tracking-wider text-black/40 dark:text-zinc-500">
                Credit
              </div>
              <div className="mt-0.5 font-mono text-[12.5px] font-semibold text-black dark:text-zinc-100">
                {row.credit ? inr(row.credit) : "—"}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function SummaryStrip({ items }: { items: { label: string; value: string; accent?: boolean }[] }) {
  return (
    <div
      className={cn(
        "mt-4 grid gap-2.5 sm:gap-3",
        items.length === 4
          ? "grid-cols-2"
          : items.length >= 3
            ? "grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2",
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "min-w-0 rounded-2xl p-3 sm:p-4",
            item.accent
              ? "bg-gradient-to-br from-[#0F766E] to-[#115E59] text-white shadow-sm shadow-teal-900/15"
              : "bg-slate-50 text-slate-900 ring-1 ring-slate-200/70 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-white/10",
          )}
        >
          <div
            className={cn(
              "text-[9px] font-semibold uppercase tracking-wider sm:text-[10px]",
              item.accent ? "text-teal-100/75" : "text-slate-500 dark:text-zinc-400",
            )}
          >
            {item.label}
          </div>
          <div className="mt-1 truncate font-mono text-[14px] font-semibold tracking-tight sm:text-[18px]">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GeneralLedgerReport() {
  const { activePayments: payments, academicYear, schoolDetails } = useTenantStore();
  const { disbursements } = useDisbursements();
  const schoolName = schoolDetails.name || "School";

  const [query, setQuery] = useState("");
  const [entryType, setEntryType] = useState<"all" | "credit" | "debit">("all");
  const [account, setAccount] = useState("all");

  const allRows = useMemo(
    () => buildLedgerRows(payments, disbursements),
    [payments, disbursements],
  );

  const accountOptions = useMemo(
    () =>
      Array.from(new Set(allRows.map((r) => r.account).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [allRows],
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = allRows.filter((row) => {
      if (entryType === "credit" && row.credit <= 0) return false;
      if (entryType === "debit" && row.debit <= 0) return false;
      if (account !== "all" && row.account !== account) return false;
      if (!q) return true;
      const haystack = [
        row.date,
        row.voucher,
        row.particulars,
        row.account,
        String(row.debit),
        String(row.credit),
        row.debit ? row.debit.toLocaleString("en-IN") : "",
        row.credit ? row.credit.toLocaleString("en-IN") : "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
    // Recompute running balance for the visible set so the ledger stays coherent when filtered.
    return withRunningBalance(
      matched.map(({ balance: _balance, ...rest }) => rest),
    );
  }, [allRows, query, entryType, account]);

  const totalDebit = filteredRows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = filteredRows.reduce((s, r) => s + r.credit, 0);
  const closing = filteredRows.at(-1)?.balance ?? 0;
  const filtersActive = Boolean(query) || entryType !== "all" || account !== "all";

  const tableRows = filteredRows.map((r) => [
    r.date,
    r.voucher,
    r.particulars,
    r.account,
    r.debit ? inr(r.debit) : "—",
    r.credit ? inr(r.credit) : "—",
    inr(r.balance),
  ]);

  const headers = ["Date", "Voucher", "Particulars", "Account", "Debit", "Credit", "Balance"];

  const exportMeta = `${schoolName} · ${academicYear} · General Ledger`;

  const clearFilters = () => {
    setQuery("");
    setEntryType("all");
    setAccount("all");
  };

  const handleCsv = () => {
    downloadCsv(
      reportDownloadName("general-ledger", "csv", schoolName, academicYear),
      headers,
      filteredRows.map((r) => [
        r.date,
        r.voucher,
        r.particulars,
        r.account,
        r.debit,
        r.credit,
        r.balance,
      ]),
    );
    toast.success("Ledger exported as CSV");
  };

  const handlePdf = () => {
    downloadTablePdf({
      filename: reportDownloadName("general-ledger", "pdf", schoolName, academicYear),
      title: "General Ledger",
      subtitle: exportMeta,
      headers,
      rows: tableRows,
      footer: `Total Debit ${inr(totalDebit)} · Total Credit ${inr(totalCredit)} · Closing ${inr(closing)}`,
    });
    toast.success("Ledger exported as PDF");
  };

  const handlePrint = () => {
    downloadTablePdf({
      filename: reportDownloadName("general-ledger", "pdf", schoolName, academicYear),
      title: "General Ledger",
      subtitle: exportMeta,
      headers,
      rows: tableRows,
      footer: `Total Debit ${inr(totalDebit)} · Total Credit ${inr(totalCredit)} · Closing ${inr(closing)}`,
      action: "print",
    });
    toast.success("Print dialog opened");
  };

  return (
    <div className="grid grid-cols-12 gap-4 sm:gap-5">
      <OrganicCard tone="white" cornerSide="tr" padded className="col-span-12">
        <ExportBar title="General Ledger" onCsv={handleCsv} onPdf={handlePdf} onPrint={handlePrint} />
        <p className="mt-1 text-[12px] text-black/55">
          Chronological double-entry view · {filteredRows.length}
          {filtersActive ? ` of ${allRows.length}` : ""} postings · {academicYear}
        </p>
        <SummaryStrip
          items={[
            { label: "Total Debit", value: inr(totalDebit) },
            { label: "Total Credit", value: inr(totalCredit) },
            { label: "Closing Balance", value: inr(closing), accent: true },
          ]}
        />
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="bl" padded className="col-span-12">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-title text-slate-900 dark:text-zinc-50">Ledger Postings</div>
            <p className="mt-1 text-[12px] text-black/55">
              {filteredRows.length} of {allRows.length} entr
              {allRows.length === 1 ? "y" : "ies"}
              {filtersActive ? " · filters applied" : ""}
            </p>
          </div>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] font-semibold text-[#0F766E] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="sm:col-span-2 xl:col-span-4">
            <ReportSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search voucher, particulars, account, amount…"
            />
          </div>
          <Select
            value={entryType}
            onValueChange={(v) => setEntryType(v as typeof entryType)}
          >
            <SelectTrigger className="h-10 w-full rounded-xl border-[#E5E5E5] bg-white">
              <SelectValue placeholder="All entries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entries</SelectItem>
              <SelectItem value="credit">Credits only</SelectItem>
              <SelectItem value="debit">Debits only</SelectItem>
            </SelectContent>
          </Select>
          <ReportFilterSelect
            value={account}
            onChange={setAccount}
            placeholder="All accounts"
            options={accountOptions}
            className="sm:col-span-1 xl:col-span-1"
          />
        </div>

        {filteredRows.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/15 px-4 py-10 text-center text-[13px] text-black/55">
            {allRows.length === 0
              ? "No ledger postings yet"
              : "No postings match your search or filters"}
          </div>
        ) : (
          <>
            <LedgerPostingCards rows={filteredRows} />
            <ReportTable
              headers={headers}
              rows={tableRows}
              mobileCards={false}
              className="hidden md:block"
              footer={
                <div className="border-t border-[#E5E5E5] bg-[#FAFAFA] px-3 py-3 text-[12px] font-semibold text-black">
                  Totals · Debit {inr(totalDebit)} · Credit {inr(totalCredit)} · Closing{" "}
                  {inr(closing)}
                </div>
              }
            />
          </>
        )}
      </OrganicCard>
    </div>
  );
}

export function ProfitLossReport() {
  const { activePayments: payments, academicYear, schoolDetails } = useTenantStore();
  const { disbursements } = useDisbursements();
  const schoolName = schoolDetails.name || "School";

  const incomeByCategory = useMemo(() => {
    const map = new Map<string, number>();
    payments.forEach((p) => map.set(p.cat, (map.get(p.cat) ?? 0) + p.amount));
    return Array.from(map.entries()).map(([label, amount]) => ({ label, amount }));
  }, [payments]);

  const expenseSegments = useMemo(
    () => expenseSegmentsFromDisbursements(disbursements),
    [disbursements],
  );

  const totalIncome = incomeByCategory.reduce((s, i) => s + i.amount, 0);
  const totalExpense = totalOperatingExpense(disbursements);
  const netProfit = totalIncome - totalExpense;

  const headers = ["Line Item", "Type", "Amount (₹)"];
  const tableRows = [
    ...incomeByCategory.map((i) => [i.label, "Income", inr(i.amount)]),
    ...expenseSegments.map((e) => [e.label, "Expense", inr(e.value)]),
    ["Net Surplus / (Deficit)", "Result", inr(netProfit)],
  ];

  const exportMeta = `${schoolName} · ${academicYear} · Profit & Loss`;

  const handleCsv = () => {
    downloadCsv(reportDownloadName("profit-loss", "csv", schoolName, academicYear), headers, [
      ...incomeByCategory.map((i) => [i.label, "Income", i.amount]),
      ...expenseSegments.map((e) => [e.label, "Expense", e.value]),
      ["Net Surplus / (Deficit)", "Result", netProfit],
    ]);
    toast.success("P&L exported as CSV");
  };

  const handlePdf = () => {
    downloadTablePdf({
      filename: reportDownloadName("profit-loss", "pdf", schoolName, academicYear),
      title: "Profit & Loss Account",
      subtitle: exportMeta,
      headers,
      rows: tableRows,
      footer: `Total Income ${inr(totalIncome)} · Total Expense ${inr(totalExpense)} · Net ${inr(netProfit)}`,
    });
    toast.success("P&L exported as PDF");
  };

  const handlePrint = () => {
    downloadTablePdf({
      filename: reportDownloadName("profit-loss", "pdf", schoolName, academicYear),
      title: "Profit & Loss Account",
      subtitle: exportMeta,
      headers,
      rows: tableRows,
      footer: `Total Income ${inr(totalIncome)} · Total Expense ${inr(totalExpense)} · Net ${inr(netProfit)}`,
      action: "print",
    });
    toast.success("Print dialog opened");
  };

  return (
    <div className="grid grid-cols-12 gap-4 sm:gap-5">
      <OrganicCard tone="white" cornerSide="tr" padded className="col-span-12 lg:col-span-8">
        <ExportBar title="Profit & Loss Account" onCsv={handleCsv} onPdf={handlePdf} onPrint={handlePrint} />
        <p className="mt-1 text-[12px] text-black/55">
          Income from fee receipts vs operating expenditure · {academicYear}
        </p>
        <ReportTable headers={headers} rows={tableRows} />
      </OrganicCard>

      <OrganicCard
        tone="lime"
        cornerSide="bl"
        padded
        className="col-span-12 max-h-[calc(100dvh-9rem)] overflow-hidden p-4 sm:p-6 lg:col-span-4"
      >
        <div className="text-[28px] font-semibold leading-none tracking-tight text-white sm:text-title">
          Statement Summary
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
          <div className="min-w-0 rounded-xl bg-white/15 px-3 py-2.5 ring-1 ring-white/20 sm:rounded-2xl sm:p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-teal-100/75">
              Gross Income
            </div>
            <div className="mt-1 truncate font-mono text-[18px] font-semibold text-white sm:text-[20px]">
              {inr(totalIncome)}
            </div>
          </div>
          <div className="min-w-0 rounded-xl bg-white/15 px-3 py-2.5 ring-1 ring-white/20 sm:rounded-2xl sm:p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-teal-100/75">
              Operating Expense
            </div>
            <div className="mt-1 truncate font-mono text-[18px] font-semibold text-white sm:text-[20px]">
              {inr(totalExpense)}
            </div>
          </div>
          <div className="min-w-0 rounded-xl bg-slate-950/45 px-3 py-2.5 text-white ring-1 ring-white/10 sm:rounded-2xl sm:p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
              Net Surplus
            </div>
            <div className="mt-1 truncate font-mono text-[18px] font-semibold sm:text-[22px]">
              {inr(netProfit)}
            </div>
          </div>
        </div>
      </OrganicCard>

      <div className="col-span-12 min-w-0 sm:col-span-6">
        <FinanceDonutCard
          title="Income Mix"
          cornerSide="tr"
          segments={incomeByCategory.map((item) => ({
            label: item.label,
            value: item.amount,
          }))}
        />
      </div>
      <div className="col-span-12 min-w-0 sm:col-span-6">
        <FinanceBarCard
          title="Expense Breakdown"
          cornerSide="bl"
          fill="#0F766E"
          segments={expenseSegments.map((item) => ({
            label: item.label.replace(" & ", " · "),
            value: item.value,
          }))}
        />
      </div>
    </div>
  );
}

export function BalanceSheetReport() {
  const { activePayments: payments, activeStudents: students, academicYear, schoolDetails } =
    useTenantStore();
  const { disbursements } = useDisbursements();
  const schoolName = schoolDetails.name || "School";
  const openPayables = useMemo(() => queuedPayables(disbursements), [disbursements]);

  const cashOnHand = useMemo(
    () => payments.filter((p) => p.mode === "Cash").reduce((s, p) => s + p.amount, 0),
    [payments],
  );
  const bankBalance = useMemo(
    () => payments.filter((p) => p.mode !== "Cash").reduce((s, p) => s + p.amount, 0),
    [payments],
  );
  const receivables = useMemo(
    () =>
      students
        .filter((st) => !isRecordDeleted(st.deletedAt))
        .reduce((s, st) => s + st.due, 0),
    [students],
  );
  const payables = totalAccountsPayable(disbursements);
  const totalAssets = cashOnHand + bankBalance + receivables;
  const equity = totalAssets - payables;

  const assetRows = [
    ["Cash in Hand", inr(cashOnHand)],
    ["Bank & UPI", inr(bankBalance)],
    ["Accounts Receivable (Fees Due)", inr(receivables)],
    ["Total Assets", inr(totalAssets)],
  ];
  const liabilityRows = [
    ["Accounts Payable", inr(payables)],
    ["Retained Surplus / Equity", inr(equity)],
    ["Total Liabilities & Equity", inr(payables + equity)],
  ];

  const headers = ["Account Head", "Amount (₹)"];
  const tableRows = [
    ["— ASSETS —", ""],
    ...assetRows,
    ["— LIABILITIES & EQUITY —", ""],
    ...liabilityRows,
  ];

  const exportMeta = `${schoolName} · ${academicYear} · Balance Sheet`;

  const handleCsv = () => {
    downloadCsv(reportDownloadName("balance-sheet", "csv", schoolName, academicYear), headers, [
      ["Cash in Hand", cashOnHand],
      ["Bank & UPI", bankBalance],
      ["Accounts Receivable", receivables],
      ["Total Assets", totalAssets],
      ["Accounts Payable", payables],
      ["Retained Surplus / Equity", equity],
      ["Total Liabilities & Equity", payables + equity],
    ]);
    toast.success("Balance sheet exported as CSV");
  };

  const handlePdf = () => {
    downloadTablePdf({
      filename: reportDownloadName("balance-sheet", "pdf", schoolName, academicYear),
      title: "Balance Sheet",
      subtitle: exportMeta,
      headers,
      rows: tableRows,
      footer: `Assets ${inr(totalAssets)} · Liabilities & Equity ${inr(payables + equity)}`,
    });
    toast.success("Balance sheet exported as PDF");
  };

  const handlePrint = () => {
    downloadTablePdf({
      filename: reportDownloadName("balance-sheet", "pdf", schoolName, academicYear),
      title: "Balance Sheet",
      subtitle: exportMeta,
      headers,
      rows: tableRows,
      footer: `Assets ${inr(totalAssets)} · Liabilities & Equity ${inr(payables + equity)}`,
      action: "print",
    });
    toast.success("Print dialog opened");
  };

  return (
    <div className="grid grid-cols-12 gap-4 sm:gap-5">
      <OrganicCard tone="white" cornerSide="tr" padded className="col-span-12 lg:col-span-6">
        <ExportBar title="Balance Sheet" onCsv={handleCsv} onPdf={handlePdf} onPrint={handlePrint} />
        <p className="mt-1 text-[12px] text-black/55">
          Position statement as at today · {academicYear}
        </p>
        <SummaryStrip
          items={[
            { label: "Total Assets", value: inr(totalAssets) },
            { label: "Payables", value: inr(payables) },
            { label: "Net Equity", value: inr(equity), accent: true },
          ]}
        />
        <ReportTable headers={headers} rows={tableRows} compact />
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="bl" padded className="col-span-12 lg:col-span-6">
        <div className="text-title text-slate-900 dark:text-zinc-50">Outstanding Payables</div>
        <p className="mt-1 text-[12px] text-black/55">{openPayables.length} open obligation{openPayables.length === 1 ? "" : "s"}</p>
        <div className="mt-4 space-y-2">
          {openPayables.length === 0 ? (
            <div className="rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-4 text-center text-[12px] text-black/55">
              No open payables
            </div>
          ) : (
            openPayables.map((p) => (
            <div
              key={p.id || p.payee}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5 text-[12.5px]"
            >
              <span className="min-w-0 flex-1 truncate font-medium text-black">{p.payee}</span>
              <span className="shrink-0 font-mono text-black">{inr(p.amount)}</span>
            </div>
            ))
          )}
        </div>
        <div className="mt-4 rounded-lg bg-[#F4F4F5] p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-black/55">
            Fee Receivables
          </div>
          <div className="mt-1 font-mono text-[18px] font-semibold">{inr(receivables)}</div>
          <p className="mt-1 text-[11px] text-black/55">
            Aggregated from {students.filter((s) => !isRecordDeleted(s.deletedAt) && s.due > 0).length} students with open balances
          </p>
        </div>
      </OrganicCard>

      <div className="col-span-6 min-w-0">
        <FinanceDonutCard
          title="Asset Composition"
          cornerSide="tr"
          segments={[
            { label: "Cash", value: cashOnHand },
            { label: "Bank & UPI", value: bankBalance },
            { label: "Receivables", value: receivables },
          ]}
        />
      </div>
      <div className="col-span-6 min-w-0">
        <FinanceBarCard
          title="Payables Snapshot"
          cornerSide="bl"
          segments={openPayables.map((item) => ({
            label: item.payee.split(" · ")[0],
            value: item.amount,
          }))}
        />
      </div>
    </div>
  );
}

function isFeeCategory(cat: string) {
  const lower = normalizePaymentCategoryLabel(cat).toLowerCase();
  return (
    lower.includes("tuition") ||
    lower.includes("tution") ||
    lower.includes("vehicle") ||
    lower.includes("transport") ||
    lower.includes("bus") ||
    lower.includes("fee")
  );
}

function ReportSearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-zinc-500" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-xl border-[#E5E5E5] bg-white pl-9 pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-black/45 transition-colors hover:bg-[#F4F4F5] hover:text-black"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function ReportFilterSelect({
  value,
  onChange,
  placeholder,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("h-10 w-full rounded-xl border-[#E5E5E5] bg-white", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function resolvePaymentClass(payment: Payment, students: Student[]) {
  if (payment.className) return payment.className;
  return students.find((s) => s.name === payment.name)?.cls ?? "—";
}

export function FeesReport() {
  const { activePayments: payments, activeStudents: students, academicYear, schoolDetails } =
    useTenantStore();
  const schoolName = schoolDetails.name || "Silver Hills Global";

  const [collectionQuery, setCollectionQuery] = useState("");
  const [collectionCategory, setCollectionCategory] = useState("all");
  const [collectionMode, setCollectionMode] = useState("all");
  const [collectionClass, setCollectionClass] = useState("all");

  const [duesQuery, setDuesQuery] = useState("");
  const [duesClass, setDuesClass] = useState("all");

  const feeReceipts = useMemo(
    () =>
      payments
        .filter(
          (p) => p.payerType !== "external" && (isFeeCategory(p.cat) || p.payerType === "student"),
        )
        .map((p) => ({
          ...p,
          resolvedClass: resolvePaymentClass(p, students),
        })),
    [payments, students],
  );

  const categoryOptions = useMemo(
    () => Array.from(new Set(feeReceipts.map((p) => p.cat))).sort(),
    [feeReceipts],
  );
  const modeOptions = useMemo(
    () => Array.from(new Set(feeReceipts.map((p) => p.mode))).sort(),
    [feeReceipts],
  );
  const classOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...feeReceipts.map((p) => p.resolvedClass).filter((c) => c !== "—"),
          ...students.map((s) => s.cls),
        ]),
      ).sort(),
    [feeReceipts, students],
  );

  const filteredCollections = useMemo(() => {
    const q = collectionQuery.trim().toLowerCase();
    return feeReceipts.filter((p) => {
      if (collectionCategory !== "all" && p.cat !== collectionCategory) return false;
      if (collectionMode !== "all" && p.mode !== collectionMode) return false;
      if (collectionClass !== "all" && p.resolvedClass !== collectionClass) return false;
      if (!q) return true;
      const haystack = [
        p.id,
        p.name,
        p.resolvedClass,
        p.cat,
        resolvePaymentFeePeriod(p) ?? "",
        p.mode,
        p.time,
        formatEventDateTime(p.time),
        p.narration ?? "",
        String(p.amount),
        p.amount.toLocaleString("en-IN"),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [feeReceipts, collectionQuery, collectionCategory, collectionMode, collectionClass]);

  const overdueStudents = useMemo(
    () => students.filter((s) => !isRecordDeleted(s.deletedAt) && s.due > 0),
    [students],
  );

  const filteredDues = useMemo(() => {
    const q = duesQuery.trim().toLowerCase();
    return [...overdueStudents]
      .filter((s) => {
        if (duesClass !== "all" && s.cls !== duesClass) return false;
        if (!q) return true;
        const haystack = [s.id, s.name, s.cls, s.guardian, String(s.due), s.due.toLocaleString("en-IN")]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => b.due - a.due);
  }, [overdueStudents, duesQuery, duesClass]);

  const collected = useMemo(
    () => filteredCollections.reduce((sum, p) => sum + p.amount, 0),
    [filteredCollections],
  );
  const outstanding = useMemo(
    () => filteredDues.reduce((sum, s) => sum + s.due, 0),
    [filteredDues],
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filteredCollections) {
      map.set(p.cat, (map.get(p.cat) ?? 0) + p.amount);
    }
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredCollections]);

  const collectionRows = filteredCollections.map((p) => [
    p.id,
    p.name,
    p.resolvedClass,
    p.cat,
    resolvePaymentFeePeriod(p) ?? "—",
    p.mode,
    inr(p.amount),
    formatEventDateTime(p.time),
  ]);

  const outstandingRows = filteredDues.map((s) => [
    s.id,
    s.name,
    s.cls,
    s.guardian,
    inr(s.due),
  ]);

  const clearCollectionFilters = () => {
    setCollectionQuery("");
    setCollectionCategory("all");
    setCollectionMode("all");
    setCollectionClass("all");
  };

  const clearDuesFilters = () => {
    setDuesQuery("");
    setDuesClass("all");
  };

  const handleCsv = () => {
    downloadCsv(
      reportDownloadName("fees-report", "csv", schoolName, academicYear),
      ["Receipt", "Student", "Class", "Category", "Fee Period", "Mode", "Amount", "Time"],
      filteredCollections.map((p) => [
        p.id,
        p.name,
        p.resolvedClass === "—" ? "" : p.resolvedClass,
        p.cat,
        resolvePaymentFeePeriod(p) ?? "",
        p.mode,
        p.amount,
        formatEventDateTime(p.time),
      ]),
    );
    toast.success("Fees report exported", { description: "CSV download started" });
  };

  const handlePdf = () => {
    downloadTablePdf({
      filename: reportDownloadName("fees-report", "pdf", schoolName, academicYear),
      title: "Fees Report",
      subtitle: `${schoolName} · ${academicYear}`,
      headers: ["Receipt", "Student", "Class", "Category", "Period", "Mode", "Amount", "Time"],
      rows: filteredCollections.map((p) => [
        p.id,
        p.name,
        p.resolvedClass,
        p.cat,
        resolvePaymentFeePeriod(p) ?? "—",
        p.mode,
        p.amount.toLocaleString("en-IN"),
        formatEventDateTime(p.time),
      ]),
      footer: `Collected ${inr(collected)} · Outstanding ${inr(outstanding)}`,
    });
    toast.success("Fees report PDF downloaded");
  };

  const handlePrint = () => {
    downloadTablePdf({
      filename: reportDownloadName("fees-report", "pdf", schoolName, academicYear),
      title: "Fees Report",
      subtitle: `${schoolName} · ${academicYear}`,
      headers: ["Receipt", "Student", "Class", "Category", "Period", "Mode", "Amount", "Time"],
      rows: filteredCollections.map((p) => [
        p.id,
        p.name,
        p.resolvedClass,
        p.cat,
        resolvePaymentFeePeriod(p) ?? "—",
        p.mode,
        p.amount.toLocaleString("en-IN"),
        formatEventDateTime(p.time),
      ]),
      footer: `Collected ${inr(collected)} · Outstanding ${inr(outstanding)}`,
      action: "print",
    });
    toast.success("Print dialog opened");
  };

  return (
    <div className="grid grid-cols-12 gap-4 sm:gap-5">
      <OrganicCard tone="white" cornerSide="tr" padded className="col-span-12">
        <ExportBar title="Fees Report" onCsv={handleCsv} onPdf={handlePdf} onPrint={handlePrint} />
        <p className="mt-1 text-[12px] text-black/55">
          Student fee collections and outstanding dues · {academicYear}
        </p>
        <SummaryStrip
          items={[
            { label: "Fees Collected", value: inr(collected) },
            { label: "Outstanding", value: inr(outstanding) },
            {
              label: "Students Overdue",
              value: String(filteredDues.length),
              accent: true,
            },
          ]}
        />
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="bl" padded className="col-span-12 lg:col-span-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-title text-slate-900 dark:text-zinc-50">Fee Collections</div>
            <p className="mt-1 text-[12px] text-black/55">
              {filteredCollections.length} of {feeReceipts.length} receipt
              {feeReceipts.length === 1 ? "" : "s"}
            </p>
          </div>
          {(collectionQuery ||
            collectionCategory !== "all" ||
            collectionMode !== "all" ||
            collectionClass !== "all") && (
            <button
              type="button"
              onClick={clearCollectionFilters}
              className="text-[11px] font-semibold text-[#0F766E] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="sm:col-span-2 xl:col-span-4">
            <ReportSearchInput
              value={collectionQuery}
              onChange={setCollectionQuery}
              placeholder="Search receipt, student, category, mode…"
            />
          </div>
          <ReportFilterSelect
            value={collectionCategory}
            onChange={setCollectionCategory}
            placeholder="All categories"
            options={categoryOptions}
          />
          <ReportFilterSelect
            value={collectionMode}
            onChange={setCollectionMode}
            placeholder="All modes"
            options={modeOptions}
          />
          <ReportFilterSelect
            value={collectionClass}
            onChange={setCollectionClass}
            placeholder="All classes"
            options={classOptions}
            className="sm:col-span-2 xl:col-span-1"
          />
        </div>

        {collectionRows.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-black/15 px-4 py-8 text-center text-[12px] text-black/55">
            {feeReceipts.length === 0
              ? "No student fee receipts recorded yet"
              : "No collections match your search or filters"}
          </div>
        ) : (
          <ReportTable
            headers={["Receipt", "Student", "Class", "Category", "Period", "Mode", "Amount", "Time"]}
            rows={collectionRows}
          />
        )}
      </OrganicCard>

      <div className="col-span-12 space-y-4 lg:col-span-5">
        <OrganicCard tone="white" cornerSide="tr" padded>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-title text-slate-900 dark:text-zinc-50">Outstanding Dues</div>
              <p className="mt-1 text-[12px] text-black/55">
                {filteredDues.length} of {overdueStudents.length} student
                {overdueStudents.length === 1 ? "" : "s"} with open balance
              </p>
            </div>
            {(duesQuery || duesClass !== "all") && (
              <button
                type="button"
                onClick={clearDuesFilters}
                className="text-[11px] font-semibold text-[#0F766E] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <ReportSearchInput
                value={duesQuery}
                onChange={setDuesQuery}
                placeholder="Search student, class, guardian…"
              />
            </div>
            <ReportFilterSelect
              value={duesClass}
              onChange={setDuesClass}
              placeholder="All classes"
              options={classOptions}
              className="sm:col-span-2"
            />
          </div>

          {outstandingRows.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-black/15 px-4 py-6 text-center text-[12px] text-black/55">
              {overdueStudents.length === 0
                ? "All student balances are cleared"
                : "No dues match your search or filters"}
            </div>
          ) : (
            <ReportTable
              headers={["ID", "Student", "Class", "Guardian", "Due"]}
              rows={outstandingRows}
              compact
            />
          )}
        </OrganicCard>

        {byCategory.length > 0 && (
          <div className="min-h-0">
            <FinanceDonutCard title="Collection by Category" cornerSide="bl" segments={byCategory} />
          </div>
        )}
      </div>
    </div>
  );
}

export function SalaryReport() {
  const { staff, academicYear, schoolDetails } = useTenantStore();
  const { disbursements } = useDisbursements();
  const schoolName = schoolDetails.name || "School";
  const [payrollMonth, setPayrollMonth] = useState(currentPayrollMonth);

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("active");
  const [payableQuery, setPayableQuery] = useState("");
  const isCurrentPayrollMonth = payrollMonth === currentPayrollMonth();
  const payrollMonthLabel = formatPayrollMonthLabel(payrollMonth);

  const departmentOptions = useMemo(
    () => Array.from(new Set(staff.map((s) => s.dept))).sort(),
    [staff],
  );
  const roleOptions = useMemo(
    () => Array.from(new Set(staff.map((s) => s.role))).sort(),
    [staff],
  );

  const filteredStaff = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...staff]
      .filter((s) => !isRecordDeleted(s.deletedAt))
      .filter((s) => {
        if (status === "active" && !s.active) return false;
        if (status === "inactive" && s.active) return false;
        if (department !== "all" && s.dept !== department) return false;
        if (role !== "all" && s.role !== role) return false;
        if (!q) return true;
        const pay = staffPayableSalary(s, payrollMonth);
        const haystack = [
          s.id,
          s.name,
          s.role,
          s.dept,
          String(s.basicSalary),
          String(s.additionalAllowances),
          String(pay.gross),
          String(pay.payable),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [staff, query, department, role, status, payrollMonth]);

  const payrollRows = useMemo(
    () =>
      filteredStaff.map((s) => {
        const pay = staffPayableSalary(s, payrollMonth);
        return {
          staff: s,
          gross: pay.gross,
          payable: pay.payable,
          attendance: pay.attendance,
          attendanceLabel: pay.attendance
            ? `${pay.attendance.daysPresent}/${pay.attendance.workingDays}`
            : "—",
        };
      }),
    [filteredStaff, payrollMonth],
  );

  const totalBasic = payrollRows.reduce((sum, row) => sum + row.staff.basicSalary, 0);
  const totalAllowances = payrollRows.reduce(
    (sum, row) => sum + row.staff.additionalAllowances,
    0,
  );
  const totalGross = payrollRows.reduce((sum, row) => sum + row.gross, 0);
  const totalPayable = payrollRows.reduce((sum, row) => sum + row.payable, 0);

  const salaryPayables = useMemo(
    () => queuedPayables(disbursements).filter(isSalaryDisbursement),
    [disbursements],
  );

  const filteredPayables = useMemo(() => {
    const q = payableQuery.trim().toLowerCase();
    if (!q) return salaryPayables;
    return salaryPayables.filter((item) => {
      const haystack = [item.payee, String(item.amount), item.amount.toLocaleString("en-IN")]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [salaryPayables, payableQuery]);

  const salaryPayableAmount = filteredPayables.reduce((sum, item) => sum + item.amount, 0);

  const recentSalaryHistory = useMemo(() => {
    const rows: Array<{
      id: string;
      staffId: string;
      staffName: string;
      paidAt: string;
      month: string | null;
      description: string;
      mode: string;
      amount: number;
      status: string;
    }> = [];
    for (const member of staff) {
      if (isRecordDeleted(member.deletedAt)) continue;
      for (const entry of member.salaryHistory ?? []) {
        rows.push({
          id: entry.id,
          staffId: member.id,
          staffName: member.name,
          paidAt: entry.paidAt,
          month: salaryHistoryPayrollMonth(entry),
          description: entry.description,
          mode: entry.mode,
          amount: entry.amount,
          status: entry.status,
        });
      }
    }
    return rows.sort((a, b) => String(b.paidAt).localeCompare(String(a.paidAt))).slice(0, 24);
  }, [staff]);

  const historyPaidTotal = recentSalaryHistory.reduce((sum, row) => sum + row.amount, 0);

  const paidThisMonthCount = useMemo(
    () =>
      filteredStaff.filter((s) => {
        const pay = staffPayableSalary(s, payrollMonth);
        return isSalaryMonthSettled(s.salaryHistory, payrollMonth, pay.payable);
      }).length,
    [filteredStaff, payrollMonth],
  );

  const tableRows = payrollRows.map(({ staff: s, gross, payable, attendanceLabel }) => {
    const settled = isSalaryMonthSettled(s.salaryHistory, payrollMonth, payable);
    return [
      s.id,
      s.name,
      s.role,
      s.dept,
      attendanceLabel,
      inr(s.basicSalary),
      inr(s.additionalAllowances),
      inr(gross),
      inr(payable),
      settled ? "Paid" : "Due",
    ];
  });

  const payableRows = filteredPayables.map((item) => [item.payee, inr(item.amount)]);
  const historyRows = recentSalaryHistory.map((row) => [
    formatEventDateTime(row.paidAt),
    row.staffName,
    row.month ? formatPayrollMonthLabel(row.month) : "—",
    row.mode,
    inr(row.amount),
    row.status,
  ]);

  const deptSegments = useMemo(
    () =>
      Array.from(
        payrollRows.reduce((map, row) => {
          map.set(row.staff.dept, (map.get(row.staff.dept) ?? 0) + row.payable);
          return map;
        }, new Map<string, number>()),
      ).map(([label, value]) => ({ label, value })),
    [payrollRows],
  );

  const clearPayrollFilters = () => {
    setQuery("");
    setDepartment("all");
    setRole("all");
    setStatus("active");
  };

  const handleCsv = () => {
    downloadCsv(
      reportDownloadName("salary-report", "csv", schoolName, academicYear, { name: payrollMonth }),
      [
        "Staff ID",
        "Name",
        "Role",
        "Department",
        "Attendance",
        "Basic",
        "Allowances",
        "Gross",
        "Payable",
        "Status",
        "Month",
      ],
      payrollRows.map(({ staff: s, gross, payable, attendanceLabel }) => [
        s.id,
        s.name,
        s.role,
        s.dept,
        attendanceLabel,
        s.basicSalary,
        s.additionalAllowances,
        gross,
        payable,
        isSalaryMonthSettled(s.salaryHistory, payrollMonth, payable) ? "Paid" : "Due",
        payrollMonth,
      ]),
    );
    toast.success("Salary report exported", { description: "CSV download started" });
  };

  const handlePdf = () => {
    downloadTablePdf({
      filename: reportDownloadName("salary-report", "pdf", schoolName, academicYear, { name: payrollMonth }),
      title: `Salary Report · ${payrollMonthLabel}`,
      subtitle: `${schoolName} · ${academicYear} · ${payrollMonth}`,
      headers: ["ID", "Name", "Role", "Dept", "Attn", "Basic", "Allow.", "Gross", "Payable", "Status"],
      rows: payrollRows.map(({ staff: s, gross, payable, attendanceLabel }) => [
        s.id,
        s.name,
        s.role,
        s.dept,
        attendanceLabel,
        s.basicSalary.toLocaleString("en-IN"),
        s.additionalAllowances.toLocaleString("en-IN"),
        gross.toLocaleString("en-IN"),
        payable.toLocaleString("en-IN"),
        isSalaryMonthSettled(s.salaryHistory, payrollMonth, payable) ? "Paid" : "Due",
      ]),
      footer: `Gross ${inr(totalGross)} · Attendance payable ${inr(totalPayable)} · Ledger payable ${inr(salaryPayableAmount)}`,
    });
    toast.success("Salary report PDF downloaded");
  };

  const handlePrint = () => {
    downloadTablePdf({
      filename: reportDownloadName("salary-report", "pdf", schoolName, academicYear, { name: payrollMonth }),
      title: `Salary Report · ${payrollMonthLabel}`,
      subtitle: `${schoolName} · ${academicYear} · ${payrollMonth}`,
      headers: ["ID", "Name", "Role", "Dept", "Attn", "Basic", "Allow.", "Gross", "Payable", "Status"],
      rows: payrollRows.map(({ staff: s, gross, payable, attendanceLabel }) => [
        s.id,
        s.name,
        s.role,
        s.dept,
        attendanceLabel,
        s.basicSalary.toLocaleString("en-IN"),
        s.additionalAllowances.toLocaleString("en-IN"),
        gross.toLocaleString("en-IN"),
        payable.toLocaleString("en-IN"),
        isSalaryMonthSettled(s.salaryHistory, payrollMonth, payable) ? "Paid" : "Due",
      ]),
      footer: `Gross ${inr(totalGross)} · Attendance payable ${inr(totalPayable)} · Ledger payable ${inr(salaryPayableAmount)}`,
      action: "print",
    });
    toast.success("Print dialog opened");
  };


  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-5">
      <OrganicCard tone="white" cornerSide="tr" padded className="shrink-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <ExportBar title="Salary Report" onCsv={handleCsv} onPdf={handlePdf} onPrint={handlePrint} />
            <p className="mt-1 text-[12px] text-black/55">
              Monthly payroll · attendance adjusts payable · {academicYear}
            </p>
          </div>
          <div className="w-full shrink-0 sm:w-[200px]">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-black/45">
              Payroll month
            </div>
            <MonthPicker
              value={payrollMonth}
              onChange={(month) => setPayrollMonth(month || currentPayrollMonth())}
              allowClear={false}
              placeholder="Select month"
              className="h-10 w-full"
            />
          </div>
        </div>
        <div className="mt-3 inline-flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[#0F766E] px-3 py-1 text-[12px] font-semibold text-white">
            {payrollMonthLabel}
          </span>
          <span className="font-mono text-[11px] text-black/45">{payrollMonth}</span>
          {isCurrentPayrollMonth ? (
            <span className="rounded-full bg-[#CCFBF1] px-2.5 py-1 text-[10px] font-semibold text-[#0F766E]">
              Current month
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setPayrollMonth(currentPayrollMonth())}
              className="text-[11px] font-semibold text-[#0F766E] hover:underline"
            >
              Jump to current
            </button>
          )}
        </div>
        <SummaryStrip
          items={[
            { label: "Staff Shown", value: String(filteredStaff.length) },
            { label: "Gross Payroll", value: inr(totalGross) },
            {
              label: "Attendance Payable",
              value: inr(totalPayable),
              accent: true,
            },
            {
              label: "Settled",
              value: `${paidThisMonthCount}/${filteredStaff.length}`,
            },
          ]}
        />
      </OrganicCard>

      <div className="grid min-h-0 flex-1 grid-cols-12 content-stretch items-stretch gap-4 sm:gap-5">
        <OrganicCard
          tone="white"
          cornerSide="tl"
          padded
          className="col-span-12 flex h-full min-h-0 flex-col lg:col-span-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-title text-slate-900 dark:text-zinc-50">Payroll Register</div>
                <span className="rounded-full bg-[#F0FDFA] px-2.5 py-1 text-[11px] font-semibold text-[#0F766E] ring-1 ring-[#0F766E]/15">
                  {payrollMonthLabel}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-black/55">
                {filteredStaff.length} of {staff.length} staff · salary month {payrollMonth} ·
                payable = gross × (days present ÷ working days)
              </p>
            </div>
            {(query || department !== "all" || role !== "all" || status !== "active") && (
              <button
                type="button"
                onClick={clearPayrollFilters}
                className="text-[11px] font-semibold text-[#0F766E] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="sm:col-span-2 xl:col-span-4">
              <ReportSearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search staff, role, department…"
              />
            </div>
            <ReportFilterSelect
              value={department}
              onChange={setDepartment}
              placeholder="All departments"
              options={departmentOptions}
            />
            <ReportFilterSelect
              value={role}
              onChange={setRole}
              placeholder="All roles"
              options={roleOptions}
            />
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="h-10 w-full rounded-xl border-[#E5E5E5] bg-white sm:col-span-2 xl:col-span-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="inactive">Inactive only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex min-h-0 flex-1 flex-col">
            {tableRows.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-black/15 px-4 py-8 text-center text-[12px] text-black/55">
                {staff.length === 0
                  ? "No staff on payroll"
                  : "No staff match your search or filters"}
              </div>
            ) : (
              <ReportTable
                headers={[
                  "ID",
                  "Name",
                  "Role",
                  "Dept",
                  "Attn",
                  "Basic",
                  "Allowances",
                  "Gross",
                  "Payable",
                  "Status",
                ]}
                rows={tableRows}
                className="mt-0 min-h-0 flex-1"
                footer={
                  <div className="border-t border-[#E5E5E5] bg-[#FAFAFA] px-3 py-3 text-[12px] font-semibold text-black">
                    Totals · {payrollMonthLabel} · Basic {inr(totalBasic)} · Allowances{" "}
                    {inr(totalAllowances)} · Gross {inr(totalGross)} · Payable {inr(totalPayable)} ·
                    Settled {paidThisMonthCount}/{filteredStaff.length}
                  </div>
                }
              />
            )}
          </div>
        </OrganicCard>

        <div className="col-span-12 flex h-full min-h-0 flex-col gap-4 lg:col-span-4">
          <OrganicCard tone="white" cornerSide="tr" padded className="shrink-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-title text-slate-900 dark:text-zinc-50">
                  Open Salary Obligations
                </div>
                <p className="mt-1 text-[12px] text-black/55">
                  {filteredPayables.length} of {salaryPayables.length} payroll payable
                  {salaryPayables.length === 1 ? "" : "s"}
                </p>
              </div>
              {payableQuery && (
                <button
                  type="button"
                  onClick={() => setPayableQuery("")}
                  className="text-[11px] font-semibold text-[#0F766E] hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mt-4">
              <ReportSearchInput
                value={payableQuery}
                onChange={setPayableQuery}
                placeholder="Search obligation…"
              />
            </div>

            {payableRows.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-black/15 px-4 py-6 text-center text-[12px] text-black/55">
                {salaryPayables.length === 0
                  ? "No open salary payables"
                  : "No obligations match your search"}
              </div>
            ) : (
              <ReportTable headers={["Obligation", "Amount"]} rows={payableRows} compact />
            )}
          </OrganicCard>

          {deptSegments.length > 0 ? (
            <FinanceBarCard
              title="Payable by Department"
              cornerSide="br"
              fill="#0F766E"
              segments={deptSegments}
              className="min-h-0 flex-1 sm:min-h-[220px]"
            />
          ) : (
            <div className="hidden min-h-0 flex-1 lg:block" aria-hidden />
          )}
        </div>
      </div>

      <OrganicCard tone="white" cornerSide="bl" padded className="shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-title text-slate-900 dark:text-zinc-50">Salary Payment History</div>
            <p className="mt-1 text-[12px] text-black/55">
              Recent disbursements across staff · {recentSalaryHistory.length} shown
              {historyPaidTotal > 0 ? ` · ${inr(historyPaidTotal)} total` : ""}
            </p>
          </div>
        </div>

        {historyRows.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-black/15 px-4 py-8 text-center text-[12px] text-black/55">
            No salary payments recorded yet. Confirm payments from Finance → Make Payment.
          </div>
        ) : (
          <ReportTable
            headers={["Date", "Staff", "Payroll month", "Mode", "Amount", "Status"]}
            rows={historyRows}
            className="mt-4"
          />
        )}
      </OrganicCard>
    </div>
  );
}

type DayBookEntry = {
  id: string;
  time: string;
  particular: string;
  account: string;
  mode: string;
  type: "Receipt" | "Payment";
  amount: number;
  narration?: string;
};

function DayBookEntryCards({
  entries,
  footer,
}: {
  entries: DayBookEntry[];
  footer?: ReactNode;
}) {
  return (
    <div className="mt-4 space-y-2.5 md:hidden">
      {entries.map((entry) => {
        const isReceipt = entry.type === "Receipt";
        return (
          <article
            key={`${entry.type}-${entry.id}`}
            className="rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5 dark:border-white/10 dark:bg-zinc-900/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0F766E] ring-1 ring-[#0F766E]/20 dark:bg-zinc-800">
                    {entry.id || "—"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      isReceipt
                        ? "bg-[#CCFBF1] text-[#0F766E]"
                        : "bg-[#FFEDD5] text-[#C2410C]",
                    )}
                  >
                    {entry.type}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-black/55 ring-1 ring-black/5 dark:bg-zinc-800 dark:text-zinc-400">
                    {entry.mode}
                  </span>
                </div>
                <p className="mt-2 text-[13px] font-semibold leading-snug text-black dark:text-zinc-100">
                  {entry.particular || "—"}
                </p>
                <p className="mt-1 text-[11px] text-black/50 dark:text-zinc-400">
                  {entry.account}
                  {entry.time ? ` · ${entry.time}` : ""}
                </p>
                {entry.narration ? (
                  <p className="mt-1 line-clamp-2 text-[11px] text-black/40 dark:text-zinc-500">
                    {entry.narration}
                  </p>
                ) : null}
              </div>
              <div
                className={cn(
                  "shrink-0 text-right font-mono text-[13px] font-semibold",
                  isReceipt ? "text-[#0F766E]" : "text-[#C2410C]",
                )}
              >
                {isReceipt ? "+" : "−"}
                {inr(entry.amount)}
              </div>
            </div>
          </article>
        );
      })}
      {footer ? (
        <div className="rounded-2xl border border-[#E5E5E5] bg-white px-3.5 py-3 text-[12px] font-semibold text-black dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function DayBookReport() {
  const { activePayments: payments, academicYear, schoolDetails } = useTenantStore();
  const { disbursements } = useDisbursements();
  const schoolName = schoolDetails.name || "School";

  const [query, setQuery] = useState("");
  const [entryType, setEntryType] = useState<"all" | "Receipt" | "Payment">("all");
  const [mode, setMode] = useState("all");

  const entries = useMemo<DayBookEntry[]>(() => {
    const receipts: DayBookEntry[] = payments.map((p) => ({
      id: p.id,
      time: formatEventDateTime(p.time),
      particular: p.name,
      account: p.cat,
      mode: p.mode,
      type: "Receipt",
      amount: p.amount,
      narration: p.narration,
    }));

    const outflows: DayBookEntry[] = disbursements
      .filter((d) => (d.status || "Cleared") !== "Queued")
      .map((e) => ({
        id: e.id || "",
        time: formatEventDateTime(e.time),
        particular: e.payee,
        account: e.payeeType ? normalizePayeeType(e.payeeType) : "Expense",
        mode: e.mode || "Bank",
        type: "Payment" as const,
        amount: e.amount,
        narration: e.desc,
      }));

    return [...receipts, ...outflows];
  }, [payments, disbursements]);

  const modeOptions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.mode))).sort(),
    [entries],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (entryType !== "all" && e.type !== entryType) return false;
      if (mode !== "all" && e.mode !== mode) return false;
      if (!q) return true;
      const haystack = [
        e.id,
        e.time,
        e.particular,
        e.account,
        e.mode,
        e.type,
        e.narration ?? "",
        String(e.amount),
        e.amount.toLocaleString("en-IN"),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, query, entryType, mode]);

  const totalReceipts = filtered
    .filter((e) => e.type === "Receipt")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalPayments = filtered
    .filter((e) => e.type === "Payment")
    .reduce((sum, e) => sum + e.amount, 0);
  const net = totalReceipts - totalPayments;

  const tableRows = filtered.map((e) => [
    e.id,
    e.time,
    e.particular,
    e.account,
    e.mode,
    e.type,
    e.type === "Receipt" ? inr(e.amount) : "—",
    e.type === "Payment" ? inr(e.amount) : "—",
  ]);

  const clearFilters = () => {
    setQuery("");
    setEntryType("all");
    setMode("all");
  };

  const handleCsv = () => {
    downloadCsv(
      reportDownloadName("day-book", "csv", schoolName, academicYear),
      ["Voucher", "Date/Time", "Particulars", "Account", "Mode", "Type", "Receipt", "Payment", "Narration"],
      filtered.map((e) => [
        e.id,
        e.time,
        e.particular,
        e.account,
        e.mode,
        e.type,
        e.type === "Receipt" ? e.amount : "",
        e.type === "Payment" ? e.amount : "",
        e.narration ?? "",
      ]),
    );
    toast.success("Day book exported", { description: "CSV download started" });
  };

  const handlePdf = () => {
    downloadTablePdf({
      filename: reportDownloadName("day-book", "pdf", schoolName, academicYear),
      title: "Day Book",
      subtitle: `${schoolName} · ${academicYear}`,
      headers: ["Voucher", "Date/Time", "Particulars", "Account", "Mode", "Type", "Receipt", "Payment"],
      rows: filtered.map((e) => [
        e.id,
        e.time,
        e.particular,
        e.account,
        e.mode,
        e.type,
        e.type === "Receipt" ? e.amount.toLocaleString("en-IN") : "—",
        e.type === "Payment" ? e.amount.toLocaleString("en-IN") : "—",
      ]),
      footer: `Receipts ${inr(totalReceipts)} · Payments ${inr(totalPayments)} · Net ${inr(net)}`,
    });
    toast.success("Day book PDF downloaded");
  };

  const handlePrint = () => {
    downloadTablePdf({
      filename: reportDownloadName("day-book", "pdf", schoolName, academicYear),
      title: "Day Book",
      subtitle: `${schoolName} · ${academicYear}`,
      headers: ["Voucher", "Date/Time", "Particulars", "Account", "Mode", "Type", "Receipt", "Payment"],
      rows: filtered.map((e) => [
        e.id,
        e.time,
        e.particular,
        e.account,
        e.mode,
        e.type,
        e.type === "Receipt" ? e.amount.toLocaleString("en-IN") : "—",
        e.type === "Payment" ? e.amount.toLocaleString("en-IN") : "—",
      ]),
      footer: `Receipts ${inr(totalReceipts)} · Payments ${inr(totalPayments)} · Net ${inr(net)}`,
      action: "print",
    });
    toast.success("Print dialog opened");
  };

  return (
    <div className="grid grid-cols-12 gap-4 sm:gap-5">
      <OrganicCard tone="white" cornerSide="tr" padded className="col-span-12">
        <ExportBar title="Day Book" onCsv={handleCsv} onPdf={handlePdf} onPrint={handlePrint} />
        <p className="mt-1 text-[12px] text-black/55">
          Chronological cash book of receipts and payments · {academicYear}
        </p>
        <SummaryStrip
          items={[
            { label: "Total Receipts", value: inr(totalReceipts) },
            { label: "Total Payments", value: inr(totalPayments) },
            { label: "Net Movement", value: inr(net), accent: true },
          ]}
        />
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="bl" padded className="col-span-12">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-title text-slate-900 dark:text-zinc-50">Day Book Entries</div>
            <p className="mt-1 text-[12px] text-black/55">
              {filtered.length} of {entries.length} entr{entries.length === 1 ? "y" : "ies"}
            </p>
          </div>
          {(query || entryType !== "all" || mode !== "all") && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] font-semibold text-[#0F766E] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="sm:col-span-2 xl:col-span-4">
            <ReportSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search voucher, particulars, account, narration…"
            />
          </div>
          <Select
            value={entryType}
            onValueChange={(v) => setEntryType(v as typeof entryType)}
          >
            <SelectTrigger className="h-10 w-full rounded-xl border-[#E5E5E5] bg-white">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="Receipt">Receipts only</SelectItem>
              <SelectItem value="Payment">Payments only</SelectItem>
            </SelectContent>
          </Select>
          <ReportFilterSelect
            value={mode}
            onChange={setMode}
            placeholder="All modes"
            options={modeOptions}
            className="sm:col-span-1 xl:col-span-1"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-black/15 px-4 py-8 text-center text-[12px] text-black/55">
            {entries.length === 0
              ? "No day book entries yet"
              : "No entries match your search or filters"}
          </div>
        ) : (
          <>
            <DayBookEntryCards
              entries={filtered}
              footer={
                <>
                  Totals · Receipts {inr(totalReceipts)} · Payments {inr(totalPayments)} · Net{" "}
                  {inr(net)}
                </>
              }
            />
            <ReportTable
              mobileCards={false}
              className="hidden md:block"
              headers={[
                "Voucher",
                "Date / Time",
                "Particulars",
                "Account",
                "Mode",
                "Type",
                "Receipt",
                "Payment",
              ]}
              rows={tableRows}
              footer={
                <div className="border-t border-[#E5E5E5] bg-[#FAFAFA] px-3 py-3 text-[12px] font-semibold text-black">
                  Totals · Receipts {inr(totalReceipts)} · Payments {inr(totalPayments)} · Net{" "}
                  {inr(net)}
                </div>
              }
            />
          </>
        )}
      </OrganicCard>
    </div>
  );
}

type BankReconTxn = {
  id: string;
  time: string;
  name: string;
  cat: string;
  mode: string;
  amount: number;
};

export function BankReconciliationReport() {
  const { activePayments: payments, academicYear, schoolDetails } = useTenantStore();
  const schoolName = schoolDetails.name || "Silver Hills Global";

  const bankTxns = useMemo<BankReconTxn[]>(
    () =>
      payments
        .filter((p) => p.mode !== "Cash")
        .map((p) => ({
          id: p.id,
          time: formatEventDateTime(p.time),
          name: p.name,
          cat: p.cat,
          mode: p.mode,
          amount: p.amount,
        })),
    [payments],
  );

  // Transactions are cleared by default; toggling adds them to the "pending" set
  // (deposits in transit — recorded in books but not yet on the bank statement).
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [statementInput, setStatementInput] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("all");

  const modeOptions = useMemo(
    () => Array.from(new Set(bankTxns.map((t) => t.mode))).sort(),
    [bankTxns],
  );

  const isCleared = (id: string) => !pending.has(id);

  const toggleCleared = (id: string) => {
    setPending((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bankTxns.filter((t) => {
      if (mode !== "all" && t.mode !== mode) return false;
      if (!q) return true;
      const haystack = [t.id, t.time, t.name, t.cat, t.mode, String(t.amount)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [bankTxns, query, mode]);

  const bookBalance = useMemo(() => bankTxns.reduce((s, t) => s + t.amount, 0), [bankTxns]);
  const clearedTotal = useMemo(
    () => bankTxns.filter((t) => isCleared(t.id)).reduce((s, t) => s + t.amount, 0),
    [bankTxns, pending],
  );
  const unclearedTotal = bookBalance - clearedTotal;
  const unclearedCount = pending.size;

  const statementBalance = statementInput.trim() === "" ? clearedTotal : Number(statementInput) || 0;
  const difference = statementBalance - clearedTotal;
  const reconciled = Math.abs(difference) < 0.5;

  const markAllCleared = () => setPending(new Set());
  const resetStatement = () => {
    setPending(new Set());
    setStatementInput("");
  };

  const reconStatementRows: (string | number)[][] = [
    ["Balance as per Bank Statement", inr(statementBalance)],
    [`Add: Deposits in transit (${unclearedCount} uncleared)`, inr(unclearedTotal)],
    ["Adjusted Balance (per Books)", inr(statementBalance + unclearedTotal)],
    ["Balance as per Books", inr(bookBalance)],
    ["Unreconciled Difference", inr(difference)],
  ];

  const handleCsv = () => {
    downloadCsv(
      reportDownloadName("bank-reconciliation", "csv", schoolName, academicYear),
      ["Voucher", "Date/Time", "Account", "Category", "Mode", "Amount (INR)", "Status"],
      bankTxns.map((t) => [
        t.id,
        t.time,
        t.name,
        t.cat,
        t.mode,
        t.amount,
        isCleared(t.id) ? "Cleared" : "Uncleared",
      ]),
    );
    toast.success("Bank reconciliation exported", { description: "CSV download started" });
  };

  const handlePdf = () => {
    downloadTablePdf({
      filename: reportDownloadName("bank-reconciliation", "pdf", schoolName, academicYear),
      title: "Bank Reconciliation Statement",
      subtitle: `${schoolName} · ${academicYear}`,
      headers: ["Voucher", "Date/Time", "Account", "Mode", "Amount", "Status"],
      rows: bankTxns.map((t) => [
        t.id,
        t.time,
        t.name,
        t.mode,
        t.amount.toLocaleString("en-IN"),
        isCleared(t.id) ? "Cleared" : "Uncleared",
      ]),
      footer: `Statement ${inr(statementBalance)} · Cleared ${inr(clearedTotal)} · Uncleared ${inr(unclearedTotal)} · Difference ${inr(difference)}`,
    });
    toast.success("Bank reconciliation PDF downloaded");
  };

  const handlePrint = () => {
    downloadTablePdf({
      filename: reportDownloadName("bank-reconciliation", "pdf", schoolName, academicYear),
      title: "Bank Reconciliation Statement",
      subtitle: `${schoolName} · ${academicYear}`,
      headers: ["Voucher", "Date/Time", "Account", "Mode", "Amount", "Status"],
      rows: bankTxns.map((t) => [
        t.id,
        t.time,
        t.name,
        t.mode,
        t.amount.toLocaleString("en-IN"),
        isCleared(t.id) ? "Cleared" : "Uncleared",
      ]),
      footer: `Statement ${inr(statementBalance)} · Cleared ${inr(clearedTotal)} · Uncleared ${inr(unclearedTotal)} · Difference ${inr(difference)}`,
      action: "print",
    });
    toast.success("Print dialog opened");
  };

  return (
    <div className="grid grid-cols-12 gap-4 sm:gap-5">
      <OrganicCard tone="white" cornerSide="tr" padded className="col-span-12 lg:col-span-7">
        <ExportBar title="Bank Reconciliation" onCsv={handleCsv} onPdf={handlePdf} onPrint={handlePrint} />
        <p className="mt-1 text-[12px] text-black/55">
          Match recorded bank &amp; UPI receipts against the bank statement · {academicYear}
        </p>
        <SummaryStrip
          items={[
            { label: "Balance per Books", value: inr(bookBalance) },
            { label: "Cleared on Statement", value: inr(clearedTotal) },
            { label: "Deposits in Transit", value: inr(unclearedTotal), accent: true },
          ]}
        />

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-black/55">
              Bank Statement Closing Balance
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-black/45">
                ₹
              </span>
              <Input
                inputMode="numeric"
                value={statementInput}
                onChange={(e) => setStatementInput(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder={String(clearedTotal)}
                className="h-10 rounded-xl border-[#E5E5E5] bg-white pl-7 font-mono"
              />
            </div>
            <p className="text-[10.5px] text-black/45">
              Leave blank to assume it matches cleared items.
            </p>
          </div>
          <div className="flex items-end">
            <div
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3.5",
                reconciled
                  ? "border-[#BBF7D0] bg-[#F0FDF4] dark:border-emerald-500/35 dark:bg-emerald-950/45"
                  : "border-[#FED7AA] bg-[#FFF7ED] dark:border-amber-500/35 dark:bg-amber-950/40",
              )}
            >
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                  reconciled
                    ? "bg-[#DCFCE7] text-[#059669] dark:bg-emerald-500/25 dark:text-emerald-300"
                    : "bg-[#FFEDD5] text-[#C2410C] dark:bg-amber-500/25 dark:text-amber-300",
                )}
              >
                {reconciled ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-black dark:text-zinc-50">
                  {reconciled ? "Reconciled" : "Out of balance"}
                </div>
                <div className="truncate text-[11.5px] text-black/60 dark:text-zinc-400">
                  {reconciled
                    ? "Statement matches cleared items"
                    : `Difference of ${inr(Math.abs(difference))}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="bl" padded className="col-span-12 lg:col-span-5">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-black/45" />
          <div className="text-title text-slate-900 dark:text-zinc-50">Reconciliation Statement</div>
        </div>
        <p className="mt-1 text-[12px] text-black/55">Bank statement to book balance</p>
        <div className="mt-4 overflow-hidden rounded-lg border border-[#E5E5E5]">
          {reconStatementRows.map(([label, value], i) => {
            const isTotal = label === "Balance as per Books";
            const isDiff = label === "Unreconciled Difference";
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-between gap-3 px-3.5 py-2.5 text-[12.5px]",
                  i !== reconStatementRows.length - 1 && "border-b border-[#F0F0F0] dark:border-white/10",
                  isTotal && "bg-[#F4F4F5] font-semibold dark:bg-white/10",
                  isDiff &&
                    (reconciled
                      ? "bg-[#F0FDF4] dark:bg-emerald-950/45"
                      : "bg-[#FFF7ED] dark:bg-amber-950/40"),
                )}
              >
                <span
                  className={cn(
                    "min-w-0 flex-1 text-black/70 dark:text-zinc-300",
                    (isTotal || isDiff) && "text-black dark:text-zinc-50",
                  )}
                >
                  {label}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-black dark:text-zinc-100",
                    isDiff &&
                      (reconciled
                        ? "text-[#059669] dark:text-emerald-300"
                        : "text-[#C2410C] dark:text-amber-300"),
                  )}
                >
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="tr" padded className="col-span-12">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-title text-slate-900 dark:text-zinc-50">Bank &amp; UPI Transactions</div>
            <p className="mt-1 text-[12px] text-black/55">
              {filtered.length} of {bankTxns.length} · {unclearedCount} marked uncleared
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unclearedCount > 0 && (
              <button
                type="button"
                onClick={markAllCleared}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0F766E] hover:underline"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Clear all
              </button>
            )}
            {(query || mode !== "all" || unclearedCount > 0 || statementInput) && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setMode("all");
                  resetStatement();
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-black/55 hover:text-black"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <ReportSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search voucher, account, category…"
            />
          </div>
          <ReportFilterSelect
            value={mode}
            onChange={setMode}
            placeholder="All modes"
            options={modeOptions}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-black/15 px-4 py-8 text-center text-[12px] text-black/55">
            {bankTxns.length === 0
              ? "No bank or UPI transactions to reconcile"
              : "No transactions match your search or filters"}
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-2.5 md:hidden">
              {filtered.map((t) => {
                const cleared = isCleared(t.id);
                return (
                  <article
                    key={t.id}
                    className={cn(
                      "rounded-2xl border p-3.5",
                      cleared
                        ? "border-[#EFEFEF] bg-[#FAFAFA] dark:border-white/10 dark:bg-zinc-900/50"
                        : "border-[#FDBA74]/50 bg-[#FFF7ED]/70 dark:border-amber-500/30 dark:bg-amber-950/30",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={cleared}
                        onCheckedChange={() => toggleCleared(t.id)}
                        aria-label={`Mark ${t.id} as ${cleared ? "uncleared" : "cleared"}`}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[11px] font-semibold text-[#0F766E]">
                            {t.id}
                          </span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-black/55 ring-1 ring-black/5 dark:bg-zinc-800 dark:text-zinc-400">
                            {t.mode}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[13px] font-semibold text-black dark:text-zinc-100">
                          {t.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-black/50 dark:text-zinc-400">
                          {t.cat}
                          {t.time ? ` · ${t.time}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right font-mono text-[13px] font-semibold text-black dark:text-zinc-100">
                        {inr(t.amount)}
                      </div>
                    </div>
                  </article>
                );
              })}
              <div className="rounded-2xl border border-[#E5E5E5] bg-white px-3.5 py-3 text-[12px] font-semibold text-black dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100">
                Cleared {inr(clearedTotal)} · Uncleared {inr(unclearedTotal)} · Book{" "}
                {inr(bookBalance)}
              </div>
            </div>

            <div className="mobile-scrollbar-none mt-4 hidden overflow-x-auto rounded-lg border border-[#E5E5E5] md:block">
              <table className="w-full min-w-[640px] text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#F4F4F5]">
                    {["Cleared", "Voucher", "Account", "Mode", "Date / Time", "Amount"].map((h) => (
                      <th
                        key={h}
                        className={cn(
                          "px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-black/55",
                          h === "Amount" && "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const cleared = isCleared(t.id);
                    return (
                      <tr
                        key={t.id}
                        className={cn(
                          "border-b border-[#F0F0F0] last:border-0 transition-colors",
                          !cleared && "bg-[#FFF7ED]/60",
                        )}
                      >
                        <td className="px-3 py-2.5">
                          <Checkbox
                            checked={cleared}
                            onCheckedChange={() => toggleCleared(t.id)}
                            aria-label={`Mark ${t.id} as ${cleared ? "uncleared" : "cleared"}`}
                          />
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-black/70">{t.id}</td>
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-black">{t.name}</div>
                          <div className="text-[11px] text-black/45">{t.cat}</div>
                        </td>
                        <td className="px-3 py-2.5 text-black/70">{t.mode}</td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-black/55">{t.time}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-black">
                          {inr(t.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#E5E5E5] bg-[#FAFAFA] text-[12px] font-semibold text-black">
                    <td className="px-3 py-3" colSpan={5}>
                      Cleared {inr(clearedTotal)} · Uncleared {inr(unclearedTotal)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{inr(bookBalance)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </OrganicCard>
    </div>
  );
}
