import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Download,
  ExternalLink,
  Inbox,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker, type DatePickerProps } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { OrganicCard } from "@/components/ui/organic-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { ApiError } from "@/lib/api/client";
import { CONTACT_TOPICS, type ContactTopic } from "@/lib/api/contact";
import {
  addLeadNote,
  bulkUpdateLeadStatus,
  deleteLead,
  fetchLead,
  fetchLeads,
  LEAD_STATUSES,
  leadStatusLabel,
  leadTopicLabel,
  logLeadContact,
  updateLead,
  type Lead,
  type LeadChannel,
  type LeadCounts,
  type LeadDetail,
  type LeadFilter,
  type LeadPriority,
  type LeadStatus,
  type LeadSummary,
} from "@/lib/api/leads";
import { formatChatStamp } from "@/lib/dates";
import { toWhatsAppDigits } from "@/lib/phone";
import { cn } from "@/lib/utils";

const FILTERS: { id: LeadFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "open", label: "In pipeline" },
  { id: "followup", label: "Follow-up due" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
  { id: "spam", label: "Spam" },
];

const STATUS_TONE: Record<LeadStatus, string> = {
  new: "bg-sky-50 text-sky-700 ring-sky-200",
  contacted: "bg-violet-50 text-violet-700 ring-violet-200",
  qualified: "bg-amber-50 text-amber-800 ring-amber-200",
  demo_scheduled: "bg-teal-50 text-teal-700 ring-teal-200",
  won: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  lost: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  spam: "bg-rose-50 text-rose-700 ring-rose-200",
};

const PRIORITY_TONE: Record<LeadPriority, string> = {
  high: "text-rose-600",
  normal: "text-black/45",
  low: "text-black/35",
};

const selectClass =
  "h-9 w-full rounded-lg border border-[#E5E5E5] bg-white px-2.5 text-[13px] text-black outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/30";

const STATUS_DOT: Record<LeadStatus, string> = {
  new: "bg-sky-500",
  contacted: "bg-violet-500",
  qualified: "bg-amber-500",
  demo_scheduled: "bg-teal-500",
  won: "bg-emerald-500",
  lost: "bg-zinc-400",
  spam: "bg-rose-500",
};

const PRIORITY_OPTIONS: SelectOption<LeadPriority>[] = [
  { value: "high", label: "High", dot: "bg-rose-500" },
  { value: "normal", label: "Normal", dot: "bg-black/25" },
  { value: "low", label: "Low", dot: "bg-black/10" },
];

const STATUS_OPTIONS: SelectOption<LeadStatus>[] = LEAD_STATUSES.map((s) => ({
  value: s.id,
  label: s.label,
  dot: STATUS_DOT[s.id],
}));

const TOPIC_OPTIONS: SelectOption<ContactTopic | "all">[] = [
  { value: "all", label: "All topics" },
  ...CONTACT_TOPICS.map((t) => ({ value: t.id, label: t.label })),
];

const FOLLOW_UP_PICKS: NonNullable<DatePickerProps["quickPicks"]> = [
  {
    label: "Tomorrow",
    getDate: (t) => new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1),
  },
  { label: "+3d", getDate: (t) => new Date(t.getFullYear(), t.getMonth(), t.getDate() + 3) },
  { label: "+1w", getDate: (t) => new Date(t.getFullYear(), t.getMonth(), t.getDate() + 7) },
];

type SelectOption<T extends string> = { value: T; label: string; dot?: string };

function LeadSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder,
  disabled,
  className,
  ariaLabel,
}: {
  value: T | "";
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)} disabled={disabled}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          "h-9 rounded-lg border-[#E5E5E5] bg-white px-2.5 text-[13px] text-black shadow-none focus:ring-2 focus:ring-[#0F766E]/30",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-[#E5E5E5] bg-white p-0 shadow-lg">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="cursor-pointer rounded-lg py-2 text-[13px] focus:bg-[#F0FDFA] focus:text-[#0F766E]"
          >
            <span className="flex items-center gap-2">
              {option.dot ? (
                <span className={cn("h-2 w-2 shrink-0 rounded-full", option.dot)} aria-hidden />
              ) : null}
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function todayIso(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function isFollowUpDue(lead: Pick<Lead, "followUpAt" | "status">): boolean {
  if (!lead.followUpAt || ["won", "lost", "spam"].includes(lead.status)) return false;
  return lead.followUpAt <= todayIso();
}

function digitsForWhatsApp(phone: string | null): string {
  return toWhatsAppDigits(phone) ?? "";
}

function csvCell(value: string | null | undefined): string {
  const s = (value ?? "").replace(/\r?\n/g, " ");
  return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportLeadsCsv(leads: Lead[]) {
  const header = [
    "Reference",
    "Received",
    "Status",
    "Priority",
    "Topic",
    "Name",
    "Email",
    "Phone",
    "School",
    "Follow-up",
    "Message",
  ];
  const rows = leads.map((l) =>
    [
      l.id,
      l.createdAt,
      leadStatusLabel(l.status),
      l.priority,
      leadTopicLabel(l.topic),
      l.name,
      l.email,
      l.phone,
      l.school,
      l.followUpAt,
      l.message,
    ]
      .map(csvCell)
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...rows].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `feezo-leads-${todayIso()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatusPill({ status }: { status: LeadStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 whitespace-nowrap",
        STATUS_TONE[status],
      )}
    >
      {leadStatusLabel(status)}
    </span>
  );
}

function eventText(event: LeadDetail["events"][number]): string {
  if (event.type === "status") return `Status changed to ${leadStatusLabel(event.body ?? "")}`;
  if (event.type === "contacted") {
    const channel =
      event.body === "whatsapp" ? "WhatsApp" : event.body === "call" ? "phone" : "email";
    return `Reached out by ${channel}`;
  }
  if (event.type === "followup") return `Follow-up set for ${event.body ?? ""}`;
  return event.body ?? "";
}

type Props = {
  onSummary: (summary: LeadSummary) => void;
};

export function LeadsView({ onSummary }: Props) {
  const [filter, setFilter] = useState<LeadFilter>("all");
  const [topic, setTopic] = useState<ContactTopic | "all">("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<LeadCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [pendingDelete, setPendingDelete] = useState(false);
  const loadSeq = useRef(0);

  const applySummary = useCallback(
    (summary: LeadSummary) => {
      setCounts(summary.counts);
      onSummary(summary);
    },
    [onSummary],
  );

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    try {
      const data = await fetchLeads({ status: filter, topic, q: debouncedQuery });
      if (seq !== loadSeq.current) return;
      setLeads(data.leads);
      applySummary(data);
      setChecked(new Set());
    } catch (err) {
      if (seq !== loadSeq.current) return;
      toast.error("Could not load leads", {
        description: err instanceof ApiError ? err.message : "Please try again",
      });
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [applySummary, debouncedQuery, filter, topic]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setNote("");
    (async () => {
      try {
        const data = await fetchLead(selectedId);
        if (cancelled) return;
        setDetail(data.lead);
        applySummary(data);
        setLeads((prev) =>
          prev.map((l) => (l.id === data.lead.id ? { ...l, ...data.lead, unread: false } : l)),
        );
      } catch (err) {
        if (cancelled) return;
        toast.error("Could not open lead", {
          description: err instanceof ApiError ? err.message : "Please try again",
        });
        setSelectedId(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySummary, selectedId]);

  const applyDetail = useCallback(
    (next: LeadDetail, summary: LeadSummary) => {
      setDetail(next);
      applySummary(summary);
      setLeads((prev) => prev.map((l) => (l.id === next.id ? { ...l, ...next } : l)));
    },
    [applySummary],
  );

  const run = async (task: () => Promise<void>, failTitle: string) => {
    setBusy(true);
    try {
      await task();
    } catch (err) {
      toast.error(failTitle, {
        description: err instanceof ApiError ? err.message : "Please try again",
      });
    } finally {
      setBusy(false);
    }
  };

  const patchDetail = (patch: Parameters<typeof updateLead>[1], success?: string) => {
    if (!detail) return;
    void run(async () => {
      const data = await updateLead(detail.id, patch);
      applyDetail(data.lead, data);
      if (success) toast.success(success);
    }, "Could not update lead");
  };

  const touch = (channel: LeadChannel) => {
    if (!detail) return;
    const lead = detail;
    const subject = encodeURIComponent(`Re: your Feezo enquiry (${lead.id})`);
    const greeting = `Hi ${lead.name.split(" ")[0] || lead.name}, thanks for reaching out to Feezo`;
    if (channel === "email") {
      window.open(
        `mailto:${lead.email}?subject=${subject}&body=${encodeURIComponent(`${greeting}.\n\n`)}`,
        "_blank",
      );
    } else if (channel === "whatsapp") {
      window.open(
        `https://wa.me/${digitsForWhatsApp(lead.phone)}?text=${encodeURIComponent(`${greeting} (ref ${lead.id}).`)}`,
        "_blank",
        "noopener",
      );
    } else {
      window.location.href = `tel:${(lead.phone ?? "").replace(/\s/g, "")}`;
    }
    void run(async () => {
      const data = await logLeadContact(lead.id, channel);
      applyDetail(data.lead, data);
    }, "Could not log outreach");
  };

  const saveNote = () => {
    if (!detail || !note.trim()) return;
    void run(async () => {
      const data = await addLeadNote(detail.id, note.trim());
      applyDetail(data.lead, data);
      setNote("");
      toast.success("Note added");
    }, "Could not add note");
  };

  const confirmDelete = () => {
    if (!detail) return;
    const id = detail.id;
    void run(async () => {
      const data = await deleteLead(id);
      applySummary(data);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setSelectedId(null);
      setPendingDelete(false);
      toast.success("Lead deleted");
    }, "Could not delete lead");
  };

  const bulkStatus = (status: LeadStatus) => {
    const ids = [...checked];
    if (!ids.length) return;
    void run(async () => {
      const data = await bulkUpdateLeadStatus(ids, status);
      toast.success(
        `${data.updated} lead${data.updated === 1 ? "" : "s"} marked ${leadStatusLabel(status)}`,
      );
      await load();
    }, "Could not update leads");
  };

  const allChecked = leads.length > 0 && leads.every((l) => checked.has(l.id));

  const stats = useMemo(
    () => [
      { label: "New", value: counts?.new ?? 0, tone: "text-sky-700" },
      { label: "In pipeline", value: counts?.open ?? 0, tone: "text-[#0F766E]" },
      { label: "Follow-up due", value: counts?.followup ?? 0, tone: "text-amber-700" },
      { label: "Won", value: counts?.won ?? 0, tone: "text-emerald-700" },
    ],
    [counts],
  );

  return (
    <>
      <div
        className={cn(
          "col-span-12 grid grid-cols-2 gap-3 lg:grid-cols-4",
          selectedId && "max-lg:hidden",
        )}
      >
        {stats.map((s) => (
          <OrganicCard key={s.label} tone="white" padded className="!py-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
              {s.label}
            </div>
            <div className={cn("mt-1 font-mono text-2xl font-bold", s.tone)}>{s.value}</div>
          </OrganicCard>
        ))}
      </div>

      <OrganicCard tone="white" cornerSide="tr" padded className="col-span-12">
        <div className="grid grid-cols-12 gap-4">
          <div className={cn("col-span-12 space-y-3 lg:col-span-5", selectedId && "max-lg:hidden")}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[13px] font-semibold text-black">Website leads</div>
                <p className="mt-0.5 text-[12px] text-black/50">
                  Enquiries from the feezo.app contact form
                </p>
              </div>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  title="Refresh"
                  onClick={() => void load()}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  title="Export CSV"
                  disabled={!leads.length}
                  onClick={() => exportLeadsCsv(leads)}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="mobile-scrollbar-none -mx-0.5 overflow-x-auto pb-0.5">
              <div className="inline-flex min-w-max rounded-full border border-[#E5E5E5] bg-white p-1">
                {FILTERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap",
                      filter === item.id ? "bg-black text-white" : "text-black/55 hover:text-black",
                    )}
                  >
                    {item.label}
                    {counts?.[item.id] ? (
                      <span className="ml-1 font-mono text-[10px] opacity-70">
                        {counts[item.id]}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/35" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, school, email, ref…"
                  className="h-9 rounded-lg pl-8 text-[13px]"
                />
              </div>
              <LeadSelect
                value={topic}
                options={TOPIC_OPTIONS}
                onChange={setTopic}
                className="w-[9.5rem] shrink-0"
                ariaLabel="Topic"
              />
            </div>

            {checked.size > 0 ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[#F0FDFA] px-3 py-2 text-[12px]">
                <span className="font-semibold text-[#0F766E]">{checked.size} selected</span>
                <LeadSelect
                  value=""
                  options={STATUS_OPTIONS}
                  onChange={bulkStatus}
                  placeholder="Set status…"
                  disabled={busy}
                  className="h-8 w-40"
                  ariaLabel="Set status for selected"
                />
                <button
                  type="button"
                  className="ml-auto text-black/50 hover:text-black"
                  onClick={() => setChecked(new Set())}
                >
                  Clear
                </button>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-xl border border-[#EDEDED]">
              <div className="flex items-center gap-2.5 border-b border-[#F0F0F0] bg-[#FAFAFA] px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-black/40">
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={(v) =>
                    setChecked(v ? new Set(leads.map((l) => l.id)) : new Set())
                  }
                  aria-label="Select all"
                />
                {loading ? "Loading…" : `${leads.length} lead${leads.length === 1 ? "" : "s"}`}
              </div>
              <div className="max-h-[min(62dvh,640px)] overflow-y-auto">
                {!loading && leads.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                    <Inbox className="h-7 w-7 text-black/25" />
                    <div className="text-[13px] font-semibold text-black/70">No leads here</div>
                    <p className="text-[12px] text-black/45">
                      New website enquiries will appear in this list.
                    </p>
                  </div>
                ) : null}
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(lead.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSelectedId(lead.id);
                    }}
                    className={cn(
                      "flex cursor-pointer gap-2.5 border-b border-[#F4F4F4] px-3 py-3 last:border-b-0 hover:bg-[#FAFAFA]",
                      selectedId === lead.id && "bg-[#F0FDFA] hover:bg-[#F0FDFA]",
                    )}
                  >
                    <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={checked.has(lead.id)}
                        onCheckedChange={(v) =>
                          setChecked((prev) => {
                            const next = new Set(prev);
                            if (v) next.add(lead.id);
                            else next.delete(lead.id);
                            return next;
                          })
                        }
                        aria-label={`Select ${lead.name}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {lead.unread ? (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full bg-sky-500"
                            aria-label="Unread"
                          />
                        ) : null}
                        <span
                          className={cn(
                            "truncate text-[13px] text-black",
                            lead.unread ? "font-bold" : "font-semibold",
                          )}
                        >
                          {lead.name}
                        </span>
                        <span className="ml-auto shrink-0 text-[11px] text-black/40">
                          {formatChatStamp(lead.createdAt, "list")}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-black/55">
                        {lead.school || lead.email}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <StatusPill status={lead.status} />
                        <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium text-black/55">
                          {leadTopicLabel(lead.topic)}
                        </span>
                        {lead.priority === "high" ? (
                          <span className="text-[10px] font-semibold text-rose-600">High</span>
                        ) : null}
                        {isFollowUpDue(lead) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                            <CalendarClock className="h-3 w-3" />
                            Follow up
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={cn("col-span-12 lg:col-span-7", !selectedId && "max-lg:hidden")}>
            {!selectedId ? (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl bg-[#F6F7F6] text-center">
                <Inbox className="h-7 w-7 text-black/25" />
                <div className="mt-2 text-[13px] font-semibold text-black/60">Pick a lead</div>
                <p className="text-[12px] text-black/40">
                  See the enquiry, reach out, and track it through the pipeline.
                </p>
              </div>
            ) : detailLoading && !detail ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-[#0F766E]" />
              </div>
            ) : detail ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5 lg:hidden"
                    onClick={() => setSelectedId(null)}
                    aria-label="Back to leads"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-[18px] font-semibold text-black">
                        {detail.name}
                      </h2>
                      <StatusPill status={detail.status} />
                    </div>
                    <p className="mt-0.5 text-[12px] text-black/50">
                      {detail.school ? `${detail.school} · ` : ""}
                      {leadTopicLabel(detail.topic)} · {detail.id} ·{" "}
                      {formatChatStamp(detail.createdAt, "list")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-black/40 hover:text-rose-600"
                    title="Delete lead"
                    onClick={() => setPendingDelete(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
                    onClick={() => touch("email")}
                  >
                    <Mail className="mr-1.5 h-3.5 w-3.5" />
                    Email
                  </Button>
                  {detail.phone ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        className="rounded-full"
                        onClick={() => touch("whatsapp")}
                      >
                        <WhatsAppIcon className="mr-1.5 h-3.5 w-3.5" />
                        WhatsApp
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        className="rounded-full"
                        onClick={() => touch("call")}
                      >
                        <Phone className="mr-1.5 h-3.5 w-3.5" />
                        Call
                      </Button>
                    </>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-2 rounded-xl border border-[#EDEDED] p-3 text-[12px] sm:grid-cols-2">
                  <div>
                    <div className="text-black/40">Email</div>
                    <a
                      href={`mailto:${detail.email}`}
                      className="break-all font-medium text-black hover:underline"
                    >
                      {detail.email}
                    </a>
                  </div>
                  <div>
                    <div className="text-black/40">Phone / WhatsApp</div>
                    <div className="font-medium text-black">{detail.phone || "—"}</div>
                  </div>
                  <div>
                    <div className="text-black/40">Last contacted</div>
                    <div className="font-medium text-black">
                      {detail.lastContactedAt
                        ? formatChatStamp(detail.lastContactedAt, "list")
                        : "Not yet"}
                    </div>
                  </div>
                  <div>
                    <div className="text-black/40">Source page</div>
                    <div className="flex items-center gap-1 truncate font-medium text-black">
                      {detail.page || "Contact page"}
                      {detail.page?.startsWith("http") ? (
                        <a
                          href={detail.page}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Open source page"
                        >
                          <ExternalLink className="h-3 w-3 text-black/40" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-[#F4FBF0] p-3.5 text-[13px] leading-relaxed whitespace-pre-wrap text-black/80">
                  {detail.message.trim() || (
                    <span className="italic text-black/40">No message — contact details only.</span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                      Status
                    </span>
                    <LeadSelect
                      value={detail.status}
                      options={STATUS_OPTIONS}
                      disabled={busy}
                      onChange={(status) =>
                        patchDetail({ status }, `Marked ${leadStatusLabel(status)}`)
                      }
                      ariaLabel="Lead status"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                      Priority
                    </span>
                    <LeadSelect
                      value={detail.priority}
                      options={PRIORITY_OPTIONS}
                      disabled={busy}
                      onChange={(priority) => patchDetail({ priority })}
                      className={PRIORITY_TONE[detail.priority]}
                      ariaLabel="Lead priority"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                      Follow-up
                    </span>
                    <div className="flex items-center gap-1">
                      <DatePicker
                        value={detail.followUpAt ?? ""}
                        disabled={busy}
                        min={todayIso()}
                        placeholder="Set date"
                        align="end"
                        quickPicks={FOLLOW_UP_PICKS}
                        onChange={(value) =>
                          patchDetail({ followUpAt: value || null }, "Follow-up scheduled")
                        }
                        className={cn(
                          "h-9 min-w-0 flex-1 rounded-lg",
                          isFollowUpDue(detail) && "border-amber-300 text-amber-800",
                        )}
                      />
                      {detail.followUpAt ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => patchDetail({ followUpAt: null }, "Follow-up cleared")}
                          className="inline-flex h-9 w-7 shrink-0 items-center justify-center rounded-lg text-black/35 hover:bg-black/5 hover:text-black"
                          aria-label="Clear follow-up"
                          title="Clear follow-up"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                    Activity
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add an internal note — call outcome, requirements, next step…"
                      className="min-h-[64px] rounded-lg text-[13px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveNote();
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      disabled={busy || !note.trim()}
                      className="h-9 w-9 shrink-0 self-end rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
                      onClick={saveNote}
                      aria-label="Add note"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <ol className="relative space-y-3 border-l border-[#E5E5E5] pl-4">
                    {[...detail.events].reverse().map((event) => (
                      <li key={event.id} className="relative">
                        <span
                          className={cn(
                            "absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white",
                            event.type === "note" ? "bg-[#0F766E]" : "bg-black/25",
                          )}
                        />
                        <div
                          className={cn(
                            "text-[13px] text-black/80",
                            event.type === "note" && "whitespace-pre-wrap",
                          )}
                        >
                          {eventText(event)}
                        </div>
                        <div className="text-[11px] text-black/40">
                          {event.author ? `${event.author} · ` : ""}
                          {formatChatStamp(event.createdAt, "list")}
                        </div>
                      </li>
                    ))}
                    <li className="relative">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-sky-500 ring-2 ring-white" />
                      <div className="text-[13px] text-black/80">Enquiry received from website</div>
                      <div className="text-[11px] text-black/40">
                        {formatChatStamp(detail.createdAt, "list")}
                      </div>
                    </li>
                  </ol>
                </div>

                {detail.otherEnquiries.length ? (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                      Earlier enquiries from this email
                    </div>
                    {detail.otherEnquiries.map((other) => (
                      <button
                        key={other.id}
                        type="button"
                        onClick={() => setSelectedId(other.id)}
                        className="flex w-full items-center gap-2 rounded-lg border border-[#EDEDED] px-3 py-2 text-left text-[12px] hover:bg-[#FAFAFA]"
                      >
                        <span className="font-mono text-black/60">{other.id}</span>
                        <span className="text-black/50">{leadTopicLabel(other.topic)}</span>
                        <span className="ml-auto">
                          <StatusPill status={other.status} />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </OrganicCard>

      <AlertDialog
        open={pendingDelete}
        onOpenChange={(open) => {
          if (!open && !busy) setPendingDelete(false);
        }}
      >
        <AlertDialogContent className="max-w-sm rounded-2xl border border-[#E5E5E5] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              The enquiry and its activity history are removed permanently. To keep a record, mark
              it Lost or Spam instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy} className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className="rounded-full bg-[#EF4444] text-white hover:bg-[#DC2626]"
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
