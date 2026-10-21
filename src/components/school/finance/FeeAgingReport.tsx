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
import { buildExpertFeeSnapshots, buildFeeAgingRows } from "@/lib/finance-expert-reports";
import { formatAmount, formatMoney, moneyColumnLabel } from "@/lib/money";
import { useTenantStore } from "@/lib/tenant-store";

const MONEY_HEADERS = ["Not yet due", "1–30", "31–60", "61–90", "Over 90", "Total"];

export function FeeAgingReport() {
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
  const [classFilter, setClassFilter] = useState("all");

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
    return buildFeeAgingRows(snapshots);
  }, [students, payments, classes, activeFeeTerms, transportRoutes, academicYear, studentFeeBreaks]);

  const classOptions = useMemo(
    () =>
      [...new Set(rows.map((row) => row.cls).filter((value) => value && value !== "—"))].sort().map(
        (value) => ({ value, label: value }),
      ),
    [rows],
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (classFilter !== "all" && row.cls !== classFilter) return false;
      if (!needle) return true;
      const haystack = [row.studentId, row.name, row.cls, row.guardian, row.oldestDue, String(row.total)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [rows, query, classFilter]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (sum, row) => ({
          current: sum.current + row.current,
          d30: sum.d30 + row.d30,
          d60: sum.d60 + row.d60,
          d90: sum.d90 + row.d90,
          d90plus: sum.d90plus + row.d90plus,
          total: sum.total + row.total,
        }),
        { current: 0, d30: 0, d60: 0, d90: 0, d90plus: 0, total: 0 },
      ),
    [filtered],
  );
  const summary = [
    { label: "Not yet due", value: formatMoney(totals.current) },
    { label: "1–30 days", value: formatMoney(totals.d30) },
    { label: "31–60 days", value: formatMoney(totals.d60) },
    { label: "61–90 days", value: formatMoney(totals.d90) },
    { label: "Over 90 days", value: formatMoney(totals.d90plus), accent: totals.d90plus > 0 },
  ];

  const runExport = (format: "csv" | "pdf" | "print") => {
    const headers = ["ID", "Student", "Class", "Oldest due", ...MONEY_HEADERS];
    exportReportFile({
      format,
      filenameBase: "fee-aging",
      title: "Fee Aging",
      subtitle: `Outstanding installments by age · ${academicYear}`,
      headers,
      pdfHeaders: headers.map((header) =>
        MONEY_HEADERS.includes(header) ? moneyColumnLabel(header, { pdf: true }) : header,
      ),
      rows: filtered.map((row) => [
        row.studentId,
        row.name,
        row.cls,
        row.oldestDue,
        format === "csv" ? row.current : formatAmount(row.current),
        format === "csv" ? row.d30 : formatAmount(row.d30),
        format === "csv" ? row.d60 : formatAmount(row.d60),
        format === "csv" ? row.d90 : formatAmount(row.d90),
        format === "csv" ? row.d90plus : formatAmount(row.d90plus),
        format === "csv" ? row.total : formatAmount(row.total),
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
            <div className="text-title text-slate-900 dark:text-zinc-50">Fee Aging</div>
            <p className="mt-1 text-[12px] text-black/55 dark:text-zinc-400">
              Outstanding dues by how late they are · {academicYear}
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
            <div className="text-title text-slate-900 dark:text-zinc-50">Students with a balance</div>
            <p className="mt-1 text-[12px] text-black/55 dark:text-zinc-400">
              {filtered.length} of {rows.length} student{rows.length === 1 ? "" : "s"} ·{" "}
              {formatMoney(totals.total)} outstanding
            </p>
          </div>
          {query.trim() || classFilter !== "all" ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setClassFilter("all");
              }}
              className="text-[11px] font-semibold text-[#0F766E] hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-3">
            <ReportSearch value={query} onChange={setQuery} placeholder="Search student, class, guardian…" />
          </div>
          <ReportSelect
            value={classFilter}
            onChange={setClassFilter}
            placeholder="All classes"
            options={classOptions}
          />
        </div>
        {filtered.length === 0 ? (
          <ReportEmpty
            message={
              rows.length === 0 ? "No outstanding dues for this year" : "No students match your search or filters"
            }
          />
        ) : (
          <ReportDataTable
            headers={["ID", "Student", "Class", "Oldest due", ...MONEY_HEADERS]}
            numericFrom={4}
            rows={filtered.map((row) => [
              row.studentId,
              row.name,
              row.cls,
              row.oldestDue,
              formatAmount(row.current),
              formatAmount(row.d30),
              formatAmount(row.d60),
              formatAmount(row.d90),
              formatAmount(row.d90plus),
              formatAmount(row.total),
            ])}
          />
        )}
      </OrganicCard>
    </div>
  );
}
