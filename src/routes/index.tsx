import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopNav, type ViewKey } from "@/components/admin/TopNav";
import { OverviewView } from "@/components/admin/OverviewView";
import { TenantsView } from "@/components/admin/TenantsView";
import { PlansView } from "@/components/admin/PlansView";
import { AuditsView } from "@/components/admin/AuditsView";
import { RoleSwitcher, type Role } from "@/components/RoleSwitcher";
import { SchoolAdminWorkspace } from "@/components/school/SchoolAdminWorkspace";
import { StaffWorkspace } from "@/components/staff/StaffWorkspace";
import { StudentWorkspace } from "@/components/student/StudentWorkspace";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [view, setView] = useState<ViewKey>("overview");
  const [role, setRole] = useState<Role>("super_admin");
  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900">
      {role === "super_admin" && (
        <>
          <TopNav active={view} onChange={setView} />
          <main className="mx-auto max-w-[1480px] px-6 pb-24 pt-6">
            {view === "overview" && <OverviewView />}
            {view === "tenants" && <TenantsView />}
            {view === "plans" && <PlansView />}
            {view === "audits" && <AuditsView />}
          </main>
        </>
      )}
      {role === "school_admin" && <SchoolAdminWorkspace />}
      {role === "staff" && <StaffWorkspace />}
      {role === "student" && <StudentWorkspace />}
      <RoleSwitcher role={role} onChange={setRole} />
    </div>
  );
}
