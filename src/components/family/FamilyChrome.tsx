import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Check,
  ChevronDown,
  GraduationCap,
  Home,
  IndianRupee,
  Settings,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FamilyStudent } from "@/lib/api/family";
import { useFamily } from "@/lib/family-session";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/family", label: "Home", icon: Home, exact: true },
  { to: "/family/academics", label: "Academic", icon: GraduationCap, exact: false },
  { to: "/family/attendance", label: "Attendance", icon: UserRound, exact: false },
  { to: "/family/fees", label: "Fees", icon: IndianRupee, exact: false },
  { to: "/family/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function FamilyFrame({ children }: { children: ReactNode }) {
  const { theme } = useFamily();
  return (
    <div className={cn("min-h-dvh bg-[#eef3f2] text-slate-900", theme === "dark" && "dark")}>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#f7f8f6] text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
        {children}
      </div>
    </div>
  );
}

export function FamilyHeader({
  unread = 0,
  showBell = true,
}: {
  unread?: number;
  showBell?: boolean;
}) {
  const { profile, student, selectStudent, confirmLeave } = useFamily();
  const navigate = useNavigate();
  const students = profile?.students ?? [];
  const canSwitch = students.length > 1;
  return (
    <header className="flex items-center gap-3 px-4 pb-2 pt-4">
      {canSwitch ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-start dark:border-white/10 dark:bg-zinc-900"
              aria-label="Switch student"
            >
              <StudentFace student={student} />
              <StudentLines student={student} />
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={8}
            className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-2xl border-slate-200 bg-white p-1.5 text-slate-900 shadow-lg dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {students.map((item) => {
              const selected = item.id === student?.id;
              return (
                <DropdownMenuItem
                  key={item.id}
                  className={cn(
                    "gap-3 rounded-xl px-2 py-2 focus:bg-[#F0FDFA] focus:text-slate-900 dark:focus:bg-teal-950 dark:focus:text-zinc-100",
                    selected && "bg-[#F0FDFA] dark:bg-teal-950",
                  )}
                  onSelect={(event) => {
                    if (!confirmLeave()) {
                      event.preventDefault();
                      return;
                    }
                    if (item.id !== student?.id) void selectStudent(item.id);
                  }}
                >
                  <StudentFace student={item} compact />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{item.name}</span>
                    <span className="block truncate text-xs font-normal text-slate-500 dark:text-zinc-400">
                      {item.cls || "Class"}
                    </span>
                  </span>
                  {selected ? <Check className="h-4 w-4 text-[#0F766E]" /> : <span className="h-4 w-4" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-zinc-900">
          <StudentFace student={student} />
          <StudentLines student={student} />
        </div>
      )}
      {showBell ? (
        <a
          href="/family/notifications"
          onClick={(event) => {
            if (!confirmLeave()) {
              event.preventDefault();
              return;
            }
            event.preventDefault();
            void navigate({ href: "/family/notifications" });
          }}
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
          ) : null}
        </a>
      ) : null}
    </header>
  );
}

function StudentFace({
  student,
  compact = false,
}: {
  student: FamilyStudent | null;
  compact?: boolean;
}) {
  const name = student?.name ?? "Student";
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-50 font-semibold text-[#0F766E] dark:bg-teal-950",
        compact ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm",
      )}
    >
      {student?.photoUrl ? (
        <img src={student.photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 1)
      )}
    </span>
  );
}

function StudentLines({ student }: { student: FamilyStudent | null }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold">{student?.name ?? "Student"}</span>
      <span className="block truncate text-xs text-slate-500 dark:text-zinc-400">
        {student?.cls || "Class"}
      </span>
    </span>
  );
}

export function FamilyNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { confirmLeave } = useFamily();
  return (
    <nav className="sticky bottom-0 z-20 mx-3 mb-3 mt-auto grid grid-cols-5 rounded-2xl border border-slate-200 bg-white px-1 py-2 shadow-lg dark:border-white/10 dark:bg-zinc-900">
      {NAV.map((item) => {
        const active = item.exact ? pathname === "/family" || pathname === "/family/" : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <a
            key={item.to}
            href={item.to}
            aria-current={active ? "page" : undefined}
            onClick={(event) => {
              if (!confirmLeave()) {
                event.preventDefault();
                return;
              }
              event.preventDefault();
              void navigate({ href: item.to });
            }}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-1 py-1 text-[10px] font-medium",
              active ? "text-[#0F766E]" : "text-slate-500 dark:text-zinc-400",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}

export function FamilyCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function FamilySkeleton() {
  return (
    <div className="space-y-3 px-4">
      <div className="h-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-zinc-800" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-zinc-800" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-zinc-800" />
      </div>
      <div className="h-16 animate-pulse rounded-2xl bg-slate-200 dark:bg-zinc-800" />
    </div>
  );
}
