import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { S as Switch } from "./switch-BuU6ghIU.mjs";
import { I as Input } from "./input-FCkkYGai.mjs";
import { O as OrganicCard } from "./organic-card-j42pCYkc.mjs";
import { N as Sparkles, d as Check } from "../_libs/lucide-react.mjs";
import "../_libs/radix-ui__react-switch.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/radix-ui__react-slot.mjs";
import "./utils-DO8q3wGq.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
const FEATURES = [
  { key: "finance", label: "Enable Finance Module" },
  { key: "vehicle", label: "Enable Vehicle Route Tracker" },
  { key: "analytics", label: "Enable Advanced Analytics Reporting" },
  { key: "alerts", label: "Enable Automated SMS / WhatsApp Alerts API" },
  { key: "exams", label: "Enable Examination & Grading Engine" },
  { key: "library", label: "Enable Library Inventory Module" }
];
const INITIAL = [
  {
    name: "Basic",
    accent: "#000000",
    monthly: 4999,
    annually: 49999,
    flags: {
      finance: true,
      vehicle: false,
      analytics: false,
      alerts: false,
      exams: true,
      library: false
    }
  },
  {
    name: "Premium",
    accent: "#C7F33C",
    monthly: 12999,
    annually: 129999,
    flags: {
      finance: true,
      vehicle: true,
      analytics: true,
      alerts: false,
      exams: true,
      library: true
    }
  },
  {
    name: "Enterprise",
    accent: "#000000",
    monthly: 24999,
    annually: 249999,
    flags: {
      finance: true,
      vehicle: true,
      analytics: true,
      alerts: true,
      exams: true,
      library: true
    }
  }
];
const TIER_TONE = {
  Basic: "white",
  Premium: "lime",
  Enterprise: "black"
};
function PlansView() {
  const [interval, setInterval] = reactExports.useState("Monthly");
  const [tiers, setTiers] = reactExports.useState(INITIAL);
  const updateTier = (i, patch) => setTiers((prev) => prev.map((t, idx) => idx === i ? { ...t, ...patch } : t));
  const toggleFlag = (i, k) => setTiers(
    (prev) => prev.map((t, idx) => idx === i ? { ...t, flags: { ...t.flags, [k]: !t.flags[k] } } : t)
  );
  const totalEnabled = tiers.reduce((s, t) => s + Object.values(t.flags).filter(Boolean).length, 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-heading", children: "Subscription Tiers & Feature Matrix" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-[14px] text-black/55", children: [
          "Globally configure commercial plans & module access · ",
          totalEnabled,
          " flags enabled across tiers"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center gap-1 rounded-full border border-[#E5E5E5] bg-white p-1", children: ["Monthly", "Annually"].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setInterval(i),
          className: `rounded-full px-5 py-2 text-[12.5px] font-semibold transition ${interval === i ? "bg-black text-white shadow-sm" : "text-black/65 hover:text-black"}`,
          children: i
        },
        i
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-5 md:grid-cols-3", children: tiers.map((t, i) => {
      const price = interval === "Monthly" ? t.monthly : t.annually;
      const isPremium = t.name === "Premium";
      const tone = TIER_TONE[t.name] ?? "white";
      const cornerSide = "tr";
      const isLime = tone === "lime";
      const isBlack = tone === "black";
      const subText = isLime ? "text-black/70" : isBlack ? "text-white/70" : "text-black/55";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        OrganicCard,
        {
          tone,
          cornerSide,
          arrow: true,
          padded: true,
          className: "overflow-hidden",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 flex h-7 items-center", children: isPremium && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3" }),
              " Most adopted"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: "h-2.5 w-2.5 rounded-full",
                  style: { backgroundColor: isBlack ? "#C7F33C" : isLime ? "#000000" : "#000000" }
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: t.name,
                  onChange: (e) => updateTier(i, { name: e.target.value }),
                  className: `h-9 border-transparent bg-transparent px-1 text-[18px] font-semibold focus-visible:bg-black/5 ${isBlack ? "text-white" : "text-black"}`
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: `mt-4 flex w-full items-baseline gap-2 border-b pb-2 font-mono ${isBlack ? "border-white/15" : "border-black/10"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[20px] font-bold ${isBlack ? "text-white" : "text-black"}`, children: "₹" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "number",
                      value: price,
                      onChange: (e) => updateTier(
                        i,
                        interval === "Monthly" ? { monthly: Number(e.target.value) || 0 } : { annually: Number(e.target.value) || 0 }
                      ),
                      className: `w-full min-w-0 bg-transparent text-[28px] font-bold tracking-tight focus:outline-none ${isBlack ? "text-white" : "text-black"}`
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `shrink-0 font-sans text-[12px] ${subText}`, children: [
                    "/ ",
                    interval === "Monthly" ? "mo" : "yr"
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `mt-1 font-mono text-[11px] ${subText}`, children: [
              "≈ ₹ ",
              (interval === "Monthly" ? t.monthly * 12 : t.annually).toLocaleString("en-IN"),
              " ",
              "annual contract"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `my-5 h-px ${isBlack ? "bg-white/10" : "bg-black/10"}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-[10.5px] font-semibold uppercase tracking-wider ${subText}`, children: "Feature Flag Authorization" }),
              FEATURES.map((f) => {
                const on = t.flags[f.key];
                const rowBg = isBlack ? "bg-white/5" : isLime ? "bg-black/5" : "bg-[#F4F4F5]";
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: `flex items-center justify-between rounded-2xl px-3 py-2 ${rowBg}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Check,
                          {
                            className: `h-3.5 w-3.5 shrink-0 ${on ? "" : "opacity-30"}`,
                            style: { color: isBlack ? "#C7F33C" : "#000000" }
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "span",
                          {
                            className: `truncate text-[12px] ${on ? isBlack ? "font-medium text-white" : "font-medium text-black" : isBlack ? "text-white/40" : "text-black/40"}`,
                            children: f.label
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: on, onCheckedChange: () => toggleFlag(i, f.key) })
                    ]
                  },
                  f.key
                );
              })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                className: `mt-5 w-full rounded-full py-2.5 text-[12.5px] font-semibold shadow-sm transition-colors ${isLime ? "bg-black text-white hover:bg-black/85" : isBlack ? "bg-[#C7F33C] text-black hover:bg-white" : "bg-black text-white hover:bg-black/85"}`,
                children: [
                  "Save ",
                  t.name,
                  " Configuration"
                ]
              }
            )
          ]
        },
        t.name
      );
    }) })
  ] });
}
const SplitComponent = PlansView;
export {
  SplitComponent as component
};
