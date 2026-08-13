import { useMemo, useState } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { apiDeleteTenantUser, apiUpsertTenantUser } from "@/lib/api/settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_PERMISSIONS,
  FINANCE_ONLY_PRESET,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  hasFullAccess,
  summarizePermissions,
  type PermissionKey,
  type PermissionSet,
} from "@/lib/permissions";
import {
  normalizeTenantUser,
  type Role,
  type Staff,
  type TenantUser,
} from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

function CardHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="text-title">{title}</div>
        <p className="mt-1 text-[11.5px] text-black/55 dark:text-zinc-400">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-[#0F766E] px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#0D9488]"
      >
        {actionLabel}
      </button>
    </div>
  );
}

const emptyForm = () => ({
  displayName: "",
  email: "",
  password: "",
  roleId: "",
  staffId: "",
  active: true,
  permissions: [] as PermissionKey[],
  allFunctions: false,
});

export function SettingsUsersCard({
  tenantUsers,
  setTenantUsers,
  roles,
  staff,
}: {
  tenantUsers: TenantUser[];
  setTenantUsers: React.Dispatch<React.SetStateAction<TenantUser[]>>;
  roles: Role[];
  staff: Staff[];
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TenantUser | null>(null);
  const [form, setForm] = useState(emptyForm);

  const liveStaff = useMemo(
    () => staff.filter((s) => !s.deletedAt).sort((a, b) => a.name.localeCompare(b.name)),
    [staff],
  );

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm(), roleId: roles[0]?.id ?? "" });
    setOpen(true);
  };

  const startEdit = (user: TenantUser) => {
    setEditingId(user.id);
    const all = hasFullAccess(user.permissions);
    setForm({
      displayName: user.displayName,
      email: user.email,
      password: user.password,
      roleId: user.roleId ?? "",
      staffId: user.staffId ?? "",
      active: user.active,
      permissions: all ? [] : ([...user.permissions] as PermissionKey[]),
      allFunctions: all,
    });
    setOpen(true);
  };

  const togglePerm = (key: PermissionKey, checked: boolean) => {
    setForm((prev) => {
      const next = new Set(prev.permissions);
      if (checked) next.add(key);
      else next.delete(key);
      return { ...prev, allFunctions: false, permissions: Array.from(next) };
    });
  };

  const applyPreset = (preset: "all" | "finance" | "clear") => {
    if (preset === "all") {
      setForm((prev) => ({ ...prev, allFunctions: true, permissions: [] }));
      return;
    }
    if (preset === "finance") {
      setForm((prev) => ({
        ...prev,
        allFunctions: false,
        permissions: [...FINANCE_ONLY_PRESET],
      }));
      return;
    }
    setForm((prev) => ({ ...prev, allFunctions: false, permissions: [] }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = form.displayName.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    if (!displayName) {
      toast.error("Display name is required");
      return;
    }
    if (!email || !email.includes("@")) {
      toast.error("Valid email is required");
      return;
    }
    if (!password || password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    const permissions: PermissionSet = form.allFunctions
      ? ALL_PERMISSIONS
      : form.permissions;
    if (!form.allFunctions && form.permissions.length === 0) {
      toast.error("Assign at least one permission or choose All functions");
      return;
    }
    const duplicate = tenantUsers.some(
      (u) => u.email === email && u.id !== editingId,
    );
    if (duplicate) {
      toast.error("Email already used by another user");
      return;
    }
    if (form.staffId) {
      const staffTaken = tenantUsers.some(
        (u) => u.staffId === form.staffId && u.id !== editingId,
      );
      if (staffTaken) {
        toast.error("That staff member already has a login");
        return;
      }
    }

    if (editingId) {
      const updated = normalizeTenantUser({
        id: editingId,
        displayName,
        email,
        password,
        roleId: form.roleId || undefined,
        staffId: form.staffId || undefined,
        permissions,
        active: form.active,
        createdAt:
          tenantUsers.find((u) => u.id === editingId)?.createdAt ??
          new Date().toISOString(),
      });
      setTenantUsers((prev) =>
        prev.map((u) => (u.id === editingId ? updated : u)),
      );
      void apiUpsertTenantUser(updated).catch((err) =>
        toast.error(err instanceof Error ? err.message : "Could not sync user"),
      );
      toast.success(`User updated · ${displayName}`);
    } else {
      const nextId = `USR-${Date.now().toString().slice(-6)}`;
      const created = normalizeTenantUser({
        id: nextId,
        displayName,
        email,
        password,
        roleId: form.roleId || undefined,
        staffId: form.staffId || undefined,
        permissions,
        active: form.active,
        createdAt: new Date().toISOString(),
      });
      setTenantUsers((prev) => [created, ...prev]);
      void apiUpsertTenantUser(created).catch((err) =>
        toast.error(err instanceof Error ? err.message : "Could not sync user"),
      );
      toast.success(`User created · ${displayName}`, {
        description: "They can sign in under School Admin with this email & password",
      });
    }
    setOpen(false);
  };

  const openImpersonate = (href: string, label: string) => {
    const tab = window.open(href, "_blank");
    if (tab) {
      try {
        tab.opener = null;
      } catch {
        // ignore
      }
      toast.success(label, {
        description: "New tab · your admin session stays here",
      });
      return;
    }
    toast.message(label, { description: "Pop-ups blocked · continuing in this tab" });
    window.location.assign(href);
  };

  const impersonateUser = (user: TenantUser) => {
    openImpersonate(
      `/impersonate?user=${encodeURIComponent(user.id)}`,
      `Opening workspace as ${user.displayName}`,
    );
  };

  const testDriveForm = () => {
    const permissions = form.allFunctions ? "*" : form.permissions.join(",");
    if (!permissions) {
      toast.error("Pick at least one permission to test");
      return;
    }
    const name = form.displayName.trim() || "Permission preview";
    openImpersonate(
      `/impersonate?perms=${encodeURIComponent(permissions)}&name=${encodeURIComponent(name)}`,
      `Opening permission preview · ${name}`,
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    const name = pendingDelete.displayName;
    setTenantUsers((prev) => prev.filter((u) => u.id !== id));
    void apiDeleteTenantUser(id).catch((err) =>
      toast.error(err instanceof Error ? err.message : "Could not delete user"),
    );
    toast.error(`${name} removed`);
    setPendingDelete(null);
  };

  return (
    <>
      <OrganicCard tone="white" cornerSide="bl" padded className="min-w-0">
        <CardHeader
          title="Users"
          subtitle={`${tenantUsers.length} workspace logins · assign modules & finance permissions`}
          actionLabel="Add User"
          onAction={startCreate}
        />

        <div className="mt-4 space-y-2">
          {tenantUsers.length === 0 && (
            <div className="rounded-lg border border-dashed border-black/15 bg-[#F4F4F5]/40 px-4 py-8 text-center text-[12px] text-black/55 dark:text-zinc-400">
              No workspace users yet · create one to grant limited access
            </div>
          )}
          {tenantUsers.map((user) => {
            const roleTitle = roles.find((r) => r.id === user.roleId)?.title;
            const linkedStaff = staff.find((s) => s.id === user.staffId);
            return (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[13px] font-semibold text-black">
                      {user.displayName}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        user.active
                          ? "bg-[#CCFBF1] text-[#0F766E]"
                          : "bg-black/8 text-black/45",
                      )}
                    >
                      {user.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[11.5px] text-black/55 dark:text-zinc-400">
                    {user.email}
                    {roleTitle ? ` · ${roleTitle}` : ""}
                    {linkedStaff ? ` · Staff: ${linkedStaff.name}` : ""}
                  </div>
                  <div className="mt-0.5 text-[11px] text-black/45">
                    {summarizePermissions(user.permissions)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {user.active && (
                    <button
                      type="button"
                      onClick={() => impersonateUser(user)}
                      aria-label={`Login as ${user.displayName}`}
                      title="Login as this user in a new tab (no credentials)"
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#99F6E4] bg-[#F0FDFA] px-2.5 text-[11px] font-semibold text-[#0F766E] transition-colors hover:border-[#5EEAD4] hover:bg-[#CCFBF1]"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Login as
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => startEdit(user)}
                    aria-label={`Edit ${user.displayName}`}
                    className="grid h-8 w-8 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 dark:text-zinc-400 transition-colors hover:border-black/20 hover:bg-[#F4F4F5] hover:text-black"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(user)}
                    aria-label={`Delete ${user.displayName}`}
                    className="grid h-8 w-8 place-items-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </OrganicCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>
              Workspace login with module and finance permissions. Sign in via School Admin tier.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Display name</Label>
                <Input
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="e.g. Fee Clerk"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@school.edu"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 4 characters"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Position / Role</Label>
                <Select
                  value={form.roleId || "__none__"}
                  onValueChange={(v) =>
                    setForm({ ...form, roleId: v === "__none__" ? "" : v })
                  }
                >
                  <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E5E5] bg-white">
                    <SelectValue placeholder="Optional role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No role</SelectItem>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Link staff (optional)</Label>
                <Select
                  value={form.staffId || "__none__"}
                  onValueChange={(v) =>
                    setForm({ ...form, staffId: v === "__none__" ? "" : v })
                  }
                >
                  <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E5E5] bg-white">
                    <SelectValue placeholder="Optional staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No staff link</SelectItem>
                    {liveStaff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} · {s.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                Presets
              </span>
              <button
                type="button"
                onClick={() => applyPreset("all")}
                className="rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 text-[11px] font-semibold hover:bg-[#F4F4F5]"
              >
                All functions
              </button>
              <button
                type="button"
                onClick={() => applyPreset("finance")}
                className="rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 text-[11px] font-semibold hover:bg-[#F4F4F5]"
              >
                Finance only
              </button>
              <button
                type="button"
                onClick={() => applyPreset("clear")}
                className="rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 text-[11px] font-semibold hover:bg-[#F4F4F5]"
              >
                Clear
              </button>
            </div>

            <div className="space-y-3 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-3">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.id}>
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {group.keys.map((key) => {
                      const checked =
                        form.allFunctions || form.permissions.includes(key);
                      return (
                        <label
                          key={key}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-[12.5px] text-black hover:bg-white dark:text-zinc-100 dark:hover:bg-white/5"
                        >
                          <Checkbox
                            checked={checked}
                            disabled={form.allFunctions}
                            onCheckedChange={(v) => togglePerm(key, v === true)}
                          />
                          {PERMISSION_LABELS[key]}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-[13px]">
              <Checkbox
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v === true })}
              />
              Active (can sign in)
            </label>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={testDriveForm}
                title="Preview these permissions in a new tab without saving a user"
                className="gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Test without saving
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]">
                  {editingId ? "Save changes" : "Create user"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">
              Delete User
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60 dark:text-zinc-400">
              {pendingDelete
                ? `Remove login for ${pendingDelete.displayName} (${pendingDelete.email})?`
                : "Remove this user?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              className="rounded-full bg-[#EF4444] text-white hover:bg-[#DC2626]"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
