import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { WorkspaceOpeningScreen } from "@/components/school/TenantDirectorySkeleton";

export const Route = createFileRoute("/tenant/")({
  component: TenantIndexRedirect,
  pendingComponent: () => (
    <WorkspaceOpeningScreen label="Opening workspace" detail="Taking you to the dashboard…" />
  ),
});

function TenantIndexRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/tenant/dashboard", replace: true });
  }, [navigate]);
  return (
    <WorkspaceOpeningScreen label="Opening workspace" detail="Taking you to the dashboard…" />
  );
}
