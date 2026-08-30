import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  draftFromFeeSchedule,
  emptyFeeScheduleDraft,
  feeScheduleFromDraft,
  FeeScheduleEditor,
  type FeeScheduleDraft,
} from "@/components/school/FeeScheduleEditor";
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
import { Label } from "@/components/ui/label";
import { OrganicCard } from "@/components/ui/organic-card";
import { Switch } from "@/components/ui/switch";
import { apiDeletePaymentCategory, apiUpsertPaymentCategory } from "@/lib/api/settings";
import { nextPrefixedId } from "@/lib/student-csv";
import {
  defaultFeeCollectionStartMonth,
  installmentLabel,
  sumFeeSchedule,
  type FeeTerm,
  type PaymentCategory,
} from "@/lib/tenant-store";

function slugFromLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function categorySummary(cat: PaymentCategory): string {
  if (cat.isSystem) {
    if (cat.slug === "tuition" || /tuition|tution/i.test(cat.label)) {
      return "Managed in Class Tier";
    }
    if (cat.slug === "vehicle" || /vehicle|transport|bus/i.test(cat.label)) {
      return "Managed in Transport";
    }
    return "System category";
  }
  if (!cat.hasSchedule || !cat.feeSchedule?.length) {
    return "Label only · no fee structure yet";
  }
  const total = sumFeeSchedule(cat.feeSchedule);
  const n = cat.feeSchedule.length;
  const cycle = cat.billingCycle ?? "Monthly";
  return `${cycle} · ${n} × avg ₹ ${Math.round(total / Math.max(1, n)).toLocaleString("en-IN")} · total ₹ ${total.toLocaleString("en-IN")}`;
}

type FeeCategoriesCardProps = {
  paymentCategories: PaymentCategory[];
  setPaymentCategories: React.Dispatch<React.SetStateAction<PaymentCategory[]>>;
  feeTerms: FeeTerm[];
};

export function FeeCategoriesCard({
  paymentCategories,
  setPaymentCategories,
  feeTerms,
}: FeeCategoriesCardProps) {
  const startMonthFallback = defaultFeeCollectionStartMonth(feeTerms);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PaymentCategory | null>(null);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [schedule, setSchedule] = useState<FeeScheduleDraft>(() =>
    emptyFeeScheduleDraft(startMonthFallback),
  );

  const systemRows = useMemo(
    () => paymentCategories.filter((c) => c.isSystem),
    [paymentCategories],
  );
  const customRows = useMemo(
    () =>
      paymentCategories.filter((c) => !c.isSystem).sort((a, b) => a.label.localeCompare(b.label)),
    [paymentCategories],
  );

  const startCreate = () => {
    setEditingId(null);
    setName("");
    setActive(true);
    setSchedule(emptyFeeScheduleDraft(startMonthFallback));
    setOpen(true);
  };

  const startEdit = (cat: PaymentCategory) => {
    if (cat.isSystem) {
      toast.message(`${cat.label} is managed elsewhere`, {
        description: categorySummary(cat),
      });
      return;
    }
    setEditingId(cat.id);
    setName(cat.label);
    setActive(cat.active !== false);
    setSchedule(
      draftFromFeeSchedule({
        billingCycle: cat.billingCycle,
        feeAmountMode: cat.feeAmountMode,
        feeSchedule: cat.feeSchedule,
        feeCollectionStartMonth: cat.feeCollectionStartMonth,
        startMonthFallback,
      }),
    );
    setOpen(true);
  };

  const persist = (cat: PaymentCategory) => {
    void apiUpsertPaymentCategory(cat)
      .then((saved) => {
        setPaymentCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...cat, ...saved } : c)),
        );
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Could not sync fee category"),
      );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const label = name.trim();
    if (!label) {
      toast.error("Fee category name is required");
      return;
    }
    if (
      paymentCategories.some(
        (c) => c.id !== editingId && c.label.trim().toLowerCase() === label.toLowerCase(),
      )
    ) {
      toast.error("A fee category with this name already exists");
      return;
    }
    if (!schedule.billingModeChosen) {
      toast.error("Choose monthly or term fee billing");
      return;
    }
    const feeSchedule = feeScheduleFromDraft(schedule);
    if (!feeSchedule.length || feeSchedule.every((l) => l.amount <= 0)) {
      toast.error("Add at least one installment with an amount");
      return;
    }
    const slug = slugFromLabel(label.replace(/\s*fee\s*$/i, "") || label);

    if (editingId) {
      const updated: PaymentCategory = {
        id: editingId,
        label,
        slug,
        isSystem: false,
        hasSchedule: true,
        billingCycle: schedule.billingCycle,
        feeAmountMode: schedule.feeAmountMode,
        feeSchedule,
        feeCollectionStartMonth:
          schedule.billingCycle === "Monthly" ? schedule.feeCollectionStartMonth : undefined,
        active,
      };
      setPaymentCategories((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
      persist(updated);
      toast.success(`Fee category updated · ${label}`);
    } else {
      const id = nextPrefixedId(
        "CAT",
        paymentCategories.map((c) => c.id),
        3,
      );
      const created: PaymentCategory = {
        id,
        label,
        slug,
        isSystem: false,
        hasSchedule: true,
        billingCycle: schedule.billingCycle,
        feeAmountMode: schedule.feeAmountMode,
        feeSchedule,
        feeCollectionStartMonth:
          schedule.billingCycle === "Monthly" ? schedule.feeCollectionStartMonth : undefined,
        active,
      };
      setPaymentCategories((prev) => [...prev, created]);
      persist(created);
      toast.success(`Fee category added · ${label}`);
    }
    setOpen(false);
  };

  const remove = (cat: PaymentCategory) => {
    if (cat.isSystem) {
      toast.error("System fee categories cannot be deleted");
      return;
    }
    setPaymentCategories((prev) => prev.filter((c) => c.id !== cat.id));
    void apiDeletePaymentCategory(cat.id).catch((err) =>
      toast.error(err instanceof Error ? err.message : "Could not delete fee category"),
    );
    toast.error(`${cat.label} removed`);
  };

  const addHostelStarter = () => {
    if (paymentCategories.some((c) => /hostel/i.test(c.label) || c.slug === "hostel")) {
      toast.message("Hostel Fee already exists");
      return;
    }
    const draft = draftFromFeeSchedule({
      billingCycle: "Monthly",
      feeAmountMode: "fixed",
      feeSchedule: Array.from({ length: 10 }, (_, index) => ({
        id: `fl-i-${index + 1}`,
        kind: "installment" as const,
        label: installmentLabel(index, "Monthly"),
        amount: 1000,
      })),
      feeCollectionStartMonth: startMonthFallback,
      startMonthFallback,
    });
    const feeSchedule = feeScheduleFromDraft(draft);
    const id = nextPrefixedId(
      "CAT",
      paymentCategories.map((c) => c.id),
      3,
    );
    const created: PaymentCategory = {
      id,
      label: "Hostel Fee",
      slug: "hostel",
      isSystem: false,
      hasSchedule: true,
      billingCycle: draft.billingCycle,
      feeAmountMode: draft.feeAmountMode,
      feeSchedule,
      feeCollectionStartMonth: draft.feeCollectionStartMonth,
      active: true,
    };
    setPaymentCategories((prev) => [...prev, created]);
    persist(created);
    toast.success("Hostel Fee added · edit amounts and due dates anytime");
  };

  return (
    <OrganicCard tone="white" cornerSide="tr" padded className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-black dark:text-zinc-100">Fee Category</h2>
          <p className="mt-1 text-[12.5px] text-black/50 dark:text-zinc-400">
            Create campus fees like Hostel with the same monthly or term structure as Class Tier.
            Tuition and Vehicle stay on Class Tier / Transport.
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0 rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
          onClick={startCreate}
        >
          Add Fee Category
        </Button>
      </div>

      <div className="mt-5 space-y-2">
        {customRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E5E5E5] bg-[#FAFAFA] px-4 py-5 dark:border-white/15 dark:bg-zinc-900/50">
            <p className="text-[13px] font-medium text-black/70 dark:text-zinc-300">
              No custom fee categories yet
            </p>
            <p className="mt-1 text-[12px] text-black/45 dark:text-zinc-500">
              Add Hostel, Lab, or any recurring fee with installments and due dates.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 rounded-full"
              onClick={addHostelStarter}
            >
              Add Hostel Fee starter
            </Button>
          </div>
        ) : null}

        {customRows.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5 dark:border-white/10 dark:bg-zinc-900/70"
          >
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-black dark:text-zinc-100">
                {cat.label}
                {cat.active === false ? (
                  <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-black/40">
                    Inactive
                  </span>
                ) : null}
              </div>
              <div className="truncate text-[11.5px] text-black/50 dark:text-zinc-400">
                {categorySummary(cat)}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => startEdit(cat)}
                aria-label={`Edit ${cat.label}`}
                className="grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 transition-colors hover:border-black/20 hover:bg-[#F4F4F5] hover:text-black dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-400"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPendingDelete(cat)}
                aria-label={`Delete ${cat.label}`}
                className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2] dark:border-rose-500/40 dark:bg-rose-950/50 dark:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {systemRows.length > 0 ? (
        <div className="mt-6 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-500">
            System categories
          </p>
          {systemRows.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#EFEFEF] bg-white px-3.5 py-2.5 dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-black dark:text-zinc-100">
                  {cat.label}
                </div>
                <div className="truncate text-[11.5px] text-black/45 dark:text-zinc-500">
                  {categorySummary(cat)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Fee Category</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `Delete ${pendingDelete.label}? This cannot be undone.`
                : "Delete this fee category?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full bg-[#EF4444] text-white hover:bg-[#DC2626]"
              onClick={() => {
                if (pendingDelete) remove(pendingDelete);
                setPendingDelete(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[min(90vh,760px)] w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 space-y-1.5 border-b border-[#EFEFEF] px-4 py-3 pr-12 sm:px-6 sm:py-4 dark:border-white/10">
            <DialogTitle>{editingId ? "Edit Fee Category" : "Add Fee Category"}</DialogTitle>
            <DialogDescription>
              Name the fee and set installments. Student assignment and dues come in a later update.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6 sm:py-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
                  Category name
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hostel Fee"
                  autoFocus
                />
              </div>
              <FeeScheduleEditor value={schedule} onChange={setSchedule} />
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3 py-2.5 dark:border-white/10 dark:bg-zinc-900/70">
                <div>
                  <div className="text-[13px] font-semibold text-black dark:text-zinc-100">
                    Active
                  </div>
                  <div className="text-[11.5px] text-black/55 dark:text-zinc-400">
                    Inactive categories stay in history but are hidden from new receipts
                  </div>
                </div>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>
            </div>
            <DialogFooter className="shrink-0 border-t border-[#EFEFEF] px-4 py-3 sm:px-6 dark:border-white/10">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
              >
                {editingId ? "Save" : "Add Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrganicCard>
  );
}
