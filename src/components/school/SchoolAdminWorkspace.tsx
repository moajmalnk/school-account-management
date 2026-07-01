import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  MoreVertical,
  AlertTriangle,
  Printer,
  Download,
  Upload,
  Phone,
  MessageCircle,
  MessageSquare,
  Pencil,
  Trash2,
  X,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { OrganicCard } from "@/components/ui/organic-card";
import {
  ACADEMIC_YEAR_OPTIONS,
  THEME_ACCENT_OPTIONS,
  THEME_DENSITY_OPTIONS,
  THEME_MODE_OPTIONS,
  useTenantStore,
  type ClassConfig,
  type Department,
  type Payment,
  type PaymentCategory,
  type Role,
  type Staff,
  type Student,
  type ThemeSettings,
  type TransportRoute,
} from "@/lib/tenant-store";
import { StudentProfileDetail } from "@/components/school/StudentProfileDetail";
import {
  BalanceSheetReport,
  GeneralLedgerReport,
  ProfitLossReport,
} from "@/components/school/FinanceReports";
import { downloadReceiptPdf } from "@/lib/finance-export";
import { useAuth } from "@/lib/auth";
import { cn, type CornerSide, type Tone } from "@/lib/utils";

const PENDING_OBLIGATIONS = [
  { payee: "BrightBus Logistics", desc: "Bus diesel + maintenance", amount: 48200, due: "Jun 02" },
  { payee: "Faculty Payroll · May", desc: "35 staff · net payable", amount: 612000, due: "May 31" },
  { payee: "Adani Electricity", desc: "Campus utility bill", amount: 18450, due: "Jun 05" },
  { payee: "Office Stationery Co.", desc: "Exam print supplies", amount: 6800, due: "Jun 08" },
];

function KpiCard({
  label,
  value,
  delta,
  positive = true,
  tone = "white",
  cornerSide = "tr",
}: {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
  tone?: Tone;
  cornerSide?: CornerSide;
}) {
  const Icon = positive ? TrendingUp : TrendingDown;
  const isLime = tone === "lime";
  const isBlack = tone === "black";
  const labelClass = isLime || isBlack ? "" : "text-black/45";
  const deltaColor = isLime
    ? "text-black"
    : isBlack
      ? "text-[#C7F33C]"
      : positive
        ? "text-black"
        : "text-[#B91C1C]";
  return (
    <OrganicCard tone={tone} cornerSide={cornerSide} arrow padded>
      <div className={`text-[11px] font-medium uppercase tracking-wider ${labelClass}`}>
        {label}
      </div>
      <div className="mt-3 font-mono text-[28px] font-semibold tracking-tight">{value}</div>
      <div className={`mt-1 flex items-center gap-1 text-[11.5px] ${deltaColor}`}>
        <Icon className="h-3 w-3" /> {delta}
      </div>
    </OrganicCard>
  );
}

export function SchoolDashboard() {
  const { students, staff, payments } = useTenantStore();
  const totalDue = students.reduce((acc, s) => acc + s.due, 0);
  const monthlyIncome = payments.reduce((acc, p) => acc + p.amount, 0);

  const peakIdx = useMemo(() => {
    const arr = [42, 58, 74, 96, 88, 51, 33];
    return arr.reduce((m, v, i, a) => (v > a[m] ? i : m), 0);
  }, []);
  const bars = [42, 58, 74, 96, 88, 51, 33];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-heading">Operations Dashboard</h1>
          <p className="mt-2 text-[14px] text-black/55">
            Live snapshot · Silver Hills Global Group · academic year 2025–26
          </p>
        </div>
        <div className="font-mono text-[11px] text-black/45">Updated 14:42 IST</div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Students"
          value={students.length.toLocaleString("en-IN")}
          delta="live ledger"
          cornerSide="tr"
        />
        <KpiCard
          label="Total Staff"
          value={staff.length.toString()}
          delta={`${staff.filter((s) => s.active).length} active`}
          cornerSide="bl"
        />
        <KpiCard
          label="Receipts Captured"
          value={`₹ ${monthlyIncome.toLocaleString("en-IN")}`}
          delta={`${payments.length} receipts`}
          cornerSide="tr"
        />
        <KpiCard
          label="Outstanding Dues"
          value={`₹ ${totalDue.toLocaleString("en-IN")}`}
          delta="across all classes"
          positive={false}
          tone="lime"
          cornerSide="bl"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <OrganicCard tone="white" cornerSide="tr" arrow padded className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-title">Daily Fee Collection</div>
              <div className="mt-1 text-[12.5px] text-black/55">Last 7 working days</div>
            </div>
            <div className="font-mono text-[11px] text-black/45">in ₹ thousands</div>
          </div>
          <div className="flex h-44 items-end gap-3">
            {bars.map((v, i) => {
              const isPeak = i === peakIdx;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-xl"
                    style={{
                      height: `${v}%`,
                      background: isPeak
                        ? "linear-gradient(180deg,#C7F33C,#E1F2AE)"
                        : "linear-gradient(180deg,#000000,#1F1F1F)",
                    }}
                  />
                  <div className="font-mono text-[10px] text-black/55">{v}k</div>
                </div>
              );
            })}
          </div>
        </OrganicCard>

        <OrganicCard tone="white" cornerSide="bl" arrow padded>
          <div className="text-title">Outstanding Fees</div>
          <div className="mt-1 text-[12.5px] text-black/55">By academic grade band</div>
          <div className="mt-4 space-y-3">
            {[
              { label: "Pre-Primary (LKG–UKG)", v: 18, amt: "₹ 0.42 L" },
              { label: "Primary (Gr 1–5)", v: 36, amt: "₹ 1.84 L" },
              { label: "Middle (Gr 6–8)", v: 28, amt: "₹ 2.10 L" },
              { label: "Senior (Gr 9–12)", v: 18, amt: "₹ 3.65 L" },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-black/65">{r.label}</span>
                  <span className="font-mono text-black">{r.amt}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#F4F4F5]">
                  <div
                    className="h-full"
                    style={{ width: `${r.v * 2.5}%`, backgroundColor: "#C7F33C" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </OrganicCard>
      </div>
    </div>
  );
}

type StatusFilter = "all" | "paid" | "overdue";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All Students" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" },
];

const phoneDigits = (raw?: string) => (raw ?? "").replace(/[^0-9]/g, "");

const formatPhone = (raw?: string) => {
  const d = phoneDigits(raw);
  if (!d) return "";
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  if (d.length === 12 && d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return d;
};

export function StudentsLedger() {
  const { students, setStudents, classes } = useTenantStore();
  const navigate = useNavigate();
  const search = useSearch({ from: "/tenant/students" }) as { id?: string };
  const activeStudentViewId = search.id ?? null;

  const openStudent = (id: string) => navigate({ to: "/tenant/students", search: { id } });
  const closeStudent = () => navigate({ to: "/tenant/students", search: {} });

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const defaultClass = classes[0]?.className ?? "";
  const [form, setForm] = useState({ name: "", cls: defaultClass, guardian: "", due: "" });
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!defaultClass) return;
    setForm((prev) =>
      classes.some((c) => c.className === prev.cls) ? prev : { ...prev, cls: defaultClass },
    );
  }, [classes, defaultClass]);

  const activeStudent = useMemo(
    () =>
      activeStudentViewId ? (students.find((s) => s.id === activeStudentViewId) ?? null) : null,
    [activeStudentViewId, students],
  );

  const grades = useMemo(
    () => Array.from(new Set(students.map((s) => s.cls.split(" - ")[0]))).sort(),
    [students],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter((s) => gradeFilter === "all" || s.cls.startsWith(gradeFilter))
      .filter((s) =>
        statusFilter === "all" ? true : statusFilter === "paid" ? s.due === 0 : s.due > 0,
      )
      .filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.guardian.toLowerCase().includes(q),
      );
  }, [students, query, gradeFilter, statusFilter]);

  const counts = useMemo(
    () => ({
      total: filtered.length,
      male: filtered.filter((s) => s.gender === "M").length,
      female: filtered.filter((s) => s.gender === "F").length,
    }),
    [filtered],
  );

  const handleAdmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.guardian.trim()) {
      toast.error("Name and guardian are required");
      return;
    }
    const nextNum = 2847 + students.filter((s) => s.id.startsWith("STU-28")).length;
    const newStu: Student = {
      id: `STU-${nextNum}`,
      name: form.name.trim(),
      cls: form.cls,
      guardian: form.guardian.trim(),
      due: Number(form.due) || 0,
    };
    setStudents((prev) => [newStu, ...prev]);
    toast.success(`${newStu.name} admitted`, { description: `${newStu.id} · ${newStu.cls}` });
    setForm({ name: "", cls: defaultClass, guardian: "", due: "" });
    setOpen(false);
  };

  const exportCsv = () => {
    if (!filtered.length) {
      toast.error("Nothing to export · current filter is empty");
      return;
    }
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      "Student,Class,Guardian,Phone,Balance",
      ...filtered.map((s) =>
        [escape(s.name), escape(s.cls), escape(s.guardian), escape(s.phone ?? ""), s.due].join(","),
      ),
    ].join("\n");
    const uri = encodeURI("data:text/csv;charset=utf-8," + rows);
    const a = document.createElement("a");
    a.href = uri;
    a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`${filtered.length} students exported`, {
      description: "CSV ready in your downloads folder",
    });
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const lines = text.trim().split(/\r?\n/);
      if (!lines.length) {
        toast.error("Empty CSV file");
        return;
      }
      const start = /name|student/i.test(lines[0] ?? "") ? 1 : 0;
      const fresh: Student[] = [];
      let next = 2900 + students.length + fresh.length;
      for (let i = start; i < lines.length; i++) {
        const cells = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const [name, cls, guardian, phone, balance] = cells;
        if (!name) continue;
        fresh.push({
          id: `STU-${next++}`,
          name,
          cls: cls || defaultClass,
          guardian: guardian || "—",
          phone: phone || undefined,
          due: Number(balance) || 0,
        });
      }
      if (!fresh.length) {
        toast.error("CSV had no parsable rows");
      } else {
        setStudents((prev) => [...fresh, ...prev]);
        toast.success(`${fresh.length} students imported`, {
          description: "Appended to the active tenant ledger",
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = () => toast.error("Could not read the selected file");
    reader.readAsText(file);
  };

  const downloadPdf = () => {
    if (!filtered.length) {
      toast.error("Nothing to print · current filter is empty");
      return;
    }
    const win = window.open("", "_blank", "width=960,height=720");
    if (!win) {
      toast.error("Popup blocked · allow pop-ups for this site");
      return;
    }
    const stampedAt = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const contextLabel = [
      gradeFilter === "all" ? "All Grades" : gradeFilter,
      statusFilter === "all"
        ? "All Statuses"
        : statusFilter[0].toUpperCase() + statusFilter.slice(1),
    ].join(" · ");
    const rowsHtml = filtered
      .map(
        (s) => `<tr>
          <td>${s.id}</td>
          <td>${s.name}</td>
          <td>${s.cls}</td>
          <td>${s.guardian}</td>
          <td>${s.phone ?? ""}</td>
          <td style="text-align:right">${s.due === 0 ? "Cleared" : "₹ " + s.due.toLocaleString("en-IN")}</td>
        </tr>`,
      )
      .join("");
    win.document.write(`<!doctype html><html><head><title>Students Ledger · ${stampedAt}</title>
      <style>
        @page { margin: 18mm; }
        body { font-family: Inter, system-ui, sans-serif; color: #111; margin: 0; padding: 0; }
        h1 { font-size: 16px; margin: 0 0 4px; }
        .meta { font-size: 11px; color: #666; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { padding: 8px 10px; border-bottom: 1px solid #E5E5E5; text-align: left; }
        th { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; }
        tbody tr:nth-child(odd) { background: #FAFAFA; }
      </style></head><body>
        <h1>Silver Hills Global · Students Ledger</h1>
        <div class="meta">${contextLabel} · ${filtered.length} students · printed ${stampedAt}</div>
        <table>
          <thead><tr><th>ID</th><th>Student</th><th>Class</th><th>Guardian</th><th>Phone</th><th style="text-align:right">Balance</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 100);
    toast.success("Print preview opened", { description: "Save as PDF from your browser dialog" });
  };

  if (activeStudent) {
    return <StudentProfileDetail student={activeStudent} onBack={closeStudent} />;
  }

  const limeBtn =
    "flex items-center gap-1.5 rounded-full bg-[#C7F33C] px-4 py-2 text-[12.5px] font-semibold text-black shadow-[0_8px_24px_-12px_rgba(199,243,60,0.6)] transition-colors hover:brightness-95";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-heading">Students Ledger</h1>
          <p className="mt-2 text-[14px] text-black/55">
            {students.length} active enrollments · isolated to Silver Hills tenant
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <button onClick={() => setOpen(true)} className={`${limeBtn} w-full sm:w-auto`}>
            <Plus className="h-3.5 w-3.5" /> Admit Student
          </button>
          <button
            onClick={downloadPdf}
            className={`${limeBtn} w-full sm:w-auto`}
            title="Open print-ready PDF preview"
          >
            <Printer className="h-3.5 w-3.5" /> Download PDF
          </button>
          <button
            onClick={exportCsv}
            className={`${limeBtn} w-full sm:w-auto`}
            title="Export visible rows as CSV"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button
            onClick={handleImportClick}
            className={`${limeBtn} w-full sm:w-auto`}
            title="Append students from a CSV file"
          >
            <Upload className="h-3.5 w-3.5" /> Import CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      <OrganicCard
        tone="white"
        cornerSide="tr"
        className="flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <span className="shrink-0 pl-1 text-[10.5px] font-semibold uppercase tracking-wider text-black/55">
            Grade
          </span>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="h-9 w-full rounded-full border-black/10 bg-white text-[12.5px] font-medium text-black focus:ring-[#C7F33C] sm:w-[150px]">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {grades.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#E1F2AE] px-3 py-1.5 text-[12px] font-semibold text-black sm:w-auto sm:justify-start">
          <span className="font-mono">{counts.total}</span>
          Total Students
          <span className="font-mono text-black/65">
            ({counts.male}M | {counts.female}F)
          </span>
        </span>

        <div className="w-full overflow-x-auto sm:ml-auto sm:w-auto">
          <div className="inline-flex min-w-max items-center rounded-full border border-black/10 bg-white p-1">
            {STATUS_TABS.map((t) => {
              const active = statusFilter === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setStatusFilter(t.key)}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                    active ? "bg-[#C7F33C] text-black" : "text-black/55 hover:bg-black/5"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="tr" className="flex items-center gap-2 p-3">
        <Search className="ml-2 h-3.5 w-3.5 text-black/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, ID, or guardian…"
          className="flex-1 bg-transparent text-[13px] text-black outline-none placeholder:text-black/35"
        />
        {query && (
          <span className="font-mono text-[10px] text-black/45">{filtered.length} match</span>
        )}
      </OrganicCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((s, i) => {
          const isOverdue = s.due > 0;
          const tone: Tone = isOverdue ? "lime" : "white";
          const cornerSide: CornerSide = i % 2 === 0 ? "tr" : "bl";
          const digits = phoneDigits(s.phone);
          const hasPhone = digits.length > 0;
          const waHref = `https://wa.me/${digits.length === 10 ? "91" : ""}${digits}`;
          const openProfile = () => openStudent(s.id);
          return (
            <OrganicCard
              key={s.id}
              tone={tone}
              cornerSide={cornerSide}
              padded
              role="button"
              tabIndex={0}
              aria-label={`Open profile for ${s.name}`}
              onClick={openProfile}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openProfile();
                }
              }}
              className="flex cursor-pointer flex-col gap-3 transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-2"
            >
              <div className="pr-12">
                <div className="text-[15px] font-semibold leading-tight">{s.name}</div>
                <div
                  className={`mt-1 font-mono text-[11px] ${
                    isOverdue ? "text-black/65" : "text-black/55"
                  }`}
                >
                  {s.id} · {s.cls}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    isOverdue ? "bg-black text-[#C7F33C]" : "bg-[#F4F4F5] text-black/75"
                  }`}
                >
                  Guardian · {s.guardian}
                </span>
                {hasPhone && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10.5px] ${
                      isOverdue ? "bg-black/15 text-black/85" : "bg-[#F4F4F5] text-black/65"
                    }`}
                  >
                    <Phone className="h-2.5 w-2.5" />
                    {formatPhone(s.phone)}
                  </span>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between gap-3">
                <div>
                  <div
                    className={`text-[10.5px] font-semibold uppercase tracking-wider ${
                      isOverdue ? "text-black/70" : "text-black/45"
                    }`}
                  >
                    Due Balance
                  </div>
                  <div className="mt-0.5 font-mono text-[18px] font-semibold">
                    {s.due === 0 ? (
                      <span className="text-emerald-700">Cleared</span>
                    ) : (
                      <span>₹ {s.due.toLocaleString("en-IN")}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <ContactAction
                    icon={MessageCircle}
                    label="WhatsApp"
                    accent="emerald"
                    disabled={!hasPhone}
                    onClick={() => {
                      window.open(waHref, "_blank", "noopener,noreferrer");
                      toast.success(`WhatsApp opened for ${s.guardian}`);
                    }}
                  />
                  <ContactAction
                    icon={Phone}
                    label="Call"
                    accent="ink"
                    disabled={!hasPhone}
                    onClick={() => {
                      window.location.href = `tel:${digits}`;
                    }}
                  />
                  <ContactAction
                    icon={MessageSquare}
                    label="SMS"
                    accent="ink"
                    disabled={!hasPhone}
                    onClick={() => {
                      window.location.href = `sms:${digits}`;
                    }}
                  />
                </div>
              </div>
            </OrganicCard>
          );
        })}
        {filtered.length === 0 && (
          <OrganicCard tone="white" cornerSide="tr" padded className="md:col-span-2 xl:col-span-3">
            <div className="py-10 text-center text-[12.5px] text-black/45">
              No students match the current filters.
            </div>
          </OrganicCard>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admit New Student</DialogTitle>
            <DialogDescription>
              Provision a fresh enrollment record into the Silver Hills tenant ledger.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Full Name
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ishaan Verma"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                  Class
                </Label>
                <FieldSelect
                  value={form.cls}
                  onValueChange={(cls) => setForm({ ...form, cls })}
                  options={classes.map((c) => ({ value: c.className, label: c.className }))}
                  placeholder="Select class"
                  disabled={classes.length === 0}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                  Initial Due (₹)
                </Label>
                <Input
                  inputMode="numeric"
                  value={form.due}
                  onChange={(e) => setForm({ ...form, due: e.target.value.replace(/[^0-9]/g, "") })}
                  placeholder="0"
                  className="font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Guardian Name
              </Label>
              <Input
                value={form.guardian}
                onChange={(e) => setForm({ ...form, guardian: e.target.value })}
                placeholder="e.g. Anita Verma"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
                Admit Student
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactAction({
  icon: Icon,
  label,
  accent,
  disabled,
  onClick,
}: {
  icon: typeof Phone;
  label: string;
  accent: "emerald" | "ink";
  disabled?: boolean;
  onClick: () => void;
}) {
  const palette =
    accent === "emerald"
      ? "bg-emerald-500 text-white hover:bg-emerald-600"
      : "bg-black text-white hover:bg-black/85";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      aria-label={label}
      title={disabled ? "No phone on file" : label}
      className={`grid h-8 w-8 place-items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:bg-black/15 disabled:text-black/40 ${palette}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

export function StaffRoster() {
  const { staff, setStaff, departments, roles } = useTenantStore();
  const defaultDept = departments[0]?.name ?? "";
  const defaultRole = roles[0]?.title ?? "";
  const [open, setOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<Staff | null>(null);
  const [detailStaff, setDetailStaff] = useState<Staff | null>(null);
  const [form, setForm] = useState({
    name: "",
    role: defaultRole,
    dept: defaultDept,
    id: "",
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      role: roles.some((r) => r.title === prev.role) ? prev.role : defaultRole,
      dept: departments.some((d) => d.name === prev.dept) ? prev.dept : defaultDept,
    }));
  }, [departments, defaultDept, defaultRole, roles]);

  const handleRecruit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      toast.error("Name and role are required");
      return;
    }
    const empId = form.id.trim() || `STF-${(22 + staff.length).toString().padStart(3, "0")}`;
    const newStaff: Staff = {
      id: empId,
      name: form.name.trim(),
      role: form.role.trim(),
      dept: form.dept,
      active: true,
    };
    setStaff((prev) => [newStaff, ...prev]);
    toast.success(`${newStaff.name} recruited`, {
      description: `${newStaff.id} · ${newStaff.dept}`,
    });
    setForm({ name: "", role: defaultRole, dept: defaultDept, id: "" });
    setOpen(false);
  };

  const toggleStatus = (id: string) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
    const s = staff.find((x) => x.id === id);
    toast(`${s?.name} marked ${s?.active ? "Inactive" : "Active"}`);
  };
  const removeStaff = (id: string) => {
    const s = staff.find((x) => x.id === id);
    setStaff((prev) => prev.filter((x) => x.id !== id));
    toast.error(`${s?.name} removed from roster`);
  };

  const confirmRemoveStaff = () => {
    if (!pendingRemoval) return;
    removeStaff(pendingRemoval.id);
    setPendingRemoval(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading">Staff Roster</h1>
          <p className="mt-2 text-[14px] text-black/55">
            {staff.length} faculty &amp; administrative profiles
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-[12.5px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] transition-colors hover:bg-black/85 sm:w-auto"
        >
          <Plus className="h-3.5 w-3.5" /> Recruit Staff
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {staff.map((s, i) => {
          const tone: Tone = s.active ? "white" : "limePale";
          const cornerSide: CornerSide = i % 2 === 0 ? "tr" : "bl";
          return (
            <OrganicCard key={s.id} tone={tone} cornerSide={cornerSide} padded>
              <div className="flex w-full items-start gap-3">
                <button
                  type="button"
                  onClick={() => setDetailStaff(s)}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black text-[14px] font-semibold text-white"
                >
                  {s.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setDetailStaff(s)}
                    className="w-full text-left"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-black">{s.name}</div>
                        <div className="text-[11.5px] text-black/55">{s.role}</div>
                      </div>
                      <span className="shrink-0 font-mono text-[10px] text-black/45">{s.id}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
                      <span className="text-black/55">Department · {s.dept}</span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${
                          s.active ? "bg-[#C7F33C] text-black" : "bg-black/10 text-black/55"
                        }`}
                      >
                        {s.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </button>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => toggleStatus(s.id)}
                      className="w-full rounded-full border border-[#E5E5E5] bg-white px-3 py-2 text-[11.5px] font-medium text-black transition-colors hover:border-black/20 hover:bg-[#F4F4F5] sm:min-w-[6.5rem] sm:flex-1"
                    >
                      {s.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toast(`Editor draft opened for ${s.name}`)}
                      className="w-full rounded-full border border-[#E5E5E5] bg-white px-3 py-2 text-[11.5px] font-medium text-black transition-colors hover:border-black/20 hover:bg-[#F4F4F5] sm:min-w-[6.5rem] sm:flex-1"
                    >
                      Edit Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingRemoval(s)}
                      className="w-full rounded-full border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[11.5px] font-medium text-[#B91C1C] transition-colors hover:border-[#F87171] hover:bg-[#FEE2E2] sm:min-w-[6.5rem] sm:flex-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </OrganicCard>
          );
        })}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Recruit New Staff</SheetTitle>
            <SheetDescription>
              Provision a faculty / administrative profile for Silver Hills.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleRecruit} className="mt-5 space-y-3 px-1">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Full Name
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Sneha Pillai"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Role
              </Label>
              <FieldSelect
                value={form.role}
                onValueChange={(role) => setForm({ ...form, role })}
                options={roles.map((r) => ({ value: r.title, label: r.title }))}
                placeholder="No roles configured"
                disabled={roles.length === 0}
              />
              <p className="text-[10.5px] text-black/45">
                Manage role catalogue under Settings · Roles
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                  Department
                </Label>
                <FieldSelect
                  value={form.dept}
                  onValueChange={(dept) => setForm({ ...form, dept })}
                  options={departments.map((d) => ({ value: d.name, label: d.name }))}
                  placeholder="No departments configured"
                  disabled={departments.length === 0}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                  Employee ID
                </Label>
                <Input
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  placeholder="Auto-generate"
                  className="font-mono"
                />
              </div>
            </div>
            <SheetFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
                Recruit
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Dialog
        open={Boolean(pendingRemoval)}
        onOpenChange={(next) => {
          if (!next) setPendingRemoval(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-[1.5rem] border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">Remove Staff</DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60">
              {pendingRemoval
                ? `Are you sure you want to remove ${pendingRemoval.name} (${pendingRemoval.id}) from the roster? This action cannot be undone.`
                : "Are you sure you want to remove this staff profile?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingRemoval(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmRemoveStaff}
              className="rounded-full bg-[#B91C1C] text-white hover:bg-[#991B1B]"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(detailStaff)}
        onOpenChange={(next) => {
          if (!next) setDetailStaff(null);
        }}
      >
        <DialogContent className="max-w-md rounded-[1.75rem] border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[24px] font-semibold text-black">
              Staff Profile
            </DialogTitle>
            <DialogDescription className="text-[13px] text-black/55">
              Detailed view for selected faculty / administrative member.
            </DialogDescription>
          </DialogHeader>

          {detailStaff && (
            <div className="mt-2 space-y-3">
              <div className="rounded-2xl bg-[#F4F4F5] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-black/50">
                  Employee
                </div>
                <div className="mt-1 text-[18px] font-semibold text-black">{detailStaff.name}</div>
                <div className="text-[12px] text-black/60">{detailStaff.role}</div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#E5E5E5] p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    Employee ID
                  </div>
                  <div className="mt-1 font-mono text-[12px] text-black">{detailStaff.id}</div>
                </div>
                <div className="rounded-2xl border border-[#E5E5E5] p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                    Status
                  </div>
                  <div className="mt-1 text-[12px] font-semibold text-black">
                    {detailStaff.active ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E5E5] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
                  Department
                </div>
                <div className="mt-1 text-[12px] text-black">{detailStaff.dept}</div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDetailStaff(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FinanceModule() {
  const [tab, setTab] = useState<"receive" | "make" | "analytics" | "ledger" | "pl" | "balance">(
    "receive",
  );
  const tabs = [
    { k: "receive" as const, l: "Receive Payment" },
    { k: "make" as const, l: "Make Payment" },
    { k: "analytics" as const, l: "Ledger Analytics" },
    { k: "ledger" as const, l: "Ledger" },
    { k: "pl" as const, l: "Profit & Loss Account" },
    { k: "balance" as const, l: "Balance Sheet" },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-heading">Finance Command Center</h1>
          <p className="mt-2 text-[14px] text-black/55">
            Receive, disburse, and analyse cashflow in real time
          </p>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto pb-1">
        <div className="inline-flex min-w-max rounded-full border border-[#E5E5E5] bg-white p-1">
          {tabs.map((t) => {
            const active = tab === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[12px] font-medium transition-all sm:px-5 sm:text-[12.5px] ${
                  active ? "bg-black text-white shadow-sm" : "text-black/65 hover:text-black"
                }`}
              >
                {t.l}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "receive" && <ReceivePayment />}
      {tab === "make" && <MakePayment />}
      {tab === "analytics" && <LedgerAnalytics />}
      {tab === "ledger" && <GeneralLedgerReport />}
      {tab === "pl" && <ProfitLossReport />}
      {tab === "balance" && <BalanceSheetReport />}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-black/55">
      {children}
    </div>
  );
}

function ReceivePayment() {
  const {
    students,
    setStudents,
    payments,
    setPayments,
    classes: classConfigs,
    transportRoutes,
    paymentCategories,
    academicYear,
  } = useTenantStore();
  const { session } = useAuth();
  const schoolName = session?.tenantName ?? "Silver Hills Global";
  const classes = useMemo(() => {
    const fromConfig = classConfigs.map((c) => c.className);
    const fromStudents = Array.from(new Set(students.map((s) => s.cls)));
    return Array.from(new Set([...fromConfig, ...fromStudents]));
  }, [classConfigs, students]);
  const [cls, setCls] = useState(classes[0] ?? "");
  const studentsInClass = useMemo(() => students.filter((s) => s.cls === cls), [students, cls]);
  const [stu, setStu] = useState(studentsInClass[0]?.name ?? students[0]?.name ?? "");
  const [category, setCategory] = useState(paymentCategories[0]?.label ?? "Tuition Fee");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("Bank");

  const selected = students.find((s) => s.name === stu);

  useEffect(() => {
    if (classes.length && !classes.includes(cls)) {
      setCls(classes[0]);
    }
  }, [classes, cls]);

  useEffect(() => {
    const pool = studentsInClass.length ? studentsInClass : students;
    if (pool.length && !pool.some((s) => s.name === stu)) {
      setStu(pool[0].name);
    }
  }, [students, studentsInClass, stu]);

  useEffect(() => {
    if (paymentCategories.length && !paymentCategories.some((c) => c.label === category)) {
      setCategory(paymentCategories[0].label);
    }
  }, [category, paymentCategories]);

  const matchedRouteFee = useMemo(() => {
    if (!selected) return undefined;
    const haystack = `${selected.address ?? ""} ${selected.cls}`.toLowerCase();
    const matched = transportRoutes.find((r) =>
      r.mapFrom
        .toLowerCase()
        .split(/[ ,]+/)
        .some((token) => token.length > 3 && haystack.includes(token)),
    );
    return matched?.fee ?? transportRoutes[0]?.fee;
  }, [selected, transportRoutes]);

  const tuitionFee = useMemo(
    () => classConfigs.find((c) => c.className === selected?.cls)?.tuitionFeeAmount,
    [classConfigs, selected],
  );

  const prefill = useMemo(() => {
    const lower = category.toLowerCase();
    if (lower.includes("tuition")) return tuitionFee;
    if (lower.includes("vehicle") || lower.includes("transport") || lower.includes("bus"))
      return matchedRouteFee;
    return undefined;
  }, [category, tuitionFee, matchedRouteFee]);

  useEffect(() => {
    if (prefill !== undefined && prefill > 0) {
      setAmount(String(prefill));
    } else {
      setAmount("");
    }
  }, [prefill]);

  const handleRecord = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!selected) {
      toast.error("Select a valid student");
      return;
    }
    const now = new Date();
    const stamp = `Today · ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const newPayment: Payment = {
      id: `RC-${9822 + payments.length}`,
      name: selected.name,
      cat: category,
      mode,
      amount: value,
      time: stamp,
    };
    setPayments((prev) => [newPayment, ...prev]);
    setStudents((prev) =>
      prev.map((s) => (s.id === selected.id ? { ...s, due: Math.max(0, s.due - value) } : s)),
    );
    const remaining = Math.max(0, selected.due - value);
    toast.success(`Receipt ${newPayment.id} · ₹ ${value.toLocaleString("en-IN")} captured`, {
      description:
        remaining === 0
          ? `${selected.name}'s balance is now Cleared`
          : `${selected.name} · balance ₹ ${remaining.toLocaleString("en-IN")}`,
    });
    setAmount("");
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <OrganicCard tone="white" cornerSide="tr" padded className="lg:col-span-2">
        <div className="text-title">Inbound Fee Capture</div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Class</FieldLabel>
            <FieldSelect
              value={cls}
              onValueChange={(next) => {
                setCls(next);
                const first = students.find((s) => s.cls === next);
                if (first) setStu(first.name);
              }}
              options={classes.map((c) => ({ value: c, label: c }))}
              placeholder="Select class"
              disabled={classes.length === 0}
            />
          </div>
          <div>
            <FieldLabel>Student</FieldLabel>
            <FieldSelect
              value={stu}
              onValueChange={setStu}
              options={(studentsInClass.length ? studentsInClass : students).map((s) => ({
                value: s.name,
                label: s.name,
              }))}
              placeholder="Select student"
            />
          </div>
        </div>
        <div className="mt-4">
          <FieldLabel>Fee Categories</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {paymentCategories.length === 0 && (
              <span className="text-[12px] text-black/55">
                No categories configured · add them under Settings
              </span>
            )}
            {paymentCategories.map((c) => {
              const active = category === c.label;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.label)}
                  className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                    active
                      ? "border-transparent bg-[#C7F33C] text-black"
                      : "border-[#E5E5E5] text-black/65 hover:bg-[#F4F4F5]"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Amount (₹)</FieldLabel>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              placeholder="0"
              className="h-10 w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 font-mono text-[13px]"
            />
            {prefill !== undefined && prefill > 0 && (
              <p className="mt-1 text-[10.5px] text-black/45">
                Prefilled ₹ {prefill.toLocaleString("en-IN")} from Settings · {category}
              </p>
            )}
          </div>
          <div>
            <FieldLabel>Payment Mode</FieldLabel>
            <div className="flex gap-1 rounded-full border border-[#E5E5E5] bg-white p-1">
              {["Bank", "UPI", "Cash"].map((m) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      active ? "bg-black text-white" : "text-black/65 hover:text-black"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-[#F4F4F5] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[12.5px] text-black/65">
            Receipt for <span className="font-medium text-black">{stu}</span> · {cls} ·{" "}
            <span className="font-medium text-black">{category}</span> · {mode}
            {selected && selected.due > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 font-mono text-black">
                <AlertTriangle className="h-3 w-3" /> Due ₹ {selected.due.toLocaleString("en-IN")}
              </span>
            )}
            {selected && selected.due === 0 && (
              <span className="ml-2 font-mono text-black">· Cleared</span>
            )}
          </div>
          <button
            onClick={handleRecord}
            disabled={!Number(amount)}
            className="w-full shrink-0 rounded-full bg-black px-5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-colors hover:bg-black/85 disabled:opacity-50 sm:w-auto"
          >
            Record ₹ {(Number(amount) || 0).toLocaleString("en-IN")}
          </button>
        </div>
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="bl" padded>
        <div className="text-title">Payment History</div>
        <div className="mt-1 text-[11.5px] text-black/55">
          {payments.length} receipts · most recent
        </div>
        <div className="mt-3 max-h-[420px] divide-y divide-[#F0F0F0] overflow-y-auto">
          {payments.map((p) => (
            <div key={p.id} className="py-2.5">
              <div className="flex items-center justify-between gap-2 text-[12.5px]">
                <span className="font-medium text-black">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-black">
                    +₹ {p.amount.toLocaleString("en-IN")}
                  </span>
                  <button
                    type="button"
                    aria-label={`Download receipt ${p.id}`}
                    onClick={() => {
                      downloadReceiptPdf(p, schoolName, academicYear);
                      toast.success(`Receipt ${p.id} downloaded`);
                    }}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#E5E5E5] text-black/55 transition-colors hover:border-black hover:bg-[#F4F4F5] hover:text-black"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-0.5 flex items-center justify-between text-[10.5px] text-black/55">
                <span>
                  {p.cat} · {p.mode}
                </span>
                <span className="font-mono">{p.time}</span>
              </div>
            </div>
          ))}
        </div>
      </OrganicCard>
    </div>
  );
}

function MakePayment() {
  const [payee, setPayee] = useState("Salary");
  const [mode, setMode] = useState("Bank Transfer · NEFT");
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <OrganicCard tone="white" cornerSide="tr" padded className="lg:col-span-2">
        <div className="text-title">Outbound Disbursal</div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Payee Type</FieldLabel>
            <div className="flex gap-1 rounded-full border border-[#E5E5E5] bg-white p-1">
              {["Salary", "Vendor"].map((p) => {
                const active = payee === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPayee(p)}
                    className={`flex-1 rounded-full px-3 py-1.5 text-[12px] font-medium ${
                      active ? "bg-black text-white" : "text-black/65"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <FieldLabel>Beneficiary</FieldLabel>
            <input
              defaultValue="BrightBus Logistics Pvt. Ltd."
              className="h-10 w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 text-[13px]"
            />
          </div>
          <div className="col-span-2">
            <FieldLabel>Description / Line Items</FieldLabel>
            <textarea
              defaultValue="Bus diesel refill (1,240 L) + monthly preventive maintenance fleet of 12 vehicles"
              className="min-h-[80px] w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 py-2 text-[13px]"
            />
          </div>
          <div>
            <FieldLabel>Amount (₹)</FieldLabel>
            <input
              defaultValue="48200"
              className="h-10 w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 font-mono text-[13px]"
            />
          </div>
          <div>
            <FieldLabel>Mode</FieldLabel>
            <FieldSelect
              value={mode}
              onValueChange={setMode}
              options={[
                { value: "Bank Transfer · NEFT", label: "Bank Transfer · NEFT" },
                { value: "UPI Business", label: "UPI Business" },
                { value: "Cheque", label: "Cheque" },
              ]}
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            onClick={() => toast.success("Authorisation queued for treasury approval")}
            className="rounded-full bg-black px-5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-colors hover:bg-black/85"
          >
            Authorise Disbursal
          </button>
        </div>
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="bl" padded>
        <div className="text-title">Top Pending Obligations</div>
        <div className="mt-3 space-y-3">
          {PENDING_OBLIGATIONS.map((p, i) => {
            const isUrgent = i === 0;
            return (
              <div
                key={p.payee}
                className={`rounded-2xl p-3 ${
                  isUrgent ? "bg-[#C7F33C] text-black" : "bg-[#F4F4F5] text-black"
                }`}
              >
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-semibold">{p.payee}</span>
                  <span className="font-mono">₹ {p.amount.toLocaleString("en-IN")}</span>
                </div>
                <div
                  className={`mt-0.5 flex items-center justify-between text-[10.5px] ${
                    isUrgent ? "text-black/70" : "text-black/55"
                  }`}
                >
                  <span>{p.desc}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      isUrgent ? "bg-black text-[#C7F33C]" : "bg-black/10 text-black/65"
                    }`}
                  >
                    Due {p.due}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </OrganicCard>
    </div>
  );
}

function Donut({
  title,
  segments,
  cornerSide = "tr",
}: {
  title: string;
  segments: { label: string; value: number; color: string }[];
  cornerSide?: CornerSide;
}) {
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
    <OrganicCard tone="white" cornerSide={cornerSide} arrow padded>
      <div className="text-title">{title}</div>
      <div className="mt-4 flex items-center gap-5">
        <div
          className="relative h-36 w-36 rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div className="absolute inset-4 grid place-items-center rounded-full bg-white">
            <div className="text-center">
              <div className="font-mono text-lg font-semibold text-black">
                ₹ {total.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-black/45">Total</div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-[12.5px]">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
              <span className="flex-1 text-black/65">{s.label}</span>
              <span className="font-mono text-black">₹ {s.value.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      </div>
    </OrganicCard>
  );
}

function LedgerAnalytics() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Donut
        title="Income Distribution"
        cornerSide="tr"
        segments={[
          { label: "Tuition", value: 1840000, color: "#000000" },
          { label: "Transport", value: 320000, color: "#C7F33C" },
          { label: "Donations", value: 95000, color: "#E1F2AE" },
          { label: "Other", value: 42000, color: "#9CA3AF" },
        ]}
      />
      <Donut
        title="Monthly Outflow Breakdown"
        cornerSide="bl"
        segments={[
          { label: "Salaries", value: 1220000, color: "#000000" },
          { label: "Vehicle Upkeep", value: 184000, color: "#C7F33C" },
          { label: "Utilities", value: 88000, color: "#E1F2AE" },
          { label: "Rent", value: 240000, color: "#9CA3AF" },
        ]}
      />
    </div>
  );
}

export function SchoolSettings() {
  const {
    departments,
    setDepartments,
    roles,
    setRoles,
    classes,
    setClasses,
    transportRoutes,
    setTransportRoutes,
    paymentCategories,
    setPaymentCategories,
    academicYear,
    setAcademicYear,
    themeSettings,
    setThemeSettings,
    staff,
    setStaff,
    students,
    setStudents,
  } = useTenantStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-heading">Tenant Settings</h1>
          <p className="mt-2 text-[14px] text-black/55">
            Configure organisational structure, fee tiers, and ledger constants for this workspace
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-[12px] font-semibold text-black">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C7F33C]" /> {academicYear}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <DepartmentsCard
          departments={departments}
          setDepartments={setDepartments}
          staff={staff}
          setStaff={setStaff}
          roles={roles}
        />
        <RolesCard
          roles={roles}
          setRoles={setRoles}
          departments={departments}
          staff={staff}
          setStaff={setStaff}
        />
        <ClassesCard
          classes={classes}
          setClasses={setClasses}
          students={students}
          setStudents={setStudents}
        />
        <TransportCard transportRoutes={transportRoutes} setTransportRoutes={setTransportRoutes} />
        <CategoriesCard
          paymentCategories={paymentCategories}
          setPaymentCategories={setPaymentCategories}
          academicYear={academicYear}
          setAcademicYear={setAcademicYear}
          themeSettings={themeSettings}
          setThemeSettings={setThemeSettings}
        />
      </div>
    </div>
  );
}

function CardHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[18px] font-bold leading-tight tracking-tight text-black">
          {title}
        </div>
        <p className="mt-1 text-[12px] text-black/55">{subtitle}</p>
      </div>
      <button
        onClick={onAction}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-black px-3 py-2 text-[11.5px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] transition-colors hover:bg-black/85"
        aria-label={actionLabel}
      >
        <Plus className="h-3.5 w-3.5" /> Add
      </button>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/15 bg-[#F4F4F5]/40 px-4 py-6 text-center text-[12px] text-black/55">
      {label}
    </div>
  );
}

function DepartmentsCard({
  departments,
  setDepartments,
  staff,
  setStaff,
  roles,
}: {
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  roles: Role[];
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "" });

  const startCreate = () => {
    setEditingId(null);
    setForm({ name: "", code: "" });
    setOpen(true);
  };
  const startEdit = (d: Department) => {
    setEditingId(d.id);
    setForm({ name: d.name, code: d.code });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    if (!name || !code) {
      toast.error("Department name and code are required");
      return;
    }
    if (editingId) {
      const previous = departments.find((d) => d.id === editingId);
      setDepartments((prev) => prev.map((d) => (d.id === editingId ? { ...d, name, code } : d)));
      if (previous && previous.name !== name) {
        setStaff((prev) => prev.map((s) => (s.dept === previous.name ? { ...s, dept: name } : s)));
      }
      toast.success(`Department updated · ${name}`);
    } else {
      const nextId = `DEP-${(departments.length + 1).toString().padStart(3, "0")}`;
      setDepartments((prev) => [...prev, { id: nextId, name, code }]);
      toast.success(`Department added · ${name}`);
    }
    setOpen(false);
  };

  const remove = (d: Department) => {
    const usedByStaff = staff.some((s) => s.dept === d.name);
    const usedByRole = roles.some((r) => r.departmentId === d.id);
    if (usedByStaff || usedByRole) {
      toast.error(`${d.name} is in use`, {
        description: usedByStaff
          ? "Reassign staff before deleting"
          : "Detach roles before deleting",
      });
      return;
    }
    setDepartments((prev) => prev.filter((x) => x.id !== d.id));
    toast.error(`${d.name} removed`);
  };

  return (
    <OrganicCard tone="white" cornerSide="tr" arrow padded>
      <CardHeader
        title="Departments"
        subtitle={`${departments.length} divisions · live staff counts`}
        actionLabel="Add Department"
        onAction={startCreate}
      />

      <div className="mt-4 space-y-2">
        {departments.length === 0 && <EmptyRow label="No departments yet" />}
        {departments.map((d) => {
          const count = staff.filter((s) => s.dept === d.name).length;
          return (
            <div
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-black text-[10.5px] font-semibold text-white">
                  {d.code.slice(0, 3)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-black">{d.name}</div>
                  <div className="font-mono text-[10.5px] uppercase tracking-wider text-black/45">
                    {d.code}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-[#E1F2AE] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-black">
                  {count} staff
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="grid h-8 w-8 place-items-center rounded-full text-black/55 hover:bg-black/5 hover:text-black"
                      aria-label="More"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 rounded-2xl">
                    <DropdownMenuItem onClick={() => startEdit(d)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => remove(d)}
                      className="text-[#B91C1C] focus:text-[#B91C1C]"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Rename Department" : "Add Department"}</DialogTitle>
            <DialogDescription>
              Define a new organisational unit. Staff and roles can be assigned to it immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Department Name
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Library Sciences"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Department Code
              </Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. LIB"
                className="font-mono uppercase"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
                {editingId ? "Save" : "Add Department"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrganicCard>
  );
}

function RolesCard({
  roles,
  setRoles,
  departments,
  staff,
  setStaff,
}: {
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  departments: Department[];
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    departmentId: departments[0]?.id ?? "",
  });

  const startCreate = () => {
    setEditingId(null);
    setForm({ title: "", departmentId: departments[0]?.id ?? "" });
    setOpen(true);
  };
  const startEdit = (r: Role) => {
    setEditingId(r.id);
    setForm({ title: r.title, departmentId: r.departmentId });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      toast.error("Role title is required");
      return;
    }
    if (!form.departmentId) {
      toast.error("Pick a parent department");
      return;
    }
    if (editingId) {
      const previous = roles.find((r) => r.id === editingId);
      setRoles((prev) =>
        prev.map((r) =>
          r.id === editingId ? { ...r, title, departmentId: form.departmentId } : r,
        ),
      );
      if (previous && previous.title !== title) {
        setStaff((prev) =>
          prev.map((s) => (s.role === previous.title ? { ...s, role: title } : s)),
        );
      }
      toast.success(`Role updated · ${title}`);
    } else {
      const nextId = `ROL-${(roles.length + 1).toString().padStart(3, "0")}`;
      setRoles((prev) => [...prev, { id: nextId, title, departmentId: form.departmentId }]);
      toast.success(`Role added · ${title}`);
    }
    setOpen(false);
  };

  const remove = (r: Role) => {
    const usedByStaff = staff.some((s) => s.role === r.title);
    if (usedByStaff) {
      toast.error(`${r.title} is in use`, { description: "Reassign staff before deleting" });
      return;
    }
    setRoles((prev) => prev.filter((x) => x.id !== r.id));
    toast.error(`${r.title} removed`);
  };

  return (
    <OrganicCard tone="white" cornerSide="bl" arrow padded>
      <CardHeader
        title="Roles"
        subtitle={`${roles.length} role definitions · select in Recruit Staff`}
        actionLabel="Add Role"
        onAction={startCreate}
      />

      <div className="mt-4 space-y-2">
        {roles.length === 0 && <EmptyRow label="No roles defined yet" />}
        {roles.map((r) => {
          const dept = departments.find((d) => d.id === r.departmentId);
          return (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-black">{r.title}</div>
                <div className="text-[11.5px] text-black/55">{dept?.name ?? "Unassigned"}</div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-black/55 hover:bg-black/5 hover:text-black"
                    aria-label="More"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-2xl">
                  <DropdownMenuItem onClick={() => startEdit(r)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => remove(r)}
                    className="text-[#B91C1C] focus:text-[#B91C1C]"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Rename Role" : "Add Role"}</DialogTitle>
            <DialogDescription>
              Roles defined here become selectable inside the Recruit Staff workflow.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Role Title
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Chemistry · HOD"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Parent Department
              </Label>
              <FieldSelect
                value={form.departmentId}
                onValueChange={(departmentId) => setForm({ ...form, departmentId })}
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
                placeholder="Select department"
                disabled={departments.length === 0}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
                {editingId ? "Save" : "Add Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrganicCard>
  );
}

function ClassesCard({
  classes,
  setClasses,
  students,
  setStudents,
}: {
  classes: ClassConfig[];
  setClasses: React.Dispatch<React.SetStateAction<ClassConfig[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    className: string;
    tuitionFeeAmount: string;
    billingCycle: ClassConfig["billingCycle"];
  }>({ className: "", tuitionFeeAmount: "", billingCycle: "Monthly" });

  const startCreate = () => {
    setEditingId(null);
    setForm({ className: "", tuitionFeeAmount: "", billingCycle: "Monthly" });
    setOpen(true);
  };
  const startEdit = (c: ClassConfig) => {
    setEditingId(c.id);
    setForm({
      className: c.className,
      tuitionFeeAmount: String(c.tuitionFeeAmount),
      billingCycle: c.billingCycle,
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const className = form.className.trim();
    const tuitionFeeAmount = Number(form.tuitionFeeAmount);
    if (!className) {
      toast.error("Class name is required");
      return;
    }
    if (!tuitionFeeAmount || tuitionFeeAmount <= 0) {
      toast.error("Tuition fee must be a positive amount");
      return;
    }
    if (editingId) {
      const previous = classes.find((c) => c.id === editingId);
      setClasses((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, className, tuitionFeeAmount, billingCycle: form.billingCycle }
            : c,
        ),
      );
      if (previous && previous.className !== className) {
        setStudents((prev) =>
          prev.map((s) => (s.cls === previous.className ? { ...s, cls: className } : s)),
        );
      }
      toast.success(`${className} updated`, {
        description: `Receipts will prefill ₹ ${tuitionFeeAmount.toLocaleString("en-IN")}`,
      });
    } else {
      const nextId = `CLS-${(classes.length + 1).toString().padStart(3, "0")}`;
      setClasses((prev) => [
        ...prev,
        { id: nextId, className, tuitionFeeAmount, billingCycle: form.billingCycle },
      ]);
      toast.success(`${className} added`);
    }
    setOpen(false);
  };

  const remove = (c: ClassConfig) => {
    const enrolled = students.some((s) => s.cls === c.className);
    if (enrolled) {
      toast.error(`${c.className} has students enrolled`, {
        description: "Move them to another class first",
      });
      return;
    }
    setClasses((prev) => prev.filter((x) => x.id !== c.id));
    toast.error(`${c.className} removed`);
  };

  return (
    <OrganicCard tone="white" cornerSide="tr" arrow padded>
      <CardHeader
        title="Class Tiers & Tuition"
        subtitle="Receipt amounts prefill from this matrix"
        actionLabel="Add Class"
        onAction={startCreate}
      />

      <div className="mt-4 space-y-2">
        {classes.length === 0 && <EmptyRow label="No class tiers configured" />}
        {classes.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-2.5"
          >
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-black">{c.className}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-black/55">
                <span className="font-mono text-black">
                  ₹ {c.tuitionFeeAmount.toLocaleString("en-IN")}
                </span>
                <span className="rounded-full bg-[#E1F2AE] px-2 py-0.5 text-[10.5px] font-semibold text-black">
                  {c.billingCycle}
                </span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-black/55 hover:bg-black/5 hover:text-black"
                  aria-label="More"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-2xl">
                <DropdownMenuItem onClick={() => startEdit(c)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => remove(c)}
                  className="text-[#B91C1C] focus:text-[#B91C1C]"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Class Tier" : "Add Class Tier"}</DialogTitle>
            <DialogDescription>
              Tuition fees set here drive the prefill amount inside Finance · Receive Payment.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Class / Grade Name
              </Label>
              <Input
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
                placeholder="e.g. Grade 8 - B"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                  Tuition Fee (₹)
                </Label>
                <Input
                  inputMode="numeric"
                  value={form.tuitionFeeAmount}
                  onChange={(e) =>
                    setForm({ ...form, tuitionFeeAmount: e.target.value.replace(/[^0-9]/g, "") })
                  }
                  placeholder="0"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                  Billing Cycle
                </Label>
                <FieldSelect
                  value={form.billingCycle}
                  onValueChange={(billingCycle) =>
                    setForm({
                      ...form,
                      billingCycle: billingCycle as ClassConfig["billingCycle"],
                    })
                  }
                  options={[
                    { value: "Monthly", label: "Monthly" },
                    { value: "Annually", label: "Annually" },
                  ]}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
                {editingId ? "Save" : "Add Class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrganicCard>
  );
}

function TransportCard({
  transportRoutes,
  setTransportRoutes,
}: {
  transportRoutes: TransportRoute[];
  setTransportRoutes: React.Dispatch<React.SetStateAction<TransportRoute[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ mapFrom: "", mapTo: "", fee: "" });

  const startCreate = () => {
    setEditingId(null);
    setForm({ mapFrom: "", mapTo: "", fee: "" });
    setOpen(true);
  };
  const startEdit = (r: TransportRoute) => {
    setEditingId(r.id);
    setForm({ mapFrom: r.mapFrom, mapTo: r.mapTo, fee: String(r.fee) });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const mapFrom = form.mapFrom.trim();
    const mapTo = form.mapTo.trim();
    const fee = Number(form.fee);
    if (!mapFrom || !mapTo) {
      toast.error("Pickup hub and destination are required");
      return;
    }
    if (!fee || fee <= 0) {
      toast.error("Fee must be a positive amount");
      return;
    }
    if (editingId) {
      setTransportRoutes((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, mapFrom, mapTo, fee } : r)),
      );
      toast.success(`Route updated · ${mapFrom} → ${mapTo}`);
    } else {
      const nextId = `TR-${(transportRoutes.length + 1).toString().padStart(3, "0")}`;
      setTransportRoutes((prev) => [...prev, { id: nextId, mapFrom, mapTo, fee }]);
      toast.success(`Route added · ${mapFrom} → ${mapTo}`);
    }
    setOpen(false);
  };

  const remove = (r: TransportRoute) => {
    setTransportRoutes((prev) => prev.filter((x) => x.id !== r.id));
    toast.error(`${r.mapFrom} → ${r.mapTo} removed`);
  };

  return (
    <OrganicCard tone="white" cornerSide="bl" arrow padded>
      <CardHeader
        title="Transport Routes"
        subtitle={`${transportRoutes.length} mapped pickup → drop pairs`}
        actionLabel="Add Route"
        onAction={startCreate}
      />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-[#EFEFEF]">
        <div className="min-w-[320px]">
          <div className="grid grid-cols-[1.4fr_1.4fr_0.7fr_auto] gap-2 bg-[#F4F4F5] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-black/55">
            <span>From</span>
            <span>To</span>
            <span className="text-right">Fee</span>
            <span />
          </div>
          {transportRoutes.length === 0 ? (
            <div className="px-3.5 py-6 text-center text-[12px] text-black/55">
              No routes mapped yet
            </div>
          ) : (
            transportRoutes.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-[1.4fr_1.4fr_0.7fr_auto] items-center gap-2 border-t border-[#EFEFEF] px-3.5 py-2.5 text-[12.5px] last:border-b-0"
              >
                <span className="truncate text-black">{r.mapFrom}</span>
                <span className="truncate text-black/75">{r.mapTo}</span>
                <span className="text-right font-mono text-black">
                  ₹ {r.fee.toLocaleString("en-IN")}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="grid h-7 w-7 place-items-center rounded-full text-black/55 hover:bg-black/5 hover:text-black"
                      aria-label="More"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-2xl">
                    <DropdownMenuItem onClick={() => startEdit(r)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => remove(r)}
                      className="text-[#B91C1C] focus:text-[#B91C1C]"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Route" : "Add Transport Route"}</DialogTitle>
            <DialogDescription>
              Routes feed the Vehicle Fee prefill on Receive Payment when a student matches the
              pickup hub.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Map From (Pickup Hub)
              </Label>
              <Input
                value={form.mapFrom}
                onChange={(e) => setForm({ ...form, mapFrom: e.target.value })}
                placeholder="e.g. Lotus Greens Sector 21"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Map To (Destination Node)
              </Label>
              <Input
                value={form.mapTo}
                onChange={(e) => setForm({ ...form, mapTo: e.target.value })}
                placeholder="e.g. Main Campus Drop-off"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Fee (₹)
              </Label>
              <Input
                inputMode="numeric"
                value={form.fee}
                onChange={(e) => setForm({ ...form, fee: e.target.value.replace(/[^0-9]/g, "") })}
                placeholder="0"
                className="font-mono"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
                {editingId ? "Save" : "Add Route"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrganicCard>
  );
}

function CategoriesCard({
  paymentCategories,
  setPaymentCategories,
  academicYear,
  setAcademicYear,
  themeSettings,
  setThemeSettings,
}: {
  paymentCategories: PaymentCategory[];
  setPaymentCategories: React.Dispatch<React.SetStateAction<PaymentCategory[]>>;
  academicYear: string;
  setAcademicYear: React.Dispatch<React.SetStateAction<string>>;
  themeSettings: ThemeSettings;
  setThemeSettings: React.Dispatch<React.SetStateAction<ThemeSettings>>;
}) {
  const [draft, setDraft] = useState("");

  const addCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const label = draft.trim();
    if (!label) return;
    if (paymentCategories.some((c) => c.label.toLowerCase() === label.toLowerCase())) {
      toast.error(`${label} already exists`);
      return;
    }
    const nextId = `PC-${(paymentCategories.length + 1).toString().padStart(3, "0")}`;
    setPaymentCategories((prev) => [...prev, { id: nextId, label }]);
    toast.success(`Category added · ${label}`, {
      description: "Now selectable on Receive Payment",
    });
    setDraft("");
  };

  const removeCategory = (c: PaymentCategory) => {
    setPaymentCategories((prev) => prev.filter((x) => x.id !== c.id));
    toast.error(`${c.label} removed`, { description: "Existing receipts retain the label" });
  };

  return (
    <OrganicCard tone="white" cornerSide="tr" arrow padded>
      <div className="text-[18px] font-bold leading-tight tracking-tight text-black">
        System Constants
      </div>
      <p className="mt-1 text-[12px] text-black/55">
        Academic year, theme frame, and payment categories for Finance selectors
      </p>

      <div className="mt-4 grid gap-3 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5">
        <div>
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
            Academic Year
          </Label>
          <FieldSelect
            value={academicYear}
            onValueChange={(y) => {
              setAcademicYear(y);
              toast.success(`Academic year set to ${y}`);
            }}
            options={ACADEMIC_YEAR_OPTIONS.map((y) => ({ value: y, label: y }))}
            className="mt-1.5 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <ThemeSelect
            label="Theme"
            value={themeSettings.mode}
            options={THEME_MODE_OPTIONS}
            onChange={(mode) => {
              setThemeSettings((prev) => ({ ...prev, mode }));
              toast.success(`Theme mode set to ${mode}`);
            }}
          />
          <ThemeSelect
            label="Accent"
            value={themeSettings.accent}
            options={THEME_ACCENT_OPTIONS}
            onChange={(accent) => {
              setThemeSettings((prev) => ({ ...prev, accent }));
              toast.success(`Accent set to ${accent}`);
            }}
          />
          <ThemeSelect
            label="Density"
            value={themeSettings.density}
            options={THEME_DENSITY_OPTIONS}
            onChange={(density) => {
              setThemeSettings((prev) => ({ ...prev, density }));
              toast.success(`Workspace density set to ${density}`);
            }}
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
            Payment Categories
          </Label>
          <span className="font-mono text-[10.5px] text-black/45">
            {paymentCategories.length} active
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {paymentCategories.length === 0 && (
            <span className="text-[12px] text-black/55">No categories defined</span>
          )}
          {paymentCategories.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#E1F2AE] px-3 py-1 text-[12px] font-semibold text-black"
            >
              {c.label}
              <button
                onClick={() => removeCategory(c)}
                className="grid h-4 w-4 place-items-center rounded-full text-black/55 hover:bg-black hover:text-white"
                aria-label={`Remove ${c.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={addCategory} className="mt-3 flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Lab Fee"
            className="flex-1"
          />
          <Button type="submit" className="rounded-full bg-black text-white hover:bg-black/85">
            <Plus className="mr-1 h-3.5 w-3.5" /> Add
          </Button>
        </form>
      </div>
    </OrganicCard>
  );
}

function ThemeSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="space-y-1.5">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-black/45">
        {label}
      </span>
      <FieldSelect
        value={value}
        onValueChange={(next) => onChange(next as T)}
        options={options.map((option) => ({ value: option, label: option }))}
        triggerClassName="h-9 px-2.5 text-[12px] font-medium"
      />
    </label>
  );
}

function FieldSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  disabled,
  className,
  triggerClassName,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}) {
  const resolvedValue = options.some((o) => o.value === value) ? value : undefined;

  return (
    <div className={className}>
      <Select value={resolvedValue} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          className={cn(
            "h-10 w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 text-[13px] font-normal text-black shadow-none focus:ring-2 focus:ring-[#C7F33C] focus:ring-offset-0",
            triggerClassName,
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          position="popper"
          className="z-[250] rounded-2xl border border-[#E5E5E5] bg-white p-1.5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.22)]"
        >
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="cursor-pointer rounded-xl py-2 pl-3 pr-8 text-[13px] text-black focus:bg-[#E1F2AE] focus:text-black data-[highlighted]:bg-[#E1F2AE] data-[highlighted]:text-black data-[state=checked]:bg-[#C7F33C] data-[state=checked]:font-semibold data-[state=checked]:text-black"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
