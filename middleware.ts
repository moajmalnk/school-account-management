/**
 * Serve a real HTTP 404 for unknown paths while keeping SPA routes on index.html.
 * Prerendered pages (/ , /contact , /download) are left to the filesystem.
 *
 * Uses the Edge passthrough header directly so we don't depend on @vercel/edge types.
 */

const PRERENDERED = new Set(["/", "/contact", "/download"]);

const SPA_PREFIXES = [
  "/login",
  "/signup",
  "/tenant",
  "/super-admin",
  "/family",
  "/forgot-password",
  "/reset-password",
  "/impersonate",
  "/privacy",
  "/terms",
  "/refund-policy",
  "/data-deletion",
  "/staff",
  "/parent",
  "/home",
] as const;

function isSpaPath(pathname: string): boolean {
  return SPA_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function hasFileExtension(pathname: string): boolean {
  const last = pathname.split("/").pop() ?? "";
  return last.includes(".");
}

/** Continue to Vercel filesystem / rewrites (same as `next()` from `@vercel/edge`). */
function passthrough(): Response {
  return new Response(null, {
    headers: { "x-middleware-next": "1" },
  });
}

export const config = {
  matcher: ["/((?!assets/|og/|home/|api/|sw\\.js|workbox-|.*\\..*).*)"],
};

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;

  if (hasFileExtension(pathname) || PRERENDERED.has(pathname) || isSpaPath(pathname)) {
    return passthrough();
  }

  const notFoundUrl = new URL("/not-found.html", url.origin);
  const page = await fetch(notFoundUrl);
  return new Response(page.body, {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-cache, no-store, must-revalidate",
    },
  });
}
