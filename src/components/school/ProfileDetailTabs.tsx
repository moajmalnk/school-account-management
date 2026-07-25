import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { FileText, GraduationCap, UserRound, Wallet } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type ProfileDetailTabId = "profile" | "professional" | "documents" | "payments";

export type ProfileDetailTab = {
  id: ProfileDetailTabId;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
};

export const STUDENT_PROFILE_TABS: ProfileDetailTab[] = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "professional", label: "Academic", shortLabel: "Academic", icon: GraduationCap },
  { id: "documents", label: "Documents", shortLabel: "Docs", icon: FileText },
  { id: "payments", label: "Payments", icon: Wallet },
];

export const STAFF_PROFILE_TABS: ProfileDetailTab[] = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "professional", label: "Professional", shortLabel: "Work", icon: GraduationCap },
  { id: "documents", label: "Documents", shortLabel: "Docs", icon: FileText },
  { id: "payments", label: "Payments", icon: Wallet },
];

const TAB_SHELL =
  "rounded-2xl border border-slate-200/70 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]";

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
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next as ProfileDetailTabId)}
      className={cn("w-full min-w-0", className)}
    >
      <div className={cn("sticky top-0 z-20", TAB_SHELL)}>
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
                  "text-slate-400 shadow-none transition-all",
                  "hover:bg-slate-50 hover:text-slate-700",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "data-[state=active]:bg-slate-50 data-[state=active]:text-slate-900 data-[state=active]:shadow-none",
                  "data-[state=active]:after:absolute data-[state=active]:after:inset-x-3 data-[state=active]:after:bottom-1",
                  "data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full data-[state=active]:after:bg-[#2563EB]",
                  "sm:gap-2 sm:px-3 sm:text-[13px]",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-55 transition-opacity group-data-[state=active]:opacity-100 group-data-[state=active]:text-[#2563EB]" />
                <span className="truncate sm:hidden">{tab.shortLabel ?? tab.label}</span>
                <span className="hidden truncate sm:inline">{tab.label}</span>
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
