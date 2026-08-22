import { useEffect, useState, type FormEvent } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiUpsertBranch } from "@/lib/api/settings";
import { getApiToken } from "@/lib/api/client";
import { planAllowsMultipleBranches } from "@/lib/permissions";
import { useAuth } from "@/lib/auth";
import {
  normalizeCampusBranch,
  useTenantStore,
  type CampusBranch,
} from "@/lib/tenant-store";

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
  const [form, setForm] = useState(emptyForm);

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
        copyFromId: "",
      });
      return;
    }
    setForm({ ...emptyForm(), copyFromId: activeBranchId });
  }, [open, editing, activeBranchId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
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
        isActive: true,
        ...(editing ? {} : { copyFromId: form.copyFromId || activeBranchId }),
      };
      if (getApiToken()) {
        const saved = await apiUpsertBranch(payload, !editing);
        const normalized = normalizeCampusBranch(saved) ?? {
          id: saved.id ?? editing?.id ?? `BR-${code}`,
          name,
          code,
          address: payload.address,
          phone: payload.phone,
          email: payload.email,
          lat: payload.lat ?? null,
          lng: payload.lng ?? null,
          isActive: true,
        };
        if (editing) {
          setBranches((prev) => prev.map((b) => (b.id === editing.id ? normalized : b)));
          toast.success(`Campus updated · ${name}`);
        } else {
          setBranches((prev) => [...prev.filter((b) => b.id !== normalized.id), normalized]);
          toast.success(`Campus added · ${name}`, {
            description: "Classes and fees copied from the source campus · students stay empty",
          });
          await openBranch(normalized.id);
        }
      } else if (editing) {
        setBranches((prev) =>
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
                }
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
          <div className="col-span-12 space-y-1.5 sm:col-span-6">
            <Label htmlFor="branch-code">Code</Label>
            <Input
              id="branch-code"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="MLP"
              required
            />
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
          {!editing && branches.length > 0 ? (
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
