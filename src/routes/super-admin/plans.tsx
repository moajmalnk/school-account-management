import { createFileRoute } from "@tanstack/react-router";

import { PlansView } from "@/components/admin/PlansView";

export const Route = createFileRoute("/super-admin/plans")({
  component: PlansView,
});
