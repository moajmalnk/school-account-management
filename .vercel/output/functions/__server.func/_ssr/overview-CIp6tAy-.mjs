import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { r as recentRegistrations } from "./data-CGrnG2qO.mjs";
import { O as OrganicCard } from "./organic-card-j42pCYkc.mjs";
import { O as School, Q as IndianRupee, r as TrendingUp, V as Activity, u as CircleCheck, Y as Clock } from "../_libs/lucide-react.mjs";
import "./utils-DO8q3wGq.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
const weeklyBars = [
  { d: "Mon", v: 42 },
  { d: "Tue", v: 58 },
  { d: "Wed", v: 74 },
  { d: "Thu", v: 96 },
  { d: "Fri", v: 88 },
  { d: "Sat", v: 51 },
  { d: "Sun", v: 33 }
];
const peakIdx = weeklyBars.reduce((m, b, i, a) => b.v > a[m].v ? i : m, 0);
function MetricCard({
  label,
  value,
  sub,
  tone = "white",
  cornerSide = "tr",
  icon: Icon,
  spark,
  heartbeat
}) {
  const isLime = tone === "lime";
  const isBlack = tone === "black";
  const accentBg = isLime ? "bg-black" : isBlack ? "bg-[#C7F33C]" : "bg-black";
  const accentFg = isLime ? "text-white" : isBlack ? "text-black" : "text-white";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone, cornerSide, arrow: true, padded: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-[12px] font-medium ${isLime || isBlack ? "" : "text-black/55"}`, children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${accentBg} ${accentFg}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-[28px] font-semibold tracking-tight", children: value }),
        heartbeat && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "relative ml-1 inline-block h-2 w-2 rounded-full heartbeat-dot",
            style: { backgroundColor: isLime ? "#000000" : "#C7F33C" }
          }
        )
      ] })
    ] }),
    sub && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[12px]", children: sub }),
    spark && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex h-10 items-end gap-1", children: spark.map((v, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "flex-1 rounded-md",
        style: {
          height: `${v}%`,
          backgroundColor: isLime ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.08)"
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "h-full w-full rounded-md",
            style: {
              background: isLime ? "linear-gradient(180deg, rgba(0,0,0,0.45), #000000)" : "linear-gradient(180deg, rgba(199,243,60,0.65), #C7F33C)"
            }
          }
        )
      },
      i
    )) })
  ] });
}
function OverviewView() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-heading", children: "Platform Control Overview" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-[14px] text-black/55", children: [
          "You have ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-black", children: "3 trial" }),
          " tenants nearing conversion this week."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-[12.5px] font-medium text-black/75 transition-colors hover:bg-[#F4F4F5]", children: "Last 30 days" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "rounded-full bg-black px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-colors hover:bg-black/85", children: "Export Report" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "Total Active Schools",
          value: "142",
          icon: School,
          cornerSide: "tr",
          spark: [30, 42, 38, 55, 60, 72, 84],
          sub: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-black/65", children: "+12% vs last month" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "Monthly Recurring Revenue",
          value: "₹ 8,45,000",
          icon: IndianRupee,
          tone: "lime",
          cornerSide: "bl",
          spark: [44, 50, 48, 60, 65, 70, 82],
          sub: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "MRR · billed in INR" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "Annual Recurring Revenue",
          value: "₹ 1,01,40,000",
          icon: TrendingUp,
          cornerSide: "tr",
          spark: [20, 35, 40, 52, 58, 66, 78],
          sub: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-black/65", children: "Projected ARR" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          label: "System Processing Load",
          value: "99.98%",
          icon: Activity,
          tone: "black",
          cornerSide: "bl",
          heartbeat: true,
          sub: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-white/70", children: "Uptime · last 90d" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "tr", arrow: true, padded: true, className: "lg:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-title", children: "Weekly Registrations" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[13px] text-black/55", children: [
              "New tenant signups · peak on ",
              weeklyBars[peakIdx].d
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-[12px] text-black/45", children: "+24 this week" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 flex h-44 items-end gap-3", children: weeklyBars.map((b, i) => {
          const isPeak = i === peakIdx;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-[10px] text-black/45", children: b.v }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "relative w-full overflow-hidden rounded-t-xl",
                style: { height: `${b.v}%` },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "absolute inset-0 rounded-t-xl",
                      style: {
                        background: isPeak ? "linear-gradient(180deg,#C7F33C 0%, #E1F2AE 100%)" : "linear-gradient(180deg,#000000 0%, #1F1F1F 100%)"
                      }
                    }
                  ),
                  isPeak && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-4 ring-[#C7F33C]/30",
                      style: { backgroundColor: "#000000" }
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-medium uppercase tracking-wider text-black/45", children: b.d })
          ] }, b.d);
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "bl", arrow: true, padded: true, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-title", children: "Plan Distribution" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[13px] text-black/55", children: "Across 142 tenants" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex h-3 overflow-hidden rounded-full bg-[#F4F4F5]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full", style: { width: "30%", backgroundColor: "#000000" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full", style: { width: "55%", backgroundColor: "#C7F33C" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full", style: { width: "15%", backgroundColor: "#E1F2AE" } })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 space-y-3", children: [
          { label: "Basic", pct: 30, count: 43, color: "#000000" },
          { label: "Premium", pct: 55, count: 78, color: "#C7F33C" },
          { label: "Enterprise", pct: 15, count: 21, color: "#E1F2AE" }
        ].map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: "h-2.5 w-2.5 rounded-full ring-2 ring-black/5",
                style: { backgroundColor: p.color }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[13.5px] font-medium text-black", children: p.label })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-mono text-[12px] text-black/55", children: [
            p.count,
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-black/40", children: [
              "/ ",
              p.pct,
              "%"
            ] })
          ] })
        ] }, p.label)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "tr", arrow: true, padded: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-title", children: "Recent Registrations" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[13px] text-black/55", children: "Latest 5 tenant signups · provisioning pipeline" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-medium text-black hover:bg-black hover:text-white", children: "View all →" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 divide-y divide-[#F0F0F0]", children: recentRegistrations.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between py-3.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-10 w-10 place-items-center rounded-2xl bg-[#F4F4F5] text-black/65", children: /* @__PURE__ */ jsxRuntimeExports.jsx(School, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[13.5px] font-medium text-black", children: r.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-[11px] text-black/55", children: r.domain })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "hidden items-center gap-1.5 text-[12px] text-black/65 md:flex", children: [
            r.step === "Provisioned" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5 text-black" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3.5 w-3.5 text-black/50" }),
            r.step
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 font-mono text-[10px] text-black/65", children: r.flag }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-[11px] text-black/45", children: r.time })
        ] })
      ] }, r.domain)) })
    ] })
  ] });
}
const SplitComponent = OverviewView;
export {
  SplitComponent as component
};
