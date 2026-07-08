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
        active ? "bg-[#E1F2AE] text-black" : "bg-black/8 text-black/55",
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-[#65A30D]" : "bg-black/35")}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function isRecordActive(active: boolean | undefined) {
  return active !== false;
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
      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col items-center gap-3 text-center lg:flex-row lg:items-start lg:justify-between lg:gap-4 lg:text-left">
          <div className="max-w-xl">
            <h2 className="text-base font-semibold text-black">Account Status</h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-black/55">
              Deactivate to archive this {entityLabel} without deleting records. Delete permanently
              removes the profile from the directory.
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
              className="rounded-full border-[#C7F33C] bg-[#F7FDE8] text-black hover:bg-[#E1F2AE]"
              onClick={() => onToggleActive(true)}
            >
              Reactivate
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-[#FECACA] text-[#B91C1C] hover:bg-[#FEF2F2]"
            onClick={() => setConfirmDelete(true)}
          >
            Delete permanently
          </Button>
        </div>
      </section>

      <Dialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}>
        <DialogContent className="max-w-sm rounded-[1.5rem] border border-[#E5E5E5] bg-white p-6">
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
        <DialogContent className="max-w-sm rounded-[1.5rem] border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">
              Delete {entityLabel}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60">
              Are you sure you want to permanently delete {name} ({recordId})? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full bg-[#B91C1C] text-white hover:bg-[#991B1B]"
              onClick={() => {
                onDelete();
                setConfirmDelete(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
