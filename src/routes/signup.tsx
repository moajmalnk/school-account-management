import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/signup")({
  component: SignupLayout,
});

function SignupLayout() {
  useEffect(() => {
    document.title = "Feezo · Start 14-day trial";
  }, []);

  return <Outlet />;
}
