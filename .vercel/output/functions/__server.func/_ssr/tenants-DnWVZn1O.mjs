import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as seedTenants } from "./data-CGrnG2qO.mjs";
import { O as OrganicCard } from "./organic-card-j42pCYkc.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem, e as Sheet, f as SheetContent, g as SheetHeader, h as SheetTitle, i as SheetDescription, D as DatePicker } from "./date-picker-CKUZiWzI.mjs";
import { I as Input } from "./input-FCkkYGai.mjs";
import { L as Label } from "./label-37DVo-jK.mjs";
import { S as Switch } from "./switch-BuU6ghIU.mjs";
import { P as Plus, c as Search, p as Pencil, z as FileText, G as ScrollText, K as KeyRound, X, I as Info, H as Save, R as RotateCw, D as Download, J as Funnel, h as CircleAlert, q as TriangleAlert, u as CircleCheck } from "../_libs/lucide-react.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "./utils-DO8q3wGq.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/tslib.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/radix-ui__react-popover.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-switch.mjs";
const TIER_STYLE = {
  Basic: { bg: "#F4F4F5", fg: "#000000" },
  Premium: { bg: "#E1F2AE", fg: "#000000" },
  Enterprise: { bg: "#000000", fg: "#FFFFFF" }
};
const STATUS_STYLE = {
  Active: { bg: "#F4F4F5", fg: "#000000", dot: "#000000" },
  Trial: { bg: "#E1F2AE", fg: "#000000", dot: "#000000" },
  Overdue: { bg: "#000000", fg: "#C7F33C", dot: "#C7F33C" },
  Suspended: { bg: "#FEE2E2", fg: "#B91C1C", dot: "#B91C1C" }
};
const STATUS_TONE = {
  Active: "white",
  Trial: "white",
  Overdue: "lime",
  Suspended: "black"
};
const CURRENCY_SYMBOL = { INR: "₹", USD: "$", EUR: "€" };
function defaultBilling(t) {
  const created = new Date(t.createdAt);
  const next = new Date(created);
  const monthsAhead = t.tier === "Enterprise" ? 12 : t.tier === "Premium" ? 3 : 1;
  next.setMonth(next.getMonth() + monthsAhead);
  return {
    cycle: t.tier === "Enterprise" ? "Annual" : t.tier === "Premium" ? "Quarterly" : "Monthly",
    ratePerStudent: t.tier === "Enterprise" ? 299 : t.tier === "Premium" ? 199 : 99,
    currency: "INR",
    autoCharge: t.status === "Active",
    taxPercent: 18,
    discountPercent: t.tier === "Enterprise" ? 12 : 0,
    nextInvoice: next.toISOString().slice(0, 10),
    paymentMethod: t.tier === "Basic" ? "Razorpay" : "Stripe",
    graceDays: 7
  };
}
function pseudoRandom(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = h * 16777619 >>> 0;
  }
  return () => {
    h = h * 1664525 + 1013904223 >>> 0;
    return h / 4294967295;
  };
}
const AUDIT_TEMPLATES = [
  { action: "Admin login (SSO)", severity: "success", detail: "okta.org" },
  { action: "Bulk fee import", severity: "info", detail: "1,243 rows · 0 errors" },
  { action: "Webhook delivery", severity: "success", detail: "razorpay → payment.captured 200" },
  {
    action: "Webhook delivery failure",
    severity: "error",
    detail: "stripe 5xx · auto-retry queued"
  },
  { action: "Role escalation", severity: "warning", detail: "support@platform → tenant.owner" },
  { action: "DNS cutover", severity: "info", detail: "CNAME apex → edge.schoolaccounts.in" },
  { action: "Invoice generated", severity: "success", detail: "INV-92831 · ₹ 4,28,000" },
  { action: "Storage threshold", severity: "warning", detail: "82% of 50 GB used" },
  { action: "Failed login burst", severity: "error", detail: "12 attempts · 49.207.x.x" },
  { action: "Backup snapshot", severity: "success", detail: "pg-dump 248 MB · 2.4s" },
  { action: "API key rotated", severity: "info", detail: "sk_live_***47 → sk_live_***ab" },
  { action: "Schema migration", severity: "info", detail: "v202604.02 · 19 tables touched" }
];
function buildAuditLog(t, count = 18) {
  const rand = pseudoRandom(t.uuid);
  const events = [];
  const now = /* @__PURE__ */ new Date();
  for (let i = 0; i < count; i++) {
    const tpl = AUDIT_TEMPLATES[Math.floor(rand() * AUDIT_TEMPLATES.length)];
    const minutesAgo = Math.floor(rand() * 60 * 24 * 6) + i * 13;
    const ts = new Date(now.getTime() - minutesAgo * 6e4);
    const actorPool = [
      "Rohan Mehta",
      "Anika Roy",
      "Priya Subramanian",
      "Devanand Iyer",
      "system.scheduler",
      "webhook.gateway"
    ];
    const actor = actorPool[Math.floor(rand() * actorPool.length)];
    const ip = `${49 + Math.floor(rand() * 50)}.${Math.floor(rand() * 256)}.${Math.floor(rand() * 256)}.${Math.floor(rand() * 256)}`;
    events.push({
      ts: ts.toISOString().replace("T", " ").slice(0, 19),
      severity: tpl.severity,
      actor,
      action: tpl.action,
      ip,
      detail: tpl.detail
    });
  }
  return events.sort((a, b) => a.ts < b.ts ? 1 : -1);
}
function TenantsView({ onImpersonate } = {}) {
  const [query, setQuery] = reactExports.useState("");
  const [tier, setTier] = reactExports.useState("all");
  const [status, setStatus] = reactExports.useState("all");
  const [open, setOpen] = reactExports.useState(false);
  const [tenants, setTenants] = reactExports.useState(seedTenants);
  const [billingMap, setBillingMap] = reactExports.useState({});
  const [editTarget, setEditTarget] = reactExports.useState(null);
  const [billingTarget, setBillingTarget] = reactExports.useState(null);
  const [auditTarget, setAuditTarget] = reactExports.useState(null);
  const filtered = reactExports.useMemo(() => {
    return tenants.filter((t) => {
      if (tier !== "all" && t.tier !== tier) return false;
      if (status !== "all" && t.status !== status) return false;
      if (query && !`${t.name} ${t.subdomain} ${t.id}`.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [tenants, tier, status, query]);
  const updateTenant = (id, patch) => {
    setTenants((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t));
  };
  const upsertBilling = (id, rule) => {
    setBillingMap((prev) => ({ ...prev, [id]: rule }));
  };
  const getBilling = (t) => billingMap[t.id] ?? defaultBilling(t);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-heading", children: "School Tenants Registry" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-[14px] text-black/55", children: [
          filtered.length,
          " of ",
          tenants.length,
          " tenants · isolated routing keys, provisioning & billing"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setOpen(true),
          className: "inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] transition hover:bg-black/85",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
            " Provision New School Tenant"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(OrganicCard, { tone: "white", cornerSide: "tr", className: "flex flex-wrap items-center gap-2 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-[260px] flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/40" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: query,
            onChange: (e) => setQuery(e.target.value),
            placeholder: "Search by school, subdomain, or tenant ID…",
            className: "h-10 rounded-full border-[#E5E5E5] bg-[#F4F4F5] pl-9 text-[13px]"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: tier, onValueChange: setTier, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 w-[170px] rounded-full border-[#E5E5E5] bg-[#F4F4F5] text-[12px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "All packages" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All packages" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Basic", children: "Basic" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Premium", children: "Premium" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Enterprise", children: "Enterprise" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: status, onValueChange: setStatus, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 w-[170px] rounded-full border-[#E5E5E5] bg-[#F4F4F5] text-[12px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "All statuses" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All statuses" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Active", children: "Active" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Trial", children: "Trial" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Overdue", children: "Overdue" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Suspended", children: "Suspended" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3", children: [
      filtered.map((t, i) => {
        const pct = Math.round(t.students / t.capacity * 100);
        const tStyle = TIER_STYLE[t.tier];
        const sStyle = STATUS_STYLE[t.status];
        const tone = STATUS_TONE[t.status];
        const cornerSide = i % 2 === 0 ? "tr" : "bl";
        const isLime = tone === "lime";
        const isBlack = tone === "black";
        const subText = isBlack ? "text-white/70" : isLime ? "text-black/70" : "text-black/55";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          OrganicCard,
          {
            tone,
            cornerSide,
            padded: true,
            className: "space-y-4",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[15px] font-semibold leading-tight", children: t.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `mt-1 font-mono text-[11px] ${subText}`, children: [
                  t.id,
                  " · ",
                  t.uuid
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: `mt-0.5 font-mono text-[11px] ${isBlack ? "text-[#C7F33C]" : "text-black/65"}`,
                    children: [
                      t.subdomain,
                      ".schoolaccounts.in"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    style: { backgroundColor: tStyle.bg, color: tStyle.fg },
                    children: t.tier
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "span",
                  {
                    className: "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    style: { backgroundColor: sStyle.bg, color: sStyle.fg },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "span",
                        {
                          className: "h-1.5 w-1.5 rounded-full",
                          style: { backgroundColor: sStyle.dot }
                        }
                      ),
                      t.status
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: `flex items-center justify-between font-mono text-[11px] ${subText}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        t.students.toLocaleString(),
                        " / ",
                        t.capacity.toLocaleString()
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        pct,
                        "%"
                      ] })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: `mt-1.5 h-1.5 overflow-hidden rounded-full ${isBlack ? "bg-white/15" : isLime ? "bg-black/15" : "bg-[#F4F4F5]"}`,
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "h-full rounded-full",
                        style: {
                          width: `${pct}%`,
                          backgroundColor: isLime ? "#000000" : isBlack ? "#C7F33C" : pct > 90 ? "#000000" : pct > 70 ? "#C7F33C" : "#000000"
                        }
                      }
                    )
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `flex flex-wrap items-center justify-between gap-2 border-t pt-3 ${isBlack ? "border-white/10" : isLime ? "border-black/10" : "border-black/8"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        TenantAction,
                        {
                          icon: Pencil,
                          label: "Edit Tenant Meta",
                          tone,
                          onClick: () => setEditTarget(t)
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        TenantAction,
                        {
                          icon: FileText,
                          label: "Alter Billing Rules",
                          tone,
                          onClick: () => setBillingTarget(t)
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        TenantAction,
                        {
                          icon: ScrollText,
                          label: "Audit Connection Logs",
                          tone,
                          onClick: () => setAuditTarget(t)
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        onClick: () => onImpersonate?.(t.name),
                        className: `inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold shadow-[0_6px_18px_-10px_rgba(0,0,0,0.5)] transition-colors ${isBlack ? "bg-[#C7F33C] text-black hover:bg-white" : isLime ? "bg-black text-white hover:bg-black/85" : "bg-black text-white hover:bg-black/85"}`,
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-3 w-3" }),
                          " Impersonate"
                        ]
                      }
                    )
                  ]
                }
              )
            ]
          },
          t.id
        );
      }),
      filtered.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(OrganicCard, { tone: "white", cornerSide: "tr", padded: true, className: "md:col-span-2 xl:col-span-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-10 text-center text-[13px] text-black/55", children: "No tenants match the current filters." }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TenantFormDrawer,
      {
        open,
        onOpenChange: setOpen,
        onCreate: (t) => setTenants((prev) => [t, ...prev])
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      EditTenantDrawer,
      {
        tenant: editTarget,
        onClose: () => setEditTarget(null),
        onSave: (patch) => {
          if (!editTarget) return;
          updateTenant(editTarget.id, patch);
          toast.success("Tenant meta updated", {
            description: `${patch.name ?? editTarget.name} · ${patch.subdomain ?? editTarget.subdomain}.schoolaccounts.in`
          });
          setEditTarget(null);
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      BillingRulesDrawer,
      {
        tenant: billingTarget,
        rule: billingTarget ? getBilling(billingTarget) : null,
        onClose: () => setBillingTarget(null),
        onSave: (rule) => {
          if (!billingTarget) return;
          upsertBilling(billingTarget.id, rule);
          toast.success("Billing rules saved", {
            description: `${billingTarget.name} · ${rule.cycle} · ${CURRENCY_SYMBOL[rule.currency]}${rule.ratePerStudent}/student`
          });
          setBillingTarget(null);
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AuditLogsDrawer, { tenant: auditTarget, onClose: () => setAuditTarget(null) })
  ] });
}
function TenantAction({
  icon: Icon,
  label,
  tone,
  onClick
}) {
  const palette = tone === "black" ? "bg-white/10 text-white hover:bg-white hover:text-black" : tone === "lime" ? "bg-black/10 text-black hover:bg-black hover:text-white" : "bg-[#F4F4F5] text-black/70 hover:bg-black hover:text-white";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      onClick: (e) => {
        e.stopPropagation();
        onClick();
      },
      "aria-label": label,
      title: label,
      className: `grid h-8 w-8 place-items-center rounded-full transition-colors ${palette}`,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3.5 w-3.5" })
    }
  );
}
function TenantFormDrawer({
  open,
  onOpenChange,
  onCreate
}) {
  const [legalName, setLegalName] = reactExports.useState("");
  const [slug, setSlug] = reactExports.useState("");
  const [adminName, setAdminName] = reactExports.useState("");
  const [adminEmail, setAdminEmail] = reactExports.useState("");
  const [contact, setContact] = reactExports.useState("");
  const [gstin, setGstin] = reactExports.useState("");
  const [students, setStudents] = reactExports.useState(500);
  const [faculty, setFaculty] = reactExports.useState(40);
  const [tier, setTier] = reactExports.useState("Premium");
  const [customDomain, setCustomDomain] = reactExports.useState(false);
  const [apex, setApex] = reactExports.useState("");
  const reset = () => {
    setLegalName("");
    setSlug("");
    setAdminName("");
    setAdminEmail("");
    setContact("");
    setGstin("");
    setStudents(500);
    setFaculty(40);
    setTier("Premium");
    setCustomDomain(false);
    setApex("");
  };
  const submit = () => {
    if (!legalName || !slug) return;
    onCreate({
      id: `T-${Math.floor(1100 + Math.random() * 800)}`,
      uuid: Math.random().toString(16).slice(2, 6) + "-" + Math.random().toString(16).slice(2, 6) + "-4f00-aaaa",
      name: legalName,
      subdomain: slug,
      tier,
      status: "Trial",
      students: 0,
      capacity: students,
      createdAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
    });
    reset();
    onOpenChange(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Sheet, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { className: "flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[520px]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetHeader, { className: "border-b border-[#E5E5E5] bg-[#F4F4F5] px-6 py-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { className: "text-[18px] font-semibold text-black", children: "Provision New School Tenant" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SheetDescription, { className: "text-[12px] text-black/55", children: "Creates an isolated database routing key & super-user." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 px-6 py-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Business Entity Legal Name", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          value: legalName,
          onChange: (e) => setLegalName(e.target.value),
          placeholder: "e.g. Silver Hills Educational Trust"
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Subdomain Routing Slug", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-stretch overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white focus-within:ring-2 focus-within:ring-black/10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: slug,
            onChange: (e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")),
            placeholder: "silverhills",
            className: "flex-1 bg-transparent px-3 py-2 font-mono text-[13px] outline-none"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid place-items-center bg-[#F4F4F5] px-3 font-mono text-[12px] text-black/55", children: ".schoolaccounts.in" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Administrator Full Name", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: adminName,
            onChange: (e) => setAdminName(e.target.value),
            placeholder: "Anika Roy"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Administrator Email", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: adminEmail,
            onChange: (e) => setAdminEmail(e.target.value),
            placeholder: "admin@school.in",
            type: "email"
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Contact String", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: contact,
            onChange: (e) => setContact(e.target.value),
            placeholder: "+91 98XXXXXXXX"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Tax ID / GSTIN", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: gstin,
            onChange: (e) => setGstin(e.target.value.toUpperCase()),
            placeholder: "29ABCDE1234F1Z5",
            className: "font-mono"
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Student Seat Limit", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "number",
            value: students,
            onChange: (e) => setStudents(Number(e.target.value) || 0),
            className: "font-mono"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Faculty Roster Cap", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "number",
            value: faculty,
            onChange: (e) => setFaculty(Number(e.target.value) || 0),
            className: "font-mono"
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Subscription Tier", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: ["Basic", "Premium", "Enterprise"].map((tt) => {
        const sel = tier === tt;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setTier(tt),
            className: `rounded-full border px-3 py-2 text-[12px] font-semibold transition ${sel ? "border-transparent bg-[#C7F33C] text-black shadow-sm" : "border-[#E5E5E5] bg-white text-black/65 hover:border-black/30"}`,
            children: tt
          },
          tt
        );
      }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-[#E5E5E5] bg-[#F4F4F5] p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[13px] font-semibold text-black", children: "Custom Root Domain" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-black/55", children: "Route via tenant's own apex (e.g. accounts.school.edu)" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: customDomain, onCheckedChange: setCustomDomain })
        ] }),
        customDomain && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: apex,
            onChange: (e) => setApex(e.target.value),
            placeholder: "accounts.emeraldacademy.edu",
            className: "mt-3 font-mono"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-auto flex items-center justify-between gap-3 border-t border-[#E5E5E5] bg-[#F4F4F5] px-6 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => onOpenChange(false),
          className: "inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-[12px] font-semibold text-black/75",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" }),
            " Cancel"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: submit,
          className: "rounded-full bg-black px-5 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-black/85",
          children: "Provision Tenant"
        }
      )
    ] })
  ] }) });
}
function EditTenantDrawer({
  tenant,
  onClose,
  onSave
}) {
  const [name, setName] = reactExports.useState("");
  const [subdomain, setSubdomain] = reactExports.useState("");
  const [tier, setTier] = reactExports.useState("Basic");
  const [status, setStatus] = reactExports.useState("Active");
  const [capacity, setCapacity] = reactExports.useState(0);
  reactExports.useEffect(() => {
    if (!tenant) return;
    setName(tenant.name);
    setSubdomain(tenant.subdomain);
    setTier(tenant.tier);
    setStatus(tenant.status);
    setCapacity(tenant.capacity);
  }, [tenant]);
  if (!tenant) return null;
  const dirty = name !== tenant.name || subdomain !== tenant.subdomain || tier !== tenant.tier || status !== tenant.status || capacity !== tenant.capacity;
  const submit = () => {
    if (!name.trim()) {
      toast.error("Legal name is required");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      toast.error("Subdomain must be lowercase letters, digits, or hyphens");
      return;
    }
    if (capacity < tenant.students) {
      toast.error("Capacity cannot drop below active enrolment", {
        description: `${tenant.students.toLocaleString()} students currently provisioned.`
      });
      return;
    }
    onSave({ name: name.trim(), subdomain: subdomain.trim(), tier, status, capacity });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Sheet, { open: !!tenant, onOpenChange: (v) => !v && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { className: "flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[520px]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetHeader, { className: "border-b border-[#E5E5E5] bg-[#F4F4F5] px-6 py-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { className: "text-[18px] font-semibold text-black", children: "Edit Tenant Meta" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetDescription, { className: "text-[12px] text-black/55", children: [
        tenant.id,
        " · ",
        tenant.uuid
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 px-6 py-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Business Entity Legal Name", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: name, onChange: (e) => setName(e.target.value) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Subdomain Routing Slug", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-stretch overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white focus-within:ring-2 focus-within:ring-black/10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: subdomain,
            onChange: (e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")),
            className: "flex-1 bg-transparent px-3 py-2 font-mono text-[13px] outline-none"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid place-items-center bg-[#F4F4F5] px-3 font-mono text-[12px] text-black/55", children: ".schoolaccounts.in" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Subscription Tier", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: ["Basic", "Premium", "Enterprise"].map((tt) => {
        const sel = tier === tt;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setTier(tt),
            className: `rounded-full border px-3 py-2 text-[12px] font-semibold transition ${sel ? "border-transparent bg-[#C7F33C] text-black shadow-sm" : "border-[#E5E5E5] bg-white text-black/65 hover:border-black/30"}`,
            children: tt
          },
          tt
        );
      }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Lifecycle Status", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-2", children: ["Active", "Trial", "Overdue", "Suspended"].map((ss) => {
        const sel = status === ss;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setStatus(ss),
            className: `rounded-full border px-2.5 py-2 text-[11.5px] font-semibold transition ${sel ? "border-transparent bg-black text-white shadow-sm" : "border-[#E5E5E5] bg-white text-black/65 hover:border-black/30"}`,
            children: ss
          },
          ss
        );
      }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: `Student Seat Capacity · current ${tenant.students.toLocaleString()}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          type: "number",
          min: tenant.students,
          value: capacity,
          onChange: (e) => setCapacity(Number(e.target.value) || 0),
          className: "font-mono"
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-2xl border border-[#E5E5E5] bg-[#F4F4F5] px-3 py-2.5 text-[11.5px] text-black/65", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-3.5 w-3.5 shrink-0 text-black/45" }),
        "Updates write to the tenant's metadata store. The routing key is rebuilt automatically on subdomain change."
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-auto flex items-center justify-between gap-3 border-t border-[#E5E5E5] bg-[#F4F4F5] px-6 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: onClose,
          className: "inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-[12px] font-semibold text-black/75",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" }),
            " Cancel"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: submit,
          disabled: !dirty,
          className: "inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/30",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3.5 w-3.5" }),
            " Save Changes"
          ]
        }
      )
    ] })
  ] }) });
}
function BillingRulesDrawer({
  tenant,
  rule,
  onClose,
  onSave
}) {
  const [draft, setDraft] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (rule) setDraft(rule);
  }, [rule]);
  if (!tenant || !draft) return null;
  const set = (k, v) => setDraft((prev) => prev ? { ...prev, [k]: v } : prev);
  const grossPerCycle = draft.ratePerStudent * tenant.students;
  const discount = grossPerCycle * (draft.discountPercent / 100);
  const taxBase = grossPerCycle - discount;
  const tax = taxBase * (draft.taxPercent / 100);
  const total = taxBase + tax;
  const sym = CURRENCY_SYMBOL[draft.currency];
  const submit = () => {
    if (draft.ratePerStudent <= 0) {
      toast.error("Rate per student must be greater than zero");
      return;
    }
    if (draft.graceDays < 0 || draft.graceDays > 60) {
      toast.error("Grace period must be between 0 and 60 days");
      return;
    }
    onSave(draft);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Sheet, { open: !!tenant, onOpenChange: (v) => !v && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { className: "flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[560px]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetHeader, { className: "border-b border-[#E5E5E5] bg-[#F4F4F5] px-6 py-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { className: "text-[18px] font-semibold text-black", children: "Alter Billing Rules" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetDescription, { className: "text-[12px] text-black/55", children: [
        tenant.name,
        " · ",
        tenant.tier,
        " · ",
        tenant.students.toLocaleString(),
        " active seats"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 px-6 py-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Billing Cycle", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: ["Monthly", "Quarterly", "Annual"].map((c) => {
        const sel = draft.cycle === c;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => set("cycle", c),
            className: `rounded-full border px-3 py-2 text-[12px] font-semibold transition ${sel ? "border-transparent bg-[#C7F33C] text-black shadow-sm" : "border-[#E5E5E5] bg-white text-black/65 hover:border-black/30"}`,
            children: c
          },
          c
        );
      }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: `Rate / student (${sym})`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "number",
            min: 0,
            value: draft.ratePerStudent,
            onChange: (e) => set("ratePerStudent", Number(e.target.value) || 0),
            className: "font-mono"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Currency", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: draft.currency, onValueChange: (v) => set("currency", v), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-2xl border-[#E5E5E5] bg-white text-[13px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "INR", children: "INR · ₹" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "USD", children: "USD · $" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "EUR", children: "EUR · €" })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Tax / GST %", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "number",
            min: 0,
            max: 50,
            value: draft.taxPercent,
            onChange: (e) => set("taxPercent", Number(e.target.value) || 0),
            className: "font-mono"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Discount %", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "number",
            min: 0,
            max: 100,
            value: draft.discountPercent,
            onChange: (e) => set("discountPercent", Number(e.target.value) || 0),
            className: "font-mono"
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Next Invoice Date", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          DatePicker,
          {
            value: draft.nextInvoice,
            onChange: (v) => set("nextInvoice", v),
            placeholder: "Pick invoice date",
            min: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Grace Period (days)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "number",
            min: 0,
            max: 60,
            value: draft.graceDays,
            onChange: (e) => set("graceDays", Number(e.target.value) || 0),
            className: "font-mono"
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Payment Method", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Select,
        {
          value: draft.paymentMethod,
          onValueChange: (v) => set("paymentMethod", v),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-2xl border-[#E5E5E5] bg-white text-[13px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Razorpay", children: "Razorpay" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Stripe", children: "Stripe" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Bank Transfer", children: "Bank Transfer" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Manual Invoice", children: "Manual Invoice" })
            ] })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-2xl border border-[#E5E5E5] bg-white px-3 py-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[13px] font-semibold text-black", children: "Auto-charge on cycle" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-black/55", children: "Attempt the configured method on invoice date" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: draft.autoCharge, onCheckedChange: (v) => set("autoCharge", v) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-[#E5E5E5] bg-[#F4F4F5] p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: "Projected next invoice" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-1.5 text-[12px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SummaryRow,
            {
              label: `Subtotal · ${tenant.students.toLocaleString()} × ${sym}${draft.ratePerStudent}`,
              value: `${sym}${grossPerCycle.toLocaleString()}`
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SummaryRow,
            {
              label: `Discount · ${draft.discountPercent}%`,
              value: `− ${sym}${Math.round(discount).toLocaleString()}`
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SummaryRow,
            {
              label: `Tax · ${draft.taxPercent}%`,
              value: `+ ${sym}${Math.round(tax).toLocaleString()}`
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-2 border-t border-black/10" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SummaryRow,
            {
              label: "Total billed",
              value: `${sym}${Math.round(total).toLocaleString()}`,
              emphasised: true
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-auto flex items-center justify-between gap-3 border-t border-[#E5E5E5] bg-[#F4F4F5] px-6 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: onClose,
          className: "inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-[12px] font-semibold text-black/75",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" }),
            " Cancel"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: submit,
          className: "inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-black/85",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3.5 w-3.5" }),
            " Save Billing Rules"
          ]
        }
      )
    ] })
  ] }) });
}
function SummaryRow({
  label,
  value,
  emphasised
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `flex items-center justify-between ${emphasised ? "text-[14px] font-semibold text-black" : "text-black/65"}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: value })
      ]
    }
  );
}
function AuditLogsDrawer({ tenant, onClose }) {
  const [events, setEvents] = reactExports.useState([]);
  const [severityFilter, setSeverityFilter] = reactExports.useState("all");
  const [searchValue, setSearchValue] = reactExports.useState("");
  const [refreshTick, setRefreshTick] = reactExports.useState(0);
  const scrollRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!tenant) return;
    setEvents(buildAuditLog(tenant));
    setSeverityFilter("all");
    setSearchValue("");
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tenant, refreshTick]);
  if (!tenant) return null;
  const visible = events.filter((e) => {
    if (severityFilter !== "all" && e.severity !== severityFilter) return false;
    if (searchValue && !`${e.actor} ${e.action} ${e.detail} ${e.ip}`.toLowerCase().includes(searchValue.toLowerCase()))
      return false;
    return true;
  });
  const counts = {
    info: events.filter((e) => e.severity === "info").length,
    success: events.filter((e) => e.severity === "success").length,
    warning: events.filter((e) => e.severity === "warning").length,
    error: events.filter((e) => e.severity === "error").length
  };
  const exportCsv = () => {
    const header = ["timestamp", "severity", "actor", "action", "ip", "detail"];
    const rows = visible.map(
      (e) => [e.ts, e.severity, e.actor, e.action, e.ip, e.detail].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${tenant.subdomain}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported", {
      description: `${visible.length} events · CSV downloaded`
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Sheet, { open: !!tenant, onOpenChange: (v) => !v && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { className: "flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[680px]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetHeader, { className: "border-b border-[#E5E5E5] bg-[#F4F4F5] px-6 py-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { className: "text-[18px] font-semibold text-black", children: "Audit Connection Logs" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetDescription, { className: "text-[12px] text-black/55", children: [
        tenant.name,
        " · ",
        tenant.subdomain,
        ".schoolaccounts.in"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 border-b border-[#E5E5E5] bg-white px-6 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/40" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: searchValue,
            onChange: (e) => setSearchValue(e.target.value),
            placeholder: "Search actor, action, IP, payload…",
            className: "h-9 rounded-full border-[#E5E5E5] bg-[#F4F4F5] pl-8 text-[12px]"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => setRefreshTick((n) => n + 1),
          className: "inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 py-2 text-[11.5px] font-semibold text-black/75 transition hover:border-black/30",
          title: "Reload latest events",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCw, { className: "h-3.5 w-3.5" }),
            " Refresh"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: exportCsv,
          className: "inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-2 text-[11.5px] font-semibold text-white transition hover:bg-black/85",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3.5 w-3.5" }),
            " Export CSV"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-1.5 border-b border-[#E5E5E5] bg-white px-6 py-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-black/45", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Funnel, { className: "h-3 w-3" }),
        " Severity"
      ] }),
      ["all", "info", "success", "warning", "error"].map((s) => {
        const sel = severityFilter === s;
        const count = s === "all" ? events.length : counts[s] ?? 0;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => setSeverityFilter(s),
            className: `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize transition ${sel ? "border-transparent bg-black text-white" : "border-[#E5E5E5] bg-white text-black/65 hover:border-black/30"}`,
            children: [
              s,
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: `rounded-full px-1.5 text-[10px] font-mono ${sel ? "bg-white/15" : "bg-[#F4F4F5] text-black/60"}`,
                  children: count
                }
              )
            ]
          },
          s
        );
      })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: scrollRef, className: "flex-1 overflow-y-auto bg-[#FAFAFA] px-6 py-4", children: visible.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-16 text-center text-[12.5px] text-black/55", children: "No events match the current filters." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: visible.map((e, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "li",
      {
        className: "rounded-2xl border border-[#E5E5E5] bg-white px-3.5 py-3",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SeverityBadge, { severity: e.severity }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-baseline justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[13px] font-semibold leading-tight text-black", children: e.action }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-[10.5px] text-black/45", children: e.ts })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[12px] text-black/65", children: e.detail }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[10.5px] text-black/55", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-[#F4F4F5] px-2 py-0.5", children: e.actor }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-[#F4F4F5] px-2 py-0.5", children: e.ip })
            ] })
          ] })
        ] })
      },
      `${e.ts}-${i}`
    )) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-t border-[#E5E5E5] bg-[#F4F4F5] px-6 py-3 text-[11.5px] text-black/60", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "Showing ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-black", children: visible.length }),
        " of ",
        events.length,
        " ",
        "events"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: onClose,
          className: "inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-black/75",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" }),
            " Close"
          ]
        }
      )
    ] })
  ] }) });
}
function SeverityBadge({ severity }) {
  const style = {
    info: { bg: "bg-sky-100", fg: "text-sky-700", Icon: Info, label: "Info" },
    success: {
      bg: "bg-emerald-100",
      fg: "text-emerald-700",
      Icon: CircleCheck,
      label: "OK"
    },
    warning: {
      bg: "bg-amber-100",
      fg: "text-amber-700",
      Icon: TriangleAlert,
      label: "Warn"
    },
    error: { bg: "bg-rose-100", fg: "text-rose-700", Icon: CircleAlert, label: "Error" }
  };
  const s = style[severity];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "span",
    {
      className: `mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${s.bg} ${s.fg}`,
      title: s.label,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(s.Icon, { className: "h-3.5 w-3.5" })
    }
  );
}
function Field({ label, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[11px] font-semibold uppercase tracking-wider text-black/55", children: label }),
    children
  ] });
}
function TenantsPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(TenantsView, { onImpersonate: (name) => toast.warning("Impersonation requires a tenant session", {
    description: `Sign in directly as the ${name} tenant admin from /login.`
  }) });
}
export {
  TenantsPage as component
};
