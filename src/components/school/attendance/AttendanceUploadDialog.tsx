import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
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
import { SpreadsheetReadError, readSpreadsheetTable, SPREADSHEET_ACCEPT } from "@/lib/spreadsheet-file";
import type { SheetIssue } from "@/lib/attendance-import";

const MAX_FILE_BYTES = 2_000_000;

export function AttendanceUploadDialog<T>({
  open,
  onOpenChange,
  title,
  description,
  hint,
  onDownloadMock,
  parseTable,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  hint: string;
  onDownloadMock: () => void;
  parseTable: (table: string[][]) => { rows: T[]; issues: SheetIssue[] };
  onSave: (rows: T[]) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<T[]>([]);
  const [issues, setIssues] = useState<SheetIssue[]>([]);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const reset = () => {
    setFileName("");
    setRows([]);
    setIssues([]);
    setReading(false);
    setSaving(false);
    setConfirmOpen(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = () => {
    if (saving) return;
    reset();
    onOpenChange(false);
  };

  const onFile = (file: File | undefined) => {
    if (!file || reading || saving) return;
    if (file.size > MAX_FILE_BYTES) {
      toast.error("File is too large", { description: "Keep the sheet under 2 MB." });
      return;
    }
    setReading(true);
    void (async () => {
      try {
        const table = await readSpreadsheetTable(file);
        const parsed = parseTable(table);
        setFileName(file.name);
        setRows(parsed.rows);
        setIssues(parsed.issues);
        if (!parsed.rows.length) {
          toast.error("Nothing to upload", {
            description: parsed.issues[0]?.message ?? "The sheet has no matching rows.",
          });
        }
      } catch (err) {
        setRows([]);
        setIssues([]);
        setFileName("");
        if (err instanceof SpreadsheetReadError) {
          toast.error(err.message, { description: err.description });
        } else {
          toast.error("Could not read the selected file");
        }
      } finally {
        setReading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    })();
  };

  const save = async () => {
    if (saving || rows.length === 0) return;
    setSaving(true);
    try {
      await onSave(rows);
      setConfirmOpen(false);
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "Try again",
      });
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  const shownIssues = issues.slice(0, 6);

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full rounded-xl"
              onClick={onDownloadMock}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Download mock Excel
            </Button>
            <p className="text-[12px] text-slate-500 dark:text-zinc-400">{hint}</p>
            <input
              ref={inputRef}
              type="file"
              accept={SPREADSHEET_ACCEPT}
              className="hidden"
              onChange={(event) => onFile(event.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full rounded-xl"
              disabled={reading || saving}
              onClick={() => inputRef.current?.click()}
            >
              {reading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-4 w-4" />
              )}
              {fileName ? "Choose another file" : "Upload Excel or CSV"}
            </Button>
            {fileName ? (
              <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] dark:bg-white/5">
                <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-zinc-100">
                  <FileSpreadsheet className="h-4 w-4 text-[#0F766E]" />
                  <span className="truncate">{fileName}</span>
                </div>
                <div className="mt-1 text-[12px] text-slate-500">
                  {rows.length} row{rows.length === 1 ? "" : "s"} ready
                  {issues.length ? ` · ${issues.length} skipped or replaced` : ""}
                </div>
                {shownIssues.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-[12px] text-[#B91C1C]">
                    {shownIssues.map((issue) => (
                      <li key={`${issue.line}-${issue.message}`}>
                        Row {issue.line}: {issue.message}
                      </li>
                    ))}
                    {issues.length > shownIssues.length ? (
                      <li>+{issues.length - shownIssues.length} more</li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="rounded-full" disabled={saving} onClick={close}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
              disabled={reading || saving || rows.length === 0}
              onClick={() => setConfirmOpen(true)}
            >
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Save upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={(next) => !saving && setConfirmOpen(next)}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Save this upload?</DialogTitle>
            <DialogDescription>
              {rows.length} row{rows.length === 1 ? "" : "s"} will be recorded.
              {issues.length
                ? ` ${issues.length} row${issues.length === 1 ? "" : "s"} with problems are left out.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" disabled={saving} onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#0F766E] text-white hover:bg-[#0D9488]"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Confirm save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
