import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  Copy,
  ExternalLink,
  Landmark,
  Loader2,
  Save,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

import { OrganicCard } from "@/components/ui/organic-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { fetchSuperAdminTenants } from "@/lib/api/super-admin";
import {
  fetchSuperAdminTenantSettlement,
  saveSuperAdminTenantSettlement,
  type TenantSettlement,
} from "@/lib/api/tenant-settlement";
import { ApiError } from "@/lib/api/client";
import type { Tenant } from "@/components/admin/data";
import { cn } from "@/lib/utils";

type EntityType = "Proprietorship" | "Individual" | "Trust" | "Society" | "Company";

type SchoolPack = {
  contactName: string;
  email: string;
  phone: string;
  pan: string;
  entityType: EntityType;
  bankName: string;
  branchName: string;
  accountNumber: string;
  ifsc: string;
  holder: string;
  vendorId: string;
  vendorStatus: string;
  platformFee: string;
  settlementEnabled: boolean;
  notes: string;
  checklist: {
    leadTagged: boolean;
    easySplitEnabled: boolean;
    testPaymentOk: boolean;
    leadWon: boolean;
  };
};

const VENDOR_STATUSES = [
  "ACTIVE",
  "IN_KYC_REVIEW",
  "IN_BANK_VALIDATION",
  "BANK_VALIDATION_FAILED",
  "ACTION_REQUIRED",
  "ON_HOLD",
] as const;

const ENTITY_TYPES: EntityType[] = [
  "Proprietorship",
  "Individual",
  "Trust",
  "Society",
  "Company",
];

function storageKey(tenantId: string) {
  return `feezo.settlement.pack.${tenantId}`;
}

function emptyPack(subdomain = ""): SchoolPack {
  const code = subdomain.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 12);
  return {
    contactName: "",
    email: "",
    phone: "",
    pan: "",
    entityType: "Proprietorship",
    bankName: "",
    branchName: "",
    accountNumber: "",
    ifsc: "",
    holder: "",
    vendorId: code ? `FEEZO_${code}` : "",
    vendorStatus: "IN_KYC_REVIEW",
    platformFee: "5.90",
    settlementEnabled: false,
    notes: "",
    checklist: {
      leadTagged: false,
      easySplitEnabled: false,
      testPaymentOk: false,
      leadWon: false,
    },
  };
}

function loadPack(tenantId: string, subdomain: string): SchoolPack {
  try {
    const raw = localStorage.getItem(storageKey(tenantId));
    if (!raw) return emptyPack(subdomain);
    return { ...emptyPack(subdomain), ...JSON.parse(raw) };
  } catch {
    return emptyPack(subdomain);
  }
}

function savePack(tenantId: string, pack: SchoolPack) {
  localStorage.setItem(storageKey(tenantId), JSON.stringify(pack));
}

function last4(account: string) {
  const digits = account.replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : digits;
}

function docsEmail(tenant: Tenant, pack: SchoolPack) {
  return `Hi ${pack.contactName || "there"},

We are enabling online parent fee payments for ${tenant.name} on Feezo (Cashfree).

Parents pay online. The full fee settles to your school bank. Feezo adds ₹${pack.platformFee || "5.90"} per payment
(example: fee ₹1,000 → parent pays ₹1,005.90 → school receives ₹1,000).

Please confirm / share:
1) Bank — holder, account number, IFSC, bank & branch
2) Contact — name, mobile, email
3) PAN + entity type (${pack.entityType})
4) Confirm settlement via bank account (not UPI)

Thanks,
Feezo Support
support@feezo.app`;
}

function vendorPack(tenant: Tenant, pack: SchoolPack) {
  return `Cashfree Easy Split vendor
Vendor ID: ${pack.vendorId || `FEEZO_${tenant.subdomain.toUpperCase()}`}
School: ${tenant.name}
Subdomain: ${tenant.subdomain}
Contact: ${pack.contactName}
Email: ${pack.email}
Phone: ${pack.phone}
PAN: ${pack.pan}
Entity: ${pack.entityType}
Holder: ${pack.holder}
Account: ${pack.accountNumber}
IFSC: ${pack.ifsc}
Bank: ${pack.bankName}${pack.branchName ? ` · ${pack.branchName}` : ""}
LOB: Education
Settle: Bank only
Platform fee: ₹${pack.platformFee || "5.90"}`;
}

type Phase = {
  id: string;
  title: string;
  done: boolean;
  detail: string;
};

function phases(pack: SchoolPack, settlement: TenantSettlement | null): Phase[] {
  const docsReady = Boolean(
    pack.email &&
      pack.phone &&
      pack.pan &&
      pack.holder &&
      pack.accountNumber &&
      pack.ifsc,
  );
  return [
    {
      id: "lead",
      title: "Lead tagged",
      done: pack.checklist.leadTagged,
      detail: "Support → Leads · In pipeline + Settlement",
    },
    {
      id: "docs",
      title: "School data collected",
      done: docsReady,
      detail: "Bank, contact, PAN, entity",
    },
    {
      id: "split",
      title: "Easy Split live",
      done: pack.checklist.easySplitEnabled,
      detail: "Cashfree Prod Easy Split enabled",
    },
    {
      id: "vendor",
      title: "Vendor ACTIVE",
      done: pack.vendorStatus === "ACTIVE" && !!pack.vendorId,
      detail: pack.vendorId || "Create FEEZO_… in Cashfree",
    },
    {
      id: "wire",
      title: "Feezo Settlement saved",
      done: !!settlement?.settlementReady || (pack.settlementEnabled && pack.vendorStatus === "ACTIVE"),
      detail: "Tenant → Settlement tab wired",
    },
    {
      id: "pay",
      title: "Parent Pay on",
      done: !!settlement?.parentPayEnabled,
      detail: "School Settings → Fees",
    },
    {
      id: "test",
      title: "Test payment",
      done: pack.checklist.testPaymentOk,
      detail: "Fee + ₹5.90 · school gets full fee",
    },
    {
      id: "won",
      title: "Lead Won",
      done: pack.checklist.leadWon,
      detail: "Close the pipeline",
    },
  ];
}

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Could not copy");
  }
}

export function SettlementSetupView() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pack, setPack] = useState<SchoolPack | null>(null);
  const [settlement, setSettlement] = useState<TenantSettlement | null>(null);
  const [loadingTenant, setLoadingTenant] = useState(false);
  const [saving, setSaving] = useState(false);

  const selected = tenants.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    let cancelled = false;
    setLoadingList(true);
    fetchSuperAdminTenants()
      .then((rows) => {
        if (cancelled) return;
        setTenants(rows);
        if (!selectedId && rows[0]) setSelectedId(rows[0].id);
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Could not load tenants");
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setPack(null);
      setSettlement(null);
      return;
    }
    const tenant = tenants.find((t) => t.id === selectedId);
    if (!tenant) return;
    let cancelled = false;
    setLoadingTenant(true);
    const local = loadPack(tenant.id, tenant.subdomain);
    setPack(local);
    fetchSuperAdminTenantSettlement(tenant.id)
      .then((data) => {
        if (cancelled) return;
        setSettlement(data);
        setPack((prev) => {
          const base = prev ?? local;
          const merged: SchoolPack = {
            ...base,
            vendorId: data.vendorId || base.vendorId,
            vendorStatus: data.vendorStatus || base.vendorStatus,
            platformFee: String(data.platformFee ?? base.platformFee),
            settlementEnabled: data.settlementEnabled,
            holder: data.settlementHolder || base.holder,
            ifsc: data.settlementIfsc || base.ifsc,
            accountNumber:
              base.accountNumber ||
              (data.settlementAccountLast4 ? `····${data.settlementAccountLast4}` : ""),
          };
          savePack(tenant.id, merged);
          return merged;
        });
      })
      .catch(() => {
        if (!cancelled) setSettlement(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingTenant(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, tenants]);

  function updatePack(patch: Partial<SchoolPack>) {
    if (!selected || !pack) return;
    const next = { ...pack, ...patch };
    setPack(next);
    savePack(selected.id, next);
  }

  function updateChecklist(key: keyof SchoolPack["checklist"], value: boolean) {
    if (!pack) return;
    updatePack({ checklist: { ...pack.checklist, [key]: value } });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.subdomain.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q),
    );
  }, [tenants, query]);

  const phaseList = pack ? phases(pack, settlement) : [];
  const progress = phaseList.length
    ? Math.round((phaseList.filter((p) => p.done).length / phaseList.length) * 100)
    : 0;

  async function saveToFeezo() {
    if (!selected || !pack) return;
    const fee = Number(pack.platformFee);
    if (!Number.isFinite(fee) || fee < 0) {
      toast.error("Platform fee must be a valid amount");
      return;
    }
    if (pack.settlementEnabled && !pack.vendorId.trim()) {
      toast.error("Add Cashfree vendor ID before enabling settlement");
      return;
    }
    setSaving(true);
    try {
      const next = await saveSuperAdminTenantSettlement({
        tenantId: selected.id,
        settlementEnabled: pack.settlementEnabled,
        vendorId: pack.vendorId.trim(),
        vendorStatus: pack.vendorStatus,
        platformFee: fee,
        settlementAccountLast4: last4(pack.accountNumber),
        settlementIfsc: pack.ifsc.trim().toUpperCase(),
        settlementHolder: pack.holder.trim(),
      });
      setSettlement(next);
      toast.success(
        next.settlementReady
          ? "Settlement live for this school"
          : "Settlement draft saved on Feezo",
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save settlement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="col-span-12 space-y-4">
      <OrganicCard tone="white" cornerSide="tr" padded>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#CCFBF1] text-[#0F766E]">
                <Landmark className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-[16px] font-semibold tracking-tight text-black">
                  Settlement setup
                </h2>
                <p className="mt-0.5 text-[12.5px] text-black/50">
                  Per-school workspace · collect KYC · create Cashfree vendor · wire Feezo · go live
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" variant="outline" className="h-9 rounded-full">
              <Link to="/super-admin/support/leads">Leads</Link>
            </Button>
            <Button
              asChild
              type="button"
              className="h-9 rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
            >
              <Link to="/super-admin/tenants">
                Tenants
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            { label: "Parent pays", value: "Fee + ₹5.90" },
            { label: "School receives", value: "Full fee" },
            { label: "Feezo keeps", value: "₹5.90" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#EFEFEF] bg-[linear-gradient(180deg,#FAFAFA_0%,#FFFFFF_100%)] px-3.5 py-3"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">
                {item.label}
              </div>
              <div className="mt-1 text-[15px] font-semibold text-black">{item.value}</div>
            </div>
          ))}
        </div>
      </OrganicCard>

      <div className="grid grid-cols-12 gap-4">
        <OrganicCard tone="white" cornerSide="tr" padded className="col-span-12 lg:col-span-3 !p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/35" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search school…"
              className="h-9 rounded-xl border-[#E5E5E5] bg-[#FAFAFA] pl-9 text-[13px]"
            />
          </div>
          <div className="mt-3 max-h-[min(68vh,640px)] space-y-1 overflow-y-auto pr-0.5">
            {loadingList ? (
              <div className="flex items-center justify-center gap-2 py-10 text-[12px] text-black/45">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading schools…
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-[12px] text-black/45">No schools match</div>
            ) : (
              filtered.map((tenant) => {
                const active = tenant.id === selectedId;
                const draft = loadPack(tenant.id, tenant.subdomain);
                const status =
                  draft.vendorStatus === "ACTIVE" && draft.settlementEnabled
                    ? "Live"
                    : draft.vendorId || draft.email
                      ? "Setup"
                      : "New";
                return (
                  <button
                    key={tenant.id}
                    type="button"
                    onClick={() => setSelectedId(tenant.id)}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition",
                      active
                        ? "bg-[#0F766E] text-white shadow-sm"
                        : "hover:bg-[#F4F4F5] text-black",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-bold",
                        active ? "bg-white/15 text-white" : "bg-[#F4F4F5] text-[#0F766E]",
                      )}
                    >
                      {tenant.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold">{tenant.name}</span>
                      <span
                        className={cn(
                          "mt-0.5 block truncate font-mono text-[10.5px]",
                          active ? "text-white/70" : "text-black/40",
                        )}
                      >
                        {tenant.subdomain}.feezo.app
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                        active
                          ? "bg-white/15 text-white"
                          : status === "Live"
                            ? "bg-emerald-50 text-emerald-700"
                            : status === "Setup"
                              ? "bg-amber-50 text-amber-800"
                              : "bg-black/[0.04] text-black/45",
                      )}
                    >
                      {status}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </OrganicCard>

        <div className="col-span-12 space-y-4 lg:col-span-9">
          {!selected || !pack ? (
            <OrganicCard tone="white" cornerSide="tr" padded>
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <Building2 className="h-8 w-8 text-black/25" />
                <div className="text-[14px] font-semibold text-black">Select a school</div>
                <p className="max-w-sm text-[12.5px] text-black/45">
                  Each tenant has its own data collection, checklist, and Cashfree vendor pack.
                </p>
              </div>
            </OrganicCard>
          ) : loadingTenant && !settlement ? (
            <OrganicCard tone="white" cornerSide="tr" padded>
              <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-black/45">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading {selected.name}…
              </div>
            </OrganicCard>
          ) : (
            <>
              <OrganicCard tone="white" cornerSide="tr" padded>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40">
                      Working school
                    </div>
                    <h3 className="mt-1 text-[18px] font-semibold tracking-tight text-black">
                      {selected.name}
                    </h3>
                    <p className="mt-0.5 font-mono text-[12px] text-black/45">
                      {selected.id} · {selected.subdomain}.feezo.app · {selected.status}
                    </p>
                  </div>
                  <div className="min-w-[160px]">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] text-black/45">
                      <span>Progress</span>
                      <span className="font-mono font-semibold text-black">{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#F4F4F5]">
                      <div
                        className="h-full rounded-full bg-[#0F766E] transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  {phaseList.map((phase) => (
                    <div
                      key={phase.id}
                      className={cn(
                        "rounded-xl border px-3 py-2.5",
                        phase.done
                          ? "border-[#99F6E4] bg-[#F0FDFA]"
                          : "border-[#EFEFEF] bg-[#FAFAFA]",
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "grid h-4 w-4 place-items-center rounded-full",
                            phase.done ? "bg-[#0F766E] text-white" : "bg-white ring-1 ring-[#E5E5E5]",
                          )}
                        >
                          {phase.done ? <Check className="h-2.5 w-2.5" /> : null}
                        </span>
                        <span className="text-[11.5px] font-semibold text-black">{phase.title}</span>
                      </div>
                      <p className="mt-1 text-[10.5px] leading-snug text-black/45">{phase.detail}</p>
                    </div>
                  ))}
                </div>
              </OrganicCard>

              <div className="grid grid-cols-12 gap-4">
                <OrganicCard tone="white" cornerSide="tr" padded className="col-span-12 xl:col-span-7">
                  <div className="text-[13px] font-semibold text-black">School data collection</div>
                  <p className="mt-0.5 text-[12px] text-black/45">
                    Saved on this browser per school. Push bank summary + vendor to Feezo when ready.
                  </p>

                  <div className="mt-4 space-y-5">
                    <section className="space-y-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">
                        Contact & KYC
                      </div>
                      <div className="grid grid-cols-12 gap-3">
                        <label className="col-span-12 space-y-1.5 sm:col-span-6">
                          <Label className="text-[11px] text-black/45">Authorised person</Label>
                          <Input
                            value={pack.contactName}
                            onChange={(e) => updatePack({ contactName: e.target.value })}
                            className="h-9 rounded-lg"
                            placeholder="MABROOK ABDULLA CK"
                          />
                        </label>
                        <label className="col-span-12 space-y-1.5 sm:col-span-6">
                          <Label className="text-[11px] text-black/45">Entity type</Label>
                          <Select
                            value={pack.entityType}
                            onValueChange={(v) => updatePack({ entityType: v as EntityType })}
                          >
                            <SelectTrigger className="h-9 rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ENTITY_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </label>
                        <label className="col-span-12 space-y-1.5 sm:col-span-6">
                          <Label className="text-[11px] text-black/45">Email</Label>
                          <Input
                            type="email"
                            value={pack.email}
                            onChange={(e) => updatePack({ email: e.target.value })}
                            className="h-9 rounded-lg"
                            placeholder="mack.mpm@gmail.com"
                          />
                        </label>
                        <label className="col-span-12 space-y-1.5 sm:col-span-6">
                          <Label className="text-[11px] text-black/45">Mobile</Label>
                          <Input
                            value={pack.phone}
                            onChange={(e) =>
                              updatePack({ phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                            }
                            className="h-9 rounded-lg font-mono"
                            placeholder="9744009048"
                          />
                        </label>
                        <label className="col-span-12 space-y-1.5 sm:col-span-6">
                          <Label className="text-[11px] text-black/45">PAN</Label>
                          <Input
                            value={pack.pan}
                            onChange={(e) =>
                              updatePack({ pan: e.target.value.toUpperCase().slice(0, 10) })
                            }
                            className="h-9 rounded-lg font-mono"
                            placeholder="KQLPK4816D"
                          />
                        </label>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">
                        Bank settlement
                      </div>
                      <div className="grid grid-cols-12 gap-3">
                        <label className="col-span-12 space-y-1.5 sm:col-span-6">
                          <Label className="text-[11px] text-black/45">Account holder</Label>
                          <Input
                            value={pack.holder}
                            onChange={(e) => updatePack({ holder: e.target.value })}
                            className="h-9 rounded-lg"
                            placeholder="MABROOK ABDULLA CK"
                          />
                        </label>
                        <label className="col-span-12 space-y-1.5 sm:col-span-6">
                          <Label className="text-[11px] text-black/45">Account number</Label>
                          <Input
                            value={pack.accountNumber}
                            onChange={(e) =>
                              updatePack({ accountNumber: e.target.value.replace(/\s/g, "") })
                            }
                            className="h-9 rounded-lg font-mono"
                            placeholder="99980106670891"
                          />
                        </label>
                        <label className="col-span-12 space-y-1.5 sm:col-span-4">
                          <Label className="text-[11px] text-black/45">IFSC</Label>
                          <Input
                            value={pack.ifsc}
                            onChange={(e) =>
                              updatePack({ ifsc: e.target.value.toUpperCase().replace(/\s/g, "") })
                            }
                            className="h-9 rounded-lg font-mono"
                            placeholder="FDRL0001511"
                          />
                        </label>
                        <label className="col-span-12 space-y-1.5 sm:col-span-4">
                          <Label className="text-[11px] text-black/45">Bank</Label>
                          <Input
                            value={pack.bankName}
                            onChange={(e) => updatePack({ bankName: e.target.value })}
                            className="h-9 rounded-lg"
                            placeholder="Federal Bank"
                          />
                        </label>
                        <label className="col-span-12 space-y-1.5 sm:col-span-4">
                          <Label className="text-[11px] text-black/45">Branch</Label>
                          <Input
                            value={pack.branchName}
                            onChange={(e) => updatePack({ branchName: e.target.value })}
                            className="h-9 rounded-lg"
                            placeholder="Kondotty"
                          />
                        </label>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">
                        Cashfree vendor → Feezo wire
                      </div>
                      <div className="grid grid-cols-12 gap-3">
                        <label className="col-span-12 space-y-1.5 sm:col-span-5">
                          <Label className="text-[11px] text-black/45">Vendor ID</Label>
                          <Input
                            value={pack.vendorId}
                            onChange={(e) =>
                              updatePack({
                                vendorId: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                              })
                            }
                            className="h-9 rounded-lg font-mono"
                            placeholder="FEEZO_AISE"
                          />
                        </label>
                        <label className="col-span-12 space-y-1.5 sm:col-span-4">
                          <Label className="text-[11px] text-black/45">Vendor status</Label>
                          <Select
                            value={pack.vendorStatus}
                            onValueChange={(v) => updatePack({ vendorStatus: v })}
                          >
                            <SelectTrigger className="h-9 rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {VENDOR_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </label>
                        <label className="col-span-12 space-y-1.5 sm:col-span-3">
                          <Label className="text-[11px] text-black/45">Platform fee ₹</Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={pack.platformFee}
                            onChange={(e) => updatePack({ platformFee: e.target.value })}
                            className="h-9 rounded-lg font-mono"
                          />
                        </label>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-3">
                        <div>
                          <div className="text-[13px] font-semibold text-black">
                            Settle to school bank
                          </div>
                          <p className="mt-0.5 text-[11.5px] text-black/45">
                            Requires ACTIVE vendor before Parent Pay can go live
                          </p>
                        </div>
                        <Switch
                          checked={pack.settlementEnabled}
                          onCheckedChange={(on) => updatePack({ settlementEnabled: on })}
                        />
                      </div>
                      <label className="block space-y-1.5">
                        <Label className="text-[11px] text-black/45">Internal notes</Label>
                        <Textarea
                          value={pack.notes}
                          onChange={(e) => updatePack({ notes: e.target.value })}
                          className="min-h-[72px] rounded-xl"
                          placeholder="Cashfree ticket #, name mismatch notes…"
                        />
                      </label>
                    </section>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-[#EFEFEF] pt-4">
                    <Button
                      type="button"
                      disabled={saving}
                      onClick={() => void saveToFeezo()}
                      className="h-9 rounded-full bg-black text-white hover:bg-black/85"
                    >
                      {saving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      Save to Feezo Settlement
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-full"
                      onClick={() => void copyText(vendorPack(selected, pack), "Vendor pack")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy Cashfree pack
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-full"
                      onClick={() => void copyText(docsEmail(selected, pack), "Docs email")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy docs email
                    </Button>
                  </div>
                </OrganicCard>

                <div className="col-span-12 space-y-4 xl:col-span-5">
                  <OrganicCard tone="white" cornerSide="tr" padded>
                    <div className="text-[13px] font-semibold text-black">Ops checklist</div>
                    <p className="mt-0.5 text-[12px] text-black/45">
                      Auto-updates from school data where possible
                    </p>
                    <ul className="mt-3 space-y-2">
                      {(
                        [
                          {
                            key: "leadTagged" as const,
                            label: "Lead tagged Settlement",
                            auto: false,
                            done: pack.checklist.leadTagged,
                          },
                          {
                            key: null,
                            label: "School data complete",
                            auto: true,
                            done: phaseList.find((p) => p.id === "docs")?.done ?? false,
                          },
                          {
                            key: "easySplitEnabled" as const,
                            label: "Cashfree Easy Split live",
                            auto: false,
                            done: pack.checklist.easySplitEnabled,
                          },
                          {
                            key: null,
                            label: "Vendor ACTIVE",
                            auto: true,
                            done: phaseList.find((p) => p.id === "vendor")?.done ?? false,
                          },
                          {
                            key: null,
                            label: "Feezo Settlement ready",
                            auto: true,
                            done: phaseList.find((p) => p.id === "wire")?.done ?? false,
                          },
                          {
                            key: null,
                            label: "Parent Pay on",
                            auto: true,
                            done: !!settlement?.parentPayEnabled,
                          },
                          {
                            key: "testPaymentOk" as const,
                            label: "Test payment verified",
                            auto: false,
                            done: pack.checklist.testPaymentOk,
                          },
                          {
                            key: "leadWon" as const,
                            label: "Lead marked Won",
                            auto: false,
                            done: pack.checklist.leadWon,
                          },
                        ] as const
                      ).map((item) => {
                        const clickable = item.key !== null;
                        return (
                          <li key={item.label}>
                            <button
                              type="button"
                              disabled={!clickable}
                              onClick={() => {
                                if (item.key) updateChecklist(item.key, !item.done);
                              }}
                              className={cn(
                                "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left",
                                item.done
                                  ? "border-[#99F6E4] bg-[#F0FDFA]"
                                  : "border-[#EFEFEF] bg-white",
                                clickable ? "hover:border-black/20" : "cursor-default",
                              )}
                            >
                              <span
                                className={cn(
                                  "grid h-4 w-4 shrink-0 place-items-center rounded border",
                                  item.done
                                    ? "border-[#0F766E] bg-[#0F766E] text-white"
                                    : "border-[#D4D4D8]",
                                )}
                              >
                                {item.done ? <Check className="h-3 w-3" /> : null}
                              </span>
                              <span className="min-w-0 flex-1 text-[12.5px] font-medium text-black/80">
                                {item.label}
                              </span>
                              {item.auto ? (
                                <span className="text-[9px] font-bold uppercase tracking-wide text-black/35">
                                  Auto
                                </span>
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </OrganicCard>

                  <OrganicCard tone="white" cornerSide="tr" padded>
                    <div className="text-[13px] font-semibold text-black">Process</div>
                    <ol className="mt-3 space-y-3">
                      {[
                        {
                          n: "01",
                          t: "Collect",
                          d: "Fill contact, PAN, bank on this page. Send docs email if gaps remain.",
                        },
                        {
                          n: "02",
                          t: "Cashfree",
                          d: "Prod → Easy Split → Add Vendor using Copy Cashfree pack. Wait ACTIVE.",
                        },
                        {
                          n: "03",
                          t: "Wire Feezo",
                          d: "Set vendor status ACTIVE, enable settle, Save to Feezo Settlement.",
                        },
                        {
                          n: "04",
                          t: "Go live",
                          d: "School Parent Pay On → test fee+₹5.90 → mark test + lead Won.",
                        },
                      ].map((step) => (
                        <li key={step.n} className="flex gap-3">
                          <span className="font-mono text-[11px] font-bold text-[#0F766E]">{step.n}</span>
                          <div>
                            <div className="text-[12.5px] font-semibold text-black">{step.t}</div>
                            <p className="mt-0.5 text-[11.5px] leading-snug text-black/50">{step.d}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    {settlement ? (
                      <div className="mt-4 rounded-xl bg-[#F4F4F5] px-3 py-2.5 text-[11px] text-black/55">
                        Feezo now · settlement{" "}
                        <span className="font-semibold text-black">
                          {settlement.settlementReady
                            ? "ready"
                            : settlement.settlementEnabled
                              ? "setup"
                              : "off"}
                        </span>
                        {settlement.parentPayEnabled ? " · Parent Pay on" : " · Parent Pay off"}
                        {settlement.vendorId ? ` · ${settlement.vendorId}` : ""}
                      </div>
                    ) : null}
                  </OrganicCard>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
