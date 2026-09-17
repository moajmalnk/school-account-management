import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { getApiToken } from "@/lib/api/client";
import {
  apiGlChartTree,
  apiGlCreateAccount,
  apiGlDeleteAccount,
  apiGlListAccounts,
  apiGlUpdateAccount,
  glInstallHint,
  type GlAccount,
} from "@/lib/api/general-ledger";
import { fetchIfscDetails, isValidIfsc, normalizeIfsc } from "@/lib/ifsc";
import { useTenantStore } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

type BankAccountType = "savings" | "current" | "od" | "other";

type BankFormState = {
  ledgerName: string;
  ifsc: string;
  bankName: string;
  branch: string;
  accountNo: string;
  accountHolder: string;
  accountType: BankAccountType;
  address: string;
  city: string;
  state: string;
  micr: string;
};

const EMPTY_BANK_FORM: BankFormState = {
  ledgerName: "",
  ifsc: "",
  bankName: "",
  branch: "",
  accountNo: "",
  accountHolder: "",
  accountType: "current",
  address: "",
  city: "",
  state: "",
  micr: "",
};

function maskAccount(no: string | null | undefined): string {
  if (!no) return "—";
  if (no.length <= 4) return no;
  return `•••• ${no.slice(-4)}`;
}

function formFromAccount(a: GlAccount): BankFormState {
  const type = (a.bankAccountType || "current").toLowerCase();
  return {
    ledgerName: a.name || "",
    ifsc: a.bankIfsc || "",
    bankName: a.bankName || "",
    branch: a.bankBranch || "",
    accountNo: a.bankAccountNo || "",
    accountHolder: a.bankAccountHolder || "",
    accountType: (["savings", "current", "od", "other"].includes(type)
      ? type
      : "current") as BankAccountType,
    address: a.bankAddress || "",
    city: a.bankCity || "",
    state: a.bankState || "",
    micr: a.bankMicr || "",
  };
}

/**
 * Campus bank ledgers CRUD for School Details (and shared with Transfer).
 * Saves immediately via GL chart API — independent of School Details Save Changes.
 */
export function BankAccountsManager({ className }: { className?: string }) {
  const { activeBranchId: branchId, academicYear } = useTenantStore();
  const [banks, setBanks] = useState<GlAccount[]>([]);
  const [bankGroupId, setBankGroupId] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GlAccount | null>(null);
  const [form, setForm] = useState<BankFormState>(EMPTY_BANK_FORM);
  const [saving, setSaving] = useState(false);
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscFetched, setIfscFetched] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<GlAccount | null>(null);
  const [deleting, setDeleting] = useState(false);
  const lastAutoIfscRef = useRef("");

  const load = useCallback(async () => {
    if (!getApiToken()) {
      setBanks([]);
      setBankGroupId("");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [accounts, tree] = await Promise.all([
        apiGlListAccounts(true),
        apiGlChartTree(),
      ]);
      setBanks(accounts.filter((a) => a.isBank));
      const bankGroup =
        tree.groups.find((g) => /bank accounts/i.test(g.name) && !/od/i.test(g.name)) ??
        tree.groups.find((g) => g.nature === "asset" && /bank/i.test(g.name));
      setBankGroupId(bankGroup?.id ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load bank accounts", {
        description: glInstallHint(),
      });
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchForm = (patch: Partial<BankFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const resetForm = () => {
    setForm(EMPTY_BANK_FORM);
    setEditing(null);
    setIfscFetched(false);
    setIfscLoading(false);
    lastAutoIfscRef.current = "";
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (account: GlAccount) => {
    setEditing(account);
    setForm(formFromAccount(account));
    setIfscFetched(Boolean(account.bankIfsc));
    lastAutoIfscRef.current = normalizeIfsc(account.bankIfsc || "");
    setDialogOpen(true);
  };

  const handleLookupIfsc = async (raw = form.ifsc) => {
    const code = normalizeIfsc(raw);
    if (!isValidIfsc(code)) {
      toast.error("Enter a valid IFSC", { description: "11 characters · e.g. HDFC0001234" });
      return;
    }
    setIfscLoading(true);
    try {
      const details = await fetchIfscDetails(code);
      lastAutoIfscRef.current = code;
      setForm((prev) => {
        const suggested =
          prev.ledgerName.trim() ||
          [details.bankName, details.branch].filter(Boolean).join(" · ").slice(0, 80);
        return {
          ...prev,
          ifsc: details.ifsc,
          bankName: details.bankName,
          branch: details.branch,
          address: details.address,
          city: details.city,
          state: details.state,
          micr: details.micr || "",
          ledgerName: suggested,
        };
      });
      setIfscFetched(true);
      toast.success("Bank details fetched", {
        description: `${details.bankName}${details.branch ? ` · ${details.branch}` : ""}`,
      });
    } catch (e) {
      lastAutoIfscRef.current = code;
      setIfscFetched(false);
      toast.error(e instanceof Error ? e.message : "IFSC lookup failed");
    } finally {
      setIfscLoading(false);
    }
  };

  useEffect(() => {
    if (!dialogOpen) return;
    const code = normalizeIfsc(form.ifsc);
    if (!isValidIfsc(code) || ifscLoading) return;
    if (lastAutoIfscRef.current === code) return;
    const timer = window.setTimeout(() => {
      void handleLookupIfsc(code);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [dialogOpen, form.ifsc, ifscLoading]);

  const handleSave = async () => {
    const ledgerName = form.ledgerName.trim();
    const ifsc = normalizeIfsc(form.ifsc);
    const accountNo = form.accountNo.replace(/\s+/g, "");
    if (!ledgerName) {
      toast.error("Enter a ledger name");
      return;
    }
    if (!isValidIfsc(ifsc)) {
      toast.error("Enter a valid IFSC code");
      return;
    }
    if (!accountNo || accountNo.length < 6) {
      toast.error("Enter the bank account number");
      return;
    }
    if (!form.bankName.trim()) {
      toast.error("Fetch IFSC details or enter the bank name");
      return;
    }
    if (!editing && !bankGroupId) {
      toast.error("Bank Accounts group missing", {
        description: "Open Ledgers and tap Update all books, then try again",
      });
      return;
    }

    const payload = {
      bankName: form.bankName.trim(),
      bankAccountNo: accountNo,
      bankIfsc: ifsc,
      bankBranch: form.branch.trim() || undefined,
      bankAccountHolder: form.accountHolder.trim() || undefined,
      bankAccountType: form.accountType,
      bankAddress: form.address.trim() || undefined,
      bankCity: form.city.trim() || undefined,
      bankState: form.state.trim() || undefined,
      bankMicr: form.micr.trim() || undefined,
    };

    setSaving(true);
    try {
      if (editing) {
        await apiGlUpdateAccount(editing.id, {
          name: ledgerName,
          isBank: true,
          ...payload,
        });
        toast.success("Bank details updated", { description: ledgerName });
      } else {
        await apiGlCreateAccount({
          name: ledgerName,
          groupId: bankGroupId,
          academicYear: academicYear || undefined,
          ...payload,
        });
        toast.success("Bank ledger added", { description: ledgerName });
      }
      setDialogOpen(false);
      resetForm();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save bank");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await apiGlDeleteAccount(pendingDelete.id);
      toast.success("Bank removed", {
        description: `${pendingDelete.name} deactivated from books`,
      });
      setPendingDelete(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove bank");
    } finally {
      setDeleting(false);
    }
  };

  const sorted = useMemo(
    () => [...banks].sort((a, b) => a.name.localeCompare(b.name)),
    [banks],
  );

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[13px] font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            Bank details
          </h3>
          <p className="mt-0.5 text-[12px] text-black/55 dark:text-zinc-400">
            Campus bank accounts used in transfers, day book, and ledgers
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-full text-[11px]"
            disabled={loading}
            onClick={() => void load()}
          >
            {loading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-full bg-[#0F766E] text-[11px] text-white hover:bg-[#0D9488]"
            onClick={openCreate}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add bank
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : !getApiToken() ? (
        <div className="rounded-xl border border-dashed border-black/15 px-4 py-8 text-center text-[12px] text-black/50">
          Sign in to manage bank ledgers
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/15 px-4 py-8 text-center">
          <p className="text-[13px] font-semibold text-slate-900 dark:text-zinc-50">
            No bank accounts yet
          </p>
          <p className="mt-1 text-[12px] text-black/50">
            Add a bank with IFSC to use it in fund transfers and books.
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-3 h-8 rounded-full bg-[#0F766E] text-[11px] text-white hover:bg-[#0D9488]"
            onClick={openCreate}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add bank
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E5E5E5] dark:border-white/10">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F4F4F5] dark:border-white/10 dark:bg-zinc-900/70">
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-black/55">
                  Ledger
                </th>
                <th className="hidden px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-black/55 sm:table-cell">
                  Bank / IFSC
                </th>
                <th className="hidden px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-black/55 md:table-cell">
                  Account
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-black/55">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((bank) => (
                <tr
                  key={bank.id}
                  className="border-b border-[#F0F0F0] last:border-0 dark:border-white/5"
                >
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-slate-900 dark:text-zinc-50">
                      {bank.name}
                    </div>
                    <div className="mt-0.5 text-[11px] text-black/45 sm:hidden">
                      {bank.bankName || "—"} · {bank.bankIfsc || "—"}
                    </div>
                    {bank.isSystem ? (
                      <span className="mt-1 inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                        System
                      </span>
                    ) : null}
                  </td>
                  <td className="hidden px-3 py-2.5 sm:table-cell">
                    <div className="text-slate-800 dark:text-zinc-200">
                      {bank.bankName || "—"}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-black/45">
                      {bank.bankIfsc || "—"}
                      {bank.bankBranch ? ` · ${bank.bankBranch}` : ""}
                    </div>
                  </td>
                  <td className="hidden px-3 py-2.5 md:table-cell">
                    <div className="font-mono text-[12px]">
                      {maskAccount(bank.bankAccountNo)}
                    </div>
                    <div className="mt-0.5 text-[11px] capitalize text-black/45">
                      {bank.bankAccountType || "—"}
                      {bank.bankAccountHolder ? ` · ${bank.bankAccountHolder}` : ""}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <div className="inline-flex items-center gap-0.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-full p-0"
                        title="Edit"
                        onClick={() => openEdit(bank)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-full p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        title="Remove"
                        onClick={() => setPendingDelete(bank)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="space-y-1 border-b border-[#EFEFEF] px-5 py-4 dark:border-white/10">
            <DialogTitle>{editing ? "Edit bank details" : "Add bank ledger"}</DialogTitle>
            <DialogDescription>
              Enter IFSC to autofill bank details, then confirm account number and ledger name.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 px-5 py-4 sm:grid-cols-6">
            <div className="space-y-1 sm:col-span-4">
              <Label htmlFor="settings-bank-ifsc" className="text-[11px]">
                IFSC code
              </Label>
              <div className="flex gap-2">
                <Input
                  id="settings-bank-ifsc"
                  value={form.ifsc}
                  onChange={(e) => {
                    const next = normalizeIfsc(e.target.value).slice(0, 11);
                    patchForm({ ifsc: next });
                    setIfscFetched(false);
                    lastAutoIfscRef.current = "";
                  }}
                  onBlur={() => {
                    if (isValidIfsc(form.ifsc) && !ifscFetched && !ifscLoading) {
                      void handleLookupIfsc(form.ifsc);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleLookupIfsc(form.ifsc);
                    }
                  }}
                  placeholder="HDFC0001234"
                  className="h-9 flex-1 rounded-xl font-mono uppercase tracking-wide"
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 shrink-0 rounded-xl px-3 text-[12px]"
                  disabled={ifscLoading || !isValidIfsc(form.ifsc)}
                  onClick={() => void handleLookupIfsc(form.ifsc)}
                >
                  {ifscLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
                </Button>
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="settings-bank-type" className="text-[11px]">
                Account type
              </Label>
              <Select
                value={form.accountType}
                onValueChange={(v) => patchForm({ accountType: v as BankAccountType })}
              >
                <SelectTrigger id="settings-bank-type" className="h-9 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="od">Overdraft</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:col-span-3">
              <Label htmlFor="settings-bank-name" className="text-[11px]">
                Bank name
              </Label>
              <Input
                id="settings-bank-name"
                value={form.bankName}
                onChange={(e) => patchForm({ bankName: e.target.value })}
                placeholder="Fetched from IFSC"
                className="h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1 sm:col-span-3">
              <Label htmlFor="settings-bank-branch" className="text-[11px]">
                Branch
              </Label>
              <Input
                id="settings-bank-branch"
                value={form.branch}
                onChange={(e) => patchForm({ branch: e.target.value })}
                placeholder="Branch"
                className="h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1 sm:col-span-3">
              <Label htmlFor="settings-bank-no" className="text-[11px]">
                Account number
              </Label>
              <Input
                id="settings-bank-no"
                value={form.accountNo}
                onChange={(e) =>
                  patchForm({ accountNo: e.target.value.replace(/[^\d]/g, "").slice(0, 24) })
                }
                placeholder="Account number"
                className="h-9 rounded-xl font-mono"
                inputMode="numeric"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1 sm:col-span-3">
              <Label htmlFor="settings-bank-holder" className="text-[11px]">
                Account holder
              </Label>
              <Input
                id="settings-bank-holder"
                value={form.accountHolder}
                onChange={(e) => patchForm({ accountHolder: e.target.value })}
                placeholder="School / trust name"
                className="h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="settings-bank-city" className="text-[11px]">
                City
              </Label>
              <Input
                id="settings-bank-city"
                value={form.city}
                onChange={(e) => patchForm({ city: e.target.value })}
                placeholder="City"
                className="h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="settings-bank-state" className="text-[11px]">
                State
              </Label>
              <Input
                id="settings-bank-state"
                value={form.state}
                onChange={(e) => patchForm({ state: e.target.value })}
                placeholder="State"
                className="h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="settings-bank-address" className="text-[11px]">
                Branch address
              </Label>
              <Input
                id="settings-bank-address"
                value={form.address}
                onChange={(e) => patchForm({ address: e.target.value })}
                placeholder="From IFSC"
                className="h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1 sm:col-span-6">
              <Label htmlFor="settings-bank-ledger" className="text-[11px]">
                Ledger name <span className="font-normal text-black/40">(shown in books)</span>
              </Label>
              <Input
                id="settings-bank-ledger"
                value={form.ledgerName}
                onChange={(e) => patchForm({ ledgerName: e.target.value })}
                placeholder="e.g. HDFC Current · Calicut"
                className="h-9 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-[#EFEFEF] px-5 py-3.5 dark:border-white/10 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-full"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-9 rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
              disabled={saving || ifscLoading}
              onClick={() => void handleSave()}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? "Save bank" : "Add bank"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Remove bank</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `Deactivate “${pendingDelete.name}” from this campus? Past journals stay; it will no longer appear in transfers.`
                : "Deactivate this bank ledger?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full bg-[#EF4444] text-white hover:bg-[#DC2626]"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
