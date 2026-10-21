import { createFileRoute } from "@tanstack/react-router";

import { FamilyLeave } from "@/components/family/FamilyLeave";

export const Route = createFileRoute("/family/leave")({
  component: FamilyLeave,
});
