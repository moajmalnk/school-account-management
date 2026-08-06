import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CreditCard,
  LayoutDashboard,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";

import { ADMIN_NAV } from "@/components/admin/admin-nav";
import { type Tenant } from "@/components/admin/data";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchSuperAdminTenants } from "@/lib/api/super-admin";
import { getApiToken } from "@/lib/api/client";

const PLAN_ITEMS = [
  { name: "Basic", hint: "₹899/mo · core school ops & reporting" },
  { name: "Premium", hint: "₹1,499/mo · fee collection & extra users" },
  { name: "Enterprise", hint: "₹2,299/mo · payroll & WhatsApp" },
] as const;

const NAV_ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  tenants: Users,
  plans: CreditCard,
};

function isMacPlatform() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

type GlobalSearchProps = {
  /** Compact icon-only trigger for smaller breakpoints */
  variant?: "field" | "icon";
};

export function GlobalSearch({ variant = "field" }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [modKey, setModKey] = useState("⌘");
  const navigate = useNavigate();

  useEffect(() => {
    setModKey(isMacPlatform() ? "⌘" : "Ctrl");
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      setOpen((prev) => !prev);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        if (!getApiToken()) {
          if (!cancelled) setTenants([]);
          return;
        }
        const list = await fetchSuperAdminTenants();
        if (!cancelled) setTenants(list);
      } catch {
        if (!cancelled) setTenants([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-full border border-[#E5E5E5] bg-white text-black/55 transition-colors hover:bg-black hover:text-white"
          aria-label="Open global search"
        >
          <Search className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative flex h-10 w-56 items-center gap-2 rounded-full border border-[#E5E5E5] bg-white px-3.5 text-left text-[13px] text-black/40 transition-colors hover:border-black/20 hover:text-black/55"
          aria-label="Open global search"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-black/40 group-hover:text-black/55" />
          <span className="flex-1 truncate">Search…</span>
          <kbd className="pointer-events-none hidden h-5 shrink-0 items-center gap-0.5 rounded-md border border-[#E5E5E5] bg-[#F4F6F9] px-1.5 font-mono text-[10px] font-medium text-black/45 sm:inline-flex">
            {modKey}K
          </kbd>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[18%] translate-y-0 gap-0 overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white p-0 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)] sm:max-w-xl [&>button]:hidden">
          <DialogTitle className="sr-only">Global search</DialogTitle>
          <DialogDescription className="sr-only">
            Search navigation, tenants, and plans across the control plane
          </DialogDescription>
          <Command className="rounded-2xl bg-white text-black [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-black/40">
            <CommandInput
              placeholder="Search tenants, plans, pages…"
              className="h-12 text-[14px] text-black placeholder:text-black/35"
            />
            <CommandList className="max-h-[min(420px,55vh)] px-1.5 pb-2">
              <CommandEmpty className="py-8 text-[13px] text-black/45">
                No matches · try a school name, plan, or page
              </CommandEmpty>

              <CommandGroup heading="Navigate">
                {ADMIN_NAV.map((item) => {
                  const Icon = NAV_ICONS[item.key] ?? LayoutDashboard;
                  return (
                    <CommandItem
                      key={item.key}
                      value={`${item.label} ${item.key} page`}
                      onSelect={() => go(item.to)}
                      className="cursor-pointer rounded-xl px-3 py-2.5 text-[13px] aria-selected:bg-[#F4F6F9]"
                    >
                      <Icon className="h-4 w-4 text-black/45" />
                      <span className="font-medium text-black">{item.label}</span>
                      <span className="ml-auto font-mono text-[10px] text-black/35">
                        {item.to.replace("/super-admin/", "/")}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              <CommandSeparator className="my-1 bg-[#E5E5E5]" />

              <CommandGroup heading="Tenants">
                {tenants.map((tenant) => (
                  <CommandItem
                    key={tenant.id}
                    value={`${tenant.name} ${tenant.subdomain} ${tenant.id} ${tenant.tier} ${tenant.status}`}
                    onSelect={() => go("/super-admin/tenants")}
                    className="cursor-pointer rounded-xl px-3 py-2.5 text-[13px] aria-selected:bg-[#F4F6F9]"
                  >
                    <Users className="h-4 w-4 text-black/45" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-black">{tenant.name}</div>
                      <div className="truncate font-mono text-[10.5px] text-black/40">
                        {tenant.id} · {tenant.subdomain}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-medium text-black/55">
                      {tenant.tier}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator className="my-1 bg-[#E5E5E5]" />

              <CommandGroup heading="Plans">
                {PLAN_ITEMS.map((plan) => (
                  <CommandItem
                    key={plan.name}
                    value={`${plan.name} plan ${plan.hint}`}
                    onSelect={() => go("/super-admin/plans")}
                    className="cursor-pointer rounded-xl px-3 py-2.5 text-[13px] aria-selected:bg-[#F4F6F9]"
                  >
                    <CreditCard className="h-4 w-4 text-black/45" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-black">{plan.name}</div>
                      <div className="truncate text-[11px] text-black/40">{plan.hint}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className="flex items-center justify-between border-t border-[#E5E5E5] bg-[#FAFBFC] px-3 py-2 text-[10.5px] text-black/40">
              <span>↑↓ navigate · ↵ open · esc close</span>
              <span className="font-mono">{modKey}K</span>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
