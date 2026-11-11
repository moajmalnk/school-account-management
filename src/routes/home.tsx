import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy marketing URL — 301 at the edge; client redirect as a fallback. */
export const Route = createFileRoute("/home")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
