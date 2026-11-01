import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/ui/info-tip";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiSaveOrgTimezone } from "@/lib/api/settings";
import { useAuth } from "@/lib/auth";
import { BASE_TIMEZONE_TIP } from "@/lib/help/settings-tips";
import {
  TIMEZONES,
  timezonePickerLabel,
  useOrgTimezone,
  type TimezoneCode,
} from "@/lib/locale/timezones";

/** Settings → System: organization base timezone (Backup schedule wall clock). */
export function OrgTimezoneCard() {
  const { session } = useAuth();
  const timezone = useOrgTimezone();
  const [draft, setDraft] = useState<TimezoneCode>(timezone);
  const [saving, setSaving] = useState(false);
  const canEdit = session?.role === "school_admin";
  const dirty = draft !== timezone;

  useEffect(() => {
    setDraft(timezone);
  }, [timezone]);

  const save = async () => {
    setSaving(true);
    try {
      const saved = await apiSaveOrgTimezone(draft);
      const opt = TIMEZONES.find((t) => t.code === saved);
      toast.success(`Base timezone set to ${opt?.label ?? saved}`, {
        description: "Backup schedules and timed jobs use this zone.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save base timezone");
      setDraft(timezone);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="col-span-12 sm:col-span-6 lg:col-span-4">
      <Label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
        Base timezone
        <InfoTip content={BASE_TIMEZONE_TIP} className="-my-1" />
      </Label>
      <div className="mt-1.5 flex items-center gap-2">
        <Select
          value={draft}
          onValueChange={(v) => setDraft(v as TimezoneCode)}
          disabled={!canEdit || saving}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((t) => (
              <SelectItem key={t.code} value={t.code}>
                {timezonePickerLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canEdit && dirty ? (
          <Button type="button" size="sm" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        ) : null}
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-black/45 dark:text-zinc-400">
        Backup schedule times use this zone (not the browser clock).
        {!canEdit ? " Admin only." : ""}
      </p>
    </div>
  );
}
