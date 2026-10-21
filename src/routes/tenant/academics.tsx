import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/tenant/academics")({
  component: AcademicsRedirect,
});

function AcademicsRedirect() {
  return <Navigate to="/tenant/settings" search={{ tab: "academics" }} replace />;
}
