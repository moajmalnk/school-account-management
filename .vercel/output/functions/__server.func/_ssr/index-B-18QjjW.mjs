import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { u as useAuth, M as MOCK_CREDENTIALS } from "./router-7bBAKfDt.mjs";
import "../_libs/sonner.mjs";
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
function IndexRedirect() {
  const navigate = useNavigate();
  const {
    session,
    hydrated
  } = useAuth();
  reactExports.useEffect(() => {
    if (!hydrated) return;
    if (session) {
      navigate({
        to: MOCK_CREDENTIALS[session.role].redirect,
        replace: true
      });
    } else {
      navigate({
        to: "/login",
        replace: true
      });
    }
  }, [hydrated, session, navigate]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-[#EAEAEA]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-black/45", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-black/45" }),
    "Routing session…"
  ] }) });
}
export {
  IndexRedirect as component
};
