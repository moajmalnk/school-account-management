import {
  AlertTriangle,
  Download,
  Fingerprint,
  Loader2,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Terminal,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  apiBiometricAdmsLogs,
  apiBiometricAdmsProbe,
  apiBiometricCommand,
  apiBiometricDevices,
  apiBiometricPunches,
  apiBiometricRealtime,
  apiBiometricRegisterDevice,
  apiBiometricUserMapBind,
  apiBiometricUserMapDelete,
  apiBiometricUserMapList,
  type BiometricAdmsLog,
  type BiometricDevice,
  type BiometricPunch,
  type BiometricServerInfo,
  type BiometricUserMap,
} from "@/lib/api/biometric";
import { todayYmd } from "@/lib/student-attendance";
import { useTenantStore } from "@/lib/tenant-store";
import { cn, glassCardClass } from "@/lib/utils";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function BiometricDevicesPanel() {
  const { activeStudents, activeStaff } = useTenantStore();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [server, setServer] = useState<BiometricServerInfo | null>(null);
  const [liveFeed, setLiveFeed] = useState<BiometricPunch[]>([]);
  const [sinceId, setSinceId] = useState(0);
  const [maps, setMaps] = useState<BiometricUserMap[]>([]);

  const [from, setFrom] = useState(todayYmd());
  const [to, setTo] = useState(todayYmd());
  const [search, setSearch] = useState("");
  const [punchState, setPunchState] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<BiometricPunch[]>([]);
  const [total, setTotal] = useState(0);
  const [logsBusy, setLogsBusy] = useState(false);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [regSn, setRegSn] = useState("");
  const [regName, setRegName] = useState("");
  const [regBusy, setRegBusy] = useState(false);

  const [mapOpen, setMapOpen] = useState(false);
  const [mapPin, setMapPin] = useState("");
  const [mapType, setMapType] = useState<"student" | "staff">("student");
  const [mapEntityId, setMapEntityId] = useState("");
  const [mapBusy, setMapBusy] = useState(false);
  const [cmdReset, setCmdReset] = useState(0);
  const [admsLogs, setAdmsLogs] = useState<BiometricAdmsLog[]>([]);
  const [admsHint, setAdmsHint] = useState<string | null>(null);
  const [admsBusy, setAdmsBusy] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const pageSize = 25;

  const loadDevices = useCallback(async () => {
    const data = await apiBiometricDevices();
    setDevices(data.devices);
    setServer(data.server);
  }, []);

  const loadMaps = useCallback(async () => {
    const data = await apiBiometricUserMapList();
    setMaps(data.items);
  }, []);

  const loadAdmsLogs = useCallback(async () => {
    setAdmsBusy(true);
    try {
      const data = await apiBiometricAdmsLogs({ limit: 80 });
      setAdmsLogs(data.items);
      setAdmsHint(data.hint);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load ADMS logs");
    } finally {
      setAdmsBusy(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLogsBusy(true);
    try {
      const data = await apiBiometricPunches({
        from,
        to,
        q: search.trim() || undefined,
        punchState: punchState === "all" ? "" : Number(punchState),
        page,
        pageSize,
      });
      setLogs(data.items);
      setTotal(data.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load punch logs");
    } finally {
      setLogsBusy(false);
    }
  }, [from, to, search, punchState, page]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await Promise.all([loadDevices(), loadMaps(), loadAdmsLogs()]);
        if (!cancelled) {
          const rt = await apiBiometricRealtime(0);
          setLiveFeed(rt.items.slice().reverse());
          setSinceId(rt.latestId);
          if (rt.devices.length) setDevices(rt.devices);
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Failed to load devices");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadDevices, loadMaps, loadAdmsLogs]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  // Live poll every 4s (punches + ADMS connection log)
  useEffect(() => {
    const id = window.setInterval(() => {
      void (async () => {
        try {
          const [rt] = await Promise.all([
            apiBiometricRealtime(sinceId),
            apiBiometricAdmsLogs({ limit: 80 }).then((data) => {
              setAdmsLogs(data.items);
              setAdmsHint(data.hint);
            }),
          ]);
          if (rt.devices.length) setDevices(rt.devices);
          if (rt.items.length) {
            setLiveFeed((prev) => {
              const merged = [...rt.items.slice().reverse(), ...prev];
              const seen = new Set<number>();
              return merged
                .filter((p) => {
                  if (seen.has(p.id)) return false;
                  seen.add(p.id);
                  return true;
                })
                .slice(0, 40);
            });
            setSinceId(rt.latestId);
          }
        } catch {
          /* ignore transient poll errors */
        }
      })();
    }, 4000);
    return () => window.clearInterval(id);
  }, [sinceId]);

  const primaryDevice = devices[0] ?? null;
  const onlineCount = devices.filter((d) => d.online).length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const entityOptions = useMemo(() => {
    if (mapType === "student") {
      return activeStudents.map((s) => ({ id: s.id, label: `${s.name} (${s.cls || s.id})` }));
    }
    return activeStaff.map((s) => ({ id: s.id, label: `${s.name} (${s.role || s.id})` }));
  }, [mapType, activeStudents, activeStaff]);

  async function handleRegister() {
    const sn = regSn.trim().toUpperCase();
    if (!sn) {
      toast.error("Enter the device serial number");
      return;
    }
    setRegBusy(true);
    try {
      const res = await apiBiometricRegisterDevice({
        serialNumber: sn,
        deviceName: regName.trim() || undefined,
      });
      setDevices((prev) => {
        const rest = prev.filter((d) => d.serialNumber !== res.device.serialNumber);
        return [res.device, ...rest];
      });
      toast.success("Device registered");
      setRegisterOpen(false);
      setRegSn("");
      setRegName("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setRegBusy(false);
    }
  }

  async function handleMapBind() {
    if (!mapPin.trim() || !mapEntityId) {
      toast.error("PIN and person are required");
      return;
    }
    setMapBusy(true);
    try {
      await apiBiometricUserMapBind({
        biometricPin: mapPin.trim(),
        entityType: mapType,
        entityId: mapEntityId,
      });
      toast.success("PIN mapped");
      setMapOpen(false);
      setMapPin("");
      setMapEntityId("");
      await loadMaps();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Mapping failed");
    } finally {
      setMapBusy(false);
    }
  }

  async function handleDeleteMap(pin: string) {
    try {
      await apiBiometricUserMapDelete(pin);
      toast.success("Mapping removed");
      await loadMaps();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function handleCommand(sn: string, action: string) {
    try {
      const res = await apiBiometricCommand({ serialNumber: sn, action });
      toast.success(`Queued: ${res.command}`, {
        description:
          "Close any getrequest browser tabs. Wait 1–2 minutes for the machine to sync time and POST ATTLOG. Watch the ADMS log.",
        duration: 10000,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Command failed");
    }
  }

  function exportCsv() {
    const header = [
      "Time",
      "PIN",
      "Name",
      "State",
      "Verify",
      "Device",
    ];
    const lines = logs.map((p) =>
      [
        p.punchTime,
        p.biometricPin,
        p.entityName ?? "",
        p.punchStateLabel,
        p.verifyTypeLabel,
        p.deviceSn,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biometric-punches-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className={cn(glassCardClass, "flex flex-wrap items-center gap-3 p-4")}>
        <div className="flex items-center gap-2">
          {onlineCount > 0 ? (
            <Wifi className="h-4 w-4 text-emerald-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-slate-400" />
          )}
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              onlineCount > 0
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-zinc-300",
            )}
          >
            {onlineCount > 0 ? "Online" : "Offline"}
          </span>
        </div>
        <div className="text-[13px] text-slate-600 dark:text-zinc-300">
          {primaryDevice ? (
            <>
              <span className="font-medium text-slate-900 dark:text-zinc-50">
                {primaryDevice.deviceName || primaryDevice.serialNumber}
              </span>
              {" · "}
              SN {primaryDevice.serialNumber}
              {primaryDevice.ipAddress ? ` · ${primaryDevice.ipAddress}` : ""}
            </>
          ) : (
            <span>No devices registered</span>
          )}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2 text-[12px] text-slate-500 dark:text-zinc-400">
          <Radio className="h-3.5 w-3.5" />
          <span>
            {server?.domain ?? "api.feezo.app"}:{server?.port ?? 80}
          </span>
          <span className="text-slate-300 dark:text-zinc-600">|</span>
          <span>ADMS {server?.admsPort ?? 4370}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              void loadDevices();
              void loadLogs();
              void loadAdmsLogs();
            }}
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
            onClick={() => setRegisterOpen(true)}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Register device
          </Button>
        </div>
      </div>

      {/* Offline diagnostic + ADMS connection log */}
      {onlineCount === 0 ? (
        <div
          className={cn(
            glassCardClass,
            "flex gap-3 border border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-500/30 dark:bg-amber-500/10",
          )}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0 space-y-1 text-[13px] text-amber-950 dark:text-amber-100">
            <p className="font-semibold">Device offline — Ethernet on the machine ≠ ADMS cloud link</p>
            <p className="text-amber-900/80 dark:text-amber-100/80">
              {admsHint ??
                "If the ADMS log below stays empty, Feezo is not receiving any HTTP from the machine. Set Cloud Server Address to api.feezo.app and Port to 80, then reboot the device."}
            </p>
            <p className="font-mono text-[11px] text-amber-800/90 dark:text-amber-200/80">
              Required: ADMS → api.feezo.app : 80 → /iclock/cdata &amp; /iclock/getrequest
              {primaryDevice?.lastHeartbeat
                ? ` · last heartbeat ${formatTime(primaryDevice.lastHeartbeat)} · Online = seen in last 5 min`
                : " · never received a heartbeat"}
            </p>
          </div>
        </div>
      ) : null}

      <div className={cn(glassCardClass, "space-y-3 p-4")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[#0F766E]" />
            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-zinc-50">
              ADMS connection log
            </h2>
            <span className="text-[11px] text-slate-500">
              {admsLogs.length === 0
                ? "No hits yet — machine has not reached the server"
                : `${admsLogs.length} recent request${admsLogs.length === 1 ? "" : "s"}`}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={admsBusy}
              onClick={() => void loadAdmsLogs()}
            >
              {admsBusy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              Reload log
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => {
                void (async () => {
                  try {
                    await apiBiometricAdmsProbe(
                      "Dashboard probe — logging pipeline OK",
                      primaryDevice?.serialNumber,
                    );
                    toast.success("Probe written — if you see it below, logging works");
                    await loadAdmsLogs();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Probe failed");
                  }
                })();
              }}
            >
              Test log write
            </Button>
          </div>
        </div>

        {admsLogs.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-3 py-4 text-[13px] text-slate-600 dark:bg-white/5 dark:text-zinc-300">
            <p className="font-medium text-slate-800 dark:text-zinc-100">Waiting for device HTTP…</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-[12px]">
              <li>
                On the eSSL menu set <strong>Server Address = api.feezo.app</strong> (not feezo.app)
              </li>
              <li>
                Set <strong>Server Port = 80</strong> (Hostinger cannot open 4370)
              </li>
              <li>Reboot the machine, then watch this panel — handshake / getrequest rows should appear</li>
              <li>
                Click <strong>Test log write</strong> above: if a row appears, Feezo logging is fine and the
                problem is device → cloud routing
              </li>
            </ol>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-100 dark:border-white/10">
            <table className="w-full min-w-[720px] text-left text-[12px]">
              <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-zinc-900">
                <tr>
                  <th className="px-2 py-1.5 font-semibold">Time</th>
                  <th className="px-2 py-1.5 font-semibold">Endpoint</th>
                  <th className="px-2 py-1.5 font-semibold">SN / IP</th>
                  <th className="px-2 py-1.5 font-semibold">Note</th>
                  <th className="px-2 py-1.5 font-semibold">Response</th>
                </tr>
              </thead>
              <tbody>
                {admsLogs.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "cursor-pointer border-t border-slate-50 dark:border-white/5",
                      row.level === "error" && "bg-red-50/60 dark:bg-red-500/10",
                      expandedLogId === row.id && "bg-slate-50 dark:bg-white/5",
                    )}
                    onClick={() =>
                      setExpandedLogId((id) => (id === row.id ? null : row.id))
                    }
                  >
                    <td className="px-2 py-1.5 align-top tabular-nums text-slate-600 dark:text-zinc-300">
                      {formatTime(row.createdAt)}
                    </td>
                    <td className="px-2 py-1.5 align-top font-mono text-[11px]">
                      {row.method} /{row.endpoint}
                      {row.table ? `?table=${row.table}` : ""}
                    </td>
                    <td className="px-2 py-1.5 align-top">
                      <div className="font-mono text-[11px]">{row.deviceSn || "—"}</div>
                      <div className="text-[10px] text-slate-400">{row.clientIp || ""}</div>
                    </td>
                    <td className="max-w-[220px] truncate px-2 py-1.5 align-top text-slate-700 dark:text-zinc-200">
                      {row.note || "—"}
                    </td>
                    <td className="max-w-[160px] truncate px-2 py-1.5 align-top font-mono text-[11px] text-slate-500">
                      {row.responseBody || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expandedLogId !== null
              ? (() => {
                  const row = admsLogs.find((l) => l.id === expandedLogId);
                  if (!row) return null;
                  return (
                    <div className="border-t border-slate-100 bg-slate-50/80 p-3 font-mono text-[11px] dark:border-white/10 dark:bg-black/20">
                      <div className="text-slate-500">query</div>
                      <pre className="whitespace-pre-wrap break-all text-slate-800 dark:text-zinc-200">
                        {row.queryString || "(none)"}
                      </pre>
                      <div className="mt-2 text-slate-500">request body</div>
                      <pre className="whitespace-pre-wrap break-all text-slate-800 dark:text-zinc-200">
                        {row.requestBody || "(empty)"}
                      </pre>
                      <div className="mt-2 text-slate-500">response</div>
                      <pre className="whitespace-pre-wrap break-all text-slate-800 dark:text-zinc-200">
                        {row.responseBody || "(none)"}
                      </pre>
                    </div>
                  );
                })()
              : null}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Live feed */}
        <div className={cn(glassCardClass, "space-y-3 p-4 lg:col-span-2")}>
          <div className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-[#0F766E]" />
            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-zinc-50">
              Live punch feed
            </h2>
          </div>
          {liveFeed.length === 0 ? (
            <div className="space-y-3">
              <p className="text-[13px] text-slate-500 dark:text-zinc-400">
                Waiting for punches… Scans show only after the machine posts{" "}
                <span className="font-mono text-[11px]">ATTLOG</span>. If the device is Online but this
                feed is empty, queue a pull and wait ~1 minute (do not open getrequest in Chrome).
              </p>
              {primaryDevice ? (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full bg-[#0F766E] text-white hover:bg-[#0d665f]"
                  onClick={() => void handleCommand(primaryDevice.serialNumber, "PULL_LOGS")}
                >
                  Sync time + pull punches
                </Button>
              ) : null}
            </div>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {liveFeed.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-slate-900 dark:text-zinc-50">
                        {p.entityName || `PIN ${p.biometricPin}`}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {p.punchStateLabel} · {p.verifyTypeLabel}
                      </div>
                    </div>
                    <div className="shrink-0 text-[11px] tabular-nums text-slate-500">
                      {formatTime(p.punchTime)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Devices + PIN map */}
        <div className={cn(glassCardClass, "space-y-3 p-4 lg:col-span-3")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-zinc-50">
              Devices & PIN maps
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setMapOpen(true)}
            >
              Map PIN
            </Button>
          </div>
          {devices.length === 0 ? (
            <p className="text-[13px] text-slate-500">
              Register your eSSL serial number to claim the device for this school.
            </p>
          ) : (
            <div className="space-y-2">
              {devices.map((d) => (
                <div
                  key={d.serialNumber}
                  className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5"
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      d.online ? "bg-emerald-500" : "bg-slate-300",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-slate-900 dark:text-zinc-50">
                      {d.deviceName || d.serialNumber}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {d.serialNumber}
                      {d.lastHeartbeat ? ` · last seen ${formatTime(d.lastHeartbeat)}` : ""}
                    </div>
                  </div>
                  <Select
                    key={`${d.serialNumber}-${cmdReset}`}
                    onValueChange={(v) => {
                      void handleCommand(d.serialNumber, v).then(() =>
                        setCmdReset((n) => n + 1),
                      );
                    }}
                  >
                    <SelectTrigger className="h-8 w-[140px] rounded-full text-[12px]">
                      <SelectValue placeholder="Command" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PULL_LOGS">Sync time + pull punches</SelectItem>
                      <SelectItem value="SYNC_TIME">Sync time only</SelectItem>
                      <SelectItem value="CHECK">Check</SelectItem>
                      <SelectItem value="CLEAR_LOG">Clear log</SelectItem>
                      <SelectItem value="REBOOT">Reboot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {maps.length > 0 ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-1 font-medium">PIN</th>
                    <th className="pb-1 font-medium">Person</th>
                    <th className="pb-1 font-medium">Type</th>
                    <th className="pb-1" />
                  </tr>
                </thead>
                <tbody>
                  {maps.map((m) => (
                    <tr key={m.id} className="border-t border-slate-100 dark:border-white/5">
                      <td className="py-1.5 font-mono">{m.biometricPin}</td>
                      <td className="py-1.5">{m.entityName}</td>
                      <td className="py-1.5 capitalize">{m.entityType}</td>
                      <td className="py-1.5 text-right">
                        <button
                          type="button"
                          className="text-slate-400 hover:text-red-600"
                          onClick={() => void handleDeleteMap(m.biometricPin)}
                          aria-label="Remove mapping"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>

      {/* Punch logs table */}
      <div className={cn(glassCardClass, "space-y-3 p-4")}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-[11px]">From</Label>
            <DatePicker value={from} onChange={setFrom} valueFormat="iso" className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">To</Label>
            <DatePicker value={to} onChange={setTo} valueFormat="iso" className="rounded-xl" />
          </div>
          <div className="min-w-[160px] flex-1 space-y-1">
            <Label className="text-[11px]">Search PIN / name</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="rounded-xl pl-8"
                placeholder="PIN or name"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Punch</Label>
            <Select
              value={punchState}
              onValueChange={(v) => {
                setPage(1);
                setPunchState(v);
              }}
            >
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="0">Check-In</SelectItem>
                <SelectItem value="1">Check-Out</SelectItem>
                <SelectItem value="2">Break-Out</SelectItem>
                <SelectItem value="3">Break-In</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={logsBusy || logs.length === 0}
            onClick={exportCsv}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>

        {logsBusy ? (
          <div className="flex items-center gap-2 py-8 text-[13px] text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading logs…
          </div>
        ) : logs.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-slate-500">No punches in this range.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500 dark:border-white/10">
                  <th className="px-2 py-2 font-semibold">Time</th>
                  <th className="px-2 py-2 font-semibold">PIN</th>
                  <th className="px-2 py-2 font-semibold">Name</th>
                  <th className="px-2 py-2 font-semibold">State</th>
                  <th className="px-2 py-2 font-semibold">Verify</th>
                  <th className="px-2 py-2 font-semibold">Device</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-50 dark:border-white/5"
                  >
                    <td className="px-2 py-2 tabular-nums text-slate-700 dark:text-zinc-200">
                      {formatTime(p.punchTime)}
                    </td>
                    <td className="px-2 py-2 font-mono text-[12px]">{p.biometricPin}</td>
                    <td className="px-2 py-2">{p.entityName || "—"}</td>
                    <td className="px-2 py-2">{p.punchStateLabel}</td>
                    <td className="px-2 py-2">{p.verifyTypeLabel}</td>
                    <td className="px-2 py-2 text-[12px] text-slate-500">{p.deviceSn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between text-[12px] text-slate-500">
          <span>
            {total} punch{total === 1 ? "" : "es"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <span>
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Register dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register biometric device</DialogTitle>
            <DialogDescription>
              Enter the Serial Number from the eSSL device menu. Point ADMS at{" "}
              <span className="font-medium">api.feezo.app</span> port{" "}
              <span className="font-medium">80</span> (or 4370 via a VPS proxy).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Serial number (SN)</Label>
              <Input
                value={regSn}
                onChange={(e) => setRegSn(e.target.value)}
                className="rounded-xl font-mono uppercase"
                placeholder="e.g. AJD123456789"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Display name (optional)</Label>
              <Input
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="rounded-xl"
                placeholder="Main gate"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
              disabled={regBusy}
              onClick={() => void handleRegister()}
            >
              {regBusy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIN map dialog */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Map device PIN</DialogTitle>
            <DialogDescription>
              Link the numeric user ID on the biometric machine to a student or staff member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Biometric PIN</Label>
              <Input
                value={mapPin}
                onChange={(e) => setMapPin(e.target.value)}
                className="rounded-xl font-mono"
                placeholder="e.g. 1001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={mapType}
                onValueChange={(v) => {
                  setMapType(v === "staff" ? "staff" : "student");
                  setMapEntityId("");
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Person</Label>
              <Select value={mapEntityId || undefined} onValueChange={setMapEntityId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {entityOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              className="rounded-full bg-[#0F766E] text-white hover:bg-[#0D9488]"
              disabled={mapBusy}
              onClick={() => void handleMapBind()}
            >
              {mapBusy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Save mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
