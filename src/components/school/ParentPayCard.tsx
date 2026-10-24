import { useEffect, useState } from "react";
import { Link2, Loader2, Smartphone, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { schoolParentPay, schoolSaveParentPay } from "@/lib/api/school-family";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const CAPABILITIES = [
  {
    icon: Smartphone,
    title: "Parent app",
    body: "Pay due fees in Fees with Cashfree",
  },
  {
    icon: Link2,
    title: "WhatsApp link",
    body: "Share Pay link from student Payments",
  },
  {
    icon: WalletCards,
    title: "Counter / Finance",
    body: "Online mode popup when collecting",
  },
] as const;

export function ParentPayCard() {
  const [enabled, setEnabled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dirty = enabled !== saved;

  useEffect(() => {
    schoolParentPay()
      .then((data) => {
        setEnabled(data.enabled);
        setSaved(data.enabled);
        setConfigured(data.configured !== false);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const statusLabel = !configured
    ? "Not configured"
    : saved
      ? "Live"
      : "Off";
  const statusClass = !configured
    ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200"
    : saved
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/35 dark:text-emerald-200"
      : "border-[#E5E5E5] bg-[#F4F4F5] text-black/55 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-400";

  return (
    <form
      className={cn(
        "overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white dark:border-white/10 dark:bg-zinc-900",
        "shadow-[0_1px_0_rgba(15,23,42,0.03)]",
      )}
      onSubmit={(event) => {
        event.preventDefault();
        if (!dirty || busy) return;
        setError("");
        setBusy(true);
        void schoolSaveParentPay({ enabled })
          .then(() => {
            setSaved(enabled);
            toast.success(enabled ? "Parents can pay online" : "Parent online payment is off");
          })
          .catch((err) => {
            const message = err instanceof ApiError ? err.message : "Could not save";
            setError(message);
            toast.error(message);
          })
          .finally(() => setBusy(false));
      }}
    >
      <div className="relative border-b border-[#EFEFEF] bg-[linear-gradient(135deg,#F0FDFA_0%,#FFFFFF_48%,#F8FAFC_100%)] px-4 py-4 sm:px-5 dark:border-white/10 dark:bg-none dark:bg-zinc-900">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 max-w-[220px] opacity-40 dark:opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at 100% 0%, rgba(15,118,110,0.18), transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold tracking-tight text-black dark:text-zinc-50">
                Parent Pay now
              </h2>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  statusClass,
                )}
              >
                {loading ? "…" : statusLabel}
              </span>
              {dirty ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  Unsaved
                </span>
              ) : null}
            </div>
            <p className="max-w-xl text-[12.5px] leading-relaxed text-black/55 dark:text-zinc-400">
              Cashfree checkout for due fees. Receipts post only after payment is confirmed — never
              on link create.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {CAPABILITIES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex gap-2.5 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] px-3 py-2.5 dark:border-white/10 dark:bg-zinc-950/50"
            >
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#CCFBF1] text-[#0F766E] dark:bg-teal-950/50 dark:text-teal-300">
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-black dark:text-zinc-100">{title}</div>
                <p className="mt-0.5 text-[11px] leading-snug text-black/50 dark:text-zinc-400">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className={cn(
            "flex flex-col gap-3 rounded-xl border px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between",
            enabled
              ? "border-[#99F6E4] bg-[#F0FDFA]/70 dark:border-teal-500/25 dark:bg-teal-950/25"
              : "border-[#E5E5E5] bg-white dark:border-white/10 dark:bg-zinc-950/40",
          )}
        >
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-black dark:text-zinc-50">
              Allow parents to pay online
            </div>
            <p className="mt-0.5 text-[11.5px] leading-snug text-black/50 dark:text-zinc-400">
              {configured
                ? "Turns on app checkout, Pay link, and Finance → Online."
                : "Cashfree is not connected for this school yet."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
            <span className="font-mono text-[11px] text-black/45 dark:text-zinc-500">
              {enabled ? "On" : "Off"}
            </span>
            <Switch
              checked={enabled}
              disabled={loading || (!configured && !enabled)}
              onCheckedChange={(next) => {
                setEnabled(next);
                setError("");
              }}
              aria-label="Allow parents to pay online"
            />
          </div>
        </div>

        {!configured ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-200">
            Online payment is not configured. Ask Feezo support to connect Cashfree for this school.
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-200">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-black/40 dark:text-zinc-500">
            Provider · Cashfree · India UPI / card / net banking
          </p>
          <Button
            type="submit"
            disabled={busy || !dirty || loading}
            className="h-9 w-full rounded-full bg-[#0F766E] px-5 text-[12.5px] font-semibold text-white hover:bg-[#0D9488] disabled:opacity-45 sm:w-auto"
          >
            {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            {dirty ? "Save changes" : "Saved"}
          </Button>
        </div>
      </div>
    </form>
  );
}
