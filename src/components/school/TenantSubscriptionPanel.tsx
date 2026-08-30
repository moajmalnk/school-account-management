import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

import {
  PlatformDocumentPreview,
  type PlatformDocKind,
} from "@/components/admin/PlatformDocumentPreview";
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
import { fetchTenantSubscription, type TenantSubscription } from "@/lib/api/subscription";
import type { PlatformInvoice } from "@/lib/api/super-admin";
import { PLAN_FEATURE_ITEMS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const CURRENCY_SYMBOL: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
};

const AUTO_RENEW_KEY = "school-accounts/subscription-auto-renew";

type DisplayStatus = "Active" | "Trial" | "Expires soon" | "Overdue" | "Suspended";

type TenantSubscriptionPanelProps = {
  tenantName: string;
  tenantId?: string;
  schoolHost?: string;
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

function formatMoney(symbol: string, amount: number): string {
  return `${symbol} ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

function statusClass(status: DisplayStatus): string {
  if (status === "Active") return "text-[#0F766E]";
  if (status === "Trial") return "text-[#0F766E]";
  if (status === "Expires soon") return "text-[#C2410C]";
  return "text-[#EF4444]";
}

function invoiceStatusClass(status: string): string {
  if (status === "Paid") return "bg-[#CCFBF1] text-[#0F766E]";
  if (status === "Overdue") return "bg-[#FEE2E2] text-[#EF4444]";
  if (status === "Void") return "bg-[#F4F4F5] text-black/45 dark:bg-zinc-800 dark:text-zinc-500";
  return "bg-[#FEF3C7] text-[#B45309]";
}

function InvoiceDocRow({
  invoice,
  symbol,
  onInvoice,
  onReceipt,
}: {
  invoice: PlatformInvoice;
  symbol: string;
  onInvoice: () => void;
  onReceipt: () => void;
}) {
  const paid = invoice.status === "Paid";
  return (
    <li className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-black dark:text-zinc-50">
            {invoice.invoiceNumber}
          </div>
          <div className="mt-0.5 font-mono text-[10.5px] text-black/45 dark:text-zinc-500">
            {invoice.issueDate}
            {invoice.periodLabel ? ` · ${invoice.periodLabel}` : ` · ${invoice.billingCycle}`}
            {invoice.receiptNumber ? ` · ${invoice.receiptNumber}` : ""}
          </div>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
            invoiceStatusClass(invoice.status),
          )}
        >
          {invoice.status}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="font-mono text-[13px] font-semibold text-black dark:text-zinc-50">
          {formatMoney(CURRENCY_SYMBOL[invoice.currency] ?? symbol, invoice.total)}
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-2.5 text-[11px]"
            onClick={onInvoice}
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
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#0F766E] text-white shadow-sm">
        <Receipt className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <p className="mt-4 text-[15px] font-semibold text-black dark:text-zinc-50">No invoices yet</p>
      <p className="mt-1 max-w-[16rem] text-[13px] leading-snug text-black/50 dark:text-zinc-400">
        Feezo will issue the first invoice and receipt for this plan. Documents for {schoolLabel}{" "}
        will show up here.
      </p>
    </div>
  );
}

export function TenantSubscriptionPanel({
  tenantName,
  tenantId,
  schoolHost,
}: TenantSubscriptionPanelProps) {
  const [data, setData] = useState<TenantSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRenew, setAutoRenew] = useState(() => readAutoRenew(tenantId));
  const [renewOpen, setRenewOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
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
  const renewalDate = data?.renewalDate || latest?.dueDate || null;
  const symbol = CURRENCY_SYMBOL[data?.currency ?? "INR"] ?? data?.currency ?? "₹";
  const lastTotal = latest ? Number(latest.total) || 0 : 0;
  const catalogMonthly = data?.monthly || 0;
  const catalogAnnual = data?.annually || 0;
  const monthly =
    catalogMonthly ||
    (cycle === "Monthly" ? lastTotal : 0) ||
    (catalogAnnual ? Math.round(catalogAnnual / 12) : 0);
  const annually =
    catalogAnnual || (cycle === "Annual" ? lastTotal : 0) || (monthly > 0 ? monthly * 12 : 0);
  const rowPrice = cycle === "Annual" ? annually || lastTotal : monthly || lastTotal;
  const displayStatus = resolveDisplayStatus(data?.status || "Active", renewalDate, latest);
  const showAlert =
    displayStatus === "Expires soon" || displayStatus === "Overdue" || Boolean(outstanding);

  const schoolLabel = data?.tenantName || tenantName;
  const days = daysUntil(renewalDate);

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

  const completePayment = () => {
    setRenewOpen(false);
    if (outstanding) {
      openInvoice(outstanding);
      return;
    }
    toast.success("Your plan is current", {
      description: renewalDate
        ? `Feezo will issue the next invoice before ${renewalDate}.`
        : "Feezo will issue the next invoice when this period is due.",
    });
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
        currencySymbol={symbol}
        currentCycle={cycle}
        renewalDate={renewalDate}
        autoRenew={autoRenew}
        onAutoRenewChange={handleAutoRenew}
        onComplete={completePayment}
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
                    symbol={symbol}
                    onInvoice={() => openInvoice(inv)}
                    onReceipt={() => openReceipt(inv)}
                  />
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-black dark:text-zinc-50 sm:text-[26px]">
          Subscriptions
        </h1>
        <p className="mt-1 text-[13px] text-black/50 dark:text-zinc-400">
          Platform plan for {schoolLabel} — organization-wide, not scoped per campus.
        </p>
      </div>

      {showAlert && !loading ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FFF4E5] px-4 py-3 dark:bg-[#C2410C]/20">
          <div className="flex min-w-0 items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#C2410C]" />
            <p className="text-[13px] leading-snug text-[#9A3412] dark:text-[#FDBA74]">
              {alertCopy}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="rounded-lg bg-[#F59E0B] px-3 text-[12px] font-semibold text-black hover:bg-[#D97706]"
            onClick={() => setRenewOpen(true)}
          >
            Renew
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white dark:border-white/10 dark:bg-zinc-900">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-14 text-[13px] text-black/45 dark:text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading subscription…
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1.4fr)_0.9fr_0.9fr_0.9fr_minmax(11rem,1.1fr)] gap-3 border-b border-[#F0F0F0] px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-black/40 dark:border-white/10 dark:text-zinc-500 lg:grid">
              <div>Subscription</div>
              <div>Renewal date</div>
              <div>Auto-renewal</div>
              <div>Renewal price</div>
              <div className="text-right">Status</div>
            </div>
            <div className="grid grid-cols-1 items-center gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1.4fr)_0.9fr_0.9fr_0.9fr_minmax(11rem,1.1fr)] lg:gap-3">
              <button
                type="button"
                className="min-w-0 rounded-lg text-left"
                onClick={() => setDocsOpen(true)}
              >
                <div className="truncate text-[14px] font-semibold text-black dark:text-zinc-50">
                  {planName} plan
                </div>
                <div className="mt-0.5 truncate text-[12px] text-black/45 dark:text-zinc-500">
                  {schoolLabel}
                </div>
              </button>

              <div className="flex items-center justify-between lg:block">
                <span className="text-[11px] font-medium uppercase tracking-wide text-black/40 lg:hidden">
                  Renewal date
                </span>
                <span className="font-mono text-[13px] text-black dark:text-zinc-100">
                  {renewalDate || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between lg:block">
                <span className="text-[11px] font-medium uppercase tracking-wide text-black/40 lg:hidden">
                  Auto-renewal
                </span>
                <Switch
                  checked={autoRenew}
                  onCheckedChange={handleAutoRenew}
                  className="data-[state=checked]:bg-[#0F766E]"
                  aria-label="Auto-renewal preference"
                />
              </div>

              <div className="flex items-center justify-between lg:block">
                <span className="text-[11px] font-medium uppercase tracking-wide text-black/40 lg:hidden">
                  Renewal price
                </span>
                <span className="text-[13px] font-semibold text-black dark:text-zinc-50">
                  {rowPrice > 0 ? formatMoney(symbol, rowPrice) : "—"}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end">
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-[13px] font-medium",
                    statusClass(displayStatus),
                  )}
                >
                  {displayStatus === "Expires soon" || displayStatus === "Overdue" ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : null}
                  {displayStatus}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 rounded-lg bg-[#0F766E] px-3 text-[12px] font-semibold text-white hover:bg-[#0D9488]"
                    onClick={() => setRenewOpen(true)}
                  >
                    Renew
                  </Button>
                  <button
                    type="button"
                    className="grid h-8 w-8 place-items-center rounded-lg text-black/40 hover:bg-black/5 hover:text-black dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                    aria-label="View invoices and receipts"
                    onClick={() => setDocsOpen(true)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {!loading && data ? (
        <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white dark:border-white/10 dark:bg-zinc-900">
          <div className="border-b border-[#F0F0F0] px-4 py-3.5 sm:px-5 dark:border-white/10">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-black/40 dark:text-zinc-500">
              Features included
            </div>
            <p className="mt-0.5 text-[12px] text-black/50 dark:text-zinc-400">
              Included on your {planName} plan · greyed items need an upgrade
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-1.5 p-3 sm:grid-cols-2 sm:p-4">
            {PLAN_FEATURE_ITEMS.map((feature) => {
              const on = Boolean(data.planFlags[feature.key]);
              return (
                <li
                  key={feature.key}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2",
                    on ? "bg-[#F0FDFA] dark:bg-[#0F766E]/15" : "bg-[#F4F4F5] dark:bg-white/5",
                  )}
                >
                  <Check
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      on ? "text-[#0F766E]" : "text-black/25 dark:text-zinc-600",
                    )}
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "truncate text-[12.5px]",
                      on
                        ? "font-medium text-black dark:text-zinc-50"
                        : "text-black/40 dark:text-zinc-500",
                    )}
                  >
                    {feature.label}
                  </span>
                  {!on ? (
                    <span className="ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wider text-black/30 dark:text-zinc-600">
                      Locked
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white dark:border-white/10 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-3 border-b border-[#F0F0F0] px-4 py-3.5 sm:px-5 dark:border-white/10">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-black/40 dark:text-zinc-500">
              Invoices & receipts
            </div>
            <p className="mt-0.5 text-[12px] text-black/50 dark:text-zinc-400">
              Platform subscription documents for {schoolLabel}
            </p>
          </div>
          {invoices.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 rounded-lg px-2 text-[12px] text-black/55 hover:text-black dark:text-zinc-400"
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
                symbol={symbol}
                onInvoice={() => openInvoice(inv)}
                onReceipt={() => openReceipt(inv)}
              />
            ))}
          </ul>
        )}
      </div>

      <p className="text-[12px] text-black/40 dark:text-zinc-500">
        Auto-renewal is a reminder preference only. Online auto-charge is not enabled yet.
      </p>
    </div>
  );
}
