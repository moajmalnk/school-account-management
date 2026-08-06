import { useCallback, useEffect, useState } from "react";
import {
  apiListDisbursements,
  type DisbursementPayload,
} from "@/lib/api/records";

/** Load this tenant's disbursements (expenses). Empty array when none — never seed mock rows. */
export function useDisbursements() {
  const [disbursements, setDisbursements] = useState<DisbursementPayload[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
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
    let cancelled = false;
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
  }, []);

  return { disbursements, setDisbursements, loaded, reload };
}
