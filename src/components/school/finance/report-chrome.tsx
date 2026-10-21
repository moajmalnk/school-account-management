import { Download, FileSpreadsheet, Printer, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { downloadCsv, downloadTablePdf } from "@/lib/finance-export";
import { formatDownloadFilename, slugYear, todayStamp } from "@/lib/download-names";
import { cn } from "@/lib/utils";

export function reportFileName(
  report: string,
  ext: "pdf" | "csv",
  schoolName: string,
  academicYear: string,
) {
  return formatDownloadFilename("reports", ext, {
    report,
    school: schoolName,
    year: slugYear(academicYear),
    date: todayStamp(),
  });
}

export function ReportExportButtons({
  onCsv,
  onPdf,
  onPrint,
}: {
  onCsv: () => void;
  onPdf: () => void;
  onPrint: () => void;
}) {
  const quiet =
    "inline-flex min-h-10 min-w-0 w-full items-center justify-center gap-1 rounded-full border border-[#E5E5E5] bg-white px-2 py-1.5 text-[10.5px] font-medium text-black transition-colors hover:bg-[#F4F4F5] dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:gap-1.5 sm:px-3 sm:text-[12px]";
  return (
    <div className="grid w-full shrink-0 grid-cols-3 gap-1.5 sm:gap-2 lg:w-auto lg:min-w-[260px]">
      <button type="button" onClick={onCsv} className={quiet}>
        <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Export CSV</span>
      </button>
      <button
        type="button"
        onClick={onPdf}
        className="inline-flex min-h-10 min-w-0 w-full items-center justify-center gap-1 rounded-full bg-[#0F766E] px-2 py-1.5 text-[10.5px] font-semibold text-white transition-colors hover:bg-[#0D9488] sm:gap-1.5 sm:px-3 sm:text-[12px]"
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Export PDF</span>
      </button>
      <button type="button" onClick={onPrint} className={quiet}>
        <Printer className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Print PDF</span>
      </button>
    </div>
  );
}

export function ReportSummary({
  items,
}: {
  items: { label: string; value: string; accent?: boolean }[];
}) {
  return (
    <div
      className={cn(
        "mt-4 grid gap-2.5 sm:gap-3",
        items.length >= 5
          ? "grid-cols-2 lg:grid-cols-5"
          : items.length === 4
            ? "grid-cols-2 lg:grid-cols-4"
            : items.length === 3
              ? "grid-cols-3"
              : "grid-cols-2",
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

export function ReportSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-0">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-zinc-500" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-xl border border-[#E5E5E5] bg-white pl-9 pr-9 shadow-none focus-visible:border-[#E5E5E5] focus-visible:ring-1 focus-visible:ring-[#0F766E]/25 dark:border-white/10 dark:bg-zinc-900"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-black/45 transition-colors hover:bg-[#F4F4F5] hover:text-black dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function ReportSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-full rounded-xl border border-[#E5E5E5] bg-white shadow-none focus:border-[#E5E5E5] focus:ring-1 focus:ring-[#0F766E]/25 dark:border-white/10 dark:bg-zinc-900">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ReportEmpty({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-black/15 px-4 py-10 text-center text-[12px] text-black/55 dark:border-white/15 dark:text-zinc-400">
      {message}
    </div>
  );
}

export function ReportDataTable({
  headers,
  rows,
  numericFrom = 0,
}: {
  headers: string[];
  rows: string[][];
  numericFrom?: number;
}) {
  return (
    <div className="mobile-scrollbar-none relative z-0 mt-4 overflow-x-auto rounded-xl border border-[#E5E5E5] dark:border-white/10">
      <table className="w-full min-w-[720px] border-collapse text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-[#E5E5E5] bg-[#F4F4F5] dark:border-white/10 dark:bg-zinc-900/80">
            {headers.map((header, index) => (
              <th
                key={header}
                className={cn(
                  "px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400",
                  index >= numericFrom && "text-right",
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={`${row[0]}-${rowIndex}`}
              className="border-b border-[#EFEFEF] last:border-0 dark:border-white/10"
            >
              {row.map((cell, index) => (
                <td
                  key={`${headers[index]}-${index}`}
                  className={cn(
                    "px-3 py-2.5 text-slate-800 dark:text-zinc-100",
                    index >= numericFrom && "text-right font-mono tabular-nums",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function exportReportFile({
  format,
  filenameBase,
  title,
  subtitle,
  headers,
  pdfHeaders,
  rows,
  summary,
  schoolName,
  academicYear,
}: {
  format: "csv" | "pdf" | "print";
  filenameBase: string;
  title: string;
  subtitle: string;
  headers: string[];
  pdfHeaders?: string[];
  rows: (string | number)[][];
  summary: { label: string; value: string }[];
  schoolName: string;
  academicYear: string;
}) {
  if (format === "csv") {
    downloadCsv(reportFileName(filenameBase, "csv", schoolName, academicYear), headers, rows);
    return;
  }
  downloadTablePdf({
    filename: reportFileName(filenameBase, "pdf", schoolName, academicYear),
    title,
    subtitle,
    headers: pdfHeaders ?? headers,
    rows: rows.map((row) => row.map((cell) => String(cell))),
    summaryItems: summary,
    emptyMessage: "Nothing to export for this filter",
    landscape: headers.length > 6,
    action: format === "print" ? "print" : "download",
  });
}
