import { Download, Loader2, Upload } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type CsvImportIssue = {
  line: number;
  message: string;
  rowLabel: string;
};

export type CsvImportPreviewRow = {
  line: number;
  label: string;
  amount: number;
  extra?: string;
  duplicate?: boolean;
};

const importMenuBtn =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3.5 text-[12px] font-semibold text-black transition-colors hover:border-black/20 hover:bg-[#F4F4F5] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

export function FinanceCsvImportMenu({
  disabled,
  onTemplate,
  onDemo,
  onUploadClick,
}: {
  disabled?: boolean;
  onTemplate: () => void;
  onDemo: () => void;
  onUploadClick: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={importMenuBtn} disabled={disabled}>
          <Upload className="h-3.5 w-3.5" />
          Bulk Upload
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="z-[250] w-56 rounded-lg border-[#E5E5E5] bg-white p-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)]"
      >
        <DropdownMenuItem
          onClick={onTemplate}
          className="cursor-pointer gap-2 rounded-xl text-[13px]"
        >
          <Download className="h-3.5 w-3.5" />
          Download template
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDemo} className="cursor-pointer gap-2 rounded-xl text-[13px]">
          <Download className="h-3.5 w-3.5" />
          Download demo CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onUploadClick}
          disabled={disabled}
          className="cursor-pointer gap-2 rounded-xl text-[13px]"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CsvBulkImportDialog({
  open,
  onOpenChange,
  title,
  description,
  validCount,
  invalidCount,
  duplicateCount,
  totalAmount,
  issues,
  previewRows,
  importing,
  progress,
  onConfirm,
  skipDuplicates = true,
  duplicateStatLabel = "Duplicates",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  totalAmount: number;
  issues: CsvImportIssue[];
  previewRows: CsvImportPreviewRow[];
  importing: boolean;
  progress: { current: number; total: number };
  onConfirm: () => void;
  skipDuplicates?: boolean;
  duplicateStatLabel?: string;
}) {
  const importable = skipDuplicates ? previewRows.filter((row) => !row.duplicate) : previewRows;
  const canImport = importable.length > 0 && !importing;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (importing) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={!importing}
        onPointerDownOutside={(e) => {
          if (importing) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (importing) e.preventDefault();
        }}
        className="flex max-h-[min(90dvh,720px)] w-[calc(100%-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white p-0 sm:max-w-lg"
      >
        <DialogHeader className="space-y-1.5 border-b border-[#F0F0F0] px-5 pb-4 pt-5 pr-12 text-left sm:px-6 sm:pt-6">
          <DialogTitle className="text-[18px] font-semibold tracking-tight text-black">
            {importing ? "Importing…" : title}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-black/55">
            {importing
              ? `Saving ${progress.current} of ${progress.total}. Keep this window open.`
              : description || "Review rows before they are saved to the ledger."}
          </DialogDescription>
        </DialogHeader>

        {importing ? (
          <div className="px-5 py-8 text-center sm:px-6">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#0F766E]/10">
              <Loader2 className="h-7 w-7 animate-spin text-[#0F766E]" />
            </div>
            <div className="font-mono text-[15px] font-semibold tabular-nums text-black">
              {progress.current} / {progress.total}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E7E5E4]">
              <div
                className="h-full rounded-full bg-[#0F766E] transition-[width]"
                style={{
                  width: `${progress.total ? Math.round((progress.current / progress.total) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 px-5 py-4 sm:grid-cols-4 sm:px-6">
              <ImportStat label="Ready" value={String(validCount)} />
              <ImportStat label="Amount" value={`₹ ${totalAmount.toLocaleString("en-IN")}`} />
              <ImportStat label={duplicateStatLabel} value={String(duplicateCount)} muted />
              <ImportStat label="Errors" value={String(invalidCount)} muted={invalidCount === 0} />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 sm:px-6">
              {previewRows.length > 0 && (
                <div className="mb-3 divide-y divide-[#F0F0F0] rounded-xl border border-[#EFEFEF]">
                  {previewRows.slice(0, 8).map((row) => (
                    <div
                      key={`${row.line}-${row.label}`}
                      className="flex items-start gap-3 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-black">
                          {row.label}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-black/50">
                          Line {row.line}
                          {row.extra ? ` · ${row.extra}` : ""}
                          {row.duplicate
                            ? skipDuplicates
                              ? " · already on ledger"
                              : " · will update"
                            : ""}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "shrink-0 font-mono text-[12.5px] font-semibold tabular-nums",
                          row.duplicate && skipDuplicates
                            ? "text-black/40 line-through"
                            : "text-black",
                        )}
                      >
                        ₹ {row.amount.toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                  {previewRows.length > 8 && (
                    <div className="px-3 py-2 text-center text-[11px] text-black/45">
                      +{previewRows.length - 8} more row{previewRows.length - 8 === 1 ? "" : "s"}
                    </div>
                  )}
                </div>
              )}

              {issues.length > 0 && (
                <div className="mb-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#B91C1C]">
                    {issues.length} row{issues.length === 1 ? "" : "s"} will be skipped
                  </div>
                  <ul className="mt-1.5 space-y-1">
                    {issues.slice(0, 8).map((issue) => (
                      <li
                        key={`${issue.line}-${issue.message}`}
                        className="text-[12px] text-[#7F1D1D]"
                      >
                        Line {issue.line} · {issue.rowLabel} — {issue.message}
                      </li>
                    ))}
                    {issues.length > 8 && (
                      <li className="text-[11px] text-[#9F1239]">+{issues.length - 8} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-[#F0F0F0] px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#E5E5E5] bg-white px-4 text-[13px] font-semibold text-black/70 hover:bg-[#F4F4F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={!canImport}
                className="inline-flex h-10 min-w-[132px] items-center justify-center rounded-full bg-[#0F766E] px-5 text-[13px] font-semibold text-white shadow-[0_8px_24px_-10px_rgba(15,118,110,0.45)] hover:bg-[#0D9488] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              >
                Import {importable.length || ""}
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ImportStat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-xl border border-[#EFEFEF] bg-[#F8F8F9] px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 truncate font-mono text-[13px] font-semibold tabular-nums",
          muted ? "text-black/45" : "text-black",
        )}
      >
        {value}
      </div>
    </div>
  );
}
