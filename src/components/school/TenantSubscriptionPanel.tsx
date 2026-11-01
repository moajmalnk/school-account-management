import { useNavigate } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Lock,
  Receipt,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  PlatformDocumentPreview,
  type PlatformDocKind,
} from "@/components/admin/PlatformDocumentPreview";
import { PlanFeatureDetailDialog } from "@/components/school/PlanFeatureDetailDialog";
import {
  SubscriptionRenewDialog,
  type SubscriptionCycle,
} from "@/components/school/SubscriptionRenewDialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import {
  SUBSCRIPTION_CHECKOUT_PATH,
  confirmSubscriptionCheckout,
  fetchTenantSubscription,
  resumeSubscriptionCheckout,
  startSubscriptionCheckout,
  type TenantSubscription,
} from "@/lib/api/subscription";
import { checkoutReturnUrl, openCashfreeCheckout } from "@/lib/cashfree-checkout";
import type { PlatformInvoice } from "@/lib/api/super-admin";
import { PLAN_FEATURE_ITEMS, type PlanFlags } from "@/lib/permissions";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

const AUTO_RENEW_KEY = "school-accounts/subscription-auto-renew";

type DisplayStatus = "Active" | "Trial" | "Expires soon" | "Overdue" | "Suspended";

type TenantSubscriptionPanelProps = {
  tenantName: string;
  tenantId?: string;
  schoolHost?: string;
  returnOrderId?: string;
};

function autoRenewStorageKey(tenantId?: string): string {
  return `${AUTO_RENEW_KEY}/${tenantId || "default"}`;
}

function readAutoRenew(tenantId?: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(autoRenewStorageKey(tenantId)) === "1";
  } catch {
    return false;
  }
}

function writeAutoRenew(tenantId: string | undefined, value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(autoRenewStorageKey(tenantId), value ? "1" : "0");
  } catch {
    // ignore quota / private mode
  }
}

function daysUntil(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split("-").map(Number);
  const target = new Date(y, (m || 1) - 1, d || 1);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

function normalizeCycle(value: string | undefined): SubscriptionCycle {
  if (value === "Annual" || value === "Annually") return "Annual";
  return "Monthly";
}

function latestOpenInvoice(invoices: PlatformInvoice[]): PlatformInvoice | undefined {
  return invoices.find((inv) => inv.status !== "Void");
}

function unpaidInvoice(invoices: PlatformInvoice[]): PlatformInvoice | undefined {
  return invoices.find((inv) => inv.status === "Issued" || inv.status === "Overdue");
}

function resolveDisplayStatus(
  tenantStatus: string,
  renewalDate: string | null,
  latest: PlatformInvoice | undefined,
): DisplayStatus {
  const days = daysUntil(renewalDate);
  if (tenantStatus === "Suspended") return "Suspended";
  if (tenantStatus === "Overdue" || latest?.status === "Overdue") return "Overdue";
  if (days !== null && days <= 7) return "Expires soon";
  if (tenantStatus === "Trial") return "Trial";
  return "Active";
}

function statusBadgeClass(status: DisplayStatus): string {
  if (status === "Active") return "bg-[#CCFBF1] text-[#0F766E]";
  if (status === "Trial") return "bg-[#E0F2FE] text-[#0369A1]";
  if (status === "Expires soon") return "bg-[#FFEDD5] text-[#C2410C]";
  return "bg-[#FEE2E2] text-[#DC2626]";
}

function invoiceStatusClass(status: string): string {
  if (status === "Paid") return "bg-[#CCFBF1] text-[#0F766E]";
  if (status === "Overdue") return "bg-[#FEE2E2] text-[#EF4444]";
  if (status === "Void") return "bg-[#F4F4F5] text-black/45 dark:bg-zinc-800 dark:text-zinc-500";
  return "bg-[#FEF3C7] text-[#B45309]";
}

function InvoiceDocRow({
  invoice,
  currency,
  onInvoice,
  onReceipt,
}: {
  invoice: PlatformInvoice;
  currency: string;
  onInvoice: () => void;
  onReceipt: () => void;
}) {
  const paid = invoice.status === "Paid";
  return (
    <li className="group px-4 py-3.5 transition-colors hover:bg-[#FAFAFA] dark:hover:bg-white/[0.03] sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-semibold tracking-tight text-black dark:text-zinc-50">
            {invoice.invoiceNumber}
          </div>
          <div className="mt-1 text-[11.5px] leading-snug text-black/45 dark:text-zinc-500">
            {invoice.issueDate}
            {invoice.periodLabel ? ` · ${invoice.periodLabel}` : ` · ${invoice.billingCycle}`}
            {invoice.nextDueDate ? ` · next ${invoice.nextDueDate}` : ""}
            {invoice.receiptNumber ? ` · ${invoice.receiptNumber}` : ""}
          </div>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-semibold tracking-wide",
            invoiceStatusClass(invoice.status),
          )}
        >
          {invoice.status}
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="text-[14px] font-semibold tabular-nums tracking-tight text-black dark:text-zinc-50">
          {formatMoney(invoice.total, invoice.currency || currency)}
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-[#E5E5E5] px-2.5 text-[11.5px] font-medium dark:border-white/10"
            onClick={onInvoice}
          >
            <FileText className="h-3.5 w-3.5" />
            Invoice
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-[#E5E5E5] px-2.5 text-[11.5px] font-medium dark:border-white/10"
            disabled={!paid}
            onClick={onReceipt}
          >
            <Download className="h-3.5 w-3.5" />
            Receipt
          </Button>
        </div>
      </div>
    </li>
  );
}

function DocumentsEmptyState({ schoolLabel }: { schoolLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#0F766E] to-[#0D9488] text-white">
        <Receipt className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <p className="mt-4 text-[15px] font-semibold tracking-tight text-black dark:text-zinc-50">
        No invoices yet
      </p>
      <p className="mt-1.5 max-w-[17rem] text-[13px] leading-relaxed text-black/50 dark:text-zinc-400">
        Bills for {schoolLabel} appear here after a collection is recorded. Download the invoice and
        receipt from each one.
      </p>
    </div>
  );
}

function MetaCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-black/35 dark:text-zinc-500">
        {label}
      </div>
      <div className="mt-1.5 text-[13.5px] font-medium text-black dark:text-zinc-100">{children}</div>
    </div>
  );
}

export function TenantSubscriptionPanel({
  tenantName,
  tenantId,
  schoolHost,
  returnOrderId,
}: TenantSubscriptionPanelProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<TenantSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRenew, setAutoRenew] = useState(() => readAutoRenew(tenantId));
  const [renewOpen, setRenewOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const payingRef = useRef(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [featureDetail, setFeatureDetail] = useState<{
    key: keyof PlanFlags;
    label: string;
    included: boolean;
  } | null>(null);
  const [preview, setPreview] = useState<{
    kind: PlatformDocKind;
    invoice: PlatformInvoice;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchTenantSubscription();
      setData(next);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load subscription";
      toast.error("Subscription unavailable", { description: msg });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmedReturn = useRef("");
  useEffect(() => {
    if (!returnOrderId || confirmedReturn.current === returnOrderId) return;
    confirmedReturn.current = returnOrderId;
    void (async () => {
      try {
        const paid = await confirmSubscriptionCheckout(returnOrderId);
        toast.success("Plan renewed", {
          description: paid.receiptNumber
            ? `Receipt ${paid.receiptNumber}. Next due ${paid.nextDueDate}.`
            : "Cashfree confirmed this invoice.",
        });
        await load();
      } catch (err) {
        const pending = err instanceof ApiError && err.status === 409;
        toast.error(pending ? "Payment is still processing" : "Could not confirm the payment", {
          description: err instanceof ApiError ? err.message : "Refresh this page in a moment.",
        });
      } finally {
        void navigate({
          to: "/tenant/settings",
          search: { tab: "subscription" },
          replace: true,
        });
      }
    })();
  }, [returnOrderId, load, navigate]);

  useEffect(() => {
    setAutoRenew(readAutoRenew(tenantId));
  }, [tenantId]);

  const handleAutoRenew = (next: boolean) => {
    setAutoRenew(next);
    writeAutoRenew(tenantId, next);
    toast.success(next ? "Auto-renewal on" : "Auto-renewal off", {
      description: next
        ? "We’ll remind you before the due date. Online auto-charge is not enabled yet."
        : "You can turn this back on anytime.",
    });
  };

  const invoices = data?.invoices ?? [];
  const latest = latestOpenInvoice(invoices);
  const outstanding = unpaidInvoice(invoices);
  const planName = data?.planName || data?.tier || "Basic";
  const cycle = normalizeCycle(data?.billingCycle || latest?.billingCycle);
  const renewalDate = data?.renewalDate || latest?.nextDueDate || latest?.dueDate || null;
  const currency = data?.currency || latest?.currency || "INR";
  const lastTotal = latest ? Number(latest.total) || 0 : 0;
  const catalogMonthly = data?.monthly || 0;
  const catalogAnnual = data?.annually || 0;
  const monthly =
    catalogMonthly ||
    (cycle === "Monthly" ? lastTotal : 0) ||
    (catalogAnnual ? Math.round(catalogAnnual / 12) : 0);
  const annually =
    catalogAnnual || (cycle === "Annual" ? lastTotal : 0) || (monthly > 0 ? monthly * 12 : 0);
  const hintedNext = Number(latest?.nextAmount) > 0 ? Number(latest?.nextAmount) : 0;
  const scheduled =
    data?.renewalAmount != null && data.renewalAmount > 0
      ? data.renewalAmount
      : hintedNext || lastTotal;
  const rowPrice = latest ? scheduled : cycle === "Annual" ? annually || lastTotal : monthly || lastTotal;
  const displayStatus = resolveDisplayStatus(data?.status || "Active", renewalDate, latest);
  const showAlert =
    displayStatus === "Expires soon" || displayStatus === "Overdue" || Boolean(outstanding);

  const schoolLabel = data?.tenantName || tenantName;
  const days = daysUntil(renewalDate);
  const includedCount = data
    ? PLAN_FEATURE_ITEMS.filter((feature) => data.planFlags[feature.key]).length
    : 0;
  const featureTotal = PLAN_FEATURE_ITEMS.length;

  const alertCopy = useMemo(() => {
    if (outstanding) {
      return `Invoice ${outstanding.invoiceNumber} is ${outstanding.status.toLowerCase()}. Settle it to keep ${planName} running.`;
    }
    if (displayStatus === "Overdue") {
      return `Your ${planName} plan is overdue${renewalDate ? ` (${renewalDate})` : ""}. Renew to restore full access.`;
    }
    if (days !== null && days < 0) {
      return `Your ${planName} plan ended on ${renewalDate}. Renew to keep it yours.`;
    }
    if (days !== null) {
      return `Your ${planName} plan renews on ${renewalDate}. You have ${days} day${days === 1 ? "" : "s"} to renew.`;
    }
    return `Your ${planName} plan is ready to renew.`;
  }, [outstanding, displayStatus, planName, renewalDate, days]);

  const openInvoice = (invoice: PlatformInvoice) => {
    setPreview({
      kind: "invoice",
      invoice: { ...invoice, tenantName: invoice.tenantName || schoolLabel },
    });
  };

  const openReceipt = (invoice: PlatformInvoice) => {
    if (invoice.status !== "Paid" || !invoice.receiptNumber) {
      toast.error("Receipt unavailable", {
        description: "This invoice must be paid before a receipt is issued.",
      });
      return;
    }
    setPreview({
      kind: "receipt",
      invoice: { ...invoice, tenantName: invoice.tenantName || schoolLabel },
    });
  };

  async function finishPaid(orderId: string) {
    const paid = await confirmSubscriptionCheckout(orderId);
    toast.success("Plan renewed", {
      description: paid.receiptNumber
        ? `Receipt ${paid.receiptNumber}. Next due ${paid.nextDueDate}.`
        : "Cashfree confirmed this invoice.",
    });
    setRenewOpen(false);
    await load();
  }

  async function runCheckout(paymentSessionId: string, orderId: string) {
    const outcome = await openCashfreeCheckout(
      paymentSessionId,
      checkoutReturnUrl(SUBSCRIPTION_CHECKOUT_PATH, orderId),
    );
    if (outcome === "redirect") return;
    if (outcome === "closed") {
      toast.message("Payment in progress", {
        description: "Tap Continue payment on this page to finish checkout.",
      });
      await load();
      return;
    }
    await finishPaid(orderId);
  }

  const completePayment = (selectedCycle: SubscriptionCycle) => {
    if (payingRef.current) return;
    payingRef.current = true;
    setPaying(true);
    void (async () => {
      try {
        const order = await startSubscriptionCheckout(selectedCycle);
        setRenewOpen(false);
        if (order.paid || !order.paymentSessionId) {
          await finishPaid(order.orderId);
          return;
        }
        await runCheckout(order.paymentSessionId, order.orderId);
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not start payment",
        );
        await load();
      } finally {
        payingRef.current = false;
        setPaying(false);
      }
    })();
  };

  const continuePayment = () => {
    const pending = data?.pendingCheckout;
    if (!pending?.orderId || payingRef.current) return;
    payingRef.current = true;
    setPaying(true);
    void (async () => {
      try {
        const order = await resumeSubscriptionCheckout(pending.orderId);
        if (order.paid || !order.paymentSessionId) {
          await finishPaid(order.orderId);
          return;
        }
        await runCheckout(order.paymentSessionId, order.orderId);
      } catch (err) {
        const expired = err instanceof ApiError && (err.status === 409 || err.status === 404);
        toast.error(expired ? "This payment expired" : "Could not reopen the payment", {
          description: err instanceof ApiError ? err.message : "Tap Renew and pay again.",
        });
        await load();
      } finally {
        payingRef.current = false;
        setPaying(false);
      }
    })();
  };

  return (
    <div className="space-y-5">
      <PlatformDocumentPreview
        open={Boolean(preview)}
        onOpenChange={(next) => {
          if (!next) setPreview(null);
        }}
        kind={preview?.kind || "invoice"}
        invoice={preview?.invoice || null}
        schoolHost={schoolHost}
      />

      <SubscriptionRenewDialog
        open={renewOpen}
        onOpenChange={setRenewOpen}
        planName={planName}
        monthly={monthly || lastTotal}
        annually={annually || lastTotal}
        currency={currency}
        currentCycle={cycle}
        renewalDate={renewalDate}
        autoRenew={autoRenew}
        onAutoRenewChange={handleAutoRenew}
        onComplete={completePayment}
        paying={paying}
        chargeNote={
          outstanding
            ? `Pays invoice ${outstanding.invoiceNumber} (${formatMoney(Number(outstanding.total) || 0, currency)}) via Cashfree.`
            : null
        }
      />

      <PlanFeatureDetailDialog
        featureKey={featureDetail?.key ?? null}
        featureLabel={featureDetail?.label ?? ""}
        included={Boolean(featureDetail?.included)}
        open={Boolean(featureDetail)}
        onOpenChange={(next) => {
          if (!next) setFeatureDetail(null);
        }}
      />

      <Sheet open={docsOpen} onOpenChange={setDocsOpen}>
        <SheetContent
          side="right"
          className="flex w-[min(100%,28rem)] flex-col gap-0 overflow-y-auto border-l border-[#E5E5E5] bg-white p-5 dark:border-white/10 dark:bg-zinc-950 sm:max-w-md"
        >
          <SheetHeader className="pr-10 text-left">
            <SheetTitle className="text-[18px] text-black dark:text-zinc-50">
              {planName} plan
            </SheetTitle>
            <SheetDescription className="text-[13px] text-black/55 dark:text-zinc-400">
              Invoices and receipts for {schoolLabel}. Organization-wide — not scoped per campus.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-5 flex-1">
            {invoices.length === 0 ? (
              <DocumentsEmptyState schoolLabel={schoolLabel} />
            ) : (
              <ul className="divide-y divide-[#F0F0F0] overflow-hidden rounded-2xl border border-[#E5E5E5] dark:divide-white/10 dark:border-white/10">
                {invoices.map((inv) => (
                  <InvoiceDocRow
                    key={inv.id}
                    invoice={inv}
                    currency={currency}
                    onInvoice={() => openInvoice(inv)}
                    onReceipt={() => openReceipt(inv)}
                  />
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {!loading && data?.pendingCheckout ? (
        <div className="overflow-hidden rounded-[22px] border border-[#F5D98A]/80 bg-[#FFF8E8] p-5 dark:border-[#A16207]/40 dark:bg-[#3d3420]/80">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#D4920A] ring-1 ring-[#F5D98A]/70 dark:bg-zinc-900 dark:ring-white/10">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#A16207]/80 dark:text-[#FBBF24]/70">
                {data.pendingCheckout.invoiceNumber
                  ? `Invoice ${data.pendingCheckout.invoiceNumber}`
                  : `${planName} renewal`}
              </p>
              <p className="mt-1 text-[15px] font-semibold tracking-tight text-black dark:text-zinc-50">
                {planName} plan · {data.pendingCheckout.billingCycle}
              </p>
              <p className="mt-0.5 text-[12.5px] text-black/50 dark:text-zinc-400">
                {schoolLabel} · Payment in progress
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between gap-3 sm:pl-[3.25rem]">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-black/40 dark:text-zinc-500">
                Status
              </p>
              <p className="mt-1 text-[13.5px] font-semibold text-[#E11D48]">Due now</p>
            </div>
            <div className="text-right">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-black/40 dark:text-zinc-500">
                Amount
              </p>
              <p className="mt-1 text-[15px] font-semibold tabular-nums tracking-tight text-black dark:text-zinc-50">
                {formatMoney(data.pendingCheckout.amount, currency)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            disabled={paying}
            onClick={() => continuePayment()}
            className="mt-4 h-11 w-full rounded-xl bg-[#FFC542] text-[13px] font-semibold text-[#1A1A4B] hover:bg-[#F0B429]"
          >
            {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Continue payment
          </Button>
        </div>
      ) : null}

      {showAlert && !loading && !data?.pendingCheckout ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[#FDBA74]/50 bg-[#FFF7ED] px-4 py-3.5 dark:border-[#C2410C]/30 dark:bg-[#C2410C]/15">
          <div className="flex min-w-0 items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#C2410C]" />
            <p className="text-[13px] leading-snug text-[#9A3412] dark:text-[#FDBA74]">
              {alertCopy}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="h-9 rounded-xl bg-[#F59E0B] px-3.5 text-[12.5px] font-semibold text-black hover:bg-[#D97706]"
            onClick={() => setRenewOpen(true)}
          >
            Renew
          </Button>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[22px] border border-[#E5E5E5] bg-white dark:border-white/10 dark:bg-zinc-900">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-16 text-[13px] text-black/45 dark:text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading subscription…
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden border-b border-[#F0F0F0] px-5 py-5 sm:px-6 sm:py-6 dark:border-white/10">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(15,118,110,0.10),transparent_55%),linear-gradient(180deg,#F8FFFD_0%,#FFFFFF_72%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(15,118,110,0.18),transparent_55%),linear-gradient(180deg,#0F1F1D_0%,#18181B_72%)]"
              />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <button
                  type="button"
                  className="min-w-0 rounded-xl text-left outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#0F766E]/35"
                  onClick={() => setDocsOpen(true)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0F766E] text-white">
                      <Sparkles className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide",
                        statusBadgeClass(displayStatus),
                      )}
                    >
                      {displayStatus === "Expires soon" || displayStatus === "Overdue" ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : null}
                      {displayStatus}
                    </span>
                  </div>
                  <h2 className="mt-3 text-[22px] font-semibold tracking-tight text-black dark:text-zinc-50">
                    {planName} plan
                  </h2>
                  <p className="mt-1 text-[13px] text-black/50 dark:text-zinc-400">{schoolLabel}</p>
                </button>

                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  {data?.pendingCheckout ? (
                    <Button
                      type="button"
                      disabled={paying}
                      className="h-10 rounded-xl bg-[#FFC542] px-4 text-[13px] font-semibold text-[#1A1A4B] hover:bg-[#F0B429]"
                      onClick={() => continuePayment()}
                    >
                      {paying ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                      Continue payment
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="h-10 rounded-xl bg-[#0F766E] px-4 text-[13px] font-semibold text-white hover:bg-[#0D9488]"
                      onClick={() => setRenewOpen(true)}
                    >
                      Renew plan
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl border-[#E5E5E5] px-3 text-[13px] font-medium dark:border-white/10"
                    onClick={() => setDocsOpen(true)}
                  >
                    Documents
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 px-5 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
              <MetaCell label="Renewal date">
                <span className="tabular-nums">{renewalDate || "—"}</span>
              </MetaCell>
              <MetaCell label="Renewal price">
                <span className="text-[15px] font-semibold tabular-nums tracking-tight">
                  {rowPrice > 0 ? formatMoney(rowPrice, currency) : "—"}
                </span>
                <span className="mt-0.5 block text-[11.5px] font-normal text-black/40 dark:text-zinc-500">
                  {cycle === "Annual" ? "Billed yearly" : "Billed monthly"}
                </span>
              </MetaCell>
              <MetaCell label="Auto-renewal">
                <div className="flex items-center gap-2.5">
                  <Switch
                    checked={autoRenew}
                    onCheckedChange={handleAutoRenew}
                    className="data-[state=checked]:bg-[#0F766E]"
                    aria-label="Auto-renewal preference"
                  />
                  <span className="text-[12.5px] font-medium text-black/55 dark:text-zinc-400">
                    {autoRenew ? "On" : "Off"}
                  </span>
                </div>
              </MetaCell>
              <MetaCell label="Features">
                <span className="tabular-nums">
                  {includedCount}
                  <span className="font-normal text-black/40 dark:text-zinc-500">
                    {" "}
                    of {featureTotal} included
                  </span>
                </span>
              </MetaCell>
            </div>
          </>
        )}
      </section>

      {!loading && data ? (
        <section className="overflow-hidden rounded-[22px] border border-[#E5E5E5] bg-white dark:border-white/10 dark:bg-zinc-900">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#F0F0F0] px-5 py-4 sm:px-6 dark:border-white/10">
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold tracking-tight text-black dark:text-zinc-50">
                Features included
              </h3>
              <p className="mt-1 text-[12.5px] text-black/50 dark:text-zinc-400">
                On your {planName} plan · locked items unlock with an upgrade
              </p>
            </div>
            <span className="rounded-md bg-[#F0FDFA] px-2 py-1 text-[11px] font-semibold tabular-nums text-[#0F766E] dark:bg-[#0F766E]/20 dark:text-[#5EEAD4]">
              {includedCount}/{featureTotal}
            </span>
          </div>
          <ul className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 sm:gap-2.5 sm:p-4">
            {PLAN_FEATURE_ITEMS.map((feature) => {
              const on = Boolean(data.planFlags[feature.key]);
              return (
                <li
                  key={feature.key}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 sm:gap-3 sm:px-3.5 sm:py-2.5",
                    on
                      ? "bg-[#F0FDFA]/80 ring-1 ring-[#99F6E4]/50 dark:bg-[#0F766E]/15 dark:ring-[#0F766E]/30"
                      : "bg-[#F7F7F8] ring-1 ring-transparent dark:bg-white/[0.04]",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                      on
                        ? "bg-[#0F766E] text-white"
                        : "bg-white text-black/30 ring-1 ring-[#E5E5E5] dark:bg-zinc-800 dark:text-zinc-500 dark:ring-white/10",
                    )}
                  >
                    {on ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={2.75} aria-hidden />
                    ) : (
                      <Lock className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                    )}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[13px]",
                      on
                        ? "font-medium text-black dark:text-zinc-50"
                        : "text-black/40 dark:text-zinc-500",
                    )}
                  >
                    {feature.label}
                  </span>
                  {!on ? (
                    <span className="hidden shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-black/28 sm:inline dark:text-zinc-600">
                      Locked
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 shrink-0 rounded-lg px-2 text-[11.5px] font-semibold",
                      on
                        ? "text-[#0F766E] hover:bg-[#CCFBF1]/70 hover:text-[#0F766E]"
                        : "text-black/45 hover:bg-black/5 hover:text-black/70 dark:text-zinc-400 dark:hover:bg-white/10",
                    )}
                    onClick={() =>
                      setFeatureDetail({
                        key: feature.key,
                        label: feature.label,
                        included: on,
                      })
                    }
                  >
                    Details
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[22px] border border-[#E5E5E5] bg-white dark:border-white/10 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-3 border-b border-[#F0F0F0] px-5 py-4 sm:px-6 dark:border-white/10">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold tracking-tight text-black dark:text-zinc-50">
              Invoices & receipts
            </h3>
            <p className="mt-1 text-[12.5px] text-black/50 dark:text-zinc-400">
              Platform subscription documents for {schoolLabel}
            </p>
          </div>
          {invoices.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 rounded-lg px-2 text-[12.5px] font-medium text-black/55 hover:text-black dark:text-zinc-400"
              onClick={() => setDocsOpen(true)}
            >
              View all
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-[13px] text-black/45 dark:text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading documents…
          </div>
        ) : invoices.length === 0 ? (
          <DocumentsEmptyState schoolLabel={schoolLabel} />
        ) : (
          <ul className="divide-y divide-[#F0F0F0] dark:divide-white/10">
            {invoices.slice(0, 4).map((inv) => (
              <InvoiceDocRow
                key={inv.id}
                invoice={inv}
                currency={currency}
                onInvoice={() => openInvoice(inv)}
                onReceipt={() => openReceipt(inv)}
              />
            ))}
          </ul>
        )}
      </section>

      <p className="px-1 text-[12px] leading-relaxed text-black/40 dark:text-zinc-500">
        Auto-renewal is a reminder preference only. Online auto-charge is not enabled yet.
      </p>
    </div>
  );
}
