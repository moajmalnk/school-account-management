import { createFileRoute } from "@tanstack/react-router";

import { AuditsView } from "@/components/admin/AuditsView";

export const Route = createFileRoute("/super-admin/audits")({
  component: AuditsView,
});
