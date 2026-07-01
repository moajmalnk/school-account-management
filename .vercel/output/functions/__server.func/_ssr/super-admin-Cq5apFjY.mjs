import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, O as Outlet, e as useRouterState, L as Link } from "../_libs/tanstack__react-router.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { I as Input } from "./input-FCkkYGai.mjs";
import { D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuLabel, d as DropdownMenuSeparator, e as DropdownMenuItem } from "./dropdown-menu-Drx6j-O7.mjs";
import { u as useAuth } from "./router-7bBAKfDt.mjs";
import { c as Search, S as Settings, B as Bell, a as UserCog, b as LogOut } from "../_libs/lucide-react.mjs";
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
import "./utils-DO8q3wGq.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-dropdown-menu.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-menu.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/tslib.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
const NAV = [
  { key: "overview", label: "Overview", to: "/super-admin/overview" },
  { key: "tenants", label: "Tenants", to: "/super-admin/tenants" },
  { key: "plans", label: "Plans", to: "/super-admin/plans" },
  { key: "audits", label: "Audits", to: "/super-admin/audits" }
];
function deriveActive(pathname) {
  const match = NAV.find((n) => pathname.startsWith(n.to));
  return match?.key ?? "overview";
}
function TopNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = deriveActive(pathname);
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    const name = session?.displayName ?? "Super Admin";
    logout();
    toast.success("Signed out · session cleared", { description: `Goodbye, ${name}` });
    navigate({ to: "/login", replace: true });
  };
  const initials = session?.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "SA";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-30 px-6 pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-[1480px] items-center justify-between gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/super-admin/overview", className: "flex items-center gap-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-10 w-10 place-items-center rounded-2xl bg-black text-sm font-bold text-white", children: "S" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "leading-tight", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[14px] font-semibold text-black", children: "School Accounts" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-medium uppercase tracking-wider text-black/45", children: "Control Plane" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex items-center gap-1 rounded-full border border-[#E5E5E5] bg-white p-1 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-12px_rgba(0,0,0,0.1)]", children: NAV.map((n) => {
      const isActive = active === n.key;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: n.to,
          className: `relative rounded-full px-5 py-2 text-[13px] font-medium transition-all ${isActive ? "bg-black text-white shadow-sm" : "text-black/65 hover:text-black"}`,
          children: n.label
        },
        n.key
      );
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative hidden md:block", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/40" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            placeholder: "Search…",
            className: "h-10 w-56 rounded-full border-[#E5E5E5] bg-white pl-9 text-[13px] placeholder:text-black/35"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => toast("Settings drawer coming online", { description: "Module placeholder · v2.1" }),
          className: "grid h-10 w-10 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 transition-colors hover:bg-black hover:text-white",
          "aria-label": "Settings",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => toast("3 unread platform alerts", {
            description: "Open the notification stream from the bell icon"
          }),
          className: "relative grid h-10 w-10 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 transition-colors hover:bg-black hover:text-white",
          "aria-label": "Notifications",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#C7F33C]" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "ml-1 grid h-10 w-10 place-items-center rounded-full bg-black text-[12px] font-semibold text-white transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
            "aria-label": "Account menu",
            children: initials
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", className: "w-60 rounded-2xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuLabel, { className: "flex flex-col gap-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[12px] font-semibold text-black", children: session?.displayName ?? "Super Admin" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-[10.5px] text-black/55", children: session?.email ?? "superadmin@saas.com" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            DropdownMenuItem,
            {
              onClick: () => toast("Account settings open in v2.2", {
                description: "Profile & security pane queued"
              }),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(UserCog, { className: "mr-2 h-3.5 w-3.5" }),
                " Account settings"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            DropdownMenuItem,
            {
              onClick: handleLogout,
              className: "text-[#B91C1C] focus:text-[#B91C1C]",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "mr-2 h-3.5 w-3.5" }),
                " Logout"
              ]
            }
          )
        ] })
      ] })
    ] })
  ] }) });
}
function SuperAdminLayout() {
  const navigate = useNavigate();
  const {
    session,
    hydrated
  } = useAuth();
  reactExports.useEffect(() => {
    if (!hydrated) return;
    if (!session || session.role !== "super_admin") {
      navigate({
        to: "/login",
        replace: true
      });
    }
  }, [hydrated, session, navigate]);
  if (!hydrated || !session || session.role !== "super_admin") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-[#EAEAEA]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-black/45", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-black/45" }),
      "Validating control-plane session…"
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-[#EAEAEA] text-black", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TopNav, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "mx-auto max-w-[1480px] px-6 pb-24 pt-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) })
  ] });
}
export {
  SuperAdminLayout as component
};
