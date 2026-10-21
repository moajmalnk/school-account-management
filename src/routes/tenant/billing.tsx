import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/tenant/billing")({
  component: TenantBillingRedirect,
});

/** Older links and bookmarks open Subscription inside Settings. */
function TenantBillingRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({
      to: "/tenant/settings",
      search: { tab: "subscription" },
      replace: true,
    });
  }, [navigate]);

  return null;
}
