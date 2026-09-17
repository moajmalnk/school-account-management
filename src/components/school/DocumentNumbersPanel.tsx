import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiToken } from "@/lib/api/client";
import {
  apiFetchDocumentSequences,
  apiSaveDocumentSequences,
  DOCUMENT_SEQUENCE_KIND_META,
  formatDocumentNumberPreview,
  type DocumentSequence,
  type DocumentSequenceKind,
} from "@/lib/api/document-sequences";
import { cn } from "@/lib/utils";

const KIND_ORDER: DocumentSequenceKind[] = ["receipt", "voucher", "salary_slip", "journal"];

function seedDefaults(): DocumentSequence[] {
  return KIND_ORDER.map((kind) => {
    const meta = DOCUMENT_SEQUENCE_KIND_META[kind];
    return {
      kind,
      prefix: meta.defaultPrefix,
      nextNumber: meta.defaultNext,
      padding: meta.defaultPadding,
      preview: formatDocumentNumberPreview(meta.defaultPrefix, meta.defaultNext, meta.defaultPadding),
    };
  });
}

type DocumentNumbersPanelProps = {
  branchId: string | null;
  branchName?: string | null;
  className?: string;
};

export function DocumentNumbersPanel({
  branchId,
  branchName,
  className,
}: DocumentNumbersPanelProps) {
  const [rows, setRows] = useState<DocumentSequence[]>(seedDefaults);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    if (!getApiToken() || !branchId) {
      setRows(seedDefaults());
      setDirty(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetchDocumentSequences();
      const byKind = new Map(data.sequences.map((s) => [s.kind, s]));
      setRows(
        KIND_ORDER.map((kind) => {
          const existing = byKind.get(kind);
          if (existing) return existing;
          const meta = DOCUMENT_SEQUENCE_KIND_META[kind];
          return {
            kind,
            prefix: meta.defaultPrefix,
            nextNumber: meta.defaultNext,
            padding: meta.defaultPadding,
            preview: formatDocumentNumberPreview(
              meta.defaultPrefix,
              meta.defaultNext,
              meta.defaultPadding,
            ),
          };
        }),
      );
      setDirty(false);
    } catch {
      setRows(seedDefaults());
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchRow = (kind: DocumentSequenceKind, patch: Partial<DocumentSequence>) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.kind !== kind) return row;
        const next = { ...row, ...patch };
        next.preview = formatDocumentNumberPreview(next.prefix, next.nextNumber, next.padding);
        return next;
      }),
    );
    setDirty(true);
  };

  const campusLabel = branchName?.trim() || "this campus";

  const save = async () => {
    if (!getApiToken()) {
      toast.error("Sign in to save document numbers");
      return;
    }
    setSaving(true);
    try {
      const saved = await apiSaveDocumentSequences(
        rows.map((r) => ({
          kind: r.kind,
          prefix: r.prefix,
          nextNumber: r.nextNumber,
          padding: r.padding,
        })),
      );
      if (!saved.sequences.length) {
        setDirty(false);
        toast.error("Server did not store document numbers", {
          description: "Upload school.php and lib/document_sequences.php to Hostinger, then save again",
        });
        return;
      }
      setRows(saved.sequences);
      setDirty(false);
      toast.success(`Document numbers saved for ${campusLabel}`, {
        description: "Next receipt, voucher, salary slip, and journal will use these sequences",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save document numbers");
    } finally {
      setSaving(false);
    }
  };

  const hint = useMemo(
    () =>
      `Each campus has its own sequences. Prefer a campus-specific prefix (e.g. HILS-R-) so numbers stay unique across the organization.`,
    [],
  );

  return (
    <div
      className={cn(
        "col-span-12 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5 dark:border-white/10 dark:bg-zinc-900/40",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
            Document numbers
          </Label>
          <p className="mt-0.5 text-[11px] text-black/45 dark:text-zinc-500">
            Starting order for receipts, payment vouchers, and salary slips · scoped to{" "}
            <span className="font-semibold text-black/70 dark:text-zinc-300">{campusLabel}</span>
          </p>
          <p className="mt-1 max-w-3xl text-[10.5px] leading-relaxed text-black/40 dark:text-zinc-500">
            {hint}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8 rounded-full bg-[#0F766E] px-3 text-[11px] text-white hover:bg-[#0D9488]"
          disabled={!dirty || saving || loading}
          onClick={() => void save()}
        >
          {saving ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="mr-1 h-3.5 w-3.5" />
          )}
          Save numbers
        </Button>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-[12px] text-black/45">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading sequences…
        </div>
      ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {rows.map((row) => {
            const meta = DOCUMENT_SEQUENCE_KIND_META[row.kind];
            return (
              <div
                key={row.kind}
                className="rounded-xl border border-[#E5E5E5] bg-white p-3 dark:border-white/10 dark:bg-zinc-950/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[13px] font-semibold text-black dark:text-zinc-100">
                      {meta.label}
                    </div>
                    <p className="mt-0.5 text-[10.5px] text-black/45 dark:text-zinc-500">
                      {meta.description}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-[#0F766E]/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#0F766E]">
                    {row.preview}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="col-span-3 sm:col-span-1">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                      Prefix
                    </Label>
                    <Input
                      value={row.prefix}
                      onChange={(e) =>
                        patchRow(row.kind, {
                          prefix: e.target.value.toUpperCase().replace(/\s+/g, "").slice(0, 48),
                        })
                      }
                      className="mt-1 h-9 rounded-lg font-mono text-[12px]"
                      placeholder={meta.defaultPrefix}
                      spellCheck={false}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                      Next #
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={row.nextNumber}
                      onChange={(e) =>
                        patchRow(row.kind, {
                          nextNumber: Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className="mt-1 h-9 rounded-lg font-mono text-[12px]"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                      Padding
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={12}
                      value={row.padding}
                      onChange={(e) =>
                        patchRow(row.kind, {
                          padding: Math.max(0, Math.min(12, Number.parseInt(e.target.value, 10) || 0)),
                        })
                      }
                      className="mt-1 h-9 rounded-lg font-mono text-[12px]"
                      title="Zero-pad width (0 = no padding)"
                    />
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-black/40 dark:text-zinc-500">
                  Next issued:{" "}
                  <span className="font-mono font-medium text-black/70 dark:text-zinc-300">
                    {row.preview}
                  </span>
                  {row.padding > 0 ? ` · ${row.padding}-digit pad` : " · no zero pad"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
