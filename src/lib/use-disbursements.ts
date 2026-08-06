import { useCallback, useEffect, useState } from "react";
import {
  apiListDisbursements,
  type DisbursementPayload,
} from "@/lib/api/records";

/**
 * Load this tenant's disbursements (expenses). Empty array when none — never seed mock rows.
 * Pass `enabled: false` while the tenant store is still hydrating so the dashboard
 * stays on its skeleton instead of flashing ₹0.
 */
export function useDisbursements(scopeKey?: string, enabled = true) {
  const [disbursements, setDisbursements] = useState<DisbursementPayload[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    setLoaded(false);
    try {
      const rows = await apiListDisbursements();
      setDisbursements(Array.isArray(rows) ? rows : []);
    } catch {
      setDisbursements([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoaded(false);
      setDisbursements([]);
      return;
    }

    let cancelled = false;
    setLoaded(false);
    setDisbursements([]);
    void (async () => {
      try {
        const rows = await apiListDisbursements();
        if (!cancelled) setDisbursements(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setDisbursements([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scopeKey, enabled]);

  return { disbursements, setDisbursements, loaded, reload };
}
