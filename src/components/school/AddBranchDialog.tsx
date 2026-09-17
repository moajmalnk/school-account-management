import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { LocationPicker } from "@/components/school/LocationPicker";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invalidateRemoteTenantBundleCache } from "@/lib/api/tenant-sync";
import { apiUpsertBranch } from "@/lib/api/settings";
import { getApiToken } from "@/lib/api/client";
import { planAllowsMultipleBranches } from "@/lib/permissions";
import { useAuth } from "@/lib/auth";
import {
  nextCampusSortOrder,
  normalizeCampusBranch,
  sortCampusBranches,
  useTenantStore,
  type CampusBranch,
} from "@/lib/tenant-store";

const emptyForm = (sortOrder = 1) => ({
  name: "",
  code: "",
  address: "",
  phone: "",
  email: "",
  lat: null as number | null,
  lng: null as number | null,
  sortOrder: String(sortOrder),
  copyFromId: "",
});

function parseSortOrder(raw: string, fallback: number): number {
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(999, n);
}

export function AddBranchDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: CampusBranch | null;
}) {
  const { session } = useAuth();
  const { branches, setBranches, activeBranchId, openBranch } = useTenantStore();
  const canAddBranch = planAllowsMultipleBranches(session?.planFlags);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => emptyForm());
  const orderedBranches = useMemo(() => sortCampusBranches(branches), [branches]);
  const suggestedOrder = useMemo(() => nextCampusSortOrder(branches), [branches]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        code: editing.code,
        address: editing.address,
        phone: editing.phone,
        email: editing.email,
        lat: editing.lat,
        lng: editing.lng,
        sortOrder: String(editing.sortOrder > 0 ? editing.sortOrder : suggestedOrder),
        copyFromId: "",
      });
      return;
    }
    setForm({ ...emptyForm(suggestedOrder), copyFromId: activeBranchId });
  }, [open, editing, activeBranchId, suggestedOrder]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    const sortOrder = parseSortOrder(
      form.sortOrder,
      editing?.sortOrder && editing.sortOrder > 0 ? editing.sortOrder : suggestedOrder,
    );
    if (!name || !code) {
      toast.error("Campus name and code are required");
      return;
    }
    if (!editing && !canAddBranch) {
      toast.error("Multiple campuses are not included in this plan", {
        description: "Upgrade to Premium or Enterprise to add another branch",
      });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...(editing ? { id: editing.id } : {}),
        name,
        code,
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        lat: form.lat,
        lng: form.lng,
        sortOrder,
        isActive: true,
        ...(editing ? {} : { copyFromId: form.copyFromId || activeBranchId }),
      };
      if (getApiToken()) {
        const saved = await apiUpsertBranch(payload, !editing);
        const fromApi = normalizeCampusBranch(saved);
        const normalized: CampusBranch = {
          id: fromApi?.id ?? saved.id ?? editing?.id ?? `BR-${code}`,
          name: fromApi?.name ?? name,
          code: fromApi?.code ?? code,
          address: fromApi?.address ?? payload.address,
          phone: fromApi?.phone ?? payload.phone,
          email: fromApi?.email ?? payload.email,
          lat: fromApi?.lat ?? payload.lat ?? null,
          lng: fromApi?.lng ?? payload.lng ?? null,
          isActive: fromApi?.isActive ?? true,
          isMain: fromApi?.isMain,
          // Prefer the value we just saved so order works even if the API omits it.
          sortOrder:
            typeof saved.sortOrder === "number" && Number.isFinite(saved.sortOrder) && saved.sortOrder > 0
              ? Math.round(saved.sortOrder)
              : sortOrder,
        };
        invalidateRemoteTenantBundleCache();
        if (editing) {
          setBranches((prev) =>
            sortCampusBranches(prev.map((b) => (b.id === editing.id ? normalized : b))),
          );
          toast.success(`Campus updated · ${name}`);
        } else {
          setBranches((prev) =>
            sortCampusBranches([...prev.filter((b) => b.id !== normalized.id), normalized]),
          );
          toast.success(`Campus added · ${name}`, {
            description: "Classes and fees copied from the source campus · students stay empty",
          });
          await openBranch(normalized.id);
        }
      } else if (editing) {
        setBranches((prev) =>
          sortCampusBranches(
            prev.map((b) =>
              b.id === editing.id
                ? {
                    ...b,
                    name,
                    code,
                    address: form.address,
                    phone: form.phone,
                    email: form.email,
                    lat: form.lat,
                    lng: form.lng,
                    sortOrder,
                  }
                : b,
            ),
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
          sortOrder,
        };
        setBranches((prev) => sortCampusBranches([...prev, created]));
        toast.success(`Campus added · ${name}`);
        await openBranch(created.id);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save campus");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="mobile-scrollbar-none max-h-[90vh] overflow-y-auto sm:max-w-lg"
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement | null;
          if (target?.closest("[data-radix-popper-content-wrapper]")) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement | null;
          if (target?.closest("[data-radix-popper-content-wrapper]")) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Branch" : "Add Branch"}</DialogTitle>
          <DialogDescription className="text-[13px] text-black/55">
            {editing
              ? "Update this campus name, contact details, map location, and dropdown order."
              : "Add a new campus. Classes and fee catalogs can be copied from an existing branch."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)} className="grid grid-cols-12 gap-3">
          <div className="col-span-12 space-y-1.5 sm:col-span-6">
            <Label htmlFor="branch-name">Location name</Label>
            <Input
              id="branch-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Malappuram"
              required
            />
          </div>
          <div className="col-span-12 space-y-1.5 sm:col-span-3">
            <Label htmlFor="branch-code">Code</Label>
            <Input
              id="branch-code"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="MLP"
              required
            />
          </div>
          <div className="col-span-12 space-y-1.5 sm:col-span-3">
            <Label htmlFor="branch-order">Order</Label>
            <Input
              id="branch-order"
              type="number"
              inputMode="numeric"
              min={1}
              max={999}
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              placeholder={String(suggestedOrder)}
              required
            />
          </div>
          <div className="col-span-12 -mt-1 sm:col-span-12">
            <p className="text-[11px] text-black/50 dark:text-zinc-500">
              Dropdown order · lower numbers appear first in the campus switcher
              {!editing ? ` · suggested ${suggestedOrder}` : ""}.
            </p>
          </div>
          <div className="col-span-12 space-y-1.5 sm:col-span-6">
            <Label htmlFor="branch-phone">Phone</Label>
            <Input
              id="branch-phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+91 …"
            />
          </div>
          <div className="col-span-12 space-y-1.5 sm:col-span-6">
            <Label htmlFor="branch-email">Email</Label>
            <Input
              id="branch-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="office@…"
            />
          </div>
          <div className="col-span-12">
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
          </div>
          {!editing && orderedBranches.length > 0 ? (
            <div className="col-span-12 space-y-1.5">
              <Label>Copy setup from</Label>
              <Select
                value={form.copyFromId || activeBranchId}
                onValueChange={(v) => setForm((f) => ({ ...f, copyFromId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select campus" />
                </SelectTrigger>
                <SelectContent>
                  {orderedBranches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} · {b.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-black/50 dark:text-zinc-500">
                Copies school branding, classes, departments, positions, and fee catalogs. Students,
                staff, and receipts start empty.
              </p>
            </div>
          ) : null}
          <DialogFooter className="col-span-12 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Add branch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
