import { createFileRoute } from "@tanstack/react-router";

import { FamilyHome } from "@/components/family/FamilyHome";

export const Route = createFileRoute("/family/")({
  component: FamilyHome,
});
