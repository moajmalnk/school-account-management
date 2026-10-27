import { CalendarDays, Check, FileText, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  FamilyCard,
  FamilyHeader,
  FamilyPillButton,
  FamilySkeleton,
} from "@/components/family/FamilyChrome";
import {
  familyFeeOrder,
  familyFeeResume,
  familyFeeVerify,
  familyFees,
  type FeeLine,
} from "@/lib/api/family";
import { ApiError } from "@/lib/api/client";
import { checkoutReturnUrl, openCashfreeCheckout } from "@/lib/cashfree-checkout";
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
  const [resumingId, setResumingId] = useState("");
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

  const settledReturn = useRef("");
  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get("order_id")?.trim() ?? "";
    if (!/^[A-Za-z0-9_-]{4,50}$/.test(orderId) || settledReturn.current === orderId) return;
    settledReturn.current = orderId;
    void (async () => {
      try {
        const receipt = await familyFeeVerify({ provider: "cashfree", orderId });
        toast.success(`Paid. Receipt ${receipt.receiptId}`);
        if (student) load(student.id);
      } catch (err) {
        const pending = err instanceof ApiError && err.status === 409;
        toast.error(pending ? "Payment is still processing" : "Could not confirm the payment", {
          description: err instanceof ApiError ? err.message : "Refresh this page in a moment.",
        });
      } finally {
        const params = new URLSearchParams(window.location.search);
        params.delete("order_id");
        const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
        window.history.replaceState({}, "", next);
      }
    })();
  }, [student]);

  const lines = data?.lines ?? [];

  const visible = lines.filter((line) => {
    if (tab === "due") return line.balance > 0 && line.status !== "On Break";
    if (tab === "paid") return line.status === "Paid" || line.paid > 0;
    return false;
  });

  const chosen = (data?.lines ?? []).filter((line) => selected.includes(line.key));
  const total = chosen.reduce((sum, line) => sum + line.balance, 0);
  const platformFee = data?.settlementReady ? Number(data.platformFee ?? 0) : 0;
  const chargeTotal = total + (platformFee > 0 ? platformFee : 0);
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

  async function resume(orderId: string) {
    if (!student || !orderId || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setResumingId(orderId);
    try {
      const order = await familyFeeResume(student.id, orderId);
      if (order.paid || !order.paymentSessionId) {
        const receipt = await familyFeeVerify({ provider: "cashfree", orderId });
        finishPaid(receipt.receiptId);
        return;
      }
      const outcome = await openCashfreeCheckout(
        order.paymentSessionId,
        checkoutReturnUrl("/family/fees", order.orderId),
      );
      if (outcome === "redirect" || outcome === "closed") {
        setBusy(false);
        load(student.id);
        return;
      }
      const receipt = await familyFeeVerify({ provider: "cashfree", orderId: order.orderId });
      finishPaid(receipt.receiptId);
    } catch (err) {
      const pending = err instanceof ApiError && err.status === 409;
      toast.error(pending ? "This payment expired" : "Could not reopen the payment", {
        description: err instanceof ApiError ? err.message : "Select the fee and pay again.",
      });
      setBusy(false);
      load(student.id);
    } finally {
      busyRef.current = false;
      setResumingId("");
    }
  }

  async function pay() {
    if (!student || !data?.payEnabled || selected.length === 0 || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    let orderId = "";
    try {
      const order = await familyFeeOrder(student.id, selected);
      orderId = order.orderId;
      if (!order.paymentSessionId) {
        throw new Error("Payment session was not created");
      }
      const outcome = await openCashfreeCheckout(
        order.paymentSessionId,
        checkoutReturnUrl("/family/fees", order.orderId),
      );
      if (outcome === "redirect" || outcome === "closed") {
        setBusy(false);
        load(student.id);
        return;
      }
      const receipt = await familyFeeVerify({ provider: "cashfree", orderId: order.orderId });
      finishPaid(receipt.receiptId);
    } catch (err) {
      if (orderId) {
        setBusy(false);
        load(student.id);
      }
      finishFailed(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not start payment");
    } finally {
      busyRef.current = false;
    }
  }

  if (!student) return <p className="px-4 pt-6 text-sm">No student is linked yet.</p>;
  if (error) return <p className="px-4 pt-4 text-sm text-[var(--family-pink-deep)]">{error}</p>;
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
        {tab === "due" && visible.length > 0 ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--family-cream)] px-3 py-1.5 text-xs font-bold text-[var(--family-cream-deep)]">
            <CalendarDays className="h-3.5 w-3.5" />
            Next due: {nextDue ? dueLabel(nextDue) : "Due now"}
          </div>
        ) : null}
        <div className="flex gap-2 rounded-2xl bg-[var(--family-lavender)]/50 p-1 dark:bg-[var(--family-lavender)]">
          {(["due", "paid", "receipts"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                "flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition",
                tab === item
                  ? "bg-[var(--family-yellow)] text-[var(--family-ink)] shadow-sm"
                  : "text-[var(--family-ink-muted)]",
              )}
            >
              {item === "due" ? "Due" : item === "paid" ? "Paid" : "Receipts"}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        {tab === "receipts" ? (
          data.receipts.length === 0 ? (
            <FamilyCard>
              <p className="text-sm text-[var(--family-ink-muted)]">No receipts yet.</p>
            </FamilyCard>
          ) : (
            data.receipts.map((receipt) => (
              <FamilyCard key={receipt.id} className="flex items-center justify-between !py-3">
                <div>
                  <p className="text-sm font-bold">{receipt.id}</p>
                  <p className="text-xs text-[var(--family-ink-muted)]">
                    {receipt.date} · {receipt.category || receipt.mode}
                  </p>
                </div>
                <p className="text-sm font-extrabold">{money(receipt.amount, data.currency)}</p>
              </FamilyCard>
            ))
          )
        ) : visible.length === 0 ? (
          <FamilyCard>
            <p className="text-sm text-[var(--family-ink-muted)]">
              {tab === "due" ? "Nothing is due." : "No paid fees in this view."}
            </p>
          </FamilyCard>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--family-ink)]">{group.label}</h2>
              {group.lines.map((line) => {
                const on = selected.includes(line.key);
                const orderId = line.checkoutOrderId ?? "";
                const showResume = tab === "due" && line.locked && orderId !== "";
                const body = (
                  <>
                    <span className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[var(--family-cream-deep)] shadow-sm dark:bg-[var(--family-surface)]">
                        <FileText className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 pt-0.5">
                        <span className="block text-sm font-bold">{line.label}</span>
                        <span className="mt-0.5 block text-xs text-[var(--family-ink-muted)]">
                          {[student.cls, data.academicYear].filter(Boolean).join(" · ")}
                          {line.locked ? " · Payment in progress" : ""}
                        </span>
                      </span>
                      {tab === "due" && !line.locked ? (
                        <span
                          className={cn(
                            "mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2",
                            on
                              ? "border-[var(--family-lavender-deep)] bg-[var(--family-lavender-deep)] text-white"
                              : "border-[#C8CAD8] bg-white/70 dark:border-zinc-500 dark:bg-transparent",
                          )}
                        >
                          {on ? <Check className="h-3.5 w-3.5" /> : null}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-4 flex items-end justify-between gap-3 pl-[3.25rem]">
                      <span>
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--family-ink-muted)]">
                          {tab === "due" ? "Due date" : "Status"}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block text-sm font-bold",
                            tab === "due" && "text-[var(--family-pink-deep)]",
                          )}
                        >
                          {tab === "due" ? dueLabel(line.dueDate) : line.status}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--family-ink-muted)]">
                          Amount
                        </span>
                        <span className="mt-0.5 block text-sm font-extrabold">
                          {money(tab === "due" ? line.balance : line.paid, data.currency)}
                        </span>
                      </span>
                    </span>
                    {showResume ? (
                      <FamilyPillButton
                        className="mt-3 h-10 w-full text-[13px]"
                        disabled={busy}
                        onClick={() => void resume(orderId)}
                      >
                        {resumingId === orderId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Continue payment
                      </FamilyPillButton>
                    ) : null}
                  </>
                );
                const cardClass = cn(
                  "w-full rounded-[22px] p-4 text-left shadow-[var(--family-shadow)] transition",
                  on ? "bg-[var(--family-lavender)]" : "bg-[var(--family-cream)]",
                  tab === "due" && !line.selectable && !line.locked && "opacity-70",
                );
                if (line.locked) {
                  return (
                    <div key={line.key} className={cardClass}>
                      {body}
                    </div>
                  );
                }
                return (
                  <button
                    key={line.key}
                    type="button"
                    disabled={tab === "due" && !line.selectable}
                    onClick={() => toggle(line)}
                    className={cardClass}
                  >
                    {body}
                  </button>
                );
              })}
            </section>
          ))
        )}
      </div>
      {tab === "due" && selected.length > 0 ? (
        <div className="mx-4 mb-3 shrink-0 rounded-[22px] bg-white px-4 py-3 shadow-[var(--family-shadow-nav)] dark:bg-[var(--family-surface)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--family-ink-muted)]">
                {selected.length} selected
              </p>
              <p className="text-lg font-extrabold">{money(chargeTotal, data.currency)}</p>
              {platformFee > 0 ? (
                <p className="mt-0.5 text-[11px] text-[var(--family-ink-muted)]">
                  Fees {money(total, data.currency)} + platform {money(platformFee, data.currency)}
                </p>
              ) : null}
            </div>
            <FamilyPillButton
              disabled={busy || !data.payEnabled}
              onClick={() => void pay()}
              className="px-5"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Pay now
            </FamilyPillButton>
          </div>
          {!data.payEnabled ? (
            <p className="mt-2 text-xs text-[var(--family-ink-muted)]">Online payment is turned off for this school.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
