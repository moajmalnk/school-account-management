import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatEventDateTime } from "@/lib/dates";
import type { StaffStatusEvent } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

const META_LABEL =
  "text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-400";
const CARD_FRAME =
  "rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 dark:border-white/10 dark:bg-[#171717] dark:text-zinc-100 dark:shadow-black/40";

export function EnrollmentStatusBadge({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-auto shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold",
        active
          ? "bg-[#CCFBF1] text-[#0F172A] dark:bg-[#0F766E]/30 dark:text-[#5EEAD4]"
          : "bg-black/8 text-black/55 dark:bg-white/10 dark:text-zinc-400",
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-[#0F766E] dark:bg-[#2DD4BF]" : "bg-black/35 dark:bg-zinc-500",
        )}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function isRecordActive(active: boolean | undefined) {
  return active !== false;
}

export function isRecordDeleted(deletedAt: string | undefined) {
  return Boolean(deletedAt);
}

function StatusTableRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <tr className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-b-0 last:pb-0 first:pt-0 sm:table-row sm:border-slate-100/90 dark:border-white/10">
      <th
        scope="row"
        className={cn(
          META_LABEL,
          "whitespace-nowrap text-left font-semibold sm:w-[38%] sm:max-w-[14rem] sm:py-3 sm:pr-4 sm:align-top",
        )}
      >
        {label}
      </th>
      <td className="min-w-0 break-words text-[14px] font-medium text-black dark:text-zinc-100 sm:py-3 sm:align-top">
        {children}
      </td>
    </tr>
  );
}

export function ProfileAccountActions({
  name,
  recordId,
  active,
  entityLabel,
  onToggleActive,
  onDelete,
  /** When false, recycle bin is unavailable (e.g. student has payments). Default true. */
  canDelete = true,
  deleteBlockedReason,
  /** Require a written reason when deactivating (students). */
  requireDeactivateReason = false,
  lastDeactivationReason,
  statusHistory = [],
}: {
  name: string;
  recordId: string;
  active: boolean;
  entityLabel: string;
  onToggleActive: (nextActive: boolean, reason?: string) => void;
  onDelete: () => void;
  canDelete?: boolean;
  deleteBlockedReason?: string;
  requireDeactivateReason?: boolean;
  lastDeactivationReason?: string;
  statusHistory?: StaffStatusEvent[];
}) {
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [reasonError, setReasonError] = useState(false);

  const resetDeactivateDialog = (open: boolean) => {
    setConfirmDeactivate(open);
    if (!open) {
      setDeactivateReason("");
      setReasonError(false);
    }
  };

  const submitDeactivate = () => {
    const reason = deactivateReason.trim();
    if (requireDeactivateReason && reason.length < 3) {
      setReasonError(true);
      return;
    }
    onToggleActive(false, reason || undefined);
    resetDeactivateDialog(false);
  };

  return (
    <>
      <section className={CARD_FRAME}>
        <h2 className="text-base font-semibold text-black dark:text-zinc-50">Account Status</h2>
        <p className="mt-1 text-[12.5px] text-black/50 dark:text-zinc-400">
          {canDelete
            ? `Deactivate to archive this ${entityLabel} without deleting records. Move to Recycle Bin hides the profile from the directory — you can restore it later.`
            : `This ${entityLabel} has financial or related records, so Recycle Bin is unavailable. Deactivate to archive them while keeping the history intact.`}
        </p>

        <div className="mt-4 -mx-1 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-0 border-collapse text-left">
            <tbody>
              <StatusTableRow label="Enrollment Status">
                <div className="flex flex-wrap items-center gap-2">
                  <EnrollmentStatusBadge active={active} />
                  {!active && lastDeactivationReason ? (
                    <span className="text-[12px] font-normal text-black/55 dark:text-zinc-400">
                      Reason: {lastDeactivationReason}
                    </span>
                  ) : null}
                </div>
              </StatusTableRow>
              <StatusTableRow label="Actions">
                <div className="flex flex-col items-start gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {active ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full dark:border-white/20 dark:bg-transparent dark:text-zinc-100 dark:hover:bg-white/10"
                        onClick={() => resetDeactivateDialog(true)}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-[#0F766E] bg-[#F0FDFA] text-[#0F172A] hover:bg-[#CCFBF1] dark:border-[#14B8A6]/50 dark:bg-[#0F766E]/25 dark:text-[#5EEAD4] dark:hover:bg-[#0F766E]/40"
                        onClick={() => onToggleActive(true)}
                      >
                        Reactivate
                      </Button>
                    )}
                    {canDelete ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-[#FECACA] text-[#EF4444] hover:bg-[#FEF2F2] hover:text-[#EF4444] dark:border-rose-400/45 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-950/55 dark:hover:text-rose-200"
                        onClick={() => setConfirmDelete(true)}
                      >
                        Move to Recycle Bin
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        disabled
                        title={deleteBlockedReason}
                        className="rounded-full border-slate-200 text-slate-400 dark:border-white/15 dark:text-zinc-500"
                      >
                        Move to Recycle Bin
                      </Button>
                    )}
                  </div>
                  {!canDelete && deleteBlockedReason ? (
                    <p className="max-w-md text-[12px] leading-relaxed text-amber-800/90 dark:text-amber-200/90">
                      {deleteBlockedReason}
                    </p>
                  ) : null}
                </div>
              </StatusTableRow>
            </tbody>
          </table>
        </div>

        {statusHistory.length > 0 ? (
          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/10">
            <h3 className="text-[13px] font-semibold text-black dark:text-zinc-50">Status history</h3>
            <p className="mt-1 text-[12px] text-black/50 dark:text-zinc-400">
              Earlier deactivations stay on the profile after reactivation.
            </p>
            <ol className="mt-3 space-y-2">
              {statusHistory.map((event) => (
                <li
                  key={event.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 dark:border-white/10 dark:bg-zinc-900/70"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        event.type === "deactivated"
                          ? "bg-[#FEE2E2] text-[#B91C1C] dark:bg-rose-950/50 dark:text-rose-300"
                          : "bg-[#D1F2E1] text-[#047857] dark:bg-emerald-950/45 dark:text-emerald-300",
                      )}
                    >
                      {event.type === "deactivated" ? "Deactivated" : "Reactivated"}
                    </span>
                    <span className="font-mono text-[12px] text-black/70 dark:text-zinc-300">
                      {formatEventDateTime(event.at)}
                    </span>
                  </div>
                  {event.note ? (
                    <p className="mt-1 text-[12.5px] text-black/70 dark:text-zinc-300">{event.note}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>

      <Dialog open={confirmDeactivate} onOpenChange={resetDeactivateDialog}>
        <DialogContent className="max-w-md rounded-xl border border-[#E5E5E5] bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black dark:text-zinc-50">
              Deactivate {entityLabel}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60 dark:text-zinc-400">
              {name} ({recordId}) will be marked inactive and hidden from active directory filters.
              Payment history and related records stay intact
              {requireDeactivateReason ? " — please note why you are deactivating." : "."}
            </DialogDescription>
          </DialogHeader>
          {requireDeactivateReason ? (
            <div className="mt-4 space-y-2">
              <Label htmlFor="deactivate-reason" className="text-[12px] font-semibold text-slate-700 dark:text-zinc-200">
                Reason <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="deactivate-reason"
                value={deactivateReason}
                onChange={(e) => {
                  setDeactivateReason(e.target.value);
                  if (e.target.value.trim().length >= 3) setReasonError(false);
                }}
                placeholder="e.g. Transferred to another campus, long leave, completed schooling…"
                rows={3}
                className={cn(
                  "resize-none rounded-xl text-[13px]",
                  reasonError && "border-rose-400 focus-visible:ring-rose-400/30",
                )}
              />
              {reasonError ? (
                <p className="text-[12px] text-rose-600 dark:text-rose-400">
                  Enter at least a short reason (3+ characters).
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Saved on the profile for audit — you can reactivate later.
                </p>
              )}
            </div>
          ) : null}
          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => resetDeactivateDialog(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
              onClick={submitDeactivate}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black dark:text-zinc-50">
              Move to Recycle Bin
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60 dark:text-zinc-400">
              Move {name} ({recordId}) to the recycle bin? They will leave the directory and can be
              restored later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full bg-[#EF4444] text-white hover:bg-[#DC2626]"
              onClick={() => {
                onDelete();
                setConfirmDelete(false);
              }}
            >
              Move to Bin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
