import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { WorkspacePending } from "@/components/workspace/WorkspacePending";

export const Route = createFileRoute("/tenant/")({
  component: TenantIndexRedirect,
  pendingComponent: () => (
    <WorkspacePending label="Opening workspace…" detail="Taking you to the dashboard…" />
  ),
});

function TenantIndexRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/tenant/dashboard", replace: true });
  }, [navigate]);
  return <WorkspacePending label="Opening workspace…" detail="Taking you to the dashboard…" />;
}
