import { createFileRoute } from "@tanstack/react-router";

import { OverviewView } from "@/components/admin/OverviewView";

export const Route = createFileRoute("/super-admin/overview")({
  component: OverviewView,
});
