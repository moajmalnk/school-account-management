import { createFileRoute } from "@tanstack/react-router";

import { FamilyJoin } from "@/components/family/FamilyJoin";

export const Route = createFileRoute("/family/join/$token")({
  component: JoinRoute,
});

function JoinRoute() {
  const { token } = Route.useParams();
  return <FamilyJoin token={token} />;
}
