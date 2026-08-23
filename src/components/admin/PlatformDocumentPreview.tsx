import { Download, Printer, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  downloadPlatformInvoicePdf,
  downloadPlatformReceiptPdf,
  isFlatPricing,
  platformCoverLine,
  platformLineDescription,
  platformMoney,
  type PlatformInvoiceDoc,
} from "@/lib/platform-invoice-export";
import { cn } from "@/lib/utils";

export type PlatformDocKind = "invoice" | "receipt";

type PlatformDocumentPreviewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: PlatformDocKind;
  invoice: PlatformInvoiceDoc | null;
  schoolHost?: string;
};

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#F8FAFC] px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
        {label}
      </div>
      <div className="mt-0.5 truncate text-[13px] font-semibold text-black">{value || "—"}</div>
    </div>
  );
}

export function PlatformDocumentPreview({
  open,
  onOpenChange,
  kind,
  invoice,
  schoolHost,
}: PlatformDocumentPreviewProps) {
  if (!invoice) return null;

  const isReceipt = kind === "receipt";
  const title = isReceipt ? "Payment receipt" : "Tax invoice";
  const refNo = isReceipt
    ? invoice.receiptNumber || invoice.invoiceNumber
    : invoice.invoiceNumber;
  const school = invoice.tenantName || "School tenant";
  const paidAt = invoice.paidAt
    ? String(invoice.paidAt).slice(0, 16).replace("T", " ")
    : "—";
  const totalLabel = isReceipt ? "Amount received" : "Total due";

  const onDownload = () => {
    try {
      if (isReceipt) {
        downloadPlatformReceiptPdf(invoice, { schoolHost });
      } else {
        downloadPlatformInvoicePdf(invoice, { schoolHost });
      }
    } catch (err) {
      // Panel toast handles most cases; keep preview resilient.
      console.error(err);
    }
  };

  const onPrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[92vh] w-[min(920px,calc(100vw-1.25rem))] flex-col gap-0 overflow-hidden rounded-2xl border border-[#E5E5E5] bg-[#F4F4F5] p-0",
          "print:max-h-none print:w-full print:max-w-none print:rounded-none print:border-0 print:bg-white print:p-0",
        )}
      >
        <DialogHeader className="shrink-0 border-b border-[#E5E5E5] bg-white px-4 py-3 sm:px-5 print:hidden">
          <DialogTitle className="text-[16px] font-semibold text-black">{title}</DialogTitle>
          <DialogDescription className="font-mono text-[12px] text-black/55">
            {refNo} · {invoice.status}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4 print:overflow-visible print:p-0">
          <article
            className={cn(
              "mx-auto w-full max-w-[780px] overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-sm",
              "print:max-w-none print:rounded-none print:border-0 print:shadow-none",
            )}
          >
            <header className="flex flex-col gap-2 bg-[#0F766E] px-4 py-4 text-white sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-5">
              <div className="min-w-0">
                <div className="text-[18px] font-bold tracking-tight sm:text-[20px]">
                  {isReceipt ? "PAYMENT RECEIPT" : "TAX INVOICE"}
                </div>
                <div className="mt-1 font-mono text-[12px] text-teal-100">
                  {refNo} · {invoice.status}
                </div>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <div className="text-[18px] font-bold sm:text-[20px]">
                  {platformMoney(invoice.currency, invoice.total)}
                </div>
                <div className="mt-0.5 text-[11px] text-teal-100">Feezo Platform</div>
              </div>
            </header>

            <div className="grid grid-cols-1 gap-4 border-b border-[#EFEFEF] px-4 py-4 sm:grid-cols-2 sm:gap-6 sm:px-6">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                  {isReceipt ? "Received from" : "Billed to"}
                </div>
                <div className="mt-1 text-[14px] font-semibold text-black">{school}</div>
                {invoice.tenantId ? (
                  <div className="mt-0.5 font-mono text-[12px] text-black/55">
                    Tenant {invoice.tenantId}
                  </div>
                ) : null}
                {schoolHost ? (
                  <div className="mt-0.5 break-all text-[12px] text-black/55">{schoolHost}</div>
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                  {isReceipt ? "Received by" : "From"}
                </div>
                <div className="mt-1 text-[14px] font-semibold text-black">
                  Feezo
                </div>
                <div className="mt-0.5 text-[12px] text-black/55">
                  {isReceipt ? "Subscription settlement" : "SaaS subscription billing"}
                </div>
                <div className="mt-0.5 text-[12px] text-black/55">
                  {isReceipt ? "accounts@schoolaccounts.in" : "support@feezo.app"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-2 sm:px-6">
              {isReceipt ? (
                <>
                  <MetaCell label="Invoice" value={invoice.invoiceNumber} />
                  <MetaCell label="Paid at" value={paidAt} />
                  <MetaCell label="Method" value={invoice.paymentMethod || "—"} />
                  <MetaCell label="Reference" value={invoice.paymentRef || "—"} />
                  <MetaCell
                    label="Period"
                    value={invoice.periodLabel || invoice.billingCycle}
                  />
                  <MetaCell label="Cycle" value={invoice.billingCycle} />
                </>
              ) : (
                <>
                  <MetaCell label="Issue date" value={invoice.issueDate} />
                  <MetaCell label="Due date" value={invoice.dueDate} />
                  <MetaCell
                    label="Period"
                    value={invoice.periodLabel || invoice.billingCycle}
                  />
                  <MetaCell label="Cycle" value={invoice.billingCycle} />
                </>
              )}
            </div>

            <div className="px-4 pb-3 sm:px-6">
              <div className="overflow-hidden rounded-xl border border-[#E5E5E5]">
                <div className="grid grid-cols-12 bg-[#0F766E] px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white">
                  <div className="col-span-8 sm:col-span-9">Description</div>
                  <div className="col-span-4 text-right sm:col-span-3">Amount</div>
                </div>
                {isReceipt ? (
                  <div className="grid grid-cols-12 gap-2 bg-[#CCFBF1] px-3 py-3 text-[13px]">
                    <div className="col-span-8 min-w-0 break-words text-black sm:col-span-9">
                      {platformLineDescription(invoice)}
                    </div>
                    <div className="col-span-4 text-right font-semibold tabular-nums text-black sm:col-span-3">
                      {platformMoney(invoice.currency, invoice.total)}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-12 gap-2 border-b border-[#F0F0F0] px-3 py-3 text-[13px]">
                      <div className="col-span-8 min-w-0 break-words text-black sm:col-span-9">
                        {platformLineDescription(invoice)}
                      </div>
                      <div className="col-span-4 text-right font-semibold tabular-nums text-black sm:col-span-3">
                        {platformMoney(invoice.currency, invoice.subtotal)}
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-2 border-b border-[#F0F0F0] bg-[#F0FDFA] px-3 py-2.5 text-[13px]">
                      <div className="col-span-8 text-black/70 sm:col-span-9">
                        Discount ({invoice.discountPercent}%)
                      </div>
                      <div className="col-span-4 text-right tabular-nums text-black sm:col-span-3">
                        − {platformMoney(invoice.currency, invoice.discountAmount)}
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-2 px-3 py-2.5 text-[13px]">
                      <div className="col-span-8 text-black/70 sm:col-span-9">
                        Tax / GST ({invoice.taxPercent}%)
                      </div>
                      <div className="col-span-4 text-right tabular-nums text-black sm:col-span-3">
                        {platformMoney(invoice.currency, invoice.taxAmount)}
                      </div>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-12 gap-2 bg-[#0F766E] px-3 py-3 text-[14px] font-bold text-white">
                  <div className="col-span-8 sm:col-span-9">{totalLabel}</div>
                  <div className="col-span-4 text-right tabular-nums sm:col-span-3">
                    {platformMoney(invoice.currency, invoice.total)}
                  </div>
                </div>
              </div>

              {isReceipt ? (
                <p className="mt-3 text-[12px] leading-relaxed text-black/55">
                  {platformCoverLine(invoice)} Thank you for your payment.
                </p>
              ) : null}
              {invoice.notes ? (
                <p className="mt-2 text-[12px] text-black/45">Notes: {invoice.notes}</p>
              ) : null}
              {isFlatPricing(invoice) ? (
                <p className="mt-1 text-[11px] text-black/40">Pricing model: flat per cycle</p>
              ) : (
                <p className="mt-1 text-[11px] text-black/40">Pricing model: per student</p>
              )}
            </div>
          </article>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#E5E5E5] bg-white px-4 py-3 sm:px-5 print:hidden">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-3.5 w-3.5" /> Close
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={onPrint}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
            <Button
              type="button"
              className="rounded-full bg-black text-white hover:bg-black/85"
              onClick={onDownload}
            >
              <Download className="h-3.5 w-3.5" /> Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
