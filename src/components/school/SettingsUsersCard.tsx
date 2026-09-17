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
  sortCampusBranches,
  type CampusBranch,
  type Role,
  type Staff,
  type TenantUser,
} from "@/lib/tenant-store";
import { cn } from "@/lib/utils";
import { SettingsResponsiveCardHeader } from "@/components/school/SettingsMobileNav";

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

const emptyForm = (defaultBranchIds: string[] = []) => ({
  displayName: "",
  email: "",
  password: "",
  roleId: "",
  staffId: "",
  active: true,
  permissions: [] as PermissionKey[],
  allFunctions: false,
  branchIds: defaultBranchIds,
});

function branchSummary(
  branchIds: string[],
  branches: CampusBranch[],
): string {
  if (branchIds.length === 0) return "All campuses";
  if (branchIds.length === 1) {
    const b = branches.find((x) => x.id === branchIds[0]);
    return b ? b.name : "1 campus";
  }
  return `${branchIds.length} campuses`;
}

export function SettingsUsersCard({
  tenantUsers,
  setTenantUsers,
  roles,
  staff,
  branches = [],
  canAddUser = true,
  currentUser,
}: {
  tenantUsers: TenantUser[];
  setTenantUsers: React.Dispatch<React.SetStateAction<TenantUser[]>>;
  roles: Role[];
  staff: Staff[];
  branches?: CampusBranch[];
  canAddUser?: boolean;
  /** Signed-in workspace user — excluded from this management list */
  currentUser?: { userId?: string; email?: string };
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TenantUser | null>(null);
  const [form, setForm] = useState(() => emptyForm());

  const orderedBranches = useMemo(
    () => sortCampusBranches(branches.filter((b) => b.isActive !== false)),
    [branches],
  );

  const isSignedInUser = (user: TenantUser) => {
    if (!currentUser) return false;
    if (currentUser.userId && user.id === currentUser.userId) return true;
    if (
      currentUser.email &&
      user.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase()
    ) {
      return true;
    }
    return false;
  };

  const teamUsers = useMemo(() => {
    if (!currentUser?.userId && !currentUser?.email) return tenantUsers;
    return tenantUsers.filter((u) => {
      if (currentUser.userId && u.id === currentUser.userId) return false;
      if (
        currentUser.email &&
        u.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  }, [tenantUsers, currentUser?.userId, currentUser?.email]);

  const liveStaff = useMemo(
    () => staff.filter((s) => !s.deletedAt).sort((a, b) => a.name.localeCompare(b.name)),
    [staff],
  );

  const startCreate = () => {
    if (!canAddUser) {
      toast.error("Extra workspace users are not included in this plan");
      return;
    }
    setEditingId(null);
    const defaults =
      orderedBranches.length === 1
        ? [orderedBranches[0]!.id]
        : orderedBranches.map((b) => b.id);
    setForm({ ...emptyForm(defaults), roleId: roles[0]?.id ?? "" });
    setOpen(true);
  };

  const startEdit = (user: TenantUser) => {
    setEditingId(user.id);
    const all = hasFullAccess(user.permissions);
    const assigned =
      user.branchIds.length > 0
        ? user.branchIds
        : orderedBranches.map((b) => b.id);
    setForm({
      displayName: user.displayName,
      email: user.email,
      password: user.password,
      roleId: user.roleId ?? "",
      staffId: user.staffId ?? "",
      active: user.active,
      permissions: all ? [] : ([...user.permissions] as PermissionKey[]),
      allFunctions: all,
      branchIds: assigned,
    });
    setOpen(true);
  };

  const toggleBranch = (branchId: string, checked: boolean) => {
    setForm((prev) => {
      const next = new Set(prev.branchIds);
      if (checked) next.add(branchId);
      else next.delete(branchId);
      return { ...prev, branchIds: Array.from(next) };
    });
  };

  const selectAllBranches = () => {
    setForm((prev) => ({ ...prev, branchIds: orderedBranches.map((b) => b.id) }));
  };

  const clearBranches = () => {
    setForm((prev) => ({ ...prev, branchIds: [] }));
  };

  const togglePerm = (key: PermissionKey, checked: boolean) => {
    setForm((prev) => {
      const next = new Set(prev.permissions);
      if (checked) next.add(key);
      else next.delete(key);
      return { ...prev, allFunctions: false, permissions: Array.from(next) };
    });
  };

  const toggleGroup = (keys: PermissionKey[], checked: boolean) => {
    setForm((prev) => {
      const next = new Set(prev.permissions);
      for (const key of keys) {
        if (checked) next.add(key);
        else next.delete(key);
      }
      return { ...prev, allFunctions: false, permissions: Array.from(next) };
    });
  };

  const groupState = (keys: PermissionKey[]) => {
    if (form.allFunctions) return { checked: true as const, indeterminate: false };
    const selected = keys.filter((k) => form.permissions.includes(k)).length;
    if (selected === 0) return { checked: false as const, indeterminate: false };
    if (selected === keys.length) return { checked: true as const, indeterminate: false };
    return { checked: false as const, indeterminate: true };
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

  const activePreset = form.allFunctions
    ? "all"
    : form.permissions.length === FINANCE_ONLY_PRESET.length &&
        FINANCE_ONLY_PRESET.every((k) => form.permissions.includes(k)) &&
        form.permissions.every((k) => FINANCE_ONLY_PRESET.includes(k))
      ? "finance"
      : form.permissions.length === 0
        ? "clear"
        : null;

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
    const permissions: PermissionSet = form.allFunctions ? ALL_PERMISSIONS : form.permissions;
    if (!form.allFunctions && form.permissions.length === 0) {
      toast.error("Assign at least one permission or choose All functions");
      return;
    }
    if (orderedBranches.length > 0 && form.branchIds.length === 0) {
      toast.error("Select at least one campus");
      return;
    }
    const duplicate = tenantUsers.some((u) => u.email === email && u.id !== editingId);
    if (duplicate) {
      toast.error("Email already used by another user");
      return;
    }
    if (!editingId && !canAddUser) {
      toast.error("Extra workspace users are not included in this plan");
      return;
    }
    if (form.staffId) {
      const staffTaken = tenantUsers.some((u) => u.staffId === form.staffId && u.id !== editingId);
      if (staffTaken) {
        toast.error("That staff member already has a login");
        return;
      }
    }

    const branchIds = [...form.branchIds];

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
        branchIds,
        createdAt:
          tenantUsers.find((u) => u.id === editingId)?.createdAt ?? new Date().toISOString(),
      });
      setTenantUsers((prev) => prev.map((u) => (u.id === editingId ? updated : u)));
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
        branchIds,
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
    const branches = (user.branchIds ?? []).filter(Boolean).join(",");
    const qs = new URLSearchParams({ user: user.id });
    if (branches) qs.set("branches", branches);
    openImpersonate(
      `/impersonate?${qs.toString()}`,
      `Opening workspace as ${user.displayName}`,
    );
  };

  const testDriveForm = () => {
    const permissions = form.allFunctions ? "*" : form.permissions.join(",");
    if (!permissions) {
      toast.error("Pick at least one permission to test");
      return;
    }
    if (orderedBranches.length > 0 && form.branchIds.length === 0) {
      toast.error("Select at least one campus to test");
      return;
    }
    const name = form.displayName.trim() || "Permission preview";
    const qs = new URLSearchParams({
      perms: permissions,
      name,
    });
    const email = form.email.trim().toLowerCase();
    if (email) qs.set("email", email);
    if (form.branchIds.length > 0) {
      qs.set("branches", form.branchIds.join(","));
    }
    openImpersonate(
      `/impersonate?${qs.toString()}`,
      `Opening permission preview · ${name}`,
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (isSignedInUser(pendingDelete)) {
      toast.error("You cannot remove your own account from here");
      setPendingDelete(null);
      return;
    }
    const id = pendingDelete.id;
    const name = pendingDelete.displayName;
    setTenantUsers((prev) => prev.filter((u) => u.id !== id));
    void apiDeleteTenantUser(id).catch((err) =>
      toast.error(err instanceof Error ? err.message : "Could not delete user"),
    );
    toast.error(`${name} removed`);
    setPendingDelete(null);
  };

  const allBranchesSelected =
    orderedBranches.length > 0 && form.branchIds.length === orderedBranches.length;

  return (
    <>
      <OrganicCard tone="white" cornerSide="bl" padded className="min-w-0">
        <CardHeader
          title="Team access"
          subtitle={
            !canAddUser
              ? "This plan includes your administrator login only · upgrade to Premium to add team logins"
              : teamUsers.length === 0
                ? "No additional team logins yet · add users with campus + module access"
                : `${teamUsers.length} team login${teamUsers.length === 1 ? "" : "s"} · campuses, modules & finance`
          }
          actionLabel={canAddUser ? "Add User" : undefined}
          onAction={canAddUser ? startCreate : undefined}
        />

        <p className="mt-3 text-[11.5px] leading-relaxed text-black/45 dark:text-zinc-500">
          Your signed-in administrator account is not listed here and cannot be edited or removed
          from this screen.
        </p>

        <div className="mt-4 space-y-2">
          {teamUsers.length === 0 && (
            <div className="rounded-lg border border-dashed border-black/15 bg-[#F4F4F5]/40 px-4 py-8 text-center text-[12px] text-black/55 dark:text-zinc-400">
              {canAddUser
                ? "No team logins yet · add a user to grant staff limited workspace access"
                : "Upgrade to Premium or Enterprise to add fee clerks, coordinators, and other logins"}
            </div>
          )}
          {teamUsers.map((user) => {
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
                        user.active ? "bg-[#CCFBF1] text-[#0F766E]" : "bg-black/8 text-black/45",
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
                    {branchSummary(user.branchIds, orderedBranches)} ·{" "}
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
        <DialogContent
          className="flex h-[min(92vh,56rem)] w-[calc(100vw-1.25rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest("[data-radix-select-content]")) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest("[data-radix-select-content]")) e.preventDefault();
          }}
        >
          <DialogHeader className="shrink-0 space-y-1 border-b border-[#EFEFEF] px-5 py-4 pr-12 text-left dark:border-white/10 sm:px-6">
            <DialogTitle>{editingId ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>
              Assign campuses and module access for this workspace login.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 sm:px-6">
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
                    onValueChange={(v) => setForm({ ...form, roleId: v === "__none__" ? "" : v })}
                  >
                    <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E5E5] bg-white">
                      <SelectValue placeholder="Optional role" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[250]">
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
                    onValueChange={(v) => setForm({ ...form, staffId: v === "__none__" ? "" : v })}
                  >
                    <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E5E5] bg-white">
                      <SelectValue placeholder="Optional staff" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[250]">
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

              {orderedBranches.length > 0 ? (
                <section className="space-y-2.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA]/80 p-3.5 dark:border-white/10 dark:bg-zinc-900/40">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
                        Campuses
                      </h3>
                      <p className="mt-0.5 text-[12px] text-slate-500 dark:text-zinc-400">
                        One or more campuses this login can open in the switcher.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={selectAllBranches}
                        className="rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 text-[11px] font-semibold hover:bg-[#F4F4F5] dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={clearBranches}
                        className="rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 text-[11px] font-semibold hover:bg-[#F4F4F5] dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {orderedBranches.map((b) => {
                      const checked = form.branchIds.includes(b.id);
                      return (
                        <label
                          key={b.id}
                          className={cn(
                            "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[12.5px] transition-colors",
                            checked
                              ? "border-[#99F6E4] bg-[#F0FDFA] text-slate-900 dark:border-teal-700/50 dark:bg-teal-950/30 dark:text-zinc-100"
                              : "border-[#EFEFEF] bg-white text-slate-900 hover:border-[#D4D4D8] dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => toggleBranch(b.id, v === true)}
                            className="mt-0.5"
                          />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">{b.name}</span>
                            <span className="block truncate text-[11px] text-slate-500 dark:text-zinc-500">
                              {b.code}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-500">
                    {allBranchesSelected
                      ? "All campuses selected"
                      : form.branchIds.length === 0
                        ? "Select at least one campus"
                        : `${form.branchIds.length} of ${orderedBranches.length} selected`}
                  </p>
                </section>
              ) : null}

              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-400">
                      Module access
                    </h3>
                    <p className="mt-0.5 text-[12px] text-slate-500 dark:text-zinc-400">
                      Pick a preset, or fine-tune each module below.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        ["all", "All functions"],
                        ["finance", "Finance only"],
                        ["clear", "Clear"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => applyPreset(id)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                          activePreset === id
                            ? "border-[#0F766E] bg-[#CCFBF1] text-[#0F766E] dark:border-teal-500/50 dark:bg-teal-950/50 dark:text-teal-200"
                            : "border-[#E5E5E5] bg-white text-slate-700 hover:bg-[#F4F4F5] dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-white/5",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  {PERMISSION_GROUPS.map((group) => {
                    const state = groupState(group.keys);
                    const cols =
                      group.keys.length <= 3
                        ? "grid-cols-1"
                        : group.keys.length <= 6
                          ? "grid-cols-1 sm:grid-cols-2"
                          : "grid-cols-1 sm:grid-cols-2";
                    return (
                      <div
                        key={group.id}
                        className={cn(
                          "rounded-xl border border-[#E5E5E5] bg-white p-3.5 dark:border-white/10 dark:bg-zinc-950/60",
                          group.id === "finance" && "lg:col-span-2",
                        )}
                      >
                        <div className="mb-3 flex items-start justify-between gap-2 border-b border-[#F4F4F5] pb-2.5 dark:border-white/10">
                          <div className="min-w-0">
                            <div className="text-[12px] font-bold text-slate-900 dark:text-zinc-100">
                              {group.label}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-500">
                              {group.description}
                            </div>
                          </div>
                          <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-zinc-300">
                            <Checkbox
                              checked={state.indeterminate ? "indeterminate" : state.checked}
                              disabled={form.allFunctions}
                              onCheckedChange={(v) => toggleGroup(group.keys, v === true)}
                            />
                            All
                          </label>
                        </div>
                        <div className={cn("grid gap-1.5", cols)}>
                          {group.keys.map((key) => {
                            const checked = form.allFunctions || form.permissions.includes(key);
                            return (
                              <label
                                key={key}
                                className={cn(
                                  "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-[12.5px] transition-colors",
                                  checked
                                    ? "bg-[#F0FDFA] text-slate-900 dark:bg-teal-950/35 dark:text-zinc-100"
                                    : "text-slate-800 hover:bg-[#F8FAFC] dark:text-zinc-200 dark:hover:bg-white/5",
                                  form.allFunctions && "opacity-80",
                                )}
                              >
                                <Checkbox
                                  checked={checked}
                                  disabled={form.allFunctions}
                                  onCheckedChange={(v) => togglePerm(key, v === true)}
                                />
                                <span className="leading-snug">{PERMISSION_LABELS[key]}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-slate-800 dark:text-zinc-200">
                <Checkbox
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v === true })}
                />
                Active (can sign in)
              </label>
            </div>

            <DialogFooter className="shrink-0 gap-2 border-t border-[#EFEFEF] px-5 py-3.5 dark:border-white/10 sm:justify-between sm:px-6">
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
                <Button
                  type="submit"
                  className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
                >
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
            <DialogTitle className="text-[22px] font-semibold text-black">Delete User</DialogTitle>
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
