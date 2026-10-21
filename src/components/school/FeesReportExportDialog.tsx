import { useEffect, useMemo, useState } from "react";

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
import type { FeeSheetColumn, FeeSheetPaymentCounts, FeeSheetPaymentFilter } from "@/lib/class-fee-sheet";
import { cn } from "@/lib/utils";

export type FeesExportFormat = "csv" | "pdf" | "print";

export type FeesExportChoice = {
  mode: "full" | "selected";
  columns: FeeSheetColumn[];
  paymentStatus: FeeSheetPaymentFilter;
};

const PAYMENT_OPTIONS: { id: FeeSheetPaymentFilter; title: string; hint: string }[] = [
  { id: "all", title: "All", hint: "Every student" },
  { id: "paid", title: "Paid", hint: "Nothing left on this sheet" },
  { id: "partial", title: "Partially paid", hint: "Some amount received" },
  { id: "unpaid", title: "Not paid", hint: "No payment yet" },
];

const FORMAT_LABEL: Record<FeesExportFormat, string> = {
  csv: "Export CSV",
  pdf: "Export PDF",
  print: "Print PDF",
};

export function FeesReportExportDialog({
  open,
  format,
  terms,
  heads,
  studentCount,
  classLabel,
  paymentCounts,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  format: FeesExportFormat | null;
  terms: FeeSheetColumn[];
  heads: FeeSheetColumn[];
  studentCount: number;
  classLabel: string;
  paymentCounts: (columns: FeeSheetColumn[]) => FeeSheetPaymentCounts;
  onOpenChange: (open: boolean) => void;
  onConfirm: (choice: FeesExportChoice) => void;
}) {
  const [mode, setMode] = useState<"full" | "selected">("full");
  const [paymentStatus, setPaymentStatus] = useState<FeeSheetPaymentFilter>("all");
  const [picked, setPicked] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!open) return;
    setMode("full");
    setPaymentStatus("all");
    setPicked(new Set([...terms, ...heads].map((column) => column.key)));
  }, [open, terms, heads]);

  const selectedColumns = useMemo(() => {
    const all = [...terms, ...heads];
    if (mode === "full") return all;
    return all.filter((column) => picked.has(column.key));
  }, [mode, picked, terms, heads]);

  const toggle = (key: string, checked: boolean) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const setGroup = (columns: FeeSheetColumn[], on: boolean) => {
    setPicked((prev) => {
      const next = new Set(prev);
      for (const column of columns) {
        if (on) next.add(column.key);
        else next.delete(column.key);
      }
      return next;
    });
  };

  const counts = useMemo(() => {
    if (!open) {
      return { all: studentCount, paid: 0, partial: 0, unpaid: 0 };
    }
    return paymentCounts(selectedColumns);
  }, [open, paymentCounts, selectedColumns, studentCount]);
  const matchedStudents = counts[paymentStatus];
  const canExport = (mode === "full" || selectedColumns.length > 0) && matchedStudents > 0;
  const action = format ? FORMAT_LABEL[format] : "Export";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,760px)] w-[calc(100%-1.5rem)] max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 space-y-1 border-b border-[#F0F0F0] px-5 pb-4 pt-5 pr-12 text-left">
          <DialogTitle className="text-[18px] font-semibold text-black">
            {action === "Print PDF" ? "Print class fee sheet" : "Export class fee sheet"}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-black/60">
            {studentCount} student{studentCount === 1 ? "" : "s"} · {classLabel}. Choose who to
            include, then the full schedule or only the terms and fee heads this file should include.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-black/45">
              Payment status
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PAYMENT_OPTIONS.map((option) => {
                const selected = paymentStatus === option.id;
                const count = counts[option.id];
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPaymentStatus(option.id)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left transition",
                      selected
                        ? "border-transparent bg-[#0F766E] text-white shadow-sm"
                        : "border-[#E5E5E5] bg-white text-black/70 hover:border-black/30",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold">{option.title}</span>
                      <span
                        className={cn(
                          "text-[11px] font-semibold tabular-nums",
                          selected ? "text-white/80" : "text-black/40",
                        )}
                      >
                        {count}
                      </span>
                    </div>
                    <div className={cn("mt-0.5 text-[11px]", selected ? "text-white/80" : "text-black/45")}>
                      {option.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: "full" as const, title: "Full schedule", hint: "Every term and fee head" },
                { id: "selected" as const, title: "Choose", hint: "Only what you tick below" },
              ] as const
            ).map((option) => {
              const selected = mode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMode(option.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition",
                    selected
                      ? "border-transparent bg-[#0F766E] text-white shadow-sm"
                      : "border-[#E5E5E5] bg-white text-black/70 hover:border-black/30",
                  )}
                >
                  <div className="text-[13px] font-semibold">{option.title}</div>
                  <div className={cn("mt-0.5 text-[11px]", selected ? "text-white/80" : "text-black/45")}>
                    {option.hint}
                  </div>
                </button>
              );
            })}
          </div>

          {mode === "selected" ? (
            <div className="space-y-4">
              <ColumnGroup
                title="Terms"
                empty="No installments on the classes in this export."
                columns={terms}
                picked={picked}
                onToggle={toggle}
                onSetAll={(on) => setGroup(terms, on)}
              />
              <ColumnGroup
                title="Fee heads"
                empty="No one-time or vehicle fees on these classes."
                columns={heads}
                picked={picked}
                onToggle={toggle}
                onSetAll={(on) => setGroup(heads, on)}
              />
              <p className="text-[12px] leading-relaxed text-black/45">
                Each column is the outstanding balance for that term or head. Total adds only the
                columns you keep.
              </p>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl bg-[#F8FAFC] px-3 py-2.5">
              <p className="text-[12px] leading-relaxed text-black/55">
                {terms.length + heads.length > 0
                  ? `The sheet will include ${terms.length} term${terms.length === 1 ? "" : "s"} and ${heads.length} fee head${heads.length === 1 ? "" : "s"}. Each column is the outstanding balance, and Total is their sum.`
                  : "These classes have no fee schedule yet. The sheet will show each student’s outstanding balance."}
              </p>
              {terms.length + heads.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {[...terms, ...heads].map((column) => (
                    <span
                      key={column.key}
                      className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-black/70 ring-1 ring-[#E5E5E5]"
                    >
                      {column.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-[#F0F0F0] px-5 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canExport || !format}
            className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
            onClick={() => onConfirm({ mode, columns: selectedColumns, paymentStatus })}
          >
            {action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ColumnGroup({
  title,
  empty,
  columns,
  picked,
  onToggle,
  onSetAll,
}: {
  title: string;
  empty: string;
  columns: FeeSheetColumn[];
  picked: Set<string>;
  onToggle: (key: string, checked: boolean) => void;
  onSetAll: (on: boolean) => void;
}) {
  const allOn = columns.length > 0 && columns.every((column) => picked.has(column.key));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-black/45">{title}</div>
        {columns.length > 0 ? (
          <button
            type="button"
            className="text-[11px] font-semibold text-[#0F766E] hover:underline"
            onClick={() => onSetAll(!allOn)}
          >
            {allOn ? "Clear" : "Select all"}
          </button>
        ) : null}
      </div>
      {columns.length === 0 ? (
        <p className="text-[12px] text-black/45">{empty}</p>
      ) : (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => {
            const checked = picked.has(column.key);
            return (
              <label
                key={column.key}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-[12.5px]",
                  checked
                    ? "border-[#99F6E4] bg-[#F0FDFA] text-black"
                    : "border-[#EFEFEF] bg-white text-black/70",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => onToggle(column.key, value === true)}
                />
                <span className="min-w-0 truncate">{column.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
