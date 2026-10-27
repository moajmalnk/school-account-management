import { createFileRoute } from "@tanstack/react-router";

import "@/file-routes";

export const Route = createFileRoute("/super-admin/support/settlement-setup")({
  component: () => null,
});
