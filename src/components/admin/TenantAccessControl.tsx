import { useEffect, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Database,
  Loader2,
  LogOut,
  Power,
  ShieldCheck,
  ShieldOff,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import type { Status, Tenant } from "./data";
import { setSuperAdminTenantAccess } from "@/lib/api/super-admin";
import { ApiError } from "@/lib/api/client";
import { formatEventDateTime } from "@/lib/dates";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type RestoreStatus = Exclude<Status, "Suspended">;

const RESTORE_OPTIONS: { value: RestoreStatus; label: string; hint: string }[] = [
  { value: "Active", label: "Active", hint: "Live and in good standing" },
  { value: "Trial", label: "Trial", hint: "Evaluation period continues" },
  { value: "Overdue", label: "Overdue", hint: "Access restored, payment still due" },
];

const REASON_PRESETS = [
  "Payment overdue",
  "Subscription cancelled",
  "Requested by school",
  "Policy violation",
];

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof ApiError || err instanceof Error ? err.message : fallback;

export function TenantAccessControl({
  tenant,
  onUpdated,
}: {
  tenant: Tenant;
  onUpdated: (tenant: Tenant) => void;
}) {
  const deactivated = tenant.status === "Suspended";
  const [dialog, setDialog] = useState<"deactivate" | "activate" | null>(null);

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border p-4",
          deactivated ? "border-rose-200 bg-rose-50/70" : "border-emerald-200 bg-emerald-50/60",
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                deactivated ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600",
              )}
            >
              {deactivated ? (
                <ShieldOff className="h-4 w-4" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Workspace access
              </div>
              <div
                className={cn(
                  "mt-0.5 flex items-center gap-2 text-[15px] font-semibold",
                  deactivated ? "text-rose-700" : "text-emerald-700",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    deactivated ? "bg-rose-500" : "animate-pulse bg-emerald-500",
                  )}
                />
                {deactivated ? "Deactivated" : "Enabled"}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-black/60">
                {deactivated
                  ? "Every device was signed out. Staff cannot sign in on web or the app, and impersonation is blocked. All school data is kept intact."
                  : "Staff can sign in on the web and the Feezo app. Deactivating signs everyone out immediately and blocks new logins until you reactivate."}
              </p>
              {deactivated && (tenant.accessDisabledAt || tenant.accessDisabledReason) && (
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  {tenant.accessDisabledAt && (
                    <span className="rounded-full bg-white px-2 py-0.5 font-medium text-black/65 ring-1 ring-rose-200">
                      Since {formatEventDateTime(tenant.accessDisabledAt)}
                    </span>
                  )}
                  {tenant.accessDisabledReason && (
                    <span className="rounded-full bg-white px-2 py-0.5 font-medium text-black/65 ring-1 ring-rose-200">
                      Reason: {tenant.accessDisabledReason}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0">
            {deactivated ? (
              <Button
                type="button"
                className="w-full rounded-full bg-black text-white hover:bg-black/85 sm:w-auto"
                onClick={() => setDialog("activate")}
              >
                <Power className="h-3.5 w-3.5" /> Activate workspace
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full border-rose-300 bg-white text-rose-700 hover:bg-rose-50 hover:text-rose-800 sm:w-auto"
                onClick={() => setDialog("deactivate")}
              >
                <Ban className="h-3.5 w-3.5" /> Deactivate workspace
              </Button>
            )}
          </div>
        </div>
      </div>

      <DeactivateDialog
        tenant={tenant}
        open={dialog === "deactivate"}
        onClose={() => setDialog(null)}
        onDone={onUpdated}
      />
      <ActivateDialog
        tenant={tenant}
        open={dialog === "activate"}
        onClose={() => setDialog(null)}
        onDone={onUpdated}
      />
    </>
  );
}

function DeactivateDialog({
  tenant,
  open,
  onClose,
  onDone,
}: {
  tenant: Tenant;
  open: boolean;
  onClose: () => void;
  onDone: (t: Tenant) => void;
}) {
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const confirmToken = tenant.id;

  useEffect(() => {
    if (open) {
      setReason("");
      setConfirm("");
    }
  }, [open]);

  const canSubmit = confirm.trim().toUpperCase() === confirmToken.toUpperCase() && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const res = await setSuperAdminTenantAccess({
        id: tenant.id,
        action: "deactivate",
        reason: reason.trim() || undefined,
      });
      onDone(res.tenant);
      toast.success(`${tenant.name} deactivated`, {
        description:
          res.revokedSessions > 0
            ? `${res.revokedSessions} active session${res.revokedSessions === 1 ? "" : "s"} signed out. Login is blocked.`
            : "No one was signed in. Login is now blocked.",
      });
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Could not deactivate this school"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-700">
            <Ban className="h-4 w-4" /> Deactivate {tenant.name}?
          </DialogTitle>
          <DialogDescription>
            This takes effect immediately for every user of this school.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-3 text-[12.5px] text-black/75">
          <Effect icon={<LogOut className="h-3.5 w-3.5" />}>
            Signs out all staff on every browser and the mobile app within a minute.
          </Effect>
          <Effect icon={<UserX className="h-3.5 w-3.5" />}>
            Blocks new logins, token refresh, and password resets.
          </Effect>
          <Effect icon={<ShieldOff className="h-3.5 w-3.5" />}>
            Blocks Super Admin impersonation until reactivated.
          </Effect>
          <Effect icon={<Database className="h-3.5 w-3.5" />} tone="good">
            Keeps all students, fees, and records. You can reactivate anytime.
          </Effect>
        </ul>

        <div className="space-y-2">
          <Label htmlFor="deactivate-reason" className="text-[12px]">
            Reason <span className="font-normal text-black/45">(internal, optional)</span>
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {REASON_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReason(p)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                  reason === p
                    ? "border-black bg-black text-white"
                    : "border-[#E5E5E5] bg-white text-black/65 hover:border-black/30",
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <Textarea
            id="deactivate-reason"
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Invoice INV-1042 unpaid for 45 days"
            className="min-h-[70px] rounded-xl text-[13px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="deactivate-confirm" className="text-[12px]">
            Type <span className="font-mono font-semibold text-black">{confirmToken}</span> to
            confirm
          </Label>
          <Input
            id="deactivate-confirm"
            value={confirm}
            autoComplete="off"
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
            placeholder={confirmToken}
            className="rounded-xl font-mono"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-full bg-rose-600 text-white hover:bg-rose-700"
            disabled={!canSubmit}
            onClick={() => void submit()}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Ban className="h-3.5 w-3.5" />
            )}
            Deactivate &amp; sign out everyone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActivateDialog({
  tenant,
  open,
  onClose,
  onDone,
}: {
  tenant: Tenant;
  open: boolean;
  onClose: () => void;
  onDone: (t: Tenant) => void;
}) {
  const fallback: RestoreStatus =
    tenant.statusBeforeDisable && tenant.statusBeforeDisable !== "Suspended"
      ? tenant.statusBeforeDisable
      : "Active";
  const [status, setStatus] = useState<RestoreStatus>(fallback);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setStatus(fallback);
      setNote("");
    }
  }, [open, fallback]);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await setSuperAdminTenantAccess({
        id: tenant.id,
        action: "activate",
        status,
        note: note.trim() || undefined,
      });
      onDone(res.tenant);
      toast.success(`${tenant.name} reactivated`, {
        description: `Lifecycle set to ${res.tenant.status}. Staff can sign in again.`,
      });
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Could not activate this school"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Power className="h-4 w-4 text-emerald-600" /> Activate {tenant.name}
          </DialogTitle>
          <DialogDescription>
            Staff can sign in again right away with their existing credentials.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label className="text-[12px]">Restore lifecycle status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as RestoreStatus)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESTORE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                  <span className="ml-2 text-[11px] text-black/45">{o.hint}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tenant.statusBeforeDisable && tenant.statusBeforeDisable !== "Suspended" && (
            <p className="text-[11px] text-black/50">
              Was <strong>{tenant.statusBeforeDisable}</strong> before deactivation.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="activate-note" className="text-[12px]">
            Note <span className="font-normal text-black/45">(internal, optional)</span>
          </Label>
          <Textarea
            id="activate-note"
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Payment received, ticket SUP-221"
            className="min-h-[60px] rounded-xl text-[13px]"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-full bg-black text-white hover:bg-black/85"
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Activate workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Effect({
  icon,
  tone,
  children,
}: {
  icon: React.ReactNode;
  tone?: "good";
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2">
      <span
        className={cn(
          "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
          tone === "good" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600",
        )}
      >
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}
