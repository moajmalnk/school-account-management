import { useCallback, useEffect, useMemo, useState } from "react";
import { HardDrive, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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

const panelClass = "min-w-0 rounded-2xl";

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

  if (loading && !settings) {
    return (
      <OrganicCard tone="white" cornerSide="tr" padded className={panelClass}>
        <div className="py-10 text-center text-[13px] text-black/50">Loading backup…</div>
      </OrganicCard>
    );
  }

  return (
    <div className="grid grid-cols-12 items-start gap-3 sm:gap-4 lg:gap-5">
      <OrganicCard tone="white" cornerSide="tr" padded className={cn(panelClass, "col-span-12")}>
        <SettingsResponsiveCardHeader
          title="Backup"
          subtitle="Encrypted school snapshot for your records. In-app restore is not available yet."
          info={BACKUP_TIP}
          action={
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 text-[12px] font-semibold text-black/70 hover:bg-[#F4F4F5]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          }
        />

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <h3 className="text-[13px] font-semibold text-black">Status</h3>
            <dl className="space-y-2 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-3 text-[12.5px]">
              <div className="flex justify-between gap-3">
                <dt className="text-black/50">Last success</dt>
                <dd className="font-medium text-black">
                  {settings?.lastSuccessAt ? settings.lastSuccessAt.replace("T", " ").slice(0, 19) : "Never"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-black/50">Next scheduled</dt>
                <dd className="font-medium text-black">
                  {settings?.frequency === "off"
                    ? "Off"
                    : settings?.nextRunAt
                      ? settings.nextRunAt.replace("T", " ").slice(0, 19) + " UTC"
                      : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-black/50">Last error</dt>
                <dd className="max-w-[60%] text-right font-medium text-red-700">
                  {settings?.lastError || "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="space-y-3">
            <h3 className="text-[13px] font-semibold text-black">Manual backup</h3>
            <p className="text-[12px] leading-relaxed text-black/55">
              Creates an AES-encrypted ZIP of your school data and uploads. Keep the passphrase safe —
              you need it to open the file.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={creating || Boolean(busyJob) || !settings?.passphraseSet}
                onClick={() => void createJob()}
                className="rounded-full bg-[#0F766E] hover:bg-[#0D9488]"
              >
                <HardDrive className="mr-1.5 h-3.5 w-3.5" />
                {busyJob ? "Backup running…" : "Create backup now"}
              </Button>
              {latestSuccess ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() =>
                    void downloadBackupZip(latestSuccess).catch((err) => toast.error(errMessage(err)))
                  }
                >
                  Download latest ({formatBackupBytes(latestSuccess.byteSize)})
                </Button>
              ) : null}
            </div>
            {!settings?.passphraseSet ? (
              <p className="text-[12px] text-amber-800">Set a passphrase below before creating a backup.</p>
            ) : null}
          </section>
        </div>
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="tr" padded className={cn(panelClass, "col-span-12 lg:col-span-6")}>
        <div className="flex items-center gap-1">
          <h3 className="text-[13px] font-semibold text-black">Schedule</h3>
          <InfoTip content={BACKUP_SCHEDULE_TIP} side="bottom" />
        </div>
        <p className="mt-1 text-[12px] text-black/55">
          Times are India Standard Time ({settings?.timezone || "Asia/Kolkata"}). Scheduled runs upload to
          connected Drive destinations.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-[12px]">Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as BackupSettings["frequency"])}>
              <SelectTrigger className="mt-1">
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
              <Label className="text-[12px]">Day</Label>
              <Select value={weeklyDow} onValueChange={setWeeklyDow}>
                <SelectTrigger className="mt-1">
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
              <Label className="text-[12px]">Time (IST)</Label>
              <Input
                type="time"
                className="mt-1"
                value={runTime}
                onChange={(e) => setRunTime(e.target.value)}
              />
            </div>
          ) : null}
          <Button
            type="button"
            disabled={saving}
            onClick={() => void saveSchedule()}
            className="rounded-full bg-[#0F766E] hover:bg-[#0D9488]"
          >
            Save schedule
          </Button>
        </div>
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="tr" padded className={cn(panelClass, "col-span-12 lg:col-span-6")}>
        <div className="flex items-center gap-1">
          <h3 className="text-[13px] font-semibold text-black">Destinations</h3>
          <InfoTip content={BACKUP_DESTINATIONS_TIP} side="bottom" />
        </div>
        <p className="mt-1 text-[12px] text-black/55">
          Connect Google Drive and/or OneDrive. Files go to a “Feezo Backups” folder.
        </p>
        <div className="mt-4 space-y-3">
          {(["google_drive", "onedrive"] as BackupProvider[]).map((provider) => {
            const dest = settings?.destinations.find((d) => d.provider === provider);
            const configured = settings?.providersConfigured?.[provider];
            return (
              <div
                key={provider}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA] px-3.5 py-3"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-black">{destinationLabel(provider)}</div>
                  <div className="truncate text-[11.5px] text-black/50">
                    {!configured
                      ? "Not configured on server"
                      : dest?.status === "connected"
                        ? dest.accountEmail || "Connected"
                        : dest?.status === "expired"
                          ? "Reconnect required"
                          : "Not connected"}
                  </div>
                </div>
                {dest?.status === "connected" || dest?.status === "expired" ? (
                  <div className="flex shrink-0 gap-1.5">
                    {dest.status === "expired" ? (
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full"
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
                      className="rounded-full"
                      onClick={() => void disconnect(provider)}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full bg-[#0F766E] hover:bg-[#0D9488]"
                    disabled={!configured}
                    onClick={() => void connect(provider)}
                  >
                    Connect
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="tr" padded className={cn(panelClass, "col-span-12")}>
        <div className="flex items-center gap-1">
          <h3 className="text-[13px] font-semibold text-black">Security</h3>
          <InfoTip content={BACKUP_SECURITY_TIP} side="bottom" />
        </div>
        <p className="mt-1 text-[12px] text-black/55">
          ZIP password for every backup. Shown once when you set or rotate it — store it offline.
        </p>
        {shownOnce ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12.5px] text-amber-950">
            <div className="font-semibold">Copy this passphrase now</div>
            <code className="mt-1 block break-all font-mono text-[13px]">{shownOnce}</code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2 rounded-full"
              onClick={() => {
                void navigator.clipboard.writeText(shownOnce);
                toast.success("Copied");
              }}
            >
              Copy
            </Button>
          </div>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {settings?.passphraseSet ? (
            <div>
              <Label className="text-[12px]">Current passphrase</Label>
              <Input
                type="password"
                className="mt-1"
                value={currentPassphrase}
                onChange={(e) => setCurrentPassphrase(e.target.value)}
                autoComplete="off"
              />
            </div>
          ) : null}
          <div>
            <Label className="text-[12px]">
              {settings?.passphraseSet ? "New passphrase" : "Passphrase"}
            </Label>
            <Input
              type="password"
              className="mt-1"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label className="text-[12px]">Optional hint</Label>
            <Input
              className="mt-1"
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
          className="mt-4 rounded-full bg-[#0F766E] hover:bg-[#0D9488]"
        >
          {settings?.passphraseSet ? "Rotate passphrase" : "Set passphrase"}
        </Button>
      </OrganicCard>

      <OrganicCard tone="white" cornerSide="tr" padded className={cn(panelClass, "col-span-12")}>
        <h3 className="text-[13px] font-semibold text-black">Recent jobs</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[12px]">
            <thead className="text-black/45">
              <tr className="border-b border-[#EFEFEF]">
                <th className="py-2 pr-3 font-medium">Job</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Size</th>
                <th className="py-2 pr-3 font-medium">When</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-black/45">
                    No backups yet
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="border-b border-[#F3F3F3]">
                    <td className="py-2.5 pr-3 font-mono text-[11px]">{job.id}</td>
                    <td className="py-2.5 pr-3 capitalize">
                      {job.status}
                      {job.error ? (
                        <span className="mt-0.5 block max-w-[220px] truncate text-[10.5px] text-red-600">
                          {job.error}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-3">{formatBackupBytes(job.byteSize)}</td>
                    <td className="py-2.5 pr-3 text-black/60">
                      {(job.finishedAt || job.createdAt).replace("T", " ").slice(0, 19)}
                    </td>
                    <td className="py-2.5 text-right">
                      {job.downloadAvailable ? (
                        <button
                          type="button"
                          className="text-[12px] font-semibold text-[#0F766E] hover:underline"
                          onClick={() =>
                            void downloadBackupZip(job).catch((err) => toast.error(errMessage(err)))
                          }
                        >
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
