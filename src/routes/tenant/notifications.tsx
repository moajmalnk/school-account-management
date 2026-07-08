import { createFileRoute } from "@tanstack/react-router";

import { NotificationsPage } from "@/components/school/NotificationsPage";

export const Route = createFileRoute("/tenant/notifications")({
  component: NotificationsPage,
});
