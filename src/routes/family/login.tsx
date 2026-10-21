import { createFileRoute } from "@tanstack/react-router";

import { FamilyLogin } from "@/components/family/FamilyLogin";

export const Route = createFileRoute("/family/login")({
  component: FamilyLogin,
});
