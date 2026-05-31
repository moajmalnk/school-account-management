import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Wallet,
  Settings,
  LogOut,
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Code2,
  MoreVertical,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type NavKey = "dashboard" | "students" | "staff" | "finance" | "settings";

const NAV: { key: NavKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "students", label: "Students", icon: Users },
  { key: "staff", label: "Staff", icon: UserCog },
  { key: "finance", label: "Finance", icon: Wallet },
  { key: "settings", label: "Settings", icon: Settings },
];

type Student = { id: string; name: string; cls: string; guardian: string; due: number };
type Staff = { id: string; name: string; role: string; dept: string; active: boolean };
type Payment = { id: string; name: string; cat: string; mode: string; amount: number; time: string };

const SEED_STUDENTS: Student[] = [
  { id: "STU-2841", name: "Aarav Sharma", cls: "Grade 8 · B", guardian: "Vinod Sharma", due: 4500 },
  { id: "STU-2842", name: "Hira Abbas", cls: "LKG · A", guardian: "Iqbal Abbas", due: 5500 },
  { id: "STU-2843", name: "Meera Iyer", cls: "Grade 10 · A", guardian: "Devanand Iyer", due: 0 },
  { id: "STU-2844", name: "Kabir Khanna", cls: "Grade 6 · C", guardian: "Anjali Khanna", due: 2200 },
  { id: "STU-2845", name: "Tara Mehta", cls: "Grade 4 · B", guardian: "Rohan Mehta", due: 800 },
  { id: "STU-2846", name: "Yash Pillai", cls: "Grade 12 · A", guardian: "Latha Pillai", due: 12300 },
];

const SEED_STAFF: Staff[] = [
  { id: "STF-018", name: "Anika Roy", role: "Mathematics · HOD", dept: "Senior Wing", active: true },
  { id: "STF-019", name: "Devanand Iyer", role: "Physics", dept: "Senior Wing", active: true },
  { id: "STF-020", name: "Priya Subramanian", role: "Principal Office", dept: "Administration", active: true },
  { id: "STF-021", name: "Rohan Mehta", role: "Sports Coordinator", dept: "Co-curricular", active: true },
];

const SEED_PAYMENTS: Payment[] = [
  { id: "RC-9821", name: "Aarav Sharma", cat: "Tuition Fee", mode: "UPI", amount: 4500, time: "Today · 10:22" },
  { id: "RC-9820", name: "Meera Iyer", cat: "Vehicle Fee", mode: "Bank", amount: 1800, time: "Today · 09:51" },
  { id: "RC-9819", name: "Kabir Khanna", cat: "Tuition Fee", mode: "Cash", amount: 2200, time: "Yesterday" },
  { id: "RC-9818", name: "Hira Abbas", cat: "Donation", mode: "UPI", amount: 1000, time: "Yesterday" },
  { id: "RC-9817", name: "Tara Mehta", cat: "Tuition Fee", mode: "Bank", amount: 3200, time: "2d ago" },
];

const PENDING_OBLIGATIONS = [
  { payee: "BrightBus Logistics", desc: "Bus diesel + maintenance", amount: 48200, due: "Jun 02" },
  { payee: "Faculty Payroll · May", desc: "35 staff · net payable", amount: 612000, due: "May 31" },
  { payee: "Adani Electricity", desc: "Campus utility bill", amount: 18450, due: "Jun 05" },
  { payee: "Office Stationery Co.", desc: "Exam print supplies", amount: 6800, due: "Jun 08" },
];

export function SchoolAdminWorkspace({ impersonating }: { impersonating?: string | null } = {}) {
  const [nav, setNav] = useState<NavKey>("dashboard");
  const [students, setStudents] = useState<Student[]>(SEED_STUDENTS);
  const [staff, setStaff] = useState<Staff[]>(SEED_STAFF);
  const [payments, setPayments] = useState<Payment[]>(SEED_PAYMENTS);
  return (
    <div className="min-h-screen bg-slate-50/80">
      {impersonating && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-1.5 text-center font-mono text-[11px] font-semibold text-white"
          style={{ background: "linear-gradient(90deg,#6366F1,#0F172A)" }}
        >
          <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-amber-300 heartbeat-dot" />
          IMPERSONATION ACTIVE · Super Admin viewing workspace for {impersonating}
        </div>
      )}
      <div className="flex">
        <aside className="sticky top-0 flex h-screen w-60 flex-col border-r border-slate-200 bg-white">
          <div className="flex items-center gap-2.5 px-5 py-5">
            <div
              className="grid h-9 w-9 place-items-center rounded-lg text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#10B981,#6366F1)" }}
            >
              SH
            </div>
            <div className="leading-tight">
              <div className="text-[13px] font-semibold text-slate-900">Silver Hills Global</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Tenant Workspace</div>
            </div>
          </div>
          <div className="mx-3 mb-3 flex items-center gap-1.5 rounded-md border border-slate-200/70 bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-500">
            <Code2 className="h-3 w-3" />
            <span>[Stitch: tenant_shell_v2]</span>
          </div>
          <nav className="flex-1 px-2">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = nav === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => setNav(n.key)}
                  className={`mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                    active ? "text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                  }`}
                  style={active ? { backgroundColor: "#0F172A" } : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </button>
              );
            })}
          </nav>
          <button className="m-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 hover:bg-slate-100">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </aside>

        <main className="flex-1 p-8">
          {nav === "dashboard" && <SchoolDashboard />}
          {nav === "students" && (
            <StudentsLedger students={students} setStudents={setStudents} />
          )}
          {nav === "staff" && <StaffRoster staff={staff} setStaff={setStaff} />}
          {nav === "finance" && (
            <FinanceModule
              students={students}
              setStudents={setStudents}
              payments={payments}
              setPayments={setPayments}
            />
          )}
          {nav === "settings" && <SchoolSettings />}
        </main>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  positive = true,
  accent,
}: {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
  accent: string;
}) {
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</div>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      <div className="mt-3 font-mono text-2xl font-semibold text-slate-900">{value}</div>
      <div className={`mt-1 flex items-center gap-1 text-[11px] ${positive ? "text-emerald-600" : "text-rose-600"}`}>
        <Icon className="h-3 w-3" /> {delta}
      </div>
    </div>
  );
}

function SchoolDashboard() {
  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Operations Dashboard</h1>
          <p className="text-[13px] text-slate-500">Live snapshot · Silver Hills Global Group · academic year 2025–26</p>
        </div>
        <div className="font-mono text-[11px] text-slate-400">Updated 14:42 IST</div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Students" value="1,284" delta="+24 this month" accent="#6366F1" />
        <KpiCard label="Total Staff" value="35" delta="+2 hires" accent="#10B981" />
        <KpiCard label="Monthly Income" value="₹ 25,425" delta="+8.2% MoM" accent="#10B981" />
        <KpiCard label="Monthly Expense" value="₹ 18,200" delta="-3.1% MoM" positive={false} accent="#F59E0B" />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-slate-900">Daily Fee Collection</div>
              <div className="text-[11px] text-slate-500">Last 7 working days</div>
            </div>
            <div className="font-mono text-[11px] text-slate-400">in ₹ thousands</div>
          </div>
          <div className="flex h-44 items-end gap-3">
            {[42, 58, 74, 96, 88, 51, 33].map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="w-full rounded-md" style={{ height: `${v}%`, background: "linear-gradient(180deg,#10B981,#6366F1)" }} />
                <div className="font-mono text-[10px] text-slate-500">{v}k</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="text-[13px] font-semibold text-slate-900">Outstanding Fees</div>
          <div className="mt-1 text-[11px] text-slate-500">By academic grade band</div>
          <div className="mt-4 space-y-3">
            {[
              { label: "Pre-Primary (LKG–UKG)", v: 18, amt: "₹ 0.42 L" },
              { label: "Primary (Gr 1–5)", v: 36, amt: "₹ 1.84 L" },
              { label: "Middle (Gr 6–8)", v: 28, amt: "₹ 2.10 L" },
              { label: "Senior (Gr 9–12)", v: 18, amt: "₹ 3.65 L" },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-slate-600">{r.label}</span>
                  <span className="font-mono text-slate-700">{r.amt}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full" style={{ width: `${r.v * 2.5}%`, backgroundColor: "#F59E0B" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentsLedger() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Students Ledger</h1>
          <p className="text-[13px] text-slate-500">1,284 active enrollments · isolated to Silver Hills tenant</p>
        </div>
        <button
          className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-semibold text-white"
          style={{ backgroundColor: "#0F172A" }}
        >
          <Plus className="h-3.5 w-3.5" /> Admit Student
        </button>
      </div>
      <div className="rounded-2xl border border-slate-200/80 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 p-3">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input placeholder="Search by name, ID, or guardian…" className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-400" />
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400">
              <th className="px-4 py-2.5">Student</th>
              <th className="px-4 py-2.5">Class</th>
              <th className="px-4 py-2.5">Guardian</th>
              <th className="px-4 py-2.5 text-right">Due Balance</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {STUDENTS.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{s.name}</div>
                  <div className="font-mono text-[11px] text-slate-400">{s.id}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{s.cls}</td>
                <td className="px-4 py-3 text-slate-600">{s.guardian}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {s.due === 0 ? (
                    <span className="text-emerald-600">Cleared</span>
                  ) : (
                    <span className="text-slate-900">₹ {s.due.toLocaleString("en-IN")}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-50">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StaffRoster() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Staff Roster</h1>
      <div className="grid grid-cols-2 gap-4">
        {STAFF_LIST.map((s) => (
          <div key={s.id} className="rounded-2xl border border-slate-200/80 bg-white p-4">
            <div className="flex items-center gap-3">
              <div
                className="grid h-11 w-11 place-items-center rounded-full font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#6366F1,#0F172A)" }}
              >
                {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-slate-900">{s.name}</div>
                <div className="text-[11px] text-slate-500">{s.role}</div>
              </div>
              <div className="ml-auto font-mono text-[10px] text-slate-400">{s.id}</div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>Department · {s.dept}</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinanceModule() {
  const [tab, setTab] = useState<"receive" | "make" | "ledger">("receive");
  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Finance Command Center</h1>
          <p className="text-[13px] text-slate-500">Receive, disburse, and analyse cashflow in real time</p>
        </div>
      </div>
      <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-white p-1">
        {[
          { k: "receive", l: "Receive Payment" },
          { k: "make", l: "Make Payment" },
          { k: "ledger", l: "Ledger Analytics" },
        ].map((t) => {
          const active = tab === t.k;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k as typeof tab)}
              className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-all ${
                active ? "text-white" : "text-slate-600 hover:text-slate-900"
              }`}
              style={active ? { backgroundColor: "#0F172A" } : undefined}
            >
              {t.l}
            </button>
          );
        })}
      </div>

      {tab === "receive" && <ReceivePayment />}
      {tab === "make" && <MakePayment />}
      {tab === "ledger" && <LedgerAnalytics />}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">{children}</div>;
}

function ReceivePayment() {
  const [cls, setCls] = useState("Grade 8 · B");
  const [stu, setStu] = useState("Aarav Sharma");
  const [cats, setCats] = useState<string[]>(["Tuition Fee"]);
  const [amount, setAmount] = useState("4500");
  const [mode, setMode] = useState("UPI");
  const toggleCat = (c: string) =>
    setCats((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5">
        <div className="text-[13px] font-semibold text-slate-900">Inbound Fee Capture</div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Class</FieldLabel>
            <select
              value={cls}
              onChange={(e) => setCls(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-[13px]"
            >
              {["LKG · A", "Grade 4 · B", "Grade 6 · C", "Grade 8 · B", "Grade 10 · A", "Grade 12 · A"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Student</FieldLabel>
            <select
              value={stu}
              onChange={(e) => setStu(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-[13px]"
            >
              {STUDENTS.map((s) => (
                <option key={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <FieldLabel>Fee Categories</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {["Tuition Fee", "Vehicle Fee", "Donation", "Other"].map((c) => {
              const active = cats.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCat(c)}
                  className={`rounded-full border px-3 py-1 text-[12px] ${
                    active ? "border-transparent text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  style={active ? { backgroundColor: "#10B981" } : undefined}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Amount (₹)</FieldLabel>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 px-2.5 font-mono text-[13px]"
            />
          </div>
          <div>
            <FieldLabel>Payment Mode</FieldLabel>
            <div className="flex gap-1 rounded-md border border-slate-200 p-1">
              {["Bank", "UPI", "Cash"].map((m) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded px-3 py-1 text-[12px] ${
                      active ? "text-white" : "text-slate-600 hover:bg-slate-50"
                    }`}
                    style={active ? { backgroundColor: "#6366F1" } : undefined}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-lg bg-slate-50 p-3">
          <div className="text-[12px] text-slate-500">
            Receipt for <span className="font-medium text-slate-900">{stu}</span> · {cls}
          </div>
          <button
            className="rounded-lg px-4 py-2 text-[12px] font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#10B981,#6366F1)" }}
          >
            Record ₹ {Number(amount).toLocaleString("en-IN")}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
        <div className="text-[13px] font-semibold text-slate-900">Payment History</div>
        <div className="mt-1 text-[11px] text-slate-500">Most recent receipts</div>
        <div className="mt-3 divide-y divide-slate-100">
          {PAYMENT_HISTORY.map((p) => (
            <div key={p.id} className="py-2.5">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="font-medium text-slate-900">{p.name}</span>
                <span className="font-mono text-emerald-600">+₹ {p.amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-0.5 flex items-center justify-between text-[10.5px] text-slate-500">
                <span>
                  {p.cat} · {p.mode}
                </span>
                <span className="font-mono">{p.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MakePayment() {
  const [payee, setPayee] = useState("Salary");
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5">
        <div className="text-[13px] font-semibold text-slate-900">Outbound Disbursal</div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Payee Type</FieldLabel>
            <div className="flex gap-1 rounded-md border border-slate-200 p-1">
              {["Salary", "Vendor"].map((p) => {
                const active = payee === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPayee(p)}
                    className={`flex-1 rounded px-3 py-1 text-[12px] ${active ? "text-white" : "text-slate-600"}`}
                    style={active ? { backgroundColor: "#0F172A" } : undefined}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <FieldLabel>Beneficiary</FieldLabel>
            <input defaultValue="BrightBus Logistics Pvt. Ltd." className="h-9 w-full rounded-md border border-slate-200 px-2.5 text-[13px]" />
          </div>
          <div className="col-span-2">
            <FieldLabel>Description / Line Items</FieldLabel>
            <textarea
              defaultValue="Bus diesel refill (1,240 L) + monthly preventive maintenance fleet of 12 vehicles"
              className="min-h-[80px] w-full rounded-md border border-slate-200 px-2.5 py-2 text-[13px]"
            />
          </div>
          <div>
            <FieldLabel>Amount (₹)</FieldLabel>
            <input defaultValue="48200" className="h-9 w-full rounded-md border border-slate-200 px-2.5 font-mono text-[13px]" />
          </div>
          <div>
            <FieldLabel>Mode</FieldLabel>
            <select className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-[13px]">
              <option>Bank Transfer · NEFT</option>
              <option>UPI Business</option>
              <option>Cheque</option>
            </select>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            className="rounded-lg px-4 py-2 text-[12px] font-semibold text-white"
            style={{ backgroundColor: "#F59E0B" }}
          >
            Authorise Disbursal
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
        <div className="text-[13px] font-semibold text-slate-900">Top Pending Obligations</div>
        <div className="mt-3 space-y-3">
          {PENDING_OBLIGATIONS.map((p) => (
            <div key={p.payee} className="rounded-lg border border-slate-100 p-3">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="font-medium text-slate-900">{p.payee}</span>
                <span className="font-mono text-slate-900">₹ {p.amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-0.5 flex items-center justify-between text-[10.5px] text-slate-500">
                <span>{p.desc}</span>
                <span className="rounded-full bg-amber-50 px-2 text-amber-700">Due {p.due}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Donut({ title, segments }: { title: string; segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((a, b) => a + b.value, 0);
  let acc = 0;
  const gradient = segments
    .map((s) => {
      const from = (acc / total) * 360;
      acc += s.value;
      const to = (acc / total) * 360;
      return `${s.color} ${from}deg ${to}deg`;
    })
    .join(", ");
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
      <div className="text-[13px] font-semibold text-slate-900">{title}</div>
      <div className="mt-4 flex items-center gap-5">
        <div
          className="relative h-36 w-36 rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div className="absolute inset-4 grid place-items-center rounded-full bg-white">
            <div className="text-center">
              <div className="font-mono text-lg font-semibold text-slate-900">₹ {total.toLocaleString("en-IN")}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Total</div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-[12px]">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
              <span className="flex-1 text-slate-600">{s.label}</span>
              <span className="font-mono text-slate-900">₹ {s.value.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LedgerAnalytics() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Donut
        title="Income Distribution"
        segments={[
          { label: "Tuition", value: 1840000, color: "#10B981" },
          { label: "Transport", value: 320000, color: "#6366F1" },
          { label: "Donations", value: 95000, color: "#F59E0B" },
          { label: "Other", value: 42000, color: "#0F172A" },
        ]}
      />
      <Donut
        title="Monthly Outflow Breakdown"
        segments={[
          { label: "Salaries", value: 1220000, color: "#6366F1" },
          { label: "Vehicle Upkeep", value: 184000, color: "#F59E0B" },
          { label: "Utilities", value: 88000, color: "#10B981" },
          { label: "Rent", value: 240000, color: "#0F172A" },
        ]}
      />
    </div>
  );
}

function SchoolSettings() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Tenant Settings</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="text-[13px] font-semibold text-slate-900">Institution Identity</div>
          <div className="mt-3 space-y-3 text-[12.5px]">
            <div className="flex justify-between"><span className="text-slate-500">Legal Name</span><span className="text-slate-900">Silver Hills Educational Trust</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Subdomain</span><span className="font-mono text-slate-900">silverhills.schoolaccounts.in</span></div>
            <div className="flex justify-between"><span className="text-slate-500">GSTIN</span><span className="font-mono text-slate-900">29ABCDE1234F1Z5</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Plan</span><span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">Enterprise</span></div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="text-[13px] font-semibold text-slate-900">Module Access</div>
          <div className="mt-3 space-y-2.5 text-[12.5px]">
            {[
              ["Finance Module", true],
              ["Vehicle Route Tracker", true],
              ["Advanced Analytics", true],
              ["SMS / WhatsApp Alerts", false],
              ["Library Inventory", false],
            ].map(([l, on]) => (
              <div key={l as string} className="flex items-center justify-between">
                <span className="text-slate-600">{l}</span>
                <span
                  className={`flex h-5 w-9 items-center rounded-full p-0.5 ${on ? "" : "bg-slate-200"}`}
                  style={on ? { backgroundColor: "#10B981" } : undefined}
                >
                  <span className={`h-4 w-4 rounded-full bg-white shadow ${on ? "ml-auto" : ""}`} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}