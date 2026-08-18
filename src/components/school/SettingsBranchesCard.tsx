import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { LocationPicker } from "@/components/school/LocationPicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrganicCard } from "@/components/ui/organic-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiDeleteBranch, apiUpsertBranch } from "@/lib/api/settings";
import { getApiToken } from "@/lib/api/client";
import {
  normalizeCampusBranch,
  type CampusBranch,
} from "@/lib/tenant-store";
import { cn, glassCardClass } from "@/lib/utils";

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
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="text-title">{title}</div>
        <p className="mt-1 text-[11.5px] text-black/55 dark:text-zinc-400">{subtitle}</p>
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-[#0F766E] px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#0D9488]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

const emptyForm = () => ({
  name: "",
  code: "",
  address: "",
  phone: "",
  email: "",
  lat: null as number | null,
  lng: null as number | null,
  copyFromId: "",
});

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CampusBranch | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const startCreate = () => {
    if (!canAddBranch) {
      toast.error("Multiple campuses are not included in this plan");
      return;
    }
    setEditingId(null);
    setForm({ ...emptyForm(), copyFromId: activeBranchId });
    setOpen(true);
  };

  const startEdit = (b: CampusBranch) => {
    setEditingId(b.id);
    setForm({
      name: b.name,
      code: b.code,
      address: b.address,
      phone: b.phone,
      email: b.email,
      lat: b.lat,
      lng: b.lng,
      copyFromId: "",
    });
    setOpen(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    if (!name || !code) {
      toast.error("Campus name and code are required");
      return;
    }
    if (!editingId && !canAddBranch) {
      toast.error("Multiple campuses are not included in this plan");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        name,
        code,
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        lat: form.lat,
        lng: form.lng,
        isActive: true,
        ...(editingId ? {} : { copyFromId: form.copyFromId || activeBranchId }),
      };
      if (getApiToken()) {
        const saved = await apiUpsertBranch(payload, !editingId);
        const normalized = normalizeCampusBranch(saved) ?? {
          id: saved.id ?? editingId ?? `BR-${code}`,
          name,
          code,
          address: payload.address,
          phone: payload.phone,
          email: payload.email,
          lat: payload.lat ?? null,
          lng: payload.lng ?? null,
          isActive: true,
        };
        if (editingId) {
          setBranches((prev) => prev.map((b) => (b.id === editingId ? normalized : b)));
          toast.success(`Campus updated · ${name}`);
        } else {
          setBranches((prev) => [...prev.filter((b) => b.id !== normalized.id), normalized]);
          toast.success(`Campus added · ${name}`, {
            description: "Classes and fees copied from the source campus · students stay empty",
          });
        }
      } else if (editingId) {
        setBranches((prev) =>
          prev.map((b) =>
            b.id === editingId
              ? { ...b, name, code, address: form.address, phone: form.phone, email: form.email, lat: form.lat, lng: form.lng }
              : b,
          ),
        );
        toast.success(`Campus updated · ${name}`);
      } else {
        const created: CampusBranch = {
          id: `BR-${code}`,
          name,
          code,
          address: form.address.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          lat: form.lat,
          lng: form.lng,
          isActive: true,
        };
        setBranches((prev) => [...prev, created]);
        toast.success(`Campus added · ${name}`);
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save campus");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
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
              <button
                type="button"
                onClick={() => setPendingDelete(b)}
                aria-label={`Delete ${b.name}`}
                className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2] dark:border-rose-500/40 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-950/80"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Branch" : "Add Branch"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="branch-name">Location name</Label>
                <Input
                  id="branch-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Malappuram"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="branch-code">Code</Label>
                <Input
                  id="branch-code"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="MLP"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="branch-phone">Phone</Label>
              <Input
                id="branch-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 …"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="branch-email">Email</Label>
              <Input
                id="branch-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="office@…"
              />
            </div>
            <LocationPicker
              label="Campus address"
              value={form.address}
              lat={form.lat}
              lng={form.lng}
              placeholder="Street, city, pin"
              onChange={(next) =>
                setForm((f) => ({
                  ...f,
                  address: next.label,
                  lat: next.lat,
                  lng: next.lng,
                }))
              }
            />
            {!editingId && branches.length > 0 && (
              <div className="space-y-1.5">
                <Label>Copy setup from</Label>
                <Select
                  value={form.copyFromId || activeBranchId}
                  onValueChange={(v) => setForm((f) => ({ ...f, copyFromId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} · {b.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-black/50 dark:text-zinc-500">
                  Copies classes, departments, positions, and fee catalogs. Students, staff, and
                  receipts start empty.
                </p>
              </div>
            )}
            <DialogFooter className="flex-row justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrganicCard>
  );
}
