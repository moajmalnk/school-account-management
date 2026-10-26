import { createFileRoute, redirect } from "@tanstack/react-router";

/** Parent login lives on the global `/login` page (email or phone). */
export const Route = createFileRoute("/family/login")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
