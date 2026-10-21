import { useMemo, useState } from "react";
import { toast } from "sonner";

import { isRecordDeleted } from "@/components/school/ProfileAccountActions";
import {
  ReportDataTable,
  ReportEmpty,
  ReportExportButtons,
  ReportSearch,
  ReportSelect,
  ReportSummary,
  exportReportFile,
} from "@/components/school/finance/report-chrome";
import { OrganicCard } from "@/components/ui/organic-card";
import {
  buildExpertFeeSnapshots,
  buildFeeHeadRows,
  collectionRate,
  type FeeHeadKind,
} from "@/lib/finance-expert-reports";
import { formatAmount, formatMoney, moneyColumnLabel } from "@/lib/money";
import { useTenantStore } from "@/lib/tenant-store";

const KIND_OPTIONS: { value: FeeHeadKind; label: string }[] = [
  { value: "Tuition", label: "Tuition" },
  { value: "Vehicle", label: "Vehicle" },
  { value: "Other", label: "Other" },
];

function rateLabel(billed: number, collected: number): string {
  const rate = collectionRate(billed, collected);
  if (rate === null) return "—";
  return `${Math.round(rate * 100)}%`;
}

export function FeeHeadReport() {
  const {
    activePayments: payments,
    activeStudents: students,
    academicYear,
    schoolDetails,
    classes,
    activeFeeTerms,
    transportRoutes,
    studentFeeBreaks,
  } = useTenantStore();
  const schoolName = schoolDetails.name || "School";
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");

  const rows = useMemo(() => {
    const liveStudents = students.filter((student) => !isRecordDeleted(student.deletedAt));
    const snapshots = buildExpertFeeSnapshots({
      students: liveStudents,
      payments,
      classes,
      feeTerms: activeFeeTerms,
      transportRoutes,
      academicYear,
      feeBreaks: studentFeeBreaks,
    });
    return buildFeeHeadRows(snapshots);
  }, [students, payments, classes, activeFeeTerms, transportRoutes, academicYear, studentFeeBreaks]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (kindFilter !== "all" && row.kind !== kindFilter) return false;
      if (!needle) return true;
      return `${row.head} ${row.kind}`.toLowerCase().includes(needle);
    });
  }, [rows, query, kindFilter]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (sum, row) => ({
          billed: sum.billed + row.billed,
          collected: sum.collected + row.collected,
          due: sum.due + row.due,
          overdue: sum.overdue + row.overdue,
        }),
        { billed: 0, collected: 0, due: 0, overdue: 0 },
      ),
    [filtered],
  );
  const summary = [
    { label: "Billed", value: formatMoney(totals.billed) },
    { label: "Collected", value: formatMoney(totals.collected) },
    { label: "Collection", value: rateLabel(totals.billed, totals.collected) },
    { label: "Due", value: formatMoney(totals.due) },
    { label: "Overdue", value: formatMoney(totals.overdue), accent: totals.overdue > 0 },
  ];

  const runExport = (format: "csv" | "pdf" | "print") => {
    const headers = ["Head", "Kind", "Billed", "Collected", "Due", "Overdue", "Collection"];
    exportReportFile({
      format,
      filenameBase: "fee-heads",
      title: "Fee Heads",
      subtitle: `Billed, collected, and outstanding by fee head · ${academicYear}`,
      headers,
      pdfHeaders: headers.map((header) =>
        ["Billed", "Collected", "Due", "Overdue"].includes(header)
          ? moneyColumnLabel(header, { pdf: true })
          : header,
      ),
      rows: filtered.map((row) => [
        row.head,
        row.kind,
        format === "csv" ? row.billed : formatAmount(row.billed),
        format === "csv" ? row.collected : formatAmount(row.collected),
        format === "csv" ? row.due : formatAmount(row.due),
        format === "csv" ? row.overdue : formatAmount(row.overdue),
        rateLabel(row.billed, row.collected),
      ]),
      summary: summary.map(({ label, value }) => ({ label, value })),
      schoolName,
      academicYear,
    });
    toast.success(format === "print" ? "Print dialog opened" : format === "csv" ? "CSV downloaded" : "PDF downloaded");
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <OrganicCard tone="white" cornerSide="tr" padded>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-title text-slate-900 dark:text-zinc-50">Fee Heads</div>
            <p className="mt-1 text-[12px] text-black/55 dark:text-zinc-400">
              Billed, collected, due, and overdue by fee head · {academicYear}
            </p>
          </div>
          <ReportExportButtons
            onCsv={() => runExport("csv")}
            onPdf={() => runExport("pdf")}
            onPrint={() => runExport("print")}
          />
        </div>
        <ReportSummary items={summary} />
      </OrganicCard>
      <OrganicCard tone="white" cornerSide="bl" padded>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-title text-slate-900 dark:text-zinc-50">Heads</div>
            <p className="mt-1 text-[12px] text-black/55 dark:text-zinc-400">
              {filtered.length} of {rows.length} head{rows.length === 1 ? "" : "s"}
            </p>
          </div>
          {query.trim() || kindFilter !== "all" ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setKindFilter("all");
              }}
              className="text-[11px] font-semibold text-[#0F766E] hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-3">
            <ReportSearch value={query} onChange={setQuery} placeholder="Search fee head…" />
          </div>
          <ReportSelect
            value={kindFilter}
            onChange={setKindFilter}
            placeholder="All kinds"
            options={KIND_OPTIONS}
          />
        </div>
        {filtered.length === 0 ? (
          <ReportEmpty
            message={rows.length === 0 ? "No scheduled fee heads for this year" : "No heads match your search or filters"}
          />
        ) : (
          <ReportDataTable
            headers={["Head", "Kind", "Billed", "Collected", "Due", "Overdue", "Collection"]}
            numericFrom={2}
            rows={filtered.map((row) => [
              row.head,
              row.kind,
              formatAmount(row.billed),
              formatAmount(row.collected),
              formatAmount(row.due),
              formatAmount(row.overdue),
              rateLabel(row.billed, row.collected),
            ])}
          />
        )}
      </OrganicCard>
    </div>
  );
}
