import { useMemo, useState } from "react";
import { Plus, Search, MoreVertical, KeyRound, FileText, ScrollText, Pencil, X } from "lucide-react";
import { seedTenants, type Tenant, type Tier, type Status } from "./data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const TIER_STYLE: Record<Tier, { bg: string; fg: string }> = {
  Basic: { bg: "#10B98115", fg: "#047857" },
  Premium: { bg: "#6366F115", fg: "#4338CA" },
  Enterprise: { bg: "#0F172A10", fg: "#0F172A" },
};
const STATUS_STYLE: Record<Status, { bg: string; fg: string; dot: string }> = {
  Active: { bg: "#10B98115", fg: "#047857", dot: "#10B981" },
  Trial: { bg: "#6366F115", fg: "#4338CA", dot: "#6366F1" },
  Overdue: { bg: "#F59E0B1A", fg: "#B45309", dot: "#F59E0B" },
  Suspended: { bg: "#DC262615", fg: "#B91C1C", dot: "#DC2626" },
};

export function TenantsView() {
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>(seedTenants);

  const filtered = useMemo(() => {
    return tenants.filter((t) => {
      if (tier !== "all" && t.tier !== tier) return false;
      if (status !== "all" && t.status !== status) return false;
      if (query && !`${t.name} ${t.subdomain} ${t.id}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [tenants, tier, status, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">School Tenants Registry</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            {filtered.length} of {tenants.length} tenants · isolated routing keys, provisioning &amp; billing
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-95"
          style={{ backgroundColor: "#6366F1" }}
        >
          <Plus className="h-4 w-4" /> Provision New School Tenant
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by school, subdomain, or tenant ID…"
            className="h-9 rounded-full border-slate-200 bg-slate-50 pl-9 text-[13px]"
          />
        </div>
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger className="h-9 w-[170px] rounded-full border-slate-200 bg-slate-50 text-[12px]">
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
          <SelectTrigger className="h-9 w-[170px] rounded-full border-slate-200 bg-slate-50 text-[12px]">
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
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
        <div className="grid grid-cols-[2.4fr_1fr_1.4fr_1fr_56px] gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <div>School Identity</div>
          <div>Plan</div>
          <div>Capacity</div>
          <div>Status</div>
          <div />
        </div>
        {filtered.map((t) => {
          const pct = Math.round((t.students / t.capacity) * 100);
          const tStyle = TIER_STYLE[t.tier];
          const sStyle = STATUS_STYLE[t.status];
          return (
            <div key={t.id} className="grid grid-cols-[2.4fr_1fr_1.4fr_1fr_56px] items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 hover:bg-slate-50/50">
              <div>
                <div className="text-[13px] font-semibold text-slate-900">{t.name}</div>
                <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-slate-500">
                  <span>{t.id}·{t.uuid}</span>
                </div>
                <div className="mt-0.5 font-mono text-[11px]" style={{ color: "#6366F1" }}>
                  {t.subdomain}.schoolaccounts.in
                </div>
              </div>
              <div>
                <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: tStyle.bg, color: tStyle.fg }}>
                  {t.tier}
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                  <span>{t.students.toLocaleString()} / {t.capacity.toLocaleString()}</span>
                  <span>{pct}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{
                    width: `${pct}%`,
                    backgroundColor: pct > 90 ? "#F59E0B" : pct > 70 ? "#6366F1" : "#10B981",
                  }} />
                </div>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: sStyle.bg, color: sStyle.fg }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sStyle.dot }} />
                  {t.status}
                </span>
              </div>
              <div className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem><Pencil className="mr-2 h-3.5 w-3.5" />Edit Tenant Meta</DropdownMenuItem>
                    <DropdownMenuItem><FileText className="mr-2 h-3.5 w-3.5" />Alter Billing Rules</DropdownMenuItem>
                    <DropdownMenuItem><ScrollText className="mr-2 h-3.5 w-3.5" />Audit Connection Logs</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="font-semibold" style={{ color: "#6366F1" }}>
                      <KeyRound className="mr-2 h-3.5 w-3.5" />Securely Impersonate Session
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-[13px] text-slate-500">No tenants match the current filters.</div>
        )}
      </div>

      <TenantFormDrawer
        open={open}
        onOpenChange={setOpen}
        onCreate={(t) => setTenants((prev) => [t, ...prev])}
      />
    </div>
  );
}

function TenantFormDrawer({
  open, onOpenChange, onCreate,
}: { open: boolean; onOpenChange: (v: boolean) => void; onCreate: (t: Tenant) => void }) {
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
    setLegalName(""); setSlug(""); setAdminName(""); setAdminEmail("");
    setContact(""); setGstin(""); setStudents(500); setFaculty(40);
    setTier("Premium"); setCustomDomain(false); setApex("");
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
      createdAt: new Date().toISOString().slice(0, 10),
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[520px]">
        <SheetHeader className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
          <SheetTitle className="text-[16px] font-semibold text-slate-900">Provision New School Tenant</SheetTitle>
          <SheetDescription className="text-[12px] text-slate-500">
            Creates an isolated database routing key &amp; super-user. Sent through Stitch tenant_lifecycle_v3.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 py-5">
          <Field label="Business Entity Legal Name">
            <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="e.g. Silver Hills Educational Trust" />
          </Field>

          <Field label="Subdomain Routing Slug">
            <div className="flex items-stretch overflow-hidden rounded-md border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-indigo-100">
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="silverhills"
                className="flex-1 bg-transparent px-3 py-2 font-mono text-[13px] outline-none"
              />
              <span className="grid place-items-center bg-slate-50 px-3 font-mono text-[12px] text-slate-500">
                .schoolaccounts.in
              </span>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Administrator Full Name">
              <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Anika Roy" />
            </Field>
            <Field label="Administrator Email">
              <Input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@school.in" type="email" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact String">
              <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+91 98XXXXXXXX" />
            </Field>
            <Field label="Tax ID / GSTIN">
              <Input value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="29ABCDE1234F1Z5" className="font-mono" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Student Seat Limit">
              <Input type="number" value={students} onChange={(e) => setStudents(Number(e.target.value) || 0)} className="font-mono" />
            </Field>
            <Field label="Faculty Roster Cap">
              <Input type="number" value={faculty} onChange={(e) => setFaculty(Number(e.target.value) || 0)} className="font-mono" />
            </Field>
          </div>

          <Field label="Subscription Tier">
            <div className="grid grid-cols-3 gap-2">
              {(["Basic", "Premium", "Enterprise"] as Tier[]).map((tt) => {
                const sel = tier === tt;
                return (
                  <button
                    key={tt}
                    onClick={() => setTier(tt)}
                    className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition ${sel ? "border-transparent text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                    style={sel ? { backgroundColor: "#6366F1" } : undefined}
                  >
                    {tt}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-semibold text-slate-900">Custom Root Domain</div>
                <div className="text-[11px] text-slate-500">Route via tenant's own apex (e.g. accounts.school.edu)</div>
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

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <button onClick={() => onOpenChange(false)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700">
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
          <button onClick={submit} className="rounded-full px-4 py-2 text-[12px] font-semibold text-white shadow-sm" style={{ backgroundColor: "#10B981" }}>
            Provision Tenant
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</Label>
      {children}
    </div>
  );
}
