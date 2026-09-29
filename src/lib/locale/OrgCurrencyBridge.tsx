import { useLayoutEffect, useRef } from "react";

import { isTenantWorkspaceSession, useAuth } from "@/lib/auth";
import { bindOrgCurrencyTenant, clearOrgCurrency, setMoneyMode } from "@/lib/money";

/**
 * Keeps in-app money in the school's base currency, never the visitor's geo/manual pick.
 * The org currency itself is fed by tenant-sync (school.php / bundle.php) and Settings saves.
 */
export function OrgCurrencyBridge() {
  const { session } = useAuth();
  const inWorkspace = isTenantWorkspaceSession(session);
  const tenantId = inWorkspace ? (session?.tenantId ?? "") : "";
  const hadSession = useRef(Boolean(session));

  useLayoutEffect(() => {
    if (inWorkspace) {
      if (tenantId) bindOrgCurrencyTenant(tenantId);
      setMoneyMode("org");
    } else {
      setMoneyMode("visitor");
    }
  }, [inWorkspace, tenantId]);

  useLayoutEffect(() => {
    if (hadSession.current && !session) clearOrgCurrency();
    hadSession.current = Boolean(session);
  }, [session]);

  return null;
}
