import { useMemo, useState } from "react";
import { Code2, Calendar, Check, X, Clock } from "lucide-react";

const ATTENDANCE_ROSTER = [
  { id: "STU-2041", name: "Aarav Sharma", week: ["P", "P", "P", "L", "P"] },
  { id: "STU-2042", name: "Hira Abbas", week: ["P", "P", "A", "P", "P"] },
  { id: "STU-2043", name: "Meera Iyer", week: ["P", "P", "P", "P", "P"] },
  { id: "STU-2044", name: "Kabir Khanna", week: ["P", "A", "A", "P", "P"] },
  { id: "STU-2045", name: "Tara Mehta", week: ["P", "P", "P", "P", "L"] },
  { id: "STU-2046", name: "Yash Pillai", week: ["A", "P", "P", "P", "P"] },
  { id: "STU-2047", name: "Ishita Banerjee", week: ["P", "P", "P", "P", "P"] },
  { id: "STU-2048", name: "Nikhil Rao", week: ["P", "L", "P", "P", "A"] },
];

export function StaffWorkspace() {
  const [basic, setBasic] = useState(48000);
  const [bonus, setBonus] = useState(6500);
  const [pf, setPf] = useState(2400);
  const net = useMemo(() => basic + bonus - pf, [basic, bonus, pf]);

  return (
    <div className="min-h-screen bg-slate-50/80 px-8 py-8">
      <div className="mx-auto max-w-[1300px]">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
              <Code2 className="h-3 w-3" /> [Stitch: staff_console_v1]
            </div>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">Faculty Console · Anika Roy</h1>
            <p className="text-[13px] text-slate-500">Mathematics · HOD · Senior Wing</p>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-mono text-[11px] text-slate-500">
            <Calendar className="mr-1 inline h-3 w-3" /> Week 22 · May 26 – May 30
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StaffStat label="Teachers Count" value="8" accent="#6366F1" />
          <StaffStat label="Administrative" value="2" accent="#F59E0B" />
          <StaffStat label="Total Staff Count" value="10" accent="#10B981" />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <div className="text-[13px] font-semibold text-slate-900">Personal Information</div>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl text-base font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#10B981,#6366F1)" }}>AR</div>
              <div>
                <div className="text-[14px] font-semibold text-slate-900">Anika Roy</div>
                <div className="font-mono text-[11px] text-slate-500">ST-123</div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-[12.5px]">
              <Row k="Designation" v="HOD · Mathematics" />
              <Row k="Date of Joining" v="14 Jun 2019" />
              <Row k="Department" v="Senior Wing" />
              <Row k="Reports To" v="Priya Subramanian" />
              <Row k="Contact" v="anika.roy@silverhills.in" />
            </div>
          </div>

          <div className="col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold text-slate-900">Payroll Calculator · May 2026</div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">Draft</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <PayInput label="Basic Salary" value={basic} onChange={setBasic} />
              <PayInput label="Additional Bonus" value={bonus} onChange={setBonus} accent="#10B981" />
              <PayInput label="PF / Deductions" value={pf} onChange={setPf} accent="#F59E0B" />
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl p-4"
              style={{ background: "linear-gradient(135deg,#0F172A,#6366F1)" }}>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/60">Net Salary Payable</div>
                <div className="font-mono text-2xl font-semibold text-white">₹ {net.toLocaleString("en-IN")}</div>
              </div>
              <button className="rounded-lg bg-white px-4 py-2 text-[12px] font-semibold text-slate-900">Lock Payroll</button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-slate-900">Class 8-B · Attendance Grid</div>
              <div className="text-[11px] text-slate-500">Tap a cell to toggle Present / Absent / Leave</div>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <Legend color="#10B981" label="Present" />
              <Legend color="#DC2626" label="Absent" />
              <Legend color="#F59E0B" label="Leave" />
            </div>
          </div>
          <table className="mt-4 w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400">
                <th className="px-3 py-2">Student</th>
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
                  <th key={d} className="px-3 py-2 text-center">{d}</th>
                ))}
                <th className="px-3 py-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {ATTENDANCE_ROSTER.map((s) => {
                const present = s.week.filter((c) => c === "P").length;
                const pct = Math.round((present / s.week.length) * 100);
                return (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-slate-900">{s.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{s.id}</div>
                    </td>
                    {s.week.map((c, i) => (
                      <td key={i} className="px-3 py-2.5 text-center">
                        <Cell code={c} />
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right font-mono">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StaffStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</div>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      <div className="mt-3 font-mono text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{k}</span>
      <span className="text-slate-900">{v}</span>
    </div>
  );
}

function PayInput({ label, value, onChange, accent }: { label: string; value: number; onChange: (n: number) => void; accent?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</div>
        {accent && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />}
      </div>
      <div className="mt-2 flex items-center gap-1">
        <span className="font-mono text-slate-400">₹</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent font-mono text-lg font-semibold text-slate-900 outline-none"
        />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1 text-slate-500">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /> {label}
    </div>
  );
}

function Cell({ code }: { code: string }) {
  const map: Record<string, { bg: string; icon: React.ReactNode }> = {
    P: { bg: "#10B981", icon: <Check className="h-3 w-3 text-white" /> },
    A: { bg: "#DC2626", icon: <X className="h-3 w-3 text-white" /> },
    L: { bg: "#F59E0B", icon: <Clock className="h-3 w-3 text-white" /> },
  };
  const cfg = map[code];
  return (
    <span className="inline-grid h-6 w-6 place-items-center rounded-md" style={{ backgroundColor: cfg.bg }}>
      {cfg.icon}
    </span>
  );
}