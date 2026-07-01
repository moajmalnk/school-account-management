import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  MessageCircle,
  Pencil,
  Check,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { OrganicCard } from "@/components/ui/organic-card";
import type { Student } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

type LedgerStatus = "Paid" | "Partially Paid" | "Overdue";

type LedgerRow = {
  date: string;
  desc: string;
  due: string;
  charge: number;
  paid: number;
  balance: number;
  status: LedgerStatus;
};

type Receipt = {
  id: string;
  date: string;
  amount: number;
  mode: string;
};

const META_LABEL = "text-black/45 font-semibold tracking-wider text-[11px] uppercase";

const inr = (n: number) => `₹ ${n.toLocaleString("en-IN")}`;

function deriveFees(due: number) {
  const factor = due === 0 ? 0 : due / 5500;
  const round = (n: number) => Math.round(n);
  return {
    factor,
    totalDue: due === 0 ? 12000 : round(12000 * factor),
    totalPaid: due === 0 ? 12000 : round(6500 * factor),
    balance: due,
    overdue: due > 0,
  };
}

function deriveLedger(due: number): LedgerRow[] {
  const factor = due === 0 ? 1 : due / 5500;
  const round = (n: number) => Math.round(n);

  if (due === 0) {
    return [
      {
        date: "1/12/25",
        desc: "Tuition Fee",
        due: "05/08/25",
        charge: 4000,
        paid: 4000,
        balance: 0,
        status: "Paid",
      },
      {
        date: "12/05/25",
        desc: "Annual Fee",
        due: "04/05/26",
        charge: 800,
        paid: 800,
        balance: 0,
        status: "Paid",
      },
      {
        date: "19/06/25",
        desc: "Vehicle Fee",
        due: "12/12/24",
        charge: 800,
        paid: 800,
        balance: 0,
        status: "Paid",
      },
    ];
  }

  return [
    {
      date: "1/12/25",
      desc: "Tuition Fee",
      due: "05/08/25",
      charge: round(4000 * factor),
      paid: round(2500 * factor),
      balance: round(1500 * factor),
      status: "Partially Paid",
    },
    {
      date: "12/05/25",
      desc: "Annual Fee",
      due: "04/05/26",
      charge: round(800 * factor),
      paid: round(800 * factor),
      balance: 0,
      status: "Paid",
    },
    {
      date: "19/06/25",
      desc: "Vehicle Fee",
      due: "12/12/24",
      charge: round(800 * factor),
      paid: 0,
      balance: round(800 * factor),
      status: "Overdue",
    },
  ];
}

function deriveReceipts(due: number): Receipt[] {
  const factor = due === 0 ? 1 : due / 5500;
  const round = (n: number) => Math.round(n);
  return [
    { id: "REC-2026-104", date: "12/01/2026", amount: round(2500 * factor), mode: "UPI - GPay" },
    { id: "REC-2025-098", date: "08/11/2025", amount: round(800 * factor), mode: "Bank - NEFT" },
    {
      id: "REC-2025-072",
      date: "22/09/2025",
      amount: round(3200 * factor),
      mode: "Cash - Counter",
    },
  ];
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function StudentProfileDetail({
  student,
  onBack,
}: {
  student: Student;
  onBack: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    guardian: student.guardian,
    phone: student.phone ?? "",
    dob: student.dob ?? "",
    email: student.email ?? "",
    address: student.address ?? "",
  });

  const fees = useMemo(() => deriveFees(student.due), [student.due]);
  const ledger = useMemo(() => deriveLedger(student.due), [student.due]);
  const receipts = useMemo(() => deriveReceipts(student.due), [student.due]);

  const phoneDigits = (draft.phone || "").replace(/[^0-9]/g, "");
  const waHref = phoneDigits
    ? `https://wa.me/${phoneDigits.length === 10 ? "91" : ""}${phoneDigits}`
    : undefined;

  const toggleEdit = () => {
    if (editing) {
      toast.success(`${student.name}'s profile updated`, {
        description: "Local draft saved · sync to ledger on next push",
      });
    }
    setEditing((e) => !e);
  };

  return (
    <div className="flex flex-col gap-6 lg:min-h-[calc(100dvh-3rem)]">
      <TopBar
        studentName={student.name}
        onBack={onBack}
        editing={editing}
        onToggleEdit={toggleEdit}
      />

      <div className="grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-12 lg:items-stretch">
        <OrganicCard
          tone="white"
          cornerSide="tr"
          padded
          className="flex flex-col lg:col-span-4 lg:h-full lg:min-h-0"
        >
          <IdentityHeader student={student} />

          <div className="mt-6 flex min-h-0 flex-1 flex-col gap-5">
            <MetaField
              label="Guardian"
              value={draft.guardian}
              editing={editing}
              onChange={(v) => setDraft({ ...draft, guardian: v })}
              placeholder="Guardian full name"
            />

            <div>
              <div className={META_LABEL}>Contact Phone</div>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                {editing ? (
                  <Input
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                    placeholder="9810045221"
                    className="h-9 flex-1 font-mono text-[13px]"
                  />
                ) : (
                  <span className="font-mono text-[14px] font-medium text-black">
                    {draft.phone || "—"}
                  </span>
                )}
                {waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 rounded-full bg-[#C7F33C] px-2.5 py-1 text-[11px] font-semibold text-black shadow-sm transition-colors hover:bg-black hover:text-white"
                  >
                    <MessageCircle className="h-3 w-3" /> Quick Connect
                  </a>
                )}
              </div>
            </div>

            <MetaField
              label="Date of Birth"
              value={draft.dob}
              editing={editing}
              onChange={(v) => setDraft({ ...draft, dob: v })}
              placeholder="14 Mar 2012"
              date
            />

            <MetaField
              label="Email Address"
              value={draft.email}
              editing={editing}
              onChange={(v) => setDraft({ ...draft, email: v })}
              placeholder="aarav.sharma@silverhills.in"
              mono
            />

            <MetaField
              label="Residential Mailing Address"
              value={draft.address}
              editing={editing}
              onChange={(v) => setDraft({ ...draft, address: v })}
              placeholder="B-204, Lotus Greens, Sector 21, Noida 201301"
              multiline
              fill
            />
          </div>
        </OrganicCard>

        <div className="lg:col-span-8">
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <MetricTile label="Total Due" value={inr(fees.totalDue)} cornerSide="tr" />
            <MetricTile
              label="Total Paid"
              value={inr(fees.totalPaid)}
              cornerSide="bl"
              valueClassName="text-black"
            />
            <BalanceTile balance={fees.balance} overdue={fees.overdue} />
          </div>

          <FeesTable ledger={ledger} />

          <div className="mt-6">
            <ReceiptsList receipts={receipts} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TopBar({
  studentName,
  onBack,
  editing,
  onToggleEdit,
}: {
  studentName: string;
  onBack: () => void;
  editing: boolean;
  onToggleEdit: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-[14px]">
          <button
            onClick={onBack}
            className="font-medium text-black/55 transition-colors hover:text-black"
          >
            Students
          </button>
          <span className="text-black/30">/</span>
          <span className="font-semibold text-black">{studentName}</span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <button
          onClick={onBack}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-[13px] font-medium text-black/75 shadow-sm transition-colors hover:bg-[#F4F4F5] sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4" /> Back to list
        </button>
        <button
          onClick={onToggleEdit}
          className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-semibold shadow-sm transition-colors sm:w-auto ${
            editing
              ? "bg-[#C7F33C] text-black hover:bg-[#E1F2AE]"
              : "bg-black text-white hover:bg-black/85"
          }`}
        >
          {editing ? (
            <>
              <Check className="h-4 w-4" /> Save Profile
            </>
          ) : (
            <>
              <Pencil className="h-4 w-4" /> Edit Profile
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function IdentityHeader({ student }: { student: Student }) {
  return (
    <div className="flex items-center gap-4">
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-black text-lg font-semibold text-white">
        {initials(student.name)}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[18px] font-semibold text-black">{student.name}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-[#F4F4F5] px-2.5 py-0.5 font-mono text-[10.5px] font-medium text-black/65">
            {student.id}
          </span>
          <span className="rounded-full bg-[#E1F2AE] px-2.5 py-0.5 text-[10.5px] font-medium text-black">
            {student.cls}
          </span>
          {student.gender && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${
                student.gender === "F" ? "bg-black text-[#C7F33C]" : "bg-black text-white"
              }`}
            >
              {student.gender}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function MetaField({
  label,
  value,
  editing,
  onChange,
  placeholder,
  mono,
  multiline,
  date,
  fill,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  multiline?: boolean;
  date?: boolean;
  fill?: boolean;
}) {
  return (
    <div className={cn(fill && "flex min-h-0 flex-1 flex-col")}>
      <div className={META_LABEL}>{label}</div>
      <div className={cn("mt-1.5", fill && "flex min-h-0 flex-1 flex-col")}>
        {editing ? (
          date ? (
            <DatePicker
              value={value}
              onChange={onChange}
              placeholder={placeholder ?? "Pick a date"}
              valueFormat="display"
              variant="pill"
              quickPicks={[]}
              min="1990-01-01"
              max={todayISO()}
              className="h-9"
            />
          ) : multiline ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "w-full rounded-2xl border border-[#E5E5E5] bg-white px-3 py-2 text-[13px] text-black shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10",
                fill ? "min-h-[120px] flex-1 resize-none lg:min-h-0" : "min-h-[64px]",
              )}
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={`h-9 text-[13px] ${mono ? "font-mono" : ""}`}
            />
          )
        ) : (
          <div
            className={cn(
              "text-[14px] font-medium",
              mono && "font-mono",
              multiline ? "whitespace-pre-line leading-snug text-black/85" : "text-black",
              fill && "min-h-0 flex-1",
            )}
          >
            {value || <span className="font-normal text-black/40">—</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  cornerSide,
  valueClassName,
}: {
  label: string;
  value: string;
  cornerSide: "tl" | "tr" | "bl" | "br";
  valueClassName?: string;
}) {
  return (
    <OrganicCard tone="white" cornerSide={cornerSide} padded>
      <div className="flex items-start justify-between">
        <div className={META_LABEL}>{label}</div>
        <span className="h-2.5 w-2.5 rounded-full bg-black" />
      </div>
      <div
        className={`mt-3 font-mono text-2xl font-semibold tracking-tight ${
          valueClassName ?? "text-black"
        }`}
      >
        {value}
      </div>
    </OrganicCard>
  );
}

function BalanceTile({ balance, overdue }: { balance: number; overdue: boolean }) {
  if (!overdue) {
    return (
      <OrganicCard tone="white" cornerSide="br" padded>
        <div className="flex items-start justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
            Current Balance
          </div>
          <CheckCircle2 className="h-4 w-4 text-black" />
        </div>
        <div className="mt-3 font-mono text-2xl font-semibold tracking-tight text-black">
          {inr(balance)}
        </div>
        <span className="mt-2 inline-flex items-center rounded-full bg-black px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#C7F33C]">
          [ CLEARED ]
        </span>
      </OrganicCard>
    );
  }
  return (
    <OrganicCard tone="lime" cornerSide="br" padded>
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-black/70">
          Current Balance
        </div>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-black">
          <AlertTriangle className="h-3.5 w-3.5 text-[#C7F33C]" />
        </span>
      </div>
      <div className="mt-3 font-mono text-2xl font-semibold tracking-tight text-black">
        {inr(balance)}
      </div>
      <span className="overdue-flash mt-2 inline-flex items-center rounded-full bg-black px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#C7F33C]">
        [ OVERDUE ]
      </span>
    </OrganicCard>
  );
}

function FeesTable({ ledger }: { ledger: LedgerRow[] }) {
  return (
    <OrganicCard tone="white" cornerSide="tr" padded>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="text-title">Fees Details</div>
          <div className="mt-1 text-[12px] text-black/55">
            Statement ledger sheet · {ledger.length} line items on file
          </div>
        </div>
        <span className="rounded-full border border-[#E5E5E5] bg-[#F4F4F5] px-2.5 py-1 font-mono text-[10.5px] font-medium text-black/65">
          AY 2025-26
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="border-b border-[#E5E5E5] pb-4 pl-1 pr-4 text-[11px] font-semibold uppercase tracking-wider text-black/45">
                Date
              </th>
              <th className="border-b border-[#E5E5E5] px-4 pb-4 text-[11px] font-semibold uppercase tracking-wider text-black/45">
                Description
              </th>
              <th className="border-b border-[#E5E5E5] px-4 pb-4 text-[11px] font-semibold uppercase tracking-wider text-black/45">
                Due Date
              </th>
              <th className="border-b border-[#E5E5E5] px-4 pb-4 text-right text-[11px] font-semibold uppercase tracking-wider text-black/45">
                Charge Amount
              </th>
              <th className="border-b border-[#E5E5E5] px-4 pb-4 text-right text-[11px] font-semibold uppercase tracking-wider text-black/45">
                Paid Amount
              </th>
              <th className="border-b border-[#E5E5E5] px-4 pb-4 text-right text-[11px] font-semibold uppercase tracking-wider text-black/45">
                Balance
              </th>
              <th className="border-b border-[#E5E5E5] pb-4 pl-4 pr-1 text-[11px] font-semibold uppercase tracking-wider text-black/45">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((r, i) => (
              <tr
                key={i}
                className="border-b border-[#F0F0F0] transition-colors last:border-b-0 hover:bg-[#F4F4F5]"
              >
                <td className="py-4 pl-1 pr-4 font-mono text-[13px] text-black/55">{r.date}</td>
                <td className="px-4 py-4 text-[13px] font-medium text-black">{r.desc}</td>
                <td className="px-4 py-4 font-mono text-[13px] text-black/55">{r.due}</td>
                <td className="px-4 py-4 text-right font-mono text-[13px] text-black/75">
                  {inr(r.charge)}
                </td>
                <td className="px-4 py-4 text-right font-mono text-[13px] font-medium text-black">
                  {inr(r.paid)}
                </td>
                <td
                  className={`px-4 py-4 text-right font-mono text-[13px] ${
                    r.balance === 0 ? "text-black/40" : "text-black"
                  }`}
                >
                  {inr(r.balance)}
                </td>
                <td className="py-4 pl-4 pr-1">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </OrganicCard>
  );
}

function ReceiptsList({ receipts }: { receipts: Receipt[] }) {
  return (
    <OrganicCard tone="white" cornerSide="bl" padded>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-title">Receipts</div>
          <div className="mt-1 text-[12px] text-black/55">
            {receipts.length} historical digital receipts
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#C7F33C] px-2.5 py-1 text-[10.5px] font-semibold text-black">
          <span className="h-1.5 w-1.5 rounded-full bg-black" />
          Reconciled
        </span>
      </div>
      <ul className="divide-y divide-[#F0F0F0]">
        {receipts.map((r) => (
          <li
            key={r.id}
            className="-mx-2 flex items-center gap-4 rounded-2xl px-3 py-3.5 transition-colors hover:bg-[#F4F4F5]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[13px] font-semibold text-black">{r.id}</span>
                <span className="rounded-full bg-[#F4F4F5] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-black/65">
                  {r.mode}
                </span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-black/55">{r.date}</div>
            </div>
            <div className="font-mono text-base font-semibold text-black">{inr(r.amount)}</div>
            <button
              onClick={() =>
                toast.success(`Receipt ${r.id} downloaded`, {
                  description: `PDF prepared · ${inr(r.amount)}`,
                })
              }
              aria-label={`Download receipt ${r.id}`}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-[#E5E5E5] bg-white text-black/55 shadow-sm transition-colors hover:bg-black hover:text-white"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </OrganicCard>
  );
}

const STATUS_STYLE: Record<LedgerStatus, { wrap: string; dot: string }> = {
  Paid: {
    wrap: "bg-[#F4F4F5] text-black",
    dot: "bg-black",
  },
  "Partially Paid": {
    wrap: "bg-[#E1F2AE] text-black",
    dot: "bg-black",
  },
  Overdue: {
    wrap: "bg-[#C7F33C] text-black",
    dot: "bg-black",
  },
};

function StatusBadge({ status }: { status: LedgerStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${s.wrap}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}
