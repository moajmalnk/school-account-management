/**
 * Patches FileRoutesByPath for routes the IDE misses while routeTree.gen.ts
 * is @ts-nocheck. Import from router.tsx and from new route modules.
 */
declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/terms": {
      id: "/terms";
      path: "/terms";
      fullPath: "/terms";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/privacy": {
      id: "/privacy";
      path: "/privacy";
      fullPath: "/privacy";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/refund-policy": {
      id: "/refund-policy";
      path: "/refund-policy";
      fullPath: "/refund-policy";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/data-deletion": {
      id: "/data-deletion";
      path: "/data-deletion";
      fullPath: "/data-deletion";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/signup": {
      id: "/signup";
      path: "/signup";
      fullPath: "/signup";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/signup/": {
      id: "/signup/";
      path: "/";
      fullPath: "/signup/";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/signup/$step": {
      id: "/signup/$step";
      path: "/$step";
      fullPath: "/signup/$step";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/tenant/ai": {
      id: "/tenant/ai";
      path: "/ai";
      fullPath: "/tenant/ai";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/tenant/attendance": {
      id: "/tenant/attendance";
      path: "/attendance";
      fullPath: "/tenant/attendance";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/super-admin/support/auto-reply": {
      id: "/super-admin/support/auto-reply";
      path: "/auto-reply";
      fullPath: "/super-admin/support/auto-reply";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/staff/collect/$token": {
      id: "/staff/collect/$token";
      path: "/staff/collect/$token";
      fullPath: "/staff/collect/$token";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
  }
}

export {};
