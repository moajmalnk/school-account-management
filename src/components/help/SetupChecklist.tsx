import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  Circle,
  GraduationCap,
  ReceiptText,
  Sparkles,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { canUseHelpAccess, parseHelpHref } from "@/lib/help/access";
import type { HelpAccess } from "@/lib/help/guides";
import { useTenantStore } from "@/lib/tenant-store";
import { cn, glassCardClass } from "@/lib/utils";

const COLLAPSE_KEY = "feezo_help_checklist_collapsed_v1";

type ChecklistStep = {
  id: string;
  title: string;
  why: string;
  done: boolean;
  href: string;
  guideId: string;
  icon: LucideIcon;
  access?: HelpAccess;
};

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function ProgressRing({ value }: { value: number }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden>
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="6"
          className="stroke-slate-200 dark:stroke-white/10"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-[#0F766E] transition-[stroke-dashoffset] duration-700 ease-out dark:stroke-[#2DD4BF]"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-mono text-[13px] font-bold text-slate-900 dark:text-zinc-50">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

export function SetupChecklist({ onOpenGuide }: { onOpenGuide: (guideId: string) => void }) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const {
    hydrated,
    schoolDetails,
    academicYear,
    activeClasses,
    activeStudents,
    activePayments,
    activeStaff,
    tenantUsers,
  } = useTenantStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(readCollapsed());
  }, []);

  const steps = useMemo<ChecklistStep[]>(() => {
    const all: ChecklistStep[] = [
      {
        id: "profile",
        title: "Add school name and logo",
        why: "Printed on every receipt and report parents receive.",
        done: Boolean(schoolDetails.name.trim() && schoolDetails.logoUrl),
        href: "/tenant/settings?tab=school",
        guideId: "school-profile",
        icon: Building2,
        access: { kind: "settings", tab: "school" },
      },
      {
        id: "year",
        title: "Confirm your academic year",
        why: "All fees and receipts are kept year by year.",
        done: Boolean(academicYear),
        href: "/tenant/settings?tab=system",
        guideId: "academic-year",
        icon: CalendarRange,
        access: { kind: "settings", tab: "system" },
      },
      {
        id: "classes",
        title: "Create your classes",
        why: "Students are admitted into a class.",
        done: activeClasses.length > 0,
        href: "/tenant/settings?tab=classes",
        guideId: "classes-fees",
        icon: GraduationCap,
        access: { kind: "settings", tab: "classes" },
      },
      {
        id: "fees",
        title: "Set the fee structure",
        why: "Feezo then works out every student's dues for you.",
        done: activeClasses.some(
          (c) => (c.feeSchedule?.length ?? 0) > 0 || (c.tuitionFeeAmount ?? 0) > 0,
        ),
        href: "/tenant/settings?tab=classes",
        guideId: "classes-fees",
        icon: BookOpen,
        access: { kind: "settings", tab: "classes" },
      },
      {
        id: "student",
        title: "Admit your first student",
        why: "Or import your whole list from Excel at once.",
        done: activeStudents.length > 0,
        href: "/tenant/students/admit",
        guideId: "admit-student",
        icon: UserPlus,
        access: { kind: "permission", key: "students" },
      },
      {
        id: "receipt",
        title: "Collect your first fee",
        why: "Issue a receipt and share it on WhatsApp.",
        done: activePayments.length > 0,
        href: "/tenant/finance?tab=receive",
        guideId: "receive-payment",
        icon: ReceiptText,
        access: { kind: "finance", view: "receive" },
      },
      {
        id: "team",
        title: "Add staff or a team login",
        why: "Let your accountant or office staff work with their own login.",
        done: activeStaff.length > 0 || tenantUsers.length > 0,
        href: "/tenant/staff",
        guideId: "add-staff",
        icon: Users,
        access: { kind: "permission", key: "staff" },
      },
    ];
    return all.filter((s) => canUseHelpAccess(session, s.access));
  }, [
    session,
    schoolDetails.name,
    schoolDetails.logoUrl,
    academicYear,
    activeClasses,
    activeStudents.length,
    activePayments.length,
    activeStaff.length,
    tenantUsers.length,
  ]);

  const doneCount = steps.filter((s) => s.done).length;
  const complete = steps.length > 0 && doneCount === steps.length;
  const nextStep = steps.find((s) => !s.done);

  useEffect(() => {
    if (complete && !readCollapsed()) setCollapsed(true);
  }, [complete]);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  };

  if (steps.length === 0) return null;

  if (!hydrated) {
    return <Skeleton className="h-40 w-full rounded-2xl" aria-label="Loading setup checklist" />;
  }

  const go = (href: string) => {
    const { to, search } = parseHelpHref(href);
    void navigate({ to: to as "/tenant/dashboard", search } as never);
  };

  return (
    <section className={cn(glassCardClass, "w-full overflow-hidden")} aria-labelledby="setup-title">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-4 p-4 text-left sm:p-5"
      >
        <ProgressRing value={steps.length ? doneCount / steps.length : 0} />
        <div className="min-w-0 flex-1">
          <h2
            id="setup-title"
            className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-slate-900 dark:text-zinc-50"
          >
            {complete ? (
              <>
                <Sparkles className="h-4 w-4 text-[#0F766E] dark:text-[#2DD4BF]" />
                Your school is fully set up
              </>
            ) : (
              "Set up your school"
            )}
          </h2>
          <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500 dark:text-zinc-400">
            {complete
              ? "Every step is done. Browse the guides below to get even more out of Feezo."
              : `${doneCount} of ${steps.length} done · ticks itself as you work${
                  nextStep ? ` · next: ${nextStep.title.toLowerCase()}` : ""
                }`}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-semibold text-slate-500 dark:text-zinc-400">
          <span className="hidden sm:inline">{collapsed ? "Show steps" : "Hide"}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", !collapsed && "rotate-180")} />
        </span>
      </button>

      {!collapsed && (
        <ol className="divide-y divide-slate-200/70 border-t border-slate-200/70 dark:divide-white/10 dark:border-white/10">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isNext = step.id === nextStep?.id;
            return (
              <li
                key={step.id}
                className={cn(
                  "flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5",
                  isNext && "bg-[#F0FDFA]/70 dark:bg-teal-950/25",
                )}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {step.done ? (
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#10B981]"
                      aria-label="Done"
                    />
                  ) : (
                    <Circle
                      className="mt-0.5 h-5 w-5 shrink-0 text-slate-300 dark:text-zinc-600"
                      aria-label="Not done"
                    />
                  )}
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-900 dark:text-zinc-50",
                        step.done &&
                          "text-slate-500 line-through decoration-slate-300 dark:text-zinc-500",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                      <span className="font-mono text-[11px] text-slate-400">{index + 1}.</span>
                      {step.title}
                    </div>
                    <p className="mt-0.5 text-[12px] leading-snug text-slate-500 dark:text-zinc-400">
                      {step.why}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 pl-8 sm:pl-0">
                  <button
                    type="button"
                    onClick={() => onOpenGuide(step.guideId)}
                    className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3 text-[11.5px] font-semibold text-slate-700 transition-colors hover:border-[#0F766E]/40 hover:text-[#0F766E] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:text-[#2DD4BF]"
                  >
                    Show guide
                  </button>
                  {!step.done && (
                    <button
                      type="button"
                      onClick={() => go(step.href)}
                      className="inline-flex h-8 items-center gap-1 rounded-full bg-[#0F766E] px-3 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#0D9488]"
                    >
                      Do it now
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
