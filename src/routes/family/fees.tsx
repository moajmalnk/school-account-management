import { createFileRoute } from "@tanstack/react-router";

import { FamilyFees } from "@/components/family/FamilyFees";

export const Route = createFileRoute("/family/fees")({
  component: FamilyFees,
});
