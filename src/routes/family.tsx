import { createFileRoute } from "@tanstack/react-router";

import { FamilyApp } from "@/components/family/FamilyApp";

export const Route = createFileRoute("/family")({
  component: FamilyApp,
});
