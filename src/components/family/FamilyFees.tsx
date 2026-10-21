import { CalendarDays, Check, FileText, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { FamilyCard, FamilyHeader, FamilySkeleton } from "@/components/family/FamilyChrome";
import { Button } from "@/components/ui/button";
import {
  familyFeeOrder,
  familyFeeRelease,
  familyFeeVerify,
  familyFees,
  type FeeLine,
} from "@/lib/api/family";
import { ApiError } from "@/lib/api/client";
import { openCashfreeCheckout } from "@/lib/cashfree-checkout";
import { useFamily } from "@/lib/family-session";
import { cn } from "@/lib/utils";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

export function FamilyFees() {
  const { student } = useFamily();
  const [tab, setTab] = useState<"due" | "paid" | "receipts">("due");
  const [data, setData] = useState<Awaited<ReturnType<typeof familyFees>> | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
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

  const lines = data?.lines ?? [];

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

  async function pay() {
    if (!student || !data?.payEnabled || selected.length === 0 || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    let orderId = "";
    let reportedPaid = false;
    try {
      const order = await familyFeeOrder(student.id, selected);
      orderId = order.orderId;
      const outcome = await openCashfreeCheckout(order.paymentSessionId);
      if (outcome === "closed") {
        await familyFeeRelease(order.orderId);
        finishFailed("Payment was not completed");
        return;
      }
      reportedPaid = true;
      const receipt = await familyFeeVerify({ provider: "cashfree", orderId: order.orderId });
      finishPaid(receipt.receiptId);
    } catch (err) {
      if (orderId && !reportedPaid) {
        await familyFeeRelease(orderId).catch(() => undefined);
      }
      finishFailed(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not start payment");
    } finally {
      busyRef.current = false;
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

  const groups: { label: string; lines: FeeLine[] }[] = [];
  for (const line of visible) {
    const label = line.categoryLabel || "Fees";
    const group = groups.find((item) => item.label === label);
    if (group) group.lines.push(line);
    else groups.push({ label, lines: [line] });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FamilyHeader showBell={false} />
      <div className="shrink-0 space-y-3 px-4 pb-3">
        <div>
          <h1 className="text-lg font-semibold">Fee installments</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Pay online securely via Cashfree
          </p>
        </div>
        {tab === "due" && visible.length > 0 ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1E6] px-3 py-1.5 text-xs font-semibold text-[#E07A2F] dark:bg-orange-950 dark:text-orange-200">
            <CalendarDays className="h-3.5 w-3.5" />
            Next due: {nextDue ? dueLabel(nextDue) : "Due now"}
          </div>
        ) : null}
        <div className="flex gap-2">
          {(["due", "paid", "receipts"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold",
                tab === item
                  ? "bg-[#0F766E] text-white"
                  : "bg-white text-slate-600 dark:bg-zinc-900 dark:text-zinc-300",
              )}
            >
              {item === "due" ? "Due Fees" : item === "paid" ? "Paid Fees" : "Receipts Fees"}
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
          groups.map((group) => (
            <section key={group.label} className="space-y-3">
              <h2 className="text-sm font-semibold">{group.label}</h2>
              {group.lines.map((line) => {
                const on = selected.includes(line.key);
                return (
                  <button
                    key={line.key}
                    type="button"
                    disabled={tab === "due" && !line.selectable}
                    onClick={() => toggle(line)}
                    className={cn(
                      "w-full rounded-[22px] p-4 text-left",
                      on ? "bg-[#F0FDFA] dark:bg-teal-950" : "bg-[#F8E6D4] dark:bg-orange-950/50",
                      tab === "due" && !line.selectable && "opacity-70",
                    )}
                  >
                    <span className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-slate-500 dark:bg-zinc-900 dark:text-zinc-300">
                        <FileText className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 pt-0.5">
                        <span className="block text-sm font-semibold">{line.label}</span>
                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-zinc-400">
                          {[student.cls, data.academicYear].filter(Boolean).join(" · ")}
                          {line.locked ? " · Payment in progress" : ""}
                        </span>
                      </span>
                      {tab === "due" ? (
                        <span
                          className={cn(
                            "mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2",
                            on ? "border-[#0F766E] bg-[#0F766E] text-white" : "border-slate-300 bg-white/70 dark:border-zinc-500 dark:bg-transparent",
                          )}
                        >
                          {on ? <Check className="h-3.5 w-3.5" /> : null}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-4 flex items-end justify-between gap-3 pl-[3.25rem]">
                      <span>
                        <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                          {tab === "due" ? "Due date" : "Status"}
                        </span>
                        <span className={cn("mt-0.5 block text-sm font-semibold", tab === "due" && "text-[#E11D48]")}>
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
              })}
            </section>
          ))
        )}
      </div>
      {tab === "due" && selected.length > 0 ? (
        <div className="mx-4 mb-3 shrink-0 rounded-[22px] bg-white px-4 py-3 shadow-xl dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {selected.length} selected
              </p>
              <p className="text-lg font-semibold">{money(total, data.currency)}</p>
            </div>
            <Button
              type="button"
              disabled={busy || !data.payEnabled}
              onClick={() => void pay()}
              className="rounded-full bg-[#0F766E] px-5 text-white hover:bg-[#115E59]"
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
