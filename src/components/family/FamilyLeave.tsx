import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FamilyCard, FamilyHeader } from "@/components/family/FamilyChrome";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { familyApplyLeave, familyLeave, type LeaveHistory } from "@/lib/api/family";
import { ApiError } from "@/lib/api/client";
import { useFamily } from "@/lib/family-session";

export function FamilyLeave() {
  const { student, setDirty } = useFamily();
  const [balance, setBalance] = useState<{ total: number; used: number; remaining: number; types: { id: string; name: string }[] } | null>(null);
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
      await familyApplyLeave({ studentId: student.id, typeId, startDate, endDate, reason: reason.trim() });
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
      <div className="space-y-4 px-4 pb-24">
        <FamilyCard>
          <h2 className="text-sm font-semibold">Leave status</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Count value={balance?.total} label="Total leave" />
            <Count value={balance?.used} label="Used leave" />
            <Count value={balance?.remaining} label="Remaining leave" />
          </div>
        </FamilyCard>
        <FamilyCard>
          <h2 className="text-sm font-semibold">Apply for leave</h2>
          <form
            className="mt-3 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!busy) void submit();
            }}
          >
            <div>
              <Label htmlFor="leave-type">Leave type</Label>
              <select
                id="leave-type"
                value={typeId}
                onChange={(event) => setTypeId(event.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-950"
              >
                {(balance?.types ?? []).map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.typeId ? <p className="mt-1 text-xs text-rose-600">{errors.typeId}</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="leave-start">Start date</Label>
                <input id="leave-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm dark:border-white/10 dark:bg-zinc-950" />
                {errors.startDate ? <p className="mt-1 text-xs text-rose-600">{errors.startDate}</p> : null}
              </div>
              <div>
                <Label htmlFor="leave-end">End date</Label>
                <input id="leave-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm dark:border-white/10 dark:bg-zinc-950" />
                {errors.endDate ? <p className="mt-1 text-xs text-rose-600">{errors.endDate}</p> : null}
              </div>
            </div>
            <div>
              <Label htmlFor="leave-reason">Reason</Label>
              <Textarea id="leave-reason" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 rounded-xl" />
              {errors.reason ? <p className="mt-1 text-xs text-rose-600">{errors.reason}</p> : null}
            </div>
            <Button type="submit" disabled={busy || !typeId || !startDate || !endDate || reason.trim().length < 3} className="h-11 w-full rounded-xl bg-[#0F766E] text-white hover:bg-[#0D9488]">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit request
            </Button>
          </form>
        </FamilyCard>
        <div>
          <h2 className="mb-2 text-sm font-semibold">Leave request history</h2>
          {history.length === 0 ? (
            <FamilyCard>
              <p className="text-sm text-slate-500">No leave requests yet.</p>
            </FamilyCard>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <FamilyCard key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{item.type}</p>
                    <p className="text-xs text-slate-500">
                      {item.startDate} to {item.endDate}
                    </p>
                  </div>
                  <StatusChip status={item.status} />
                </FamilyCard>
              ))}
            </div>
          )}
          {history.length < total ? (
            <button type="button" className="mt-3 w-full text-sm font-medium text-[#0F766E]" onClick={() => void more()}>
              View more
            </button>
          ) : null}
        </div>
        <a href="/family/attendance" className="sr-only">
          Attendance
        </a>
      </div>
    </>
  );
}

function Count({ value, label }: { value?: number; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 py-3 dark:border-white/10">
      <div className="text-xl font-semibold">{value === undefined ? "—" : String(value).padStart(2, "0")}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const approved = status === "approved";
  const rejected = status === "rejected";
  return (
    <span
      className={
        approved
          ? "rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-800"
          : rejected
            ? "rounded-full bg-rose-100 px-2 py-1 text-[10px] font-semibold uppercase text-rose-800"
            : "rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase text-amber-800"
      }
    >
      {status}
    </span>
  );
}
