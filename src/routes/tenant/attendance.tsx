import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AttendanceWorkspace } from "@/components/school/attendance/AttendanceWorkspace";
import { useRequirePermission } from "@/hooks/useRequirePermission";
import { attendanceTabFromSearch, isAttendanceTab, type AttendanceTab } from "@/lib/attendance-tabs";
import { useAuth } from "@/lib/auth";
import { firstAllowedTenantPath, planAllowsStudentAttendance } from "@/lib/permissions";
import "@/file-routes";

type AttendanceSearch = {
  tab?: AttendanceTab;
};

export const Route = createFileRoute("/tenant/attendance")({
  validateSearch: (search: Record<string, unknown>): AttendanceSearch => ({
    tab: isAttendanceTab(search.tab) ? search.tab : undefined,
  }),
  component: AttendanceRoute,
});

function AttendanceRoute() {
  useRequirePermission("students");
  const { session, hydrated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated || !session) return;
    if (!planAllowsStudentAttendance(session.planFlags)) {
      toast.error("Student attendance is not on your plan");
      navigate({ to: firstAllowedTenantPath(session.permissions), replace: true });
    }
  }, [hydrated, session, navigate]);

  if (!planAllowsStudentAttendance(session?.planFlags)) return null;
  return <AttendanceWorkspace />;
}

export { attendanceTabFromSearch };
