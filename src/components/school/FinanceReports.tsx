import { useMemo, type ReactNode } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import { OrganicCard } from "@/components/ui/organic-card";
import { useAuth } from "@/lib/auth";
import { downloadCsv, downloadTablePdf } from "@/lib/finance-export";
import { useTenantStore, type Payment } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

const OPERATING_EXPENSES = [
  { account: "Salaries & Wages", amount: 1_220_000 },
  { account: "Vehicle Upkeep", amount: 184_000 },
  { account: "Utilities & Power", amount: 88_000 },
  { account: "Rent & Campus", amount: 240_000 },
  { account: "Office & Supplies", amount: 42_000 },
];

const ACCOUNTS_PAYABLE = [
  { payee: "BrightBus Logistics", amount: 48_200 },
  { payee: "Faculty Payroll · May", amount: 612_000 },
  { payee: "Adani Electricity", amount: 18_450 },
  { payee: "Office Stationery Co.", amount: 6_800 },
];

export type LedgerRow = {
  date: string;
  voucher: string;
  particulars: string;
  account: string;
  debit: number;
  credit: number;
  balance: number;
};

function inr(n: number) {
  return `₹ ${n.toLocaleString("en-IN")}`;
}

function buildLedgerRows(payments: Payment[]): LedgerRow[] {
  const expenseRows: Omit<LedgerRow, "balance">[] = OPERATING_EXPENSES.map((e, i) => ({
    date: `01/${String(i + 4).padStart(2, "0")}/26`,
    voucher: `JV-26${100 + i}`,
    particulars: `${e.account} · monthly allocation`,
    account: e.account,
    debit: e.amount,
    credit: 0,
  }));

  const receiptRows: Omit<LedgerRow, "balance">[] = [...payments].reverse().map((p) => ({
    date: p.time.includes("·") ? p.time.split("·")[0].trim() : p.time,
    voucher: p.id,
    particulars: `${p.name} · ${p.cat}`,
    account: p.cat,
    debit: 0,
    credit: p.amount,
  }));

  const merged = [...expenseRows, ...receiptRows];
  let balance = 0;
  return merged.map((row) => {
    balance += row.credit - row.debit;
    return { ...row, balance };
  });
}

function ExportBar({
  title,
  onCsv,
  onPdf,
}: {
  title: string;
  onCsv: () => void;
  onPdf: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-title">{title}</div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onCsv}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3.5 py-1.5 text-[12px] font-medium text-black transition-colors hover:bg-[#F4F4F5]"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
        </button>
        <button
          type="button"
          onClick={onPdf}
          className="inline-flex items-center gap-1.5 rounded-full bg-black px-3.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-black/85"
        >
          <Download className="h-3.5 w-3.5" /> Export PDF
        </button>
      </div>
    </div>
  );
}

function ReportTable({
  headers,
  rows,
  footer,
}: {
  headers: string[];
  rows: (string | number)[][];
  footer?: ReactNode;
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-[#E5E5E5]">
      <table className="w-full min-w-[640px] text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-[#E5E5E5] bg-[#F4F4F5]">
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-black/55"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#F0F0F0] last:border-0">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    "px-3 py-2.5 text-black/80",
                    j >= row.length - 3 && "font-mono text-black",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {footer}
    </div>
  );
}

function SummaryStrip({ items }: { items: { label: string; value: string; accent?: boolean }[] }) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "rounded-2xl p-4",
            item.accent ? "bg-[#C7F33C] text-black" : "bg-[#F4F4F5] text-black",
          )}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-black/55">
            {item.label}
          </div>
          <div className="mt-1 font-mono text-[18px] font-semibold">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

export function GeneralLedgerReport() {
  const { payments, academicYear } = useTenantStore();
  const { session } = useAuth();
  const schoolName = session?.tenantName ?? "Silver Hills Global";

  const rows = useMemo(() => buildLedgerRows(payments), [payments]);
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const closing = rows.at(-1)?.balance ?? 0;

  const tableRows = rows.map((r) => [
    r.date,
    r.voucher,
    r.particulars,
    r.account,
    r.debit ? inr(r.debit) : "—",
    r.credit ? inr(r.credit) : "—",
    inr(r.balance),
  ]);

  const headers = ["Date", "Voucher", "Particulars", "Account", "Debit", "Credit", "Balance"];

  const exportMeta = `${schoolName} · ${academicYear} · General Ledger`;

  const handleCsv = () => {
    downloadCsv(
      `general-ledger-${academicYear.replace(/\s+/g, "-").toLowerCase()}.csv`,
      headers,
      rows.map((r) => [r.date, r.voucher, r.particulars, r.account, r.debit, r.credit, r.balance]),
    );
    toast.success("Ledger exported as CSV");
  };

  const handlePdf = () => {
    downloadTablePdf({
      filename: `general-ledger-${academicYear.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      title: "General Ledger",
      subtitle: exportMeta,
      headers,
      rows: tableRows,
      footer: `Total Debit ${inr(totalDebit)} · Total Credit ${inr(totalCredit)} · Closing ${inr(closing)}`,
    });
    toast.success("Ledger exported as PDF");
  };

  return (
    <OrganicCard tone="white" cornerSide="tr" padded>
      <ExportBar title="General Ledger" onCsv={handleCsv} onPdf={handlePdf} />
      <p className="mt-1 text-[12px] text-black/55">
        Chronological double-entry view · {rows.length} postings · {academicYear}
      </p>
      <SummaryStrip
        items={[
          { label: "Total Debit", value: inr(totalDebit) },
          { label: "Total Credit", value: inr(totalCredit) },
          { label: "Closing Balance", value: inr(closing), accent: true },
        ]}
      />
      <ReportTable headers={headers} rows={tableRows} />
    </OrganicCard>
  );
}

export function ProfitLossReport() {
  const { payments, academicYear } = useTenantStore();
  const { session } = useAuth();
  const schoolName = session?.tenantName ?? "Silver Hills Global";

  const incomeByCategory = useMemo(() => {
    const map = new Map<string, number>();
    payments.forEach((p) => map.set(p.cat, (map.get(p.cat) ?? 0) + p.amount));
    return Array.from(map.entries()).map(([label, amount]) => ({ label, amount }));
  }, [payments]);

  const totalIncome = incomeByCategory.reduce((s, i) => s + i.amount, 0);
  const totalExpense = OPERATING_EXPENSES.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const headers = ["Line Item", "Type", "Amount (₹)"];
  const tableRows = [
    ...incomeByCategory.map((i) => [i.label, "Income", inr(i.amount)]),
    ...OPERATING_EXPENSES.map((e) => [e.account, "Expense", inr(e.amount)]),
    ["Net Surplus / (Deficit)", "Result", inr(netProfit)],
  ];

  const exportMeta = `${schoolName} · ${academicYear} · Profit & Loss`;

  const handleCsv = () => {
    downloadCsv(`profit-loss-${academicYear.replace(/\s+/g, "-").toLowerCase()}.csv`, headers, [
      ...incomeByCategory.map((i) => [i.label, "Income", i.amount]),
      ...OPERATING_EXPENSES.map((e) => [e.account, "Expense", e.amount]),
      ["Net Surplus / (Deficit)", "Result", netProfit],
    ]);
    toast.success("P&L exported as CSV");
  };

  const handlePdf = () => {
    downloadTablePdf({
      filename: `profit-loss-${academicYear.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      title: "Profit & Loss Account",
      subtitle: exportMeta,
      headers,
      rows: tableRows,
      footer: `Total Income ${inr(totalIncome)} · Total Expense ${inr(totalExpense)} · Net ${inr(netProfit)}`,
    });
    toast.success("P&L exported as PDF");
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <OrganicCard tone="white" cornerSide="tr" padded className="lg:col-span-2">
        <ExportBar title="Profit & Loss Account" onCsv={handleCsv} onPdf={handlePdf} />
        <p className="mt-1 text-[12px] text-black/55">
          Income from fee receipts vs operating expenditure · {academicYear}
        </p>
        <ReportTable headers={headers} rows={tableRows} />
      </OrganicCard>

      <OrganicCard tone="lime" cornerSide="bl" padded>
        <div className="text-title">Statement Summary</div>
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-white/60 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-black/55">
              Gross Income
            </div>
            <div className="mt-1 font-mono text-[20px] font-semibold">{inr(totalIncome)}</div>
          </div>
          <div className="rounded-2xl bg-white/60 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-black/55">
              Operating Expense
            </div>
            <div className="mt-1 font-mono text-[20px] font-semibold">{inr(totalExpense)}</div>
          </div>
          <div className="rounded-2xl bg-black p-3 text-white">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/65">
              Net Surplus
            </div>
            <div className="mt-1 font-mono text-[22px] font-semibold">{inr(netProfit)}</div>
          </div>
        </div>
      </OrganicCard>
    </div>
  );
}

export function BalanceSheetReport() {
  const { payments, students, academicYear } = useTenantStore();
  const { session } = useAuth();
  const schoolName = session?.tenantName ?? "Silver Hills Global";

  const cashOnHand = useMemo(
    () => payments.filter((p) => p.mode === "Cash").reduce((s, p) => s + p.amount, 0),
    [payments],
  );
  const bankBalance = useMemo(
    () => payments.filter((p) => p.mode !== "Cash").reduce((s, p) => s + p.amount, 0),
    [payments],
  );
  const receivables = useMemo(() => students.reduce((s, st) => s + st.due, 0), [students]);
  const payables = ACCOUNTS_PAYABLE.reduce((s, p) => s + p.amount, 0);
  const totalAssets = cashOnHand + bankBalance + receivables;
  const equity = totalAssets - payables;

  const assetRows = [
    ["Cash in Hand", inr(cashOnHand)],
    ["Bank & UPI", inr(bankBalance)],
    ["Accounts Receivable (Fees Due)", inr(receivables)],
    ["Total Assets", inr(totalAssets)],
  ];
  const liabilityRows = [
    ["Accounts Payable", inr(payables)],
    ["Retained Surplus / Equity", inr(equity)],
    ["Total Liabilities & Equity", inr(payables + equity)],
  ];

  const headers = ["Account Head", "Amount (₹)"];
  const tableRows = [
    ["— ASSETS —", ""],
    ...assetRows,
    ["— LIABILITIES & EQUITY —", ""],
    ...liabilityRows,
  ];

  const exportMeta = `${schoolName} · ${academicYear} · Balance Sheet`;

  const handleCsv = () => {
    downloadCsv(`balance-sheet-${academicYear.replace(/\s+/g, "-").toLowerCase()}.csv`, headers, [
      ["Cash in Hand", cashOnHand],
      ["Bank & UPI", bankBalance],
      ["Accounts Receivable", receivables],
      ["Total Assets", totalAssets],
      ["Accounts Payable", payables],
      ["Retained Surplus / Equity", equity],
      ["Total Liabilities & Equity", payables + equity],
    ]);
    toast.success("Balance sheet exported as CSV");
  };

  const handlePdf = () => {
    downloadTablePdf({
      filename: `balance-sheet-${academicYear.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      title: "Balance Sheet",
      subtitle: exportMeta,
      headers,
      rows: tableRows,
      footer: `Assets ${inr(totalAssets)} · Liabilities & Equity ${inr(payables + equity)}`,
    });
    toast.success("Balance sheet exported as PDF");
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <OrganicCard tone="white" cornerSide="tr" padded>
        <ExportBar title="Balance Sheet" onCsv={handleCsv} onPdf={handlePdf} />
        <p className="mt-1 text-[12px] text-black/55">
          Position statement as at today · {academicYear}
        </p>
        <SummaryStrip
          items={[
            { label: "Total Assets", value: inr(totalAssets) },
            { label: "Payables", value: inr(payables) },
            { label: "Net Equity", value: inr(equity), accent: true },
          ]}
        />
        <ReportTable headers={headers} rows={tableRows} />
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="bl" padded>
        <div className="text-title">Outstanding Payables</div>
        <p className="mt-1 text-[12px] text-black/55">{ACCOUNTS_PAYABLE.length} open obligations</p>
        <div className="mt-4 divide-y divide-[#F0F0F0]">
          {ACCOUNTS_PAYABLE.map((p) => (
            <div key={p.payee} className="flex items-center justify-between py-2.5 text-[12.5px]">
              <span className="font-medium text-black">{p.payee}</span>
              <span className="font-mono text-black">{inr(p.amount)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-[#F4F4F5] p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-black/55">
            Fee Receivables
          </div>
          <div className="mt-1 font-mono text-[18px] font-semibold">{inr(receivables)}</div>
          <p className="mt-1 text-[11px] text-black/55">
            Aggregated from {students.filter((s) => s.due > 0).length} students with open balances
          </p>
        </div>
      </OrganicCard>
    </div>
  );
}
