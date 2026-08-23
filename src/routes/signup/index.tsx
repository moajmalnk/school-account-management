import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/signup/")({
  beforeLoad: () => {
    throw redirect({ href: "/signup/school", replace: true });
  },
});
