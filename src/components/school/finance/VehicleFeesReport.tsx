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
  buildVehicleFeeRows,
  type VehicleFeeReportRow,
} from "@/lib/finance-expert-reports";
import { formatAmount, formatMoney, moneyColumnLabel } from "@/lib/money";
import { useTenantStore } from "@/lib/tenant-store";

const SHIFT_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "evening", label: "Evening" },
  { value: "both", label: "Both shifts" },
];

function matchesQuery(row: VehicleFeeReportRow, query: string): boolean {
  if (!query) return true;
  const haystack = [
    row.studentId,
    row.name,
    row.cls,
    row.guardian,
    row.route,
    row.shift,
    row.pickup,
    row.drop,
    String(row.billed),
    String(row.concession),
    String(row.collected),
    String(row.due),
    String(row.overdue),
    formatAmount(row.billed),
    formatAmount(row.due),
    formatAmount(row.overdue),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function VehicleFeesReport() {
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
  const [routeFilter, setRouteFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");

  const liveStudents = useMemo(
    () => students.filter((student) => !isRecordDeleted(student.deletedAt)),
    [students],
  );
  const rows = useMemo(() => {
    const snapshots = buildExpertFeeSnapshots({
      students: liveStudents,
      payments,
      classes,
      feeTerms: activeFeeTerms,
      transportRoutes,
      academicYear,
      feeBreaks: studentFeeBreaks,
    });
    return buildVehicleFeeRows(snapshots);
  }, [liveStudents, payments, classes, activeFeeTerms, transportRoutes, academicYear, studentFeeBreaks]);

  const classOptions = useMemo(
    () =>
      [...new Set(rows.map((row) => row.cls).filter((value) => value && value !== "—"))].sort().map(
        (value) => ({ value, label: value }),
      ),
    [rows],
  );
  const routeOptions = useMemo(
    () =>
      [...new Set(rows.map((row) => row.route))].sort().map((value) => ({ value, label: value })),
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (classFilter !== "all" && row.cls !== classFilter) return false;
      if (routeFilter !== "all" && row.route !== routeFilter) return false;
      if (shiftFilter !== "all" && row.shiftKey !== shiftFilter) return false;
      return matchesQuery(row, needle);
    });
  }, [rows, query, classFilter, routeFilter, shiftFilter]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (sum, row) => ({
          billed: sum.billed + row.billed,
          concession: sum.concession + row.concession,
          collected: sum.collected + row.collected,
          due: sum.due + row.due,
          overdue: sum.overdue + row.overdue,
        }),
        { billed: 0, concession: 0, collected: 0, due: 0, overdue: 0 },
      ),
    [filtered],
  );
  const summary = [
    { label: "Billed", value: formatMoney(totals.billed) },
    { label: "Concession", value: formatMoney(totals.concession) },
    { label: "Collected", value: formatMoney(totals.collected) },
    { label: "Due", value: formatMoney(totals.due) },
    { label: "Overdue", value: formatMoney(totals.overdue), accent: totals.overdue > 0 },
  ];
  const filtersActive =
    query.trim() !== "" || classFilter !== "all" || routeFilter !== "all" || shiftFilter !== "all";

  const runExport = (format: "csv" | "pdf" | "print") => {
    const headers = [
      "ID",
      "Student",
      "Class",
      "Route",
      "Shift",
      "Pickup",
      "Drop",
      "Billed",
      "Concession",
      "Collected",
      "Due",
      "Overdue",
    ];
    exportReportFile({
      format,
      filenameBase: "vehicle-fees",
      title: "Vehicle Fees",
      subtitle: `Transport charges, collections, and dues · ${academicYear}`,
      headers,
      pdfHeaders: headers.map((header) =>
        ["Billed", "Concession", "Collected", "Due", "Overdue"].includes(header)
          ? moneyColumnLabel(header, { pdf: true })
          : header,
      ),
      rows: filtered.map((row) => [
        row.studentId,
        row.name,
        row.cls,
        row.route,
        row.shift,
        row.pickup,
        row.drop,
        format === "csv" ? row.billed : formatAmount(row.billed),
        format === "csv" ? row.concession : formatAmount(row.concession),
        format === "csv" ? row.collected : formatAmount(row.collected),
        format === "csv" ? row.due : formatAmount(row.due),
        format === "csv" ? row.overdue : formatAmount(row.overdue),
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
            <div className="text-title text-slate-900 dark:text-zinc-50">Vehicle Fees</div>
            <p className="mt-1 text-[12px] text-black/55 dark:text-zinc-400">
              Route collections, concessions, due, and overdue · {academicYear}
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
            <div className="text-title text-slate-900 dark:text-zinc-50">Transport roster</div>
            <p className="mt-1 text-[12px] text-black/55 dark:text-zinc-400">
              {filtered.length} of {rows.length} student{rows.length === 1 ? "" : "s"} on transport
            </p>
          </div>
          {filtersActive ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setClassFilter("all");
                setRouteFilter("all");
                setShiftFilter("all");
              }}
              className="text-[11px] font-semibold text-[#0F766E] hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="sm:col-span-2 xl:col-span-1">
            <ReportSearch
              value={query}
              onChange={setQuery}
              placeholder="Search student, route, guardian…"
            />
          </div>
          <ReportSelect
            value={classFilter}
            onChange={setClassFilter}
            placeholder="All classes"
            options={classOptions}
          />
          <ReportSelect
            value={routeFilter}
            onChange={setRouteFilter}
            placeholder="All routes"
            options={routeOptions}
          />
          <ReportSelect
            value={shiftFilter}
            onChange={setShiftFilter}
            placeholder="All shifts"
            options={SHIFT_OPTIONS}
          />
        </div>
        {filtered.length === 0 ? (
          <ReportEmpty
            message={
              rows.length === 0
                ? "No vehicle fees for this year"
                : "No students match your search or filters"
            }
          />
        ) : (
          <ReportDataTable
            headers={[
              "ID",
              "Student",
              "Class",
              "Route",
              "Shift",
              "Pickup",
              "Drop",
              "Billed",
              "Concession",
              "Collected",
              "Due",
              "Overdue",
            ]}
            numericFrom={7}
            rows={filtered.map((row) => [
              row.studentId,
              row.name,
              row.cls,
              row.route,
              row.shift,
              row.pickup,
              row.drop,
              formatAmount(row.billed),
              formatAmount(row.concession),
              formatAmount(row.collected),
              formatAmount(row.due),
              formatAmount(row.overdue),
            ])}
          />
        )}
      </OrganicCard>
    </div>
  );
}
