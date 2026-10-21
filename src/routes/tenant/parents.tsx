import { createFileRoute, Navigate } from "@tanstack/react-router";

import "@/file-routes";

export const Route = createFileRoute("/tenant/parents")({
  component: ParentsRedirect,
});

function ParentsRedirect() {
  return <Navigate to="/tenant/students" replace />;
}
