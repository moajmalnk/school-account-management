import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Download,
  FileSpreadsheet,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrganicCard } from "@/components/ui/organic-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { getApiToken } from "@/lib/api/client";
import {
  apiGlChartTree,
  apiGlCreateAccount,
  apiGlCreateJournal,
  apiGlGetPeriod,
  apiGlListAccounts,
  apiGlListJournals,
  apiGlReportTrialBalance,
  apiGlUpdateJournal,
  apiGlVoidJournal,
  glInstallHint,
  type GlAccount,
  type GlJournal,
  type GlPeriod,
} from "@/lib/api/general-ledger";
import { downloadCsv, downloadTablePdf, truncatePdfCell } from "@/lib/finance-export";
import { formatDownloadFilename, slugYear, todayStamp } from "@/lib/download-names";
import { fetchIfscDetails, isValidIfsc, normalizeIfsc } from "@/lib/ifsc";
import {
  PAYMENT_PERIOD_OPTIONS,
  timestampMatchesPeriod,
  type CustomDateRange,
  type PaymentPeriod,
} from "@/lib/payment-period";
import { useTenantStore } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

type TransferKind = "cash_to_bank" | "bank_to_cash" | "bank_to_bank" | "other";

type BankAccountType = "savings" | "current" | "od" | "other";

type BankFormState = {
  ledgerName: string;
  ifsc: string;
  bankName: string;
  branch: string;
  accountNo: string;
  accountHolder: string;
  accountType: BankAccountType;
  address: string;
  city: string;
  state: string;
  micr: string;
};

const EMPTY_BANK_FORM: BankFormState = {
  ledgerName: "",
  ifsc: "",
  bankName: "",
  branch: "",
  accountNo: "",
  accountHolder: "",
  accountType: "current",
  address: "",
  city: "",
  state: "",
  micr: "",
};

type TransferReportRow = {
  id: string;
  date: string;
  voucherNo: string;
  narration: string;
  amount: number;
  fromName: string;
  toName: string;
  kind: TransferKind;
};

type TransferPreset = "cash_to_bank" | "bank_to_cash" | "bank_to_bank";

function inr(n: number) {
  const abs = Math.abs(n).toLocaleString("en-IN");
  if (n < 0) return `₹ −${abs}`;
  return `₹ ${abs}`;
}

function isCashOrBank(a: GlAccount) {
  return a.isCash || a.isBank;
}

function kindLabel(kind: TransferKind): string {
  switch (kind) {
    case "cash_to_bank":
      return "Cash → Bank";
    case "bank_to_cash":
      return "Bank → Cash";
    case "bank_to_bank":
      return "Bank → Bank";
    default:
      return "Transfer";
  }
}

function resolveTransferRow(
  journal: GlJournal,
  accountsById: Map<string, GlAccount>,
): TransferReportRow {
  const lines = journal.lines ?? [];
  const debit = lines.find((l) => (l.debit || 0) > 0);
  const credit = lines.find((l) => (l.credit || 0) > 0);
  const fromAcct = credit ? accountsById.get(credit.accountId) : undefined;
  const toAcct = debit ? accountsById.get(debit.accountId) : undefined;
  const fromName = credit?.accountName || fromAcct?.name || "—";
  const toName = debit?.accountName || toAcct?.name || "—";

  const fromCash = Boolean(fromAcct?.isCash) || (/\bcash\b/i.test(fromName) && !fromAcct?.isBank);
  const fromBank = Boolean(fromAcct?.isBank) || (/\bbank\b/i.test(fromName) && !fromCash);
  const toCash = Boolean(toAcct?.isCash) || (/\bcash\b/i.test(toName) && !toAcct?.isBank);
  const toBank = Boolean(toAcct?.isBank) || (/\bbank\b/i.test(toName) && !toCash);

  let kind: TransferKind = "other";
  if (fromCash && toBank) kind = "cash_to_bank";
  else if (fromBank && toCash) kind = "bank_to_cash";
  else if (fromBank && toBank) kind = "bank_to_bank";

  return {
    id: journal.id,
    date: journal.date,
    voucherNo: journal.voucherNo,
    narration: journal.narration?.trim() || `${fromName} → ${toName}`,
    amount: journal.totalDebit || journal.totalCredit || credit?.credit || debit?.debit || 0,
    fromName,
    toName,
    kind,
  };
}

function transferReportDownloadName(
  ext: "pdf" | "csv",
  schoolName: string,
  academicYear: string,
) {
  return formatDownloadFilename("reports", ext, {
    report: "transfer-reports",
    school: schoolName,
    year: slugYear(academicYear),
    date: todayStamp(),
  });
}

function transferVoucherDownloadName(
  voucherNo: string,
  schoolName: string,
  academicYear: string,
) {
  return formatDownloadFilename("voucher", "pdf", {
    report: "fund-transfer",
    school: schoolName,
    year: slugYear(academicYear),
    date: todayStamp(),
    id: voucherNo.replace(/[^\w-]+/g, ""),
  });
}

function emitTransferVoucherPdf(
  row: TransferReportRow,
  schoolName: string,
  academicYear: string,
  action: "download" | "print" = "download",
) {
  downloadTablePdf({
    filename: transferVoucherDownloadName(row.voucherNo, schoolName, academicYear),
    title: "Fund Transfer Voucher",
    subtitle: `${schoolName} · ${academicYear || "All years"} · ${row.voucherNo}`,
    headers: ["Field", "Details"],
    rows: [
      ["Date", row.date],
      ["Voucher", row.voucherNo],
      ["From", row.fromName],
      ["To", row.toName],
      ["Type", kindLabel(row.kind)],
      ["Amount (Rs.)", row.amount > 0 ? row.amount.toLocaleString("en-IN") : "-"],
      ["Narration", truncatePdfCell(row.narration || "—", 120)],
    ],
    summaryItems: [{ label: "Amount", value: `Rs. ${row.amount.toLocaleString("en-IN")}` }],
    emptyMessage: "No transfer",
    landscape: false,
    action,
  });
  toast.success(
    action === "print" ? "Print dialog opened" : "Voucher PDF downloaded",
    { description: row.voucherNo },
  );
}

function emitTransfersListPdf(opts: {
  rows: TransferReportRow[];
  schoolName: string;
  academicYear: string;
  subtitle: string;
  action?: "download" | "print";
}) {
  const total = opts.rows.reduce((s, r) => s + r.amount, 0);
  downloadTablePdf({
    filename: transferReportDownloadName("pdf", opts.schoolName, opts.academicYear),
    title: "Transfer Reports",
    subtitle: opts.subtitle,
    headers: ["Date", "Voucher", "From", "To", "Type", "Narration", "Amount (Rs.)"],
    rows: opts.rows.map((row) => [
      row.date,
      row.voucherNo,
      truncatePdfCell(row.fromName, 36),
      truncatePdfCell(row.toName, 36),
      kindLabel(row.kind),
      truncatePdfCell(row.narration, 48),
      row.amount > 0 ? row.amount.toLocaleString("en-IN") : "-",
    ]),
    summaryItems: [
      { label: "Transfers", value: String(opts.rows.length) },
      { label: "Total moved", value: `Rs. ${total.toLocaleString("en-IN")}` },
    ],
    emptyMessage: "No fund transfers",
    landscape: true,
    action: opts.action ?? "download",
  });
  toast.success(
    opts.action === "print" ? "Print dialog opened" : "Transfer report PDF downloaded",
  );
}

function emitTransfersListCsv(
  rows: TransferReportRow[],
  schoolName: string,
  academicYear: string,
) {
  downloadCsv(
    transferReportDownloadName("csv", schoolName, academicYear),
    ["Date", "Voucher", "From", "To", "Type", "Narration", "Amount"],
    rows.map((row) => [
      row.date,
      row.voucherNo,
      row.fromName,
      row.toName,
      kindLabel(row.kind),
      row.narration,
      row.amount,
    ]),
  );
  toast.success("Transfer report exported", { description: "CSV download started" });
}

function TransferActionButtons({
  onEdit,
  onDelete,
  onPrint,
  onDownload,
  disabled,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  onPrint: () => void;
  onDownload: () => void;
  disabled?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          className="h-8 gap-1 rounded-full border-[#E5E5E5] px-2.5 text-[11px] font-semibold text-slate-600 shadow-none dark:border-white/10 dark:text-zinc-300"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {onEdit ? (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit transfer
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={onPrint}>
          <Printer className="mr-2 h-3.5 w-3.5" />
          Print voucher
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDownload}>
          <Download className="mr-2 h-3.5 w-3.5" />
          Download PDF
        </DropdownMenuItem>
        {onDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-rose-600 focus:text-rose-700"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Bone({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn(
        "skeleton-shimmer relative overflow-hidden bg-black/[0.07] dark:bg-white/[0.08]",
        className,
      )}
    />
  );
}

function TransferFormSkeleton() {
  return (
    <div
      className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading cash and bank ledgers"
    >
      {[0, 1].map((i) => (
        <div key={i} className="space-y-1.5">
          <Bone className="h-2.5 w-28 rounded-md" />
          <Bone className="h-10 w-full rounded-xl" />
          <Bone className="h-2.5 w-24 rounded-md" />
        </div>
      ))}
      <div className="space-y-1.5">
        <Bone className="h-2.5 w-20 rounded-md" />
        <Bone className="h-10 w-full rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <Bone className="h-2.5 w-12 rounded-md" />
        <Bone className="h-10 w-full rounded-xl" />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Bone className="h-2.5 w-28 rounded-md" />
        <Bone className="h-10 w-full rounded-xl" />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Bone className="h-10 w-36 rounded-full" />
        <Bone className="h-2.5 w-48 rounded-md" />
      </div>
    </div>
  );
}

function TransferHistorySkeleton() {
  return (
    <div
      className="mt-4 overflow-hidden rounded-xl border border-[#E5E5E5] dark:border-white/10"
      aria-busy="true"
      aria-label="Loading recent transfers"
    >
      <div className="grid grid-cols-4 gap-2 border-b border-[#E5E5E5] bg-[#F4F4F5] px-3 py-2.5 dark:border-white/10 dark:bg-zinc-900/70">
        <Bone className="h-2.5 w-10 rounded-md" />
        <Bone className="h-2.5 w-14 rounded-md" />
        <Bone className="h-2.5 w-20 rounded-md" />
        <Bone className="ml-auto h-2.5 w-12 rounded-md" />
      </div>
      <div className="divide-y divide-[#F0F0F0] dark:divide-white/5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 items-center gap-2 px-3 py-2.5">
            <Bone className="h-3 w-16 rounded-md" />
            <Bone className="h-3 w-14 rounded-md" />
            <Bone className="h-3 w-[85%] rounded-md" />
            <Bone className="ml-auto h-3 w-14 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FundTransferPanel() {
  const { academicYear, activeBranchId: branchId, schoolDetails } = useTenantStore();
  const schoolName = schoolDetails.name || "School";

  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [balances, setBalances] = useState<Map<string, number>>(() => new Map());
  const [history, setHistory] = useState<GlJournal[]>([]);
  const [period, setPeriod] = useState<GlPeriod | null>(null);
  const [bankGroupId, setBankGroupId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [preset, setPreset] = useState<TransferPreset>("cash_to_bank");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const [addBankOpen, setAddBankOpen] = useState(false);
  const [bankForm, setBankForm] = useState<BankFormState>(EMPTY_BANK_FORM);
  const [addingBank, setAddingBank] = useState(false);
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscFetched, setIfscFetched] = useState(false);
  const lastAutoIfscRef = useRef("");

  const [editOpen, setEditOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<GlJournal | null>(null);
  const [editFromId, setEditFromId] = useState("");
  const [editToId, setEditToId] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<GlJournal | null>(null);
  const [deleting, setDeleting] = useState(false);

  const cashAccounts = useMemo(() => accounts.filter((a) => a.isCash), [accounts]);
  const bankAccounts = useMemo(() => accounts.filter((a) => a.isBank), [accounts]);
  const accountsById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts],
  );

  const fromOptions = useMemo(() => {
    if (preset === "cash_to_bank") return cashAccounts;
    return bankAccounts;
  }, [preset, cashAccounts, bankAccounts]);

  const toOptions = useMemo(() => {
    if (preset === "bank_to_cash") return cashAccounts;
    return bankAccounts;
  }, [preset, cashAccounts, bankAccounts]);

  const load = useCallback(async () => {
    if (!getApiToken()) {
      setAccounts([]);
      setHistory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [acct, tree, tb, journals, p] = await Promise.all([
        apiGlListAccounts(true),
        apiGlChartTree(),
        apiGlReportTrialBalance({ academicYear: academicYear || undefined }).catch(() => ({
          rows: [],
          totalDebit: 0,
          totalCredit: 0,
          balanced: true,
        })),
        apiGlListJournals({
          academicYear: academicYear || undefined,
          voucherType: "contra",
        }).catch(() => [] as GlJournal[]),
        academicYear ? apiGlGetPeriod(academicYear).catch(() => null) : Promise.resolve(null),
      ]);

      const cashBank = acct.filter(isCashOrBank);
      setAccounts(cashBank);

      const bal = new Map<string, number>();
      for (const row of tb.rows) {
        const signed =
          row.nature === "liability" || row.nature === "equity" || row.nature === "income"
            ? (Number(row.credit) || 0) - (Number(row.debit) || 0)
            : (Number(row.debit) || 0) - (Number(row.credit) || 0);
        bal.set(row.accountId, signed);
      }
      setBalances(bal);
      setHistory(journals.slice(0, 12));
      setPeriod(p);

      const bankGroup =
        tree.groups.find((g) => /bank accounts/i.test(g.name) && !/od/i.test(g.name)) ??
        tree.groups.find((g) => g.nature === "asset" && /bank/i.test(g.name));
      setBankGroupId(bankGroup?.id ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load cash / bank ledgers", {
        description: glInstallHint(),
      });
    } finally {
      setLoading(false);
    }
  }, [academicYear, branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Keep From/To valid when preset or account list changes
  useEffect(() => {
    const fromOk = fromOptions.some((a) => a.id === fromId);
    const toOk = toOptions.some((a) => a.id === toId);
    if (!fromOk) setFromId(fromOptions[0]?.id ?? "");
    if (!toOk) {
      const next = toOptions.find((a) => a.id !== (fromOk ? fromId : fromOptions[0]?.id));
      setToId(next?.id ?? toOptions[0]?.id ?? "");
    }
  }, [fromOptions, toOptions, fromId, toId]);

  const fromAcct = accounts.find((a) => a.id === fromId);
  const toAcct = accounts.find((a) => a.id === toId);
  const fromBal = fromId ? (balances.get(fromId) ?? 0) : 0;
  const toBal = toId ? (balances.get(toId) ?? 0) : 0;
  const periodClosed = period?.status === "closed";

  const applyPreset = (next: TransferPreset) => {
    setPreset(next);
    if (next === "cash_to_bank") {
      setFromId(cashAccounts[0]?.id ?? "");
      setToId(bankAccounts[0]?.id ?? "");
    } else if (next === "bank_to_cash") {
      setFromId(bankAccounts[0]?.id ?? "");
      setToId(cashAccounts[0]?.id ?? "");
    } else {
      setFromId(bankAccounts[0]?.id ?? "");
      setToId(bankAccounts[1]?.id ?? bankAccounts[0]?.id ?? "");
    }
  };

  const handleSave = async () => {
    if (!getApiToken()) {
      toast.error("Sign in to transfer funds");
      return;
    }
    if (periodClosed) {
      toast.error("This financial year is closed");
      return;
    }
    const value = Math.round(Number(amount.replace(/,/g, "")));
    if (!Number.isFinite(value) || value < 1) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!fromId || !toId || fromId === toId) {
      toast.error("Choose different From and To accounts");
      return;
    }
    if (!fromAcct || !toAcct || !isCashOrBank(fromAcct) || !isCashOrBank(toAcct)) {
      toast.error("Transfer only between Cash and Bank ledgers");
      return;
    }

    setSaving(true);
    try {
      const narration =
        note.trim() || `Transfer · ${fromAcct.name} → ${toAcct.name}`;
      await apiGlCreateJournal({
        voucherType: "contra",
        date,
        academicYear: academicYear || undefined,
        narration,
        lines: [
          { accountId: toId, debit: value, credit: 0, description: `To ${toAcct.name}` },
          { accountId: fromId, debit: 0, credit: value, description: `From ${fromAcct.name}` },
        ],
      });
      toast.success("Transfer posted", {
        description: `${inr(value)} · ${fromAcct.name} → ${toAcct.name}`,
      });
      setAmount("");
      setNote("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transfer failed", {
        description: glInstallHint(),
      });
    } finally {
      setSaving(false);
    }
  };

  const patchBankForm = (patch: Partial<BankFormState>) => {
    setBankForm((prev) => ({ ...prev, ...patch }));
  };

  const resetBankForm = () => {
    setBankForm(EMPTY_BANK_FORM);
    setIfscFetched(false);
    setIfscLoading(false);
    lastAutoIfscRef.current = "";
  };

  const handleLookupIfsc = async (raw = bankForm.ifsc) => {
    const code = normalizeIfsc(raw);
    if (!isValidIfsc(code)) {
      toast.error("Enter a valid IFSC", {
        description: "11 characters · e.g. HDFC0001234",
      });
      return;
    }
    setIfscLoading(true);
    try {
      const details = await fetchIfscDetails(code);
      lastAutoIfscRef.current = code;
      setBankForm((prev) => {
        const suggestedLedger =
          prev.ledgerName.trim() ||
          [details.bankName, details.branch].filter(Boolean).join(" · ").slice(0, 80);
        return {
          ...prev,
          ifsc: details.ifsc,
          bankName: details.bankName,
          branch: details.branch,
          address: details.address,
          city: details.city,
          state: details.state,
          micr: details.micr || "",
          ledgerName: suggestedLedger,
        };
      });
      setIfscFetched(true);
      toast.success("Bank details fetched", {
        description: `${details.bankName}${details.branch ? ` · ${details.branch}` : ""}`,
      });
    } catch (e) {
      lastAutoIfscRef.current = code;
      setIfscFetched(false);
      toast.error(e instanceof Error ? e.message : "IFSC lookup failed");
    } finally {
      setIfscLoading(false);
    }
  };

  useEffect(() => {
    if (!addBankOpen) return;
    const code = normalizeIfsc(bankForm.ifsc);
    if (!isValidIfsc(code) || ifscLoading) return;
    if (lastAutoIfscRef.current === code) return;
    const timer = window.setTimeout(() => {
      void handleLookupIfsc(code);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [addBankOpen, bankForm.ifsc, ifscLoading]);

  const handleAddBank = async () => {
    const ledgerName = bankForm.ledgerName.trim();
    const ifsc = normalizeIfsc(bankForm.ifsc);
    const accountNo = bankForm.accountNo.replace(/\s+/g, "");
    if (!ledgerName) {
      toast.error("Enter a ledger name");
      return;
    }
    if (!isValidIfsc(ifsc)) {
      toast.error("Enter a valid IFSC code");
      return;
    }
    if (!accountNo || accountNo.length < 6) {
      toast.error("Enter the bank account number");
      return;
    }
    if (!bankForm.bankName.trim()) {
      toast.error("Fetch IFSC details or enter the bank name");
      return;
    }
    if (!bankGroupId) {
      toast.error("Bank Accounts group missing", {
        description: "Sync existing ledgers first, then try again",
      });
      return;
    }
    setAddingBank(true);
    try {
      const created = await apiGlCreateAccount({
        name: ledgerName,
        groupId: bankGroupId,
        academicYear: academicYear || undefined,
        bankName: bankForm.bankName.trim(),
        bankAccountNo: accountNo,
        bankIfsc: ifsc,
        bankBranch: bankForm.branch.trim() || undefined,
        bankAccountHolder: bankForm.accountHolder.trim() || undefined,
        bankAccountType: bankForm.accountType,
        bankAddress: bankForm.address.trim() || undefined,
        bankCity: bankForm.city.trim() || undefined,
        bankState: bankForm.state.trim() || undefined,
        bankMicr: bankForm.micr.trim() || undefined,
      });
      toast.success(`Bank ledger added · ${created.name}`, {
        description: `${created.bankName || bankForm.bankName} · ${ifsc}`,
      });
      setAddBankOpen(false);
      resetBankForm();
      await load();
      setToId(created.id);
      if (preset === "bank_to_bank" && !fromId) setFromId(created.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add bank");
    } finally {
      setAddingBank(false);
    }
  };

  const accountLabel = (a: GlAccount) => {
    const bal = balances.get(a.id);
    const kind = a.isCash ? "Cash" : "Bank";
    const mask =
      a.isBank && a.bankAccountNo && a.bankAccountNo.length >= 4
        ? ` · …${a.bankAccountNo.slice(-4)}`
        : "";
    if (bal == null) return `${a.name} · ${kind}${mask}`;
    return `${a.name} · ${kind}${mask} · ${inr(bal)}`;
  };

  const historyRows = useMemo(
    () => history.map((j) => resolveTransferRow(j, accountsById)),
    [history, accountsById],
  );

  const openEditTransfer = (journal: GlJournal) => {
    if (journal.isVoid || journal.isLocked || journal.sourceType) {
      toast.error("This transfer cannot be edited");
      return;
    }
    const lines = journal.lines ?? [];
    const debit = lines.find((l) => (l.debit || 0) > 0);
    const credit = lines.find((l) => (l.credit || 0) > 0);
    setEditingJournal(journal);
    setEditFromId(credit?.accountId || "");
    setEditToId(debit?.accountId || "");
    setEditAmount(String(journal.totalDebit || journal.totalCredit || credit?.credit || debit?.debit || ""));
    setEditDate(journal.date);
    setEditNote(journal.narration || "");
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingJournal) return;
    if (periodClosed) {
      toast.error("This financial year is closed");
      return;
    }
    const value = Math.round(Number(editAmount.replace(/,/g, "")));
    if (!Number.isFinite(value) || value < 1) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!editFromId || !editToId || editFromId === editToId) {
      toast.error("Choose different From and To accounts");
      return;
    }
    const fromAcct = accountsById.get(editFromId);
    const toAcct = accountsById.get(editToId);
    if (!fromAcct || !toAcct || !isCashOrBank(fromAcct) || !isCashOrBank(toAcct)) {
      toast.error("Transfer only between Cash and Bank ledgers");
      return;
    }
    setEditSaving(true);
    try {
      const narration =
        editNote.trim() || `Transfer · ${fromAcct.name} → ${toAcct.name}`;
      await apiGlUpdateJournal({
        id: editingJournal.id,
        date: editDate,
        academicYear: academicYear || undefined,
        narration,
        lines: [
          { accountId: editToId, debit: value, credit: 0, description: `To ${toAcct.name}` },
          { accountId: editFromId, debit: 0, credit: value, description: `From ${fromAcct.name}` },
        ],
      });
      toast.success("Transfer updated", {
        description: `${editingJournal.voucherNo} · ${inr(value)}`,
      });
      setEditOpen(false);
      setEditingJournal(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update transfer");
    } finally {
      setEditSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await apiGlVoidJournal(pendingDelete.id);
      toast.success("Transfer deleted", { description: pendingDelete.voucherNo });
      setPendingDelete(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete transfer");
    } finally {
      setDeleting(false);
    }
  };

  const canMutateJournal = (j: GlJournal) =>
    !j.isVoid && !j.isLocked && !j.sourceType && !periodClosed;

  return (
    <div className="flex w-full flex-col gap-4 sm:gap-5">
      <OrganicCard tone="white" cornerSide="tr" padded className="w-full">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-semibold text-black dark:text-zinc-50">
              Transfer money
            </h2>
            <p className="mt-0.5 text-[12px] text-black/50 dark:text-zinc-400">
              Cash ↔ Bank and Bank ↔ Bank · does not change income or expense ·{" "}
              {academicYear || "this year"}
              {periodClosed ? " · year closed" : ""}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-full text-[11px]"
            disabled={loading}
            onClick={() => void load()}
          >
            {loading ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["cash_to_bank", "Cash → Bank"],
              ["bank_to_cash", "Bank → Cash"],
              ["bank_to_bank", "Bank → Bank"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 transition-colors",
                preset === key
                  ? "bg-[#0F766E] text-white ring-[#0F766E]"
                  : "bg-white text-black/70 ring-[#E5E5E5] hover:bg-[#FAFAFA] dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/10",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <TransferFormSkeleton />
        ) : accounts.length < 2 ? (
          <div className="mt-6 rounded-xl border border-dashed border-black/15 px-4 py-8 text-center text-[12px] text-black/55">
            Need at least one Cash and one Bank ledger. Sync ledgers or add a bank below.
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/55">
                From (money leaves)
              </Label>
              <Select value={fromId} onValueChange={setFromId}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {fromOptions.map((a) => (
                    <SelectItem key={a.id} value={a.id} disabled={a.id === toId}>
                      {accountLabel(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fromAcct ? (
                <p className="text-[11px] text-black/45">Balance {inr(fromBal)}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/55">
                  To (money arrives)
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    resetBankForm();
                    setAddBankOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F766E] hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  Add bank
                </button>
              </div>
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {toOptions.map((a) => (
                    <SelectItem key={a.id} value={a.id} disabled={a.id === fromId}>
                      {accountLabel(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {toAcct ? (
                <p className="text-[11px] text-black/45">Balance {inr(toBal)}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/55">
                Amount (₹)
              </Label>
              <Input
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="0"
                className="h-10 rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/55">
                Date
              </Label>
              <DatePicker
                value={date}
                onChange={setDate}
                valueFormat="iso"
                variant="pill"
                placeholder="Pick a date"
                quickPicks={[{ label: "Today", getDate: (t) => t }]}
                className="h-10 w-full"
                disabled={periodClosed}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-black/55">
                Note (optional)
              </Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Deposit day’s cash collection"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <Button
                type="button"
                className="h-10 rounded-full bg-[#0F766E] px-5 text-white hover:bg-[#0D9488]"
                disabled={saving || periodClosed || !fromId || !toId}
                onClick={() => void handleSave()}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                )}
                Post transfer
              </Button>
              <p className="text-[11px] text-black/45">
                Posts as a contra voucher (CN) · P&amp;L unchanged
              </p>
            </div>
          </div>
        )}
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="bl" padded className="w-full">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-title text-slate-900 dark:text-zinc-50">Recent transfers</div>
            <p className="mt-1 text-[12px] text-black/55">Contra vouchers for this campus</p>
          </div>
          {historyRows.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-full text-[11px]"
                onClick={() =>
                  emitTransfersListCsv(historyRows, schoolName, academicYear || "")
                }
              >
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                CSV
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-full text-[11px]"
                onClick={() =>
                  emitTransfersListPdf({
                    rows: historyRows,
                    schoolName,
                    academicYear: academicYear || "",
                    subtitle: `${schoolName} · ${academicYear || "All years"} · Recent transfers`,
                  })
                }
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                PDF
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-full text-[11px]"
                onClick={() =>
                  emitTransfersListPdf({
                    rows: historyRows,
                    schoolName,
                    academicYear: academicYear || "",
                    subtitle: `${schoolName} · ${academicYear || "All years"} · Recent transfers`,
                    action: "print",
                  })
                }
              >
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Print
              </Button>
            </div>
          ) : null}
        </div>
        {loading ? (
          <TransferHistorySkeleton />
        ) : history.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-black/15 px-4 py-8 text-center text-[12px] text-black/45">
            No transfers yet
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-[#E5E5E5] dark:border-white/10">
            <table className="w-full min-w-[560px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#F4F4F5] dark:border-white/10 dark:bg-zinc-900/70">
                  <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-black/55">
                    Date
                  </th>
                  <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-black/55">
                    Voucher
                  </th>
                  <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-black/55">
                    Particulars
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-black/55">
                    Amount
                  </th>
                  <th className="sticky right-0 bg-[#F4F4F5] px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-black/55 dark:bg-zinc-900/70">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((j) => {
                  const row = resolveTransferRow(j, accountsById);
                  const mutable = canMutateJournal(j);
                  return (
                    <tr
                      key={j.id}
                      className={cn(
                        "border-b border-[#F0F0F0] last:border-0 dark:border-white/5",
                        j.isVoid && "opacity-45",
                      )}
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-black/55">
                        {row.date}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-[#0F766E]">
                        {row.voucherNo}
                        {j.isVoid ? (
                          <span className="ml-1.5 text-[10px] font-sans font-semibold uppercase text-rose-500">
                            Void
                          </span>
                        ) : null}
                      </td>
                      <td className="max-w-[280px] px-3 py-2.5 text-black dark:text-zinc-100">
                        <div className="truncate font-medium">
                          {row.fromName}{" "}
                          <span className="font-normal text-black/40 dark:text-zinc-500">→</span>{" "}
                          {row.toName}
                        </div>
                        {j.narration ? (
                          <div className="mt-0.5 truncate text-[11px] text-black/45 dark:text-zinc-500">
                            {j.narration}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold">
                        {row.amount ? inr(row.amount) : "—"}
                      </td>
                      <td className="sticky right-0 bg-white px-2 py-2 text-right dark:bg-zinc-950">
                        <TransferActionButtons
                          onEdit={mutable ? () => openEditTransfer(j) : undefined}
                          onDelete={mutable ? () => setPendingDelete(j) : undefined}
                          onPrint={() =>
                            emitTransferVoucherPdf(row, schoolName, academicYear || "", "print")
                          }
                          onDownload={() =>
                            emitTransferVoucherPdf(row, schoolName, academicYear || "", "download")
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </OrganicCard>

      <Dialog
        open={addBankOpen}
        onOpenChange={(open) => {
          setAddBankOpen(open);
          if (!open) resetBankForm();
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="space-y-1 border-b border-[#EFEFEF] px-5 py-4 dark:border-white/10">
            <DialogTitle>Add bank ledger</DialogTitle>
            <DialogDescription>
              Enter IFSC to autofill bank details, then confirm account number and ledger name.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 px-5 py-4 sm:grid-cols-6">
            <div className="space-y-1 sm:col-span-4">
              <Label htmlFor="bank-ifsc" className="text-[11px]">
                IFSC code
              </Label>
              <div className="flex gap-2">
                <Input
                  id="bank-ifsc"
                  value={bankForm.ifsc}
                  onChange={(e) => {
                    const next = normalizeIfsc(e.target.value).slice(0, 11);
                    patchBankForm({ ifsc: next });
                    setIfscFetched(false);
                    lastAutoIfscRef.current = "";
                  }}
                  onBlur={() => {
                    if (isValidIfsc(bankForm.ifsc) && !ifscFetched && !ifscLoading) {
                      void handleLookupIfsc(bankForm.ifsc);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleLookupIfsc(bankForm.ifsc);
                    }
                  }}
                  placeholder="HDFC0001234"
                  className="h-9 flex-1 rounded-xl font-mono uppercase tracking-wide"
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 shrink-0 rounded-xl px-3 text-[12px]"
                  disabled={ifscLoading || !isValidIfsc(bankForm.ifsc)}
                  onClick={() => void handleLookupIfsc(bankForm.ifsc)}
                >
                  {ifscLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
                </Button>
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="bank-account-type" className="text-[11px]">
                Account type
              </Label>
              <Select
                value={bankForm.accountType}
                onValueChange={(v) => patchBankForm({ accountType: v as BankAccountType })}
              >
                <SelectTrigger id="bank-account-type" className="h-9 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="od">Overdraft</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:col-span-3">
              <Label htmlFor="bank-official-name" className="text-[11px]">
                Bank name
              </Label>
              <Input
                id="bank-official-name"
                value={bankForm.bankName}
                onChange={(e) => patchBankForm({ bankName: e.target.value })}
                placeholder="Fetched from IFSC"
                className="h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1 sm:col-span-3">
              <Label htmlFor="bank-branch" className="text-[11px]">
                Branch
              </Label>
              <Input
                id="bank-branch"
                value={bankForm.branch}
                onChange={(e) => patchBankForm({ branch: e.target.value })}
                placeholder="Branch"
                className="h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1 sm:col-span-3">
              <Label htmlFor="bank-account-no" className="text-[11px]">
                Account number
              </Label>
              <Input
                id="bank-account-no"
                value={bankForm.accountNo}
                onChange={(e) =>
                  patchBankForm({ accountNo: e.target.value.replace(/[^\d]/g, "").slice(0, 24) })
                }
                placeholder="Account number"
                className="h-9 rounded-xl font-mono"
                inputMode="numeric"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1 sm:col-span-3">
              <Label htmlFor="bank-account-holder" className="text-[11px]">
                Account holder
              </Label>
              <Input
                id="bank-account-holder"
                value={bankForm.accountHolder}
                onChange={(e) => patchBankForm({ accountHolder: e.target.value })}
                placeholder="School / trust name"
                className="h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="bank-city" className="text-[11px]">
                City
              </Label>
              <Input
                id="bank-city"
                value={bankForm.city}
                onChange={(e) => patchBankForm({ city: e.target.value })}
                placeholder="City"
                className="h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="bank-state" className="text-[11px]">
                State
              </Label>
              <Input
                id="bank-state"
                value={bankForm.state}
                onChange={(e) => patchBankForm({ state: e.target.value })}
                placeholder="State"
                className="h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="bank-address" className="text-[11px]">
                Branch address
              </Label>
              <Input
                id="bank-address"
                value={bankForm.address}
                onChange={(e) => patchBankForm({ address: e.target.value })}
                placeholder="From IFSC"
                className="h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1 sm:col-span-6">
              <Label htmlFor="bank-ledger-name" className="text-[11px]">
                Ledger name <span className="font-normal text-black/40">(shown in books)</span>
              </Label>
              <Input
                id="bank-ledger-name"
                value={bankForm.ledgerName}
                onChange={(e) => patchBankForm({ ledgerName: e.target.value })}
                placeholder="e.g. HDFC Current · Calicut"
                className="h-9 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-[#EFEFEF] px-5 py-3.5 dark:border-white/10 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-full"
              onClick={() => {
                setAddBankOpen(false);
                resetBankForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-9 rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
              disabled={addingBank || ifscLoading}
              onClick={() => void handleAddBank()}
            >
              {addingBank ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add bank
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingJournal(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit transfer</DialogTitle>
            <DialogDescription>
              Update {editingJournal?.voucherNo || "this contra voucher"} · keeps the same voucher
              number
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <div className="space-y-1.5">
              <Label>From</Label>
              <Select value={editFromId} onValueChange={setEditFromId}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id} disabled={a.id === editToId}>
                      {accountLabel(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Select value={editToId} onValueChange={setEditToId}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id} disabled={a.id === editFromId}>
                      {accountLabel(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (₹)</Label>
                <Input
                  inputMode="numeric"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  className="h-10 rounded-xl font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <DatePicker
                  value={editDate}
                  onChange={setEditDate}
                  valueFormat="iso"
                  variant="pill"
                  className="h-10 w-full rounded-xl border border-[#E5E5E5] shadow-none dark:border-white/10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Narration</Label>
              <Input
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Optional note"
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#0F766E] text-white hover:bg-[#0D9488]"
              disabled={editSaving}
              onClick={() => void handleSaveEdit()}
            >
              {editSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Delete transfer</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `Void ${pendingDelete.voucherNo}? It will no longer affect cash/bank balances.`
                : "Void this transfer?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full bg-[#EF4444] text-white hover:bg-[#DC2626]"
              disabled={deleting}
              onClick={() => void handleConfirmDelete()}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransferReportTableSkeleton() {
  return (
    <div className="mt-4 space-y-2" aria-busy="true" aria-label="Loading transfer reports">
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Bone key={i} className="h-[72px] rounded-2xl" />
        ))}
      </div>
      <Bone className="mt-2 h-10 w-full rounded-full" />
      <Bone className="h-64 w-full rounded-xl" />
    </div>
  );
}

export function TransferReports() {
  const navigate = useNavigate();
  const {
    academicYear,
    schoolDetails,
    activeBranchId: branchId,
  } = useTenantStore();
  const schoolName = schoolDetails.name || "School";

  const [loading, setLoading] = useState(true);
  const [journals, setJournals] = useState<GlJournal[]>([]);
  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<PaymentPeriod>("this_month");
  const [customRange, setCustomRange] = useState<CustomDateRange>({ from: "", to: "" });
  const [kindFilter, setKindFilter] = useState<"all" | TransferKind>("all");
  const [pendingExport, setPendingExport] = useState<"csv" | "pdf" | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<GlJournal | null>(null);
  const [editFromId, setEditFromId] = useState("");
  const [editToId, setEditToId] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<GlJournal | null>(null);
  const [deleting, setDeleting] = useState(false);

  const accountsById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts],
  );

  const load = useCallback(async () => {
    if (!getApiToken()) {
      setJournals([]);
      setAccounts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [j, a] = await Promise.all([
        apiGlListJournals({
          academicYear: academicYear || undefined,
          voucherType: "contra",
        }),
        apiGlListAccounts(true),
      ]);
      setJournals(j);
      setAccounts(a.filter(isCashOrBank));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load transfer reports", {
        description: glInstallHint(),
      });
    } finally {
      setLoading(false);
    }
  }, [academicYear, branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(
    () => journals.map((j) => resolveTransferRow(j, accountsById)),
    [journals, accountsById],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (!timestampMatchesPeriod(row.date, period, customRange)) return false;
      if (kindFilter !== "all" && row.kind !== kindFilter) return false;
      if (!q) return true;
      const haystack = [
        row.voucherNo,
        row.date,
        row.fromName,
        row.toName,
        row.narration,
        kindLabel(row.kind),
        String(row.amount),
        row.amount.toLocaleString("en-IN"),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query, period, customRange, kindFilter]);

  const totalAmount = filtered.reduce((sum, row) => sum + row.amount, 0);
  const cashToBank = filtered
    .filter((r) => r.kind === "cash_to_bank")
    .reduce((s, r) => s + r.amount, 0);
  const bankToCash = filtered
    .filter((r) => r.kind === "bank_to_cash")
    .reduce((s, r) => s + r.amount, 0);
  const bankToBank = filtered
    .filter((r) => r.kind === "bank_to_bank")
    .reduce((s, r) => s + r.amount, 0);

  const periodLabel =
    PAYMENT_PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "This month";

  const clearFilters = () => {
    setQuery("");
    setPeriod("this_month");
    setCustomRange({ from: "", to: "" });
    setKindFilter("all");
  };

  const journalsById = useMemo(
    () => new Map(journals.map((j) => [j.id, j])),
    [journals],
  );

  const handleCsv = () => {
    emitTransfersListCsv(filtered, schoolName, academicYear || "");
  };

  const handlePdf = (action: "download" | "print" = "download") => {
    emitTransfersListPdf({
      rows: filtered,
      schoolName,
      academicYear: academicYear || "",
      subtitle: `${schoolName} · ${academicYear || "All years"} · ${periodLabel}`,
      action,
    });
  };

  const openEditTransfer = (journal: GlJournal) => {
    if (journal.isVoid || journal.isLocked || journal.sourceType) {
      toast.error("This transfer cannot be edited");
      return;
    }
    const lines = journal.lines ?? [];
    const debit = lines.find((l) => (l.debit || 0) > 0);
    const credit = lines.find((l) => (l.credit || 0) > 0);
    setEditingJournal(journal);
    setEditFromId(credit?.accountId || "");
    setEditToId(debit?.accountId || "");
    setEditAmount(
      String(journal.totalDebit || journal.totalCredit || credit?.credit || debit?.debit || ""),
    );
    setEditDate(journal.date);
    setEditNote(journal.narration || "");
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingJournal) return;
    const value = Math.round(Number(editAmount.replace(/,/g, "")));
    if (!Number.isFinite(value) || value < 1) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!editFromId || !editToId || editFromId === editToId) {
      toast.error("Choose different From and To accounts");
      return;
    }
    const fromAcct = accountsById.get(editFromId);
    const toAcct = accountsById.get(editToId);
    if (!fromAcct || !toAcct || !isCashOrBank(fromAcct) || !isCashOrBank(toAcct)) {
      toast.error("Transfer only between Cash and Bank ledgers");
      return;
    }
    setEditSaving(true);
    try {
      const narration =
        editNote.trim() || `Transfer · ${fromAcct.name} → ${toAcct.name}`;
      await apiGlUpdateJournal({
        id: editingJournal.id,
        date: editDate,
        academicYear: academicYear || undefined,
        narration,
        lines: [
          { accountId: editToId, debit: value, credit: 0, description: `To ${toAcct.name}` },
          { accountId: editFromId, debit: 0, credit: value, description: `From ${fromAcct.name}` },
        ],
      });
      toast.success("Transfer updated", {
        description: `${editingJournal.voucherNo} · ${inr(value)}`,
      });
      setEditOpen(false);
      setEditingJournal(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update transfer");
    } finally {
      setEditSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await apiGlVoidJournal(pendingDelete.id);
      toast.success("Transfer deleted", { description: pendingDelete.voucherNo });
      setPendingDelete(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete transfer");
    } finally {
      setDeleting(false);
    }
  };

  const confirmExport = () => {
    if (pendingExport === "csv") handleCsv();
    else if (pendingExport === "pdf") handlePdf("download");
    setPendingExport(null);
  };

  const filterSelectClass =
    "h-10 rounded-full border border-[#E5E5E5] bg-white shadow-none focus:border-[#E5E5E5] focus:ring-1 focus:ring-[#0F766E]/25 dark:border-white/10 dark:bg-zinc-900";

  const accountOptionLabel = (a: GlAccount) => {
    const kind = a.isCash ? "Cash" : "Bank";
    return `${a.name} · ${kind}`;
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <OrganicCard tone="white" cornerSide="tr" padded className="shrink-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-title text-slate-900 dark:text-zinc-50">Transfer Reports</div>
            <p className="mt-1 text-[12px] text-black/55">
              Contra vouchers for cash and bank movements · {academicYear || "all years"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 rounded-full text-[12px]"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-full bg-[#0F766E] text-[12px] text-white hover:bg-[#0D9488]"
              onClick={() =>
                navigate({ to: "/tenant/finance", search: { tab: "transfer" } })
              }
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New transfer
            </Button>
            <div className="flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white p-1 dark:border-white/10 dark:bg-zinc-900">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 rounded-full px-2.5 text-[11px]"
                onClick={() => setPendingExport("csv")}
              >
                <FileSpreadsheet className="mr-1 h-3.5 w-3.5" />
                CSV
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 rounded-full px-2.5 text-[11px]"
                onClick={() => setPendingExport("pdf")}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                PDF
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 rounded-full px-2.5 text-[11px]"
                onClick={() => handlePdf("print")}
              >
                <Printer className="mr-1 h-3.5 w-3.5" />
                Print
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <TransferReportTableSkeleton />
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              {[
                { label: "Transfers", value: String(filtered.length), accent: false },
                { label: "Total moved", value: inr(totalAmount), accent: true },
                { label: "Cash → Bank", value: inr(cashToBank), accent: false },
                { label: "Bank → Cash", value: inr(bankToCash), accent: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "min-w-0 rounded-2xl p-3 sm:p-4",
                    item.accent
                      ? "bg-gradient-to-br from-[#0F766E] to-[#115E59] text-white shadow-sm shadow-teal-900/15"
                      : "bg-slate-50 text-slate-900 ring-1 ring-slate-200/70 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-white/10",
                  )}
                >
                  <div
                    className={cn(
                      "text-[9px] font-semibold uppercase tracking-wider sm:text-[10px]",
                      item.accent ? "text-teal-100/75" : "text-slate-500 dark:text-zinc-400",
                    )}
                  >
                    {item.label}
                  </div>
                  <div className="mt-1 truncate font-mono text-[14px] font-semibold tracking-tight sm:text-[18px]">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            {bankToBank > 0 ? (
              <p className="mt-2 text-[11px] text-slate-500 dark:text-zinc-400">
                Bank → Bank in this period:{" "}
                <span className="font-mono font-semibold text-slate-700 dark:text-zinc-200">
                  {inr(bankToBank)}
                </span>
              </p>
            ) : null}
          </>
        )}
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="bl" padded>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as PaymentPeriod)}
          >
            <SelectTrigger className={cn(filterSelectClass, "w-[9.5rem] shrink-0")}>
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={kindFilter}
            onValueChange={(v) => setKindFilter(v as typeof kindFilter)}
          >
            <SelectTrigger className={cn(filterSelectClass, "w-[10.5rem] shrink-0")}>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="cash_to_bank">Cash → Bank</SelectItem>
              <SelectItem value="bank_to_cash">Bank → Cash</SelectItem>
              <SelectItem value="bank_to_bank">Bank → Bank</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative min-w-[14rem] flex-1 basis-[14rem]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search voucher, account, narration…"
              className="h-10 rounded-full border-[#E5E5E5] bg-white pl-9 shadow-none focus-visible:ring-[#0F766E]/25 dark:border-white/10 dark:bg-zinc-900"
            />
          </div>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-10 rounded-full text-[12px] text-slate-500"
            onClick={clearFilters}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        {period === "custom" && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <DatePicker
              value={customRange.from}
              onChange={(from) => setCustomRange((prev) => ({ ...prev, from }))}
              placeholder="From date"
              valueFormat="iso"
              variant="pill"
              max={customRange.to || undefined}
              className="h-10 w-[10.25rem] shrink-0 border border-[#E5E5E5] shadow-none dark:border-white/10"
            />
            <DatePicker
              value={customRange.to}
              onChange={(to) => setCustomRange((prev) => ({ ...prev, to }))}
              placeholder="To date"
              valueFormat="iso"
              variant="pill"
              min={customRange.from || undefined}
              className="h-10 w-[10.25rem] shrink-0 border border-[#E5E5E5] shadow-none dark:border-white/10"
            />
          </div>
        )}

        {loading ? null : filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 px-4 py-12 text-center dark:border-white/10">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-500 ring-1 ring-slate-200/80 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-white/10">
              <ArrowLeftRight className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="mt-3 text-[14px] font-semibold text-slate-900 dark:text-zinc-50">
              No transfers in this period
            </div>
            <p className="mx-auto mt-1 max-w-sm text-[12px] text-slate-500 dark:text-zinc-400">
              Fund transfers between cash and bank appear here as contra vouchers once posted.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-4 h-9 rounded-full bg-[#0F766E] text-[12px] text-white hover:bg-[#0D9488]"
              onClick={() =>
                navigate({ to: "/tenant/finance", search: { tab: "transfer" } })
              }
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Record a transfer
            </Button>
          </div>
        ) : (
          <div className="mt-4 overflow-auto rounded-xl border border-[#EFEFEF] dark:border-white/10">
            <table className="w-full min-w-[760px] text-left text-[12.5px]">
              <thead className="bg-[#F8FAFC] text-[10px] uppercase tracking-wider text-black/45 dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Voucher</th>
                  <th className="px-3 py-2.5">Movement</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Narration</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                  <th className="sticky right-0 bg-[#F8FAFC] px-3 py-2.5 text-right dark:bg-zinc-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFEF] dark:divide-white/10">
                {filtered.map((row) => {
                  const journal = journalsById.get(row.id);
                  const mutable =
                    journal && !journal.isVoid && !journal.isLocked && !journal.sourceType;
                  return (
                    <tr key={row.id} className="align-top">
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-black/55">
                        {row.date}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-[#0F766E]">
                        {row.voucherNo}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-slate-900 dark:text-zinc-50">
                          {row.fromName}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">
                          → {row.toName}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-white/10">
                          {kindLabel(row.kind)}
                        </span>
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-600 dark:text-zinc-300">
                        {row.narration}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-zinc-50">
                        {inr(row.amount)}
                      </td>
                      <td className="sticky right-0 bg-white px-2 py-2 text-right dark:bg-zinc-950">
                        <TransferActionButtons
                          onEdit={
                            mutable && journal ? () => openEditTransfer(journal) : undefined
                          }
                          onDelete={
                            mutable && journal ? () => setPendingDelete(journal) : undefined
                          }
                          onPrint={() =>
                            emitTransferVoucherPdf(row, schoolName, academicYear || "", "print")
                          }
                          onDownload={() =>
                            emitTransferVoucherPdf(
                              row,
                              schoolName,
                              academicYear || "",
                              "download",
                            )
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#E5E5E5] bg-slate-50/80 dark:border-white/10 dark:bg-zinc-900/60">
                  <td
                    colSpan={5}
                    className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                  >
                    Total
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[13px] font-bold text-slate-900 dark:text-zinc-50">
                    {inr(totalAmount)}
                  </td>
                  <td className="sticky right-0 bg-slate-50/80 dark:bg-zinc-900/60" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </OrganicCard>

      <Dialog open={pendingExport !== null} onOpenChange={(open) => !open && setPendingExport(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingExport === "csv" ? "Export CSV" : "Export PDF"}
            </DialogTitle>
            <DialogDescription>
              Export Transfer Reports as a {pendingExport === "csv" ? "CSV" : "PDF"} file? The
              download will start immediately after confirmation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingExport(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#0F766E] text-white hover:bg-[#0D9488]"
              onClick={confirmExport}
            >
              {pendingExport === "csv" ? "Export CSV" : "Export PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingJournal(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit transfer</DialogTitle>
            <DialogDescription>
              Update {editingJournal?.voucherNo || "this contra voucher"} · keeps the same voucher
              number
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <div className="space-y-1.5">
              <Label>From</Label>
              <Select value={editFromId} onValueChange={setEditFromId}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id} disabled={a.id === editToId}>
                      {accountOptionLabel(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Select value={editToId} onValueChange={setEditToId}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id} disabled={a.id === editFromId}>
                      {accountOptionLabel(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (₹)</Label>
                <Input
                  inputMode="numeric"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  className="h-10 rounded-xl font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <DatePicker
                  value={editDate}
                  onChange={setEditDate}
                  valueFormat="iso"
                  variant="pill"
                  className="h-10 w-full rounded-xl border border-[#E5E5E5] shadow-none dark:border-white/10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Narration</Label>
              <Input
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Optional note"
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#0F766E] text-white hover:bg-[#0D9488]"
              disabled={editSaving}
              onClick={() => void handleSaveEdit()}
            >
              {editSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Delete transfer</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `Void ${pendingDelete.voucherNo}? It will no longer affect cash/bank balances.`
                : "Void this transfer?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full bg-[#EF4444] text-white hover:bg-[#DC2626]"
              disabled={deleting}
              onClick={() => void handleConfirmDelete()}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
