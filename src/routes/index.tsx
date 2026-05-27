import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopNav, type ViewKey } from "@/components/admin/TopNav";
import { OverviewView } from "@/components/admin/OverviewView";
import { TenantsView } from "@/components/admin/TenantsView";
import { PlansView } from "@/components/admin/PlansView";
import { AuditsView } from "@/components/admin/AuditsView";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [view, setView] = useState<ViewKey>("overview");
  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900">
      <TopNav active={view} onChange={setView} />
      <main className="mx-auto max-w-[1480px] px-6 pb-16 pt-6">
        {view === "overview" && <OverviewView />}
        {view === "tenants" && <TenantsView />}
        {view === "plans" && <PlansView />}
        {view === "audits" && <AuditsView />}
      </main>
    </div>
  );
}
