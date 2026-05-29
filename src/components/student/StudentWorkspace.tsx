import { AlertTriangle, Download, Code2, Printer } from "lucide-react";

const LEDGER = [
  { date: "2026-04-01", desc: "Tuition Fee · Term 1", due: "2026-04-10", charge: 4000, paid: 4000, status: "Paid" },
  { date: "2026-04-01", desc: "Vehicle Fee · Term 1", due: "2026-04-10", charge: 1500, paid: 1500, status: "Paid" },
  { date: "2026-05-01", desc: "Tuition Fee · Term 2", due: "2026-05-10", charge: 4000, paid: 1000, status: "Partially Paid" },
  { date: "2026-05-01", desc: "Vehicle Fee · Term 2", due: "2026-05-10", charge: 1500, paid: 0, status: "Overdue" },
  { date: "2026-05-15", desc: "Annual Day Donation", due: "2026-05-25", charge: 1000, paid: 0, status: "Overdue" },
];

const RECEIPTS = [
  { id: "RC-9821", date: "2026-05-12", amt: 1000, mode: "UPI · GPay", desc: "Tuition · Term 2 (partial)" },
  { id: "RC-9602", date: "2026-04-08", amt: 1500, mode: "Bank Transfer", desc: "Vehicle Fee · Term 1" },
  { id: "RC-9601", date: "2026-04-08", amt: 4000, mode: "UPI · PhonePe", desc: "Tuition · Term 1" },
];

export function StudentWorkspace() {
  const totalDue = LEDGER.reduce((a, r) => a + r.charge, 0);
  const totalPaid = LEDGER.reduce((a, r) => a + r.paid, 0);
  const balance = totalDue - totalPaid;

  return (
    <div className="min-h-screen bg-slate-50/80 px-8 py-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
              <Code2 className="h-3 w-3" /> [Stitch: parent_portal_v1]
            </div>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">Fee Portal</h1>
            <p className="text-[13px] text-slate-500">Silver Hills Global Group · Academic Year 2025–26</p>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700">
            <Download className="h-3.5 w-3.5" /> Download Statement
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl text-base font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#10B981,#6366F1)" }}>HA</div>
              <div>
                <div className="text-[14px] font-semibold text-slate-900">Hira Abbas</div>
                <div className="text-[11px] text-slate-500">Class · LKG · Section A</div>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-[12.5px]">
              <Row k="Student ID" v="STU-2042" mono />
              <Row k="Guardian" v="Iqbal Abbas" />
              <Row k="Primary Phone" v="+91 97440 01048" mono />
              <Row k="Admission Date" v="11 Jun 2025" />
            </div>
          </div>

          <StatBlock label="Total Due" value={`₹ ${totalDue.toLocaleString("en-IN")}`} color="#0F172A" />
          <StatBlock
            label="Total Paid"
            value={`₹ ${totalPaid.toLocaleString("en-IN")}`}
            color="#10B981"
            sub="6 receipts on file"
          />
        </div>

        <div className="mt-4 rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#DC2626)" }}>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/80">Current Balance</div>
              <div className="font-mono text-3xl font-semibold">₹ {balance.toLocaleString("en-IN")}</div>
            </div>
            <div className="ml-auto text-right text-[12px] text-white/90">
              2 overdue line items · clear by Jun 05<br />
              <button className="mt-1 rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-900">Pay Now</button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="col-span-2 rounded-2xl border border-slate-200/80 bg-white">
            <div className="border-b border-slate-100 p-4">
              <div className="text-[13px] font-semibold text-slate-900">Fees Balance Ledger</div>
              <div className="text-[11px] text-slate-500">Chronological statement of all charges</div>
            </div>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5">Due</th>
                  <th className="px-4 py-2.5 text-right">Charge</th>
                  <th className="px-4 py-2.5 text-right">Paid</th>
                  <th className="px-4 py-2.5 text-right">Balance</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {LEDGER.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 font-mono text-slate-500">{r.date}</td>
                    <td className="px-4 py-2.5 text-slate-900">{r.desc}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-500">{r.due}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-900">₹ {r.charge.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-emerald-600">₹ {r.paid.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-900">₹ {(r.charge - r.paid).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5"><StatusBadge s={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold text-slate-900">Digital Receipts</div>
              <span className="font-mono text-[10px] text-slate-400">{RECEIPTS.length} on file</span>
            </div>
            <div className="mt-3 space-y-2.5">
              {RECEIPTS.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[11px] text-slate-500">{r.id}</div>
                    <div className="font-mono text-[12px] font-semibold text-emerald-600">+₹ {r.amt.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="mt-0.5 text-[12px] text-slate-900">{r.desc}</div>
                  <div className="mt-1 flex items-center justify-between text-[10.5px] text-slate-500">
                    <span>{r.date} · {r.mode}</span>
                    <button className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-0.5 text-slate-600 hover:bg-white">
                      <Printer className="h-3 w-3" /> Print
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{k}</span>
      <span className={mono ? "font-mono text-slate-900" : "text-slate-900"}>{v}</span>
    </div>
  );
}

function StatBlock({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
      <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-3 font-mono text-3xl font-semibold" style={{ color }}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    Paid: { bg: "#ECFDF5", fg: "#047857" },
    "Partially Paid": { bg: "#EEF2FF", fg: "#4338CA" },
    Overdue: { bg: "#FEF2F2", fg: "#B91C1C" },
  };
  const c = map[s] ?? { bg: "#F1F5F9", fg: "#0F172A" };
  return (
    <span className="rounded-full px-2 py-0.5 text-[10.5px] font-medium" style={{ backgroundColor: c.bg, color: c.fg }}>
      {s}
    </span>
  );
}