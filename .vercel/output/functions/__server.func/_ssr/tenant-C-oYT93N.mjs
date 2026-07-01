import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, O as Outlet, e as useRouterState, L as Link } from "../_libs/tanstack__react-router.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { u as useAuth } from "./router-7bBAKfDt.mjs";
import { T as TenantStoreProvider } from "./tenant-store-BRNxtkke.mjs";
import { L as LayoutDashboard, U as Users, a as UserCog, W as Wallet, S as Settings, A as ArrowUpRight, b as LogOut } from "../_libs/lucide-react.mjs";
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
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
const NAV = [{
  to: "/tenant/dashboard",
  label: "Dashboard",
  icon: LayoutDashboard
}, {
  to: "/tenant/students",
  label: "Students",
  icon: Users
}, {
  to: "/tenant/staff",
  label: "Staff",
  icon: UserCog
}, {
  to: "/tenant/finance",
  label: "Finance",
  icon: Wallet
}, {
  to: "/tenant/settings",
  label: "Settings",
  icon: Settings
}];
function TenantLayout() {
  const navigate = useNavigate();
  const {
    session,
    hydrated
  } = useAuth();
  reactExports.useEffect(() => {
    if (!hydrated) return;
    if (!session || session.role !== "school_admin") {
      navigate({
        to: "/login",
        replace: true
      });
    }
  }, [hydrated, session, navigate]);
  if (!hydrated || !session || session.role !== "school_admin") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-[#EAEAEA]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-black/45", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-black/45" }),
      "Validating tenant session…"
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(TenantStoreProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-[#EAEAEA] text-black", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-6 p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TenantSidebar, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "min-w-0 flex-1 pb-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) })
  ] }) }) });
}
function TenantSidebar() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname
  });
  const navigate = useNavigate();
  const {
    session,
    logout
  } = useAuth();
  const handleLogout = () => {
    const name = session?.displayName ?? "Tenant Admin";
    logout();
    toast.success("Signed out · session cleared", {
      description: `Goodbye, ${name}`
    });
    navigate({
      to: "/login",
      replace: true
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "sticky top-6 flex h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-[2rem] border border-[#E5E5E5] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-32px_rgba(0,0,0,0.18)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 flex items-center gap-2.5 px-2 pt-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-10 w-10 place-items-center rounded-2xl bg-black text-sm font-bold text-white", children: "SH" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "leading-tight", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[14px] font-semibold text-black", children: session?.tenantName ?? "Silver Hills Global" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-wider text-black/45", children: "Tenant Workspace" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex-1 space-y-1", children: NAV.map((n) => {
      const Icon = n.icon;
      const active = pathname.startsWith(n.to);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: n.to, className: `group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13.5px] font-medium transition-colors ${active ? "bg-[#C7F33C] text-black shadow-sm" : "text-black/70 hover:bg-[#F4F4F5] hover:text-black"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1", children: n.label }),
        active && /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { className: "h-4 w-4", strokeWidth: 2.25 })
      ] }, n.to);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center gap-2 rounded-2xl bg-[#F4F4F5] p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-[12.5px] font-semibold text-black", children: session?.displayName ?? "Tenant Admin" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 truncate font-mono text-[10px] text-black/55", children: session?.email ?? "silverhills@tenant.com" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleLogout, "aria-label": "Logout", className: "grid h-9 w-9 shrink-0 place-items-center rounded-full text-black/65 transition-colors hover:bg-[#FEE2E2] hover:text-[#B91C1C]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-4 w-4" }) })
    ] })
  ] });
}
export {
  TenantLayout as component
};
