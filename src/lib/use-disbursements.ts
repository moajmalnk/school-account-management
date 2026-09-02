import { useCallback, useEffect, useState } from "react";
import { apiListDisbursements, type DisbursementPayload } from "@/lib/api/records";
import { useTenantStore } from "@/lib/tenant-store";

const memoryCache = new Map<string, DisbursementPayload[]>();
const CACHE_PREFIX = "feezo:disbursements:";

function readDisbursementsCache(scope: string): DisbursementPayload[] | null {
  const cached = memoryCache.get(scope);
  if (cached) return cached;
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${scope}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DisbursementPayload[];
    if (!Array.isArray(parsed)) return null;
    memoryCache.set(scope, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeDisbursementsCache(scope: string, rows: DisbursementPayload[]) {
  memoryCache.set(scope, rows);
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(`${CACHE_PREFIX}${scope}`, JSON.stringify(rows));
  } catch {
    // quota or private mode — memory cache still helps within the session
  }
}

const inflightFetches = new Map<string, Promise<DisbursementPayload[]>>();

async function fetchDisbursementsForScope(scope: string): Promise<DisbursementPayload[]> {
  const pending = inflightFetches.get(scope);
  if (pending) return pending;

  const request = apiListDisbursements()
    .then((rows) => {
      const next = Array.isArray(rows) ? rows : [];
      writeDisbursementsCache(scope, next);
      return next;
    })
    .finally(() => {
      inflightFetches.delete(scope);
    });

  inflightFetches.set(scope, request);
  return request;
}

/**
 * Load this campus's disbursements (expenses). Uses session cache so tab navigation
 * and remounts show the last known data immediately, then refresh in the background.
 */
export function useDisbursements(scopeKey?: string, enabled = true) {
  const { activeBranchId, hydrated } = useTenantStore();
  const scope = `${scopeKey ?? ""}|${activeBranchId}`;
  const on = enabled && hydrated;

  const [disbursements, setDisbursements] = useState<DisbursementPayload[]>(
    () => readDisbursementsCache(scope) ?? [],
  );
  const [loaded, setLoaded] = useState(() => readDisbursementsCache(scope) !== null);

  const reload = useCallback(async () => {
    const hadData = readDisbursementsCache(scope) !== null;
    if (!hadData) setLoaded(false);
    try {
      const next = await fetchDisbursementsForScope(scope);
      setDisbursements(next);
    } catch {
      if (!hadData) setDisbursements([]);
    } finally {
      setLoaded(true);
    }
  }, [scope]);

  useEffect(() => {
    if (!on) return;

    let cancelled = false;
    const cached = readDisbursementsCache(scope);
    if (cached) {
      setDisbursements(cached);
      setLoaded(true);
    } else {
      setLoaded(false);
    }

    void fetchDisbursementsForScope(scope)
      .then((next) => {
        if (cancelled) return;
        setDisbursements(next);
      })
      .catch(() => {
        if (!cancelled && !cached) setDisbursements([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [scope, on]);

  return { disbursements, setDisbursements, loaded, reload };
}
