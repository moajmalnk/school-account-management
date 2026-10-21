import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";

import {
  PlatformDocumentPreview,
  type PlatformDocKind,
} from "@/components/admin/PlatformDocumentPreview";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { ApiError } from "@/lib/api/client";
import {
  fetchSuperAdminTenantInvoices,
  issueSuperAdminTenantInvoice,
  voidSuperAdminTenantInvoice,
  type PlatformInvoice,
} from "@/lib/api/super-admin";
import { normalizeCurrency } from "@/lib/locale/currencies";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type Cadence = "Monthly" | "Quarterly" | "HalfYearly" | "Custom";

const CADENCES: Cadence[] = ["Monthly", "Quarterly", "HalfYearly", "Custom"];

const CADENCE_LABEL: Record<Cadence, string> = {
  Monthly: "Monthly",
  Quarterly: "Quarterly",
  HalfYearly: "Half yearly",
  Custom: "Custom",
};
const METHODS = ["Bank transfer", "Cash", "UPI", "Card", "Cheque"];

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setMonth(date.getMonth() + months);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function pretty(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function monthLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function suggestPeriod(cadence: Cadence, collectedOn: string, nextDue: string): string {
  if (cadence === "Monthly") return `Monthly · ${monthLabel(collectedOn)}`;
  if (cadence === "Quarterly") return `Quarterly · ${pretty(collectedOn)} – ${pretty(nextDue)}`;
  if (cadence === "HalfYearly") return `Half yearly · ${pretty(collectedOn)} – ${pretty(nextDue)}`;
  return `Custom · ${pretty(collectedOn)} – ${pretty(nextDue)}`;
}

function defaultNextDue(collectedOn: string, cadence: Cadence): string {
  if (cadence === "Quarterly") return addMonths(collectedOn, 3);
  if (cadence === "HalfYearly") return addMonths(collectedOn, 6);
  return addMonths(collectedOn, 1);
}

function statusClass(status: string): string {
  if (status === "Paid") return "bg-[#CCFBF1] text-[#0F766E]";
  if (status === "Void") return "bg-[#F4F4F5] text-black/45";
  if (status === "Overdue") return "bg-[#FEE2E2] text-[#EF4444]";
  return "bg-[#FEF3C7] text-[#B45309]";
}

export function TenantSubscriptionsPanel({
  tenantId,
  tenantName,
  schoolHost,
  currency: currencyProp,
}: {
  tenantId: string;
  tenantName: string;
  schoolHost: string;
  currency?: string;
}) {
  const currency = normalizeCurrency(currencyProp, "INR");
  const [rows, setRows] = useState<PlatformInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [pendingVoid, setPendingVoid] = useState<PlatformInvoice | null>(null);
  const [preview, setPreview] = useState<{ kind: PlatformDocKind; invoice: PlatformInvoice } | null>(
    null,
  );

  const [cadence, setCadence] = useState<Cadence>("Monthly");
  const [amount, setAmount] = useState("");
  const [collectedOn, setCollectedOn] = useState(todayIso);
  const [nextDue, setNextDue] = useState(() => defaultNextDue(todayIso(), "Monthly"));
  const [nextAmount, setNextAmount] = useState("");
  const [method, setMethod] = useState(METHODS[0]);
  const [reference, setReference] = useState("");
  const [periodLabel, setPeriodLabel] = useState(() =>
    suggestPeriod("Monthly", todayIso(), defaultNextDue(todayIso(), "Monthly")),
  );
  const [periodTouched, setPeriodTouched] = useState(false);
  const [nextDueTouched, setNextDueTouched] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchSuperAdminTenantInvoices(tenantId));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load collections";
      toast.error("Collections unavailable", { description: msg });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (nextDueTouched) return;
    setNextDue(defaultNextDue(collectedOn, cadence));
  }, [cadence, collectedOn, nextDueTouched]);

  useEffect(() => {
    if (periodTouched) return;
    setPeriodLabel(suggestPeriod(cadence, collectedOn, nextDue));
  }, [cadence, collectedOn, nextDue, periodTouched]);

  const save = async () => {
    const received = Number(amount);
    if (!Number.isFinite(received) || received <= 0) {
      toast.error("Enter the amount received");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(collectedOn)) {
      toast.error("Choose the collection date");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDue)) {
      toast.error("Choose the next due date");
      return;
    }
    if (nextDue < collectedOn) {
      toast.error("Next due date is before this collection");
      return;
    }
    const hint = nextAmount.trim() === "" ? null : Number(nextAmount);
    if (hint !== null && (!Number.isFinite(hint) || hint <= 0)) {
      toast.error("Next expected amount must be greater than zero");
      return;
    }
    const label = periodLabel.trim() || suggestPeriod(cadence, collectedOn, nextDue);
    setSaving(true);
    try {
      await issueSuperAdminTenantInvoice({
        tenantId,
        billingCycle: cadence,
        pricingModel: "flat_cycle",
        currency,
        studentsBilled: 1,
        ratePerStudent: received,
        discountPercent: 0,
        taxPercent: 0,
        issueDate: collectedOn,
        dueDate: collectedOn,
        periodLabel: label,
        paymentMethod: method,
        paymentRef: reference.trim() || undefined,
        markPaid: true,
        amount: received,
        nextDueDate: nextDue,
        nextAmount: hint,
        notes: "Manual subscription collection",
      });
      toast.success("Collection recorded", {
        description: `${formatMoney(received, currency)} for ${tenantName}. Next due ${pretty(nextDue)}.`,
      });
      setAmount("");
      setNextAmount("");
      setReference("");
      setPeriodTouched(false);
      setNextDueTouched(false);
      setCollectedOn(todayIso());
      await load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not record this collection";
      toast.error("Collection not saved", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const confirmVoid = async () => {
    if (!pendingVoid) return;
    setVoiding(true);
    try {
      await voidSuperAdminTenantInvoice({ tenantId, invoiceId: pendingVoid.id });
      toast.success("Collection voided", { description: pendingVoid.invoiceNumber });
      setPendingVoid(null);
      await load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not void this collection";
      toast.error("Void failed", { description: msg });
    } finally {
      setVoiding(false);
    }
  };

  return (
    <div className="space-y-4">
      <PlatformDocumentPreview
        open={Boolean(preview)}
        onOpenChange={(next) => {
          if (!next) setPreview(null);
        }}
        kind={preview?.kind || "invoice"}
        invoice={preview?.invoice || null}
        schoolHost={schoolHost}
      />

      <div className="rounded-2xl border border-[#E5E5E5] bg-white p-4">
        <div className="text-[13px] font-semibold text-black">Record a collection</div>
        <p className="mt-1 text-[12px] leading-relaxed text-black/55">
          Each payment is its own amount in {currency}. The next due date is what the school sees
          as the renewal date.
        </p>

        <div className="mt-4 grid grid-cols-12 gap-3">
          <div className="col-span-12 space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Cadence
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CADENCES.map((option) => {
                const selected = cadence === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCadence(option)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-[12px] font-semibold transition",
                      selected
                        ? "border-transparent bg-[#0F766E] text-white shadow-sm"
                        : "border-[#E5E5E5] bg-white text-black/65 hover:border-black/30",
                    )}
                  >
                    {CADENCE_LABEL[option]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="col-span-12 space-y-1.5 sm:col-span-6">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Amount received
            </Label>
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="3000"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="col-span-12 space-y-1.5 sm:col-span-6">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Next expected amount
            </Label>
            <Input
              inputMode="decimal"
              value={nextAmount}
              onChange={(e) => setNextAmount(e.target.value)}
              placeholder="Optional"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="col-span-12 space-y-1.5 sm:col-span-6">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Collected on
            </Label>
            <DatePicker value={collectedOn} onChange={setCollectedOn} valueFormat="iso" />
          </div>
          <div className="col-span-12 space-y-1.5 sm:col-span-6">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Next due date
            </Label>
            <DatePicker
              value={nextDue}
              onChange={(value) => {
                setNextDueTouched(true);
                setNextDue(value);
              }}
              valueFormat="iso"
              min={collectedOn}
            />
          </div>

          <div className="col-span-12 space-y-1.5 sm:col-span-6">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Method
            </Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-12 space-y-1.5 sm:col-span-6">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Reference
            </Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="UTR or receipt note"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="col-span-12 space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Period label
            </Label>
            <Input
              value={periodLabel}
              onChange={(e) => {
                setPeriodTouched(true);
                setPeriodLabel(e.target.value);
              }}
              className="h-10 rounded-xl"
            />
          </div>
        </div>

        <Button
          type="button"
          className="mt-4 rounded-full bg-black text-white hover:bg-black/85"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Record collection
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white">
        <div className="border-b border-[#F0F0F0] px-4 py-3">
          <div className="text-[13px] font-semibold text-black">Collections</div>
          <p className="mt-0.5 text-[12px] text-black/50">
            Latest payment sets the renewal date on the school Subscriptions page.
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-[13px] text-black/45">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading collections…
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-black/45">
            No collections yet. Record the first payment above.
          </p>
        ) : (
          <ul className="divide-y divide-[#F0F0F0]">
            {rows.map((row) => {
              const voided = row.status === "Void";
              return (
                <li key={row.id} className={cn("px-4 py-3", voided && "opacity-60")}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-black">
                        {row.periodLabel || row.invoiceNumber}
                      </div>
                      <div className="mt-0.5 text-[12px] text-black/50">
                        Collected {pretty(row.issueDate)}
                        {row.nextDueDate ? ` · next ${pretty(row.nextDueDate)}` : ""}
                        {row.paymentMethod ? ` · ${row.paymentMethod}` : ""}
                        {row.paymentRef ? ` · ${row.paymentRef}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-black">
                        {formatMoney(row.total, row.currency || currency)}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                          statusClass(row.status),
                        )}
                      >
                        {row.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-full px-2.5 text-[11px]"
                      onClick={() => setPreview({ kind: "invoice", invoice: row })}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Invoice
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-full px-2.5 text-[11px]"
                      disabled={row.status !== "Paid"}
                      onClick={() => setPreview({ kind: "receipt", invoice: row })}
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      Receipt
                    </Button>
                    {voided ? null : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full px-2.5 text-[11px] text-[#EF4444] hover:text-[#EF4444]"
                        onClick={() => setPendingVoid(row)}
                      >
                        Void
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={Boolean(pendingVoid)} onOpenChange={(open) => !open && !voiding && setPendingVoid(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Void this collection?</DialogTitle>
            <DialogDescription>
              {pendingVoid
                ? `${pendingVoid.invoiceNumber} for ${formatMoney(pendingVoid.total, pendingVoid.currency || currency)} will drop off the school Subscriptions page.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={voiding} onClick={() => setPendingVoid(null)}>
              Keep
            </Button>
            <Button
              type="button"
              className="bg-[#EF4444] text-white hover:bg-[#DC2626]"
              disabled={voiding}
              onClick={() => void confirmVoid()}
            >
              {voiding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Void collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
