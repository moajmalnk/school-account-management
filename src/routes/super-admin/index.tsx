import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/super-admin/")({
  component: SuperAdminIndexRedirect,
});

function SuperAdminIndexRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/super-admin/overview", replace: true });
  }, [navigate]);
  return null;
}
