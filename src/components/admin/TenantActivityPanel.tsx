import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Download,
  Globe,
  KeyRound,
  Laptop,
  Loader2,
  LogIn,
  LogOut,
  Monitor,
  Power,
  RotateCw,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Tablet,
  TimerOff,
  Users,
  Wifi,
  X,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  fetchSuperAdminTenantActivity,
  type TenantActivity,
  type TenantActivityEvent,
  type TenantActivityEventFilter,
  type TenantActivitySession,
  type TenantSessionStatus,
} from "@/lib/api/super-admin";
import { ApiError } from "@/lib/api/client";
import { formatEventDateTime, formatInAppZone, parseAppInstant } from "@/lib/dates";
import { saveFile } from "@/lib/native-download";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type RangeOption = { days: number; label: string };

const RANGES: RangeOption[] = [
  { days: 0, label: "Today" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

const EVENT_FILTERS: { value: TenantActivityEventFilter; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "logins", label: "Logins" },
  { value: "logouts", label: "Logouts" },
  { value: "failed", label: "Failed attempts" },
  { value: "expired", label: "Expired sessions" },
  { value: "support", label: "Support access" },
  { value: "security", label: "Security" },
];

const STATUS_META: Record<TenantSessionStatus, { label: string; cls: string; dot: string }> = {
  active: { label: "Online", cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  idle: { label: "Signed in", cls: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
  logged_out: { label: "Logged out", cls: "bg-zinc-100 text-zinc-700", dot: "bg-zinc-400" },
  expired: { label: "Expired", cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  replaced: { label: "Re-login", cls: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-400" },
  revoked: { label: "Revoked", cls: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
};

type EventTone = "success" | "info" | "warning" | "error" | "support";

const EVENT_META: Record<string, { label: string; tone: EventTone; Icon: typeof LogIn }> = {
  login_success: { label: "Signed in", tone: "success", Icon: LogIn },
  login_failed: { label: "Failed sign-in", tone: "error", Icon: ShieldAlert },
  logout: { label: "Signed out", tone: "info", Icon: LogOut },
  logout_all_devices: { label: "Signed out of all devices", tone: "warning", Icon: LogOut },
  session_expired: { label: "Session expired", tone: "warning", Icon: TimerOff },
  password_reset: { label: "Password reset", tone: "warning", Icon: KeyRound },
  impersonation_start: { label: "Support access started", tone: "support", Icon: ShieldCheck },
  impersonation_end: { label: "Support access ended", tone: "support", Icon: ShieldCheck },
  tenant_deactivated: { label: "Workspace deactivated", tone: "error", Icon: Ban },
  tenant_activated: { label: "Workspace reactivated", tone: "success", Icon: Power },
};

const TONE_CLS: Record<EventTone, string> = {
  success: "bg-emerald-50 text-emerald-600",
  info: "bg-sky-50 text-sky-600",
  warning: "bg-amber-50 text-amber-600",
  error: "bg-rose-50 text-rose-600",
  support: "bg-violet-50 text-violet-600",
};

const FAIL_REASON: Record<string, string> = {
  wrong_password: "Wrong password",
  user_inactive: "User is deactivated",
  tenant_suspended: "School is suspended",
};

const SESSIONS_PER_PAGE = 25;
const ALL_USERS = "__all__";

function formatMinutes(total: number): string {
  if (!total || total < 1) return "<1m";
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  if (h === 0) return `${m}m`;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function formatAgo(iso: string | null): string {
  const date = parseAppInstant(iso);
  if (!date) return "Never";
  const diff = Math.max(0, Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} d ago`;
  return formatEventDateTime(iso);
}

function dayLabel(date: string): string {
  const d = parseAppInstant(`${date} 12:00:00`);
  return d ? formatInAppZone(d, { day: "numeric", month: "short" }) : date;
}

function eventDetail(e: TenantActivityEvent): string {
  const meta = e.meta ?? {};
  if (e.event === "login_failed") {
    return FAIL_REASON[String(meta.reason ?? "")] ?? "Sign-in rejected";
  }
  if (e.event === "logout_all_devices") {
    const n = Number(meta.revoked ?? 0);
    return n > 0 ? `${n} other device${n === 1 ? "" : "s"} signed out` : "All devices";
  }
  if (e.event === "logout" && meta.remoteDevice) {
    return `Remote device signed out: ${String(meta.remoteDevice)}`;
  }
  if (e.event === "impersonation_start" || e.event === "impersonation_end") {
    const ticket = String(meta.ticket ?? "");
    const secs = Number(meta.durationSeconds ?? 0);
    const parts = [ticket ? `Ticket ${ticket}` : "Super admin console"];
    if (secs > 0) parts.push(`${formatMinutes(Math.round(secs / 60))} inside`);
    return parts.join(" · ");
  }
  if (e.event === "session_expired") return "Inactive past the idle limit";
  if (e.event === "tenant_deactivated") {
    const n = Number(meta.revoked ?? 0);
    const parts = [meta.reason ? String(meta.reason) : "No reason given"];
    if (n > 0) parts.push(`${n} session${n === 1 ? "" : "s"} signed out`);
    return parts.join(" · ");
  }
  if (e.event === "tenant_activated") {
    return [`Restored as ${String(meta.status ?? "Active")}`, meta.note ? String(meta.note) : ""]
      .filter(Boolean)
      .join(" · ");
  }
  if (e.event === "login_success" && meta.source === "session") return "From session history";
  return "";
}

function deviceLabel(s: { device: string; browser: string; os: string }): string {
  if (s.device) return s.device;
  const parts = [s.browser, s.os].filter((p) => p && p !== "Unknown");
  return parts.length ? parts.join(" on ") : "Unknown device";
}

function DeviceIcon({ type, client }: { type: string; client: "app" | "web" }) {
  const kind = type.toLowerCase();
  const Icon =
    client === "app" || kind === "mobile" ? Smartphone : kind === "tablet" ? Tablet : Laptop;
  return <Icon className="h-3.5 w-3.5" />;
}

function csvCell(v: unknown): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

export function TenantActivityPanel({
  tenantId,
  tenantSlug,
  defaultDays = 30,
  variant = "compact",
  onOpenFull,
}: {
  tenantId: string;
  tenantSlug: string;
  defaultDays?: number;
  variant?: "compact" | "full";
  onOpenFull?: () => void;
}) {
  const [days, setDays] = useState(defaultDays);
  const [user, setUser] = useState<string>(ALL_USERS);
  const [eventFilter, setEventFilter] = useState<TenantActivityEventFilter>("all");
  const [section, setSection] = useState<"sessions" | "people" | "timeline">("sessions");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<TenantActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setDays(defaultDays);
    setUser(ALL_USERS);
    setEventFilter("all");
    setPage(0);
  }, [tenantId, defaultDays]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSuperAdminTenantActivity(tenantId, {
      days,
      user: user === ALL_USERS ? undefined : user,
      event: eventFilter,
      limit: variant === "full" ? 1000 : 300,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not load activity");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, days, user, eventFilter, variant, tick]);

  useEffect(() => setPage(0), [days, user, eventFilter]);

  const userOptions = useMemo(() => {
    const list = data?.users ?? [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [data?.users]);

  const selectedUser = user === ALL_USERS ? null : (userOptions.find((u) => u.id === user) ?? null);
  const sessions = data?.sessions ?? [];
  const pageCount = Math.max(1, Math.ceil(sessions.length / SESSIONS_PER_PAGE));
  const pagedSessions = sessions.slice(page * SESSIONS_PER_PAGE, (page + 1) * SESSIONS_PER_PAGE);
  const chartData = useMemo(
    () =>
      (data?.daily ?? []).map((d) => ({
        ...d,
        label: dayLabel(d.date),
        hours: +(d.minutes / 60).toFixed(1),
      })),
    [data?.daily],
  );
  const hasChartData = chartData.some((d) => d.logins > 0 || d.activeUsers > 0);

  const exportCsv = () => {
    if (!data) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const lines: string[] = [];
    if (section === "timeline") {
      lines.push(
        ["time", "event", "user", "email", "detail", "device", "ip"].map(csvCell).join(","),
      );
      for (const e of data.events) {
        lines.push(
          [
            e.at,
            EVENT_META[e.event]?.label ?? e.event,
            e.user,
            e.email,
            eventDetail(e),
            deviceLabel(e),
            e.ip,
          ]
            .map(csvCell)
            .join(","),
        );
      }
    } else if (section === "people") {
      lines.push(
        [
          "name",
          "email",
          "role",
          "logins_in_range",
          "total_logins",
          "usage_minutes",
          "devices",
          "failed",
          "last_login",
          "last_seen",
        ]
          .map(csvCell)
          .join(","),
      );
      for (const u of data.users) {
        lines.push(
          [
            u.name,
            u.email,
            u.role,
            u.logins,
            u.totalLogins,
            u.usageMinutes,
            u.devices,
            u.failed,
            u.lastLoginAt,
            u.lastSeenAt,
          ]
            .map(csvCell)
            .join(","),
        );
      }
    } else {
      lines.push(
        [
          "user",
          "email",
          "status",
          "login_at",
          "last_active_at",
          "logout_at",
          "duration_minutes",
          "device",
          "browser",
          "os",
          "client",
          "ip",
        ]
          .map(csvCell)
          .join(","),
      );
      for (const s of data.sessions) {
        lines.push(
          [
            s.user,
            s.email,
            STATUS_META[s.status]?.label ?? s.status,
            s.loginAt,
            s.lastActiveAt,
            s.logoutAt,
            s.durationMinutes,
            s.device,
            s.browser,
            s.os,
            s.client,
            s.ip,
          ]
            .map(csvCell)
            .join(","),
        );
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    void saveFile(blob, `activity-${section}-${tenantSlug}-${stamp}.csv`);
    toast.success("Activity exported", { description: `${lines.length - 1} rows · CSV` });
  };

  const s = data?.summary;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-[#E5E5E5] bg-[#F4F4F5] p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              className={cn(
                "rounded-full px-3 py-1 text-[11.5px] font-semibold transition",
                days === r.days
                  ? "bg-black text-white shadow-sm"
                  : "text-black/60 hover:text-black",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={user} onValueChange={setUser}>
            <SelectTrigger className="h-8 w-[170px] rounded-full border-[#E5E5E5] bg-white text-[12px]">
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_USERS}>All users</SelectItem>
              {userOptions.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(variant === "full" || section === "timeline") && (
            <Select
              value={eventFilter}
              onValueChange={(v) => setEventFilter(v as TenantActivityEventFilter)}
            >
              <SelectTrigger className="h-8 w-[150px] rounded-full border-[#E5E5E5] bg-white text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <button
            type="button"
            onClick={() => setTick((n) => n + 1)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 text-[11.5px] font-semibold text-black/75 transition hover:border-black/30"
            title="Reload"
          >
            <RotateCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!data}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-black px-3 text-[11.5px] font-semibold text-white transition hover:bg-black/85 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          {onOpenFull && (
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-full text-[11.5px]"
              onClick={onOpenFull}
            >
              <ScrollText className="h-3.5 w-3.5" /> Full audit
            </Button>
          )}
        </div>
      </div>

      {selectedUser && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-[12px] text-sky-900">
          <span>
            Showing activity for <strong>{selectedUser.name}</strong>
            {selectedUser.email ? ` · ${selectedUser.email}` : ""}
          </span>
          <button
            type="button"
            onClick={() => setUser(ALL_USERS)}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold hover:bg-sky-100"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-8 text-center">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
          <p className="text-[13px] text-rose-800">{error}</p>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setTick((n) => n + 1)}
          >
            <RotateCw className="h-3.5 w-3.5" /> Try again
          </Button>
        </div>
      ) : !data ? (
        <div className="grid place-items-center rounded-2xl border border-[#E5E5E5] bg-white py-16 text-[12.5px] text-black/50">
          <Loader2 className="mb-2 h-5 w-5 animate-spin" />
          Loading activity…
        </div>
      ) : (
        <div className={cn("flex flex-col gap-3 transition-opacity", loading && "opacity-60")}>
          {!data.tracking.events && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
              Detailed login tracking isn't installed on the server yet. Showing session history
              only. Run <code className="font-mono">schema_auth_activity.sql</code> to record
              logouts and failed attempts.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Kpi
              icon={<LogIn className="h-3.5 w-3.5" />}
              label="Logins"
              value={s?.totalLogins ?? 0}
            />
            <Kpi
              icon={<Users className="h-3.5 w-3.5" />}
              label="Active users"
              value={s?.uniqueUsers ?? 0}
              hint={`${s?.activeDays ?? 0} active days`}
            />
            <Kpi
              icon={<Wifi className="h-3.5 w-3.5" />}
              label="Online now"
              value={s?.activeNow ?? 0}
              tone={s && s.activeNow > 0 ? "good" : undefined}
              hint={`Last seen ${formatAgo(s?.lastSeenAt ?? null)}`}
            />
            <Kpi
              icon={<Clock className="h-3.5 w-3.5" />}
              label="Usage time"
              value={formatMinutes(s?.totalUsageMinutes ?? 0)}
            />
            <Kpi
              icon={<Activity className="h-3.5 w-3.5" />}
              label="Avg session"
              value={formatMinutes(s?.avgSessionMinutes ?? 0)}
            />
            <Kpi
              icon={<ShieldAlert className="h-3.5 w-3.5" />}
              label="Failed attempts"
              value={s?.failedLogins ?? 0}
              tone={s && s.failedLogins > 0 ? "bad" : undefined}
            />
          </div>

          {days !== 0 && (
            <div className="rounded-2xl border border-[#E5E5E5] bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[12px] font-semibold text-black">Daily usage</div>
                <div className="flex items-center gap-3 text-[10.5px] text-black/55">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-[#0F766E]" /> Logins
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-0.5 w-3 rounded bg-[#6366F1]" /> Active users
                  </span>
                </div>
              </div>
              {hasChartData ? (
                <div className="h-[170px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "#71717A" }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={16}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: "#71717A" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(15,118,110,0.06)" }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #E5E5E5",
                          fontSize: 12,
                        }}
                        formatter={(value: number, name: string) => [value, name]}
                      />
                      <Bar
                        dataKey="logins"
                        name="Logins"
                        fill="#0F766E"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={22}
                      />
                      <Line
                        type="monotone"
                        dataKey="activeUsers"
                        name="Active users"
                        stroke="#6366F1"
                        strokeWidth={2}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="grid h-[120px] place-items-center text-[12px] text-black/45">
                  No sign-ins in this period.
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-1 border-b border-[#E5E5E5]">
            {(
              [
                ["sessions", `Sessions (${sessions.length})`],
                ["people", `People (${data.users.length})`],
                ["timeline", `Timeline (${data.totalEvents})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSection(key)}
                className={cn(
                  "-mb-px border-b-2 px-3 py-2 text-[12px] font-semibold transition",
                  section === key
                    ? "border-black text-black"
                    : "border-transparent text-black/50 hover:text-black",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {section === "sessions" && (
            <SessionsList
              sessions={pagedSessions}
              total={sessions.length}
              page={page}
              pageCount={pageCount}
              onPage={setPage}
              onUser={(id) => id && setUser(id)}
            />
          )}
          {section === "people" && (
            <PeopleTable
              users={data.users}
              onSelect={(id) => {
                setUser(id);
                setSection("sessions");
              }}
            />
          )}
          {section === "timeline" && <Timeline events={data.events} total={data.totalEvents} />}
        </div>
      )}
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-black/45">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-[20px] font-semibold leading-none tabular-nums text-black",
          tone === "good" && "text-emerald-600",
          tone === "bad" && "text-rose-600",
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-1 truncate text-[10.5px] text-black/45">{hint}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: TenantSessionStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.revoked;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
        meta.cls,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", meta.dot, status === "active" && "animate-pulse")}
      />
      {meta.label}
    </span>
  );
}

function SessionsList({
  sessions,
  total,
  page,
  pageCount,
  onPage,
  onUser,
}: {
  sessions: TenantActivitySession[];
  total: number;
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
  onUser: (id: string | null) => void;
}) {
  if (total === 0) {
    return <EmptyState text="No sessions in this period." />;
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="divide-y divide-[#F0F0F0] rounded-2xl border border-[#E5E5E5] bg-white">
        {sessions.map((s) => (
          <div key={s.id} className="grid grid-cols-12 items-center gap-2 px-3.5 py-3">
            <div className="col-span-12 min-w-0 sm:col-span-4">
              <button
                type="button"
                onClick={() => onUser(s.userId)}
                className="truncate text-left text-[13px] font-semibold text-black hover:underline"
              >
                {s.user}
              </button>
              <div className="truncate text-[11px] text-black/50">{s.email || s.role}</div>
            </div>
            <div className="col-span-7 min-w-0 sm:col-span-4">
              <div className="flex items-center gap-1.5 truncate text-[12px] text-black/75">
                <DeviceIcon type={s.deviceType} client={s.client} />
                <span className="truncate">{deviceLabel(s)}</span>
                {s.client === "app" && (
                  <span className="rounded-full bg-teal-50 px-1.5 text-[9.5px] font-semibold uppercase text-teal-700">
                    App
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1 truncate font-mono text-[10.5px] text-black/45">
                <Globe className="h-3 w-3 shrink-0" />
                {s.ip || "—"}
                {s.browser && s.browser !== "Unknown" ? ` · ${s.browser}` : ""}
              </div>
            </div>
            <div className="col-span-5 text-right sm:col-span-4">
              <StatusBadge status={s.status} />
              <div className="mt-1 text-[11px] text-black/60">
                <span title="Signed in">{formatEventDateTime(s.loginAt)}</span>
              </div>
              <div className="text-[10.5px] text-black/45">
                {s.status === "active" || s.status === "idle"
                  ? `Active ${formatAgo(s.lastActiveAt)}`
                  : s.logoutAt
                    ? `Ended ${formatEventDateTime(s.logoutAt)}`
                    : `Last active ${formatAgo(s.lastActiveAt)}`}
                {" · "}
                {formatMinutes(s.durationMinutes)}
              </div>
            </div>
          </div>
        ))}
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-between text-[11.5px] text-black/55">
          <span>
            {page * SESSIONS_PER_PAGE + 1}–{Math.min(total, (page + 1) * SESSIONS_PER_PAGE)} of{" "}
            {total}
          </span>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              className="h-7 rounded-full px-3 text-[11px]"
              disabled={page === 0}
              onClick={() => onPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-7 rounded-full px-3 text-[11px]"
              disabled={page >= pageCount - 1}
              onClick={() => onPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function PeopleTable({
  users,
  onSelect,
}: {
  users: TenantActivity["users"];
  onSelect: (id: string) => void;
}) {
  if (users.length === 0) return <EmptyState text="No user accounts for this school yet." />;
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E5E5E5] bg-white">
      <table className="w-full min-w-[640px] text-left text-[12px]">
        <thead className="bg-[#FAFAFA] text-[10.5px] uppercase tracking-wider text-black/45">
          <tr>
            <th className="px-3.5 py-2 font-semibold">User</th>
            <th className="px-3 py-2 text-right font-semibold">Logins</th>
            <th className="px-3 py-2 text-right font-semibold">Usage</th>
            <th className="px-3 py-2 text-right font-semibold">Devices</th>
            <th className="px-3 py-2 text-right font-semibold">Failed</th>
            <th className="px-3.5 py-2 text-right font-semibold">Last seen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0F0F0]">
          {users.map((u) => (
            <tr
              key={u.id}
              onClick={() => onSelect(u.id)}
              className="cursor-pointer transition hover:bg-[#FAFAFA]"
            >
              <td className="px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      u.online ? "bg-emerald-500" : "bg-zinc-300",
                    )}
                  />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-black">
                      {u.name}
                      {!u.active && (
                        <span className="ml-1.5 rounded-full bg-zinc-100 px-1.5 text-[9.5px] font-semibold uppercase text-zinc-600">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="truncate text-[11px] text-black/50">
                      {u.email} · {u.role === "school_admin" ? "School admin" : "Staff"}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                <span className="font-semibold text-black">{u.logins}</span>
                <span className="text-black/40"> / {u.totalLogins}</span>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {formatMinutes(u.usageMinutes)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <Monitor className="h-3 w-3 text-black/40" />
                  {u.devices}
                </span>
              </td>
              <td
                className={cn(
                  "px-3 py-2.5 text-right tabular-nums",
                  u.failed > 0 && "font-semibold text-rose-600",
                )}
              >
                {u.failed}
              </td>
              <td className="px-3.5 py-2.5 text-right">
                <div className="text-black/75">
                  {u.lastSeenAt ? formatAgo(u.lastSeenAt) : "Never signed in"}
                </div>
                {u.lastLoginAt && (
                  <div className="text-[10.5px] text-black/40">
                    Login {formatEventDateTime(u.lastLoginAt)}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Timeline({ events, total }: { events: TenantActivityEvent[]; total: number }) {
  if (events.length === 0) return <EmptyState text="No events match the current filters." />;
  return (
    <div className="flex flex-col gap-2">
      <ul className="space-y-2">
        {events.map((e) => {
          const meta = EVENT_META[e.event] ?? {
            label: e.event,
            tone: "info" as const,
            Icon: CheckCircle2,
          };
          const detail = eventDetail(e);
          return (
            <li key={e.id} className="rounded-2xl border border-[#E5E5E5] bg-white px-3.5 py-3">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    TONE_CLS[meta.tone],
                  )}
                >
                  <meta.Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="text-[13px] font-semibold leading-tight text-black">
                      {meta.label}
                      <span className="font-normal text-black/55">
                        {" "}
                        · {e.user || e.email || "Unknown"}
                      </span>
                    </div>
                    <div className="font-mono text-[10.5px] text-black/45">
                      {formatEventDateTime(e.at)}
                    </div>
                  </div>
                  {detail && <div className="mt-1 text-[12px] text-black/65">{detail}</div>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-[10.5px] text-black/55">
                    {(e.device || e.browser) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F4F5] px-2 py-0.5">
                        <DeviceIcon type="" client={e.client} />
                        {deviceLabel(e)}
                      </span>
                    )}
                    {e.ip && <span className="rounded-full bg-[#F4F4F5] px-2 py-0.5">{e.ip}</span>}
                    {e.email && e.email !== e.user && (
                      <span className="rounded-full bg-[#F4F4F5] px-2 py-0.5">{e.email}</span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {total > events.length && (
        <p className="text-center text-[11px] text-black/45">
          Showing latest {events.length} of {total} events. Narrow the range or filters to see older
          entries.
        </p>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#E5E5E5] bg-white px-4 py-10 text-center text-[12.5px] text-black/45">
      {text}
    </div>
  );
}
