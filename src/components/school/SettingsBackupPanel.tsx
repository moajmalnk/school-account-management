import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Cloud,
  Download,
  HardDrive,
  KeyRound,
  Loader2,
  RefreshCw,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { TimePicker24 } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrganicCard } from "@/components/ui/organic-card";
import { SettingsResponsiveCardHeader } from "@/components/school/SettingsMobileNav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { InfoTip } from "@/components/ui/info-tip";
import {
  BACKUP_DESTINATIONS_TIP,
  BACKUP_SCHEDULE_TIP,
  BACKUP_SECURITY_TIP,
  BACKUP_TIP,
} from "@/lib/help/settings-tips";
import {
  apiBackupOAuthStart,
  apiCreateBackupJob,
  apiDisconnectBackupDestination,
  apiGetBackupBundle,
  apiListBackupJobs,
  apiUpdateBackupSettings,
  downloadBackupZip,
  formatBackupBytes,
  type BackupJob,
  type BackupProvider,
  type BackupSettings,
} from "@/lib/api/backup";
import { cn } from "@/lib/utils";

const panelClass = "min-w-0 overflow-hidden rounded-[22px]";

const WEEKDAYS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "7", label: "Sunday" },
];

function errMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

function destinationLabel(provider: BackupProvider): string {
  return provider === "google_drive" ? "Google Drive" : "OneDrive";
}

function formatStamp(raw: string | null | undefined, suffix = ""): string {
  if (!raw) return "—";
  return `${raw.replace("T", " ").slice(0, 19)}${suffix}`;
}

function jobStatusClass(status: BackupJob["status"]): string {
  if (status === "success") return "bg-[#CCFBF1] text-[#0F766E]";
  if (status === "failed") return "bg-[#FEE2E2] text-[#DC2626]";
  if (status === "running" || status === "queued") return "bg-[#E0F2FE] text-[#0369A1]";
  return "bg-[#F4F4F5] text-black/50";
}

function SectionTitle({
  title,
  tip,
  icon: Icon,
}: {
  title: string;
  tip?: Parameters<typeof InfoTip>[0]["content"];
  icon?: typeof HardDrive;
}) {
  return (
    <div className="flex items-center gap-2">
      {Icon ? (
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#F0FDFA] text-[#0F766E] dark:bg-[#0F766E]/20 dark:text-[#5EEAD4]">
          <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
      ) : null}
      <h3 className="text-[15px] font-semibold tracking-tight text-black dark:text-zinc-50">{title}</h3>
      {tip ? <InfoTip content={tip} side="bottom" /> : null}
    </div>
  );
}

export function SettingsBackupPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [jobs, setJobs] = useState<BackupJob[]>([]);
  const [frequency, setFrequency] = useState<BackupSettings["frequency"]>("off");
  const [weeklyDow, setWeeklyDow] = useState("1");
  const [runTime, setRunTime] = useState("02:00");
  const [passphrase, setPassphrase] = useState("");
  const [currentPassphrase, setCurrentPassphrase] = useState("");
  const [passphraseHint, setPassphraseHint] = useState("");
  const [shownOnce, setShownOnce] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const bundle = await apiGetBackupBundle();
      setSettings(bundle.settings);
      setJobs(bundle.jobs);
      setFrequency(bundle.settings.frequency);
      setWeeklyDow(String(bundle.settings.weeklyDow || 1));
      setRunTime(bundle.settings.runTime || "02:00");
      setPassphraseHint(bundle.settings.passphraseHint || "");
    } catch (err) {
      toast.error(errMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get("backup_oauth");
    if (!oauth) return;
    if (oauth === "connected") {
      toast.success(`${destinationLabel((params.get("provider") as BackupProvider) || "google_drive")} connected`);
      void load();
    } else if (oauth === "error") {
      toast.error(params.get("message") || "Cloud connect failed");
    }
    params.delete("backup_oauth");
    params.delete("provider");
    params.delete("message");
    const next = `${window.location.pathname}?${params.toString()}`.replace(/\?$/, "");
    window.history.replaceState({}, "", next);
  }, [load]);

  const busyJob = useMemo(
    () => jobs.find((j) => j.status === "queued" || j.status === "running"),
    [jobs],
  );

  useEffect(() => {
    if (!busyJob) return;
    const id = window.setInterval(() => {
      void apiListBackupJobs()
        .then((res) => setJobs(res.jobs))
        .catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(id);
  }, [busyJob?.id]);

  const saveSchedule = async () => {
    setSaving(true);
    try {
      const res = await apiUpdateBackupSettings({
        frequency,
        weeklyDow: Number(weeklyDow),
        runTime,
      });
      setSettings(res.settings);
      toast.success("Backup schedule saved");
    } catch (err) {
      toast.error(errMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const savePassphrase = async () => {
    if (passphrase.trim().length < 8) {
      toast.error("Passphrase must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      const res = await apiUpdateBackupSettings({
        passphrase: passphrase.trim(),
        currentPassphrase: settings?.passphraseSet ? currentPassphrase : undefined,
        passphraseHint: passphraseHint.trim() || undefined,
      });
      setSettings(res.settings);
      if (res.settings.passphraseOnce) {
        setShownOnce(res.settings.passphraseOnce);
      }
      setPassphrase("");
      setCurrentPassphrase("");
      toast.success(settings?.passphraseSet ? "Passphrase rotated" : "Passphrase saved");
    } catch (err) {
      toast.error(errMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const createJob = async () => {
    setCreating(true);
    try {
      const res = await apiCreateBackupJob();
      setJobs((prev) => [res.job, ...prev.filter((j) => j.id !== res.job.id)]);
      toast.success("Backup started");
      window.setTimeout(() => {
        void apiListBackupJobs()
          .then((r) => setJobs(r.jobs))
          .catch(() => undefined);
      }, 2500);
    } catch (err) {
      toast.error(errMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const connect = async (provider: BackupProvider) => {
    try {
      const { url } = await apiBackupOAuthStart(provider);
      window.location.href = url;
    } catch (err) {
      toast.error(errMessage(err));
    }
  };

  const disconnect = async (provider: BackupProvider) => {
    try {
      const res = await apiDisconnectBackupDestination(provider);
      setSettings(res.settings);
      toast.success(`${destinationLabel(provider)} disconnected`);
    } catch (err) {
      toast.error(errMessage(err));
    }
  };

  const latestSuccess = jobs.find((j) => j.status === "success" && j.downloadAvailable);
  const hasPassphrase = Boolean(settings?.passphraseSet);
  const nextScheduled =
    settings?.frequency === "off"
      ? "Off"
      : settings?.nextRunAt
        ? formatStamp(settings.nextRunAt, " UTC")
        : "—";

  if (loading && !settings) {
    return (
      <OrganicCard tone="white" cornerSide="tr" padded className={panelClass}>
        <div className="flex items-center justify-center gap-2 py-14 text-[13px] text-black/45 dark:text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading backup…
        </div>
      </OrganicCard>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Overview */}
      <OrganicCard tone="white" cornerSide="tr" padded={false} className={panelClass}>
        <div className="relative overflow-hidden border-b border-[#F0F0F0] px-4 py-5 sm:px-6 sm:py-6 dark:border-white/10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(15,118,110,0.10),transparent_55%),linear-gradient(180deg,#F8FFFD_0%,#FFFFFF_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(15,118,110,0.18),transparent_55%),linear-gradient(180deg,#0F1F1D_0%,#18181B_70%)]"
          />
          <div className="relative">
            <SettingsResponsiveCardHeader
              title="Backup"
              subtitle="Encrypted school snapshot for your records. In-app restore is not available yet."
              info={BACKUP_TIP}
              action={
                <button
                  type="button"
                  onClick={() => void load()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E5E5E5] bg-white/90 px-3 text-[12px] font-semibold text-black/70 backdrop-blur hover:bg-white dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-300"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              }
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#E7F0EE] bg-white/80 px-3.5 py-3 backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
                <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-black/40 dark:text-zinc-500">
                  <CheckCircle2 className="h-3 w-3 text-[#0F766E]" />
                  Last success
                </div>
                <div className="mt-1.5 text-[13.5px] font-semibold tracking-tight text-black dark:text-zinc-50">
                  {settings?.lastSuccessAt ? formatStamp(settings.lastSuccessAt) : "Never"}
                </div>
              </div>
              <div className="rounded-2xl border border-[#E7F0EE] bg-white/80 px-3.5 py-3 backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
                <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-black/40 dark:text-zinc-500">
                  <Clock3 className="h-3 w-3 text-[#0F766E]" />
                  Next scheduled
                </div>
                <div className="mt-1.5 text-[13.5px] font-semibold tracking-tight text-black dark:text-zinc-50">
                  {nextScheduled}
                </div>
              </div>
              <div className="rounded-2xl border border-[#E7F0EE] bg-white/80 px-3.5 py-3 backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
                <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-black/40 dark:text-zinc-500">
                  <AlertTriangle className="h-3 w-3 text-black/35" />
                  Last error
                </div>
                <div
                  className={cn(
                    "mt-1.5 truncate text-[13.5px] font-semibold tracking-tight",
                    settings?.lastError ? "text-red-700 dark:text-red-400" : "text-black dark:text-zinc-50",
                  )}
                  title={settings?.lastError || undefined}
                >
                  {settings?.lastError || "—"}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#E5E5E5] bg-white/90 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-zinc-900/70">
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold tracking-tight text-black dark:text-zinc-50">
                  Manual backup
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-black/55 dark:text-zinc-400">
                  Creates an AES-encrypted ZIP of your school data. Keep the passphrase safe — you need it
                  to open the file.
                </p>
                {!hasPassphrase ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-amber-800 dark:text-amber-300">
                    <KeyRound className="h-3.5 w-3.5" />
                    Set a passphrase below before creating a backup.
                  </p>
                ) : null}
              </div>
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  type="button"
                  disabled={creating || Boolean(busyJob) || !hasPassphrase}
                  onClick={() => void createJob()}
                  className="h-11 w-full rounded-xl bg-[#0F766E] text-[13px] font-semibold hover:bg-[#0D9488] sm:w-auto sm:px-5"
                >
                  {creating || busyJob ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <HardDrive className="mr-1.5 h-4 w-4" />
                  )}
                  {busyJob ? "Backup running…" : "Create backup now"}
                </Button>
                {latestSuccess ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full rounded-xl border-[#E5E5E5] text-[13px] font-semibold dark:border-white/10 sm:w-auto"
                    onClick={() =>
                      void downloadBackupZip(latestSuccess).catch((err) => toast.error(errMessage(err)))
                    }
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    Download ({formatBackupBytes(latestSuccess.byteSize)})
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </OrganicCard>

      {/* Schedule + Destinations */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 lg:items-stretch">
        <OrganicCard tone="white" cornerSide="tr" padded className={cn(panelClass, "flex h-full flex-col")}>
          <SectionTitle title="Schedule" tip={BACKUP_SCHEDULE_TIP} icon={Clock3} />
          <p className="mt-2 text-[12.5px] leading-relaxed text-black/55 dark:text-zinc-400">
            Times are India Standard Time ({settings?.timezone || "Asia/Kolkata"}).
          </p>
          <div className="mt-4 flex flex-1 flex-col gap-3">
            <div>
              <Label className="text-[12px] text-black/60">Frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as BackupSettings["frequency"])}>
                <SelectTrigger className="mt-1.5 h-11 rounded-xl border-[#E5E5E5] bg-[#FAFAFA] dark:border-white/10 dark:bg-zinc-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Off</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {frequency === "weekly" ? (
              <div>
                <Label className="text-[12px] text-black/60">Day</Label>
                <Select value={weeklyDow} onValueChange={setWeeklyDow}>
                  <SelectTrigger className="mt-1.5 h-11 rounded-xl border-[#E5E5E5] bg-[#FAFAFA] dark:border-white/10 dark:bg-zinc-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {frequency !== "off" ? (
              <div>
                <Label className="text-[12px] text-black/60">Time (IST)</Label>
                <div className="mt-1.5 flex h-11 items-stretch overflow-hidden rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] dark:border-white/10 dark:bg-zinc-900">
                  <TimePicker24
                    value={runTime}
                    onChange={(clock) => setRunTime(clock || "02:00")}
                    className="h-full w-full justify-start px-3.5 hover:bg-transparent dark:hover:bg-transparent"
                    align="start"
                  />
                </div>
              </div>
            ) : null}
            <div className="mt-auto pt-2">
              <Button
                type="button"
                disabled={saving}
                onClick={() => void saveSchedule()}
                className="h-11 w-full rounded-xl bg-[#0F766E] text-[13px] font-semibold hover:bg-[#0D9488] sm:w-auto sm:px-5"
              >
                {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Save schedule
              </Button>
            </div>
          </div>
        </OrganicCard>

        <OrganicCard tone="white" cornerSide="tr" padded className={cn(panelClass, "flex h-full flex-col")}>
          <SectionTitle title="Destinations" tip={BACKUP_DESTINATIONS_TIP} icon={Cloud} />
          <p className="mt-2 text-[12.5px] leading-relaxed text-black/55 dark:text-zinc-400">
            Connect Google Drive and/or OneDrive. Files go to a “Feezo Backups” folder.
          </p>
          <div className="mt-4 flex flex-1 flex-col gap-2.5">
            {(["google_drive", "onedrive"] as BackupProvider[]).map((provider) => {
              const dest = settings?.destinations.find((d) => d.provider === provider);
              const configured = settings?.providersConfigured?.[provider];
              const connected = dest?.status === "connected";
              const expired = dest?.status === "expired";
              return (
                <div
                  key={provider}
                  className="flex flex-col gap-3 rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-[13.5px] font-semibold tracking-tight text-black dark:text-zinc-50">
                        {destinationLabel(provider)}
                      </div>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          !configured
                            ? "bg-[#F4F4F5] text-black/40 dark:bg-zinc-800 dark:text-zinc-500"
                            : connected
                              ? "bg-[#CCFBF1] text-[#0F766E]"
                              : expired
                                ? "bg-[#FFEDD5] text-[#C2410C]"
                                : "bg-[#F4F4F5] text-black/45 dark:bg-zinc-800 dark:text-zinc-400",
                        )}
                      >
                        {!configured
                          ? "Not on server"
                          : connected
                            ? "Connected"
                            : expired
                              ? "Reconnect"
                              : "Not connected"}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-[12px] text-black/50 dark:text-zinc-400">
                      {!configured
                        ? "OAuth keys are missing on this server"
                        : connected
                          ? dest?.accountEmail || "Ready to receive uploads"
                          : expired
                            ? "Session expired — reconnect to keep uploads working"
                            : "Connect to upload scheduled backups"}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {connected || expired ? (
                      <>
                        {expired ? (
                          <Button
                            type="button"
                            size="sm"
                            className="h-9 rounded-xl bg-[#0F766E] px-3 text-[12px] font-semibold hover:bg-[#0D9488]"
                            disabled={!configured}
                            onClick={() => void connect(provider)}
                          >
                            Reconnect
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-9 rounded-xl border-[#E5E5E5] px-3 text-[12px] font-semibold dark:border-white/10"
                          onClick={() => void disconnect(provider)}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 rounded-xl bg-[#0F766E] px-3 text-[12px] font-semibold hover:bg-[#0D9488]"
                        disabled={!configured}
                        onClick={() => void connect(provider)}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </OrganicCard>
      </div>

      {/* Security */}
      <OrganicCard tone="white" cornerSide="tr" padded className={panelClass}>
        <SectionTitle title="Security" tip={BACKUP_SECURITY_TIP} icon={Shield} />
        <p className="mt-2 text-[12.5px] leading-relaxed text-black/55 dark:text-zinc-400">
          ZIP password for every backup. Shown once when you set or rotate it — store it offline.
        </p>
        {shownOnce ? (
          <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3.5 text-[12.5px] text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
            <div className="font-semibold tracking-tight">Copy this passphrase now</div>
            <code className="mt-2 block break-all rounded-xl bg-white/70 px-3 py-2 font-mono text-[13px] dark:bg-black/30">
              {shownOnce}
            </code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3 h-9 rounded-xl border-amber-300/70 bg-white text-[12px] font-semibold dark:border-amber-500/40 dark:bg-transparent"
              onClick={() => {
                void navigator.clipboard.writeText(shownOnce);
                toast.success("Copied");
              }}
            >
              Copy passphrase
            </Button>
          </div>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {hasPassphrase ? (
            <div>
              <Label className="text-[12px] text-black/60">Current passphrase</Label>
              <Input
                type="password"
                className="mt-1.5 h-11 rounded-xl border-[#E5E5E5] bg-[#FAFAFA] dark:border-white/10 dark:bg-zinc-900"
                value={currentPassphrase}
                onChange={(e) => setCurrentPassphrase(e.target.value)}
                autoComplete="off"
              />
            </div>
          ) : null}
          <div>
            <Label className="text-[12px] text-black/60">
              {hasPassphrase ? "New passphrase" : "Passphrase"}
            </Label>
            <Input
              type="password"
              className="mt-1.5 h-11 rounded-xl border-[#E5E5E5] bg-[#FAFAFA] dark:border-white/10 dark:bg-zinc-900"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className={cn(!hasPassphrase && "sm:col-span-1", hasPassphrase && "sm:col-span-2 lg:col-span-1")}>
            <Label className="text-[12px] text-black/60">Optional hint</Label>
            <Input
              className="mt-1.5 h-11 rounded-xl border-[#E5E5E5] bg-[#FAFAFA] dark:border-white/10 dark:bg-zinc-900"
              value={passphraseHint}
              onChange={(e) => setPassphraseHint(e.target.value)}
              placeholder={settings?.passphraseHint || "e.g. school safe drawer"}
            />
          </div>
        </div>
        <Button
          type="button"
          disabled={saving || passphrase.trim().length < 8}
          onClick={() => void savePassphrase()}
          className="mt-4 h-11 w-full rounded-xl bg-[#0F766E] text-[13px] font-semibold hover:bg-[#0D9488] sm:w-auto sm:px-5"
        >
          {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <KeyRound className="mr-1.5 h-4 w-4" />}
          {hasPassphrase ? "Rotate passphrase" : "Set passphrase"}
        </Button>
      </OrganicCard>

      {/* Recent jobs */}
      <OrganicCard tone="white" cornerSide="tr" padded className={panelClass}>
        <SectionTitle title="Recent jobs" icon={HardDrive} />
        <p className="mt-2 text-[12.5px] text-black/55 dark:text-zinc-400">
          Manual and scheduled backup history for this school.
        </p>

        {/* Mobile cards */}
        <ul className="mt-4 space-y-2.5 md:hidden">
          {jobs.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-[#E5E5E5] px-4 py-8 text-center text-[13px] text-black/45 dark:border-white/10 dark:text-zinc-500">
              No backups yet
            </li>
          ) : (
            jobs.map((job) => (
              <li
                key={job.id}
                className="rounded-2xl border border-[#EFEFEF] bg-[#FAFAFA] p-3.5 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[11px] text-black/50 dark:text-zinc-500">
                      {job.id}
                    </div>
                    <div className="mt-1 text-[12.5px] text-black/60 dark:text-zinc-400">
                      {formatStamp(job.finishedAt || job.createdAt)} · {formatBackupBytes(job.byteSize)}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-semibold capitalize",
                      jobStatusClass(job.status),
                    )}
                  >
                    {job.status}
                  </span>
                </div>
                {job.error ? (
                  <p className="mt-2 text-[11.5px] leading-snug text-red-600 dark:text-red-400">{job.error}</p>
                ) : null}
                {job.downloadAvailable ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 h-9 w-full rounded-xl border-[#E5E5E5] text-[12px] font-semibold dark:border-white/10"
                    onClick={() =>
                      void downloadBackupZip(job).catch((err) => toast.error(errMessage(err)))
                    }
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Download
                  </Button>
                ) : null}
              </li>
            ))
          )}
        </ul>

        {/* Desktop table */}
        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[560px] text-left text-[12.5px]">
            <thead className="text-[11px] font-semibold uppercase tracking-[0.06em] text-black/40 dark:text-zinc-500">
              <tr className="border-b border-[#F0F0F0] dark:border-white/10">
                <th className="pb-2.5 pr-3 font-semibold">Job</th>
                <th className="pb-2.5 pr-3 font-semibold">Status</th>
                <th className="pb-2.5 pr-3 font-semibold">Size</th>
                <th className="pb-2.5 pr-3 font-semibold">When</th>
                <th className="pb-2.5 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-black/45 dark:text-zinc-500">
                    No backups yet
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-[#F3F3F3] last:border-b-0 dark:border-white/10"
                  >
                    <td className="py-3 pr-3 font-mono text-[11.5px] text-black/70 dark:text-zinc-300">
                      {job.id}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
                          jobStatusClass(job.status),
                        )}
                      >
                        {job.status}
                      </span>
                      {job.error ? (
                        <span className="mt-1 block max-w-[240px] truncate text-[11px] text-red-600 dark:text-red-400">
                          {job.error}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 tabular-nums text-black/70 dark:text-zinc-300">
                      {formatBackupBytes(job.byteSize)}
                    </td>
                    <td className="py-3 pr-3 text-black/55 dark:text-zinc-400">
                      {formatStamp(job.finishedAt || job.createdAt)}
                    </td>
                    <td className="py-3 text-right">
                      {job.downloadAvailable ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#0F766E] hover:underline dark:text-[#5EEAD4]"
                          onClick={() =>
                            void downloadBackupZip(job).catch((err) => toast.error(errMessage(err)))
                          }
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </OrganicCard>
    </div>
  );
}
