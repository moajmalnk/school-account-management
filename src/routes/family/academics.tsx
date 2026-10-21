import { createFileRoute } from "@tanstack/react-router";

import { FamilyAcademics } from "@/components/family/FamilyAcademics";

export const Route = createFileRoute("/family/academics")({
  component: FamilyAcademics,
});
