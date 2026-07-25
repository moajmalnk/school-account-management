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
      <div className="sticky top-0 z-20 -mx-1 px-1 pb-1 backdrop-blur-md supports-[backdrop-filter]:bg-white/55">
        <TabsList className="mobile-scrollbar-none flex h-auto w-full items-stretch justify-start gap-1 overflow-x-auto rounded-2xl border border-slate-100/80 bg-white/90 p-1.5 shadow-sm shadow-slate-200/40">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "inline-flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2.5 py-2 text-[11px] font-semibold text-slate-500 shadow-none",
                  "data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-sm",
                  "sm:flex-row sm:gap-2 sm:px-3 sm:text-[12.5px]",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
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
