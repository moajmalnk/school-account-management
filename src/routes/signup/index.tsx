import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/signup/")({
  beforeLoad: () => {
    throw redirect({
      to: "/signup/$step",
      params: { step: "school" },
      replace: true,
    } as never);
  },
});
