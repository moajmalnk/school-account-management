import { useState, type Dispatch, type SetStateAction } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AddBranchDialog } from "@/components/school/AddBranchDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrganicCard } from "@/components/ui/organic-card";
import { apiDeleteBranch } from "@/lib/api/settings";
import { getApiToken } from "@/lib/api/client";
import {
  isMainCampusBranch,
  type CampusBranch,
} from "@/lib/tenant-store";
import { cn, glassCardClass } from "@/lib/utils";
import { SettingsResponsiveCardHeader } from "@/components/school/SettingsMobileNav";

const workspacePanelClass = cn(glassCardClass, "rounded-2xl");

function CardHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const action =
    actionLabel && onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-[#0F766E] px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#0D9488]"
      >
        {actionLabel}
      </button>
    ) : undefined;

  return (
    <SettingsResponsiveCardHeader
      title={title}
      subtitle={subtitle}
      action={action}
      titleClassName="text-title font-bold"
      subtitleClassName="text-[11.5px]"
    />
  );
}

export function SettingsBranchesCard({
  branches,
  setBranches,
  activeBranchId,
  openBranch,
  canAddBranch = true,
}: {
  branches: CampusBranch[];
  setBranches: Dispatch<SetStateAction<CampusBranch[]>>;
  activeBranchId: string;
  openBranch: (id: string) => Promise<{ students: number; receipts: number }>;
  canAddBranch?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CampusBranch | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CampusBranch | null>(null);

  const startCreate = () => {
    if (!canAddBranch) {
      toast.error("Multiple campuses are not included in this plan");
      return;
    }
    setEditing(null);
    setOpen(true);
  };

  const startEdit = (b: CampusBranch) => {
    setEditing(b);
    setOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if (isMainCampusBranch(pendingDelete, branches)) {
      toast.error("The main campus cannot be deleted");
      setPendingDelete(null);
      return;
    }
    if (branches.length < 2) {
      toast.error("Keep at least one campus");
      setPendingDelete(null);
      return;
    }
    try {
      if (getApiToken()) {
        await apiDeleteBranch(pendingDelete.id);
      }
      const remaining = branches.filter((b) => b.id !== pendingDelete.id);
      setBranches(remaining);
      if (pendingDelete.id === activeBranchId && remaining[0]) {
        await openBranch(remaining[0].id);
      }
      toast.success(`${pendingDelete.name} removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete campus");
    }
    setPendingDelete(null);
  };

  return (
    <OrganicCard tone="white" cornerSide="tr" padded className={workspacePanelClass}>
      <CardHeader
        title="Branches"
        subtitle={
          !canAddBranch
            ? "This plan includes one campus · upgrade to Premium or Enterprise to add more"
            : branches.length === 1
              ? "One campus · add Kozhikode, Malappuram, or another site to split books"
              : `${branches.length} campuses · switch from the header like academic years`
        }
        actionLabel={canAddBranch ? "Add Branch" : undefined}
        onAction={canAddBranch ? startCreate : undefined}
      />

      <div className="mt-4 space-y-2">
        {branches.length === 0 && (
          <div className="rounded-lg border border-dashed border-[#E5E5E5] px-4 py-8 text-center text-[13px] text-black/45 dark:border-white/10 dark:text-zinc-500">
            No campuses yet.
          </div>
        )}
        {branches.map((b) => (
          <div
            key={b.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5 dark:border-white/10 dark:bg-zinc-900/70"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#0F766E] text-[10.5px] font-semibold text-white">
                {b.code.slice(0, 3)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-black dark:text-zinc-100">
                  {b.name}
                  {b.id === activeBranchId ? (
                    <span className="ml-2 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Open
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-[11.5px] text-black/55 dark:text-zinc-400">
                  {b.address || b.phone || b.code}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => startEdit(b)}
                aria-label={`Edit ${b.name}`}
                className="grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 transition-colors hover:border-black/20 hover:bg-[#F4F4F5] hover:text-black dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {isMainCampusBranch(b, branches) ? null : (
                <button
                  type="button"
                  onClick={() => setPendingDelete(b)}
                  aria-label={`Delete ${b.name}`}
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2] dark:border-rose-500/40 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-950/80"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(next) => !next && setPendingDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete campus</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-black/65 dark:text-zinc-400">
            {pendingDelete
              ? `Remove ${pendingDelete.name}? Classes and fee catalogs on this campus will be deleted. Students, staff, and receipts must already be empty.`
              : ""}
          </p>
          <DialogFooter className="mt-4 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void confirmDelete()}
              className="rounded-full bg-[#EF4444] text-white hover:bg-[#DC2626]"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddBranchDialog open={open} onOpenChange={setOpen} editing={editing} />
    </OrganicCard>
  );
}
