import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  schoolLeaveInbox,
  schoolReviewLeave,
  type LeaveInboxItem,
} from "@/lib/api/school-family";
import { ApiError } from "@/lib/api/client";

export function ParentLeaveInbox() {
  const [rows, setRows] = useState<LeaveInboxItem[]>([]);
  const [types, setTypes] = useState<{ id: string; name: string; annualDays: number }[]>([]);
  const [pending, setPending] = useState<LeaveInboxItem | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [days, setDays] = useState("8");

  async function load() {
    const data = await schoolLeaveInbox("pending");
    setRows(data.requests);
    setTypes(data.types);
  }

  useEffect(() => {
    void load().catch(() => undefined);
  }, []);

  async function review(decision: "approve" | "reject") {
    if (!pending || busy) return;
    setBusy(true);
    try {
      const result = await schoolReviewLeave({ action: "review", id: pending.id, decision, note });
      if (result.skippedDates.length) {
        toast.message("Some days were already marked", { description: result.skippedDates.join(", ") });
      } else {
        toast.success(decision === "approve" ? "Leave approved" : "Leave rejected");
      }
      setPending(null);
      setNote("");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not review leave");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Parent leave requests</h2>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            void schoolReviewLeave({ action: "save-type", name: name.trim(), annualDays: Number(days) || 0 })
              .then(() => {
                setName("");
                return load();
              })
              .catch((err) => toast.error(err instanceof Error ? err.message : "Could not save the type"));
          }}
        >
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Leave type" className="h-9 w-36 rounded-xl" />
          <Input value={days} onChange={(event) => setDays(event.target.value)} inputMode="numeric" className="h-9 w-16 rounded-xl" aria-label="Annual days" />
          <Button type="submit" variant="outline" className="h-9 rounded-xl">Add</Button>
        </form>
      </div>
      {types.length > 0 ? (
        <p className="mt-2 text-xs text-slate-500">
          Allowance: {types.map((type) => `${type.name} ${type.annualDays}`).join(" · ")}
        </p>
      ) : null}
      {rows.length === 0 ? <p className="mt-3 text-sm text-slate-500">No pending requests.</p> : null}
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10">
            <div>
              <p className="font-medium">
                {row.studentName} · {row.cls}
              </p>
              <p className="text-xs text-slate-500">
                {row.type} · {row.startDate} to {row.endDate} · {row.days} days
              </p>
              <p className="text-xs">{row.reason}</p>
            </div>
            <Button type="button" className="rounded-xl bg-[#0F766E] text-white" onClick={() => setPending(row)}>
              Review
            </Button>
          </div>
        ))}
      </div>
      {pending ? (
        <div className="mt-3 w-full rounded-2xl border border-slate-200 p-3 dark:border-white/10" style={{ maxWidth: 400 }}>
          <p className="text-sm font-medium">Review {pending.studentName}</p>
          <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note to the parent" className="mt-2 rounded-xl" maxLength={255} />
          <div className="mt-2 flex gap-2">
            <Button type="button" disabled={busy} className="rounded-xl bg-[#0F766E] text-white" onClick={() => void review("approve")}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
            </Button>
            <Button type="button" disabled={busy} variant="outline" className="rounded-xl" onClick={() => void review("reject")}>
              Reject
            </Button>
            <Button type="button" variant="ghost" className="rounded-xl" onClick={() => setPending(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
