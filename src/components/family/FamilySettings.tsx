import { Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, ChevronRight, Loader2, LogOut, Moon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FamilyCard, FamilyHeader } from "@/components/family/FamilyChrome";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { familyChangePassword } from "@/lib/api/family";
import { ApiError } from "@/lib/api/client";
import { useFamily } from "@/lib/family-session";
import { cn } from "@/lib/utils";

const APP_VERSION = "1.0.0";

function SettingsMenu({
  label,
  value,
  options,
  disabled,
  onPick,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onPick: (value: string) => void;
}) {
  const current = options.find((option) => option.value === value);
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled || options.length === 0}
            aria-label={label}
            className="group inline-flex h-9 max-w-[12rem] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <span className="truncate">{current?.label || "Choose"}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="z-50 min-w-[11rem] rounded-2xl border-slate-200 bg-white p-1.5 text-slate-900 shadow-lg dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <DropdownMenuItem
                key={option.value}
                className={cn(
                  "gap-2 rounded-xl px-2.5 py-2 text-sm focus:bg-[#F0FDFA] focus:text-slate-900 dark:focus:bg-teal-950 dark:focus:text-zinc-100",
                  selected && "bg-[#F0FDFA] dark:bg-teal-950",
                )}
                onSelect={() => {
                  if (option.value !== value) onPick(option.value);
                }}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {selected ? <Check className="h-4 w-4 text-[#0F766E]" /> : <span className="h-4 w-4" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function FamilySettings() {
  const navigate = useNavigate();
  const { profile, student, theme, setTheme, setYear, signOut, selectStudent, previewName, endPreview, confirmLeave } =
    useFamily();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);

  async function savePassword() {
    if (next.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (!current) {
      setError("Enter the current password");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await familyChangePassword(current, next);
      setCurrent("");
      setNext("");
      setOpen(false);
      toast.success("Password updated");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FamilyHeader showBell={false} />
      <div className="space-y-4 px-4 pb-4">
        <h1 className="text-lg font-semibold">Settings</h1>
        <FamilyCard className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 font-semibold text-[#0F766E]">
            {(profile?.parent.name || "P").slice(0, 1)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{profile?.parent.name || "Parent"}</span>
            <span className="block text-xs text-slate-500">Parent account</span>
          </span>
          {profile?.parent.verified ? (
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-800">
              Valid
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase text-amber-800">
              Invite
            </span>
          )}
        </FamilyCard>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account</p>
        <FamilyCard className="space-y-3">
          <SettingsMenu
            label="Academic year"
            value={profile?.parent.academicYear ?? ""}
            disabled={switching}
            options={(profile?.academicYears ?? []).map((year) => ({ value: year, label: year }))}
            onPick={(year) => {
              if (!confirmLeave()) return;
              setSwitching(true);
              void setYear(year)
                .catch((err) => {
                  toast.error(err instanceof ApiError ? err.message : "Could not switch the academic year");
                })
                .finally(() => setSwitching(false));
            }}
          />
          <SettingsMenu
            label="Switch student"
            value={student?.id ?? ""}
            disabled={switching}
            options={(profile?.students ?? []).map((item) => ({ value: item.id, label: item.name }))}
            onPick={(id) => {
              if (!confirmLeave()) return;
              setSwitching(true);
              void selectStudent(id)
                .catch((err) => {
                  toast.error(err instanceof ApiError ? err.message : "Could not switch student");
                })
                .finally(() => setSwitching(false));
            }}
          />
          {previewName ? (
            <p className="text-xs text-slate-500">Password changes are turned off while previewing this account.</p>
          ) : (
            <button type="button" className="flex w-full items-center justify-between text-sm" onClick={() => setOpen((value) => !value)}>
              Change password
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {open ? (
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!busy) void savePassword();
              }}
            >
              <Label htmlFor="current-password">Current password</Label>
              <Input id="current-password" type="password" value={current} onChange={(event) => setCurrent(event.target.value)} className="rounded-xl" />
              <Label htmlFor="next-password">New password</Label>
              <Input id="next-password" type="password" value={next} onChange={(event) => setNext(event.target.value)} className="rounded-xl" />
              {error ? <p className="text-xs text-rose-600">{error}</p> : null}
              <Button type="submit" disabled={busy || next.length < 8 || !current} className="rounded-xl bg-[#0F766E] text-white">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save password
              </Button>
            </form>
          ) : null}
        </FamilyCard>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mode</p>
        <FamilyCard className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            <Moon className="h-4 w-4" /> Dark mode
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={theme === "dark"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={theme === "dark" ? "h-7 w-12 rounded-full bg-[#0F766E] p-1" : "h-7 w-12 rounded-full bg-slate-200 p-1"}
          >
            <span className={theme === "dark" ? "block h-5 w-5 translate-x-5 rounded-full bg-white" : "block h-5 w-5 rounded-full bg-white"} />
          </button>
        </FamilyCard>
        <FamilyCard className="space-y-3 text-sm">
          <Link to="/privacy" className="flex items-center justify-between">
            Privacy policy <ChevronRight className="h-4 w-4" />
          </Link>
          <p className="flex items-center justify-between text-slate-500">
            App details <span>Feezo Family {APP_VERSION}</span>
          </p>
        </FamilyCard>
        <Button
          type="button"
          variant="outline"
          disabled={leaving}
          className="h-11 w-full rounded-xl"
          onClick={() => {
            setLeaving(true);
            if (previewName) {
              void endPreview();
              return;
            }
            void signOut().then(() => navigate({ href: "/family/login" }));
          }}
        >
          {leaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
          {previewName ? "Exit preview" : "Log out"}
        </Button>
      </div>
    </>
  );
}
