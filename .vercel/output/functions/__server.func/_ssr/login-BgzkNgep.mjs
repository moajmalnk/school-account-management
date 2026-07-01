import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { L as Label } from "./label-37DVo-jK.mjs";
import { O as OrganicCard } from "./organic-card-j42pCYkc.mjs";
import { u as useAuth, M as MOCK_CREDENTIALS, I as INVALID_CREDENTIALS_MESSAGE } from "./router-7bBAKfDt.mjs";
import { f as ShieldCheck, g as Building2, h as CircleAlert, E as EyeOff, i as Eye, j as WandSparkles } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "./utils-DO8q3wGq.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
const TIERS = [{
  key: "super_admin",
  label: "Super Admin",
  icon: ShieldCheck,
  placeholderEmail: MOCK_CREDENTIALS.super_admin.email
}, {
  key: "school_admin",
  label: "School Admin",
  icon: Building2,
  placeholderEmail: MOCK_CREDENTIALS.school_admin.email
}];
function LoginPage() {
  const navigate = useNavigate();
  const {
    session,
    hydrated,
    login
  } = useAuth();
  const [tier, setTier] = reactExports.useState("super_admin");
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [showPw, setShowPw] = reactExports.useState(false);
  const [bannerError, setBannerError] = reactExports.useState(false);
  const [fieldErrors, setFieldErrors] = reactExports.useState({});
  const [submitting, setSubmitting] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (hydrated && session) {
      const dest = MOCK_CREDENTIALS[session.role].redirect;
      navigate({
        to: dest
      });
    }
  }, [hydrated, session, navigate]);
  const tierMeta = TIERS.find((t) => t.key === tier);
  const handleTierSwitch = (next) => {
    if (next === tier) return;
    setTier(next);
    setBannerError(false);
    setFieldErrors({});
  };
  const handleAutofill = (next) => {
    const creds = MOCK_CREDENTIALS[next];
    setTier(next);
    setEmail(creds.email);
    setPassword(creds.password);
    setBannerError(false);
    setFieldErrors({});
    setShowPw(false);
    toast.message(`${creds.displayName} credentials loaded`, {
      description: "Hit Authenticate to continue · or edit before submitting"
    });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!email.trim()) errs.email = "Email is required";
    if (!password) errs.password = "Password is required";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setBannerError(false);
      return;
    }
    setSubmitting(true);
    const result = login(tier, email, password);
    setSubmitting(false);
    if (!result.ok) {
      setBannerError(true);
      toast.error(INVALID_CREDENTIALS_MESSAGE);
      return;
    }
    setBannerError(false);
    toast.success(`Welcome, ${result.session.displayName}`, {
      description: "Session initialised · secure handshake complete"
    });
    navigate({
      to: result.redirect
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-[#EAEAEA] px-4 py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-[460px]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-8 flex flex-col items-center text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-11 w-11 place-items-center rounded-2xl bg-black text-base font-bold text-white", children: "S" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-left leading-tight", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[15px] font-semibold text-black", children: "School Accounts" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-medium uppercase tracking-wider text-black/50", children: "Unified Control" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "tr", className: "p-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-title", children: "Sign in to continue" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-[14px] text-black/55", children: "Select your authentication tier." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 inline-flex w-full rounded-full border border-[#E5E5E5] bg-[#F4F4F5] p-1", children: TIERS.map((t) => {
        const Icon = t.icon;
        const active = tier === t.key;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => handleTierSwitch(t.key), className: `relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-medium transition-all ${active ? "bg-black text-white shadow-sm" : "text-black/65 hover:text-black"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3.5 w-3.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: t.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sm:hidden", children: t.key === "super_admin" ? "Super Admin" : "Tenant" })
        ] }, t.key);
      }) }),
      bannerError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "alert", className: "mt-4 flex items-start gap-2 rounded-2xl border border-[#B91C1C]/20 bg-[#FEE2E2] px-3 py-2.5 text-[12px] text-[#B91C1C]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mt-0.5 h-3.5 w-3.5 shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: INVALID_CREDENTIALS_MESSAGE })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "mt-6 space-y-4", noValidate: true, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "login-email", className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Email / Username" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { id: "login-email", type: "email", autoComplete: "email", value: email, onChange: (e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((f) => ({
              ...f,
              email: void 0
            }));
            if (bannerError) setBannerError(false);
          }, placeholder: tierMeta.placeholderEmail, "aria-invalid": !!fieldErrors.email, className: `h-12 w-full rounded-2xl border bg-white px-4 text-[14px] outline-none transition-colors placeholder:text-black/35 focus:border-black focus:ring-2 focus:ring-black/5 ${fieldErrors.email ? "border-[#B91C1C]/40" : "border-[#E5E5E5]"}` }),
          fieldErrors.email && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-[#B91C1C]", children: fieldErrors.email })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "login-password", className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Password" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { id: "login-password", type: showPw ? "text" : "password", autoComplete: "current-password", value: password, onChange: (e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((f) => ({
                ...f,
                password: void 0
              }));
              if (bannerError) setBannerError(false);
            }, placeholder: "••••••••", "aria-invalid": !!fieldErrors.password, className: `h-12 w-full rounded-2xl border bg-white px-4 pr-11 text-[14px] outline-none transition-colors placeholder:text-black/35 focus:border-black focus:ring-2 focus:ring-black/5 ${fieldErrors.password ? "border-[#B91C1C]/40" : "border-[#E5E5E5]"}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowPw((v) => !v), "aria-label": showPw ? "Hide password" : "Show password", className: "absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl text-black/45 hover:bg-[#F4F4F5] hover:text-black", children: showPw ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3.5 w-3.5" }) })
          ] }),
          fieldErrors.password && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-[#B91C1C]", children: fieldErrors.password })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", disabled: submitting, className: "flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] transition-colors hover:bg-black/90 disabled:opacity-60", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block h-1.5 w-1.5 rounded-full bg-[#C7F33C]" }),
          "Authenticate · ",
          tier === "super_admin" ? "Super Admin" : "Tenant Workspace"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center gap-2 text-[10.5px] text-black/40", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-[#E5E5E5]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono uppercase tracking-wider", children: "Demo credentials · click to autofill" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-[#E5E5E5]" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid gap-2", children: TIERS.map((t) => {
        const creds = MOCK_CREDENTIALS[t.key];
        const isActive = tier === t.key;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => handleAutofill(t.key), "aria-label": `Auto-fill ${t.label} credentials`, className: `group flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left font-mono text-[10.5px] transition-all hover:-translate-y-px hover:border-black/30 hover:bg-[#E1F2AE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${isActive ? "border-black/30 bg-[#E1F2AE]" : "border-[#E5E5E5] bg-[#F4F4F5]"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "h-3 w-3 text-black/45 group-hover:text-black" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-sans font-medium text-black", children: t.label })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2 text-black/65", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: creds.email }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "·" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: creds.password }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-black px-1.5 py-0.5 font-sans text-[9.5px] font-semibold uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100", children: "Fill" })
          ] })
        ] }, t.key);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 text-center font-mono text-[10px] uppercase tracking-wider text-black/40", children: "School Accounts SaaS · v2.0" })
  ] }) });
}
export {
  LoginPage as component
};
