import { createFileRoute } from "@tanstack/react-router";

import { FamilyNotifications } from "@/components/family/FamilyNotifications";

export const Route = createFileRoute("/family/notifications")({
  component: FamilyNotifications,
});
