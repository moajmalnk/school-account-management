import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Loader2, Plus, Receipt } from "lucide-react";
import { toast } from "sonner";

import {
  PlatformDocumentPreview,
  type PlatformDocKind,
} from "@/components/admin/PlatformDocumentPreview";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import {
  fetchSuperAdminTenantInvoices,
  fetchTenantPlatformInvoices,
  issueSuperAdminTenantInvoice,
  markSuperAdminTenantInvoicePaid,
  type PlatformInvoice,
} from "@/lib/api/super-admin";
import { cn } from "@/lib/utils";

const CURRENCY_SYMBOL: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
};

type IssueDraft = {
  billingCycle: string;
  pricingModel?: "per_student" | "flat_cycle";
  currency: string;
  studentsBilled: number;
  ratePerStudent: number;
  discountPercent: number;
  taxPercent: number;
  paymentMethod?: string;
  periodLabel?: string;
  issueDate?: string;
  dueDate?: string;
};

type PlatformInvoicesPanelProps = {
  mode: "super_admin" | "tenant";
  tenantId?: string;
  tenantName?: string;
  schoolHost?: string;
  /** Prefill when issuing from Super Admin billing form */
  issueDraft?: IssueDraft;
  className?: string;
};

export function PlatformInvoicesPanel({
  mode,
  tenantId,
  tenantName,
  schoolHost,
  issueDraft,
  className,
}: PlatformInvoicesPanelProps) {
  const [rows, setRows] = useState<PlatformInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    kind: PlatformDocKind;
    invoice: PlatformInvoice;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list =
        mode === "super_admin"
          ? await fetchSuperAdminTenantInvoices(tenantId || "")
          : await fetchTenantPlatformInvoices();
      setRows(list);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load invoices";
      toast.error("Invoices unavailable", { description: msg });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [mode, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const issueInvoice = async (markPaid: boolean) => {
    if (mode !== "super_admin" || !tenantId || !issueDraft) return;
    setBusyId("issue");
    try {
      const created = await issueSuperAdminTenantInvoice({
        tenantId,
        ...issueDraft,
        markPaid,
        notes: markPaid ? "Issued and marked paid from Control Plane" : "Issued from Control Plane",
      });
      setRows((prev) => [created, ...prev]);
      toast.success(markPaid ? "Invoice issued & receipt ready" : "Invoice issued", {
        description: created.invoiceNumber,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not issue invoice";
      toast.error("Issue failed", { description: msg });
    } finally {
      setBusyId(null);
    }
  };

  const markPaid = async (invoice: PlatformInvoice) => {
    if (mode !== "super_admin" || !tenantId) return;
    setBusyId(invoice.id);
    try {
      const updated = await markSuperAdminTenantInvoicePaid({
        tenantId,
        invoiceId: invoice.id,
        paymentMethod: invoice.paymentMethod || issueDraft?.paymentMethod,
      });
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success("Marked paid · receipt available", {
        description: updated.receiptNumber || updated.invoiceNumber,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not mark paid";
      toast.error("Update failed", { description: msg });
    } finally {
      setBusyId(null);
    }
  };

  const openInvoice = (invoice: PlatformInvoice) => {
    setPreview({
      kind: "invoice",
      invoice: { ...invoice, tenantName: invoice.tenantName || tenantName },
    });
  };

  const openReceipt = (invoice: PlatformInvoice) => {
    if (invoice.status !== "Paid" || !invoice.receiptNumber) {
      toast.error("Receipt unavailable", {
        description: "Mark the invoice paid to unlock the receipt",
      });
      return;
    }
    setPreview({
      kind: "receipt",
      invoice: { ...invoice, tenantName: invoice.tenantName || tenantName },
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <PlatformDocumentPreview
        open={Boolean(preview)}
        onOpenChange={(next) => {
          if (!next) setPreview(null);
        }}
        kind={preview?.kind || "invoice"}
        invoice={preview?.invoice || null}
        schoolHost={schoolHost}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
            Invoices & receipts
          </div>
          <p className="mt-0.5 text-[12px] text-black/55">
            {mode === "super_admin"
              ? "Platform subscription documents for this school"
              : "Your school’s platform subscription invoices and payment receipts"}
          </p>
        </div>
        {mode === "super_admin" && issueDraft ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={busyId === "issue"}
              onClick={() => void issueInvoice(false)}
            >
              {busyId === "issue" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Issue invoice
            </Button>
            <Button
              type="button"
              className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
              disabled={busyId === "issue"}
              onClick={() => void issueInvoice(true)}
            >
              <Receipt className="h-3.5 w-3.5" />
              Issue & mark paid
            </Button>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-[13px] text-black/45">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading documents…
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] text-black/45">
            No invoices yet
            {mode === "super_admin" ? " · issue one from the billing rules above" : ""}.
          </div>
        ) : (
          <ul className="divide-y divide-[#F0F0F0]">
            {rows.map((inv) => {
              const sym = CURRENCY_SYMBOL[inv.currency] ?? inv.currency;
              const paid = inv.status === "Paid";
              return (
                <li key={inv.id} className="grid grid-cols-12 items-center gap-2 px-3 py-3 sm:px-4">
                  <div className="col-span-12 min-w-0 sm:col-span-5">
                    <div className="truncate text-[13px] font-semibold text-black">
                      {inv.invoiceNumber}
                    </div>
                    <div className="mt-0.5 font-mono text-[10.5px] text-black/45">
                      {inv.issueDate} · {inv.periodLabel || inv.billingCycle}
                      {inv.receiptNumber ? ` · ${inv.receiptNumber}` : ""}
                    </div>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                        paid
                          ? "bg-[#CCFBF1] text-[#0F766E]"
                          : inv.status === "Overdue"
                            ? "bg-[#FEE2E2] text-[#EF4444]"
                            : inv.status === "Void"
                              ? "bg-[#F4F4F5] text-black/45"
                              : "bg-[#FEF3C7] text-[#B45309]",
                      )}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="col-span-8 text-right font-mono text-[13px] font-semibold text-black sm:col-span-2 sm:text-left">
                    {sym}
                    {Math.round(inv.total).toLocaleString("en-IN")}
                  </div>
                  <div className="col-span-12 flex flex-wrap justify-end gap-1.5 sm:col-span-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-full px-2.5 text-[11px]"
                      onClick={() => openInvoice(inv)}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Invoice
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-full px-2.5 text-[11px]"
                      disabled={!paid}
                      onClick={() => openReceipt(inv)}
                      title={paid ? "View receipt" : "Mark paid to unlock receipt"}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Receipt
                    </Button>
                    {mode === "super_admin" && !paid && inv.status !== "Void" ? (
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 rounded-full bg-black px-2.5 text-[11px] text-white hover:bg-black/85"
                        disabled={busyId === inv.id}
                        onClick={() => void markPaid(inv)}
                      >
                        {busyId === inv.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Mark paid"
                        )}
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
