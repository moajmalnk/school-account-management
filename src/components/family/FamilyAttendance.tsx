import { useNavigate } from "@tanstack/react-router";
import { CalendarDays, Check, Clock3, Plane, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import {
  FamilyCard,
  FamilyHeader,
  FamilyPillButton,
  FamilySkeleton,
  FamilyStatChip,
} from "@/components/family/FamilyChrome";
import { familyAttendance } from "@/lib/api/family";
import { useFamily } from "@/lib/family-session";
import { cn } from "@/lib/utils";

const RANGES = [
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "year", label: "This year" },
] as const;

export function FamilyAttendance() {
  const { student, confirmLeave } = useFamily();
  const navigate = useNavigate();
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("week");
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
  if (error) return <p className="px-4 pt-4 text-sm text-[var(--family-pink-deep)]">{error}</p>;
  if (!data) {
    return (
      <>
        <FamilyHeader showBell={false} />
        <FamilySkeleton />
      </>
    );
  }
  const counts = data[range];
  const presentFriendly = /came|present|arrived|school/i.test(data.today.message);

  return (
    <>
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div>
          <p className="text-xs font-semibold text-[var(--family-ink-muted)]">Today</p>
          <p className="text-lg font-extrabold tracking-tight text-[var(--family-ink)]">{data.dateLabel}</p>
        </div>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[var(--family-shadow)] dark:bg-[var(--family-surface)]"
          aria-label="Calendar"
        >
          <CalendarDays className="h-5 w-5 text-[var(--family-ink)]" />
        </button>
      </div>
      <FamilyHeader showBell={false} />
      <div className="space-y-4 px-4 pb-6">
        <div
          className={cn(
            "flex items-center gap-3 rounded-[999px] px-4 py-3 shadow-[var(--family-shadow)]",
            presentFriendly ? "bg-[var(--family-mint)]" : "bg-[var(--family-cream)]",
          )}
        >
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white",
              presentFriendly ? "bg-[var(--family-mint-deep)]" : "bg-[var(--family-cream-deep)]",
            )}
          >
            {presentFriendly ? <Check className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
          </span>
          <p className="text-sm font-semibold leading-snug text-[var(--family-ink)]">{data.today.message}</p>
        </div>

        <FamilyCard>
          <h2 className="text-[15px] font-bold text-[var(--family-ink)]">Your child&apos;s presence</h2>
          <div className="mt-3 rounded-2xl bg-[var(--family-lavender)]/60 p-1 dark:bg-[var(--family-lavender)]">
            <div className="grid grid-cols-3 gap-1">
              {RANGES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRange(item.id)}
                  className={cn(
                    "rounded-xl px-2 py-2.5 text-[11px] font-bold transition",
                    range === item.id
                      ? "bg-[var(--family-yellow)] text-[var(--family-ink)] shadow-sm"
                      : "text-[var(--family-ink-muted)]",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            <FamilyStatChip value={fmt(counts.present)} label="Present" tone="mint" />
            <FamilyStatChip value={fmt(counts.absent)} label="Absent" tone="pink" />
            <FamilyStatChip value={fmt(counts.holiday)} label="Halfday" tone="cream" />
            <FamilyStatChip value={fmt(counts.leave)} label="Leave" tone="lavender" />
          </div>
        </FamilyCard>

        <div className="grid grid-cols-3 gap-2">
          <DetailCard
            icon={<Check className="h-4 w-4" />}
            iconClass="bg-[var(--family-mint)] text-[var(--family-mint-deep)]"
            tone="bg-[var(--family-mint)]"
            value={counts.onTime}
            label="Arrived on time"
          />
          <DetailCard
            icon={<Clock3 className="h-4 w-4" />}
            iconClass="bg-[#F5E6D3] text-[#9A6B3F]"
            tone="bg-[var(--family-cream)]"
            value={counts.late}
            label="Arrived late"
          />
          <DetailCard
            icon={<X className="h-4 w-4" />}
            iconClass="bg-[var(--family-lavender)] text-[var(--family-lavender-deep)]"
            tone="bg-[var(--family-lavender)]"
            value={counts.unmarked}
            label="No attendance"
          />
        </div>

        <FamilyPillButton
          className="sticky bottom-3 z-10 w-full"
          onClick={() => {
            if (!confirmLeave()) return;
            void navigate({ href: "/family/leave" });
          }}
        >
          <Plane className="h-4 w-4" />
          Request leave
        </FamilyPillButton>
      </div>
    </>
  );
}

function fmt(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function DetailCard({
  icon,
  iconClass,
  tone,
  value,
  label,
}: {
  icon: ReactNode;
  iconClass: string;
  tone: string;
  value: number;
  label: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-[22px] px-2 py-4 text-center shadow-[var(--family-shadow)]", tone)}>
      <span className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-full", iconClass)}>{icon}</span>
      <div className="text-xl font-extrabold tabular-nums text-[var(--family-ink)]">{value}</div>
      <div className="mt-1 text-[10px] font-semibold leading-tight text-[var(--family-ink-muted)]">{label}</div>
    </div>
  );
}
