import { useEffect, useState } from "react";

import { FamilyCard, FamilyHeader, FamilySkeleton } from "@/components/family/FamilyChrome";
import { familyAttendance } from "@/lib/api/family";
import { useFamily } from "@/lib/family-session";
import { cn } from "@/lib/utils";

const RANGES = ["week", "month", "year"] as const;

export function FamilyAttendance() {
  const { student } = useFamily();
  const [range, setRange] = useState<(typeof RANGES)[number]>("week");
  const [data, setData] = useState<Awaited<ReturnType<typeof familyAttendance>> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!student) return;
    let cancelled = false;
    setData(null);
    familyAttendance(student.id)
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load attendance");
      });
    return () => {
      cancelled = true;
    };
  }, [student]);

  if (!student) return <p className="px-4 pt-6 text-sm">No student is linked yet.</p>;
  if (error) return <p className="px-4 pt-4 text-sm text-rose-600">{error}</p>;
  if (!data) {
    return (
      <>
        <FamilyHeader showBell={false} />
        <FamilySkeleton />
      </>
    );
  }
  const counts = data[range];
  return (
    <>
      <p className="px-4 pt-4 text-center text-sm text-slate-500 dark:text-zinc-400">{data.dateLabel}</p>
      <FamilyHeader showBell={false} />
      <div className="space-y-4 px-4 pb-4">
        <FamilyCard className="flex items-start gap-3">
          <span className="mt-0.5 text-[#0F766E]">✓</span>
          <p className="text-sm font-medium">{data.today.message}</p>
        </FamilyCard>
        <div>
          <h2 className="mb-2 text-sm font-semibold">Your child presence</h2>
          <div className="grid grid-cols-3 gap-2">
            {RANGES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                className={cn(
                  "rounded-xl border px-2 py-2 text-xs font-medium capitalize",
                  range === item
                    ? "border-[#0F766E] bg-teal-50 text-[#0F766E] dark:bg-teal-950"
                    : "border-slate-200 dark:border-white/10",
                )}
              >
                This {item}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            <Stat value={counts.present} label="Present" />
            <Stat value={counts.absent} label="Absent" />
            <Stat value={counts.holiday} label="Holiday" />
            <Stat value={counts.leave} label="Leave" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Mini value={counts.onTime} label="Arrived on time" />
          <Mini value={counts.late} label="Arrived late" />
          <Mini value={counts.unmarked} label="No attendance" />
        </div>
      </div>
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const shown = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return (
    <div className="rounded-xl border border-slate-200 py-3 dark:border-white/10">
      <div className="text-lg font-semibold">{shown}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}

function Mini({ value, label }: { value: number; label: string }) {
  return (
    <FamilyCard className="px-2 py-3 text-center">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </FamilyCard>
  );
}
