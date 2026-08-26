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

/**
 * Tear down SW + Cache Storage then reload so the user always gets the
 * latest index.html and hashed assets after a deploy.
 */
export async function hardRefreshApp(opts?: {
  updateServiceWorker?: (reloadPage?: boolean) => Promise<void>;
}): Promise<void> {
  try {
    if (opts?.updateServiceWorker) {
      await opts.updateServiceWorker(true);
      return;
    }
  } catch (error) {
    console.warn("[app-version] SW update failed, falling back to hard reload", error);
  }

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    /* ignore */
  }

  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
  } catch {
    /* ignore */
  }

  const url = new URL(window.location.href);
  url.searchParams.set("_refresh", Date.now().toString());
  window.location.replace(url.toString());
}
