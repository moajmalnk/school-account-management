import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
        active ? "bg-[#DBEAFE] text-[#0F172A]" : "bg-black/8 text-black/55",
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-[#2563EB]" : "bg-black/35")}
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

export function ProfileAccountActions({
  name,
  recordId,
  active,
  entityLabel,
  onToggleActive,
  onDelete,
}: {
  name: string;
  recordId: string;
  active: boolean;
  entityLabel: string;
  onToggleActive: (nextActive: boolean) => void;
  onDelete: () => void;
}) {
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col items-center gap-3 text-center lg:flex-row lg:items-start lg:justify-between lg:gap-4 lg:text-left">
          <div className="max-w-xl">
            <h2 className="text-base font-semibold text-black">Account Status</h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-black/55">
              Deactivate to archive this {entityLabel} without deleting records. Move to Recycle Bin
              hides the profile from the directory — you can restore it later.
            </p>
          </div>
          <EnrollmentStatusBadge active={active} className="shrink-0" />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
          {active ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setConfirmDeactivate(true)}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-[#2563EB] bg-[#EFF6FF] text-[#0F172A] hover:bg-[#DBEAFE]"
              onClick={() => onToggleActive(true)}
            >
              Reactivate
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-[#FECACA] text-[#EF4444] hover:bg-[#FEF2F2]"
            onClick={() => setConfirmDelete(true)}
          >
            Move to Recycle Bin
          </Button>
        </div>
      </section>

      <Dialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}>
        <DialogContent className="max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">
              Deactivate {entityLabel}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60">
              {name} ({recordId}) will be marked inactive and hidden from active directory filters.
              You can reactivate later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmDeactivate(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full bg-black text-white hover:bg-black/85"
              onClick={() => {
                onToggleActive(false);
                setConfirmDeactivate(false);
              }}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">
              Move to Recycle Bin
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60">
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
