import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

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
import { apiUpsertDepartment, apiUpsertRole } from "@/lib/api/settings";
import { useTenantStore, type Department, type Role } from "@/lib/tenant-store";

function nextPrefixedId(prefix: string, existingIds: string[]): string {
  let n = existingIds.length + 1;
  for (;;) {
    const id = `${prefix}-${n.toString().padStart(3, "0")}`;
    if (!existingIds.includes(id)) return id;
    n += 1;
  }
}

export function CreateDepartmentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (dept: Department) => void;
}) {
  const { departments, setDepartments } = useTenantStore();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setCode("");
    setSaving(false);
  }, [open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedName || !trimmedCode) {
      toast.error("Department name and code are required");
      return;
    }
    if (departments.some((d) => d.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error("A department with this name already exists");
      return;
    }

    const created: Department = {
      id: nextPrefixedId(
        "DEP",
        departments.map((d) => d.id),
      ),
      name: trimmedName,
      code: trimmedCode,
    };

    setSaving(true);
    try {
      const saved = await apiUpsertDepartment(created);
      const next = saved?.id ? saved : created;
      setDepartments((prev) => (prev.some((d) => d.id === next.id) ? prev : [...prev, next]));
      toast.success(`Department added · ${next.name}`);
      onCreated?.(next);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save department");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[110] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
          <DialogDescription>
            Create a department and select it for this staff profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Department Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Library Sciences"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Department Code
            </Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. LIB"
              className="font-mono uppercase"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
            >
              {saving ? "Saving…" : "Add Department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateRoleDialog({
  open,
  onOpenChange,
  onCreated,
  onNeedDepartment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (role: Role) => void;
  onNeedDepartment?: () => void;
}) {
  const { roles, setRoles, departments } = useTenantStore();
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDepartmentId(departments[0]?.id ?? "");
    setSaving(false);
  }, [open, departments]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Role title is required");
      return;
    }
    if (!departmentId) {
      toast.error("Add a department first", {
        description: "Roles must belong to a parent department.",
      });
      onNeedDepartment?.();
      return;
    }
    if (roles.some((r) => r.title.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("A role with this name already exists");
      return;
    }

    const created: Role = {
      id: nextPrefixedId(
        "ROL",
        roles.map((r) => r.id),
      ),
      title: trimmed,
      departmentId,
    };

    setSaving(true);
    try {
      const saved = await apiUpsertRole(created);
      const next = saved?.id ? saved : created;
      setRoles((prev) => (prev.some((r) => r.id === next.id) ? prev : [...prev, next]));
      toast.success(`Role added · ${next.title}`);
      onCreated?.(next);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[110] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Position / Role</DialogTitle>
          <DialogDescription>Create a role and select it for this staff profile.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Position / Role name
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chemistry · HOD"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Parent Department
              </Label>
              {departments.length === 0 ? (
                <button
                  type="button"
                  onClick={() => onNeedDepartment?.()}
                  className="text-[11px] font-semibold text-[#0F766E] hover:underline"
                >
                  Add department
                </button>
              ) : null}
            </div>
            <Select
              value={departmentId || undefined}
              onValueChange={setDepartmentId}
              disabled={departments.length === 0}
            >
              <SelectTrigger className="h-10 w-full rounded-lg border border-[#E5E5E5] bg-white text-[13px]">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent className="z-[120]">
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || departments.length === 0}
              className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
            >
              {saving ? "Saving…" : "Add Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function StaffOrgQuickCreateDialogs({
  roleOpen,
  onRoleOpenChange,
  departmentOpen,
  onDepartmentOpenChange,
  onRoleCreated,
  onDepartmentCreated,
}: {
  roleOpen: boolean;
  onRoleOpenChange: (open: boolean) => void;
  departmentOpen: boolean;
  onDepartmentOpenChange: (open: boolean) => void;
  onRoleCreated?: (role: Role) => void;
  onDepartmentCreated?: (dept: Department) => void;
}): ReactNode {
  const [reopenRoleAfterDept, setReopenRoleAfterDept] = useState(false);

  return (
    <>
      <CreateDepartmentDialog
        open={departmentOpen}
        onOpenChange={(open) => {
          onDepartmentOpenChange(open);
          if (!open && reopenRoleAfterDept) {
            setReopenRoleAfterDept(false);
            onRoleOpenChange(true);
          }
        }}
        onCreated={(dept) => {
          onDepartmentCreated?.(dept);
          if (reopenRoleAfterDept) {
            setReopenRoleAfterDept(false);
            onDepartmentOpenChange(false);
            onRoleOpenChange(true);
          }
        }}
      />
      <CreateRoleDialog
        open={roleOpen}
        onOpenChange={onRoleOpenChange}
        onCreated={onRoleCreated}
        onNeedDepartment={() => {
          setReopenRoleAfterDept(true);
          onRoleOpenChange(false);
          onDepartmentOpenChange(true);
        }}
      />
    </>
  );
}
