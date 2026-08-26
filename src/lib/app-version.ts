/** Build id injected at compile time (see vite.config.ts). */
export const APP_BUILD_ID =
  typeof __APP_BUILD_ID__ !== "undefined" ? __APP_BUILD_ID__ : "dev";

/** version.json is only emitted on production builds — skip polling in Vite dev. */
export const isAppVersionCheckEnabled = import.meta.env.PROD && APP_BUILD_ID !== "dev";

export type RemoteAppVersion = {
  buildId: string;
  builtAt?: string;
};

const VERSION_URL = "/version.json";
const LAST_BUILD_KEY = "school-accounts/app-build-id/v1";
const UPDATE_COOLDOWN_KEY = "school-accounts/app-update-cooldown/v1";
const TENANT_STORE_PREFIX = "school-accounts/tenant-store/";
/** After an Update now, ignore version prompts briefly to avoid blink loops. */
const UPDATE_COOLDOWN_MS = 3 * 60_000;

/** Fetch the deployed build id (never from HTTP cache). */
export async function fetchRemoteAppVersion(
  signal?: AbortSignal,
): Promise<RemoteAppVersion | null> {
  if (!isAppVersionCheckEnabled) return null;

  try {
    const res = await fetch(`${VERSION_URL}?_=${Date.now()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<RemoteAppVersion>;
    if (!data.buildId || typeof data.buildId !== "string") return null;
    return { buildId: data.buildId, builtAt: data.builtAt };
  } catch {
    return null;
  }
}

export function isNewerBuild(remote: RemoteAppVersion | null): boolean {
  if (!isAppVersionCheckEnabled) return false;
  if (!remote?.buildId) return false;
  return remote.buildId !== APP_BUILD_ID;
}

export function isUpdatePromptOnCooldown(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(UPDATE_COOLDOWN_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until)) return false;
    if (Date.now() >= until) {
      window.sessionStorage.removeItem(UPDATE_COOLDOWN_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function markUpdateCooldown(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      UPDATE_COOLDOWN_KEY,
      String(Date.now() + UPDATE_COOLDOWN_MS),
    );
  } catch {
    /* ignore */
  }
}

/** Drop cached tenant snapshots so a new deploy rehydrates from the API. */
function clearTenantStoreSnapshots(): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(TENANT_STORE_PREFIX)) keys.push(key);
    }
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Call once at boot. When the installed JS build changes (mobile PWA finally
 * picks up a deploy), wipe stale localStorage ledgers so laptop/mobile match.
 */
export function syncClientStateToCurrentBuild(): void {
  if (typeof window === "undefined") return;
  if (!isAppVersionCheckEnabled) return;

  try {
    const previous = window.localStorage.getItem(LAST_BUILD_KEY);
    if (previous && previous !== APP_BUILD_ID) {
      clearTenantStoreSnapshots();
    }
    window.localStorage.setItem(LAST_BUILD_KEY, APP_BUILD_ID);
  } catch {
    /* ignore */
  }

  // Strip one-shot refresh query so reloads don't keep appending noise.
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has("_refresh")) {
      url.searchParams.delete("_refresh");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Tear down SW + Cache Storage then reload so the user always gets the
 * latest index.html and hashed assets after a deploy.
 */
export async function hardRefreshApp(opts?: {
  updateServiceWorker?: (reloadPage?: boolean) => Promise<void>;
}): Promise<void> {
  markUpdateCooldown();

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    /* ignore */
  }

  clearTenantStoreSnapshots();

  let swReloading = false;
  try {
    if (opts?.updateServiceWorker) {
      swReloading = true;
      await opts.updateServiceWorker(true);
      // vite-plugin-pwa reloads the page; give it a moment before falling back.
      await new Promise((r) => window.setTimeout(r, 1200));
    }
  } catch (error) {
    swReloading = false;
    console.warn("[app-version] SW update failed, falling back to hard reload", error);
  }

  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
  } catch {
    /* ignore */
  }

  // If SW already navigated away, don't force another reload (blink loop).
  if (swReloading && document.visibilityState === "hidden") return;

  const url = new URL(window.location.href);
  url.searchParams.set("_refresh", Date.now().toString());
  window.location.replace(url.toString());
}
