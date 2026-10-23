import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowRight,
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
  { to: "/family", label: "Home", icon: Home, exact: true, active: "bg-[#E0F5ED] text-[#2F9E7A]" },
  { to: "/family/academics", label: "Academic", icon: GraduationCap, exact: false, active: "bg-[#EBE8FF] text-[#6B5CE7]" },
  { to: "/family/attendance", label: "Attendance", icon: UserRound, exact: false, active: "bg-[#E0F5ED] text-[#2F9E7A]" },
  { to: "/family/fees", label: "Fees", icon: IndianRupee, exact: false, active: "bg-[#FFF4D6] text-[#D4920A]" },
  { to: "/family/settings", label: "Settings", icon: Settings, exact: false, active: "bg-[#EBE8FF] text-[#6B5CE7]" },
] as const;

export function FamilyFrame({ children }: { children: ReactNode }) {
  const { theme } = useFamily();
  return (
    <div className={cn("family-app min-h-dvh bg-[var(--family-page)] text-[var(--family-ink)]", theme === "dark" && "dark")}>
      <div className="family-app-shell mx-auto flex min-h-dvh w-full max-w-md flex-col text-[var(--family-ink)]">
        {children}
      </div>
    </div>
  );
}

export function FamilyHeader({
  unread = 0,
  showBell = true,
  variant = "card",
}: {
  unread?: number;
  showBell?: boolean;
  /** `card` = white rounded student chip; `plain` = avatar + name only (Home mock). */
  variant?: "card" | "plain";
}) {
  const { profile, student, selectStudent, confirmLeave } = useFamily();
  const navigate = useNavigate();
  const students = profile?.students ?? [];
  const canSwitch = students.length > 1;
  const chip =
    variant === "card"
      ? "group flex min-w-0 flex-1 items-center gap-3 rounded-[22px] bg-white px-3 py-2.5 text-start shadow-[var(--family-shadow)] dark:bg-[var(--family-surface)]"
      : "group flex min-w-0 flex-1 items-center gap-3 text-start";

  const trigger = (
    <>
      <StudentFace student={student} />
      <StudentLines student={student} />
      {canSwitch || variant === "card" ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3F4FB] dark:bg-white/10">
          <ChevronDown className="h-4 w-4 text-[var(--family-ink-muted)] transition-transform group-data-[state=open]:rotate-180" />
        </span>
      ) : null}
    </>
  );

  return (
    <header className="flex items-center gap-3 px-4 pb-2 pt-4">
      {canSwitch ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={chip} aria-label="Switch student">
              {trigger}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={8}
            className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-2xl border-0 bg-white p-1.5 text-[var(--family-ink)] shadow-lg dark:bg-[var(--family-surface)]"
          >
            {students.map((item) => {
              const selected = item.id === student?.id;
              return (
                <DropdownMenuItem
                  key={item.id}
                  className={cn(
                    "gap-3 rounded-xl px-2 py-2 focus:bg-[var(--family-lavender)] focus:text-[var(--family-ink)]",
                    selected && "bg-[var(--family-lavender)]",
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
                    <span className="block truncate text-xs font-normal text-[var(--family-ink-muted)]">
                      {item.cls || "Class"}
                    </span>
                  </span>
                  {selected ? <Check className="h-4 w-4 text-[var(--family-lavender-deep)]" /> : <span className="h-4 w-4" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className={chip}>{trigger}</div>
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
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-[var(--family-shadow)] dark:bg-[var(--family-surface)]"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-[var(--family-ink)]" />
          {unread > 0 ? (
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#F43F5E] ring-2 ring-white" />
          ) : null}
        </a>
      ) : null}
    </header>
  );
}

export function StudentFace({
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
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--family-sky)] font-bold text-[var(--family-sky-deep)]",
        compact ? "h-8 w-8 text-xs" : "h-11 w-11 text-sm",
      )}
    >
      {student?.photoUrl ? (
        <img src={student.photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

function StudentLines({ student }: { student: FamilyStudent | null }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[15px] font-bold tracking-tight text-[var(--family-ink)]">
        {student?.name ?? "Student"}
      </span>
      <span className="block truncate text-xs font-medium text-[var(--family-ink-muted)]">
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
    <nav className="sticky bottom-0 z-20 mx-3 mb-3 mt-auto grid grid-cols-5 rounded-[28px] bg-white px-1.5 py-2.5 shadow-[var(--family-shadow-nav)] dark:bg-[var(--family-surface)]">
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
              "flex flex-col items-center gap-1 rounded-2xl px-1 py-1 text-[10px] font-semibold",
              active ? "text-[var(--family-ink)]" : "text-[var(--family-ink-muted)]",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                active ? item.active : "bg-transparent",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", active && "stroke-[2.25]")} />
            </span>
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
        "rounded-[var(--family-radius-card)] bg-white p-4 shadow-[var(--family-shadow)] dark:bg-[var(--family-surface)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function FamilySectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="text-[15px] font-bold tracking-tight text-[var(--family-ink)]">{children}</h2>
      {action}
    </div>
  );
}

export function FamilyFeatureTile({
  label,
  href,
  onClick,
  illustration,
  tone = "mint",
  className,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  illustration: string;
  tone?: "mint" | "lavender" | "cream" | "sky";
  className?: string;
}) {
  const navigate = useNavigate();
  const { confirmLeave } = useFamily();
  const tones = {
    mint: "bg-[var(--family-mint)]",
    lavender: "bg-[var(--family-lavender)]",
    cream: "bg-[var(--family-cream)]",
    sky: "bg-[var(--family-sky)]",
  } as const;

  const content = (
    <>
      <img src={illustration} alt="" className="h-14 w-14 object-contain drop-shadow-sm" />
      <span className="mt-auto pt-3 text-left text-[13px] font-bold text-[var(--family-ink)]">{label}</span>
      <span className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-[var(--family-ink)] shadow-sm">
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </>
  );

  const shared = cn(
    "relative flex min-h-[124px] flex-col overflow-hidden rounded-[var(--family-radius-tile)] p-4 transition active:scale-[0.98]",
    tones[tone],
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shared}>
        {content}
      </button>
    );
  }

  return (
    <a
      href={href ?? "#"}
      onClick={(event) => {
        if (!href) return;
        if (!confirmLeave()) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        void navigate({ href });
      }}
      className={shared}
    >
      {content}
    </a>
  );
}

export function FamilyPillButton({
  children,
  className,
  type = "button",
  disabled,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-[var(--family-radius-pill)] bg-[var(--family-yellow)] px-6 text-sm font-bold text-[var(--family-ink)] shadow-[0_8px_24px_-8px_rgba(255,197,66,0.7)] transition hover:bg-[var(--family-yellow-press)] disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function FamilyStatChip({
  value,
  label,
  tone = "mint",
  className,
}: {
  value: ReactNode;
  label: string;
  tone?: "mint" | "lavender" | "cream" | "sky" | "pink";
  className?: string;
}) {
  const tones = {
    mint: "bg-[var(--family-mint)]",
    lavender: "bg-[var(--family-lavender)]",
    cream: "bg-[var(--family-cream)]",
    sky: "bg-[var(--family-sky)]",
    pink: "bg-[var(--family-pink)]",
  } as const;
  return (
    <div className={cn("rounded-2xl px-2 py-3 text-center", tones[tone], className)}>
      <div className="text-lg font-extrabold tabular-nums text-[var(--family-ink)]">{value}</div>
      <div className="mt-0.5 text-[10px] font-semibold text-[var(--family-ink-muted)]">{label}</div>
    </div>
  );
}

export function FamilySkeleton() {
  return (
    <div className="space-y-3 px-4">
      <div className="h-36 animate-pulse rounded-[24px] bg-white/70 dark:bg-white/10" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-28 animate-pulse rounded-[22px] bg-white/70 dark:bg-white/10" />
        <div className="h-28 animate-pulse rounded-[22px] bg-white/70 dark:bg-white/10" />
        <div className="h-28 animate-pulse rounded-[22px] bg-white/70 dark:bg-white/10" />
      </div>
      <div className="h-16 animate-pulse rounded-[24px] bg-white/70 dark:bg-white/10" />
    </div>
  );
}
