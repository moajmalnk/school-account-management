/**
 * Ensures TanStack Router IDE types include public routes even when
 * routeTree.gen.ts (@ts-nocheck) lags in the language service.
 */
declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/privacy": {
      id: "/privacy";
      path: "/privacy";
      fullPath: "/privacy";
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
  }
}

export {};
