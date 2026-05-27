import { Bell, Search, Settings, Code2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export type ViewKey = "overview" | "tenants" | "plans" | "audits";

const NAV: { key: ViewKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "tenants", label: "Tenant Management" },
  { key: "plans", label: "Subscription Plans" },
  { key: "audits", label: "System Audits" },
];

const MODULE_TAG: Record<ViewKey, string> = {
  overview: "super_admin_core_v1",
  tenants: "tenant_lifecycle_v3",
  plans: "billing_matrix_v2",
  audits: "audit_stream_v1",
};

export function TopNav({ active, onChange }: { active: ViewKey; onChange: (k: ViewKey) => void }) {
  return (
    <header className="sticky top-0 z-30 px-6 pt-6">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="flex items-center gap-2.5 pl-1">
          <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "linear-gradient(135deg,#10B981,#6366F1)" }}>
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-slate-900">School Accounts</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Control Plane</div>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/80 p-1">
          {NAV.map((n) => {
            const isActive = active === n.key;
            return (
              <button
                key={n.key}
                onClick={() => onChange(n.key)}
                className={`relative rounded-full px-4 py-1.5 text-[13px] font-medium transition-all ${
                  isActive ? "text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
                style={isActive ? { backgroundColor: "#0F172A" } : undefined}
              >
                {n.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search tenants, invoices…"
              className="h-9 w-64 rounded-full border-slate-200 bg-slate-50/80 pl-9 text-[13px] placeholder:text-slate-400"
            />
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-900">
            <Settings className="h-4 w-4" />
          </button>
          <button className="relative grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-900">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#F59E0B" }} />
          </button>
          <div className="ml-1 grid h-9 w-9 place-items-center rounded-full text-[12px] font-semibold text-white" style={{ background: "linear-gradient(135deg,#6366F1,#0F172A)" }}>
            SA
          </div>
        </div>
      </div>

      <div className="mx-auto mt-2 flex max-w-[1480px] justify-end">
        <div className="flex items-center gap-1.5 rounded-md border border-slate-200/70 bg-white/60 px-2 py-1 font-mono text-[10px] text-slate-500">
          <Code2 className="h-3 w-3" />
          <span>[Stitch-Module: {MODULE_TAG[active]}]</span>
        </div>
      </div>
    </header>
  );
}
