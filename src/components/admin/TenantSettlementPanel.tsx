import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import {
  fetchSuperAdminTenantSettlement,
  saveSuperAdminTenantSettlement,
  type TenantSettlement,
} from "@/lib/api/tenant-settlement";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const VENDOR_STATUSES = [
  "ACTIVE",
  "IN_KYC_REVIEW",
  "IN_BANK_VALIDATION",
  "BANK_VALIDATION_FAILED",
  "IN_BENE_CREATION",
  "BENE_CREATION_FAILED",
  "ACTION_REQUIRED",
  "ON_HOLD",
  "BLOCKED",
] as const;

type Draft = {
  settlementEnabled: boolean;
  vendorId: string;
  vendorStatus: string;
  platformFee: string;
  settlementAccountLast4: string;
  settlementIfsc: string;
  settlementHolder: string;
};

function toDraft(data: TenantSettlement): Draft {
  return {
    settlementEnabled: data.settlementEnabled,
    vendorId: data.vendorId || "",
    vendorStatus: data.vendorStatus || "IN_KYC_REVIEW",
    platformFee: String(data.platformFee ?? 5.9),
    settlementAccountLast4: data.settlementAccountLast4 || "",
    settlementIfsc: data.settlementIfsc || "",
    settlementHolder: data.settlementHolder || "",
  };
}

export function TenantSettlementPanel({
  tenantId,
  tenantName,
}: {
  tenantId: string;
  tenantName: string;
}) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<TenantSettlement | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchSuperAdminTenantSettlement(tenantId)
      .then((data) => {
        if (cancelled) return;
        setSaved(data);
        setDraft(toDraft(data));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not load settlement");
        setSaved(null);
        setDraft(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const dirty =
    !!draft &&
    !!saved &&
    (draft.settlementEnabled !== saved.settlementEnabled ||
      draft.vendorId !== (saved.vendorId || "") ||
      draft.vendorStatus !== (saved.vendorStatus || "IN_KYC_REVIEW") ||
      Number(draft.platformFee) !== Number(saved.platformFee) ||
      draft.settlementAccountLast4 !== (saved.settlementAccountLast4 || "") ||
      draft.settlementIfsc !== (saved.settlementIfsc || "") ||
      draft.settlementHolder !== (saved.settlementHolder || ""));

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save() {
    if (!draft || busy) return;
    const fee = Number(draft.platformFee);
    if (!Number.isFinite(fee) || fee < 0) {
      toast.error("Platform fee must be a valid amount");
      return;
    }
    if (draft.settlementEnabled && !draft.vendorId.trim()) {
      toast.error("Paste the Cashfree vendor ID first");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const next = await saveSuperAdminTenantSettlement({
        tenantId,
        settlementEnabled: draft.settlementEnabled,
        vendorId: draft.vendorId.trim(),
        vendorStatus: draft.vendorStatus,
        platformFee: fee,
        settlementAccountLast4: draft.settlementAccountLast4.trim(),
        settlementIfsc: draft.settlementIfsc.trim().toUpperCase(),
        settlementHolder: draft.settlementHolder.trim(),
      });
      setSaved(next);
      setDraft(toDraft(next));
      toast.success(
        next.settlementReady
          ? "Settlement live — parent fees split to the school bank"
          : "Settlement saved",
      );
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not save settlement";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#E5E5E5] bg-white px-4 py-14 text-[13px] text-black/55">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading settlement…
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="rounded-2xl border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-10 text-center text-[13px] text-[#B91C1C]">
        {error || "Settlement unavailable"}
      </div>
    );
  }

  const ready = saved?.settlementReady;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#E5E5E5] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-black">Parent fee settlement</h3>
            <p className="mt-1 text-[12px] leading-snug text-black/55">
              Cashfree Easy Split for {tenantName}. Parents pay fee + platform fee on Feezo&apos;s
              merchant; the school vendor settles the full fee.
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
              ready
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : draft.settlementEnabled
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-[#E5E5E5] bg-[#F4F4F5] text-black/55",
            )}
          >
            {ready ? "Live split" : draft.settlementEnabled ? "Setup" : "Off"}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-3">
          <div>
            <div className="text-[13px] font-semibold">Settle to school bank</div>
            <p className="mt-0.5 text-[11.5px] text-black/50">
              Requires an ACTIVE Cashfree vendor before Parent Pay can go live.
            </p>
          </div>
          <Switch
            checked={draft.settlementEnabled}
            onCheckedChange={(next) => set("settlementEnabled", next)}
            aria-label="Settle to school bank"
          />
        </div>

        <div className="mt-4 grid grid-cols-12 gap-3">
          <label className="col-span-12 space-y-1.5 sm:col-span-7">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
              Cashfree vendor ID
            </span>
            <Input
              value={draft.vendorId}
              onChange={(e) => set("vendorId", e.target.value)}
              placeholder="FEEZO_AISE"
              className="font-mono text-[13px]"
            />
          </label>
          <label className="col-span-12 space-y-1.5 sm:col-span-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
              Vendor status
            </span>
            <Select value={draft.vendorStatus} onValueChange={(v) => set("vendorStatus", v)}>
              <SelectTrigger className="h-10 rounded-lg border-[#E5E5E5] bg-white text-[13px]">
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
          <label className="col-span-12 space-y-1.5 sm:col-span-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
              Platform fee (₹)
            </span>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={draft.platformFee}
              onChange={(e) => set("platformFee", e.target.value)}
              className="font-mono text-[13px]"
            />
          </label>
          <label className="col-span-6 space-y-1.5 sm:col-span-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
              Account last 4
            </span>
            <Input
              value={draft.settlementAccountLast4}
              onChange={(e) => set("settlementAccountLast4", e.target.value.replace(/\D/g, "").slice(-4))}
              placeholder="0891"
              className="font-mono text-[13px]"
              maxLength={4}
            />
          </label>
          <label className="col-span-6 space-y-1.5 sm:col-span-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
              IFSC
            </span>
            <Input
              value={draft.settlementIfsc}
              onChange={(e) => set("settlementIfsc", e.target.value.toUpperCase())}
              placeholder="FDRL0001511"
              className="font-mono text-[13px]"
            />
          </label>
          <label className="col-span-12 space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
              Account holder
            </span>
            <Input
              value={draft.settlementHolder}
              onChange={(e) => set("settlementHolder", e.target.value)}
              placeholder="MABROOK ABDULLA"
              className="text-[13px]"
            />
          </label>
        </div>

        <p className="mt-3 rounded-xl bg-[#F4F4F5] px-3 py-2 text-[11.5px] leading-snug text-black/55">
          Example: fee ₹1,000 + platform ₹{Number(draft.platformFee || 0).toFixed(2)} → parent pays ₹
          {(1000 + (Number(draft.platformFee) || 0)).toFixed(2)} → school vendor gets ₹1,000 → Feezo
          (Mac Adz) keeps ₹{Number(draft.platformFee || 0).toFixed(2)}. School ledger books ₹1,000.
        </p>

        {error ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-800">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            disabled={busy || !dirty}
            onClick={() => void save()}
            className="rounded-full bg-black text-white hover:bg-black/85 disabled:opacity-45"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save settlement
          </Button>
          {!dirty ? (
            <span className="text-[11px] text-black/40">Saved</span>
          ) : (
            <span className="text-[11px] text-amber-700">Unsaved changes</span>
          )}
        </div>
      </div>
    </div>
  );
}
