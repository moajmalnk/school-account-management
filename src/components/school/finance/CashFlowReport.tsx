import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { OrganicCard } from "@/components/ui/organic-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ReportDataTable,
  ReportEmpty,
  ReportExportButtons,
  ReportSummary,
  exportReportFile,
} from "@/components/school/finance/report-chrome";
import { getApiToken } from "@/lib/api/client";
import {
  apiGlReportCashFlow,
  apiGlUpdateAllBooks,
  glInstallHint,
  type GlCashFlowReport,
  type GlCashFlowSection,
} from "@/lib/api/general-ledger";
import { formatEventDate } from "@/lib/dates";
import { formatAmount, formatMoney, moneyColumnLabel } from "@/lib/money";
import { useTenantStore } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

function emptyReport(year: string): GlCashFlowReport {
  const section: GlCashFlowSection = { inflow: 0, outflow: 0, net: 0, lines: [] };
  return {
    opening: 0,
    closing: 0,
    netChange: 0,
    operating: section,
    investing: section,
    financing: section,
    transfers: { amount: 0, lines: [] },
    academicYear: year || null,
    from: null,
    to: null,
  };
}

function reportHasMovement(data: GlCashFlowReport): boolean {
  return (
    data.opening !== 0 ||
    data.closing !== 0 ||
    data.netChange !== 0 ||
    data.operating.lines.length > 0 ||
    data.investing.lines.length > 0 ||
    data.financing.lines.length > 0 ||
    data.transfers.lines.length > 0
  );
}

function CashFlowSkeleton() {
  return (
    <div
      className="mt-4 overflow-hidden rounded-xl border border-[#E5E5E5] dark:border-white/10"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading cash flow"
    >
      <div className="grid grid-cols-3 gap-2 bg-[#F4F4F5] px-3 py-2.5 dark:bg-zinc-900">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="skeleton-shimmer h-2.5 rounded-md bg-black/[0.07] dark:bg-white/[0.08]" />
        ))}
      </div>
      <div className="divide-y divide-[#EFEFEF] dark:divide-white/10">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="grid grid-cols-3 items-center gap-2 px-3 py-2.5">
            <Skeleton className="skeleton-shimmer h-3 w-[70%] rounded-md bg-black/[0.07] dark:bg-white/[0.08]" />
            <Skeleton className="skeleton-shimmer ml-auto h-3 w-14 rounded-md bg-black/[0.07] dark:bg-white/[0.08]" />
            <Skeleton className="skeleton-shimmer ml-auto h-3 w-14 rounded-md bg-black/[0.07] dark:bg-white/[0.08]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivitySection({
  title,
  hint,
  section,
}: {
  title: string;
  hint: string;
  section: GlCashFlowSection;
}) {
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900 dark:text-zinc-50">{title}</h3>
          <p className="mt-0.5 text-[12px] text-black/50 dark:text-zinc-400">{hint}</p>
        </div>
        <div className="font-mono text-[13px] font-semibold tabular-nums">
          Net {formatMoney(section.net)}
        </div>
      </div>
      {section.lines.length === 0 ? (
        <p className="mt-3 text-[12px] text-black/45 dark:text-zinc-500">None this period</p>
      ) : (
        <ReportDataTable
          headers={["Account", "Group", "Inflow", "Outflow"]}
          numericFrom={2}
          rows={section.lines.map((line) => [
            line.account,
            line.groupName || "—",
            formatAmount(line.inflow),
            formatAmount(line.outflow),
          ])}
        />
      )}
    </div>
  );
}

export function CashFlowReport() {
  const { academicYear, schoolDetails, activeBranchId } = useTenantStore();
  const schoolName = schoolDetails.name || "School";
  const [data, setData] = useState<GlCashFlowReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!getApiToken()) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void apiGlReportCashFlow({ academicYear: academicYear || undefined })
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch((error) => {
        if (!cancelled) {
          setData(null);
          const message = error instanceof Error ? error.message : "Cash flow failed";
          setLoadError(message);
          toast.error(message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [academicYear, activeBranchId, reloadKey]);

  const statement = data ?? emptyReport(academicYear);
  const hasMovement = data ? reportHasMovement(data) : false;
  const summary = useMemo(
    () => [
      { label: "Opening cash & bank", value: formatMoney(statement.opening) },
      { label: "Net change", value: formatMoney(statement.netChange) },
      { label: "Closing cash & bank", value: formatMoney(statement.closing), accent: true },
    ],
    [statement.opening, statement.netChange, statement.closing],
  );

  const exportRows = useMemo(() => {
    const rows: (string | number)[][] = [
      ["Opening", "Cash and bank", statement.opening, ""],
    ];
    const push = (section: string, block: GlCashFlowSection) => {
      for (const line of block.lines) {
        rows.push([section, line.account, line.inflow, line.outflow]);
      }
      rows.push([section, "Net", block.net, ""]);
    };
    push("Operating", statement.operating);
    push("Investing", statement.investing);
    push("Financing", statement.financing);
    for (const line of statement.transfers.lines) {
      rows.push([
        "Transfer",
        `${line.date} ${line.voucherNo} ${line.fromAccount} → ${line.toAccount}`,
        "",
        line.amount,
      ]);
    }
    rows.push(["Closing", "Cash and bank", statement.closing, ""]);
    return rows;
  }, [statement]);

  const runExport = (format: "csv" | "pdf" | "print") => {
    exportReportFile({
      format,
      filenameBase: "cash-flow",
      title: "Cash Flow",
      subtitle: `Direct cash flow · ${academicYear || "all periods"}`,
      headers: ["Section", "Particulars", "Inflow", "Outflow"],
      pdfHeaders: [
        "Section",
        "Particulars",
        moneyColumnLabel("Inflow", { pdf: true }),
        moneyColumnLabel("Outflow", { pdf: true }),
      ],
      rows: exportRows,
      summary: summary.map(({ label, value }) => ({ label, value })),
      schoolName,
      academicYear,
    });
    toast.success(format === "print" ? "Print dialog opened" : format === "csv" ? "CSV downloaded" : "PDF downloaded");
  };

  const updateBooks = async () => {
    if (updating) return;
    if (!getApiToken()) {
      toast.error("Sign in to update finance books");
      return;
    }
    setUpdating(true);
    try {
      const result = await apiGlUpdateAllBooks();
      toast.success(`Books updated · ${result.payments} receipts · ${result.disbursements} payments`);
      setReloadKey((key) => key + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update books", {
        description: glInstallHint(),
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <OrganicCard tone="white" cornerSide="tr" padded className="rounded-2xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-title text-slate-900 dark:text-zinc-50">Cash Flow</div>
          <p className="mt-1 text-[12px] text-black/55 dark:text-zinc-400">
            Opening cash and bank, then operating, investing, and financing movements ·{" "}
            {academicYear || "all periods"}
          </p>
        </div>
        <div className="flex flex-col gap-2 lg:items-end">
          <ReportExportButtons
            onCsv={() => runExport("csv")}
            onPdf={() => runExport("pdf")}
            onPrint={() => runExport("print")}
          />
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-full bg-[#0F766E] text-[11px] text-white hover:bg-[#0D9488]"
            disabled={updating || loading}
            onClick={() => void updateBooks()}
          >
            {updating ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
            )}
            Update all books
          </Button>
        </div>
      </div>
      {loading ? (
        <CashFlowSkeleton />
      ) : !hasMovement ? (
        <ReportEmpty
          message={
            loadError ??
            "No cash or bank journals for this year. Post receipts and payments, or tap Update all books."
          }
        />
      ) : (
        <>
          <ReportSummary items={summary} />
          <ActivitySection
            title="Operating"
            hint="Fee receipts, other income, salaries, and running expenses"
            section={statement.operating}
          />
          <ActivitySection
            title="Investing"
            hint="Fixed assets, investments, and deposits"
            section={statement.investing}
          />
          <ActivitySection
            title="Financing"
            hint="Capital, drawings, and loans"
            section={statement.financing}
          />
          <div className="mt-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-zinc-50">
                  Cash and bank transfers
                </h3>
                <p className="mt-0.5 text-[12px] text-black/50 dark:text-zinc-400">
                  Movements between cash and bank. These do not change total cash.
                </p>
              </div>
              <div className={cn("font-mono text-[13px] font-semibold tabular-nums")}>
                {formatMoney(statement.transfers.amount)}
              </div>
            </div>
            {statement.transfers.lines.length === 0 ? (
              <p className="mt-3 text-[12px] text-black/45 dark:text-zinc-500">None this period</p>
            ) : (
              <ReportDataTable
                headers={["Date", "Voucher", "From", "To", "Amount"]}
                numericFrom={4}
                rows={statement.transfers.lines.map((line) => [
                  formatEventDate(line.date),
                  line.voucherNo || "—",
                  line.fromAccount,
                  line.toAccount,
                  formatAmount(line.amount),
                ])}
              />
            )}
          </div>
        </>
      )}
    </OrganicCard>
  );
}
