import { createFileRoute } from "@tanstack/react-router";

import { FamilyAttendance } from "@/components/family/FamilyAttendance";

export const Route = createFileRoute("/family/attendance")({
  component: FamilyAttendance,
});
