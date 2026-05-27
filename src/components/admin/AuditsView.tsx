import { KeyRound, Webhook, CheckCircle2, AlertTriangle } from "lucide-react";
import { impersonationLogs, webhookEvents } from "./data";

export function AuditsView() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">Audit Logging &amp; System Configuration</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Secured trace of impersonation sessions &amp; inbound webhook events from billing providers.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Impersonation */}
        <div className="rounded-2xl border border-slate-200/70 bg-white lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundColor: "#6366F115", color: "#6366F1" }}>
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-slate-900">Administrative Impersonation Log</div>
                <div className="text-[11px] text-slate-500">Privileged access to tenant workspaces · last 7 days</div>
              </div>
            </div>
            <span className="rounded-full border border-slate-200 px-2 py-0.5 font-mono text-[10px] text-slate-500">RBAC-VERIFIED</span>
          </div>

          <div className="grid grid-cols-[1.4fr_1.6fr_1fr_1.2fr_0.7fr] gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <div>Super Admin</div>
            <div>Target Workspace</div>
            <div>Ticket</div>
            <div>Entered</div>
            <div>Duration</div>
          </div>
          {impersonationLogs.map((l, i) => (
            <div key={i} className="grid grid-cols-[1.4fr_1.6fr_1fr_1.2fr_0.7fr] gap-3 border-b border-slate-100 px-5 py-3 last:border-b-0 hover:bg-slate-50/40">
              <div className="flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ background: "linear-gradient(135deg,#6366F1,#0F172A)" }}>
                  {l.admin.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                </div>
                <span className="text-[12px] font-medium text-slate-800">{l.admin}</span>
              </div>
              <div className="text-[12px] text-slate-700">{l.tenant}</div>
              <div className="font-mono text-[11px]" style={{ color: "#6366F1" }}>{l.ticket}</div>
              <div className="font-mono text-[11px] text-slate-500">{l.time}</div>
              <div className="font-mono text-[11px] text-slate-700">{l.duration}</div>
            </div>
          ))}
        </div>

        {/* Webhook stream */}
        <div className="rounded-2xl border border-slate-200/70 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundColor: "#10B98115", color: "#10B981" }}>
                <Webhook className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-slate-900">Inbound Webhook Stream</div>
                <div className="text-[11px] text-slate-500">Live ledger · Stripe / Razorpay / Internal</div>
              </div>
            </div>
            <span className="relative inline-block h-2 w-2 rounded-full heartbeat-dot" style={{ backgroundColor: "#10B981" }} />
          </div>

          <ol className="relative ml-5 border-l border-dashed border-slate-200 px-5 py-4">
            {webhookEvents.map((e, i) => {
              const ok = e.status < 400;
              return (
                <li key={i} className="relative mb-4 pl-4 last:mb-0">
                  <span
                    className="absolute -left-[7px] top-1 grid h-3 w-3 place-items-center rounded-full ring-4 ring-white"
                    style={{ backgroundColor: ok ? "#10B981" : "#DC2626" }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-slate-900">{e.source}</span>
                    <span className="font-mono text-[10px] text-slate-400">{e.time}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px]" style={{ color: ok ? "#047857" : "#B91C1C" }}>
                    {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {e.event} · {e.status} {ok ? "OK" : "ERR"}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{e.payload}</div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
