import { Check, ChevronDown, Loader2, Plane, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  FamilyCard,
  FamilyHeader,
  FamilyPillButton,
  FamilySectionTitle,
  FamilyStatChip,
} from "@/components/family/FamilyChrome";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { familyApplyLeave, familyLeave, type LeaveHistory } from "@/lib/api/family";
import { ApiError } from "@/lib/api/client";
import { useFamily } from "@/lib/family-session";
import { cn } from "@/lib/utils";

const LEAVE_DATE_PICKS = [
  { label: "Today", getDate: (t: Date) => t },
  {
    label: "+1d",
    getDate: (t: Date) => new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1),
  },
  {
    label: "+7d",
    getDate: (t: Date) => new Date(t.getFullYear(), t.getMonth(), t.getDate() + 7),
  },
];

export function FamilyLeave() {
  const { student, setDirty } = useFamily();
  const [balance, setBalance] = useState<{
    total: number;
    used: number;
    remaining: number;
    types: { id: string; name: string }[];
  } | null>(null);
  const [history, setHistory] = useState<LeaveHistory[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [typeId, setTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!student) return;
    let cancelled = false;
    familyLeave(student.id, 0)
      .then((data) => {
        if (cancelled) return;
        setBalance(data.balance);
        setHistory(data.history);
        setTotal(data.total);
        setOffset(data.history.length);
        setTypeId(data.balance.types[0]?.id ?? "");
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load leave"));
    return () => {
      cancelled = true;
    };
  }, [student]);

  useEffect(() => {
    setDirty(Boolean(startDate || endDate || reason));
    return () => setDirty(false);
  }, [startDate, endDate, reason, setDirty]);

  async function submit() {
    const next: Record<string, string> = {};
    if (!typeId) next.typeId = "Choose a leave type";
    if (!startDate) next.startDate = "Start date is required";
    if (!endDate) next.endDate = "End date is required";
    if (startDate && endDate && startDate > endDate) next.endDate = "End date must be after the start";
    if (reason.trim().length < 3) next.reason = "Add a short reason";
    setErrors(next);
    if (Object.keys(next).length || !student) return;
    setBusy(true);
    try {
      await familyApplyLeave({
        studentId: student.id,
        typeId,
        startDate,
        endDate,
        reason: reason.trim(),
      });
      toast.success("Leave request sent");
      setStartDate("");
      setEndDate("");
      setReason("");
      setDirty(false);
      const data = await familyLeave(student.id, 0);
      setBalance(data.balance);
      setHistory(data.history);
      setTotal(data.total);
      setOffset(data.history.length);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not submit");
    } finally {
      setBusy(false);
    }
  }

  async function more() {
    if (!student) return;
    const data = await familyLeave(student.id, offset);
    setHistory((current) => [...current, ...data.history]);
    setOffset((current) => current + data.history.length);
  }

  if (!student) return <p className="px-4 pt-6 text-sm">No student is linked yet.</p>;

  return (
    <>
      <FamilyHeader showBell={false} />
      <div className="space-y-5 px-4 pb-24">
        <div>
          <FamilySectionTitle>Leave status</FamilySectionTitle>
          <FamilyCard className="!p-3">
            <div className="grid grid-cols-3 gap-2">
              <FamilyStatChip
                value={pad(balance?.total)}
                label="Total leave"
                tone="lavender"
              />
              <FamilyStatChip value={pad(balance?.used)} label="Used leave" tone="cream" />
              <FamilyStatChip value={pad(balance?.remaining)} label="Remaining" tone="mint" />
            </div>
          </FamilyCard>
        </div>

        <section className="rounded-[28px] bg-[var(--family-lavender)]/70 p-4 dark:bg-[var(--family-lavender)]">
          <h2 className="mb-3 text-[15px] font-bold text-[var(--family-ink)]">Apply for a leave</h2>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!busy) void submit();
            }}
          >
            <div>
              <Label className="text-xs font-semibold text-[var(--family-ink-muted)]">Leave type</Label>
              <Select value={typeId || undefined} onValueChange={setTypeId}>
                <SelectTrigger
                  className="mt-1 h-12 w-full rounded-2xl border-0 bg-white px-4 text-sm font-semibold text-[var(--family-ink)] shadow-sm focus:ring-2 focus:ring-[var(--family-lavender-deep)]/25 dark:bg-[var(--family-surface)] [&>svg]:text-[var(--family-ink-muted)]"
                >
                  <SelectValue placeholder="Choose leave type" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-[#E8EAF4] bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-[var(--family-surface)]">
                  {(balance?.types ?? []).map((type) => (
                    <SelectItem
                      key={type.id}
                      value={type.id}
                      className="rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--family-ink)] focus:bg-[var(--family-lavender)] focus:text-[var(--family-ink)]"
                    >
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.typeId ? <p className="mt-1 text-xs text-[var(--family-pink-deep)]">{errors.typeId}</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold text-[var(--family-ink-muted)]">Start date</Label>
                <DatePicker
                  value={startDate}
                  onChange={(next) => {
                    setStartDate(next);
                    if (endDate && next && endDate < next) setEndDate(next);
                  }}
                  placeholder="dd/mm/yyyy"
                  valueFormat="iso"
                  variant="pill"
                  align="start"
                  quickPicks={LEAVE_DATE_PICKS}
                  className="mt-1 h-12 w-full rounded-2xl border-0 bg-white px-3 text-sm font-semibold text-[var(--family-ink)] shadow-sm dark:bg-[var(--family-surface)]"
                />
                {errors.startDate ? (
                  <p className="mt-1 text-xs text-[var(--family-pink-deep)]">{errors.startDate}</p>
                ) : null}
              </div>
              <div>
                <Label className="text-xs font-semibold text-[var(--family-ink-muted)]">End date</Label>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="dd/mm/yyyy"
                  valueFormat="iso"
                  variant="pill"
                  align="end"
                  min={startDate || undefined}
                  quickPicks={LEAVE_DATE_PICKS}
                  className="mt-1 h-12 w-full rounded-2xl border-0 bg-white px-3 text-sm font-semibold text-[var(--family-ink)] shadow-sm dark:bg-[var(--family-surface)]"
                />
                {errors.endDate ? (
                  <p className="mt-1 text-xs text-[var(--family-pink-deep)]">{errors.endDate}</p>
                ) : null}
              </div>
            </div>
            <div>
              <Label htmlFor="leave-reason" className="text-xs font-semibold text-[var(--family-ink-muted)]">
                Reason
              </Label>
              <Textarea
                id="leave-reason"
                maxLength={500}
                placeholder="Write the reason for leave."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mt-1 min-h-[96px] rounded-2xl border-0 bg-white text-sm shadow-sm dark:bg-[var(--family-surface)]"
              />
              {errors.reason ? <p className="mt-1 text-xs text-[var(--family-pink-deep)]">{errors.reason}</p> : null}
            </div>
            <FamilyPillButton
              type="submit"
              disabled={busy || !typeId || !startDate || !endDate || reason.trim().length < 3}
              className="w-full"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plane className="h-4 w-4" />}
              Submit request
            </FamilyPillButton>
          </form>
        </section>

        <div>
          <FamilySectionTitle>Leave request history</FamilySectionTitle>
          {history.length === 0 ? (
            <FamilyCard>
              <p className="text-sm text-[var(--family-ink-muted)]">No leave requests yet.</p>
            </FamilyCard>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <HistoryRow key={item.id} item={item} />
              ))}
            </div>
          )}
          {history.length < total ? (
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-1 text-sm font-bold text-[var(--family-lavender-deep)]"
              onClick={() => void more()}
            >
              View more
              <ChevronDown className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}

function pad(value?: number) {
  if (value === undefined) return "—";
  return String(value).padStart(2, "0");
}

function HistoryRow({ item }: { item: LeaveHistory }) {
  const approved = item.status === "approved";
  const rejected = item.status === "rejected";
  return (
    <FamilyCard className="flex items-center gap-3 !py-3">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          approved
            ? "bg-[var(--family-mint)] text-[var(--family-mint-deep)]"
            : rejected
              ? "bg-[var(--family-pink)] text-[var(--family-pink-deep)]"
              : "bg-[var(--family-cream)] text-[var(--family-cream-deep)]",
        )}
      >
        {approved ? <Check className="h-4 w-4" /> : rejected ? <X className="h-4 w-4" /> : <Plane className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{item.type}</p>
        <p className="text-xs text-[var(--family-ink-muted)]">
          {formatLeaveDate(item.startDate)} – {formatLeaveDate(item.endDate)}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize",
          approved
            ? "bg-[var(--family-mint)] text-[var(--family-mint-deep)]"
            : rejected
              ? "bg-[var(--family-pink)] text-[var(--family-pink-deep)]"
              : "bg-[var(--family-cream)] text-[var(--family-cream-deep)]",
        )}
      >
        {item.status}
      </span>
    </FamilyCard>
  );
}

function formatLeaveDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
