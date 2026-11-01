import { apiBaseUrl, apiRequest, getApiToken } from "@/lib/api/client";

export type BackupProvider = "google_drive";

export type BackupDestination = {
  provider: BackupProvider;
  accountEmail: string | null;
  folderId: string | null;
  folderName: string;
  status: "connected" | "expired" | "revoked";
  updatedAt: string | null;
};

export type BackupSettings = {
  frequency: "off" | "daily" | "weekly";
  weeklyDow: number;
  runTime: string;
  passphraseSet: boolean;
  passphraseHint: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  nextRunAt: string | null;
  destinations: BackupDestination[];
  providersConfigured: {
    google_drive: boolean;
  };
  timezone: string;
  restoreSupported: boolean;
  passphraseOnce?: string;
};

export type BackupJob = {
  id: string;
  status: "queued" | "running" | "success" | "failed";
  triggeredBy: "manual" | "schedule";
  asOf: string | null;
  byteSize: number | null;
  downloadExpiresAt: string | null;
  remoteUploads: Array<Record<string, unknown>> | null;
  error: string | null;
  attempts: number;
  createdAt: string;
  finishedAt: string | null;
  downloadAvailable: boolean;
  downloadToken?: string;
};

export type BackupBundle = {
  settings: BackupSettings;
  jobs: BackupJob[];
};

export async function apiGetBackupBundle(): Promise<BackupBundle> {
  return apiRequest<BackupBundle>("/api/backup/settings.php");
}

export async function apiUpdateBackupSettings(body: {
  frequency?: BackupSettings["frequency"];
  weeklyDow?: number;
  runTime?: string;
  passphrase?: string;
  currentPassphrase?: string;
  passphraseHint?: string;
}): Promise<{ settings: BackupSettings }> {
  return apiRequest<{ settings: BackupSettings }>("/api/backup/settings.php", {
    method: "PUT",
    body,
  });
}

export async function apiListBackupJobs(): Promise<{ jobs: BackupJob[] }> {
  return apiRequest<{ jobs: BackupJob[] }>("/api/backup/jobs.php");
}

export async function apiCreateBackupJob(): Promise<{ job: BackupJob }> {
  return apiRequest<{ job: BackupJob }>("/api/backup/jobs.php", {
    method: "POST",
    timeoutMs: 30_000,
  });
}

export async function apiDisconnectBackupDestination(
  provider: BackupProvider,
): Promise<{ settings: BackupSettings }> {
  return apiRequest<{ settings: BackupSettings }>("/api/backup/oauth/disconnect.php", {
    method: "POST",
    body: { provider },
  });
}

export async function apiBackupOAuthStart(provider: BackupProvider): Promise<{ url: string }> {
  return apiRequest<{ url: string; returnTo?: string }>(
    `/api/backup/oauth/start.php?provider=${encodeURIComponent(provider)}&redirect=0`,
  );
}

export function backupDownloadUrl(jobId: string, token: string): string {
  const base = apiBaseUrl().replace(/\/$/, "");
  return `${base}/api/backup/jobs/download.php?id=${encodeURIComponent(jobId)}&token=${encodeURIComponent(token)}`;
}

export async function downloadBackupZip(job: BackupJob): Promise<void> {
  let token = job.downloadToken;
  if (!token) {
    const { jobs } = await apiListBackupJobs();
    const fresh = jobs.find((j) => j.id === job.id);
    token = fresh?.downloadToken;
  }
  if (!token) {
    throw new Error("Download token not available yet — wait for the job to finish");
  }
  const url = backupDownloadUrl(job.id, token);
  const authToken = getApiToken();
  const res = await fetch(url, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  if (!res.ok) {
    let message = `Download failed (${res.status})`;
    try {
      const json = (await res.json()) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `${job.id}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export function formatBackupBytes(n: number | null | undefined): string {
  if (n == null || n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
