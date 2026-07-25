import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  sessionCanAccessSettings,
  sessionHasAnyFinance,
  sessionHasPermission,
  useAuth,
} from "@/lib/auth";
import { firstAllowedTenantPath, type PermissionKey } from "@/lib/permissions";

/** Redirect away when the current session lacks a module permission. */
export function useRequirePermission(key: PermissionKey | "finance" | "settings") {
  const { session, hydrated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated || !session) return;
    let allowed = false;
    if (key === "finance") allowed = sessionHasAnyFinance(session);
    else if (key === "settings") allowed = sessionCanAccessSettings(session);
    else allowed = sessionHasPermission(session, key);

    if (!allowed) {
      toast.error("You do not have access to this section");
      navigate({ to: firstAllowedTenantPath(session.permissions), replace: true });
    }
  }, [hydrated, session, key, navigate]);
}
