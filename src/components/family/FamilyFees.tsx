import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { FamilyCard, FamilyHeader, FamilySkeleton } from "@/components/family/FamilyChrome";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  familyFeeOrder,
  familyFeeRelease,
  familyFeeVerify,
  familyFees,
  type FeeCheckout,
  type FeeLine,
} from "@/lib/api/family";
import { ApiError } from "@/lib/api/client";
import { useFamily } from "@/lib/family-session";
import { cn } from "@/lib/utils";

type RazorpayHandler = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type EasebuzzCheckoutClient = {
  initiatePayment: (options: {
    access_key: string;
    onResponse: (response: { status?: string }) => void;
    theme?: string;
  }) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
    EasebuzzCheckout?: new (key: string, env: string) => EasebuzzCheckoutClient;
  }
}

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function dueLabel(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "Due now";
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function loadScript(src: string, ready: () => boolean) {
  if (ready()) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment window"));
    document.body.appendChild(script);
  });
}

export function FamilyFees() {
  const { student, profile } = useFamily();
  const [tab, setTab] = useState<"due" | "paid" | "receipts">("due");
  const [category, setCategory] = useState("all");
  const [data, setData] = useState<Awaited<ReturnType<typeof familyFees>> | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function load(id: string) {
    setData(null);
    setSelected([]);
    familyFees(id)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load fees"));
  }

  useEffect(() => {
    if (!student) return;
    load(student.id);
  }, [student]);

  const lines = useMemo(() => {
    const all = data?.lines ?? [];
    return all.filter((line) => category === "all" || line.category === category);
  }, [data, category]);

  const visible = lines.filter((line) => {
    if (tab === "due") return line.balance > 0 && line.status !== "On Break";
    if (tab === "paid") return line.status === "Paid" || line.paid > 0;
    return false;
  });

  const chosen = (data?.lines ?? []).filter((line) => selected.includes(line.key));
  const total = chosen.reduce((sum, line) => sum + line.balance, 0);
  const nextDue = visible
    .map((line) => line.dueDate)
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort()[0];

  function toggle(line: FeeLine) {
    if (!line.selectable || busy) return;
    setSelected((current) =>
      current.includes(line.key) ? current.filter((key) => key !== line.key) : [...current, line.key],
    );
  }

  function finishPaid(receiptId: string) {
    toast.success(`Paid. Receipt ${receiptId}`);
    if (student) load(student.id);
    setBusy(false);
  }

  function finishFailed(message: string) {
    toast.error(message);
    setBusy(false);
    if (student) load(student.id);
  }

  async function payEasebuzz(order: FeeCheckout) {
    await loadScript(
      "https://ebz-static.s3.ap-south-1.amazonaws.com/easecheckout/v2.0.1/easebuzz-checkout-v2.js",
      () => Boolean(window.EasebuzzCheckout),
    );
    if (!window.EasebuzzCheckout || !order.accessKey || !order.txnid) {
      throw new Error("Payment window is unavailable");
    }
    const checkout = new window.EasebuzzCheckout(order.keyId, order.env === "prod" ? "prod" : "test");
    checkout.initiatePayment({
      access_key: order.accessKey,
      theme: "#0F766E",
      onResponse: (response) => {
        const txnid = order.txnid ?? "";
        if (response.status !== "success") {
          void familyFeeRelease(txnid).finally(() => finishFailed("Payment was not completed"));
          return;
        }
        void familyFeeVerify({ provider: "easebuzz", txnid })
          .then((receipt) => finishPaid(receipt.receiptId))
          .catch((err) => finishFailed(err instanceof ApiError ? err.message : "Payment was not confirmed"));
      },
    });
  }

  async function payRazorpay(order: FeeCheckout) {
    await loadScript("https://checkout.razorpay.com/v1/checkout.js", () => Boolean(window.Razorpay));
    if (!window.Razorpay || !order.razorpayOrderId) throw new Error("Payment window is unavailable");
    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: order.amount * 100,
      currency: order.currency,
      name: order.name,
      description: order.description,
      order_id: order.razorpayOrderId,
      prefill: { contact: profile?.parent.phone, name: profile?.parent.name },
      handler: (response: RazorpayHandler) => {
        void familyFeeVerify({
          provider: "razorpay",
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        })
          .then((receipt) => finishPaid(receipt.receiptId))
          .catch((err) => finishFailed(err instanceof ApiError ? err.message : "Payment was not confirmed"));
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    checkout.open();
  }

  async function pay() {
    if (!student || !data?.payEnabled || selected.length === 0 || busy) return;
    setBusy(true);
    try {
      const order = await familyFeeOrder(student.id, selected);
      if (order.provider === "easebuzz") await payEasebuzz(order);
      else await payRazorpay(order);
    } catch (err) {
      finishFailed(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not start payment");
    }
  }

  if (!student) return <p className="px-4 pt-6 text-sm">No student is linked yet.</p>;
  if (error) return <p className="px-4 pt-4 text-sm text-rose-600">{error}</p>;
  if (!data) {
    return (
      <>
        <FamilyHeader showBell={false} />
        <FamilySkeleton />
      </>
    );
  }

  const typeOptions = [{ value: "all", label: "All types" }, ...data.categories.map((item) => ({ value: item.slug, label: item.label }))];
  const typeLabel = typeOptions.find((option) => option.value === category)?.label ?? "All types";

  return (
    <div className="flex h-[calc(100dvh-7.75rem)] min-h-0 flex-col">
      <FamilyHeader showBell={false} />
      <div className="shrink-0 space-y-4 px-4 pb-3">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-semibold">Fees</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Fee type"
                  className="group inline-flex h-9 max-w-[11rem] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-900"
                >
                  <span className="truncate">{typeLabel}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 min-w-[11rem] rounded-2xl p-1.5">
                {typeOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    className={cn("gap-2 rounded-xl", category === option.value && "bg-[#F0FDFA] dark:bg-teal-950")}
                    onSelect={() => setCategory(option.value)}
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {category === option.value ? <Check className="h-4 w-4 text-[#0F766E]" /> : <span className="h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {data.payEnabled
              ? data.payProvider === "easebuzz"
                ? "Pay the selected dues by card, UPI, or net banking."
                : "Pay the selected dues online."
              : "Select what is due. Online payment opens once the school turns it on."}
          </p>
        </div>
        {tab === "due" && nextDue ? (
          <div className="inline-flex items-center rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Next due {dueLabel(nextDue)}
          </div>
        ) : null}
        <div className="grid grid-cols-3 gap-2">
          {(["due", "paid", "receipts"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                "rounded-xl border px-2 py-2 text-xs font-medium capitalize",
                tab === item
                  ? "border-[#0F766E] bg-teal-50 text-[#0F766E] dark:bg-teal-950"
                  : "border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900",
              )}
            >
              {item === "due" ? "Due fees" : item === "paid" ? "Paid fees" : "Receipts"}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        {tab === "receipts" ? (
          data.receipts.length === 0 ? (
            <FamilyCard>
              <p className="text-sm text-slate-500">No receipts yet.</p>
            </FamilyCard>
          ) : (
            data.receipts.map((receipt) => (
              <FamilyCard key={receipt.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{receipt.id}</p>
                  <p className="text-xs text-slate-500">
                    {receipt.date} · {receipt.category || receipt.mode}
                  </p>
                </div>
                <p className="text-sm font-semibold">{money(receipt.amount, data.currency)}</p>
              </FamilyCard>
            ))
          )
        ) : visible.length === 0 ? (
          <FamilyCard>
            <p className="text-sm text-slate-500">{tab === "due" ? "Nothing is due." : "No paid fees in this view."}</p>
          </FamilyCard>
        ) : (
          visible.map((line) => {
            const on = selected.includes(line.key);
            const overdue = line.status === "Overdue";
            return (
              <button
                key={line.key}
                type="button"
                disabled={tab === "due" && !line.selectable}
                onClick={() => toggle(line)}
                className={cn(
                  "w-full rounded-2xl border bg-white p-4 text-left dark:bg-zinc-900",
                  on ? "border-[#0F766E]" : "border-slate-200 dark:border-white/10",
                  tab === "due" && !line.selectable && "opacity-70",
                )}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{line.label}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {[student.cls, data.academicYear].filter(Boolean).join(" · ")}
                      {line.locked ? " · Payment in progress" : ""}
                    </span>
                  </span>
                  {tab === "due" ? (
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                        on ? "border-[#0F766E] bg-[#0F766E] text-white" : "border-slate-300",
                      )}
                    >
                      {on ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                  ) : null}
                </span>
                <span className="mt-4 flex items-end justify-between gap-3">
                  <span>
                    <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      {tab === "due" ? "Due date" : "Status"}
                    </span>
                    <span className={cn("mt-0.5 block text-sm font-semibold", overdue && "text-rose-600")}>
                      {tab === "due" ? dueLabel(line.dueDate) : line.status}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">Amount</span>
                    <span className="mt-0.5 block text-sm font-semibold">
                      {money(tab === "due" ? line.balance : line.paid, data.currency)}
                    </span>
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
      {tab === "due" && selected.length > 0 ? (
        <div className="mx-4 mb-3 shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-white/10 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium tracking-wide text-slate-500">
                {selected.length} selected
              </p>
              <p className="text-lg font-semibold">{money(total, data.currency)}</p>
            </div>
            <Button
              type="button"
              disabled={busy || !data.payEnabled}
              onClick={() => void pay()}
              className="rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59]"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Pay now
            </Button>
          </div>
          {!data.payEnabled ? (
            <p className="mt-2 text-xs text-slate-500">Online payment is turned off for this school.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
