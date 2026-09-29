import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiSaveOrgCurrency } from "@/lib/api/settings";
import { useAuth } from "@/lib/auth";
import { CURRENCIES, type CurrencyCode } from "@/lib/locale/currencies";
import { formatMoney } from "@/lib/money";
import { useTenantStore } from "@/lib/tenant-store";

/** Settings → School: organization base currency (labels only, amounts are never converted). */
export function OrgCurrencyCard() {
  const { session } = useAuth();
  const { currency, payments } = useTenantStore();
  const [draft, setDraft] = useState<CurrencyCode>(currency);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const canEdit = session?.role === "school_admin";
  const dirty = draft !== currency;

  useEffect(() => {
    setDraft(currency);
  }, [currency]);

  const save = async () => {
    setSaving(true);
    try {
      const saved = await apiSaveOrgCurrency(draft);
      toast.success(`Base currency set to ${saved}`, {
        description: `Amounts now display as ${formatMoney(12500, saved)} · stored values unchanged`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save base currency");
      setDraft(currency);
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  const requestSave = () => {
    if (!dirty) return;
    if (payments.length > 0) setConfirmOpen(true);
    else void save();
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 sm:col-span-6 lg:col-span-6">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
          Base currency
        </Label>
        <div className="mt-1.5 flex items-center gap-2">
          <Select
            value={draft}
            onValueChange={(v) => setDraft(v as CurrencyCode)}
            disabled={!canEdit || saving}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} · {c.symbol} — {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canEdit && dirty ? (
            <Button type="button" size="sm" onClick={requestSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          ) : null}
        </div>
        <p className="mt-1.5 text-[11.5px] leading-snug text-black/50 dark:text-zinc-400">
          Fees, receipts, reports and WhatsApp messages use this currency. Changing it relabels
          amounts — stored values are never converted.
          {!canEdit ? " Only the school admin can change it." : ""}
        </p>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change base currency to {draft}?</AlertDialogTitle>
            <AlertDialogDescription>
              This workspace already has {payments.length} receipt{payments.length === 1 ? "" : "s"}
              . Existing amounts will not be converted — {formatMoney(1000, currency)} will display
              as {formatMoney(1000, draft)}. Only continue if your books are actually kept in{" "}
              {draft}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              Change to {draft}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
