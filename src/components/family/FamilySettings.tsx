import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  KeyRound,
  Loader2,
  LogOut,
  Moon,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { FamilyCard, FamilyHeader, FamilyPillButton, FamilySectionTitle } from "@/components/family/FamilyChrome";
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
      <div className="space-y-5 px-4 pb-6">
        <div>
          <FamilySectionTitle>Settings</FamilySectionTitle>
          <div className="flex items-center gap-3 rounded-[24px] bg-gradient-to-r from-[#E8E4FF] to-[#E3F0FF] p-3.5 shadow-[var(--family-shadow)] dark:from-[var(--family-lavender)] dark:to-[var(--family-sky)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--family-ink)] shadow-sm">
              <UserRound className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold text-[var(--family-ink)]">
                {profile?.parent.name || "Parent"}
              </span>
              <span className="block text-xs font-medium text-[var(--family-ink-muted)]">Parent account</span>
            </span>
            {profile?.parent.verified ? (
              <span className="rounded-full bg-[var(--family-mint)] px-2.5 py-1 text-[10px] font-bold text-[var(--family-mint-deep)]">
                Valid
              </span>
            ) : (
              <span className="rounded-full bg-[var(--family-cream)] px-2.5 py-1 text-[10px] font-bold text-[var(--family-cream-deep)]">
                Invite
              </span>
            )}
          </div>
        </div>

        <div>
          <FamilySectionTitle>Account</FamilySectionTitle>
          <FamilyCard className="!gap-0 divide-y divide-[#EEF0F8] !p-0 dark:divide-white/10">
            <SettingsRow
              icon={<CalendarDays className="h-4 w-4" />}
              iconClass="bg-[var(--family-lavender)] text-[var(--family-lavender-deep)]"
              label="Academic year"
              trailing={
                <YearMenu
                  value={profile?.parent.academicYear ?? ""}
                  disabled={switching}
                  options={profile?.academicYears ?? []}
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
              }
            />
            <SettingsRow
              icon={<ArrowLeftRight className="h-4 w-4" />}
              iconClass="bg-[var(--family-mint)] text-[var(--family-mint-deep)]"
              label="Switch student"
              trailing={
                <StudentMenu
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
              }
            />
            {previewName ? (
              <div className="px-4 py-3 text-xs text-[var(--family-ink-muted)]">
                Password changes are turned off while previewing this account.
              </div>
            ) : (
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                onClick={() => setOpen((value) => !value)}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF0E0] text-[#D4920A]">
                  <KeyRound className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold">Change password</span>
                <ChevronRight className="h-4 w-4 text-[var(--family-ink-muted)]" />
              </button>
            )}
            {open ? (
              <form
                className="space-y-2 px-4 pb-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!busy) void savePassword();
                }}
              >
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={current}
                  onChange={(event) => setCurrent(event.target.value)}
                  className="rounded-xl"
                />
                <Label htmlFor="next-password">New password</Label>
                <Input
                  id="next-password"
                  type="password"
                  value={next}
                  onChange={(event) => setNext(event.target.value)}
                  className="rounded-xl"
                />
                {error ? <p className="text-xs text-[var(--family-pink-deep)]">{error}</p> : null}
                <FamilyPillButton type="submit" disabled={busy || next.length < 8 || !current} className="h-11 w-full">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save password
                </FamilyPillButton>
              </form>
            ) : null}
          </FamilyCard>
        </div>

        <div>
          <FamilySectionTitle>More</FamilySectionTitle>
          <FamilyCard className="!gap-0 divide-y divide-[#EEF0F8] !p-0 dark:divide-white/10">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--family-sky)] text-[var(--family-sky-deep)]">
                <Moon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold">Dark mode</span>
              <button
                type="button"
                role="switch"
                aria-checked={theme === "dark"}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={cn(
                  "relative h-7 w-12 rounded-full p-1 transition",
                  theme === "dark" ? "bg-[var(--family-lavender-deep)]" : "bg-[#E4E6F0]",
                )}
              >
                <span
                  className={cn(
                    "block h-5 w-5 rounded-full bg-white shadow transition",
                    theme === "dark" && "translate-x-5",
                  )}
                />
              </button>
            </div>
            <Link to="/privacy" className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--family-mint)] text-[var(--family-mint-deep)]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold">Privacy policy</span>
              <ChevronRight className="h-4 w-4 text-[var(--family-ink-muted)]" />
            </Link>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--family-lavender)] text-[var(--family-lavender-deep)]">
                <Info className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold">App details</span>
              <span className="text-xs font-semibold text-[var(--family-ink-muted)]">v{APP_VERSION}</span>
            </div>
          </FamilyCard>
        </div>

        <button
          type="button"
          disabled={leaving}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--family-radius-pill)] bg-[var(--family-pink)] text-sm font-bold text-[var(--family-pink-deep)] transition active:scale-[0.99] disabled:opacity-60"
          onClick={() => {
            setLeaving(true);
            if (previewName) {
              void endPreview();
              return;
            }
            void signOut().then(() => navigate({ href: "/family/login" }));
          }}
        >
          {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          {previewName ? "Exit preview" : "Log out"}
        </button>
      </div>
    </>
  );
}

function SettingsRow({
  icon,
  iconClass,
  label,
  trailing,
}: {
  icon: ReactNode;
  iconClass: string;
  label: string;
  trailing: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconClass)}>{icon}</span>
      <span className="min-w-0 flex-1 text-sm font-semibold">{label}</span>
      {trailing}
    </div>
  );
}

function YearMenu({
  value,
  options,
  disabled,
  onPick,
}: {
  value: string;
  options: string[];
  disabled?: boolean;
  onPick: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled || options.length === 0}
          className="inline-flex h-8 max-w-[9rem] items-center gap-1 rounded-full bg-[var(--family-lavender)] px-3 text-xs font-bold text-[var(--family-lavender-deep)] disabled:opacity-60"
        >
          <span className="truncate">{value || "Choose"}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-2xl border-0 p-1.5 shadow-lg">
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            className="gap-2 rounded-xl"
            onSelect={() => {
              if (option !== value) onPick(option);
            }}
          >
            <span className="flex-1">{option}</span>
            {option === value ? <Check className="h-4 w-4 text-[var(--family-lavender-deep)]" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StudentMenu({
  value,
  options,
  disabled,
  onPick,
}: {
  value: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onPick: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled || options.length === 0}
          aria-label="Switch student"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4FB] text-[var(--family-ink-muted)] disabled:opacity-60 dark:bg-white/10"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem] rounded-2xl border-0 p-1.5 shadow-lg">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className="gap-2 rounded-xl"
            onSelect={() => {
              if (option.value !== value) onPick(option.value);
            }}
          >
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            {option.value === value ? <Check className="h-4 w-4 text-[var(--family-mint-deep)]" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
