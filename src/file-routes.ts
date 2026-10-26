/**
 * Patches FileRoutesByPath for routes the IDE misses while routeTree.gen.ts
 * is @ts-nocheck. Import from router.tsx and from new route modules.
 */
declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/download": {
      id: "/download";
      path: "/download";
      fullPath: "/download";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
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
    "/tenant/academics": {
      id: "/tenant/academics";
      path: "/academics";
      fullPath: "/tenant/academics";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/tenant/parents": {
      id: "/tenant/parents";
      path: "/parents";
      fullPath: "/tenant/parents";
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
    "/family": {
      id: "/family";
      path: "/family";
      fullPath: "/family";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/family/": {
      id: "/family/";
      path: "/";
      fullPath: "/family/";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/family/login": {
      id: "/family/login";
      path: "/login";
      fullPath: "/family/login";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/family/join/$token": {
      id: "/family/join/$token";
      path: "/join/$token";
      fullPath: "/family/join/$token";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/family/academics": {
      id: "/family/academics";
      path: "/academics";
      fullPath: "/family/academics";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/family/attendance": {
      id: "/family/attendance";
      path: "/attendance";
      fullPath: "/family/attendance";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/family/fees": {
      id: "/family/fees";
      path: "/fees";
      fullPath: "/family/fees";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/family/leave": {
      id: "/family/leave";
      path: "/leave";
      fullPath: "/family/leave";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/family/notifications": {
      id: "/family/notifications";
      path: "/notifications";
      fullPath: "/family/notifications";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
    "/family/settings": {
      id: "/family/settings";
      path: "/settings";
      fullPath: "/family/settings";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
  }
}

export {};
