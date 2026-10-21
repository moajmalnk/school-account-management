import { ExternalLink, KeyRound, Loader2, MessageCircle, Phone, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { schoolAnnouncements, schoolHolidays, schoolParentAction, schoolParents, schoolSaveAnnouncement, schoolSaveHoliday, type SchoolParent } from "@/lib/api/school-family";
import { stageFamilyPreview, clearFamilyPreviewHandoff } from "@/lib/api/family";
import { ApiError } from "@/lib/api/client";
import { formatPhoneDisplay, phoneDigits, toWhatsAppDigits } from "@/lib/phone";
import type { Student } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

const CARD =
  "rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 dark:border-white/10 dark:bg-[#171717] dark:text-zinc-100";
const LABEL =
  "text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-zinc-400";

type Announcement = Awaited<ReturnType<typeof schoolAnnouncements>>["announcements"][number];
type Holiday = { id: string; date: string; label: string };
type Confirm =
  | { kind: "account"; parent: SchoolParent }
  | { kind: "reset"; parent: SchoolParent }
  | { kind: "banner"; id: string; title: string }
  | { kind: "holiday"; id: string; label: string };

/**
 * Parent-app account and school notices for one student, shown on the profile tab.
 */
export function StudentParentsAppPanel({ student }: { student: Student }) {
  const [parents, setParents] = useState<SchoolParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  async function loadParents() {
    const data = await schoolParents("", student.id);
    setParents(parentsForStudent(data.parents, student.id));
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void schoolParents("", student.id)
      .then((data) => {
        if (!cancelled) setParents(parentsForStudent(data.parents, student.id));
      })
      .catch((err) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Could not load the parent account");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [student.id]);

  async function preview(parent: SchoolParent) {
    if (!parent.active) return;
    const tab = window.open("", "_blank");
    if (!tab) {
      toast.error("Allow pop-ups to open the parent app");
      return;
    }
    setBusyId(`view:${parent.id}`);
    try {
      const result = await schoolParentAction({ action: "impersonate", id: parent.id });
      if (!result.token) throw new Error("Could not open the parent app");
      stageFamilyPreview({
        token: result.token,
        refreshToken: result.refreshToken,
        name: parent.name || "Parent",
      });
      tab.location.replace("/family");
      try {
        tab.opener = null;
      } catch {
        // The preview tab can still be closed from Exit preview.
      }
      toast.success(`Opening ${parent.name || "the parent"}'s family app`, {
        description: "New tab. Your school login stays here.",
      });
    } catch (err) {
      clearFamilyPreviewHandoff();
      tab.close();
      toast.error(err instanceof ApiError ? err.message : "Could not open the parent app");
    } finally {
      setBusyId("");
    }
  }

  async function invite(parent: SchoolParent) {
    setBusyId(parent.id);
    try {
      const result = await schoolParentAction({ action: "invite", id: parent.id });
      const text = `Feezo Family for ${result.name}: ${result.url}`;
      if (result.phone) {
        window.open(`https://wa.me/${result.phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
      }
      toast.success("Invite link ready");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create the invite");
    } finally {
      setBusyId("");
    }
  }

  async function resetPassword(parent: SchoolParent) {
    setBusyId(`reset:${parent.id}`);
    try {
      const result = await schoolParentAction({ action: "reset", id: parent.id });
      const url = result.url ?? "";
      if (!url) throw new Error("Could not create the reset link");
      const text = `${result.name || parent.name || "Parent"}, choose a new Feezo Family password with this link. It works for 1 hour: ${url}`;
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // WhatsApp still carries the link when the clipboard is blocked.
      }
      const phone = toWhatsAppDigits(result.phone || parent.phone);
      if (phone) {
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
      }
      setConfirm(null);
      toast.success("Reset link copied", {
        description: phone
          ? "WhatsApp is open so you can send it. The parent chooses the password."
          : "Send the copied link to the parent. They choose the password.",
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create the reset link");
    } finally {
      setBusyId("");
    }
  }

  async function setupAccount() {
    if (!student.phone) return;
    setBusyId("setup");
    try {
      await schoolParentAction({
        action: "link",
        studentId: student.id,
        phone: student.phone,
        name: student.guardian || "Parent",
        relation: student.guardianRelation || "Others",
      });
      await loadParents();
      toast.success("Parent account ready");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create the account");
    } finally {
      setBusyId("");
    }
  }

  async function applyAccount(parent: SchoolParent) {
    setBusyId(parent.id);
    try {
      await schoolParentAction({ action: parent.active ? "deactivate" : "activate", id: parent.id });
      setConfirm(null);
      await loadParents();
      toast.success(parent.active ? "Parent deactivated" : "Parent activated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update the account");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5">
      <section className={CARD}>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#CCFBF1] text-[#0F766E] dark:bg-[#0F766E]/25 dark:text-[#5EEAD4]">
            <Smartphone className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-black dark:text-zinc-50">Parents app</h2>
            <p className="mt-1 text-[12.5px] text-black/50 dark:text-zinc-400">
              The family account that can open attendance, leave, fees, and results for {student.name}.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-5 space-y-3" aria-busy="true" aria-label="Loading parent account">
            <div className="h-12 animate-pulse rounded-xl bg-slate-200 dark:bg-zinc-800" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-200 dark:bg-zinc-800" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-200 dark:bg-zinc-800" />
          </div>
        ) : parents.length === 0 ? (
          <EmptyAccount student={student} busy={busyId === "setup"} onSetup={() => void setupAccount()} />
        ) : (
          <div className="mt-5 grid gap-4">
            {parents.map((parent) => (
              <ParentAccount
                key={parent.id}
                student={student}
                parent={parent}
                busy={busyId === parent.id}
                resetBusy={busyId === `reset:${parent.id}`}
                viewBusy={busyId === `view:${parent.id}`}
                onInvite={() => void invite(parent)}
                onReset={() => setConfirm({ kind: "reset", parent })}
                onPreview={() => void preview(parent)}
                onAccount={() => setConfirm({ kind: "account", parent })}
              />
            ))}
          </div>
        )}
      </section>

      <SharedNotices
        busyId={busyId}
        onRemoveBanner={(row) => setConfirm({ kind: "banner", id: row.id, title: row.title })}
        onRemoveHoliday={(row) => setConfirm({ kind: "holiday", id: row.id, label: row.label })}
      />

      {confirm ? (
        <ConfirmBlock
          confirm={confirm}
          busy={busyId !== ""}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm.kind === "account") {
              void applyAccount(confirm.parent);
              return;
            }
            if (confirm.kind === "reset") {
              void resetPassword(confirm.parent);
              return;
            }
            if (confirm.kind === "banner") {
              setBusyId(confirm.id);
              void schoolSaveAnnouncement({ action: "delete", id: confirm.id })
                .then(() => {
                  toast.success("Banner removed");
                  setConfirm(null);
                  window.dispatchEvent(new CustomEvent("feezo-parent-notices"));
                })
                .catch((err) => toast.error(err instanceof Error ? err.message : "Could not remove the banner"))
                .finally(() => setBusyId(""));
              return;
            }
            setBusyId(confirm.id);
            void schoolSaveHoliday({ action: "delete", id: confirm.id })
              .then(() => {
                toast.success("Holiday removed");
                setConfirm(null);
                window.dispatchEvent(new CustomEvent("feezo-parent-notices"));
              })
              .catch((err) => toast.error(err instanceof Error ? err.message : "Could not remove the holiday"))
              .finally(() => setBusyId(""));
          }}
        />
      ) : null}
    </div>
  );
}

function EmptyAccount({
  student,
  busy,
  onSetup,
}: {
  student: Student;
  busy: boolean;
  onSetup: () => void;
}) {
  const digits = phoneDigits(student.phone);
  return (
    <div className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-white/15">
      <p className="text-sm text-slate-600 dark:text-zinc-300">
        {student.name} does not have a parent account yet.
      </p>
      <p className="mt-1 text-[12.5px] text-slate-500 dark:text-zinc-400">
        {digits
          ? `Use ${formatPhoneDisplay(student.phone)} from the student profile to create one.`
          : "Add a contact phone on the profile first. That number becomes the parent sign-in."}
      </p>
      <Button
        type="button"
        className="mt-4 rounded-xl bg-[#0F766E] text-white hover:bg-[#0D9488]"
        disabled={!digits || busy}
        onClick={onSetup}
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Set up account
      </Button>
    </div>
  );
}

function ParentAccount({
  student,
  parent,
  busy,
  resetBusy,
  viewBusy,
  onInvite,
  onReset,
  onPreview,
  onAccount,
}: {
  student: Student;
  parent: SchoolParent;
  busy: boolean;
  resetBusy: boolean;
  viewBusy: boolean;
  onInvite: () => void;
  onReset: () => void;
  onPreview: () => void;
  onAccount: () => void;
}) {
  const link = parent.students.find((item) => item.id === student.id);
  const siblings = parent.students.filter((item) => item.id !== student.id);
  const digits = phoneDigits(parent.phone);
  const waDigits = toWhatsAppDigits(parent.phone);
  const rows: { label: string; value: string }[] = [
    { label: "Parent", value: parent.name || "Parent" },
    { label: "Phone", value: parent.phone ? formatPhoneDisplay(parent.phone) : "No phone" },
    { label: "Relation", value: link?.relation || student.guardianRelation || "Guardian" },
    { label: "Status", value: accountStatus(parent) },
    {
      label: "Also linked",
      value: siblings.length > 0 ? siblings.map((item) => `${item.name} · ${item.cls}`).join(", ") : "Only this student",
    },
  ];
  return (
    <div className="rounded-xl border border-slate-100 dark:border-white/10">
      <dl>
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:grid-cols-[11rem_1fr] sm:items-center dark:border-white/10"
          >
            <dt className={LABEL}>{row.label}</dt>
            <dd className={cn("text-[14px] font-medium text-black dark:text-zinc-100", row.label === "Phone" && "font-mono")}>
              {row.value}
            </dd>
          </div>
        ))}
        <div className="grid gap-2 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:items-center">
          <div className={LABEL}>Functions</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!waDigits || busy}
              onClick={onInvite}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-[#10B981] px-2.5 text-[11px] font-semibold text-white hover:bg-[#059669] disabled:cursor-not-allowed disabled:bg-black/15 disabled:text-black/40"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" />}
              Invite
            </button>
            <button
              type="button"
              disabled={!parent.active || busy || resetBusy || viewBusy}
              onClick={onReset}
              title={parent.active ? "Send a 1-hour link so the parent can choose a new password" : "Activate this parent first"}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-[#99F6E4] bg-[#F0FDFA] px-2.5 text-[11px] font-semibold text-[#0F766E] hover:bg-[#CCFBF1] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-black/15 disabled:text-black/40"
            >
              {resetBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
              Reset password
            </button>
            <a
              href={digits ? `tel:${digits}` : undefined}
              aria-disabled={!digits}
              className={cn(
                "inline-flex h-8 items-center gap-1 rounded-full bg-[#0F766E] px-2.5 text-[11px] font-semibold text-white hover:bg-[#0D9488]",
                !digits && "pointer-events-none bg-black/15 text-black/40",
              )}
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
            <button
              type="button"
              disabled={!parent.active || busy || viewBusy}
              onClick={onPreview}
              title={parent.active ? "Open this parent's family app in a new tab" : "Activate this parent first"}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-[#99F6E4] bg-[#F0FDFA] px-2.5 text-[11px] font-semibold text-[#0F766E] hover:bg-[#CCFBF1] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-black/15 disabled:text-black/40"
            >
              {viewBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
              Login as
            </button>
            <button
              type="button"
              onClick={onAccount}
              disabled={busy || viewBusy}
              className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {parent.active ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>
      </dl>
    </div>
  );
}

function parentsForStudent(parents: SchoolParent[], studentId: string) {
  return parents.filter((parent) => parent.students.some((item) => item.id === studentId));
}

function accountStatus(parent: SchoolParent) {
  if (!parent.active) return "Inactive";
  if (!parent.verified) return "Waiting for invite";
  return "Signed in";
}

function SharedNotices({
  busyId,
  onRemoveBanner,
  onRemoveHoliday,
}: {
  busyId: string;
  onRemoveBanner: (row: Announcement) => void;
  onRemoveHoliday: (row: Holiday) => void;
}) {
  const [banners, setBanners] = useState<Announcement[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState("");
  const [label, setLabel] = useState("Holiday");
  const [bannerError, setBannerError] = useState("");
  const [holidayError, setHolidayError] = useState("");
  const [busy, setBusy] = useState<"banner" | "holiday" | "">("");

  async function load() {
    const [bannerData, holidayData] = await Promise.all([schoolAnnouncements(), schoolHolidays()]);
    setBanners(bannerData.announcements);
    setHolidays(holidayData.holidays);
  }

  useEffect(() => {
    let cancelled = false;
    void load()
      .catch((err) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Could not load parent notices");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    const refresh = () => {
      void load().catch(() => undefined);
    };
    window.addEventListener("feezo-parent-notices", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("feezo-parent-notices", refresh);
      setTitle("");
      setBody("");
      setDate("");
      setLabel("Holiday");
    };
  }, []);

  return (
    <section className={CARD}>
      <h2 className="text-base font-semibold text-black dark:text-zinc-50">What every parent sees</h2>
      <p className="mt-1 text-[12.5px] text-black/50 dark:text-zinc-400">
        Home banners and school holidays are shared across the parent app.
      </p>
      {loading ? (
        <div className="mt-4 h-16 animate-pulse rounded-xl bg-slate-200 dark:bg-zinc-800" aria-busy="true" />
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:gap-6">
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!title.trim()) {
                setBannerError("Title is required");
                return;
              }
              setBannerError("");
              setBusy("banner");
              void schoolSaveAnnouncement({ title: title.trim(), body: body.trim() })
                .then(() => {
                  setTitle("");
                  setBody("");
                  toast.success("Banner published");
                  return load();
                })
                .catch((err) => toast.error(err instanceof Error ? err.message : "Could not save"))
                .finally(() => setBusy(""));
            }}
          >
            <div className={LABEL}>Home banner</div>
            <Input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="Banner title" className="rounded-xl" />
            {bannerError ? <p className="text-xs text-rose-600">{bannerError}</p> : null}
            <Input value={body} maxLength={500} onChange={(event) => setBody(event.target.value)} placeholder="Message" className="rounded-xl" />
            <Button type="submit" disabled={busy === "banner" || !title.trim()} className="rounded-xl bg-[#0F766E] text-white hover:bg-[#0D9488]">
              {busy === "banner" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Publish banner
            </Button>
            <ul className="space-y-2">
              {banners.length === 0 ? <li className="text-[13px] text-slate-500">No banners yet.</li> : null}
              {banners.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 dark:border-white/10">
                  <span className="min-w-0 truncate text-sm">{row.title}</span>
                  <Button type="button" variant="outline" className="rounded-xl" disabled={busyId === row.id} onClick={() => onRemoveBanner(row)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </form>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!date) {
                setHolidayError("Choose a date");
                return;
              }
              setHolidayError("");
              setBusy("holiday");
              void schoolSaveHoliday({ date, label: label.trim() || "Holiday" })
                .then(() => {
                  setDate("");
                  setLabel("Holiday");
                  toast.success("Holiday saved");
                  return load();
                })
                .catch((err) => toast.error(err instanceof Error ? err.message : "Could not save"))
                .finally(() => setBusy(""));
            }}
          >
            <div className={LABEL}>Holiday calendar</div>
            <DatePicker
              value={date}
              onChange={(value) => {
                setDate(value);
                if (value) setHolidayError("");
              }}
              valueFormat="iso"
              placeholder="Holiday date"
              className="rounded-xl"
            />
            {holidayError ? <p className="text-xs text-rose-600">{holidayError}</p> : null}
            <Input value={label} maxLength={128} onChange={(event) => setLabel(event.target.value)} className="rounded-xl" aria-label="Holiday name" />
            <Button type="submit" disabled={busy === "holiday" || !date} className="rounded-xl bg-[#0F766E] text-white hover:bg-[#0D9488]">
              {busy === "holiday" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add holiday
            </Button>
            <ul className="space-y-2">
              {holidays.length === 0 ? <li className="text-[13px] text-slate-500">No holidays on the calendar.</li> : null}
              {holidays.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 text-sm dark:border-white/10">
                  <span className="min-w-0 truncate">
                    <span className="font-mono text-[12px] text-slate-500">{row.date}</span> · {row.label}
                  </span>
                  <Button type="button" variant="outline" className="rounded-xl" disabled={busyId === row.id} onClick={() => onRemoveHoliday(row)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </form>
        </div>
      )}
    </section>
  );
}

function ConfirmBlock({
  confirm,
  busy,
  onCancel,
  onConfirm,
}: {
  confirm: Confirm;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const name = confirm.kind === "account" || confirm.kind === "reset" ? confirm.parent.name || "this parent" : "";
  const copy =
    confirm.kind === "reset"
      ? confirm.parent.verified
        ? `Send ${name} a new password link? The previous link stops working. After they choose a password, their other family sessions are signed out. The link lasts 1 hour, and the school never sees the password.`
        : `${name} has not finished the invite. This replaces that link with a 1-hour password link. They choose the password. The school never sees it.`
      : confirm.kind === "account"
        ? confirm.parent.active
          ? `Deactivate ${name}? They will be signed out.`
          : `Activate ${name}?`
        : confirm.kind === "banner"
          ? `Remove “${confirm.title}”? Parents will no longer see it.`
          : `Remove ${confirm.label} from the holiday calendar?`;
  useEffect(() => {
    if (busy) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[260] grid place-items-center bg-slate-950/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-[400px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-zinc-900">
        <p className="text-sm text-slate-800 dark:text-zinc-100">{copy}</p>
        <div className="mt-4 flex gap-2">
          <Button type="button" className="rounded-xl bg-[#0F766E] text-white hover:bg-[#0D9488]" disabled={busy} onClick={onConfirm}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {confirm.kind === "reset" ? "Send link" : "Confirm"}
          </Button>
          <Button type="button" variant="outline" className="rounded-xl" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
