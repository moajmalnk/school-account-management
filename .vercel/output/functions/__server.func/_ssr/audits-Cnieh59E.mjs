import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { w as webhookEvents, i as impersonationLogs } from "./data-CGrnG2qO.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { O as OrganicCard } from "./organic-card-j42pCYkc.mjs";
import { Z as Zap, K as KeyRound, _ as Webhook, u as CircleCheck, q as TriangleAlert } from "../_libs/lucide-react.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "./utils-DO8q3wGq.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
const SIM_POOL = [
  {
    source: "Razorpay",
    event: "payment.captured",
    status: 200,
    payload: "₹ 18,400 / Crescent Bay International"
  },
  {
    source: "Stripe",
    event: "invoice.paid",
    status: 200,
    payload: "USD 499 / Orchid Springs Academy"
  },
  {
    source: "Razorpay",
    event: "payment.failed",
    status: 402,
    payload: "₹ 6,800 / Northwood Grammar Trust"
  },
  {
    source: "Internal",
    event: "tenant.upgraded",
    status: 200,
    payload: "Heritage Montessori → Premium"
  },
  {
    source: "Razorpay",
    event: "refund.processed",
    status: 200,
    payload: "₹ 1,500 / Lakeside Public Schools"
  }
];
function AuditsView() {
  const [events, setEvents] = reactExports.useState(webhookEvents);
  const simulate = () => {
    const pick = SIM_POOL[Math.floor(Math.random() * SIM_POOL.length)];
    const now = /* @__PURE__ */ new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    setEvents((prev) => [{ ...pick, time }, ...prev]);
    toast.success(`Webhook ingested · ${pick.source} ${pick.event}`, {
      description: pick.payload
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-heading", children: "Audit Logging & System Configuration" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-[14px] text-black/55", children: "Secured trace of impersonation sessions & inbound webhook events from billing providers." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: simulate,
          className: "inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-[12.5px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] transition hover:bg-[#C7F33C] hover:text-black",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-3.5 w-3.5" }),
            " Simulate Live Webhook Payment Event"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-5 lg:grid-cols-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "tr", arrow: true, className: "lg:col-span-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E5] px-6 py-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-9 w-9 place-items-center rounded-2xl bg-black text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[14px] font-semibold text-black", children: "Administrative Impersonation Log" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11.5px] text-black/55", children: "Privileged access · last 7 days" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-[#E5E5E5] bg-[#F4F4F5] px-2 py-0.5 font-mono text-[10px] text-black/55", children: "RBAC-VERIFIED" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[1.4fr_1.6fr_1fr_1.2fr_0.7fr] gap-3 border-b border-[#E5E5E5] bg-[#F4F4F5]/60 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-black/55", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Super Admin" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Target Workspace" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Ticket" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Entered" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Duration" })
        ] }),
        impersonationLogs.map((l, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "grid grid-cols-[1.4fr_1.6fr_1fr_1.2fr_0.7fr] gap-3 border-b border-[#F0F0F0] px-6 py-3.5 last:border-b-0 hover:bg-[#F4F4F5]/60",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-7 w-7 place-items-center rounded-full bg-black text-[10px] font-semibold text-white", children: l.admin.split(" ").map((s) => s[0]).join("").slice(0, 2) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[12.5px] font-medium text-black", children: l.admin })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[12.5px] text-black/75", children: l.tenant }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-[11px] text-black", children: l.ticket }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-[11px] text-black/55", children: l.time }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-[11px] text-black/75", children: l.duration })
            ]
          },
          i
        ))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "bl", arrow: true, className: "lg:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E5] px-6 py-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-9 w-9 place-items-center rounded-2xl bg-[#C7F33C] text-black", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Webhook, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[14px] font-semibold text-black", children: "Inbound Webhook Stream" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11.5px] text-black/55", children: "Live ledger · Stripe / Razorpay / Internal" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-block h-2 w-2 rounded-full heartbeat-dot bg-[#C7F33C]" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "relative ml-6 border-l border-dashed border-black/15 px-6 py-5", children: events.map((e, i) => {
          const ok = e.status < 400;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "relative mb-4 pl-4 last:mb-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: `absolute -left-[7px] top-1 grid h-3 w-3 place-items-center rounded-full ring-4 ring-white ${ok ? "bg-black" : "bg-[#B91C1C]"}`
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[12.5px] font-semibold text-black", children: e.source }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-[10px] text-black/45", children: e.time })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: `mt-0.5 flex items-center gap-2 font-mono text-[11px] ${ok ? "text-black" : "text-[#B91C1C]"}`,
                children: [
                  ok ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3 w-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3 w-3" }),
                  e.event,
                  " · ",
                  e.status,
                  " ",
                  ok ? "OK" : "ERR"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-[11.5px] text-black/55", children: e.payload })
          ] }, i);
        }) })
      ] })
    ] })
  ] });
}
const SplitComponent = AuditsView;
export {
  SplitComponent as component
};
