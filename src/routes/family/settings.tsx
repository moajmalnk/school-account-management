import { createFileRoute } from "@tanstack/react-router";

import { FamilySettings } from "@/components/family/FamilySettings";

export const Route = createFileRoute("/family/settings")({
  component: FamilySettings,
});
