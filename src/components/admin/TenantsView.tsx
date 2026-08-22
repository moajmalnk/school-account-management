import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Plus,
  Search,
  KeyRound,
  FileText,
  ScrollText,
  Pencil,
  Trash2,
  X,
  Save,
  RotateCw,
  Download,
  Filter as FilterIcon,
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Info,
  Loader2,
  Eye,
  EyeOff,
  Building2,
  Wallet,
  Activity,
  Shield,
  ExternalLink,
  GitBranch,
  GraduationCap,
  Users,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { type Tenant, type Tier, type Status } from "./data";
import {
  deleteSuperAdminTenant,
  fetchSuperAdminTenants,
  fetchSuperAdminTenantSnapshot,
  provisionSuperAdminTenant,
  updateSuperAdminTenant,
  type TenantWorkspaceSnapshot,
} from "@/lib/api/super-admin";
import { ApiError, getApiToken } from "@/lib/api/client";
import { TenantsViewSkeleton } from "@/components/admin/TenantsViewSkeleton";
import { PlatformInvoicesPanel } from "@/components/admin/PlatformInvoicesPanel";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Tone, CornerSide } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TIER_STYLE: Record<Tier, { bg: string; fg: string }> = {
  Basic: { bg: "#F4F4F5", fg: "#000000" },
  Premium: { bg: "#CCFBF1", fg: "#000000" },
  Enterprise: { bg: "#000000", fg: "#FFFFFF" },
};
const STATUS_STYLE: Record<Status, { bg: string; fg: string; dot: string }> = {
  Active: { bg: "#F4F4F5", fg: "#000000", dot: "#000000" },
  Trial: { bg: "#CCFBF1", fg: "#000000", dot: "#000000" },
  Overdue: { bg: "#000000", fg: "#EF4444", dot: "#EF4444" },
  Suspended: { bg: "#FEE2E2", fg: "#EF4444", dot: "#EF4444" },
};
/** Card surface follows subscription tier — same tones as Plans matrix. */
const TIER_TONE: Record<Tier, Tone> = {
  Basic: "white",
  Premium: "lime",
  Enterprise: "black",
};
const STATUS_TOOLTIP: Record<Status, string> = {
  Active:
    "School is live and in good standing. Staff can sign in and Impersonate is allowed.",
  Trial:
    "Limited evaluation period. Workspace works normally until the trial ends or you convert to Active.",
  Overdue:
    "Payment or renewal is past due. Access may be restricted until billing is cleared.",
  Suspended:
    "Account is locked. School login and Impersonate are blocked until you set Active or Trial.",
};

type BillingCycle = "Monthly" | "Quarterly" | "Annual";
type Currency = "INR" | "USD" | "EUR";
type PaymentMethod = "Razorpay" | "Stripe" | "Bank Transfer" | "Manual Invoice";
/** Per student = seats × rate. Flat cycle = fixed fee for the billing period. */
type PricingModel = "per_student" | "flat_cycle";

type BillingRule = {
  cycle: BillingCycle;
  pricingModel: PricingModel;
  /** Per-student rate, or flat fee for the billing cycle when pricingModel is flat_cycle. */
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

const PRICING_MODEL_LABEL: Record<PricingModel, string> = {
  per_student: "Per student",
  flat_cycle: "Flat per cycle",
};

function cycleUnitLabel(cycle: BillingCycle): string {
  if (cycle === "Quarterly") return "quarter";
  if (cycle === "Annual") return "year";
  return "month";
}

function rateFieldLabel(rule: BillingRule, sym: string): string {
  if (rule.pricingModel === "flat_cycle") {
    return `Flat rate / ${cycleUnitLabel(rule.cycle)} (${sym})`;
  }
  return `Rate / student (${sym})`;
}

function billingGross(rule: BillingRule, students: number): number {
  if (rule.pricingModel === "flat_cycle") return Math.max(0, rule.ratePerStudent);
  return rule.ratePerStudent * Math.max(students, 1);
}

function billingRateDescription(rule: BillingRule, sym: string): string {
  if (rule.pricingModel === "flat_cycle") {
    return `${sym}${rule.ratePerStudent}/${cycleUnitLabel(rule.cycle)} flat`;
  }
  return `${sym}${rule.ratePerStudent}/student`;
}

function defaultBilling(t: Tenant): BillingRule {
  const created = new Date(t.createdAt);
  const next = new Date(created);
  const monthsAhead = t.tier === "Enterprise" ? 12 : t.tier === "Premium" ? 3 : 1;
  next.setMonth(next.getMonth() + monthsAhead);
  return {
    cycle: t.tier === "Enterprise" ? "Annual" : t.tier === "Premium" ? "Quarterly" : "Monthly",
    pricingModel: "per_student",
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

export function TenantsView({
  onImpersonate,
}: { onImpersonate?: (tenant: Tenant) => void } = {}) {
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingMap, setBillingMap] = useState<Record<string, BillingRule>>({});
  const [editTarget, setEditTarget] = useState<Tenant | null>(null);
  const [billingTarget, setBillingTarget] = useState<Tenant | null>(null);
  const [auditTarget, setAuditTarget] = useState<Tenant | null>(null);
  const [detailTarget, setDetailTarget] = useState<Tenant | null>(null);
  const [detailTab, setDetailTab] = useState("overview");
  const [pendingDelete, setPendingDelete] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!getApiToken()) {
          throw new ApiError("Not authenticated to API — log in again", 401);
        }
        const list = await fetchSuperAdminTenants();
        if (!cancelled) setTenants(list);
      } catch (err) {
        if (!cancelled) {
          setTenants([]);
          const msg =
            err instanceof ApiError ? err.message : "Failed to load tenants";
          toast.error("Could not load tenants", {
            description: msg,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
  const getBilling = (t: Tenant): BillingRule => {
    const base = billingMap[t.id] ?? defaultBilling(t);
    return {
      ...base,
      pricingModel: base.pricingModel ?? "per_student",
    };
  };

  const confirmDeleteTenant = async () => {
    if (!pendingDelete || deleting) return;
    const target = pendingDelete;
    setDeleting(true);
    try {
      if (!getApiToken()) {
        throw new ApiError("Not authenticated to API — log in again", 401);
      }
      await deleteSuperAdminTenant(target.id);
      setTenants((prev) => prev.filter((t) => t.id !== target.id));
      setBillingMap((prev) => {
        const next = { ...prev };
        delete next[target.id];
        return next;
      });
      toast.error(`${target.name} deleted`, {
        description: `${target.id} · ${target.subdomain}.schoolaccounts.in · all school data removed`,
      });
      setPendingDelete(null);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Delete failed";
      toast.error("Could not delete tenant", { description: msg });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <TenantsViewSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-heading">School Tenants Registry</h1>
          <p className="mt-2 text-[14px] text-black/55">
            {`${filtered.length} of ${tenants.length} tenants · isolated routing keys, provisioning & billing`}
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
          <SelectTrigger className="h-11 w-full rounded-lg border-[#E5E5E5] bg-[#F4F4F5] text-[12px] sm:h-10 sm:w-[170px]">
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
          <SelectTrigger className="h-11 w-full rounded-lg border-[#E5E5E5] bg-[#F4F4F5] text-[12px] sm:h-10 sm:w-[170px]">
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
          const sStyle = STATUS_STYLE[t.status];
          const tone = TIER_TONE[t.tier];
          const cornerSide: CornerSide = i % 2 === 0 ? "tr" : "bl";
          const isLight = tone === "white";
          const isLime = tone === "lime";
          const isBlack = tone === "black";
          const onDark = isLime || isBlack;
          const subText = onDark ? "text-white/65" : "text-black/55";
          const hostText = isBlack
            ? "text-[#5EEAD4]"
            : isLime
              ? "text-white/80"
              : "text-black/65";
          const tierBadge = isLight
            ? { bg: TIER_STYLE[t.tier].bg, fg: TIER_STYLE[t.tier].fg }
            : isLime
              ? { bg: "rgba(255,255,255,0.18)", fg: "#FFFFFF" }
              : { bg: "rgba(255,255,255,0.12)", fg: "#FFFFFF" };
          const statusBadge = onDark
            ? t.status === "Suspended" || t.status === "Overdue"
              ? { bg: "rgba(239,68,68,0.22)", fg: "#FCA5A5", dot: "#F87171" }
              : { bg: "rgba(255,255,255,0.14)", fg: "#FFFFFF", dot: "#FFFFFF" }
            : sStyle;
          return (
            <OrganicCard
              key={t.id}
              tone={tone}
              cornerSide={cornerSide}
              padded
              role="button"
              tabIndex={0}
              aria-label={`Open details for ${t.name}`}
              onClick={() => {
                setDetailTab("overview");
                setDetailTarget(t);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setDetailTab("overview");
                  setDetailTarget(t);
                }
              }}
              className="cursor-pointer space-y-4 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_28px_64px_-28px_rgba(15,23,42,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/40 focus-visible:ring-offset-2"
            >
              <div>
                <div className="text-[15px] font-semibold leading-tight">{t.name}</div>
                <div className={`mt-1 font-mono text-[11px] ${subText}`}>
                  {t.id} · {t.uuid}
                </div>
                <div className={`mt-0.5 font-mono text-[11px] ${hostText}`}>
                  {t.subdomain}.schoolaccounts.in
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ backgroundColor: tierBadge.bg, color: tierBadge.fg }}
                >
                  {t.tier}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ backgroundColor: statusBadge.bg, color: statusBadge.fg }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: statusBadge.dot }}
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
                    onDark ? "bg-white/15" : "bg-[#F4F4F5]"
                  }`}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isLime
                        ? "#FFFFFF"
                        : isBlack
                          ? "#0F766E"
                          : pct > 90
                            ? "#000000"
                            : pct > 70
                              ? "#0F766E"
                              : "#000000",
                    }}
                  />
                </div>
              </div>

              <div
                className={`flex flex-wrap items-center justify-between gap-2 border-t pt-3 ${
                  onDark ? "border-white/10" : "border-black/8"
                }`}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
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
                    label="View Tenant Details"
                    tone={tone}
                    onClick={() => {
                      setDetailTab("overview");
                      setDetailTarget(t);
                    }}
                  />
                  <TenantAction
                    icon={ScrollText}
                    label="Audit Connection Logs"
                    tone={tone}
                    onClick={() => setAuditTarget(t)}
                  />
                  <TenantAction
                    icon={Trash2}
                    label="Delete Tenant"
                    tone={tone}
                    onClick={() => setPendingDelete(t)}
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImpersonate?.(t);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold shadow-[0_6px_18px_-10px_rgba(0,0,0,0.5)] transition-colors ${
                    isBlack
                      ? "bg-[#0F766E] text-white hover:bg-white hover:text-black"
                      : isLime
                        ? "bg-white text-[#0F766E] hover:bg-black hover:text-white"
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
        onSave={(updated) => {
          updateTenant(updated.id, updated);
          setEditTarget(null);
          setDetailTarget((prev) => (prev?.id === updated.id ? updated : prev));
        }}
      />

      <TenantDetailDrawer
        tenant={detailTarget}
        tab={detailTab}
        onTabChange={setDetailTab}
        billing={detailTarget ? getBilling(detailTarget) : null}
        onClose={() => setDetailTarget(null)}
        onEdit={() => {
          if (!detailTarget) return;
          setEditTarget(detailTarget);
        }}
        onBilling={() => {
          if (!detailTarget) return;
          setBillingTarget(detailTarget);
        }}
        onAudit={() => {
          if (!detailTarget) return;
          setAuditTarget(detailTarget);
        }}
        onImpersonate={() => {
          if (!detailTarget) return;
          onImpersonate?.(detailTarget);
        }}
        onSaveBilling={(rule) => {
          if (!detailTarget) return;
          upsertBilling(detailTarget.id, rule);
          toast.success("Billing rules saved", {
            description: `${detailTarget.name} · ${rule.cycle} · ${PRICING_MODEL_LABEL[rule.pricingModel]} · ${billingRateDescription(rule, CURRENCY_SYMBOL[rule.currency])}`,
          });
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
            description: `${billingTarget.name} · ${rule.cycle} · ${PRICING_MODEL_LABEL[rule.pricingModel]} · ${billingRateDescription(rule, CURRENCY_SYMBOL[rule.currency])}`,
          });
          setBillingTarget(null);
        }}
      />

      <AuditLogsDrawer tenant={auditTarget} onClose={() => setAuditTarget(null)} />

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next && !deleting) setPendingDelete(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-black">
              Delete Tenant
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-relaxed text-black/60">
              {pendingDelete
                ? `Permanently delete ${pendingDelete.name} (${pendingDelete.id})? Students, staff, finance, and settings for this school will be removed. This cannot be undone.`
                : "Permanently delete this tenant?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={() => void confirmDeleteTenant()}
              className="rounded-full bg-[#EF4444] text-white hover:bg-[#DC2626]"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete permanently"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        ? "bg-white/15 text-white hover:bg-white hover:text-[#0F766E]"
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
  const [setupPassword, setSetupPassword] = useState("school2026");
  const [contact, setContact] = useState("");
  const [gstin, setGstin] = useState("");
  const [students, setStudents] = useState(500);
  const [faculty, setFaculty] = useState(40);
  const [tier, setTier] = useState<Tier>("Premium");
  const [customDomain, setCustomDomain] = useState(false);
  const [apex, setApex] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setLegalName("");
    setSlug("");
    setAdminName("");
    setAdminEmail("");
    setSetupPassword("school2026");
    setContact("");
    setGstin("");
    setStudents(500);
    setFaculty(40);
    setTier("Premium");
    setCustomDomain(false);
    setApex("");
  };

  const submit = async () => {
    if (!legalName || !slug) {
      toast.error("Legal name and subdomain are required");
      return;
    }
    if (!adminEmail.trim()) {
      toast.error("Administrator email is required");
      return;
    }
    if (setupPassword.trim().length < 6) {
      toast.error("Setup password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      const result = await provisionSuperAdminTenant({
        name: legalName,
        subdomain: slug,
        tier,
        capacity: students,
        adminName: adminName || "School Admin",
        adminEmail: adminEmail.trim(),
        password: setupPassword.trim(),
      });
      onCreate(result.tenant);
      toast.success("Tenant provisioned", {
        description: `${result.tenant.id} · ${result.admin.email} / ${result.admin.temporaryPassword}`,
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Provision failed";
      toast.error("Could not provision tenant", { description: msg });
    } finally {
      setBusy(false);
    }
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
            <Field label="Setup Username">
              <Input
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@school.in"
                type="email"
                autoComplete="username"
              />
            </Field>
          </div>

          <Field label="Setup Password">
            <PasswordInput
              value={setupPassword}
              onChange={setSetupPassword}
              placeholder="Initial school admin password"
            />
          </Field>

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
                        ? "border-transparent bg-[#0F766E] text-white shadow-sm"
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
            onClick={() => void submit()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-black/85 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {busy ? "Provisioning…" : "Provision Tenant"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

const TENANT_DETAIL_TABS = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "branches", label: "Branches", icon: GitBranch },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "staff", label: "Staff", icon: Users },
  { id: "payments", label: "Payments", icon: Receipt },
  { id: "billing", label: "Billing", icon: Wallet },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "access", label: "Access", icon: Shield },
] as const;

function formatSnapshotInr(amount: number) {
  return `₹ ${amount.toLocaleString("en-IN")}`;
}

function WorkspaceSnapshotState({
  loading,
  error,
  children,
}: {
  loading: boolean;
  error: string | null;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#E5E5E5] bg-white px-4 py-14 text-[13px] text-black/55">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading workspace data…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-10 text-center text-[13px] text-[#B91C1C]">
        {error}
      </div>
    );
  }
  return <>{children}</>;
}

function TenantDetailDrawer({
  tenant,
  tab,
  onTabChange,
  billing,
  onClose,
  onEdit,
  onBilling,
  onAudit,
  onImpersonate,
  onSaveBilling,
}: {
  tenant: Tenant | null;
  tab: string;
  onTabChange: (tab: string) => void;
  billing: BillingRule | null;
  onClose: () => void;
  onEdit: () => void;
  onBilling: () => void;
  onAudit: () => void;
  onImpersonate: () => void;
  onSaveBilling: (rule: BillingRule) => void;
}) {
  const [billingDraft, setBillingDraft] = useState<BillingRule | null>(null);
  const [activity, setActivity] = useState<AuditEvent[]>([]);
  const [snapshot, setSnapshot] = useState<TenantWorkspaceSnapshot | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant || !billing) {
      setBillingDraft(null);
      setActivity([]);
      return;
    }
    setBillingDraft(billing);
    setActivity(buildAuditLog(tenant, 8));
  }, [tenant, billing]);

  useEffect(() => {
    if (!tenant) {
      setSnapshot(null);
      setSnapshotError(null);
      setSnapshotLoading(false);
      return;
    }
    let cancelled = false;
    setSnapshotLoading(true);
    setSnapshotError(null);
    fetchSuperAdminTenantSnapshot(tenant.id)
      .then((data) => {
        if (!cancelled) setSnapshot(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setSnapshot(null);
          setSnapshotError(
            err instanceof ApiError ? err.message : "Failed to load workspace data",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setSnapshotLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenant?.id]);

  if (!tenant) return null;
  const draft = billingDraft ?? billing;
  if (!draft) return null;

  const pct = tenant.capacity > 0 ? Math.round((tenant.students / tenant.capacity) * 100) : 0;
  const tStyle = TIER_STYLE[tenant.tier];
  const sStyle = STATUS_STYLE[tenant.status];
  const sym = CURRENCY_SYMBOL[draft.currency];
  const grossPerCycle = billingGross(draft, tenant.students);
  const discount = grossPerCycle * (draft.discountPercent / 100);
  const tax = (grossPerCycle - discount) * (draft.taxPercent / 100);
  const total = grossPerCycle - discount + tax;
  const seats = Math.max(tenant.students, 1);

  const set = <K extends keyof BillingRule>(k: K, v: BillingRule[K]) =>
    setBillingDraft((prev) => {
      const base = prev ?? billing;
      return base ? { ...base, [k]: v } : prev;
    });

  const saveBilling = () => {
    if (draft.ratePerStudent <= 0) {
      toast.error(
        draft.pricingModel === "flat_cycle"
          ? "Flat rate must be greater than zero"
          : "Rate per student must be greater than zero",
      );
      return;
    }
    onSaveBilling(draft);
  };

  return (
    <Dialog open={!!tenant} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={cn(
          "flex w-[calc(100%-1rem)] max-w-[960px] flex-col gap-0 overflow-hidden p-0",
          "max-h-[min(920px,calc(100dvh-1rem))] translate-x-[-50%] translate-y-[-50%]",
          "rounded-2xl border-[#E5E5E5] bg-white text-black shadow-[0_24px_80px_-28px_rgba(15,23,42,0.45)] sm:w-[calc(100%-2rem)] sm:rounded-3xl",
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-[#E5E5E5] bg-[#F4F4F5] px-4 py-4 pr-12 text-left sm:px-6 sm:py-5">
          <DialogTitle className="text-[18px] font-semibold tracking-tight text-black sm:text-[20px]">
            Tenant Details
          </DialogTitle>
          <DialogDescription className="text-[12px] text-black/55">
            {tenant.name} · {tenant.id} · {tenant.subdomain}.schoolaccounts.in
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={onTabChange}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="shrink-0 border-b border-[#E5E5E5] bg-white px-3 pt-3 sm:px-6">
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <TabsList className="inline-flex h-auto min-w-full gap-1.5 rounded-none bg-transparent p-0 pb-3">
                {TENANT_DETAIL_TABS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <TabsTrigger
                      key={item.id}
                      value={item.id}
                      className={cn(
                        "shrink-0 gap-1.5 rounded-xl border border-transparent px-3 py-2.5 text-[12px] text-black/55",
                        "data-[state=active]:border-[#E5E5E5] data-[state=active]:bg-[#F4F4F5] data-[state=active]:font-semibold data-[state=active]:text-black data-[state=active]:shadow-none",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6 sm:py-5">
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ backgroundColor: tStyle.bg, color: tStyle.fg }}
                  >
                    {tenant.tier}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ backgroundColor: sStyle.bg, color: sStyle.fg }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: sStyle.dot }}
                    />
                    {tenant.status}
                  </span>
                </div>

                <div className="col-span-12 sm:col-span-4">
                  <DetailStat label="Public ID" value={tenant.id} mono />
                </div>
                <div className="col-span-12 sm:col-span-8">
                  <DetailStat label="UUID" value={tenant.uuid} mono />
                </div>
                <div className="col-span-12 sm:col-span-8">
                  <DetailStat
                    label="Routing host"
                    value={`${tenant.subdomain}.schoolaccounts.in`}
                    mono
                  />
                </div>
                <div className="col-span-12 sm:col-span-4">
                  <DetailStat label="Created" value={tenant.createdAt || "—"} mono />
                </div>
                <div className="col-span-12 sm:col-span-8">
                  <DetailStat
                    label="Setup username"
                    value={tenant.adminEmail?.trim() || "Not set"}
                    mono
                  />
                </div>
                <div className="col-span-12 sm:col-span-4">
                  <DetailStat
                    label="Seat utilisation"
                    value={`${tenant.students.toLocaleString()} / ${tenant.capacity.toLocaleString()} · ${pct}%`}
                  />
                </div>

                <div className="col-span-12 rounded-2xl border border-[#E5E5E5] bg-white px-3.5 py-3">
                  <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-black/55">
                    <span>{tenant.students.toLocaleString()} enrolled</span>
                    <span>
                      {tenant.capacity.toLocaleString()} seats · {pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#F4F4F5]">
                    <div
                      className="h-full rounded-full bg-[#0F766E] transition-[width]"
                      style={{ width: `${Math.min(100, Math.max(pct, pct > 0 ? pct : 0))}%` }}
                    />
                  </div>
                </div>

                <div className="col-span-12">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={onEdit}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit meta
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="branches" className="mt-0">
              <WorkspaceSnapshotState loading={snapshotLoading} error={snapshotError}>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13px] text-black/55">
                      {snapshot?.totals.branches ?? 0} branch
                      {(snapshot?.totals.branches ?? 0) === 1 ? "" : "es"} in this workspace
                    </p>
                  </div>
                  <div className="col-span-12 divide-y divide-[#F0F0F0] rounded-2xl border border-[#E5E5E5] bg-white">
                    {(snapshot?.branches ?? []).length === 0 ? (
                      <div className="px-4 py-10 text-center text-[13px] text-black/45">
                        No branches found.
                      </div>
                    ) : (
                      snapshot?.branches.map((branch) => (
                        <div key={branch.id} className="grid grid-cols-12 gap-3 px-4 py-3">
                          <div className="col-span-12 sm:col-span-7">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-[13px] font-semibold text-black">{branch.name}</div>
                              <span className="rounded-full bg-[#F4F4F5] px-2 py-0.5 font-mono text-[10px] text-black/55">
                                {branch.code || branch.id}
                              </span>
                              {branch.isMain ? (
                                <span className="rounded-full bg-[#CCFBF1] px-2 py-0.5 text-[10px] font-semibold text-black">
                                  Main
                                </span>
                              ) : null}
                              {!branch.isActive ? (
                                <span className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[10px] font-semibold text-[#B91C1C]">
                                  Inactive
                                </span>
                              ) : null}
                            </div>
                            {branch.address ? (
                              <div className="mt-1 text-[12px] text-black/55">{branch.address}</div>
                            ) : null}
                            <div className="mt-1 text-[12px] text-black/45">
                              {[branch.phone, branch.email].filter(Boolean).join(" · ") || "No contact on file"}
                            </div>
                          </div>
                          <div className="col-span-12 grid grid-cols-3 gap-2 sm:col-span-5">
                            <DetailStat label="Students" value={branch.students.toLocaleString()} />
                            <DetailStat label="Staff" value={branch.staff.toLocaleString()} />
                            <DetailStat label="Payments" value={branch.payments.toLocaleString()} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </WorkspaceSnapshotState>
            </TabsContent>

            <TabsContent value="students" className="mt-0">
              <WorkspaceSnapshotState loading={snapshotLoading} error={snapshotError}>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12">
                    <p className="text-[13px] text-black/55">
                      {snapshot?.totals.students.toLocaleString() ?? 0} enrolled
                      {(snapshot?.students.length ?? 0) > 0 &&
                      (snapshot?.totals.students ?? 0) > (snapshot?.students.length ?? 0)
                        ? ` · showing latest ${snapshot?.students.length}`
                        : ""}
                    </p>
                  </div>
                  <div className="col-span-12 divide-y divide-[#F0F0F0] rounded-2xl border border-[#E5E5E5] bg-white">
                    {(snapshot?.students ?? []).length === 0 ? (
                      <div className="px-4 py-10 text-center text-[13px] text-black/45">
                        No students found.
                      </div>
                    ) : (
                      snapshot?.students.map((student) => (
                        <div key={student.id} className="grid grid-cols-12 gap-2 px-4 py-3">
                          <div className="col-span-12 sm:col-span-5">
                            <div className="text-[13px] font-semibold text-black">{student.name}</div>
                            <div className="mt-0.5 font-mono text-[10px] text-black/45">{student.id}</div>
                          </div>
                          <div className="col-span-6 sm:col-span-2">
                            <div className="text-[10px] uppercase tracking-wider text-black/40">Class</div>
                            <div className="text-[12px] text-black/70">{student.className || "—"}</div>
                          </div>
                          <div className="col-span-6 sm:col-span-2">
                            <div className="text-[10px] uppercase tracking-wider text-black/40">Branch</div>
                            <div className="text-[12px] text-black/70">{student.branchName || "—"}</div>
                          </div>
                          <div className="col-span-6 sm:col-span-2">
                            <div className="text-[10px] uppercase tracking-wider text-black/40">Due</div>
                            <div className="font-mono text-[12px] text-black/70">
                              {formatSnapshotInr(student.due)}
                            </div>
                          </div>
                          <div className="col-span-6 sm:col-span-1 sm:text-right">
                            <div className="text-[10px] uppercase tracking-wider text-black/40">Status</div>
                            <div
                              className={cn(
                                "text-[12px] font-semibold",
                                student.active ? "text-[#0F766E]" : "text-[#B91C1C]",
                              )}
                            >
                              {student.active ? "Active" : "Inactive"}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </WorkspaceSnapshotState>
            </TabsContent>

            <TabsContent value="staff" className="mt-0">
              <WorkspaceSnapshotState loading={snapshotLoading} error={snapshotError}>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12">
                    <p className="text-[13px] text-black/55">
                      {snapshot?.totals.staff.toLocaleString() ?? 0} staff member
                      {(snapshot?.totals.staff ?? 0) === 1 ? "" : "s"}
                      {(snapshot?.staff.length ?? 0) > 0 &&
                      (snapshot?.totals.staff ?? 0) > (snapshot?.staff.length ?? 0)
                        ? ` · showing latest ${snapshot?.staff.length}`
                        : ""}
                    </p>
                  </div>
                  <div className="col-span-12 divide-y divide-[#F0F0F0] rounded-2xl border border-[#E5E5E5] bg-white">
                    {(snapshot?.staff ?? []).length === 0 ? (
                      <div className="px-4 py-10 text-center text-[13px] text-black/45">
                        No staff found.
                      </div>
                    ) : (
                      snapshot?.staff.map((member) => (
                        <div key={member.id} className="grid grid-cols-12 gap-2 px-4 py-3">
                          <div className="col-span-12 sm:col-span-4">
                            <div className="text-[13px] font-semibold text-black">{member.name}</div>
                            <div className="mt-0.5 font-mono text-[10px] text-black/45">{member.id}</div>
                          </div>
                          <div className="col-span-6 sm:col-span-2">
                            <div className="text-[10px] uppercase tracking-wider text-black/40">Role</div>
                            <div className="text-[12px] text-black/70">{member.role || "—"}</div>
                          </div>
                          <div className="col-span-6 sm:col-span-2">
                            <div className="text-[10px] uppercase tracking-wider text-black/40">Department</div>
                            <div className="text-[12px] text-black/70">{member.department || "—"}</div>
                          </div>
                          <div className="col-span-6 sm:col-span-2">
                            <div className="text-[10px] uppercase tracking-wider text-black/40">Branch</div>
                            <div className="text-[12px] text-black/70">{member.branchName || "—"}</div>
                          </div>
                          <div className="col-span-6 sm:col-span-2 sm:text-right">
                            <div className="text-[10px] uppercase tracking-wider text-black/40">Status</div>
                            <div
                              className={cn(
                                "text-[12px] font-semibold",
                                member.active ? "text-[#0F766E]" : "text-[#B91C1C]",
                              )}
                            >
                              {member.active ? "Active" : "Inactive"}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </WorkspaceSnapshotState>
            </TabsContent>

            <TabsContent value="payments" className="mt-0">
              <WorkspaceSnapshotState loading={snapshotLoading} error={snapshotError}>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 sm:col-span-6">
                    <div className="rounded-2xl border border-[#E5E5E5] bg-[#F4F4F5] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                        Total payment volume
                      </div>
                      <div className="mt-2 font-mono text-[22px] font-semibold text-black">
                        {formatSnapshotInr(snapshot?.totals.paymentVolume ?? 0)}
                      </div>
                      <div className="mt-1 text-[12px] text-black/55">
                        {snapshot?.totals.payments.toLocaleString() ?? 0} payment
                        {(snapshot?.totals.payments ?? 0) === 1 ? "" : "s"} recorded
                      </div>
                    </div>
                  </div>
                  <div className="col-span-12 sm:col-span-6 flex items-center">
                    <p className="text-[13px] text-black/55">
                      {(snapshot?.payments.length ?? 0) > 0 &&
                      (snapshot?.totals.payments ?? 0) > (snapshot?.payments.length ?? 0)
                        ? `Showing latest ${snapshot?.payments.length} payments`
                        : "Recent payments across all branches"}
                    </p>
                  </div>
                  <div className="col-span-12 divide-y divide-[#F0F0F0] rounded-2xl border border-[#E5E5E5] bg-white">
                    {(snapshot?.payments ?? []).length === 0 ? (
                      <div className="px-4 py-10 text-center text-[13px] text-black/45">
                        No payments found.
                      </div>
                    ) : (
                      snapshot?.payments.map((payment) => (
                        <div key={payment.id} className="grid grid-cols-12 gap-2 px-4 py-3">
                          <div className="col-span-12 sm:col-span-4">
                            <div className="text-[13px] font-semibold text-black">{payment.name}</div>
                            <div className="mt-0.5 font-mono text-[10px] text-black/45">{payment.id}</div>
                          </div>
                          <div className="col-span-6 sm:col-span-2">
                            <div className="text-[10px] uppercase tracking-wider text-black/40">Category</div>
                            <div className="text-[12px] text-black/70">{payment.cat || "—"}</div>
                          </div>
                          <div className="col-span-6 sm:col-span-2">
                            <div className="text-[10px] uppercase tracking-wider text-black/40">Mode</div>
                            <div className="text-[12px] text-black/70">{payment.mode || "—"}</div>
                          </div>
                          <div className="col-span-6 sm:col-span-2">
                            <div className="text-[10px] uppercase tracking-wider text-black/40">Branch</div>
                            <div className="text-[12px] text-black/70">{payment.branchName || "—"}</div>
                          </div>
                          <div className="col-span-6 sm:col-span-2 sm:text-right">
                            <div className="text-[10px] uppercase tracking-wider text-black/40">Amount</div>
                            <div className="font-mono text-[12px] font-semibold text-black">
                              {formatSnapshotInr(payment.amount)}
                            </div>
                            <div className="mt-0.5 font-mono text-[10px] text-black/45">{payment.time}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </WorkspaceSnapshotState>
            </TabsContent>

            <TabsContent value="billing" className="mt-0">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12">
                  <Field label="Payment system">
                    <div className="grid grid-cols-12 gap-2">
                      {(
                        [
                          {
                            id: "per_student" as const,
                            title: "Per student",
                            hint: "Bill seats × rate each cycle",
                          },
                          {
                            id: "flat_cycle" as const,
                            title: "Flat per cycle",
                            hint: "Fixed fee for the billing period",
                          },
                        ] as const
                      ).map((opt) => {
                        const sel = draft.pricingModel === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => set("pricingModel", opt.id)}
                            className={cn(
                              "col-span-6 rounded-xl border px-3 py-2.5 text-left transition",
                              sel
                                ? "border-transparent bg-[#0F766E] text-white shadow-sm"
                                : "border-[#E5E5E5] bg-white text-black/65 hover:border-black/30",
                            )}
                          >
                            <div className="text-[12px] font-semibold">{opt.title}</div>
                            <div
                              className={cn(
                                "mt-0.5 text-[10.5px] leading-snug",
                                sel ? "text-white/80" : "text-black/45",
                              )}
                            >
                              {opt.hint}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>

                <div className="col-span-12">
                  <Field label="Billing Cycle">
                    <div className="grid grid-cols-12 gap-2">
                      {(["Monthly", "Quarterly", "Annual"] as BillingCycle[]).map((c) => {
                        const sel = draft.cycle === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => set("cycle", c)}
                            className={cn(
                              "col-span-4 rounded-xl border px-3 py-2.5 text-[12px] font-semibold transition",
                              sel
                                ? "border-transparent bg-[#0F766E] text-white shadow-sm"
                                : "border-[#E5E5E5] bg-white text-black/65 hover:border-black/30",
                            )}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>

                <div className="col-span-12 sm:col-span-6">
                  <Field label={rateFieldLabel(draft, sym)}>
                    <Input
                      type="number"
                      min={0}
                      value={draft.ratePerStudent}
                      onChange={(e) => set("ratePerStudent", Number(e.target.value) || 0)}
                      className="font-mono"
                    />
                  </Field>
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <Field label="Currency">
                    <Select
                      value={draft.currency}
                      onValueChange={(v) => set("currency", v as Currency)}
                    >
                      <SelectTrigger className="h-10 rounded-lg border-[#E5E5E5] bg-white text-[13px]">
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

                <div className="col-span-6 sm:col-span-3">
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
                </div>
                <div className="col-span-6 sm:col-span-3">
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
                <div className="col-span-12 sm:col-span-6">
                  <Field label="Grace days">
                    <Input
                      type="number"
                      min={0}
                      max={90}
                      value={draft.graceDays}
                      onChange={(e) => set("graceDays", Number(e.target.value) || 0)}
                      className="font-mono"
                    />
                  </Field>
                </div>

                <div className="col-span-12 sm:col-span-6">
                  <Field label="Next Invoice Date">
                    <DatePicker
                      value={draft.nextInvoice}
                      onChange={(v) => set("nextInvoice", v)}
                      placeholder="Pick invoice date"
                      min={new Date().toISOString().slice(0, 10)}
                    />
                  </Field>
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <Field label="Payment Method">
                    <Select
                      value={draft.paymentMethod}
                      onValueChange={(v) => set("paymentMethod", v as PaymentMethod)}
                    >
                      <SelectTrigger className="h-10 rounded-lg border-[#E5E5E5] bg-white text-[13px]">
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
                </div>

                <div className="col-span-12 rounded-2xl border border-[#E5E5E5] bg-[#F4F4F5] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                    Projected next invoice
                  </div>
                  <div className="mt-2 font-mono text-[22px] font-semibold text-black">
                    {sym}
                    {Math.round(total).toLocaleString("en-IN")}
                  </div>
                  <div className="mt-1 text-[12px] text-black/55">
                    {PRICING_MODEL_LABEL[draft.pricingModel]} ·{" "}
                    {draft.pricingModel === "per_student"
                      ? `${seats.toLocaleString("en-IN")} × ${sym}${draft.ratePerStudent}`
                      : `${sym}${draft.ratePerStudent}/${cycleUnitLabel(draft.cycle)}`}{" "}
                    · {draft.cycle} · {draft.paymentMethod}
                    {draft.autoCharge ? " · auto-charge on" : " · manual"}
                  </div>
                </div>

                <div className="col-span-12 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="rounded-full bg-black text-white hover:bg-black/85"
                    onClick={saveBilling}
                  >
                    <Save className="h-3.5 w-3.5" /> Save billing
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={onBilling}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Full billing editor
                  </Button>
                </div>

                <div className="col-span-12 border-t border-[#EFEFEF] pt-3 dark:border-white/10">
                  <PlatformInvoicesPanel
                    mode="super_admin"
                    tenantId={tenant.id}
                    tenantName={tenant.name}
                    schoolHost={`${tenant.subdomain}.schoolaccounts.in`}
                    issueDraft={{
                      billingCycle: draft.cycle,
                      pricingModel: draft.pricingModel,
                      currency: draft.currency,
                      studentsBilled:
                        draft.pricingModel === "flat_cycle" ? 1 : seats,
                      ratePerStudent: draft.ratePerStudent,
                      discountPercent: draft.discountPercent,
                      taxPercent: draft.taxPercent,
                      paymentMethod: draft.paymentMethod,
                      periodLabel: `${draft.cycle} · ${PRICING_MODEL_LABEL[draft.pricingModel]} · ${draft.nextInvoice}`,
                      issueDate: new Date().toISOString().slice(0, 10),
                      dueDate: draft.nextInvoice || new Date().toISOString().slice(0, 10),
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 flex flex-col gap-3 sm:col-span-8 sm:flex-row sm:items-center">
                  <p className="text-[13px] leading-snug text-black/55">
                    Recent connection and admin events for this tenant.
                  </p>
                </div>
                <div className="col-span-12 sm:col-span-4 sm:flex sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-full sm:w-auto"
                    onClick={onAudit}
                  >
                    <ScrollText className="h-3.5 w-3.5" /> Full audit
                  </Button>
                </div>
                <div className="col-span-12 divide-y divide-[#F0F0F0] rounded-2xl border border-[#E5E5E5] bg-white">
                  {activity.length === 0 ? (
                    <div className="px-4 py-10 text-center text-[13px] text-black/45">
                      No activity recorded yet.
                    </div>
                  ) : (
                    activity.map((e, i) => (
                      <div key={`${e.ts}-${i}`} className="grid grid-cols-12 gap-2 px-4 py-3">
                        <div className="col-span-12 sm:col-span-8">
                          <div className="text-[13px] font-semibold text-black">{e.action}</div>
                          <div className="mt-0.5 text-[12px] text-black/55">
                            {e.actor} · {e.detail}
                          </div>
                          <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-black/40">
                            {e.severity} · {e.ip}
                          </div>
                        </div>
                        <div className="col-span-12 font-mono text-[10px] text-black/45 sm:col-span-4 sm:text-right">
                          {e.ts}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="access" className="mt-0">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 rounded-2xl border border-[#E5E5E5] bg-[#F4F4F5] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
                    School admin login
                  </div>
                  <div className="mt-2 break-all font-mono text-[14px] font-semibold text-black">
                    {tenant.adminEmail?.trim() || "No username on file"}
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-black/55">
                    Reset username or password from Edit Tenant Meta. Impersonation opens the
                    school workspace without sharing credentials.
                  </p>
                </div>

                <div className="col-span-6">
                  <DetailStat label="Lifecycle" value={tenant.status} />
                </div>
                <div className="col-span-6">
                  <DetailStat label="Package" value={tenant.tier} />
                </div>
                <div className="col-span-6">
                  <DetailStat label="Tenant ID" value={tenant.id} mono />
                </div>
                <div className="col-span-6">
                  <DetailStat label="Provisioned" value={tenant.createdAt || "—"} mono />
                </div>

                <div className="col-span-12">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={onEdit}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit credentials
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="mt-auto grid shrink-0 grid-cols-12 items-center gap-3 border-t border-[#E5E5E5] bg-[#F4F4F5] px-3 py-3 sm:px-6 sm:py-4">
          <div className="col-span-5 sm:col-span-3">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              onClick={onClose}
            >
              <X className="h-3.5 w-3.5" /> Close
            </Button>
          </div>
          <div className="col-span-7 sm:col-span-9 sm:flex sm:justify-end">
            <Button
              type="button"
              className="w-full rounded-full bg-black text-white hover:bg-black/85 sm:w-auto"
              onClick={onImpersonate}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span className="truncate">Impersonate workspace</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailStat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="h-full rounded-2xl border border-[#E5E5E5] bg-white px-3.5 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-black/45">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 break-all text-[13px] font-medium text-black",
          mono && "font-mono text-[12px]",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function EditTenantDrawer({
  tenant,
  onClose,
  onSave,
}: {
  tenant: Tenant | null;
  onClose: () => void;
  onSave: (tenant: Tenant) => void;
}) {
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [tier, setTier] = useState<Tier>("Basic");
  const [status, setStatus] = useState<Status>("Active");
  const [capacity, setCapacity] = useState(0);
  const [setupUsername, setSetupUsername] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    setName(tenant.name);
    setSubdomain(tenant.subdomain);
    setTier(tenant.tier);
    setStatus(tenant.status);
    setCapacity(tenant.capacity);
    setSetupUsername(tenant.adminEmail ?? "");
    setSetupPassword("");
  }, [tenant]);

  if (!tenant) return null;
  const currentUsername = (tenant.adminEmail ?? "").trim().toLowerCase();
  const usernameDirty =
    setupUsername.trim().toLowerCase() !== currentUsername;
  const passwordDirty = setupPassword.trim().length > 0;
  const dirty =
    name !== tenant.name ||
    subdomain !== tenant.subdomain ||
    tier !== tenant.tier ||
    status !== tenant.status ||
    capacity !== tenant.capacity ||
    usernameDirty ||
    passwordDirty;

  const submit = async () => {
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
    if (usernameDirty) {
      const email = setupUsername.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error("Setup username must be a valid email");
        return;
      }
    }
    if (passwordDirty && setupPassword.trim().length < 6) {
      toast.error("Setup password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      const updated = await updateSuperAdminTenant({
        id: tenant.id,
        name: name.trim(),
        subdomain: subdomain.trim(),
        tier,
        status,
        capacity,
        ...(usernameDirty ? { username: setupUsername.trim().toLowerCase() } : {}),
        ...(passwordDirty ? { password: setupPassword.trim() } : {}),
      });
      onSave(updated);
      setSetupUsername(updated.adminEmail ?? setupUsername.trim().toLowerCase());
      setSetupPassword("");
      const credBits = [
        usernameDirty ? "username updated" : null,
        passwordDirty ? "password reset" : null,
      ].filter(Boolean);
      toast.success("Tenant meta updated", {
        description: credBits.length
          ? `${updated.name} · ${credBits.join(" · ")}`
          : `${updated.name} · ${updated.subdomain}.schoolaccounts.in`,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Update failed";
      toast.error("Could not update tenant", { description: msg });
    } finally {
      setBusy(false);
    }
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
                        ? "border-transparent bg-[#0F766E] text-white shadow-sm"
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
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["Active", "Trial", "Overdue", "Suspended"] as Status[]).map((ss) => {
                  const sel = status === ss;
                  return (
                    <Tooltip key={ss}>
                      <TooltipTrigger asChild>
                        <button
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
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-[240px] border border-[#E5E5E5] bg-white px-3 py-2 text-left text-[12px] leading-snug text-black shadow-md"
                      >
                        <div className="font-semibold text-black">{ss}</div>
                        <p className="mt-1 text-black/65">{STATUS_TOOLTIP[ss]}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Setup Username">
              <Input
                type="email"
                autoComplete="username"
                value={setupUsername}
                onChange={(e) => setSetupUsername(e.target.value)}
                placeholder="admin@school.in"
              />
            </Field>
            <Field label="Setup Password">
              <PasswordInput
                value={setupPassword}
                onChange={setSetupPassword}
                placeholder="Leave blank to keep current"
              />
            </Field>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-[#E5E5E5] bg-[#F4F4F5] px-3 py-2.5 text-[11.5px] text-black/65">
            <Info className="h-3.5 w-3.5 shrink-0 text-black/45" />
            Updates write to the tenant&apos;s metadata store. The routing key is rebuilt
            automatically on subdomain change. Setup username is the school admin login
            email; leave password blank to keep the current one.
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
            onClick={() => void submit()}
            disabled={!dirty || busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/30"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {busy ? "Saving…" : "Save Changes"}
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

  const grossPerCycle = billingGross(draft, tenant.students);
  const discount = grossPerCycle * (draft.discountPercent / 100);
  const taxBase = grossPerCycle - discount;
  const tax = taxBase * (draft.taxPercent / 100);
  const total = taxBase + tax;
  const sym = CURRENCY_SYMBOL[draft.currency];
  const seats = Math.max(tenant.students, 1);

  const submit = () => {
    if (draft.ratePerStudent <= 0) {
      toast.error(
        draft.pricingModel === "flat_cycle"
          ? "Flat rate must be greater than zero"
          : "Rate per student must be greater than zero",
      );
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
          <Field label="Payment system">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(
                [
                  { id: "per_student" as const, title: "Per student", hint: "Seats × rate" },
                  { id: "flat_cycle" as const, title: "Flat per cycle", hint: "Fixed period fee" },
                ] as const
              ).map((opt) => {
                const sel = draft.pricingModel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => set("pricingModel", opt.id)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left transition",
                      sel
                        ? "border-transparent bg-[#0F766E] text-white shadow-sm"
                        : "border-[#E5E5E5] bg-white text-black/65 hover:border-black/30",
                    )}
                  >
                    <div className="text-[12px] font-semibold">{opt.title}</div>
                    <div className={cn("mt-0.5 text-[10.5px]", sel ? "text-white/80" : "text-black/45")}>
                      {opt.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>

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
                        ? "border-transparent bg-[#0F766E] text-white shadow-sm"
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
            <Field label={rateFieldLabel(draft, sym)}>
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
                <SelectTrigger className="h-10 rounded-lg border-[#E5E5E5] bg-white text-[13px]">
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
              <SelectTrigger className="h-10 rounded-lg border-[#E5E5E5] bg-white text-[13px]">
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
                label={
                  draft.pricingModel === "flat_cycle"
                    ? `Subtotal · flat / ${cycleUnitLabel(draft.cycle)}`
                    : `Subtotal · ${seats.toLocaleString()} × ${sym}${draft.ratePerStudent}`
                }
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
      bg: "bg-[#CCFBF1]",
      fg: "text-[#10B981]",
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

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        autoComplete="new-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-black/45 transition-colors hover:bg-black/5 hover:text-black"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
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
