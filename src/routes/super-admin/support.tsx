import { createFileRoute, Outlet } from "@tanstack/react-router";

import { SupportDeskView } from "@/components/admin/SupportDeskView";

export const Route = createFileRoute("/super-admin/support")({
  component: SupportLayout,
});

function SupportLayout() {
  return (
    <>
      <SupportDeskView />
      <Outlet />
    </>
  );
}
