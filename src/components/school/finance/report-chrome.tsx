import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, Printer, Search, X } from "lucide-react";

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

export type PdfPageOrientation = "portrait" | "landscape";

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

const ORIENTATION_OPTIONS: {
  id: PdfPageOrientation;
  title: string;
  hint: string;
  pageClass: string;
}[] = [
  {
    id: "portrait",
    title: "Portrait",
    hint: "Tall page · best for shorter tables and statements",
    pageClass: "h-16 w-11",
  },
  {
    id: "landscape",
    title: "Landscape",
    hint: "Wide page · best for multi-column ledgers and registers",
    pageClass: "h-11 w-16",
  },
];

export function ReportPdfLayoutDialog({
  open,
  mode,
  reportLabel,
  defaultOrientation = "landscape",
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  mode: "pdf" | "print" | null;
  reportLabel: string;
  defaultOrientation?: PdfPageOrientation;
  onOpenChange: (open: boolean) => void;
  onConfirm: (orientation: PdfPageOrientation) => void;
}) {
  const [orientation, setOrientation] = useState<PdfPageOrientation>(defaultOrientation);

  useEffect(() => {
    if (!open) return;
    setOrientation(defaultOrientation);
  }, [open, defaultOrientation]);

  const isPrint = mode === "print";
  const title = isPrint ? "Print layout" : "Download layout";
  const confirmLabel = isPrint ? "Print PDF" : "Export PDF";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-[#E5E5E5] bg-white p-0">
        <DialogHeader className="space-y-1 border-b border-[#F0F0F0] px-5 pb-4 pt-5 pr-12 text-left">
          <DialogTitle className="text-[18px] font-semibold text-black">{title}</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-black/60">
            Choose page orientation for {reportLabel}. You can still adjust the printer dialog
            after this.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
            Page orientation
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {ORIENTATION_OPTIONS.map((option) => {
              const selected = orientation === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setOrientation(option.id)}
                  className={cn(
                    "rounded-2xl border px-3.5 py-3.5 text-left transition",
                    selected
                      ? "border-transparent bg-[#0F766E] text-white shadow-sm shadow-teal-900/10"
                      : "border-[#E5E5E5] bg-white text-black/75 hover:border-black/25",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "grid place-items-center rounded-lg",
                        selected ? "bg-white/15" : "bg-[#F8FAFC]",
                        option.id === "portrait" ? "h-14 w-12" : "h-12 w-16",
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-[3px] border-2 shadow-sm",
                          option.pageClass,
                          selected
                            ? "border-white/80 bg-white/25"
                            : "border-[#0F766E]/35 bg-white",
                        )}
                      >
                        <div
                          className={cn(
                            "mx-auto mt-[18%] space-y-1",
                            option.id === "portrait" ? "w-[58%]" : "w-[70%]",
                          )}
                        >
                          <div
                            className={cn(
                              "h-0.5 rounded-full",
                              selected ? "bg-white/70" : "bg-[#0F766E]/35",
                            )}
                          />
                          <div
                            className={cn(
                              "h-0.5 rounded-full",
                              selected ? "bg-white/45" : "bg-[#0F766E]/20",
                            )}
                          />
                          <div
                            className={cn(
                              "h-0.5 rounded-full",
                              selected ? "bg-white/30" : "bg-[#0F766E]/15",
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold">{option.title}</div>
                      <div
                        className={cn(
                          "mt-0.5 text-[11px] leading-snug",
                          selected ? "text-white/80" : "text-black/45",
                        )}
                      >
                        {option.hint}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[11.5px] leading-relaxed text-black/45">
            {orientation === "landscape"
              ? "Recommended for wide tables with many columns."
              : "Recommended for compact summaries and statement-style reports."}
          </p>
        </div>

        <DialogFooter className="flex-row justify-end gap-2 border-t border-[#F0F0F0] px-5 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
            onClick={() => {
              onConfirm(orientation);
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReportExportButtons({
  onCsv,
  onPdf,
  onPrint,
  reportLabel = "this report",
  defaultOrientation = "landscape",
}: {
  onCsv: () => void;
  onPdf: (landscape: boolean) => void;
  onPrint: (landscape: boolean) => void;
  reportLabel?: string;
  defaultOrientation?: PdfPageOrientation;
}) {
  const [pendingMode, setPendingMode] = useState<"pdf" | "print" | null>(null);
  const quiet =
    "inline-flex min-h-10 min-w-0 w-full items-center justify-center gap-1 rounded-full border border-[#E5E5E5] bg-white px-2 py-1.5 text-[10.5px] font-medium text-black transition-colors hover:bg-[#F4F4F5] dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:gap-1.5 sm:px-3 sm:text-[12px]";
  return (
    <>
      <div className="grid w-full shrink-0 grid-cols-3 gap-1.5 sm:gap-2 lg:w-auto lg:min-w-[260px]">
        <button type="button" onClick={onCsv} className={quiet}>
          <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Export CSV</span>
        </button>
        <button
          type="button"
          onClick={() => setPendingMode("pdf")}
          className="inline-flex min-h-10 min-w-0 w-full items-center justify-center gap-1 rounded-full bg-[#0F766E] px-2 py-1.5 text-[10.5px] font-semibold text-white transition-colors hover:bg-[#0D9488] sm:gap-1.5 sm:px-3 sm:text-[12px]"
        >
          <Download className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Export PDF</span>
        </button>
        <button type="button" onClick={() => setPendingMode("print")} className={quiet}>
          <Printer className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Print PDF</span>
        </button>
      </div>
      <ReportPdfLayoutDialog
        open={Boolean(pendingMode)}
        mode={pendingMode}
        reportLabel={reportLabel}
        defaultOrientation={defaultOrientation}
        onOpenChange={(next) => {
          if (!next) setPendingMode(null);
        }}
        onConfirm={(orientation) => {
          const landscape = orientation === "landscape";
          if (pendingMode === "print") onPrint(landscape);
          else onPdf(landscape);
          setPendingMode(null);
        }}
      />
    </>
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
  landscape,
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
  landscape?: boolean;
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
    landscape: landscape ?? headers.length > 6,
    action: format === "print" ? "print" : "download",
  });
}
