import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/tenant/")({
  component: TenantIndexRedirect,
});

function TenantIndexRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/tenant/dashboard", replace: true });
  }, [navigate]);
  return null;
}
