import { Q as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, b as createFileRoute, l as lazyRouteComponent } from "../_libs/tanstack__react-router.mjs";
import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { T as Toaster$1 } from "../_libs/sonner.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Toaster$1,
    {
      theme: "light",
      className: "toaster group",
      toastOptions: {
        unstyled: false,
        classNames: {
          toast: "group toast pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3.5 text-[13px] font-medium text-black shadow-[0_24px_60px_-24px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.04)]",
          title: "text-[13px] font-semibold leading-tight tracking-tight",
          description: "mt-0.5 text-[12px] font-normal leading-snug text-black/55",
          actionButton: "group-[.toast]:rounded-full group-[.toast]:bg-black group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:text-[11px] group-[.toast]:font-semibold group-[.toast]:text-white",
          cancelButton: "group-[.toast]:rounded-full group-[.toast]:border group-[.toast]:border-black/15 group-[.toast]:bg-white group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:text-[11px] group-[.toast]:font-semibold group-[.toast]:text-black",
          closeButton: "group-[.toast]:left-auto group-[.toast]:right-2 group-[.toast]:top-2 group-[.toast]:size-6 group-[.toast]:rounded-full group-[.toast]:border-black/10 group-[.toast]:bg-white group-[.toast]:text-black/55 group-[.toast]:opacity-0 group-[.toast]:transition-opacity group-hover/toast:group-[.toast]:opacity-100",
          icon: "shrink-0",
          success: "group-[.toaster]:border-emerald-200/80",
          error: "group-[.toaster]:border-rose-200/80",
          warning: "group-[.toaster]:border-amber-200/80",
          info: "group-[.toaster]:border-sky-200/80"
        }
      },
      style: {
        "--width": "380px",
        "--border-radius": "16px",
        "--font-family": "Inter, ui-sans-serif, system-ui, sans-serif"
      },
      ...props
    }
  );
};
const STORAGE_KEY = "school-accounts/session/v1";
const MOCK_CREDENTIALS = {
  super_admin: {
    email: "superadmin@saas.com",
    password: "admin2026",
    displayName: "Super Admin",
    redirect: "/super-admin/overview"
  },
  school_admin: {
    email: "silverhills@tenant.com",
    password: "school2026",
    displayName: "Silver Hills Admin",
    tenantName: "Silver Hills Global",
    redirect: "/tenant/dashboard"
  }
};
const INVALID_CREDENTIALS_MESSAGE = "Invalid credentials matching selected authentication tier. Please review inputs.";
function readSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.role === "super_admin" || parsed.role === "school_admin") && parsed.email) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
function writeSession(session) {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
  }
}
const AuthContext = reactExports.createContext(null);
function AuthProvider({ children }) {
  const [session, setSession] = reactExports.useState(null);
  const [hydrated, setHydrated] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setSession(readSession());
    setHydrated(true);
  }, []);
  const login = reactExports.useCallback((role, email, password) => {
    const expected = MOCK_CREDENTIALS[role];
    const normalizedEmail = email.trim().toLowerCase();
    if (!expected || normalizedEmail !== expected.email.toLowerCase() || password !== expected.password) {
      return { ok: false, error: INVALID_CREDENTIALS_MESSAGE };
    }
    const next = {
      role,
      email: expected.email,
      displayName: expected.displayName,
      tenantName: expected.tenantName,
      issuedAt: Date.now()
    };
    writeSession(next);
    setSession(next);
    return { ok: true, redirect: expected.redirect, session: next };
  }, []);
  const logout = reactExports.useCallback(() => {
    writeSession(null);
    setSession(null);
  }, []);
  const value = reactExports.useMemo(
    () => ({ session, hydrated, login, logout }),
    [session, hydrated, login, logout]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthContext.Provider, { value, children });
}
function useAuth() {
  const ctx = reactExports.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
const appCss = "/assets/styles-o0OYr6oQ.css";
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-[#EAEAEA] px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-black", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold text-black", children: "Page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-black/55", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/85",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-[#EAEAEA] px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight text-black", children: "This page didn't load" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-black/55", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/85",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-full border border-[#E5E5E5] bg-white px-5 py-2.5 text-sm font-medium text-black/75 transition-colors hover:bg-[#F4F4F5]",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$f = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "School Admin Console" },
      {
        name: "description",
        content: "School Admin Console is a multi-tenant SaaS platform for managing educational institutions."
      },
      { property: "og:title", content: "School Admin Console" },
      {
        property: "og:description",
        content: "School Admin Console is a multi-tenant SaaS platform for managing educational institutions."
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "School Admin Console" },
      {
        name: "twitter:description",
        content: "School Admin Console is a multi-tenant SaaS platform for managing educational institutions."
      }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$f.useRouteContext();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AuthProvider, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Toaster,
      {
        position: "bottom-center",
        richColors: true,
        closeButton: true,
        expand: true,
        offset: 28,
        gap: 12,
        visibleToasts: 4,
        duration: 4500
      }
    )
  ] }) });
}
const $$splitComponentImporter$e = () => import("./tenant-C-oYT93N.mjs");
const Route$e = createFileRoute("/tenant")({
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./super-admin-Cq5apFjY.mjs");
const Route$d = createFileRoute("/super-admin")({
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./login-BgzkNgep.mjs");
const Route$c = createFileRoute("/login")({
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./index-B-18QjjW.mjs");
const Route$b = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./index-BJWLeUxe.mjs");
const Route$a = createFileRoute("/tenant/")({
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./index-hYQoJF_1.mjs");
const Route$9 = createFileRoute("/super-admin/")({
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./students-Cpgfk_bR.mjs");
const Route$8 = createFileRoute("/tenant/students")({
  validateSearch: (search) => ({
    id: typeof search.id === "string" && search.id.length > 0 ? search.id : void 0
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./staff-DZuIgZgj.mjs");
const Route$7 = createFileRoute("/tenant/staff")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./settings-Bt1HrW6v.mjs");
const Route$6 = createFileRoute("/tenant/settings")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./finance-C-OFdbaG.mjs");
const Route$5 = createFileRoute("/tenant/finance")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./dashboard-t8pVenIN.mjs");
const Route$4 = createFileRoute("/tenant/dashboard")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./tenants-DnWVZn1O.mjs");
const Route$3 = createFileRoute("/super-admin/tenants")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./plans-BOeswsvS.mjs");
const Route$2 = createFileRoute("/super-admin/plans")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./overview-CIp6tAy-.mjs");
const Route$1 = createFileRoute("/super-admin/overview")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./audits-Cnieh59E.mjs");
const Route = createFileRoute("/super-admin/audits")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const TenantRoute = Route$e.update({
  id: "/tenant",
  path: "/tenant",
  getParentRoute: () => Route$f
});
const SuperAdminRoute = Route$d.update({
  id: "/super-admin",
  path: "/super-admin",
  getParentRoute: () => Route$f
});
const LoginRoute = Route$c.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$f
});
const IndexRoute = Route$b.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$f
});
const TenantIndexRoute = Route$a.update({
  id: "/",
  path: "/",
  getParentRoute: () => TenantRoute
});
const SuperAdminIndexRoute = Route$9.update({
  id: "/",
  path: "/",
  getParentRoute: () => SuperAdminRoute
});
const TenantStudentsRoute = Route$8.update({
  id: "/students",
  path: "/students",
  getParentRoute: () => TenantRoute
});
const TenantStaffRoute = Route$7.update({
  id: "/staff",
  path: "/staff",
  getParentRoute: () => TenantRoute
});
const TenantSettingsRoute = Route$6.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => TenantRoute
});
const TenantFinanceRoute = Route$5.update({
  id: "/finance",
  path: "/finance",
  getParentRoute: () => TenantRoute
});
const TenantDashboardRoute = Route$4.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => TenantRoute
});
const SuperAdminTenantsRoute = Route$3.update({
  id: "/tenants",
  path: "/tenants",
  getParentRoute: () => SuperAdminRoute
});
const SuperAdminPlansRoute = Route$2.update({
  id: "/plans",
  path: "/plans",
  getParentRoute: () => SuperAdminRoute
});
const SuperAdminOverviewRoute = Route$1.update({
  id: "/overview",
  path: "/overview",
  getParentRoute: () => SuperAdminRoute
});
const SuperAdminAuditsRoute = Route.update({
  id: "/audits",
  path: "/audits",
  getParentRoute: () => SuperAdminRoute
});
const SuperAdminRouteChildren = {
  SuperAdminAuditsRoute,
  SuperAdminOverviewRoute,
  SuperAdminPlansRoute,
  SuperAdminTenantsRoute,
  SuperAdminIndexRoute
};
const SuperAdminRouteWithChildren = SuperAdminRoute._addFileChildren(
  SuperAdminRouteChildren
);
const TenantRouteChildren = {
  TenantDashboardRoute,
  TenantFinanceRoute,
  TenantSettingsRoute,
  TenantStaffRoute,
  TenantStudentsRoute,
  TenantIndexRoute
};
const TenantRouteWithChildren = TenantRoute._addFileChildren(TenantRouteChildren);
const rootRouteChildren = {
  IndexRoute,
  LoginRoute,
  SuperAdminRoute: SuperAdminRouteWithChildren,
  TenantRoute: TenantRouteWithChildren
};
const routeTree = Route$f._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  INVALID_CREDENTIALS_MESSAGE as I,
  MOCK_CREDENTIALS as M,
  router as r,
  useAuth as u
};
