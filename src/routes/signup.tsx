import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { applyNoindex } from "@/lib/seo/public-pages";

export const Route = createFileRoute("/signup")({
  component: SignupLayout,
});

function SignupLayout() {
  useEffect(() => {
    document.title = "Feezo · Start 14-day trial";
    applyNoindex();
  }, []);

  return <Outlet />;
}
