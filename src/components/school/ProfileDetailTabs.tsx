import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Check,
  ChevronUp,
  FileText,
  GraduationCap,
  UserRound,
  Wallet,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const STUDENT_PROFILE_TAB_IDS = ["profile", "academic", "documents", "payments"] as const;

export const STAFF_PROFILE_TAB_IDS = [
  "profile",
  "professional",
  "attendance",
  "documents",
  "payments",
] as const;

export type StudentProfileTabId = (typeof STUDENT_PROFILE_TAB_IDS)[number];
export type StaffProfileTabId = (typeof STAFF_PROFILE_TAB_IDS)[number];
export type ProfileDetailTabId = StudentProfileTabId | StaffProfileTabId;

export type ProfileDetailTab = {
  id: ProfileDetailTabId;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
};

export const STUDENT_PROFILE_TABS: ProfileDetailTab[] = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "academic", label: "Academic", shortLabel: "Academic", icon: GraduationCap },
  { id: "documents", label: "Documents", shortLabel: "Docs", icon: FileText },
  { id: "payments", label: "Payments", icon: Wallet },
];

export const STAFF_PROFILE_TABS: ProfileDetailTab[] = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "professional", label: "Professional", shortLabel: "Work", icon: GraduationCap },
  { id: "attendance", label: "Attendance", shortLabel: "Attend.", icon: CalendarDays },
  { id: "documents", label: "Documents", shortLabel: "Docs", icon: FileText },
  { id: "payments", label: "Payments", icon: Wallet },
];

export function isStudentProfileTab(value: unknown): value is StudentProfileTabId {
  return (
    typeof value === "string" && (STUDENT_PROFILE_TAB_IDS as readonly string[]).includes(value)
  );
}

export function isStaffProfileTab(value: unknown): value is StaffProfileTabId {
  return typeof value === "string" && (STAFF_PROFILE_TAB_IDS as readonly string[]).includes(value);
}

const TAB_SHELL =
  "rounded-2xl border border-slate-200/70 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#171717] dark:shadow-black/40";

export function ProfileDetailTabs({
  tabs,
  value,
  onValueChange,
  children,
  className,
}: {
  tabs: ProfileDetailTab[];
  value: ProfileDetailTabId;
  onValueChange: (value: ProfileDetailTabId) => void;
  children: ReactNode;
  className?: string;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeTab = tabs.find((tab) => tab.id === value) ?? tabs[0];
  const ActiveIcon = activeTab?.icon ?? UserRound;

  const selectTab = (next: ProfileDetailTabId) => {
    onValueChange(next);
    setSheetOpen(false);
  };

  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next as ProfileDetailTabId)}
      className={cn("w-full min-w-0", className)}
    >
      {/* Mobile · bottom-sheet picker */}
      <div className={cn("sticky top-0 z-20 sm:hidden", TAB_SHELL)}>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          className="flex h-12 w-full items-center gap-2.5 px-3.5 text-left transition-colors active:bg-slate-50 dark:active:bg-white/5"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#CCFBF1]/70 text-[#0F766E] dark:bg-[#0F766E]/25 dark:text-[#5EEAD4]">
            <ActiveIcon className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Section
            </span>
            <span className="block truncate text-[14px] font-semibold text-slate-900 dark:text-zinc-50">
              {activeTab?.label ?? "Profile"}
            </span>
          </span>
          <ChevronUp
            className={cn(
              "h-4 w-4 shrink-0 text-slate-400 transition-transform dark:text-zinc-500",
              sheetOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className={cn(
            "gap-0 rounded-t-2xl border-slate-200/80 bg-white p-0 dark:border-white/10 dark:bg-[#171717]",
            "pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
          )}
        >
          <div className="flex justify-center pt-3">
            <span className="h-1 w-10 rounded-full bg-slate-200 dark:bg-zinc-700" />
          </div>
          <SheetHeader className="space-y-1 px-5 pb-3 pt-3 text-left">
            <SheetTitle className="text-[16px] font-semibold text-slate-900 dark:text-zinc-50">
              Jump to section
            </SheetTitle>
            <SheetDescription className="text-[12.5px] text-slate-500 dark:text-zinc-400">
              Choose a profile section to view
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-1 px-3 pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = tab.id === value;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTab(tab.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                    active
                      ? "bg-[#CCFBF1]/80 text-[#0F766E] dark:bg-[#0F766E]/25 dark:text-[#5EEAD4]"
                      : "text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-white/5",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                      active
                        ? "bg-white/80 text-[#0F766E] dark:bg-white/10 dark:text-[#5EEAD4]"
                        : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-zinc-400",
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1 text-[14px] font-semibold tracking-tight">
                    {tab.label}
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop · horizontal tabs */}
      <div className={cn("sticky top-0 z-20 hidden sm:block", TAB_SHELL)}>
        <TabsList
          className={cn(
            "mobile-scrollbar-none flex h-auto w-full items-stretch justify-start gap-0.5 overflow-x-auto",
            "rounded-2xl border-0 bg-transparent p-1.5 shadow-none",
          )}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "group relative inline-flex min-h-11 min-w-0 flex-1 flex-row items-center justify-center gap-1.5",
                  "rounded-xl border-0 bg-transparent px-2.5 py-2.5 text-[12px] font-medium tracking-tight",
                  "text-slate-400 shadow-none transition-all dark:text-zinc-500",
                  "hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-zinc-200",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "data-[state=active]:bg-slate-50 data-[state=active]:text-slate-900 data-[state=active]:shadow-none dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-zinc-50",
                  "data-[state=active]:after:absolute data-[state=active]:after:inset-x-3 data-[state=active]:after:bottom-1",
                  "data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full data-[state=active]:after:bg-[#0F766E]",
                  "sm:gap-2 sm:px-3 sm:text-[13px]",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-55 transition-opacity group-data-[state=active]:opacity-100 group-data-[state=active]:text-[#0F766E]" />
                <span className="truncate">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}

export function ProfileTabPanel({
  value,
  className,
  children,
}: {
  value: ProfileDetailTabId;
  className?: string;
  children: ReactNode;
}) {
  return (
    <TabsContent value={value} className={cn("mt-4 focus-visible:outline-none", className)}>
      {children}
    </TabsContent>
  );
}
