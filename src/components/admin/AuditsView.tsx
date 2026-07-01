import { useState } from "react";
import { KeyRound, Webhook, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { impersonationLogs, webhookEvents } from "./data";
import { toast } from "sonner";
import { OrganicCard } from "@/components/ui/organic-card";

const SIM_POOL = [
  {
    source: "Razorpay",
    event: "payment.captured",
    status: 200,
    payload: "₹ 18,400 / Crescent Bay International",
  },
  {
    source: "Stripe",
    event: "invoice.paid",
    status: 200,
    payload: "USD 499 / Orchid Springs Academy",
  },
  {
    source: "Razorpay",
    event: "payment.failed",
    status: 402,
    payload: "₹ 6,800 / Northwood Grammar Trust",
  },
  {
    source: "Internal",
    event: "tenant.upgraded",
    status: 200,
    payload: "Heritage Montessori → Premium",
  },
  {
    source: "Razorpay",
    event: "refund.processed",
    status: 200,
    payload: "₹ 1,500 / Lakeside Public Schools",
  },
];

export function AuditsView() {
  const [events, setEvents] = useState(webhookEvents);

  const simulate = () => {
    const pick = SIM_POOL[Math.floor(Math.random() * SIM_POOL.length)];
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    setEvents((prev) => [{ ...pick, time }, ...prev]);
    toast.success(`Webhook ingested · ${pick.source} ${pick.event}`, {
      description: pick.payload,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-heading">Audit Logging &amp; System Configuration</h1>
          <p className="mt-2 text-[14px] text-black/55">
            Secured trace of impersonation sessions &amp; inbound webhook events from billing
            providers.
          </p>
        </div>
        <button
          onClick={simulate}
          className="inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-[12.5px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] transition hover:bg-[#C7F33C] hover:text-black"
        >
          <Zap className="h-3.5 w-3.5" /> Simulate Live Webhook Payment Event
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Impersonation */}
        <OrganicCard tone="white" cornerSide="tr" arrow className="lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E5] px-6 py-5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-2xl bg-black text-white">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-black">
                  Administrative Impersonation Log
                </div>
                <div className="text-[11.5px] text-black/55">Privileged access · last 7 days</div>
              </div>
            </div>
            <span className="rounded-full border border-[#E5E5E5] bg-[#F4F4F5] px-2 py-0.5 font-mono text-[10px] text-black/55">
              RBAC-VERIFIED
            </span>
          </div>

          <div className="grid grid-cols-[1.4fr_1.6fr_1fr_1.2fr_0.7fr] gap-3 border-b border-[#E5E5E5] bg-[#F4F4F5]/60 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-black/55">
            <div>Super Admin</div>
            <div>Target Workspace</div>
            <div>Ticket</div>
            <div>Entered</div>
            <div>Duration</div>
          </div>
          {impersonationLogs.map((l, i) => (
            <div
              key={i}
              className="grid grid-cols-[1.4fr_1.6fr_1fr_1.2fr_0.7fr] gap-3 border-b border-[#F0F0F0] px-6 py-3.5 last:border-b-0 hover:bg-[#F4F4F5]/60"
            >
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-black text-[10px] font-semibold text-white">
                  {l.admin
                    .split(" ")
                    .map((s) => s[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <span className="text-[12.5px] font-medium text-black">{l.admin}</span>
              </div>
              <div className="text-[12.5px] text-black/75">{l.tenant}</div>
              <div className="font-mono text-[11px] text-black">{l.ticket}</div>
              <div className="font-mono text-[11px] text-black/55">{l.time}</div>
              <div className="font-mono text-[11px] text-black/75">{l.duration}</div>
            </div>
          ))}
        </OrganicCard>

        {/* Webhook stream */}
        <OrganicCard tone="white" cornerSide="bl" arrow className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E5] px-6 py-5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-2xl bg-[#C7F33C] text-black">
                <Webhook className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-black">Inbound Webhook Stream</div>
                <div className="text-[11.5px] text-black/55">
                  Live ledger · Stripe / Razorpay / Internal
                </div>
              </div>
            </div>
            <span className="relative inline-block h-2 w-2 rounded-full heartbeat-dot bg-[#C7F33C]" />
          </div>

          <ol className="relative ml-6 border-l border-dashed border-black/15 px-6 py-5">
            {events.map((e, i) => {
              const ok = e.status < 400;
              return (
                <li key={i} className="relative mb-4 pl-4 last:mb-0">
                  <span
                    className={`absolute -left-[7px] top-1 grid h-3 w-3 place-items-center rounded-full ring-4 ring-white ${
                      ok ? "bg-black" : "bg-[#B91C1C]"
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-black">{e.source}</span>
                    <span className="font-mono text-[10px] text-black/45">{e.time}</span>
                  </div>
                  <div
                    className={`mt-0.5 flex items-center gap-2 font-mono text-[11px] ${
                      ok ? "text-black" : "text-[#B91C1C]"
                    }`}
                  >
                    {ok ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {e.event} · {e.status} {ok ? "OK" : "ERR"}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-black/55">{e.payload}</div>
                </li>
              );
            })}
          </ol>
        </OrganicCard>
      </div>
    </div>
  );
}
