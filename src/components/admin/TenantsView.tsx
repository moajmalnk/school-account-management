import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  KeyRound,
  FileText,
  ScrollText,
  Pencil,
  X,
  Save,
  RotateCw,
  Download,
  Filter as FilterIcon,
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { seedTenants, type Tenant, type Tier, type Status } from "./data";
import { OrganicCard } from "@/components/ui/organic-card";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Tone, CornerSide } from "@/lib/utils";

const TIER_STYLE: Record<Tier, { bg: string; fg: string }> = {
  Basic: { bg: "#F4F4F5", fg: "#000000" },
  Premium: { bg: "#E1F2AE", fg: "#000000" },
  Enterprise: { bg: "#000000", fg: "#FFFFFF" },
};
const STATUS_STYLE: Record<Status, { bg: string; fg: string; dot: string }> = {
  Active: { bg: "#F4F4F5", fg: "#000000", dot: "#000000" },
  Trial: { bg: "#E1F2AE", fg: "#000000", dot: "#000000" },
  Overdue: { bg: "#000000", fg: "#C7F33C", dot: "#C7F33C" },
  Suspended: { bg: "#FEE2E2", fg: "#B91C1C", dot: "#B91C1C" },
};
const STATUS_TONE: Record<Status, Tone> = {
  Active: "white",
  Trial: "white",
  Overdue: "lime",
  Suspended: "black",
};

type BillingCycle = "Monthly" | "Quarterly" | "Annual";
type Currency = "INR" | "USD" | "EUR";
type PaymentMethod = "Razorpay" | "Stripe" | "Bank Transfer" | "Manual Invoice";

type BillingRule = {
  cycle: BillingCycle;
  ratePerStudent: number;
  currency: Currency;
  autoCharge: boolean;
  taxPercent: number;
  discountPercent: number;
  nextInvoice: string;
  paymentMethod: PaymentMethod;
  graceDays: number;
};

const CURRENCY_SYMBOL: Record<Currency, string> = { INR: "₹", USD: "$", EUR: "€" };

function defaultBilling(t: Tenant): BillingRule {
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
    graceDays: 7,
  };
}

type AuditEvent = {
  ts: string;
  severity: "info" | "success" | "warning" | "error";
  actor: string;
  action: string;
  ip: string;
  detail: string;
};

function pseudoRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
}

const AUDIT_TEMPLATES: { action: string; severity: AuditEvent["severity"]; detail: string }[] = [
  { action: "Admin login (SSO)", severity: "success", detail: "okta.org" },
  { action: "Bulk fee import", severity: "info", detail: "1,243 rows · 0 errors" },
  { action: "Webhook delivery", severity: "success", detail: "razorpay → payment.captured 200" },
  {
    action: "Webhook delivery failure",
    severity: "error",
    detail: "stripe 5xx · auto-retry queued",
  },
  { action: "Role escalation", severity: "warning", detail: "support@platform → tenant.owner" },
  { action: "DNS cutover", severity: "info", detail: "CNAME apex → edge.schoolaccounts.in" },
  { action: "Invoice generated", severity: "success", detail: "INV-92831 · ₹ 4,28,000" },
  { action: "Storage threshold", severity: "warning", detail: "82% of 50 GB used" },
  { action: "Failed login burst", severity: "error", detail: "12 attempts · 49.207.x.x" },
  { action: "Backup snapshot", severity: "success", detail: "pg-dump 248 MB · 2.4s" },
  { action: "API key rotated", severity: "info", detail: "sk_live_***47 → sk_live_***ab" },
  { action: "Schema migration", severity: "info", detail: "v202604.02 · 19 tables touched" },
];

function buildAuditLog(t: Tenant, count = 18): AuditEvent[] {
  const rand = pseudoRandom(t.uuid);
  const events: AuditEvent[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const tpl = AUDIT_TEMPLATES[Math.floor(rand() * AUDIT_TEMPLATES.length)];
    const minutesAgo = Math.floor(rand() * 60 * 24 * 6) + i * 13;
    const ts = new Date(now.getTime() - minutesAgo * 60_000);
    const actorPool = [
      "Rohan Mehta",
      "Anika Roy",
      "Priya Subramanian",
      "Devanand Iyer",
      "system.scheduler",
      "webhook.gateway",
    ];
    const actor = actorPool[Math.floor(rand() * actorPool.length)];
    const ip = `${49 + Math.floor(rand() * 50)}.${Math.floor(rand() * 256)}.${Math.floor(rand() * 256)}.${Math.floor(rand() * 256)}`;
    events.push({
      ts: ts.toISOString().replace("T", " ").slice(0, 19),
      severity: tpl.severity,
      actor,
      action: tpl.action,
      ip,
      detail: tpl.detail,
    });
  }
  return events.sort((a, b) => (a.ts < b.ts ? 1 : -1));
}

export function TenantsView({ onImpersonate }: { onImpersonate?: (name: string) => void } = {}) {
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>(seedTenants);
  const [billingMap, setBillingMap] = useState<Record<string, BillingRule>>({});
  const [editTarget, setEditTarget] = useState<Tenant | null>(null);
  const [billingTarget, setBillingTarget] = useState<Tenant | null>(null);
  const [auditTarget, setAuditTarget] = useState<Tenant | null>(null);

  const filtered = useMemo(() => {
    return tenants.filter((t) => {
      if (tier !== "all" && t.tier !== tier) return false;
      if (status !== "all" && t.status !== status) return false;
      if (query && !`${t.name} ${t.subdomain} ${t.id}`.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [tenants, tier, status, query]);

  const updateTenant = (id: string, patch: Partial<Tenant>) => {
    setTenants((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };
  const upsertBilling = (id: string, rule: BillingRule) => {
    setBillingMap((prev) => ({ ...prev, [id]: rule }));
  };
  const getBilling = (t: Tenant) => billingMap[t.id] ?? defaultBilling(t);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-heading">School Tenants Registry</h1>
          <p className="mt-2 text-[14px] text-black/55">
            {filtered.length} of {tenants.length} tenants · isolated routing keys, provisioning
            &amp; billing
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] transition hover:bg-black/85 sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Provision New School Tenant
        </button>
      </div>

      {/* Filters */}
      <OrganicCard
        tone="white"
        cornerSide="tr"
        className="flex flex-col gap-2.5 p-3.5 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <div className="relative w-full min-w-0 flex-1 sm:min-w-[260px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by school, subdomain, or tenant ID…"
            className="h-11 rounded-full border-[#E5E5E5] bg-[#F4F4F5] pl-9 text-[13px] sm:h-10"
          />
        </div>
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger className="h-11 w-full rounded-full border-[#E5E5E5] bg-[#F4F4F5] text-[12px] sm:h-10 sm:w-[170px]">
            <SelectValue placeholder="All packages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All packages</SelectItem>
            <SelectItem value="Basic">Basic</SelectItem>
            <SelectItem value="Premium">Premium</SelectItem>
            <SelectItem value="Enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-11 w-full rounded-full border-[#E5E5E5] bg-[#F4F4F5] text-[12px] sm:h-10 sm:w-[170px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Trial">Trial</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </OrganicCard>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((t, i) => {
          const pct = Math.round((t.students / t.capacity) * 100);
          const tStyle = TIER_STYLE[t.tier];
          const sStyle = STATUS_STYLE[t.status];
          const tone = STATUS_TONE[t.status];
          const cornerSide: CornerSide = i % 2 === 0 ? "tr" : "bl";
          const isLight = tone === "white";
          const isLime = tone === "lime";
          const isBlack = tone === "black";
          const subText = isBlack ? "text-white/70" : isLime ? "text-black/70" : "text-black/55";
          return (
            <OrganicCard
              key={t.id}
              tone={tone}
              cornerSide={cornerSide}
              padded
              className="space-y-4"
            >
              <div>
                <div className="text-[15px] font-semibold leading-tight">{t.name}</div>
                <div className={`mt-1 font-mono text-[11px] ${subText}`}>
                  {t.id} · {t.uuid}
                </div>
                <div
                  className={`mt-0.5 font-mono text-[11px] ${isBlack ? "text-[#C7F33C]" : "text-black/65"}`}
                >
                  {t.subdomain}.schoolaccounts.in
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ backgroundColor: tStyle.bg, color: tStyle.fg }}
                >
                  {t.tier}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ backgroundColor: sStyle.bg, color: sStyle.fg }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: sStyle.dot }}
                  />
                  {t.status}
                </span>
              </div>

              <div>
                <div
                  className={`flex items-center justify-between font-mono text-[11px] ${subText}`}
                >
                  <span>
                    {t.students.toLocaleString()} / {t.capacity.toLocaleString()}
                  </span>
                  <span>{pct}%</span>
                </div>
                <div
                  className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${
                    isBlack ? "bg-white/15" : isLime ? "bg-black/15" : "bg-[#F4F4F5]"
                  }`}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isLime
                        ? "#000000"
                        : isBlack
                          ? "#C7F33C"
                          : pct > 90
                            ? "#000000"
                            : pct > 70
                              ? "#C7F33C"
                              : "#000000",
                    }}
                  />
                </div>
              </div>

              <div
                className={`flex flex-wrap items-center justify-between gap-2 border-t pt-3 ${
                  isBlack ? "border-white/10" : isLime ? "border-black/10" : "border-black/8"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <TenantAction
                    icon={Pencil}
                    label="Edit Tenant Meta"
                    tone={tone}
                    onClick={() => setEditTarget(t)}
                  />
                  <TenantAction
                    icon={FileText}
                    label="Alter Billing Rules"
                    tone={tone}
                    onClick={() => setBillingTarget(t)}
                  />
                  <TenantAction
                    icon={ScrollText}
                    label="Audit Connection Logs"
                    tone={tone}
                    onClick={() => setAuditTarget(t)}
                  />
                </div>
                <button
                  onClick={() => onImpersonate?.(t.name)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold shadow-[0_6px_18px_-10px_rgba(0,0,0,0.5)] transition-colors ${
                    isBlack
                      ? "bg-[#C7F33C] text-black hover:bg-white"
                      : isLime
                        ? "bg-black text-white hover:bg-black/85"
                        : "bg-black text-white hover:bg-black/85"
                  }`}
                >
                  <KeyRound className="h-3 w-3" /> Impersonate
                </button>
              </div>
            </OrganicCard>
          );
        })}
        {filtered.length === 0 && (
          <OrganicCard tone="white" cornerSide="tr" padded className="md:col-span-2 xl:col-span-3">
            <div className="py-10 text-center text-[13px] text-black/55">
              No tenants match the current filters.
            </div>
          </OrganicCard>
        )}
      </div>

      <TenantFormDrawer
        open={open}
        onOpenChange={setOpen}
        onCreate={(t) => setTenants((prev) => [t, ...prev])}
      />

      <EditTenantDrawer
        tenant={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={(patch) => {
          if (!editTarget) return;
          updateTenant(editTarget.id, patch);
          toast.success("Tenant meta updated", {
            description: `${patch.name ?? editTarget.name} · ${patch.subdomain ?? editTarget.subdomain}.schoolaccounts.in`,
          });
          setEditTarget(null);
        }}
      />

      <BillingRulesDrawer
        tenant={billingTarget}
        rule={billingTarget ? getBilling(billingTarget) : null}
        onClose={() => setBillingTarget(null)}
        onSave={(rule) => {
          if (!billingTarget) return;
          upsertBilling(billingTarget.id, rule);
          toast.success("Billing rules saved", {
            description: `${billingTarget.name} · ${rule.cycle} · ${CURRENCY_SYMBOL[rule.currency]}${rule.ratePerStudent}/student`,
          });
          setBillingTarget(null);
        }}
      />

      <AuditLogsDrawer tenant={auditTarget} onClose={() => setAuditTarget(null)} />
    </div>
  );
}

function TenantAction({
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  icon: typeof Pencil;
  label: string;
  tone: Tone;
  onClick: () => void;
}) {
  const palette =
    tone === "black"
      ? "bg-white/10 text-white hover:bg-white hover:text-black"
      : tone === "lime"
        ? "bg-black/10 text-black hover:bg-black hover:text-white"
        : "bg-[#F4F4F5] text-black/70 hover:bg-black hover:text-white";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${palette}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function TenantFormDrawer({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (t: Tenant) => void;
}) {
  const [legalName, setLegalName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [contact, setContact] = useState("");
  const [gstin, setGstin] = useState("");
  const [students, setStudents] = useState(500);
  const [faculty, setFaculty] = useState(40);
  const [tier, setTier] = useState<Tier>("Premium");
  const [customDomain, setCustomDomain] = useState(false);
  const [apex, setApex] = useState("");

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
      uuid:
        Math.random().toString(16).slice(2, 6) +
        "-" +
        Math.random().toString(16).slice(2, 6) +
        "-4f00-aaaa",
      name: legalName,
      subdomain: slug,
      tier,
      status: "Trial",
      students: 0,
      capacity: students,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[520px]">
        <SheetHeader className="border-b border-[#E5E5E5] bg-[#F4F4F5] px-6 py-5">
          <SheetTitle className="text-[18px] font-semibold text-black">
            Provision New School Tenant
          </SheetTitle>
          <SheetDescription className="text-[12px] text-black/55">
            Creates an isolated database routing key &amp; super-user.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 py-5">
          <Field label="Business Entity Legal Name">
            <Input
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="e.g. Silver Hills Educational Trust"
            />
          </Field>

          <Field label="Subdomain Routing Slug">
            <div className="flex items-stretch overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white focus-within:ring-2 focus-within:ring-black/10">
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="silverhills"
                className="flex-1 bg-transparent px-3 py-2 font-mono text-[13px] outline-none"
              />
              <span className="grid place-items-center bg-[#F4F4F5] px-3 font-mono text-[12px] text-black/55">
                .schoolaccounts.in
              </span>
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Administrator Full Name">
              <Input
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Anika Roy"
              />
            </Field>
            <Field label="Administrator Email">
              <Input
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@school.in"
                type="email"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Contact String">
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+91 98XXXXXXXX"
              />
            </Field>
            <Field label="Tax ID / GSTIN">
              <Input
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="29ABCDE1234F1Z5"
                className="font-mono"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Student Seat Limit">
              <Input
                type="number"
                value={students}
                onChange={(e) => setStudents(Number(e.target.value) || 0)}
                className="font-mono"
              />
            </Field>
            <Field label="Faculty Roster Cap">
              <Input
                type="number"
                value={faculty}
                onChange={(e) => setFaculty(Number(e.target.value) || 0)}
                className="font-mono"
              />
            </Field>
          </div>

          <Field label="Subscription Tier">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(["Basic", "Premium", "Enterprise"] as Tier[]).map((tt) => {
                const sel = tier === tt;
                return (
                  <button
                    key={tt}
                    onClick={() => setTier(tt)}
                    className={`rounded-full border px-3 py-2 text-[12px] font-semibold transition ${
                      sel
                        ? "border-transparent bg-[#C7F33C] text-black shadow-sm"
                        : "border-[#E5E5E5] bg-white text-black/65 hover:border-black/30"
                    }`}
                  >
                    {tt}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="rounded-2xl border border-[#E5E5E5] bg-[#F4F4F5] p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-semibold text-black">Custom Root Domain</div>
                <div className="text-[11px] text-black/55">
                  Route via tenant's own apex (e.g. accounts.school.edu)
                </div>
              </div>
              <Switch checked={customDomain} onCheckedChange={setCustomDomain} />
            </div>
            {customDomain && (
              <Input
                value={apex}
                onChange={(e) => setApex(e.target.value)}
                placeholder="accounts.emeraldacademy.edu"
                className="mt-3 font-mono"
              />
            )}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#E5E5E5] bg-[#F4F4F5] px-6 py-4">
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-[12px] font-semibold text-black/75"
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
          <button
            onClick={submit}
            className="rounded-full bg-black px-5 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-black/85"
          >
            Provision Tenant
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function EditTenantDrawer({
  tenant,
  onClose,
  onSave,
}: {
  tenant: Tenant | null;
  onClose: () => void;
  onSave: (patch: Partial<Tenant>) => void;
}) {
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [tier, setTier] = useState<Tier>("Basic");
  const [status, setStatus] = useState<Status>("Active");
  const [capacity, setCapacity] = useState(0);

  useEffect(() => {
    if (!tenant) return;
    setName(tenant.name);
    setSubdomain(tenant.subdomain);
    setTier(tenant.tier);
    setStatus(tenant.status);
    setCapacity(tenant.capacity);
  }, [tenant]);

  if (!tenant) return null;
  const dirty =
    name !== tenant.name ||
    subdomain !== tenant.subdomain ||
    tier !== tenant.tier ||
    status !== tenant.status ||
    capacity !== tenant.capacity;

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
        description: `${tenant.students.toLocaleString()} students currently provisioned.`,
      });
      return;
    }
    onSave({ name: name.trim(), subdomain: subdomain.trim(), tier, status, capacity });
  };

  return (
    <Sheet open={!!tenant} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[520px]">
        <SheetHeader className="border-b border-[#E5E5E5] bg-[#F4F4F5] px-6 py-5">
          <SheetTitle className="text-[18px] font-semibold text-black">Edit Tenant Meta</SheetTitle>
          <SheetDescription className="text-[12px] text-black/55">
            {tenant.id} · {tenant.uuid}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 py-5">
          <Field label="Business Entity Legal Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>

          <Field label="Subdomain Routing Slug">
            <div className="flex items-stretch overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white focus-within:ring-2 focus-within:ring-black/10">
              <input
                value={subdomain}
                onChange={(e) =>
                  setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                className="flex-1 bg-transparent px-3 py-2 font-mono text-[13px] outline-none"
              />
              <span className="grid place-items-center bg-[#F4F4F5] px-3 font-mono text-[12px] text-black/55">
                .schoolaccounts.in
              </span>
            </div>
          </Field>

          <Field label="Subscription Tier">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(["Basic", "Premium", "Enterprise"] as Tier[]).map((tt) => {
                const sel = tier === tt;
                return (
                  <button
                    key={tt}
                    type="button"
                    onClick={() => setTier(tt)}
                    className={`rounded-full border px-3 py-2 text-[12px] font-semibold transition ${
                      sel
                        ? "border-transparent bg-[#C7F33C] text-black shadow-sm"
                        : "border-[#E5E5E5] bg-white text-black/65 hover:border-black/30"
                    }`}
                  >
                    {tt}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Lifecycle Status">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["Active", "Trial", "Overdue", "Suspended"] as Status[]).map((ss) => {
                const sel = status === ss;
                return (
                  <button
                    key={ss}
                    type="button"
                    onClick={() => setStatus(ss)}
                    className={`rounded-full border px-2.5 py-2 text-[11.5px] font-semibold transition ${
                      sel
                        ? "border-transparent bg-black text-white shadow-sm"
                        : "border-[#E5E5E5] bg-white text-black/65 hover:border-black/30"
                    }`}
                  >
                    {ss}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label={`Student Seat Capacity · current ${tenant.students.toLocaleString()}`}>
            <Input
              type="number"
              min={tenant.students}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value) || 0)}
              className="font-mono"
            />
          </Field>

          <div className="flex items-center gap-2 rounded-2xl border border-[#E5E5E5] bg-[#F4F4F5] px-3 py-2.5 text-[11.5px] text-black/65">
            <Info className="h-3.5 w-3.5 shrink-0 text-black/45" />
            Updates write to the tenant&apos;s metadata store. The routing key is rebuilt
            automatically on subdomain change.
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#E5E5E5] bg-[#F4F4F5] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-[12px] font-semibold text-black/75"
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!dirty}
            className="inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/30"
          >
            <Save className="h-3.5 w-3.5" /> Save Changes
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function BillingRulesDrawer({
  tenant,
  rule,
  onClose,
  onSave,
}: {
  tenant: Tenant | null;
  rule: BillingRule | null;
  onClose: () => void;
  onSave: (rule: BillingRule) => void;
}) {
  const [draft, setDraft] = useState<BillingRule | null>(null);

  useEffect(() => {
    if (rule) setDraft(rule);
  }, [rule]);

  if (!tenant || !draft) return null;

  const set = <K extends keyof BillingRule>(k: K, v: BillingRule[K]) =>
    setDraft((prev) => (prev ? { ...prev, [k]: v } : prev));

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

  return (
    <Sheet open={!!tenant} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[560px]">
        <SheetHeader className="border-b border-[#E5E5E5] bg-[#F4F4F5] px-6 py-5">
          <SheetTitle className="text-[18px] font-semibold text-black">
            Alter Billing Rules
          </SheetTitle>
          <SheetDescription className="text-[12px] text-black/55">
            {tenant.name} · {tenant.tier} · {tenant.students.toLocaleString()} active seats
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 py-5">
          <Field label="Billing Cycle">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(["Monthly", "Quarterly", "Annual"] as BillingCycle[]).map((c) => {
                const sel = draft.cycle === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("cycle", c)}
                    className={`rounded-full border px-3 py-2 text-[12px] font-semibold transition ${
                      sel
                        ? "border-transparent bg-[#C7F33C] text-black shadow-sm"
                        : "border-[#E5E5E5] bg-white text-black/65 hover:border-black/30"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={`Rate / student (${sym})`}>
              <Input
                type="number"
                min={0}
                value={draft.ratePerStudent}
                onChange={(e) => set("ratePerStudent", Number(e.target.value) || 0)}
                className="font-mono"
              />
            </Field>
            <Field label="Currency">
              <Select value={draft.currency} onValueChange={(v) => set("currency", v as Currency)}>
                <SelectTrigger className="h-10 rounded-2xl border-[#E5E5E5] bg-white text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR · ₹</SelectItem>
                  <SelectItem value="USD">USD · $</SelectItem>
                  <SelectItem value="EUR">EUR · €</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Tax / GST %">
              <Input
                type="number"
                min={0}
                max={50}
                value={draft.taxPercent}
                onChange={(e) => set("taxPercent", Number(e.target.value) || 0)}
                className="font-mono"
              />
            </Field>
            <Field label="Discount %">
              <Input
                type="number"
                min={0}
                max={100}
                value={draft.discountPercent}
                onChange={(e) => set("discountPercent", Number(e.target.value) || 0)}
                className="font-mono"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Next Invoice Date">
              <DatePicker
                value={draft.nextInvoice}
                onChange={(v) => set("nextInvoice", v)}
                placeholder="Pick invoice date"
                min={new Date().toISOString().slice(0, 10)}
              />
            </Field>
            <Field label="Grace Period (days)">
              <Input
                type="number"
                min={0}
                max={60}
                value={draft.graceDays}
                onChange={(e) => set("graceDays", Number(e.target.value) || 0)}
                className="font-mono"
              />
            </Field>
          </div>

          <Field label="Payment Method">
            <Select
              value={draft.paymentMethod}
              onValueChange={(v) => set("paymentMethod", v as PaymentMethod)}
            >
              <SelectTrigger className="h-10 rounded-2xl border-[#E5E5E5] bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Razorpay">Razorpay</SelectItem>
                <SelectItem value="Stripe">Stripe</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Manual Invoice">Manual Invoice</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="flex items-center justify-between rounded-2xl border border-[#E5E5E5] bg-white px-3 py-2.5">
            <div>
              <div className="text-[13px] font-semibold text-black">Auto-charge on cycle</div>
              <div className="text-[11px] text-black/55">
                Attempt the configured method on invoice date
              </div>
            </div>
            <Switch checked={draft.autoCharge} onCheckedChange={(v) => set("autoCharge", v)} />
          </div>

          <div className="rounded-2xl border border-[#E5E5E5] bg-[#F4F4F5] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
              Projected next invoice
            </div>
            <div className="mt-3 space-y-1.5 text-[12px]">
              <SummaryRow
                label={`Subtotal · ${tenant.students.toLocaleString()} × ${sym}${draft.ratePerStudent}`}
                value={`${sym}${grossPerCycle.toLocaleString()}`}
              />
              <SummaryRow
                label={`Discount · ${draft.discountPercent}%`}
                value={`− ${sym}${Math.round(discount).toLocaleString()}`}
              />
              <SummaryRow
                label={`Tax · ${draft.taxPercent}%`}
                value={`+ ${sym}${Math.round(tax).toLocaleString()}`}
              />
              <div className="my-2 border-t border-black/10" />
              <SummaryRow
                label="Total billed"
                value={`${sym}${Math.round(total).toLocaleString()}`}
                emphasised
              />
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#E5E5E5] bg-[#F4F4F5] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-[12px] font-semibold text-black/75"
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-black/85"
          >
            <Save className="h-3.5 w-3.5" /> Save Billing Rules
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SummaryRow({
  label,
  value,
  emphasised,
}: {
  label: string;
  value: string;
  emphasised?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${emphasised ? "text-[14px] font-semibold text-black" : "text-black/65"}`}
    >
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function AuditLogsDrawer({ tenant, onClose }: { tenant: Tenant | null; onClose: () => void }) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [severityFilter, setSeverityFilter] = useState<"all" | AuditEvent["severity"]>("all");
  const [searchValue, setSearchValue] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!tenant) return;
    setEvents(buildAuditLog(tenant));
    setSeverityFilter("all");
    setSearchValue("");
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tenant, refreshTick]);

  if (!tenant) return null;

  const visible = events.filter((e) => {
    if (severityFilter !== "all" && e.severity !== severityFilter) return false;
    if (
      searchValue &&
      !`${e.actor} ${e.action} ${e.detail} ${e.ip}`
        .toLowerCase()
        .includes(searchValue.toLowerCase())
    )
      return false;
    return true;
  });

  const counts: Record<AuditEvent["severity"], number> = {
    info: events.filter((e) => e.severity === "info").length,
    success: events.filter((e) => e.severity === "success").length,
    warning: events.filter((e) => e.severity === "warning").length,
    error: events.filter((e) => e.severity === "error").length,
  };

  const exportCsv = () => {
    const header = ["timestamp", "severity", "actor", "action", "ip", "detail"];
    const rows = visible.map((e) =>
      [e.ts, e.severity, e.actor, e.action, e.ip, e.detail]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${tenant.subdomain}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported", {
      description: `${visible.length} events · CSV downloaded`,
    });
  };

  return (
    <Sheet open={!!tenant} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[680px]">
        <SheetHeader className="border-b border-[#E5E5E5] bg-[#F4F4F5] px-6 py-5">
          <SheetTitle className="text-[18px] font-semibold text-black">
            Audit Connection Logs
          </SheetTitle>
          <SheetDescription className="text-[12px] text-black/55">
            {tenant.name} · {tenant.subdomain}.schoolaccounts.in
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-2 border-b border-[#E5E5E5] bg-white px-6 py-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/40" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search actor, action, IP, payload…"
              className="h-9 rounded-full border-[#E5E5E5] bg-[#F4F4F5] pl-8 text-[12px]"
            />
          </div>
          <button
            type="button"
            onClick={() => setRefreshTick((n) => n + 1)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 py-2 text-[11.5px] font-semibold text-black/75 transition hover:border-black/30"
            title="Reload latest events"
          >
            <RotateCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-2 text-[11.5px] font-semibold text-white transition hover:bg-black/85"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E5E5E5] bg-white px-6 py-2.5">
          <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-black/45">
            <FilterIcon className="h-3 w-3" /> Severity
          </span>
          {(["all", "info", "success", "warning", "error"] as const).map((s) => {
            const sel = severityFilter === s;
            const count =
              s === "all" ? events.length : (counts[s as Exclude<typeof s, "all">] ?? 0);
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSeverityFilter(s)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                  sel
                    ? "border-transparent bg-black text-white"
                    : "border-[#E5E5E5] bg-white text-black/65 hover:border-black/30"
                }`}
              >
                {s}
                <span
                  className={`rounded-full px-1.5 text-[10px] font-mono ${sel ? "bg-white/15" : "bg-[#F4F4F5] text-black/60"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#FAFAFA] px-6 py-4">
          {visible.length === 0 ? (
            <div className="grid place-items-center py-16 text-center text-[12.5px] text-black/55">
              No events match the current filters.
            </div>
          ) : (
            <ul className="space-y-2">
              {visible.map((e, i) => (
                <li
                  key={`${e.ts}-${i}`}
                  className="rounded-2xl border border-[#E5E5E5] bg-white px-3.5 py-3"
                >
                  <div className="flex items-start gap-3">
                    <SeverityBadge severity={e.severity} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="text-[13px] font-semibold leading-tight text-black">
                          {e.action}
                        </div>
                        <div className="font-mono text-[10.5px] text-black/45">{e.ts}</div>
                      </div>
                      <div className="mt-1 text-[12px] text-black/65">{e.detail}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[10.5px] text-black/55">
                        <span className="rounded-full bg-[#F4F4F5] px-2 py-0.5">{e.actor}</span>
                        <span className="rounded-full bg-[#F4F4F5] px-2 py-0.5">{e.ip}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#E5E5E5] bg-[#F4F4F5] px-6 py-3 text-[11.5px] text-black/60">
          <span>
            Showing <strong className="text-black">{visible.length}</strong> of {events.length}{" "}
            events
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-black/75"
          >
            <X className="h-3.5 w-3.5" /> Close
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SeverityBadge({ severity }: { severity: AuditEvent["severity"] }) {
  const style: Record<
    AuditEvent["severity"],
    { bg: string; fg: string; Icon: typeof Info; label: string }
  > = {
    info: { bg: "bg-sky-100", fg: "text-sky-700", Icon: Info, label: "Info" },
    success: {
      bg: "bg-emerald-100",
      fg: "text-emerald-700",
      Icon: CheckCircle2,
      label: "OK",
    },
    warning: {
      bg: "bg-amber-100",
      fg: "text-amber-700",
      Icon: AlertTriangle,
      label: "Warn",
    },
    error: { bg: "bg-rose-100", fg: "text-rose-700", Icon: CircleAlert, label: "Error" },
  };
  const s = style[severity];
  return (
    <span
      className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${s.bg} ${s.fg}`}
      title={s.label}
    >
      <s.Icon className="h-3.5 w-3.5" />
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
        {label}
      </Label>
      {children}
    </div>
  );
}
